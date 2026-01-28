"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import type { AlgoDevice, PoEDevice } from "@/lib/algo/types";
import { storage, realtimeDb } from "@/lib/firebase/config";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as dbRef, set, push } from "firebase/database";
import { useAuth } from "@/contexts/auth-context";
import { getIdleVolumeString, getAlwaysKeepPagingOn } from "@/lib/settings";

// Debug mode - set to false for production to reduce console noise
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Debug logging helper - only logs in development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

// Helper function to get current time in PST (Pacific Standard Time)
// Returns both ISO string and formatted date for organizing logs
const getPSTTime = () => {
  const now = new Date();

  // Get time in PST using Intl.DateTimeFormat
  const pstFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = pstFormatter.formatToParts(now);
  const partsObj: any = {};
  parts.forEach(part => {
    partsObj[part.type] = part.value;
  });

  // Create ISO-like timestamp in PST
  const timestamp = `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}-08:00`;

  // Format date as YYYY-MM-DD for organizing logs by day
  const dateKey = `${partsObj.year}-${partsObj.month}-${partsObj.day}`;

  return { timestamp, dateKey };
};

// Web Worker for MP3 encoding
let mp3Worker: Worker | null = null;

export interface AudioLogEntry {
  timestamp: string;
  type: "audio_detected" | "audio_silent" | "speakers_enabled" | "speakers_disabled" | "volume_change";
  audioLevel?: number;
  audioThreshold?: number;
  speakersEnabled?: boolean;
  volume?: number;
  message: string;
  recordingUrl?: string; // URL to recorded audio clip
}

// Speaker connectivity status
export interface SpeakerStatus {
  speakerId: string;
  speakerName: string;
  ipAddress: string;
  isOnline: boolean;
  lastChecked: Date;
  errorMessage?: string;
}

interface AudioMonitoringContextType {
  // Audio capture state
  isCapturing: boolean;
  audioLevel: number;
  playbackAudioLevel: number; // Audio level of live playback output
  selectedInputDevice: string;
  volume: number;
  targetVolume: number;
  audioThreshold: number;

  // Speaker state
  audioDetected: boolean;
  speakersEnabled: boolean;

  // Volume mode
  useGlobalVolume: boolean;
  setUseGlobalVolume: (useGlobal: boolean) => void;

  // Ramp settings
  rampEnabled: boolean;
  rampDuration: number;
  dayNightMode: boolean;
  dayStartHour: number;
  dayEndHour: number;
  nightRampDuration: number;
  sustainDuration: number;
  disableDelay: number;
  setRampEnabled: (enabled: boolean) => void;
  setRampDuration: (duration: number) => void;
  setDayNightMode: (enabled: boolean) => void;
  setDayStartHour: (hour: number) => void;
  setDayEndHour: (hour: number) => void;
  setNightRampDuration: (duration: number) => void;
  setSustainDuration: (duration: number) => void;
  setDisableDelay: (delay: number) => void;

  // Device selection
  selectedDevices: string[];
  setSelectedDevices: (devices: string[]) => void;

  // Actions
  startMonitoring: (inputDevice?: string) => void;
  stopMonitoring: () => void;
  setInputDevice: (deviceId: string) => void;
  setVolume: (volume: number) => void;
  setTargetVolume: (volume: number) => void;
  setAudioThreshold: (threshold: number) => void;

  // For controlling speakers
  devices: AlgoDevice[];
  setDevices: (devices: AlgoDevice[]) => void;

  // For controlling PoE devices (lights, etc.)
  poeDevices: PoEDevice[];
  setPoeDevices: (devices: PoEDevice[]) => void;

  // Logging
  logs: AudioLogEntry[];
  clearLogs: () => void;
  exportLogs: () => string;
  loggingEnabled: boolean;
  setLoggingEnabled: (enabled: boolean) => void;

  // Recording
  recordingEnabled: boolean;
  setRecordingEnabled: (enabled: boolean) => void;

  // Playback
  playbackEnabled: boolean;
  setPlaybackEnabled: (enabled: boolean) => void;

  // Emergency Controls
  emergencyKillAll: () => Promise<void>;
  emergencyEnableAll: () => Promise<void>;
  controlSingleSpeaker: (speakerId: string, enable: boolean) => Promise<void>;

  // Speaker Status Tracking
  speakerStatuses: SpeakerStatus[];
  checkSpeakerConnectivity: () => Promise<void>;
}

const AudioMonitoringContext = createContext<AudioMonitoringContextType | null>(null);

// Helper function to convert audio blob to MP3 using Web Worker
async function convertToMp3(audioBlob: Blob): Promise<Blob> {
  console.log('[MP3 Convert] Starting conversion, blob size:', audioBlob.size, 'type:', audioBlob.type);

  // Decode the audio blob to an AudioBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  console.log('[MP3 Convert] ArrayBuffer size:', arrayBuffer.byteLength);

  const audioContext = new AudioContext();
  console.log('[MP3 Convert] AudioContext created, decoding...');

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  console.log('[MP3 Convert] Decoded - channels:', audioBuffer.numberOfChannels, 'sampleRate:', audioBuffer.sampleRate, 'duration:', audioBuffer.duration);

  // Get audio data as Float32Arrays
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  const audioData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    audioData.push(audioBuffer.getChannelData(i));
  }

  // Close the audio context
  await audioContext.close();

  // Initialize Web Worker if not already done
  if (!mp3Worker) {
    console.log('[MP3 Convert] Creating Web Worker...');
    mp3Worker = new Worker('/mp3-encoder-worker.js');
  }

  // Encode using Web Worker
  return new Promise((resolve, reject) => {
    if (!mp3Worker) {
      reject(new Error('Web Worker not available'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('MP3 encoding timeout'));
    }, 30000); // 30 second timeout

    mp3Worker.onmessage = (e) => {
      clearTimeout(timeoutId);

      if (e.data.error) {
        console.error('[MP3 Convert] Worker error:', e.data.error);
        reject(new Error(e.data.error));
        return;
      }

      if (e.data.progress !== undefined) {
        // Progress update - ignore for now
        return;
      }

      if (e.data.success && e.data.mp3Data) {
        console.log('[MP3 Convert] Worker success, output size:', e.data.mp3Data.byteLength);
        const mp3Blob = new Blob([e.data.mp3Data], { type: 'audio/mp3' });
        resolve(mp3Blob);
      }
    };

    mp3Worker.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('[MP3 Convert] Worker error:', error);
      reject(new Error('MP3 Worker error: ' + error.message));
    };

    // Send audio data to worker
    console.log('[MP3 Convert] Sending to worker...');
    mp3Worker.postMessage({
      cmd: 'encode',
      audioData: audioData,
      sampleRate: sampleRate,
      bitRate: 128
    });
  });
}

// LocalStorage keys
const STORAGE_KEYS = {
  IS_MONITORING: 'algo_live_is_monitoring',
  SELECTED_DEVICES: 'algo_live_selected_devices',
  SELECTED_INPUT: 'algo_live_selected_input',
  TARGET_VOLUME: 'algo_live_target_volume',
  INPUT_GAIN: 'algo_live_input_gain',
  AUDIO_THRESHOLD: 'algo_live_audio_threshold',
  USE_GLOBAL_VOLUME: 'algo_use_global_volume',
  RAMP_ENABLED: 'algo_live_ramp_enabled',
  RAMP_DURATION: 'algo_live_ramp_duration',
  DAY_NIGHT_MODE: 'algo_live_day_night_mode',
  DAY_START_HOUR: 'algo_live_day_start_hour',
  DAY_END_HOUR: 'algo_live_day_end_hour',
  NIGHT_RAMP_DURATION: 'algo_live_night_ramp_duration',
  SUSTAIN_DURATION: 'algo_live_sustain_duration',
  DISABLE_DELAY: 'algo_live_disable_delay',
  LOGGING_ENABLED: 'algo_live_logging_enabled',
  RECORDING_ENABLED: 'algo_live_recording_enabled',
  PLAYBACK_ENABLED: 'algo_live_playback_enabled',
};

export function AudioMonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [selectedInputDevice, setSelectedInputDeviceState] = useState<string>("");
  const [volume, setVolumeState] = useState(50);
  const [targetVolume, setTargetVolumeState] = useState(100);
  const [audioThreshold, setAudioThresholdState] = useState(5); // 5% default
  const [selectedDevices, setSelectedDevicesState] = useState<string[]>([]);
  const [devices, setDevices] = useState<AlgoDevice[]>([]);
  const [poeDevices, setPoeDevices] = useState<PoEDevice[]>([]);
  const [audioDetected, setAudioDetected] = useState(false);
  const [speakersEnabled, setSpeakersEnabled] = useState(false);

  // Logging
  const [logs, setLogs] = useState<AudioLogEntry[]>([]);
  const [loggingEnabled, setLoggingEnabledState] = useState(true); // enabled by default
  const [recordingEnabled, setRecordingEnabledState] = useState(false); // disabled by default to save storage
  const [playbackEnabled, setPlaybackEnabledState] = useState(false); // disabled by default

  // Volume mode
  const [useGlobalVolume, setUseGlobalVolumeState] = useState(false);

  // Speaker status tracking
  const [speakerStatuses, setSpeakerStatuses] = useState<SpeakerStatus[]>([]);

  // Ramp settings
  const [rampEnabled, setRampEnabledState] = useState(true);
  const [rampDuration, setRampDurationState] = useState(15); // 15 seconds default
  const [dayNightMode, setDayNightModeState] = useState(false);
  const [dayStartHour, setDayStartHourState] = useState(6); // 6 AM
  const [dayEndHour, setDayEndHourState] = useState(18); // 6 PM
  const [nightRampDuration, setNightRampDurationState] = useState(10); // 10 seconds for night
  const [sustainDuration, setSustainDurationState] = useState(1000); // 1 second default (in ms)
  const [disableDelay, setDisableDelayState] = useState(3000); // 3 seconds default (in ms)

  const audioDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controllingSpakersRef = useRef<boolean>(false);
  const volumeRampIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVolumeRef = useRef<number>(0);
  const hasRestoredStateRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const previousDayModeRef = useRef<boolean | null>(null);
  const dayNightCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sustained audio tracking
  const sustainedAudioStartRef = useRef<number | null>(null);
  const sustainCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speakersEnabledTimeRef = useRef<number | null>(null);
  const pagingWasEnabledRef = useRef<boolean>(false); // Track if we enabled paging during this session

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<string | null>(null);

  // Playback
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingLiveRef = useRef<boolean>(false); // Track if live playback is active
  const playbackPositionRef = useRef<number>(0); // Track playback position in seconds
  const [playbackAudioLevel, setPlaybackAudioLevel] = useState<number>(0);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const playbackAnimationFrameRef = useRef<number | null>(null);

  const {
    isCapturing,
    audioLevel,
    startCapture,
    stopCapture,
    setVolume: setGainVolume,
    mediaStream: monitoringStream,
  } = useAudioCapture();

  // Helper to add log entry
  const addLog = useCallback((entry: Omit<AudioLogEntry, "timestamp">) => {
    // Get PST timestamp
    const { timestamp, dateKey } = getPSTTime();

    const userEmail = user?.email || 'Unknown';
    const isAdmin = (user as any)?.role === 'admin';

    const logEntry: AudioLogEntry = {
      ...entry,
      timestamp,
      // Add user email prefix to message for attribution
      message: `[${userEmail}] ${entry.message}`,
    };

    // Always log to console for debugging
    debugLog(`[AudioLog] ${logEntry.message}`, logEntry);

    // Only add to logs if logging is enabled AND user is NOT admin
    if (!loggingEnabled || isAdmin) return;

    // Add to local state for backward compatibility
    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only last 500 entries to prevent memory issues
      if (newLogs.length > 500) {
        return newLogs.slice(-500);
      }
      return newLogs;
    });

    // Write to Firebase Realtime Database (only for non-admin users)
    if (user && !isAdmin) {
      const logRef = dbRef(realtimeDb, `logs/${user.uid}/${dateKey}`);
      const newLogRef = push(logRef);

      set(newLogRef, {
        timestamp,
        type: logEntry.type,
        message: logEntry.message, // Already has [email] prefix
        userId: user.uid,
        userEmail: userEmail,
        audioLevel: logEntry.audioLevel ?? null,
        audioThreshold: logEntry.audioThreshold ?? null,
        speakersEnabled: logEntry.speakersEnabled ?? null,
        volume: logEntry.volume ?? null,
        recordingUrl: logEntry.recordingUrl ?? null,
      }).catch(error => {
        console.error('[AudioLog] Failed to write log to Firebase:', error);
      });
    }
  }, [loggingEnabled, user]);

  // Get best supported audio mimeType
  const getBestAudioMimeType = useCallback(() => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('[Recording] Using mimeType:', type);
        return type;
      }
    }

    console.warn('[Recording] No preferred mimeType supported, using default');
    return '';
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      if (!recordingEnabled) {
        debugLog('[Recording] Recording is disabled, skipping');
        return;
      }

      if (!user) {
        console.warn('[Recording] No user authenticated, skipping recording');
        return;
      }

      // REUSE the monitoring stream instead of creating a new one
      if (!monitoringStream) {
        console.warn('[Recording] No monitoring stream available, skipping recording');
        return;
      }

      // DEBUG: Log information about the monitoring stream
      const audioTracks = monitoringStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        console.log('[Recording] 🎙️ Recording from monitoring stream:');
        console.log('  - Device Label:', track.label);
        console.log('  - Device ID:', track.getSettings().deviceId);
        console.log('  - Sample Rate:', track.getSettings().sampleRate);
        console.log('  - Channel Count:', track.getSettings().channelCount);
      } else {
        console.warn('[Recording] ⚠️ No audio tracks in monitoring stream!');
      }

      // Get best supported mimeType
      const mimeType = getBestAudioMimeType();

      // Create media recorder with best supported format
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(monitoringStream, options);

      recordedChunksRef.current = [];

      // Generate PST timestamp with AM/PM format
      const now = new Date();
      const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const year = pstTime.getFullYear();
      const month = String(pstTime.getMonth() + 1).padStart(2, '0');
      const day = String(pstTime.getDate()).padStart(2, '0');
      let hours = pstTime.getHours();
      const minutes = String(pstTime.getMinutes()).padStart(2, '0');
      const seconds = String(pstTime.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert to 12-hour format
      const hoursStr = String(hours).padStart(2, '0');

      recordingStartTimeRef.current = `${year}-${month}-${day}-${hoursStr}-${minutes}-${seconds}-${ampm}`;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;

      debugLog('[Recording] Started recording audio from monitoring stream with mimeType:', mimeType || 'default');
    } catch (error) {
      console.error('[Recording] Failed to start recording:', error);
    }
  }, [recordingEnabled, user, monitoringStream, getBestAudioMimeType]);

  // Stop recording and upload to Firebase (unless playback is enabled - then it's temporary only)
  const stopRecordingAndUpload = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder || !user || !recordingStartTimeRef.current) {
          resolve(null);
          return;
        }

        mediaRecorder.onstop = async () => {
          try {
            // Get the mimeType that was actually used
            const actualMimeType = mediaRecorder.mimeType || 'audio/webm';

            // Create blob from recorded chunks
            const audioBlob = new Blob(recordedChunksRef.current, { type: actualMimeType });

            if (audioBlob.size === 0) {
              console.warn('[Recording] No audio data recorded');
              resolve(null);
              return;
            }

            // Check if playback is enabled - if so, skip Firebase upload (temporary recording only)
            if (playbackEnabled) {
              console.log(`[Recording] Playback enabled - skipping Firebase upload (${audioBlob.size} bytes recorded for playback only)`);

              // Clean up temporary recording
              recordedChunksRef.current = [];
              recordingStartTimeRef.current = null;
              mediaRecorderRef.current = null;

              debugLog('[Recording] Temporary recording cleaned up (not saved to Firebase)');
              resolve(null);
              return;
            }

            // Determine file extension from mimeType
            let fileExtension = 'webm';
            if (actualMimeType.includes('opus')) {
              fileExtension = 'opus';
            } else if (actualMimeType.includes('ogg')) {
              fileExtension = 'ogg';
            } else if (actualMimeType.includes('mp4')) {
              fileExtension = 'm4a';
            }

            console.log(`[Recording] Saving ${audioBlob.size} bytes as ${fileExtension} (${actualMimeType})`);

            // Generate filename with PST timestamp (already formatted: YYYY-MM-DD-HH-MM-SS-AM/PM)
            const timestamp = recordingStartTimeRef.current!;
            const filename = `recording-${timestamp}.${fileExtension}`;
            const filePath = `audio-recordings/${user.uid}/${filename}`;

            // Upload to Firebase Storage
            debugLog(`[Recording] Uploading ${fileExtension.toUpperCase()} to ${filePath}`);
            const fileRef = storageRef(storage, filePath);
            await uploadBytes(fileRef, audioBlob);

            // Get download URL
            const downloadUrl = await getDownloadURL(fileRef);
            debugLog('[Recording] Upload successful:', downloadUrl);

            // Clean up
            recordedChunksRef.current = [];
            recordingStartTimeRef.current = null;
            mediaRecorderRef.current = null;

            // DON'T stop the stream tracks - we're reusing the monitoring stream!
            // The monitoring stream should only be stopped when stopMonitoring() is called

            resolve(downloadUrl);
          } catch (error) {
            console.error('[Recording] Upload failed:', error);
            resolve(null);
          }
        };

        mediaRecorder.stop();
      } catch (error) {
        console.error('[Recording] Stop failed:', error);
        resolve(null);
      }
    });
  }, [user, playbackEnabled]);

  // Setup AudioContext and Analyser (only once)
  const setupPlaybackAudioContext = useCallback(() => {
    if (playbackAudioContextRef.current && playbackAnalyserRef.current) {
      return; // Already setup
    }

    try {
      // Create AudioContext
      playbackAudioContextRef.current = new AudioContext();

      // Create analyser
      const analyser = playbackAudioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      playbackAnalyserRef.current = analyser;

      debugLog('[Playback] Created AudioContext and Analyser');

      // Start monitoring levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!playbackAnalyserRef.current || !isPlayingLiveRef.current) {
          setPlaybackAudioLevel(0);
          return;
        }

        playbackAnalyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS level (similar to input audio level calculation)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = dataArray[i] / 255;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, rms * 200); // Scale to 0-100%

        setPlaybackAudioLevel(level);

        // Continue monitoring
        playbackAnimationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('[Playback] Failed to setup AudioContext:', error);
    }
  }, []);

  // Connect audio element to analyser (called for EACH new audio element)
  const connectAudioElementToAnalyser = useCallback((audioElement: HTMLAudioElement) => {
    try {
      if (!playbackAudioContextRef.current || !playbackAnalyserRef.current) {
        console.warn('[Playback] AudioContext not ready, skipping connection');
        return;
      }

      // Connect this audio element to the existing analyser
      // IMPORTANT: Must connect to destination or audio won't play!
      const source = playbackAudioContextRef.current.createMediaElementSource(audioElement);
      source.connect(playbackAnalyserRef.current);
      playbackAnalyserRef.current.connect(playbackAudioContextRef.current.destination);

      debugLog('[Playback] Connected new audio element to analyser');
    } catch (error) {
      console.error('[Playback] Failed to connect audio element:', error);
      // Continue playback even if connection fails
    }
  }, []);

  // Stop playback level tracking
  const stopPlaybackLevelTracking = useCallback(() => {
    if (playbackAnimationFrameRef.current) {
      cancelAnimationFrame(playbackAnimationFrameRef.current);
      playbackAnimationFrameRef.current = null;
    }
    setPlaybackAudioLevel(0);
    debugLog('[Playback] Stopped audio level tracking');
  }, []);

  // Continue playing (for live streaming effect)
  const continuePlayback = useCallback(async () => {
    try {
      // Check if we should continue playing
      if (!isPlayingLiveRef.current || !playbackEnabled) {
        debugLog('[Playback] Live playback stopped or disabled');
        return;
      }

      // Check if there are chunks to play
      if (recordedChunksRef.current.length === 0) {
        console.warn('[Playback] No chunks available for playback');
        setTimeout(() => continuePlayback(), 100);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      const isRecording = mediaRecorder?.state === 'recording';

      if (!isRecording && !playbackAudioRef.current) {
        // Recording stopped and no audio playing, we're done
        debugLog('[Playback] Recording stopped, live stream complete');
        isPlayingLiveRef.current = false;
        return;
      }

      // Get the mimeType from MediaRecorder
      const mimeType = mediaRecorder?.mimeType || 'audio/webm';

      // Create blob from ALL chunks (full recording so far)
      const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      debugLog(`[Playback] LIVE STREAM: Playing from ${playbackPositionRef.current.toFixed(2)}s (total: ${(audioBlob.size / 1024).toFixed(1)}KB)`);

      // Create audio element
      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;

      // Setup AudioContext and Analyser (only once on first audio element)
      if (!playbackAudioContextRef.current) {
        setupPlaybackAudioContext();
      }

      // Connect THIS audio element to the analyser (every time)
      connectAudioElementToAnalyser(audio);

      // Set playback position to where we left off
      audio.currentTime = playbackPositionRef.current;

      audio.ontimeupdate = () => {
        // Track current playback position
        playbackPositionRef.current = audio.currentTime;
      };

      audio.onended = () => {
        const finalPosition = audio.currentTime || audio.duration || 0;
        playbackPositionRef.current = finalPosition;

        debugLog(`[Playback] Reached end at ${finalPosition.toFixed(2)}s, continuing live stream...`);
        URL.revokeObjectURL(audioUrl);
        playbackAudioRef.current = null;

        // Continue playing if still in live mode
        if (isPlayingLiveRef.current) {
          setTimeout(() => continuePlayback(), 100);
        }
      };

      audio.onerror = (error) => {
        console.error('[Playback] Playback error:', error);
        URL.revokeObjectURL(audioUrl);
        playbackAudioRef.current = null;

        // Try to continue despite error
        if (isPlayingLiveRef.current) {
          setTimeout(() => continuePlayback(), 500);
        }
      };

      await audio.play();
    } catch (error) {
      console.error('[Playback] Failed to continue playback:', error);
      // Try to recover
      if (isPlayingLiveRef.current) {
        setTimeout(() => continuePlayback(), 500);
      }
    }
  }, [playbackEnabled, setupPlaybackAudioContext, connectAudioElementToAnalyser]);

  // Start live playback from recorded chunks
  const startPlayback = useCallback(async () => {
    try {
      if (!playbackEnabled) {
        debugLog('[Playback] Playback disabled, skipping');
        return;
      }

      if (recordedChunksRef.current.length === 0) {
        console.warn('[Playback] No recorded chunks available yet');
        return;
      }

      // Stop any existing playback
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current = null;
      }

      // Enable live playback mode
      isPlayingLiveRef.current = true;
      playbackPositionRef.current = 0; // Start from beginning

      console.log(`[Playback] 🔴 Starting LIVE STREAM playback`);

      addLog({
        type: "audio_detected",
        message: `Started live playback streaming (${recordedChunksRef.current.length} initial chunks)`,
      });

      // Start the live playback loop
      await continuePlayback();
    } catch (error) {
      console.error('[Playback] Failed to start playback:', error);
      isPlayingLiveRef.current = false;
    }
  }, [playbackEnabled, addLog, continuePlayback]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    console.log('[Playback] 🛑 Stopping live stream playback');

    // Disable live playback mode first
    isPlayingLiveRef.current = false;
    playbackPositionRef.current = 0;

    // Stop audio level tracking
    stopPlaybackLevelTracking();

    // Stop current audio
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }

    // Clean up AudioContext
    if (playbackAudioContextRef.current) {
      playbackAudioContextRef.current.close();
      playbackAudioContextRef.current = null;
      playbackAnalyserRef.current = null;
      debugLog('[Playback] Cleaned up AudioContext');
    }

    addLog({
      type: "audio_silent",
      message: "Stopped live playback stream",
    });
  }, [addLog, stopPlaybackLevelTracking]);

  // Update gain when volume changes
  useEffect(() => {
    setGainVolume(volume);
  }, [volume, setGainVolume]);

  // Initialize and restore state from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    debugLog('[AudioMonitoring] Initializing and restoring state...');

    try {
      const savedDevices = localStorage.getItem(STORAGE_KEYS.SELECTED_DEVICES);
      const savedInput = localStorage.getItem(STORAGE_KEYS.SELECTED_INPUT);
      const savedTargetVolume = localStorage.getItem(STORAGE_KEYS.TARGET_VOLUME);
      const savedInputGain = localStorage.getItem(STORAGE_KEYS.INPUT_GAIN);
      const savedAudioThreshold = localStorage.getItem(STORAGE_KEYS.AUDIO_THRESHOLD);
      const savedRampEnabled = localStorage.getItem(STORAGE_KEYS.RAMP_ENABLED);
      const savedRampDuration = localStorage.getItem(STORAGE_KEYS.RAMP_DURATION);
      const savedDayNightMode = localStorage.getItem(STORAGE_KEYS.DAY_NIGHT_MODE);
      const savedDayStartHour = localStorage.getItem(STORAGE_KEYS.DAY_START_HOUR);
      const savedDayEndHour = localStorage.getItem(STORAGE_KEYS.DAY_END_HOUR);
      const savedNightRampDuration = localStorage.getItem(STORAGE_KEYS.NIGHT_RAMP_DURATION);
      const savedSustainDuration = localStorage.getItem(STORAGE_KEYS.SUSTAIN_DURATION);
      const savedDisableDelay = localStorage.getItem(STORAGE_KEYS.DISABLE_DELAY);
      const savedLoggingEnabled = localStorage.getItem(STORAGE_KEYS.LOGGING_ENABLED);
      const savedRecordingEnabled = localStorage.getItem(STORAGE_KEYS.RECORDING_ENABLED);
      const savedUseGlobalVolume = localStorage.getItem(STORAGE_KEYS.USE_GLOBAL_VOLUME);
      const wasMonitoring = localStorage.getItem(STORAGE_KEYS.IS_MONITORING) === 'true';

      debugLog('[AudioMonitoring] Saved state:', {
        devices: savedDevices,
        input: savedInput,
        targetVolume: savedTargetVolume,
        inputGain: savedInputGain,
        audioThreshold: savedAudioThreshold,
        rampEnabled: savedRampEnabled,
        rampDuration: savedRampDuration,
        dayNightMode: savedDayNightMode,
        dayStartHour: savedDayStartHour,
        dayEndHour: savedDayEndHour,
        nightRampDuration: savedNightRampDuration,
        wasMonitoring,
      });

      if (savedDevices && savedDevices !== 'undefined') {
        try {
          const deviceIds = JSON.parse(savedDevices);
          debugLog('[AudioMonitoring] Restoring selected devices:', deviceIds);
          setSelectedDevicesState(deviceIds);
        } catch (error) {
          console.error('[AudioMonitoring] Failed to parse saved devices:', error);
          setSelectedDevicesState([]);
        }
      }
      if (savedInput) {
        debugLog('[AudioMonitoring] Restoring input device:', savedInput);
        setSelectedInputDeviceState(savedInput);
      }
      if (savedTargetVolume) {
        setTargetVolumeState(parseInt(savedTargetVolume));
      }
      if (savedInputGain) {
        setVolumeState(parseInt(savedInputGain));
      }
      if (savedAudioThreshold) {
        setAudioThresholdState(parseInt(savedAudioThreshold));
      }
      if (savedRampEnabled !== null) {
        setRampEnabledState(savedRampEnabled === 'true');
      }
      if (savedRampDuration) {
        setRampDurationState(parseInt(savedRampDuration));
      }
      if (savedDayNightMode !== null) {
        setDayNightModeState(savedDayNightMode === 'true');
      }
      if (savedDayStartHour) {
        setDayStartHourState(parseInt(savedDayStartHour));
      }
      if (savedDayEndHour) {
        setDayEndHourState(parseInt(savedDayEndHour));
      }
      if (savedNightRampDuration) {
        setNightRampDurationState(parseInt(savedNightRampDuration));
      }
      if (savedSustainDuration) {
        setSustainDurationState(parseInt(savedSustainDuration));
      }
      if (savedDisableDelay) {
        setDisableDelayState(parseInt(savedDisableDelay));
      }
      if (savedLoggingEnabled !== null) {
        setLoggingEnabledState(savedLoggingEnabled === 'true');
      }
      if (savedRecordingEnabled !== null) {
        setRecordingEnabledState(savedRecordingEnabled === 'true');
      }
      if (savedUseGlobalVolume !== null) {
        setUseGlobalVolumeState(savedUseGlobalVolume === 'true');
      }
      const savedPlaybackEnabled = localStorage.getItem(STORAGE_KEYS.PLAYBACK_ENABLED);
      if (savedPlaybackEnabled !== null) {
        setPlaybackEnabledState(savedPlaybackEnabled === 'true');
      }

      // Mark as restored
      setTimeout(() => {
        hasRestoredStateRef.current = true;
        debugLog('[AudioMonitoring] State restoration complete');
      }, 100);

      // Auto-start monitoring if it was active before
      if (wasMonitoring) {
        debugLog('[AudioMonitoring] Auto-resuming monitoring from previous session');
        setTimeout(() => {
          startCapture(savedInput || undefined);
        }, 500);
      }
    } catch (error) {
      console.error('[AudioMonitoring] Failed to restore state:', error);
      hasRestoredStateRef.current = true;
    }
  }, [startCapture]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving selected devices:', selectedDevices);
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICES, JSON.stringify(selectedDevices));
  }, [selectedDevices]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving input device:', selectedInputDevice);
    localStorage.setItem(STORAGE_KEYS.SELECTED_INPUT, selectedInputDevice);
  }, [selectedInputDevice]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving target volume:', targetVolume);
    localStorage.setItem(STORAGE_KEYS.TARGET_VOLUME, targetVolume.toString());
  }, [targetVolume]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving input gain:', volume);
    localStorage.setItem(STORAGE_KEYS.INPUT_GAIN, volume.toString());
  }, [volume]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving monitoring state:', isCapturing);
    localStorage.setItem(STORAGE_KEYS.IS_MONITORING, isCapturing.toString());
  }, [isCapturing]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving audio threshold:', audioThreshold);
    localStorage.setItem(STORAGE_KEYS.AUDIO_THRESHOLD, audioThreshold.toString());
  }, [audioThreshold]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving ramp enabled:', rampEnabled);
    localStorage.setItem(STORAGE_KEYS.RAMP_ENABLED, rampEnabled.toString());
  }, [rampEnabled]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving ramp duration:', rampDuration);
    localStorage.setItem(STORAGE_KEYS.RAMP_DURATION, rampDuration.toString());
  }, [rampDuration]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving day/night mode:', dayNightMode);
    localStorage.setItem(STORAGE_KEYS.DAY_NIGHT_MODE, dayNightMode.toString());
  }, [dayNightMode]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving day start hour:', dayStartHour);
    localStorage.setItem(STORAGE_KEYS.DAY_START_HOUR, dayStartHour.toString());
  }, [dayStartHour]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving day end hour:', dayEndHour);
    localStorage.setItem(STORAGE_KEYS.DAY_END_HOUR, dayEndHour.toString());
  }, [dayEndHour]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving night ramp duration:', nightRampDuration);
    localStorage.setItem(STORAGE_KEYS.NIGHT_RAMP_DURATION, nightRampDuration.toString());
  }, [nightRampDuration]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving sustain duration:', sustainDuration);
    localStorage.setItem(STORAGE_KEYS.SUSTAIN_DURATION, sustainDuration.toString());
  }, [sustainDuration]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving disable delay:', disableDelay);
    localStorage.setItem(STORAGE_KEYS.DISABLE_DELAY, disableDelay.toString());
  }, [disableDelay]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving logging enabled:', loggingEnabled);
    localStorage.setItem(STORAGE_KEYS.LOGGING_ENABLED, loggingEnabled.toString());
  }, [loggingEnabled]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving recording enabled:', recordingEnabled);
    localStorage.setItem(STORAGE_KEYS.RECORDING_ENABLED, recordingEnabled.toString());
  }, [recordingEnabled]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving global volume mode:', useGlobalVolume);
    localStorage.setItem(STORAGE_KEYS.USE_GLOBAL_VOLUME, useGlobalVolume.toString());
  }, [useGlobalVolume]);

  useEffect(() => {
    if (!hasRestoredStateRef.current) return;
    debugLog('[AudioMonitoring] Saving playback enabled:', playbackEnabled);
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_ENABLED, playbackEnabled.toString());
  }, [playbackEnabled]);

  // Watch for target volume changes - restart ramp if speakers are enabled
  useEffect(() => {
    if (!hasRestoredStateRef.current) return;

    // Only restart ramp if:
    // 1. Speakers are currently enabled
    // 2. Not currently controlling speakers
    // 3. Speakers were ALREADY enabled (don't trigger on initial enable)
    if (speakersEnabled && !controllingSpakersRef.current) {
      // Check if this is the initial enable (currentVolume should still be 0)
      const currentVolume = currentVolumeRef.current;

      // Don't start ramp on initial monitoring start - wait for audio detection
      // Only start ramp when targetVolume changes while already monitoring
      if (currentVolume > 0 || audioDetected) {
        debugLog(`[AudioMonitoring] Target volume changed, restarting ramp from ${currentVolume}% to ${targetVolume}%`);
        startVolumeRamp(currentVolume);
      } else {
        debugLog(`[AudioMonitoring] Speakers enabled but waiting for audio detection before ramping`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetVolume, speakersEnabled]);

  // Set volume on all linked speakers (8180s)
  // volumePercent is the "ramp percentage" (0-100)
  // If useGlobalVolume=true: all speakers use volumePercent directly
  // If useGlobalVolume=false: volumePercent is scaled by each speaker's maxVolume
  const setDevicesVolume = useCallback(async (volumePercent: number) => {
    const linkedSpeakerIds = new Set<string>();

    // Safety check: ensure selectedDevices is iterable
    const safeSelectedDevices = selectedDevices || [];

    for (const deviceId of safeSelectedDevices) {
      const device = devices.find(d => d.id === deviceId);
      if (!device) continue;

      if (device.type === "8301" && device.linkedSpeakerIds) {
        device.linkedSpeakerIds.forEach(id => linkedSpeakerIds.add(id));
      }
    }

    debugLog(`[AudioMonitoring] setDevicesVolume(${volumePercent}%) - processing ${linkedSpeakerIds.size} speakers`);

    const volumePromises = Array.from(linkedSpeakerIds).map(async (speakerId) => {
      const speaker = devices.find(d => d.id === speakerId);
      if (!speaker) {
        debugLog(`[AudioMonitoring] Speaker ${speakerId} not found in devices array`);
        return;
      }

      // Skip speakers without proper credentials
      if (!speaker.ipAddress || !speaker.apiPassword) {
        console.warn(`[AudioMonitoring] Skipping ${speaker.name || speakerId}: missing IP or password`);
        return;
      }

      // Calculate actual volume based on mode
      let actualVolume: number;
      if (useGlobalVolume) {
        // Global mode: all speakers use targetVolume (with ramping if enabled)
        // volumePercent comes from the ramp (0-100% of targetVolume)
        actualVolume = volumePercent;
        debugLog(`[AudioMonitoring] GLOBAL MODE - Setting ${speaker.name} to ${actualVolume.toFixed(0)}%`);
      } else {
        // Individual mode: each speaker ramps to its own maxVolume
        // volumePercent represents the ramp progress (0-100%)
        // At 0%: speaker is at 0%, at 100%: speaker is at its maxVolume
        const speakerMaxVolume = speaker.maxVolume ?? 100;
        actualVolume = (volumePercent / 100) * speakerMaxVolume;
        debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Setting ${speaker.name} to ${volumePercent.toFixed(0)}% of its max ${speakerMaxVolume}% = ${actualVolume.toFixed(0)}% (Level ${Math.round(actualVolume/10)})`);
      }

      // Convert 0-100% to dB
      // SPECIAL CASE: 0% = idle volume (IDLE state - quietest before needing multicast control)
      // Normal range: Algo expects 1=-27dB, 2=-24dB, ... 10=0dB
      // Formula: dB = (level - 10) * 3
      let volumeDbString: string;
      if (actualVolume === 0) {
        volumeDbString = getIdleVolumeString(); // IDLE state - level -5 (quietest volume)
      } else {
        const volumeScale = Math.round((actualVolume / 100) * 10);
        const volumeDb = (volumeScale - 10) * 3;
        volumeDbString = volumeDb === 0 ? "0dB" : `${volumeDb}dB`;
      }

      debugLog(`[AudioMonitoring] ${speaker.name} final: ${actualVolume.toFixed(0)}% → ${volumeDbString}`);

      try {
        const response = await fetch("/api/algo/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipAddress: speaker.ipAddress,
            password: speaker.apiPassword,
            authMethod: speaker.authMethod || "standard",
            settings: {
              "audio.page.vol": volumeDbString,
            },
          }),
        });

        if (!response.ok) {
          // Only log as warning (not error) - offline speakers are expected
          const errorText = await response.text().catch(() => 'Unknown error');
          debugLog(`[AudioMonitoring] ❌ Failed to set ${speaker.name} volume: ${errorText}`);
        } else {
          debugLog(`[AudioMonitoring] ✓ Successfully set ${speaker.name} to ${volumeDbString}`);
        }
      } catch (error) {
        // Network error - speaker might be offline, just skip silently
        debugLog(`[AudioMonitoring] ❌ Network error setting ${speaker.name} volume`);
      }
    });

    // Use allSettled to continue even if some speakers fail
    await Promise.allSettled(volumePromises);
    debugLog(`[AudioMonitoring] setDevicesVolume(${volumePercent}%) - completed`);
  }, [selectedDevices, devices, useGlobalVolume]);

  // Helper function to determine if it's currently daytime (supports half-hour intervals)
  const isDaytime = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Convert to decimal hours (e.g., 6:30 = 6.5, 14:30 = 14.5)
    const currentTime = currentHour + (currentMinute >= 30 ? 0.5 : 0);
    return currentTime >= dayStartHour && currentTime < dayEndHour;
  }, [dayStartHour, dayEndHour]);

  // Get the effective ramp duration based on settings
  const getEffectiveRampDuration = useCallback(() => {
    // If ramp is disabled, return 0 (instant)
    if (!rampEnabled) {
      debugLog('[AudioMonitoring] Ramp disabled - instant volume');
      return 0;
    }

    // If day/night mode is enabled, check time of day
    if (dayNightMode) {
      if (isDaytime()) {
        debugLog('[AudioMonitoring] Daytime detected - instant volume');
        return 0; // Instant during day
      } else {
        debugLog(`[AudioMonitoring] Nighttime detected - ${nightRampDuration}s ramp`);
        return nightRampDuration * 1000; // Night ramp duration in ms
      }
    }

    // Otherwise use the manual ramp duration setting
    debugLog(`[AudioMonitoring] Manual mode - ${rampDuration}s ramp`);
    return rampDuration * 1000;
  }, [rampEnabled, dayNightMode, isDaytime, rampDuration, nightRampDuration]);

  // Set all speakers to getIdleVolumeString() (idle state - quietest volume before needing multicast control)
  const setDevicesVolumeToIdle = useCallback(async () => {
    const linkedSpeakerIds = new Set<string>();

    for (const deviceId of selectedDevices) {
      const device = devices.find(d => d.id === deviceId);
      if (!device) continue;

      if (device.type === "8301" && device.linkedSpeakerIds) {
        device.linkedSpeakerIds.forEach(id => linkedSpeakerIds.add(id));
      }
    }

    debugLog(`[AudioMonitoring] Setting ${linkedSpeakerIds.size} speakers to IDLE (${getIdleVolumeString()})`);

    const volumePromises = Array.from(linkedSpeakerIds).map(async (speakerId) => {
      const speaker = devices.find(d => d.id === speakerId);
      if (!speaker || !speaker.ipAddress || !speaker.apiPassword) return;

      try {
        await fetch("/api/algo/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipAddress: speaker.ipAddress,
            password: speaker.apiPassword,
            authMethod: speaker.authMethod || "standard",
            settings: {
              "audio.page.vol": getIdleVolumeString(), // IDLE state - quietest volume (level -5)
            },
          }),
        });
        debugLog(`[AudioMonitoring] ✓ Set ${speaker.name} to IDLE (${getIdleVolumeString()})`);
      } catch (error) {
        debugLog(`[AudioMonitoring] ❌ Failed to set ${speaker.name} to idle`);
      }
    });

    await Promise.allSettled(volumePromises);
  }, [selectedDevices, devices]);

  // Ramp volume from startFrom to target
  // IMPORTANT: Ramp now starts at 10% (level 1), NOT 0%, to skip inaudible negative dB levels
  const startVolumeRamp = useCallback((startFrom: number = 0) => {
    if (volumeRampIntervalRef.current) {
      clearInterval(volumeRampIntervalRef.current);
    }

    const effectiveRampDuration = getEffectiveRampDuration();

    // Individual mode: Ramp to 100% (each speaker will scale to its maxVolume)
    // Global mode: Ramp to targetVolume (all speakers use same volume)
    const rampTarget = useGlobalVolume ? targetVolume : 100;

    // If ramp duration is 0 (instant), jump directly from idle volume to target volume
    if (effectiveRampDuration === 0) {
      if (useGlobalVolume) {
        debugLog(`[AudioMonitoring] GLOBAL MODE - Instant jump: ${getIdleVolumeString()} → ${targetVolume}%`);
      } else {
        debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Instant jump: ${getIdleVolumeString()} → each speaker to its max`);
      }
      currentVolumeRef.current = rampTarget;
      setDevicesVolume(rampTarget);
      return;
    }

    // OPTIMIZATION: Start ramp at level 1 (10%), NOT 0%
    // This skips all the inaudible negative dB levels (getIdleVolumeString(), -30dB, -27dB, etc.)
    // Ramp: getIdleVolumeString() (static) → 10% (audible) → 20% → ... → target (much faster!)
    const rampStart = 10; // Level 1 (10%) = -27dB (first audible level)
    currentVolumeRef.current = rampStart;

    const stepInterval = 500;
    const steps = effectiveRampDuration / stepInterval;
    const volumeDiff = rampTarget - rampStart;
    const volumeIncrement = volumeDiff / steps;

    if (useGlobalVolume) {
      debugLog(`[AudioMonitoring] GLOBAL MODE - Optimized ramp: ${getIdleVolumeString()} → ${rampStart}% → ${targetVolume}% over ${effectiveRampDuration/1000}s`);
    } else {
      debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Optimized ramp: ${getIdleVolumeString()} → ${rampStart}% → 100% (each speaker to its max) over ${effectiveRampDuration/1000}s`);
    }

    // Set initial volume to level 1 (10%) - skip inaudible levels!
    setDevicesVolume(rampStart);

    volumeRampIntervalRef.current = setInterval(() => {
      currentVolumeRef.current += volumeIncrement;

      if (volumeIncrement > 0 && currentVolumeRef.current >= rampTarget) {
        // Ramping up
        currentVolumeRef.current = rampTarget;
        setDevicesVolume(rampTarget);
        if (volumeRampIntervalRef.current) {
          clearInterval(volumeRampIntervalRef.current);
          volumeRampIntervalRef.current = null;
        }
        debugLog(`[AudioMonitoring] Volume ramp complete at ${rampTarget}%`);
      } else if (volumeIncrement < 0 && currentVolumeRef.current <= rampTarget) {
        // Ramping down
        currentVolumeRef.current = rampTarget;
        setDevicesVolume(rampTarget);
        if (volumeRampIntervalRef.current) {
          clearInterval(volumeRampIntervalRef.current);
          volumeRampIntervalRef.current = null;
        }
        debugLog(`[AudioMonitoring] Volume ramp complete at ${rampTarget}%`);
      } else {
        setDevicesVolume(currentVolumeRef.current);
      }
    }, stepInterval);
  }, [targetVolume, useGlobalVolume, setDevicesVolume, getEffectiveRampDuration]);

  const stopVolumeRamp = useCallback(() => {
    if (volumeRampIntervalRef.current) {
      clearInterval(volumeRampIntervalRef.current);
      volumeRampIntervalRef.current = null;
    }
    currentVolumeRef.current = 0;
    // Set all speakers to getIdleVolumeString() (quietest volume - still has static at this level)
    setDevicesVolumeToIdle();
  }, []);

  // Auto-detect day/night mode changes while monitoring (24/7 operation)
  useEffect(() => {
    // Clear any existing interval first to prevent memory leaks
    if (dayNightCheckIntervalRef.current) {
      clearInterval(dayNightCheckIntervalRef.current);
      dayNightCheckIntervalRef.current = null;
    }

    // Only run if day/night mode is enabled
    if (!dayNightMode) {
      previousDayModeRef.current = null;
      return;
    }

    // Check every minute for day/night transitions
    dayNightCheckIntervalRef.current = setInterval(() => {
      // Calculate current day/night status directly to avoid function dependency
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Convert to decimal hours for comparison with half-hour intervals
      const currentTime = currentHour + (currentMinute >= 30 ? 0.5 : 0);
      const currentIsDaytime = currentTime >= dayStartHour && currentTime < dayEndHour;

      // Initialize on first run
      if (previousDayModeRef.current === null) {
        previousDayModeRef.current = currentIsDaytime;
        debugLog(`[AudioMonitoring] Day/night monitor initialized: ${currentIsDaytime ? 'DAY' : 'NIGHT'}`);
        return;
      }

      // Check if day/night mode changed
      if (previousDayModeRef.current !== currentIsDaytime) {
        debugLog(`[AudioMonitoring] ⏰ Day/night mode changed: ${previousDayModeRef.current ? 'DAY' : 'NIGHT'} → ${currentIsDaytime ? 'DAY' : 'NIGHT'}`);
        previousDayModeRef.current = currentIsDaytime;

        // If speakers are currently enabled, restart the ramp with new settings
        // Use refs to check current state without adding to dependencies
        if (speakersEnabled && !controllingSpakersRef.current) {
          const currentVolume = currentVolumeRef.current;
          debugLog(`[AudioMonitoring] Restarting volume ramp due to day/night change from ${currentVolume}%`);
          startVolumeRamp(currentVolume);
        }
      }
    }, 60000); // Check every 60 seconds

    debugLog(`[AudioMonitoring] Day/night checker started (enabled: ${dayNightMode})`);

    return () => {
      if (dayNightCheckIntervalRef.current) {
        debugLog(`[AudioMonitoring] Day/night checker stopped (cleanup)`);
        clearInterval(dayNightCheckIntervalRef.current);
        dayNightCheckIntervalRef.current = null;
      }
    };
    // Only depend on stable values - not functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNightMode, dayStartHour, dayEndHour]);

  // Set paging device multicast mode (0=disabled, 1=transmitter, 2=receiver)
  // Smart: Checks current mode first to avoid redundant API calls
  const setPagingMulticast = useCallback(async (mode: 0 | 1 | 2) => {
    // CRITICAL: Only control SELECTED paging devices, not all paging devices!
    const pagingDevices = devices.filter(d =>
      d.type === "8301" && selectedDevices.includes(d.id)
    );

    if (pagingDevices.length === 0) {
      debugLog('[AudioMonitoring] No selected paging devices found');
      return;
    }

    debugLog(`[AudioMonitoring] Checking ${pagingDevices.length} selected paging device(s) before setting mode ${mode}...`);

    await Promise.allSettled(
      pagingDevices.map(async (paging) => {
        try {
          // First, check current mode (with error handling)
          let shouldProceed = true;

          try {
            const checkResponse = await fetch("/api/algo/settings/get", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ipAddress: paging.ipAddress,
                password: paging.apiPassword,
                authMethod: paging.authMethod,
                setting: "mcast.mode",
              }),
            });

            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const currentMode = checkData.value;

              if (currentMode === mode.toString()) {
                debugLog(`[AudioMonitoring] ⏭️  ${paging.name} already at mode ${mode}, skipping`);
                addLog({
                  type: "speakers_enabled",
                  message: `Paging ${paging.name} already at mode ${mode}, skipped redundant call`,
                });
                return; // Already at target mode, skip
              }

              debugLog(`[AudioMonitoring] ${paging.name} is mode ${currentMode}, changing to ${mode}...`);
            } else {
              console.warn(`[AudioMonitoring] Failed to check ${paging.name} mode (HTTP ${checkResponse.status}), proceeding with mode change anyway`);
            }
          } catch (checkError) {
            console.warn(`[AudioMonitoring] Failed to check ${paging.name} mode:`, checkError);
            console.warn(`[AudioMonitoring] Proceeding with mode change anyway...`);
          }

          // Proceed with mode change
          await fetch("/api/algo/speakers/mcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              speakers: [{
                ipAddress: paging.ipAddress,
                password: paging.apiPassword,
                authMethod: paging.authMethod,
              }],
              mode,
            }),
          });
          debugLog(`[AudioMonitoring] ✓ Set ${paging.name} to mode ${mode}`);
          addLog({
            type: "speakers_enabled",
            message: `Paging ${paging.name} mode ${mode} activated`,
          });
        } catch (error) {
          console.error(`Failed to set ${paging.name} multicast mode:`, error);
        }
      })
    );
  }, [devices, selectedDevices, addLog]);

  // Wait for paging device to be ready by polling until mcast.mode = 1
  const waitForPagingReady = useCallback(async (): Promise<void> => {
    // CRITICAL: Only poll SELECTED paging devices, not all paging devices!
    const pagingDevices = devices.filter(d =>
      d.type === "8301" && selectedDevices.includes(d.id)
    );

    if (pagingDevices.length === 0) {
      console.warn('[AudioMonitoring] No selected paging devices to poll');
      return;
    }

    const paging = pagingDevices[0]; // Use first paging device
    const startTime = Date.now();
    const maxWaitMs = 5000; // Maximum 5 seconds
    const pollInterval = 200; // Check every 200ms

    debugLog(`[AudioMonitoring] 🔄 Polling ${paging.name} until mcast.mode = 1...`);

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Poll the mcast.mode setting
        const response = await fetch("/api/algo/settings/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipAddress: paging.ipAddress,
            password: paging.apiPassword,
            authMethod: paging.authMethod,
            setting: "mcast.mode",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const currentMode = data.value;

          if (currentMode === "1") {
            const elapsed = Date.now() - startTime;
            debugLog(`[AudioMonitoring] ✅ Paging device ready! Mode = 1 after ${elapsed}ms`);
            return; // Device is ready!
          }

          debugLog(`[AudioMonitoring] ⏳ Mode = ${currentMode}, waiting... (${Date.now() - startTime}ms)`);
        }
      } catch (error) {
        debugLog(`[AudioMonitoring] Polling error: ${error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - proceed anyway
    console.warn(`[AudioMonitoring] ⚠️ Timeout waiting for paging device, proceeding anyway after ${maxWaitMs}ms`);
  }, [devices, selectedDevices]);

  // Wait for paging device to turn OFF by polling until mcast.mode = 0
  const waitForPagingOff = useCallback(async (): Promise<void> => {
    // CRITICAL: Only poll SELECTED paging devices, not all paging devices!
    const pagingDevices = devices.filter(d =>
      d.type === "8301" && selectedDevices.includes(d.id)
    );

    if (pagingDevices.length === 0) {
      console.warn('[AudioMonitoring] No selected paging devices to poll for OFF');
      return;
    }

    const paging = pagingDevices[0]; // Use first paging device
    const startTime = Date.now();
    const maxWaitMs = 10000; // Maximum 10 seconds for turning off (devices can be slow)
    const pollInterval = 200; // Check every 200ms

    debugLog(`[AudioMonitoring] 🔄 Polling ${paging.name} until mcast.mode = 0 (OFF)...`);

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Poll the mcast.mode setting
        const response = await fetch("/api/algo/settings/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipAddress: paging.ipAddress,
            password: paging.apiPassword,
            authMethod: paging.authMethod,
            setting: "mcast.mode",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const currentMode = data.value;

          if (currentMode === "0") {
            const elapsed = Date.now() - startTime;
            debugLog(`[AudioMonitoring] ✅ Paging device OFF! Mode = 0 after ${elapsed}ms`);
            return; // Device is off!
          }

          debugLog(`[AudioMonitoring] ⏳ Mode = ${currentMode}, waiting for OFF... (${Date.now() - startTime}ms)`);
        }
      } catch (error) {
        debugLog(`[AudioMonitoring] Polling error: ${error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - proceed anyway
    console.warn(`[AudioMonitoring] ⚠️ Timeout waiting for paging device to turn OFF, proceeding anyway after ${maxWaitMs}ms`);
  }, [devices, selectedDevices]);

  // Set all speakers multicast mode (0=disabled, 1=transmitter, 2=receiver)
  const setSpeakersMulticast = useCallback(async (mode: 0 | 1 | 2) => {
    const linkedSpeakerIds = new Set<string>();

    for (const deviceId of selectedDevices) {
      const device = devices.find(d => d.id === deviceId);
      if (!device) continue;

      if (device.type === "8301" && device.linkedSpeakerIds) {
        device.linkedSpeakerIds.forEach(id => linkedSpeakerIds.add(id));
      }
    }

    const speakers = Array.from(linkedSpeakerIds)
      .map(id => devices.find(d => d.id === id))
      .filter((s): s is AlgoDevice => !!s);

    if (speakers.length === 0) {
      debugLog('[AudioMonitoring] No speakers to control');
      return;
    }

    debugLog(`[AudioMonitoring] Setting ${speakers.length} speakers to multicast mode ${mode}`);

    await Promise.allSettled(
      speakers.map(async (speaker) => {
        try {
          await fetch("/api/algo/speakers/mcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              speakers: [{
                ipAddress: speaker.ipAddress,
                password: speaker.apiPassword,
                authMethod: speaker.authMethod,
              }],
              mode,
            }),
          });
          debugLog(`[AudioMonitoring] ✓ Set ${speaker.name} to mode ${mode}`);
        } catch (error) {
          console.error(`Failed to set ${speaker.name} multicast mode:`, error);
        }
      })
    );
  }, [selectedDevices, devices]);

  // Enable/disable speakers (LEGACY - kept for backward compatibility)
  const controlSpeakers = useCallback(async (enable: boolean) => {
    const allSpeakerPromises: Promise<void>[] = [];

    for (const deviceId of selectedDevices) {
      const device = devices.find(d => d.id === deviceId);
      if (!device) continue;

      if (device.type === "8301" && device.linkedSpeakerIds && device.linkedSpeakerIds.length > 0) {
        const linkedSpeakers = devices.filter(d => device.linkedSpeakerIds?.includes(d.id));

        debugLog(`[AudioMonitoring] ${enable ? 'Enabling' : 'Disabling'} ${linkedSpeakers.length} speakers for ${device.name}`);

        // Control each speaker individually for better error resilience
        linkedSpeakers.forEach(speaker => {
          const promise = (async () => {
            try {
              const response = await fetch("/api/algo/speakers/mcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  speakers: [{
                    ipAddress: speaker.ipAddress,
                    password: speaker.apiPassword,
                    authMethod: speaker.authMethod,
                  }],
                  enable,
                }),
              });

              if (!response.ok) {
                console.error(`Failed to ${enable ? 'enable' : 'disable'} speaker ${speaker.name}: HTTP ${response.status}`);
              } else {
                debugLog(`[AudioMonitoring] Successfully ${enable ? 'enabled' : 'disabled'} ${speaker.name}`);
              }
            } catch (error) {
              console.error(`Failed to control speaker ${speaker.name}:`, error);
              // Continue with other speakers - don't throw
            }
          })();
          allSpeakerPromises.push(promise);
        });
      }
    }

    // Wait for all speakers to complete (parallel execution)
    // Individual failures won't crash the system
    await Promise.allSettled(allSpeakerPromises);
  }, [selectedDevices, devices]);

  // PoE Device Controls
  const controlPoEDevices = useCallback(async (enable: boolean) => {
    debugLog(`[PoE Control] Total PoE devices: ${poeDevices.length}`);

    // Get PoE devices in auto mode
    const autoPoEDevices = poeDevices.filter(d => d.mode === "auto");

    debugLog(`[PoE Control] Auto mode PoE devices: ${autoPoEDevices.length}`);

    if (autoPoEDevices.length === 0) {
      debugLog('[PoE Control] No PoE devices in auto mode');
      return;
    }

    // Get active paging devices (8301) from selected devices
    const activePagingDeviceIds = selectedDevices.filter(deviceId => {
      const device = devices.find(d => d.id === deviceId);
      return device && device.type === "8301";
    });

    debugLog(`[PoE Control] Selected devices: ${selectedDevices.length}, Active paging devices (8301): ${activePagingDeviceIds.length}`, activePagingDeviceIds);

    // Filter PoE devices:
    // - Only control devices that are linked to at least one active paging device
    // - If device has no linkedPagingDeviceIds, DON'T auto-control (user manages it manually or it's always on)
    const eligiblePoEDevices = autoPoEDevices.filter(poeDevice => {
      // If no paging devices are linked, DON'T auto-control this device
      if (!poeDevice.linkedPagingDeviceIds || poeDevice.linkedPagingDeviceIds.length === 0) {
        debugLog(`[PoE Control] Device "${poeDevice.name}" has no linked paging devices - skipping`);
        return false;
      }

      // If paging devices are linked, check if any of them are active
      const hasActivePagingDevice = poeDevice.linkedPagingDeviceIds.some(
        linkedId => activePagingDeviceIds.includes(linkedId)
      );

      if (!hasActivePagingDevice) {
        debugLog(`[PoE Control] Device "${poeDevice.name}" linked paging devices not active - skipping. Linked: ${poeDevice.linkedPagingDeviceIds.join(',')}, Active: ${activePagingDeviceIds.join(',')}`);
      } else {
        debugLog(`[PoE Control] Device "${poeDevice.name}" is eligible (linked paging device is active)`);
      }

      return hasActivePagingDevice;
    });

    if (eligiblePoEDevices.length === 0) {
      debugLog(`[PoE Control] No eligible PoE devices to ${enable ? 'enable' : 'disable'} (no linked paging devices active)`);
      return;
    }

    debugLog(`[PoE Control] ${enable ? 'Enabling' : 'Disabling'} ${eligiblePoEDevices.length} PoE devices (${activePagingDeviceIds.length} paging devices active)`);

    // Log PoE control action
    addLog({
      type: enable ? "speakers_enabled" : "speakers_disabled",
      message: `PoE: ${enable ? 'ON' : 'OFF'} - ${eligiblePoEDevices.map(d => d.name).join(', ')}`,
    });

    const promises = eligiblePoEDevices.map(async (device) => {
      try {
        const response = await fetch("/api/poe/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: device.id,
            enabled: enable,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to ${enable ? 'enable' : 'disable'} PoE device ${device.name}: HTTP ${response.status}`);
          addLog({
            type: enable ? "speakers_enabled" : "speakers_disabled",
            message: `⚠️ PoE ${device.name} failed: HTTP ${response.status}`,
          });
        } else {
          debugLog(`[PoE Control] Successfully ${enable ? 'enabled' : 'disabled'} ${device.name}`);
        }
      } catch (error) {
        console.error(`Failed to control PoE device ${device.name}:`, error);
        addLog({
          type: enable ? "speakers_enabled" : "speakers_disabled",
          message: `⚠️ PoE ${device.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    });

    await Promise.allSettled(promises);
  }, [poeDevices, selectedDevices, devices, addLog]);

  // Emergency Controls
  const emergencyKillAll = useCallback(async () => {
    debugLog('[AudioMonitoring] EMERGENCY: Killing all speakers');
    addLog({
      type: "speakers_disabled",
      message: "EMERGENCY KILL: Shutting down paging and all speakers IMMEDIATELY",
    });

    // NEW FLOW: Emergency shutdown
    // 1. Mute all speakers to getIdleVolumeString()
    await setDevicesVolume(0);

    // 2. Disable paging transmitter (INSTANT silence - no more audio broadcast!)
    await setPagingMulticast(0);

    // 3. Disable all speaker receivers
    await setSpeakersMulticast(0);

    // Reset state
    setSpeakersEnabled(false);
    setAudioDetected(false);
    currentVolumeRef.current = 0;
    if (volumeRampIntervalRef.current) {
      clearInterval(volumeRampIntervalRef.current);
      volumeRampIntervalRef.current = null;
    }

    debugLog(`[AudioMonitoring] ✓ EMERGENCY KILL COMPLETE: All devices mode 0, volume ${getIdleVolumeString()}`);
  }, [setDevicesVolume, setPagingMulticast, setSpeakersMulticast, addLog]);

  const emergencyEnableAll = useCallback(async () => {
    debugLog('[AudioMonitoring] EMERGENCY: Enabling all speakers');
    addLog({
      type: "speakers_enabled",
      message: "EMERGENCY ENABLE: Activating paging and all speakers at target volume",
    });

    // NEW FLOW: Emergency enable
    // 1. Set speakers to mode 2 (receivers)
    await setSpeakersMulticast(2);

    // 2. Enable paging transmitter (mode 1 - START broadcasting!)
    await setPagingMulticast(1);

    // 3. Set to target volume (instant - no ramp in emergency)
    await setDevicesVolume(targetVolume);

    setSpeakersEnabled(true);
    currentVolumeRef.current = targetVolume;

    debugLog('[AudioMonitoring] ✓ EMERGENCY ENABLE COMPLETE: Paging ON, Speakers listening, Volume set');
  }, [setSpeakersMulticast, setPagingMulticast, setDevicesVolume, targetVolume, addLog]);

  const controlSingleSpeaker = useCallback(async (speakerId: string, enable: boolean) => {
    const speaker = devices.find(d => d.id === speakerId);
    if (!speaker) {
      console.error(`Speaker ${speakerId} not found`);
      return;
    }

    debugLog(`[AudioMonitoring] ${enable ? 'Enabling' : 'Disabling'} single speaker: ${speaker.name}`);
    addLog({
      type: enable ? "speakers_enabled" : "speakers_disabled",
      message: `${enable ? 'Enabled' : 'Disabled'} speaker: ${speaker.name}`,
    });

    try {
      // Control multicast
      await fetch("/api/algo/speakers/mcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakers: [{
            ipAddress: speaker.ipAddress,
            password: speaker.apiPassword,
            authMethod: speaker.authMethod,
          }],
          enable,
        }),
      });

      // If disabling, also mute
      if (!enable) {
        await fetch("/api/algo/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipAddress: speaker.ipAddress,
            password: speaker.apiPassword,
            authMethod: speaker.authMethod,
            settings: { "audio.page.vol": getIdleVolumeString() }, // IDLE state - eliminates buzzing
          }),
        });
      }
    } catch (error) {
      console.error(`Failed to control speaker ${speaker.name}:`, error);
    }
  }, [devices, addLog]);

  // Check connectivity of all linked speakers
  const checkSpeakerConnectivity = useCallback(async () => {
    const linkedSpeakerIds = new Set<string>();

    // Safety check: ensure selectedDevices is iterable
    const safeSelectedDevices = selectedDevices || [];

    // Get all linked speakers from selected paging devices
    for (const deviceId of safeSelectedDevices) {
      const device = devices.find(d => d.id === deviceId);
      if (!device) continue;
      if (device.type === "8301" && device.linkedSpeakerIds) {
        device.linkedSpeakerIds.forEach(id => linkedSpeakerIds.add(id));
      }
    }

    if (linkedSpeakerIds.size === 0) {
      setSpeakerStatuses([]);
      return;
    }

    // Build device list for health check API
    const speakersToCheck = Array.from(linkedSpeakerIds)
      .map(id => devices.find(d => d.id === id))
      .filter((s): s is AlgoDevice => !!s && !!s.ipAddress && !!s.apiPassword);

    if (speakersToCheck.length === 0) {
      setSpeakerStatuses([]);
      return;
    }

    debugLog(`[AudioMonitoring] Checking connectivity for ${speakersToCheck.length} speakers...`);

    try {
      const response = await fetch("/api/algo/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devices: speakersToCheck.map(s => ({
            id: s.id,
            ipAddress: s.ipAddress,
            apiPassword: s.apiPassword,
            authMethod: s.authMethod || "standard",
          })),
          timeout: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();

      // Convert API response to SpeakerStatus array
      const statuses: SpeakerStatus[] = result.devices.map((d: { id: string; ipAddress: string; isOnline: boolean; error?: string }) => {
        const speaker = devices.find(s => s.id === d.id);
        return {
          speakerId: d.id,
          speakerName: speaker?.name || 'Unknown',
          ipAddress: d.ipAddress,
          isOnline: d.isOnline,
          lastChecked: new Date(),
          errorMessage: d.error,
        };
      });

      setSpeakerStatuses(statuses);

      const onlineCount = statuses.filter(s => s.isOnline).length;
      const offlineCount = statuses.filter(s => !s.isOnline).length;

      addLog({
        type: offlineCount > 0 ? "speakers_disabled" : "speakers_enabled",
        message: `Connectivity check: ${onlineCount} online, ${offlineCount} offline`,
      });

      debugLog(`[AudioMonitoring] Connectivity check complete: ${onlineCount} online, ${offlineCount} offline`);
    } catch (error) {
      console.error('[AudioMonitoring] Connectivity check failed:', error);
      // Set all as unknown status on error
      const statuses: SpeakerStatus[] = speakersToCheck.map(s => ({
        speakerId: s.id,
        speakerName: s.name || 'Unknown',
        ipAddress: s.ipAddress || 'Unknown',
        isOnline: false,
        lastChecked: new Date(),
        errorMessage: 'Check failed',
      }));
      setSpeakerStatuses(statuses);
    }
  }, [selectedDevices, devices, addLog]);

  // Audio activity detection with sustained audio requirement
  useEffect(() => {
    if (!isCapturing) {
      // Clean up sustained audio tracking when not capturing
      if (sustainedAudioStartRef.current) {
        sustainedAudioStartRef.current = null;
      }
      return;
    }

    // Use configurable disable delay (default 3 seconds)

    if (audioLevel > audioThreshold) {
      // Audio is above threshold

      // Start tracking sustained audio if not already tracking
      // Note: speakersEnabled is always true during monitoring, use audioDetected instead
      if (!sustainedAudioStartRef.current && !audioDetected) {
        sustainedAudioStartRef.current = Date.now();
        debugLog(`[AudioMonitoring] Audio above threshold (${audioLevel.toFixed(1)}%), starting ${sustainDuration}ms sustain timer`);
      }

      // Check if audio has been sustained long enough
      // Note: speakersEnabled is always true during monitoring (always-on mode)
      // We use audioDetected to track if we're actively playing audio
      if (sustainedAudioStartRef.current && !audioDetected && !controllingSpakersRef.current) {
        const sustainedFor = Date.now() - sustainedAudioStartRef.current;

        if (sustainedFor >= sustainDuration) {
          // Audio has been sustained - ramp volume up!
          // CRITICAL: Speakers are already listening (multicast enabled at start)
          // We only need to ramp up volume - this is INSTANT compared to enabling multicast
          sustainedAudioStartRef.current = null;
          setAudioDetected(true);
          controllingSpakersRef.current = true;
          speakersEnabledTimeRef.current = Date.now(); // Track when audio started playing

          addLog({
            type: "audio_detected",
            audioLevel,
            audioThreshold,
            message: rampEnabled
              ? `Audio sustained ${sustainDuration}ms at ${audioLevel.toFixed(1)}% - ramping volume (speakers already listening)`
              : `Audio sustained ${sustainDuration}ms at ${audioLevel.toFixed(1)}% (speakers already listening)`,
          });

          if (rampEnabled) {
            addLog({
              type: "volume_change",
              audioLevel,
              speakersEnabled: true,
              volume: targetVolume,
              message: `Volume ramping to ${targetVolume}% (paging mode 1 → speakers receive audio)`,
            });
          } else {
            addLog({
              type: "volume_change",
              audioLevel,
              speakersEnabled: true,
              volume: targetVolume,
              message: `Speakers at operating volume ${targetVolume}% (paging mode 1 → speakers receive audio)`,
            });
          }

          (async () => {
            // Start recording the audio
            await startRecording();

            // Enable PoE devices (lights, etc.) in auto mode
            await controlPoEDevices(true);

            // NEW FLOW: Enable paging transmitter (mode 1) - INSTANT audio!
            // Speakers are already in mode 2 (listening), so they'll receive immediately
            const alwaysKeepPagingOn = getAlwaysKeepPagingOn();
            if (!alwaysKeepPagingOn) {
              // Only toggle paging if not always on
              debugLog('[AudioMonitoring] AUDIO DETECTED - Setting paging to mode 1 (transmitter)');
              await setPagingMulticast(1);
              pagingWasEnabledRef.current = true; // Track that we enabled paging
            } else {
              debugLog('[AudioMonitoring] AUDIO DETECTED - Paging already at mode 1 (always on)');
              pagingWasEnabledRef.current = true; // Track that paging is enabled (always-on mode)
            }

            // NEW: Wait for paging device to be ready (poll until mcast.mode = 1)
            // This ensures device is actually ready before audio plays
            await waitForPagingReady();

            // NEW: Start playback AFTER paging device is confirmed ready
            if (playbackEnabled) {
              await startPlayback();
            }

            // Then ramp the volume (only if ramp enabled)
            if (rampEnabled) {
              debugLog('[AudioMonitoring] Ramp ENABLED - Starting volume ramp');
              startVolumeRamp();
            } else {
              debugLog('[AudioMonitoring] Ramp DISABLED - Speakers already at operating volume, no ramp needed');
            }
            controllingSpakersRef.current = false;
          })();
        }
      }

      // Clear disable timeout if audio is detected again
      if (audioDetectionTimeoutRef.current) {
        clearTimeout(audioDetectionTimeoutRef.current);
        audioDetectionTimeoutRef.current = null;
      }

    } else {
      // Audio is below threshold

      // Reset sustained audio timer if it was tracking
      if (sustainedAudioStartRef.current) {
        debugLog(`[AudioMonitoring] Audio dropped below threshold before sustain duration`);
        sustainedAudioStartRef.current = null;
      }

      // Start mute countdown if audio was playing
      // Note: We DON'T disable multicast - speakers stay listening (always-on mode)
      // We only mute the volume so speakers are ready for the next audio burst
      if (audioDetected) {
        if (!audioDetectionTimeoutRef.current) {
          addLog({
            type: "audio_silent",
            audioLevel,
            audioThreshold,
            message: `Audio below threshold: ${audioLevel.toFixed(1)}% - starting ${disableDelay/1000}s mute countdown`,
          });

          audioDetectionTimeoutRef.current = setTimeout(() => {
            if (!controllingSpakersRef.current) {
              controllingSpakersRef.current = true;
              // DON'T disable speakers - keep them listening!
              // setSpeakersEnabled(false); // REMOVED - speakers stay on
              setAudioDetected(false); // Just mark audio as not active

              // Calculate how long audio was playing
              const duration = speakersEnabledTimeRef.current
                ? ((Date.now() - speakersEnabledTimeRef.current) / 1000).toFixed(1)
                : '?';
              speakersEnabledTimeRef.current = null;

              (async () => {
                // Stop playback first
                stopPlayback();

                // Stop recording and upload
                const recordingUrl = await stopRecordingAndUpload();

                // Disable PoE devices (lights, etc.) in auto mode
                await controlPoEDevices(false);

                // NEW FLOW: Disable paging transmitter (mode 0) - NO MORE AUDIO!
                // Speakers stay in mode 2 (listening), ready for next audio
                const alwaysKeepPagingOn = getAlwaysKeepPagingOn();
                if (!alwaysKeepPagingOn) {
                  // Only toggle paging if not always on
                  debugLog('[AudioMonitoring] AUDIO ENDED - Setting paging to mode 0 (disabled)');
                  await setPagingMulticast(0);
                  pagingWasEnabledRef.current = false; // Mark paging as disabled
                } else {
                  debugLog('[AudioMonitoring] AUDIO ENDED - Keeping paging at mode 1 (always on)');
                  // Keep pagingWasEnabledRef.current = true since it's still enabled
                }

                // Ramp down or keep at operating volume
                if (rampEnabled) {
                  debugLog('[AudioMonitoring] Ramp ENABLED - Ramping volume down to idle');
                  stopVolumeRamp();
                  await setDevicesVolume(0);
                } else {
                  debugLog('[AudioMonitoring] Ramp DISABLED - Keeping speakers at operating volume');
                  // Speakers stay at operating volume - no change needed
                }

                // Log with recording URL if available
                const recordingStatus = recordingUrl
                  ? ' 🎙️ Recording saved'
                  : (playbackEnabled ? ' 🎵 Playback only (not saved)' : '');

                addLog({
                  type: "volume_change",
                  speakersEnabled: true, // Speakers STAY in mode 2 (ready)
                  volume: rampEnabled ? 0 : targetVolume,
                  message: rampEnabled
                    ? `Paging OFF after ${disableDelay/1000}s silence (duration: ${duration}s) - NO STATIC!${recordingStatus}`
                    : `Paging OFF after ${disableDelay/1000}s silence (duration: ${duration}s) - Speakers stay at operating volume${recordingStatus}`,
                  recordingUrl: recordingUrl || undefined,
                });

                controllingSpakersRef.current = false;
              })();
            }
            audioDetectionTimeoutRef.current = null;
          }, disableDelay);
        }
      }
    }
  }, [audioLevel, isCapturing, audioDetected, speakersEnabled, audioThreshold, sustainDuration, disableDelay, controlSpeakers, setDevicesVolume, startVolumeRamp, stopVolumeRamp, targetVolume, addLog, startRecording, stopRecordingAndUpload, setPagingMulticast, controlPoEDevices, playbackEnabled, startPlayback, stopPlayback, rampEnabled, waitForPagingReady]);

  const startMonitoring = useCallback(async (inputDevice?: string) => {
    debugLog('[AudioMonitoring] Starting monitoring', inputDevice);

    // Reset paging state tracker
    pagingWasEnabledRef.current = false;

    addLog({
      type: "audio_detected",
      audioThreshold,
      message: `Monitoring started with threshold: ${audioThreshold}%`,
    });

    // Start audio capture IMMEDIATELY - don't wait for speaker setup
    // This ensures the UI responds instantly and audio is being captured
    startCapture(inputDevice);

    // Check speaker connectivity first (in background)
    checkSpeakerConnectivity();

    // NEW FLOW: Set up devices for instant response with NO STATIC
    debugLog(`[AudioMonitoring] NEW FLOW: Setting up paging and speakers (mode 2)`);

    // Run speaker setup in background - offline speakers shouldn't block monitoring
    (async () => {
      try {
        // Step 1: Set speakers to starting volume (depends on ramp setting)
        if (rampEnabled) {
          // Ramp enabled: Start at idle volume, will ramp up when audio detected
          debugLog(`[AudioMonitoring] Step 1: Ramp ENABLED - Setting speakers to idle volume ${getIdleVolumeString()}`);
          await setDevicesVolume(0); // 0% = idle volume
        } else {
          // Ramp disabled: Start at operating volume, stay there
          debugLog(`[AudioMonitoring] Step 1: Ramp DISABLED - Setting speakers to operating volume`);
          await setDevicesVolume(100); // 100% scales to each speaker's maxVolume (operating volume)
        }

        // Wait briefly to ensure volume command is fully processed
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 2: Set paging device mode (check settings)
        const alwaysKeepPagingOn = getAlwaysKeepPagingOn();
        if (alwaysKeepPagingOn) {
          debugLog('[AudioMonitoring] Step 2: Setting paging device to mode 1 (ALWAYS ON - transmitter)');
          await setPagingMulticast(1);
          pagingWasEnabledRef.current = true; // Track that paging is enabled
        } else {
          debugLog('[AudioMonitoring] Step 2: Setting paging device to mode 0 (disabled - will toggle on audio)');
          await setPagingMulticast(0);

          // CRITICAL: Wait for paging device to actually turn OFF before proceeding
          debugLog('[AudioMonitoring] Step 2.5: Waiting for paging device to confirm OFF (mode 0)...');
          await waitForPagingOff();

          // pagingWasEnabledRef stays false - will be set to true when audio is detected
        }

        // Step 3: Set all speakers to mode 2 (receiver - ready to listen)
        debugLog('[AudioMonitoring] Step 3: Setting speakers to mode 2 (receiver)');
        await setSpeakersMulticast(2);

        setSpeakersEnabled(true); // Mark as ready

        const volumeMsg = rampEnabled
          ? `Idle Volume=${getIdleVolumeString()} (will ramp when audio detected)`
          : `Operating Volume (ramp disabled)`;

        addLog({
          type: "speakers_enabled",
          speakersEnabled: true,
          volume: rampEnabled ? 0 : 100,
          message: alwaysKeepPagingOn
            ? `Monitoring ready: Paging=ALWAYS ON (Mode 1), Speakers=LISTENING, ${volumeMsg}`
            : `Monitoring ready: Paging=OFF, Speakers=LISTENING, ${volumeMsg}`,
        });

        debugLog(`[AudioMonitoring] ✓ Setup complete: Paging mode ${alwaysKeepPagingOn ? 1 : 0}, Speakers mode 2, ${volumeMsg}`);
      } catch (error) {
        console.error('[AudioMonitoring] Error during speaker setup:', error);
        // Continue anyway - audio capture is already running
        setSpeakersEnabled(true);
      }
    })();
  }, [startCapture, audioThreshold, addLog, setDevicesVolume, setPagingMulticast, waitForPagingOff, setSpeakersMulticast, checkSpeakerConnectivity]);

  const stopMonitoring = useCallback(async () => {
    debugLog('[AudioMonitoring] Stopping monitoring');

    // Calculate duration if audio was playing
    const duration = speakersEnabledTimeRef.current
      ? ((Date.now() - speakersEnabledTimeRef.current) / 1000).toFixed(1)
      : null;
    speakersEnabledTimeRef.current = null;

    addLog({
      type: "speakers_disabled",
      message: duration
        ? `Monitoring stopped (audio was playing for ${duration}s)`
        : 'Monitoring stopped - shutting down all devices',
    });

    stopCapture();
    stopVolumeRamp();

    // Clear any pending audio detection timeout
    if (audioDetectionTimeoutRef.current) {
      clearTimeout(audioDetectionTimeoutRef.current);
      audioDetectionTimeoutRef.current = null;
    }

    // NEW FLOW: Clean shutdown - set everything to mode 0 and getIdleVolumeString()
    if (!controllingSpakersRef.current) {
      controllingSpakersRef.current = true;
      setSpeakersEnabled(false);
      setAudioDetected(false);

      debugLog(`[AudioMonitoring] STOP: Shutting down paging and speakers to mode 0, volume ${getIdleVolumeString()}`);

      // Step 1: Set speakers to idle volume
      await setDevicesVolume(0);

      // Step 2: Set paging device to mode 0 (ONLY if it was enabled during this session)
      if (pagingWasEnabledRef.current) {
        debugLog('[AudioMonitoring] Paging was enabled during session - disabling now');
        await setPagingMulticast(0);
        pagingWasEnabledRef.current = false;
      } else {
        debugLog('[AudioMonitoring] Paging was never enabled - skipping redundant disable');
      }

      // Step 3: Set all speakers to mode 0 (disabled)
      await setSpeakersMulticast(0);

      controllingSpakersRef.current = false;
      debugLog(`[AudioMonitoring] ✓ Clean shutdown complete: All devices mode 0, speakers ${getIdleVolumeString()}`);
    }

    // Clean up playback
    isPlayingLiveRef.current = false;
    playbackPositionRef.current = 0;
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
  }, [stopCapture, stopVolumeRamp, setDevicesVolume, setPagingMulticast, setSpeakersMulticast, addLog]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
  }, []);

  const setInputDevice = useCallback((deviceId: string) => {
    setSelectedInputDeviceState(deviceId);
  }, []);

  const setSelectedDevices = useCallback((devs: string[]) => {
    setSelectedDevicesState(devs);
  }, []);

  const setTargetVolume = useCallback((vol: number) => {
    setTargetVolumeState(vol);
  }, []);

  const setAudioThreshold = useCallback((threshold: number) => {
    setAudioThresholdState(threshold);
  }, []);

  const setRampEnabled = useCallback((enabled: boolean) => {
    setRampEnabledState(enabled);
  }, []);

  const setRampDuration = useCallback((duration: number) => {
    setRampDurationState(duration);
  }, []);

  const setDayNightMode = useCallback((enabled: boolean) => {
    setDayNightModeState(enabled);
  }, []);

  const setDayStartHour = useCallback((hour: number) => {
    setDayStartHourState(hour);
  }, []);

  const setDayEndHour = useCallback((hour: number) => {
    setDayEndHourState(hour);
  }, []);

  const setNightRampDuration = useCallback((duration: number) => {
    setNightRampDurationState(duration);
  }, []);

  const setSustainDuration = useCallback((duration: number) => {
    setSustainDurationState(duration);
  }, []);

  const setDisableDelay = useCallback((delay: number) => {
    setDisableDelayState(delay);
  }, []);

  const setLoggingEnabled = useCallback((enabled: boolean) => {
    setLoggingEnabledState(enabled);
  }, []);

  const setRecordingEnabled = useCallback((enabled: boolean) => {
    setRecordingEnabledState(enabled);
  }, []);

  const setPlaybackEnabled = useCallback((enabled: boolean) => {
    setPlaybackEnabledState(enabled);
    debugLog('[AudioMonitoring] Playback mode:', enabled ? 'ENABLED' : 'DISABLED');
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    debugLog('[AudioLog] Logs cleared');
  }, []);

  const exportLogs = useCallback(() => {
    const header = "Timestamp,Type,Audio Level,Threshold,Speakers,Volume,Message\n";
    const rows = logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      return `"${timestamp}","${log.type}","${log.audioLevel ?? ''}","${log.audioThreshold ?? ''}","${log.speakersEnabled ?? ''}","${log.volume ?? ''}","${log.message}"`;
    }).join("\n");

    return header + rows;
  }, [logs]);

  const setUseGlobalVolume = useCallback((useGlobal: boolean) => {
    setUseGlobalVolumeState(useGlobal);
    debugLog(`[AudioMonitoring] Volume mode changed to: ${useGlobal ? 'GLOBAL' : 'INDIVIDUAL'}`);
  }, []);

  return (
    <AudioMonitoringContext.Provider
      value={{
        isCapturing,
        audioLevel,
        playbackAudioLevel,
        selectedInputDevice,
        volume,
        targetVolume,
        audioThreshold,
        audioDetected,
        speakersEnabled,
        useGlobalVolume,
        setUseGlobalVolume,
        rampEnabled,
        rampDuration,
        dayNightMode,
        dayStartHour,
        dayEndHour,
        nightRampDuration,
        sustainDuration,
        disableDelay,
        setRampEnabled,
        setRampDuration,
        setDayNightMode,
        setDayStartHour,
        setDayEndHour,
        setNightRampDuration,
        setSustainDuration,
        setDisableDelay,
        selectedDevices,
        setSelectedDevices,
        startMonitoring,
        stopMonitoring,
        setInputDevice,
        setVolume,
        setTargetVolume,
        setAudioThreshold,
        devices,
        setDevices,
        poeDevices,
        setPoeDevices,
        logs,
        clearLogs,
        exportLogs,
        loggingEnabled,
        setLoggingEnabled,
        recordingEnabled,
        setRecordingEnabled,
        playbackEnabled,
        setPlaybackEnabled,
        emergencyKillAll,
        emergencyEnableAll,
        controlSingleSpeaker,
        speakerStatuses,
        checkSpeakerConnectivity,
      }}
    >
      {children}
    </AudioMonitoringContext.Provider>
  );
}

export function useAudioMonitoring() {
  const context = useContext(AudioMonitoringContext);
  if (!context) {
    throw new Error("useAudioMonitoring must be used within AudioMonitoringProvider");
  }
  return context;
}
