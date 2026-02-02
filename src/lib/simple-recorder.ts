/**
 * SimpleRecorder - Clean Producer/Consumer Architecture
 *
 * Three independent loops:
 * 1. Recording Loop (Producer) - Always on, creates 5s batches
 * 2. Playback Worker (Consumer) - Always listening, drains queue
 * 3. Save Worker - Async, non-blocking
 *
 * INVARIANTS (NEVER VIOLATE):
 * - Recording NEVER waits for playback
 * - Playback NEVER decides what gets recorded
 * - Hardware delays ONLY block playback, NEVER recording
 * - Batch queue is append-only, FIFO, never cleared except after playback
 * - Session metadata created at FIRST AUDIO DETECTION (not playback time)
 */

import { RingBuffer } from './ring-buffer';

// ============================================================================
// Types
// ============================================================================

interface AudioBatch {
  id: string;
  blob: Blob; // For playback (init segment + chunks)
  chunks: Blob[]; // Raw chunks (for saving without init segment duplication)
  duration: number;
  timestamp: number; // When batch was sealed
  sessionId: string; // Reference to session metadata
}

interface SessionMetadata {
  sessionId: string;
  firstDetectedAt: string; // ISO 8601 in PST
  timezone: string;
  firstBatchId: string;
  batches: AudioBatch[];
  playbackStartTime?: number;
  playbackEndTime?: number;
}

interface SaveQueueItem {
  session: SessionMetadata;
  retryCount: number;
  lastAttempt?: number;
}

interface SimpleRecorderConfig {
  // Audio settings
  batchDuration?: number; // Default: 5000ms
  silenceTimeout?: number; // CONFIGURABLE: 0-30000ms (when to stop batching after silence)
                          // 0ms = stop immediately (new session per pause)
                          // Higher = more forgiving pauses in same session
  audioThreshold?: number; // Audio level threshold (0-100) to trigger voice detection (default: 5)
  sustainDuration?: number; // How long audio must stay above threshold (ms) before triggering (default: 500)

  // Hardware settings
  linkedSpeakers: any[]; // Algo speakers to control
  pagingDevice: any; // Paging device
  playbackDelay?: number; // Delay before playback starts (for speaker stabilization)

  // Playback Volume Ramping (Web Audio API - non-blocking)
  playbackVolume?: number; // Static playback volume (0.0 - 2.0) when NOT ramping
  playbackRampEnabled?: boolean; // Enable volume ramping per session
  playbackRampStartVolume?: number; // Starting volume (0.0 - 2.0)
  playbackRampTargetVolume?: number; // Target volume (0.0 - 2.0)
  playbackRampDuration?: number; // Ramp duration in ms
  playbackRampScheduleEnabled?: boolean; // Enable time-based ramping schedule
  playbackRampStartHour?: number; // Start hour for ramping (0-23.5, supports half hours)
  playbackRampEndHour?: number; // End hour for ramping (0-23.5, supports half hours)

  // Emulation Mode (for testing without physical devices)
  emulationMode?: boolean; // Skip actual network calls
  emulationNetworkDelay?: number; // Simulate network delay in ms

  // Saving
  saveRecording?: boolean;
  uploadCallback?: (blob: Blob, filename: string, sessionId: string) => Promise<string>;

  // Callbacks
  onLog?: (message: string, type: 'info' | 'error' | 'warning') => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
  onPlaybackLevel?: (level: number) => void;

  // Hardware Control Callbacks
  setSpeakerZoneIP?: (speakers: any[], zoneIP: string) => Promise<void>; // Set mcast.zone1 IP:port
  setSpeakerVolume?: (speakerId: string, volumePercent: number) => Promise<void>;
}

// Internal config type with required properties
type InternalConfig = Required<Pick<SimpleRecorderConfig, 'batchDuration' | 'silenceTimeout' | 'playbackDelay' | 'saveRecording' | 'emulationMode' | 'emulationNetworkDelay'>> &
  Omit<SimpleRecorderConfig, 'batchDuration' | 'silenceTimeout' | 'playbackDelay' | 'saveRecording' | 'emulationMode' | 'emulationNetworkDelay'>;

// ============================================================================
// Hardware State Management
// ============================================================================

enum HardwareState {
  IDLE = 'IDLE',
  ACTIVATING = 'ACTIVATING',
  ACTIVE = 'ACTIVE',
  DEACTIVATING = 'DEACTIVATING'
}

// ============================================================================
// SimpleRecorder Class
// ============================================================================

// Audio Time-To-Live (TTL) - Maximum age for buffered audio
const MAX_AUDIO_AGE_MS = 60000; // 60 seconds - audio older than this is invalid

export class SimpleRecorder {
  // Configuration
  private config: InternalConfig;

  // Audio Input (recording)
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private audioLevelInterval: number | null = null;

  // PCM Capture (for live playback - bypasses encoding)
  private pcmWorkletNode: AudioWorkletNode | null = null;
  private pcmRingBuffer: RingBuffer | null = null; // TRUE ring buffer (circular array of samples)
  private pcmPlaybackNode: ScriptProcessorNode | null = null; // Continuous audio callback
  private pcmPlaybackEnabled: boolean = false;
  private pcmPlaybackStarted: boolean = false; // Track if delay period has passed
  private pcmSessionRamped: boolean = false; // Track if this session has been ramped (only ramp once per session)
  private hasReceivedRealAudio: boolean = false; // Track if worklet has received non-zero audio samples
  private ringBufferFirstSampleTime: number = 0; // Timestamp of first sample in buffer (for TTL)

  // Audio Output (playback monitoring)
  private playbackAnalyserNode: AnalyserNode | null = null;
  private playbackGainNode: GainNode | null = null;
  private playbackLevelInterval: number | null = null;
  private desiredPlaybackVolume: number = 1.0; // Track desired volume even when GainNode doesn't exist
  private nextScheduledStartTime: number = 0; // Sample-accurate scheduling for seamless playback

  // Recording Loop State
  private isMonitoring: boolean = false;
  private isBatching: boolean = false; // Are we currently creating batches?
  private currentBatch: AudioBatch | null = null;
  private currentChunks: Blob[] = [];
  private batchStartTime: number = 0;
  private lastAudioTime: number = 0;

  // WebM Initialization Segment (200ms silent pre-roll for ALL batches)
  private initSegment: Blob | null = null;

  // Session Metadata
  private currentSessionId: string | null = null; // Current active session ID
  private currentSessionMeta: SessionMetadata | null = null;
  private sessionMetaStore: Map<string, SessionMetadata> = new Map();

  // Batch Queue (FIFO, append-only)
  private batchQueue: AudioBatch[] = [];
  private batchQueueResolvers: Array<() => void> = [];

  // Playback Worker State
  private isPlaybackActive: boolean = false;
  private hardwareState: HardwareState = HardwareState.IDLE;
  private hardwareTransitionAbort: (() => void) | null = null; // To cancel deactivation if needed
  private currentlyPlaying: AudioBatch | null = null;
  private currentPlaybackSessionId: string | null = null; // Track which session playback is on

  // Save Queue (max 100 sessions)
  private saveQueue: SaveQueueItem[] = [];
  private readonly MAX_SAVE_SESSIONS = 100;
  private isSaving: boolean = false;

  // Silence detection
  private silenceCheckInterval: number | null = null;

  // Batch duration monitoring (manual flush at clean Opus boundaries)
  private batchDurationMonitorInterval: number | null = null;

  // Hardware idle timer (deactivate speakers after grace period)
  private hardwareIdleTimer: number | null = null;
  private readonly hardwareIdleDelay: number = 12000; // 12 seconds grace period

  // Audio threshold and sustain detection
  private audioAboveThresholdStart: number | null = null; // When audio first went above threshold
  private isAudioSustained: boolean = false; // Has audio been sustained long enough?

  // Status logging
  private statusLogInterval: number | null = null;
  private lastLoggedAudioLevel: number = 0;

  constructor(config: SimpleRecorderConfig) {
    this.config = {
      batchDuration: 5000,
      silenceTimeout: 8000,
      playbackDelay: 4000,
      audioThreshold: 0, // 0 = capture everything (no threshold)
      sustainDuration: 0, // User controls this via settings
      saveRecording: true,
      emulationMode: false,
      emulationNetworkDelay: 0,
      ...config,
    };

    // Initialize desired playback volume from config (defaults to 1.0 if not provided)
    this.desiredPlaybackVolume = this.config.playbackVolume ?? 1.0;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  async start(stream: MediaStream): Promise<void> {
    this.stream = stream;
    this.isMonitoring = true;

    this.log('SimpleRecorder started - monitoring active');

    // Initialize AudioContext for playback AND audio level monitoring
    this.audioContext = new AudioContext();
    this.log(`🎧 AudioContext: ${this.audioContext.sampleRate}Hz sample rate`);
    this.log(`🎧 AudioContext state: ${this.audioContext.state}`);

    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.log('⚠️  AudioContext suspended - attempting resume...');
      this.audioContext.resume().then(() => {
        this.log(`✓ AudioContext resumed - state: ${this.audioContext!.state}`);
      }).catch((error) => {
        this.log(`❌ Failed to resume AudioContext: ${error}`, 'error');
      });
    }

    // 🎯 Load AudioWorklet for PCM capture (bypass encoding)
    try {
      await this.audioContext.audioWorklet.addModule('/audio/pcm-capture.worklet.js');
      this.log('✓ PCM AudioWorklet loaded');
    } catch (error) {
      this.log(`⚠️ Failed to load PCM worklet: ${error}`, 'warning');
    }

    // Set up INPUT audio level monitoring (for recording)
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    // 🔥 Set up PCM capture (TAP ONLY - no playback yet)
    try {
      this.pcmWorkletNode = new AudioWorkletNode(this.audioContext, 'pcm-capture');

      // Create TRUE ring buffer (60 seconds for worst-case hardware delays + network issues)
      // 60s @ 48kHz mono Float32 = 11.52 MB (acceptable for emergency paging)
      const bufferDuration = 60; // seconds (absolute maximum for valid audio)
      const bufferSize = Math.floor(this.audioContext.sampleRate * bufferDuration);
      this.pcmRingBuffer = new RingBuffer(bufferSize);
      this.log(`✓ PCM ring buffer created: ${bufferDuration}s (${bufferSize} samples = ${(bufferSize * 4 / 1024 / 1024).toFixed(2)} MB)`);

      // 🔥 CRITICAL: Connect analyser → worklet (not source → worklet!)
      // Audio must flow THROUGH the graph for worklet to receive samples
      this.analyserNode.connect(this.pcmWorkletNode);

      // Handle PCM samples - push to TRUE ring buffer
      let messageCount = 0;
      let lastNonZeroPeak = 0;
      let lastNonZeroTime = 0;

      this.pcmWorkletNode.port.onmessage = (event) => {
        messageCount++;

        if (this.pcmRingBuffer) {
          const samples = event.data.samples as Float32Array;
          const peak = Math.max(...Array.from(samples).map(Math.abs));

          // Track non-zero peaks
          if (peak > 0.0001) {
            lastNonZeroPeak = peak;
            lastNonZeroTime = Date.now();

            // Flag that we've received real audio (not just silence/zeros)
            if (!this.hasReceivedRealAudio) {
              this.hasReceivedRealAudio = true;
              this.log(`🎤 First real audio detected in worklet! (peak: ${peak.toFixed(4)})`);
            }
          }

          // Log first message only (reduced spam)
          if (messageCount === 1) {
            this.log(`🎤 PCM Worklet: First message received (${samples?.length} samples, peak: ${peak.toFixed(4)})`);
          }
          // Removed: every 100th message logging (too spammy)

          // Track timestamp of first sample arriving in buffer (for TTL)
          if (this.ringBufferFirstSampleTime === 0 && this.pcmRingBuffer.getAvailable() === 0) {
            this.ringBufferFirstSampleTime = Date.now();
            this.log(`⏱️ Ring buffer TTL tracking started (max age: ${MAX_AUDIO_AGE_MS / 1000}s)`);
          }

          // Push samples to ring buffer (logging removed to reduce spam)
          this.pcmRingBuffer.push(samples);
        } else {
          if (messageCount === 1) {
            this.log(`⚠️ PCM Worklet: Ring buffer is null!`);
          }
        }
      };

      this.log('✓ PCM capture pipeline initialized');
    } catch (error) {
      this.log(`⚠️ PCM capture failed: ${error}`, 'warning');
    }

    // Log input device info
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const track = audioTracks[0];
      const settings = track.getSettings();
      this.log(`🎤 Input Device: ${track.label}`);
      this.log(`   Sample Rate: ${settings.sampleRate}Hz`);
      this.log(`   Channels: ${settings.channelCount}`);
    }

    // Set up OUTPUT audio level monitoring (for playback)
    this.playbackAnalyserNode = this.audioContext.createAnalyser();
    this.playbackAnalyserNode.fftSize = 256;

    // Set up GainNode for volume control
    this.playbackGainNode = this.audioContext.createGain();
    this.playbackGainNode.gain.value = this.desiredPlaybackVolume; // Use saved volume from slider

    // 🔥 CRITICAL: Connect playback chain - GainNode → Analyser → Destination
    // PCM sources will connect → GainNode, so we need this chain ready
    this.playbackGainNode.connect(this.playbackAnalyserNode);
    this.playbackAnalyserNode.connect(this.audioContext.destination);
    this.log(`🔊 Playback chain connected: GainNode (${(this.desiredPlaybackVolume * 100).toFixed(0)}%) → Analyser → Speakers`);

    // 🔥 Capture 200ms silent pre-roll for init segment (LIKE BATCH COORDINATOR)
    // IMPORTANT: Start monitoring when quiet (no "eh" sounds)!
    // This 200ms of SILENCE becomes the init segment for ALL batches
    await this.captureSilentPreRoll();

    // Start audio level monitoring loops
    this.startAudioLevelMonitoring();
    this.startPlaybackLevelMonitoring();

    // Start status logging (DISABLED - causes spam and memory leak)
    // this.startStatusLogging();

    // Start monitoring loop (always on)
    this.startMonitoringLoop();

    // Start playback worker (always listening)
    this.startPlaybackWorker();

    // Start save worker (if enabled)
    if (this.config.saveRecording) {
      this.startSaveWorker();
    }
  }

  async stop(): Promise<void> {
    this.log('🛑 ═══════════════════════════════════════');
    this.log('🛑 FORCE STOPPING SimpleRecorder');
    this.log('🛑 TOTAL SHUTDOWN - NO WAITING');
    this.log('🛑 ═══════════════════════════════════════');
    this.isMonitoring = false;

    // Stop all intervals immediately
    if (this.statusLogInterval) {
      clearInterval(this.statusLogInterval);
      this.statusLogInterval = null;
      this.log('✓ Status logging stopped');
    }

    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
      this.log('✓ Audio level monitoring stopped');
    }

    if (this.playbackLevelInterval) {
      clearInterval(this.playbackLevelInterval);
      this.playbackLevelInterval = null;
      this.log('✓ Playback level monitoring stopped');
    }

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
      this.log('✓ Silence detection stopped');
    }

    if (this.batchDurationMonitorInterval) {
      clearInterval(this.batchDurationMonitorInterval);
      this.batchDurationMonitorInterval = null;
      this.log('✓ Batch duration monitor stopped');
    }

    if (this.hardwareIdleTimer) {
      clearTimeout(this.hardwareIdleTimer);
      this.hardwareIdleTimer = null;
      this.log('✓ Hardware idle timer cleared');
    }

    // FORCE STOP batching (no sealing, no waiting)
    if (this.isBatching) {
      this.isBatching = false;
      this.log('🛑 FORCE stopped batching');
    }

    // FORCE STOP MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.log('🛑 FORCE stopping MediaRecorder...');
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // FORCE STOP PCM playback
    this.stopPCMPlayback();

    // FORCE CLEAR all queues (NO WAITING)
    if (this.batchQueue.length > 0) {
      this.log(`🗑️  FORCE clearing batch queue (${this.batchQueue.length} batches dropped)`);
      this.batchQueue = [];
    }

    if (this.saveQueue.length > 0) {
      this.log(`🗑️  FORCE clearing save queue (${this.saveQueue.length} sessions dropped)`);
      this.saveQueue = [];
    }

    // Clear current batch
    this.currentBatch = null;
    this.currentChunks = [];
    this.currentlyPlaying = null;

    // FORCE deactivate hardware (set to idle Zone 2 / .50022)
    this.log('🛑 FORCE deactivating hardware...');
    await this.deactivateHardware();

    // Cleanup audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.pcmWorkletNode) {
      this.pcmWorkletNode.disconnect();
      this.pcmWorkletNode = null;
    }

    if (this.playbackGainNode) {
      this.playbackGainNode.disconnect();
      this.playbackGainNode = null;
    }

    if (this.playbackAnalyserNode) {
      this.playbackAnalyserNode.disconnect();
      this.playbackAnalyserNode = null;
    }

    // Cleanup AudioContext
    if (this.audioContext) {
      this.log('🔇 Closing AudioContext...');
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Clear session metadata
    this.currentSessionMeta = null;
    this.sessionMetaStore.clear();

    // Clear init segment (monitoring stopped completely)
    this.initSegment = null;
    this.log('🗑️  Cleared silent pre-roll init segment');

    this.log('✅ TOTAL SHUTDOWN COMPLETE');
    this.log('✅ All queues cleared, hardware idle');
  }

  // Called by audio monitoring when audio level changes
  onAudioDetected(level: number): void {
    this.lastAudioTime = Date.now();

    // If not batching, start batching (for storage)
    if (!this.isBatching && this.isMonitoring) {
      this.log(`🎯 Starting batching (audio detected at level ${level})`);
      this.startBatching();

      // 🔥 START PCM PLAYBACK IMMEDIATELY (don't wait for hardware!)
      // Ring buffer starts filling NOW, playback outputs silence until hardware ready
      if (!this.pcmPlaybackEnabled) {
        this.log('🎬 First audio detected - starting PCM playback session');
        this.startPCMPlayback(); // Start immediately!

        // Activate hardware asynchronously (in parallel)
        this.ensureHardwareActive().then(() => {
          this.log('✓ Hardware activation complete');
        }).catch((error) => {
          this.log(`❌ Hardware activation failed: ${error}`, 'error');
        });
      }
    }
  }

  // Set playback volume (0.0 = mute, 1.0 = 100%, 2.0 = 200%)
  setPlaybackVolume(volume: number): void {
    // Save desired volume
    this.desiredPlaybackVolume = volume;

    // Apply immediately if GainNode exists
    if (this.playbackGainNode) {
      this.playbackGainNode.gain.value = volume;
      this.log(`🔊 Playback volume updated: ${(volume * 100).toFixed(0)}%`);
    } else {
      this.log(`🔊 Playback volume saved: ${(volume * 100).toFixed(0)}% (will apply when monitoring starts)`);
    }
  }

  // Check if current time is within the ramp time window (PST timezone)
  private isWithinRampWindow(): boolean {
    // If schedule not enabled, always allow ramping (if playbackRampEnabled is true)
    if (!this.config.playbackRampScheduleEnabled) {
      return true;
    }

    // Get current PST time
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentTime = hour + (minute / 60); // Convert to decimal hours (e.g., 18.5 = 6:30 PM)

    const startHour = this.config.playbackRampStartHour ?? 18; // Default 6:00 PM
    const endHour = this.config.playbackRampEndHour ?? 6; // Default 6:00 AM

    // Check if we're within the window (handles overnight ranges like 18:00 - 6:00)
    if (startHour < endHour) {
      // Same day range (e.g., 8:00 AM - 5:00 PM)
      return currentTime >= startHour && currentTime < endHour;
    } else {
      // Overnight range (e.g., 6:00 PM - 6:00 AM)
      return currentTime >= startHour || currentTime < endHour;
    }
  }

  // Initialize hardware to idle state with configured volume
  async initializeHardware(): Promise<void> {
    this.log('🎛️ ═══════════════════════════════════════');
    this.log('🎛️ HARDWARE INITIALIZATION START');
    this.log('🎛️ ═══════════════════════════════════════');

    const linkedSpeakers = this.config.linkedSpeakers || [];

    if (linkedSpeakers.length === 0) {
      this.log('⚠️  No linked speakers configured - skipping initialization');
      this.log('🎛️ ═══════════════════════════════════════');
      return;
    }

    this.log(`📢 Paging Device: ${this.config.pagingDevice?.name || 'N/A'} (NEVER CONTROLLED)`);
    this.log(`🔊 Linked Speakers: ${linkedSpeakers.length}`);
    this.log(`🌐 Zone IP: 224.0.2.60:50022 (IDLE - paging not sending here)`);
    this.log('');

    try {
      // Set all speakers' mcast.zone1 to idle IP (in parallel)
      this.log(`Setting ${linkedSpeakers.length} speakers' mcast.zone1 to 224.0.2.60:50022 (in parallel)...`);
      if (this.config.setSpeakerZoneIP) {
        await this.config.setSpeakerZoneIP(linkedSpeakers, '224.0.2.60:50022');
      }
      this.log(`✓ All speakers' zone IP set to 224.0.2.60:50022`);
      this.log('');

      // Set volume for each speaker using its maxVolume from /live-v2 page (in parallel)
      this.log(`Setting individual volumes for ${linkedSpeakers.length} speakers (in parallel)...`);
      if (this.config.setSpeakerVolume) {
        await Promise.all(
          linkedSpeakers.map(speaker => {
            const maxVolume = speaker.maxVolume ?? 100; // Use speaker's maxVolume from /live-v2
            return this.config.setSpeakerVolume!(speaker.id, maxVolume);
          })
        );
      }
      this.log(`✓ All speakers' volumes set to their configured levels`);
      this.log('');

      // Show each speaker's maxVolume and corresponding level
      linkedSpeakers.forEach(speaker => {
        const maxVolume = speaker.maxVolume ?? 100;
        const level = Math.round((maxVolume / 100) * 10);
        const dB = (level - 10) * 3;
        const dbString = dB === 0 ? "0dB" : `${dB}dB`;
        this.log(`   ${speaker.name}: ${maxVolume}% (Level ${level} = ${dbString})`);
      });
      this.log('');

      this.log('✅ All speakers initialized successfully');
      this.log(`   • ${linkedSpeakers.length} speaker${linkedSpeakers.length !== 1 ? 's' : ''} zone set to IDLE`);
      this.log(`   • Volumes: Individual per speaker`);
      this.log(`   • mcast.zone1: 224.0.2.60:50022 (idle)`);
      this.log('🎛️ ═══════════════════════════════════════');
      this.log('🎛️ HARDWARE INITIALIZATION COMPLETE');
      this.log('🎛️ ═══════════════════════════════════════');
    } catch (error) {
      this.log(`❌ Hardware initialization failed: ${error}`, 'error');
      this.log('🎛️ ═══════════════════════════════════════');
      throw error;
    }
  }

  // ============================================================================
  // Silent Pre-Roll Init Segment (EXACTLY LIKE BATCH COORDINATOR)
  // ============================================================================

  /**
   * Capture a silent pre-roll to use as clean init segment
   * Records 200ms of silence when monitoring starts
   * This init segment is reused for ALL batches in ALL sessions
   * Eliminates ghost audio from header contamination
   */
  private async captureSilentPreRoll(): Promise<void> {
    this.log('📼 ═══════════════════════════════════════');
    this.log('📼 CAPTURING SILENT PRE-ROLL (200ms)');
    this.log('📼 ═══════════════════════════════════════');

    return new Promise((resolve, reject) => {
      const mimeType = this.getBestMimeType();
      const preRollRecorder = new MediaRecorder(this.stream!, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps for high quality
      });
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

        const sizeKB = (this.initSegment.size / 1024).toFixed(2);
        this.log(`✅ Silent pre-roll captured: ${sizeKB} KB (${chunks.length} chunks)`);
        this.log('📼 This init segment will be prepended to ALL batches');
        this.log('📼 ═══════════════════════════════════════');
        resolve();
      };

      preRollRecorder.onerror = (error) => {
        this.log(`❌ Silent pre-roll capture failed: ${error}`, 'error');
        reject(error);
      };

      // Record for 200ms (100ms chunks)
      preRollRecorder.start(100);

      setTimeout(() => {
        if (preRollRecorder.state !== 'inactive') {
          preRollRecorder.stop();
        }
      }, 200); // 200ms total
    });
  }


  // ============================================================================
  // Audio Level Monitoring
  // ============================================================================

  private startAudioLevelMonitoring(): void {
    this.log('🎧 Audio level monitoring started');

    this.audioLevelInterval = window.setInterval(() => {
      if (!this.analyserNode || !this.isMonitoring) return;

      const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.round((average / 255) * 100);

      const threshold = this.config.audioThreshold ?? 0;
      const sustainDuration = this.config.sustainDuration ?? 0;

      // Check if audio is above threshold
      const isAboveThreshold = level > threshold;

      // Track sustain duration
      const now = Date.now();
      if (isAboveThreshold) {
        if (!this.audioAboveThresholdStart) {
          // Audio just went above threshold
          this.audioAboveThresholdStart = now;

          // If sustain duration is 0ms, trigger immediately
          if (sustainDuration === 0) {
            this.isAudioSustained = true;
          } else {
            this.isAudioSustained = false;
          }
        } else if (!this.isAudioSustained && sustainDuration > 0) {
          // Check if sustained long enough
          const duration = now - this.audioAboveThresholdStart;
          if (duration >= sustainDuration) {
            this.isAudioSustained = true;
            this.log(`🎤 Audio sustained for ${duration}ms - VOICE DETECTED (threshold: ${threshold}%, sustain: ${sustainDuration}ms)`);
          }
        }
      } else {
        // Audio dropped below threshold - reset
        this.audioAboveThresholdStart = null;
        this.isAudioSustained = false;
      }

      // Audio level logging removed to reduce spam
      // (UI still gets updates via onAudioLevel callback)

      // Notify audio level callback for UI
      if (this.config.onAudioLevel) {
        this.config.onAudioLevel(level);
      }

      // Auto-trigger onAudioDetected for batching if sustained
      if (this.isAudioSustained) {
        this.onAudioDetected(level);
      }
    }, 50); // Check every 50ms
  }

  // ============================================================================
  // Status Logging (Real-time State Visibility)
  // ============================================================================

  private startStatusLogging(): void {
    this.statusLogInterval = window.setInterval(() => {
      if (!this.isMonitoring) return;

      const status = [
        `📊 STATUS:`,
        `Monitoring=${this.isMonitoring}`,
        `Batching=${this.isBatching}`,
        `Queue=${this.batchQueue.length} batches`,
        `Playing=${this.currentlyPlaying ? 'YES' : 'NO'}`,
        `SaveQueue=${this.saveQueue.length}/${this.MAX_SAVE_SESSIONS}`,
        `Hardware=${this.hardwareState}`,
      ];

      if (this.currentBatch) {
        const elapsed = Date.now() - this.batchStartTime;
        status.push(`CurrentBatch=${elapsed}ms/${this.config.batchDuration}ms`);
      }

      this.log(status.join(' | '));
    }, 2000); // Log every 2 seconds
  }

  private startPlaybackLevelMonitoring(): void {
    this.playbackLevelInterval = window.setInterval(() => {
      if (!this.playbackAnalyserNode) return;

      const dataArray = new Uint8Array(this.playbackAnalyserNode.frequencyBinCount);
      this.playbackAnalyserNode.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.round((average / 255) * 100);

      // Notify playback level callback for UI
      if (this.config.onPlaybackLevel) {
        this.config.onPlaybackLevel(level);
      }
    }, 50); // Check every 50ms
  }

  // ============================================================================
  // Recording Loop (Producer - Always On)
  // ============================================================================

  private startMonitoringLoop(): void {
    this.log('🎙️ Monitoring loop started (always on)');

    // Start silence detection
    this.silenceCheckInterval = window.setInterval(() => {
      if (!this.isBatching) return;

      const silenceElapsed = Date.now() - this.lastAudioTime;

      if (silenceElapsed >= this.config.silenceTimeout) {
        this.log(`⏱️ Silence timeout reached (${this.config.silenceTimeout}ms) - stopping batching`);
        this.stopBatching();
      }
    }, 100);
  }

  private startBatching(): void {
    if (this.isBatching) return;

    // Cancel any pending hardware idle check (new audio detected)
    this.cancelHardwareIdleCheck();

    this.isBatching = true;
    this.log('📦 ═══════════════════════════════════════');
    this.log('📦 BATCHING MODE STARTED');
    this.log('📦 ═══════════════════════════════════════');

    // 🔥 Create NEW sessionID (RECORDING IS THE AUTHORITY)
    this.currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create session metadata (timestamp = NOW in PST)
    const now = new Date();
    const pstTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    this.currentSessionMeta = {
      sessionId: this.currentSessionId,
      firstDetectedAt: now.toISOString(),
      timezone: 'America/Los_Angeles',
      firstBatchId: '',
      batches: [],
    };

    this.sessionMetaStore.set(this.currentSessionId, this.currentSessionMeta);

    this.log(`📋 NEW SESSION CREATED (Recording Authority)`);
    this.log(`   ├─ SessionID: ${this.currentSessionId}`);
    this.log(`   ├─ Time: ${pstTime} PST`);
    this.log(`   └─ Timezone: ${this.currentSessionMeta.timezone}`);

    // Start MediaRecorder with high-quality audio
    const mimeType = this.getBestMimeType();
    this.mediaRecorder = new MediaRecorder(this.stream!, {
      mimeType,
      audioBitsPerSecond: 128000, // 128kbps for clear audio (was default ~96kbps)
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.onChunkRecorded(event.data);
      }
    };

    // 🔥 NO TIMESLICE: Let Opus create natural frame boundaries
    // We'll manually flush when batches are ready (prevents mid-syllable cuts)
    this.mediaRecorder.start();
    this.log(`🎤 MediaRecorder ACTIVE (${mimeType}, 128kbps, continuous recording - manual flush)`);

    // Start first batch
    this.startNewBatch();

    // Start batch duration monitor (checks every 100ms, flushes at 5s)
    this.startBatchDurationMonitor();
  }

  private stopBatching(): void {
    if (!this.isBatching) return;

    this.isBatching = false;
    this.log('📦 ═══════════════════════════════════════');
    this.log('📦 BATCHING MODE STOPPED (8s Silence Timeout)');
    this.log('📦 ═══════════════════════════════════════');

    // Stop batch duration monitor
    this.stopBatchDurationMonitor();

    // Stop MediaRecorder (automatically flushes remaining data → triggers final ondataavailable)
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.log('⏹️ Stopping MediaRecorder (final flush will seal last batch)...');
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // ✅ DON'T stop PCM playback here - let it drain the buffer naturally
    // PCM will stop when:
    // 1. User manually stops monitoring (stop() method)
    // 2. Ring buffer is empty (future enhancement)
    // this.log('✓ Recording stopped - PCM playback will continue draining buffer');

    // 🔥 CLOSE SESSION (Recording Authority decides session is done)
    if (this.currentSessionId) {
      this.log(`🔒 SESSION CLOSED: ${this.currentSessionId}`);
      this.log(`   └─ Reason: 8s silence timeout reached`);

      // Reset PCM session ramp flag (ready for next session)
      this.pcmSessionRamped = false;
      this.log(`🎚️ Session ramp flag reset (ready for next session)`);

      // 💾 FINALIZE SESSION FOR SAVING (after short delay to ensure all batches are processed)
      // Wait a bit for the last batch to be added to the session by the playback worker
      setTimeout(() => {
        const sessionMeta = this.sessionMetaStore.get(this.currentSessionId!);
        if (sessionMeta && sessionMeta.batches.length > 0) {
          sessionMeta.playbackEndTime = Date.now();
          this.log(`💾 Finalizing session: ${this.currentSessionId} (${sessionMeta.batches.length} batches)`);
          this.enqueueSaveSession(sessionMeta);
        } else {
          this.log(`⚠️ Session ${this.currentSessionId} has no batches - not saving`);
        }
      }, 500); // Wait 500ms for last batch to be processed

      // Don't clear currentSessionId yet - will be cleared when next session starts
    }

    // NOTE: We keep initSegment for reuse across sessions (like BatchCoordinator)
    // Only cleared when monitoring stops completely (in stop() method)

    this.log(`✓ Batching stopped - ${this.batchQueue.length} batches in queue`);
    this.log('⏳ Waiting for save worker to upload session...');

    // 🔥 Schedule hardware idle check (deactivate after grace period if no new audio)
    this.scheduleHardwareIdleCheck();
  }

  private startNewBatch(): void {
    // Safety check: ensure session exists
    if (!this.currentSessionId || !this.currentSessionMeta) {
      this.log('⚠️ Cannot start new batch - no active session', 'warning');
      return;
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 🔥 ATTACH CURRENT SESSION ID TO BATCH (Batch knows its session)
    this.currentBatch = {
      id: batchId,
      blob: new Blob(), // Will be set when sealed
      chunks: [], // Will be set when sealed
      duration: 0,
      timestamp: Date.now(),
      sessionId: this.currentSessionId, // ← Session identity attached here
    };

    this.currentChunks = [];
    this.batchStartTime = Date.now();

    // Set first batch ID if this is first batch
    if (!this.currentSessionMeta.firstBatchId) {
      this.currentSessionMeta.firstBatchId = batchId;
    }
  }

  private startBatchDurationMonitor(): void {
    // Clear any existing monitor
    this.stopBatchDurationMonitor();

    // Check batch duration every 100ms
    this.batchDurationMonitorInterval = window.setInterval(() => {
      if (!this.currentBatch || !this.isBatching) return;

      const elapsed = Date.now() - this.batchStartTime;

      // 🎯 CRITICAL: Only flush during SILENCE, never mid-word
      // This prevents cutting syllables ("ni...ne", "e...ight")
      const MIN_DURATION = 4500; // Don't flush before 4.5s
      const TARGET_DURATION = this.config.batchDuration; // 5000ms
      const MAX_DURATION = 6500; // Force flush if continuous speech

      if (elapsed < MIN_DURATION) return; // Too early

      // Ideal case: flush at ~5s during silence (word boundary)
      if (elapsed >= TARGET_DURATION && !this.isAudioSustained) {
        this.log(`⏱️ Batch duration reached (${elapsed}ms) + silence detected - flushing at word boundary`);

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      }
      // Safety valve: force flush if continuous speech exceeds 6.5s
      else if (elapsed >= MAX_DURATION) {
        this.log(`⚠️ Max duration exceeded (${elapsed}ms) - force flushing (continuous speech)`);

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      }
      // Waiting for silence...
      else if (elapsed >= TARGET_DURATION && this.isAudioSustained) {
        // Voice still active, waiting for silence (logging removed to reduce spam)
      }
    }, 100);
  }

  private stopBatchDurationMonitor(): void {
    if (this.batchDurationMonitorInterval !== null) {
      clearInterval(this.batchDurationMonitorInterval);
      this.batchDurationMonitorInterval = null;
    }
  }

  private onChunkRecorded(chunk: Blob): void {
    if (!this.currentBatch) return;

    // With manual flushing, each chunk is ~5 seconds of clean Opus audio
    this.currentChunks.push(chunk);
    this.currentBatch.duration = Date.now() - this.batchStartTime;

    // Seal batch when we receive flushed data
    this.sealCurrentBatch();

    // Continue with next batch (DON'T restart MediaRecorder)
    if (this.isBatching) {
      this.startNewBatch();
    }
  }

  private sealCurrentBatch(): void {
    if (!this.currentBatch) return;

    // ⚠️ NEVER seal empty batches (causes silence gaps!)
    if (this.currentChunks.length === 0) {
      this.log(`⚠️ Skipping empty batch (no chunks recorded)`);
      this.currentBatch = null;
      return;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
    const batchNumber = this.batchQueue.length + 1;

    // 🔥 Store PURE AUDIO ONLY (no init segment in stored blob!)
    // Init segment will be prepended temporarily during decode, not stored
    this.currentBatch.blob = new Blob(this.currentChunks, { type: mimeType });
    this.log(`📦 Batch ${batchNumber}: Raw audio (${(this.currentBatch.blob.size / 1024).toFixed(2)} KB) - pure continuity`);

    // Store raw chunks for saving (without init segment duplication)
    this.currentBatch.chunks = [...this.currentChunks];

    const sizeKB = (this.currentBatch.blob.size / 1024).toFixed(2);

    this.log(`📦 Batch SEALED: ${this.currentBatch.id}`);
    this.log(`   ├─ Batch #${batchNumber}`);
    this.log(`   ├─ Duration: ${this.currentBatch.duration}ms`);
    this.log(`   ├─ Size: ${sizeKB} KB (raw audio only)`);
    this.log(`   ├─ Chunks: ${this.currentChunks.length}`);
    this.log(`   └─ Queue position: ${batchNumber}`);

    // CRITICAL: Append to batch queue (FIFO, append-only)
    this.batchQueue.push(this.currentBatch);
    this.log(`🎯 Queue updated: ${this.batchQueue.length} batches waiting`);

    // Notify playback worker (if waiting)
    const resolver = this.batchQueueResolvers.shift();
    if (resolver) {
      resolver();
      this.log('🔔 Notified playback worker - new batch ready');
    }

    this.currentBatch = null;
    this.currentChunks = [];
  }

  // ============================================================================
  // PCM Playback (Live Streaming - No Encoding)
  // ============================================================================

  /**
   * Start PCM playback (replaces batch-based playback)
   * - Pulls samples from ring buffer
   * - Schedules continuously
   * - No decoding, no gaps, no artifacts
   */
  private startPCMPlayback(): void {
    if (this.pcmPlaybackEnabled) return;
    if (!this.audioContext || !this.pcmRingBuffer) return;

    this.log('🎧 ═══════════════════════════════════════');
    this.log('🎧 STARTING PCM LIVE PLAYBACK');
    this.log('🎧 ═══════════════════════════════════════');
    this.log('🎧 Mode: ScriptProcessorNode (continuous callback)');
    this.log('🎧 Buffer size: 4096 samples (~85ms at 48kHz)');

    // Create ScriptProcessor for continuous playback (like test page)
    // Buffer size: 4096 samples = ~85ms at 48kHz (low latency)
    this.pcmPlaybackNode = this.audioContext.createScriptProcessor(4096, 0, 1);

    let totalSamplesPlayed = 0;
    let emptyBufferCount = 0; // Track how many times buffer was empty

    let callbackCount = 0;

    this.pcmPlaybackNode.onaudioprocess = (event) => {
      callbackCount++;

      // Debug: Log first 10 callbacks to see what's blocking
      if (callbackCount <= 10) {
        this.log(`🎵 PCM CALLBACK #${callbackCount}: enabled=${this.pcmPlaybackEnabled}, hardwareState=${HardwareState[this.hardwareState]}, hasAudio=${this.hasReceivedRealAudio}`);
      }

      if (!this.pcmRingBuffer || !this.audioContext || !this.pcmPlaybackEnabled) {
        if (callbackCount <= 10) this.log(`   └─ BLOCKED: Basic checks failed`);
        return;
      }

      const output = event.outputBuffer.getChannelData(0);

      // 🔥 TTL CHECK: Ensure audio isn't too old (prevents time-travel audio)
      if (this.ringBufferFirstSampleTime > 0) {
        const audioAge = Date.now() - this.ringBufferFirstSampleTime;

        if (audioAge > MAX_AUDIO_AGE_MS) {
          // Audio is too old - flush buffer and wait for fresh audio
          const availableSamples = this.pcmRingBuffer.getAvailable();
          this.log(`⚠️ AUDIO TOO OLD: ${(audioAge / 1000).toFixed(1)}s > ${MAX_AUDIO_AGE_MS / 1000}s max`);
          this.log(`   └─ Flushing ${availableSamples} stale samples (${(availableSamples / this.audioContext.sampleRate).toFixed(1)}s)`);

          // Flush stale audio
          this.pcmRingBuffer.clear();
          this.ringBufferFirstSampleTime = 0; // Reset for fresh audio
          this.pcmPlaybackStarted = false; // Reset playback state
          this.hasReceivedRealAudio = false; // Reset audio detection

          // Output silence and wait for fresh audio
          output.fill(0);
          return;
        }
      }

      // 🔥 WAIT FOR HARDWARE before outputting audio (but keep filling ring buffer)
      if (this.hardwareState !== HardwareState.ACTIVE) {
        if (callbackCount <= 10) this.log(`   └─ BLOCKED: Hardware not ACTIVE (state=${HardwareState[this.hardwareState]})`);
        output.fill(0); // Output silence until hardware ready
        return;
      }

      // Check if we've accumulated enough samples to start playback (delay period)
      if (!this.pcmPlaybackStarted) {
        const requiredSamples = this.config.playbackDelay * (this.audioContext!.sampleRate / 1000);
        const availableSamples = this.pcmRingBuffer.getAvailable();

        // 🔥 CRITICAL: Wait for BOTH:
        // 1. Enough samples accumulated (delay period)
        // 2. Worklet has received actual audio (not just zeros)
        if (availableSamples >= requiredSamples && this.hasReceivedRealAudio) {
          this.pcmPlaybackStarted = true;
          this.log(`🔊 Playback delay complete (${availableSamples} samples = ${(availableSamples / this.audioContext!.sampleRate).toFixed(2)}s available, real audio received)`);

          // 🎚️ APPLY SESSION VOLUME RAMP (first audio of session)
          if (!this.pcmSessionRamped && this.config.playbackRampEnabled && this.isWithinRampWindow() && this.playbackGainNode) {
            const startVol = this.config.playbackRampStartVolume ?? 0;
            const targetVol = this.config.playbackRampTargetVolume ?? 1.0;
            const rampDuration = (this.config.playbackRampDuration ?? 2000) / 1000; // Convert to seconds

            // Set to start volume immediately
            this.playbackGainNode.gain.setValueAtTime(startVol, this.audioContext.currentTime);

            // Ramp to target volume over duration
            this.playbackGainNode.gain.linearRampToValueAtTime(
              targetVol,
              this.audioContext.currentTime + rampDuration
            );

            this.pcmSessionRamped = true;
            this.log(`🎚️ PCM SESSION RAMP: ${(startVol * 100).toFixed(0)}% → ${(targetVol * 100).toFixed(0)}% over ${rampDuration.toFixed(1)}s`);
          } else if (!this.pcmSessionRamped && this.config.playbackRampEnabled && !this.isWithinRampWindow()) {
            this.log(`🕐 Outside ramp window - using static volume`);
          }
        } else {
          // Output silence until delay is complete
          if (callbackCount <= 10) this.log(`   └─ BLOCKED: Delay not satisfied (${availableSamples}/${requiredSamples} samples, hasAudio=${this.hasReceivedRealAudio})`);
          output.fill(0);
          return;
        }
      }

      // 🔥 Pull samples from TRUE ring buffer (exactly what we need)
      const samples = this.pcmRingBuffer.pull(output.length); // Pull 4096 samples

      // Apply gain and copy to output
      const PCM_GAIN = 1.0; // No gain (adjust if needed: 0.5 = quieter, 2.0 = louder)
      let peakLevel = 0;

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i] * PCM_GAIN;
        output[i] = Math.max(-1, Math.min(1, sample)); // Clamp to prevent clipping
        peakLevel = Math.max(peakLevel, Math.abs(sample));
      }

      // Fill any remaining with silence (shouldn't happen with TRUE ring buffer)
      for (let i = samples.length; i < output.length; i++) {
        output[i] = 0;
      }

      totalSamplesPlayed += output.length;

      // Log first frame only (reduced spam)
      if (totalSamplesPlayed === output.length) {
        this.log(`🎵 First audio frame played!`);
      }
      // Removed: detailed logging and periodic pull logs (too spammy)

      // Check if buffer is truly empty
      const bufferAvailable = this.pcmRingBuffer.getAvailable();
      const bufferEmpty = bufferAvailable === 0;

      // 🔥 CRITICAL: Only auto-stop if:
      // 1. Recording has stopped (!this.isBatching)
      // 2. Buffer is either completely empty OR very low (< 0.5s of audio)
      // 3. Has been empty for sufficient time (5 seconds to be safe)
      const bufferDuration = bufferAvailable / (this.audioContext?.sampleRate || 48000);
      const bufferVeryLow = bufferDuration < 0.5; // Less than 0.5 seconds

      if (!this.isBatching && (bufferEmpty || bufferVeryLow)) {
        emptyBufferCount++;

        // Wait 5 seconds before auto-stopping (5000ms / 85ms = ~59 callbacks)
        if (emptyBufferCount > 59) {
          this.log(`🛑 Buffer drained - auto-stopping PCM playback`);
          this.stopPCMPlayback();

          // 🔥 Schedule hardware idle check (buffer drained, may be ready to deactivate)
          if (!this.isBatching) {
            this.scheduleHardwareIdleCheck();
          }

          return;
        }
        // Removed: countdown logging (too spammy)
      } else {
        // Reset counter if recording is still active OR buffer has significant audio
        emptyBufferCount = 0;
      }

      // Reset TTL tracking when buffer becomes empty (all audio drained)
      if (bufferEmpty && this.ringBufferFirstSampleTime > 0) {
        this.ringBufferFirstSampleTime = 0; // Ready for next audio session

        // Reset session ramp flag (ready for next session)
        if (this.pcmSessionRamped) {
          this.pcmSessionRamped = false;

          // Reset gain to start volume (ready for next session ramp)
          if (this.config.playbackRampEnabled && this.isWithinRampWindow() && this.playbackGainNode && this.audioContext) {
            const startVol = this.config.playbackRampStartVolume ?? 0;
            this.playbackGainNode.gain.setValueAtTime(startVol, this.audioContext.currentTime);
            this.log(`🎚️ Session ended - volume reset to ${(startVol * 100).toFixed(0)}% (ready for next session)`);
          }
        }
      }

      // Periodic logging removed to prevent console accumulation
      // if (totalSamplesPlayed > 0 && totalSamplesPlayed % (output.length * 20) === 0) {
      //   this.log(`🎵 Playing: ${(totalSamplesPlayed / this.audioContext!.sampleRate).toFixed(1)}s played, peak: ${peakLevel.toFixed(4)}, buffer: ${this.pcmRingBuffer.getAvailable()} samples`);
      // }
    };

    // Connect ScriptProcessor → GainNode → Analyser → Destination
    this.pcmPlaybackNode.connect(this.playbackGainNode!);
    this.pcmPlaybackEnabled = true;

    this.log(`✓ PCM playback started - continuous audio stream`);
    this.log('🎧 ═══════════════════════════════════════');
  }

  /**
   * Stop PCM playback
   */
  private stopPCMPlayback(): void {
    if (!this.pcmPlaybackEnabled) return;

    this.log('🛑 Stopping PCM playback');

    this.pcmPlaybackEnabled = false;
    this.pcmPlaybackStarted = false;
    this.pcmSessionRamped = false; // Reset session ramp flag
    this.hasReceivedRealAudio = false; // Reset audio detection
    this.ringBufferFirstSampleTime = 0; // Reset TTL tracking

    if (this.pcmPlaybackNode) {
      this.pcmPlaybackNode.disconnect();
      this.pcmPlaybackNode = null;
    }

    if (this.pcmRingBuffer) {
      this.pcmRingBuffer.clear();
    }

    // 🔥 STOP PCM CAPTURE (worklet + analyser) to prevent endless background noise
    // Only stop if recording has also stopped (if still batching, need to continue capturing)
    if (!this.isBatching) {
      this.log('🛑 Stopping PCM capture (worklet + analyser)');

      if (this.pcmWorkletNode) {
        this.pcmWorkletNode.disconnect();
        this.pcmWorkletNode.port.onmessage = null;
        this.pcmWorkletNode = null;
      }

      // Note: We keep analyserNode connected for audio detection to work for next session
      // Only disconnect if we're truly stopping monitoring
    }

    this.log('✓ PCM playback stopped');
  }

  // ============================================================================
  // Playback Worker (Consumer - Always Listening)
  // ============================================================================

  private async startPlaybackWorker(): Promise<void> {
    this.log('🔊 Playback worker started (always listening)');

    while (this.isMonitoring) {
      // Wait for next batch
      const batch = await this.waitForNextBatch();

      if (!batch) {
        continue; // Monitoring stopped
      }

      // 🔥 DETECT SESSION CHANGE (Playback follows sessionID)
      // ⚠️ DO NOT finalize previous session here - queue empty doesn't mean recording stopped!
      // User might still be speaking - just haven't hit 5s batch boundary yet
      if (this.currentPlaybackSessionId && batch.sessionId !== this.currentPlaybackSessionId) {
        this.log(`🔄 SESSION CHANGE DETECTED (continuing playback)`);
        this.log(`   ├─ Previous: ${this.currentPlaybackSessionId}`);
        this.log(`   └─ New: ${batch.sessionId}`);
        // Session changes are just metadata - don't interrupt audio continuity!
      }

      // Set current playback session (for tracking only - PCM playback started at first audio detection)
      let isFirstBatchOfSession = false;
      if (!this.currentPlaybackSessionId || batch.sessionId !== this.currentPlaybackSessionId) {
        this.currentPlaybackSessionId = batch.sessionId;
        isFirstBatchOfSession = true;
        this.log(`🎬 PLAYBACK SESSION: ${batch.sessionId}`);
        // Note: PCM playback already started when audio was first detected
      }

      // 🎧 PCM PLAYBACK MODE - batches are for storage only
      // Audio flows continuously from PCM ring buffer
      // No decoding, no scheduling, no gaps
      // (Logging removed to prevent console accumulation)

      // ❌ OLD BATCH PLAYBACK DISABLED
      // this.playBatch(batch, isFirstBatchOfSession, isLastBatchOfSession);

      // Remove from queue immediately after scheduling (not after playback complete!)
      const index = this.batchQueue.indexOf(batch);
      if (index !== -1) {
        this.batchQueue.splice(index, 1);
      }

      // Add to current session
      const sessionMeta = this.sessionMetaStore.get(batch.sessionId);
      if (sessionMeta) {
        sessionMeta.batches.push(batch);
      }

      // ✅ NO session finalization here!
      // Session lifetime is controlled by SILENCE TIMEOUT (recording side)
      // NOT by queue emptiness (playback side)
      // The user might still be talking - queue empty just means we're caught up!
    }

    this.log('🔊 Playback worker stopped');
  }

  private async waitForNextBatch(): Promise<AudioBatch | null> {
    while (this.isMonitoring) {
      if (this.batchQueue.length > 0) {
        return this.batchQueue[0]; // Peek, don't remove
      }

      // Wait for new batch
      await new Promise<void>((resolve) => {
        this.batchQueueResolvers.push(resolve);
        setTimeout(() => resolve(), 50); // Timeout to check isMonitoring
      });
    }

    return null;
  }

  private async ensureHardwareActive(): Promise<void> {
    // 🔥 STATE MACHINE: Handle all possible states
    if (this.hardwareState === HardwareState.ACTIVE) {
      const speakerCount = (this.config.linkedSpeakers || []).length;
      this.log(`✓ Speakers already active (${speakerCount} speaker${speakerCount !== 1 ? 's' : ''} @ 224.0.2.60:50002)`);
      return;
    }

    if (this.hardwareState === HardwareState.ACTIVATING) {
      this.log('✓ Hardware activation already in progress - waiting...');
      return;
    }

    if (this.hardwareState === HardwareState.DEACTIVATING) {
      this.log('🔄 Hardware deactivation in progress - CANCELING and reactivating');
      // Cancel deactivation
      if (this.hardwareTransitionAbort) {
        this.hardwareTransitionAbort();
        this.hardwareTransitionAbort = null;
      }
      // Wait a bit for deactivation to abort
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if any hardware is configured
    const hasLinkedSpeakers = (this.config.linkedSpeakers || []).length > 0;
    const hasPagingDevice = !!this.config.pagingDevice;

    if (!hasLinkedSpeakers && !hasPagingDevice) {
      this.log('⚠️  No hardware configured - skipping activation');
      this.hardwareState = HardwareState.ACTIVE; // Mark as ready anyway for playback
      return;
    }

    this.hardwareState = HardwareState.ACTIVATING;

    this.log('🎛️ ═══════════════════════════════════════');
    this.log('🎛️ HARDWARE ACTIVATION START');
    this.log('🎛️ ═══════════════════════════════════════');
    this.log('🌐 Target: 224.0.2.60:50002 (ACTIVE - Playback Mode)');
    this.log('⚠️  Note: Paging device stays unchanged');

    // 🧪 EMULATION MODE: Skip actual network calls
    if (this.config.emulationMode) {
      this.log('🧪 EMULATION MODE: Simulating speaker activation');

      // Show individual speaker operations
      const linkedSpeakers = this.config.linkedSpeakers || [];
      if (linkedSpeakers.length > 0) {
        this.log(`Setting ${linkedSpeakers.length} virtual speaker(s) to active IP...`);

        for (const speaker of linkedSpeakers) {
          this.log(`  → ${speaker.name} (${speaker.ipAddress}): Setting to 224.0.2.60:50002`);
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay per speaker
          this.log(`  ✓ ${speaker.name}: Ready`);
        }
      }

      // Paging device info
      if (this.config.pagingDevice) {
        this.log(`📢 Paging device: ${this.config.pagingDevice.name} (${this.config.pagingDevice.ipAddress})`);
      }

      // Overall network delay simulation
      if (this.config.emulationNetworkDelay > 0) {
        this.log(`🧪 Simulating ${this.config.emulationNetworkDelay}ms network delay...`);
        await new Promise(resolve => setTimeout(resolve, this.config.emulationNetworkDelay));
      }

      this.hardwareState = HardwareState.ACTIVE;
      this.log('✅ EMULATION: Speaker activation complete');
      this.log('🎛️ ═══ HARDWARE ACTIVATION COMPLETE ═══');
      return;
    }

    // REAL MODE: Actual hardware control (SPEAKERS ONLY, NEVER PAGING DEVICE)
    const linkedSpeakers = this.config.linkedSpeakers || [];
    this.log(`🔊 Activating ${linkedSpeakers.length} speaker${linkedSpeakers.length !== 1 ? 's' : ''}...`);
    this.log('');

    try {
      // Set linked speakers' mcast.zone1 to active IP (in parallel)
      if (linkedSpeakers.length > 0) {
        this.log(`Setting ${linkedSpeakers.length} speakers' mcast.zone1 to 224.0.2.60:50002 (in parallel)...`);
        if (this.config.setSpeakerZoneIP) {
          await this.config.setSpeakerZoneIP(linkedSpeakers, '224.0.2.60:50002');
        }
        this.log(`✓ All speakers' zone IP set to 224.0.2.60:50002`);
        this.log('');
      } else {
        this.log('⚠️  No linked speakers to activate');
        this.log('');
      }

      this.hardwareState = HardwareState.ACTIVE;
      this.log('✅ All speakers activated successfully');
      this.log(`   • ${linkedSpeakers.length} speaker${linkedSpeakers.length !== 1 ? 's' : ''} zone set to ACTIVE`);
      this.log(`   • mcast.zone1: 224.0.2.60:50002 (receiving from paging)`);
      this.log(`   • Paging device: ${this.config.pagingDevice?.name || 'N/A'} (NEVER CONTROLLED)`);
      this.log('🎛️ ═══════════════════════════════════════');
      this.log('🎛️ HARDWARE ACTIVATION COMPLETE');
      this.log('🎛️ ═══════════════════════════════════════');
    } catch (error) {
      this.log(`❌ Speaker activation failed: ${error}`, 'error');
      throw error;
    }
  }

  private async playBatch(batch: AudioBatch, isFirstBatchOfSession: boolean = false, isLastBatchOfSession: boolean = false): Promise<void> {
    this.currentlyPlaying = batch;
    const sizeKB = (batch.blob.size / 1024).toFixed(2);

    this.log(`🔊 ═══ PLAYBACK START ═══`);
    this.log(`🎵 Batch: ${batch.id}`);
    this.log(`   ├─ Duration: ${batch.duration}ms`);
    this.log(`   ├─ Size: ${sizeKB} KB`);
    this.log(`   ├─ Session: ${batch.sessionId}`);
    this.log(`   ├─ First of session: ${isFirstBatchOfSession ? 'YES' : 'NO'}`);
    this.log(`   └─ Last of session: ${isLastBatchOfSession ? 'YES' : 'NO'}`);

    if (!this.audioContext || !this.playbackAnalyserNode) {
      throw new Error('AudioContext not initialized');
    }

    let source: AudioBufferSourceNode | null = null;
    let batchGainNode: GainNode | null = null;

    try {
      const playStartTime = Date.now();

      // 🎵 Step 1: Decode blob to AudioBuffer
      // Create temporary decode blob with init segment (required for decodeAudioData)
      // Init segment is NOT stored in batch, only used here for decoding
      this.log(`🎧 Decoding WebM blob to AudioBuffer...`);

      if (!this.initSegment) {
        throw new Error('Init segment not available for decoding');
      }

      // Create temporary blob: [initSegment, batchAudio] for decoding ONLY
      const decodeBlob = new Blob([this.initSegment, batch.blob], { type: 'audio/webm;codecs=opus' });
      const arrayBuffer = await decodeBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.log(`✓ Decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch`);
      this.log(`🎧 Audio pipeline: [Init + Audio] → decodeAudioData → AudioBuffer → Speakers (no trimming!)`);

      // 🎵 Step 2: Create AudioBufferSourceNode with BATCH-SPECIFIC GainNode
      // Audio chain: Source → Batch Gain (micro fades) → Master Gain (volume) → Analyser → Speakers
      source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create dedicated GainNode for this batch (for micro fade-in/out to eliminate pops)
      batchGainNode = this.audioContext.createGain();

      // Connect: Source → Batch Gain → Master Gain → Analyser → Destination
      source.connect(batchGainNode);
      batchGainNode.connect(this.playbackGainNode!);
      this.playbackGainNode!.connect(this.playbackAnalyserNode);
      this.playbackAnalyserNode.connect(this.audioContext.destination);

      // 🎚️ Apply volume ramping if enabled, first batch of session, AND within time window
      const shouldRamp = this.config.playbackRampEnabled && isFirstBatchOfSession && this.isWithinRampWindow();

      if (shouldRamp) {
        const startVol = this.config.playbackRampStartVolume ?? 0;
        const targetVol = this.config.playbackRampTargetVolume ?? 1.0;
        const rampDuration = (this.config.playbackRampDuration ?? 2000) / 1000; // Convert to seconds

        // Set to start volume immediately
        this.playbackGainNode!.gain.setValueAtTime(startVol, this.audioContext.currentTime);

        // Ramp to target volume over duration
        this.playbackGainNode!.gain.linearRampToValueAtTime(
          targetVol,
          this.audioContext.currentTime + rampDuration
        );

        this.log(`🎚️ RAMPING: ${(startVol * 100).toFixed(0)}% → ${(targetVol * 100).toFixed(0)}% over ${rampDuration.toFixed(1)}s`);
      } else {
        // NOT ramping - ensure volume is at the current playback volume setting
        // (The user controls this via the playback volume slider, which calls setPlaybackVolume)
        // The gain node keeps its current value, which is updated by setPlaybackVolume() when the slider changes

        if (this.config.playbackRampEnabled && isFirstBatchOfSession && !this.isWithinRampWindow()) {
          this.log(`🕐 Outside ramp window - using static volume`);
        }
        this.log(`🔊 Static Volume: ${(this.playbackGainNode!.gain.value * 100).toFixed(0)}%`);
      }

      this.log(`▶️  Starting playback...`);

      // 🎵 Step 3: SEAMLESS SCHEDULED PLAYBACK (No gaps!)
      // Instead of reactive onended, we SCHEDULE batches sample-accurately

      // Determine start time:
      // - First batch: use current time + safety margin
      // - Subsequent batches: use EXACT scheduled time (no overlap unless truly late)
      const now = this.audioContext.currentTime;
      let startTime: number;
      let actualStartTime: number; // When source.start() is called
      let needsOverlap = false;

      if (this.nextScheduledStartTime === 0 || isFirstBatchOfSession) {
        // First batch of session: start ASAP with safety margin
        const safeNow = now + 0.02; // 20ms cushion
        startTime = safeNow;
        actualStartTime = safeNow;
      } else {
        // Subsequent batches: check if we're truly late
        startTime = this.nextScheduledStartTime;
        const gap = startTime - now;

        // Only overlap if we're running late (< 10ms ahead)
        if (gap < 0.01) {
          const OVERLAP_MS = 0.002; // 2ms overlap
          actualStartTime = startTime - OVERLAP_MS;
          needsOverlap = true;
          this.log(`⚠️  Late by ${(-gap * 1000).toFixed(1)}ms - applying ${(OVERLAP_MS * 1000).toFixed(0)}ms overlap`);
        } else {
          // On time - no overlap needed
          actualStartTime = startTime;
          this.log(`✓ On time - gap: ${(gap * 1000).toFixed(1)}ms`);
        }
      }

      // Calculate batch duration and end time
      // 🎯 CRITICAL: Always use decoded audioBuffer.duration, NEVER recorded batch.duration
      // Opus is variable-rate, decoded time is ground truth
      const batchDuration = audioBuffer.duration;
      const endTime = startTime + batchDuration;

      // 🎚️ GAIN CONTROL
      if (needsOverlap) {
        // Apply crossfade only when needed (late start)
        batchGainNode.gain.setValueAtTime(0, actualStartTime);
        batchGainNode.gain.linearRampToValueAtTime(1, startTime);
        batchGainNode.gain.setValueAtTime(1, endTime);
        this.log(`🎚️  Crossfade: 0→1 over ${((startTime - actualStartTime) * 1000).toFixed(0)}ms`);
      } else {
        // Constant gain - no fade artifacts
        batchGainNode.gain.setValueAtTime(1, actualStartTime);
        batchGainNode.gain.setValueAtTime(1, endTime);
        this.log(`🎚️  Constant gain: 1.0 (no crossfade)`);
      }

      // Schedule source to start at actual time (with overlap for non-first batches)
      source.start(actualStartTime);

      // Auto-cleanup when batch finishes (non-blocking)
      // Capture references for callback (TypeScript safety)
      const sourceRef = source;
      const gainRef = batchGainNode;
      source.onended = () => {
        sourceRef.disconnect();
        gainRef.disconnect();
        this.log(`🧹 Batch cleanup complete: ${batch.id}`);
      };

      // Update next scheduled time for seamless chaining (playback cursor)
      this.nextScheduledStartTime = endTime;

      this.log(`⏱️  Scheduled: start=${startTime.toFixed(3)}s, end=${endTime.toFixed(3)}s, duration=${batchDuration.toFixed(3)}s`);
      this.log(`✅ Batch scheduled ahead - next batch can be queued immediately (predictive scheduling)`);
    } catch (error) {
      this.log(`❌ PLAYBACK FAILED: ${error}`, 'error');
      // Cleanup on error only
      try {
        if (source) source.disconnect();
        if (batchGainNode) batchGainNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      // Don't throw - let playback worker continue with next batch
    }

    // Note: Normal cleanup happens in source.onended (non-blocking)
    // currentlyPlaying is intentionally NOT set to null here (predictive scheduling)
  }

  private async finalizePlaybackSession(sessionId: string): Promise<void> {
    this.log(`🏁 FINALIZING PLAYBACK SESSION: ${sessionId}`);

    // Reset volume to start volume if ramping is enabled AND within time window
    if (this.config.playbackRampEnabled && this.isWithinRampWindow() && this.playbackGainNode && this.audioContext) {
      const startVol = this.config.playbackRampStartVolume ?? 0;
      this.playbackGainNode.gain.setValueAtTime(startVol, this.audioContext.currentTime);
      this.log(`🎚️ Volume reset to ${(startVol * 100).toFixed(0)}% (ready for next session)`);
    }

    const sessionMeta = this.sessionMetaStore.get(sessionId);
    if (sessionMeta && sessionMeta.batches.length > 0) {
      sessionMeta.playbackEndTime = Date.now();

      this.log(`✅ Session playback complete: ${sessionId}`);
      this.log(`   ├─ Batches: ${sessionMeta.batches.length}`);
      this.log(`   └─ Duration: ${((sessionMeta.playbackEndTime - sessionMeta.batches[0].timestamp) / 1000).toFixed(1)}s`);

      // Enqueue for saving
      if (this.config.saveRecording) {
        this.enqueueSaveSession(sessionMeta);
      }

      // 🎨 CLEAR CONSOLE after successful session
      setTimeout(() => {
        console.clear();
        this.log('🧹 Console cleared - Ready for next session');
      }, 2000); // Wait 2s so you can see the completion message
    }
  }

  private async onQueueEmpty(): Promise<void> {
    this.log('📭 Batch queue empty');

    // ⚠️ CRITICAL: Only finalize if recording has actually stopped!
    // Queue can be temporarily empty while user is still speaking
    // (playback caught up to recording, next batch not ready yet)
    if (!this.isBatching) {
      // Recording has stopped (silence timeout) - safe to finalize
      if (this.currentPlaybackSessionId) {
        await this.finalizePlaybackSession(this.currentPlaybackSessionId);
        this.currentPlaybackSessionId = null;
      }

      // Reset scheduled time for next session
      this.nextScheduledStartTime = 0;

      // 🔥 Trigger immediate hardware idle check (should deactivate if conditions met)
      // This provides immediate deactivation when queue empties naturally
      await this.checkHardwareIdle();
    } else {
      // Recording still active - queue just caught up, more audio coming
      this.log('✓ Recording still active - waiting for more batches');
    }
  }

  private async deactivateHardware(): Promise<void> {
    // 🔥 STATE MACHINE: Handle all possible states
    if (this.hardwareState === HardwareState.IDLE) {
      this.log('✓ Speakers already idle (IP: 224.0.2.60:50022)');
      return;
    }

    if (this.hardwareState === HardwareState.DEACTIVATING) {
      this.log('✓ Hardware deactivation already in progress');
      return;
    }

    if (this.hardwareState === HardwareState.ACTIVATING) {
      this.log('⚠️ Cannot deactivate - activation in progress');
      return;
    }

    // Check if any hardware is configured
    const hasLinkedSpeakers = (this.config.linkedSpeakers || []).length > 0;
    const hasPagingDevice = !!this.config.pagingDevice;

    if (!hasLinkedSpeakers && !hasPagingDevice) {
      this.log('⚠️  No hardware configured - skipping deactivation');
      this.hardwareState = HardwareState.IDLE;
      return;
    }

    this.hardwareState = HardwareState.DEACTIVATING;

    // Set up abort mechanism
    let aborted = false;
    this.hardwareTransitionAbort = () => {
      aborted = true;
      this.log('🚫 Hardware deactivation ABORTED - new session detected');
    };

    this.log('🎛️ ═══════════════════════════════════════');
    this.log('🎛️ HARDWARE DEACTIVATION START');
    this.log('🎛️ ═══════════════════════════════════════');
    this.log('🌐 Target: 224.0.2.60:50022 (IDLE - Standby Mode)');
    this.log('⚠️  Note: Paging device stays unchanged');

    // 🧪 EMULATION MODE: Skip actual network calls
    if (this.config.emulationMode) {
      this.log('🧪 EMULATION MODE: Simulating speaker deactivation');

      // Show individual speaker operations
      const linkedSpeakers = this.config.linkedSpeakers || [];
      if (linkedSpeakers.length > 0) {
        this.log(`Setting ${linkedSpeakers.length} virtual speaker(s) to idle IP...`);

        for (const speaker of linkedSpeakers) {
          this.log(`  → ${speaker.name} (${speaker.ipAddress}): Setting to 224.0.2.60:50022`);
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay per speaker
          this.log(`  ✓ ${speaker.name}: Idle`);
        }
      }

      // Paging device info
      if (this.config.pagingDevice) {
        this.log(`📢 Paging device: ${this.config.pagingDevice.name} (unchanged - stays in sending mode)`);
      }

      // Overall network delay simulation
      if (this.config.emulationNetworkDelay > 0) {
        this.log(`🧪 Simulating ${this.config.emulationNetworkDelay}ms network delay...`);
        await new Promise(resolve => setTimeout(resolve, this.config.emulationNetworkDelay));
      }

      // Check if aborted during delay
      if (aborted) {
        this.log('🚫 Deactivation aborted during emulation delay');
        this.hardwareTransitionAbort = null;
        return;
      }

      this.hardwareState = HardwareState.IDLE;
      this.hardwareTransitionAbort = null;
      this.log('✅ EMULATION: Speaker deactivation complete');
      this.log('🎛️ ═══ HARDWARE DEACTIVATION COMPLETE ═══');
      return;
    }

    // REAL MODE: Actual hardware control (SPEAKERS ONLY, NEVER PAGING DEVICE)
    const linkedSpeakers = this.config.linkedSpeakers || [];
    this.log(`🔊 Deactivating ${linkedSpeakers.length} speaker${linkedSpeakers.length !== 1 ? 's' : ''}...`);
    this.log('');

    try {
      // Set linked speakers' mcast.zone1 to idle IP (in parallel)
      if (linkedSpeakers.length > 0) {
        this.log(`Setting ${linkedSpeakers.length} speakers' mcast.zone1 to 224.0.2.60:50022 (in parallel)...`);
        if (this.config.setSpeakerZoneIP) {
          await this.config.setSpeakerZoneIP(linkedSpeakers, '224.0.2.60:50022');
        }

        // Check if aborted during network call
        if (aborted) {
          this.log('🚫 Deactivation aborted during network call');
          this.hardwareTransitionAbort = null;
          return;
        }

        this.log(`✓ All speakers' zone IP set to 224.0.2.60:50022`);
        this.log('');
      } else {
        this.log('⚠️  No linked speakers to deactivate');
        this.log('');
      }

      this.hardwareState = HardwareState.IDLE;
      this.hardwareTransitionAbort = null;
      this.log('✅ All speakers deactivated successfully');
      this.log(`   • ${linkedSpeakers.length} speaker${linkedSpeakers.length !== 1 ? 's' : ''} zone set to IDLE`);
      this.log(`   • mcast.zone1: 224.0.2.60:50022 (idle)`);
      this.log(`   • Paging device: ${this.config.pagingDevice?.name || 'N/A'} (NEVER CONTROLLED)`);
      this.log('🎛️ ═══════════════════════════════════════');
      this.log('🎛️ HARDWARE DEACTIVATION COMPLETE');
      this.log('🎛️ ═══════════════════════════════════════');
    } catch (error) {
      this.log(`⚠️ Speaker deactivation error (non-fatal): ${error}`, 'warning');
      // Continue anyway - don't block shutdown
      this.hardwareState = HardwareState.IDLE;
      this.hardwareTransitionAbort = null;
    }
  }

  // ============================================================================
  // Hardware Idle Detection (Prevents speakers staying active indefinitely)
  // ============================================================================

  /**
   * Schedule a hardware idle check after a grace period
   * This ensures hardware deactivates even when sessions overlap
   */
  private scheduleHardwareIdleCheck(): void {
    // Clear any existing timer
    if (this.hardwareIdleTimer !== null) {
      clearTimeout(this.hardwareIdleTimer);
      this.hardwareIdleTimer = null;
    }

    this.log(`⏲️ Hardware idle check scheduled (${this.hardwareIdleDelay / 1000}s grace period)`);

    this.hardwareIdleTimer = window.setTimeout(() => {
      this.checkHardwareIdle();
    }, this.hardwareIdleDelay);
  }

  /**
   * Check if hardware should be deactivated (all conditions met)
   */
  private async checkHardwareIdle(): Promise<void> {
    this.hardwareIdleTimer = null;

    this.log('🔍 ═══════════════════════════════════════');
    this.log('🔍 HARDWARE IDLE CHECK');
    this.log('🔍 ═══════════════════════════════════════');

    // Condition 1: Recording stopped
    const notBatching = !this.isBatching;

    // Condition 2: Playback stopped OR buffer is low
    const playbackStopped = !this.pcmPlaybackEnabled || !this.pcmPlaybackStarted;
    const bufferAvailable = this.pcmRingBuffer?.getAvailable() ?? 0;
    const bufferDuration = bufferAvailable / (this.audioContext?.sampleRate || 48000);
    const bufferLow = bufferDuration < 2.0; // Less than 2 seconds
    const playbackDone = playbackStopped || bufferLow;

    // Condition 3: Playback queue is empty
    const queueEmpty = this.batchQueue.length === 0;

    this.log(`   ├─ Recording stopped: ${notBatching ? '✓' : '✗'}`);
    this.log(`   ├─ Playback stopped: ${playbackStopped ? '✓' : '✗'}`);
    this.log(`   ├─ Buffer low (<2s): ${bufferLow ? '✓' : '✗'} (${bufferDuration.toFixed(1)}s available)`);
    this.log(`   ├─ Queue empty: ${queueEmpty ? '✓' : '✗'} (${this.batchQueue.length} batches)`);
    this.log(`   └─ Hardware state: ${HardwareState[this.hardwareState]}`);

    // Only deactivate if ALL conditions are met
    if (notBatching && playbackDone && queueEmpty) {
      this.log('✅ All idle conditions met - deactivating hardware');
      await this.deactivateHardware();
    } else if (notBatching && queueEmpty) {
      // Recording and queue stopped, just waiting for playback to finish
      this.log('⏳ Waiting for playback to finish - checking again in 3s');
      this.hardwareIdleTimer = window.setTimeout(() => {
        this.checkHardwareIdle();
      }, 3000);
    } else {
      this.log('⏳ Idle conditions not met - will check after next session ends');
    }

    this.log('🔍 ═══════════════════════════════════════');
  }

  /**
   * Cancel any pending hardware idle checks (new audio detected)
   */
  private cancelHardwareIdleCheck(): void {
    if (this.hardwareIdleTimer !== null) {
      clearTimeout(this.hardwareIdleTimer);
      this.hardwareIdleTimer = null;
      this.log('⏲️ Hardware idle check cancelled (new audio detected)');
    }
  }

  // ============================================================================
  // Save Worker (Async, Non-blocking)
  // ============================================================================

  private async startSaveWorker(): Promise<void> {
    this.log('💾 Save worker started');

    while (this.isMonitoring) {
      if (this.saveQueue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const item = this.saveQueue[0];

      try {
        await this.saveSession(item.session);

        // Remove from queue after success
        this.saveQueue.shift();
        this.log(`✓ Session saved: ${item.session.sessionId}`);
      } catch (error) {
        this.log(`⚠️ Save failed: ${error}`, 'error');

        // Increment retry count
        item.retryCount++;
        item.lastAttempt = Date.now();

        // Move to back of queue
        this.saveQueue.shift();
        this.saveQueue.push(item);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.log('💾 Save worker stopped');
  }

  private enqueueSaveSession(session: SessionMetadata): void {
    // Check if queue is full
    if (this.saveQueue.length >= this.MAX_SAVE_SESSIONS) {
      const dropped = this.saveQueue.shift();
      this.log(`⚠️ SAVE QUEUE OVERFLOW - Dropped session: ${dropped?.session.sessionId}`, 'warning');
    }

    this.saveQueue.push({
      session,
      retryCount: 0,
    });

    this.log(`💾 Session enqueued for saving: ${session.sessionId} (queue: ${this.saveQueue.length}/${this.MAX_SAVE_SESSIONS})`);
  }

  private async saveSession(session: SessionMetadata): Promise<void> {
    this.log(`💾 ═══ SAVE SESSION START ═══`);
    this.log(`📋 Session: ${session.sessionId}`);
    this.log(`   ├─ First detected: ${session.firstDetectedAt}`);
    this.log(`   ├─ Batches: ${session.batches.length}`);
    this.log(`   └─ Timezone: ${session.timezone}`);

    // Combine all batches from the session
    // Use chunks (not blobs) to avoid duplicating init segment
    let combinedBlob: Blob;

    if (session.batches.length === 1) {
      // Single batch - use blob directly (includes init segment)
      combinedBlob = session.batches[0].blob;
      this.log(`📦 Single batch: ${(combinedBlob.size / 1024).toFixed(2)} KB`);
    } else {
      // Multiple batches - combine chunks with single init segment
      const allChunks: Blob[] = [];

      // Add init segment once at the beginning
      if (this.initSegment) {
        allChunks.push(this.initSegment);
        this.log(`📦 Adding init segment: ${(this.initSegment.size / 1024).toFixed(2)} KB`);
      }

      // Add all chunks from all batches
      for (const batch of session.batches) {
        allChunks.push(...batch.chunks);
      }

      combinedBlob = new Blob(allChunks, { type: this.getBestMimeType() });
      this.log(`📦 Multi-batch session: ${session.batches.length} batches combined`);
      this.log(`   Total chunks: ${allChunks.length}, Total size: ${(combinedBlob.size / 1024).toFixed(2)} KB`);
    }

    const totalSizeMB = (combinedBlob.size / 1024 / 1024).toFixed(2);
    this.log(`📦 Final blob: ${totalSizeMB} MB`);

    // Generate filename using first detection time
    const timestamp = new Date(session.firstDetectedAt);
    const filename = this.generateFilename(timestamp);

    this.log(`📤 Uploading: ${filename}`);

    // Upload (include sessionId for deterministic Firestore document ID)
    if (this.config.uploadCallback) {
      await this.config.uploadCallback(combinedBlob, filename, session.sessionId);
    }

    this.log(`✅ SAVE COMPLETE`);
    this.log(`💾 ═══ SAVE SESSION END ═══`);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  private generateFilename(timestamp: Date): string {
    // Convert to PST timezone using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(timestamp);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const second = parts.find(p => p.type === 'second')?.value || '';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || '';

    // Format: recording-YYYY-MM-DD_HH-MM-SS-AM/PM.webm
    return `recording-${year}-${month}-${day}_${hour}-${minute}-${second}-${dayPeriod}.webm`;
  }

  private log(message: string, type: 'info' | 'error' | 'warning' = 'info'): void {
    // 🎨 Color-coded logs for different system events
    let color = '#888'; // Default gray
    let bgColor = 'transparent';
    let fontWeight = 'normal';

    // Determine color based on message content
    if (message.includes('🎙️') || message.includes('📦') || message.includes('BATCHING') || message.includes('MediaRecorder')) {
      color = '#00ff88'; // Bright green - Recording
      fontWeight = 'bold';
    } else if (message.includes('🔊') || message.includes('PLAYBACK') || message.includes('Playing') || message.includes('▶️')) {
      color = '#ff00ff'; // Magenta - Playback
      fontWeight = 'bold';
    } else if (message.includes('💾') || message.includes('SAVE') || message.includes('Uploading')) {
      color = '#00aaff'; // Cyan - Saving
      fontWeight = 'bold';
    } else if (message.includes('📋') || message.includes('SESSION') || message.includes('🔒') || message.includes('🎬') || message.includes('🔄')) {
      color = '#ffaa00'; // Orange - Session lifecycle
      fontWeight = 'bold';
      bgColor = 'rgba(255, 170, 0, 0.1)';
    } else if (message.includes('🎛️') || message.includes('HARDWARE') || message.includes('Speakers')) {
      color = '#ff6600'; // Dark orange - Hardware
    } else if (message.includes('📼') || message.includes('SILENT PRE-ROLL')) {
      color = '#aa00ff'; // Purple - Init segment
    } else if (type === 'error' || message.includes('❌') || message.includes('FAILED')) {
      color = '#ff0000'; // Red - Errors
      fontWeight = 'bold';
      bgColor = 'rgba(255, 0, 0, 0.1)';
    } else if (type === 'warning' || message.includes('⚠️')) {
      color = '#ffff00'; // Yellow - Warnings
    } else if (message.includes('✅') || message.includes('COMPLETE')) {
      color = '#00ff00'; // Bright green - Success
      fontWeight = 'bold';
    }

    // Log with styling
    console.log(
      `%c[SimpleRecorder] ${message}`,
      `color: ${color}; background: ${bgColor}; font-weight: ${fontWeight}; padding: 2px 4px;`
    );

    if (this.config.onLog) {
      this.config.onLog(message, type);
    }
  }
}
