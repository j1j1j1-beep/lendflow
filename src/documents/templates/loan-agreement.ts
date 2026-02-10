// =============================================================================
// loan-agreement.ts
// Generates a DOCX Loan Agreement from deterministic deal terms + AI prose.
// =============================================================================

import {
  Document,
  Paragraph,
  Table,
  PageBreak,
  buildLegalDocument,
  documentTitle,
  articleHeading,
  sectionSubheading,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  numberedItem,
  spacer,
  signatureBlock,
  partyBlock,
  keyTermsTable,
  createTable,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatDate,
  numberToWords,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

import type {
  DocumentInput,
  LoanAgreementProse,
  ConditionItem,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function conditionsByCategory(
  conditions: ConditionItem[],
  category: ConditionItem["category"],
): ConditionItem[] {
  return conditions.filter((c) => c.category === category);
}

function categoryLabel(cat: ConditionItem["category"]): string {
  switch (cat) {
    case "prior_to_closing":
      return "Conditions Prior to Closing";
    case "prior_to_funding":
      return "Conditions Prior to Funding";
    case "post_closing":
      return "Post-Closing Conditions";
  }
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildLoanAgreement(
  input: DocumentInput,
  prose: LoanAgreementProse,
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
  const hasBalloon = terms.termMonths < terms.amortizationMonths;
  const lateFeePercent = parseFloat((terms.lateFeePercent * 100).toFixed(1)).toString();
  const graceDays = terms.lateFeeGraceDays;
  const debtThreshold = formatCurrency(Math.round(terms.approvedAmount * 0.1));

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("Loan Agreement"));
  children.push(spacer(4));
  children.push(
    bodyText(`Effective Date: ${dateFormatted}`, { bold: true }),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 2. Parties
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      "This Loan Agreement (this \"Agreement\") is entered into as of the date set forth above, by and between:",
    ),
  );
  children.push(spacer(4));
  children.push(partyBlock("BORROWER", input.borrowerName, "the \"Borrower\""));
  children.push(bodyText("and"));
  children.push(partyBlock("LENDER", input.lenderName, "the \"Lender\""));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 3. Recitals (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(4));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:",
      { bold: true },
    ),
  );

  // -----------------------------------------------------------------------
  // 4. Article I — Definitions
  // -----------------------------------------------------------------------
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(articleHeading("I", "Definitions"));
  children.push(
    bodyText(
      "The following terms shall have the meanings set forth below when used in this Agreement:",
    ),
  );
  children.push(spacer(4));

  const definitionRows: Array<{ label: string; value: string }> = [
    { label: "Loan Amount", value: `${principalFormatted} (${principalWords} DOLLARS)` },
    { label: "Interest Rate", value: rateFormatted },
    { label: "Base Rate", value: `${terms.baseRateType} at ${baseRateFormatted}` },
    { label: "Spread", value: spreadFormatted },
    { label: "Term", value: `${terms.termMonths} months` },
    { label: "Amortization", value: `${terms.amortizationMonths} months` },
    { label: "Maturity Date", value: maturityFormatted },
    { label: "Monthly Payment", value: monthlyPaymentFormatted },
    { label: "First Payment Date", value: firstPaymentFormatted },
    { label: "Loan Program", value: input.programName },
  ];

  if (terms.ltv !== null) {
    definitionRows.push({ label: "Loan-to-Value", value: `${(terms.ltv * 100).toFixed(1)}%` });
  }
  if (input.propertyAddress) {
    definitionRows.push({ label: "Property Address", value: input.propertyAddress });
  }

  children.push(keyTermsTable(definitionRows));

  children.push(spacer(4));
  children.push(
    bodyText(
      "In addition to the terms defined elsewhere in this Agreement, the following terms shall have the meanings set forth below:",
    ),
  );
  children.push(
    bodyTextRuns([
      { text: '"Business Day" ', bold: true },
      { text: `means any day other than Saturday, Sunday, or a day on which banks in ${input.stateAbbr ?? "the applicable state"} are authorized or required to close.` },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: '"Event of Default" ', bold: true },
      { text: "means any event set forth in Article VII hereof." },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: '"Loan Documents" ', bold: true },
      { text: "means this Agreement, the Note, the Security Agreement, and all other documents executed in connection with the Loan." },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: '"Obligations" ', bold: true },
      { text: "means all amounts owed by Borrower to Lender under the Loan Documents, including principal, interest, fees, costs, expenses, and indemnification amounts." },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: '"Material Adverse Effect" ', bold: true },
      { text: "means a material adverse change in the business, operations, properties, assets, or financial condition of Borrower." },
    ]),
  );

  // -----------------------------------------------------------------------
  // 5. Article II — The Loan
  // -----------------------------------------------------------------------
  children.push(articleHeading("II", "The Loan"));

  children.push(sectionSubheading("2.1", "Commitment"));
  children.push(
    bodyText(
      `Subject to the terms and conditions of this Agreement, Lender agrees to make a single term loan advance to Borrower in the principal amount of ${principalFormatted} (the "Loan"). This is a term loan facility and not a revolving facility. Once repaid, whether in whole or in part, Borrower shall have no right to re-borrow any amount, and Lender's commitment hereunder shall terminate.`,
    ),
  );

  children.push(sectionSubheading("2.2", "Disbursement"));
  children.push(
    bodyText(
      "The Loan proceeds shall be disbursed on the Closing Date to Borrower or as otherwise directed by Borrower in writing, after satisfaction of all conditions precedent set forth herein.",
    ),
  );

  children.push(sectionSubheading("2.3", "Use of Proceeds"));
  children.push(
    bodyText(
      `Borrower shall use the Loan proceeds solely for the following purpose: ${input.loanPurpose ?? "general business purposes"}. Borrower shall not use the Loan proceeds for any other purpose without the prior written consent of Lender.`,
    ),
  );

  children.push(sectionSubheading("2.4", "Promissory Note"));
  children.push(
    bodyText(
      "The Loan shall be evidenced by a Promissory Note of even date herewith in the principal amount of the Loan (the \"Note\"), executed by Borrower in favor of Lender.",
    ),
  );

  // -----------------------------------------------------------------------
  // 6. Article III — Interest and Payments
  // -----------------------------------------------------------------------
  children.push(articleHeading("III", "Interest and Payments"));

  children.push(sectionSubheading("3.1", "Interest Rate"));
  if (terms.baseRateType.toLowerCase().includes("fixed")) {
    children.push(
      bodyText(
        `The outstanding principal balance of the Loan shall bear interest at a fixed rate of ${rateFormatted} per annum, calculated on the basis of a 360-day year and actual days elapsed.`,
      ),
    );
  } else {
    children.push(
      bodyText(
        `The outstanding principal balance of the Loan shall bear interest at a variable rate equal to the ${terms.baseRateType} (currently ${baseRateFormatted}) plus a spread of ${spreadFormatted}, resulting in an initial rate of ${rateFormatted} per annum, calculated on the basis of a 360-day year and actual days elapsed.`,
      ),
    );
    children.push(
      bodyText(
        `The Interest Rate shall adjust monthly on the first day of each month based on the ${terms.baseRateType} in effect on such date. Lender shall provide written notice to Borrower of each rate adjustment within ten (10) days after the adjustment date.`,
        { italic: true },
      ),
    );
  }

  children.push(sectionSubheading("3.2", "Payment Schedule"));
  if (terms.interestOnly) {
    children.push(
      bodyText(
        `Borrower shall make monthly interest-only payments of ${monthlyPaymentFormatted}, commencing on ${firstPaymentFormatted} and continuing on the first day of each month thereafter until the Maturity Date, at which time the entire outstanding principal balance together with all accrued and unpaid interest shall be due and payable in full.`,
      ),
    );
  } else if (hasBalloon) {
    children.push(
      bodyText(
        `Borrower shall make ${terms.termMonths} consecutive monthly payments of principal and interest in the amount of ${monthlyPaymentFormatted}, commencing on ${firstPaymentFormatted} and continuing on the first day of each month thereafter, based on an amortization schedule of ${terms.amortizationMonths} months. On the Maturity Date, a balloon payment of the remaining principal balance together with all accrued and unpaid interest shall be due and payable in full.`,
      ),
    );
  } else {
    children.push(
      bodyText(
        `Borrower shall make ${terms.termMonths} consecutive monthly payments of principal and interest in the amount of ${monthlyPaymentFormatted}, commencing on ${firstPaymentFormatted} and continuing on the first day of each month thereafter until the Loan is paid in full.`,
      ),
    );
  }

  children.push(sectionSubheading("3.3", "Application of Payments"));
  children.push(
    bodyText(
      "All payments shall be applied first to any late charges or fees due, then to accrued and unpaid interest, and finally to the reduction of the outstanding principal balance, unless otherwise required by applicable law.",
    ),
  );
  children.push(
    bodyText(
      "Notwithstanding the foregoing, during the continuance of an Event of Default, Lender may apply payments in such order and manner as Lender deems appropriate, including to collection costs, attorneys' fees, and other expenses of enforcement.",
      { italic: true },
    ),
  );

  children.push(sectionSubheading("3.4", "Late Fees"));
  children.push(
    bodyText(
      `If any payment is not received by Lender within ${graceDays} days of its due date, Borrower shall pay a late charge equal to ${lateFeePercent}% of the overdue amount, or the maximum amount permitted by applicable law, whichever is less.`,
    ),
  );

  children.push(sectionSubheading("3.5", "Prepayment"));
  if (terms.prepaymentPenalty) {
    children.push(
      bodyText(
        "Borrower may prepay the Loan in whole or in part, subject to a prepayment premium as specified in the Note. Any partial prepayment shall be applied to the principal balance in inverse order of maturity.",
      ),
    );
  } else {
    children.push(
      bodyText(
        "Borrower may prepay the Loan in whole or in part at any time without premium or penalty. Any partial prepayment shall be applied to the principal balance and shall not postpone the due date of any subsequent installment.",
      ),
    );
  }

  // -----------------------------------------------------------------------
  // 7. Article IV — Representations and Warranties (AI prose)
  // -----------------------------------------------------------------------
  children.push(articleHeading("IV", "Representations and Warranties"));
  children.push(
    bodyText(
      "Borrower represents and warrants to Lender as of the date hereof and as of each date on which any amount is outstanding under this Agreement:",
    ),
  );
  children.push(
    numberedItem(
      `Organization and Good Standing: Borrower is duly organized, validly existing, and in good standing under the laws of ${input.stateAbbr ?? "its state of organization"}.`,
    ),
  );
  children.push(
    numberedItem(
      "Authority: Borrower has full power and authority to execute, deliver, and perform this Agreement and all related Loan Documents.",
    ),
  );
  children.push(
    numberedItem(
      "No Conflicts: The execution and delivery of this Agreement and the consummation of the transactions contemplated hereby do not violate any law, regulation, order, or agreement binding on Borrower.",
    ),
  );
  children.push(
    numberedItem(
      "Financial Statements: All financial statements and information provided to Lender are true, correct, and complete in all material respects as of the date provided.",
    ),
  );
  children.push(
    numberedItem(
      "No Litigation: There is no litigation, action, suit, or proceeding pending or, to Borrower's knowledge, threatened against Borrower that could have a Material Adverse Effect.",
    ),
  );
  children.push(
    numberedItem(
      "Taxes: Borrower has filed all required tax returns and paid all taxes due and payable, except those being contested in good faith with adequate reserves.",
    ),
  );
  for (const rep of ensureProseArray(prose.representations)) {
    children.push(numberedItem(rep));
  }

  // -----------------------------------------------------------------------
  // 8. Article V — Covenants
  // -----------------------------------------------------------------------
  children.push(articleHeading("V", "Covenants"));
  children.push(
    bodyText(
      "Until the Loan and all other obligations hereunder are paid and performed in full, Borrower covenants and agrees as follows:",
    ),
  );

  // Affirmative covenants from terms
  children.push(sectionSubheading("5.1", "Financial Covenants"));
  if (terms.covenants.length > 0) {
    children.push(
      createTable(
        ["Covenant", "Description", "Threshold", "Frequency"],
        terms.covenants.map((c) => [
          c.name,
          c.description,
          c.threshold !== undefined ? String(c.threshold) : "N/A",
          c.frequency.charAt(0).toUpperCase() + c.frequency.slice(1),
        ]),
        { columnWidths: [25, 40, 15, 20], alternateRows: true },
      ),
    );
  } else {
    children.push(bodyText("No specific financial covenants apply to this Loan."));
  }

  children.push(sectionSubheading("5.2", "Reporting Requirements"));
  children.push(
    bulletPoint(
      "Borrower shall deliver to Lender annual audited (or reviewed) financial statements within 120 days of fiscal year-end.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall deliver quarterly unaudited financial statements within 45 days of each quarter-end.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall deliver annual federal income tax returns (with all schedules) within 30 days of filing.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall promptly notify Lender of any material adverse change in its financial condition or operations.",
    ),
  );

  children.push(sectionSubheading("5.3", "Negative Covenants"));
  children.push(
    bulletPoint(
      `Borrower shall not incur any additional indebtedness in excess of ${debtThreshold} without the prior written consent of Lender.`,
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall not sell, transfer, or otherwise dispose of any material assets outside the ordinary course of business without the prior written consent of Lender.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall not change its legal structure, ownership, or management without the prior written consent of Lender.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall not create, incur, assume, or permit any lien or encumbrance on any of its assets except for Permitted Liens (liens in favor of Lender, purchase money liens, and liens existing as of the date hereof).",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall not merge, consolidate, or sell all or substantially all of its assets, and shall not permit any change in the ownership or control of Borrower, without the prior written consent of Lender.",
    ),
  );
  children.push(
    bulletPoint(
      "Borrower shall not make any distributions, dividends, or payments to its owners or equity holders without the prior written consent of Lender, except for tax distributions in an amount not exceeding the Borrower's actual tax liability attributable to the Borrower's income.",
    ),
  );

  // -----------------------------------------------------------------------
  // 9. Article VI — Conditions Precedent
  // -----------------------------------------------------------------------
  children.push(articleHeading("VI", "Conditions Precedent"));
  children.push(
    bodyText(
      "The obligation of Lender to make the Loan is subject to the satisfaction (or waiver by Lender) of the following conditions:",
    ),
  );

  const categories: ConditionItem["category"][] = [
    "prior_to_closing",
    "prior_to_funding",
    "post_closing",
  ];

  for (const cat of categories) {
    const items = conditionsByCategory(terms.conditions, cat);
    if (items.length === 0) continue;

    children.push(
      bodyText(categoryLabel(cat), { bold: true, color: COLORS.primary }),
    );

    children.push(
      createTable(
        ["Condition", "Source", "Priority"],
        items.map((c) => [
          c.description,
          c.source,
          c.priority.charAt(0).toUpperCase() + c.priority.slice(1),
        ]),
        { columnWidths: [55, 25, 20], alternateRows: true },
      ),
    );
    children.push(spacer(4));
  }

  if (terms.conditions.length === 0) {
    children.push(bodyText("Standard closing conditions apply as determined by Lender."));
  }

  // -----------------------------------------------------------------------
  // 10. Article VII — Events of Default (AI prose)
  // -----------------------------------------------------------------------
  children.push(articleHeading("VII", "Events of Default"));
  children.push(
    bodyText(
      "Each of the following shall constitute an Event of Default under this Agreement:",
    ),
  );
  children.push(
    numberedItem(
      "Non-Payment: Failure to pay any principal, interest, or other amount due within five (5) days of the date when due.",
    ),
  );
  children.push(
    numberedItem(
      "Breach of Covenant: Failure to perform any covenant hereunder that continues uncured for thirty (30) days after written notice from Lender (or ten (10) days for financial covenants).",
    ),
  );
  children.push(
    numberedItem(
      "False Representation: Any representation or warranty proves to be materially false or misleading when made.",
    ),
  );
  children.push(
    numberedItem(
      "Cross-Default: Default under any other agreement with Lender or under any agreement involving indebtedness exceeding $50,000.",
    ),
  );
  children.push(
    numberedItem(
      "Insolvency: Borrower becomes insolvent, makes an assignment for the benefit of creditors, or files or has filed against it any bankruptcy or insolvency proceeding.",
    ),
  );
  children.push(
    numberedItem(
      "Judgment: Any judgment exceeding $50,000 is entered against Borrower and remains unsatisfied or unbonded for thirty (30) days.",
    ),
  );
  children.push(
    numberedItem(
      "Material Adverse Change: Any event or condition occurs that constitutes a Material Adverse Effect.",
    ),
  );
  for (const event of ensureProseArray(prose.eventsOfDefault)) {
    children.push(numberedItem(event));
  }

  // -----------------------------------------------------------------------
  // 11. Article VIII — Remedies (AI prose)
  // -----------------------------------------------------------------------
  children.push(articleHeading("VIII", "Remedies"));
  children.push(bodyText(prose.remediesOnDefault));

  // -----------------------------------------------------------------------
  // 12. Article IX — Fees
  // -----------------------------------------------------------------------
  children.push(articleHeading("IX", "Fees and Expenses"));

  if (terms.fees.length > 0) {
    children.push(
      bodyText(
        "Borrower agrees to pay the following fees in connection with the Loan:",
      ),
    );
    children.push(spacer(4));
    children.push(
      createTable(
        ["Fee", "Amount", "Description"],
        terms.fees.map((f) => [
          f.name,
          formatCurrencyDetailed(f.amount),
          f.description,
        ]),
        { columnWidths: [25, 20, 55], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText("No additional fees apply beyond those set forth in the Note."),
    );
  }

  children.push(spacer(4));
  children.push(
    bodyText(
      "Borrower shall also be responsible for all reasonable out-of-pocket costs and expenses incurred by Lender in connection with the origination, documentation, and administration of the Loan, including but not limited to legal fees, appraisal fees, title insurance premiums, and recording charges.",
    ),
  );
  children.push(
    bodyText(
      "All such costs and expenses shall be paid by Borrower at or before closing, or with Lender's consent, may be deducted from the Loan proceeds at closing.",
      { italic: true },
    ),
  );

  // -----------------------------------------------------------------------
  // 13. Article X — Miscellaneous (AI prose)
  // -----------------------------------------------------------------------
  children.push(articleHeading("X", "Miscellaneous"));

  children.push(sectionSubheading("10.1", "Waiver and Amendment"));
  children.push(bodyText(prose.waiverAndAmendment));

  children.push(sectionSubheading("10.2", "Notices"));
  children.push(bodyText(prose.noticeProvisions));

  children.push(sectionSubheading("10.3", "Governing Law"));
  children.push(bodyText(prose.governingLaw));

  children.push(sectionSubheading("10.4", "General Provisions"));
  children.push(bodyText(prose.miscellaneous));

  children.push(sectionSubheading("10.5", "Jury Trial Waiver"));
  children.push(
    bodyText(
      "BORROWER AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT EITHER MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION BASED HEREON, OR ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT, THE NOTE, OR ANY OTHER LOAN DOCUMENT.",
    ),
  );

  children.push(sectionSubheading("10.6", "Severability"));
  children.push(
    bodyText(
      "If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.",
    ),
  );

  children.push(sectionSubheading("10.7", "Counterparts"));
  children.push(
    bodyText(
      "This Agreement may be executed in counterparts, each of which shall be deemed an original. Signatures delivered by electronic means shall be deemed original signatures.",
    ),
  );

  // Special terms (if any)
  if (terms.specialTerms && terms.specialTerms.length > 0) {
    children.push(sectionSubheading("10.8", "Special Terms"));
    for (const st of terms.specialTerms) {
      // Handle both SpecialTerm objects and plain strings (from AI structuring)
      if (typeof st === "string") {
        children.push(bodyText(st));
      } else {
        children.push(
          bodyTextRuns([
            { text: `${st.title}. `, bold: true },
            { text: st.description },
          ]),
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // 14. Signature blocks
  // -----------------------------------------------------------------------
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "IN WITNESS WHEREOF, the parties hereto have caused this Loan Agreement to be duly executed as of the date first written above.",
    ),
  );

  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.borrowerName, "Authorized Signatory"));

  children.push(spacer(12));

  children.push(
    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Authorized Signatory"));

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Loan Agreement",
    headerRight: `Loan Agreement — ${input.borrowerName}`,
    children,
  });
}
