/**
 * PCM Recorder - Clean Architecture for Live V2
 *
 * Captures and plays raw PCM audio without encoding artifacts.
 * - AudioWorklet for capture (real-time)
 * - Ring buffer for continuity (no gaps)
 * - Direct PCM playback (no decode latency)
 * - Async encoding for storage (optional)
 *
 * Built for emergency paging systems where reliability > everything.
 */

import { RingBuffer } from './ring-buffer';

export interface PCMRecorderConfig {
  sampleRate?: number; // Default: 48000
  bufferDuration?: number; // Seconds to buffer, default: 10
  playbackDelay?: number; // Seconds to delay playback, default: 0
  playbackEnabled?: boolean; // Default: true
  saveRecording?: boolean; // Default: true
  audioThreshold?: number; // VAD threshold (0-100), default: 0 (always record)
  onVoiceDetected?: () => void;
  onSilenceDetected?: () => void;
}

export class PCMRecorder {
  private config: Required<PCMRecorderConfig>;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Ring buffer for continuous PCM
  private ringBuffer: RingBuffer | null = null;

  // Playback
  private playbackNode: ScriptProcessorNode | null = null;
  private playbackGainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private playbackStarted: boolean = false; // Track if delay period has passed

  // State
  private isMonitoring: boolean = false;
  private audioLevelInterval: number | null = null;

  // Recording storage (for saving)
  private recordedChunks: Float32Array[] = [];
  private recordingStartTime: number = 0;

  constructor(config: PCMRecorderConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 48000,
      bufferDuration: config.bufferDuration ?? 10,
      playbackDelay: config.playbackDelay ?? 0,
      playbackEnabled: config.playbackEnabled ?? true,
      saveRecording: config.saveRecording ?? true,
      audioThreshold: config.audioThreshold ?? 0,
      onVoiceDetected: config.onVoiceDetected ?? (() => {}),
      onSilenceDetected: config.onSilenceDetected ?? (() => {}),
    };

    this.log('PCMRecorder initialized', {
      sampleRate: this.config.sampleRate,
      bufferDuration: this.config.bufferDuration,
      playbackDelay: this.config.playbackDelay,
    });
  }

  /**
   * Start monitoring and recording
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      this.log('Already monitoring');
      return;
    }

    this.log('🎤 Starting PCM Recorder...');

    try {
      // 1. Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      // 2. Create AudioContext
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      this.log(`✓ AudioContext created: ${this.audioContext.sampleRate}Hz`);

      // 3. Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/audio/pcm-worklet.js');
      this.log('✓ AudioWorklet module loaded');

      // 4. Create audio nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-capture');
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;

      // 5. Connect capture path: Mic → Analyser → Worklet
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.workletNode);
      // Worklet doesn't need to connect anywhere (no audio output)

      // 6. Create ring buffer
      const bufferSize = Math.floor(this.config.sampleRate * this.config.bufferDuration);
      this.ringBuffer = new RingBuffer(bufferSize);
      this.log(`✓ Ring buffer created: ${this.config.bufferDuration}s (${bufferSize} samples)`);

      // 7. Handle PCM samples from worklet
      this.workletNode.port.onmessage = (event) => {
        const samples = event.data.samples as Float32Array;

        if (this.ringBuffer) {
          // Push to ring buffer for playback
          this.ringBuffer.push(samples);

          // Optionally save for storage
          if (this.config.saveRecording) {
            this.recordedChunks.push(samples.slice());
          }
        }
      };

      // 8. Set up playback if enabled
      if (this.config.playbackEnabled) {
        await this.startPlayback();
      }

      // 9. Start audio level monitoring (VAD)
      this.startAudioLevelMonitoring();

      this.isMonitoring = true;
      this.recordingStartTime = Date.now();

      this.log('✅ PCM Recorder started successfully');
    } catch (error) {
      this.log('❌ Failed to start PCM Recorder:', error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Start playback from ring buffer
   */
  private async startPlayback(): Promise<void> {
    if (!this.audioContext || !this.ringBuffer) return;

    // Create playback gain node (for volume control)
    this.playbackGainNode = this.audioContext.createGain();
    this.playbackGainNode.gain.value = 1.0;
    this.playbackGainNode.connect(this.audioContext.destination);

    // Create ScriptProcessor for playback
    // Buffer size: 4096 samples = ~85ms at 48kHz (low latency)
    this.playbackNode = this.audioContext.createScriptProcessor(4096, 0, 1);

    this.playbackNode.onaudioprocess = (event) => {
      if (!this.ringBuffer) return;

      const output = event.outputBuffer.getChannelData(0);

      // Check if we've accumulated enough samples to start playback (delay period)
      if (!this.playbackStarted) {
        const requiredSamples = this.config.playbackDelay * this.config.sampleRate;
        const availableSamples = this.ringBuffer.getAvailable();

        if (availableSamples >= requiredSamples) {
          this.playbackStarted = true;
          this.log(`🔊 Playback delay complete (${this.config.playbackDelay}s) - starting audio output`);
        } else {
          // Output silence until delay is complete
          output.fill(0);
          return;
        }
      }

      // Pull samples from ring buffer and output
      const samples = this.ringBuffer.pull(output.length);
      output.set(samples);
    };

    this.playbackNode.connect(this.playbackGainNode);
    this.isPlaying = true;

    this.log('🔊 Playback started - direct PCM streaming');
  }

  /**
   * Monitor audio levels for VAD
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.audioLevelInterval = window.setInterval(() => {
      if (!this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const level = (rms / 255) * 100;

      // Simple VAD
      if (level > this.config.audioThreshold) {
        this.config.onVoiceDetected();
      } else {
        this.config.onSilenceDetected();
      }
    }, 100);
  }

  /**
   * Stop monitoring and recording
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) return;

    this.log('🛑 Stopping PCM Recorder...');

    this.isMonitoring = false;
    this.isPlaying = false;
    this.playbackStarted = false;

    // Stop audio level monitoring
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    // Disconnect nodes
    if (this.playbackNode) {
      this.playbackNode.disconnect();
      this.playbackNode = null;
    }

    if (this.playbackGainNode) {
      this.playbackGainNode.disconnect();
      this.playbackGainNode = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop microphone stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Close AudioContext
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Clear ring buffer
    if (this.ringBuffer) {
      this.ringBuffer.clear();
    }

    this.log('✓ PCM Recorder stopped');
  }

  /**
   * Get recorded audio as WAV blob (for saving)
   */
  getRecordedAudio(): Blob | null {
    if (this.recordedChunks.length === 0) {
      this.log('No audio recorded');
      return null;
    }

    // Calculate total length
    const totalLength = this.recordedChunks.reduce((sum, chunk) => sum + chunk.length, 0);

    // Combine all chunks
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to WAV
    const wav = this.encodeWAV(combined, this.config.sampleRate);
    return new Blob([wav], { type: 'audio/wav' });
  }

  /**
   * Encode Float32 PCM to WAV format
   */
  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples (convert Float32 to Int16)
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Set playback volume
   */
  setPlaybackVolume(volume: number): void {
    if (this.playbackGainNode) {
      this.playbackGainNode.gain.value = Math.max(0, Math.min(1, volume));
      this.log(`🔊 Playback volume: ${(volume * 100).toFixed(0)}%`);
    }
  }

  /**
   * Get buffer status
   */
  getBufferStatus(): { available: number; percentage: number; duration: number } {
    if (!this.ringBuffer) {
      return { available: 0, percentage: 0, duration: 0 };
    }

    return {
      available: this.ringBuffer.getAvailable(),
      percentage: this.ringBuffer.getFillPercentage(),
      duration: this.ringBuffer.getBufferedDuration(this.config.sampleRate),
    };
  }

  private log(...args: any[]): void {
    console.log('[PCMRecorder]', ...args);
  }
}
