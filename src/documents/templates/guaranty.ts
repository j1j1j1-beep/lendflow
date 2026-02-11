// guaranty.ts
// Builds a Guaranty Agreement docx where a guarantor personally guarantees
// the borrower's obligations. All financial numbers from DocumentInput;
// AI writes prose.

import type { DocumentInput, GuarantyProse } from "../types";
import {
  Document,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  signatureBlock,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  articleHeading,
  sectionSubheading,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  numberToWords,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

// Builder

export function buildGuaranty(
  input: DocumentInput,
  prose: GuarantyProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);

  const children = [
    // Title
    documentTitle("Guaranty Agreement"),
    spacer(4),

    bodyText(
      `This Guaranty Agreement (this "Guaranty") is entered into as of ${effectiveDate}, by the undersigned guarantor in favor of ${input.lenderName} (the "Lender").`,
    ),
    spacer(4),

    // Parties
    articleHeading("I", "Parties"),
    partyBlock("Guarantor", input.guarantorName ?? input.borrowerName, "the \"Guarantor\""),
    partyBlock("Lender", input.lenderName, "the \"Lender\""),
    spacer(4),

    // Recitals
    articleHeading("II", "Recitals"),
    bodyText(
      `WHEREAS, Lender has agreed to make a loan (the "Loan") to ${input.borrowerName} (the "Borrower") in the original principal amount of ${loanAmount} (${loanAmountWords} dollars) pursuant to that certain Loan Agreement of even date herewith (the "Loan Agreement");`,
    ),
    bodyText(
      "WHEREAS, Guarantor has a direct and substantial economic interest in Borrower and will derive material benefit from the Loan;",
    ),
    bodyText(
      "WHEREAS, Lender has required the execution and delivery of this Guaranty as a condition precedent to making the Loan;",
    ),
    bodyText(
      "NOW, THEREFORE, in consideration of the foregoing premises and the making of the Loan, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Guarantor agrees as follows:",
    ),
    spacer(4),

    // Guaranty Scope
    articleHeading("III", "Guaranty"),
    sectionSubheading("3.1", "Scope of Guaranty"),
    bodyText(
      "This is an absolute, unconditional, and continuing guaranty of payment and not merely a guaranty of collection. Guarantor's liability hereunder is primary and not secondary. Lender may proceed directly against Guarantor without first proceeding against Borrower, exhausting any remedies against Borrower, or resorting to any collateral. Guarantor's obligations hereunder shall not be discharged or affected by: (a) any modification, renewal, or extension of the Loan Documents; (b) any release of Borrower or any other guarantor; (c) any release, substitution, or impairment of collateral; (d) any failure by Lender to perfect any security interest; or (e) any other circumstance that might otherwise constitute a defense to Guarantor's obligations.",
    ),
    spacer(2),
    bodyText("Additional Guaranty Provisions:", { bold: true }),
    bodyText(prose.guarantyScope),
    spacer(2),

    // Guaranty Amount
    sectionSubheading("3.2", "Guaranteed Amount"),
    bodyText(
      `Guarantor unconditionally and irrevocably guarantees to Lender the full and punctual payment when due, whether at stated maturity, by acceleration, or otherwise, of all amounts owing under the Loan Agreement, the Promissory Note, and all related loan documents, including but not limited to:`,
    ),
    bulletPoint(
      `The outstanding principal balance of the Loan up to ${loanAmount} (${loanAmountWords} dollars);`,
    ),
    bulletPoint(
      "All accrued and unpaid interest on the Loan at the rate specified in the Promissory Note;",
    ),
    bulletPoint(
      "All fees, costs, expenses, and other charges payable under the Loan Agreement;",
    ),
    bulletPoint(
      "All costs of collection and enforcement, including reasonable attorneys' fees and court costs.",
    ),
    spacer(2),
    bodyText(
      "This Guaranty covers all amounts owing under the Loan Documents without limitation, including all future advances, renewals, extensions, and modifications. The maximum liability of Guarantor under this Guaranty shall not be limited to the original principal amount of the Loan but shall include all interest, fees, costs, expenses, and other charges that may accrue.",
      { italic: true },
    ),
    spacer(2),

    // Key terms summary
    keyTermsTable([
      { label: "Guaranteed Amount", value: `${loanAmount} plus interest, fees, and costs` },
      { label: "Effective Date", value: effectiveDate },
      { label: "Loan Program", value: input.programName },
      { label: "Guaranty Type", value: "Absolute and Unconditional" },
    ]),
    spacer(4),

    // Waiver of Defenses
    articleHeading("IV", "Waiver of Defenses"),
    bodyText(
      "Guarantor hereby irrevocably waives each of the following defenses, to the fullest extent permitted by applicable law:",
    ),
    bulletPoint(
      "Presentment, demand for payment, protest, and notice of dishonor, notice of default, and notice of acceleration;",
    ),
    bulletPoint(
      "Notice of acceptance of this Guaranty and notice of the existence or creation of any Obligations;",
    ),
    bulletPoint(
      "All suretyship defenses and defenses in the nature of suretyship;",
    ),
    bulletPoint(
      "Any defense based on any claim that Guarantor's obligations exceed or are more burdensome than those of Borrower;",
    ),
    bulletPoint(
      "Any defense based on any disability, lack of authority, or other defense of Borrower or any other person;",
    ),
    bulletPoint(
      "The benefit of any statute of limitations affecting Guarantor's liability hereunder;",
    ),
    bulletPoint(
      "Any defense based on Lender's election of remedies, including any election to proceed against collateral or to exercise any right of setoff;",
    ),
    ...ensureProseArray(prose.waiverOfDefenses).map((item) => bulletPoint(item)),
    spacer(2),

    // Anti-Deficiency Statute Waivers
    sectionSubheading("4.1", "Anti-Deficiency Statute Waivers"),
    bodyText(
      "Guarantor hereby waives, to the fullest extent permitted by applicable law, any and all rights or defenses arising under anti-deficiency statutes in any jurisdiction, including but not limited to:",
    ),
    bulletPoint(
      "California: Guarantor waives all protections under California Code of Civil Procedure Section 580b (purchase money anti-deficiency protection) and Section 580d (anti-deficiency protection following non-judicial foreclosure under power of sale), to the extent such waiver is permitted by applicable law;",
    ),
    bulletPoint(
      "Arizona: Guarantor waives all protections under Arizona Revised Statutes Section 33-814 (anti-deficiency protection for residential property), to the extent such waiver is permitted by applicable law;",
    ),
    bulletPoint(
      "General Waiver: Guarantor further waives any and all rights or defenses arising under any similar anti-deficiency, one-action, or fair-value limitation statutes in any other jurisdiction that might otherwise limit or bar Lender's right to recover a deficiency judgment against Guarantor or to proceed against Guarantor without first exhausting collateral or other remedies.",
    ),
    bodyText(
      "This waiver is made with full knowledge of the protections afforded by such statutes and after Guarantor has been advised to consult with independent legal counsel regarding the effect of this waiver.",
      { italic: true },
    ),
    spacer(4),

    // Subrogation Waiver
    articleHeading("V", "Subrogation Waiver"),
    bodyText(
      "Until all Obligations have been indefeasibly paid and performed in full and all commitments under the Loan Documents have been terminated, Guarantor waives any right of subrogation, reimbursement, indemnification, or contribution from Borrower, whether arising by contract, operation of law, or otherwise, and any right to enforce any remedy that Lender may have against Borrower or any collateral.",
    ),
    spacer(2),
    bodyText(
      "If Guarantor receives any payment from Borrower in violation of this provision, Guarantor shall hold such payment in trust for Lender and immediately turn it over to Lender for application to the Obligations.",
    ),
    spacer(2),
    bodyText("Additional Subrogation Provisions:", { bold: true }),
    bodyText(prose.subrogationWaiver),
    spacer(4),

    // Subordination
    articleHeading("VI", "Subordination"),
    bodyText(
      "All indebtedness of Borrower to Guarantor, whether now existing or hereafter arising, is hereby subordinated to the Obligations. Guarantor shall not accept any payment from Borrower on account of such subordinated indebtedness while any Obligations remain outstanding without the prior written consent of Lender.",
    ),
    spacer(2),
    bodyText(
      "In any insolvency, bankruptcy, receivership, or similar proceeding involving Borrower, Guarantor agrees to turn over to Lender any distribution that Guarantor would otherwise be entitled to receive on account of subordinated indebtedness, until all Obligations have been indefeasibly paid in full.",
    ),
    spacer(2),
    bodyText("Additional Subordination Provisions:", { bold: true }),
    bodyText(prose.subordination),
    spacer(4),

    // Covenants
    articleHeading("VII", "Covenants"),
    bodyText(
      "Guarantor covenants and agrees that, until all guaranteed obligations are fully satisfied:",
    ),
    sectionSubheading("7.1", "Financial Reporting"),
    bodyText(
      "Guarantor shall furnish to Lender, within ninety (90) days after the end of each fiscal year, a complete personal financial statement and federal income tax return for the preceding fiscal year, in form and substance satisfactory to Lender.",
    ),
    sectionSubheading("7.2", "No Material Transfers"),
    bodyText(
      "Guarantor shall not sell, transfer, convey, or otherwise dispose of all or substantially all of Guarantor's assets, or any material portion thereof, without the prior written consent of Lender.",
    ),
    sectionSubheading("7.3", "Maintain Net Worth"),
    bodyText(
      "Guarantor shall maintain a minimum net worth satisfactory to Lender and shall promptly notify Lender of any material adverse change in Guarantor's financial condition.",
    ),
    sectionSubheading("7.4", "Notice of Default"),
    bodyText(
      "Guarantor shall promptly notify Lender in writing of any event that constitutes, or with the passage of time or giving of notice would constitute, a default under this Guaranty or any of the loan documents.",
    ),
    sectionSubheading("7.5", "Liquidity"),
    bodyText(
      "Guarantor shall maintain liquid assets (cash, cash equivalents, and readily marketable securities) of an amount satisfactory to Lender at all times during the term of this Guaranty.",
    ),
    spacer(4),

    // Miscellaneous
    articleHeading("VIII", "Miscellaneous"),
    bodyText(
      "Irrevocability: This Guaranty is irrevocable and may not be revoked, terminated, or modified by Guarantor without the prior written consent of Lender. This Guaranty shall be binding upon Guarantor and Guarantor's heirs, executors, administrators, successors, and assigns.",
    ),
    spacer(2),
    bodyText(
      "Assignment: This Guaranty may be assigned by Lender without notice to or consent of Guarantor. Guarantor may not assign its obligations hereunder.",
    ),
    spacer(2),
    bodyText(
      "Joint and Several: If this Guaranty is executed by more than one person, the obligations of each such person shall be joint and several.",
    ),
    spacer(2),
    bodyText(
      "JURY TRIAL WAIVER: GUARANTOR AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS GUARANTY OR ANY OTHER LOAN DOCUMENT.",
    ),
    spacer(2),
    bodyText(
      "Severability: If any provision of this Guaranty is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
    spacer(2),
    bodyText(
      "Counterparts: This Guaranty may be executed in counterparts, each of which shall be deemed an original. Signatures delivered by electronic means shall be deemed originals.",
    ),
    spacer(2),
    bodyText("Additional Provisions:", { bold: true }),
    bodyText(prose.miscellaneous),
    spacer(4),

    // Reinstatement
    articleHeading("IX", "Reinstatement"),
    bodyText(
      "If any payment made by Borrower or Guarantor to Lender is avoided, recovered, or returned (whether in whole or in part) under any bankruptcy, insolvency, receivership, or similar law, including but not limited to avoidance of preferential transfers or fraudulent transfers or obligations under 11 U.S.C. Sections 547 and 548, or any applicable state fraudulent transfer or voidable transactions statute, this Guaranty shall be reinstated to the extent of such avoided, recovered, or returned payment, and the amount thereof shall be deemed to remain outstanding as if such payment had never been made. The provisions of this Section shall survive the termination of this Guaranty and the repayment of the Obligations.",
    ),
    spacer(4),

    // Death / Incapacity
    articleHeading("X", "Death, Incapacity, and Binding Effect"),
    bodyText(
      "This Guaranty shall be binding upon the Guarantor and upon Guarantor's heirs, executors, administrators, legal representatives, successors, and assigns. The death, incapacity, or disability of Guarantor shall not release, diminish, or otherwise affect the liability of Guarantor's estate under this Guaranty. Upon the death or incapacity of Guarantor, Lender may proceed against Guarantor's estate for the full amount of the Obligations without first proceeding against Borrower, any collateral, or any other guarantor.",
    ),
    spacer(4),

    // Governing Law
    articleHeading("XI", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // Spousal Consent (community property states)
    articleHeading("XII", "Spousal Consent"),
    bodyText(
      "If Guarantor is married and resides in a community property state (Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, or Wisconsin) or an opt-in community property trust state (Alaska, Florida, Kentucky, South Dakota, or Tennessee), Guarantor's spouse should execute a spousal consent acknowledging this Guaranty. Spousal consent may be required for enforceability of this Guaranty against community property assets.",
    ),
    spacer(4),
    bodyText("SPOUSAL CONSENT (if applicable):"),
    spacer(2),
    bodyText("I, the undersigned spouse of Guarantor, hereby consent to the execution of this Guaranty and agree that my community property interest, if any, shall be subject to the terms and conditions hereof."),
    spacer(4),
    bodyText("Spouse Signature: _________________________________    Date: ________________"),
    spacer(8),

    // Signature
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, Guarantor has executed this Guaranty Agreement as of the date first written above.",
        bold: true,
      },
    ]),

    // Guarantor signature
    ...signatureBlock(input.guarantorName ?? input.borrowerName, "Guarantor"),

    spacer(12),

    // Lender acceptance
    bodyText("ACCEPTED AND AGREED — LENDER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Authorized Signatory"),
  ];

  return buildLegalDocument({
    title: "Guaranty Agreement",
    headerRight: `Guaranty Agreement — ${input.guarantorName ?? input.borrowerName}`,
    children,
  });
}
