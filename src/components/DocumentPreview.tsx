"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Loader2,
  Download,
  FileText,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LegalIssue = {
  severity: string;
  section: string;
  description: string;
  recommendation: string;
};

type ComplianceCheck = {
  name: string;
  regulation: string;
  category: "required" | "standard" | "regulatory" | "cross_document";
  passed: boolean;
  note?: string;
};

type VerificationIssue = {
  field: string;
  expected: string;
  found: string;
  severity: string;
};

type DocumentPreviewProps = {
  documentId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, use this URL for download (S3 presigned) */
  directUrl?: string | null;
  /** Document review status — "REVIEWED" or "FLAGGED" */
  status?: string;
  /** Legal issues from compliance review */
  legalIssues?: LegalIssue[];
  /** Compliance checklist results */
  complianceChecks?: ComplianceCheck[];
  /** Field verification mismatches */
  verificationIssues?: VerificationIssue[];
  /** Called after inline edit is saved successfully */
  onSaved?: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

function isImage(fileName: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(fileName);
}

function isDocx(fileName: string): boolean {
  return /\.docx$/i.test(fileName);
}

const CATEGORY_LABELS: Record<string, string> = {
  required: "Required Provisions",
  standard: "Standard Checks",
  regulatory: "Regulatory Compliance",
  cross_document: "Cross-Document Consistency",
};

const CATEGORY_ORDER: string[] = [
  "required",
  "regulatory",
  "standard",
  "cross_document",
];

function groupByCategory(checks: ComplianceCheck[]): Record<string, ComplianceCheck[]> {
  const groups: Record<string, ComplianceCheck[]> = {};
  for (const check of checks) {
    const cat = check.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(check);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Compliance Panel (right side)
// ---------------------------------------------------------------------------

function CompliancePanel({
  status,
  legalIssues,
  complianceChecks,
  verificationIssues,
}: {
  status?: string;
  legalIssues?: LegalIssue[];
  complianceChecks?: ComplianceCheck[];
  verificationIssues?: VerificationIssue[];
}) {
  const isPassed =
    status === "REVIEWED" || status === "Passed" || status === "passed";
  const grouped = complianceChecks ? groupByCategory(complianceChecks) : {};

  return (
    <div className="doc-viewer-panel flex flex-col h-full border-l bg-muted/20">
      {/* Status badge */}
      <div className="px-4 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          {isPassed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge
            className={
              isPassed
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {isPassed ? "Passed" : "Review Required"}
          </Badge>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Compliance checks by category */}
        {complianceChecks && complianceChecks.length > 0 && (
          <div className="p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compliance Checks
            </h4>
            {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map(
              (cat) => (
                <div key={cat} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  <div className="space-y-1.5">
                    {grouped[cat].map((check, idx) => (
                      <div
                        key={`${cat}-${idx}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        {check.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={
                              check.passed
                                ? "text-muted-foreground"
                                : "text-foreground font-medium"
                            }
                          >
                            {check.name}
                          </p>
                          {check.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {check.note}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {check.regulation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Legal issues */}
        {legalIssues && legalIssues.length > 0 && (
          <div className="p-4 space-y-3 border-t">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal Review
            </h4>
            <div className="space-y-3">
              {legalIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-background p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        issue.severity === "critical"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }
                    >
                      {issue.severity === "critical" ? "auto-resolved" : "note"}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {issue.section}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {issue.description}
                  </p>
                  {issue.recommendation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {issue.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification issues */}
        {verificationIssues && verificationIssues.length > 0 && (
          <div className="p-4 space-y-3 border-t">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Verification
            </h4>
            <div className="space-y-2">
              {verificationIssues.map((vi, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-background p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        vi.severity === "critical"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      {vi.severity}
                    </Badge>
                    <span className="text-sm font-medium">{vi.field}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="text-foreground">{vi.expected}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Found: </span>
                      <span className="text-foreground">{vi.found}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!complianceChecks || complianceChecks.length === 0) &&
          (!legalIssues || legalIssues.length === 0) &&
          (!verificationIssues || verificationIssues.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm text-muted-foreground">All Checks Passed</p>
            </div>
          )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DocumentPreview({
  documentId,
  fileName,
  open,
  onOpenChange,
  directUrl,
  status,
  legalIssues,
  complianceChecks,
  verificationIssues,
  onSaved,
}: DocumentPreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasComplianceData =
    (legalIssues && legalIssues.length > 0) ||
    (complianceChecks && complianceChecks.length > 0) ||
    (verificationIssues && verificationIssues.length > 0) ||
    !!status;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDownloadUrl(null);
      setViewUrl(null);
      setError(null);
      setLoading(false);
      setDocxBlob(null);
      setEditing(false);
      setSaving(false);
      return;
    }

    // For non-DOCX files: use directUrl for viewing
    if (directUrl) {
      setViewUrl(directUrl);
      setDownloadUrl(directUrl);
    }

    // For DOCX files: fetch blob through proxy
    if (isDocx(fileName) && documentId) {
      setLoading(true);
      setDownloadUrl(directUrl ?? null);
      fetch(`/api/generated-documents/${documentId}/content`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to load document");
          }
          return res.blob();
        })
        .then((blob) => {
          setDocxBlob(blob);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load document");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, documentId, directUrl, fileName]);

  // Render DOCX blob into container when both are ready
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
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render document");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [docxBlob]);

  // ---------------------------------------------------------------------------
  // Inline editing handlers
  // ---------------------------------------------------------------------------

  const handleEdit = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.contentEditable = "true";
    containerRef.current.classList.add("doc-viewer-editable");
    setEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (!containerRef.current || !docxBlob) return;
    containerRef.current.contentEditable = "false";
    containerRef.current.classList.remove("doc-viewer-editable");
    setEditing(false);

    // Re-render the original blob to discard edits
    let cancelled = false;
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        await renderAsync(docxBlob, containerRef.current, undefined, {
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
      } catch {
        // Ignore render errors on cancel
      }
    })();
  }, [docxBlob]);

  const handleSave = useCallback(async () => {
    if (!containerRef.current || !documentId) return;
    setSaving(true);
    try {
      const html = containerRef.current.innerHTML;
      const res = await fetch(
        `/api/generated-documents/${documentId}/content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save document");
      }
      toast.success("Document saved");
      containerRef.current.contentEditable = "false";
      containerRef.current.classList.remove("doc-viewer-editable");
      setEditing(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save document"
      );
    } finally {
      setSaving(false);
    }
  }, [documentId, onSaved]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const canPreviewInline = isPdf(fileName) || isImage(fileName);
  const showEditButton =
    isDocx(fileName) && hasComplianceData && !loading && !error && docxBlob;

  // Wider dialog when compliance panel is visible
  const dialogSizeClass = hasComplianceData
    ? "max-w-7xl w-[98vw]"
    : "max-w-5xl w-[95vw]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${dialogSizeClass} h-[85vh] flex flex-col gap-0 p-0 overflow-hidden`}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between gap-4 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
              {isImage(fileName) ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{fileName}</DialogTitle>
              <DialogDescription className="sr-only">
                Document preview for {fileName}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mr-10">
            {/* Edit / Save / Cancel buttons */}
            {showEditButton && !editing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={saving}
                  onClick={handleCancelEdit}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            )}
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>

        {/* Content — split or full width */}
        <div className="flex-1 min-h-0 flex">
          {/* Document viewer area */}
          <div
            className={
              hasComplianceData
                ? "doc-viewer-split doc-viewer-content flex-1 min-w-0 overflow-auto"
                : "flex-1 min-h-0 overflow-auto"
            }
          >
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading document...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            )}

            {!loading &&
              !error &&
              viewUrl &&
              canPreviewInline &&
              isPdf(fileName) && (
                <iframe
                  src={viewUrl}
                  title={`Preview of ${fileName}`}
                  className="w-full h-full border-0 bg-muted/30"
                  sandbox="allow-same-origin allow-scripts"
                />
              )}

            {!loading &&
              !error &&
              viewUrl &&
              canPreviewInline &&
              isImage(fileName) && (
                <div className="flex items-center justify-center h-full p-6 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              )}

            {/* DOCX render target — always in DOM so ref is ready */}
            {isDocx(fileName) && (
              <div
                ref={containerRef}
                className="docx-container bg-white"
                style={{
                  display: loading || error || !docxBlob ? "none" : "block",
                }}
              />
            )}

            {!loading &&
              !error &&
              viewUrl &&
              !canPreviewInline &&
              !isDocx(fileName) && (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Preview not available
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This file type cannot be previewed in the browser. Use the
                      download button above.
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Compliance panel (right side) — only when data is present */}
          {hasComplianceData && (
            <div className="w-[380px] shrink-0">
              <CompliancePanel
                status={status}
                legalIssues={legalIssues}
                complianceChecks={complianceChecks}
                verificationIssues={verificationIssues}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
