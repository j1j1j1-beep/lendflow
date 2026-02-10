// =============================================================================
// commitment-letter.ts
// Generates a DOCX Commitment Letter from deterministic deal terms + AI prose.
// The commitment letter is the lender's formal offer to the borrower specifying
// all loan terms and conditions. It is what the borrower receives and signs.
// =============================================================================

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
  createTable,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatDate,
  numberToWords,
  collateralLabel,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, ConditionItem, CommitmentLetterProse } from "../types";

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

export function buildCommitmentLetter(
  input: DocumentInput,
  prose: CommitmentLetterProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const principalWords = numberToWords(terms.approvedAmount).toUpperCase();
  const rateFormatted = formatPercent(terms.interestRate);
  const baseRateFormatted = formatPercent(terms.baseRateValue);
  const spreadFormatted = formatPercent(terms.spread);
  const monthlyPaymentFormatted = formatCurrencyDetailed(terms.monthlyPayment);
  const maturityFormatted = formatDate(input.maturityDate);
  const dateFormatted = formatDate(input.generatedAt);
  const hasBalloon = terms.termMonths < terms.amortizationMonths;
  const termDisplay =
    terms.termMonths >= 12
      ? `${terms.termMonths} months (${(terms.termMonths / 12).toFixed(1)} years)`
      : `${terms.termMonths} months`;
  const amortizationDisplay =
    terms.amortizationMonths >= 12
      ? `${terms.amortizationMonths} months (${(terms.amortizationMonths / 12).toFixed(1)} years)`
      : `${terms.amortizationMonths} months`;

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Letterhead — Lender name, date, title
  // -----------------------------------------------------------------------
  children.push(
    bodyText(input.lenderName, { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(dateFormatted));
  children.push(spacer(8));
  children.push(documentTitle("Commitment Letter"));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 2. Addressee
  // -----------------------------------------------------------------------
  children.push(bodyText(`Dear ${input.borrowerName},`));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 3. Opening paragraph (AI prose)
  // -----------------------------------------------------------------------
  children.push(bodyText(prose.openingParagraph));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 4. Loan Terms Summary Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Loan Terms Summary"));

  const loanTermsRows: Array<{ label: string; value: string }> = [
    { label: "Borrower", value: input.borrowerName },
    { label: "Loan Program", value: input.programName },
    {
      label: "Loan Amount",
      value: `${principalFormatted} (${principalWords} DOLLARS)`,
    },
  ];

  // Interest rate with breakdown
  if (terms.baseRateType.toLowerCase().includes("fixed")) {
    loanTermsRows.push({
      label: "Interest Rate",
      value: `${rateFormatted} (Fixed)`,
    });
  } else {
    loanTermsRows.push({
      label: "Interest Rate",
      value: `${rateFormatted} (${terms.baseRateType} at ${baseRateFormatted} + ${spreadFormatted} spread)`,
    });
  }

  loanTermsRows.push({ label: "Term", value: termDisplay });
  loanTermsRows.push({
    label: "Amortization",
    value: terms.interestOnly ? "Interest Only" : amortizationDisplay,
  });
  loanTermsRows.push({
    label: "Monthly Payment",
    value: monthlyPaymentFormatted,
  });
  loanTermsRows.push({ label: "Maturity Date", value: maturityFormatted });

  if (terms.ltv !== null) {
    loanTermsRows.push({
      label: "Loan-to-Value (LTV)",
      value: `${(terms.ltv * 100).toFixed(1)}%`,
    });
  }

  loanTermsRows.push({
    label: "Prepayment Penalty",
    value: terms.prepaymentPenalty ? "Yes — per Loan Agreement" : "None",
  });
  loanTermsRows.push({
    label: "Personal Guaranty",
    value: terms.personalGuaranty ? "Required" : "Not Required",
  });

  if (hasBalloon) {
    loanTermsRows.push({
      label: "Balloon Payment",
      value: "Due at Maturity",
    });
  }

  if (input.propertyAddress) {
    loanTermsRows.push({
      label: "Property Address",
      value: input.propertyAddress,
    });
  }

  children.push(keyTermsTable(loanTermsRows));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 5. Fees Schedule
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Fees Schedule"));

  if (terms.fees.length > 0) {
    children.push(
      bodyText(
        "The following fees are associated with this loan commitment and shall be due as specified:",
      ),
    );
    children.push(spacer(4));
    children.push(
      createTable(
        ["Fee", "Amount", "Due", "Description"],
        terms.fees.map((f) => [
          f.name,
          formatCurrencyDetailed(f.amount),
          "At Closing",
          f.description,
        ]),
        { columnWidths: [20, 18, 14, 48], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText(
        "No additional fees apply beyond standard closing costs as set forth in the Loan Agreement.",
      ),
    );
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 6. Collateral
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Collateral"));

  if (input.collateralTypes.length > 0) {
    children.push(
      bodyText(
        "The Loan shall be secured by the following collateral:",
      ),
    );
    for (const collateral of input.collateralTypes) {
      children.push(bulletPoint(collateralLabel(collateral)));
    }
  } else {
    children.push(
      bodyText("Collateral requirements shall be as specified in the Loan Agreement."),
    );
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 7. Covenants
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Financial Covenants"));

  if (terms.covenants.length > 0) {
    children.push(
      bodyText(
        "Borrower shall maintain compliance with the following financial covenants throughout the term of the Loan:",
      ),
    );
    children.push(spacer(4));
    children.push(
      createTable(
        ["Covenant", "Description", "Threshold", "Frequency"],
        terms.covenants.map((c) => [
          c.name,
          c.description,
          c.threshold !== undefined ? String(c.threshold) : "N/A",
          c.frequency ? c.frequency.charAt(0).toUpperCase() + c.frequency.slice(1) : "N/A",
        ]),
        { columnWidths: [25, 40, 15, 20], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText("No specific financial covenants apply to this Loan."),
    );
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 8. Conditions Precedent (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Conditions Precedent"));
  children.push(
    bodyText(
      "This commitment is subject to the satisfaction of the following conditions prior to closing:",
    ),
  );

  for (const condition of ensureProseArray(prose.conditionsPrecedent)) {
    children.push(bulletPoint(condition));
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 9. Conditions from Deal — grouped by category
  // -----------------------------------------------------------------------
  if (terms.conditions.length > 0) {
    children.push(sectionHeading("Additional Conditions"));

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
  }

  // -----------------------------------------------------------------------
  // 10. Special Terms
  // -----------------------------------------------------------------------
  if (terms.specialTerms && terms.specialTerms.length > 0) {
    children.push(sectionHeading("Special Terms"));

    for (const st of terms.specialTerms) {
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
    children.push(spacer(8));
  }

  // -----------------------------------------------------------------------
  // 11. Representations Required (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Representations"));
  children.push(bodyText(prose.representationsRequired));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 12. Commitment Expiration (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Commitment Expiration"));
  children.push(bodyText(prose.expirationClause));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Material Adverse Change Clause (deterministic — not AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Material Adverse Change"));
  children.push(
    bodyText(
      "This commitment is subject to no material adverse change in the financial condition, business, assets, operations, or prospects of the Borrower or any Guarantor occurring between the date hereof and the date of closing. Lender reserves the right to withdraw or modify this commitment if, in Lender's sole discretion, any such material adverse change has occurred.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Commitment Termination Events
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Commitment Termination"));
  children.push(
    bodyText(
      "In addition to expiration by its terms, this commitment shall automatically terminate upon: (a) the discovery of any material misrepresentation in the information provided by Borrower in connection with the Loan application; (b) any material adverse change in the financial condition, operations, or business of Borrower or any Guarantor; (c) any change in applicable law or regulation that would make the Loan as contemplated herein illegal or impracticable; or (d) Borrower's failure to provide any required documentation within the time periods specified herein.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Indemnification and Expenses (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Indemnification and Expenses"));
  children.push(
    bodyText(
      "Borrower agrees to indemnify and hold Lender harmless from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to this commitment or the transactions contemplated hereby. Borrower shall be responsible for all costs and expenses incurred by Lender in connection with the Loan, including but not limited to appraisal fees, environmental assessment fees, title insurance premiums, recording fees, and reasonable attorneys' fees, whether or not the Loan closes.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Confidentiality (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Confidentiality"));
  children.push(
    bodyText(
      "This Commitment Letter is for the confidential use of the Borrower and may not be disclosed, in whole or in part, to any third party without the prior written consent of the Lender, except as required by applicable law or regulation, or as may be necessary in connection with the closing of the Loan (e.g., disclosure to Borrower's legal counsel, accountants, or other professional advisors).",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Assignability (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Assignability"));
  children.push(
    bodyText(
      "This commitment is personal to the Borrower and may not be assigned or transferred by the Borrower without the prior written consent of the Lender. The Lender may assign its rights and obligations under this commitment without the consent of the Borrower.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Time is of the Essence
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Time is of the Essence"));
  children.push(
    bodyText(
      "Time is of the essence with respect to all dates and deadlines set forth in this Commitment Letter. Failure to satisfy all conditions precedent and close the Loan on or before the commitment expiration date shall, at Lender's option, render this commitment null and void without further obligation of Lender.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Disclaimer (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Disclaimer"));
  children.push(
    bodyText(
      "This Commitment Letter does not constitute a binding agreement to lend until all conditions precedent have been satisfied and all loan documents have been executed and delivered. The terms and conditions set forth herein are subject to the preparation, execution, and delivery of definitive loan documentation in form and substance satisfactory to the Lender and its counsel.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 13. Governing Law (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Standard legal provisions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Additional Standard Provisions"));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: BORROWER AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS COMMITMENT LETTER.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Severability: If any provision of this Commitment Letter is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Counterparts: This Commitment Letter may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 14. Acceptance Block — signatures for lender and borrower
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Acceptance"));
  children.push(
    bodyText(
      "If the foregoing terms and conditions are acceptable, please indicate your acceptance by signing and returning this Commitment Letter. Your signature below constitutes your agreement to the terms set forth herein.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText("Sincerely,", { italic: true }),
  );
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(spacer(4));

  // Lender signature
  children.push(
    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Authorized Signatory"));

  children.push(spacer(16));

  // Borrower acceptance
  children.push(
    bodyText("ACCEPTED AND AGREED — BORROWER:", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      "By signing below, Borrower accepts the terms and conditions set forth in this Commitment Letter and agrees to proceed with the Loan as described herein.",
    ),
  );
  children.push(...signatureBlock(input.borrowerName, "Authorized Signatory"));

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Commitment Letter",
    headerRight: `Commitment Letter — ${input.borrowerName}`,
    children,
  });
}
