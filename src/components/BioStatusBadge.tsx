"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; pulse?: boolean }
> = {
  CREATED: { label: "Created", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  UPLOADING: { label: "Uploading", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  EXTRACTING: { label: "Extracting", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  CLASSIFYING: { label: "Classifying", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  VERIFYING: { label: "Verifying", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  ANALYZING: { label: "Analyzing", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  GENERATING_DOCS: { label: "Generating Docs", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  COMPLIANCE_REVIEW: { label: "Compliance Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", pulse: true },
  NEEDS_REVIEW: { label: "Needs Review", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  COMPLETE: { label: "Complete", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  ERROR: { label: "Error", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function BioStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Badge
      variant="secondary"
      className={`${config.color} border-0 text-[11px] font-medium`}
    >
      {config.pulse && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
      )}
      {config.label}
    </Badge>
  );
}
