"use client";

import { AppLayout } from "@/components/layout/app-layout";

export default function DistributePage() {
  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Call Routing</h1>
        <p className="text-[var(--text-secondary)] mt-4">Minimal test page - if this doesn't rebuild infinitely, the issue is in the original page content.</p>
      </div>
    </AppLayout>
  );
}
