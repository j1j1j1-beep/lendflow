"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  XCircle,
  Circle,
  CloudUpload,
  FileWarning,
  FileText,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SourceDocDef } from "@/lib/source-doc-types";
import { fetchMissingSourceDocs } from "@/components/source-doc-checklist";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function MissingDocsDialog({
  open,
  onOpenChange,
  missingRequired,
  missingOptional,
  onUploadMissing,
  onContinueAnyway,
  module,
  projectId,
  onMissingUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingRequired: SourceDocDef[];
  missingOptional: SourceDocDef[];
  onUploadMissing: () => void;
  onContinueAnyway: () => void;
  module?: string;
  projectId?: string;
  onMissingUpdated?: (required: SourceDocDef[], optional: SourceDocDef[]) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const affectedOutputDocs = useMemo(() => {
    const docs = new Set<string>();
    for (const def of missingRequired) {
      for (const doc of def.affectsOutputDocs) {
        docs.add(doc);
      }
    }
    return Array.from(docs);
  }, [missingRequired]);

  const canUpload = !!module && !!projectId;

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!module || !projectId) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setUploading(true);
      let successCount = 0;

      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 50MB limit`);
          continue;
        }
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("module", module);
          fd.append("projectId", projectId);
          const res = await fetch("/api/source-documents/upload", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || "Upload failed");
          }
          successCount++;
          setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size }]);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : `Failed to upload ${file.name}`
          );
        }
      }

      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}`);

        // Re-classify and update missing docs
        try {
          const result = await fetchMissingSourceDocs(module, projectId);
          if (onMissingUpdated) {
            onMissingUpdated(result.missingRequired, result.missingOptional);
          }
        } catch {
          // Classification failed silently, user can still continue
        }
      }

      setUploading(false);
    },
    [module, projectId, onMissingUpdated]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
      }
    },
    [handleUploadFiles]
  );

  const allPresent = missingRequired.length === 0 && missingOptional.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allPresent ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            {allPresent ? "All Documents Uploaded" : "Missing Source Documents"}
          </DialogTitle>
          <DialogDescription>
            {allPresent
              ? "All required documents are present. Ready to generate."
              : missingRequired.length > 0
                ? `${missingRequired.length} required document${missingRequired.length !== 1 ? "s are" : " is"} missing.`
                : "All required documents are uploaded. Some optional documents are missing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Placeholder warning banner */}
          {missingRequired.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3">
              <div className="flex items-start gap-2.5">
                <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {affectedOutputDocs.length} output document{affectedOutputDocs.length !== 1 ? "s" : ""} will contain placeholders
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
                    Sections referencing missing source data will show{" "}
                    <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-[11px] font-mono">
                      [PENDING: Document Name]
                    </code>{" "}
                    markers. You can regenerate after uploading the missing files.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {affectedOutputDocs.map((doc) => (
                      <Badge
                        key={doc}
                        variant="outline"
                        className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30"
                      >
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Required missing docs */}
          {missingRequired.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">
                Required
              </p>
              <div className="space-y-1">
                {missingRequired.map((def) => (
                  <div key={def.key}>
                    <button
                      className="flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(def.key)}
                    >
                      <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">
                        {def.label}
                      </span>
                      <Badge variant="secondary" className="text-[9px] mr-1">
                        {def.affectsOutputDocs.length} doc{def.affectsOutputDocs.length !== 1 ? "s" : ""}
                      </Badge>
                      {expandedKeys.has(def.key) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {expandedKeys.has(def.key) && (
                      <div className="ml-7 mt-1 mb-2 space-y-1 animate-in slide-in-from-top-1 duration-150">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Will show placeholders in:
                        </p>
                        {def.affectsOutputDocs.map((docName) => (
                          <div
                            key={docName}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <FileWarning className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            {docName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional missing docs */}
          {missingOptional.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Optional
              </p>
              <div className="space-y-0.5">
                {missingOptional.map((def) => (
                  <div
                    key={def.key}
                    className="flex items-center gap-2 px-2 py-1"
                  >
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {def.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload area inside the dialog */}
          {canUpload && !allPresent && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">
                Upload More
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onClick={() => inputRef.current?.click()}
                className={`rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 ease-out ${
                  dragOver
                    ? "border-primary/50 bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-foreground/20 hover:bg-muted/50 bg-muted/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg,.webp,.tiff"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadFiles(e.target.files);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="h-6 w-6 mx-auto text-muted-foreground mb-1.5 animate-spin" />
                ) : (
                  <CloudUpload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                )}
                <p className="text-xs font-medium">
                  {uploading ? "Uploading and classifying..." : "Drop files here, or click to browse"}
                </p>
              </div>

              {/* Files uploaded in this dialog session */}
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1 bg-muted/40"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-medium truncate flex-1">{f.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatFileSize(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!canUpload && !allPresent && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onUploadMissing();
              }}
              className="gap-1.5"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Upload Missing
            </Button>
          )}
          <Button
            variant={allPresent ? "default" : missingRequired.length > 0 ? "secondary" : "default"}
            onClick={() => {
              onOpenChange(false);
              onContinueAnyway();
            }}
          >
            {allPresent
              ? "Generate Documents"
              : missingRequired.length > 0
                ? "Skip and Use Placeholders"
                : "Continue Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
