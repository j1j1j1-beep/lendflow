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
  Percent,
  Shield,
  Building2,
  Clock,
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DocGenTracker } from "@/components/DocGenTracker";

type CapitalDocument = {
  id: string;
  docType: string;
  s3Key: string | null;
  version: number;
  status: string;
  complianceStatus: string | null;
  complianceIssues: Array<{
    name: string;
    regulation?: string;
    category?: string;
    passed: boolean;
    note?: string;
  }> | null;
  downloadUrl: string | null;
  createdAt: string;
};

type CapitalProject = {
  id: string;
  name: string;
  fundName: string;
  fundType: string;
  gpEntityName: string;
  gpStateOfFormation: string | null;
  exemptionType: string | null;
  targetRaise: number | null;
  minInvestment: number | null;
  managementFee: number | null;
  carriedInterest: number | null;
  preferredReturn: number | null;
  fundTermYears: number | null;
  investmentStrategy: string | null;
  geographicFocus: string | null;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  createdAt: string;
  capitalDocuments: CapitalDocument[];
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ppm: "Private Placement Memorandum",
  subscription_agreement: "Subscription Agreement",
  operating_agreement: "Operating Agreement",
  investor_questionnaire: "Investor Questionnaire",
  side_letter: "Side Letter",
  form_d_draft: "Form D Draft",
};

const FUND_TYPE_LABELS: Record<string, string> = {
  PRIVATE_EQUITY: "Private Equity",
  VENTURE_CAPITAL: "Venture Capital",
  REAL_ESTATE: "Real Estate",
  HEDGE_FUND: "Hedge Fund",
  CREDIT: "Credit",
  INFRASTRUCTURE: "Infrastructure",
};

const EXEMPTION_LABELS: Record<string, string> = {
  REG_D_506B: "Reg D 506(b)",
  REG_D_506C: "Reg D 506(c)",
  REG_A_TIER1: "Reg A Tier 1",
  REG_A_TIER2: "Reg A Tier 2",
  REG_CF: "Reg CF",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating Documents", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Compliance Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const PROCESSING_STATUSES = new Set(["GENERATING_DOCS", "COMPLIANCE_REVIEW"]);

const EXPECTED_DOCS = [
  { type: "ppm", label: "Private Placement Memorandum" },
  { type: "subscription_agreement", label: "Subscription Agreement" },
  { type: "operating_agreement", label: "Operating Agreement" },
  { type: "investor_questionnaire", label: "Investor Questionnaire" },
  { type: "side_letter", label: "Side Letter" },
  { type: "form_d_draft", label: "Form D Draft" },
];

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "--";
  if (isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "--";
  const num = (value * 100).toFixed(1);
  return `${parseFloat(num)}%`;
}

function DocumentCard({
  doc,
  expanded,
  onToggle,
}: {
  doc: CapitalDocument;
  expanded: boolean;
  onToggle: () => void;
}) {
  const checks = doc.complianceIssues ?? [];
  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;
  const hasChecks = totalCount > 0;

  return (
    <Card className="transition-all duration-200 ease-out hover:shadow-md">
      <CardContent className="pt-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 transition-colors duration-200 group-hover:bg-muted">
              <FileText className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={
                    doc.complianceStatus === "PASSED"
                      ? "default"
                      : doc.complianceStatus === "FLAGGED"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {doc.complianceStatus === "PASSED"
                    ? "Passed"
                    : doc.complianceStatus === "FLAGGED"
                    ? "Review Required"
                    : doc.status === "DRAFT"
                    ? "Draft"
                    : doc.status}
                </Badge>
                {hasChecks && (
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      passedCount === totalCount
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {passedCount}/{totalCount} checks
                  </span>
                )}
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
              onClick={onToggle}
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

        {/* Expanded: compliance details */}
        {expanded && hasChecks && (
          <div className="mt-4 border-t pt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Compliance Checks
            </p>
            <div className="space-y-1.5">
              {checks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm transition-all duration-150 hover:bg-muted/30 rounded-md px-2 py-1 -mx-2"
                >
                  {check.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span
                      className={`text-xs ${
                        check.passed
                          ? ""
                          : "text-destructive font-medium"
                      }`}
                    >
                      {check.name}
                    </span>
                    {check.regulation && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({check.regulation})
                      </span>
                    )}
                    {check.note && !check.passed && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {check.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && !hasChecks && (
          <div className="mt-4 border-t pt-4 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground text-center py-4">
              No compliance checks available for this document.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CapitalDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<CapitalProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [pollErrorCount, setPollErrorCount] = useState(0);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/capital/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      setProject(data.project);
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

  // Poll when processing
  useEffect(() => {
    if (!project) return;
    if (!PROCESSING_STATUSES.has(project.status)) return;
    if (pollErrorCount >= 3) return; // Stop polling after 3 consecutive errors
    const interval = setInterval(fetchProject, 5000);
    return () => clearInterval(interval);
  }, [project, fetchProject, pollErrorCount]);

  const toggleDoc = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/capital/${projectId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start generation");
      }
      toast.success("Document generation started!");
      fetchProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start generation");
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/capital/${projectId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to retry");
      }
      toast.success("Retrying document generation...");
      fetchProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry");
    } finally {
      setRetrying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <Link
          href="/dashboard/capital"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Capital
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Project not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessing = PROCESSING_STATUSES.has(project.status);
  const hasDocs = project.capitalDocuments.length > 0;
  const statusConfig = STATUS_CONFIG[project.status] ?? {
    label: project.status,
    variant: "outline" as const,
  };

  const overviewStats = [
    {
      label: "Target Raise",
      value: formatCurrency(project.targetRaise),
      icon: DollarSign,
      show: project.targetRaise !== null,
    },
    {
      label: "Min Investment",
      value: formatCurrency(project.minInvestment),
      icon: DollarSign,
      show: project.minInvestment !== null,
    },
    {
      label: "Management Fee",
      value: formatPercent(project.managementFee),
      icon: Percent,
      show: project.managementFee !== null,
    },
    {
      label: "Carried Interest",
      value: formatPercent(project.carriedInterest),
      icon: Percent,
      show: project.carriedInterest !== null,
    },
    {
      label: "Preferred Return",
      value: formatPercent(project.preferredReturn),
      icon: Percent,
      show: project.preferredReturn !== null,
    },
    {
      label: "Fund Term",
      value: project.fundTermYears ? `${project.fundTermYears} years` : "--",
      icon: Clock,
      show: project.fundTermYears !== null,
    },
    {
      label: "Exemption Type",
      value: project.exemptionType
        ? EXEMPTION_LABELS[project.exemptionType] ?? project.exemptionType
        : "--",
      icon: Shield,
      show: project.exemptionType !== null,
    },
    {
      label: "GP Entity",
      value: project.gpEntityName,
      icon: Building2,
      show: true,
    },
  ].filter((s) => s.show);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/capital"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Capital
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.fundName}
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <Badge variant={statusConfig.variant} className="text-xs">
            {isProcessing && (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            )}
            {statusConfig.label}
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            {FUND_TYPE_LABELS[project.fundType] ?? project.fundType}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {project.status === "ERROR" && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Pipeline Error</AlertTitle>
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
              disabled={retrying}
              className="shrink-0 gap-1.5 transition-all duration-200"
              onClick={handleRetry}
            >
              {retrying ? (
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

      {/* Processing state */}
      {isProcessing && (
        <Card className="mb-6 border-primary/20 bg-primary/5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardContent className="py-5">
            <DocGenTracker
              expectedDocs={EXPECTED_DOCS}
              completedDocTypes={project.capitalDocuments.map((d) => d.docType)}
              status={project.status}
              errorStep={project.errorStep}
              errorMessage={project.errorMessage}
            />
          </CardContent>
        </Card>
      )}

      {/* Generate button for CREATED / ERROR */}
      {(project.status === "CREATED" || project.status === "ERROR") && (
        <Card className="mb-6 border-dashed animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Ready to generate documents</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate your complete capital formation package including PPM,
                  subscription agreement, and more.
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="transition-all duration-200 hover:shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Generate Documents"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {hasDocs ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="transition-all duration-150"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="transition-all duration-150"
            >
              Documents
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {project.capitalDocuments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-0 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {overviewStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {stat.label}
                        </p>
                      </div>
                      <p className="text-xl font-semibold tracking-tight tabular-nums">
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Investment Strategy */}
            {project.investmentStrategy && (
              <Card className="transition-all duration-200 hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Investment Strategy</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {project.investmentStrategy}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-4 animate-in fade-in-0 duration-200">
            {/* Summary bar */}
            <Card className="transition-all duration-200">
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Document Package Compliance
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {
                          project.capitalDocuments.filter(
                            (d) => d.complianceStatus === "PASSED"
                          ).length
                        }{" "}
                        of {project.capitalDocuments.length} documents passed
                        all checks
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      project.capitalDocuments.every(
                        (d) => d.complianceStatus === "PASSED"
                      )
                        ? "default"
                        : "destructive"
                    }
                  >
                    {project.capitalDocuments.every(
                      (d) => d.complianceStatus === "PASSED"
                    )
                      ? "All Checks Passed"
                      : "Review Required"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Per-document cards */}
            {project.capitalDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                expanded={expandedDocs.has(doc.id)}
                onToggle={() => toggleDoc(doc.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        /* No docs yet - show overview only */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {stat.label}
                      </p>
                    </div>
                    <p className="text-xl font-semibold tracking-tight tabular-nums">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {project.investmentStrategy && (
            <Card className="transition-all duration-200 hover:shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Investment Strategy</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.investmentStrategy}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Footer metadata */}
      <Separator className="my-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Project Name
          </p>
          <p className="mt-0.5">{project.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">GP Entity</p>
          <p className="mt-0.5">{project.gpEntityName}</p>
        </div>
        {project.gpStateOfFormation && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              State of Formation
            </p>
            <p className="mt-0.5">{project.gpStateOfFormation}</p>
          </div>
        )}
        {project.geographicFocus && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Geographic Focus
            </p>
            <p className="mt-0.5">{project.geographicFocus}</p>
          </div>
        )}
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
      </div>
    </div>
  );
}
