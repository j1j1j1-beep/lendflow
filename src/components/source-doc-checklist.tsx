"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CloudUpload,
  Trash2,
  Loader2,
  FileText,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleName, SourceDocDef } from "@/lib/source-doc-types";
import { SOURCE_DOCS } from "@/lib/source-doc-types";

type UploadedDoc = {
  id: string;
  docType: string | null;
  fileName: string;
  fileSize: number;
  classificationConfidence: number | null;
  createdAt: string;
};

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg,.webp,.tiff";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function SourceDocChecklist({
  module,
  projectId,
}: {
  module: ModuleName;
  projectId: string;
}) {
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/source-documents?module=${module}&projectId=${projectId}`,
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setUploaded(data.docs);
    } catch {
      // Silent — checklist will show empty state
    } finally {
      setLoading(false);
    }
  }, [module, projectId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} exceeds 50MB limit`);
      return;
    }
    if (file.size <= 0) {
      toast.error(`${file.name} is empty`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("module", module);
    formData.append("projectId", projectId);

    const res = await fetch("/api/source-documents/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed for ${file.name}`);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of fileArr) {
      try {
        await uploadFile(file);
        successCount++;
      } catch (err) {
        errorCount++;
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}`);
      fetchDocs();
    }
    setUploading(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [module, projectId],
  );

  const handleDelete = async (docId: string, fileName: string) => {
    setDeleting(docId);
    try {
      const res = await fetch(`/api/source-documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`Removed ${fileName}`);
      fetchDocs();
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setDeleting(null);
    }
  };

  // Find the label for a classified docType
  const defs = SOURCE_DOCS[module] ?? [];
  const getDocTypeLabel = (docType: string | null): string | null => {
    if (!docType) return null;
    const def = defs.find((d) => d.key === docType);
    return def?.label ?? docType;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading source documents...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="source-doc-checklist">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Source Documents</CardTitle>
          {uploaded.length > 0 && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {uploaded.length} uploaded
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Drop supporting documents here (PDF, DOCX, XLSX, images). They will be
          analyzed and classified automatically when you generate.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onClick={() => inputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ease-out ${
            dragOver
              ? "border-primary/50 bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5"
              : "border-border hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm bg-muted/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
              e.target.value = "";
            }}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
          ) : (
            <CloudUpload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium">
            {uploading ? "Uploading..." : "Drop files here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, XLSX, or images up to 50MB each
          </p>
        </div>

        {/* Uploaded files list */}
        {uploaded.length > 0 && (
          <div className="space-y-1.5">
            {uploaded.map((doc) => {
              const typeLabel = getDocTypeLabel(doc.docType);
              const isThisDeleting = deleting === doc.id;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 -mx-3 transition-all duration-150 hover:bg-muted/40"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  {typeLabel && (
                    <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {typeLabel}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    disabled={isThisDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id, doc.fileName);
                    }}
                  >
                    {isThisDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Expose a helper for pages to call the classify endpoint and get missing doc info */
export async function fetchMissingSourceDocs(
  module: string,
  projectId: string,
): Promise<{
  missing: SourceDocDef[];
  missingRequired: SourceDocDef[];
  missingOptional: SourceDocDef[];
  classifying: boolean;
}> {
  // Call the classify endpoint which classifies unclassified docs and returns missing info
  try {
    const res = await fetch("/api/source-documents/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, projectId }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        missing: [...(data.missingRequired ?? []), ...(data.missingOptional ?? [])],
        missingRequired: data.missingRequired ?? [],
        missingOptional: data.missingOptional ?? [],
        classifying: false,
      };
    }
  } catch {
    // Fall back to simple client-side check
  }

  // Fallback: use the definitions + GET endpoint
  const defs = SOURCE_DOCS[module as ModuleName] ?? [];
  const res = await fetch(
    `/api/source-documents?module=${module}&projectId=${projectId}`,
  );
  const uploadedKeys = new Set<string>();
  if (res.ok) {
    const data = await res.json();
    for (const doc of data.docs) {
      if (doc.docType) uploadedKeys.add(doc.docType);
    }
  }
  const missing = defs.filter((d) => !uploadedKeys.has(d.key));
  return {
    missing,
    missingRequired: missing.filter((d) => d.required),
    missingOptional: missing.filter((d) => !d.required),
    classifying: false,
  };
}
