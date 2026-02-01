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
import { useSimpleMonitoring } from "@/contexts/simple-monitoring-context";
import { getDevices, getZones, getPoEDevices } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import type { Zone } from "@/lib/algo/types";

function LiveV2Content() {
  const { user } = useAuth();
  const isDev = process.env.NODE_ENV === 'development';

  // Get monitoring state from CLEAN simple monitoring context
  const {
    isMonitoring,
    audioLevel,
    playbackAudioLevel,
    selectedInputDevice,
    targetVolume,
    audioThreshold,
    audioDetected,
    speakersEnabled,
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
    silenceTimeout,
    setSilenceTimeout,
    playbackRampDuration,
    setPlaybackRampDuration,
    playbackStartVolume,
    setPlaybackStartVolume,
    playbackMaxVolume,
    setPlaybackMaxVolume,
    playbackVolume,
    setPlaybackVolume,
    playbackRampEnabled,
    setPlaybackRampEnabled,
    playbackRampStartVolume,
    setPlaybackRampStartVolume,
    playbackRampTargetVolume,
    setPlaybackRampTargetVolume,
    playbackSessionRampDuration,
    setPlaybackSessionRampDuration,
    devices: contextDevices,
    setDevices: setContextDevices,
    setPoeDevices,
    emergencyKillAll,
    emergencyEnableAll,
    controlSingleSpeaker,
    speakerStatuses,
    checkSpeakerConnectivity,
    emulationMode,
    setEmulationMode,
    emulationNetworkDelay,
    setEmulationNetworkDelay,
    triggerTestCall,
    onAudioDetected,
    logs,
  } = useSimpleMonitoring();

  // Safety check: ensure selectedDevices is always an array
  const safeSelectedDevices = selectedDevices || [];

  const [loading, setLoading] = useState(true);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [localMaxVolumes, setLocalMaxVolumes] = useState<Record<string, number>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [useZoneMode, setUseZoneMode] = useState(false);

  const {
    error,
    getInputDevices,
  } = useAudioCapture();

  // Alias isMonitoring as isCapturing for UI compatibility
  const isCapturing = isMonitoring;

  useEffect(() => {
    if (user?.email) {
      loadData();
      loadInputDevices();
    }
  }, [user?.email]);

  const loadData = async () => {
    if (!user) return;

    try {
      const userEmail = user.email || "";

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

  const toggleDevice = (deviceId: string) => {
    const newDevices = safeSelectedDevices.includes(deviceId)
      ? safeSelectedDevices.filter((id) => id !== deviceId)
      : [...selectedDevices, deviceId];
    console.log('[Live V2] Device selection changed:', newDevices);
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

    console.log('[Live V2] Zone selection changed:', zoneIds);
    console.log('[Live V2] Speakers in selected zones:', deviceIds);

    // Update selected devices
    setSelectedDevices(deviceIds);

    // If monitoring is active, dynamically update speaker states
    if (isCapturing) {
      console.log('[Live V2] Monitoring is active - dynamically updating SPEAKERS ONLY');

      // Get all speakers (exclude paging devices)
      const allSpeakers = contextDevices.filter(d => d.type !== "8301");

      // Disable speakers NOT in selected zones
      const speakersToDisable = allSpeakers.filter(s => !deviceIds.includes(s.id));
      for (const speaker of speakersToDisable) {
        console.log(`[Live V2] Disabling speaker ${speaker.name}`);
        await controlSingleSpeaker(speaker.id, false);
      }

      // Enable speakers in selected zones
      const speakersToEnable = allSpeakers.filter(s => deviceIds.includes(s.id));
      for (const speaker of speakersToEnable) {
        console.log(`[Live V2] Enabling speaker ${speaker.name}`);
        await controlSingleSpeaker(speaker.id, true);
      }

      console.log(`[Live V2] Zone switch complete - ${speakersToEnable.length} speakers ON, ${speakersToDisable.length} speakers OFF`);
    }
  };

  // Determine if currently in day or night mode
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + (currentMinute >= 30 ? 0.5 : 0);
  const isDaytime = currentTime >= dayStartHour && currentTime < dayEndHour;

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
            <div className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Clean Architecture</Badge>
              <span>Producer/Consumer pattern • 5s batches • Configurable silence timeout</span>
            </div>
          </div>
          {isCapturing && (
            <div className="flex items-center gap-3">
              <Badge variant={speakersEnabled ? "destructive" : "success"} className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${speakersEnabled ? "bg-white animate-blink" : "bg-white"}`} />
                {speakersEnabled ? "Broadcasting" : "Standby"}
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
                  {!isCapturing ? (
                    <Button
                      onClick={() => {
                        console.log('[Live V2] User clicked Start Monitoring');
                        startMonitoring();
                      }}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Monitoring
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        console.log('[Live V2] User clicked Stop Monitoring');
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
                      {isCapturing ? `${audioLevel.toFixed(1)}%` : "-- %"}
                    </span>
                  </div>
                  <VUMeter level={isCapturing ? audioLevel : 0} barCount={24} showPeakHold={false} />

                  {/* Threshold indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-orange)]"
                        style={{ left: `${audioThreshold * 2}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      Threshold: {audioThreshold}%
                    </span>
                  </div>
                </div>

                {/* Playback Audio VU Meter */}
                {playbackEnabled && (
                  <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">Playback Level</span>
                      <span className="text-sm font-mono text-[var(--accent-green)]">
                        {playbackAudioLevel > 0 ? `${playbackAudioLevel.toFixed(1)}%` : "-- %"}
                      </span>
                    </div>
                    <VUMeter level={playbackAudioLevel} barCount={24} showPeakHold={false} />

                    {/* Playback status */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${playbackAudioLevel > 0 ? 'bg-[var(--accent-green)] animate-pulse' : 'bg-[var(--text-muted)]'}`}></div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {playbackAudioLevel > 0 ? "Playing to system audio" : "No playback"}
                      </span>
                    </div>

                    {/* Playback Volume Slider */}
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">Playback Volume</Label>
                        <span className="text-sm font-mono text-[var(--accent-green)]">
                          {(playbackVolume * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={2}
                        step={0.05}
                        value={playbackVolume}
                        onChange={(e) => setPlaybackVolume(parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        0% = mute, 100% = normal, 200% = amplified
                      </p>
                    </div>

                    {/* Playback Volume Ramping */}
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Session Volume Ramp</Label>
                          <p className="text-xs text-[var(--text-muted)]">Fade in volume at start of each session</p>
                        </div>
                        <Switch
                          checked={playbackRampEnabled}
                          onCheckedChange={setPlaybackRampEnabled}
                        />
                      </div>

                      {playbackRampEnabled && (
                        <div className="space-y-4 p-3 rounded-lg bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20">
                          {/* Start Volume */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Start Volume</Label>
                              <span className="text-xs font-mono text-[var(--accent-blue)]">
                                {(playbackRampStartVolume * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={2}
                              step={0.05}
                              value={playbackRampStartVolume}
                              onChange={(e) => setPlaybackRampStartVolume(parseFloat(e.target.value))}
                            />
                          </div>

                          {/* Target Volume */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Target Volume</Label>
                              <span className="text-xs font-mono text-[var(--accent-green)]">
                                {(playbackRampTargetVolume * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={2}
                              step={0.05}
                              value={playbackRampTargetVolume}
                              onChange={(e) => setPlaybackRampTargetVolume(parseFloat(e.target.value))}
                            />
                          </div>

                          {/* Ramp Duration */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Ramp Duration</Label>
                              <span className="text-xs font-mono text-[var(--accent-purple)]">
                                {(playbackSessionRampDuration / 1000).toFixed(1)}s
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={5000}
                              step={100}
                              value={playbackSessionRampDuration}
                              onChange={(e) => setPlaybackSessionRampDuration(parseInt(e.target.value))}
                            />
                          </div>

                          <div className="flex items-start gap-2 p-2 rounded bg-[var(--accent-blue)]/10">
                            <span className="text-xs">🎚️</span>
                            <p className="text-xs text-[var(--text-secondary)]">
                              <strong>Example:</strong> 0% → 200% over 2s = dramatic fade-in at start of each session
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isCapturing ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Monitoring</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{isCapturing ? "Active" : "Off"}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${audioDetected ? "bg-[var(--accent-orange)]" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Audio</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{audioDetected ? "Detected" : "Silent"}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${speakersEnabled ? "bg-[var(--accent-red)] animate-blink" : "bg-[var(--text-muted)]"}`} />
                    <div className="text-xs text-[var(--text-muted)]">Speakers</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{speakersEnabled ? "On" : "Off"}</div>
                  </div>
                </div>

                {/* Input Device Selection */}
                <div className="space-y-2">
                  <Label>Input Device</Label>
                  <Select
                    value={selectedInputDevice || ""}
                    onChange={(e) => setInputDevice(e.target.value)}
                  >
                    <option value="">Default Input</option>
                    {inputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Input ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Emulation Mode */}
            <Card className="border-[var(--accent-cyan)]/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-cyan)]/15">
                    <Settings2 className="h-5 w-5 text-[var(--accent-cyan)]" />
                  </div>
                  <div>
                    <CardTitle>🧪 Emulation Mode</CardTitle>
                    <span className="text-xs text-[var(--text-muted)]">Test with virtual devices</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Enable Emulation</Label>
                    <span className="text-xs text-[var(--text-muted)]">
                      Creates 12 virtual speakers + 1 paging device
                    </span>
                  </div>
                  <Switch
                    checked={emulationMode}
                    onCheckedChange={(checked) => {
                      setEmulationMode(checked);
                      if (checked) {
                        console.log('[Emulation] Mode enabled');
                      } else {
                        console.log('[Emulation] Mode disabled');
                      }
                    }}
                    disabled={isCapturing}
                  />
                </div>

                {emulationMode && (
                  <div className="space-y-3 p-3 rounded-lg bg-[var(--accent-cyan)]/5">
                    <div className="flex items-center gap-2 text-xs text-[var(--accent-cyan)]">
                      <AlertCircle className="h-4 w-4" />
                      <span>Virtual devices active (no physical hardware needed)</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Network Delay Simulation</Label>
                        <span className="text-xs font-mono text-[var(--accent-cyan)]">
                          {(emulationNetworkDelay / 1000).toFixed(0)}s
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={30000}
                        step={1000}
                        value={emulationNetworkDelay}
                        onChange={(e) => setEmulationNetworkDelay(parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-[var(--text-muted)]">
                        Simulates slow polling/network (0s = instant, 20s = realistic)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Trigger Test Call</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerTestCall(3)}
                          disabled={!isCapturing}
                          className="text-xs"
                        >
                          3s
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerTestCall(5)}
                          disabled={!isCapturing}
                          className="text-xs"
                        >
                          5s
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerTestCall(10)}
                          disabled={!isCapturing}
                          className="text-xs"
                        >
                          10s
                        </Button>
                      </div>
                      {!isCapturing && (
                        <p className="text-xs text-[var(--accent-yellow)]">
                          Start monitoring first to trigger test calls
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                    </div>
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                      {contextDevices
                        .filter(d => d.type !== "8301")
                        .map((speaker) => {
                          const isEditing = editingSpeakerId === speaker.id;
                          const storedMaxVolume = speaker.maxVolume ?? 100;
                          const displayLevel = Math.round(storedMaxVolume / 10);
                          const localLevel = localMaxVolumes[speaker.id] !== undefined
                            ? Math.round(localMaxVolumes[speaker.id] / 10)
                            : displayLevel;
                          const speakerStatus = speakerStatuses.find(s => s.speakerId === speaker.id);

                          return (
                            <div
                              key={speaker.id}
                              className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Speaker className="h-4 w-4 text-[var(--text-muted)]" />
                                  <div>
                                    <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
                                      {speaker.name}
                                      {speakerStatus && (
                                        speakerStatus.isOnline
                                          ? <Wifi className="h-3 w-3 text-[var(--accent-green)]" />
                                          : <WifiOff className="h-3 w-3 text-[var(--accent-red)]" />
                                      )}
                                    </p>
                                    <button
                                      onClick={() => {
                                        if (!isEditing) {
                                          setLocalMaxVolumes(prev => ({
                                            ...prev,
                                            [speaker.id]: storedMaxVolume
                                          }));
                                          setEditingSpeakerId(speaker.id);
                                        }
                                      }}
                                      className="text-xs text-[var(--accent-blue)] hover:underline cursor-pointer"
                                      title="Click to edit"
                                    >
                                      Max: Level {displayLevel}/10 (click to edit)
                                    </button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[var(--accent-green)] border-[var(--accent-green)]/50 hover:bg-[var(--accent-green)]/10"
                                    onClick={() => controlSingleSpeaker(speaker.id, true)}
                                  >
                                    <Power className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[var(--accent-red)] border-[var(--accent-red)]/50 hover:bg-[var(--accent-red)]/10"
                                    onClick={() => controlSingleSpeaker(speaker.id, false)}
                                  >
                                    <PowerOff className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {isEditing && (
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
                                          await loadData();
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
                    {isCapturing && (
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
                    <span className="text-sm font-mono text-[var(--accent-blue)]">{audioThreshold}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={50}
                    value={audioThreshold}
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
                    <span className="text-sm font-mono text-[var(--accent-blue)]">{sustainDuration >= 1000 ? `${(sustainDuration / 1000).toFixed(1)}s` : `${sustainDuration}ms`}</span>
                  </div>
                  <Slider
                    min={10}
                    max={3000}
                    step={10}
                    value={sustainDuration}
                    onChange={(e) => setSustainDuration(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Audio must stay above threshold for this duration to trigger
                  </p>
                </div>

                {/* Playback Delay */}
                {playbackEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Playback Delay</Label>
                      <span className="text-sm font-mono text-[var(--accent-blue)]">{(playbackDelay / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={10000}
                      step={100}
                      value={playbackDelay}
                      onChange={(e) => setPlaybackDelay(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      Wait after paging device is ready before starting playback
                    </p>
                  </div>
                )}

                {/* Silence Timeout - KEY DIFFERENTIATOR */}
                {playbackEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        Silence Timeout
                        <Badge variant="default" className="text-xs">Clean Architecture</Badge>
                      </Label>
                      <span className="text-sm font-mono text-[var(--accent-blue)]">{(silenceTimeout / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={30000}
                      step={1000}
                      value={silenceTimeout}
                      onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      How long to wait after silence before stopping batching. 0s = new session per pause, higher = more forgiving pauses in same session.
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30">
                      <span className="text-xs">✨</span>
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <p><strong>Clean Architecture Benefits:</strong></p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li>No TailGuard complexity</li>
                          <li>No grace periods</li>
                          <li>Recording never blocks on playback</li>
                          <li>Playback never blocks on recording</li>
                          <li>Natural session batching based on silence</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
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
                  <Switch checked={loggingEnabled} onCheckedChange={setLoggingEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div>
                    <Label className="!text-[var(--text-primary)]">Save Recording</Label>
                    <p className="text-xs text-[var(--text-muted)]">
                      {recordingEnabled
                        ? "Save audio clips to Firebase Storage"
                        : "Temporary only - recordings not saved"}
                    </p>
                  </div>
                  <Switch checked={recordingEnabled} onCheckedChange={setRecordingEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div>
                    <Label className="!text-[var(--text-primary)]">Live Playback</Label>
                    <p className="text-xs text-[var(--text-muted)]">
                      {playbackEnabled
                        ? "Play recorded audio through system in real-time"
                        : "Disabled - no live playback"}
                    </p>
                  </div>
                  <Switch
                    checked={playbackEnabled}
                    onCheckedChange={setPlaybackEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Activity Log - View in /activity page or browser console */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <p>📊 Activity logs are available in:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Browser Console (F12)</li>
                    <li><Link href="/activity" className="text-[var(--accent-blue)] hover:underline">Activity Viewer Page</Link></li>
                  </ul>
                  <p className="text-xs mt-3">
                    Using the same logging infrastructure as /live page for consistency.
                  </p>
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
                    <Badge variant={isCapturing ? "success" : "secondary"}>
                      {isCapturing ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Devices</span>
                    <span className="font-semibold text-[var(--text-primary)]">{safeSelectedDevices.length} selected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Architecture</span>
                    <Badge variant="secondary">Producer/Consumer</Badge>
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
                    <div>Monitoring: {isCapturing ? 'Active' : 'Stopped'}</div>
                    <div>Silence Timeout: {silenceTimeout}ms</div>
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


export default function LiveV2Page() {
  return <LiveV2Content />;
}
