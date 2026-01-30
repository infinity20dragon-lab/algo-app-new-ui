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
  audioElement: HTMLAudioElement | null;   // Playback element
  blobUrl: string | null;                  // Object URL for playback
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

  // Hardware state
  private pagingActive: boolean = false;      // Zone 1 active
  private hardwareReady: boolean = false;     // Speakers ramped, PoE enabled
  private isInZone1: boolean = false;         // Track zone for subsequent calls

  // Validation
  private audioValidated: boolean = false;
  private validationStartTime: number = 0;

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

    this.log('BatchCoordinator started');

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
      }

      const elapsed = Date.now() - this.validationStartTime;
      if (elapsed >= this.sustainDuration) {
        this.audioValidated = true;
        this.log(`✓ Audio validated (${elapsed}ms above threshold)`);

        // Start first batch recording
        this.startBatchRecording();

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
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
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
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Clear silence check
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    // Wait for all batches to complete playback
    await this.waitForPlaybackComplete();

    // Finish session
    await this.finishSession();
  }

  /**
   * Abort without saving
   */
  async abort(): Promise<void> {
    this.log('Aborting batch coordinator');

    // Stop everything
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
    }

    // Stop playback
    if (this.currentBatch?.audioElement) {
      this.currentBatch.audioElement.pause();
    }

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
    if (!this.currentBatch) return;

    this.currentBatch.chunks.push(chunk);
    this.currentBatch.duration += 100; // Approximate (100ms per chunk)

    // Check if batch duration reached
    if (this.currentBatch.duration >= this.batchDuration) {
      this.log(`Batch ${this.batches.length} reached target duration (${this.currentBatch.duration}ms)`);
      this.completeBatch();
    }

    // Safety: Force complete if max duration exceeded
    if (this.currentBatch.duration >= this.maxBatchDuration) {
      this.log(`Batch ${this.batches.length} exceeded max duration, force completing`);
      this.completeBatch();
    }
  }

  private completeBatch(): void {
    if (!this.currentBatch) return;

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
    batch.blob = new Blob(batch.chunks, { type: mimeType });

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

    // Check if more audio is coming
    const silenceElapsed = Date.now() - this.lastAudioTime;
    if (silenceElapsed < this.silenceTimeout && this.mediaRecorder?.state === 'recording') {
      // More audio expected, start next batch
      this.log('More audio expected, starting next batch');
      this.startBatchRecording();
    }

    this.currentBatch = null;
  }

  // ============================================================================
  // Batch Playback
  // ============================================================================

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

    try {
      // Ensure hardware is active before first playback
      if (!this.hardwareReady) {
        await this.activateHardware();
      }

      // Create audio element
      const audio = new Audio();
      batch.audioElement = audio;

      // Create blob URL
      batch.blobUrl = URL.createObjectURL(batch.blob!);
      audio.src = batch.blobUrl;

      // Set up completion handler
      audio.onended = () => {
        this.log(`Batch ${batchIndex} playback complete`);
        batch.state = BatchState.Complete;

        // Cleanup
        if (batch.blobUrl) {
          URL.revokeObjectURL(batch.blobUrl);
        }
        batch.audioElement = null;
        batch.blobUrl = null;

        // Play next batch
        this.playNextBatch();
      };

      audio.onerror = (error) => {
        this.log(`Batch ${batchIndex} playback error: ${error}`);
        batch.state = BatchState.Failed;
        batch.error = new Error(`Playback failed: ${error}`);

        // Cleanup
        if (batch.blobUrl) {
          URL.revokeObjectURL(batch.blobUrl);
        }

        if (this.config.onError) {
          this.config.onError(batch.error);
        }

        // Try next batch anyway
        this.playNextBatch();
      };

      // Start playback
      await audio.play();
      this.log(`✓ Batch ${batchIndex} playback started`);

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
    this.log('💾 FINISHING SESSION:');

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

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;

    // Stop playback
    for (const batch of this.batches) {
      if (batch.audioElement) {
        batch.audioElement.pause();
        batch.audioElement = null;
      }
      if (batch.blobUrl) {
        URL.revokeObjectURL(batch.blobUrl);
        batch.blobUrl = null;
      }
    }

    // Clear state
    this.batches = [];
    this.currentBatch = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.audioValidated = false;
    this.validationStartTime = 0;
    this.hardwareReady = false;
    this.pagingActive = false;

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
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
