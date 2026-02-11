// intercreditor-agreement.ts
// Generates a DOCX Intercreditor Agreement from deterministic deal terms + AI prose.
// Governs the relationship between multiple lenders on the same deal — the most
// complex document in a loan package.

import {
  Document,
  Paragraph,
  Table,
  PageBreak,
  buildLegalDocument,
  documentTitle,
  articleHeading,
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
  collateralLabel,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, IntercreditorProse } from "../types";

// Builder

export function buildIntercreditorAgreement(
  input: DocumentInput,
  prose: IntercreditorProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const principalWords = numberToWords(terms.approvedAmount).toUpperCase();
  const dateFormatted = formatDate(input.generatedAt);
  const maturityFormatted = formatDate(input.maturityDate);
  const collateralDescription =
    input.propertyAddress ?? (input.collateralTypes.length > 0 ? input.collateralTypes.map(collateralLabel).join("; ") : "See Schedule A");

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Intercreditor Agreement"));

  // 2. Parties — First Lien Lender, Second Lien Lender, Borrower
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      `This Intercreditor Agreement (this "Agreement") is entered into as of ${dateFormatted}, by and among:`,
    ),
  );
  children.push(spacer(4));
  children.push(
    partyBlock(
      "FIRST LIEN LENDER",
      input.lenderName,
      'the "First Lien Lender" or "Senior Lender"',
    ),
  );
  children.push(bodyText("and"));
  children.push(
    partyBlock(
      "SECOND LIEN LENDER",
      input.secondLienLenderName ?? "[Second Lien Lender]",
      'the "Second Lien Lender" or "Junior Lender"',
    ),
  );
  children.push(bodyText("and"));
  children.push(
    partyBlock("BORROWER", input.borrowerName, 'the "Borrower"'),
  );
  children.push(spacer(4));

  // 3. Recitals
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "First Lien Lender", bold: true },
      {
        text: ` has agreed to extend credit to Borrower in the principal amount of ${principalFormatted} (${principalWords} DOLLARS) pursuant to that certain First Lien Credit Agreement of even date herewith (the "First Lien Credit Agreement"); and`,
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Second Lien Lender", bold: true },
      {
        text: ' has agreed to extend credit to Borrower pursuant to that certain Second Lien Credit Agreement of even date herewith (the "Second Lien Credit Agreement"); and',
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      {
        text: "the obligations under both Credit Agreements are or will be secured by liens on the same collateral, and the parties desire to set forth their respective rights, priorities, and interests with respect to such collateral and the relationship between them;",
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the extensions of credit by the First Lien Lender and the Second Lien Lender to the Borrower, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:",
      { bold: true },
    ),
  );

  // 4. Key Terms Table
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      {
        label: "First Lien Loan Amount",
        value: `${principalFormatted} (${principalWords} DOLLARS)`,
      },
      { label: "First Lien Lender", value: input.lenderName },
      { label: "Borrower", value: input.borrowerName },
      { label: "Maturity Date (First Lien)", value: maturityFormatted },
      { label: "Collateral", value: collateralDescription },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(8));

  // 5. Article I — Definitions and Interpretation (AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(articleHeading("I", "Definitions and Interpretation"));
  children.push(
    bodyText(
      'As used in this Agreement: "First Lien Obligations" means all obligations of Borrower under the First Lien Credit Agreement and all other First Lien Loan Documents. "Second Lien Obligations" means all obligations of Borrower under the Second Lien Credit Agreement and all other Second Lien Loan Documents. "Collateral" means all assets and property of Borrower in which either the First Lien Lender or the Second Lien Lender holds or purports to hold a security interest or lien. "Discharge of First Lien Obligations" means the indefeasible payment and satisfaction in full of all First Lien Obligations and the termination of all commitments under the First Lien Credit Agreement.',
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Definitions:", { bold: true }),
  );
  children.push(bodyText(prose.definitionsAndInterpretation));

  // 6. Article II — Lien Priority (AI prose)
  children.push(articleHeading("II", "Lien Priority"));
  children.push(
    bodyText(
      "Notwithstanding the date, time, method, or order of grant, attachment, or perfection of any liens securing the First Lien Obligations or the Second Lien Obligations, and notwithstanding any provision of the Uniform Commercial Code or any other applicable law, the liens securing the First Lien Obligations shall at all times be senior and prior to the liens securing the Second Lien Obligations. The Second Lien Lender agrees not to contest the priority, validity, or enforceability of the liens securing the First Lien Obligations.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "The Second Lien Lender hereby subordinates all of its liens on the Collateral to the liens of the First Lien Lender, regardless of whether such liens are now existing or hereafter arise, and regardless of how acquired. This subordination shall not be affected by any amendment, renewal, extension, or refinancing of either the First Lien Obligations or the Second Lien Obligations.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Lien Priority Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.lienPriority));

  // 7. Article III — Payment Waterfall (AI prose)
  children.push(articleHeading("III", "Payment Waterfall"));
  children.push(
    bodyText(
      "Until the Discharge of First Lien Obligations, all proceeds of any Collateral received in connection with the exercise of remedies shall be applied in the following order: (a) first, to the payment of all costs and expenses incurred by the First Lien Lender in connection with such exercise of remedies; (b) second, to the payment in full of all First Lien Obligations; (c) third, to the payment of all costs and expenses incurred by the Second Lien Lender; (d) fourth, to the payment of the Second Lien Obligations; and (e) fifth, any surplus to Borrower or as required by law.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "The Second Lien Lender shall not accept any payment on account of the Second Lien Obligations from proceeds of Collateral until the Discharge of First Lien Obligations, except for regularly scheduled payments of principal and interest on the Second Lien Obligations so long as no Event of Default under the First Lien Credit Agreement has occurred and is continuing.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Payment Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.paymentWaterfall));

  // 8. Article IV — Standstill and Cure (AI prose)
  children.push(articleHeading("IV", "Standstill and Cure Rights"));
  children.push(
    bodyText(
      "If an Event of Default occurs under the Second Lien Credit Agreement, the Second Lien Lender shall not exercise any remedies with respect to the Collateral for a period of one hundred eighty (180) days after giving written notice of such Event of Default to the First Lien Lender (the \"Standstill Period\"). During the Standstill Period, the First Lien Lender shall have the right, but not the obligation, to cure such Event of Default.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Notwithstanding the foregoing, the Second Lien Lender may, during the Standstill Period: (a) accelerate the Second Lien Obligations; (b) file proofs of claim in any bankruptcy proceeding; and (c) take any action necessary to preserve its liens. After the expiration of the Standstill Period, the Second Lien Lender may exercise its remedies, subject to the lien priority provisions of this Agreement.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Standstill Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.standstillAndCure));

  // 9. Article V — Enforcement Rights (AI prose)
  children.push(articleHeading("V", "Enforcement Rights"));
  children.push(
    bodyText(
      "Until the Discharge of First Lien Obligations, the First Lien Lender shall have the exclusive right to enforce rights and exercise remedies with respect to the Collateral. The Second Lien Lender shall not: (a) seek to foreclose upon, or otherwise enforce any lien on, any Collateral; (b) seek the appointment of a receiver, trustee, or similar official for any Collateral; (c) commence or join in any involuntary bankruptcy proceeding against Borrower; or (d) take any action that would hinder or delay the exercise of any remedy by the First Lien Lender, except as expressly permitted by this Agreement.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Enforcement Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.enforcementRights));

  // 10. Article VI — Purchase Option (AI prose)
  children.push(articleHeading("VI", "Purchase Option"));
  children.push(
    bodyText(
      "At any time after an Event of Default under the First Lien Credit Agreement, the Second Lien Lender shall have the option, but not the obligation, to purchase all (but not less than all) of the First Lien Obligations from the First Lien Lender at par (including all accrued interest, fees, costs, and expenses), by delivering written notice to the First Lien Lender. Upon such purchase, the Second Lien Lender shall be subrogated to all rights and remedies of the First Lien Lender under the First Lien Loan Documents.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Purchase Option Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.purchaseOption));

  // 11. Article VII — Release and Amendment (AI prose)
  children.push(articleHeading("VII", "Release and Amendment"));
  children.push(
    bodyText(
      "The First Lien Lender may, without the consent of the Second Lien Lender: (a) release any Collateral from the liens securing the First Lien Obligations in connection with a sale or disposition permitted under the First Lien Loan Documents; and (b) amend, restate, supplement, or modify the First Lien Loan Documents; provided, however, that without the prior written consent of the Second Lien Lender, the First Lien Lender shall not (i) increase the outstanding principal amount of the First Lien Obligations by more than fifteen percent (15%) of the original principal amount, (ii) increase the interest rate by more than two hundred (200) basis points above the original rate, or (iii) extend the maturity date by more than two (2) years beyond the original maturity date. Upon any release of Collateral in connection with a disposition permitted under the First Lien Loan Documents, the corresponding liens of the Second Lien Lender on such released Collateral shall also be released.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Release and Amendment Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.releaseAndAmendment));

  // 12. Article VIII — Bankruptcy Provisions (AI prose)
  children.push(articleHeading("VIII", "Bankruptcy Provisions"));
  children.push(
    bodyText(
      "In any bankruptcy, insolvency, or similar proceeding involving Borrower: (a) the Second Lien Lender shall not oppose or object to any use of cash collateral, debtor-in-possession financing, or adequate protection requested by the First Lien Lender; (b) the Second Lien Lender shall not seek adequate protection or relief from the automatic stay with respect to the Collateral without the consent of the First Lien Lender; and (c) the Second Lien Lender shall not propose or support any plan of reorganization that is not accepted by the First Lien Lender, unless the First Lien Obligations are to be paid in full under such plan.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "The Second Lien Lender agrees to waive any claim it may have against the First Lien Lender for any diminution in value of the Collateral resulting from the use of cash collateral, debtor-in-possession financing, or any other action taken by the First Lien Lender in accordance with this Agreement.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Bankruptcy Provisions:", { bold: true }),
  );
  children.push(bodyText(prose.bankruptcyProvisions));

  // Article IX — Insurance and Condemnation Proceeds
  children.push(articleHeading("IX", "Insurance and Condemnation Proceeds"));
  children.push(
    bodyText(
      "All proceeds of insurance policies and condemnation awards with respect to the Collateral shall be applied in the following order of priority: (a) first, to reimburse the First Lien Lender for any costs and expenses incurred in connection with the recovery of such proceeds; (b) second, to the First Lien Obligations until indefeasibly paid and satisfied in full; (c) third, to reimburse the Second Lien Lender for any costs and expenses incurred in connection with the recovery of such proceeds; and (d) fourth, to the Second Lien Obligations. Notwithstanding the foregoing, the First Lien Lender shall have the sole right to adjust, settle, and compromise any insurance claim or condemnation proceeding with respect to the Collateral, and the Second Lien Lender shall cooperate with and not object to any such adjustment, settlement, or compromise.",
    ),
  );

  // Article X — Notices
  children.push(articleHeading("X", "Notices"));
  children.push(
    bodyText(
      "All notices, requests, demands, and other communications required or permitted under this Agreement shall be in writing and shall be deemed duly given when: (a) delivered personally; (b) three (3) Business Days after being sent by certified or registered mail, return receipt requested, postage prepaid; (c) one (1) Business Day after being sent by nationally recognized overnight courier service; or (d) when sent by email with confirmation of receipt. Notices shall be addressed to the parties at the addresses set forth in their respective credit agreements, or at such other address as any party may designate by written notice to the other parties.",
    ),
  );

  // Article XI — Representations and Warranties
  children.push(articleHeading("XI", "Representations and Warranties"));
  children.push(
    bodyText(
      "Each of the First Lien Lender and the Second Lien Lender represents and warrants to the other that: (a) it has the power and authority to execute, deliver, and perform its obligations under this Agreement; (b) this Agreement has been duly authorized by all necessary action and constitutes a valid and binding obligation enforceable against it in accordance with its terms, subject to applicable bankruptcy, insolvency, reorganization, moratorium, and similar laws affecting creditors' rights generally and to general equitable principles; and (c) the execution and delivery of this Agreement does not and will not violate any provision of its organizational documents or any law, regulation, order, judgment, or agreement binding upon it.",
    ),
  );

  // Article XII — Term and Termination
  children.push(articleHeading("XII", "Term and Termination"));
  children.push(
    bodyText(
      "This Agreement shall remain in full force and effect until the earlier of: (a) the indefeasible payment and satisfaction in full of all First Lien Obligations and the termination of all commitments under the First Lien Credit Agreement; or (b) the indefeasible payment and satisfaction in full of all Second Lien Obligations and the termination of all commitments under the Second Lien Credit Agreement. Upon the termination of this Agreement in accordance with clause (a), the Second Lien Lender shall have the rights and priorities with respect to the Collateral as may be available under applicable law, free and clear of the provisions of this Agreement.",
    ),
  );

  // Article XIII — Governing Law (AI prose)
  children.push(articleHeading("XIII", "Governing Law"));
  children.push(bodyText(prose.governingLaw));

  // Standard clauses
  children.push(articleHeading("XIV", "Additional Standard Provisions"));
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
      "Entire Agreement: This Agreement constitutes the entire agreement among the parties with respect to the subject matter hereof and supersedes all prior agreements and understandings, oral or written, relating thereto.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Successors and Assigns: This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and assigns. No party may assign its rights or obligations hereunder without the prior written consent of the other parties, except that the First Lien Lender may assign its rights without consent in connection with a permitted transfer of the First Lien Obligations.",
    ),
  );

  // 14. Signature blocks
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "IN WITNESS WHEREOF, the parties hereto have caused this Intercreditor Agreement to be duly executed as of the date first written above.",
    ),
  );

  // First Lien Lender signature
  children.push(
    bodyText("FIRST LIEN LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Authorized Signatory"),
  );

  // Second Lien Lender signature
  children.push(spacer(12));
  children.push(
    bodyText("SECOND LIEN LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.secondLienLenderName ?? "[Second Lien Lender]", "Authorized Signatory"),
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

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Intercreditor Agreement",
    headerRight: `Intercreditor Agreement — ${input.borrowerName}`,
    children,
  });
}
