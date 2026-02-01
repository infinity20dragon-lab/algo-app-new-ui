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

  // Hardware settings
  linkedSpeakers: any[]; // Algo speakers to control
  pagingDevice: any; // Paging device
  playbackDelay?: number; // Delay before playback starts (for speaker stabilization)

  // Playback Volume Ramping (Web Audio API - non-blocking)
  playbackRampEnabled?: boolean; // Enable volume ramping per session
  playbackRampStartVolume?: number; // Starting volume (0.0 - 2.0)
  playbackRampTargetVolume?: number; // Target volume (0.0 - 2.0)
  playbackRampDuration?: number; // Ramp duration in ms

  // Emulation Mode (for testing without physical devices)
  emulationMode?: boolean; // Skip actual network calls
  emulationNetworkDelay?: number; // Simulate network delay in ms

  // Saving
  saveRecording?: boolean;
  uploadCallback?: (blob: Blob, filename: string) => Promise<string>;

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
// SimpleRecorder Class
// ============================================================================

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

  // Audio Output (playback monitoring)
  private playbackAnalyserNode: AnalyserNode | null = null;
  private playbackGainNode: GainNode | null = null;
  private playbackLevelInterval: number | null = null;

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
  private hardwareReady: boolean = false;
  private currentlyPlaying: AudioBatch | null = null;
  private currentPlaybackSessionId: string | null = null; // Track which session playback is on

  // Save Queue (max 100 sessions)
  private saveQueue: SaveQueueItem[] = [];
  private readonly MAX_SAVE_SESSIONS = 100;
  private isSaving: boolean = false;

  // Silence detection
  private silenceCheckInterval: number | null = null;

  // Status logging
  private statusLogInterval: number | null = null;
  private lastLoggedAudioLevel: number = 0;

  constructor(config: SimpleRecorderConfig) {
    this.config = {
      batchDuration: 5000,
      silenceTimeout: 8000,
      playbackDelay: 4000,
      saveRecording: true,
      emulationMode: false,
      emulationNetworkDelay: 0,
      ...config,
    };
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

    // Set up INPUT audio level monitoring (for recording)
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

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
    this.playbackGainNode.gain.value = 1.0; // Default 100% volume

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

    // If not batching, start batching
    if (!this.isBatching && this.isMonitoring) {
      this.startBatching();
    }
  }

  // Set playback volume (0.0 = mute, 1.0 = 100%, 2.0 = 200%)
  setPlaybackVolume(volume: number): void {
    if (this.playbackGainNode) {
      this.playbackGainNode.gain.value = volume;
      this.log(`🔊 Playback volume updated: ${(volume * 100).toFixed(0)}%`);
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

      // Log significant audio level changes
      if (Math.abs(level - this.lastLoggedAudioLevel) > 10) {
        this.log(`🎤 Audio Level: ${level}% ${level > 5 ? '(VOICE DETECTED)' : '(quiet)'}`);
        this.lastLoggedAudioLevel = level;
      }

      // Notify audio level callback for UI
      if (this.config.onAudioLevel) {
        this.config.onAudioLevel(level);
      }

      // Auto-trigger onAudioDetected for batching
      if (level > 0) {
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
        `Hardware=${this.hardwareReady ? 'ACTIVE' : 'IDLE'}`,
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

    this.mediaRecorder.start(100); // 100ms chunks
    this.log(`🎤 MediaRecorder ACTIVE (${mimeType}, 128kbps, 100ms chunks)`);

    // Start first batch
    this.startNewBatch();
  }

  private stopBatching(): void {
    if (!this.isBatching) return;

    this.isBatching = false;
    this.log('📦 ═══════════════════════════════════════');
    this.log('📦 BATCHING MODE STOPPED (8s Silence Timeout)');
    this.log('📦 ═══════════════════════════════════════');

    // Seal current batch
    if (this.currentBatch) {
      this.log('📦 Sealing final batch...');
      this.sealCurrentBatch();
    }

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.log('⏹️ Stopping MediaRecorder...');
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // 🔥 CLOSE SESSION (Recording Authority decides session is done)
    if (this.currentSessionId) {
      this.log(`🔒 SESSION CLOSED: ${this.currentSessionId}`);
      this.log(`   └─ Reason: 8s silence timeout reached`);
      // Don't clear currentSessionId yet - playback needs it
      // Will be cleared when next session starts
    }

    // NOTE: We keep initSegment for reuse across sessions (like BatchCoordinator)
    // Only cleared when monitoring stops completely (in stop() method)

    this.log(`✓ Batching stopped - ${this.batchQueue.length} batches in queue`);
    this.log('⏳ Waiting for playback worker to drain queue...');

    // Session will be marked complete by playback worker when queue drains
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

  private onChunkRecorded(chunk: Blob): void {
    if (!this.currentBatch) return;

    this.currentChunks.push(chunk);
    this.currentBatch.duration = Date.now() - this.batchStartTime;

    // Check if batch duration reached
    if (this.currentBatch.duration >= this.config.batchDuration) {
      this.sealCurrentBatch();

      // Continue with next batch (DON'T restart MediaRecorder)
      if (this.isBatching) {
        this.startNewBatch();
      }
    }
  }

  private sealCurrentBatch(): void {
    if (!this.currentBatch) return;

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus';
    const batchNumber = this.batchQueue.length + 1;

    // 🔥 ALWAYS prepend init segment for ALL batches (LIKE BATCH COORDINATOR)
    // This ensures every batch can play standalone with decodeAudioData
    if (this.initSegment) {
      this.currentBatch.blob = new Blob([this.initSegment, ...this.currentChunks], { type: mimeType });
      this.log(`📦 Batch ${batchNumber}: Prepended silent pre-roll (${(this.initSegment.size / 1024).toFixed(2)} KB)`);
    } else {
      // Fallback (should never happen after captureSilentPreRoll)
      this.currentBatch.blob = new Blob(this.currentChunks, { type: mimeType });
      this.log(`⚠️ Batch ${batchNumber}: No init segment available!`, 'warning');
    }

    // Store raw chunks for saving (without init segment duplication)
    this.currentBatch.chunks = [...this.currentChunks];

    const sizeKB = (this.currentBatch.blob.size / 1024).toFixed(2);

    this.log(`📦 Batch SEALED: ${this.currentBatch.id}`);
    this.log(`   ├─ Batch #${batchNumber}`);
    this.log(`   ├─ Duration: ${this.currentBatch.duration}ms`);
    this.log(`   ├─ Size: ${sizeKB} KB (silent pre-roll + audio)`);
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
  // Playback Worker (Consumer - Always Listening)
  // ============================================================================

  private async startPlaybackWorker(): Promise<void> {
    this.log('🔊 Playback worker started (always listening)');

    while (this.isMonitoring) {
      // Wait for next batch
      const batch = await this.waitForNextBatch();

      if (!batch) continue; // Monitoring stopped

      // 🔥 DETECT SESSION CHANGE (Playback follows sessionID)
      if (this.currentPlaybackSessionId && batch.sessionId !== this.currentPlaybackSessionId) {
        this.log(`🔄 SESSION CHANGE DETECTED`);
        this.log(`   ├─ Previous: ${this.currentPlaybackSessionId}`);
        this.log(`   └─ New: ${batch.sessionId}`);

        // Finalize previous session
        await this.finalizePlaybackSession(this.currentPlaybackSessionId);
      }

      // Set current playback session
      let isFirstBatchOfSession = false;
      if (!this.currentPlaybackSessionId || batch.sessionId !== this.currentPlaybackSessionId) {
        this.currentPlaybackSessionId = batch.sessionId;
        isFirstBatchOfSession = true;
        this.log(`🎬 PLAYBACK SESSION STARTED: ${batch.sessionId}`);
      }

      // Ensure hardware active (CAN BLOCK FOREVER - this is OK)
      await this.ensureHardwareActive();

      // Play batch (with ramping if first batch of session)
      await this.playBatch(batch, isFirstBatchOfSession);

      // Remove from queue ONLY after successful playback
      const index = this.batchQueue.indexOf(batch);
      if (index !== -1) {
        this.batchQueue.splice(index, 1);
      }

      // Add to current session
      const sessionMeta = this.sessionMetaStore.get(batch.sessionId);
      if (sessionMeta) {
        sessionMeta.batches.push(batch);
      }

      // Check if queue is empty (session complete)
      if (this.batchQueue.length === 0) {
        await this.onQueueEmpty();
      }
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
    if (this.hardwareReady) {
      const speakerCount = (this.config.linkedSpeakers || []).length;
      this.log(`✓ Speakers already active (${speakerCount} speaker${speakerCount !== 1 ? 's' : ''} @ 224.0.2.60:50002)`);
      return;
    }

    // Check if any hardware is configured
    const hasLinkedSpeakers = (this.config.linkedSpeakers || []).length > 0;
    const hasPagingDevice = !!this.config.pagingDevice;

    if (!hasLinkedSpeakers && !hasPagingDevice) {
      this.log('⚠️  No hardware configured - skipping activation');
      this.hardwareReady = true; // Mark as ready anyway for playback
      return;
    }

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

      this.hardwareReady = true;
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

      this.hardwareReady = true;
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

  private async playBatch(batch: AudioBatch, isFirstBatchOfSession: boolean = false): Promise<void> {
    this.currentlyPlaying = batch;
    const sizeKB = (batch.blob.size / 1024).toFixed(2);

    this.log(`🔊 ═══ PLAYBACK START ═══`);
    this.log(`🎵 Batch: ${batch.id}`);
    this.log(`   ├─ Duration: ${batch.duration}ms`);
    this.log(`   ├─ Size: ${sizeKB} KB`);
    this.log(`   ├─ Session: ${batch.sessionId}`);
    this.log(`   └─ First of session: ${isFirstBatchOfSession ? 'YES' : 'NO'}`);

    if (!this.audioContext || !this.playbackAnalyserNode) {
      throw new Error('AudioContext not initialized');
    }

    let source: AudioBufferSourceNode | null = null;

    try {
      const playStartTime = Date.now();

      // 🎵 Step 1: Decode blob to AudioBuffer (LIKE BATCH COORDINATOR)
      this.log(`🎧 Decoding WebM blob to AudioBuffer...`);
      const arrayBuffer = await batch.blob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.log(`✓ Decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch`);
      this.log(`🎧 Audio pipeline: WebM → decodeAudioData → AudioBuffer → AnalyserNode → Speakers`);

      // 🎵 Step 2: Create AudioBufferSourceNode and connect with volume control
      // Audio chain: Source → GainNode (volume) → AnalyserNode (VU meter) → Speakers
      source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackGainNode!);
      this.playbackGainNode!.connect(this.playbackAnalyserNode);
      this.playbackAnalyserNode.connect(this.audioContext.destination);

      // 🎚️ Apply volume ramping if enabled and first batch of session
      if (this.config.playbackRampEnabled && isFirstBatchOfSession) {
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
        this.log(`🔊 Volume: ${(this.playbackGainNode!.gain.value * 100).toFixed(0)}%`);
      }

      this.log(`▶️  Starting playback...`);

      // 🎵 Step 3: Play and wait for completion
      await new Promise<void>((resolve, reject) => {
        source!.onended = () => resolve();

        // Start playback
        try {
          source!.start(0);
        } catch (err) {
          reject(err);
        }
      });

      const playDuration = Date.now() - playStartTime;
      this.log(`✅ PLAYBACK COMPLETE (${playDuration}ms)`);
      this.log(`🔊 ═══ PLAYBACK END ═══`);
    } catch (error) {
      this.log(`❌ PLAYBACK FAILED: ${error}`, 'error');
      // Don't throw - let playback worker continue with next batch
    } finally {
      // Cleanup: disconnect source
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      this.currentlyPlaying = null;
    }
  }

  private async finalizePlaybackSession(sessionId: string): Promise<void> {
    this.log(`🏁 FINALIZING PLAYBACK SESSION: ${sessionId}`);

    // Reset volume to start volume if ramping is enabled
    if (this.config.playbackRampEnabled && this.playbackGainNode && this.audioContext) {
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

    // Finalize current playback session if exists
    if (this.currentPlaybackSessionId) {
      await this.finalizePlaybackSession(this.currentPlaybackSessionId);
      this.currentPlaybackSessionId = null;
    }

    // Deactivate hardware
    await this.deactivateHardware();
  }

  private async deactivateHardware(): Promise<void> {
    if (!this.hardwareReady) {
      this.log('✓ Speakers already idle (IP: 224.0.2.60:50022)');
      return;
    }

    // Check if any hardware is configured
    const hasLinkedSpeakers = (this.config.linkedSpeakers || []).length > 0;
    const hasPagingDevice = !!this.config.pagingDevice;

    if (!hasLinkedSpeakers && !hasPagingDevice) {
      this.log('⚠️  No hardware configured - skipping deactivation');
      this.hardwareReady = false;
      return;
    }

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

      this.hardwareReady = false;
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
        this.log(`✓ All speakers' zone IP set to 224.0.2.60:50022`);
        this.log('');
      } else {
        this.log('⚠️  No linked speakers to deactivate');
        this.log('');
      }

      this.hardwareReady = false;
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
      this.hardwareReady = false;
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

    // Upload
    if (this.config.uploadCallback) {
      await this.config.uploadCallback(combinedBlob, filename);
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
