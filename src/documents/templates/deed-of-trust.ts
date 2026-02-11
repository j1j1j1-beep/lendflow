// deed-of-trust.ts
// Builds a Deed of Trust DOCX — real property security instrument used in
// trust-deed states as a mortgage equivalent. AI writes prose for covenants,
// default provisions, power of sale, and environmental sections.

import type { DocumentInput, DeedOfTrustProse } from "../types";
import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  signatureBlock,
  notaryBlock,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  articleHeading,
  sectionSubheading,
  keyTermsTable,
  sectionHeading,
  spacer,
  formatCurrency,
  formatDate,
  formatPercent,
  numberToWords,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

export type { DeedOfTrustProse };

// Builder

export function buildDeedOfTrust(
  input: DocumentInput,
  prose: DeedOfTrustProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const stateName = input.stateAbbr ?? "[STATE]";

  const children: (Paragraph | Table)[] = [
    // Title
    documentTitle(
      "Deed of Trust, Assignment of Rents, Security Agreement and Fixture Filing",
    ),
    spacer(4),

    // Recording Information
    bodyText("RECORDING REQUESTED BY:", { bold: true }),
    bodyText(input.lenderName),
    spacer(2),
    bodyText("WHEN RECORDED MAIL TO:", { bold: true }),
    bodyText(input.lenderName),
    bodyText("[LENDER ADDRESS]"),
    spacer(2),
    bodyText("SPACE ABOVE THIS LINE FOR RECORDER'S USE", { italic: true }),
    spacer(8),

    // Parties
    articleHeading("I", "Parties"),
    bodyText(
      `This Deed of Trust, Assignment of Rents, Security Agreement and Fixture Filing (this "Deed of Trust") is made as of ${effectiveDate}, by and among:`,
    ),
    spacer(2),
    partyBlock("Trustor", input.borrowerName, 'the "Trustor" or "Borrower"'),
    partyBlock(
      "Trustee",
      "[TITLE COMPANY NAME]",
      'the "Trustee"',
    ),
    partyBlock("Beneficiary", input.lenderName, 'the "Beneficiary" or "Lender"'),
    spacer(4),

    // Key Terms
    keyTermsTable([
      {
        label: "Principal Amount",
        value: `${loanAmount} (${loanAmountWords} dollars)`,
      },
      { label: "Interest Rate", value: formatPercent(input.terms.interestRate) },
      { label: "Term", value: `${input.terms.termMonths} months` },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      {
        label: "Property Address",
        value: input.propertyAddress ?? "[PROPERTY ADDRESS]",
      },
      { label: "Loan Program", value: input.programName },
    ]),
    spacer(8),

    // Grant Clause
    articleHeading("II", "Grant of Trust"),
    bodyText(prose.grantClause),
    spacer(4),

    // Legal Description
    articleHeading("III", "Property Description"),
    bodyText(
      "The property encumbered by this Deed of Trust (the \"Property\") is described as follows:",
    ),
    spacer(2),
    bodyText("[LEGAL DESCRIPTION OF PROPERTY TO BE INSERTED]", {
      bold: true,
      italic: true,
    }),
    spacer(2),
    bodyText(
      "Together with all buildings, improvements, and fixtures now or hereafter erected on the Property, and all easements, appurtenances, and fixtures now or hereafter a part of the Property, including but not limited to all articles of personal property now or hereafter attached to or used in connection with the Property. All replacements and additions shall also be covered by this Deed of Trust. All of the foregoing is referred to in this Deed of Trust as the \"Property.\"",
    ),
    spacer(2),
    bodyText("See Exhibit A attached hereto for full legal description.", {
      italic: true,
    }),
    spacer(4),

    // Borrower Covenants
    articleHeading("IV", "Borrower Covenants"),
    bodyText(
      "Trustor covenants and agrees with Beneficiary as follows:",
    ),
    spacer(2),
    ...ensureProseArray(prose.borrowerCovenants).map((item) => bulletPoint(item)),
    spacer(2),

    // Standard covenants
    sectionSubheading("4.1", "Payment of Taxes and Assessments"),
    bodyText(
      "Trustor shall pay, before delinquency, all taxes, assessments, charges, and liens levied upon or against the Property.",
    ),
    sectionSubheading("4.2", "Insurance"),
    bodyText(
      "Trustor shall maintain hazard insurance on the Property in an amount at least equal to the outstanding principal balance of the loan, with Beneficiary named as loss payee. All policies shall be in form and with insurers satisfactory to Beneficiary.",
    ),
    sectionSubheading("4.3", "Maintenance and Repair"),
    bodyText(
      "Trustor shall maintain the Property in good condition and repair, shall not commit waste, and shall not demolish, remove, or substantially alter any building or improvement without the prior written consent of Beneficiary.",
    ),
    sectionSubheading("4.4", "Compliance with Laws"),
    bodyText(
      "Trustor shall comply with all laws, ordinances, regulations, covenants, conditions, and restrictions affecting the Property.",
    ),
    spacer(4),

    // Default Provisions
    articleHeading("V", "Events of Default"),
    bodyText(prose.defaultProvisions),
    spacer(4),

    // Power of Sale
    articleHeading("VI", "Power of Sale"),
    bodyText(prose.powerOfSale),
    spacer(2),
    bodyText(
      "Trustee shall give notice of default and notice of sale as required by the laws of the state in which the Property is located. Trustee may sell the Property, or any part thereof, at public auction to the highest bidder. The power of sale granted herein shall not be exhausted by one sale but may be exercised from time to time until all Obligations are satisfied in full.",
    ),
    spacer(4),

    // Assignment of Rents
    articleHeading("VII", "Assignment of Rents"),
    bodyText(
      "As additional security, Trustor hereby absolutely and unconditionally assigns to Beneficiary all rents, issues, profits, revenue, and income of the Property (collectively, \"Rents\"). Trustor grants to Beneficiary the right to enter and take possession of the Property for the purpose of collecting the Rents. This assignment is an absolute assignment and not merely an assignment for additional security.",
    ),
    spacer(2),
    bodyText(
      "So long as no Event of Default has occurred and is continuing, Trustor shall have a revocable license to collect and receive the Rents. Upon the occurrence of an Event of Default, this license shall automatically terminate without notice, and Beneficiary may collect and receive all Rents.",
    ),
    spacer(4),

    // Due-on-Sale
    articleHeading("VIII", "Due-on-Sale Clause"),
    bodyText(
      "If all or any part of the Property or any interest in the Property is sold, transferred, or conveyed (or if Trustor is not a natural person and a beneficial interest in Trustor is sold, transferred, or conveyed) without Beneficiary's prior written consent, Beneficiary may require immediate payment in full of all sums secured by this Deed of Trust.",
    ),
    spacer(2),

    // Garn-St Germain Exempt Transfers
    sectionSubheading("8.1", "Exempt Transfers Under Garn-St Germain Act"),
    bodyText(
      "Notwithstanding the due-on-sale provision above, Lender shall not exercise the option to accelerate upon the occurrence of any transfer exempt under 12 U.S.C. \u00A7 1701j-3(d) of the Garn-St Germain Depository Institutions Act of 1982. Exempt transfers include, without limitation:",
    ),
    bulletPoint(
      "A transfer by devise, descent, or operation of law on the death of a joint tenant or tenant by the entirety;",
    ),
    bulletPoint(
      "A transfer to a spouse or children of the Borrower resulting from a decree of dissolution of marriage, legal separation agreement, or incidental property settlement agreement;",
    ),
    bulletPoint(
      "A transfer to a relative of the Borrower resulting from the death of the Borrower;",
    ),
    bulletPoint(
      "A transfer to an inter vivos trust in which the Borrower is and remains a beneficiary and which does not relate to a transfer of rights of occupancy in the Property;",
    ),
    bulletPoint(
      "A transfer where a lien is created by a junior encumbrance that does not transfer rights of occupancy in the Property.",
    ),
    spacer(4),

    // Fixture Filing
    articleHeading("IX", "Fixture Filing"),
    bodyText(
      "This Deed of Trust constitutes a fixture filing under the Uniform Commercial Code with respect to all goods that are or may become fixtures related to the Property. For purposes of the fixture filing, the following information is provided:",
    ),
    spacer(2),
    bulletPoint(`Debtor (Trustor): ${input.borrowerName}`),
    bulletPoint(`Secured Party (Beneficiary): ${input.lenderName}`),
    bulletPoint(
      `Property Address: ${input.propertyAddress ?? "[PROPERTY ADDRESS]"}`,
    ),
    bulletPoint(
      "Description of Collateral: All fixtures and personal property now or hereafter located on, attached to, or used in connection with the Property.",
    ),
    spacer(4),

    // Environmental Covenants
    articleHeading("X", "Environmental Covenants"),
    bodyText(prose.environmentalCovenants),
    spacer(4),

    // Condemnation / Eminent Domain
    articleHeading("XI", "Condemnation and Eminent Domain"),
    bodyText(
      "If the Property or any part thereof is taken or damaged by eminent domain, condemnation, or any similar proceeding, the following provisions shall apply:",
    ),
    spacer(2),
    sectionSubheading("11.1", "Application of Proceeds"),
    bodyText(
      "All awards, compensation, and proceeds resulting from any taking or condemnation of the Property or any part thereof (collectively, \"Condemnation Proceeds\") shall be paid to Lender and applied first to the Secured Obligation, including any prepayment premium or penalty, in such order as Lender may determine in its sole discretion.",
    ),
    sectionSubheading("11.2", "Notice of Proceedings"),
    bodyText(
      "Borrower shall promptly notify Lender of any condemnation proceeding, proposed taking, or notice of intent to condemn affecting the Property. Borrower shall deliver to Lender copies of all notices, pleadings, and correspondence relating to any such proceeding within five (5) business days of receipt.",
    ),
    sectionSubheading("11.3", "Lender Participation"),
    bodyText(
      "Lender shall have the right to participate in and approve any condemnation settlement or proceeding. Borrower shall not settle, compromise, or adjust any claim for Condemnation Proceeds without Lender's prior written consent.",
    ),
    sectionSubheading("11.4", "Total Taking"),
    bodyText(
      "If the taking is total, or renders the Property unsuitable for the use contemplated at the time the loan was originated, the entire Secured Obligation shall become immediately due and payable, and all Condemnation Proceeds shall be applied to the Secured Obligation.",
    ),
    sectionSubheading("11.5", "Partial Taking"),
    bodyText(
      "If the taking is partial, Lender may, at its sole option, either: (a) apply the Condemnation Proceeds to the Secured Obligation, whether or not then due, in such order as Lender determines; or (b) permit Borrower to use Condemnation Proceeds for restoration of the Property, subject to such conditions as Lender may impose, including but not limited to Lender's approval of restoration plans and disbursement of proceeds in installments upon satisfactory completion of restoration milestones.",
    ),
    spacer(4),

    // Insurance Proceeds
    articleHeading("XII", "Insurance Proceeds"),
    bodyText(
      "In the event of casualty loss or damage to the Property, the following provisions shall govern the application of insurance proceeds:",
    ),
    spacer(2),
    sectionSubheading("12.1", "Payment of Proceeds"),
    bodyText(
      "All insurance proceeds resulting from casualty loss or damage to the Property shall be paid to Lender, or held in escrow jointly by Lender and Borrower, as Lender may direct. Borrower hereby assigns to Lender all rights to receive insurance proceeds and authorizes Lender to collect such proceeds directly from the insurer.",
    ),
    sectionSubheading("12.2", "Application or Restoration"),
    bodyText(
      "Lender may, at its sole option, either: (a) apply insurance proceeds to the Secured Obligation, whether or not then due, in such order as Lender determines; or (b) make insurance proceeds available for restoration of the Property, subject to such conditions as Lender may impose.",
    ),
    sectionSubheading("12.3", "Restoration Disbursement"),
    bodyText(
      "If Lender elects to permit restoration, insurance proceeds shall be disbursed in installments upon satisfactory completion of repair milestones, as determined by Lender or Lender's inspector. Lender may require evidence of completion, lien waivers, and such other documentation as Lender deems necessary before each disbursement.",
    ),
    sectionSubheading("12.4", "Failure to Restore"),
    bodyText(
      "If the Property is not restored within a reasonable time as determined by Lender (not to exceed twelve (12) months from the date of casualty, unless extended by Lender in writing), Lender may apply any remaining insurance proceeds to the Secured Obligation.",
    ),
    spacer(4),

    // Subordination to Leases
    articleHeading("XIII", "Subordination to Leases"),
    bodyText(
      "Beneficiary may, at its option, subordinate the lien of this Deed of Trust to any lease of the Property or any portion thereof. Any such subordination shall not constitute a waiver of any of the rights of Beneficiary under this Deed of Trust.",
    ),
    spacer(4),

    // Governing Law
    articleHeading("XIV", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // Miscellaneous
    articleHeading("XV", "Miscellaneous"),
    bodyTextRuns([
      { text: "JURY TRIAL WAIVER: ", bold: true },
      {
        text: "TRUSTOR AND BENEFICIARY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS DEED OF TRUST.",
      },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Severability: ", bold: true },
      {
        text: "If any provision of this Deed of Trust is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
      },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Counterparts: ", bold: true },
      {
        text: "This Deed of Trust may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
      },
    ]),
    spacer(8),

    // Signatures
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, Trustor has executed this Deed of Trust as of the date first written above.",
        bold: true,
      },
    ]),
    spacer(4),

    bodyText("TRUSTOR:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Trustor"),

    spacer(8),

    bodyText("TRUSTEE ACCEPTANCE:", { bold: true, color: COLORS.primary }),
    ...signatureBlock("[TITLE COMPANY NAME]", "Trustee"),

    // Notary Acknowledgment
    ...notaryBlock(input.stateAbbr),

    spacer(16),

    // Exhibit A
    sectionHeading("Exhibit A"),
    bodyText("Legal Description of Property", { bold: true }),
    spacer(4),
    bodyText("[LEGAL DESCRIPTION TO BE INSERTED PRIOR TO RECORDING]", {
      bold: true,
      italic: true,
    }),
  ];

  return buildLegalDocument({
    title: "Deed of Trust",
    headerRight: `Deed of Trust — ${input.borrowerName}`,
    children,
  });
}
