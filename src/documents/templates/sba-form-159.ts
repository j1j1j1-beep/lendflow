// sba-form-159.ts
// Generates a DOCX SBA Form 159 — Fee Disclosure and Compensation Agreement.
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
  formatCurrencyDetailed,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Builder

export function buildSbaForm159(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("SBA Form 159"));
  children.push(spacer(2));
  children.push(
    bodyText("Fee Disclosure and Compensation Agreement", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "U.S. Small Business Administration — Required disclosure of all fees, charges, and compensation paid by or on behalf of the applicant in connection with an SBA-guaranteed loan, pursuant to 13 CFR 103.5.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Loan Identification
  children.push(sectionHeading("Loan Identification"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Applicant/Borrower Name", value: input.borrowerName },
      { label: "Lender Name", value: input.lenderName },
      { label: "SBA Loan Number", value: "[TO BE ASSIGNED]" },
      {
        label: "Loan Amount",
        value: formatCurrency(terms.approvedAmount),
      },
      { label: "Loan Program", value: input.programName },
      { label: "Date", value: formatDate(input.generatedAt) },
    ]),
  );
  children.push(spacer(8));

  // Agent/Packager Information
  children.push(sectionHeading("Agent/Packager Information"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "If a loan packager, referral agent, or other agent assisted the applicant in obtaining this loan, the following information must be completed.",
    ),
  );
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Agent/Packager Name", value: "[AGENT NAME — TO BE COMPLETED]" },
      { label: "Agent Address", value: "[AGENT ADDRESS — TO BE COMPLETED]" },
      { label: "City, State, ZIP", value: "[CITY, STATE, ZIP — TO BE COMPLETED]" },
      { label: "Agent Phone", value: "[PHONE — TO BE COMPLETED]" },
      { label: "Agent Tax ID (EIN/SSN)", value: "[TAX ID — TO BE COMPLETED]" },
      {
        label: "Services Provided",
        value: "[DESCRIPTION OF SERVICES — TO BE COMPLETED]",
      },
      {
        label: "Total Agent/Packager Fee",
        value: "[FEE AMOUNT — TO BE COMPLETED]",
      },
    ]),
  );
  children.push(spacer(8));

  // Fee Schedule
  children.push(sectionHeading("Fee Schedule"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "All fees, charges, and compensation paid or to be paid by the applicant or on the applicant's behalf in connection with this SBA loan are listed below.",
    ),
  );
  children.push(spacer(4));

  let totalFees = 0;
  const feeRows: string[][] = [];

  for (const fee of terms.fees) {
    feeRows.push([
      fee.name,
      formatCurrencyDetailed(fee.amount),
      fee.description,
    ]);
    totalFees += fee.amount;
  }

  // If no fees from the rules engine, provide placeholder rows
  if (feeRows.length === 0) {
    feeRows.push([
      "SBA Guaranty Fee",
      "[AMOUNT — TO BE COMPLETED]",
      "SBA guaranty fee per 13 CFR 120.220",
    ]);
    feeRows.push([
      "Packaging Fee",
      "[AMOUNT — TO BE COMPLETED]",
      "Loan packaging/preparation fee",
    ]);
    feeRows.push([
      "Closing Costs",
      "[AMOUNT — TO BE COMPLETED]",
      "Attorney/closing agent fees",
    ]);
  }

  // Total row
  feeRows.push([
    "TOTAL FEES",
    totalFees > 0
      ? formatCurrencyDetailed(totalFees)
      : "[TOTAL — TO BE CALCULATED]",
    "",
  ]);

  children.push(
    createTable(
      ["Fee Description", "Amount", "Explanation"],
      feeRows,
      { columnWidths: [35, 25, 40], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Additional Fee Disclosures
  children.push(sectionHeading("Additional Fee Disclosures"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "Are there any fees not listed above that will be charged to the applicant in connection with this loan?",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("[YES/NO — TO BE COMPLETED]", { bold: true }),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "If YES, attach a separate schedule describing each additional fee, the amount, and the party to whom it is payable.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Certification
  children.push(sectionHeading("Certification"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "The undersigned parties hereby certify the following:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "1. All fees, charges, and compensation that have been paid or will be paid by or on behalf of the applicant in connection with this SBA loan are fully and accurately disclosed in this form and any attached schedules.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "2. No other fees, charges, or compensation of any kind have been or will be charged to, or received from, the applicant or any other party in connection with this loan, except as disclosed herein.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "3. This disclosure is made in compliance with 13 CFR 103.5, which requires that any agent or packager receiving compensation for services rendered in connection with an SBA loan must execute this form.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "4. The undersigned understand that any false statement or misrepresentation on this form may result in criminal penalties under 18 U.S.C. 1001 (fine and/or imprisonment), civil penalties, and/or administrative sanctions including suspension or debarment from SBA programs.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "5. All fees charged comply with the limits set forth in SBA SOP 50 10 and 13 CFR 120.221. No unreasonable fees have been charged to the applicant.",
    ),
  );
  children.push(spacer(8));

  // Signature Blocks
  children.push(
    bodyText("AGENT/PACKAGER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(
      "[AGENT NAME — TO BE COMPLETED]",
      "Agent / Loan Packager",
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));
  children.push(bodyText("Date: ____________________________"));

  children.push(spacer(12));

  children.push(
    bodyText("APPLICANT/BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Applicant / Borrower"),
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

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "SBA Form 159 — Fee Disclosure and Compensation Agreement",
    headerRight: `SBA Form 159 — ${input.borrowerName}`,
    children,
  });
}
