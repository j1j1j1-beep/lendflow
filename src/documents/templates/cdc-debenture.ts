// =============================================================================
// cdc-debenture.ts
// Builds a CDC Debenture DOCX for SBA 504 loans.
// Mixed: deterministic 504 structure table, job creation/occupancy requirements,
// standard conditions + AI prose for project description and CDC terms.
// =============================================================================

import type { DocumentInput, CdcDebentureProse } from "../types";
import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  signatureBlock,
  sectionHeading,
  keyTermsTable,
  createTable,
  articleHeading,
  spacer,
  formatCurrency,
  formatDate,
  formatPercent,
  COLORS,
} from "../doc-helpers";

export type { CdcDebentureProse };

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildCdcDebenture(
  input: DocumentInput,
  prose: CdcDebentureProse,
): Document {
  const { terms } = input;
  const effectiveDate = formatDate(input.generatedAt);

  // 504 structure: CDC/SBA debenture = 40% of total project cost
  // Estimate total project cost from the loan amount (which is the CDC portion)
  const cdcPortion = terms.approvedAmount;
  const totalProjectCost = cdcPortion / 0.4;
  const firstLienPortion = totalProjectCost * 0.5;
  const borrowerEquity = totalProjectCost * 0.1;

  // Job creation: 1 job per $95,000 of debenture per 13 CFR 120.861
  const jobsRequired = Math.max(1, Math.ceil(cdcPortion / 95_000));

  const children: (Paragraph | Table)[] = [
    // ---- Title ----
    documentTitle("Certified Development Company Debenture"),
    spacer(4),

    bodyText(`SBA 504 Loan Program`, { bold: true }),
    bodyText(`Debenture Number: [DEBENTURE NUMBER]`, { bold: true }),
    spacer(2),
    bodyText(`Date: ${effectiveDate}`),
    spacer(8),

    // ---- Parties ----
    articleHeading("I", "Parties"),
    partyBlock(
      "Certified Development Company (CDC)",
      "[CDC NAME]",
      'the "CDC"',
    ),
    partyBlock("Borrower", input.borrowerName, 'the "Borrower"'),
    partyBlock("First Lien Lender", input.lenderName, 'the "Lender"'),
    spacer(4),

    bodyText(
      "This Debenture is issued by the CDC pursuant to the authority granted under Section 504 of the Small Business Investment Act of 1958, as amended, and the regulations promulgated thereunder (13 CFR Part 120).",
    ),
    spacer(8),

    // ---- 504 Structure Table ----
    sectionHeading("504 Project Structure"),
    createTable(
      ["Component", "Percentage", "Amount"],
      [
        [
          "First Lien (Bank/Lender)",
          "50%",
          formatCurrency(firstLienPortion),
        ],
        [
          "Second Lien (CDC/SBA Debenture)",
          "40%",
          formatCurrency(cdcPortion),
        ],
        ["Borrower Equity Injection", "10%", formatCurrency(borrowerEquity)],
        [
          "Total Project Cost",
          "100%",
          formatCurrency(totalProjectCost),
        ],
      ],
      { columnWidths: [45, 20, 35], alternateRows: true },
    ),
    spacer(8),

    // ---- Debenture Terms ----
    sectionHeading("Debenture Terms"),
    keyTermsTable([
      {
        label: "Debenture Amount",
        value: formatCurrency(cdcPortion),
      },
      {
        label: "Interest Rate",
        value: `${formatPercent(terms.interestRate)} (Fixed)`,
      },
      {
        label: "Term",
        value: `${terms.termMonths} months (${terms.termMonths <= 120 ? "10" : "20"} years)`,
      },
      {
        label: "Maturity Date",
        value: formatDate(input.maturityDate),
      },
      {
        label: "Payment Schedule",
        value: "Monthly, fully amortizing over the term of the debenture",
      },
      {
        label: "First Payment Date",
        value: formatDate(input.firstPaymentDate),
      },
      { label: "Prepayment", value: "Subject to SBA prepayment penalties as set forth in the Debenture" },
    ]),
    spacer(8),

    // ---- Project Description (AI prose) ----
    sectionHeading("Project Description"),
    bodyText(prose.projectDescription),
    spacer(8),

    // ---- Job Creation Requirement ----
    sectionHeading("Job Creation / Retention Requirement"),
    bodyText(
      `For every $95,000 of debenture proceeds (per 13 CFR 120.861), the Borrower must create or retain at least one (1) job within two (2) years of final disbursement. Based on the debenture amount of ${formatCurrency(cdcPortion)}, Borrower must create or retain a minimum of ${jobsRequired} job(s).`,
    ),
    spacer(2),
    bodyText(
      "Borrower shall provide employment reports to the CDC on an annual basis documenting job creation and retention in compliance with SBA requirements.",
    ),
    spacer(8),

    // ---- Occupancy Requirement ----
    sectionHeading("Occupancy Requirement"),
    bodyText(
      "Borrower must occupy at least 51% of the usable square footage of the project property for an existing business, or at least 60% for new construction. Borrower shall certify occupancy annually to the CDC.",
    ),
    spacer(2),
    bodyText(
      "If Borrower fails to meet the occupancy requirement at any time during the term of the debenture, such failure shall constitute an event of default.",
    ),
    spacer(8),

    // ---- Standard 504 Conditions ----
    sectionHeading("Standard 504 Conditions"),
    bodyText(
      "This debenture is subject to the following standard conditions:",
    ),
    spacer(2),

    bulletPoint(
      "Eligible Use of Proceeds: Debenture proceeds shall be used solely for the acquisition of land, buildings, or major equipment with a useful life of at least the term of the debenture, or for construction, renovation, or improvement of real property.",
    ),
    bulletPoint(
      "Collateral: The CDC debenture shall be secured by a second lien on the project property, subordinate only to the first lien of the Lender. Additional collateral may be required at the discretion of the CDC and SBA.",
    ),
    bulletPoint(
      "Insurance: Borrower shall maintain hazard insurance, flood insurance (if applicable), and commercial general liability insurance on the project property in amounts satisfactory to the CDC and Lender.",
    ),
    bulletPoint(
      "Financial Reporting: Borrower shall provide annual financial statements to the CDC within 120 days of the end of each fiscal year. The CDC may require audited financial statements for debentures exceeding $500,000.",
    ),
    bulletPoint(
      "Environmental Compliance: Borrower shall comply with all applicable environmental laws and regulations. A Phase I Environmental Site Assessment satisfactory to the CDC and SBA is required prior to closing.",
    ),
    bulletPoint(
      "No Change of Ownership: Borrower shall not transfer, sell, or assign any ownership interest in the project property or the Borrower entity without the prior written consent of the CDC and SBA.",
    ),
    bulletPoint(
      "Fees: CDC processing fee, SBA guaranty fee, and closing costs are the responsibility of the Borrower as set forth in the settlement statement.",
    ),
    bulletPoint(
      "Compliance with SBA SOP: All parties shall comply with SBA Standard Operating Procedure (SOP) 50 10 as amended from time to time.",
    ),
    spacer(8),

    // ---- CDC Terms and Conditions (AI prose) ----
    sectionHeading("CDC Terms and Conditions"),
    bodyText(prose.cdcTermsAndConditions),
    spacer(8),

    // ---- Default ----
    sectionHeading("Events of Default"),
    bodyText(
      "An Event of Default shall include, without limitation:",
    ),
    spacer(2),
    bulletPoint(
      "Failure to make any payment of principal or interest when due under this Debenture.",
    ),
    bulletPoint(
      "Failure to meet the job creation or retention requirements within the specified timeframe.",
    ),
    bulletPoint(
      "Failure to maintain the required occupancy percentage.",
    ),
    bulletPoint(
      "Any material misrepresentation in the application or supporting documents.",
    ),
    bulletPoint(
      "Borrower's failure to comply with any term, condition, or covenant of this Debenture or any related loan documents.",
    ),
    bulletPoint(
      "Voluntary or involuntary bankruptcy, insolvency, or receivership of the Borrower.",
    ),
    bulletPoint(
      "Sale, transfer, or encumbrance of the project property without prior written consent.",
    ),
    spacer(8),

    // ---- Governing Law ----
    sectionHeading("Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    bodyTextRuns([
      { text: "Federal Preemption: ", bold: true },
      {
        text: "To the extent that any provision of this Debenture conflicts with applicable federal law or SBA regulations, federal law and SBA regulations shall prevail.",
      },
    ]),
    spacer(8),

    // ---- Certification ----
    bodyText(
      "IN WITNESS WHEREOF, the parties hereto have caused this Debenture to be executed as of the date first written above.",
      { bold: true },
    ),
    spacer(4),

    // ---- Signatures ----
    bodyText("CDC EXECUTIVE DIRECTOR:", { bold: true, color: COLORS.primary }),
    ...signatureBlock("[CDC Executive Director Name]", "Executive Director, [CDC Name]"),

    spacer(8),

    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),

    spacer(8),

    bodyText("FIRST LIEN LENDER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Lender / Authorized Signatory"),
  ];

  return buildLegalDocument({
    title: "CDC Debenture",
    headerRight: `CDC Debenture — ${input.borrowerName}`,
    children,
  });
}
