"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
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
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Shield,
  Building,
  DollarSign,
  Percent,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { DocGenTracker } from "@/components/DocGenTracker";
import { SourceDocChecklist, fetchMissingSourceDocs } from "@/components/source-doc-checklist";
import { MissingDocsDialog } from "@/components/missing-docs-dialog";
import type { SourceDocDef } from "@/lib/source-doc-types";
import { ChatPanel } from "@/components/chat-panel";

/* ---------- Types ---------- */

type SyndicationDocument = {
  id: string;
  docType: string;
  s3Key: string;
  version: number;
  status: string;
  complianceStatus: string | null;
  complianceIssues: Array<{
    severity: string;
    description: string;
    recommendation: string;
  }> | null;
  downloadUrl: string | null;
  createdAt: string;
};

type WaterfallTier = {
  tierOrder: number;
  tierName: string | null;
  hurdleRate: number | null;
  lpSplit: number;
  gpSplit: number;
  description: string | null;
};

type SyndicationProject = {
  id: string;
  name: string;
  entityName: string;
  sponsorName: string;
  propertyAddress: string;
  propertyType: string;
  purchasePrice: number | string | null;
  totalEquityRaise: number | string | null;
  minInvestment: number | string | null;
  loanAmount: number | string | null;
  interestRate: number | null;
  preferredReturn: number | null;
  projectedIrr: number | null;
  projectedHoldYears: number | null;
  acquisitionFee: number | null;
  assetMgmtFee: number | null;
  units: number | null;
  yearBuilt: number | null;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  createdAt: string;
  syndicationDocuments: SyndicationDocument[];
  waterfallTiers: WaterfallTier[];
};

/* ---------- Constants ---------- */

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  MULTIFAMILY: "Multifamily",
  OFFICE: "Office",
  RETAIL: "Retail",
  INDUSTRIAL: "Industrial",
  MIXED_USE: "Mixed Use",
  SELF_STORAGE: "Self Storage",
  MOBILE_HOME_PARK: "Mobile Home Park",
  HOTEL: "Hotel",
  NNN_RETAIL: "NNN Retail",
  SENIOR_HOUSING: "Senior Housing",
  STUDENT_HOUSING: "Student Housing",
  BUILD_TO_RENT: "Build to Rent",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ppm: "Private Placement Memorandum",
  operating_agreement: "LLC Operating Agreement",
  subscription_agreement: "Subscription Agreement",
  investor_questionnaire: "Investor Questionnaire",
  pro_forma: "Pro Forma Financial Projections",
};

const EXPECTED_DOCS = [
  { type: "ppm", label: "Private Placement Memorandum" },
  { type: "operating_agreement", label: "LLC Operating Agreement" },
  { type: "subscription_agreement", label: "Subscription Agreement" },
  { type: "investor_questionnaire", label: "Investor Questionnaire" },
  { type: "pro_forma", label: "Pro Forma Financial Projections" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating Docs", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Compliance Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const PROCESSING_STATUSES = new Set([
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
]);

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

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "--";
  // Values are stored as decimals (0.08 = 8%), display as percentage
  const num = (value * 100).toFixed(1);
  return `${parseFloat(num)}%`;
}


/* ---------- Document Card Sub-component ---------- */

function DocumentCard({
  doc,
}: {
  doc: SyndicationDocument;
}) {
  const [expanded, setExpanded] = useState(false);

  const issues = doc.complianceIssues ?? [];
  const hasIssues = issues.length > 0;
  const isPassed =
    doc.complianceStatus === "PASSED" || doc.status === "REVIEWED";
  const isFailed = doc.status === "FAILED" || doc.status === "FLAGGED";

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="pt-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={
                    isPassed
                      ? "default"
                      : isFailed
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {isPassed
                    ? "Passed"
                    : isFailed
                      ? "Review Required"
                      : doc.status}
                </Badge>
                {doc.version > 1 && (
                  <span className="text-xs text-muted-foreground">
                    v{doc.version}
                  </span>
                )}
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
                  className="h-8 w-8 p-0 transition-colors duration-150"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1 transition-colors duration-150"
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

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 border-t pt-4 animate-in slide-in-from-top-2 duration-200">
            {hasIssues ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Compliance Issues
                </p>
                {issues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs rounded-md border p-2.5 bg-muted/30 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <Badge
                      variant={
                        issue.severity === "critical"
                          ? "destructive"
                          : issue.severity === "warning"
                            ? "outline"
                            : "secondary"
                      }
                      className="text-[9px] flex-shrink-0 mt-0.5"
                    >
                      {issue.severity}
                    </Badge>
                    <div>
                      <p>{issue.description}</p>
                      {issue.recommendation && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {issue.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

/* ---------- Main Component ---------- */

export default function SyndicationDetailPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId ?? "";
  const [project, setProject] = useState<SyndicationProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pollErrorCount, setPollErrorCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [missingDocsOpen, setMissingDocsOpen] = useState(false);
  const [missingRequired, setMissingRequired] = useState<SourceDocDef[]>([]);
  const [missingOptional, setMissingOptional] = useState<SourceDocDef[]>([]);
  const [classifying, setClassifying] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/syndication/${projectId}`);
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

  // Initial fetch
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Polling when processing
  useEffect(() => {
    if (
      project &&
      PROCESSING_STATUSES.has(project.status) &&
      pollErrorCount < 3 // Stop polling after 3 consecutive errors
    ) {
      pollingRef.current = setInterval(fetchProject, 5000);
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [project, fetchProject, pollErrorCount]);

  const doGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/syndication/${projectId}/generate`, {
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

  const handleGenerate = async () => {
    setClassifying(true);
    try {
      const { missingRequired: mr, missingOptional: mo } =
        await fetchMissingSourceDocs("syndication", projectId);
      if (mr.length > 0 || mo.length > 0) {
        setMissingRequired(mr);
        setMissingOptional(mo);
        setMissingDocsOpen(true);
        return;
      }
      doGenerate();
    } finally {
      setClassifying(false);
    }
  };

  const scrollToChecklist = () => {
    document.getElementById("source-doc-checklist")?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */

  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <Link
          href="/dashboard/syndication"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Syndication
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ?? "Project not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /* ---------- Derived state ---------- */

  const isProcessing = PROCESSING_STATUSES.has(project.status);
  const isComplete = project.status === "COMPLETE";
  const canGenerate =
    project.status === "CREATED" || project.status === "ERROR";
  const statusConfig = STATUS_CONFIG[project.status] ?? {
    label: project.status,
    variant: "outline" as const,
  };
  const docs = project.syndicationDocuments ?? [];
  const tiers = project.waterfallTiers ?? [];
  const passedDocs = docs.filter(
    (d) => d.status === "REVIEWED" || d.complianceStatus === "PASSED"
  );

  /* ---------- Overview metrics ---------- */

  const overviewMetrics = [
    {
      label: "Purchase Price",
      value: formatCurrency(project.purchasePrice),
      icon: DollarSign,
    },
    {
      label: "Total Equity Raise",
      value: formatCurrency(project.totalEquityRaise),
      icon: DollarSign,
    },
    {
      label: "Loan Amount",
      value: formatCurrency(project.loanAmount),
      icon: DollarSign,
    },
    {
      label: "Min Investment",
      value: formatCurrency(project.minInvestment),
      icon: DollarSign,
    },
    {
      label: "Interest Rate",
      value: formatPercent(project.interestRate),
      icon: Percent,
    },
    {
      label: "Preferred Return",
      value: formatPercent(project.preferredReturn),
      icon: Percent,
    },
    {
      label: "Projected IRR",
      value: formatPercent(project.projectedIrr),
      icon: Percent,
      highlight: true,
    },
    {
      label: "Hold Period",
      value:
        project.projectedHoldYears !== null
          ? `${project.projectedHoldYears} yr${project.projectedHoldYears !== 1 ? "s" : ""}`
          : "--",
      icon: Calendar,
    },
    {
      label: "Units",
      value: project.units !== null ? project.units.toLocaleString() : "--",
      icon: Building,
    },
    {
      label: "Year Built",
      value: project.yearBuilt !== null ? String(project.yearBuilt) : "--",
      icon: Calendar,
    },
    {
      label: "Sponsor",
      value: project.sponsorName,
      icon: Users,
      span: true,
    },
    {
      label: "Acquisition Fee",
      value: formatPercent(project.acquisitionFee),
      icon: Percent,
    },
    {
      label: "Asset Mgmt Fee",
      value: formatPercent(project.assetMgmtFee),
      icon: Percent,
    },
  ];

  /* ---------- Render ---------- */

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard/syndication"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Syndication
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.entityName || project.propertyAddress}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={statusConfig.variant}>
              {isProcessing && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              {statusConfig.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {PROPERTY_TYPE_LABELS[project.propertyType] ??
                project.propertyType}
            </Badge>
            {project.propertyAddress && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.propertyAddress}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {docs.length > 0 && (
            <ChatPanel
              module="syndication"
              projectId={projectId}
              projectName={project.entityName || project.propertyAddress || "Syndication Deal"}
            />
          )}
          {canGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={generating || classifying}
              className="shadow-sm transition-all duration-150"
            >
              {classifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing documents...
                </>
              ) : generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Generate Documents
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Processing Banner */}
      {isProcessing && (
        <Card className="mb-6 border-primary/20 bg-primary/5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardContent className="py-5">
            <DocGenTracker
              expectedDocs={EXPECTED_DOCS}
              completedDocTypes={(project.syndicationDocuments ?? []).map((d) => d.docType)}
              status={project.status}
              errorStep={project.errorStep}
              errorMessage={project.errorMessage}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
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

      {/* Source Document Checklist */}
      {canGenerate && (
        <div className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <SourceDocChecklist module="syndication" projectId={projectId} />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {tiers.length > 0 && (
            <TabsTrigger value="capital-stack">Capital Stack</TabsTrigger>
          )}
          {docs.length > 0 && (
            <TabsTrigger value="documents">
              Documents
              {docs.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({docs.length})
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ---- Overview Tab ---- */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {overviewMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card
                  key={metric.label}
                  className={`transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
                    metric.span ? "col-span-2" : ""
                  } ${metric.highlight ? "border-primary/20 bg-primary/5" : ""}`}
                >
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {metric.label}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-semibold tracking-tight tabular-nums truncate ${
                        metric.highlight ? "text-primary" : ""
                      }`}
                    >
                      {metric.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Deal Info Footer */}
          <Separator className="my-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Entity Name
              </p>
              <p className="mt-0.5 font-medium">{project.entityName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Sponsor
              </p>
              <p className="mt-0.5">{project.sponsorName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Property Type
              </p>
              <p className="mt-0.5">
                {PROPERTY_TYPE_LABELS[project.propertyType] ??
                  project.propertyType}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Created
              </p>
              <p className="mt-0.5">
                {new Date(project.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ---- Capital Stack Tab ---- */}
        {tiers.length > 0 && (
          <TabsContent value="capital-stack">
            <div className="space-y-6">
              {/* Waterfall Table */}
              <Card className="transition-shadow duration-200 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Waterfall Distribution Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Tier</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">
                          Hurdle Rate
                        </TableHead>
                        <TableHead className="text-right">LP Split</TableHead>
                        <TableHead className="text-right">GP Split</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map((tier) => (
                        <TableRow
                          key={tier.tierOrder}
                          className="transition-colors duration-150"
                        >
                          <TableCell className="font-medium tabular-nums">
                            {tier.tierOrder}
                          </TableCell>
                          <TableCell>
                            {tier.tierName ?? `Tier ${tier.tierOrder}`}
                            {tier.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tier.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {tier.hurdleRate !== null
                              ? `${(tier.hurdleRate * 100).toFixed(1)}%`
                              : "--"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {(tier.lpSplit * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {(tier.gpSplit * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Visual Split Bars */}
              <Card className="transition-shadow duration-200 hover:shadow-md">
                <CardHeader>
                  <CardTitle>LP / GP Split by Tier</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {tiers.map((tier) => (
                    <div key={tier.tierOrder}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {tier.tierName ?? `Tier ${tier.tierOrder}`}
                          {tier.hurdleRate !== null && (
                            <span className="text-muted-foreground ml-1">
                              ({(tier.hurdleRate * 100).toFixed(1)}% hurdle)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          LP {(tier.lpSplit * 100).toFixed(0)}% / GP{" "}
                          {(tier.gpSplit * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex h-6 rounded-md overflow-hidden border">
                        <div
                          className="bg-primary/80 flex items-center justify-center text-[10px] font-medium text-primary-foreground transition-all duration-500"
                          style={{
                            width: `${tier.lpSplit * 100}%`,
                          }}
                        >
                          {tier.lpSplit >= 0.15 && "LP"}
                        </div>
                        <div
                          className="bg-primary/20 flex items-center justify-center text-[10px] font-medium text-foreground transition-all duration-500"
                          style={{
                            width: `${tier.gpSplit * 100}%`,
                          }}
                        >
                          {tier.gpSplit >= 0.15 && "GP"}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ---- Documents Tab ---- */}
        {docs.length > 0 && (
          <TabsContent value="documents">
            <div className="space-y-4">
              {/* Summary bar */}
              <Card className="transition-shadow duration-200 hover:shadow-md">
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          Document Package Compliance
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {passedDocs.length} of {docs.length} documents passed
                          all checks
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        passedDocs.length === docs.length
                          ? "default"
                          : "destructive"
                      }
                    >
                      {passedDocs.length === docs.length
                        ? "All Checks Passed"
                        : "Review Required"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Document cards */}
              {docs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Empty state when no docs and no tabs would show */}
      {docs.length === 0 && !isProcessing && project.status !== "ERROR" && (
        <Card className="mt-6">
          <CardContent className="pt-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                No documents generated yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Click &ldquo;Generate Documents&rdquo; to create your complete
                syndication package including PPM, operating agreement,
                subscription documents, and pro forma projections.
              </p>
              {canGenerate && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating || classifying}
                  className="mt-6 shadow-sm"
                >
                  {classifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing documents...
                    </>
                  ) : generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Documents"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing docs pre-generation dialog */}
      <MissingDocsDialog
        open={missingDocsOpen}
        onOpenChange={setMissingDocsOpen}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        onUploadMissing={scrollToChecklist}
        onContinueAnyway={doGenerate}
      />
    </div>
  );
}
