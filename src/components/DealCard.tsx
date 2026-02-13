"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar } from "lucide-react";

type DealCardProps = {
  deal: {
    id: string;
    borrowerName: string;
    loanAmount: string | null;
    loanType: string | null;
    status: string;
    createdAt: string;
    _count: { documents: number };
  };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  UPLOADED: { label: "Uploaded", variant: "secondary" },
  PROCESSING_OCR: { label: "OCR Processing", variant: "secondary" },
  CLASSIFYING: { label: "Classifying", variant: "secondary" },
  EXTRACTING: { label: "Extracting", variant: "secondary" },
  VERIFYING: { label: "Verifying", variant: "secondary" },
  RESOLVING: { label: "Resolving", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  NEEDS_TERM_REVIEW: { label: "Terms Review", variant: "outline" },
  ANALYZING: { label: "Analyzing", variant: "secondary" },
  STRUCTURING: { label: "Structuring", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating Docs", variant: "secondary" },
  GENERATING_MEMO: { label: "Generating Memo", variant: "secondary" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const PROCESSING_STATUSES = [
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
];

function formatCurrency(value: string | null): string {
  if (!value) return "--";
  const num = parseFloat(value);
  if (isNaN(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// M12: Standardized short date format (e.g., "Feb 12, 2026")
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLoanType(loanType: string | null): string {
  if (!loanType) return "";
  const map: Record<string, string> = {
    conventional: "Conventional",
    "sba-7a": "SBA 7(a)",
    "sba-504": "SBA 504",
    commercial: "Commercial",
    residential: "Residential",
  };
  return map[loanType] ?? loanType;
}

export function DealCard({ deal }: DealCardProps) {
  const statusConfig = STATUS_CONFIG[deal.status] ?? {
    label: deal.status,
    variant: "outline" as const,
  };

  const isProcessing = PROCESSING_STATUSES.includes(deal.status);

  return (
    <Card className="group transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 active:translate-y-0 active:shadow-sm cursor-pointer h-full">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-150" title={deal.borrowerName}>
              {deal.borrowerName}
            </h3>
            {deal.loanType && (
              <p className="text-xs text-muted-foreground mt-0.5" title={formatLoanType(deal.loanType)}>
                {formatLoanType(deal.loanType)}
              </p>
            )}
          </div>
          <Badge
            variant={statusConfig.variant}
            className="shrink-0 ml-2 text-[11px]"
          >
            {isProcessing && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
            )}
            {statusConfig.label}
          </Badge>
        </div>

        <p className="text-xl font-semibold tracking-tight mb-4 tabular-nums">
          {formatCurrency(deal.loanAmount)}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {deal._count.documents} doc{deal._count.documents !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(deal.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
