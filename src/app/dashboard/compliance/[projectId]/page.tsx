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
  Calendar,
  DollarSign,
  Percent,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DocGenTracker } from "@/components/DocGenTracker";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ComplianceDocument = {
  id: string;
  docType: string;
  s3Key: string | null;
  version: number;
  status: string;
  complianceStatus: string | null;
  complianceIssues: Array<{
    severity: string;
    description: string;
    recommendation?: string;
  }> | null;
  downloadUrl: string | null;
  createdAt: string;
};

type ComplianceProject = {
  id: string;
  name: string;
  reportType: string;
  fundName: string;
  fundType: string | null;
  reportingQuarter: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  nav: number | null;
  totalContributions: number | null;
  totalDistributions: number | null;
  netIrr: number | null;
  moic: number | null;
  callAmount: number | null;
  callDueDate: string | null;
  callPurpose: string | null;
  distributionAmount: number | null;
  distributionType: string | null;
  taxYear: number | null;
  filingDeadline: string | null;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  createdAt: string;
  complianceDocuments: ComplianceDocument[];
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REPORT_TYPE_LABELS: Record<string, string> = {
  LP_QUARTERLY_REPORT: "LP Quarterly Report",
  CAPITAL_CALL_NOTICE: "Capital Call Notice",
  DISTRIBUTION_NOTICE: "Distribution Notice",
  K1_SUMMARY: "K-1 Summary",
  ANNUAL_REPORT: "Annual Report",
  FORM_ADV_SUMMARY: "Form ADV Summary",
  CAPITAL_ACCOUNT_STATEMENT: "Capital Account Statement",
  VALUATION_REPORT: "Valuation Report",
  AUDITED_FINANCIALS: "Audited Financials",
  SIDE_LETTER_SUMMARY: "Side Letter Summary",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  lp_quarterly_report: "LP Quarterly Report",
  capital_call_notice: "Capital Call Notice",
  distribution_notice: "Distribution Notice",
  k1_summary: "K-1 Summary Report",
  annual_report: "Annual Report",
  form_adv_summary: "Form ADV Part 2A Summary",
};

const REPORT_TYPE_TO_DOC: Record<string, string> = {
  LP_QUARTERLY_REPORT: "lp_quarterly_report",
  CAPITAL_CALL_NOTICE: "capital_call_notice",
  DISTRIBUTION_NOTICE: "distribution_notice",
  K1_SUMMARY: "k1_summary",
  ANNUAL_REPORT: "annual_report",
  FORM_ADV_SUMMARY: "form_adv_summary",
  CAPITAL_ACCOUNT_STATEMENT: "lp_quarterly_report",
  VALUATION_REPORT: "annual_report",
  AUDITED_FINANCIALS: "annual_report",
  SIDE_LETTER_SUMMARY: "lp_quarterly_report",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Reviewing", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const FUND_TYPE_LABELS: Record<string, string> = {
  PRIVATE_EQUITY: "Private Equity",
  VENTURE_CAPITAL: "Venture Capital",
  REAL_ESTATE: "Real Estate",
  HEDGE_FUND: "Hedge Fund",
  CREDIT: "Credit",
  INFRASTRUCTURE: "Infrastructure",
};

const DISTRIBUTION_TYPE_LABELS: Record<string, string> = {
  return_of_capital: "Return of Capital",
  income: "Income",
  gain: "Capital Gain",
};

const PROCESSING_STATUSES = new Set([
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
]);

const PERFORMANCE_TYPES = new Set([
  "LP_QUARTERLY_REPORT",
  "ANNUAL_REPORT",
]);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${(value * 100).toFixed(2)}%`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ComplianceDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ComplianceProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  /* ---------- Fetch ---------- */

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/compliance/${projectId}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      setProject(data.project);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /* ---------- Initial fetch + polling ---------- */

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  /* 5s polling while processing */
  useEffect(() => {
    if (!project || !PROCESSING_STATUSES.has(project.status)) return;
    const interval = setInterval(fetchProject, 5_000);
    return () => clearInterval(interval);
  }, [project?.status, fetchProject]);

  /* ---------- Generate handler ---------- */

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/compliance/${projectId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start generation");
      }
      toast.success("Document generation started.");
      fetchProject();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start generation"
      );
    } finally {
      setGenerating(false);
    }
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  /* ---------- Error ---------- */

  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Report not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  /* ---------- Derived state ---------- */

  const statusCfg = STATUS_CONFIG[project.status] ?? {
    label: project.status,
    variant: "outline" as const,
  };
  const isProcessing = PROCESSING_STATUSES.has(project.status);
  const canGenerate =
    project.status === "CREATED" || project.status === "NEEDS_REVIEW";
  const showPerformance = PERFORMANCE_TYPES.has(project.reportType);
  const showCapitalCall = project.reportType === "CAPITAL_CALL_NOTICE";
  const showDistribution = project.reportType === "DISTRIBUTION_NOTICE";
  const showK1 = project.reportType === "K1_SUMMARY";
  const doc = project.complianceDocuments[0] ?? null;

  /* ---------- Render ---------- */

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/dashboard/compliance"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Compliance
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={statusCfg.variant} className="text-xs">
              {isProcessing && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              {statusCfg.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {REPORT_TYPE_LABELS[project.reportType] ?? project.reportType}
            </Badge>
          </div>
        </div>

        {canGenerate && (
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="shadow-sm shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Generate Document
              </>
            )}
          </Button>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (() => {
        const expectedDocType = REPORT_TYPE_TO_DOC[project.reportType] ?? "lp_quarterly_report";
        const expectedLabel = DOC_TYPE_LABELS[expectedDocType] ?? project.reportType;
        return (
          <Card className="mb-6 border-primary/20 bg-primary/5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <CardContent className="py-5">
              <DocGenTracker
                expectedDocs={[{ type: expectedDocType, label: expectedLabel }]}
                completedDocTypes={project.complianceDocuments.map((d) => d.docType)}
                status={project.status}
                errorStep={project.errorStep}
                errorMessage={project.errorMessage}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* Error alert */}
      {project.status === "ERROR" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {project.errorMessage || "An error occurred during document generation."}
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
                  Retry Generation
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Overview                                                    */}
      {/* ---------------------------------------------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Report Overview
          </CardTitle>
          <CardDescription>
            Fund details and report parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Always-visible stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Fund Name" value={project.fundName} />
            <StatCard
              label="Report Type"
              value={
                REPORT_TYPE_LABELS[project.reportType] ?? project.reportType
              }
              icon={<FileText className="h-3.5 w-3.5" />}
            />
            {project.fundType && (
              <StatCard
                label="Fund Type"
                value={
                  FUND_TYPE_LABELS[project.fundType] ?? project.fundType
                }
              />
            )}
            {project.reportingQuarter && (
              <StatCard
                label="Quarter"
                value={project.reportingQuarter}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
            )}
            {(project.periodStart || project.periodEnd) && (
              <StatCard
                label="Period"
                value={`${formatDate(project.periodStart)} - ${formatDate(project.periodEnd)}`}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
            )}
          </div>

          {/* Performance fields (LP Report / Annual) */}
          {showPerformance &&
            (project.nav !== null ||
              project.totalContributions !== null ||
              project.totalDistributions !== null ||
              project.netIrr !== null ||
              project.moic !== null) && (
              <>
                <Separator className="my-5" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Fund Performance
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {project.nav !== null && (
                    <StatCard
                      label="NAV"
                      value={formatCurrency(project.nav)}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.totalContributions !== null && (
                    <StatCard
                      label="Total Contributions"
                      value={formatCurrency(project.totalContributions)}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.totalDistributions !== null && (
                    <StatCard
                      label="Total Distributions"
                      value={formatCurrency(project.totalDistributions)}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.netIrr !== null && (
                    <StatCard
                      label="Net IRR"
                      value={formatPercent(project.netIrr)}
                      icon={<Percent className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.moic !== null && (
                    <StatCard label="MOIC" value={`${project.moic.toFixed(2)}x`} />
                  )}
                </div>
              </>
            )}

          {/* Capital Call fields */}
          {showCapitalCall &&
            (project.callAmount !== null ||
              project.callDueDate ||
              project.callPurpose) && (
              <>
                <Separator className="my-5" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Capital Call Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {project.callAmount !== null && (
                    <StatCard
                      label="Call Amount"
                      value={formatCurrency(project.callAmount)}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.callDueDate && (
                    <StatCard
                      label="Due Date"
                      value={formatDate(project.callDueDate)}
                      icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                  )}
                </div>
                {project.callPurpose && (
                  <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Purpose
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {project.callPurpose}
                    </p>
                  </div>
                )}
              </>
            )}

          {/* Distribution fields */}
          {showDistribution &&
            (project.distributionAmount !== null || project.distributionType) && (
              <>
                <Separator className="my-5" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Distribution Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.distributionAmount !== null && (
                    <StatCard
                      label="Distribution Amount"
                      value={formatCurrency(project.distributionAmount)}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    />
                  )}
                  {project.distributionType && (
                    <StatCard
                      label="Type"
                      value={
                        DISTRIBUTION_TYPE_LABELS[project.distributionType] ??
                        project.distributionType
                      }
                    />
                  )}
                </div>
              </>
            )}

          {/* K-1 fields */}
          {showK1 && (project.taxYear !== null || project.filingDeadline) && (
            <>
              <Separator className="my-5" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                K-1 Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.taxYear !== null && (
                  <StatCard
                    label="Tax Year"
                    value={String(project.taxYear)}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  />
                )}
                {project.filingDeadline && (
                  <StatCard
                    label="Filing Deadline"
                    value={formatDate(project.filingDeadline)}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------- */}
      {/*  Document                                                    */}
      {/* ---------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Document
          </CardTitle>
          <CardDescription>
            Compliance generates a single document matching the selected report
            type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doc ? (
            <div className="rounded-lg border transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge
                        variant={
                          doc.status === "COMPLETE" || doc.status === "REVIEWED"
                            ? "default"
                            : doc.status === "ERROR" || doc.status === "FLAGGED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[11px]"
                      >
                        {(doc.status === "GENERATING" ||
                          doc.status === "PENDING") && (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        )}
                        {doc.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        v{doc.version}
                      </span>
                      {doc.complianceStatus && (
                        <Badge
                          variant={
                            doc.complianceStatus === "PASSED"
                              ? "default"
                              : doc.complianceStatus === "FLAGGED"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[11px]"
                        >
                          {doc.complianceStatus === "PASSED" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {doc.complianceStatus === "FLAGGED" && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {doc.complianceStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </a>
                )}
              </div>

              {/* Compliance issues */}
              {doc.complianceIssues && doc.complianceIssues.length > 0 && (
                <div className="border-t px-4 py-3 space-y-2 bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Compliance Issues
                  </p>
                  {doc.complianceIssues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm rounded-md border p-2.5 bg-background transition-all duration-150 hover:shadow-sm"
                    >
                      <Badge
                        variant={
                          issue.severity === "critical" ||
                          issue.severity === "error"
                            ? "destructive"
                            : issue.severity === "warning"
                            ? "outline"
                            : "secondary"
                        }
                        className="text-[10px] shrink-0 mt-0.5"
                      >
                        {issue.severity}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-xs">{issue.description}</p>
                        {issue.recommendation && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {issue.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No issues */}
              {doc.complianceStatus === "PASSED" &&
                (!doc.complianceIssues ||
                  doc.complianceIssues.length === 0) && (
                  <div className="border-t px-4 py-4 flex items-center gap-2 text-sm text-primary bg-primary/5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">
                      All compliance checks passed
                    </span>
                  </div>
                )}
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Generating document...</p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually takes 15-30 seconds
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No document generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Generate Document&quot; to create your{" "}
                {REPORT_TYPE_LABELS[project.reportType]?.toLowerCase() ??
                  "report"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer metadata */}
      <Separator className="my-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs font-medium">Created</p>
          <p className="mt-0.5">
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Report Type
          </p>
          <p className="mt-0.5">
            {REPORT_TYPE_LABELS[project.reportType] ?? project.reportType}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">Status</p>
          <p className="mt-0.5 capitalize">
            {project.status.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
        {project.reportingQuarter && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Quarter
            </p>
            <p className="mt-0.5">{project.reportingQuarter}</p>
          </div>
        )}
      </div>
    </div>
  );
}
