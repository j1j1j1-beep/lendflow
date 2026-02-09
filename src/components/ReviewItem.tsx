"use client";

import { useState } from "react";
import { Check, AlertCircle, ChevronDown, Pencil, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReviewItemData = {
  id: string;
  fieldPath: string;
  extractedValue: string;
  expectedValue: string | null;
  checkType: string;
  description: string;
  documentPage: number | null;
  documentId: string | null;
  status: string;
  resolvedValue: string | null;
};

type Resolution = {
  itemId: string;
  status: "CONFIRMED" | "CORRECTED" | "NOTED";
  resolvedValue?: string;
  note?: string;
};

type ReviewItemComponentProps = {
  item: ReviewItemData;
  documentName?: string;
  onResolve: (resolution: Resolution) => void;
};

function cleanDescription(desc: string): string {
  return desc
    .replace(/Textract reads/gi, "Document shows")
    .replace(/but extraction shows/gi, "but our system read")
    .replace(/extraction/gi, "system")
    .replace(/\bextracted\b/gi, "found")
    .replace(/Schedule C #\d+:\s*/gi, "Schedule C: ")
    .replace(/\(line \d+\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function ReviewItemComponent({
  item,
  documentName,
  onResolve,
}: ReviewItemComponentProps) {
  const [expanded, setExpanded] = useState(true);
  const [mode, setMode] = useState<"idle" | "correct" | "note">("idle");
  const [correctedValue, setCorrectedValue] = useState("");
  const [note, setNote] = useState("");
  const [resolved, setResolved] = useState(item.status !== "PENDING");
  const [resolvedStatus, setResolvedStatus] = useState(item.status);

  const handleConfirm = () => {
    setResolved(true);
    setResolvedStatus("CONFIRMED");
    onResolve({ itemId: item.id, status: "CONFIRMED" });
  };

  const handleCorrect = () => {
    if (!correctedValue.trim()) return;
    setResolved(true);
    setResolvedStatus("CORRECTED");
    onResolve({
      itemId: item.id,
      status: "CORRECTED",
      resolvedValue: correctedValue.trim(),
    });
    setMode("idle");
  };

  const handleNote = () => {
    if (!note.trim()) return;
    setResolved(true);
    setResolvedStatus("NOTED");
    onResolve({
      itemId: item.id,
      status: "NOTED",
      note: note.trim(),
    });
    setMode("idle");
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ease-out ${
        resolved
          ? "bg-muted/30 border-border"
          : "bg-card border-chart-4/40 shadow-sm hover:shadow-md hover:border-chart-4/60"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {resolved ? (
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-chart-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium ${resolved ? "text-muted-foreground" : ""}`}>
              {cleanDescription(item.description)}
            </p>
            {resolved && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Resolved:{" "}
                {resolvedStatus === "CONFIRMED"
                  ? "Value confirmed"
                  : resolvedStatus === "CORRECTED"
                    ? `Corrected to: ${item.resolvedValue || correctedValue}`
                    : "Note added"}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && !resolved && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-[10px] font-medium text-destructive uppercase tracking-wide mb-1">
                Value Found
              </p>
              <p className="text-sm font-semibold">{item.extractedValue}</p>
            </div>
            {item.expectedValue && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="text-[10px] font-medium text-primary uppercase tracking-wide mb-1">
                  Calculated Value
                </p>
                <p className="text-sm font-semibold">{item.expectedValue}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {documentName || "Document"}{" "}
              {item.documentPage ? `(page ${item.documentPage})` : ""}
            </span>
          </div>

          {mode === "idle" && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleConfirm}>
                <Check className="h-3.5 w-3.5" />
                Value is Correct
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode("correct")}>
                <Pencil className="h-3.5 w-3.5" />
                Correct Value
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("note")}>
                <MessageSquare className="h-3.5 w-3.5" />
                Add Note
              </Button>
            </div>
          )}

          {mode === "correct" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Enter the correct value:
              </label>
              <div className="flex gap-2">
                <Input
                  value={correctedValue}
                  onChange={(e) => setCorrectedValue(e.target.value)}
                  placeholder="Enter correct value..."
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleCorrect} disabled={!correctedValue.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {mode === "note" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a note:</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain the discrepancy..."
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleNote} disabled={!note.trim()}>
                  Save Note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
