// =============================================================================
// security-agreement.ts
// Builds a Security Agreement docx granting lender a security interest in
// collateral. All financial numbers come from DocumentInput; AI writes prose.
// =============================================================================

import type { DocumentInput, SecurityAgreementProse } from "../types";
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
  COLORS,
} from "../doc-helpers";

// ---------------------------------------------------------------------------
// Collateral type descriptions
// ---------------------------------------------------------------------------

const COLLATERAL_DESCRIPTIONS: Record<string, string> = {
  real_estate:
    "All real property, including but not limited to land, buildings, fixtures, and improvements thereto",
  equipment:
    "All equipment, machinery, tools, furniture, fixtures, and other tangible personal property",
  inventory:
    "All inventory, including raw materials, work-in-process, finished goods, and supplies",
  accounts_receivable:
    "All accounts, accounts receivable, chattel paper, instruments, and general intangibles",
  vehicles:
    "All motor vehicles, trailers, and other titled goods, together with all certificates of title",
  intellectual_property:
    "All intellectual property, including patents, trademarks, copyrights, trade secrets, and licenses",
  securities:
    "All investment property, securities, securities accounts, and financial assets",
  digital_assets:
    "All digital assets, cryptocurrency, tokens, and rights associated therewith, including private keys and wallet access",
  cash_and_deposits:
    "All deposit accounts, cash, and cash equivalents held at any financial institution",
  general_intangibles:
    "All general intangibles, including payment intangibles, software, and contract rights",
};

function collateralLabel(type: string): string {
  return COLLATERAL_DESCRIPTIONS[type] ?? type;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSecurityAgreement(
  input: DocumentInput,
  prose: SecurityAgreementProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);

  const children = [
    // ---- Title ----
    documentTitle("Security Agreement"),
    spacer(4),

    bodyText(
      `This Security Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
    spacer(4),

    // ---- Parties ----
    articleHeading("I", "Parties"),
    partyBlock("Debtor", input.borrowerName, "the \"Debtor\""),
    partyBlock("Secured Party", input.lenderName, "the \"Secured Party\""),
    spacer(4),

    // ---- Grant of Security Interest ----
    articleHeading("II", "Grant of Security Interest"),
    bodyText(
      `Debtor hereby grants to Secured Party a continuing security interest in and to all of the Collateral described herein, whether now owned or hereafter acquired, wherever located, together with all accessions, additions, replacements, and substitutions thereto, and all proceeds and products thereof (collectively, the "Collateral"), to secure the prompt and complete payment, performance, and observance of all Obligations (as defined herein).`,
    ),
    spacer(2),
    bodyText(
      "This security interest shall extend to all Collateral now owned or hereafter acquired by Debtor, and all accessions thereto and proceeds thereof, in accordance with UCC § 9-204. Debtor agrees that this Agreement creates a continuing security interest in the Collateral which shall remain in effect until all Obligations are indefeasibly paid and performed in full.",
    ),
    spacer(2),
    spacer(4),

    // ---- Collateral Description ----
    articleHeading("III", "Collateral Description"),
    bodyText(prose.collateralDescription),
    spacer(2),
    sectionSubheading("3.1", "Enumerated Collateral"),
    bodyText(
      "The Collateral includes, without limitation, each of the following categories of property:",
    ),
    ...input.collateralTypes.map((ct) => bulletPoint(collateralLabel(ct))),
    spacer(2),
    sectionSubheading("3.2", "Proceeds and Products"),
    bodyText(
      "The Collateral also includes all proceeds (as defined in the Uniform Commercial Code) and products of any of the foregoing, in whatever form, including insurance proceeds, and all additions, accessions, and substitutions relating to any of the foregoing.",
    ),
    spacer(4),

    // ---- Obligations Secured ----
    articleHeading("IV", "Obligations Secured"),
    bodyText(
      `This Agreement secures the payment and performance of all obligations of Debtor to Secured Party (the "Obligations"), including without limitation:`,
    ),
    bulletPoint(
      `The Promissory Note dated ${effectiveDate} in the original principal amount of ${loanAmount} (${loanAmountWords} dollars) executed by Debtor in favor of Secured Party;`,
    ),
    bulletPoint(
      "The Loan Agreement of even date herewith between Debtor and Secured Party;",
    ),
    bulletPoint(
      "All interest, fees, costs, expenses, and other amounts payable under the foregoing;",
    ),
    bulletPoint(
      "All renewals, extensions, modifications, refinancings, and rearrangements of any of the foregoing.",
    ),
    spacer(2),

    // Key terms summary
    keyTermsTable([
      { label: "Loan Amount", value: `${loanAmount} (${loanAmountWords} dollars)` },
      { label: "Effective Date", value: effectiveDate },
      { label: "Loan Program", value: input.programName },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
    ]),
    spacer(4),

    // ---- Representations and Warranties ----
    articleHeading("V", "Representations and Warranties"),
    bodyText(
      "Debtor represents and warrants to Secured Party as of the date hereof and at all times hereafter until the Obligations are paid in full:",
    ),
    bulletPoint(
      `Organization and Location: Debtor's chief executive office and principal place of business is located at ${input.debtorAddress ?? input.propertyAddress ?? "[address on file]"} in ${input.debtorStateOfOrganization ?? input.stateAbbr ?? "[STATE]"}.`,
    ),
    bulletPoint(
      `Legal Name: Debtor's exact legal name as shown on its organizational documents is "${input.borrowerName}." Debtor has not used any other legal name, trade name, or fictitious business name in the past five (5) years except as disclosed to Secured Party in writing.`,
    ),
    bulletPoint(
      "No Prior Liens: Except as disclosed in writing to Secured Party, there are no security interests, liens, or encumbrances on any of the Collateral.",
    ),
    bulletPoint(
      "Authority: Debtor has full power and authority to grant the security interest in the Collateral and to execute and perform this Agreement.",
    ),
    bulletPoint(
      "Good Title: Debtor has good and marketable title to all Collateral, free and clear of all liens and encumbrances except those in favor of Secured Party.",
    ),
    bulletPoint(
      "Transmitting Utility: Debtor is not a 'transmitting utility' as defined in UCC § 9-102(a)(81).",
    ),
    ...(Array.isArray(prose.representationsAndWarranties)
      ? prose.representationsAndWarranties.map((item) => bulletPoint(item))
      : [bodyText(prose.representationsAndWarranties)]),
    spacer(4),

    // ---- Covenants ----
    articleHeading("VI", "Covenants"),
    bodyText(
      "Debtor covenants and agrees that, until all Obligations are fully satisfied:",
    ),
    sectionSubheading("6.1", "Maintenance of Collateral"),
    bodyText(
      "Debtor shall maintain the Collateral in good condition and repair, ordinary wear and tear excepted, and shall not waste or destroy the Collateral or any part thereof.",
    ),
    sectionSubheading("6.2", "Insurance"),
    bodyText(
      "Debtor shall maintain insurance on the Collateral against fire, theft, and such other risks as Secured Party may reasonably require, in amounts and with insurers satisfactory to Secured Party. All policies shall name Secured Party as loss payee or additional insured, as applicable.",
    ),
    sectionSubheading("6.3", "No Sale or Encumbrance"),
    bodyText(
      "Debtor shall not sell, lease, transfer, assign, or otherwise dispose of any Collateral, or permit any lien or encumbrance to attach thereto, without the prior written consent of Secured Party, except for sales of inventory in the ordinary course of Debtor's business, provided that: (i) such sales are for fair market value; (ii) Debtor is not in default hereunder; and (iii) all proceeds of such sales shall constitute Collateral subject to the security interest granted herein.",
    ),
    sectionSubheading("6.4", "Inspection Rights"),
    bodyText(
      "Debtor shall permit Secured Party and its agents to inspect, audit, and examine the Collateral and Debtor's books and records relating thereto at all reasonable times upon reasonable prior notice.",
    ),
    sectionSubheading("6.5", "Further Assurances"),
    bodyText(
      "Debtor shall execute and deliver such further instruments and take such further action as Secured Party may reasonably request to perfect, protect, and enforce the security interest granted hereby.",
    ),
    spacer(4),

    // ---- Perfection ----
    articleHeading("VII", "Perfection"),
    bodyText(
      "Secured Party shall perfect its security interest in the Collateral by one or more of the following methods, as applicable:",
    ),
    bulletPoint(
      `Filing a UCC-1 Financing Statement in the office of the Secretary of State of ${input.debtorStateOfOrganization ?? input.stateAbbr ?? "[STATE]"};`,
    ),
    bulletPoint(
      "For any Collateral consisting of certificated securities, by taking possession of such certificates;",
    ),
    bulletPoint(
      "For any Collateral consisting of deposit accounts, by entering into a control agreement with the depositary bank;",
    ),
    bulletPoint(
      "For any Collateral consisting of motor vehicles or other titled goods, by notation of lien on the certificate of title.",
    ),
    bodyText(
      "Debtor shall execute all documents and take all actions necessary to perfect and maintain the perfection of Secured Party's security interest, including executing financing statements and amendments thereto.",
    ),
    spacer(2),
    bodyText("Additional Perfection Provisions:", { bold: true }),
    bodyText(prose.perfectionLanguage),
    spacer(4),

    // ---- Events of Default ----
    articleHeading("VIII", "Events of Default"),
    bodyText(
      "An Event of Default under this Agreement shall include, without limitation, any Event of Default as defined in the Loan Agreement of even date herewith between Debtor and Secured Party, as well as:",
    ),
    bulletPoint(
      "Any representation or warranty made by Debtor herein proves to be false or misleading in any material respect;",
    ),
    bulletPoint(
      "Debtor fails to perform any covenant or obligation under this Agreement and such failure continues for ten (10) days after written notice from Secured Party;",
    ),
    bulletPoint(
      "Any Collateral is lost, stolen, substantially damaged, or destroyed;",
    ),
    bulletPoint(
      "Debtor becomes insolvent, files a voluntary petition in bankruptcy, or is the subject of an involuntary bankruptcy proceeding.",
    ),
    bulletPoint(
      "Debtor changes its name, identity, or corporate structure, or changes the location of its chief executive office, without giving Secured Party at least thirty (30) days' prior written notice;",
    ),
    bulletPoint(
      "Any Collateral is removed from Debtor's principal place of business without Secured Party's consent, except inventory sold in the ordinary course of business;",
    ),
    bulletPoint(
      "The value of the Collateral declines by more than twenty percent (20%) as determined by Secured Party in its reasonable discretion.",
    ),
    spacer(4),

    // ---- Remedies ----
    articleHeading("IX", "Remedies"),
    bodyText(
      "Upon the occurrence and during the continuance of an Event of Default, Secured Party shall have all rights and remedies available under the Uniform Commercial Code and applicable law, including without limitation:",
    ),
    bulletPoint(
      "The right to take possession of the Collateral without judicial process, if it can be done without breach of the peace;",
    ),
    bulletPoint(
      "The right to require Debtor to assemble the Collateral and make it available to Secured Party at a place reasonably convenient to both parties;",
    ),
    bulletPoint(
      "The right to sell, lease, license, or otherwise dispose of the Collateral at public or private sale, with or without having the Collateral present at the place of sale;",
    ),
    bulletPoint(
      "The right to collect, receive, and receipt for any and all proceeds of the Collateral;",
    ),
    bodyText(
      "Any sale of Collateral shall be conducted in a commercially reasonable manner in accordance with UCC Article 9. Secured Party shall provide Debtor with reasonable notice of the time and place of any public sale or the time after which any private sale may occur. Notice sent to Debtor's last known address at least ten (10) days before sale shall constitute reasonable notice.",
    ),
    spacer(2),
    bodyText("Additional Remedies:", { bold: true }),
    bodyText(prose.remediesOnDefault),
    spacer(4),

    // ---- Disposition of Collateral ----
    articleHeading("X", "Disposition of Collateral"),
    bodyText(
      "Any proceeds of the disposition of Collateral shall be applied in the following order: (a) first, to the reasonable costs and expenses of retaking, holding, preparing for sale, selling, and the like, including reasonable attorneys' fees and legal expenses incurred by Secured Party; (b) second, to the satisfaction of the Obligations in such order as Secured Party shall determine; and (c) third, any surplus to Debtor or as otherwise required by law. Debtor shall remain liable for any deficiency remaining after application of all proceeds.",
    ),
    spacer(2),
    bodyText("Additional Disposition Provisions:", { bold: true }),
    bodyText(prose.dispositionOfCollateral),
    spacer(4),

    // ---- Governing Law ----
    articleHeading("XI", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),
    // Jury Trial Waiver
    bodyTextRuns([
      { text: "JURY TRIAL WAIVER: ", bold: true },
      { text: "DEBTOR AND SECURED PARTY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT." },
    ]),
    spacer(4),
    // Severability
    bodyTextRuns([
      { text: "Severability: ", bold: true },
      { text: "If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect." },
    ]),
    spacer(4),
    // Counterparts
    bodyTextRuns([
      { text: "Counterparts: ", bold: true },
      { text: "This Agreement may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals." },
    ]),
    spacer(8),

    // ---- Signatures ----
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, the parties have executed this Security Agreement as of the date first written above.",
        bold: true,
      },
    ]),

    // Debtor signature
    bodyText("GRANTED BY — DEBTOR:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Debtor"),

    // Secured Party signature
    bodyText("ACCEPTED BY — SECURED PARTY:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Secured Party"),
  ];

  return buildLegalDocument({
    title: "Security Agreement",
    headerRight: `Security Agreement — ${input.borrowerName}`,
    children,
  });
}
