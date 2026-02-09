// =============================================================================
// custody-agreement.ts
// Builds a three-party Digital Asset Custody Agreement for crypto-collateralized
// loans. Governs the custodian holding digital asset collateral.
// All financial numbers come from DocumentInput; AI writes prose.
// =============================================================================

import type { DocumentInput, CustodyAgreementProse } from "../types";
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
// Builder
// ---------------------------------------------------------------------------

export function buildCustodyAgreement(
  input: DocumentInput,
  prose: CustodyAgreementProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);

  const children = [
    // ---- Title ----
    documentTitle("Digital Asset Custody Agreement"),
    spacer(4),

    bodyText(
      `This Digital Asset Custody Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and among the following parties:`,
    ),
    spacer(4),

    // ---- Parties ----
    articleHeading("I", "Parties"),
    partyBlock("Depositor", input.borrowerName, "the \"Depositor\""),
    partyBlock("Secured Party", input.lenderName, "the \"Secured Party\""),
    partyBlock("Custodian", "[APPROVED CUSTODIAN NAME]", "the \"Custodian\""),
    spacer(4),

    // ---- Key Terms ----
    articleHeading("II", "Key Terms"),
    keyTermsTable([
      { label: "Assets in Custody", value: "All digital assets pledged as collateral under the Digital Asset Pledge and Security Agreement" },
      { label: "Loan Reference", value: `${loanAmount} (${loanAmountWords} dollars) — ${input.programName}` },
      { label: "Custody Account Number", value: "[TBD]" },
      { label: "Effective Date", value: effectiveDate },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
    ]),
    spacer(4),

    // ---- Custodian Responsibilities ----
    articleHeading("III", "Custodian Responsibilities"),
    bodyText(
      "Custodian shall be responsible for the safekeeping and administration of all Digital Assets deposited in the Custody Account. Custodian shall:",
    ),
    spacer(2),
    sectionSubheading("3.1", "Segregated Cold Storage"),
    bodyText(
      "Maintain all Digital Assets in segregated cold storage wallet(s) that are separate from Custodian's proprietary assets and from assets of other customers. Hot wallet holdings shall not exceed five percent (5%) of total custody assets and shall be used only for processing approved transactions.",
    ),
    sectionSubheading("3.2", "Multi-Signature Authorization"),
    bodyText(
      "Implement multi-signature authorization requiring a minimum of two-of-three (2-of-3) authorized signatories for any withdrawal or transfer of Digital Assets from the Custody Account. Private keys shall be generated and stored in geographically distributed, physically secure locations.",
    ),
    sectionSubheading("3.3", "Accurate Records"),
    bodyText(
      "Maintain accurate, complete, and current records of all deposits, withdrawals, transfers, and holdings in the Custody Account, including timestamps, transaction hashes, wallet addresses, and asset quantities.",
    ),
    sectionSubheading("3.4", "Monthly Custody Statements"),
    bodyText(
      "Provide monthly custody statements to both Depositor and Secured Party within ten (10) business days of each month end, detailing all holdings, transactions, valuations, and any material events affecting the Digital Assets.",
    ),
    sectionSubheading("3.5", "Legal Compliance"),
    bodyText(
      "Comply with all applicable federal, state, and local laws and regulations regarding digital asset custody, including but not limited to applicable anti-money laundering (AML) laws, know-your-customer (KYC) requirements, and sanctions compliance.",
    ),
    sectionSubheading("3.6", "SOC 2 Certification"),
    bodyText(
      "Maintain SOC 2 Type II certification (or equivalent industry-standard security audit certification) throughout the term of this Agreement, and provide copies of audit reports to Secured Party upon reasonable request.",
    ),
    spacer(4),

    // ---- Access Control ----
    articleHeading("IV", "Access Control"),
    bodyText(
      "Access to the Custody Account and the Digital Assets held therein shall be governed by the following provisions:",
    ),
    spacer(2),
    sectionSubheading("4.1", "Deposits"),
    bodyText(
      "Depositor may deposit additional Digital Assets into the Custody Account at any time without the prior approval of Secured Party. Custodian shall confirm receipt of all deposits to both Depositor and Secured Party within one (1) business day.",
    ),
    sectionSubheading("4.2", "Withdrawals"),
    bodyText(
      "Withdrawals from the Custody Account shall require the prior written authorization of Secured Party. Custodian shall not process any withdrawal request unless accompanied by written authorization from Secured Party. Secured Party shall respond to withdrawal requests within two (2) business days.",
    ),
    sectionSubheading("4.3", "Upon Default"),
    bodyText(
      "Upon the occurrence of an Event of Default under the Digital Asset Pledge and Security Agreement or the Loan Agreement, Secured Party shall have exclusive control over the withdrawal and disposition of all Digital Assets in the Custody Account. Depositor's right to request withdrawals shall be immediately suspended. Custodian shall comply with all instructions from Secured Party without the consent of Depositor.",
    ),
    sectionSubheading("4.4", "Upon Repayment"),
    bodyText(
      "Upon written confirmation from Secured Party that all obligations under the Loan Agreement have been indefeasibly paid and satisfied in full, Custodian shall release all Digital Assets in the Custody Account to Depositor in accordance with Depositor's written instructions, within five (5) business days of receipt of such confirmation.",
    ),
    spacer(4),

    // ---- Custody Terms (AI prose) ----
    articleHeading("V", "Additional Custody Terms"),
    bodyText(prose.custodyTerms),
    spacer(4),

    // ---- Access Control (AI prose) ----
    articleHeading("VI", "Additional Access Control Provisions"),
    bodyText(prose.accessControl),
    spacer(4),

    // ---- Insurance Requirements (AI prose) ----
    articleHeading("VII", "Insurance Requirements"),
    bodyText(prose.insuranceRequirements),
    spacer(4),

    // ---- Transfer Provisions (AI prose) ----
    articleHeading("VIII", "Transfer Provisions"),
    bodyText(prose.transferProvisions),
    spacer(4),

    // ---- Termination Provisions (AI prose) ----
    articleHeading("IX", "Termination"),
    bodyText(prose.terminationProvisions),
    spacer(4),

    // ---- Indemnification ----
    articleHeading("X", "Indemnification"),
    bodyText(
      "Each party (an \"Indemnifying Party\") shall indemnify, defend, and hold harmless the other parties and their respective officers, directors, employees, agents, successors, and assigns (collectively, the \"Indemnified Parties\") from and against any and all losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or resulting from:",
    ),
    bulletPoint("Any breach by the Indemnifying Party of its representations, warranties, covenants, or obligations under this Agreement;"),
    bulletPoint("Any negligence, willful misconduct, or fraud by the Indemnifying Party or its agents in connection with this Agreement;"),
    bulletPoint("Any third-party claim arising from the Indemnifying Party's failure to comply with applicable law."),
    spacer(4),

    // ---- Limitation of Liability ----
    articleHeading("XI", "Limitation of Liability"),
    bodyText(
      "Custodian shall not be liable for any loss of or damage to Digital Assets resulting from events beyond Custodian's reasonable control, including but not limited to:",
    ),
    bulletPoint("Network failures, blockchain congestion, or protocol-level bugs or vulnerabilities not caused by Custodian's negligence;"),
    bulletPoint("Hard forks, chain splits, or consensus mechanism changes that affect the nature or value of the Digital Assets;"),
    bulletPoint("Regulatory changes that prohibit or restrict the custody, transfer, or holding of Digital Assets;"),
    bulletPoint("Acts of God, war, terrorism, civil unrest, or similar force majeure events;"),
    spacer(2),
    bodyText(
      "Notwithstanding the foregoing, this limitation of liability shall not apply to losses arising from Custodian's gross negligence, willful misconduct, fraud, or breach of its security obligations under this Agreement. In no event shall any party be liable for consequential, incidental, special, punitive, or indirect damages.",
    ),
    spacer(4),

    // ---- Governing Law (AI prose) ----
    articleHeading("XII", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // Standard clauses
    bodyTextRuns([
      { text: "JURY TRIAL WAIVER: ", bold: true },
      { text: "EACH PARTY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVES ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT." },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Severability: ", bold: true },
      { text: "If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect." },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Counterparts: ", bold: true },
      { text: "This Agreement may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals." },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Entire Agreement: ", bold: true },
      { text: "This Agreement constitutes the entire agreement among the parties with respect to the subject matter hereof and supersedes all prior agreements and understandings, oral or written, relating thereto." },
    ]),
    spacer(8),

    // ---- Signatures (three parties) ----
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, the parties have executed this Digital Asset Custody Agreement as of the date first written above.",
        bold: true,
      },
    ]),

    bodyText("DEPOSITOR:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Depositor"),

    spacer(8),
    bodyText("SECURED PARTY:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Secured Party"),

    spacer(8),
    bodyText("CUSTODIAN:", { bold: true, color: COLORS.primary }),
    ...signatureBlock("[APPROVED CUSTODIAN NAME]", "Custodian"),
  ];

  return buildLegalDocument({
    title: "Digital Asset Custody Agreement",
    headerRight: `Custody Agreement — ${input.borrowerName}`,
    children,
  });
}
