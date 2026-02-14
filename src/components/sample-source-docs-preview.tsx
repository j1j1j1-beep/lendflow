"use client";

import { useState } from "react";
import { FileText, ChevronDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDocType(docType: string): string {
  return docType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Pnl", "P&L")
    .replace("Ocr", "OCR")
    .replace("Ppe", "PP&E")
    .replace("Form 1040", "Form 1040 (Personal Tax Return)")
    .replace("Schedule C", "Schedule C (Business Income)")
    .replace("Schedule E", "Schedule E (Rental Income)");
}

/* ------------------------------------------------------------------ */
/*  Non-Lending Preview (Capital, M&A, Syndication, Compliance)        */
/*  Shows OCR text content in collapsible sections                     */
/* ------------------------------------------------------------------ */

interface SampleSourceDocsPreviewProps {
  docs: Record<string, string>;
  onClear: () => void;
}

export function SampleSourceDocsPreview({
  docs,
  onClear,
}: SampleSourceDocsPreviewProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const entries = Object.entries(docs);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Sample Source Documents
        </CardTitle>
        <CardDescription>
          {entries.length} pre-loaded document{entries.length !== 1 ? "s" : ""}{" "}
          included with this sample deal. Expand to preview content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([docType, content]) => (
          <Collapsible
            key={docType}
            open={openItems.has(docType)}
            onOpenChange={() => toggleItem(docType)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {formatDocType(docType)}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  openItems.has(docType) ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 rounded-lg border bg-muted/30 p-4">
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                  {content.slice(0, 2000)}
                  {content.length > 2000 && "\n\n... (preview truncated)"}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Use Your Own Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Lending Preview                                                    */
/*  Shows extraction document list (structured JSON, not OCR text)     */
/* ------------------------------------------------------------------ */

interface LendingDocument {
  docType: string;
  fileName: string;
  year?: number;
}

interface LendingSampleDocsPreviewProps {
  documents: LendingDocument[];
  onClear: () => void;
}

export function LendingSampleDocsPreview({
  documents,
  onClear,
}: LendingSampleDocsPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Sample Source Documents
        </CardTitle>
        <CardDescription>
          {documents.length} pre-extracted document
          {documents.length !== 1 ? "s" : ""} included with this sample deal.
          Data has been verified and is ready for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {documents.map((doc, i) => (
          <div
            key={`${doc.docType}-${doc.year ?? i}`}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDocType(doc.docType)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {doc.year && <span>{doc.year}</span>}
              <span className="truncate max-w-[180px]">{doc.fileName}</span>
            </div>
          </div>
        ))}

        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Use Your Own Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
