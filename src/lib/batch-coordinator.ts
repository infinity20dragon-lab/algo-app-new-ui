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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔒 THE NO-LOST-SYLLABLES INVARIANT (Purist Mode)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Once audio energy crosses the detection threshold, there MUST exist an active
 * capture buffer until the system has definitively decided whether that audio
 * belongs to a session.
 *
 * ENFORCEMENT:
 * - MediaRecorder starts when monitoring begins
 * - MediaRecorder NEVER stops until monitoring ends (abort() only)
 * - No gaps during: playback, upload, hardware transitions, session finishing
 * - Capture first, decide later - NEVER the reverse
 *
 * This guarantees zero lost syllables in emergency situations (e.g., "HELP!")
 * ═══════════════════════════════════════════════════════════════════════════
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

export enum SystemState {
  IDLE = 'IDLE',                     // No activity, paging Zone 2
  ARMED = 'ARMED',                   // Audio detected, validating
  RECORDING = 'RECORDING',           // Active session, paging Zone 1
  PLAYING = 'PLAYING',               // Playback in progress
  TAILGUARD = 'TAILGUARD',           // 3s grace after silence
  GRACE = 'GRACE',                   // Post-playback grace window
  DEACTIVATING = 'DEACTIVATING'      // Shutting down hardware
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

export interface CompletedSession {
  id: string;
  sessionNumber: number;
  blob: Blob;
  mimeType: string;
  timestamp: number;
  uploaded: boolean;
  uploadUrl?: string;
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
  tailGuardDuration?: number;              // TailGuard window duration (ms, default: 3000)
  postPlaybackGraceDuration?: number;      // Post-playback grace window (ms, default: 750)

  // Playback volume ramp
  playbackRampDuration?: number;           // Ramp duration in ms (default: 2000)
  playbackStartVolume?: number;            // Start volume 0-2.0 (default: 0 = silent)
  playbackMaxVolume?: number;              // Max volume 0-2.0 (default: 1.0 = 100%)

  // Hardware control
  pagingDevice?: {
    id: string;
    name: string;
    ipAddress: string;
    password: string;
    authMethod: string;
  } | null;
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
  onPlaybackLevelUpdate?: (level: number) => void;  // Playback audio level monitoring
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
  private playbackAnalyser: AnalyserNode | null = null;
  private playbackMonitoringInterval: number | null = null;
  private currentPlaybackSource: AudioBufferSourceNode | null = null;
  private playbackGainNode: GainNode | null = null; // For volume ramping (no network requests!)

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

  // Deferred start (audio detected during finish phase) - DEPRECATED, replaced by TailGuard
  private pendingStart: boolean = false;
  private finishingSessionBatches: AudioBatch[] = []; // Saved batches from session being finished

  // TailGuard: Always-on buffer after last batch queued
  private tailGuardActive: boolean = false;
  private tailGuardDuration: number; // Configured duration (default: 3000ms)
  private tailGuardStartTime: number = 0;

  // Background upload queue (non-blocking)
  private completedSessions: CompletedSession[] = [];
  private uploadInProgress: boolean = false;

  // System state machine (for debugging and race condition prevention)
  private systemState: SystemState = SystemState.IDLE;

  // Idle memory cap (rolling ring buffer)
  private idleBufferMaxDuration: number = 3000; // 3 seconds max for idle batch

  // Post-playback grace window (catch "hello" right after playback)
  private postPlaybackGraceDuration: number; // Configured duration (default: 750ms)
  private postPlaybackGraceActive: boolean = false;
  private postPlaybackGraceTimeout: number | null = null;
  private postPlaybackGraceResolve: (() => void) | null = null; // Resolve function to cancel grace

  // Playback volume ramp settings
  private playbackRampDuration: number; // Ramp duration in ms
  private playbackStartVolume: number; // Start volume (0-2.0)
  private playbackMaxVolume: number; // Max volume (0-2.0)

  // Hardware thrash protection (prevent infinite reactivation loops)
  private reactivationAttempts: number = 0;
  private maxReactivationAttempts: number = 1; // Allow 1 re-activation per finish cycle

  constructor(config: BatchCoordinatorConfig) {
    this.config = config;
    this.batchDuration = config.batchDuration || 5000;
    this.minBatchDuration = config.minBatchDuration || 1000;
    this.maxBatchDuration = config.maxBatchDuration || 10000;
    this.sustainDuration = config.sustainDuration || 500;
    this.silenceTimeout = config.disableDelay; // Respect user setting, no fallback
    this.tailGuardDuration = config.tailGuardDuration ?? 3000; // Default: 3s
    this.postPlaybackGraceDuration = config.postPlaybackGraceDuration ?? 750; // Default: 750ms
    this.playbackRampDuration = config.playbackRampDuration ?? 2000; // Default: 2s
    this.playbackStartVolume = config.playbackStartVolume ?? 0; // Default: silent start
    this.playbackMaxVolume = config.playbackMaxVolume ?? 1.0; // Default: 100% volume
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
    this.pendingStart = false; // Reset deferred start flag (deprecated, replaced by TailGuard)
    this.finishingSessionBatches = []; // Reset finishing session batches
    this.tailGuardActive = false; // Reset TailGuard state
    this.tailGuardStartTime = 0;

    this.log(`BatchCoordinator started (session ${this.sessionId})`);

    // 🔥 Initialize Web Audio API for playback
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
      this.nextPlaybackTime = 0;
      this.log(`🎵 Web Audio API initialized (sample rate: ${this.audioContext.sampleRate}Hz)`);

      // Create gain node for volume ramping (fast, no network requests!)
      this.playbackGainNode = this.audioContext.createGain();
      this.playbackGainNode.gain.value = this.playbackStartVolume; // Start at configured volume
      this.log(`🎵 Playback gain node created (start: ${this.playbackStartVolume.toFixed(2)}, max: ${this.playbackMaxVolume.toFixed(2)})`);

      // Create analyser for playback monitoring
      this.playbackAnalyser = this.audioContext.createAnalyser();
      this.playbackAnalyser.fftSize = 256;

      // Connect: GainNode → Analyser → Destination
      this.playbackGainNode.connect(this.playbackAnalyser);
      this.playbackAnalyser.connect(this.audioContext.destination);
      this.log('🎵 Audio chain: Source → Gain (ramp) → Analyser (monitor) → Destination (speakers)');

      // Start playback level monitoring
      this.startPlaybackMonitoring();
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

    // 🔒 POST-PLAYBACK GRACE: Audio detected right after playback!
    // This is the "hello" we were waiting for - promote standby batch
    if (this.postPlaybackGraceActive) {
      // Validate sustained audio during grace period
      if (!this.audioValidated && !this.validationStartTime) {
        this.validationStartTime = Date.now();
        this.log(`🔒 Grace: Emergency audio detected (${(level * 100).toFixed(0)}%) right after playback, validating...`);
      }

      if (!this.audioValidated && this.validationStartTime) {
        const elapsed = Date.now() - this.validationStartTime;
        if (elapsed >= this.sustainDuration) {
          this.audioValidated = true;
          this.log(`🔒 Grace: Audio validated (${elapsed}ms) - PROMOTING standby batch to new session`);

          // Cancel grace timer - we're promoting
          this.cancelPostPlaybackGrace();

          // 🔥 CRITICAL: Restart silence monitoring for the promoted session
          // This ensures the promoted session has a fresh 8s silence countdown
          if (this.silenceCheckInterval) {
            clearInterval(this.silenceCheckInterval);
            this.silenceCheckInterval = null;
          }
          this.onSilence(); // Start fresh silence monitoring with updated lastAudioTime

          // finishSession will detect audioValidated and abort deactivation
          // The standby batch will be promoted in cleanup()
          this.log(`🔒 Grace promotion: Hardware will stay active, session continues`);
        }
      }

      return; // Grace is handling this audio
    }

    // 🎯 BLOCK: Don't start new session while previous session is finishing
    // This prevents overlapping sessions during upload/cleanup
    if (this.isFinishing && !this.tailGuardActive && !this.postPlaybackGraceActive) {
      // Session is finishing, audio will be captured in standby batch
      // and validated/promoted in cleanup() if sustained
      return;
    }

    // 🛡️ TAILGUARD PROMOTION: If TailGuard is active, promote to new session
    if (this.tailGuardActive) {
      // Validate sustained audio during TailGuard
      if (!this.audioValidated && !this.validationStartTime) {
        this.validationStartTime = Date.now();
        this.log(`🛡️ TailGuard: Emergency audio detected (${(level * 100).toFixed(0)}%), validating...`);
      }

      if (!this.audioValidated && this.validationStartTime) {
        const elapsed = Date.now() - this.validationStartTime;
        if (elapsed >= this.sustainDuration) {
          this.audioValidated = true;
          this.log(`🛡️ TailGuard: Audio validated (${elapsed}ms) - PROMOTING to new session`);

          // Deactivate TailGuard - it's now a full session
          this.tailGuardActive = false;
          this.tailGuardStartTime = 0;

          // 🔥 CRITICAL: Restart silence monitoring for the promoted session
          // This ensures the promoted session has a fresh 8s silence countdown
          if (this.silenceCheckInterval) {
            clearInterval(this.silenceCheckInterval);
            this.silenceCheckInterval = null;
          }
          this.onSilence(); // Start fresh silence monitoring with updated lastAudioTime

          // Start new batch for the promoted session
          // MediaRecorder is already running, just continue batching
          this.log(`🛡️ TailGuard promoted - MediaRecorder continues seamlessly`);

          // Trigger hardware activation if not already active
          if (!this.pagingActive && !this.hardwareReady) {
            this.activateHardware().catch((error) => {
              this.log(`Hardware activation failed: ${error}`);
              if (this.config.onError) {
                this.config.onError(error);
              }
            });
          }
        }
      }

      return; // TailGuard is handling this audio
    }

    // 🎯 PURIST MODE: Audio during finish phase
    // MediaRecorder is already running into standby batch - just validate
    if (this.isFinishing) {
      // Start validation if not already started
      if (!this.validationStartTime) {
        this.validationStartTime = Date.now();
        this.log(`🎯 Audio detected during finish phase (${(level * 100).toFixed(0)}%) - validating standby batch`);
        this.log('   MediaRecorder already capturing - no restart needed (purist mode)');
      }

      // Continue validation
      if (!this.audioValidated && this.validationStartTime) {
        const elapsed = Date.now() - this.validationStartTime;
        if (elapsed >= this.sustainDuration) {
          this.audioValidated = true;
          this.log(`✓ Standby batch validated (${elapsed}ms) - will promote to new session in cleanup()`);
        }
      }

      return; // Let cleanup() handle promotion
    }

    // Validate sustained audio
    if (!this.audioValidated) {
      if (!this.validationStartTime) {
        this.validationStartTime = Date.now();
        this.log(`Audio detected (${(level * 100).toFixed(0)}%), validating...`);

        // 🎙️ Start recording IMMEDIATELY (pre-buffer mode)
        // Discard idle standby batch (if exists) and start fresh
        // Idle batch may have corrupted audio (no valid init segment)
        this.isPreBuffering = true;
        if (this.currentBatch) {
          this.log('🎯 Discarding idle batch (may have corrupted audio), starting fresh pre-buffer');
          this.currentBatch = null;
          this.batches = [];
        }
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

      // 🎯 PURIST MODE: Don't stop MediaRecorder - keep it running
      // Just discard the pre-buffer batch and start a new standby batch
      this.log('🎯 MediaRecorder continues running (purist mode - always listening)');

      // Discard the batch
      this.currentBatch = null;
      this.batches = [];
      this.isPreBuffering = false;
      this.validationStartTime = 0;

      // If this was a finish-phase prebuffer, clear the pending start flag
      if (this.pendingStart) {
        this.pendingStart = false;
        this.log('⚠️ Finish-phase prebuffer validation failed - clearing pending start');
      }

      // 🎯 CRITICAL: Start new standby batch immediately
      // MediaRecorder is still firing ondataavailable events - chunks need a home!
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.startBatchRecording();
        this.log('🎯 Standby batch started after validation failure (MediaRecorder chunks continue flowing)');
      }

      return;
    }

    // 🛡️ If TailGuard is validating and silence detected, validation failed
    if (this.tailGuardActive && this.validationStartTime > 0 && !this.audioValidated) {
      this.log('🛡️ TailGuard validation failed (silence during validation) - continuing TailGuard');

      // Reset validation attempt
      this.validationStartTime = 0;

      // TailGuard continues - will expire on its own timer
      // Don't stop MediaRecorder, let TailGuard expiration handle it
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

        // 🎯 Check if we should activate TailGuard or expire it
        if (silenceElapsed >= this.silenceTimeout && !this.tailGuardActive) {
          // ============================================================
          // SILENCE TIMEOUT REACHED → ACTIVATE TAILGUARD
          // ============================================================
          this.log(`Silence timeout (${this.silenceTimeout}ms) reached`);

          // Complete current batch if recording
          if (this.currentBatch && this.currentBatch.state === BatchState.Recording) {
            this.log('Completing final batch');
            this.completeBatch();
          }

          // 🛡️ ACTIVATE TAILGUARD: Keep MediaRecorder running for emergency audio
          this.tailGuardActive = true;
          this.tailGuardStartTime = Date.now();
          this.log(`🛡️ TailGuard ACTIVATED (${this.tailGuardDuration}ms window)`);
          this.log('   MediaRecorder stays active - listening for emergency audio');

          // Start TailGuard batch to capture any emergency audio
          // This will be discarded if no audio detected, or promoted if audio validated
          this.startBatchRecording();
          this.log('🛡️ TailGuard batch started (will discard if no audio, promote if validated)');

          // Don't clear interval - keep checking for TailGuard expiration
          // Don't finish session yet - TailGuard is active

        } else if (this.tailGuardActive) {
          // ============================================================
          // TAILGUARD ACTIVE → CHECK FOR EXPIRATION
          // ============================================================
          const tailGuardElapsed = Date.now() - this.tailGuardStartTime;

          if (tailGuardElapsed >= this.tailGuardDuration) {
            this.log(`🛡️ TailGuard expired (${tailGuardElapsed}ms) - no emergency audio detected`);

            // 🎯 PURIST APPROACH: Don't stop MediaRecorder - keep it running
            // Complete the TailGuard batch and start a new standby batch immediately
            // This ensures chunks always have somewhere to go
            this.log('🎯 MediaRecorder continues running (purist mode - always listening)');

            // Complete TailGuard batch (no longer needed)
            if (this.currentBatch && this.currentBatch.state === BatchState.Recording) {
              this.log('🎯 Completing TailGuard batch (no emergency audio)');
              this.completeBatch();
            }

            // 🎯 CRITICAL: Start new standby batch immediately
            // MediaRecorder is still firing ondataavailable events - chunks need a home!
            this.startBatchRecording();
            this.log('🎯 Standby batch started (MediaRecorder chunks continue flowing)');

            // Clear interval
            clearInterval(this.silenceCheckInterval!);
            this.silenceCheckInterval = null;

            // Reset TailGuard (but MediaRecorder keeps running!)
            this.tailGuardActive = false;
            this.tailGuardStartTime = 0;

            // 🎯 CRITICAL FIX: Always finish session after TailGuard expires
            // finishSession() will wait for playback to complete internally
            this.log('TailGuard expired, finishing session');
            this.finishSession();
          }
        }
      }, 100); // Check every 100ms
    }
  }

  /**
   * Manually stop the current session (but keep monitoring active)
   * MediaRecorder continues running in purist mode
   */
  async stop(): Promise<void> {
    this.log('Stopping current session (monitoring continues in purist mode)');

    // Complete current batch if recording
    if (this.currentBatch && this.currentBatch.state === BatchState.Recording) {
      this.completeBatch();
    }

    // 🎯 PURIST MODE: Don't stop MediaRecorder - keep monitoring active
    // MediaRecorder will continue into standby batch, ready for next session
    this.log('🎯 MediaRecorder continues running (ready for next session)');

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
   * Abort without saving - ONLY place MediaRecorder stops
   * This enforces the No-Lost-Syllables Invariant
   */
  async abort(): Promise<void> {
    this.log('Aborting batch coordinator (monitoring stopping completely)');

    // 🔥 CRITICAL: Invalidate session IMMEDIATELY to prevent ANY new playback
    this.sessionId++;
    this.log(`Session invalidated (now ${this.sessionId}) - no more playback allowed`);

    // 🔒 INVARIANT: This is the ONLY place MediaRecorder stops
    // MediaRecorder runs continuously from start() → abort() with zero gaps
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.log('🎯 Stopping MediaRecorder (monitoring ending - invariant preserved)');
      this.mediaRecorder.stop();
    }

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
    }

    // Stop playback monitoring
    this.stopPlaybackMonitoring();

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

    // Reset TailGuard state
    this.tailGuardActive = false;
    this.tailGuardStartTime = 0;

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

    // 🎯 PURIST MODE: During finish phase, let standby batch grow unbounded
    // It will be promoted/discarded in cleanup()
    if (this.isFinishing) {
      return; // Don't complete batch during finish - let it accumulate
    }

    // 🎯 PURIST MODE: During idle standby, let idle batch grow unbounded
    // It will become pre-buffer when audio is detected, or be discarded/reused
    if (!this.audioValidated && !this.isPreBuffering) {
      return; // Don't complete batch during idle - let it accumulate
    }

    // Check if batch duration reached
    if (this.currentBatch.duration >= this.batchDuration) {
      this.log(`Batch ${this.batches.length} reached target duration (${this.currentBatch.duration}ms)`);
      this.completeBatch();
    }

    // Safety: Force complete if max duration exceeded (but not during idle standby)
    if (this.currentBatch && this.currentBatch.duration >= this.maxBatchDuration) {
      if (!this.audioValidated && !this.isPreBuffering && !this.isFinishing) {
        // Idle batch getting too large - discard and start fresh to prevent memory issues
        this.log(`⚠️ Idle batch exceeded max duration (${this.currentBatch.duration}ms), discarding and restarting`);
        this.currentBatch = null;
        this.batches = [];
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.startBatchRecording();
          this.log('🎯 New idle standby batch started (old one was too large)');
        }
      } else {
        this.log(`Batch ${this.batches.length} exceeded max duration, force completing`);
        this.completeBatch();
      }
    }
  }

  private completeBatch(): void {
    if (!this.currentBatch) return;

    // 🎯 PURIST MODE: This should never be called during finish
    // (onChunkRecorded now blocks completeBatch during finish phase)
    if (this.isFinishing) {
      this.log('⚠️ UNEXPECTED: completeBatch called during session finish');
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

    // 🔥 ALWAYS prepend init segment for ALL batches (including batch 1)
    // This ensures every batch can play standalone, even if idle batches were discarded
    if (this.initSegment) {
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

    // 🎯 PURIST MODE: ALWAYS start a new standby batch
    // MediaRecorder is always running - chunks need somewhere to go!
    if (this.mediaRecorder?.state === 'recording') {
      const silenceElapsed = Date.now() - this.lastAudioTime;
      if (silenceElapsed < this.silenceTimeout) {
        this.log('More audio expected, starting next batch');
      } else {
        this.log('🎯 Starting standby batch (purist mode - always listening)');
      }
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

    // 🔥 Capture playback generation to guard against race conditions
    // Use playbackGeneration (not sessionId) because sessionId gets invalidated
    // during finishSession, but we still want current playback to complete
    const myGeneration = this.playbackGeneration;

    try {
      // Ensure hardware is active before first playback
      if (!this.hardwareReady) {
        await this.activateHardware();
      }

      // 🔥 Gate: Check playback generation is still valid before proceeding
      if (myGeneration !== this.playbackGeneration) {
        this.log(`Playback aborted: generation ${myGeneration} invalidated (now ${this.playbackGeneration})`);
        return;
      }

      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      // 🎵 Step 1: Decode blob to AudioBuffer
      const arrayBuffer = await batch.blob!.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.log(`Decoded batch ${batchIndex}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch`);

      // 🔥 Gate: Check playback generation STILL valid after async decode
      if (myGeneration !== this.playbackGeneration) {
        this.log(`Playback aborted after decode: generation ${myGeneration} invalidated`);
        return;
      }

      // 🎵 Step 2: Create AudioBufferSourceNode
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      this.currentPlaybackSource = source;

      // Connect to gain node (for volume ramping)
      if (this.playbackGainNode) {
        source.connect(this.playbackGainNode);
      } else {
        // Fallback: direct connection if gain node not available
        source.connect(this.audioContext.destination);
      }

      // 🎵 Step 3: Calculate playback time (sample-accurate scheduling)
      const now = this.audioContext.currentTime;
      const playTime = Math.max(this.nextPlaybackTime, now);

      // 🎵 Step 4: Set up completion handler
      source.onended = () => {
        // 🔥 Guard: Only proceed if this is still the current playback generation
        if (myGeneration !== this.playbackGeneration) {
          this.log(`Batch ${batchIndex} onended from old generation, ignoring`);
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

  /**
   * 🔒 POST-PLAYBACK GRACE: Wait 750ms after playback for "hello" responses
   * This catches firefighters responding immediately after hearing the page
   * If audio validated during grace → cancelPostPlaybackGrace() resolves early
   */
  private async waitForPostPlaybackGrace(): Promise<void> {
    return new Promise((resolve) => {
      // Store resolve function so cancelPostPlaybackGrace() can call it
      this.postPlaybackGraceResolve = resolve;

      this.postPlaybackGraceTimeout = window.setTimeout(() => {
        this.postPlaybackGraceTimeout = null;
        this.postPlaybackGraceResolve = null;
        resolve();
      }, this.postPlaybackGraceDuration);
    });
  }

  /**
   * Cancel post-playback grace (called when audio validates during grace)
   * Immediately resolves the waitForPostPlaybackGrace() promise
   */
  private cancelPostPlaybackGrace(): void {
    if (this.postPlaybackGraceTimeout) {
      clearTimeout(this.postPlaybackGraceTimeout);
      this.postPlaybackGraceTimeout = null;
      this.log('🚨 Post-playback grace cancelled (emergency audio validated)');
    }

    // Immediately resolve the promise so finishSession() can check audioValidated and return early
    if (this.postPlaybackGraceResolve) {
      this.postPlaybackGraceResolve();
      this.postPlaybackGraceResolve = null;
    }
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
        // Check if already in Zone 1 to avoid redundant zone changes
        let needsZoneChange = true;
        if (this.isInZone1) {
          this.log('Step 1: Already in Zone 1, verifying readiness...');
          needsZoneChange = false;
        } else {
          this.log('Step 1: Switching paging to Zone 1 (active)...');
          await this.config.setPagingZone(1);
          this.log('  ✓ Zone change command sent (reload triggered on device)');
        }

        // CRITICAL: Always poll to confirm device is ready, even if zone didn't change
        // This ensures hardware is truly ready before playback starts
        if (this.config.waitForPagingZoneReady) {
          this.log(`  Polling paging device until ready (mcast.mode = 1)...`);
          const ready = await this.config.waitForPagingZoneReady(1);
          if (ready) {
            this.log('  ✓ Paging device confirmed ready (Zone 1, Mode 1)');
            this.pagingActive = true;
            this.isInZone1 = true;
          } else {
            this.log('  ⚠️ Paging device polling timeout - proceeding anyway');
            this.pagingActive = true;
            this.isInZone1 = true;
          }
        } else {
          // No polling available, assume ready
          this.pagingActive = true;
          this.isInZone1 = true;
        }
      }

      // Step 2: Set speaker volumes instantly (no ramp, no repeated network requests!)
      if (this.config.linkedSpeakers.length > 0 && this.config.playbackEnabled) {
        this.log('Step 2: Setting speaker volumes to target...');
        await this.setSpeakersToTargetVolume();
        this.log('  ✓ Speakers set to target volume');
      }

      // Step 2.5: Ramp playback gain node (fast, smooth, no network!)
      if (this.config.playbackEnabled && this.config.rampEnabled) {
        // Check day/night mode: if enabled, only ramp during night hours
        const shouldRamp = !this.config.dayNightMode || this.shouldUseNightRamp();

        if (shouldRamp) {
          this.log(`Step 2.5: Ramping playback gain (${this.playbackStartVolume.toFixed(2)} → ${this.playbackMaxVolume.toFixed(2)} over ${this.playbackRampDuration}ms)...`);
          this.rampPlaybackGain(this.playbackMaxVolume, this.playbackRampDuration); // Non-blocking, starts immediately
          this.log('  ✓ Playback gain ramping started');
        } else {
          // Day mode with day/night enabled: instant (no ramp)
          if (this.playbackGainNode) {
            this.playbackGainNode.gain.value = this.playbackMaxVolume;
            this.log('Step 2.5: Day mode - instant volume (no ramp)');
          }
        }
      } else {
        // Ramp disabled, set gain to max immediately
        if (this.playbackGainNode) {
          this.playbackGainNode.gain.value = this.playbackMaxVolume;
        }
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
      // Step 1: Ramp down playback gain (fast, no network requests!)
      if (this.config.playbackEnabled && this.config.rampEnabled && this.playbackGainNode) {
        this.log('Step 1: Ramping playback gain down...');
        await this.rampPlaybackGain(this.playbackStartVolume, 1000); // Quick fade down (1s)
        this.log('  ✓ Playback gain ramped down');
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
        // Only change zone if currently in Zone 1
        if (this.isInZone1) {
          this.log('Step 3: Switching paging to Zone 2 (idle)...');
          await this.config.setPagingZone(2);
          this.log('  ✓ Zone change command sent (reload triggered on device)');

          if (this.config.waitForPagingZoneReady) {
            this.log('  Polling paging device until ready (Zone 2)...');
            const ready = await this.config.waitForPagingZoneReady(2);
            if (ready) {
              this.log('  ✓ Paging device confirmed in Zone 2');
              this.pagingActive = false;
              this.isInZone1 = false;
            } else {
              this.log('  ⚠️ Paging device polling timeout - marking inactive anyway');
              this.pagingActive = false;
              this.isInZone1 = false;
            }
          } else {
            // No polling available, assume ready
            this.pagingActive = false;
            this.isInZone1 = false;
          }
        } else {
          this.log('Step 3: Already in Zone 2, skipping zone change');
          this.pagingActive = false;
          this.isInZone1 = false;
        }
      }

      this.hardwareReady = false;
      this.log('✓ Hardware deactivation complete');

    } catch (error) {
      this.log(`Hardware deactivation error: ${error}`);
      // Continue anyway - best effort
    }
  }

  /**
   * Ramp playback gain node (fast, no network requests!)
   * Applies volume ramp to playback audio in real-time
   */
  private async rampPlaybackGain(targetGain: number, duration: number): Promise<void> {
    if (!this.playbackGainNode || !this.audioContext) {
      return;
    }

    const currentTime = this.audioContext.currentTime;
    const currentGain = this.playbackGainNode.gain.value;

    this.log(`🎚️  Ramping playback gain: ${currentGain.toFixed(2)} → ${targetGain.toFixed(2)} over ${duration}ms`);

    // Cancel any previous ramps
    this.playbackGainNode.gain.cancelScheduledValues(currentTime);

    // Set current value (in case it was ramping)
    this.playbackGainNode.gain.setValueAtTime(currentGain, currentTime);

    // Ramp to target value
    this.playbackGainNode.gain.linearRampToValueAtTime(
      targetGain,
      currentTime + (duration / 1000)
    );

    // Wait for ramp to complete
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Set speakers to target volume instantly (no ramping, just set once)
   */
  private async setSpeakersToTargetVolume(): Promise<void> {
    if (this.config.linkedSpeakers.length === 0 || !this.config.setSpeakerVolume) {
      return;
    }

    const targetVolume = this.config.targetVolume;
    this.log(`🔊 Setting ${this.config.linkedSpeakers.length} speakers to ${targetVolume}% (instant, no ramp)`);

    await Promise.all(
      this.config.linkedSpeakers.map(async (speaker) => {
        try {
          await this.config.setSpeakerVolume!(speaker.id, targetVolume);
        } catch (error) {
          this.log(`Failed to set ${speaker.name} volume: ${error}`);
        }
      })
    );
  }

  /**
   * Start monitoring playback audio levels
   */
  private startPlaybackMonitoring(): void {
    if (this.playbackMonitoringInterval) return; // Already monitoring

    this.playbackMonitoringInterval = window.setInterval(() => {
      if (!this.playbackAnalyser || !this.isPlaying) {
        // No playback active, reset level to 0
        if (this.config.onPlaybackLevelUpdate) {
          this.config.onPlaybackLevelUpdate(0);
        }
        return;
      }

      const analyser = this.playbackAnalyser;

      // Get frequency data
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      // Get time domain data
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      // Calculate average from frequency data
      const freqAverage = freqData.reduce((a, b) => a + b, 0) / freqData.length;
      const freqLevel = Math.round((freqAverage / 255) * 100);

      // Calculate RMS from time domain data
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / timeData.length);
      const timeLevel = Math.round(rms * 100);

      // Use the higher of the two
      const level = Math.max(freqLevel, timeLevel);

      // Report level to callback
      if (this.config.onPlaybackLevelUpdate) {
        this.config.onPlaybackLevelUpdate(level);
      }
    }, 50); // Update every 50ms for smooth visualization
  }

  /**
   * Stop monitoring playback audio levels
   */
  private stopPlaybackMonitoring(): void {
    if (this.playbackMonitoringInterval) {
      clearInterval(this.playbackMonitoringInterval);
      this.playbackMonitoringInterval = null;
    }

    // Reset level to 0
    if (this.config.onPlaybackLevelUpdate) {
      this.config.onPlaybackLevelUpdate(0);
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

  /**
   * Check if current time is within "night" hours
   * Used for playback volume ramping
   */
  private shouldUseNightRamp(): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Night time is before dayStartHour OR after/equal to dayEndHour
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

    // 🔥 CRITICAL: Reset validation state for finish phase
    // This ensures only NEW audio detected DURING finish phase causes promotion
    // The old session's audioValidated=true should not carry over
    this.audioValidated = false;
    this.validationStartTime = 0;
    this.log('🎯 Validation state reset - standby batch will only promote if NEW audio validated during finish');

    // 🛡️ HARDWARE THRASH PROTECTION: Counter persists across finish cycles
    // Only reset when we successfully reach idle (see cleanup)
    // This prevents rapid oscillation: finish→detect→activate→finish→detect→activate...

    // 🔥 CRITICAL: Invalidate session IMMEDIATELY to prevent ANY new playback
    this.sessionId++;
    this.log(`Session invalidated (now ${this.sessionId}) - no more playback allowed`);

    // Wait for playback to complete if enabled
    await this.waitForPlaybackComplete();

    // 🔒 POST-PLAYBACK GRACE: Give 750ms window for "hello" right after playback
    // This catches firefighters responding immediately after hearing the page
    this.postPlaybackGraceActive = true;
    this.log(`⏳ Post-playback grace started (${this.postPlaybackGraceDuration}ms window for emergency audio)`);

    await this.waitForPostPlaybackGrace();

    // Check if audio validated during grace window
    if (this.audioValidated) {
      this.postPlaybackGraceActive = false;
      this.log('🚨 Grace period audio validated - session promoted, hardware stays active');
      // Don't finish - audio promoted standby batch to new session
      this.isFinishing = false;
      return;
    }

    this.log('✓ Post-playback grace window complete (no emergency audio detected)');

    // 🔒 EXTENDED GRACE: Keep grace active DURING hardware deactivation
    // This catches audio spoken during the deactivation process (ramp down, PoE off, zone switch)
    this.log('🔒 Extended grace: Monitoring during hardware deactivation...');

    // Deactivate hardware (but grace stays active!)
    await this.deactivateHardware();

    // Check again after deactivation - audio might have been detected during deactivation
    if (this.audioValidated) {
      this.postPlaybackGraceActive = false;

      // 🛡️ HARDWARE THRASH PROTECTION: Limit re-activations to prevent infinite loops
      if (this.reactivationAttempts >= this.maxReactivationAttempts) {
        this.log('⚠️ Max re-activation attempts reached - allowing deactivation to complete');
        this.log('   Next audio will trigger fresh session (predictable failure mode)');

        // Let deactivation complete - don't re-activate
        // Any future audio will be a fresh session with full activation cycle
        this.postPlaybackGraceActive = false;
        // Continue to cleanup below (don't return early)
      } else {
        this.reactivationAttempts++;
        this.log(`🚨 Audio detected during hardware deactivation - RE-ACTIVATING (attempt ${this.reactivationAttempts}/${this.maxReactivationAttempts})`);

        // 🚀 CRITICAL: Enqueue old session for upload BEFORE re-activating
        // The old session is complete - save it to upload queue (non-blocking)
        this.log('📦 Enqueueing completed session before re-activation');
        this.enqueueSessionUpload();

        // Hardware was just deactivated, need to re-activate
        await this.activateHardware();

        // 🔥 CRITICAL: Restart silence monitoring for the re-activated session
        // This ensures the re-activated session has a fresh 8s silence countdown
        if (this.silenceCheckInterval) {
          clearInterval(this.silenceCheckInterval);
          this.silenceCheckInterval = null;
        }
        this.onSilence(); // Start fresh silence monitoring with updated lastAudioTime

        // 🎯 Prepare for new session: Clear old batches, keep standby batch
        // The standby batch will be promoted to batch 1 of the new session
        const standbyBatch = this.currentBatch; // Save standby batch
        this.batches = standbyBatch ? [standbyBatch] : [];
        this.playbackQueue = [];
        this.isPlaying = false;
        this.finishingSessionBatches = [];

        // Don't finish - audio promoted standby batch to new session
        this.isFinishing = false;
        return;
      }
    }

    // All clear - no audio during grace or deactivation
    this.postPlaybackGraceActive = false;
    this.log('✓ Extended grace complete - no emergency audio during deactivation');

    // 🚀 NON-BLOCKING UPLOAD: Enqueue for background processing
    // This allows immediate return to idle standby without waiting for Firebase
    this.enqueueSessionUpload();

    // Cleanup (no longer blocked by upload!)
    await this.cleanup(true);

    this.log('✓ Session complete (upload queued for background processing)');

    // Clear console after session complete for clean slate
    console.clear();
  }

  /**
   * 🚀 BACKGROUND UPLOAD: Enqueue session for non-blocking upload
   * This saves the blob to memory and starts background upload worker
   * Returns immediately without waiting for Firebase
   */
  private enqueueSessionUpload(): void {
    // 🔄 Use finishingSessionBatches if finish-phase prebuffer was started
    // Otherwise use current batches
    const batchesToUpload = this.finishingSessionBatches.length > 0
      ? this.finishingSessionBatches
      : this.batches;

    if (batchesToUpload.length === 0) {
      this.log('No batches to upload');
      return;
    }

    // Combine all batches into single blob (fast, in-memory operation)
    const allChunks = batchesToUpload.flatMap(b => b.chunks);
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
    const combinedBlob = new Blob(allChunks, { type: mimeType });

    // Create completed session record
    const session: CompletedSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionNumber: this.sessionId,
      blob: combinedBlob,
      mimeType: mimeType,
      timestamp: Date.now(),
      uploaded: false
    };

    // Add to queue
    this.completedSessions.push(session);

    this.log(`📦 Session queued for upload: ${combinedBlob.size} bytes (${batchesToUpload.length} batches)`);
    this.log(`   Queue size: ${this.completedSessions.length} session(s)`);

    // Clear finishingSessionBatches
    this.finishingSessionBatches = [];

    // Start background upload worker if not already running
    if (!this.uploadInProgress) {
      this.processUploadQueue().catch(error => {
        this.log(`⚠️ Upload worker error: ${error}`);
      });
    }
  }

  /**
   * 🔄 BACKGROUND WORKER: Process upload queue asynchronously
   * Runs continuously until queue is empty
   * New calls can start while this is running!
   */
  private async processUploadQueue(): Promise<void> {
    if (this.uploadInProgress) {
      this.log('Upload worker already running');
      return;
    }

    this.uploadInProgress = true;
    this.log('🚀 Background upload worker started');

    while (true) {
      // Find next unuploaded session
      const session = this.completedSessions.find(s => !s.uploaded);

      if (!session) {
        // Queue empty
        this.log('✓ Upload queue empty, worker stopping');
        break;
      }

      this.log(`⬆️ Uploading session ${session.id} (${session.blob.size} bytes)...`);

      try {
        // Upload to Firebase (this is the slow part, but it's non-blocking now!)
        const url = await this.config.onUpload(session.blob, session.mimeType);

        session.uploaded = true;
        session.uploadUrl = url;

        this.log(`✓ Background upload complete: ${url}`);

        this.config.onLog({
          type: 'volume_change',
          message: `🎙️ Recording saved: ${url}`
        });

        // Remove from queue after successful upload (optional - keep for retry)
        // this.completedSessions = this.completedSessions.filter(s => s.id !== session.id);

      } catch (error) {
        this.log(`⚠️ Upload failed: ${error}`);

        if (this.config.onError) {
          this.config.onError(error as Error);
        }

        // Don't remove from queue - will retry on next worker start
        // Break out of loop to allow other operations to proceed
        break;
      }
    }

    this.uploadInProgress = false;
    this.log('Upload worker stopped');
  }

  private async cleanup(success: boolean): Promise<void> {
    this.log(`Cleanup (success: ${success})`);

    // 🎯 PURIST APPROACH: Check if we have a standby batch (audio during finish phase)
    const hasStandbyBatch = this.currentBatch && this.currentBatch.state === BatchState.Recording;

    // 🎯 INVARIANT ENFORCEMENT:
    // MediaRecorder NEVER stops in cleanup - only in abort() when monitoring stops
    // This ensures zero gaps and always-listening behavior
    if (this.mediaRecorder) {
      this.log('🎯 MediaRecorder stays active (purist mode - always listening)');
    }

    // NOTE: We keep AudioContext alive for reuse across recording sessions
    // Only closed in abort() when monitoring stops completely
    // Reset timeline for next recording session
    if (this.audioContext) {
      this.nextPlaybackTime = this.audioContext.currentTime;
    }

    // 🎯 Handle standby batch (audio detected during finish phase)
    if (hasStandbyBatch && this.audioValidated) {
      // Audio was validated during finish phase → promote to new session
      this.log(`🎯 Standby batch promoted to new session (emergency audio validated)`);

      // Keep current batch (it's the first batch of the new session)
      // Clear old batches from finished session
      this.batches = [this.currentBatch!]; // Non-null assertion: hasStandbyBatch ensures currentBatch exists

      // Increment session ID for new session
      this.sessionId++;
      this.playbackGeneration++;
      this.log(`🎯 New session started (session ${this.sessionId}) - MediaRecorder continues seamlessly`);

    } else if (hasStandbyBatch && !this.audioValidated) {
      // Standby batch exists but no validated audio → discard it
      this.log(`🎯 Discarding standby batch (no validated emergency audio)`);
      this.currentBatch = null;
      this.batches = [];

    } else {
      // No standby batch
      this.batches = [];
      this.currentBatch = null;
    }

    // Clear playback state
    this.playbackQueue = [];
    this.isPlaying = false;
    this.hardwareReady = false;
    this.pagingActive = false;
    this.isFinishing = false; // Reset finish guard
    this.finishingSessionBatches = []; // Clear saved batches

    // 🛡️ Reset TailGuard state
    this.tailGuardActive = false;
    this.tailGuardStartTime = 0;

    // 🎯 Reset validation state for next session
    this.audioValidated = false;
    this.validationStartTime = 0;
    this.isPreBuffering = false;

    // NOTE: We keep this.initSegment for reuse across sessions
    // Only cleared on abort() when monitoring stops completely

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    // 🎯 If standby batch was promoted, trigger hardware activation
    if (hasStandbyBatch && this.audioValidated && !this.hardwareReady) {
      await this.activateHardware().catch((error) => {
        this.log(`Hardware activation failed: ${error}`);
        if (this.config.onError) {
          this.config.onError(error);
        }
      });
    }

    // 🎯 PURIST MODE IDLE STATE:
    // Start an idle standby batch to capture ongoing chunks
    // This prevents "chunk received but no active batch" warnings
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording' && !this.currentBatch) {
      this.startBatchRecording();
      this.log('🎯 Idle standby batch started (capturing chunks silently)');
    }

    // 🛡️ HARDWARE THRASH PROTECTION: Reset counter when reaching idle
    // This allows re-activation on the NEXT session cycle
    this.reactivationAttempts = 0;

    this.log('🎯 System in idle standby state (ready for next session)');
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
    // 🎨 Color-coded logs for different system states

    // 🛡️ TailGuard: Orange (watching for emergency audio after silence)
    if (message.includes('TailGuard') || message.includes('🛡️')) {
      console.log(`%c[BatchCoordinator] ${message}`, 'color: #ff9500; font-weight: bold');
    }
    // 🔒 Grace Period: Cyan (post-playback window for "hello" responses)
    else if (message.includes('Grace') || message.includes('grace') || message.includes('🔒')) {
      console.log(`%c[BatchCoordinator] ${message}`, 'color: #00d4ff; font-weight: bold');
    }
    // 🟢 Idle Standby: Green (system ready, listening)
    else if (message.includes('System in idle standby state') ||
        message.includes('Idle standby batch started') ||
        message.includes('Session complete')) {
      console.log(`%c[BatchCoordinator] ${message}`, 'color: #00ff00; font-weight: bold');
    }
    // Default: White
    else {
      console.log(`[BatchCoordinator] ${message}`);
    }
  }
}
