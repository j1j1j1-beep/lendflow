"use client";

import { useEffect, useState, useRef } from "react";
import { Check, XCircle, Pause, Loader2 } from "lucide-react";

type ProgressTrackerProps = {
  dealId: string;
  status: string;
  errorMessage?: string | null;
  errorStep?: string | null;
  onStatusChange?: (newStatus: string) => void;
};

const STATUS_CONFIG: Record<string, { percent: number; label: string }> = {
  UPLOADED: { percent: 0, label: "Preparing documents..." },
  PROCESSING_OCR: { percent: 10, label: "Running optical character recognition..." },
  CLASSIFYING: { percent: 25, label: "Classifying document types..." },
  EXTRACTING: { percent: 40, label: "Extracting data from documents..." },
  VERIFYING: { percent: 55, label: "Verifying extracted data..." },
  RESOLVING: { percent: 65, label: "Resolving discrepancies..." },
  ANALYZING: { percent: 75, label: "Analyzing financials..." },
  STRUCTURING: { percent: 85, label: "Structuring deal terms..." },
  GENERATING_DOCS: { percent: 92, label: "Generating loan documents (this may take a few minutes)..." },
  GENERATING_MEMO: { percent: 97, label: "Generating credit memo..." },
  COMPLETE: { percent: 100, label: "Analysis complete" },
  NEEDS_REVIEW: { percent: -1, label: "Waiting for your review" },
  NEEDS_TERM_REVIEW: { percent: -1, label: "Waiting for your review" },
  ERROR: { percent: -1, label: "An error occurred" },
};

// Ordered processing steps for step counter display
const PROCESSING_STEPS = [
  "UPLOADED",
  "PROCESSING_OCR",
  "CLASSIFYING",
  "EXTRACTING",
  "VERIFYING",
  "RESOLVING",
  "ANALYZING",
  "STRUCTURING",
  "GENERATING_DOCS",
  "GENERATING_MEMO",
] as const;

const TOTAL_STEPS = PROCESSING_STEPS.length;

function getStepNumber(status: string): number {
  const idx = PROCESSING_STEPS.indexOf(status as typeof PROCESSING_STEPS[number]);
  if (idx === -1) return -1;
  return idx + 1;
}

const TERMINAL_STATUSES = ["COMPLETE", "ERROR", "NEEDS_REVIEW", "NEEDS_TERM_REVIEW"];

function resolvePercent(status: string, lastProcessingPercent: number): number {
  const config = STATUS_CONFIG[status];
  if (!config) return lastProcessingPercent || 0;
  if (config.percent === -1) return lastProcessingPercent;
  return config.percent;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s elapsed`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s elapsed`;
}

export function ProgressTracker({
  dealId,
  status: initialStatus,
  errorMessage: initialErrorMessage,
  errorStep: initialErrorStep,
  onStatusChange,
}: ProgressTrackerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);
  const [errorStep, setErrorStep] = useState(initialErrorStep);
  const [elapsed, setElapsed] = useState(0);
  const lastProcessingPercent = useRef(0);
  const mountTime = useRef(Date.now());

  // Refs to avoid stale closures in poll interval (no interval recreation on callback change)
  const statusRef = useRef(status);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  // Track last processing percent in effect, not during render (safe for concurrent mode)
  useEffect(() => {
    const cfg = STATUS_CONFIG[status];
    if (cfg && cfg.percent > 0) {
      lastProcessingPercent.current = cfg.percent;
    }
  }, [status]);

  const config = STATUS_CONFIG[status] ?? { percent: 0, label: "Processing..." };
  const percent = resolvePercent(status, lastProcessingPercent.current);
  const label = config.label;

  const isComplete = status === "COMPLETE";
  const isError = status === "ERROR";
  const isReview = status === "NEEDS_REVIEW" || status === "NEEDS_TERM_REVIEW";
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isProcessing = !isTerminal;

  // Polling — uses refs to avoid stale closures; interval only recreates on dealId/terminal change
  useEffect(() => {
    if (isTerminal) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}`);
        if (!res.ok) return;
        const data = await res.json();
        const newStatus = data.deal?.status ?? data.status;
        setStatus(newStatus);
        setErrorMessage(data.deal?.errorMessage ?? data.errorMessage);
        setErrorStep(data.deal?.errorStep ?? data.errorStep);
        if (newStatus !== statusRef.current) {
          onStatusChangeRef.current?.(newStatus);
        }
      } catch {
        // Silently handle polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [dealId, isTerminal]);

  // Elapsed timer — stops on all terminal statuses
  useEffect(() => {
    if (isTerminal) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTerminal]);

  // Bar color classes
  let barGradient = "from-blue-500 via-blue-400 to-indigo-500";
  let glowColor = "shadow-blue-500/25";
  let textColor = "text-blue-600 dark:text-blue-400";
  const bgTrack = "bg-muted";

  if (isComplete) {
    barGradient = "from-emerald-500 via-emerald-400 to-green-500";
    glowColor = "shadow-emerald-500/25";
    textColor = "text-emerald-600 dark:text-emerald-400";
  } else if (isError) {
    barGradient = "from-red-500 via-red-400 to-rose-500";
    glowColor = "shadow-red-500/25";
    textColor = "text-destructive";
  } else if (isReview) {
    barGradient = "from-amber-500 via-yellow-400 to-amber-500";
    glowColor = "shadow-amber-500/25";
    textColor = "text-amber-600 dark:text-amber-400";
  }

  return (
    <div className="w-full space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isProcessing && (
            <Loader2 className={`h-4 w-4 animate-spin ${textColor}`} />
          )}
          {isComplete && (
            <Check className={`h-4 w-4 ${textColor}`} />
          )}
          {isError && (
            <XCircle className={`h-4 w-4 ${textColor}`} />
          )}
          {isReview && (
            <Pause className={`h-4 w-4 ${textColor}`} />
          )}
          <span className={`text-sm font-medium ${textColor}`} aria-live="polite">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatElapsed(elapsed)}
          </span>
          <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
            {percent}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={`relative h-3 w-full rounded-full overflow-hidden ${bgTrack}`}
      >
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full
            bg-gradient-to-r ${barGradient}
            transition-all duration-700 ease-out
            ${percent > 0 ? `shadow-lg ${glowColor}` : ""}
            ${isProcessing && percent > 0 ? "animate-subtle-pulse" : ""}
          `}
          style={{ width: `${percent}%` }}
        />
        {/* Shimmer overlay on active bars */}
        {isProcessing && percent > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
            style={{ width: `${percent}%` }}
          >
            <div className="h-full w-full animate-shimmer" />
          </div>
        )}
      </div>

      {/* Step counter */}
      {(() => {
        const stepNum = getStepNumber(status);
        if (stepNum > 0) {
          const shortLabel = label.replace(/\.\.\.$/, "").replace(/ \(this may take a few minutes\)/, "");
          return (
            <p className="text-xs text-muted-foreground">
              Step <span className="tabular-nums">{stepNum}</span> of{" "}
              <span className="tabular-nums">{TOTAL_STEPS}</span>
              <span className="mx-1.5 opacity-50">&mdash;</span>
              {shortLabel}
            </p>
          );
        }
        if (isComplete) {
          return (
            <p className="text-xs text-muted-foreground">
              All <span className="tabular-nums">{TOTAL_STEPS}</span> steps completed
            </p>
          );
        }
        return null;
      })()}

      {/* Error detail */}
      {isError && errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            <span className="font-medium">Error:</span> {errorMessage}
            {errorStep && (
              <span className="ml-1 opacity-75">(Step: {errorStep})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
