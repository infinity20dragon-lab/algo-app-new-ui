/**
 * BatchCoordinator - Micro-Batch Recording & Playback System
 *
 * Manages audio recording in discrete batches (3-5 seconds each) with simple blob-based
 * playback. Replaces complex MediaSource streaming with reliable, queue-based architecture.
 *
 * Key Features:
 * - Records in configurable batch durations (default 5s)
 * - Plays complete, self-contained audio blobs
 * - Sequential playback queue for multiple batches
 * - Hardware control integration (paging, speakers, PoE)
 * - Simple error recovery (retry blob playback)
 *
 * State Machine per Batch:
 * Recording → Ready → Queued → Playing → Complete
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export enum BatchState {
  Recording = 'Recording',
  Ready = 'Ready',
  Queued = 'Queued',
  Playing = 'Playing',
  Complete = 'Complete',
  Failed = 'Failed'
}

export interface AudioBatch {
  id: string;                              // Unique identifier
  chunks: Blob[];                          // MediaRecorder chunks
  blob: Blob | null;                       // Combined blob for playback
  duration: number;                        // Recorded duration in ms
  state: BatchState;                       // Current state
  audioElement: HTMLAudioElement | null;   // Deprecated: Not used with Web Audio API
  blobUrl: string | null;                  // Deprecated: Not used with Web Audio API
  startTime: number;                       // Recording start timestamp
  endTime: number | null;                  // Recording end timestamp
  playbackStartTime: number | null;        // When playback began
  error: Error | null;                     // Any errors encountered
}

export interface BatchCoordinatorConfig {
  // Audio validation
  audioThreshold: number;                  // Threshold level for audio detection
  sustainDuration: number;                 // Duration audio must be sustained (ms)

  // Batch settings
  batchDuration: number;                   // Target duration per batch (ms)
  minBatchDuration?: number;               // Min duration before completing batch (ms)
  maxBatchDuration?: number;               // Max duration before force-completing batch (ms)

  // Timing
  playbackEnabled: boolean;                // Enable/disable live playback
  playbackDelay: number;                   // Hardware stabilization delay (ms)
  disableDelay: number;                    // Silence timeout before stopping (ms)

  // Hardware control
  pagingDevice?: {
    id: string;
    name: string;
    ipAddress: string;
    password: string;
    authMethod: string;
  };
  setPagingZone?: (zone: number) => Promise<void>;
  waitForPagingZoneReady?: (zone: number) => Promise<boolean>;

  // Speaker control
  linkedSpeakers: Array<{
    id: string;
    name: string;
    ipAddress: string;
    volume: number;
  }>;
  setSpeakerVolume?: (speakerId: string, volume: number) => Promise<void>;
  rampEnabled: boolean;
  dayNightMode: boolean;
  dayStartHour: number;
  dayEndHour: number;
  nightRampDuration: number;
  targetVolume: number;

  // PoE control
  poeDevices: Array<{
    id: string;
    name: string;
    mode: string;
    linkedPagingDevices: string[];
  }>;
  controlPoEDevices?: (deviceIds: string[], action: 'on' | 'off') => Promise<void>;

  // Callbacks
  onLog: (entry: { type: string; message: string; audioLevel?: number }) => void;
  onUpload: (blob: Blob, mimeType: string) => Promise<string>;
  onError?: (error: Error) => void;
  onStateChange?: (state: string) => void;
}

// ============================================================================
// BatchCoordinator Class
// ============================================================================

export class BatchCoordinator {
  // Configuration
  private config: BatchCoordinatorConfig;
  private batchDuration: number;
  private minBatchDuration: number;
  private maxBatchDuration: number;
  private sustainDuration: number;
  private silenceTimeout: number;

  // State
  private stream: MediaStream | null = null;
  private batches: AudioBatch[] = [];
  private currentBatch: AudioBatch | null = null;
  private playbackQueue: AudioBatch[] = [];
  private isPlaying: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private lastAudioTime: number = 0;
  private silenceCheckInterval: number | null = null;
  private sessionStartTime: number = 0;
  private initSegment: Blob | null = null; // First chunk with headers for playback

  // Web Audio API for playback
  private audioContext: AudioContext | null = null;
  private nextPlaybackTime: number = 0; // Timeline position for scheduling

  // Hardware state
  private pagingActive: boolean = false;      // Zone 1 active
  private hardwareReady: boolean = false;     // Speakers ramped, PoE enabled
  private isInZone1: boolean = false;         // Track zone for subsequent calls

  // Validation
  private audioValidated: boolean = false;
  private validationStartTime: number = 0;
  private isPreBuffering: boolean = false; // Recording during validation

  // Session ID gate (prevents late playback after session invalidation)
  private sessionId: number = 0;

  // Playback generation counter (prevents race conditions between sessions)
  private playbackGeneration: number = 0;

  // Session completion guard (prevents double finish)
  private isFinishing: boolean = false;

  constructor(config: BatchCoordinatorConfig) {
    this.config = config;
    this.batchDuration = config.batchDuration || 5000;
    this.minBatchDuration = config.minBatchDuration || 1000;
    this.maxBatchDuration = config.maxBatchDuration || 10000;
    this.sustainDuration = config.sustainDuration || 500;
    this.silenceTimeout = config.disableDelay || 8000;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Start recording from the provided media stream
   */
  async start(stream: MediaStream): Promise<void> {
    this.stream = stream;
    this.sessionStartTime = Date.now();
    this.lastAudioTime = Date.now();
    this.audioValidated = false;
    this.validationStartTime = 0;
    this.sessionId++; // 🔥 New session, increment ID
    this.playbackGeneration++; // New session, increment generation
    this.isFinishing = false; // Reset finish guard

    this.log(`BatchCoordinator started (session ${this.sessionId})`);

    // 🔥 Initialize Web Audio API for playback
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
      this.nextPlaybackTime = 0;
      this.log(`🎵 Web Audio API initialized (sample rate: ${this.audioContext.sampleRate}Hz)`);
    } else {
      // Reset timeline for new session
      this.nextPlaybackTime = this.audioContext.currentTime;
      this.log('Web Audio timeline reset for new session');
    }

    // 🔥 Capture silent pre-roll for init segment (if not already captured)
    if (!this.initSegment) {
      await this.captureSilentPreRoll();
    } else {
      this.log('Using existing silent pre-roll from previous session');
    }

    // Don't start recording yet - wait for audio validation
    // Recording will start when onAudioDetected validates sustained audio
  }

  /**
   * Handle audio detection event
   */
  onAudioDetected(level: number): void {
    this.lastAudioTime = Date.now();

    // Validate sustained audio
    if (!this.audioValidated) {
      if (!this.validationStartTime) {
        this.validationStartTime = Date.now();
        this.log(`Audio detected (${(level * 100).toFixed(0)}%), validating...`);

        // 🎙️ Start recording IMMEDIATELY (pre-buffer mode)
        // This captures audio from the very first syllable
        this.isPreBuffering = true;
        this.startBatchRecording();
        this.log('📼 Pre-buffering started (capturing audio during validation)');
      }

      const elapsed = Date.now() - this.validationStartTime;
      if (elapsed >= this.sustainDuration) {
        this.audioValidated = true;
        this.isPreBuffering = false;
        this.log(`✓ Audio validated (${elapsed}ms above threshold) - pre-buffer committed`);

        // Trigger hardware activation
        if (!this.pagingActive && !this.hardwareReady) {
          this.activateHardware().catch((error) => {
            this.log(`Hardware activation failed: ${error}`);
            if (this.config.onError) {
              this.config.onError(error);
            }
          });
        }
      }
      return;
    }

    // Reset silence check if audio continues
    if (this.silenceCheckInterval) {
      // Audio detected during silence wait - continue recording
      const remainingTime = (this.silenceTimeout / 1000).toFixed(1);
      this.log(`Audio continues - ${remainingTime}s silence countdown reset`);
    }
  }

  /**
   * Handle silence event
   */
  onSilence(): void {
    // If in pre-buffer mode and silence detected, validation failed
    if (this.isPreBuffering && !this.audioValidated) {
      this.log('⚠️ Validation failed (silence during validation) - discarding pre-buffer');

      // Stop and discard the pre-buffer recording
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder.onerror = null;
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
      }

      // Discard the batch
      this.currentBatch = null;
      this.batches = [];
      this.isPreBuffering = false;
      this.validationStartTime = 0;
      return;
    }

    // Only start silence check if audio has been validated
    if (!this.audioValidated) {
      this.validationStartTime = 0; // Reset validation
      return;
    }

    // Start silence countdown if not already started
    if (!this.silenceCheckInterval) {
      this.log(`Silence detected, starting ${this.silenceTimeout / 1000}s countdown`);

      this.silenceCheckInterval = window.setInterval(() => {
        const silenceElapsed = Date.now() - this.lastAudioTime;

        if (silenceElapsed >= this.silenceTimeout) {
          this.log(`Silence timeout (${this.silenceTimeout}ms) reached`);

          // Complete current batch if recording
          if (this.currentBatch && this.currentBatch.state === BatchState.Recording) {
            this.log('Completing final batch');
            this.completeBatch();
          }

          // Stop MediaRecorder
          if (this.mediaRecorder) {
            // Clear callbacks to prevent zombie events
            this.mediaRecorder.ondataavailable = null;
            this.mediaRecorder.onerror = null;

            if (this.mediaRecorder.state !== 'inactive') {
              this.mediaRecorder.stop();
            }
            this.mediaRecorder = null;
          }

          // Clear interval
          clearInterval(this.silenceCheckInterval!);
          this.silenceCheckInterval = null;

          // If all batches played, wrap up session
          if (this.playbackQueue.length === 0 && !this.isPlaying) {
            this.log('All batches complete, finishing session');
            this.finishSession();
          }
        }
      }, 100); // Check every 100ms
    }
  }

  /**
   * Manually stop the coordinator
   */
  async stop(): Promise<void> {
    this.log('Stopping batch coordinator');

    // Complete current batch if recording
    if (this.currentBatch && this.currentBatch.state === BatchState.Recording) {
      this.completeBatch();
    }

    // Stop MediaRecorder
    if (this.mediaRecorder) {
      // Clear callbacks to prevent zombie events
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }

    // Clear silence check
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    // Wait for all batches to complete playback
    await this.waitForPlaybackComplete();

    // Finish session (this will invalidate sessionId)
    await this.finishSession();
  }

  /**
   * Abort without saving
   */
  async abort(): Promise<void> {
    this.log('Aborting batch coordinator');

    // 🔥 CRITICAL: Invalidate session IMMEDIATELY to prevent ANY new playback
    this.sessionId++;
    this.log(`Session invalidated (now ${this.sessionId}) - no more playback allowed`);

    // Stop everything
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
    }

    // Stop playback - close AudioContext (monitoring is stopping)
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
        this.log('AudioContext closed');
      } catch (error) {
        this.log(`AudioContext close error: ${error}`);
      }
      this.audioContext = null;
      this.nextPlaybackTime = 0;
    }

    // Clear init segment (monitoring is stopping completely)
    this.initSegment = null;
    this.log('Cleared silent pre-roll init segment');

    // Cleanup without uploading
    await this.cleanup(false);
  }

  /**
   * Get current batches
   */
  getBatches(): AudioBatch[] {
    return this.batches;
  }

  /**
   * Get current state summary
   */
  getState(): string {
    if (!this.audioValidated) return 'Validating';
    if (this.currentBatch?.state === BatchState.Recording) return 'Recording';
    if (this.isPlaying) return 'Playing';
    if (this.playbackQueue.length > 0) return 'Queued';
    return 'Idle';
  }

  // ============================================================================
  // Batch Recording
  // ============================================================================

  private startBatchRecording(): void {
    const batch: AudioBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chunks: [],
      blob: null,
      duration: 0,
      state: BatchState.Recording,
      audioElement: null,
      blobUrl: null,
      startTime: Date.now(),
      endTime: null,
      playbackStartTime: null,
      error: null
    };

    this.currentBatch = batch;
    this.batches.push(batch);

    this.log(`Started recording batch ${this.batches.length}`);

    // Create MediaRecorder if not exists
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      const mimeType = this.getBestMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream!, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.onChunkRecorded(event.data);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        this.log(`MediaRecorder error: ${error}`);
        if (this.config.onError) {
          this.config.onError(new Error(`MediaRecorder error: ${error}`));
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.log(`MediaRecorder started (${mimeType})`);
    }
  }

  private onChunkRecorded(chunk: Blob): void {
    // 🔥 CRITICAL: Guard against zombie chunks from old sessions
    // MediaRecorder.stop() fires final ondataavailable AFTER cleanup
    if (!this.currentBatch) {
      this.log('⚠️ Chunk received but no active batch (likely final chunk after stop)');
      return;
    }

    // NOTE: We no longer capture init segment from first chunk
    // Instead, we'll extract it from batch 1's completed blob

    this.currentBatch.chunks.push(chunk);
    this.currentBatch.duration += 100; // Approximate (100ms per chunk)

    // Check if batch duration reached
    if (this.currentBatch.duration >= this.batchDuration) {
      this.log(`Batch ${this.batches.length} reached target duration (${this.currentBatch.duration}ms)`);
      this.completeBatch();
    }

    // Safety: Force complete if max duration exceeded
    if (this.currentBatch && this.currentBatch.duration >= this.maxBatchDuration) {
      this.log(`Batch ${this.batches.length} exceeded max duration, force completing`);
      this.completeBatch();
    }
  }

  private completeBatch(): void {
    if (!this.currentBatch) return;

    // Don't complete batches if session is finishing
    if (this.isFinishing) {
      this.log('⚠️ completeBatch called during session finish, skipping');
      return;
    }

    const batch = this.currentBatch;

    // Check minimum duration
    if (batch.duration < this.minBatchDuration && this.mediaRecorder?.state === 'recording') {
      this.log(`Batch ${this.batches.length} too short (${batch.duration}ms), continuing...`);
      return; // Don't complete yet
    }

    batch.endTime = Date.now();
    batch.state = BatchState.Ready;

    // Create blob from chunks
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
    const batchIndex = this.batches.indexOf(batch) + 1;

    if (batchIndex === 1) {
      // Batch 1: Use chunks as-is (already has init segment in first chunk)
      batch.blob = new Blob(batch.chunks, { type: mimeType });
    } else if (this.initSegment) {
      // Batch 2+: Prepend silent pre-roll as init segment
      // This ensures batch 2+ can play standalone without audio contamination
      batch.blob = new Blob([this.initSegment, ...batch.chunks], { type: mimeType });
      this.log(`Batch ${batchIndex}: Added silent pre-roll (${this.initSegment.size} bytes) for standalone playback`);
    } else {
      // Fallback: No init segment available (shouldn't happen)
      batch.blob = new Blob(batch.chunks, { type: mimeType });
      this.log(`⚠️ Batch ${batchIndex}: No init segment available, using chunks only`);
    }

    this.log(`Batch ${this.batches.length} complete: ${batch.duration}ms, ${batch.blob.size} bytes`);

    // Enqueue for playback if enabled
    if (this.config.playbackEnabled) {
      this.playbackQueue.push(batch);
      batch.state = BatchState.Queued;
      this.log(`Batch ${this.batches.length} queued for playback`);

      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNextBatch();
      }
    }

    // Clear reference to completed batch before starting new one
    this.currentBatch = null;

    // Check if more audio is coming
    const silenceElapsed = Date.now() - this.lastAudioTime;
    if (silenceElapsed < this.silenceTimeout && this.mediaRecorder?.state === 'recording') {
      // More audio expected, start next batch
      this.log('More audio expected, starting next batch');
      this.startBatchRecording(); // This will set this.currentBatch to new batch
    }
  }

  // ============================================================================
  // Batch Playback
  // ============================================================================

  /**
   * Play next batch using Web Audio API
   * Decodes blob to AudioBuffer and schedules on timeline for gap-free playback
   */
  private async playNextBatch(): Promise<void> {
    if (this.playbackQueue.length === 0) {
      this.isPlaying = false;
      this.log('Playback queue empty');

      // Check if session is complete
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        if (!this.silenceCheckInterval) {
          // Session complete, wrap up
          this.log('No more batches, finishing session');
          await this.finishSession();
        }
      }
      return;
    }

    const batch = this.playbackQueue.shift()!;
    batch.state = BatchState.Playing;
    batch.playbackStartTime = Date.now();
    this.isPlaying = true;

    const batchIndex = this.batches.indexOf(batch) + 1;
    this.log(`Playing batch ${batchIndex} of ${this.batches.length}`);

    // 🔥 Capture session ID to guard against race conditions
    const mySessionId = this.sessionId;

    try {
      // Ensure hardware is active before first playback
      if (!this.hardwareReady) {
        await this.activateHardware();
      }

      // 🔥 Gate: Check session is still valid before proceeding
      if (mySessionId !== this.sessionId) {
        this.log(`Playback aborted: session ${mySessionId} invalidated (now ${this.sessionId})`);
        return;
      }

      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      // 🎵 Step 1: Decode blob to AudioBuffer
      const arrayBuffer = await batch.blob!.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.log(`Decoded batch ${batchIndex}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch`);

      // 🔥 Gate: Check session STILL valid after async decode
      if (mySessionId !== this.sessionId) {
        this.log(`Playback aborted after decode: session ${mySessionId} invalidated`);
        return;
      }

      // 🎵 Step 2: Create AudioBufferSourceNode
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // 🎵 Step 3: Calculate playback time (sample-accurate scheduling)
      const now = this.audioContext.currentTime;
      const playTime = Math.max(this.nextPlaybackTime, now);

      // 🎵 Step 4: Set up completion handler
      source.onended = () => {
        // 🔥 Guard: Only proceed if this is still the current session
        if (mySessionId !== this.sessionId) {
          this.log(`Batch ${batchIndex} onended from old session, ignoring`);
          return;
        }

        this.log(`Batch ${batchIndex} playback complete`);
        batch.state = BatchState.Complete;

        // No cleanup needed - Web Audio handles everything
        // Play next batch
        this.playNextBatch();
      };

      // 🎵 Step 5: Start playback at scheduled time
      source.start(playTime);

      // 🎵 Step 6: Update timeline for next batch
      this.nextPlaybackTime = playTime + audioBuffer.duration;

      const delay = playTime - now;
      if (delay > 0) {
        this.log(`✓ Batch ${batchIndex} scheduled in ${(delay * 1000).toFixed(0)}ms`);
      } else {
        this.log(`✓ Batch ${batchIndex} playing immediately`);
      }

    } catch (error) {
      this.log(`Failed to play batch ${batchIndex}: ${error}`);
      batch.state = BatchState.Failed;
      batch.error = error as Error;

      if (this.config.onError) {
        this.config.onError(error as Error);
      }

      // Try next batch
      this.playNextBatch();
    }
  }

  private async waitForPlaybackComplete(): Promise<void> {
    if (!this.config.playbackEnabled) return;

    return new Promise((resolve) => {
      if (this.playbackQueue.length === 0 && !this.isPlaying) {
        resolve();
        return;
      }

      this.log('Waiting for playback to complete...');

      const checkInterval = setInterval(() => {
        if (this.playbackQueue.length === 0 && !this.isPlaying) {
          clearInterval(checkInterval);
          this.log('✓ Playback complete');
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        this.log('⚠️ Playback completion timeout');
        resolve();
      }, 30000);
    });
  }

  // ============================================================================
  // Hardware Control
  // ============================================================================

  private async activateHardware(): Promise<void> {
    if (this.hardwareReady) return;

    this.log('🎛️  HARDWARE ACTIVATION:');

    try {
      // Step 1: Set paging to Zone 1 (active)
      if (this.config.pagingDevice && this.config.setPagingZone) {
        this.log('Step 1: Switching paging to Zone 1 (active)...');
        await this.config.setPagingZone(1);

        if (this.config.waitForPagingZoneReady) {
          const ready = await this.config.waitForPagingZoneReady(1);
          if (ready) {
            this.log('  ✓ Paging switched to Zone 1');
            this.pagingActive = true;
            this.isInZone1 = true;
          }
        }
      }

      // Step 2: Ramp speaker volumes
      if (this.config.linkedSpeakers.length > 0 && this.config.playbackEnabled) {
        this.log('Step 2: Ramping speaker volumes...');
        await this.rampSpeakerVolumes(this.config.targetVolume);
        this.log('  ✓ Speakers ready');
      }

      // Step 3: Enable PoE devices in auto mode
      const autoPoEDevices = this.config.poeDevices.filter(d => d.mode === 'auto');
      if (autoPoEDevices.length > 0 && this.config.controlPoEDevices) {
        this.log('Step 3: Enabling PoE devices...');
        await this.config.controlPoEDevices(autoPoEDevices.map(d => d.id), 'on');
        this.log(`  ✓ Enabled ${autoPoEDevices.length} PoE device(s)`);
      }

      this.hardwareReady = true;
      this.log('✓ Hardware activation complete');

    } catch (error) {
      this.log(`Hardware activation failed: ${error}`);
      throw error;
    }
  }

  private async deactivateHardware(): Promise<void> {
    if (!this.hardwareReady) return;

    this.log('🎛️  HARDWARE DEACTIVATION:');

    try {
      // Step 1: Ramp down speaker volumes
      if (this.config.linkedSpeakers.length > 0 && this.config.playbackEnabled) {
        this.log('Step 1: Ramping speaker volumes down...');
        await this.rampSpeakerVolumes(0);
      }

      // Step 2: Disable PoE devices in auto mode
      const autoPoEDevices = this.config.poeDevices.filter(d => d.mode === 'auto');
      if (autoPoEDevices.length > 0 && this.config.controlPoEDevices) {
        this.log('Step 2: Disabling PoE devices...');
        await this.config.controlPoEDevices(autoPoEDevices.map(d => d.id), 'off');
        this.log(`  ✓ Disabled ${autoPoEDevices.length} PoE device(s)`);
      }

      // Step 3: Set paging back to Zone 2 (idle)
      if (this.config.pagingDevice && this.config.setPagingZone) {
        this.log('Step 3: Switching paging to Zone 2 (idle)...');
        await this.config.setPagingZone(2);

        if (this.config.waitForPagingZoneReady) {
          const ready = await this.config.waitForPagingZoneReady(2);
          if (ready) {
            this.log('  ✓ Paging switched to Zone 2');
            this.pagingActive = false;
            this.isInZone1 = false;
          }
        }
      }

      this.hardwareReady = false;
      this.log('✓ Hardware deactivation complete');

    } catch (error) {
      this.log(`Hardware deactivation error: ${error}`);
      // Continue anyway - best effort
    }
  }

  private async rampSpeakerVolumes(targetVolume: number): Promise<void> {
    if (!this.config.setSpeakerVolume) return;

    // Determine if we should ramp based on time of day
    const shouldRamp = this.shouldRampVolume();

    if (!shouldRamp) {
      // Day mode: Set volumes immediately
      for (const speaker of this.config.linkedSpeakers) {
        const volume = Math.min(speaker.volume, targetVolume) / 100;
        await this.config.setSpeakerVolume(speaker.id, volume);
      }
      return;
    }

    // Night mode: Ramp volumes gradually
    const steps = 10;
    const stepDelay = this.config.nightRampDuration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      for (const speaker of this.config.linkedSpeakers) {
        const maxVolume = Math.min(speaker.volume, targetVolume);
        const volume = (maxVolume * progress) / 100;
        await this.config.setSpeakerVolume(speaker.id, volume);
      }

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }
    }
  }

  private shouldRampVolume(): boolean {
    if (!this.config.rampEnabled || !this.config.dayNightMode) {
      return false;
    }

    const now = new Date();
    const hour = now.getHours();

    return hour < this.config.dayStartHour || hour >= this.config.dayEndHour;
  }

  // ============================================================================
  // Session Completion & Upload
  // ============================================================================

  private async finishSession(): Promise<void> {
    // 🔥 Guard: Prevent double finish
    if (this.isFinishing) {
      this.log('⚠️ finishSession already in progress, skipping duplicate call');
      return;
    }
    this.isFinishing = true;

    this.log('💾 FINISHING SESSION:');

    // 🔥 CRITICAL: Invalidate session IMMEDIATELY to prevent ANY new playback
    this.sessionId++;
    this.log(`Session invalidated (now ${this.sessionId}) - no more playback allowed`);

    // Wait for playback to complete if enabled
    await this.waitForPlaybackComplete();

    // Deactivate hardware
    await this.deactivateHardware();

    // Upload all batches
    await this.uploadAllBatches();

    // Cleanup
    await this.cleanup(true);

    this.log('✓ Session complete');
  }

  private async uploadAllBatches(): Promise<void> {
    if (this.batches.length === 0) {
      this.log('No batches to upload');
      return;
    }

    this.log(`Uploading ${this.batches.length} batch(es)...`);

    try {
      // Combine all batches into single blob
      const allChunks = this.batches.flatMap(b => b.chunks);
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
      const combinedBlob = new Blob(allChunks, { type: mimeType });

      this.log(`Combined blob: ${combinedBlob.size} bytes, ${mimeType}`);

      // Upload to Firebase
      const url = await this.config.onUpload(combinedBlob, mimeType);

      this.log(`✓ Upload successful: ${url}`);

      this.config.onLog({
        type: 'volume_change',
        message: `🎙️ Recording saved: ${url}`
      });

    } catch (error) {
      this.log(`Upload failed: ${error}`);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  private async cleanup(success: boolean): Promise<void> {
    this.log(`Cleanup (success: ${success})`);

    // 🔥 CRITICAL: Clear MediaRecorder callbacks BEFORE stopping
    // This prevents zombie ondataavailable events from firing after cleanup
    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    }
    this.mediaRecorder = null;

    // NOTE: We keep AudioContext alive for reuse across recording sessions
    // Only closed in abort() when monitoring stops completely
    // Reset timeline for next recording session
    if (this.audioContext) {
      this.nextPlaybackTime = this.audioContext.currentTime;
    }

    // Clear state
    this.batches = [];
    this.currentBatch = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.audioValidated = false;
    this.validationStartTime = 0;
    this.isPreBuffering = false; // Reset pre-buffer flag
    this.hardwareReady = false;
    this.pagingActive = false;
    this.isFinishing = false; // Reset finish guard

    // NOTE: We keep this.initSegment for reuse across sessions
    // Only cleared on abort() when monitoring stops completely

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
  }

  // ============================================================================
  // Silent Pre-roll Init Segment
  // ============================================================================

  /**
   * Capture a silent pre-roll to use as clean init segment
   * Records 200ms of silence when monitoring starts
   * This init segment is reused for ALL batches in ALL sessions
   * Eliminates ghost audio from header contamination
   */
  private async captureSilentPreRoll(): Promise<void> {
    this.log('📼 Capturing silent pre-roll for init segment...');

    return new Promise((resolve, reject) => {
      const mimeType = this.getBestMimeType();
      const preRollRecorder = new MediaRecorder(this.stream!, { mimeType });
      const chunks: Blob[] = [];

      preRollRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      preRollRecorder.onstop = () => {
        // Create blob from silent recording
        const silentBlob = new Blob(chunks, { type: mimeType });

        // Use this entire silent blob as the init segment
        this.initSegment = silentBlob;

        this.log(`✓ Silent pre-roll captured: ${this.initSegment.size} bytes (${chunks.length} chunks)`);
        resolve();
      };

      preRollRecorder.onerror = (error) => {
        this.log(`⚠️ Silent pre-roll capture failed: ${error}`);
        reject(error);
      };

      // Record for 200ms
      preRollRecorder.start(100); // 100ms chunks

      setTimeout(() => {
        if (preRollRecorder.state !== 'inactive') {
          preRollRecorder.stop();
        }
      }, 200); // 200ms total
    });
  }

  // ============================================================================
  // Utilities
  // ============================================================================

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

  private log(message: string): void {
    console.log(`[BatchCoordinator] ${message}`);
  }
}
