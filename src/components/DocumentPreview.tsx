"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Download, FileText, AlertCircle, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DocumentPreviewProps = {
  documentId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, use this URL for download (S3 presigned) */
  directUrl?: string | null;
};

function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

function isImage(fileName: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(fileName);
}

function isDocx(fileName: string): boolean {
  return /\.docx$/i.test(fileName);
}

export function DocumentPreview({
  documentId,
  fileName,
  open,
  onOpenChange,
  directUrl,
}: DocumentPreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDownloadUrl(null);
      setViewUrl(null);
      setError(null);
      setLoading(false);
      setDocxBlob(null);
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

  const canPreviewInline = isPdf(fileName) || isImage(fileName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
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
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="shrink-0 mr-10"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
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

          {!loading && !error && viewUrl && canPreviewInline && isPdf(fileName) && (
            <iframe
              src={viewUrl}
              title={`Preview of ${fileName}`}
              className="w-full h-full border-0 bg-muted/30"
              sandbox="allow-same-origin allow-scripts"
            />
          )}

          {!loading && !error && viewUrl && canPreviewInline && isImage(fileName) && (
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
              style={{ display: loading || error || !docxBlob ? "none" : "block" }}
            />
          )}

          {!loading && !error && viewUrl && !canPreviewInline && !isDocx(fileName) && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Preview not available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This file type cannot be previewed in the browser. Use the download button above.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
