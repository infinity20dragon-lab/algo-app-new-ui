"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { VUMeter, CircularVUMeter } from "@/components/vu-meter";
import {
  Mic,
  MicOff,
  AlertCircle,
  Volume2,
  Settings2,
  Speaker,
  Clock,
  Sun,
  Moon,
  Power,
  PowerOff,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Map as MapIcon,
} from "lucide-react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useAudioMonitoring } from "@/contexts/audio-monitoring-context";
import { useSessionSync } from "@/hooks/useSessionSync";
import { useRealtimeSync } from "@/contexts/realtime-sync-context";
import { getDevices, getZones, getPoEDevices } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import type { Zone } from "@/lib/algo/types";

export default function LiveBroadcastPage() {
  const { user } = useAuth();
  const isDev = process.env.NODE_ENV === 'development';

  // Enable real-time session sync
  useSessionSync();

  // Get session state to check for multi-input monitoring conflicts
  const { sessionState, viewingAsUserEmail, viewingAsUserId, syncSessionState } = useRealtimeSync();

  // Get monitoring state from global context
  const {
    isCapturing,
    audioLevel,
    playbackAudioLevel,
    selectedInputDevice,
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
    selectedDevices,
    setSelectedDevices,
    startMonitoring,
    stopMonitoring,
    setInputDevice,
    setTargetVolume,
    setAudioThreshold,
    setRampEnabled,
    setRampDuration,
    setDayNightMode,
    setDayStartHour,
    setDayEndHour,
    setNightRampDuration,
    setSustainDuration,
    setDisableDelay,
    loggingEnabled,
    setLoggingEnabled,
    recordingEnabled,
    setRecordingEnabled,
    playbackEnabled,
    setPlaybackEnabled,
    playbackDelay,
    setPlaybackDelay,
    playbackDisableDelay,
    setPlaybackDisableDelay,
    devices: contextDevices,
    setDevices: setContextDevices,
    setPoeDevices,
    emergencyKillAll,
    emergencyEnableAll,
    controlSingleSpeaker,
    speakerStatuses,
    checkSpeakerConnectivity,
  } = useAudioMonitoring();

  // When admin is viewing a user, use sessionState for display
  // Otherwise use local context values
  const displayState = viewingAsUserId && sessionState ? sessionState : null;

  // Displayed values (what the UI shows)
  const displayedIsCapturing = displayState?.audioInputMonitoring ?? isCapturing;
  const displayedAudioLevel = displayState?.audioLevel ?? audioLevel;
  const displayedPlaybackAudioLevel = displayState?.playbackAudioLevel ?? playbackAudioLevel;
  const displayedSelectedInputDevice = displayState?.selectedInputDevice ?? selectedInputDevice;
  const displayedTargetVolume = displayState?.targetVolume ?? targetVolume;
  const displayedAudioThreshold = displayState?.audioThreshold ?? audioThreshold;
  const displayedAudioDetected = displayState?.audioDetected ?? audioDetected;
  const displayedSpeakersEnabled = displayState?.speakersEnabled ?? speakersEnabled;
  const displayedUseGlobalVolume = displayState?.useGlobalVolume ?? useGlobalVolume;
  const displayedRampEnabled = displayState?.rampEnabled ?? rampEnabled;
  const displayedRampDuration = displayState?.rampDuration ?? rampDuration;
  const displayedDayNightMode = displayState?.dayNightMode ?? dayNightMode;
  const displayedDayStartHour = displayState?.dayStartHour ?? dayStartHour;
  const displayedDayEndHour = displayState?.dayEndHour ?? dayEndHour;
  const displayedNightRampDuration = displayState?.nightRampDuration ?? nightRampDuration;
  const displayedSustainDuration = displayState?.sustainDuration ?? sustainDuration;
  const displayedDisableDelay = displayState?.disableDelay ?? disableDelay;
  const displayedPlaybackDelay = displayState?.playbackDelay ?? playbackDelay;
  const displayedPlaybackDisableDelay = displayState?.playbackDisableDelay ?? playbackDisableDelay;
  const displayedSelectedDevices = displayState?.selectedDevices ?? (selectedDevices || []);
  const displayedLoggingEnabled = displayState?.loggingEnabled ?? loggingEnabled;
  const displayedRecordingEnabled = displayState?.recordingEnabled ?? recordingEnabled;
  const displayedPlaybackEnabled = displayState?.playbackEnabled ?? playbackEnabled;

  // Safety check: ensure selectedDevices is always an array
  const safeSelectedDevices = displayedSelectedDevices || [];

  const [loading, setLoading] = useState(true);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);

  // When admin is viewing, use user's available input devices from sessionState
  const displayedInputDevices = viewingAsUserId && sessionState?.availableInputDevices
    ? sessionState.availableInputDevices
    : inputDevices;
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [localMaxVolumes, setLocalMaxVolumes] = useState<Record<string, number>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [useZoneMode, setUseZoneMode] = useState(false);

  const {
    error,
    getInputDevices,
  } = useAudioCapture();

  useEffect(() => {
    if (user?.email) {
      loadData();
      loadInputDevices();
    }
  }, [user?.email, viewingAsUserEmail]); // Reload when user changes or admin switches viewing target

  // Close any open volume editor when global mode is enabled
  useEffect(() => {
    if (useGlobalVolume && editingSpeakerId) {
      setEditingSpeakerId(null);
    }
  }, [useGlobalVolume, editingSpeakerId]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Filter devices/zones by current user
      // If admin is viewing as another user, use their email instead
      const userEmail = viewingAsUserEmail || user.email || "";

      const [devicesData, zonesData, poeDevicesData] = await Promise.all([
        getDevices(userEmail),
        getZones(userEmail),
        getPoEDevices(userEmail),
      ]);
      setContextDevices(devicesData);
      setZones(zonesData);
      setPoeDevices(poeDevicesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInputDevices = async () => {
    const devices = await getInputDevices();
    setInputDevices(devices);
  };

  // Sync input devices to session when they change (so admin can see user's available inputs)
  useEffect(() => {
    if (inputDevices.length > 0 && !viewingAsUserId) {
      // Only sync if we're the user (not admin viewing)
      syncSessionState({
        availableInputDevices: inputDevices.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Input ${d.deviceId.slice(0, 8)}`,
        })),
      });
    }
  }, [inputDevices, viewingAsUserId, syncSessionState]);

  const toggleDevice = (deviceId: string) => {
    const newDevices = safeSelectedDevices.includes(deviceId)
      ? safeSelectedDevices.filter((id) => id !== deviceId)
      : [...selectedDevices, deviceId];
    console.log('[Live] Device selection changed:', newDevices);
    setSelectedDevices(newDevices);
  };

  const selectAllDevices = () => {
    if (safeSelectedDevices.length === contextDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(contextDevices.map((d) => d.id));
    }
  };

  // Zone-based selection
  const toggleZone = async (zoneId: string) => {
    const newZones = selectedZones.includes(zoneId)
      ? selectedZones.filter((id) => id !== zoneId)
      : [...selectedZones, zoneId];

    setSelectedZones(newZones);
    await updateDevicesForZones(newZones);
  };

  const selectAllZones = async () => {
    const newZones = selectedZones.length === zones.length ? [] : zones.map(z => z.id);
    setSelectedZones(newZones);
    await updateDevicesForZones(newZones);
  };

  const updateDevicesForZones = async (zoneIds: string[]) => {
    // Get all devices assigned to selected zones (speakers only, not paging devices)
    const devicesInZones = contextDevices.filter(device =>
      device.zone && zoneIds.includes(device.zone) && device.type !== "8301"
    );
    const deviceIds = devicesInZones.map(d => d.id);

    console.log('[Live] Zone selection changed:', zoneIds);
    console.log('[Live] Speakers in selected zones:', deviceIds);

    // Update selected devices
    setSelectedDevices(deviceIds);

    // If monitoring is active, dynamically update speaker states
    // IMPORTANT: We NEVER touch the paging device (8301) - it stays in sending mode
    // We ONLY enable/disable individual speakers based on zone selection
    if (displayedIsCapturing) {
      console.log('[Live] Monitoring is active - dynamically updating SPEAKERS ONLY (paging device untouched)');

      // Get all speakers (exclude paging devices - we NEVER control those)
      const allSpeakers = contextDevices.filter(d => d.type !== "8301");

      // Disable speakers NOT in selected zones (volume → 0, multicast → none)
      const speakersToDisable = allSpeakers.filter(s => !deviceIds.includes(s.id));
      for (const speaker of speakersToDisable) {
        console.log(`[Live] Disabling speaker ${speaker.name} (not in selected zones)`);
        await controlSingleSpeaker(speaker.id, false);
      }

      // Enable speakers in selected zones (multicast → enabled, volume applied)
      const speakersToEnable = allSpeakers.filter(s => deviceIds.includes(s.id));
      for (const speaker of speakersToEnable) {
        console.log(`[Live] Enabling speaker ${speaker.name} (in selected zones)`);
        await controlSingleSpeaker(speaker.id, true);
      }

      console.log(`[Live] Zone switch complete - ${speakersToEnable.length} speakers ON, ${speakersToDisable.length} speakers OFF`);
    }
  };

  // Determine if currently in day or night mode (supports half-hour intervals)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + (currentMinute >= 30 ? 0.5 : 0);
  const isDaytime = currentTime >= displayedDayStartHour && currentTime < displayedDayEndHour;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent-blue)] border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Audio Input</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Monitor audio and automatically control speaker activation
            </p>
          </div>
          {displayedIsCapturing && (
            <div className="flex items-center gap-3">
              <Badge variant={displayedSpeakersEnabled ? "destructive" : "success"} className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${displayedSpeakersEnabled ? "bg-white animate-blink" : "bg-white"}`} />
                {displayedSpeakersEnabled ? "Broadcasting" : "Standby"}
              </Badge>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--accent-red)]/15 border border-[var(--accent-red)]/30 p-4 text-[var(--accent-red)]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Audio Input & VU Meter */}
          <div className="space-y-6 lg:col-span-2">
            {/* Warning if multi-input is active */}
            {sessionState?.multiInputMonitoring && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300 font-semibold">
                      Multi-Input Routing is currently active. Audio Input monitoring is disabled.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Level Display */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-blue)]/15">
                      <Mic className="h-5 w-5 text-[var(--accent-blue)]" />
                    </div>
                    <CardTitle>Audio Monitor</CardTitle>
                  </div>
                  {!displayedIsCapturing ? (
                    <Button
                      onClick={() => {
                        // Check if multi-input monitoring is active
                        if (sessionState?.multiInputMonitoring) {
                          alert('Cannot start audio input monitoring: Multi-Input Routing is currently active. Please stop multi-input monitoring first.');
                          return;
                        }
                        console.log('[Live] User clicked Start Monitoring');
                        startMonitoring(displayedSelectedInputDevice || undefined);
                      }}
                      disabled={sessionState?.multiInputMonitoring}
                      title={sessionState?.multiInputMonitoring ? 'Multi-Input Routing is active' : ''}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Monitoring
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        console.log('[Live] User clicked Stop Monitoring');
                        stopMonitoring();
                      }}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Audio VU Meter */}
                <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Input Level</span>
                    <span className="text-sm font-mono text-[var(--accent-blue)]">
                      {displayedIsCapturing ? `${displayedAudioLevel.toFixed(1)}%` : "-- %"}
                    </span>
                  </div>
                  <VUMeter level={displayedIsCapturing ? displayedAudioLevel : 0} barCount={24} showPeakHold={false} />

                  {/* Threshold indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-orange)]"
                        style={{ left: `${displayedAudioThreshold * 2}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      Threshold: {displayedAudioThreshold}%
                    </span>
                  </div>
                </div>

                {/* Playback Audio VU Meter */}
                {playbackEnabled && (
                  <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">Playback Level</span>
                      <span className="text-sm font-mono text-[var(--accent-green)]">
                        {displayedPlaybackAudioLevel > 0 ? `${displayedPlaybackAudioLevel.toFixed(1)}%` : "-- %"}
                      </span>
                    </div>
                    <VUMeter level={displayedPlaybackAudioLevel} barCount={24} showPeakHold={false} />

                    {/* Playback status */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${displayedPlaybackAudioLevel > 0 ? 'bg-[var(--accent-green)] animate-pulse' : 'bg-[var(--text-muted)]'}`}></div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {displayedPlaybackAudioLevel > 0 ? "Playing to system audio" : "No playback"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${displayedIsCapturing ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Monitoring</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{displayedIsCapturing ? "Active" : "Off"}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${displayedAudioDetected ? "bg-[var(--accent-orange)]" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Audio</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{displayedAudioDetected ? "Detected" : "Silent"}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${displayedSpeakersEnabled ? "bg-[var(--accent-red)] animate-blink" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Speakers</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{displayedSpeakersEnabled ? "On" : "Off"}</div>
                  </div>
                </div>

                {/* Input Device Selection */}
                <div className="space-y-2">
                  <Label>Input Device</Label>
                  <Select
                    value={displayedSelectedInputDevice}
                    onChange={(e) => setInputDevice(e.target.value)}
                  >
                    <option value="">Default Input</option>
                    {displayedInputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Input ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Controls */}
            <Card className="border-[var(--accent-red)]/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-red)]/15">
                    <AlertTriangle className="h-5 w-5 text-[var(--accent-red)]" />
                  </div>
                  <div>
                    <CardTitle>Emergency Controls</CardTitle>
                    <span className="text-xs text-[var(--text-muted)]">Manual speaker control</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    className="h-14"
                    onClick={emergencyKillAll}
                  >
                    <PowerOff className="mr-2 h-5 w-5" />
                    KILL ALL
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10"
                    onClick={emergencyEnableAll}
                  >
                    <Power className="mr-2 h-5 w-5" />
                    ENABLE ALL
                  </Button>
                </div>

                {/* Individual Speaker Controls */}
                {contextDevices.filter(d => d.type !== "8301").length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                          Individual Speakers
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => checkSpeakerConnectivity()}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Check
                        </Button>
                        {speakerStatuses.length > 0 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            ({speakerStatuses.filter(s => s.isOnline).length}/{speakerStatuses.length} online)
                          </span>
                        )}
                      </div>
                      {displayedUseGlobalVolume && (
                        <span className="text-xs text-[var(--accent-orange)] bg-[var(--accent-orange)]/10 px-2 py-1 rounded">
                          Overridden by Global Mode
                        </span>
                      )}
                    </div>
                    <div className={`grid gap-3 max-h-[400px] overflow-y-auto transition-opacity ${displayedUseGlobalVolume ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      {contextDevices
                        .filter(d => d.type !== "8301")
                        .map((speaker) => {
                          const isEditing = editingSpeakerId === speaker.id && !displayedUseGlobalVolume;
                          // Display as 0-10 level, store as 0-100%
                          const storedMaxVolume = speaker.maxVolume ?? 100;
                          const displayLevel = Math.round(storedMaxVolume / 10);
                          const localLevel = localMaxVolumes[speaker.id] !== undefined
                            ? Math.round(localMaxVolumes[speaker.id] / 10)
                            : displayLevel;
                          // Get speaker status
                          const speakerStatus = speakerStatuses.find(s => s.speakerId === speaker.id);

                          return (
                            <div
                              key={speaker.id}
                              className={`p-3 rounded-xl bg-[var(--bg-secondary)] border space-y-3 transition-all ${
                                displayedUseGlobalVolume
                                  ? 'border-[var(--border-color)]/50 cursor-not-allowed'
                                  : 'border-[var(--border-color)]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Speaker className={`h-4 w-4 ${displayedUseGlobalVolume ? 'text-[var(--text-muted)]/50' : 'text-[var(--text-muted)]'}`} />
                                  <div>
                                    <p className={`text-sm font-medium flex items-center gap-2 ${displayedUseGlobalVolume ? 'text-[var(--text-primary)]/60' : 'text-[var(--text-primary)]'}`}>
                                      {speaker.name}
                                      {speakerStatus && (
                                        speakerStatus.isOnline
                                          ? <Wifi className="h-3 w-3 text-[var(--accent-green)]" />
                                          : <WifiOff className="h-3 w-3 text-[var(--accent-red)]" />
                                      )}
                                    </p>
                                    <button
                                      onClick={() => {
                                        if (!isEditing && !displayedUseGlobalVolume) {
                                          setLocalMaxVolumes(prev => ({
                                            ...prev,
                                            [speaker.id]: storedMaxVolume
                                          }));
                                          setEditingSpeakerId(speaker.id);
                                        }
                                      }}
                                      disabled={displayedUseGlobalVolume}
                                      className={`text-xs ${
                                        displayedUseGlobalVolume
                                          ? 'text-[var(--text-muted)]/50 cursor-not-allowed line-through'
                                          : 'text-[var(--accent-blue)] hover:underline cursor-pointer'
                                      }`}
                                      title={displayedUseGlobalVolume ? "Disabled - Global volume mode is active" : "Click to edit"}
                                    >
                                      Max: Level {displayLevel}/10 {!displayedUseGlobalVolume && '(click to edit)'}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[var(--accent-green)] border-[var(--accent-green)]/50 hover:bg-[var(--accent-green)]/10"
                                    onClick={() => controlSingleSpeaker(speaker.id, true)}
                                    disabled={displayedUseGlobalVolume}
                                  >
                                    <Power className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[var(--accent-red)] border-[var(--accent-red)]/50 hover:bg-[var(--accent-red)]/10"
                                    onClick={() => controlSingleSpeaker(speaker.id, false)}
                                    disabled={displayedUseGlobalVolume}
                                  >
                                    <PowerOff className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {isEditing && !displayedUseGlobalVolume && (
                                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Max Volume Level</Label>
                                    <span className="text-xs font-mono text-[var(--accent-blue)]">Level {localLevel}/10</span>
                                  </div>
                                  <Slider
                                    min={0}
                                    max={10}
                                    value={localLevel}
                                    onChange={(e) => {
                                      const level = parseInt(e.target.value);
                                      // Convert 0-10 to 0-100% for storage
                                      setLocalMaxVolumes(prev => ({
                                        ...prev,
                                        [speaker.id]: level * 10
                                      }));
                                    }}
                                  />
                                  <p className="text-xs text-[var(--text-muted)]">
                                    Algo speakers use 0-10 scale (0=mute, 10=max)
                                  </p>
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={async () => {
                                        try {
                                          const { updateDevice } = await import("@/lib/firebase/firestore");
                                          const volumeToSave = localMaxVolumes[speaker.id];
                                          await updateDevice(speaker.id, { maxVolume: volumeToSave });
                                          speaker.maxVolume = volumeToSave;
                                          setEditingSpeakerId(null);
                                          await loadData(); // Refresh devices
                                        } catch (error) {
                                          console.error("Failed to update max volume:", error);
                                          alert("Failed to save max volume");
                                        }
                                      }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="flex-1 text-xs"
                                      onClick={() => {
                                        setEditingSpeakerId(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detection Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-orange)]/15">
                    <Settings2 className="h-5 w-5 text-[var(--accent-orange)]" />
                  </div>
                  <div>
                    <CardTitle>Detection Settings</CardTitle>
                    {displayedIsCapturing && (
                      <span className="text-xs text-[var(--accent-green)]">Live adjustable</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Audio Threshold</Label>
                    <span className="text-sm font-mono text-[var(--accent-blue)]">{displayedAudioThreshold}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={50}
                    value={displayedAudioThreshold}
                    onChange={(e) => setAudioThreshold(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Minimum audio level to trigger speaker activation
                  </p>
                </div>

                {/* Sustain Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sustain Duration</Label>
                    <span className="text-sm font-mono text-[var(--accent-blue)]">{(displayedSustainDuration / 1000).toFixed(1)}s</span>
                  </div>
                  <Slider
                    min={0}
                    max={3000}
                    step={100}
                    value={displayedSustainDuration}
                    onChange={(e) => setSustainDuration(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Audio must stay above threshold for this duration to trigger
                  </p>
                </div>

                {/* Disable Delay */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Disable Delay</Label>
                    <span className="text-sm font-mono text-[var(--accent-blue)]">{(displayedDisableDelay / 1000).toFixed(0)}s</span>
                  </div>
                  <Slider
                    min={1000}
                    max={30000}
                    step={1000}
                    value={displayedDisableDelay}
                    onChange={(e) => setDisableDelay(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Wait before disabling speakers after silence {displayedPlaybackEnabled && '(not used when playback enabled)'}
                  </p>
                </div>

                {/* Playback Delay - Only show when playback is enabled */}
                {displayedPlaybackEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Playback Delay</Label>
                      <span className="text-sm font-mono text-[var(--accent-blue)]">{(displayedPlaybackDelay / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={10000}
                      step={100}
                      value={displayedPlaybackDelay}
                      onChange={(e) => setPlaybackDelay(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      Wait after paging device is ready before starting playback
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30">
                      <span className="text-xs">✅</span>
                      <p className="text-xs text-[var(--text-secondary)]">
                        <strong>Smart Shutdown:</strong> After starting playback, paging stays ON until playback completes, then automatically shuts down.
                      </p>
                    </div>
                  </div>
                )}

                {/* Playback Disable Delay - Only show when playback is enabled */}
                {displayedPlaybackEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Playback Disable Delay</Label>
                      <span className="text-sm font-mono text-[var(--accent-blue)]">{(displayedPlaybackDisableDelay / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={10000}
                      step={100}
                      value={displayedPlaybackDisableDelay}
                      onChange={(e) => setPlaybackDisableDelay(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      Wait after silence detected before stopping recording (replaces Disable Delay when playback enabled)
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30">
                      <span className="text-xs">💡</span>
                      <p className="text-xs text-[var(--text-secondary)]">
                        <strong>Smart Timing:</strong> This delay ensures complete audio capture for playback. Longer = more complete recordings, but slower shutdown.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Volume Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-green)]/15">
                    <Volume2 className="h-5 w-5 text-[var(--accent-green)]" />
                  </div>
                  <div>
                    <CardTitle>Volume Settings</CardTitle>
                    {displayedIsCapturing && (
                      <span className="text-xs text-[var(--accent-green)]">Live adjustable</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Volume Mode Selection */}
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="!text-[var(--text-primary)]">Use Global Volume</Label>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {displayedUseGlobalVolume
                          ? "All speakers use same volume (individual settings ignored)"
                          : "Each speaker uses its own max volume setting"}
                      </p>
                    </div>
                    <Switch
                      checked={displayedUseGlobalVolume}
                      onCheckedChange={setUseGlobalVolume}
                    />
                  </div>

                  {displayedUseGlobalVolume ? (
                    <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Global Volume Level</Label>
                        <span className="text-xs font-mono text-[var(--accent-blue)]">{displayedTargetVolume}% (Lv. {Math.round(displayedTargetVolume / 10)}/10)</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        value={displayedTargetVolume}
                        onChange={(e) => setTargetVolume(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-[var(--text-muted)]">
                        All speakers will play at this volume level
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <p className="text-xs text-[var(--accent-blue)]">
                        ✓ Using individual speaker max volumes (editable in Emergency Controls below)
                      </p>
                    </div>
                  )}
                </div>

                {/* Volume Ramp */}
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                      <Label className="!text-[var(--text-primary)]">Volume Ramp</Label>
                    </div>
                    <Switch checked={displayedRampEnabled} onCheckedChange={setRampEnabled} />
                  </div>

                  {displayedRampEnabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isDaytime ? <Sun className="h-4 w-4 text-[var(--accent-orange)]" /> : <Moon className="h-4 w-4 text-[var(--accent-purple)]" />}
                          <Label className="!text-[var(--text-primary)]">Day/Night Mode</Label>
                        </div>
                        <Switch checked={displayedDayNightMode} onCheckedChange={setDayNightMode} />
                      </div>

                      {displayedDayNightMode ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[var(--text-muted)]">Day:</span>
                            <Select
                              value={displayedDayStartHour.toString()}
                              onChange={(e) => setDayStartHour(parseFloat(e.target.value))}
                              className="w-24"
                            >
                              {Array.from({ length: 48 }, (_, i) => {
                                const time = i / 2; // 0, 0.5, 1, 1.5, ...
                                const hour = Math.floor(time);
                                const minute = (time % 1) * 60;
                                const label = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
                                return <option key={i} value={time}>{label}</option>;
                              })}
                            </Select>
                            <span className="text-[var(--text-muted)]">to</span>
                            <Select
                              value={displayedDayEndHour.toString()}
                              onChange={(e) => setDayEndHour(parseFloat(e.target.value))}
                              className="w-24"
                            >
                              {Array.from({ length: 48 }, (_, i) => {
                                const time = i / 2; // 0, 0.5, 1, 1.5, ...
                                const hour = Math.floor(time);
                                const minute = (time % 1) * 60;
                                const label = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
                                return <option key={i} value={time}>{label}</option>;
                              })}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Night Ramp: {displayedNightRampDuration}s</Label>
                              <Badge variant={isDaytime ? "secondary" : "default"} className="text-xs">
                                {isDaytime ? "Day (Instant)" : "Night (Ramp)"}
                              </Badge>
                            </div>
                            <Slider
                              min={0}
                              max={30}
                              value={displayedNightRampDuration}
                              onChange={(e) => setNightRampDuration(parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-xs">Ramp Duration: {displayedRampDuration}s</Label>
                          <Slider
                            min={0}
                            max={30}
                            value={displayedRampDuration}
                            onChange={(e) => setRampDuration(parseInt(e.target.value))}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logging & Recording */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-purple)]/15">
                    <Settings2 className="h-5 w-5 text-[var(--accent-purple)]" />
                  </div>
                  <CardTitle>Logging & Recording</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div>
                    <Label className="!text-[var(--text-primary)]">Activity Logging</Label>
                    <p className="text-xs text-[var(--text-muted)]">
                      Log audio events to the activity viewer
                    </p>
                  </div>
                  <Switch checked={displayedLoggingEnabled} onCheckedChange={setLoggingEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div>
                    <Label className="!text-[var(--text-primary)]">Save Recording</Label>
                    <p className="text-xs text-[var(--text-muted)]">
                      {displayedRecordingEnabled
                        ? "Save audio clips to Firebase Storage"
                        : "Temporary only - recordings not saved"}
                    </p>
                  </div>
                  <Switch checked={displayedRecordingEnabled} onCheckedChange={setRecordingEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div>
                    <Label className="!text-[var(--text-primary)]">Live Playback</Label>
                    <p className="text-xs text-[var(--text-muted)]">
                      {displayedPlaybackEnabled
                        ? "Play recorded audio through system in real-time"
                        : "Disabled - no live playback"}
                    </p>
                  </div>
                  <Switch
                    checked={displayedPlaybackEnabled}
                    onCheckedChange={setPlaybackEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Devices & Broadcast */}
          <div className="space-y-6">
            {/* Zone Selection */}
            {zones.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--accent-purple)]/15">
                        <MapIcon className="h-5 w-5 text-[var(--accent-purple)]" />
                      </div>
                      <div>
                        <CardTitle>Zone Selection</CardTitle>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Select zones to broadcast to
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useZoneMode}
                      onCheckedChange={setUseZoneMode}
                    />
                  </div>
                </CardHeader>
                {useZoneMode && (
                  <CardContent>
                    <div className="space-y-3">
                      {/* Select All Zones Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={selectAllZones}
                      >
                        {selectedZones.length === zones.length ? "Deselect All Zones" : "Select All Zones"}
                      </Button>

                      {/* Zone List */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {zones.map((zone) => {
                          const devicesInZone = contextDevices.filter(d => d.zone === zone.id);
                          const isSelected = selectedZones.includes(zone.id);

                          return (
                            <button
                              key={zone.id}
                              onClick={() => toggleZone(zone.id)}
                              className={`flex items-center gap-3 w-full rounded-xl border p-3 text-left transition-all ${
                                isSelected
                                  ? "border-[var(--accent-purple)]/50 bg-[var(--accent-purple)]/10"
                                  : "border-[var(--border-color)] hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)]"
                              }`}
                              style={{
                                borderLeft: isSelected ? `4px solid ${zone.color}` : undefined,
                              }}
                            >
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  isSelected
                                    ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]"
                                    : "border-[var(--border-color)]"
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-2 w-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-[var(--text-primary)]">
                                  {zone.name}
                                </p>
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  {devicesInZone.length} speaker{devicesInZone.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Zones Summary */}
                      {selectedZones.length > 0 && (
                        <div className="p-3 rounded-xl bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30">
                          <p className="text-xs text-[var(--accent-purple)] font-medium">
                            Broadcasting to {selectedZones.length} zone{selectedZones.length !== 1 ? 's' : ''}
                            {' '}({safeSelectedDevices.length} speaker{safeSelectedDevices.length !== 1 ? 's' : ''})
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Device Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-green)]/15">
                      <Speaker className="h-5 w-5 text-[var(--accent-green)]" />
                    </div>
                    <div>
                      <CardTitle>Target Devices</CardTitle>
                      {useZoneMode && (
                        <p className="text-xs text-[var(--accent-purple)] mt-0.5">
                          Controlled by zone selection
                        </p>
                      )}
                    </div>
                  </div>
                  {!useZoneMode && (
                    <Button variant="outline" size="sm" onClick={selectAllDevices}>
                      {safeSelectedDevices.length === contextDevices.length ? "Deselect" : "Select All"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contextDevices.length === 0 ? (
                  <div className="text-center py-6">
                    <Speaker className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
                    <p className="text-sm text-[var(--text-muted)]">
                      No devices available.{" "}
                      <Link href="/devices" className="text-[var(--accent-blue)] hover:underline">
                        Add some first
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <div className={`space-y-2 max-h-[300px] overflow-y-auto ${useZoneMode ? 'opacity-60 pointer-events-none' : ''}`}>
                    {contextDevices.map((device) => {
                      const deviceZone = zones.find(z => z.id === device.zone);
                      return (
                        <button
                          key={device.id}
                          onClick={() => !useZoneMode && toggleDevice(device.id)}
                          disabled={useZoneMode}
                          className={`flex items-center gap-3 w-full rounded-xl border p-3 text-left transition-all ${
                            safeSelectedDevices.includes(device.id)
                              ? "border-[var(--accent-blue)]/50 bg-[var(--accent-blue)]/10"
                              : "border-[var(--border-color)] hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              safeSelectedDevices.includes(device.id)
                                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]"
                                : "border-[var(--border-color)]"
                            }`}
                          >
                            {safeSelectedDevices.includes(device.id) && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[var(--text-primary)]">
                              {device.name}
                            </p>
                            <p className="truncate text-xs text-[var(--text-muted)]">
                              {deviceZone ? (
                                <span style={{ color: deviceZone.color }}>
                                  {deviceZone.name}
                                </span>
                              ) : (
                                device.ipAddress
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Status</span>
                    <Badge variant={displayedIsCapturing ? "success" : "secondary"}>
                      {displayedIsCapturing ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Devices</span>
                    <span className="font-semibold text-[var(--text-primary)]">{safeSelectedDevices.length} selected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Info (Dev only) */}
            {isDev && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs text-[var(--text-muted)]">Debug</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3 overflow-x-auto">
                  <div className="space-y-1 text-xs font-mono text-[var(--text-muted)] min-w-0">
                    <div className="truncate" title={safeSelectedDevices.join(', ')}>
                      Devices: {safeSelectedDevices.length > 0 ? safeSelectedDevices.join(', ') : 'None'}
                    </div>
                    <div className="truncate" title={selectedInputDevice || 'Default'}>
                      Input: {selectedInputDevice || 'Default'}
                    </div>
                    <div>Monitoring: {displayedIsCapturing ? 'Active' : 'Stopped'}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
