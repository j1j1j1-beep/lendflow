"use client";

import { ShieldCheck, Lock } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate investor reports, compliance filings, and fund administration documents — LP quarterly reports, capital call notices, distribution notices, K-1 prep, Form ADV, and AML/KYC documentation.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Quarterly LP reports, capital call and distribution notices, K-1 preparation, Form ADV filings, and AML/KYC compliance packages — automated every quarter.
        </p>
      </div>
    </div>
  );
}
