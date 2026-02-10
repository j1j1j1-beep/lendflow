// =============================================================================
// irs-4506c.ts
// Generates a DOCX IRS Form 4506-C — IVES Request for Transcript of Tax Return.
// ZERO AI — pure deterministic data mapping from DocumentInput.
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
  spacer,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine tax form numbers based on program category.
 * Personal: 1040. Business: 1120/1120S/1065. Both for commercial.
 */
function getTaxForms(programCategory: string): string {
  switch (programCategory) {
    case "residential":
      return "1040";
    case "commercial":
      return "1040, 1120/1120S/1065";
    case "specialty":
      return "1040, 1120/1120S/1065";
    default:
      return "1040";
  }
}

/**
 * Generate the last 2-3 tax years based on generatedAt date.
 * If before April 15, include 3 prior years; otherwise 2 prior + current.
 */
function getTaxYears(generatedAt: Date): string {
  const currentYear = generatedAt.getFullYear();
  const month = generatedAt.getMonth(); // 0-indexed

  // Before April 15 — most recent filed year is 2 years back
  if (month < 3 || (month === 3 && generatedAt.getDate() < 15)) {
    return `${currentYear - 3}, ${currentYear - 2}, ${currentYear - 1}`;
  }

  // After April 15 — most recent filed year is 1 year back
  return `${currentYear - 2}, ${currentYear - 1}`;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildIrs4506c(input: DocumentInput): Document {
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // 1. Title
  // -------------------------------------------------------------------------
  children.push(
    documentTitle(
      "IRS Form 4506-C \u2014 IVES Request for Transcript of Tax Return",
    ),
  );
  children.push(spacer(4));

  // -------------------------------------------------------------------------
  // 2. Reference & Purpose
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Per IRS Form 4506-C (Rev. 10-2022). This form is used to request tax return transcripts through the Income Verification Express Service (IVES) program.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 3. Line 1a — Taxpayer Name
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Taxpayer Information"));

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["1a", "Name shown on tax return", input.borrowerName],
        ["1b", "Social Security Number or Employer Identification Number", "[SSN/EIN \u2014 TO BE COMPLETED]"],
        ["2a", "Spouse\u2019s name (if joint return)", "[IF APPLICABLE \u2014 TO BE COMPLETED]"],
        ["2b", "Spouse\u2019s SSN (if joint return)", "[IF APPLICABLE \u2014 TO BE COMPLETED]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 4. Lines 3-4 — Address Information
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Address Information"));

  const currentAddress =
    input.debtorAddress ?? input.propertyAddress ?? "[ADDRESS \u2014 TO BE COMPLETED]";

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["3", "Current name, address (including apt., room, or suite no.), city, state, and ZIP code", currentAddress],
        ["4", "Previous address shown on the last return filed if different from line 3", "[IF DIFFERENT \u2014 TO BE COMPLETED]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 5. Lines 5a-5c — Third Party / IVES Participant Information
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Third Party (IVES Participant) Information"));

  children.push(
    createTable(
      ["Line", "Description", "Entry"],
      [
        ["5a", "Third party name (IVES participant)", input.lenderName],
        ["5b", "Third party address", "[LENDER ADDRESS]"],
        ["5c", "SOR Mailbox ID", "[SOR MAILBOX ID]"],
      ],
      { columnWidths: [10, 45, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 6. Line 6 — Transcript Type
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Transcript Requested"));

  children.push(
    bodyTextRuns([
      { text: "Line 6 \u2014 Transcript type: ", bold: true },
      { text: "Select the type of transcript requested below." },
    ]),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Transcript Type", "Selected"],
      [
        ["Return Transcript", "[X]"],
        ["Account Transcript", "[ ]"],
        ["Record of Account", "[ ]"],
        ["Wage and Income (W-2, 1099 series, etc.)", "[ ]"],
        ["Verification of Non-Filing", "[ ]"],
      ],
      { columnWidths: [70, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 7. Line 7 — Tax Form Number
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Tax Form Information"));

  const taxForms = getTaxForms(input.programCategory);

  children.push(
    bodyTextRuns([
      { text: "Line 7 \u2014 Tax form number: ", bold: true },
      { text: taxForms },
    ]),
  );
  children.push(spacer(4));

  // -------------------------------------------------------------------------
  // 8. Line 8 — Year(s) or Period(s) Requested
  // -------------------------------------------------------------------------
  const taxYears = getTaxYears(input.generatedAt);

  children.push(
    bodyTextRuns([
      { text: "Line 8 \u2014 Year(s) or period(s) requested: ", bold: true },
      { text: taxYears },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 9. Authorization / Disclosure
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Authorization"));

  children.push(
    bodyText(
      "I authorize the IRS to provide tax information to the third party listed on Line 5a for the tax form(s) and year(s)/period(s) specified on Lines 7 and 8. I understand that this authorization will be valid for 120 days from the signature date below unless a shorter period is specified by the IVES participant.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "I declare that I am either the taxpayer whose name is shown on Line 1a or 2a, or a person authorized to obtain the tax information requested. If the request applies to a joint return, at least one spouse must sign. If signed by a corporate officer, 1 percent or more shareholder, partner, managing member, guardian, tax matters partner, executor, receiver, administrator, trustee, or party other than the taxpayer, I certify that I have the authority to execute Form 4506-C on behalf of the taxpayer.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "WARNING: Any unauthorized use or disclosure of information obtained under this form may result in a fine of up to $250,000 and/or imprisonment of up to 5 years under 26 U.S.C. \u00A7 7213 and \u00A7 7213A.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 10. Line 9 — Signature Section
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Signature"));

  children.push(
    bodyText("TAXPAYER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Taxpayer / Authorized Representative"),
  );

  children.push(spacer(4));
  children.push(bodyText(`Date: ${formatDate(input.generatedAt)}`));
  children.push(bodyText("Telephone Number: ____________________________"));

  children.push(spacer(12));

  children.push(
    bodyText("SPOUSE (if joint return):", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("[IF APPLICABLE]", "Spouse"),
  );

  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 11. Reference
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Per IRS Form 4506-C (Rev. 10-2022). This document is prepared for use in connection with the loan transaction between the above-named taxpayer and the IVES participant.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 12. Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "IRS Form 4506-C",
    headerRight: `IRS Form 4506-C \u2014 ${input.borrowerName}`,
    children,
  });
}
