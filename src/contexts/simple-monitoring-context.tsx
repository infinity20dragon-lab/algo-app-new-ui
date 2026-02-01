/**
 * Simple Monitoring Context - Clean Architecture
 *
 * Uses SimpleRecorder with producer/consumer pattern
 * No TailGuard, no grace periods, no complex state machines
 */

"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { SimpleRecorder } from "@/lib/simple-recorder";
import { useAuth } from "./auth-context";
import { useRealtimeSync } from "./realtime-sync-context";
import { ref as dbRef, push, set } from "firebase/database";
import { realtimeDb, storage } from "@/lib/firebase/config";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// TODO: Import proper types
type Device = any;
type PoEDevice = any;

interface SpeakerStatus {
  speakerId: string;
  isOnline: boolean;
}

interface SimpleMonitoringContextType {
  // State
  isMonitoring: boolean;
  audioLevel: number;
  playbackAudioLevel: number;
  selectedInputDevice: string | null;
  audioDetected: boolean;
  speakersEnabled: boolean;

  // Audio Settings
  batchDuration: number;
  silenceTimeout: number;
  playbackDelay: number;
  audioThreshold: number;
  sustainDuration: number;
  disableDelay: number;

  // Volume & Ramp Settings
  targetVolume: number;
  rampEnabled: boolean;
  rampDuration: number;
  dayNightMode: boolean;
  dayStartHour: number;
  dayEndHour: number;
  nightRampDuration: number;

  // Playback Volume Settings
  playbackRampDuration: number;
  playbackStartVolume: number;
  playbackMaxVolume: number;
  playbackVolume: number;

  // Playback Volume Ramping (Web Audio API - per session)
  playbackRampEnabled: boolean;
  playbackRampStartVolume: number;
  playbackRampTargetVolume: number;
  playbackSessionRampDuration: number;
  playbackRampScheduleEnabled: boolean;
  playbackRampStartHour: number;
  playbackRampEndHour: number;

  // Recording & Playback
  saveRecording: boolean;
  recordingEnabled: boolean;
  loggingEnabled: boolean;
  playbackEnabled: boolean;

  // Devices
  devices: Device[];
  selectedDevices: string[];
  poeDevices: PoEDevice[];
  speakerStatuses: SpeakerStatus[];

  // Emulation
  emulationMode: boolean;
  emulationNetworkDelay: number;

  // Actions
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  setInputDevice: (deviceId: string) => void;
  setBatchDuration: (ms: number) => void;
  setSilenceTimeout: (ms: number) => void;
  setPlaybackDelay: (ms: number) => void;
  setAudioThreshold: (value: number) => void;
  setSustainDuration: (ms: number) => void;
  setDisableDelay: (ms: number) => void;
  setTargetVolume: (value: number) => void;
  setRampEnabled: (enabled: boolean) => void;
  setRampDuration: (ms: number) => void;
  setDayNightMode: (enabled: boolean) => void;
  setDayStartHour: (hour: number) => void;
  setDayEndHour: (hour: number) => void;
  setNightRampDuration: (ms: number) => void;
  setPlaybackRampDuration: (ms: number) => void;
  setPlaybackStartVolume: (value: number) => void;
  setPlaybackMaxVolume: (value: number) => void;
  setPlaybackVolume: (value: number) => void;
  setPlaybackRampEnabled: (enabled: boolean) => void;
  setPlaybackRampStartVolume: (value: number) => void;
  setPlaybackRampTargetVolume: (value: number) => void;
  setPlaybackSessionRampDuration: (ms: number) => void;
  setPlaybackRampScheduleEnabled: (enabled: boolean) => void;
  setPlaybackRampStartHour: (hour: number) => void;
  setPlaybackRampEndHour: (hour: number) => void;
  setSaveRecording: (enabled: boolean) => void;
  setRecordingEnabled: (enabled: boolean) => void;
  setLoggingEnabled: (enabled: boolean) => void;
  setPlaybackEnabled: (enabled: boolean) => void;
  setDevices: (devices: Device[]) => void;
  setSelectedDevices: (deviceIds: string[]) => void;
  setPoeDevices: (devices: PoEDevice[]) => void;
  setEmulationMode: (enabled: boolean) => void;
  setEmulationNetworkDelay: (ms: number) => void;
  onAudioDetected: (level: number) => void;

  // Emergency Controls (TODO: Implement)
  emergencyKillAll: () => Promise<void>;
  emergencyEnableAll: () => Promise<void>;
  controlSingleSpeaker: (speakerId: string, enable: boolean) => Promise<void>;
  checkSpeakerConnectivity: () => Promise<void>;
  triggerTestCall: (durationSeconds: number) => void;

  // Logs
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'warning' }>;
}

const SimpleMonitoringContext = createContext<SimpleMonitoringContextType | null>(null);

export function SimpleMonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { syncSessionState, sessionState } = useRealtimeSync();

  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [playbackAudioLevel, setPlaybackAudioLevel] = useState(0);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string | null>(null);
  const [audioDetected, setAudioDetected] = useState(false);
  const [speakersEnabled, setSpeakersEnabled] = useState(false);

  // Audio Settings
  const [batchDuration, setBatchDuration] = useState(5000);
  const [silenceTimeout, setSilenceTimeout] = useState(8000);
  const [playbackDelay, setPlaybackDelay] = useState(4000);
  const [audioThreshold, setAudioThreshold] = useState(0);
  const [sustainDuration, setSustainDuration] = useState(0);
  const [disableDelay, setDisableDelay] = useState(8000);

  // Volume & Ramp Settings
  const [targetVolume, setTargetVolume] = useState(100);
  const [rampEnabled, setRampEnabled] = useState(false);
  const [rampDuration, setRampDuration] = useState(2000);
  const [dayNightMode, setDayNightMode] = useState(false);
  const [dayStartHour, setDayStartHour] = useState(7);
  const [dayEndHour, setDayEndHour] = useState(19);
  const [nightRampDuration, setNightRampDuration] = useState(3000);

  // Playback Volume Settings
  const [playbackRampDuration, setPlaybackRampDuration] = useState(0);
  const [playbackStartVolume, setPlaybackStartVolume] = useState(0.5);
  const [playbackMaxVolume, setPlaybackMaxVolume] = useState(1.0);
  const [playbackVolume, setPlaybackVolume] = useState(1.0);

  // Playback Volume Ramping (Web Audio API - per session)
  const [playbackRampEnabled, setPlaybackRampEnabled] = useState(false);
  const [playbackRampStartVolume, setPlaybackRampStartVolume] = useState(0);
  const [playbackRampTargetVolume, setPlaybackRampTargetVolume] = useState(2.0);
  const [playbackSessionRampDuration, setPlaybackSessionRampDuration] = useState(2000);
  const [playbackRampScheduleEnabled, setPlaybackRampScheduleEnabled] = useState(false);
  const [playbackRampStartHour, setPlaybackRampStartHour] = useState(18); // 6:00 PM
  const [playbackRampEndHour, setPlaybackRampEndHour] = useState(6); // 6:00 AM

  // Recording & Playback
  const [saveRecording, setSaveRecording] = useState(true);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [playbackEnabled, setPlaybackEnabled] = useState(true);

  // Devices
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [poeDevices, setPoeDevices] = useState<PoEDevice[]>([]);
  const [speakerStatuses, setSpeakerStatuses] = useState<SpeakerStatus[]>([]);

  // Emulation
  const [emulationMode, setEmulationMode] = useState(false);
  const [emulationNetworkDelay, setEmulationNetworkDelay] = useState(0);

  // Logs
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'warning' }>>([]);

  // Refs
  const recorderRef = useRef<SimpleRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update recorder's playback volume when it changes
  useEffect(() => {
    if (recorderRef.current) {
      recorderRef.current.setPlaybackVolume(playbackVolume);
    }
  }, [playbackVolume]);

  // Load settings from sessionState on mount
  useEffect(() => {
    if (!sessionState) return;

    // Load device selection
    if (sessionState.selectedDevices !== undefined) setSelectedDevices(sessionState.selectedDevices);
    if (sessionState.selectedInputDevice !== undefined) setSelectedInputDevice(sessionState.selectedInputDevice);

    // Load SimpleRecorder settings
    if (sessionState.batchDuration !== undefined) setBatchDuration(sessionState.batchDuration);
    if (sessionState.silenceTimeout !== undefined) setSilenceTimeout(sessionState.silenceTimeout);
    if (sessionState.playbackDelay !== undefined) setPlaybackDelay(sessionState.playbackDelay);
    if (sessionState.audioThreshold !== undefined) setAudioThreshold(sessionState.audioThreshold);
    if (sessionState.sustainDuration !== undefined) setSustainDuration(sessionState.sustainDuration);
    if (sessionState.disableDelay !== undefined) setDisableDelay(sessionState.disableDelay);

    // Load volume settings
    if (sessionState.targetVolume !== undefined) setTargetVolume(sessionState.targetVolume);
    if (sessionState.rampEnabled !== undefined) setRampEnabled(sessionState.rampEnabled);
    if (sessionState.rampDuration !== undefined) setRampDuration(sessionState.rampDuration);
    if (sessionState.dayNightMode !== undefined) setDayNightMode(sessionState.dayNightMode);
    if (sessionState.dayStartHour !== undefined) setDayStartHour(sessionState.dayStartHour);
    if (sessionState.dayEndHour !== undefined) setDayEndHour(sessionState.dayEndHour);
    if (sessionState.nightRampDuration !== undefined) setNightRampDuration(sessionState.nightRampDuration);

    // Load playback volume settings
    if (sessionState.playbackRampDuration !== undefined) setPlaybackRampDuration(sessionState.playbackRampDuration);
    if (sessionState.playbackStartVolume !== undefined) setPlaybackStartVolume(sessionState.playbackStartVolume);
    if (sessionState.playbackMaxVolume !== undefined) setPlaybackMaxVolume(sessionState.playbackMaxVolume);
    if (sessionState.playbackVolume !== undefined) setPlaybackVolume(sessionState.playbackVolume);

    // Load session volume ramping settings
    if (sessionState.playbackRampEnabled !== undefined) setPlaybackRampEnabled(sessionState.playbackRampEnabled);
    if (sessionState.playbackRampStartVolume !== undefined) setPlaybackRampStartVolume(sessionState.playbackRampStartVolume);
    if (sessionState.playbackRampTargetVolume !== undefined) setPlaybackRampTargetVolume(sessionState.playbackRampTargetVolume);
    if (sessionState.playbackSessionRampDuration !== undefined) setPlaybackSessionRampDuration(sessionState.playbackSessionRampDuration);
    if (sessionState.playbackRampScheduleEnabled !== undefined) setPlaybackRampScheduleEnabled(sessionState.playbackRampScheduleEnabled);
    if (sessionState.playbackRampStartHour !== undefined) setPlaybackRampStartHour(sessionState.playbackRampStartHour);
    if (sessionState.playbackRampEndHour !== undefined) setPlaybackRampEndHour(sessionState.playbackRampEndHour);

    // Load recording/playback settings
    if (sessionState.saveRecording !== undefined) setSaveRecording(sessionState.saveRecording);
    if (sessionState.loggingEnabled !== undefined) setLoggingEnabled(sessionState.loggingEnabled);
    if (sessionState.playbackEnabled !== undefined) setPlaybackEnabled(sessionState.playbackEnabled);

    // Load emulation settings
    if (sessionState.emulationMode !== undefined) setEmulationMode(sessionState.emulationMode);
    if (sessionState.emulationNetworkDelay !== undefined) setEmulationNetworkDelay(sessionState.emulationNetworkDelay);
  }, [sessionState]);

  // Sync settings to RTDB when they change
  useEffect(() => {
    syncSessionState({
      selectedDevices,
      selectedInputDevice: selectedInputDevice || undefined,
      batchDuration,
      silenceTimeout,
      playbackDelay,
      audioThreshold,
      sustainDuration,
      disableDelay,
      targetVolume,
      rampEnabled,
      rampDuration,
      dayNightMode,
      dayStartHour,
      dayEndHour,
      nightRampDuration,
      playbackRampDuration,
      playbackStartVolume,
      playbackMaxVolume,
      playbackVolume,
      playbackRampEnabled,
      playbackRampStartVolume,
      playbackRampTargetVolume,
      playbackSessionRampDuration,
      playbackRampScheduleEnabled,
      playbackRampStartHour,
      playbackRampEndHour,
      saveRecording,
      loggingEnabled,
      playbackEnabled,
      emulationMode,
      emulationNetworkDelay,
    });
  }, [
    selectedDevices,
    selectedInputDevice,
    batchDuration, silenceTimeout, playbackDelay, audioThreshold, sustainDuration, disableDelay,
    targetVolume, rampEnabled, rampDuration, dayNightMode, dayStartHour, dayEndHour, nightRampDuration,
    playbackRampDuration, playbackStartVolume, playbackMaxVolume, playbackVolume,
    playbackRampEnabled, playbackRampStartVolume, playbackRampTargetVolume, playbackSessionRampDuration,
    playbackRampScheduleEnabled, playbackRampStartHour, playbackRampEndHour,
    saveRecording, loggingEnabled, playbackEnabled, emulationMode, emulationNetworkDelay,
    syncSessionState,
  ]);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    try {
      addLog('Starting monitoring...', 'info');

      // Get microphone stream
      const constraints: MediaStreamConstraints = {
        audio: selectedInputDevice
          ? { deviceId: { exact: selectedInputDevice } }
          : true,
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Get linked speakers and paging device
      let linkedSpeakers: any[];
      let pagingDevice: any;

      if (emulationMode) {
        // Create 12 virtual speakers + 1 paging device for emulation
        linkedSpeakers = Array.from({ length: 12 }, (_, i) => ({
          id: `virtual-speaker-${i + 1}`,
          name: `Virtual Speaker ${i + 1}`,
          ipAddress: `192.168.1.${100 + i}`,
          type: '8180', // Speaker type
          zone: i < 6 ? 'zone-a' : 'zone-b', // Split across 2 zones
        }));

        pagingDevice = {
          id: 'virtual-paging-1',
          name: 'Virtual Paging Device',
          ipAddress: '192.168.1.200',
          type: '8301', // Paging device type
        };

        addLog(`🧪 Emulation Mode: Created 12 virtual speakers + 1 paging device`, 'info');
      } else {
        // Use real devices - find paging device from selected devices
        const selectedPagingDevices = devices.filter(d =>
          selectedDevices.includes(d.id) && d.type === "8301"
        );

        if (selectedPagingDevices.length > 0) {
          // Use first selected paging device
          pagingDevice = selectedPagingDevices[0];

          // Get linked speakers from paging device
          const linkedSpeakerIds = pagingDevice.linkedSpeakerIds || [];
          linkedSpeakers = devices.filter(d => linkedSpeakerIds.includes(d.id));

          addLog(`📢 Paging Device: ${pagingDevice.name}`, 'info');
          addLog(`🔊 Linked Speakers: ${linkedSpeakers.length}`, 'info');
          linkedSpeakers.forEach((s, i) => {
            addLog(`   ${i + 1}. ${s.name} (${s.ipAddress})`, 'info');
          });
        } else {
          // No paging device selected
          pagingDevice = null;
          linkedSpeakers = [];
          addLog(`⚠️  No paging device selected`, 'warning');
        }
      }

      // Create SimpleRecorder
      recorderRef.current = new SimpleRecorder({
        batchDuration,
        silenceTimeout,
        playbackDelay,
        audioThreshold,
        sustainDuration,
        linkedSpeakers,
        pagingDevice,
        saveRecording,
        emulationMode,
        emulationNetworkDelay,
        playbackVolume,
        playbackRampEnabled,
        playbackRampStartVolume,
        playbackRampTargetVolume,
        playbackRampDuration: playbackSessionRampDuration,
        playbackRampScheduleEnabled,
        playbackRampStartHour,
        playbackRampEndHour,
        uploadCallback: async (blob, filename) => {
          try {
            addLog(`Uploading ${filename} (${(blob.size / 1024).toFixed(2)} KB)...`, 'info');

            // Upload to Firebase Storage: recordings/{userId}/{filename}
            const fileRef = storageRef(storage, `recordings/${user?.uid}/${filename}`);
            await uploadBytes(fileRef, blob, {
              contentType: 'audio/webm;codecs=opus', // Set proper MIME type
            });

            // Get download URL
            const downloadURL = await getDownloadURL(fileRef);

            // Log the download URL so user can access it
            addLog(`✓ Upload complete: ${filename}`, 'info');
            addLog(`🔗 Download: ${downloadURL}`, 'info');

            // Also save URL to Firebase RTDB for easy retrieval
            if (user) {
              const { dateKey } = getPSTTime();
              const recordingRef = dbRef(realtimeDb, `recordings/${user.uid}/${dateKey}`);
              const newRecordingRef = push(recordingRef);
              set(newRecordingRef, {
                filename,
                downloadURL,
                timestamp: new Date().toISOString(),
                size: blob.size,
              });
            }

            return downloadURL;
          } catch (error) {
            addLog(`❌ Upload failed: ${error}`, 'error');
            console.error('[SimpleMonitoring] Upload error:', error);
            throw error;
          }
        },
        onLog: (message, type) => {
          addLog(message, type);
        },
        onError: (error) => {
          addLog(`Error: ${error.message}`, 'error');
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
          setAudioDetected(level > audioThreshold);
        },
        onPlaybackLevel: (level) => {
          setPlaybackAudioLevel(level);
        },
        setSpeakerZoneIP: async (speakers: any[], zoneIP: string) => {
          if (speakers.length === 0) {
            addLog(`⚠️  No speakers to control`, 'warning');
            return;
          }

          const mode = zoneIP.includes(':50002') ? 'ACTIVE' : 'IDLE';
          addLog(`Setting ${speakers.length} speakers' mcast.zone1 to ${zoneIP} (${mode}) - in parallel`, 'info');

          try {
            // Set each speaker's mcast.zone1 in parallel
            const results = await Promise.allSettled(
              speakers.map(async (speaker) => {
                const response = await fetch("/api/algo/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ipAddress: speaker.ipAddress,
                    password: speaker.apiPassword || speaker.password,
                    authMethod: speaker.authMethod || 'basic',
                    settings: {
                      "mcast.zone1": zoneIP,
                    },
                  }),
                });

                if (!response.ok) {
                  throw new Error(`${speaker.name}: API returned ${response.status}`);
                }

                return { speaker: speaker.name, success: true };
              })
            );

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failCount = speakers.length - successCount;

            if (failCount > 0) {
              addLog(`⚠️  ${successCount}/${speakers.length} speakers updated (${failCount} failed)`, 'warning');
            } else {
              addLog(`✓ All ${speakers.length} speakers' zone IP set to ${zoneIP}`, 'info');
            }
          } catch (error) {
            addLog(`❌ Failed to set speaker zone IP: ${error}`, 'error');
            throw error;
          }
        },
        setSpeakerVolume: async (speakerId: string, volumePercent: number) => {
          // Find speaker device
          const speaker = devices.find(d => d.id === speakerId);
          if (!speaker || !speaker.ipAddress || !speaker.apiPassword) {
            addLog(`⚠️  Speaker ${speakerId} not found or missing credentials - skipping volume set`, 'warning');
            return;
          }

          // Use speaker's maxVolume setting from /live-v2 page (NOT default volume from output page)
          const speakerMaxVolume = speaker.maxVolume ?? 100;

          // Convert to level (0-10) and then to dB
          // Formula: dB = (level - 10) * 3
          // Level 7 (70%) = -9dB, Level 10 (100%) = 0dB
          let volumeDbString: string;
          const volumeScale = Math.round((speakerMaxVolume / 100) * 10);
          const volumeDb = (volumeScale - 10) * 3;
          volumeDbString = volumeDb === 0 ? "0dB" : `${volumeDb}dB`;

          try {
            const response = await fetch("/api/algo/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ipAddress: speaker.ipAddress,
                password: speaker.apiPassword,
                authMethod: speaker.authMethod || 'basic',
                settings: {
                  "audio.page.vol": volumeDbString,
                },
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown' }));
              throw new Error(`${response.status}: ${errorData.error}`);
            }

            addLog(`✓ ${speaker.name} page volume set to ${volumeDbString} (level ${volumeScale})`, 'info');
          } catch (error) {
            // Don't throw - just log and continue with other speakers
            addLog(`⚠️  ${speaker.name} volume failed: ${error}`, 'warning');
          }
        },
      });

      // Start recorder
      await recorderRef.current.start(stream);

      // Initialize hardware (set to idle + individual volumes)
      addLog('Initializing hardware...', 'info');
      await recorderRef.current.initializeHardware();

      setIsMonitoring(true);
      addLog('✅ Monitoring started', 'info');

    } catch (error) {
      addLog(`Failed to start: ${error}`, 'error');
      console.error('Failed to start monitoring:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInputDevice, batchDuration, silenceTimeout, playbackDelay, saveRecording, devices, selectedDevices, audioThreshold, emulationMode, emulationNetworkDelay]);

  // Stop monitoring
  const stopMonitoring = useCallback(async () => {
    try {
      addLog('Stopping monitoring...', 'info');

      if (recorderRef.current) {
        await recorderRef.current.stop();
        recorderRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsMonitoring(false);
      addLog('✅ Monitoring stopped', 'info');

    } catch (error) {
      addLog(`Failed to stop: ${error}`, 'error');
      console.error('Failed to stop monitoring:', error);
    }
  }, []);

  // Audio level callback
  const onAudioDetected = useCallback((level: number) => {
    setAudioLevel(level);

    // Update audio detected state
    setAudioDetected(level > audioThreshold);

    if (recorderRef.current) {
      recorderRef.current.onAudioDetected(level);
    }
  }, [audioThreshold]);

  // Set input device
  const setInputDevice = useCallback((deviceId: string) => {
    setSelectedInputDevice(deviceId);
  }, []);

  // Emergency Controls (TODO: Implement these properly)
  const emergencyKillAll = useCallback(async () => {
    addLog('🚨 Emergency Kill All requested (not implemented yet)', 'warning');
  }, []);

  const emergencyEnableAll = useCallback(async () => {
    addLog('✅ Emergency Enable All requested (not implemented yet)', 'warning');
  }, []);

  const controlSingleSpeaker = useCallback(async (speakerId: string, enable: boolean) => {
    addLog(`${enable ? 'Enabling' : 'Disabling'} speaker ${speakerId} (not implemented yet)`, 'warning');
  }, []);

  const checkSpeakerConnectivity = useCallback(async () => {
    addLog('Checking speaker connectivity (not implemented yet)', 'warning');
  }, []);

  const triggerTestCall = useCallback((durationSeconds: number) => {
    addLog(`Triggering test call for ${durationSeconds}s (not implemented yet)`, 'warning');
  }, []);

  // Helper to get PST time
  const getPSTTime = () => {
    const now = new Date();

    // Get PST time parts using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const second = parts.find(p => p.type === 'second')?.value || '';

    const timestamp = `${hour}:${minute}:${second}`;
    const dateKey = `${year}-${month}-${day}`;

    return { timestamp, dateKey };
  };

  // Add log (write to Firebase RTDB for activity page)
  const addLog = useCallback((message: string, type: 'info' | 'error' | 'warning') => {
    const { timestamp, dateKey } = getPSTTime();
    const logEntry = { timestamp, message, type };

    // Add to local state (for console/debugging)
    setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100

    // Write to Firebase Realtime Database (for /activity page)
    if (user && loggingEnabled) {
      const logRef = dbRef(realtimeDb, `logs/${user.uid}/${dateKey}`);
      const newLogRef = push(logRef);
      set(newLogRef, {
        timestamp,
        type: 'system', // Map to AudioLogEntry type
        message,
      }).catch((error) => {
        console.error('[SimpleMonitoring] Failed to write log to Firebase:', error);
      });
    }
  }, [user, loggingEnabled]);

  const value: SimpleMonitoringContextType = {
    // State
    isMonitoring,
    audioLevel,
    playbackAudioLevel,
    selectedInputDevice,
    audioDetected,
    speakersEnabled,

    // Audio Settings
    batchDuration,
    silenceTimeout,
    playbackDelay,
    audioThreshold,
    sustainDuration,
    disableDelay,

    // Volume & Ramp Settings
    targetVolume,
    rampEnabled,
    rampDuration,
    dayNightMode,
    dayStartHour,
    dayEndHour,
    nightRampDuration,

    // Playback Volume Settings
    playbackRampDuration,
    playbackStartVolume,
    playbackMaxVolume,
    playbackVolume,

    // Playback Volume Ramping (Web Audio API - per session)
    playbackRampEnabled,
    playbackRampStartVolume,
    playbackRampTargetVolume,
    playbackSessionRampDuration,
    playbackRampScheduleEnabled,
    playbackRampStartHour,
    playbackRampEndHour,

    // Recording & Playback
    saveRecording,
    recordingEnabled: saveRecording, // Alias
    loggingEnabled,
    playbackEnabled,

    // Devices
    devices,
    selectedDevices,
    poeDevices,
    speakerStatuses,

    // Emulation
    emulationMode,
    emulationNetworkDelay,

    // Actions
    startMonitoring,
    stopMonitoring,
    setInputDevice,
    setBatchDuration,
    setSilenceTimeout,
    setPlaybackDelay,
    setAudioThreshold,
    setSustainDuration,
    setDisableDelay,
    setTargetVolume,
    setRampEnabled,
    setRampDuration,
    setDayNightMode,
    setDayStartHour,
    setDayEndHour,
    setNightRampDuration,
    setPlaybackRampDuration,
    setPlaybackStartVolume,
    setPlaybackMaxVolume,
    setPlaybackVolume,
    setPlaybackRampEnabled,
    setPlaybackRampStartVolume,
    setPlaybackRampTargetVolume,
    setPlaybackSessionRampDuration,
    setPlaybackRampScheduleEnabled,
    setPlaybackRampStartHour,
    setPlaybackRampEndHour,
    setSaveRecording,
    setRecordingEnabled: setSaveRecording, // Alias
    setLoggingEnabled,
    setPlaybackEnabled,
    setDevices,
    setSelectedDevices,
    setPoeDevices,
    setEmulationMode,
    setEmulationNetworkDelay,
    onAudioDetected,

    // Emergency Controls
    emergencyKillAll,
    emergencyEnableAll,
    controlSingleSpeaker,
    checkSpeakerConnectivity,
    triggerTestCall,

    // Logs
    logs,
  };

  return (
    <SimpleMonitoringContext.Provider value={value}>
      {children}
    </SimpleMonitoringContext.Provider>
  );
}

export function useSimpleMonitoring() {
  const context = useContext(SimpleMonitoringContext);
  if (!context) {
    throw new Error('useSimpleMonitoring must be used within SimpleMonitoringProvider');
  }
  return context;
}
