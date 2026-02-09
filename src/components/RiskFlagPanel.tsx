"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

type RiskFlag = {
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  title: string;
  description: string;
  recommendation?: string;
};

type RiskFlagPanelProps = {
  flags: RiskFlag[];
  riskScore: number;
};

const SEVERITY_CONFIG: Record<
  string,
  { label: string; dotClass: string; borderClass: string }
> = {
  HIGH: {
    label: "High",
    dotClass: "bg-destructive",
    borderClass: "border-destructive/30",
  },
  MEDIUM: {
    label: "Medium",
    dotClass: "bg-chart-4",
    borderClass: "border-chart-4/30",
  },
  LOW: {
    label: "Low",
    dotClass: "bg-chart-1",
    borderClass: "border-chart-1/30",
  },
};

const SEVERITY_ORDER: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function RiskFlagPanel({ flags, riskScore }: RiskFlagPanelProps) {
  const sortedFlags = [...flags].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Overall Risk Score</p>
            <span
              className={`text-3xl font-semibold tracking-tight ${
                riskScore <= 30
                  ? "text-chart-2"
                  : riskScore <= 60
                    ? "text-chart-4"
                    : "text-destructive"
              }`}
            >
              {riskScore.toFixed(0)}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(riskScore, 100)}%`,
                background: `linear-gradient(90deg, hsl(var(--chart-2)), hsl(var(--chart-4)) 50%, hsl(var(--destructive)) 100%)`,
                backgroundSize: `${(100 / Math.min(riskScore || 1, 100)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0 - Low</span>
            <span>50 - Moderate</span>
            <span>100 - High</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Risk Flags</span>
            <span className="text-sm font-normal text-muted-foreground">
              {flags.length} flag{flags.length !== 1 ? "s" : ""} identified
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedFlags.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">No risk flags identified</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFlags.map((flag, index) => {
                const config = SEVERITY_CONFIG[flag.severity] ?? {
                  label: flag.severity,
                  dotClass: "bg-muted-foreground",
                  borderClass: "border-border",
                };
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-sm ${config.borderClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${config.dotClass}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{flag.title}</h4>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {flag.description}
                        </p>
                        {flag.recommendation && (
                          <p className="text-sm text-muted-foreground/80 italic mt-2">
                            Recommendation: {flag.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
