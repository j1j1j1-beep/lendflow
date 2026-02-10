// =============================================================================
// irs-w9.ts
// Generates a DOCX IRS Form W-9 — Request for Taxpayer Identification Number
// and Certification. ZERO AI — pure deterministic data mapping.
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
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map entityType to W-9 federal tax classification language.
 */
function getFederalTaxClassification(
  entityType: string | null | undefined,
): string {
  switch (entityType) {
    case "llc":
      return "Limited Liability Company (LLC) \u2014 [Enter tax classification: C=C corporation, S=S corporation, P=Partnership]";
    case "corporation":
      return "C Corporation / S Corporation [CHECK APPLICABLE]";
    case "partnership":
      return "Partnership";
    case "sole_proprietor":
      return "Individual / Sole Proprietor or Single-Member LLC";
    default:
      return "[CHECK APPLICABLE: Individual/Sole Proprietor, C Corporation, S Corporation, Partnership, Trust/Estate, LLC]";
  }
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildIrsW9(input: DocumentInput): Document {
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // 1. Title
  // -------------------------------------------------------------------------
  children.push(
    documentTitle(
      "IRS Form W-9 \u2014 Request for Taxpayer Identification Number and Certification",
    ),
  );
  children.push(spacer(4));

  // -------------------------------------------------------------------------
  // 2. Purpose
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Per IRS Form W-9 (Rev. March 2024). Give Form W-9 to the requester. Do not send to the IRS.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 3. Lines 1-2 — Name and Business Name
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Name and Entity Information"));

  const address =
    input.debtorAddress ?? input.propertyAddress ?? "[ADDRESS \u2014 TO BE COMPLETED]";

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["1", "Name (as shown on your income tax return)", input.borrowerName],
        ["2", "Business name / disregarded entity name, if different from above", "[BUSINESS NAME IF DIFFERENT]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 4. Line 3 — Federal Tax Classification
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Federal Tax Classification"));

  const taxClassification = getFederalTaxClassification(input.entityType);

  children.push(
    bodyTextRuns([
      { text: "Line 3 \u2014 Federal tax classification: ", bold: true },
      { text: taxClassification },
    ]),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Classification", "Selected"],
      [
        ["Individual / Sole Proprietor or Single-Member LLC", input.entityType === "sole_proprietor" ? "[X]" : "[ ]"],
        ["C Corporation", input.entityType === "corporation" ? "[X]" : "[ ]"],
        ["S Corporation", "[ ]"],
        ["Partnership", input.entityType === "partnership" ? "[X]" : "[ ]"],
        ["Trust / Estate", "[ ]"],
        ["Limited Liability Company (LLC)", input.entityType === "llc" ? "[X]" : "[ ]"],
        ["Other (see instructions)", "[ ]"],
      ],
      { columnWidths: [70, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 5. Line 4 — Exemptions
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Exemptions"));

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["4a", "Exempt payee code (if any)", "[IF APPLICABLE]"],
        ["4b", "Exemption from FATCA reporting code (if any)", "[IF APPLICABLE]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 6. Lines 5-6 — Address
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Address"));

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["5", "Address (number, street, and apt. or suite no.)", address],
        ["6", "City, state, and ZIP code", "[PARSED FROM ADDRESS ABOVE]"],
        ["7", "List account number(s) here (optional)", "[ACCOUNT NUMBER(S)]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 7. Part I — Taxpayer Identification Number (TIN)
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Part I \u2014 Taxpayer Identification Number (TIN)"));

  children.push(
    bodyText(
      "Enter your TIN in the appropriate box. The TIN provided must match the name given on line 1 to avoid backup withholding.",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Type", "Number"],
      [
        ["Social Security Number (SSN)", "[SSN \u2014 TO BE COMPLETED]"],
        ["Employer Identification Number (EIN)", "[EIN \u2014 TO BE COMPLETED]"],
      ],
      { columnWidths: [50, 50], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 8. Part II — Certification
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Part II \u2014 Certification"));

  children.push(
    bodyText(
      "Under penalties of perjury, I certify that:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "(1) The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); and",
    ),
  );
  children.push(spacer(2));

  children.push(
    bodyText(
      "(2) I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding; and",
    ),
  );
  children.push(spacer(2));

  children.push(
    bodyText(
      "(3) I am a U.S. citizen or other U.S. person (defined in the instructions); and",
    ),
  );
  children.push(spacer(2));

  children.push(
    bodyText(
      "(4) The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Certification instructions: You must cross out item 2 above if you have been notified by the IRS that you are currently subject to backup withholding because you have failed to report all interest and dividends on your tax return.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 9. Signature
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Signature"));

  children.push(
    bodyText(
      "Sign Here: The signing of this form is an acknowledgment that the information provided is accurate and complete.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText("TAXPAYER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Taxpayer / Authorized Representative"),
  );

  children.push(spacer(4));
  children.push(bodyText(`Date: ${formatDate(input.generatedAt)}`));

  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 10. Requester Information
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Requester Information"));

  children.push(
    keyTermsTable([
      { label: "Requester\u2019s Name", value: input.lenderName },
      { label: "Requester\u2019s Address", value: "[LENDER ADDRESS]" },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 11. Reference
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Per IRS Form W-9 (Rev. March 2024). This document is prepared for use in connection with the loan transaction and should not be sent to the IRS.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 12. Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "IRS Form W-9",
    headerRight: `IRS Form W-9 \u2014 ${input.borrowerName}`,
    children,
  });
}
