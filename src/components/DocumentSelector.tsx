"use client";

import { useMemo } from "react";
import { getLoanProgram } from "@/config/loan-programs";

// Document categories for grouping
const DOC_CATEGORIES: Record<string, { label: string; docTypes: string[] }> = {
  core: {
    label: "Core Loan Documents",
    docTypes: ["promissory_note", "loan_agreement", "commitment_letter"],
  },
  security: {
    label: "Security Documents",
    docTypes: ["security_agreement", "ucc_financing_statement", "guaranty"],
  },
  cre: {
    label: "Real Estate / CRE",
    docTypes: ["assignment_of_leases", "environmental_indemnity", "snda", "estoppel_certificate"],
  },
  closing: {
    label: "Closing & Compliance",
    docTypes: [
      "settlement_statement", "borrowers_certificate", "amortization_schedule",
      "opinion_letter", "compliance_certificate", "corporate_resolution",
    ],
  },
  multicreditor: {
    label: "Multi-Creditor",
    docTypes: ["subordination_agreement", "intercreditor_agreement"],
  },
  programSpecific: {
    label: "Program-Specific",
    docTypes: ["deed_of_trust", "closing_disclosure", "loan_estimate", "sba_authorization", "cdc_debenture", "borrowing_base_agreement", "digital_asset_pledge", "custody_agreement"],
  },
};

// Labels for display — should match DOC_TYPE_LABELS from types.ts
const LABELS: Record<string, string> = {
  promissory_note: "Promissory Note",
  loan_agreement: "Loan Agreement",
  commitment_letter: "Commitment Letter",
  security_agreement: "Security Agreement",
  ucc_financing_statement: "UCC Financing Statement",
  guaranty: "Guaranty Agreement",
  assignment_of_leases: "Assignment of Leases & Rents",
  environmental_indemnity: "Environmental Indemnity",
  snda: "SNDA (Non-Disturbance)",
  estoppel_certificate: "Estoppel Certificate",
  settlement_statement: "Settlement Statement",
  borrowers_certificate: "Borrower's Certificate",
  amortization_schedule: "Amortization Schedule",
  opinion_letter: "Legal Opinion Letter",
  compliance_certificate: "Compliance Certificate",
  corporate_resolution: "Corporate Resolution",
  subordination_agreement: "Subordination Agreement",
  intercreditor_agreement: "Intercreditor Agreement",
  deed_of_trust: "Deed of Trust",
  sba_authorization: "SBA Authorization",
  cdc_debenture: "CDC Debenture",
  borrowing_base_agreement: "Borrowing Base Agreement",
  digital_asset_pledge: "Digital Asset Pledge",
  custody_agreement: "Custody Agreement",
  closing_disclosure: "Closing Disclosure",
  loan_estimate: "Loan Estimate",
};

interface DocumentSelectorProps {
  loanProgramId: string;
  selectedDocs: string[];
  onSelectionChange: (docs: string[]) => void;
}

export function DocumentSelector({ loanProgramId, selectedDocs, onSelectionChange }: DocumentSelectorProps) {
  const program = loanProgramId ? getLoanProgram(loanProgramId) : null;
  const availableDocs = program?.requiredOutputDocs ?? [];

  if (!loanProgramId || availableDocs.length === 0) {
    return null;
  }

  const allSelected = availableDocs.every((d) => selectedDocs.includes(d));

  function toggleDoc(docType: string) {
    if (selectedDocs.includes(docType)) {
      onSelectionChange(selectedDocs.filter((d) => d !== docType));
    } else {
      onSelectionChange([...selectedDocs, docType]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...availableDocs]);
    }
  }

  // Group available docs by category
  const groupedDocs = useMemo(
    () =>
      Object.entries(DOC_CATEGORIES)
        .map(([key, cat]) => ({
          key,
          label: cat.label,
          docs: cat.docTypes.filter((dt) => availableDocs.includes(dt)),
        }))
        .filter((g) => g.docs.length > 0),
    [availableDocs]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Loan Documents to Generate
        </h3>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedDocs.length} of {availableDocs.length} documents selected
      </p>

      {groupedDocs.map((group) => (
        <div key={group.key} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.docs.map((docType) => (
              <label
                key={docType}
                className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(docType)}
                  onChange={() => toggleDoc(docType)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-foreground">
                  {LABELS[docType] ?? docType}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
