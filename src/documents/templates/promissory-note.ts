// promissory-note.ts
// Generates a DOCX Promissory Note from deterministic deal terms + AI prose.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  keyTermsTable,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatDate,
  numberToWords,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, PromissoryNoteProse } from "../types";

// Builder

export function buildPromissoryNote(
  input: DocumentInput,
  prose: PromissoryNoteProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const principalWords = numberToWords(terms.approvedAmount).toUpperCase();
  const rateFormatted = formatPercent(terms.interestRate);
  const baseRateFormatted = formatPercent(terms.baseRateValue);
  const spreadFormatted = formatPercent(terms.spread);
  const monthlyPaymentFormatted = formatCurrencyDetailed(terms.monthlyPayment);
  const maturityFormatted = formatDate(input.maturityDate);
  const firstPaymentFormatted = formatDate(input.firstPaymentDate);
  const dateFormatted = formatDate(input.generatedAt);
  const totalPayments = terms.termMonths;
  const hasBalloon = terms.termMonths < terms.amortizationMonths;
  const lateFeePercent = parseFloat((terms.lateFeePercent * 100).toFixed(1)).toString();
  const graceDays = terms.lateFeeGraceDays;

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Promissory Note"));

  // 2. Header info — key terms table
  children.push(
    keyTermsTable([
      { label: "Date", value: dateFormatted },
      { label: "Principal Amount", value: `${principalFormatted} (${principalWords} DOLLARS)` },
      { label: "Maturity Date", value: maturityFormatted },
      { label: "Loan Program", value: input.programName },
      { label: "Borrower", value: input.borrowerName },
    ]),
  );
  children.push(spacer(8));

  // 3. Promise to Pay
  children.push(sectionHeading("1. Promise to Pay"));
  children.push(
    bodyTextRuns([
      { text: "FOR VALUE RECEIVED, ", bold: true },
      { text: input.borrowerName, bold: true, underline: true },
      { text: ` (the "Borrower") promises to pay to the order of ` },
      { text: input.lenderName, bold: true },
      {
        text: ` the principal sum of ${principalFormatted} (${principalWords} DOLLARS), together with interest thereon as set forth herein, in lawful money of the United States of America.`,
      },
    ]),
  );

  // 4. Interest Rate
  children.push(sectionHeading("2. Interest Rate"));
  if (terms.baseRateType.toLowerCase().includes("fixed")) {
    children.push(
      bodyText(
        `This Note shall bear interest at a fixed rate of ${rateFormatted} per annum, calculated on the basis of a 360-day year and actual days elapsed.`,
      ),
    );
  } else {
    children.push(
      bodyText(
        `This Note shall bear interest at a rate of ${rateFormatted} per annum, based on the ${terms.baseRateType} of ${baseRateFormatted} plus a spread of ${spreadFormatted}, calculated on the basis of a 360-day year and actual days elapsed.`,
      ),
    );
    children.push(
      bodyText(
        `The Interest Rate shall adjust monthly on the first day of each month based on the ${terms.baseRateType} in effect on such date. Lender shall provide written notice to Borrower of each rate adjustment within ten (10) days after the adjustment date. In no event shall the interest rate be less than the spread of ${spreadFormatted} or exceed the maximum rate permitted under applicable law.`,
        { italic: true },
      ),
    );
  }

  // 5. Payment Terms
  children.push(sectionHeading("3. Payment Terms"));

  if (terms.interestOnly) {
    children.push(
      bodyText(
        `Borrower shall make monthly interest-only payments in the amount of ${monthlyPaymentFormatted}, commencing on ${firstPaymentFormatted} and continuing on the first day of each successive month thereafter until the Maturity Date of ${maturityFormatted}, at which time the entire outstanding principal balance, together with all accrued and unpaid interest, shall be due and payable in full.`,
      ),
    );
  } else if (hasBalloon) {
    const balloonNote = `This Note is amortized over ${terms.amortizationMonths} months but matures in ${terms.termMonths} months. A balloon payment of the remaining principal balance shall be due on the Maturity Date.`;
    children.push(
      bodyText(
        `Borrower shall make ${totalPayments} consecutive monthly payments of principal and interest in the amount of ${monthlyPaymentFormatted} each, commencing on ${firstPaymentFormatted} and continuing on the first day of each successive month thereafter. ${balloonNote}`,
      ),
    );
  } else {
    children.push(
      bodyText(
        `Borrower shall make ${totalPayments} consecutive monthly payments of principal and interest in the amount of ${monthlyPaymentFormatted} each, commencing on ${firstPaymentFormatted} and continuing on the first day of each successive month thereafter until the principal and all accrued interest are paid in full.`,
      ),
    );
  }

  children.push(
    keyTermsTable([
      { label: "Monthly Payment", value: monthlyPaymentFormatted },
      { label: "First Payment Date", value: firstPaymentFormatted },
      { label: "Number of Payments", value: String(totalPayments) },
      { label: "Payment Type", value: terms.interestOnly ? "Interest Only" : "Principal & Interest" },
      ...(hasBalloon ? [{ label: "Balloon Payment", value: "Due at Maturity" }] : []),
    ]),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "If any payment date falls on a day that is not a Business Day (any day other than Saturday, Sunday, or a day on which banks in the state of the governing law are authorized or required to close), such payment shall be due on the next succeeding Business Day, and interest shall continue to accrue through such extended period.",
      { italic: true },
    ),
  );

  // 6. Application of Payments
  children.push(sectionHeading("4. Application of Payments"));
  children.push(
    bodyText(
      "All payments received shall be applied first to any late charges or fees due, then to accrued and unpaid interest, and finally to the reduction of the outstanding principal balance, unless otherwise required by applicable law.",
    ),
  );

  // 7. Prepayment
  children.push(sectionHeading("5. Prepayment"));
  if (terms.prepaymentPenalty) {
    children.push(
      bodyText(
        "Borrower may prepay this Note in whole or in part at any time, subject to a prepayment premium as set forth in the Loan Agreement. Any partial prepayment shall be applied to the principal balance in inverse order of maturity and shall not postpone the due date of any subsequent installment.",
      ),
    );
  } else {
    children.push(
      bodyText(
        "Borrower may prepay this Note in whole or in part at any time without premium or penalty. Any partial prepayment shall be applied to the principal balance and shall not postpone the due date of any subsequent installment unless otherwise agreed in writing by the Lender.",
      ),
    );
  }

  // 8. Late Charges (deterministic — rules engine owns these numbers)
  children.push(sectionHeading("6. Late Charges"));
  children.push(
    bodyText(
      `If any payment due under this Note is not received by the Lender within ${graceDays} calendar days after the date such payment is due, Borrower shall pay a late charge equal to ${lateFeePercent}% of the overdue payment amount. This late charge is in addition to, and not in lieu of, any other rights or remedies available to the Lender under this Note or applicable law. The assessment of a late charge shall not constitute a waiver of any default or a waiver of any other rights or remedies of the Lender.`,
    ),
  );

  // 9. Default (deterministic baseline + AI prose)
  children.push(sectionHeading("7. Default"));
  children.push(
    bodyText(
      "Each of the following shall constitute an Event of Default under this Note:",
    ),
  );
  children.push(
    bulletPoint(
      "Failure to make any payment of principal or interest within five (5) days of the date when due;",
    ),
  );
  children.push(
    bulletPoint(
      "Failure to perform or observe any covenant or obligation under this Note or any related Loan Document that continues uncured for thirty (30) days after written notice from the Lender;",
    ),
  );
  children.push(
    bulletPoint(
      "Any representation or warranty made by Borrower proves to be materially false or misleading when made;",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower becomes insolvent, makes an assignment for the benefit of creditors, or files or has filed against it any petition in bankruptcy or for reorganization;",
    ),
  );
  children.push(
    bulletPoint(
      "A judgment in excess of $50,000 (or 10% of the principal amount, whichever is greater) is entered against Borrower and remains unsatisfied or unbonded for thirty (30) days;",
    ),
  );
  children.push(
    bulletPoint(
      "Default under any other agreement with the Lender or default under any agreement involving indebtedness exceeding $50,000 (cross-default);",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Default Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.defaultProvisions));

  // 10. Acceleration (deterministic baseline + AI prose)
  children.push(sectionHeading("8. Acceleration"));
  children.push(
    bodyText(
      "Upon the occurrence of any Event of Default, the Lender may, at its option and without further notice or demand, declare the entire unpaid principal balance of this Note, together with all accrued and unpaid interest and all other amounts due hereunder, immediately due and payable. Upon such acceleration, Borrower shall pay to the Lender, in addition to all principal and interest, all costs and expenses of collection, including reasonable attorneys' fees, court costs, and other expenses incurred in enforcing this Note.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Acceleration Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.accelerationClause));

  // 11. Waivers (deterministic baseline + AI prose)
  children.push(sectionHeading("9. Waivers"));
  children.push(
    bodyText(
      "Borrower and all endorsers, sureties, and guarantors of this Note hereby waive presentment for payment, demand, notice of dishonor, protest, and notice of protest, and agree that this Note and any or all payments coming due hereunder may be extended from time to time by the Lender without in any way affecting the liability of Borrower or any endorser, surety, or guarantor hereof.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Waiver Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.waiverProvisions));

  // 12. Governing Law (AI prose)
  children.push(sectionHeading("10. Governing Law"));
  children.push(bodyText(prose.governingLawClause));

  // 13. Miscellaneous (AI prose)
  children.push(sectionHeading("11. Miscellaneous"));
  children.push(bodyText(prose.miscellaneousProvisions));

  // Jury Trial Waiver
  children.push(sectionHeading("12. Jury Trial Waiver"));
  children.push(
    bodyText(
      "BORROWER AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT EITHER MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION BASED HEREON, OR ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS NOTE, THE LOAN AGREEMENT, OR ANY OTHER LOAN DOCUMENT, OR ANY COURSE OF CONDUCT, COURSE OF DEALING, STATEMENTS, OR ACTIONS OF EITHER PARTY. THIS WAIVER IS A MATERIAL INDUCEMENT FOR THE LENDER TO MAKE THE LOAN.",
    ),
  );

  // Severability
  children.push(sectionHeading("13. Severability"));
  children.push(
    bodyText(
      "If any provision of this Note is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not in any way be affected or impaired thereby, and the invalid, illegal, or unenforceable provision shall be modified to the minimum extent necessary to make it valid, legal, and enforceable while preserving its original intent.",
    ),
  );

  // Counterparts
  children.push(sectionHeading("14. Counterparts and Electronic Signatures"));
  children.push(
    bodyText(
      "This Note may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Signatures delivered by facsimile or electronic means (including PDF) shall be deemed original signatures for all purposes.",
    ),
  );

  // Usury Savings Clause
  children.push(sectionHeading("15. Usury Savings Clause"));
  children.push(
    bodyText(
      "Notwithstanding any provision of this Note to the contrary, in no event shall the interest rate charged hereunder exceed the maximum rate permitted by applicable law (the \"Maximum Lawful Rate\"). If the rate of interest payable under this Note would otherwise exceed the Maximum Lawful Rate, the rate shall be automatically reduced to the Maximum Lawful Rate. Any interest collected in excess of the Maximum Lawful Rate shall be applied first to reduce the outstanding principal balance, and any remaining excess shall be refunded to the Borrower. In determining whether the interest paid or payable exceeds the Maximum Lawful Rate, Borrower and Lender shall, to the maximum extent permitted by applicable law: (a) characterize any non-principal payment as an expense, fee, or premium rather than as interest; (b) exclude voluntary prepayments and the effects thereof; and (c) spread the total amount of interest throughout the entire contemplated term of the Note so that the interest rate is uniform throughout the entire term.",
    ),
  );

  // 15. Signature blocks
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      `The undersigned has executed this Promissory Note as of the date first written above.`,
    ),
  );

  // Borrower signature
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.borrowerName, "Authorized Signatory"));

  // Lender signature
  children.push(spacer(12));
  children.push(
    bodyText("ACCEPTED AND AGREED — LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Authorized Signatory"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Promissory Note",
    headerRight: `Promissory Note — ${input.borrowerName}`,
    children,
  });
}
