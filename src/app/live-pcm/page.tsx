'use client';

import { useState, useRef, useEffect } from 'react';
import { PCMRecorder } from '@/lib/pcm-recorder';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Mic, MicOff, Activity, Download } from 'lucide-react';

export default function LivePCMPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [bufferStatus, setBufferStatus] = useState({ available: 0, percentage: 0, duration: 0 });
  const [playbackDelay, setPlaybackDelay] = useState(5); // 5 seconds default
  const recorderRef = useRef<PCMRecorder | null>(null);
  const statusIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      console.log('[Live PCM] Starting...');

      const recorder = new PCMRecorder({
        sampleRate: 48000,
        bufferDuration: 10,
        playbackDelay: playbackDelay,
        playbackEnabled: true,
        saveRecording: true,
        audioThreshold: 5, // 5% threshold for voice detection
        onVoiceDetected: () => setVoiceActive(true),
        onSilenceDetected: () => setVoiceActive(false),
      });

      await recorder.start();
      recorderRef.current = recorder;
      setIsMonitoring(true);

      // Update buffer status every 500ms
      statusIntervalRef.current = window.setInterval(() => {
        if (recorderRef.current) {
          const status = recorderRef.current.getBufferStatus();
          setBufferStatus(status);
        }
      }, 500);

      console.log('[Live PCM] Started successfully');
    } catch (error) {
      console.error('[Live PCM] Failed to start:', error);
      alert('Failed to start PCM recorder. Check console for details.');
    }
  };

  const handleStop = async () => {
    console.log('[Live PCM] Stopping...');

    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }

    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }

    setIsMonitoring(false);
    setVoiceActive(false);
    setBufferStatus({ available: 0, percentage: 0, duration: 0 });

    console.log('[Live PCM] Stopped');
  };

  const handleDownload = () => {
    if (!recorderRef.current) return;

    const blob = recorderRef.current.getRecordedAudio();
    if (!blob) {
      alert('No audio recorded');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcm-recording-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[Live PCM] Downloaded recording');
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Live PCM Recorder (Clean Architecture)
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gapless audio streaming with raw PCM - no encoding artifacts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              PCM Streaming Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Playback Delay Control */}
            {!isMonitoring && (
              <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      Playback Delay
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Delay before audio starts playing back
                    </div>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {playbackDelay}s
                  </div>
                </div>
                <Slider
                  value={String(playbackDelay)}
                  onChange={(e) => setPlaybackDelay(parseFloat(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                  disabled={isMonitoring}
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>0s (instant)</span>
                  <span>10s (max)</span>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-[var(--text-secondary)]">Recording Status</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isMonitoring ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-medium">
                    {isMonitoring ? 'Active' : 'Stopped'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-[var(--text-secondary)]">Voice Detection</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      voiceActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-medium">
                    {voiceActive ? 'Voice Detected' : 'Silence'}
                  </span>
                </div>
              </div>
            </div>

            {/* Buffer Status */}
            {isMonitoring && (
              <div className="space-y-3">
                <div className="text-sm text-[var(--text-secondary)]">Ring Buffer</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Buffered Duration</span>
                    <span className="font-mono">{bufferStatus.duration.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Buffer Fill</span>
                    <span className="font-mono">{bufferStatus.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Available Samples</span>
                    <span className="font-mono">{bufferStatus.available.toLocaleString()}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, bufferStatus.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {!isMonitoring ? (
                <Button onClick={handleStart} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Monitoring
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop Monitoring
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Recording
                  </Button>
                </>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">How This Works:</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>✅ AudioWorklet captures raw PCM samples (no encoding)</li>
                <li>✅ Ring buffer stores continuous audio stream</li>
                <li>✅ Direct playback from buffer (no decode latency)</li>
                <li>✅ No gaps, no cuts, no artifacts</li>
                <li>✅ WAV export available for testing</li>
              </ul>
            </div>

            {/* Test Instructions */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-2">Test This:</h3>
              <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                <li>Click "Start Monitoring"</li>
                <li>Say: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10"</li>
                <li>Listen for: No cuts, no "ni...ne", no "e...ight"</li>
                <li>Download recording to verify quality</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
