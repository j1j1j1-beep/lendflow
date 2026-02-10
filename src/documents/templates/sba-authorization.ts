// =============================================================================
// sba-authorization.ts
// Builds an SBA Authorization letter DOCX for 7(a) and 504 loans.
// Mixed: deterministic SBA conditions + guaranty fee calc + AI prose for
// special conditions and use of proceeds.
// =============================================================================

import type { DocumentInput, SbaAuthorizationProse } from "../types";
import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  signatureBlock,
  sectionHeading,
  keyTermsTable,
  createTable,
  spacer,
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

export type { SbaAuthorizationProse };

// ---------------------------------------------------------------------------
// SBA Guaranty Fee Calculation (per SOP 50 10)
// ---------------------------------------------------------------------------

function computeSbaGuarantyPercent(loanAmount: number): number {
  if (loanAmount <= 150_000) return 0.85;
  return 0.75;
}

function computeSbaGuarantyFeePercent(guaranteedAmount: number): number {
  if (guaranteedAmount <= 150_000) return 0.02;
  if (guaranteedAmount <= 700_000) return 0.03;
  if (guaranteedAmount <= 1_000_000) return 0.035;
  return 0.0375;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSbaAuthorization(
  input: DocumentInput,
  prose: SbaAuthorizationProse,
): Document {
  const { terms } = input;
  const effectiveDate = formatDate(input.generatedAt);

  // SBA guaranty calculations
  const guarantyPercent = computeSbaGuarantyPercent(terms.approvedAmount);
  const guaranteedAmount = terms.approvedAmount * guarantyPercent;
  const guarantyFeePercent = computeSbaGuarantyFeePercent(guaranteedAmount);
  const guarantyFee = guaranteedAmount * guarantyFeePercent;

  const children: (Paragraph | Table)[] = [
    // ---- Header ----
    documentTitle("U.S. Small Business Administration"),
    bodyText("AUTHORIZATION", {
      bold: true,
    }),
    spacer(4),

    bodyText(`SBA Loan Number: [SBA LOAN NUMBER]`, { bold: true }),
    spacer(2),
    bodyText(`Date: ${effectiveDate}`),
    spacer(4),

    // ---- Parties ----
    sectionHeading("Parties"),
    bodyTextRuns([
      { text: "Borrower: ", bold: true },
      { text: input.borrowerName },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "Lender: ", bold: true },
      { text: input.lenderName },
    ]),
    spacer(4),

    bodyText(
      "The U.S. Small Business Administration (\"SBA\") hereby authorizes the Lender to make or guarantee the following loan to the Borrower under the terms and conditions set forth herein.",
    ),
    spacer(4),

    // ---- Authorization Table ----
    sectionHeading("Loan Authorization"),
    keyTermsTable([
      {
        label: "Loan Amount",
        value: formatCurrency(terms.approvedAmount),
      },
      {
        label: "SBA Guaranty Percentage",
        value: `${(guarantyPercent * 100).toFixed(0)}%`,
      },
      {
        label: "Guaranteed Amount",
        value: formatCurrency(guaranteedAmount),
      },
      {
        label: "Interest Rate",
        value: formatPercent(terms.interestRate),
      },
      {
        label: "Term",
        value: `${terms.termMonths} months`,
      },
      {
        label: "Maturity Date",
        value: formatDate(input.maturityDate),
      },
      { label: "Loan Program", value: input.programName },
    ]),
    spacer(8),

    // ---- SBA Guaranty Fee ----
    sectionHeading("SBA Guaranty Fee"),
    createTable(
      ["Component", "Value"],
      [
        ["Guaranteed Amount", formatCurrency(guaranteedAmount)],
        [
          "Guaranty Fee Rate",
          `${(guarantyFeePercent * 100).toFixed(2)}%`,
        ],
        ["Guaranty Fee", formatCurrencyDetailed(guarantyFee)],
      ],
      { columnWidths: [50, 50], alternateRows: true },
    ),
    spacer(2),
    bodyText(
      "The guaranty fee is due within 90 days of loan approval. The Lender may charge the Borrower for this fee.",
      { italic: true },
    ),
    spacer(8),

    // ---- Use of Proceeds ----
    sectionHeading("Use of Proceeds"),
    bodyText(prose.useOfProceeds),
    spacer(8),

    // ---- Standard SBA Conditions ----
    sectionHeading("Standard SBA Conditions"),
    bodyText(
      "This authorization is subject to the following standard conditions:",
    ),
    spacer(2),

    bulletPoint(
      "Satisfactory credit check on all principals with 20% or greater ownership interest.",
    ),
    bulletPoint(
      "Borrower must certify that it has no delinquent federal debt, including but not limited to federal taxes, student loans, and other obligations to the United States Government.",
    ),
    bulletPoint(
      "Borrower must be an eligible small business concern as defined in 13 CFR Part 121, meeting the applicable size standard for its industry.",
    ),
    bulletPoint(
      "Loan proceeds shall be used only for the purposes approved in this authorization. Any diversion of proceeds is grounds for SBA to seek recovery of its guaranty.",
    ),
    bulletPoint(
      "All collateral requirements specified by Lender and SBA must be met, including but not limited to real estate liens, UCC filings, and assignments.",
    ),
    bulletPoint(
      "Personal guaranty is required from each owner with 20% or greater ownership interest in the Borrower.",
    ),
    bulletPoint(
      "Life insurance assignment may be required at the discretion of the Lender, with SBA as co-assignee, in an amount sufficient to cover the outstanding loan balance.",
    ),
    bulletPoint(
      "If applicable, standby agreements must be executed for any injection of equity or subordinated debt.",
    ),
    bulletPoint(
      "Borrower must maintain hazard and flood insurance (if applicable) on all collateral, naming Lender as loss payee.",
    ),
    bulletPoint(
      "Borrower must comply with all SBA Standard Operating Procedures (SOPs) applicable to the loan program.",
    ),
    bulletPoint(
      "IRS tax transcripts must be obtained and reviewed for the most recent three (3) fiscal years.",
    ),
    bulletPoint(
      "Lender must verify that no principal of the Borrower is presently incarcerated, on probation, on parole, or subject to an indictment for a felony or any crime involving financial dishonesty.",
    ),
    spacer(8),

    // ---- Special Conditions (AI prose) ----
    sectionHeading("Special Conditions"),
    bodyText(
      "In addition to the standard conditions above, the following special conditions apply to this authorization:",
    ),
    spacer(2),
    ...ensureProseArray(prose.specialConditions).map((item) => bulletPoint(item)),
    spacer(8),

    // ---- Governing Law ----
    sectionHeading("Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // ---- Expiration ----
    sectionHeading("Authorization Expiration"),
    bodyText(
      "This authorization shall expire six (6) months from the date hereof unless the loan is disbursed or an extension is granted in writing by SBA.",
    ),
    spacer(2),
    bodyText(
      "Any material change in the Borrower's financial condition, ownership, or business operations between the date of this authorization and loan closing may result in cancellation of this authorization.",
    ),
    spacer(8),

    // ---- Certification ----
    bodyText(
      "By signing below, the parties acknowledge and agree to the terms and conditions set forth in this authorization.",
      { bold: true },
    ),
    spacer(4),

    // ---- Signatures ----
    bodyText("SBA LOAN OFFICER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock("[SBA Loan Officer Name]", "SBA Loan Officer"),

    spacer(8),

    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Lender Representative"),

    spacer(8),

    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  ];

  return buildLegalDocument({
    title: "SBA Authorization",
    headerRight: `SBA Authorization — ${input.borrowerName}`,
    children,
  });
}
