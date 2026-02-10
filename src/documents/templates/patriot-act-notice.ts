// =============================================================================
// patriot-act-notice.ts
// Generates a DOCX USA PATRIOT Act Customer Identification Program Notice.
// ZERO AI — pure deterministic data mapping from DocumentInput.
// Short document (~1 page).
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
  keyTermsTable,
  spacer,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildPatriotActNotice(input: DocumentInput): Document {
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // 1. Title
  // -------------------------------------------------------------------------
  children.push(
    documentTitle(
      "USA PATRIOT Act Notice \u2014 Customer Identification Program",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 2. Important Information Header
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "IMPORTANT INFORMATION ABOUT PROCEDURES FOR OPENING A NEW ACCOUNT",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 3. Statutory Notice
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Federal Requirements"));

  children.push(
    bodyText(
      "To help the government fight the funding of terrorism and money laundering activities, Federal law requires all financial institutions to obtain, verify, and record information that identifies each person who opens an account.",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 4. What This Means
  // -------------------------------------------------------------------------
  children.push(sectionHeading("What This Means for You"));

  children.push(
    bodyText(
      "When you open an account, we will ask for your name, address, date of birth, and other information that will allow us to identify you. We may also ask to see your driver\u2019s license or other identifying documents.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "For entities such as corporations, partnerships, and LLCs, we may require documentation including but not limited to:",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "\u2022 ", bold: true },
      { text: "Articles of incorporation, organization, or partnership agreement" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "\u2022 ", bold: true },
      { text: "Employer Identification Number (EIN)" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "\u2022 ", bold: true },
      { text: "Government-issued identification for all authorized signers and beneficial owners (25% or more ownership)" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "\u2022 ", bold: true },
      { text: "Certificate of Good Standing or existence" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "\u2022 ", bold: true },
      { text: "Operating agreement or bylaws (if applicable)" },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 5. Beneficial Ownership
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Beneficial Ownership Requirements"));

  children.push(
    bodyText(
      "In accordance with the Customer Due Diligence Rule (31 CFR \u00A7 1010.230), we are required to identify and verify the identity of all individuals who own 25% or more of a legal entity customer, as well as at least one individual who controls the entity (the \u201Ccontrol person\u201D).",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 6. Lender Identification
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Financial Institution"));

  children.push(
    keyTermsTable([
      { label: "Financial Institution", value: input.lenderName },
      { label: "Address", value: "[LENDER ADDRESS \u2014 TO BE COMPLETED]" },
      { label: "Telephone", value: "[PHONE NUMBER]" },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 7. Borrower Acknowledgment
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Borrower Acknowledgment"));

  children.push(
    bodyText(
      `By signing below, I, ${input.borrowerName}, acknowledge that I have received and understand this notice regarding the USA PATRIOT Act Customer Identification Program requirements. I understand that ${input.lenderName} is required by federal law to obtain, verify, and record information that identifies each person who opens an account or obtains a loan.`,
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(`Date: ${formatDate(input.generatedAt)}`),
  );
  children.push(spacer(4));

  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  );

  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 8. Regulatory Reference
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Provided pursuant to Section 326 of the USA PATRIOT Act (31 U.S.C. \u00A7 5318(l)) and 31 CFR \u00A7 1020.220. This notice is provided in compliance with the Bank Secrecy Act and the implementing regulations of the Financial Crimes Enforcement Network (FinCEN).",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 9. Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "USA PATRIOT Act Notice",
    headerRight: `PATRIOT Act Notice \u2014 ${input.borrowerName}`,
    children,
  });
}
