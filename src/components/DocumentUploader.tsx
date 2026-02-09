"use client";

import { useCallback, useRef, useState } from "react";
import { CloudUpload, FileText, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type DocumentUploaderProps = {
  onFilesSelected: (files: File[]) => void;
  files: File[];
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 25;

export function DocumentUploader({
  onFilesSelected,
  files,
}: DocumentUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const validFiles: File[] = [];

      if (files.length + Array.from(incoming).length > MAX_FILE_COUNT) {
        setError(`Maximum ${MAX_FILE_COUNT} files allowed.`);
        return;
      }

      for (const file of Array.from(incoming)) {
        if (file.type !== "application/pdf") {
          setError("Only PDF files are accepted.");
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} exceeds the 50MB limit.`);
          continue;
        }
        if (!files.some((f) => f.name === file.name && f.size === file.size)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        onFilesSelected([...files, ...validFiles]);
      }
    },
    [files, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [validateAndAdd]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndAdd(e.target.files);
      }
      e.target.value = "";
    },
    [validateAndAdd]
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index);
      onFilesSelected(updated);
    },
    [files, onFilesSelected]
  );

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ease-out ${
          dragOver
            ? "border-primary/50 bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5"
            : "border-border hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <CloudUpload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          Drop PDF files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF only, up to 50MB per file
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-all duration-150 ease-out hover:border-foreground/15 hover:shadow-sm animate-fade-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-destructive shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
