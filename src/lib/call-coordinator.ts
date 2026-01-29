/**
 * Call Coordinator - State Machine for Live Emergency Paging
 *
 * Handles the complete lifecycle of an emergency call:
 * 1. Recording audio from microphone
 * 2. Validating audio (threshold + sustain)
 * 3. Activating paging device (optional)
 * 4. Buffering for playback delay
 * 5. Live playback via MediaSource API
 * 6. Silence detection with resettable timer
 * 7. Clean shutdown and save to Firebase
 */

export enum CallState {
  Idle = 'Idle',
  Recording = 'Recording',              // Recording started, accumulating chunks
  Validating = 'Validating',            // Checking threshold + sustain
  PagingActivating = 'PagingActivating', // Setting paging zone 1 (if device exists)
  BufferingForDelay = 'BufferingForDelay', // Waiting for playbackDelay worth of buffer
  Playing = 'Playing',                   // MediaSource playing, recording continues
  SilenceWait = 'SilenceWait',          // Silent, counting down disableDelay
  Draining = 'Draining',                // Recording stopped, playback catching up
  Saving = 'Saving'                     // Upload to Firebase
}

export interface CallConfig {
  // Audio validation
  audioThreshold: number;      // 0-100
  sustainDuration: number;     // milliseconds

  // Playback
  playbackEnabled: boolean;    // Enable live playback
  playbackDelay: number;       // milliseconds - buffer before playing
  disableDelay: number;        // milliseconds - silence before stopping

  // Paging (optional) - pass null if no paging device
  pagingDevice: { id: string; name: string; ip: string } | null;
  setPagingZone?: (zone: number) => Promise<void>;
  waitForPagingZoneReady?: (zone: number) => Promise<boolean>;

  // Callbacks
  onStateChange?: (state: CallState) => void;
  onError?: (error: Error) => void;
  onLog?: (entry: { type: string; message: string; audioLevel?: number }) => void;
  onUpload?: (blob: Blob, mimeType: string) => Promise<string>; // Returns download URL
}

export interface CallMetrics {
  recordingStartTime: number;
  audioDetectedTime?: number;
  playbackStartTime?: number;
  recordingEndTime?: number;
  totalDuration: number;
  bufferedDuration: number;
  chunksRecorded: number;
  chunksDiscarded: number;
}

/**
 * Main Call Coordinator
 * Orchestrates the entire call lifecycle with clean state transitions
 */
export class CallCoordinator {
  private state: CallState = CallState.Idle;
  private config: Required<CallConfig>;
  private metrics: CallMetrics;

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartIndex: number = 0;

  // MediaSource playback
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private audio: HTMLAudioElement | null = null;
  private chunkQueue: Blob[] = [];
  private isAppending: boolean = false;

  // Timing
  private silenceDeadline: number = 0;
  private sustainStartTime: number = 0;
  private lastAudioTime: number = 0;

  // State
  private aborted: boolean = false;

  constructor(config: CallConfig) {
    this.config = {
      audioThreshold: config.audioThreshold,
      sustainDuration: config.sustainDuration,
      playbackEnabled: config.playbackEnabled,
      playbackDelay: config.playbackDelay,
      disableDelay: config.disableDelay,
      pagingDevice: config.pagingDevice ?? null,
      setPagingZone: config.setPagingZone ?? (async () => {}),
      waitForPagingZoneReady: config.waitForPagingZoneReady ?? (async () => true),
      onStateChange: config.onStateChange ?? (() => {}),
      onError: config.onError ?? ((err) => console.error(err)),
      onLog: config.onLog ?? (() => {}),
      onUpload: config.onUpload ?? (async () => '')
    };

    this.metrics = {
      recordingStartTime: 0,
      totalDuration: 0,
      bufferedDuration: 0,
      chunksRecorded: 0,
      chunksDiscarded: 0
    };
  }

  // ==================== Public API ====================

  /**
   * Start a new call
   */
  async start(stream: MediaStream): Promise<void> {
    if (this.state !== CallState.Idle) {
      throw new Error(`Cannot start call in state: ${this.state}`);
    }

    this.aborted = false;
    this.metrics.recordingStartTime = Date.now();
    this.log('Starting new call');

    // Start recording immediately
    await this.startRecording(stream);
    this.transitionTo(CallState.Recording);
  }

  /**
   * Notify coordinator of audio detection
   * This is called from the audio monitoring loop
   */
  onAudioDetected(level: number): void {
    if (this.aborted) return;

    const now = Date.now();
    this.lastAudioTime = now;

    // Reset silence timer if we're in SilenceWait
    if (this.state === CallState.SilenceWait) {
      this.silenceDeadline = now + (this.config.disableDelay * 1000);
      this.log(`Audio resumed, resetting silence timer`);
      this.transitionTo(CallState.Playing);
      return;
    }

    // Validate if in Recording/Validating state
    if (this.state === CallState.Recording || this.state === CallState.Validating) {
      this.validateAudio(level);
    }
  }

  /**
   * Notify coordinator of silence
   */
  onSilence(): void {
    if (this.aborted) return;

    const now = Date.now();

    // If we're playing, start silence countdown
    if (this.state === CallState.Playing) {
      this.silenceDeadline = now + (this.config.disableDelay * 1000);
      this.transitionTo(CallState.SilenceWait);
      this.log(`Silence detected, starting ${this.config.disableDelay}s countdown`);

      // Start checking if silence persists
      this.checkSilenceTimeout();
    }
  }

  /**
   * Append a new recorded chunk
   */
  onChunkRecorded(chunk: Blob): void {
    if (this.aborted) return;

    this.recordedChunks.push(chunk);
    this.metrics.chunksRecorded++;

    // If we're past validation and ready to stream, queue for MediaSource
    if (this.state === CallState.BufferingForDelay ||
        this.state === CallState.Playing ||
        this.state === CallState.SilenceWait) {
      this.enqueueChunk(chunk);
    }
  }

  /**
   * Abort the call (cleanup without saving)
   */
  async abort(): Promise<void> {
    this.log('Call aborted');
    this.aborted = true;
    await this.cleanup(false);
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): CallMetrics {
    return { ...this.metrics };
  }

  // ==================== Private State Machine ====================

  private transitionTo(newState: CallState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.log(`State transition: ${oldState} → ${newState}`);
    this.config.onStateChange(newState);

    // Handle state entry logic
    this.onStateEnter(newState);
  }

  private async onStateEnter(state: CallState): Promise<void> {
    switch (state) {
      case CallState.Validating:
        // Start sustain timer
        this.sustainStartTime = Date.now();
        break;

      case CallState.PagingActivating:
        await this.activatePaging();
        break;

      case CallState.BufferingForDelay:
        await this.waitForBuffering();
        break;

      case CallState.Playing:
        await this.startPlayback();
        break;

      case CallState.SilenceWait:
        // Timer already set in onSilence
        break;

      case CallState.Draining:
        await this.drainPlayback();
        break;

      case CallState.Saving:
        await this.saveRecording();
        break;
    }
  }

  // ==================== Recording ====================

  private async startRecording(stream: MediaStream): Promise<void> {
    const mimeType = this.getBestMimeType();
    this.log(`Starting MediaRecorder with ${mimeType}`);

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.onChunkRecorded(event.data);
      }
    };

    this.mediaRecorder.onerror = (error) => {
      this.config.onError(new Error(`MediaRecorder error: ${error}`));
    };

    this.mediaRecorder.start(100); // 100ms chunks
  }

  private async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => resolve();
      this.mediaRecorder!.stop();
    });
  }

  private getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  // ==================== Audio Validation ====================

  private validateAudio(level: number): void {
    // Check threshold
    if (level < this.config.audioThreshold) {
      // Below threshold - discard accumulated chunks
      const chunksToDiscard = this.recordedChunks.length - this.recordingStartIndex;
      if (chunksToDiscard > 0) {
        this.metrics.chunksDiscarded += chunksToDiscard;
        this.recordedChunks.splice(this.recordingStartIndex, chunksToDiscard);
        this.log(`Discarded ${chunksToDiscard} chunks (below threshold)`);
      }

      // Mark new start point for next audio
      this.recordingStartIndex = this.recordedChunks.length;
      this.transitionTo(CallState.Recording);
      return;
    }

    // Check sustain duration
    if (this.state === CallState.Recording) {
      this.transitionTo(CallState.Validating);
      this.sustainStartTime = Date.now();
      return;
    }

    const sustainTime = Date.now() - this.sustainStartTime;
    if (sustainTime >= this.config.sustainDuration) {
      // Audio validated! Move to paging or buffering
      this.metrics.audioDetectedTime = Date.now();
      this.log(`Audio validated: ${level}% for ${sustainTime}ms`);

      if (this.config.pagingDevice) {
        // Have paging device - activate it first
        this.transitionTo(CallState.PagingActivating);
      } else if (this.config.playbackEnabled) {
        // No paging device but playback enabled - go to buffering
        this.initializeMediaSource();
        this.transitionTo(CallState.BufferingForDelay);
      } else {
        // No paging, no playback - go straight to silence wait
        this.transitionTo(CallState.SilenceWait);
      }
    }
  }

  // ==================== Paging Control ====================

  private async activatePaging(): Promise<void> {
    if (!this.config.pagingDevice) {
      // No paging device
      if (this.config.playbackEnabled) {
        // Initialize MediaSource for playback
        this.initializeMediaSource();
        this.transitionTo(CallState.BufferingForDelay);
      } else {
        // No playback, go straight to silence wait
        this.transitionTo(CallState.SilenceWait);
      }
      return;
    }

    try {
      this.log({
        type: 'audio_detected',
        message: `🚨 AUDIO DETECTED - Switching paging to Zone 1 (active)`
      });

      // Set paging to Zone 1 (active)
      if (this.config.setPagingZone) {
        await this.config.setPagingZone(1);
      }

      // Wait for zone change confirmation
      if (this.config.waitForPagingZoneReady) {
        const confirmed = await this.config.waitForPagingZoneReady(1);

        if (!confirmed) {
          this.log({
            type: 'speakers_disabled',
            message: '⚠️ Paging zone change delayed - audio may have slight delay to paging system'
          });
        }
      }

      // Move to next phase based on playback setting
      if (this.config.playbackEnabled) {
        this.initializeMediaSource();
        this.transitionTo(CallState.BufferingForDelay);
      } else {
        // No playback, go straight to silence wait
        this.transitionTo(CallState.SilenceWait);
      }

    } catch (error) {
      this.config.onError(error as Error);
      // Paging failed - abort call
      await this.abort();
    }
  }


  // ==================== MediaSource Playback ====================

  private initializeMediaSource(): void {
    this.log('Initializing MediaSource');

    this.mediaSource = new MediaSource();
    this.audio = new Audio();
    this.audio.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener('sourceopen', () => {
      try {
        const mimeType = this.getBestMimeType();
        this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType);
        this.sourceBuffer.mode = 'sequence'; // Gapless playback

        this.sourceBuffer.addEventListener('updateend', () => {
          this.isAppending = false;
          this.processChunkQueue();
        });

        this.log('MediaSource ready');

        // Queue all existing chunks from validated recording
        for (let i = this.recordingStartIndex; i < this.recordedChunks.length; i++) {
          this.enqueueChunk(this.recordedChunks[i]);
        }

      } catch (error) {
        this.config.onError(error as Error);
      }
    });
  }

  private enqueueChunk(chunk: Blob): void {
    this.chunkQueue.push(chunk);
    this.processChunkQueue();
  }

  private processChunkQueue(): void {
    if (this.isAppending || this.chunkQueue.length === 0) {
      return;
    }

    if (!this.sourceBuffer || this.mediaSource?.readyState !== 'open') {
      return;
    }

    if (this.sourceBuffer.updating) {
      return;
    }

    this.isAppending = true;
    const chunk = this.chunkQueue.shift()!;

    chunk.arrayBuffer().then((buffer) => {
      if (!this.sourceBuffer || this.mediaSource?.readyState !== 'open') {
        this.isAppending = false;
        return;
      }

      try {
        this.sourceBuffer.appendBuffer(buffer);
      } catch (error) {
        this.log(`Error appending chunk: ${error}`);
        this.isAppending = false;
      }
    });
  }

  private async waitForBuffering(): Promise<void> {
    this.log(`Waiting for ${this.config.playbackDelay}s of buffered audio...`);

    const targetDuration = this.config.playbackDelay;
    const maxWait = 10000; // 10 second timeout
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      if (!this.sourceBuffer || this.sourceBuffer.buffered.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const buffered = this.sourceBuffer.buffered.end(0) - this.sourceBuffer.buffered.start(0);
      this.metrics.bufferedDuration = buffered;

      if (buffered >= targetDuration) {
        this.log(`Buffered ${buffered.toFixed(2)}s, ready to play`);
        this.transitionTo(CallState.Playing);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Timeout - proceed anyway if we have some buffer
    this.log('⚠️ Buffer timeout, proceeding with available buffer');
    this.transitionTo(CallState.Playing);
  }

  private async startPlayback(): Promise<void> {
    if (!this.audio) {
      this.log('⚠️ No audio element for playback');
      return;
    }

    try {
      await this.audio.play();
      this.metrics.playbackStartTime = Date.now();
      this.log('✓ Playback started');
    } catch (error) {
      this.log(`Playback error: ${error}`);
      this.config.onError(error as Error);
    }
  }

  private async checkSilenceTimeout(): Promise<void> {
    // Check every 100ms if silence has persisted
    while (this.state === CallState.SilenceWait && !this.aborted) {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (Date.now() >= this.silenceDeadline) {
        // Silence persisted - stop recording and drain
        this.log('Silence timeout reached, stopping recording');
        await this.stopRecording();
        this.metrics.recordingEndTime = Date.now();
        this.transitionTo(CallState.Draining);
        return;
      }
    }
  }

  private async drainPlayback(): Promise<void> {
    this.log('Draining remaining playback buffer...');

    // Signal end of stream
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      if (this.sourceBuffer && !this.sourceBuffer.updating) {
        this.mediaSource.endOfStream();
      }
    }

    // Wait for playback to complete or timeout
    const maxWait = 30000; // 30 seconds
    const start = Date.now();

    while (Date.now() - start < maxWait && this.audio && !this.audio.ended) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.log('Playback drained');

    // Deactivate paging if needed
    if (this.config.pagingDeviceId) {
      await this.deactivatePaging();
    }

    this.transitionTo(CallState.Saving);
  }

  private async deactivatePaging(): Promise<void> {
    if (!this.config.pagingDevice) return;

    try {
      this.log({
        type: 'volume_change',
        message: 'AUDIO ENDED - Switching paging to Zone 2 (idle)'
      });

      // Set paging to Zone 2 (idle)
      if (this.config.setPagingZone) {
        await this.config.setPagingZone(2);
      }

      // Wait for zone change confirmation
      if (this.config.waitForPagingZoneReady) {
        await this.config.waitForPagingZoneReady(2);
      }

    } catch (error) {
      this.log({
        type: 'error',
        message: `Paging deactivation error (non-fatal): ${error}`
      });
      // Continue anyway - don't block save
    }
  }

  // ==================== Save & Cleanup ====================

  private async saveRecording(): Promise<void> {
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
    const blob = new Blob(this.recordedChunks, { type: mimeType });

    this.log(`Saving ${blob.size} bytes to Firebase`);

    try {
      // Upload to Firebase via callback
      if (this.config.onUpload) {
        const url = await this.config.onUpload(blob, mimeType);

        this.log({
          type: 'volume_change',
          message: `🎙️ Recording saved: ${url}`
        });
      }

      await this.cleanup(true);
    } catch (error) {
      this.log(`❌ Upload failed: ${error}`);
      await this.cleanup(false);
    }
  }

  private async cleanup(success: boolean): Promise<void> {
    this.log(`Cleanup (success: ${success})`);

    // Stop audio
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }

    // Clean MediaSource
    if (this.mediaSource) {
      if (this.mediaSource.readyState === 'open') {
        try {
          this.mediaSource.endOfStream();
        } catch (e) {
          // Ignore
        }
      }
      this.mediaSource = null;
    }

    this.sourceBuffer = null;
    this.chunkQueue = [];

    // Clean recording
    if (!success) {
      this.recordedChunks = [];
    }

    this.mediaRecorder = null;

    // Calculate final metrics
    this.metrics.totalDuration = (Date.now() - this.metrics.recordingStartTime) / 1000;

    this.transitionTo(CallState.Idle);
  }

  // ==================== Utilities ====================

  private log(messageOrEntry: string | { type: string; message: string; audioLevel?: number }): void {
    if (typeof messageOrEntry === 'string') {
      // Simple console log for internal debugging
      console.log(`[CallCoordinator] ${messageOrEntry}`);
    } else {
      // Structured log entry for UI
      this.config.onLog(messageOrEntry);
    }
  }
}
