"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Loader2, XCircle, Clock } from "lucide-react";

export type DocStep = {
  type: string;
  label: string;
};

type DocGenTrackerProps = {
  expectedDocs: DocStep[];
  completedDocTypes: string[];
  status: string;
  errorStep?: string | null;
  errorMessage?: string | null;
  /** Map expected doc types to alternative types that also count as complete */
  typeAliases?: Record<string, string[]>;
};

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function DocGenTracker({
  expectedDocs,
  completedDocTypes,
  status,
  errorMessage,
  typeAliases,
}: DocGenTrackerProps) {
  const [elapsed, setElapsed] = useState(0);
  const mountTime = useRef(Date.now());
  const processingStarted = useRef(false);

  const isProcessing =
    status === "GENERATING_DOCS" || status === "COMPLIANCE_REVIEW";
  const isError = status === "ERROR";
  const isComplete = status === "COMPLETE" || status === "NEEDS_REVIEW";

  // Reset timer when processing starts for the first time
  useEffect(() => {
    if (isProcessing && !processingStarted.current) {
      processingStarted.current = true;
      mountTime.current = Date.now();
      setElapsed(0);
    }
  }, [isProcessing]);

  // Elapsed timer
  useEffect(() => {
    if (!isProcessing) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);

  const completedSet = new Set(completedDocTypes);

  function isDocCompleted(docType: string): boolean {
    if (completedSet.has(docType)) return true;
    const aliases = typeAliases?.[docType];
    return aliases ? aliases.some((a) => completedSet.has(a)) : false;
  }

  const completedCount = expectedDocs.filter((d) =>
    isDocCompleted(d.type),
  ).length;
  const total = expectedDocs.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Bar color
  const barClass = isError
    ? "from-red-500 via-red-400 to-rose-500"
    : isComplete
      ? "from-emerald-500 via-emerald-400 to-green-500"
      : "from-blue-500 via-blue-400 to-indigo-500";
  const glowClass = isError
    ? "shadow-red-500/20"
    : isComplete
      ? "shadow-emerald-500/20"
      : "shadow-blue-500/20";

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessing && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {isComplete && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
            {isError && <XCircle className="h-4 w-4 text-destructive" />}
            <span className="text-sm font-medium">
              {isProcessing
                ? "Preparing your documents..."
                : isComplete
                  ? "Your documents are ready"
                  : isError
                    ? "Something went wrong"
                    : "Processing..."}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isProcessing && (
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3" />
                {formatElapsed(elapsed)}
              </span>
            )}
            <span className="tabular-nums font-semibold text-foreground">
              {percent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Document generation progress"
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barClass} transition-all duration-700 ease-out ${
              percent > 0 ? `shadow-md ${glowClass}` : ""
            } ${isProcessing && percent > 0 ? "animate-subtle-pulse" : ""}`}
            style={{ width: `${percent}%` }}
          />
          {/* Shimmer overlay */}
          {isProcessing && percent > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
              style={{ width: `${percent}%` }}
            >
              <div className="h-full w-full animate-shimmer" />
            </div>
          )}
        </div>
      </div>

      {/* Error detail */}
      {isError && errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
          <p className="text-xs text-destructive">
            <span className="font-medium">Error:</span> {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
