"use client";

import { Handshake, Lock } from "lucide-react";

export default function DealsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate M&A transaction documents — LOIs, purchase agreements, due diligence reports, disclosure schedules, and closing packages. Verified against current HSR thresholds and market-standard terms.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Handshake className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Letters of intent, stock and asset purchase agreements, due diligence checklists, and complete closing document packages — from term sheet to signed deal.
        </p>
      </div>
    </div>
  );
}
