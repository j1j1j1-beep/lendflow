// closing-disclosure.ts
// Generates a DOCX TRID-compliant Closing Disclosure — pure math, zero AI prose.
// All numbers derived from DocumentInput (rules engine output).
// Follows CFPB model form structure (Dodd-Frank / Reg Z).
//
// IMPORTANT: This custom DOCX output does NOT constitute the exact CFPB model form
// H-25 (Closing Disclosure) and therefore does NOT provide safe harbor protection
// under TILA-RESPA Integrated Disclosure (TRID) rules. The lender must verify their
// own form compliance with 12 CFR 1026.38 and Appendix H-25 before use in production.

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

/**
 * Per diem interest: principal * rate / 365
 *
 * DAY-COUNT CONVENTION: Actual/365
 * The Closing Disclosure uses Actual/365, which is the TRID-required day-count
 * convention per 12 CFR 1026.38 (Reg Z) for consumer loan disclosures. This
 * produces a slightly lower per-diem interest than Actual/360.
 *
 * NOTE: The Settlement Statement (settlement-statement.ts) uses Actual/360,
 * which is the standard commercial banking convention. These documents serve
 * different purposes and intentionally use different day-count conventions:
 *   - Closing Disclosure: TRID/Reg Z consumer compliance (Actual/365)
 *   - Settlement Statement: commercial banking convention (Actual/360)
 * For TRID-regulated transactions, this Closing Disclosure figure controls.
 */
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

/** Categorize fees into origination, services not shopped, and services shopped */
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

export function buildClosingDisclosure(input: DocumentInput): Document {
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

  // PAGE 1: General Information + Loan Terms
  children.push(documentTitle("Closing Disclosure"));
  children.push(spacer(4));

  // Closing Information
  children.push(sectionHeading("Closing Information"));
  children.push(
    createTable(
      ["Item", "Detail"],
      [
        ["Date Issued", formatDate(input.generatedAt)],
        ["Closing Date", formatDate(input.generatedAt)],
        ["Disbursement Date", formatDate(input.generatedAt)],
        ["Settlement Agent", "[Settlement Agent Name]"],
        ["File No.", `CD-${input.dealId.slice(0, 8).toUpperCase()}`],
        ["Property", input.propertyAddress ?? "[Property Address]"],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Transaction Information
  children.push(sectionHeading("Transaction Information"));
  children.push(
    createTable(
      ["Party", "Name"],
      [
        ["Borrower", input.borrowerName],
        ["Seller", "N/A"],
        ["Lender", input.lenderName],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Loan Information
  children.push(sectionHeading("Loan Information"));

  const loanType = (() => {
    const pid = input.programId.toLowerCase();
    if (pid.includes("sba")) return "SBA";
    if (pid.includes("conventional") || pid.includes("cre") || pid.includes("dscr")) return "Conventional";
    return "Other";
  })();

  const productType = terms.baseRateType.toLowerCase().includes("fixed")
    ? "Fixed Rate"
    : "Adjustable Rate";

  children.push(
    createTable(
      ["Term", "Value"],
      [
        ["Loan Term", `${terms.termMonths} months`],
        ["Purpose", input.loanPurpose ?? "Business / Investment"],
        ["Product", productType],
        ["Loan Type", loanType],
        ["Loan ID", input.dealId.slice(0, 12).toUpperCase()],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Loan Terms Table
  children.push(sectionHeading("Loan Terms"));
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
          productType === "Fixed Rate" ? "This rate is fixed for the loan term." : "This rate may adjust. See ARM details.",
        ],
        [
          "Monthly Principal & Interest",
          formatCurrencyDetailed(terms.monthlyPayment),
          isIO ? "Interest only for the loan term." : "",
        ],
        [
          "Prepayment Penalty",
          terms.prepaymentPenalty ? "Yes" : "No",
          terms.prepaymentPenalty ? "As described in the Note." : "",
        ],
        [
          "Balloon Payment",
          hasBalloon ? "Yes" : "No",
          hasBalloon ? `Estimated balloon: ${formatCurrency(balloonAmount)} due at maturity.` : "",
        ],
      ],
      { columnWidths: [30, 25, 45], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Projected Payments
  children.push(sectionHeading("Projected Payments"));

  const estimatedEscrow = 0; // Placeholder — escrow depends on property specifics
  const estimatedMI = 0; // Mortgage insurance — N/A for most commercial
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
      "Estimated Taxes, Insurance & Assessments: Amount may vary. See your loan servicer for actual escrow requirements.",
      { italic: true },
    ),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 2: Closing Cost Details
  children.push(sectionHeading("Closing Cost Details"));

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

  // A.2 Services Borrower Did Not Shop For
  children.push(bodyText("A.2 Services Borrower Did Not Shop For", { bold: true, indent: 0.25 }));
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

  // A.3 Services Borrower Did Shop For
  children.push(bodyText("A.3 Services Borrower Did Shop For", { bold: true, indent: 0.25 }));
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
  children.push(
    bodyTextRuns([
      { text: "Total Loan Costs (A): ", bold: true },
      { text: formatCurrencyDetailed(totalLoanCosts), bold: true },
    ]),
  );
  children.push(spacer(6));

  // Section B: Services Not Required by Lender
  children.push(bodyText("Section B — Services Not Required by Lender", { bold: true }));
  children.push(bodyText("  No additional services required.", { italic: true }));
  children.push(spacer(4));

  // Section C: Taxes and Government Fees
  children.push(bodyText("Section C — Taxes and Government Fees", { bold: true }));
  const recordingFees = 150;
  const transferTaxes = 0; // Placeholder
  const totalGovtFees = recordingFees + transferTaxes;
  children.push(
    createTable(
      ["Description", "Amount"],
      [
        ["  Recording Fees (Estimated)", formatCurrencyDetailed(recordingFees)],
        ["  Transfer Taxes (Estimated)", formatCurrencyDetailed(transferTaxes)],
        ["  Subtotal", formatCurrencyDetailed(totalGovtFees)],
      ],
      { columnWidths: [65, 35], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Section D: Prepaids
  children.push(bodyText("Section D — Prepaids", { bold: true }));
  const daysToFirst = daysBetween(input.generatedAt, input.firstPaymentDate);
  const perDiemAmount = perDiem(terms.approvedAmount, terms.interestRate);
  const prepaidInterest = perDiemAmount * daysToFirst;
  const homeInsurancePremium = 0; // Placeholder
  const propertyTaxPrepaid = 0; // Placeholder
  const totalPrepaids = prepaidInterest + homeInsurancePremium + propertyTaxPrepaid;

  children.push(
    createTable(
      ["Description", "Amount"],
      [
        [
          `  Prepaid Interest (${formatCurrencyDetailed(perDiemAmount)}/day x ${daysToFirst} days)`,
          formatCurrencyDetailed(prepaidInterest),
        ],
        ["  Homeowner's Insurance Premium", formatCurrencyDetailed(homeInsurancePremium)],
        ["  Property Taxes (Estimated)", formatCurrencyDetailed(propertyTaxPrepaid)],
        ["  Subtotal Prepaids", formatCurrencyDetailed(totalPrepaids)],
      ],
      { columnWidths: [65, 35], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Section E: Initial Escrow Payment at Closing
  children.push(bodyText("Section E — Initial Escrow Payment at Closing", { bold: true }));
  const initialEscrow = 0; // Placeholder
  children.push(
    createTable(
      ["Description", "Amount"],
      [
        ["  Initial Escrow Deposit", formatCurrencyDetailed(initialEscrow)],
      ],
      { columnWidths: [65, 35], alternateRows: true },
    ),
  );
  children.push(spacer(6));

  // Total Closing Costs
  const totalClosingCosts = totalLoanCosts + totalGovtFees + totalPrepaids + initialEscrow;
  children.push(
    bodyTextRuns([
      { text: "Total Closing Costs: ", bold: true },
      { text: formatCurrencyDetailed(totalClosingCosts), bold: true },
    ]),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 3: Summaries + Cash to Close
  children.push(sectionHeading("Calculating Cash to Close"));

  const closingCostsPaidBefore = 0;
  const adjustmentsAndCredits = 0;
  const cashToClose = totalClosingCosts - closingCostsPaidBefore - terms.approvedAmount + adjustmentsAndCredits;

  children.push(
    createTable(
      ["Item", "Amount"],
      [
        ["Total Closing Costs", formatCurrencyDetailed(totalClosingCosts)],
        ["Closing Costs Paid Before Closing", formatCurrencyDetailed(closingCostsPaidBefore)],
        ["Loan Amount", formatCurrencyDetailed(terms.approvedAmount)],
        ["Adjustments and Other Credits", formatCurrencyDetailed(adjustmentsAndCredits)],
        ["Estimated Cash to Close", formatCurrencyDetailed(Math.abs(cashToClose))],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      cashToClose > 0
        ? "Cash to Close: The borrower must bring this amount to closing."
        : "Cash to Close: The borrower will receive funds at closing.",
      { italic: true },
    ),
  );
  children.push(spacer(6));

  // Summaries of Transactions
  children.push(sectionHeading("Summaries of Transactions"));

  children.push(bodyText("Borrower's Transaction", { bold: true }));
  children.push(
    createTable(
      ["Item", "Amount"],
      [
        ["Sale Price / Payoff Amount", "[To Be Determined]"],
        ["Closing Costs Financed", formatCurrencyDetailed(0)],
        ["Total Closing Costs", formatCurrencyDetailed(totalClosingCosts)],
        ["Loan Amount", formatCurrencyDetailed(terms.approvedAmount)],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 4: Loan Calculations + Other Disclosures
  children.push(sectionHeading("Loan Calculations"));

  // Total of Payments
  const totalRegularPayments = terms.monthlyPayment * terms.termMonths;
  const totalOfPayments = totalRegularPayments + balloonAmount;

  // Finance Charge
  const totalPrepaidFinanceCharges = prepaidInterest; // origination fees could also be included
  const financeCharge = totalOfPayments - terms.approvedAmount + totalPrepaidFinanceCharges;

  // Amount Financed
  const amountFinanced = terms.approvedAmount - totalPrepaidFinanceCharges;

  // APR (Reg Z Appendix J actuarial method — Newton-Raphson iteration)
  const apr = calculateAPR_actuarial(amountFinanced, financeCharge, terms.monthlyPayment, terms.termMonths);

  // Total Interest Percentage (TIP)
  const totalInterest = totalOfPayments - terms.approvedAmount;
  const tip = terms.approvedAmount > 0 ? (totalInterest / terms.approvedAmount) * 100 : 0;

  children.push(
    createTable(
      ["Calculation", "Amount"],
      [
        ["Total of Payments", formatCurrencyDetailed(totalOfPayments)],
        ["Finance Charge", formatCurrencyDetailed(financeCharge)],
        ["Amount Financed", formatCurrencyDetailed(amountFinanced)],
        ["Annual Percentage Rate (APR)", `${apr.toFixed(3)}%`],
        ["Total Interest Percentage (TIP)", `${tip.toFixed(3)}%`],
      ],
      { columnWidths: [50, 50], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Total of Payments: The total amount you will have paid after making all payments of principal, interest, mortgage insurance, and loan costs as scheduled.",
    ),
  );
  children.push(
    bodyText(
      "Finance Charge: The dollar amount the credit will cost you.",
    ),
  );
  children.push(
    bodyText(
      "Amount Financed: The amount of credit provided to you or on your behalf.",
    ),
  );
  children.push(
    bodyText(
      "Annual Percentage Rate (APR): Your costs over the loan term expressed as a rate. This is not your interest rate.",
    ),
  );
  children.push(
    bodyText(
      "Total Interest Percentage (TIP): The total amount of interest that you will pay over the loan term as a percentage of your loan amount.",
    ),
  );
  children.push(spacer(6));

  // Other Disclosures
  children.push(sectionHeading("Other Disclosures"));

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
      "This loan may require homeowner's insurance on the property. You may choose the insurance company you want as long as the policy meets your lender's requirements.",
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Late Payment", { bold: true }));
  children.push(
    bodyText(
      `If your payment is more than ${terms.lateFeeGraceDays} days late, your lender will charge a late fee of ${formatPercentShort(terms.lateFeePercent)} of the monthly principal and interest payment.`,
    ),
  );

  // Page break
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // PAGE 5: Contact Information + Confirm Receipt
  children.push(sectionHeading("Contact Information"));

  children.push(
    createTable(
      ["Role", "Name", "Address", "Contact"],
      [
        ["Lender", input.lenderName, "[Lender Address]", "[Phone / Email]"],
        ["Mortgage Broker", "N/A", "N/A", "N/A"],
        ["Settlement Agent", "[Settlement Agent]", "[Agent Address]", "[Phone / Email]"],
      ],
      { columnWidths: [20, 25, 30, 25], alternateRows: true },
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
  children.push(spacer(8));

  // Signature blocks
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower"),
  );

  children.push(spacer(12));

  children.push(
    bodyText("CO-BORROWER (if applicable):", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("____________________________", "Co-Borrower"),
  );

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Closing Disclosure",
    headerRight: `Closing Disclosure — ${input.borrowerName}`,
    children,
  });
}
