// =============================================================================
// subordination-agreement.ts
// Generates a DOCX Subordination Agreement from deterministic deal terms + AI prose.
// Establishes priority between creditors when borrower has existing debt that
// needs to be subordinated to the new (senior) loan.
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
  spacer,
  signatureBlock,
  partyBlock,
  keyTermsTable,
  formatCurrency,
  formatDate,
  numberToWords,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, SubordinationProse } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSubordinationAgreement(
  input: DocumentInput,
  prose: SubordinationProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const principalWords = numberToWords(terms.approvedAmount).toUpperCase();
  const dateFormatted = formatDate(input.generatedAt);
  const maturityFormatted = formatDate(input.maturityDate);

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("Subordination Agreement"));

  // -----------------------------------------------------------------------
  // 2. Parties — Senior Creditor (lender), Subordinate Creditor, Borrower
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      `This Subordination Agreement (this "Agreement") is entered into as of ${dateFormatted}, by and among:`,
    ),
  );
  children.push(spacer(4));
  children.push(
    partyBlock("SENIOR CREDITOR", input.lenderName, 'the "Senior Creditor"'),
  );
  children.push(bodyText("and"));
  children.push(
    partyBlock(
      "SUBORDINATE CREDITOR",
      input.subordinateCreditorName ?? "[Subordinate Creditor]",
      'the "Subordinate Creditor"',
    ),
  );
  children.push(bodyText("and"));
  children.push(
    partyBlock("BORROWER", input.borrowerName, 'the "Borrower"'),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 3. Recitals
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Senior Creditor", bold: true },
      {
        text: ` has agreed to extend credit to Borrower in the principal amount of ${principalFormatted} (${principalWords} DOLLARS) (the "Senior Debt") pursuant to that certain Loan Agreement of even date herewith; and`,
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Subordinate Creditor", bold: true },
      {
        text: ' holds or will hold certain indebtedness of Borrower (the "Subordinate Debt"); and',
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      {
        text: "as a condition to making the Senior Debt available, Senior Creditor requires that the Subordinate Debt be subordinated to the Senior Debt on the terms set forth herein;",
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:",
      { bold: true },
    ),
  );

  // -----------------------------------------------------------------------
  // 4. Key Terms Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      {
        label: "Senior Loan Amount",
        value: `${principalFormatted} (${principalWords} DOLLARS)`,
      },
      { label: "Senior Creditor", value: input.lenderName },
      { label: "Borrower", value: input.borrowerName },
      { label: "Maturity Date (Senior Debt)", value: maturityFormatted },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 5. Subordination Terms (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("1. Subordination Terms"));
  children.push(
    bodyText(
      "The Subordinate Creditor hereby agrees that the Subordinate Debt is and shall at all times remain subordinate and junior in right of payment and priority to the Senior Debt. The Subordinate Creditor shall not demand, accept, or receive any payment on account of the Subordinate Debt (whether of principal, interest, fees, or otherwise) until the Senior Debt has been indefeasibly paid and satisfied in full and all commitments under the Senior Debt documents have been terminated.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Subordination Terms:", { bold: true }),
  );
  children.push(bodyText(prose.subordinationTerms));

  // -----------------------------------------------------------------------
  // 6. Senior Debt Description (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("2. Senior Debt Description"));
  children.push(bodyText(prose.seniorDebtDescription));

  // -----------------------------------------------------------------------
  // 7. Subordinate Debt Description (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("3. Subordinate Debt Description"));
  children.push(bodyText(prose.subordinateDebtDescription));

  // -----------------------------------------------------------------------
  // 8. Payment Restrictions (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("4. Payment Restrictions"));
  children.push(
    bodyText(
      "Until the Senior Debt has been indefeasibly paid and satisfied in full: (a) the Subordinate Creditor shall not demand, accept, or receive any payment (whether of principal, interest, or otherwise) on the Subordinate Debt, except for regularly scheduled payments of interest only, and only so long as no Event of Default under the Senior Debt documents has occurred and is continuing; (b) if the Subordinate Creditor receives any payment in violation of this Agreement, the Subordinate Creditor shall hold such payment in trust for the Senior Creditor and immediately turn it over to the Senior Creditor for application to the Senior Debt.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Payment Restrictions:", { bold: true }),
  );
  children.push(bodyText(prose.paymentRestrictions));

  // -----------------------------------------------------------------------
  // 9. Standstill Provisions (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("5. Standstill Provisions"));
  children.push(
    bodyText(
      "Upon the occurrence of an event of default under the Subordinate Debt documents, the Subordinate Creditor shall provide written notice thereof to the Senior Creditor and shall not, for a period of one hundred eighty (180) days following such notice (the \"Standstill Period\"): (a) take any action to accelerate the Subordinate Debt; (b) commence or join in any enforcement action, foreclosure, or other remedy with respect to any collateral securing the Subordinate Debt; (c) commence or join in any involuntary bankruptcy proceeding against the Borrower; or (d) take any other action that would interfere with the Senior Creditor's rights under the Senior Debt documents. After the expiration of the Standstill Period, the Subordinate Creditor may exercise its remedies, subject to the subordination and payment priority provisions of this Agreement.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Standstill Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.standstillProvisions));

  // -----------------------------------------------------------------------
  // 10. Turnover Provisions (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("6. Turnover Provisions"));
  children.push(
    bodyText(
      "If the Subordinate Creditor receives any payment or distribution on account of the Subordinate Debt in violation of this Agreement, including in any bankruptcy or insolvency proceeding, the Subordinate Creditor shall: (a) hold such payment or distribution in trust for the benefit of the Senior Creditor; (b) promptly deliver such payment or distribution to the Senior Creditor for application to the Senior Debt; and (c) take any action the Senior Creditor may reasonably request to enforce and protect the Senior Creditor's rights under this Agreement.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Turnover Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.turnoverProvisions));

  // -----------------------------------------------------------------------
  // Representations and Warranties
  // -----------------------------------------------------------------------
  children.push(sectionHeading("7. Representations and Warranties"));
  children.push(
    bodyText(
      "Each party represents and warrants that: (a) it has the power and authority to execute, deliver, and perform this Agreement; (b) this Agreement has been duly authorized, executed, and delivered and constitutes a valid and binding obligation enforceable in accordance with its terms; (c) the execution and delivery of this Agreement does not violate any law, regulation, or agreement binding upon such party; and (d) no consent, approval, or authorization of any governmental authority or other person is required in connection with the execution and delivery of this Agreement.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Amendment and Modification Restriction
  // -----------------------------------------------------------------------
  children.push(sectionHeading("8. Amendments and Modifications"));
  children.push(
    bodyText(
      "The Subordinate Creditor shall not, without the prior written consent of the Senior Creditor: (a) amend, modify, supplement, or restate the terms of the Subordinate Debt in any manner that increases the principal amount, increases the interest rate, shortens the maturity, adds collateral, or otherwise materially changes the terms thereof; (b) accelerate the maturity of the Subordinate Debt; or (c) take any action to enforce any rights or remedies with respect to the Subordinate Debt except as expressly permitted by this Agreement.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Insurance and Condemnation Proceeds
  // -----------------------------------------------------------------------
  children.push(sectionHeading("9. Insurance and Condemnation Proceeds"));
  children.push(
    bodyText(
      "All proceeds of insurance and condemnation awards relating to any collateral securing the Senior Debt or the Subordinate Debt shall be applied first to the Senior Debt in accordance with the Senior Debt documents, and only after the Senior Debt has been indefeasibly paid and satisfied in full shall any remaining proceeds be available for application to the Subordinate Debt. The Subordinate Creditor waives any right to share in or receive any such proceeds until the Senior Debt has been fully discharged.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Notices
  // -----------------------------------------------------------------------
  children.push(sectionHeading("10. Notices"));
  children.push(
    bodyText(
      "All notices required or permitted under this Agreement shall be in writing and shall be deemed given when: (a) delivered personally; (b) sent by certified or registered mail, return receipt requested, postage prepaid; (c) sent by nationally recognized overnight courier service; or (d) sent by email with confirmation of receipt. Notices shall be addressed to the parties at their respective addresses as set forth in their respective loan documents or as subsequently designated in writing.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 11. Governing Law (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("11. Governing Law"));
  children.push(bodyText(prose.governingLaw));

  // -----------------------------------------------------------------------
  // 12. Additional Standard Provisions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("12. Additional Standard Provisions"));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: EACH PARTY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVES ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Severability: If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Counterparts: This Agreement may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Successors and Assigns: This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and assigns. No party may assign its rights or obligations hereunder without the prior written consent of the other parties, except that the Senior Creditor may assign its rights without consent in connection with a permitted transfer of the Senior Debt.",
    ),
  );

  // -----------------------------------------------------------------------
  // 13. Signature blocks
  // -----------------------------------------------------------------------
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "IN WITNESS WHEREOF, the parties hereto have caused this Subordination Agreement to be duly executed as of the date first written above.",
    ),
  );

  // Senior Creditor signature
  children.push(
    bodyText("SENIOR CREDITOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Authorized Signatory"),
  );

  // Subordinate Creditor signature
  children.push(spacer(12));
  children.push(
    bodyText("SUBORDINATE CREDITOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.subordinateCreditorName ?? "[Subordinate Creditor]", "Authorized Signatory"),
  );

  // Borrower acknowledgment
  children.push(spacer(12));
  children.push(
    bodyText("ACKNOWLEDGED AND AGREED — BORROWER:", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Authorized Signatory"),
  );

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Subordination Agreement",
    headerRight: `Subordination Agreement — ${input.borrowerName}`,
    children,
  });
}
