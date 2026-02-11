// loan-estimate.ts
// Generates a DOCX TRID-compliant Loan Estimate — pure math, zero AI prose.
// All numbers derived from DocumentInput (rules engine output).
// Must be provided within 3 business days of application (Reg Z / TRID).
//
// IMPORTANT: This custom DOCX output does NOT constitute the exact CFPB model form
// H-24 (Loan Estimate) and therefore does NOT provide safe harbor protection
// under TILA-RESPA Integrated Disclosure (TRID) rules. The lender must verify their
// own form compliance with 12 CFR 1026.37 and Appendix H-24 before use in production.

import {
  Document,
  Paragraph,
  Table,
  PageBreak,
  TextRun,
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
  formatPercentShort,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Helpers

function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((utcB - utcA) / (1000 * 60 * 60 * 24));
}

function perDiem(principal: number, rate: number): number {
  return (principal * rate) / 365;
}

/**
 * APR calculation using the actuarial method per Reg Z Appendix J.
 * Uses Newton-Raphson iteration to solve for the periodic rate r in:
 *   loanAmount = monthlyPayment * [(1 - (1+r)^-n) / r]
 * This is REQUIRED by Regulation Z; the N-ratio approximation can diverge
 * 20-40bps on 30-year loans, exceeding the 1/8% (12.5bps) tolerance.
 */
function calculateAPR_actuarial(
  loanAmount: number,
  totalFinanceCharge: number,
  monthlyPayment: number,
  termMonths: number,
): number {
  if (loanAmount <= 0 || termMonths <= 0 || monthlyPayment <= 0) return 0;
  // Newton-Raphson to find monthly rate
  let r = monthlyPayment / loanAmount; // initial guess
  for (let i = 0; i < 100; i++) {
    const pv = monthlyPayment * (1 - Math.pow(1 + r, -termMonths)) / r;
    const dpv = monthlyPayment * ((-termMonths * Math.pow(1 + r, -termMonths - 1) * r - (1 - Math.pow(1 + r, -termMonths))) / (r * r));
    const newR = r - (pv - loanAmount) / dpv;
    if (Math.abs(newR - r) < 1e-10) break;
    r = newR;
  }
  return r * 12 * 100; // annualize and convert to percentage
}

/** Categorize fees into origination, services not shopped, services shopped */
function categorizeFees(fees: DocumentInput["terms"]["fees"]): {
  origination: typeof fees;
  notShopped: typeof fees;
  shopped: typeof fees;
} {
  const origination: typeof fees = [];
  const notShopped: typeof fees = [];
  const shopped: typeof fees = [];

  for (const fee of fees) {
    const lower = fee.name.toLowerCase();
    if (
      lower.includes("origination") ||
      lower.includes("discount") ||
      lower.includes("underwriting") ||
      lower.includes("processing") ||
      lower.includes("application") ||
      lower.includes("commitment")
    ) {
      origination.push(fee);
    } else if (
      lower.includes("appraisal") ||
      lower.includes("credit report") ||
      lower.includes("flood") ||
      lower.includes("tax service")
    ) {
      notShopped.push(fee);
    } else {
      shopped.push(fee);
    }
  }

  return { origination, notShopped, shopped };
}

// Builder

export function buildLoanEstimate(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  const hasBalloon = terms.termMonths < terms.amortizationMonths;
  const monthlyRate = terms.interestRate / 12;
  const isIO = terms.interestOnly;

  // Calculate balloon amount if applicable
  let balloonAmount = 0;
  if (hasBalloon && !isIO) {
    let balance = terms.approvedAmount;
    for (let m = 1; m <= terms.termMonths; m++) {
      const interest = balance * monthlyRate;
      const principal = terms.monthlyPayment - interest;
      balance = Math.max(0, balance - principal);
    }
    balloonAmount = balance;
  } else if (hasBalloon && isIO) {
    balloonAmount = terms.approvedAmount;
  }

  // PAGE 1: Loan Terms + Projected Payments + Costs at Closing
  children.push(documentTitle("Loan Estimate"));
  children.push(spacer(4));

  // Header info
  children.push(
    createTable(
      ["Item", "Detail"],
      [
        ["Date Issued", formatDate(input.generatedAt)],
        ["Applicant", input.borrowerName],
        ["Property", input.propertyAddress ?? "[Property Address]"],
        ["Sale Price", "[To Be Determined]"],
        ["Loan Term", `${terms.termMonths} months`],
        ["Purpose", input.loanPurpose ?? "Business / Investment"],
        ["Loan Program", input.programName],
      ],
      { columnWidths: [30, 70], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Loan Terms Table
  children.push(sectionHeading("Loan Terms"));

  const productType = terms.baseRateType.toLowerCase().includes("fixed")
    ? "Fixed Rate"
    : "Adjustable Rate";

  children.push(
    createTable(
      ["Term", "Value", "Details"],
      [
        [
          "Loan Amount",
          formatCurrency(terms.approvedAmount),
          "",
        ],
        [
          "Interest Rate",
          formatPercentShort(terms.interestRate),
          productType === "Fixed Rate" ? "This rate is locked for the loan term." : "This rate may change. See adjustable rate details.",
        ],
        [
          "Monthly Principal & Interest",
          formatCurrencyDetailed(terms.monthlyPayment),
          isIO ? "Interest only for the loan term." : "",
        ],
        [
          "Prepayment Penalty",
          terms.prepaymentPenalty ? "Yes" : "No",
          terms.prepaymentPenalty ? "See Note for details." : "",
        ],
        [
          "Balloon Payment",
          hasBalloon ? "Yes" : "No",
          hasBalloon ? `Estimated: ${formatCurrency(balloonAmount)} due at maturity.` : "",
        ],
      ],
      { columnWidths: [30, 25, 45], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Projected Payments
  children.push(sectionHeading("Projected Payments"));

  const estimatedEscrow = 0;
  const estimatedMI = 0;
  const estimatedTotalMonthly = terms.monthlyPayment + estimatedEscrow + estimatedMI;

  children.push(
    createTable(
      ["Payment Calculation", "Amount"],
      [
        ["Principal & Interest", formatCurrencyDetailed(terms.monthlyPayment)],
        ["Mortgage Insurance", formatCurrencyDetailed(estimatedMI)],
        ["Estimated Escrow", formatCurrencyDetailed(estimatedEscrow)],
        ["Estimated Total Monthly Payment", formatCurrencyDetailed(estimatedTotalMonthly)],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Estimated Taxes, Insurance & Assessments: Amounts may vary. Actual amounts depend on property tax assessments, insurance premiums, and applicable assessments.",
      { italic: true },
    ),
  );
  children.push(spacer(6));

  // Costs at Closing
  children.push(sectionHeading("Costs at Closing"));

  let totalFees = 0;
  for (const fee of terms.fees) {
    totalFees += fee.amount;
  }

  // Prepaids
  const daysToFirst = daysBetween(input.generatedAt, input.firstPaymentDate);
  const perDiemAmount = perDiem(terms.approvedAmount, terms.interestRate);
  const prepaidInterest = perDiemAmount * daysToFirst;
  const recordingFees = 150;
  const totalEstimatedClosingCosts = totalFees + prepaidInterest + recordingFees;

  // Cash to close estimate
  const estimatedCashToClose = totalEstimatedClosingCosts;

  children.push(
    createTable(
      ["Item", "Amount"],
      [
        ["Estimated Closing Costs", formatCurrencyDetailed(totalEstimatedClosingCosts)],
        ["Estimated Cash to Close", formatCurrencyDetailed(estimatedCashToClose)],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Closing Costs include loan costs and other costs. Estimated Cash to Close includes closing costs. These estimates may change.",
      { italic: true },
    ),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 2: Closing Cost Details
  children.push(sectionHeading("Estimated Closing Cost Details"));

  const categorized = categorizeFees(terms.fees);

  // Section A: Loan Costs
  children.push(bodyText("Section A — Loan Costs", { bold: true }));
  children.push(spacer(2));

  // A.1 Origination Charges
  children.push(bodyText("A.1 Origination Charges", { bold: true, indent: 0.25 }));
  let originationTotal = 0;
  const originationRows: string[][] = [];
  for (const fee of categorized.origination) {
    originationRows.push([`  ${fee.name}`, formatCurrencyDetailed(fee.amount)]);
    originationTotal += fee.amount;
  }
  if (originationRows.length === 0) {
    originationRows.push(["  No origination charges", formatCurrencyDetailed(0)]);
  }
  originationRows.push(["  Subtotal Origination Charges", formatCurrencyDetailed(originationTotal)]);
  children.push(
    createTable(["Description", "Amount"], originationRows, {
      columnWidths: [65, 35],
      alternateRows: true,
    }),
  );
  children.push(spacer(4));

  // A.2 Services You Cannot Shop For
  children.push(bodyText("A.2 Services You Cannot Shop For", { bold: true, indent: 0.25 }));
  let notShoppedTotal = 0;
  const notShoppedRows: string[][] = [];
  for (const fee of categorized.notShopped) {
    notShoppedRows.push([`  ${fee.name}`, formatCurrencyDetailed(fee.amount)]);
    notShoppedTotal += fee.amount;
  }
  if (notShoppedRows.length === 0) {
    notShoppedRows.push(["  None", formatCurrencyDetailed(0)]);
  }
  notShoppedRows.push(["  Subtotal", formatCurrencyDetailed(notShoppedTotal)]);
  children.push(
    createTable(["Description", "Amount"], notShoppedRows, {
      columnWidths: [65, 35],
      alternateRows: true,
    }),
  );
  children.push(spacer(4));

  // A.3 Services You Can Shop For
  children.push(bodyText("A.3 Services You Can Shop For", { bold: true, indent: 0.25 }));
  let shoppedTotal = 0;
  const shoppedRows: string[][] = [];
  for (const fee of categorized.shopped) {
    shoppedRows.push([`  ${fee.name}`, formatCurrencyDetailed(fee.amount)]);
    shoppedTotal += fee.amount;
  }
  if (shoppedRows.length === 0) {
    shoppedRows.push(["  None", formatCurrencyDetailed(0)]);
  }
  shoppedRows.push(["  Subtotal", formatCurrencyDetailed(shoppedTotal)]);
  children.push(
    createTable(["Description", "Amount"], shoppedRows, {
      columnWidths: [65, 35],
      alternateRows: true,
    }),
  );
  children.push(spacer(4));

  const totalLoanCosts = originationTotal + notShoppedTotal + shoppedTotal;

  // Section B: Other Costs
  children.push(bodyText("Section B — Other Costs", { bold: true }));
  children.push(spacer(2));

  children.push(bodyText("Taxes and Government Fees", { bold: true, indent: 0.25 }));
  children.push(
    createTable(
      ["Description", "Amount"],
      [
        ["  Recording Fees (Estimated)", formatCurrencyDetailed(recordingFees)],
        ["  Transfer Taxes (Estimated)", formatCurrencyDetailed(0)],
      ],
      { columnWidths: [65, 35], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Prepaids", { bold: true, indent: 0.25 }));
  children.push(
    createTable(
      ["Description", "Amount"],
      [
        [
          `  Prepaid Interest (${formatCurrencyDetailed(perDiemAmount)}/day x ${daysToFirst} days)`,
          formatCurrencyDetailed(prepaidInterest),
        ],
        ["  Homeowner's Insurance Premium", formatCurrencyDetailed(0)],
        ["  Property Taxes (Estimated)", formatCurrencyDetailed(0)],
      ],
      { columnWidths: [65, 35], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  children.push(
    bodyTextRuns([
      { text: "Total Estimated Closing Costs: ", bold: true },
      { text: formatCurrencyDetailed(totalEstimatedClosingCosts), bold: true },
    ]),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 3: Comparisons + Other Considerations
  children.push(sectionHeading("Comparisons"));

  // In 5 Years calculations
  const monthsIn5Years = Math.min(60, terms.termMonths);
  const totalPayments5Years = terms.monthlyPayment * monthsIn5Years;

  // Principal paid in 5 years
  let principalPaid5Years = 0;
  if (!isIO) {
    let balance = terms.approvedAmount;
    for (let m = 1; m <= monthsIn5Years; m++) {
      const interest = balance * monthlyRate;
      const principalPmt = Math.min(terms.monthlyPayment - interest, balance);
      principalPaid5Years += principalPmt;
      balance = Math.max(0, balance - principalPmt);
    }
  }

  // APR and TIP
  const totalRegularPayments = terms.monthlyPayment * terms.termMonths;
  const totalOfPayments = totalRegularPayments + balloonAmount;
  const totalPrepaidFinanceCharges = prepaidInterest;
  const financeCharge = totalOfPayments - terms.approvedAmount + totalPrepaidFinanceCharges;
  const amountFinanced = terms.approvedAmount - totalPrepaidFinanceCharges;
  // APR (Reg Z Appendix J actuarial method — Newton-Raphson iteration)
  const apr = calculateAPR_actuarial(amountFinanced, financeCharge, terms.monthlyPayment, terms.termMonths);
  const totalInterest = totalOfPayments - terms.approvedAmount;
  const tip = terms.approvedAmount > 0 ? (totalInterest / terms.approvedAmount) * 100 : 0;

  children.push(
    createTable(
      ["Comparison", "Value"],
      [
        ["In 5 Years — Total You Will Have Paid", formatCurrencyDetailed(totalPayments5Years)],
        ["In 5 Years — Principal You Will Have Paid Off", formatCurrencyDetailed(principalPaid5Years)],
        ["Annual Percentage Rate (APR)", `${apr.toFixed(3)}%`],
        ["Total Interest Percentage (TIP)", `${tip.toFixed(3)}%`],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "The APR and TIP shown are estimates. Your actual costs may vary.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Other Considerations
  children.push(sectionHeading("Other Considerations"));

  children.push(bodyText("Appraisal", { bold: true }));
  children.push(
    bodyText(
      terms.requiresAppraisal
        ? "We may order an appraisal to determine the property's value and charge you for this appraisal. We will promptly give you a copy of any appraisal, even if your loan does not close. You can pay for an additional appraisal for your own use at your own cost."
        : "An appraisal may not be required for this transaction.",
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Assumption", { bold: true }));
  children.push(
    bodyText(
      "If you sell or transfer this property to another person, your lender will not allow assumption of this loan on the original terms.",
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Homeowner's Insurance", { bold: true }));
  children.push(
    bodyText(
      "This loan may require homeowner's insurance on the property, which you may obtain from an insurance company of your choice, provided the coverage meets your lender's requirements.",
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Late Payment", { bold: true }));
  children.push(
    bodyText(
      `If your payment is more than ${terms.lateFeeGraceDays} days late, your lender will charge a late fee of ${formatPercentShort(terms.lateFeePercent)} of the monthly principal and interest payment.`,
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Servicing", { bold: true }));
  children.push(
    bodyText(
      "We intend to service your loan. If so, you will make payments to us. We may transfer servicing of your loan.",
    ),
  );
  children.push(spacer(8));

  // Confirm Receipt
  children.push(sectionHeading("Confirm Receipt"));
  children.push(
    bodyText(
      "By signing, you are only confirming that you have received this form. You do not have to accept this loan because you have signed or received this form.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      `This estimate is valid for 10 business days from the date issued (${formatDate(input.generatedAt)}).`,
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Signature blocks
  children.push(
    bodyText("APPLICANT:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Applicant"),
  );

  children.push(spacer(12));

  children.push(
    bodyText("CO-APPLICANT (if applicable):", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("____________________________", "Co-Applicant"),
  );

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Loan Estimate",
    headerRight: `Loan Estimate — ${input.borrowerName}`,
    children,
  });
}
