"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Calendar,
  DollarSign,
  Shield,
  Users,
  Handshake,
  Clock,
  Scale,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DocGenTracker } from "@/components/DocGenTracker";

/* ---------- Types ---------- */

type MADocument = {
  id: string;
  docType: string;
  s3Key: string;
  version: number;
  status: string;
  complianceStatus: string | null;
  complianceIssues: Array<{
    severity: string;
    rule: string;
    description: string;
    recommendation?: string;
  }> | null;
  downloadUrl: string | null;
  createdAt: string;
};

type MAProject = {
  id: string;
  name: string;
  targetCompany: string;
  transactionType: string;
  buyerName: string;
  sellerName: string;
  purchasePrice: number | string | null;
  cashComponent: number | string | null;
  stockComponent: number | string | null;
  earnoutAmount: number | string | null;
  exclusivityDays: number | null;
  dueDiligenceDays: number | null;
  governingLaw: string | null;
  targetIndustry: string | null;
  nonCompeteYears: number | null;
  escrowPercent: number | null;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  createdAt: string;
  maDocuments: MADocument[];
};

/* ---------- Constants ---------- */

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  STOCK_PURCHASE: "Stock Purchase",
  ASSET_PURCHASE: "Asset Purchase",
  MERGER_FORWARD: "Forward Merger",
  MERGER_REVERSE_TRIANGULAR: "Reverse Triangular Merger",
  MERGER_FORWARD_TRIANGULAR: "Forward Triangular Merger",
  REVERSE_MERGER: "Reverse Merger",
  TENDER_OFFER: "Tender Offer",
  SECTION_363_SALE: "Section 363 Sale",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  loi: "Letter of Intent / Term Sheet",
  nda: "Non-Disclosure Agreement",
  purchase_agreement: "Purchase Agreement",
  due_diligence_checklist: "Due Diligence Checklist",
  disclosure_schedules: "Disclosure Schedules",
  closing_checklist: "Closing Checklist",
};

const EXPECTED_DOCS = [
  { type: "loi", label: "Letter of Intent / Term Sheet" },
  { type: "nda", label: "Non-Disclosure Agreement" },
  { type: "purchase_agreement", label: "Purchase Agreement" },
  { type: "due_diligence_checklist", label: "Due Diligence Checklist" },
  { type: "disclosure_schedules", label: "Disclosure Schedules" },
  { type: "closing_checklist", label: "Closing Checklist" },
];

const PURCHASE_AGREEMENT_ALIASES: Record<string, string[]> = {
  purchase_agreement: [
    "stock_purchase_agreement",
    "asset_purchase_agreement",
    "merger_agreement",
  ],
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating Documents", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Compliance Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const PROCESSING_STATUSES = new Set(["GENERATING_DOCS", "COMPLIANCE_REVIEW"]);

/* ---------- Helpers ---------- */

function formatCurrency(value: number | string | null): string {
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- Document Card Component ---------- */

function DocumentCard({ doc }: { doc: MADocument }) {
  const [expanded, setExpanded] = useState(false);

  const issues = doc.complianceIssues ?? [];
  const hasIssues = issues.length > 0;
  const isPassed =
    doc.complianceStatus === "PASSED" || doc.status === "REVIEWED";
  const isFlagged =
    doc.complianceStatus === "FLAGGED" || doc.status === "FLAGGED";

  return (
    <Card className="transition-all duration-200 ease-out hover:shadow-md">
      <CardContent className="pt-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={
                    isPassed
                      ? "default"
                      : isFlagged
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-[10px]"
                >
                  {isPassed
                    ? "Passed"
                    : isFlagged
                    ? "Review Required"
                    : doc.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  v{doc.version}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {doc.downloadUrl && (
              <a
                href={doc.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 transition-all duration-150 hover:bg-primary/10 hover:text-primary"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1 transition-all duration-150"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {expanded ? "Collapse" : "Details"}
            </Button>
          </div>
        </div>

        {/* Expanded compliance details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-in slide-in-from-top-1 duration-200">
            {hasIssues ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compliance Issues ({issues.length})
                </p>
                <div className="space-y-2">
                  {issues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs rounded-lg border p-3 bg-muted/30 transition-all duration-150 hover:bg-muted/50"
                    >
                      {issue.severity === "critical" ||
                      issue.severity === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{issue.rule}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {issue.description}
                        </p>
                        {issue.recommendation && (
                          <p className="text-muted-foreground/80 mt-1 italic">
                            {issue.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">All Checks Passed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No compliance issues found in this document.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Page ---------- */

export default function DealDetailPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId ?? "";
  const [project, setProject] = useState<MAProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pollErrorCount, setPollErrorCount] = useState(0);

  /* Fetch project */
  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/ma/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      const { project: data } = await res.json();
      setProject(data);
      setError(null);
      setPollErrorCount(0); // Reset error count on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      setPollErrorCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  /* Polling when processing */
  useEffect(() => {
    if (!project || !PROCESSING_STATUSES.has(project.status)) return;
    if (pollErrorCount >= 3) return; // Stop polling after 3 consecutive errors
    const interval = setInterval(fetchProject, 5000);
    return () => clearInterval(interval);
  }, [project, fetchProject, pollErrorCount]);

  /* Generate handler */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/ma/${projectId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start generation");
      }
      toast.success("Document generation started!");
      fetchProject();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start generation"
      );
    } finally {
      setGenerating(false);
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* Error state */
  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <Link
          href="/dashboard/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5 mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Deals
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ?? "Project not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessing = PROCESSING_STATUSES.has(project.status);
  const isComplete = project.status === "COMPLETE";
  const canGenerate =
    project.status === "CREATED" || project.status === "ERROR" || project.status === "NEEDS_REVIEW";
  const statusConf = STATUS_CONFIG[project.status] ?? {
    label: project.status,
    variant: "outline" as const,
  };

  const passedDocs = project.maDocuments.filter(
    (d) =>
      d.complianceStatus === "PASSED" || d.status === "REVIEWED"
  ).length;
  const totalDocs = project.maDocuments.length;

  /* Overview metrics */
  const overviewItems = [
    {
      label: "Purchase Price",
      value: formatCurrency(project.purchasePrice),
      icon: DollarSign,
      highlight: true,
    },
    {
      label: "Cash Component",
      value: formatCurrency(project.cashComponent),
      icon: DollarSign,
    },
    {
      label: "Stock Component",
      value: formatCurrency(project.stockComponent),
      icon: DollarSign,
    },
    {
      label: "Earnout Amount",
      value: formatCurrency(project.earnoutAmount),
      icon: DollarSign,
    },
    {
      label: "Exclusivity Period",
      value: project.exclusivityDays
        ? `${project.exclusivityDays} days`
        : "--",
      icon: Clock,
    },
    {
      label: "Due Diligence Period",
      value: project.dueDiligenceDays
        ? `${project.dueDiligenceDays} days`
        : "--",
      icon: Clock,
    },
    {
      label: "Buyer",
      value: project.buyerName,
      icon: Users,
    },
    {
      label: "Seller",
      value: project.sellerName,
      icon: Users,
    },
    {
      label: "Governing Law",
      value: project.governingLaw ?? "--",
      icon: Scale,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Deals
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.targetCompany} Acquisition
              </h1>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={statusConf.variant} className="text-xs">
              {isProcessing && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1.5" />
              )}
              {statusConf.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {TRANSACTION_TYPE_LABELS[project.transactionType] ??
                project.transactionType}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(project.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-1.5 shadow-sm transition-all duration-200"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {project.status === "NEEDS_REVIEW"
                    ? "Regenerate Documents"
                    : "Generate Documents"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <Card className="mb-6 border-primary/20 bg-primary/5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardContent className="py-5">
            <DocGenTracker
              expectedDocs={EXPECTED_DOCS}
              completedDocTypes={project.maDocuments.map((d) => d.docType)}
              status={project.status}
              errorStep={project.errorStep}
              errorMessage={project.errorMessage}
              typeAliases={PURCHASE_AGREEMENT_ALIASES}
            />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {project.status === "ERROR" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Pipeline Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {project.errorMessage || "An error occurred during processing."}
              {project.errorStep && (
                <span className="ml-1 text-xs opacity-75">
                  (Step: {project.errorStep})
                </span>
              )}
            </span>
            <Button
              variant="default"
              size="sm"
              disabled={generating}
              className="shrink-0 gap-1.5"
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          Transaction Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {overviewItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className={`transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                  item.highlight
                    ? "border-primary/20 bg-primary/[0.02]"
                    : ""
                }`}
              >
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {item.label}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-semibold tracking-tight tabular-nums truncate ${
                      item.highlight ? "text-primary" : ""
                    }`}
                  >
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Extra details row */}
        {(project.targetIndustry ||
          project.nonCompeteYears ||
          project.escrowPercent) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {project.targetIndustry && (
              <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Industry
                    </p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight truncate">
                    {project.targetIndustry}
                  </p>
                </CardContent>
              </Card>
            )}
            {project.nonCompeteYears && (
              <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Non-Compete
                    </p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight tabular-nums">
                    {project.nonCompeteYears} year
                    {project.nonCompeteYears !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}
            {project.escrowPercent != null && (
              <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Escrow
                    </p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight tabular-nums">
                    {(project.escrowPercent * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Documents section */}
      {totalDocs > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Documents
            </h2>
            {isComplete && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {passedDocs} of {totalDocs} passed compliance
                </span>
              </div>
            )}
          </div>

          {/* Compliance summary bar */}
          {isComplete && totalDocs > 0 && (
            <Card className="mb-4 transition-all duration-200 hover:shadow-md">
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        passedDocs === totalDocs
                          ? "bg-primary/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      <Shield
                        className={`h-4.5 w-4.5 ${
                          passedDocs === totalDocs
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Document Package Compliance
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {passedDocs} of {totalDocs} documents passed all
                        checks
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      passedDocs === totalDocs ? "default" : "destructive"
                    }
                  >
                    {passedDocs === totalDocs
                      ? "All Passed"
                      : "Review Required"}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      passedDocs === totalDocs
                        ? "bg-primary"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${
                        totalDocs > 0
                          ? (passedDocs / totalDocs) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document cards */}
          <div className="space-y-3">
            {project.maDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {/* No documents yet */}
      {totalDocs === 0 && !isProcessing && project.status !== "ERROR" && (
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                No documents generated yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click &ldquo;Generate Documents&rdquo; to create your complete
                M&A document package including LOI, NDA, purchase agreement, and
                closing checklists.
              </p>
              {canGenerate && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="mt-4 gap-1.5"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Generate Documents
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer metadata */}
      <Separator className="my-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Transaction Type
          </p>
          <p className="mt-0.5">
            {TRANSACTION_TYPE_LABELS[project.transactionType] ??
              project.transactionType}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Target Company
          </p>
          <p className="mt-0.5">{project.targetCompany}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">Buyer</p>
          <p className="mt-0.5">{project.buyerName}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">Seller</p>
          <p className="mt-0.5">{project.sellerName}</p>
        </div>
        {project.governingLaw && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Governing Law
            </p>
            <p className="mt-0.5">{project.governingLaw}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-xs font-medium">Created</p>
          <p className="mt-0.5">{formatDate(project.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Project ID
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate">
            {project.id}
          </p>
        </div>
      </div>
    </div>
  );
}
