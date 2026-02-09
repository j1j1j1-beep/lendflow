"use client";

import { Check } from "lucide-react";
import { getLoanProgram } from "@/config/loan-programs";

type DocumentChecklistProps = {
  loanProgramId: string;
  uploadedDocTypes: string[];
};

export function DocumentChecklist({
  loanProgramId,
  uploadedDocTypes,
}: DocumentChecklistProps) {
  const program = loanProgramId ? getLoanProgram(loanProgramId) : null;

  if (!program) return null;

  function isUploaded(docType: string): boolean {
    const normalized = docType.toLowerCase();
    return uploadedDocTypes.some(
      (uploaded) => uploaded.toLowerCase() === normalized
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Required Documents</h4>
        <div className="space-y-1.5">
          {program.requiredDocuments.map((doc) => {
            const uploaded = isUploaded(doc.docType);
            return (
              <div
                key={doc.docType}
                className="flex items-center gap-2.5 text-sm py-1"
              >
                {uploaded ? (
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span
                  className={
                    uploaded ? "text-muted-foreground line-through" : ""
                  }
                >
                  {doc.label}
                  {doc.yearsNeeded ? ` \u2014 ${doc.yearsNeeded} years` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {program.optionalDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Optional / Helpful
          </h4>
          <div className="space-y-1.5">
            {program.optionalDocuments.map((doc) => {
              const uploaded = isUploaded(doc.docType);
              return (
                <div
                  key={doc.docType}
                  className="flex items-center gap-2.5 text-sm py-1"
                >
                  {uploaded ? (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                  )}
                  <span
                    className={
                      uploaded
                        ? "text-muted-foreground/60 line-through"
                        : "text-muted-foreground"
                    }
                  >
                    {doc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
