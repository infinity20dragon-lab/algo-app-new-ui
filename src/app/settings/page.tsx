"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Settings2, User, Info, Shield, Volume2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-[var(--text-secondary)] text-sm">Configure your AlgoSound system</p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/15">
                <User className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.uid || ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-purple)]/15">
                <Settings2 className="h-5 w-5 text-[var(--accent-purple)]" />
              </div>
              <div>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>
                  Default values for new devices and distributions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPassword" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--text-muted)]" />
                Default API Password
              </Label>
              <Input
                id="defaultPassword"
                type="password"
                defaultValue="algo"
                placeholder="algo"
              />
              <p className="text-sm text-[var(--text-muted)]">
                Used as the default password when adding new devices
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultVolume" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-[var(--text-muted)]" />
                Default Volume
              </Label>
              <Input
                id="defaultVolume"
                type="number"
                min={0}
                max={100}
                defaultValue={50}
              />
              <p className="text-sm text-[var(--text-muted)]">
                Default volume level for new distributions (0-100)
              </p>
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-green)]/15">
                <Info className="h-5 w-5 text-[var(--accent-green)]" />
              </div>
              <CardTitle>About AlgoSound</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Version</p>
                <p className="text-[var(--text-primary)] font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Build</p>
                <p className="text-[var(--text-primary)] font-medium">Production</p>
              </div>
            </div>
            <div className="space-y-2 text-[var(--text-secondary)]">
              <p>
                <strong className="text-[var(--text-primary)]">Purpose:</strong> Sound distribution system for Algo IP endpoints
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Supported Devices:</strong> 8301 Paging Adapter, 8180G2 Speaker, 8198 Ceiling Speaker, and more
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20">
              <p className="text-[var(--text-secondary)]">
                Built for <strong className="text-[var(--accent-red)]">fire station alerting systems</strong> to ensure every call reaches all areas of the station.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
