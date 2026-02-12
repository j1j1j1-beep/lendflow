"use client";

import { Building2, Lock } from "lucide-react";

export default function CapitalPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Capital</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate complete fund formation and private placement packages — PPMs, subscription agreements, operating agreements, SPV docs, and Form D filings. All verified against SEC Regulation D and state blue sky requirements.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          506(b) and 506(c) offerings, fund formation documents, SPV creation, and investor subscription packages — generated in minutes instead of weeks.
        </p>
      </div>
    </div>
  );
}
