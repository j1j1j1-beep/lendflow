// settlement-statement.ts
// Generates a DOCX Settlement Statement — pure math, zero AI prose.
// All numbers derived from DocumentInput (rules engine output).

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
  formatPercent,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Helpers

function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((utcB - utcA) / (1000 * 60 * 60 * 24));
}

// Builder

export function buildSettlementStatement(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Settlement Statement"));
  children.push(spacer(4));

  // 2. Header text
  children.push(
    bodyText(
      "This Settlement Statement sets forth all charges, adjustments, and disbursements in connection with the loan described herein.",
    ),
  );
  children.push(spacer(4));

  // 3. Key Terms Table
  children.push(
    keyTermsTable([
      { label: "Effective Date", value: formatDate(input.generatedAt) },
      { label: "Borrower", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      {
        label: "Property Address",
        value: input.propertyAddress ?? "N/A",
      },
      { label: "Loan Program", value: input.programName },
      {
        label: "Loan Amount",
        value: formatCurrency(terms.approvedAmount),
      },
    ]),
  );
  children.push(spacer(8));

  // 4. Loan Summary
  children.push(sectionHeading("Loan Summary"));
  children.push(
    createTable(
      ["Term", "Value"],
      [
        ["Principal Amount", formatCurrency(terms.approvedAmount)],
        ["Interest Rate", formatPercent(terms.interestRate)],
        ["Term", `${terms.termMonths} months`],
        ["Amortization", `${terms.amortizationMonths} months`],
        ["Monthly Payment", formatCurrencyDetailed(terms.monthlyPayment)],
        ["Maturity Date", formatDate(input.maturityDate)],
        ["First Payment Date", formatDate(input.firstPaymentDate)],
        ["Interest Only", terms.interestOnly ? "Yes" : "No"],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // 5. Borrower Charges
  children.push(sectionHeading("Borrower Charges"));

  const chargeRows: string[][] = [];
  let totalCharges = 0;

  // Fees from terms
  for (const fee of terms.fees) {
    chargeRows.push([fee.name, formatCurrencyDetailed(fee.amount)]);
    totalCharges += fee.amount;
  }

  // Prorated interest
  const daysToFirstPayment = daysBetween(
    input.generatedAt,
    input.firstPaymentDate,
  );
  const proratedInterest =
    (terms.approvedAmount * terms.interestRate / 360) * daysToFirstPayment;
  chargeRows.push([
    `Prorated Interest (${daysToFirstPayment} days)`,
    formatCurrencyDetailed(proratedInterest),
  ]);
  totalCharges += proratedInterest;

  // Recording fees (estimated)
  const recordingFees = 150;
  chargeRows.push([
    "Recording Fees (Estimated)",
    formatCurrencyDetailed(recordingFees),
  ]);
  totalCharges += recordingFees;

  // Title search/insurance (placeholder)
  const titleSearchFee = 0;
  chargeRows.push([
    "Title Search / Insurance (TBD)",
    formatCurrencyDetailed(titleSearchFee),
  ]);
  totalCharges += titleSearchFee;

  // Total borrower charges (bold row)
  chargeRows.push([
    "Total Borrower Charges",
    formatCurrencyDetailed(totalCharges),
  ]);

  children.push(
    createTable(["Description", "Amount"], chargeRows, {
      columnWidths: [60, 40],
      alternateRows: true,
    }),
  );
  children.push(spacer(8));

  // 6. Borrower Credits
  children.push(sectionHeading("Borrower Credits"));

  const totalCredits = terms.approvedAmount;
  const creditRows: string[][] = [
    ["Loan Proceeds", formatCurrencyDetailed(terms.approvedAmount)],
    ["Total Credits", formatCurrencyDetailed(totalCredits)],
  ];

  children.push(
    createTable(["Description", "Amount"], creditRows, {
      columnWidths: [60, 40],
      alternateRows: true,
    }),
  );
  children.push(spacer(8));

  // 7. Net Disbursement
  children.push(sectionHeading("Net Disbursement"));

  const netDisbursement = totalCredits - totalCharges;
  children.push(
    bodyTextRuns([
      { text: "Net Amount Due to Borrower: ", bold: true },
      { text: formatCurrency(netDisbursement), bold: true },
    ]),
  );
  children.push(spacer(4));

  if (netDisbursement < 0) {
    children.push(
      bodyText(
        "NOTE: Net disbursement is negative. Borrower owes additional funds at closing.",
        { bold: true },
      ),
    );
    children.push(spacer(4));
  }

  children.push(
    bodyText(
      "The above net disbursement amount is subject to final adjustments at closing.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // 8. Certification
  children.push(sectionHeading("Certification"));
  children.push(
    bodyText(
      "The undersigned hereby acknowledge receipt of this Settlement Statement and agree that it accurately reflects all charges and credits in connection with the above-referenced loan transaction.",
    ),
  );
  children.push(spacer(4));

  // 9. Standard clause
  children.push(
    bodyText(
      "This Settlement Statement is for informational purposes and does not modify the terms of the Loan Agreement, Promissory Note, or any other Loan Document.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // 10. Important Notes
  children.push(sectionHeading("Important Notes"));
  children.push(
    bodyText(
      "Prorated interest calculated on an Actual/360 day count basis.",
    ),
  );
  children.push(spacer(4));

  // 11. RESPA/TILA Disclaimer
  children.push(
    bodyText(
      "This Settlement Statement is prepared for commercial loan transactions only and is not intended to serve as a substitute for any disclosure required under RESPA, TILA, or Regulation Z.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // 12. Signature blocks
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  );

  children.push(spacer(12));

  children.push(
    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Lender / Authorized Signatory"),
  );

  children.push(spacer(12));

  children.push(
    bodyText("SETTLEMENT AGENT:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("____________________________", "Settlement Agent"),
  );

  // 13. Wrap in legal document shell
  return buildLegalDocument({
    title: "Settlement Statement",
    headerRight: `Settlement Statement — ${input.borrowerName}`,
    children,
  });
}
