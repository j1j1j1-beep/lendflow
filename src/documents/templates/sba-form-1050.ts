// =============================================================================
// sba-form-1050.ts
// Generates a DOCX SBA Form 1050 — SBA Settlement Sheet.
// ZERO AI — pure deterministic data mapping from DocumentInput.
// Calculates net proceeds from loan amount minus all known fees and
// disbursement items. Unknown amounts use placeholder text.
// =============================================================================

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  signatureBlock,
  createTable,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, Fee } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Search fees for one matching a keyword (case-insensitive).
 * Returns the first match or null.
 */
function findFee(fees: Fee[], keyword: string): Fee | null {
  const lk = keyword.toLowerCase();
  return (
    fees.find(
      (f) =>
        f.name.toLowerCase().includes(lk) ||
        f.description.toLowerCase().includes(lk),
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSbaForm1050(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // Title
  // -------------------------------------------------------------------------
  children.push(documentTitle("SBA Form 1050"));
  children.push(spacer(2));
  children.push(
    bodyText("Settlement Sheet", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "U.S. Small Business Administration — This form records the disbursement of SBA-guaranteed loan proceeds at closing.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Loan Identification
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Loan Identification"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Borrower Name", value: input.borrowerName },
      { label: "Borrower Address", value: input.propertyAddress ?? "[BORROWER ADDRESS — TO BE COMPLETED]" },
      { label: "Lender Name", value: input.lenderName },
      { label: "SBA Loan Number", value: "[TO BE ASSIGNED]" },
      { label: "Loan Program", value: input.programName },
      { label: "Date of Settlement", value: formatDate(input.generatedAt) },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Gross Loan Amount
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Gross Loan Amount"));
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "Total Loan Amount: ", bold: true },
      { text: formatCurrency(terms.approvedAmount), bold: true },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Disbursement Breakdown
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Disbursement Breakdown"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The following table itemizes all disbursements from the gross loan proceeds at settlement.",
    ),
  );
  children.push(spacer(4));

  // Build disbursement rows
  const disbursementRows: string[][] = [];
  let totalDeductions = 0;

  // 1. SBA Guaranty Fee
  const guarantyFee = findFee(terms.fees, "guaranty");
  if (guarantyFee) {
    disbursementRows.push([
      "SBA Guaranty Fee",
      formatCurrencyDetailed(guarantyFee.amount),
      "Paid to SBA",
    ]);
    totalDeductions += guarantyFee.amount;
  } else {
    disbursementRows.push([
      "SBA Guaranty Fee",
      "[AMOUNT — TO BE COMPLETED]",
      "Paid to SBA",
    ]);
  }

  // 2. Packaging Fee
  const packagingFee = findFee(terms.fees, "packag");
  if (packagingFee) {
    disbursementRows.push([
      "Packaging Fee",
      formatCurrencyDetailed(packagingFee.amount),
      "Paid to Packager/Agent",
    ]);
    totalDeductions += packagingFee.amount;
  } else {
    disbursementRows.push([
      "Packaging Fee",
      "[AMOUNT — TO BE COMPLETED]",
      "Paid to Packager/Agent",
    ]);
  }

  // 3. Closing Costs / Attorney Fees
  const closingFee = findFee(terms.fees, "closing") ?? findFee(terms.fees, "attorney");
  if (closingFee) {
    disbursementRows.push([
      "Closing Costs / Attorney Fees",
      formatCurrencyDetailed(closingFee.amount),
      "Paid to Closing Agent/Attorney",
    ]);
    totalDeductions += closingFee.amount;
  } else {
    disbursementRows.push([
      "Closing Costs / Attorney Fees",
      "[AMOUNT — TO BE COMPLETED]",
      "Paid to Closing Agent/Attorney",
    ]);
  }

  // 4. Title Insurance
  disbursementRows.push([
    "Title Insurance",
    "[AMOUNT — TO BE COMPLETED]",
    "Paid to Title Company",
  ]);

  // 5. Appraisal Fee
  const appraisalFee = findFee(terms.fees, "appraisal");
  if (appraisalFee) {
    disbursementRows.push([
      "Appraisal Fee",
      formatCurrencyDetailed(appraisalFee.amount),
      "Paid to Appraiser",
    ]);
    totalDeductions += appraisalFee.amount;
  } else {
    disbursementRows.push([
      "Appraisal Fee",
      "[AMOUNT — TO BE COMPLETED]",
      "Paid to Appraiser",
    ]);
  }

  // 6. Recording Fees
  disbursementRows.push([
    "Recording Fees",
    "[AMOUNT — TO BE COMPLETED]",
    "Paid to County Recorder",
  ]);

  // 7. Environmental Report Fee
  const envFee = findFee(terms.fees, "environment");
  if (envFee) {
    disbursementRows.push([
      "Environmental Report",
      formatCurrencyDetailed(envFee.amount),
      "Paid to Environmental Consultant",
    ]);
    totalDeductions += envFee.amount;
  }

  // 8. Any remaining fees not yet matched
  const matchedFeeNames = new Set<string>();
  if (guarantyFee) matchedFeeNames.add(guarantyFee.name);
  if (packagingFee) matchedFeeNames.add(packagingFee.name);
  if (closingFee) matchedFeeNames.add(closingFee.name);
  if (appraisalFee) matchedFeeNames.add(appraisalFee.name);
  if (envFee) matchedFeeNames.add(envFee.name);

  for (const fee of terms.fees) {
    if (!matchedFeeNames.has(fee.name)) {
      disbursementRows.push([
        fee.name,
        formatCurrencyDetailed(fee.amount),
        fee.description || "See loan documents",
      ]);
      totalDeductions += fee.amount;
    }
  }

  // 9. Placeholder rows for other items
  disbursementRows.push([
    "Other: ____________________",
    "[AMOUNT — TO BE COMPLETED]",
    "[PAYEE — TO BE COMPLETED]",
  ]);
  disbursementRows.push([
    "Other: ____________________",
    "[AMOUNT — TO BE COMPLETED]",
    "[PAYEE — TO BE COMPLETED]",
  ]);

  children.push(
    createTable(
      ["Disbursement Item", "Amount", "Paid To"],
      disbursementRows,
      { columnWidths: [40, 30, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Settlement Summary"));
  children.push(spacer(4));

  const knownDeductions = totalDeductions;
  const netProceeds = terms.approvedAmount - knownDeductions;

  children.push(
    createTable(
      ["Description", "Amount"],
      [
        ["Gross Loan Amount", formatCurrencyDetailed(terms.approvedAmount)],
        [
          "Total Known Deductions (from fees above)",
          `(${formatCurrencyDetailed(knownDeductions)})`,
        ],
        [
          "Additional Deductions (to be completed at closing)",
          "[TO BE DETERMINED]",
        ],
        [
          "NET PROCEEDS TO BORROWER (estimated, pending final amounts)",
          formatCurrencyDetailed(netProceeds),
        ],
      ],
      { columnWidths: [60, 40], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Note: Net proceeds shown above are estimated based on currently known fees. Final net proceeds will be determined at closing when all disbursement amounts are confirmed. Items marked \"TO BE COMPLETED\" must be finalized prior to settlement.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Pay to Borrower
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Disbursement Instructions"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      {
        label: "Pay to Borrower",
        value: `${input.borrowerName} — ${formatCurrency(netProceeds)} (estimated)`,
      },
      {
        label: "Disbursement Method",
        value: "[WIRE TRANSFER / CHECK — TO BE COMPLETED]",
      },
      {
        label: "Account Number",
        value: "[ACCOUNT — TO BE COMPLETED]",
      },
      {
        label: "Routing Number",
        value: "[ROUTING — TO BE COMPLETED]",
      },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Certification
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Certification"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "I certify that the above accurately reflects the disbursement of SBA loan proceeds in connection with the loan identified above. All charges and fees are in compliance with SBA regulations, including SOP 50 10 and 13 CFR Part 120.",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Any material discrepancy between the amounts listed above and the actual settlement figures must be reported to the SBA and reconciled prior to final disbursement.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // Signature Blocks
  // -------------------------------------------------------------------------
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));
  children.push(
    bodyTextRuns([
      { text: "Date: ", bold: true },
      { text: formatDate(input.generatedAt) },
    ]),
  );

  children.push(spacer(12));

  children.push(
    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Authorized Lender Officer"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));
  children.push(bodyText("Date: ____________________________"));

  children.push(spacer(12));

  children.push(
    bodyText("SETTLEMENT AGENT (if applicable):", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock("____________________________", "Settlement Agent"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Date: ____________________________"));

  // -------------------------------------------------------------------------
  // Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "SBA Form 1050 — Settlement Sheet",
    headerRight: `SBA Form 1050 — ${input.borrowerName}`,
    children,
  });
}
