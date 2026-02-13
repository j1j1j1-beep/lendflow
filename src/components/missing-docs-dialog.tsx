"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  XCircle,
  Circle,
  Upload,
  FileWarning,
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

export function MissingDocsDialog({
  open,
  onOpenChange,
  missingRequired,
  missingOptional,
  onUploadMissing,
  onContinueAnyway,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingRequired: SourceDocDef[];
  missingOptional: SourceDocDef[];
  onUploadMissing: () => void;
  onContinueAnyway: () => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Compute unique affected output docs across all missing required
  const affectedOutputDocs = useMemo(() => {
    const docs = new Set<string>();
    for (const def of missingRequired) {
      for (const doc of def.affectsOutputDocs) {
        docs.add(doc);
      }
    }
    return Array.from(docs);
  }, [missingRequired]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Missing Source Documents
          </DialogTitle>
          <DialogDescription>
            {missingRequired.length > 0
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
                Required — will produce placeholders
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
                Optional — recommended but not blocking
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onUploadMissing();
            }}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Missing
          </Button>
          <Button
            variant={missingRequired.length > 0 ? "secondary" : "default"}
            onClick={() => {
              onOpenChange(false);
              onContinueAnyway();
            }}
          >
            {missingRequired.length > 0
              ? "Continue with Placeholders"
              : "Continue Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
