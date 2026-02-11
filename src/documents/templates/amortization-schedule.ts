// amortization-schedule.ts
// Generates a DOCX Amortization Schedule — pure math, zero AI prose.
// All numbers derived from DocumentInput (rules engine output).

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  createTable,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Builder

export function buildAmortizationSchedule(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Amortization Schedule"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "This Amortization Schedule is attached as an exhibit to and incorporated by reference in the Promissory Note and Loan Agreement of even date herewith.",
      { italic: true },
    ),
  );
  children.push(spacer(4));

  // 2. Key Terms Table
  children.push(
    keyTermsTable([
      { label: "Borrower", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      {
        label: "Loan Amount",
        value: formatCurrency(terms.approvedAmount),
      },
      {
        label: "Interest Rate",
        value: formatPercent(terms.interestRate),
      },
      { label: "Term", value: `${terms.termMonths} months` },
      {
        label: "Amortization",
        value: `${terms.amortizationMonths} months`,
      },
      {
        label: "Monthly Payment",
        value: formatCurrencyDetailed(terms.monthlyPayment),
      },
      {
        label: "First Payment Date",
        value: formatDate(input.firstPaymentDate),
      },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      {
        label: "Interest Only",
        value: terms.interestOnly ? "Yes" : "No",
      },
    ]),
  );
  children.push(spacer(8));

  // 3. Payment Schedule — amortization table
  children.push(sectionHeading("Payment Schedule"));

  const principal = terms.approvedAmount;
  const monthlyRate = terms.interestRate / 12;
  const payment = terms.monthlyPayment;
  const termMonths = terms.termMonths;
  const isIO = terms.interestOnly;

  let balance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;
  const rows: string[][] = [];

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment: number;
    let monthPayment: number;

    if (isIO) {
      // Interest-only: pay only interest, no principal reduction
      principalPayment = 0;
      monthPayment = interestPayment;
    } else {
      monthPayment = payment;
      principalPayment = monthPayment - interestPayment;
      // Last payment adjustment
      if (month === termMonths || principalPayment > balance) {
        principalPayment = balance;
        monthPayment = principalPayment + interestPayment;
      }
    }

    balance = Math.max(0, balance - principalPayment);
    totalInterest += interestPayment;
    totalPrincipal += principalPayment;

    if (balance <= 0.01 && !isIO) {
      // Calculate payment date for this final row before breaking
      const baseDate = new Date(input.firstPaymentDate);
      const baseDay = Math.min(baseDate.getDate(), 28);
      const payDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (month - 1), baseDay);

      rows.push([
        month.toString(),
        formatDate(payDate),
        formatCurrencyDetailed(monthPayment),
        formatCurrencyDetailed(principalPayment),
        formatCurrencyDetailed(interestPayment),
        formatCurrencyDetailed(balance),
      ]);
      break;
    }

    // Calculate payment date (cap day at 28 to avoid end-of-month rollover)
    const baseDate = new Date(input.firstPaymentDate);
    const baseDay = Math.min(baseDate.getDate(), 28);
    const payDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (month - 1), baseDay);

    rows.push([
      month.toString(),
      formatDate(payDate),
      formatCurrencyDetailed(monthPayment),
      formatCurrencyDetailed(principalPayment),
      formatCurrencyDetailed(interestPayment),
      formatCurrencyDetailed(balance),
    ]);
  }

  // If there's a balloon (balance > 0 at end), add balloon row
  let balloonAmount = 0;
  if (balance > 0.01) {
    balloonAmount = balance;
    totalPrincipal += balance;
    rows.push([
      "Balloon",
      formatDate(input.maturityDate),
      formatCurrencyDetailed(balance),
      formatCurrencyDetailed(balance),
      formatCurrencyDetailed(0),
      formatCurrencyDetailed(0),
    ]);
  }

  children.push(
    createTable(
      ["#", "Payment Date", "Payment", "Principal", "Interest", "Balance"],
      rows,
      {
        columnWidths: [8, 18, 18, 18, 18, 20],
        alternateRows: true,
      },
    ),
  );
  children.push(spacer(8));

  // 4. Summary
  children.push(sectionHeading("Summary"));

  const summaryRows: string[][] = [
    ["Original Principal", formatCurrency(principal)],
    ["Total Interest Paid", formatCurrency(totalInterest)],
    ["Total Principal Paid", formatCurrency(totalPrincipal)],
    [
      "Total of All Payments",
      formatCurrency(totalInterest + totalPrincipal),
    ],
  ];

  if (balloonAmount > 0.01) {
    summaryRows.push([
      "Balloon Payment at Maturity",
      formatCurrency(balloonAmount),
    ]);
  }

  children.push(
    createTable(["Description", "Amount"], summaryRows, {
      columnWidths: [50, 50],
      alternateRows: true,
    }),
  );
  children.push(spacer(8));

  // 5. Important Notes
  children.push(sectionHeading("Important Notes"));

  children.push(
    bodyText(
      "This amortization schedule is based on the terms set forth in the Promissory Note and Loan Agreement.",
    ),
  );
  children.push(
    bodyText(
      "Monthly interest is calculated as the annual rate divided by 12. Prorated interest on the Settlement Statement uses an Actual/360 day count basis and may differ from the monthly amounts shown here.",
    ),
  );
  children.push(
    bodyText(
      "Actual payment amounts may vary slightly due to rounding.",
    ),
  );
  children.push(
    bodyText(
      "This schedule assumes no prepayments are made during the term of the Loan. Actual outstanding balances may differ if prepayments are made.",
    ),
  );

  if (terms.prepaymentPenalty) {
    children.push(
      bodyText(
        "Prepayment may be subject to penalties as set forth in the Promissory Note.",
      ),
    );
  }

  if (!terms.baseRateType.toLowerCase().includes("fixed")) {
    children.push(
      bodyText(
        "For variable rate loans, this schedule reflects the initial interest rate. Actual payments will adjust based on index rate changes.",
      ),
    );
  }

  children.push(spacer(4));
  children.push(
    bodyText(
      "This schedule is provided for informational purposes only and does not modify the terms of the Loan Documents.",
      { italic: true },
    ),
  );

  // 6. Wrap in legal document shell
  return buildLegalDocument({
    title: "Amortization Schedule",
    headerRight: `Amortization Schedule — ${input.borrowerName}`,
    children,
  });
}
