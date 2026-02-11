"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Upload,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Shield,
  FlaskConical,
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
import { BioStatusBadge } from "@/components/BioStatusBadge";

// --- Types matching API responses ---

type BioDocument = {
  id: string;
  fileName: string;
  fileSize: number;
  docType: string | null;
  status: string;
  createdAt: string;
  extractions: { id: string; model: string; createdAt: string }[];
};

type BioAnalysis = {
  id: string;
  cmcData: unknown;
  toxSummary: unknown;
  pkSummary: unknown;
  safetyMargins: unknown;
  riskFlags: unknown;
  riskScore: number | null;
  regulatoryFlags: unknown;
  fullResults: unknown;
};

type BioGeneratedDocument = {
  id: string;
  docType: string;
  s3Key: string;
  version: number;
  status: string;
  complianceStatus: string | null;
  complianceIssues: unknown;
  verificationStatus: string | null;
  verificationIssues: unknown;
  regulatoryChecks: Array<{
    name: string;
    regulation: string;
    category: string;
    passed: boolean;
    note?: string;
  }> | null;
  createdAt: string;
};

type BioCondition = {
  id: string;
  category: string;
  description: string;
  regulation: string | null;
  source: string;
  priority: string;
  status: string;
};

type BioProgram = {
  id: string;
  name: string;
  drugName: string | null;
  drugClass: string | null;
  target: string | null;
  mechanism: string | null;
  indication: string | null;
  phase: string | null;
  sponsorName: string | null;
  toolType: string;
  status: string;
  errorMessage: string | null;
  errorStep: string | null;
  antibodyType: string | null;
  linkerType: string | null;
  payloadType: string | null;
  dar: number | null;
  createdAt: string;
  bioDocuments: BioDocument[];
  bioAnalysis: BioAnalysis | null;
  bioGeneratedDocuments: BioGeneratedDocument[];
  bioConditions: BioCondition[];
};

const PROCESSING_STATUSES = [
  "EXTRACTING",
  "CLASSIFYING",
  "VERIFYING",
  "ANALYZING",
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
];

const DRUG_CLASS_LABELS: Record<string, string> = {
  ADC: "ADC",
  adc: "ADC",
  SMALL_MOLECULE: "Small Molecule",
  small_molecule: "Small Molecule",
  BIOLOGIC: "Biologic",
  biologic: "Biologic",
  GENE_THERAPY: "Gene Therapy",
  gene_therapy: "Gene Therapy",
  CELL_THERAPY: "Cell Therapy",
  cell_therapy: "Cell Therapy",
  VACCINE: "Vaccine",
  vaccine: "Vaccine",
};

const PHASE_LABELS: Record<string, string> = {
  PRECLINICAL: "Preclinical",
  IND_FILING: "IND Filing",
  PHASE_1: "Phase 1",
  PHASE_1B: "Phase 1b",
  PHASE_2: "Phase 2",
  PHASE_2B: "Phase 2b",
  PHASE_3: "Phase 3",
  NDA_BLA: "NDA/BLA",
  APPROVED: "Approved",
  POST_MARKET: "Post-Market",
};

const GEN_DOC_TYPE_LABELS: Record<string, string> = {
  ind_module_1: "Module 1 - Administrative",
  ind_module_2: "Module 2 - Summaries",
  ind_module_3: "Module 3 - Quality (CMC)",
  ind_module_4: "Module 4 - Nonclinical Study Reports",
  ind_module_5: "Module 5 - Clinical Study Reports",
  investigator_brochure: "Investigator's Brochure",
  clinical_protocol: "Clinical Protocol",
  pre_ind_briefing: "Pre-IND Briefing Book",
  informed_consent: "Informed Consent Form",
  diversity_action_plan: "Diversity Action Plan",
  fda_form_1571: "FDA Form 1571",
};

const DOC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-muted-foreground" },
  OCR_PROCESSING: { label: "OCR Processing", color: "text-blue-600" },
  OCR_COMPLETE: { label: "OCR Complete", color: "text-blue-600" },
  CLASSIFYING: { label: "Classifying", color: "text-amber-600" },
  CLASSIFIED: { label: "Classified", color: "text-emerald-600" },
  EXTRACTING: { label: "Extracting", color: "text-amber-600" },
  EXTRACTED: { label: "Extracted", color: "text-emerald-600" },
  VERIFIED: { label: "Verified", color: "text-emerald-600" },
  ERROR: { label: "Error", color: "text-destructive" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Generated Document Card ---

function BioGenDocCard({ doc, onRefresh }: { doc: BioGeneratedDocument; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenNotes, setRegenNotes] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const checks = doc.regulatoryChecks ?? [];
  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;
  const hasChecks = totalCount > 0;

  useEffect(() => {
    if (!expanded) {
      setDocxBlob(null);
      setDocError(null);
      return;
    }
    setDocLoading(true);
    fetch(`/api/bio/generated-documents/${doc.id}/content`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load document");
        }
        return res.blob();
      })
      .then(setDocxBlob)
      .catch((err) =>
        setDocError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setDocLoading(false));
  }, [expanded, doc.id]);

  useEffect(() => {
    if (!docxBlob || !containerRef.current) return;
    let cancelled = false;
    async function render() {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        await renderAsync(docxBlob!, containerRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: true,
          ignoreHeight: true,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
        });
      } catch (err) {
        if (!cancelled)
          setDocError(
            err instanceof Error ? err.message : "Render failed"
          );
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [docxBlob]);

  const hasIssues =
    doc.complianceStatus === "FLAGGED" ||
    doc.verificationStatus === "FAILED" ||
    doc.status === "DRAFT";

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/bio/generated-documents/${doc.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: regenNotes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Regeneration failed");
      }
      const data = await res.json();
      toast.success(
        `Document regenerated (v${data.version}) — ${data.complianceReviewPassed ? "all checks passed" : `${data.issueCount} issues remain`}`,
      );
      setShowRegenDialog(false);
      setRegenNotes("");
      setExpanded(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }, [doc.id, regenNotes, onRefresh]);

  const complianceBadge =
    doc.complianceStatus === "PASSED"
      ? { label: "Passed", variant: "default" as const }
      : doc.complianceStatus === "FLAGGED"
        ? { label: "Flagged", variant: "destructive" as const }
        : { label: doc.status, variant: "secondary" as const };

  return (
    <>
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">
                {GEN_DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={complianceBadge.variant} className="text-xs">
                  {complianceBadge.label}
                </Badge>
                {hasChecks && (
                  <span
                    className={`text-xs font-medium ${passedCount === totalCount ? "text-emerald-600" : "text-destructive"}`}
                  >
                    {passedCount}/{totalCount} checks passed
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  v{doc.version}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasIssues && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowRegenDialog(true)}
                disabled={regenerating}
              >
                {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Regenerate
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {expanded ? "Collapse" : "View"}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-4">
            <div className="doc-viewer-split rounded-lg border overflow-hidden" style={{ height: "600px" }}>
              {/* Left: Document */}
              <div className="doc-viewer-content">
                {docLoading && (
                  <div className="flex items-center justify-center h-full gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading document...
                    </span>
                  </div>
                )}
                {docError && !docLoading && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-destructive">{docError}</p>
                  </div>
                )}
                <div
                  ref={containerRef}
                  className="docx-container bg-white h-full"
                  style={{
                    display:
                      docLoading || docError || !docxBlob ? "none" : "block",
                  }}
                />
              </div>

              {/* Right: Regulatory checks */}
              <div className="doc-viewer-panel p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-2">
                  {doc.complianceStatus === "PASSED" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium text-sm">
                    {doc.complianceStatus === "PASSED"
                      ? "All Checks Passed"
                      : "Review Required"}
                  </span>
                </div>

                <Separator />

                {hasChecks && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Regulatory Checks
                    </p>
                    <div className="space-y-1.5">
                      {checks.map((check, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          {check.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span
                              className={`text-xs ${check.passed ? "" : "text-destructive font-medium"}`}
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

                {!hasChecks && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No regulatory checks recorded for this document.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={showRegenDialog} onOpenChange={(open) => { if (!regenerating) setShowRegenDialog(open); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate {GEN_DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</AlertDialogTitle>
          <AlertDialogDescription>
            The AI will regenerate this document using the flagged issues as correction context. All regulatory checks will run again on the new version.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Previous Issues ({
                ((doc.complianceIssues as any[] | null)?.length ?? 0) +
                ((doc.regulatoryChecks as any[] | null)?.filter((c: any) => !c.passed)?.length ?? 0)
              })
            </p>
            <div className="rounded-md border bg-muted/30 p-2 max-h-32 overflow-y-auto text-xs space-y-1">
              {(doc.complianceIssues as any[] | null)?.map((issue: any, i: number) => (
                <p key={`ci-${i}`} className="text-destructive">
                  [{issue.severity}] {issue.section}: {issue.description}
                </p>
              ))}
              {(doc.regulatoryChecks as any[] | null)
                ?.filter((c: any) => !c.passed)
                .map((check: any, i: number) => (
                  <p key={`rc-${i}`} className="text-destructive">
                    {check.name}{check.regulation ? ` (${check.regulation})` : ""}{check.note ? `: ${check.note}` : ""}
                  </p>
                ))}
              {((doc.complianceIssues as any[] | null)?.length ?? 0) === 0 &&
                ((doc.regulatoryChecks as any[] | null)?.filter((c: any) => !c.passed)?.length ?? 0) === 0 && (
                  <p className="text-muted-foreground">No specific issues recorded.</p>
                )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Additional instructions (optional)</label>
            <textarea
              value={regenNotes}
              onChange={(e) => setRegenNotes(e.target.value)}
              placeholder="e.g. 'Include more detail on safety margins' or 'Address the ICH E6 concern'"
              className="w-full h-24 px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={regenerating}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRegenerate} disabled={regenerating} className="gap-1.5">
            {regenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate Document
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// --- Main Page ---

export default function BioProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const [program, setProgram] = useState<BioProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProgram = useCallback(async () => {
    try {
      const res = await fetch(`/api/bio/programs/${programId}`);
      if (!res.ok) throw new Error("Failed to load program");
      const data = await res.json();
      setProgram(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load program");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  // Polling when processing
  const fetchRef = useRef(fetchProgram);
  useEffect(() => {
    fetchRef.current = fetchProgram;
  }, [fetchProgram]);

  useEffect(() => {
    if (!program || !PROCESSING_STATUSES.includes(program.status)) return;
    const interval = setInterval(() => fetchRef.current(), 10000);
    return () => clearInterval(interval);
  }, [program]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/bio/programs/${programId}/analyze`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start analysis");
      }
      toast.success("Analysis pipeline started");
      fetchProgram();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `/api/bio/programs/${programId}/documents`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || `Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} document${successCount !== 1 ? "s" : ""} uploaded`
        );
        fetchProgram();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/bio/programs/${programId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete program");
      }
      toast.success("Program deleted");
      router.push("/dashboard/bio");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete program"
      );
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

  if (error || !program) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Program not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessing = PROCESSING_STATUSES.includes(program.status);
  const canAnalyze =
    ["CREATED", "UPLOADING", "COMPLETE", "ERROR"].includes(program.status) &&
    program.bioDocuments.length > 0;

  const riskFlags = program.bioAnalysis?.riskFlags;
  const riskFlagArray: Array<{
    severity: string;
    title: string;
    description: string;
    regulation?: string;
  }> = Array.isArray(riskFlags) ? riskFlags : [];

  const regulatoryFlags = program.bioAnalysis?.regulatoryFlags;
  const regulatoryFlagArray: Array<{
    regulation: string;
    description: string;
    severity: string;
  }> = Array.isArray(regulatoryFlags) ? regulatoryFlags : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard/bio"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Bio Programs
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {program.name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {program.drugName && (
              <span className="text-lg font-medium text-muted-foreground">
                {program.drugName}
              </span>
            )}
            {program.drugClass && (
              <Badge
                variant="outline"
                className="border-emerald-600/30 text-emerald-600"
              >
                {DRUG_CLASS_LABELS[program.drugClass] ?? program.drugClass}
              </Badge>
            )}
            {program.phase && (
              <Badge variant="secondary">
                {PHASE_LABELS[program.phase] ?? program.phase}
              </Badge>
            )}
            <BioStatusBadge status={program.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {analyzing || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isProcessing ? "Processing..." : "Starting..."}
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Permanently delete this program?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    This will permanently delete{" "}
                    <strong>{program.name}</strong> and all associated data
                    including uploaded documents, extractions, analysis
                    results, and generated documents.
                  </span>
                  <span className="block font-semibold">
                    This action cannot be undone.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
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

      {/* Processing indicator */}
      {isProcessing && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <div>
                <p className="font-medium text-sm">Pipeline in progress</p>
                <p className="text-xs text-muted-foreground">
                  Currently: {program.status.replace(/_/g, " ").toLowerCase()}.
                  This page will refresh automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {program.status === "ERROR" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Pipeline Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {program.errorMessage || "An error occurred during processing."}
              {program.errorStep && (
                <span className="ml-1 text-xs opacity-75">
                  (Step: {program.errorStep})
                </span>
              )}
            </span>
            <Button
              size="sm"
              disabled={analyzing}
              className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAnalyze}
            >
              {analyzing ? (
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
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx"
              onChange={handleUpload}
              className="hidden"
              id="bio-file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isProcessing}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              PDF, DOCX, PNG, JPEG, TIFF (max 50MB)
            </span>
          </div>

          {program.bioDocuments.length > 0 ? (
            <div className="rounded-lg border divide-y">
              {program.bioDocuments.map((doc) => {
                const docStatus =
                  DOC_STATUS_CONFIG[doc.status] ?? {
                    label: doc.status,
                    color: "text-muted-foreground",
                  };
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.fileSize)}
                          </span>
                          {doc.docType && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-600/30 text-emerald-600"
                            >
                              {doc.docType.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${docStatus.color} flex-shrink-0`}
                    >
                      {docStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {(riskFlagArray.length > 0 || regulatoryFlagArray.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {program.bioAnalysis?.riskScore != null && (
              <div className="flex items-center gap-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Risk Score
                  </p>
                  <p
                    className={`text-2xl font-semibold tracking-tight mt-0.5 tabular-nums ${
                      (program.bioAnalysis.riskScore * 10) <= 3
                        ? "text-emerald-600"
                        : (program.bioAnalysis.riskScore * 10) <= 6
                          ? "text-amber-600"
                          : "text-destructive"
                    }`}
                  >
                    {(program.bioAnalysis.riskScore * 10).toFixed(1)}/10
                  </p>
                </div>
              </div>
            )}

            {/* Risk flags */}
            {riskFlagArray.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Risk Flags
                </p>
                <div className="space-y-2">
                  {riskFlagArray.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      {flag.severity === "high" ||
                      flag.severity === "critical" ? (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      ) : flag.severity === "medium" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{flag.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {flag.description}
                        </p>
                        {flag.regulation && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Ref: {flag.regulation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory flags */}
            {regulatoryFlagArray.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Regulatory Flags
                </p>
                <div className="space-y-2">
                  {regulatoryFlagArray.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {flag.regulation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {flag.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conditions */}
      {program.bioConditions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {program.bioConditions.map((cond) => (
              <div
                key={cond.id}
                className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                    cond.status === "SATISFIED"
                      ? "bg-emerald-500"
                      : cond.priority === "required"
                        ? "bg-destructive"
                        : "bg-amber-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{cond.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cond.regulation && (
                      <span className="text-[10px] text-muted-foreground">
                        {cond.regulation}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {cond.category.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant={
                        cond.status === "SATISFIED"
                          ? "default"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {cond.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generated Documents */}
      {program.bioGeneratedDocuments.length > 0 && (
        <div className="space-y-4 mb-6">
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">
                      IND Document Package
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {
                        program.bioGeneratedDocuments.filter(
                          (d) => d.complianceStatus === "PASSED"
                        ).length
                      }{" "}
                      of {program.bioGeneratedDocuments.length} documents
                      passed compliance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      program.bioGeneratedDocuments.every(
                        (d) => d.complianceStatus === "PASSED"
                      )
                        ? "default"
                        : "destructive"
                    }
                  >
                    {program.bioGeneratedDocuments.every(
                      (d) => d.complianceStatus === "PASSED"
                    )
                      ? "All Checks Passed"
                      : "Review Required"}
                  </Badge>
                  {program.status === "COMPLETE" && program.bioGeneratedDocuments.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={async () => {
                        toast.info("Preparing download...");
                        try {
                          const res = await fetch(`/api/bio/programs/${programId}/download-all`);
                          if (!res.ok) throw new Error("Download failed");
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(program.drugName ?? "IND").replace(/[^a-zA-Z0-9_\s-]/g, "").replace(/\s+/g, "_")}_IND_Package.zip`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Download started");
                        } catch {
                          toast.error("Failed to download package");
                        }
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download All
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {program.bioGeneratedDocuments.map((doc) => (
            <BioGenDocCard key={doc.id} doc={doc} onRefresh={fetchProgram} />
          ))}
        </div>
      )}

      {/* Program Info Footer */}
      <Separator className="my-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {program.sponsorName && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Sponsor
            </p>
            <p className="mt-0.5">{program.sponsorName}</p>
          </div>
        )}
        {program.target && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Target
            </p>
            <p className="mt-0.5">{program.target}</p>
          </div>
        )}
        {program.mechanism && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs font-medium">
              Mechanism
            </p>
            <p className="mt-0.5">{program.mechanism}</p>
          </div>
        )}
        {program.indication && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs font-medium">
              Indication
            </p>
            <p className="mt-0.5">{program.indication}</p>
          </div>
        )}
        {program.antibodyType && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Antibody
            </p>
            <p className="mt-0.5">{program.antibodyType}</p>
          </div>
        )}
        {program.linkerType && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Linker
            </p>
            <p className="mt-0.5">{program.linkerType}</p>
          </div>
        )}
        {program.payloadType && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Payload
            </p>
            <p className="mt-0.5">{program.payloadType}</p>
          </div>
        )}
        {program.dar != null && (
          <div>
            <p className="text-muted-foreground text-xs font-medium">DAR</p>
            <p className="mt-0.5">{program.dar}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Created
          </p>
          <p className="mt-0.5">{formatDate(program.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
