// digital-asset-pledge.ts
// Builds a Digital Asset Pledge and Security Agreement for crypto-collateralized
// loans. All financial numbers come from DocumentInput; AI writes prose.

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

// Builder

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
    // Title
    documentTitle("Digital Asset Pledge and Security Agreement"),
    spacer(4),

    bodyText(
      `This Digital Asset Pledge and Security Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
    spacer(4),

    // Parties
    articleHeading("I", "Parties"),
    partyBlock("Pledgor", input.borrowerName, "the \"Pledgor\""),
    partyBlock("Secured Party", input.lenderName, "the \"Secured Party\""),
    spacer(4),

    // Key Terms
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

    // Collateral Description
    articleHeading("III", "Collateral Description"),
    bodyText(
      "All digital assets, virtual currencies, cryptocurrencies, and tokens now or hereafter deposited in, held in, or credited to the Custody Account, including but not limited to Bitcoin (BTC), Ethereum (ETH), and other digital assets accepted by Secured Party, together with all proceeds, products, accessions, and substitutions thereof, and all rights and privileges pertaining thereto (collectively, the \"Collateral\").",
    ),
    spacer(4),

    // Definitions
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

    // LTV Monitoring
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

    // UCC Article 12 — Perfection by Control for Digital Assets
    articleHeading("VI", "Perfection of Security Interest — UCC Article 12"),
    bodyText(
      "The parties acknowledge that, as of the date of this Agreement, thirty-three (33) or more states have adopted UCC Article 12 (Controllable Electronic Records), including New York (effective June 3, 2026). To the extent the Collateral constitutes a \"controllable electronic record\" or \"controllable account\" under UCC Article 12 as enacted in the applicable jurisdiction, Secured Party's security interest shall be perfected by control in accordance with UCC Section 12-105. Pledgor shall take all actions necessary to ensure Secured Party has control over such Collateral, including but not limited to establishing the power to avail itself of substantially all the benefit from the Collateral and, following default, the power to transfer control. The parties agree to supplement this Agreement as necessary to comply with UCC Article 12 perfection-by-control requirements in any jurisdiction that subsequently adopts such provisions.",
    ),
    spacer(4),

    // Grant of Security Interest (AI prose)
    articleHeading("VII", "Grant of Security Interest"),
    bodyText(prose.pledgeGrant),
    spacer(4),

    // Valuation Methodology (AI prose)
    articleHeading("VIII", "Valuation Methodology"),
    bodyText(prose.valuationMethodology),
    spacer(4),

    // Margin Call Provisions (AI prose)
    articleHeading("IX", "Additional Margin Call Provisions"),
    bodyText(prose.marginCallProvisions),
    spacer(4),

    // Liquidation Provisions (AI prose)
    articleHeading("X", "Additional Liquidation Provisions"),
    bodyText(prose.liquidationProvisions),
    spacer(4),

    // Custody Requirements (AI prose)
    articleHeading("XI", "Custody Requirements"),
    bodyText(prose.custodyRequirements),
    spacer(4),

    // Representations and Warranties
    articleHeading("XII", "Representations and Warranties"),
    bodyText(
      "Pledgor represents and warrants to Secured Party as of the date hereof and at all times hereafter until all obligations are paid in full:",
    ),
    bulletPoint("Pledgor is the sole legal and beneficial owner of all Digital Assets constituting the Collateral, free and clear of all liens, security interests, claims, and encumbrances, other than the security interest granted herein;"),
    bulletPoint("No prior security interest, lien, or encumbrance has been granted in or against any of the Collateral;"),
    bulletPoint("The Digital Assets constituting the Collateral were not obtained through illegal activity, money laundering, fraud, or any activity in violation of applicable anti-money laundering laws, sanctions, or regulations;"),
    bulletPoint("Pledgor has the full legal right, power, and authority to pledge the Collateral and to enter into and perform its obligations under this Agreement;"),
    bulletPoint("The execution and delivery of this Agreement does not violate any law, regulation, order, or agreement binding upon Pledgor;"),
    bulletPoint("To the extent any Digital Assets constituting the Collateral include stablecoins (as defined below), Pledgor represents and warrants that such stablecoins are issued by a licensed payment stablecoin issuer as defined under the Guiding and Establishing National Innovation for U.S. Stablecoins Act (the \"GENIUS Act\"), signed into law on July 18, 2025. A \"payment stablecoin\" means a digital asset designed to be used as a means of payment or settlement and that is pegged to a fixed monetary value, the issuer of which is obligated to redeem at par value in U.S. dollars. Pledgor further represents that each such issuer maintains reserves of not less than 100% of the face amount of outstanding stablecoins, comprised of permitted reserve assets, and provides monthly reserve attestations as required under the GENIUS Act;"),
    bulletPoint("Pledgor shall not substitute or add to the Collateral any stablecoins issued by an issuer that is not a licensed payment stablecoin issuer in compliance with the GENIUS Act, and any attempt to pledge non-compliant stablecoins shall be void and shall not reduce or satisfy any margin call or collateral top-up obligation;"),
    spacer(4),

    // Covenants
    articleHeading("XIII", "Covenants"),
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

    // Tax Disclosure — Collateral Liquidation
    articleHeading("XIV", "Tax Disclosure"),
    bodyText(
      "IMPORTANT TAX DISCLOSURE: Pledgor acknowledges and agrees that the liquidation, sale, exchange, or other disposition of any Digital Assets constituting Collateral — whether pursuant to a Liquidation Event, Margin Call cure, voluntary sale, or foreclosure — is a taxable event under the Internal Revenue Code (26 U.S.C.) and may result in capital gains or losses. Pledgor is solely responsible for all tax obligations arising from any such disposition, including without limitation any income taxes, capital gains taxes, or other taxes imposed by federal, state, or local taxing authorities. Secured Party shall have no obligation to consider the tax consequences to Pledgor in connection with any liquidation of Collateral. Pledgor is strongly advised to consult with a qualified tax advisor regarding the tax implications of this Agreement and any potential Collateral liquidation.",
    ),
    spacer(4),

    // Banking Regulator Guidance Note
    articleHeading("XV", "Regulatory Environment"),
    bodyText(
      "The parties acknowledge that, as of 2025, the Office of the Comptroller of the Currency (OCC), the Federal Deposit Insurance Corporation (FDIC), and the Board of Governors of the Federal Reserve System all withdrew their previously issued restrictive guidance on digital asset activities by financial institutions (OCC Interpretive Letters 1170, 1172, 1174 rescission; FDIC FIL-16-2022 withdrawal; Federal Reserve SR 22-6 withdrawal). This withdrawal reflects a shift toward permitting supervised institutions to engage in digital asset custody and lending activities under existing authority, subject to safety and soundness requirements. The regulatory framework applicable to Digital Assets continues to evolve, and the parties agree to comply with all applicable regulations as amended from time to time.",
    ),
    spacer(4),

    // Governing Law (AI prose)
    articleHeading("XVI", "Governing Law"),
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

    // Signatures
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
