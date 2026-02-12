"use client";

import { Building, Lock } from "lucide-react";

export default function SyndicationPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Syndication</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate complete real estate syndication packages — syndication PPMs, operating agreements, subscription documents, waterfall structures, and property-specific disclosures. Verified against SEC and state securities requirements.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Building className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Real estate syndication PPMs, GP/LP operating agreements, investor subscription packages, and waterfall distribution documents — ready for your next deal.
        </p>
      </div>
    </div>
  );
}
