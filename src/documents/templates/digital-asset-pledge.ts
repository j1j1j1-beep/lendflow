// =============================================================================
// digital-asset-pledge.ts
// Builds a Digital Asset Pledge and Security Agreement for crypto-collateralized
// loans. All financial numbers come from DocumentInput; AI writes prose.
// =============================================================================

import type { DocumentInput, DigitalAssetPledgeProse } from "../types";
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
  createTable,
  spacer,
  formatCurrency,
  formatDate,
  formatPercentShort,
  numberToWords,
  COLORS,
} from "../doc-helpers";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildDigitalAssetPledge(
  input: DocumentInput,
  prose: DigitalAssetPledgeProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const interestRate = `${(input.terms.interestRate * 100).toFixed(3)}%`;
  const initialLtv = input.terms.ltv
    ? formatPercentShort(input.terms.ltv)
    : "[LTV TBD]";

  const children = [
    // ---- Title ----
    documentTitle("Digital Asset Pledge and Security Agreement"),
    spacer(4),

    bodyText(
      `This Digital Asset Pledge and Security Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
    spacer(4),

    // ---- Parties ----
    articleHeading("I", "Parties"),
    partyBlock("Pledgor", input.borrowerName, "the \"Pledgor\""),
    partyBlock("Secured Party", input.lenderName, "the \"Secured Party\""),
    spacer(4),

    // ---- Key Terms ----
    articleHeading("II", "Key Terms"),
    keyTermsTable([
      { label: "Loan Amount", value: `${loanAmount} (${loanAmountWords} dollars)` },
      { label: "Interest Rate", value: `${interestRate} per annum` },
      { label: "Initial LTV", value: initialLtv },
      { label: "Maximum LTV Before Margin Call", value: "80%" },
      { label: "Maximum LTV Before Liquidation", value: "90%" },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      { label: "Loan Program", value: input.programName },
    ]),
    spacer(4),

    // ---- Collateral Description ----
    articleHeading("III", "Collateral Description"),
    bodyText(
      "All digital assets, virtual currencies, cryptocurrencies, and tokens now or hereafter deposited in, held in, or credited to the Custody Account, including but not limited to Bitcoin (BTC), Ethereum (ETH), and other digital assets accepted by Secured Party, together with all proceeds, products, accessions, and substitutions thereof, and all rights and privileges pertaining thereto (collectively, the \"Collateral\").",
    ),
    spacer(4),

    // ---- Definitions ----
    articleHeading("IV", "Definitions"),
    bodyText(
      "As used in this Agreement, the following terms shall have the meanings set forth below:",
    ),
    spacer(2),
    bodyTextRuns([
      { text: "\"Digital Assets\" ", bold: true },
      { text: "means any digital representation of value or rights that uses cryptography for security and is recorded on a distributed ledger or blockchain, including but not limited to Bitcoin, Ethereum, and other cryptocurrencies, stablecoins, utility tokens, and governance tokens accepted by Secured Party." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Custody Account\" ", bold: true },
      { text: "means the segregated digital asset custody account established and maintained by an Approved Custodian for the purpose of holding the Collateral, as identified in the Custody Agreement." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Approved Custodian\" ", bold: true },
      { text: "means a qualified digital asset custodian that (a) maintains SOC 2 Type II certification or equivalent, (b) carries insurance covering digital asset custody, and (c) is approved in writing by Secured Party." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Margin Call Event\" ", bold: true },
      { text: "means the occurrence of an LTV Ratio that equals or exceeds eighty percent (80%)." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Liquidation Event\" ", bold: true },
      { text: "means the occurrence of an LTV Ratio that equals or exceeds ninety percent (90%)." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Market Value\" ", bold: true },
      { text: "means, with respect to any Digital Asset at any time, the volume-weighted average price of such Digital Asset on the Approved Exchange(s) over the preceding twenty-four (24) hour period, as determined by Secured Party." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"LTV Ratio\" ", bold: true },
      { text: "means, at any time, the ratio (expressed as a percentage) of (a) the outstanding principal balance of the Loan, plus all accrued and unpaid interest and fees, to (b) the aggregate Market Value of all Collateral held in the Custody Account." },
    ]),
    spacer(4),

    // ---- LTV Monitoring ----
    articleHeading("V", "LTV Monitoring and Margin Requirements"),
    bodyText(
      "Secured Party shall monitor the LTV Ratio on a continuous basis. The following thresholds and actions shall apply:",
    ),
    spacer(2),
    createTable(
      ["Metric", "Value"],
      [
        ["Current LTV", "[Calculated at time of execution]"],
        ["Margin Call Trigger", "80% LTV"],
        ["Cure Period", "24 hours from notice"],
        ["Required Action", "Deposit additional Digital Assets to reduce LTV to 70% or make equivalent cash payment"],
        ["Liquidation Trigger", "90% LTV (automatic, no cure period)"],
      ],
      { columnWidths: [40, 60] },
    ),
    spacer(2),
    bodyText(
      "Upon the occurrence of a Margin Call Event, Secured Party shall provide notice to Pledgor by email or other electronic means. Pledgor shall have twenty-four (24) hours from the time of such notice to cure the Margin Call Event by either (a) depositing additional Digital Assets into the Custody Account sufficient to reduce the LTV Ratio to seventy percent (70%) or below, or (b) making a cash payment to reduce the outstanding principal balance of the Loan such that the LTV Ratio is reduced to seventy percent (70%) or below.",
    ),
    spacer(2),
    bodyText(
      "Upon the occurrence of a Liquidation Event, Secured Party shall have the right, without notice to or consent of Pledgor, to immediately liquidate all or a portion of the Collateral sufficient to reduce the LTV Ratio to sixty-five percent (65%) or below. Pledgor acknowledges and agrees that the automatic liquidation right is commercially reasonable given the volatility of Digital Assets.",
    ),
    spacer(4),

    // ---- Grant of Security Interest (AI prose) ----
    articleHeading("VI", "Grant of Security Interest"),
    bodyText(prose.pledgeGrant),
    spacer(4),

    // ---- Valuation Methodology (AI prose) ----
    articleHeading("VII", "Valuation Methodology"),
    bodyText(prose.valuationMethodology),
    spacer(4),

    // ---- Margin Call Provisions (AI prose) ----
    articleHeading("VIII", "Additional Margin Call Provisions"),
    bodyText(prose.marginCallProvisions),
    spacer(4),

    // ---- Liquidation Provisions (AI prose) ----
    articleHeading("IX", "Additional Liquidation Provisions"),
    bodyText(prose.liquidationProvisions),
    spacer(4),

    // ---- Custody Requirements (AI prose) ----
    articleHeading("X", "Custody Requirements"),
    bodyText(prose.custodyRequirements),
    spacer(4),

    // ---- Representations and Warranties ----
    articleHeading("XI", "Representations and Warranties"),
    bodyText(
      "Pledgor represents and warrants to Secured Party as of the date hereof and at all times hereafter until all obligations are paid in full:",
    ),
    bulletPoint("Pledgor is the sole legal and beneficial owner of all Digital Assets constituting the Collateral, free and clear of all liens, security interests, claims, and encumbrances, other than the security interest granted herein;"),
    bulletPoint("No prior security interest, lien, or encumbrance has been granted in or against any of the Collateral;"),
    bulletPoint("The Digital Assets constituting the Collateral were not obtained through illegal activity, money laundering, fraud, or any activity in violation of applicable anti-money laundering laws, sanctions, or regulations;"),
    bulletPoint("Pledgor has the full legal right, power, and authority to pledge the Collateral and to enter into and perform its obligations under this Agreement;"),
    bulletPoint("The execution and delivery of this Agreement does not violate any law, regulation, order, or agreement binding upon Pledgor;"),
    spacer(4),

    // ---- Covenants ----
    articleHeading("XII", "Covenants"),
    bodyText(
      "Pledgor covenants and agrees that, until all obligations are fully satisfied:",
    ),
    bulletPoint("Pledgor shall maintain all Digital Assets constituting the Collateral in the Custody Account with an Approved Custodian at all times;"),
    bulletPoint("Pledgor shall not sell, transfer, assign, exchange, swap, stake, lend, or otherwise dispose of or encumber any Collateral without the prior written consent of Secured Party;"),
    bulletPoint("Pledgor shall promptly respond to any Margin Call Event and shall cure such event within the required cure period;"),
    bulletPoint("Pledgor shall promptly notify Secured Party in writing of any hard fork, airdrop, staking reward, or similar event affecting any Digital Asset constituting the Collateral, and any resulting new tokens or assets shall constitute additional Collateral;"),
    bulletPoint("Pledgor shall not take any action that could impair the value of the Collateral or Secured Party's security interest therein;"),
    bulletPoint("Pledgor shall provide such information regarding the Collateral as Secured Party may reasonably request;"),
    spacer(4),

    // ---- Governing Law (AI prose) ----
    articleHeading("XIII", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // Standard clauses
    bodyTextRuns([
      { text: "JURY TRIAL WAIVER: ", bold: true },
      { text: "PLEDGOR AND SECURED PARTY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT." },
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
    spacer(8),

    // ---- Signatures ----
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, the parties have executed this Digital Asset Pledge and Security Agreement as of the date first written above.",
        bold: true,
      },
    ]),

    bodyText("PLEDGOR:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Pledgor"),

    bodyText("SECURED PARTY:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Secured Party"),
  ];

  return buildLegalDocument({
    title: "Digital Asset Pledge and Security Agreement",
    headerRight: `Digital Asset Pledge — ${input.borrowerName}`,
    children,
  });
}
