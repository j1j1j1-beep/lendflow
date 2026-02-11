// sba-form-1920.ts
// DEPRECATED: SBA Form 1920 was retired by the SBA effective August 1, 2023.
// Lenders should use SBA Form 1919 (Borrower Information Form) and the
// updated SBA Authorization/Approval process instead.
// This template is retained for historical reference only and should NOT be
// included in new loan document packages.
//
// Original description:
// Generates a DOCX SBA Form 1920 — Lender's Application for Guaranty.
// ZERO AI — pure deterministic data mapping from DocumentInput.
// Fields not available in DocumentInput use placeholder text for manual entry.

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
  formatPercent,
  formatDate,
  collateralLabel,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Helpers

/**
 * Determine primary use-of-proceeds category from program context and
 * loan purpose. Allocates the full loan amount to the best-fit row and
 * leaves the rest at $0.
 */
function buildUseOfProceedsRows(input: DocumentInput): string[][] {
  const amount = formatCurrency(input.terms.approvedAmount);
  const zero = formatCurrency(0);
  const purpose = (input.loanPurpose ?? "").toLowerCase();
  const programId = input.programId.toLowerCase();

  // Determine primary category
  let primaryIdx = 2; // default to "Working Capital"
  if (
    purpose.includes("real estate") ||
    purpose.includes("purchase") ||
    purpose.includes("property") ||
    programId.includes("504") ||
    programId.includes("cre")
  ) {
    primaryIdx = 0; // Land & Building
  } else if (
    purpose.includes("equipment") ||
    purpose.includes("machinery")
  ) {
    primaryIdx = 1; // Equipment
  } else if (
    purpose.includes("refinanc") ||
    purpose.includes("debt")
  ) {
    primaryIdx = 3; // Debt Refinance
  } else if (
    purpose.includes("inventory")
  ) {
    primaryIdx = 4; // Inventory
  } else if (
    purpose.includes("acquisition") ||
    purpose.includes("buyout")
  ) {
    primaryIdx = 5; // Business Acquisition
  }

  const categories = [
    "Land & Building Acquisition",
    "Machinery & Equipment",
    "Working Capital",
    "Debt Refinance",
    "Inventory Purchase",
    "Business Acquisition",
    "Leasehold Improvements",
    "Other (specify)",
  ];

  return categories.map((cat, i) => [
    cat,
    i === primaryIdx ? amount : zero,
  ]);
}

// Builder

export function buildSbaForm1920(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("SBA Form 1920"));
  children.push(spacer(2));
  children.push(
    bodyText("Lender's Application for Guaranty", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "U.S. Small Business Administration — This form is submitted by the participating lender to request an SBA guaranty on a 7(a) or 504 loan.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Part A: Lender Information
  children.push(sectionHeading("Part A: Lender Information"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Lender Name", value: input.lenderName },
      { label: "Lender Address", value: "[LENDER ADDRESS — TO BE COMPLETED]" },
      { label: "City, State, ZIP", value: "[CITY, STATE, ZIP — TO BE COMPLETED]" },
      { label: "SBA Lender ID Number", value: "[LENDER ID — TO BE COMPLETED]" },
      { label: "Lender Contact Name", value: "[CONTACT NAME — TO BE COMPLETED]" },
      { label: "Contact Phone", value: "[PHONE — TO BE COMPLETED]" },
      { label: "Contact Email", value: "[EMAIL — TO BE COMPLETED]" },
      { label: "Loan Officer Name", value: "[LOAN OFFICER — TO BE COMPLETED]" },
    ]),
  );
  children.push(spacer(8));

  // Part B: Loan Terms
  children.push(sectionHeading("Part B: Loan Terms"));
  children.push(spacer(4));

  const rateDescription = `${terms.baseRateType} (${formatPercent(terms.baseRateValue)}) + ${formatPercent(terms.spread)} spread = ${formatPercent(terms.interestRate)}`;

  children.push(
    keyTermsTable([
      { label: "Borrower Name", value: input.borrowerName },
      { label: "SBA Loan Number", value: "[TO BE ASSIGNED]" },
      { label: "Gross Loan Amount", value: formatCurrency(terms.approvedAmount) },
      {
        label: "SBA Guaranty Percentage",
        value: "[GUARANTY % — TO BE DETERMINED BY SBA]",
      },
      {
        label: "SBA Guaranteed Amount",
        value: "[GUARANTEED AMOUNT — TO BE DETERMINED]",
      },
      { label: "Interest Rate", value: rateDescription },
      { label: "Rate Type", value: terms.interestOnly ? "Interest Only" : "Fully Amortizing" },
      { label: "Loan Term", value: `${terms.termMonths} months` },
      {
        label: "Amortization Period",
        value: `${terms.amortizationMonths} months`,
      },
      {
        label: "Monthly Payment",
        value: formatCurrency(terms.monthlyPayment),
      },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      {
        label: "Collateral",
        value:
          input.collateralTypes.length > 0
            ? input.collateralTypes.map(collateralLabel).join("; ")
            : "[COLLATERAL — TO BE COMPLETED]",
      },
      {
        label: "Personal Guaranty",
        value: terms.personalGuaranty ? "Yes — Required" : "No",
      },
      {
        label: "Guarantor(s)",
        value:
          input.guarantorName ??
          (terms.personalGuaranty
            ? "[GUARANTOR NAMES — TO BE COMPLETED]"
            : "N/A"),
      },
    ]),
  );
  children.push(spacer(8));

  // Part C: Use of Proceeds
  children.push(sectionHeading("Part C: Use of Proceeds"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Itemize the planned use of loan proceeds. The total must equal the gross loan amount.",
    ),
  );
  children.push(spacer(4));

  const proceedsRows = buildUseOfProceedsRows(input);
  // Add a total row
  proceedsRows.push([
    "TOTAL",
    formatCurrency(terms.approvedAmount),
  ]);

  children.push(
    createTable(["Use of Proceeds Category", "Amount"], proceedsRows, {
      columnWidths: [60, 40],
      alternateRows: true,
    }),
  );
  children.push(spacer(8));

  // Part D: Credit Analysis Summary
  children.push(sectionHeading("Part D: Credit Analysis Summary"));
  children.push(spacer(4));

  const creditRows: [string, string][] = [];

  if (terms.ltv !== null && terms.ltv !== undefined) {
    creditRows.push([
      "Loan-to-Value (LTV)",
      formatPercent(terms.ltv),
    ]);
  } else {
    creditRows.push(["Loan-to-Value (LTV)", "[LTV — TO BE CALCULATED]"]);
  }

  creditRows.push([
    "Debt Service Coverage Ratio (DSCR)",
    "[DSCR — TO BE COMPLETED FROM FINANCIAL ANALYSIS]",
  ]);
  creditRows.push([
    "Borrower Credit Score",
    "[CREDIT SCORE — TO BE COMPLETED]",
  ]);
  creditRows.push([
    "Years in Business",
    "[YEARS — TO BE COMPLETED]",
  ]);
  creditRows.push([
    "Repayment Ability",
    "[LENDER'S ASSESSMENT OF REPAYMENT ABILITY — TO BE COMPLETED]",
  ]);
  creditRows.push([
    "Equity Injection",
    "[EQUITY INJECTION AMOUNT AND SOURCE — TO BE COMPLETED]",
  ]);

  children.push(
    createTable(["Credit Factor", "Value / Assessment"], creditRows, {
      columnWidths: [40, 60],
      alternateRows: true,
    }),
  );
  children.push(spacer(8));

  // Part E: Collateral Summary
  children.push(sectionHeading("Part E: Collateral Summary"));
  children.push(spacer(4));

  const collateralRows: string[][] = input.collateralTypes.map((ct) => {
    return [collateralLabel(ct), "[APPRAISED VALUE — TO BE COMPLETED]", "[LIEN POSITION]"];
  });

  if (collateralRows.length === 0) {
    collateralRows.push([
      "[COLLATERAL DESCRIPTION — TO BE COMPLETED]",
      "[APPRAISED VALUE]",
      "[LIEN POSITION]",
    ]);
  }

  children.push(
    createTable(
      ["Collateral Description", "Appraised / Estimated Value", "Lien Position"],
      collateralRows,
      { columnWidths: [40, 35, 25], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  if (terms.requiresAppraisal) {
    children.push(
      bodyText(
        "Note: An independent appraisal is required per SBA SOP 50 10 for this transaction.",
        { italic: true },
      ),
    );
    children.push(spacer(4));
  }
  children.push(spacer(4));

  // Part F: Lender's Certification
  children.push(sectionHeading("Part F: Lender's Certification"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "The undersigned Lender hereby certifies to the U.S. Small Business Administration as follows:",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "1. The Lender has made or will make the loan described herein on the terms set forth in this application and the accompanying documents. The loan will be closed and disbursed in accordance with SBA's Standard Operating Procedures (SOP 50 10) and all applicable SBA regulations.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "2. The Lender has evaluated the creditworthiness of the applicant business and all principals in accordance with prudent lending standards and SBA requirements, and has determined that the loan is of such sound value or so secured as to reasonably assure repayment.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "3. The Lender certifies that it would not make this loan without the SBA guaranty, thereby establishing credit elsewhere is not available to the applicant on reasonable terms.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "4. The Lender has verified that the applicant business is an eligible small business concern as defined in 13 CFR 121 and meets all SBA eligibility requirements for the requested loan program.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "5. The Lender has no knowledge of any information that would materially affect the SBA's decision to approve the guaranty that has not been disclosed in this application or its attachments.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "6. All fees charged to the borrower in connection with this loan comply with SBA regulations, including 13 CFR 120.221 and SBA SOP 50 10, and are fully disclosed in SBA Form 159.",
    ),
  );
  children.push(spacer(8));

  // Signature Block
  children.push(
    bodyText("AUTHORIZED LENDER OFFICER:", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Authorized Lender Officer"),
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
  children.push(spacer(4));
  children.push(bodyText("SBA Lender ID: ____________________________"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "SBA Form 1920 — Lender's Application for Guaranty",
    headerRight: `SBA Form 1920 — ${input.borrowerName}`,
    children,
  });
}
