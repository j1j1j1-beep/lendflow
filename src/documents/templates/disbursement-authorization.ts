// disbursement-authorization.ts
// Generates a DOCX Disbursement Authorization / Direction Letter.
// ZERO AI — pure deterministic data mapping from DocumentInput.

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

// Helpers

/**
 * Calculate prepaid interest days between generatedAt and firstPaymentDate.
 */
function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((utcB - utcA) / (1000 * 60 * 60 * 24));
}

// Builder

export function buildDisbursementAuthorization(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(
    documentTitle("Disbursement Authorization and Direction Letter"),
  );
  children.push(spacer(4));

  // 2. Letter Header
  children.push(
    bodyText(`Date: ${formatDate(input.generatedAt)}`),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "To: ", bold: true },
      { text: input.lenderName },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "From: ", bold: true },
      { text: input.borrowerName },
    ]),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "Re: ", bold: true },
      {
        text: `Loan in the amount of ${formatCurrency(terms.approvedAmount)}, secured by property located at ${input.propertyAddress ?? "[PROPERTY ADDRESS]"}`,
      },
    ]),
  );
  children.push(spacer(8));

  // 3. Key Terms
  children.push(
    keyTermsTable([
      { label: "Deal Reference", value: input.dealId },
      { label: "Borrower", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      { label: "Loan Program", value: input.programName },
      { label: "Gross Loan Amount", value: formatCurrency(terms.approvedAmount) },
      { label: "Property Address", value: input.propertyAddress ?? "[PROPERTY ADDRESS]" },
    ]),
  );
  children.push(spacer(8));

  // 4. Authorization
  children.push(sectionHeading("Authorization to Disburse"));

  children.push(
    bodyText(
      `The undersigned hereby authorizes and directs ${input.lenderName} to disburse the loan proceeds as follows:`,
    ),
  );
  children.push(spacer(8));

  // 5. Disbursement Table
  children.push(sectionHeading("Disbursement Schedule"));

  const disbursementRows: string[][] = [];
  let totalDeductions = 0;

  // Gross loan proceeds
  disbursementRows.push([
    "Gross Loan Proceeds",
    formatCurrencyDetailed(terms.approvedAmount),
    "",
  ]);

  // Fee deductions
  for (const fee of terms.fees) {
    disbursementRows.push([
      fee.name,
      "",
      `(${formatCurrencyDetailed(fee.amount)})`,
    ]);
    totalDeductions += fee.amount;
  }

  // Title/Recording Charges
  disbursementRows.push([
    "Title / Recording Charges",
    "",
    "[AMOUNT \u2014 TO BE COMPLETED]",
  ]);

  // Prepaid interest
  const prepaidDays = daysBetween(input.generatedAt, input.firstPaymentDate);
  const prepaidInterest =
    (terms.approvedAmount * terms.interestRate / 360) * prepaidDays;
  disbursementRows.push([
    `Prepaid Interest (${prepaidDays} days @ ${(terms.interestRate * 100).toFixed(3)}% on Actual/360 basis)`,
    "",
    `(${formatCurrencyDetailed(prepaidInterest)})`,
  ]);
  totalDeductions += prepaidInterest;

  // Escrow/Reserve Deposits
  disbursementRows.push([
    "Escrow / Reserve Deposits",
    "",
    "[AMOUNT \u2014 TO BE COMPLETED]",
  ]);

  // Separator row — Total Deductions
  disbursementRows.push([
    "Total Deductions (known)",
    "",
    `(${formatCurrencyDetailed(totalDeductions)})`,
  ]);

  // Net Proceeds
  const netProceeds = terms.approvedAmount - totalDeductions;
  disbursementRows.push([
    "Net Proceeds to Borrower (estimated)",
    formatCurrencyDetailed(netProceeds),
    "",
  ]);

  children.push(
    createTable(
      ["Description", "Credit", "Deduction"],
      disbursementRows,
      { columnWidths: [50, 25, 25], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Note: Title/recording charges, escrow deposits, and other third-party charges are subject to final determination at closing. The net proceeds figure above is an estimate and may change.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // 6. Wire Instructions
  children.push(sectionHeading("Wire Transfer Instructions"));

  children.push(
    bodyText(
      "Please wire net proceeds to the following account:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Field", "Entry"],
      [
        ["Bank Name", "[BANK NAME \u2014 TO BE COMPLETED]"],
        ["ABA Routing Number", "[ABA ROUTING NUMBER]"],
        ["Account Number", "[ACCOUNT NUMBER]"],
        ["Account Holder Name", "[ACCOUNT HOLDER NAME]"],
        ["Account Type", "[CHECKING / SAVINGS]"],
        ["Reference / Memo", input.dealId],
        ["FFC (For Further Credit)", "[IF APPLICABLE]"],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // 7. Certification
  children.push(sectionHeading("Certification"));

  children.push(
    bodyText(
      `The undersigned certifies that the wire instructions set forth above are correct and complete. The undersigned acknowledges that ${input.lenderName} may rely on these instructions in making the wire transfer and that ${input.lenderName} shall have no liability for acting in accordance with these instructions.`,
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      `The undersigned further acknowledges that ${input.lenderName} is not responsible for any errors, delays, or losses caused by the receiving financial institution or any intermediary bank. The undersigned agrees to hold ${input.lenderName} harmless from any loss arising from the use of the wire instructions provided herein.`,
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "If the wire instructions change prior to closing, the undersigned must provide updated instructions in writing and signed by an authorized representative. Verbal or email changes to wire instructions will NOT be accepted without additional verification procedures.",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "WARNING: Wire fraud is an increasing risk in real estate transactions. Please verify all wire instructions independently by calling a known, trusted phone number before transmitting funds. Do not rely on wire instructions received via email without independent verification.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // 8. Signature
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  );

  children.push(spacer(4));
  children.push(bodyText(`Date: ${formatDate(input.generatedAt)}`));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));

  if (input.guarantorName) {
    children.push(spacer(12));
    children.push(
      bodyText("GUARANTOR:", { bold: true, color: COLORS.primary }),
    );
    children.push(
      ...signatureBlock(input.guarantorName, "Guarantor"),
    );
  }

  children.push(spacer(12));

  children.push(
    bodyText("ACKNOWLEDGED AND ACCEPTED BY LENDER:", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Lender / Authorized Signatory"),
  );

  // 9. Wrap in legal document shell
  return buildLegalDocument({
    title: "Disbursement Authorization",
    headerRight: `Disbursement Authorization \u2014 ${input.borrowerName}`,
    children,
  });
}
