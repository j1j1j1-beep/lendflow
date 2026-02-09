// =============================================================================
// environmental-indemnity.ts
// Builds an Environmental Indemnity Agreement docx protecting the lender from
// environmental liability on the collateral property. Required for all CRE deals.
// All financial numbers come from DocumentInput; AI writes legal prose only.
// =============================================================================

import type { DocumentInput, EnvironmentalIndemnityProse } from "../types";
import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  signatureBlock,
  notaryBlock,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  numberToWords,
  COLORS,
} from "../doc-helpers";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildEnvironmentalIndemnity(
  input: DocumentInput,
  prose: EnvironmentalIndemnityProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const propertyAddress = input.propertyAddress ?? "See Exhibit A";

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("Environmental Indemnity Agreement"));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 2. Parties
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      `This Environmental Indemnity Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
  );
  children.push(spacer(2));
  children.push(
    partyBlock("Indemnitor", input.borrowerName, "the \"Indemnitor\" or \"Borrower\""),
  );
  children.push(
    partyBlock("Indemnitee", input.lenderName, "the \"Indemnitee\" or \"Lender\""),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 3. Recitals
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Indemnitee", bold: true },
      {
        text: ` has agreed to make a loan (the "Loan") to Indemnitor in the original principal amount of ${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS), as evidenced by a Promissory Note of even date herewith; and`,
      },
    ]),
  );
  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      {
        text: `the Loan is secured by, among other things, a deed of trust, mortgage, or other security instrument (the "Security Instrument") encumbering certain real property located at `,
      },
      { text: propertyAddress, bold: true, underline: true },
      { text: " (the \"Property\"); and" },
    ]),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "WHEREAS, as a condition to making the Loan, Indemnitee requires Indemnitor to execute and deliver this Agreement to indemnify and hold Indemnitee harmless from and against any and all environmental liabilities relating to the Property;",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the Loan and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Indemnitor agrees as follows:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 4. Key Terms Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      { label: "Loan Amount", value: `${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS)` },
      { label: "Property Address", value: propertyAddress },
      { label: "Indemnitor (Borrower)", value: input.borrowerName },
      { label: "Indemnitee (Lender)", value: input.lenderName },
      { label: "Effective Date", value: effectiveDate },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Definitions (deterministic — statutory references)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("1. Definitions"));
  children.push(
    bodyTextRuns([
      { text: '"Hazardous Substances"', bold: true },
      {
        text: ' means any substance, material, or waste that is regulated by any federal, state, or local governmental authority, including but not limited to: (a) any substance defined as a "hazardous substance" under the Comprehensive Environmental Response, Compensation, and Liability Act (CERCLA), 42 U.S.C. § 9601 et seq.; (b) any "hazardous waste" under the Resource Conservation and Recovery Act (RCRA), 42 U.S.C. § 6901 et seq.; (c) any "pollutant" or "contaminant" under the Clean Water Act, 33 U.S.C. § 1251 et seq.; (d) petroleum and petroleum products, including crude oil and any fractions thereof; (e) asbestos and asbestos-containing materials; (f) polychlorinated biphenyls (PCBs); (g) lead and lead-based paint; (h) mold, mildew, or other biological agents at levels requiring remediation; (i) radon gas at levels exceeding applicable action levels; and (j) any other substance that requires investigation, removal, or remediation under applicable Environmental Laws.',
      },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: '"Environmental Laws"', bold: true },
      {
        text: ' means all federal, state, and local laws, statutes, ordinances, rules, regulations, codes, orders, judgments, decrees, or injunctions relating to pollution, protection of the environment, public health and safety as it relates to exposure to Hazardous Substances, or the generation, use, storage, treatment, transportation, release, or disposal of Hazardous Substances, including but not limited to CERCLA, RCRA, the Clean Air Act (42 U.S.C. § 7401 et seq.), the Clean Water Act, the Toxic Substances Control Act (15 U.S.C. § 2601 et seq.), the Federal Insecticide, Fungicide, and Rodenticide Act (7 U.S.C. § 136 et seq.), and their state and local counterparts.',
      },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 5. Indemnification (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("2. Indemnification"));
  children.push(bodyText(prose.indemnificationScope));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Notwithstanding the foregoing, Indemnitor shall not be required to indemnify Indemnitee for Environmental Losses to the extent caused by the gross negligence or willful misconduct of Indemnitee or its agents, employees, or contractors while in possession or control of the Property following a foreclosure or deed in lieu of foreclosure.",
      { italic: true },
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 6. Representations & Warranties (AI array)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("3. Representations and Warranties"));
  children.push(
    bodyText(
      "Indemnitor represents and warrants to Indemnitee as of the date hereof and at all times while any portion of the Loan remains outstanding:",
    ),
  );
  if (Array.isArray(prose.representationsAndWarranties)) {
    prose.representationsAndWarranties.forEach((item) => {
      children.push(bulletPoint(item));
    });
  } else {
    children.push(bodyText(prose.representationsAndWarranties as unknown as string));
  }
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 7. Covenants (AI array)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("4. Environmental Covenants"));
  children.push(
    bodyText(
      "Indemnitor covenants and agrees that, until all obligations under the Loan are fully satisfied:",
    ),
  );
  if (Array.isArray(prose.covenants)) {
    prose.covenants.forEach((item) => {
      children.push(bulletPoint(item));
    });
  } else {
    children.push(bodyText(prose.covenants as unknown as string));
  }
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 8. Remediation (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("5. Remediation Obligations"));
  children.push(bodyText(prose.remediationObligations));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 9. Survival (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("6. Survival"));
  children.push(bodyText(prose.survivalClause));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Unsecured Obligation
  // -----------------------------------------------------------------------
  children.push(sectionHeading("7. Unsecured Obligation"));
  children.push(
    bodyText(
      "The obligations of the Indemnitor under this Agreement are unsecured and are separate from and in addition to any obligations of the Indemnitor under the Note, Loan Agreement, Security Instrument, or any other Loan Document. The obligations of the Indemnitor under this Agreement shall not be limited by the amount of the Loan, the value of the Property, or any other limitation on Indemnitor's liability under the Loan Documents.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Right to Environmental Assessments
  // -----------------------------------------------------------------------
  children.push(sectionHeading("8. Right to Environmental Assessments"));
  children.push(
    bodyText(
      "Indemnitee shall have the right, at any time and from time to time, to conduct or cause to be conducted environmental assessments, audits, inspections, and investigations of the Property (including Phase I and Phase II Environmental Site Assessments), at Indemnitor's sole cost and expense. Indemnitor shall cooperate fully with any such assessment and shall provide access to the Property and all relevant records, reports, and documents. If any assessment reveals the presence or likely presence of Hazardous Substances, Indemnitor shall promptly undertake all remedial action required by Environmental Laws at Indemnitor's sole cost and expense.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Costs and Attorneys' Fees
  // -----------------------------------------------------------------------
  children.push(sectionHeading("9. Costs and Attorneys' Fees"));
  children.push(
    bodyText(
      "Indemnitor shall pay all costs and expenses (including reasonable attorneys' fees, expert witness fees, and court costs) incurred by Indemnitee in connection with: (a) the enforcement of this Agreement; (b) any investigation, removal, remediation, or monitoring of Hazardous Substances on or about the Property; (c) any claim, action, or proceeding arising from or related to Hazardous Substances on or about the Property; and (d) the defense of any claim, action, or proceeding against Indemnitee arising from or related to environmental conditions of the Property.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Waiver of Defenses
  // -----------------------------------------------------------------------
  children.push(sectionHeading("10. Waiver of Defenses"));
  children.push(
    bodyText(
      "Indemnitor waives any and all defenses, whether legal or equitable, that Indemnitor may have to the enforcement of this Agreement, including but not limited to: (a) any defense based on the adequacy of the Indemnitee's security interest in the Property; (b) any defense of statute of limitations; (c) any defense based on the modification, renewal, or extension of the Loan; (d) any defense based on the release of any other party from liability; and (e) any other defense, whether at law or in equity, that might otherwise be available to Indemnitor. This waiver shall be effective to the maximum extent permitted by applicable law.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Subrogation Waiver
  // -----------------------------------------------------------------------
  children.push(sectionHeading("11. Subrogation Waiver"));
  children.push(
    bodyText(
      "Until all obligations under the Loan have been indefeasibly paid and satisfied in full, Indemnitor hereby waives any right of subrogation, reimbursement, exoneration, contribution, indemnification, or set-off, and any right to participate in any claim or remedy of Indemnitee against the Property or any other security, whether or not such claim, remedy, or right arises in equity or under contract, statute, or common law.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 10. Governing Law (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("12. Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Standard legal provisions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("13. Additional Standard Provisions"));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: INDEMNITOR AND INDEMNITEE HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT.",
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
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 11. Signatures
  // -----------------------------------------------------------------------
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "The undersigned has executed this Environmental Indemnity Agreement as of the date first written above.",
    ),
  );

  // Indemnitor signature
  children.push(
    bodyText("INDEMNITOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.borrowerName, "Indemnitor / Authorized Signatory"));

  // Indemnitee signature
  children.push(spacer(12));
  children.push(
    bodyText("ACCEPTED AND AGREED — INDEMNITEE:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Indemnitee / Authorized Signatory"));

  children.push(...notaryBlock(input.stateAbbr));

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Environmental Indemnity Agreement",
    headerRight: `Environmental Indemnity — ${input.borrowerName}`,
    children,
  });
}
