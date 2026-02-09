"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Shield,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProgressTracker } from "@/components/ProgressTracker";
import { AnalysisResults } from "@/components/AnalysisResults";
import { RiskFlagPanel } from "@/components/RiskFlagPanel";
import { MemoDownload } from "@/components/MemoDownload";
import { DocumentPreview } from "@/components/DocumentPreview";

type Document = {
  id: string;
  fileName: string;
  docType: string | null;
  docYear: number | null;
  status: string;
  fileSize: number;
};

type IncomeSource = {
  source: string;
  type: string;
  amount: number;
  year?: number;
};

type LargeDeposit = {
  date: string;
  amount: number;
  description?: string;
};

type RiskFlag = {
  severity: string;
  title: string;
  description: string;
  recommendation?: string;
};

type Analysis = {
  globalDscr: number | null;
  propertyDscr: number | null;
  frontEndDti: number | null;
  backEndDti: number | null;
  monthsOfReserves: number | null;
  riskScore: number;
  totalGrossIncome: string | null;
  totalNetIncome: string | null;
  incomeTrend: string | null;
  incomeSources: IncomeSource[];
  avgDailyBalance: string | null;
  avgMonthlyDeposits: string | null;
  depositVsIncome: number | null;
  nsfCount: number | null;
  largeDeposits: LargeDeposit[] | null;
  revenueByYear: Record<string, number> | null;
  expenseRatio: number | null;
  ownerComp: string | null;
  addBacks: Record<string, number> | null;
  riskFlags: RiskFlag[];
  ltv: number | null;
  fullResults: unknown;
};

type DealTerms = {
  approvedAmount: string;
  interestRate: number;
  termMonths: number;
  amortizationMonths: number;
  ltv: number | null;
  monthlyPayment: string;
  baseRateType: string;
  baseRateValue: number;
  spread: number;
  interestOnly: boolean;
  prepaymentPenalty: boolean;
  personalGuaranty: boolean;
  requiresAppraisal: boolean;
  covenants: Array<{ name: string; description: string; frequency: string; source: string }>;
  conditions: Array<{ category: string; description: string; source: string; priority: string }>;
  specialTerms: string[] | null;
  justification: string | null;
  complianceStatus: string;
  complianceIssues: Array<{ severity: string; regulation: string; description: string; recommendation: string }> | null;
  fees: Array<{ name: string; amount: number; description: string }>;
  status: string;
};

type Condition = {
  id: string;
  category: string;
  description: string;
  source: string;
  priority: string;
  status: string;
};

type GeneratedDocument = {
  id: string;
  docType: string;
  s3Key: string;
  version: number;
  status: string;
  legalReviewStatus: string | null;
  legalIssues: Array<{ severity: string; section: string; description: string; recommendation: string }> | null;
  verificationStatus: string | null;
  verificationIssues: Array<{ field: string; expected: string; found: string; severity: string }> | null;
  complianceChecks: Array<{
    name: string;
    regulation: string;
    category: "required" | "standard" | "regulatory" | "cross_document";
    passed: boolean;
    note?: string;
  }> | null;
  downloadUrl: string | null;
  createdAt: string;
};

const GEN_DOC_TYPE_LABELS: Record<string, string> = {
  promissory_note: "Promissory Note",
  loan_agreement: "Loan Agreement",
  security_agreement: "Security Agreement",
  guaranty: "Guaranty Agreement",
  commitment_letter: "Commitment Letter",
  environmental_indemnity: "Environmental Indemnity",
  assignment_of_leases: "Assignment of Leases & Rents",
  subordination_agreement: "Subordination Agreement",
  intercreditor_agreement: "Intercreditor Agreement",
  corporate_resolution: "Corporate Borrowing Resolution",
  ucc_financing_statement: "UCC Financing Statement",
  deed_of_trust: "Deed of Trust",
  closing_disclosure: "Closing Disclosure",
  loan_estimate: "Loan Estimate",
  sba_authorization: "SBA Authorization",
  cdc_debenture: "CDC/504 Debenture",
  borrowing_base_agreement: "Borrowing Base Agreement",
  digital_asset_pledge: "Digital Asset Pledge",
  custody_agreement: "Custody Agreement",
  snda: "SNDA Agreement",
  estoppel_certificate: "Tenant Estoppel Certificate",
  settlement_statement: "Settlement Statement",
  borrowers_certificate: "Borrower's Certificate",
  compliance_certificate: "Compliance Certificate",
  amortization_schedule: "Amortization Schedule",
  opinion_letter: "Legal Opinion Letter",
};

type Deal = {
  id: string;
  borrowerName: string;
  loanAmount: string | null;
  loanPurpose: string | null;
  loanType: string | null;
  propertyAddress: string | null;
  proposedRate: number | null;
  proposedTerm: number | null;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  createdAt: string;
  documents: Document[];
  analysis: Analysis | null;
  reviewItems?: { id: string; status: string }[];
  dealTerms: DealTerms | null;
  conditions: Condition[];
  generatedDocuments: GeneratedDocument[];
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

const DOC_TYPE_LABELS: Record<string, string> = {
  FORM_1040: "1040",
  FORM_1120: "1120",
  FORM_1120S: "1120S",
  FORM_1065: "1065",
  SCHEDULE_K1: "K-1",
  W2: "W-2",
  BANK_STATEMENT_CHECKING: "Bank (Checking)",
  BANK_STATEMENT_SAVINGS: "Bank (Savings)",
  PROFIT_AND_LOSS: "P&L",
  BALANCE_SHEET: "Balance Sheet",
  RENT_ROLL: "Rent Roll",
  OTHER: "Other",
};

function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value.toFixed(1)}%`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function DocumentComplianceCard({ doc, onPreview }: {
  doc: GeneratedDocument;
  onPreview: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const checks = doc.complianceChecks ?? [];
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const hasChecks = totalCount > 0;

  // Group checks by category
  const grouped = {
    required: checks.filter(c => c.category === "required"),
    standard: checks.filter(c => c.category === "standard"),
    regulatory: checks.filter(c => c.category === "regulatory"),
    cross_document: checks.filter(c => c.category === "cross_document"),
  };

  const categoryLabels: Record<string, string> = {
    required: "Required Provisions",
    standard: "Standard Provisions",
    regulatory: "Regulatory Compliance",
    cross_document: "Cross-Document Consistency",
  };

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="pt-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{GEN_DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={doc.status === "REVIEWED" ? "default" : doc.status === "FLAGGED" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {doc.status === "REVIEWED" ? "Passed" : doc.status === "FLAGGED" ? "Review Required" : doc.status}
                </Badge>
                {hasChecks && (
                  <span className={`text-xs font-medium ${passedCount === totalCount ? "text-primary" : "text-destructive"}`}>
                    {passedCount}/{totalCount} checks passed
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {doc.downloadUrl && (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onPreview}>
                  <Eye className="h-4 w-4" />
                </Button>
                <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </>
            )}
            {hasChecks && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Compliance
              </Button>
            )}
          </div>
        </div>

        {/* Expandable compliance checklist */}
        {expanded && hasChecks && (
          <div className="mt-4 border-t pt-4 space-y-4">
            {(Object.entries(grouped) as [string, typeof checks][]).map(([cat, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {categoryLabels[cat] ?? cat}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((check, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {check.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className={check.passed ? "" : "text-destructive font-medium"}>
                            {check.name}
                          </span>
                          {check.regulation && check.regulation !== "Commercial Lending Standards" && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              ({check.regulation})
                            </span>
                          )}
                          {check.note && !check.passed && (
                            <p className="text-xs text-muted-foreground mt-0.5">{check.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Legal review issues (if any) */}
            {doc.legalIssues && doc.legalIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Compliance Notes
                </p>
                <div className="space-y-2">
                  {doc.legalIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm rounded-md border p-2.5 bg-muted/30">
                      <Badge
                        variant={issue.severity === "critical" ? "destructive" : issue.severity === "warning" ? "outline" : "secondary"}
                        className="text-[10px] flex-shrink-0 mt-0.5"
                      >
                        {issue.severity === "critical" ? "auto-resolved" : issue.severity === "warning" ? "note" : "info"}
                      </Badge>
                      <div>
                        <p>{issue.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ id: string; name: string; directUrl?: string } | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) throw new Error("Failed to load deal");
      const { deal } = await res.json();
      setDeal(deal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deal");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const handleStatusChange = useCallback(() => {
    fetchDeal();
  }, [fetchDeal]);

  const handleDeleteDeal = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete deal");
      }
      toast.success("Deal permanently deleted.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete deal");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Deal not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessing = PROCESSING_STATUSES.includes(deal.status);
  const isComplete = deal.status === "COMPLETE";
  const needsReview = deal.status === "NEEDS_REVIEW";
  const hasAnalysis = deal.analysis !== null;

  const monthlyDeposits: { label: string; value: number }[] = [];
  if (deal.analysis?.fullResults && typeof deal.analysis.fullResults === "object") {
    const fr = deal.analysis.fullResults as Record<string, unknown>;
    if (fr.monthlyDeposits && Array.isArray(fr.monthlyDeposits)) {
      for (const entry of fr.monthlyDeposits as { month: string; amount: number }[]) {
        monthlyDeposits.push({ label: entry.month, value: entry.amount });
      }
    }
  }
  const maxDeposit = monthlyDeposits.length > 0 ? Math.max(...monthlyDeposits.map((d) => d.value)) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Deals
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {deal.borrowerName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {deal.loanAmount && (
              <span className="text-lg font-semibold">
                {formatCurrency(deal.loanAmount)}
              </span>
            )}
            <Badge variant={
              deal.status === "COMPLETE" ? "default" :
              deal.status === "ERROR" ? "destructive" :
              deal.status === "NEEDS_REVIEW" || deal.status === "NEEDS_TERM_REVIEW" ? "outline" :
              "secondary"
            }>
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {deal.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <MemoDownload dealId={dealId} />}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently delete this deal?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    This will permanently delete <strong>{deal.borrowerName}</strong> and all associated data including:
                  </span>
                  <span className="block text-destructive font-medium">
                    All uploaded documents, extracted data, analysis results, deal terms, generated loan documents, and compliance reviews.
                  </span>
                  <span className="block font-semibold">
                    This action cannot be undone. Are you sure you want to proceed?
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteDeal}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress Tracker — shown during processing and briefly after completion */}
      {(isProcessing || isComplete) && (
        <Card className="mb-6">
          <CardContent className="pt-0">
            <ProgressTracker
              dealId={dealId}
              status={deal.status}
              errorMessage={deal.errorMessage}
              errorStep={deal.errorStep}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Needs Review Alert */}
      {needsReview && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Verification Review Required</AlertTitle>
          <AlertDescription>
            Some values in the uploaded documents need your confirmation before the analysis can continue.
            <Link
              href={`/dashboard/deals/${dealId}/review`}
              className="ml-2 font-medium underline"
            >
              Review Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Needs Term Review Alert */}
      {deal.status === "NEEDS_TERM_REVIEW" && (
        <Alert className="mb-6">
          <FileText className="h-4 w-4" />
          <AlertTitle>Deal Terms Need Review</AlertTitle>
          <AlertDescription>
            The structuring engine flagged compliance issues or warnings that require your review.
            Review the Deal Terms tab below and approve to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {deal.status === "ERROR" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Pipeline Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {deal.errorMessage || "An error occurred during processing."}
              {deal.errorStep && (
                <span className="ml-1 text-xs opacity-75">(Step: {deal.errorStep})</span>
              )}
            </span>
            <Button
              variant="default"
              size="sm"
              disabled={retrying}
              className="shrink-0 gap-1.5"
              onClick={async () => {
                setRetrying(true);
                setRetryError(null);
                try {
                  const res = await fetch(`/api/deals/${dealId}/retry`, { method: "POST" });
                  if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || "Failed to retry");
                  }
                  fetchDeal();
                } catch (err) {
                  setRetryError(err instanceof Error ? err.message : "Failed to retry. Please try again.");
                } finally {
                  setRetrying(false);
                }
              }}
            >
              {retrying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Analysis
                </>
              )}
            </Button>
          </AlertDescription>
          {retryError && (
            <p className="text-sm mt-2 text-destructive-foreground/80">{retryError}</p>
          )}
        </Alert>
      )}

      {/* Analysis Content */}
      {(isComplete || hasAnalysis) && deal.analysis && (
        <Tabs defaultValue={deal.status === "NEEDS_TERM_REVIEW" && deal.dealTerms ? "terms" : "overview"} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            {deal.dealTerms && <TabsTrigger value="terms">Deal Terms</TabsTrigger>}
            {deal.generatedDocuments.length > 0 && (
              <TabsTrigger value="generated-docs">Loan Documents</TabsTrigger>
            )}
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <AnalysisResults analysis={deal.analysis} />
          </TabsContent>

          {/* INCOME TAB */}
          <TabsContent value="income">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Income Sources</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {Array.isArray(deal.analysis.incomeSources) && deal.analysis.incomeSources.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(deal.analysis.incomeSources as IncomeSource[]).map((source, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{source.source}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{source.type}</Badge>
                            </TableCell>
                            <TableCell>{source.year ?? "--"}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(source.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No income sources extracted</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Gross Income", value: formatCurrency(deal.analysis.totalGrossIncome) },
                  { label: "Total Net Income", value: formatCurrency(deal.analysis.totalNetIncome) },
                  { label: "Income Trend", value: deal.analysis.incomeTrend ?? "--", capitalize: true },
                ].map((stat) => (
                  <Card key={stat.label} className="card-hover">
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <p className={`text-2xl font-semibold tracking-tight mt-1 tabular-nums ${stat.capitalize ? "capitalize" : ""}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {deal.analysis.revenueByYear && typeof deal.analysis.revenueByYear === "object" && (
                <Card>
                  <CardHeader><CardTitle>Business Revenue by Year</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(deal.analysis.revenueByYear as Record<string, number>).map(([year, amount]) => (
                        <div key={year} className="rounded-lg border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
                          <p className="text-xs text-muted-foreground font-medium">{year}</p>
                          <p className="text-lg font-semibold tracking-tight mt-0.5 tabular-nums">{formatCurrency(amount)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {deal.analysis.addBacks && typeof deal.analysis.addBacks === "object" && (
                <Card>
                  <CardHeader><CardTitle>Add-Backs</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(deal.analysis.addBacks as Record<string, number>).map(([item, amount]) => (
                          <TableRow key={item}>
                            <TableCell className="font-medium capitalize">{item.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* CASH FLOW TAB */}
          <TabsContent value="cashflow">
            <div className="space-y-6">
              {monthlyDeposits.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Monthly Deposits</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-end gap-2 h-48">
                      {monthlyDeposits.map((d) => (
                        <div key={d.label} className="group/bar flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-medium tabular-nums opacity-70 transition-opacity duration-150 group-hover/bar:opacity-100">{formatCurrency(d.value)}</span>
                          <div
                            className="w-full bg-primary rounded-t-sm min-h-[4px] transition-all duration-500 ease-out group-hover/bar:bg-primary/80 group-hover/bar:shadow-sm group-hover/bar:shadow-primary/20"
                            style={{ height: `${maxDeposit > 0 ? (d.value / maxDeposit) * 160 : 4}px` }}
                          />
                          <span className="text-[10px] text-muted-foreground">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Avg Monthly Deposits", value: formatCurrency(deal.analysis.avgMonthlyDeposits) },
                  { label: "Avg Daily Balance", value: formatCurrency(deal.analysis.avgDailyBalance) },
                  { label: "Deposit vs Income", value: formatPercent(deal.analysis.depositVsIncome) },
                  { label: "NSF / Overdrafts", value: String(deal.analysis.nsfCount ?? 0), highlight: (deal.analysis.nsfCount ?? 0) > 0 },
                ].map((stat) => (
                  <Card key={stat.label} className="card-hover">
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <p className={`text-xl font-semibold tracking-tight mt-1 tabular-nums ${stat.highlight ? "text-destructive" : ""}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {Array.isArray(deal.analysis.largeDeposits) && deal.analysis.largeDeposits.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Large Deposits</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(deal.analysis.largeDeposits as LargeDeposit[]).map((dep, i) => (
                          <TableRow key={i}>
                            <TableCell>{dep.date}</TableCell>
                            <TableCell>{dep.description || "--"}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(dep.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* RISK TAB */}
          <TabsContent value="risk">
            <RiskFlagPanel
              flags={Array.isArray(deal.analysis.riskFlags) ? (deal.analysis.riskFlags as RiskFlag[]) : []}
              riskScore={deal.analysis.riskScore}
            />
          </TabsContent>

          {/* DEAL TERMS TAB */}
          {deal.dealTerms && (
            <TabsContent value="terms">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Approved Amount", value: formatCurrency(deal.dealTerms.approvedAmount) },
                    { label: "Interest Rate", value: `${(deal.dealTerms.interestRate * 100).toFixed(3)}%` },
                    { label: "Term", value: `${deal.dealTerms.termMonths} mo`, sub: deal.dealTerms.amortizationMonths !== deal.dealTerms.termMonths ? `${deal.dealTerms.amortizationMonths} mo amort` : undefined },
                    { label: "Monthly Payment", value: formatCurrency(deal.dealTerms.monthlyPayment), badge: deal.dealTerms.interestOnly ? "IO" : undefined },
                    { label: "LTV", value: deal.dealTerms.ltv !== null ? `${(deal.dealTerms.ltv * 100).toFixed(1)}%` : "N/A" },
                  ].map((metric) => (
                    <Card key={metric.label} className="card-hover">
                      <CardContent className="pt-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{metric.label}</p>
                        <p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">{metric.value}</p>
                        {metric.sub && <p className="text-xs text-muted-foreground mt-0.5">{metric.sub}</p>}
                        {metric.badge && <Badge variant="secondary" className="text-xs mt-1">{metric.badge}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader><CardTitle>Rate Breakdown</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium">Base Rate</p>
                        <p className="text-lg font-semibold tracking-tight mt-0.5 tabular-nums">{(deal.dealTerms.baseRateValue * 100).toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase">{deal.dealTerms.baseRateType}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium">Spread</p>
                        <p className="text-lg font-semibold tracking-tight mt-0.5 tabular-nums">+{(deal.dealTerms.spread * 100).toFixed(3)}%</p>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-primary/10">
                        <p className="text-xs text-primary font-medium">Total Rate</p>
                        <p className="text-lg font-semibold tracking-tight mt-0.5 tabular-nums">{(deal.dealTerms.interestRate * 100).toFixed(3)}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {deal.dealTerms.prepaymentPenalty && <Badge variant="outline" className="text-xs">Prepayment Penalty</Badge>}
                      {deal.dealTerms.personalGuaranty && <Badge variant="outline" className="text-xs">Personal Guaranty</Badge>}
                      {deal.dealTerms.requiresAppraisal && <Badge variant="outline" className="text-xs">Appraisal Required</Badge>}
                    </div>
                  </CardContent>
                </Card>

                {deal.dealTerms.complianceIssues && deal.dealTerms.complianceIssues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Compliance Issues
                        <Badge variant={deal.dealTerms.complianceStatus?.toLowerCase() === "compliant" ? "default" : "destructive"}>
                          {deal.dealTerms.complianceStatus}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {deal.dealTerms.complianceIssues.map((issue, i) => (
                          <div key={i} className="py-2 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={issue.severity === "error" ? "destructive" : "outline"} className="text-xs">{issue.severity}</Badge>
                              <span className="text-sm font-medium">{issue.regulation}</span>
                            </div>
                            <p className="text-sm">{issue.description}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{issue.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {deal.dealTerms.covenants.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Covenants</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {deal.dealTerms.covenants.map((cov, i) => (
                          <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{cov.name}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{cov.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">{cov.frequency}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {deal.dealTerms.conditions.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Conditions</CardTitle></CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {(["prior_to_closing", "prior_to_funding", "post_closing"] as const).map((cat) => {
                        const items = deal.dealTerms!.conditions.filter((c) => c.category === cat);
                        if (items.length === 0) return null;
                        return (
                          <div key={cat}>
                            <h4 className="text-sm font-medium mb-2 capitalize">{cat.replace(/_/g, " ")}</h4>
                            <ul className="space-y-1.5">
                              {items.map((cond, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${cond.priority === "required" ? "bg-destructive" : "bg-chart-4"}`} />
                                  <span className="text-xs text-muted-foreground">{cond.priority === "required" ? "(required)" : "(recommended)"}</span>
                                  <span>{cond.description}</span>
                                  {cond.source?.includes("ai") && (
                                    <Badge variant="outline" className="text-[10px] ml-auto flex-shrink-0">Custom</Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {deal.dealTerms.fees.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Fees</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deal.dealTerms.fees.map((fee, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{fee.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{fee.description}</TableCell>
                              <TableCell className="text-right font-mono tabular-nums">{formatCurrency(fee.amount)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-semibold" colSpan={2}>Total Fees</TableCell>
                            <TableCell className="text-right font-mono font-semibold tabular-nums">
                              {formatCurrency(deal.dealTerms.fees.reduce((sum, f) => sum + f.amount, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {deal.dealTerms.specialTerms && deal.dealTerms.specialTerms.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Special Terms</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {deal.dealTerms.specialTerms.map((term, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">&#8226;</span>
                            {term}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {deal.dealTerms.justification && (
                  <Card>
                    <CardHeader><CardTitle>Structuring Justification</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{deal.dealTerms.justification}</p>
                    </CardContent>
                  </Card>
                )}

                {deal.status === "NEEDS_TERM_REVIEW" && (
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      disabled={approving}
                      onClick={async () => {
                        setApproving(true);
                        setApproveError(null);
                        try {
                          const res = await fetch(`/api/deals/${dealId}/approve-terms`, { method: "POST" });
                          if (!res.ok) throw new Error("Failed to approve terms");
                          fetchDeal();
                        } catch {
                          setApproveError("Failed to approve terms. Please try again.");
                        } finally {
                          setApproving(false);
                        }
                      }}
                    >
                      {approving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        "Approve & Continue"
                      )}
                    </Button>
                    {approveError && <p className="text-sm text-destructive">{approveError}</p>}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* GENERATED LOAN DOCUMENTS TAB */}
          {deal.generatedDocuments.length > 0 && (
            <TabsContent value="generated-docs">
              <div className="space-y-4">
                {/* Summary bar */}
                <Card>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Document Package Compliance</p>
                          <p className="text-sm text-muted-foreground">
                            {deal.generatedDocuments.filter(d => d.status === "REVIEWED").length} of {deal.generatedDocuments.length} documents passed all checks
                          </p>
                        </div>
                      </div>
                      <Badge variant={deal.generatedDocuments.every(d => d.status === "REVIEWED") ? "default" : "destructive"}>
                        {deal.generatedDocuments.every(d => d.status === "REVIEWED") ? "All Checks Passed" : "Review Required"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Per-document cards */}
                {deal.generatedDocuments.map((doc) => (
                  <DocumentComplianceCard
                    key={doc.id}
                    doc={doc}
                    onPreview={() => {
                      const label = GEN_DOC_TYPE_LABELS[doc.docType] ?? doc.docType;
                      setPreviewDoc({ id: doc.id, name: `${label}.docx`, directUrl: doc.downloadUrl! });
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle>Uploaded Documents</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="w-16">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deal.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                        <TableCell>
                          {doc.docType ? (
                            <Badge variant="secondary" className="text-xs">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>{doc.docYear ?? "--"}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${
                            doc.status === "VERIFIED" || doc.status === "EXTRACTED" ? "text-primary" :
                            doc.status === "ERROR" ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPreviewDoc({ id: doc.id, name: doc.fileName })}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View {doc.fileName}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Documents when no analysis */}
      {!hasAnalysis && !isProcessing && deal.status !== "ERROR" && !needsReview && (
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {deal.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-16">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deal.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.fileName}</TableCell>
                      <TableCell>
                        {doc.docType ? (
                          <Badge variant="secondary" className="text-xs">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{doc.status}</TableCell>
                      <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewDoc({ id: doc.id, name: doc.fileName })}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View {doc.fileName}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deal Info Footer */}
      <Separator className="my-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {deal.loanType && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">Loan Type</p>
            <p className="capitalize mt-0.5">{deal.loanType}</p>
          </div>
        )}
        {deal.loanPurpose && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">Purpose</p>
            <p className="capitalize mt-0.5">{deal.loanPurpose}</p>
          </div>
        )}
        {deal.proposedRate && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">Proposed Rate</p>
            <p className="mt-0.5">{deal.proposedRate < 1 ? (deal.proposedRate * 100).toFixed(2) : deal.proposedRate}%</p>
          </div>
        )}
        {deal.proposedTerm && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">Term</p>
            <p className="mt-0.5">{deal.proposedTerm} months</p>
          </div>
        )}
        {deal.propertyAddress && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs font-medium">Property Address</p>
            <p className="mt-0.5">{deal.propertyAddress}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-xs font-medium">Created</p>
          <p className="mt-0.5">
            {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Document Preview Modal — always rendered so Dialog exit animation works */}
      <DocumentPreview
        documentId={previewDoc?.id ?? ""}
        fileName={previewDoc?.name ?? ""}
        open={!!previewDoc}
        onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
        directUrl={previewDoc?.directUrl}
      />
    </div>
  );
}
