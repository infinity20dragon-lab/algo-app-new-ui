"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Map,
  Speaker,
  Flame,
  Heart,
  Bell,
  Settings2,
  Plus,
  Check,
} from "lucide-react";
import { getDevices } from "@/lib/firebase/firestore";
import type { AlgoDevice } from "@/lib/algo/types";

// Zone definitions
const defaultZones = [
  { id: "dorm", name: "Dorm", color: "#6366f1", devices: 2 },
  { id: "common", name: "Common Area", color: "#22c55e", devices: 3 },
  { id: "apparatus", name: "Apparatus Bay", color: "#f59e0b", devices: 4 },
  { id: "office", name: "Office", color: "#ec4899", devices: 1 },
  { id: "kitchen", name: "Kitchen", color: "#14b8a6", devices: 1 },
];

export default function ZonesPage() {
  const [devices, setDevices] = useState<AlgoDevice[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("dorm");
  const [loading, setLoading] = useState(true);

  // Zone routing config (would be stored in database in production)
  const [zoneRouting, setZoneRouting] = useState<Record<string, { fire: boolean; medical: boolean; allCall: boolean }>>({
    dorm: { fire: true, medical: true, allCall: true },
    common: { fire: true, medical: true, allCall: true },
    apparatus: { fire: true, medical: false, allCall: true },
    office: { fire: true, medical: true, allCall: true },
    kitchen: { fire: true, medical: false, allCall: true },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const devicesData = await getDevices();
        setDevices(devicesData);
      } catch (error) {
        console.error("Failed to load devices:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedZoneData = defaultZones.find(z => z.id === selectedZone);
  const routing = zoneRouting[selectedZone] || { fire: true, medical: true, allCall: true };

  const updateRouting = (type: "fire" | "medical" | "allCall", value: boolean) => {
    setZoneRouting(prev => ({
      ...prev,
      [selectedZone]: { ...prev[selectedZone], [type]: value }
    }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Station Zones</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Configure zones and speaker assignments
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Zone
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Floor Plan */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--accent-purple)]/15">
                  <Map className="h-5 w-5 text-[var(--accent-purple)]" />
                </div>
                <div>
                  <CardTitle>Floor Plan</CardTitle>
                  <CardDescription>Click a zone to configure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Interactive Floor Plan */}
              <div className="grid grid-cols-3 gap-3 aspect-[16/9]">
                {defaultZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                      zone.id === "apparatus" ? "row-span-2" : ""
                    } ${
                      selectedZone === zone.id
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-primary)]"
                        : "hover:scale-[1.02]"
                    }`}
                    style={{
                      backgroundColor: `${zone.color}30`,
                      border: `2px solid ${zone.color}`,
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: zone.color }}>
                      {zone.name.toUpperCase()}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] mt-2">
                      {zone.devices} speakers
                    </span>
                    <div className="flex gap-1 mt-2">
                      {zoneRouting[zone.id]?.fire && (
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]" title="Fire" />
                      )}
                      {zoneRouting[zone.id]?.medical && (
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" title="Medical" />
                      )}
                      {zoneRouting[zone.id]?.allCall && (
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]" title="All-Call" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                  <span className="text-[var(--text-muted)]">Fire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-blue)]" />
                  <span className="text-[var(--text-muted)]">Medical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)]" />
                  <span className="text-[var(--text-muted)]">All-Call</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Config Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${selectedZoneData?.color}30` }}
                  >
                    <Settings2 className="h-5 w-5" style={{ color: selectedZoneData?.color }} />
                  </div>
                  <div>
                    <CardTitle>{selectedZoneData?.name || "Zone"}</CardTitle>
                    <CardDescription>Zone configuration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Type Routing */}
                <div className="space-y-4">
                  <Label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                    Call Type Routing
                  </Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg gradient-fire">
                          <Flame className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Fire Alerts</span>
                      </div>
                      <Switch
                        checked={routing.fire}
                        onCheckedChange={(v) => updateRouting("fire", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg gradient-medical">
                          <Heart className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Medical Alerts</span>
                      </div>
                      <Switch
                        checked={routing.medical}
                        onCheckedChange={(v) => updateRouting("medical", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg gradient-all">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">All-Call</span>
                      </div>
                      <Switch
                        checked={routing.allCall}
                        onCheckedChange={(v) => updateRouting("allCall", v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Assigned Devices */}
                <div className="space-y-3">
                  <Label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                    Assigned Devices ({selectedZoneData?.devices || 0})
                  </Label>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {devices.length === 0 ? (
                      <div className="text-center py-4">
                        <Speaker className="mx-auto h-6 w-6 text-[var(--text-muted)] mb-2" />
                        <p className="text-sm text-[var(--text-muted)]">
                          {loading ? "Loading..." : "No devices"}
                        </p>
                      </div>
                    ) : (
                      devices.slice(0, selectedZoneData?.devices || 2).map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                        >
                          <Speaker className="h-4 w-4 text-[var(--text-muted)]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {device.name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{device.ipAddress}</p>
                          </div>
                          <Check className="h-4 w-4 text-[var(--accent-green)]" />
                        </div>
                      ))
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Device
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zone Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {selectedZoneData?.devices || 0}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Speakers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {Object.values(routing).filter(Boolean).length}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Alert Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
