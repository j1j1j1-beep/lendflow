// generate-doc.ts
// Dispatcher function for M&A document generation.
// Routes each doc type to its template builder, handles AI prose where needed,
// and returns a buffer + compliance checks.

import { Packer } from "docx";
import { claudeJson } from "@/lib/claude";
import {
  buildLegalDocument,
  documentTitle,
  bodyText,
  formatCurrency,
  safeNumber,
} from "@/documents/doc-helpers";

import type { MAProjectFull, ComplianceCheck } from "./types";
import { MA_DOC_TYPE_LABELS } from "./types";

// Template imports
import { buildLOI } from "./templates/loi";
import { buildNDA } from "./templates/nda";
import { buildPurchaseAgreement } from "./templates/purchase-agreement";
import { buildDueDiligenceChecklist } from "./templates/due-diligence-checklist";
import { buildDisclosureSchedules } from "./templates/disclosure-schedules";
import { buildClosingChecklist } from "./templates/closing-checklist";

// Deterministic doc types — no AI prose needed
const ZERO_AI_DOCS = new Set([
  "due_diligence_checklist",
  "closing_checklist",
]);

// System prompt for M&A document prose generation
const MA_SYSTEM_PROMPT = `You are a senior M&A attorney with 25+ years of experience at a top-tier law firm. You draft enforceable, production-ready M&A transaction documents for institutional clients. Your documents must withstand judicial scrutiny and regulatory examination.

ABSOLUTE RULES — VIOLATION OF ANY RULE MAKES THE DOCUMENT UNENFORCEABLE:
1. NUMBERS ARE SACRED: Use the EXACT dollar amounts, percentages, dates, term lengths, and other numbers provided. Never round, estimate, approximate, or omit any number. Every number in the deal terms MUST appear verbatim in your prose where relevant.
2. CITE SPECIFIC STATUTES: When referencing laws, cite the actual section number (e.g., "pursuant to DGCL Section 251" not "under Delaware law"; "as required by 15 U.S.C. Section 18a" not "under the HSR Act"). Use the specific regulatory references provided.
3. COMPLETE PROVISIONS: Every section must be a complete, standalone legal provision. Do not write summaries, outlines, or placeholders. Write the actual clause as it would appear in an executed document.
4. ENFORCEABILITY REQUIREMENTS:
   - Every waiver must be explicit and specific (courts do not enforce general waivers)
   - Default provisions must include specific cure periods and notice requirements
   - Governing law must specify the exact state, include conflict-of-laws exclusion, and specify federal/state court venue
   - Jury trial waivers must be conspicuous and mutual
   - Severability clauses must include reformation language
5. TRANSACTION-SPECIFIC COMPLIANCE: Your prose must comply with:
   - HSR Act requirements (15 U.S.C. Section 18a) if applicable
   - DGCL requirements for mergers (Section 251) and asset sales (Section 271)
   - Tax code provisions (Sections 338, 368, 382, 453, 1060) as applicable
   - Section 197 (amortization of intangibles/goodwill, 15-year period) and Section 280G (golden parachute payments, 3x base amount safe harbor)
   - Securities law requirements for stock consideration
   - Note that Section 1031 exchanges apply ONLY to real property since TCJA 2017.
6. STANDARD OF CARE: Write as if this document will be:
   - Reviewed by opposing counsel before execution
   - Examined by regulators during review
   - Tested in litigation if the transaction is challenged
7. OUTPUT: Respond ONLY with valid JSON matching the requested schema. No commentary, disclaimers, or template language.

AI-GENERATED CONTENT DISCLAIMER:
This AI-generated content is for document drafting assistance only and does not constitute legal advice. The generated documents must be reviewed by qualified legal counsel before execution.`;

/**
 * Build deal context string from MAProject data.
 * Injects ALL numbers into the prompt so AI writes around them.
 */
function buildMAContext(project: MAProjectFull): string {
  const purchasePrice = safeNumber(project.purchasePrice);
  const cashComponent = safeNumber(project.cashComponent);
  const stockComponent = safeNumber(project.stockComponent);
  const sellerNote = safeNumber(project.sellerNote);
  const earnoutAmount = safeNumber(project.earnoutAmount);
  const targetRevenue = safeNumber(project.targetRevenue);
  const targetEbitda = safeNumber(project.targetEbitda);
  const workingCapitalTarget = safeNumber(project.workingCapitalTarget);
  const hsrFilingFee = safeNumber(project.hsrFilingFee);

  const transactionTypeLabel: Record<string, string> = {
    STOCK_PURCHASE: "Stock Purchase",
    ASSET_PURCHASE: "Asset Purchase",
    MERGER_FORWARD: "Forward Merger (Section 368(a)(1)(A))",
    MERGER_REVERSE_TRIANGULAR: "Reverse Triangular Merger",
    MERGER_FORWARD_TRIANGULAR: "Forward Triangular Merger",
    REVERSE_MERGER: "Reverse Merger",
    TENDER_OFFER: "Tender Offer",
    SECTION_363_SALE: "Section 363 Bankruptcy Sale",
  };

  const taxStructureLabel: Record<string, string> = {
    SECTION_338H10: "Section 338(h)(10) Election (deemed asset purchase for tax)",
    SECTION_338G: "Section 338(g) Election (unilateral buyer election)",
    // Note: Section 1031 limited to real property since TCJA 2017. Only appropriate for real estate M&A transactions.
    SECTION_1031: "Section 1031 Like-Kind Exchange (real property only — TCJA 2017)",
    SECTION_368_A: "Section 368(a)(1)(A) Tax-Free Reorganization (Type A)",
    SECTION_368_B: "Section 368(a)(1)(B) Stock-for-Stock (Type B)",
    SECTION_368_C: "Section 368(a)(1)(C) Stock-for-Assets (Type C)",
    QSBS_1202: "Section 1202 QSBS Exclusion",
    STANDARD: "Standard Taxable Transaction",
  };

  const macCarveouts = Array.isArray(project.macCarveouts) ? project.macCarveouts as string[] : null;
  const requiredApprovals = Array.isArray(project.requiredApprovals) ? project.requiredApprovals as string[] : null;

  // Escrow percentage: handle 0-1 (decimal) vs 0-100 (whole number) ambiguity
  // If escrowPercent > 1, user likely entered a whole percentage (e.g. 10 instead of 0.10)

  return `M&A DEAL TERMS (source of truth — use these exact numbers):

Transaction Name: ${project.name}
Transaction Type: ${transactionTypeLabel[project.transactionType] ?? project.transactionType}

PARTIES:
Buyer: ${project.buyerName}${project.buyerEntity ? ` (${project.buyerEntity})` : ""}${project.buyerCounsel ? ` — Counsel: ${project.buyerCounsel}` : ""}
Seller: ${project.sellerName}${project.sellerEntity ? ` (${project.sellerEntity})` : ""}${project.sellerCounsel ? ` — Counsel: ${project.sellerCounsel}` : ""}

TARGET COMPANY:
Name: ${project.targetCompany}
Industry: ${project.targetIndustry ?? "Not specified"}
Revenue: ${targetRevenue ? formatCurrency(targetRevenue) : "Not specified"}
EBITDA: ${targetEbitda ? formatCurrency(targetEbitda) : "Not specified"}
Employees: ${project.targetEmployees ?? "Not specified"}
State of Incorporation: ${project.targetState ?? "Not specified"}

DEAL ECONOMICS:
Purchase Price: ${purchasePrice ? formatCurrency(purchasePrice) : "Not specified"}
  Cash Component: ${cashComponent ? formatCurrency(cashComponent) : "N/A"}
  Stock Component: ${stockComponent ? formatCurrency(stockComponent) : "N/A"}
  Seller Note: ${sellerNote ? formatCurrency(sellerNote) : "N/A"}
  Earnout: ${earnoutAmount ? `${formatCurrency(earnoutAmount)} over ${project.earnoutTermMonths ?? "N/A"} months` : "N/A"}
Working Capital Target: ${workingCapitalTarget ? formatCurrency(workingCapitalTarget) : "Not specified"}
Escrow: ${project.escrowPercent ? `${(((safeNumber(project.escrowPercent) > 1 ? safeNumber(project.escrowPercent) / 100 : safeNumber(project.escrowPercent))) * 100).toFixed(1)}% for ${project.escrowTermMonths ?? "N/A"} months` : "N/A"}

TIMELINE:
Exclusivity Period: ${project.exclusivityDays ? `${project.exclusivityDays} days` : "Not specified"}
Due Diligence Period: ${project.dueDiligenceDays ? `${project.dueDiligenceDays} days` : "Not specified"}
Target Close Date: ${project.targetCloseDate ? project.targetCloseDate.toISOString().split("T")[0] : "Not specified"}
Outside Date: ${project.outsideDate ? project.outsideDate.toISOString().split("T")[0] : "Not specified"}

GOVERNANCE:
Governing Law: ${project.governingLaw ?? "Delaware"}
Non-Compete: ${project.nonCompeteYears ? `${project.nonCompeteYears} years` : "Not specified"}${project.nonCompeteRadius ? `, ${project.nonCompeteRadius}` : ""}

HSR ACT:
HSR Required: ${project.hsrRequired ? "Yes" : project.hsrRequired === false ? "No" : "TBD"}
HSR Filing Fee: ${hsrFilingFee ? formatCurrency(hsrFilingFee) : "N/A"}
HSR Status: ${project.hsrStatus ?? "N/A"}
${project.hsrFilingDate ? `HSR Filing Date: ${project.hsrFilingDate.toISOString().split("T")[0]}` : ""}
${project.hsrClearanceDate ? `HSR Clearance Date: ${project.hsrClearanceDate.toISOString().split("T")[0]}` : ""}

TAX STRUCTURE:
${project.taxStructure ? taxStructureLabel[project.taxStructure] ?? project.taxStructure : "Standard Taxable Transaction"}
Section 338 Election: ${project.section338Election ? "Yes" : "No"}

INSURANCE:
R&W Insurance: ${project.rwiInsurance ? "Yes" : "No"}
${project.rwiInsurance && project.rwiPremiumPercent ? `R&W Premium: ${(project.rwiPremiumPercent * 100).toFixed(1)}% of policy limit` : ""}

MAC CLAUSE:
${project.macDefinition ?? "Standard MAC definition"}
Carveouts: ${macCarveouts && macCarveouts.length > 0 ? macCarveouts.join("; ") : "Standard carveouts (general economic conditions, industry conditions, financial markets, changes in law/regulation, GAAP changes, acts of God/natural disasters, pandemics/epidemics, cyberattacks/data breaches, credit/capital markets disruptions)"}

REQUIRED APPROVALS:
${requiredApprovals && requiredApprovals.length > 0 ? requiredApprovals.join(", ") : "Standard board/stockholder approvals"}

EMPLOYEE MATTERS:
Key Employee Retention: ${project.keyEmployeeRetention ? "Required" : "Not applicable"}
Change of Control Provisions: ${project.changeOfControlProvisions ? "Yes" : "No"}

2025 HSR THRESHOLDS (for reference if HSR applies):
- Size-of-transaction minimum: $119.5 million
- Filing fees (6 tiers):
  >$119.5M-$173.3M: $30,000
  >$173.3M-$536.1M: $105,000
  >$536.1M-$1.0932B: $260,000
  >$1.0932B-$2.186B: $415,000
  >$2.186B-$5.466B: $830,000
  >$5.466B: $2,335,000
- 30-day waiting period (15 for cash tender); Second Request: 30 days after substantial compliance with the Second Request (10 days for cash tender offers per 16 CFR 803.10(b)). Substantial compliance required; 30-day waiting period restarts upon certification of compliance.
- Penalty for failure to file: up to $54,540 per day`;
}

/**
 * Resolve the actual purchase agreement doc type based on transaction type.
 */
function resolvePurchaseAgreementType(transactionType: string): string {
  switch (transactionType) {
    case "STOCK_PURCHASE":
      return "stock_purchase_agreement";
    case "ASSET_PURCHASE":
    case "SECTION_363_SALE":
      return "asset_purchase_agreement";
    case "MERGER_FORWARD":
    case "MERGER_REVERSE_TRIANGULAR":
    case "MERGER_FORWARD_TRIANGULAR":
    case "REVERSE_MERGER":
      return "merger_agreement";
    case "TENDER_OFFER":
      return "stock_purchase_agreement"; // Tender offers typically use stock purchase agreement
    default:
      return "stock_purchase_agreement";
  }
}

/**
 * Generate a single M&A document.
 * Returns the DOCX buffer and compliance checks.
 */
export async function generateMADoc(
  project: MAProjectFull,
  docType: string,
): Promise<{ buffer: Buffer; complianceChecks: ComplianceCheck[]; resolvedDocType: string }> {
  const isZeroAI = ZERO_AI_DOCS.has(docType);
  const complianceChecks: ComplianceCheck[] = [];

  // Resolve purchase_agreement to specific type
  let resolvedDocType = docType;
  if (docType === "purchase_agreement") {
    resolvedDocType = resolvePurchaseAgreementType(project.transactionType);
  }

  try {
    let doc;

    if (docType === "due_diligence_checklist") {
      doc = buildDueDiligenceChecklist(project);
      addDeterministicComplianceChecks(project, complianceChecks);
    } else if (docType === "closing_checklist") {
      doc = buildClosingChecklist(project);
      addDeterministicComplianceChecks(project, complianceChecks);
    } else if (docType === "loi") {
      const prose = await generateLOIProse(project);
      doc = buildLOI(project, prose);
      addLOIComplianceChecks(project, complianceChecks);
    } else if (docType === "nda") {
      const prose = await generateNDAProse(project);
      doc = buildNDA(project, prose);
      addNDAComplianceChecks(project, complianceChecks);
    } else if (docType === "purchase_agreement") {
      const prose = await generatePurchaseAgreementProse(project);
      doc = buildPurchaseAgreement(project, prose);
      addPurchaseAgreementComplianceChecks(project, complianceChecks);
    } else if (docType === "disclosure_schedules") {
      const prose = await generateDisclosureSchedulesProse(project);
      doc = buildDisclosureSchedules(project, prose);
      addDisclosureComplianceChecks(project, complianceChecks);
    } else {
      // Fallback placeholder
      doc = buildLegalDocument({
        title: MA_DOC_TYPE_LABELS[docType] ?? docType,
        children: [
          documentTitle(MA_DOC_TYPE_LABELS[docType] ?? docType),
          bodyText(`This document template is pending implementation.`),
          bodyText(`Project: ${project.name}`),
          bodyText(`Target: ${project.targetCompany}`),
        ],
      });
    }

    const buffer = await Packer.toBuffer(doc) as Buffer;
    return { buffer, complianceChecks, resolvedDocType };
  } catch (error) {
    console.error(`Failed to generate MA doc ${docType}:`, error);

    // Return error placeholder document
    const errorDoc = buildLegalDocument({
      title: "Generation Error",
      children: [
        documentTitle("Document Generation Error"),
        bodyText(`The ${MA_DOC_TYPE_LABELS[docType] ?? docType} could not be generated.`),
        bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`),
        bodyText("Please retry generation or create this document manually."),
      ],
    });
    const buffer = await Packer.toBuffer(errorDoc) as Buffer;
    return { buffer, complianceChecks, resolvedDocType };
  }
}

// ─── AI Prose Generators ─────────────────────────────────────────────

async function generateLOIProse(project: MAProjectFull) {
  const context = buildMAContext(project);
  return claudeJson<import("./types").LOIProse>({
    systemPrompt: MA_SYSTEM_PROMPT,
    userPrompt: `${context}

Generate the prose sections for a LETTER OF INTENT / TERM SHEET for this M&A transaction. The deterministic sections (party identification, key terms table, signature blocks) are handled by the template. You provide the legal language.

The LOI must clearly distinguish between BINDING and NON-BINDING provisions per standard M&A practice.

Return JSON matching this exact schema:
{
  "openingParagraph": "string — formal opening setting forth buyer's intent to acquire target, referencing the parties and general transaction structure",
  "purchasePriceProvision": "string — NON-BINDING: description of proposed purchase price, form of consideration (cash/stock/mixed), any adjustments (working capital), and earnout if applicable. Use exact numbers from deal terms.",
  "structureDescription": "string — NON-BINDING: description of transaction structure (stock purchase, asset purchase, or merger) including what is being acquired and key structural features",
  "dueDiligenceScope": ["array of strings — NON-BINDING: each is a category of due diligence buyer intends to conduct (corporate, financial, legal, IP, tax, environmental, employee, IT, etc.)"],
  "closingConditions": ["array of strings — NON-BINDING: each is a condition to closing (satisfactory due diligence, definitive agreement, board approval, HSR clearance if applicable, third-party consents, no MAC, financing if applicable)"],
  "exclusivityProvision": "string — BINDING: no-shop/exclusivity provision for the specified exclusivity period, prohibiting seller from soliciting or entertaining competing offers, with carveout for fiduciary duties if applicable",
  "confidentialityProvision": "string — BINDING: confidentiality obligations regarding the transaction and all information exchanged, referencing the NDA if one exists",
  "expenseAllocation": "string — BINDING: each party bears its own expenses (legal, accounting, advisory) whether or not the transaction closes",
  "bindingNonBindingStatement": "string — BINDING: clear statement that only the exclusivity, confidentiality, expense allocation, and governing law provisions are binding obligations; all other provisions are expressions of intent only and do not create binding obligations",
  "governingLaw": "string — BINDING: governing law, jurisdiction, venue, jury trial waiver"
}`,
    maxTokens: 6000,
  });
}

async function generateNDAProse(project: MAProjectFull) {
  const context = buildMAContext(project);
  return claudeJson<import("./types").NDAProse>({
    systemPrompt: MA_SYSTEM_PROMPT,
    userPrompt: `${context}

Generate the prose sections for a NON-DISCLOSURE AGREEMENT for this M&A transaction. The deterministic sections (party identification, key terms table, signature blocks) are handled by the template. You provide the legal language.

This NDA is specifically for evaluating a potential acquisition — all provisions should be tailored to the M&A context.

Include securities law reminder: receiving party acknowledges that Confidential Information may constitute material non-public information under Section 10(b) of the Securities Exchange Act of 1934 and Rule 10b-5. Receiving party agrees not to trade in securities of Disclosing Party while in possession of MNPI.

Return JSON matching this exact schema:
{
  "confidentialInfoDefinition": "string — broad definition of Confidential Information including all financial, business, technical, operational, and legal information about the target company, with standard carveouts (public information, independently developed, received from third party without restriction, already known)",
  "permittedUse": "string — information may be used solely for evaluating, negotiating, and potentially consummating the potential acquisition transaction described herein",
  "permittedDisclosures": "string — disclosure permitted to representatives (directors, officers, employees, advisers, counsel, accountants, financing sources) on a need-to-know basis, provided they are bound by confidentiality obligations no less restrictive than this agreement. Compelled disclosure permitted with notice and cooperation.",
  "termAndDuration": "string — agreement term of 2-3 years from execution date; obligations with respect to trade secrets survive indefinitely",
  "nonSolicitation": "string — non-solicitation of target's employees for 1-2 years, with carveout for general advertisements not directed at target's employees and for employees who initiate contact",
  "standstillProvision": "string — receiving party agrees not to acquire or offer to acquire any securities or assets of the disclosing party, or seek to influence or control management, board, or policies, for a specified period, with fall-away provisions if a third party makes an offer or the disclosing party enters into a definitive agreement with a third party",
  "residualKnowledge": "string — receiving party may use general knowledge, skills, and experience (including ideas, concepts, know-how, and techniques) retained in unaided memory of its representatives who had access to Confidential Information, provided this clause does not excuse breach of confidentiality obligations or permit use of specific proprietary information",
  "remedies": "string — irreparable harm acknowledgment; specific performance and injunctive relief available without bond; monetary damages not an adequate remedy; prevailing party entitled to reasonable attorneys' fees",
  "returnOfMaterials": "string — upon written request or termination, return or destroy all Confidential Information; certification of destruction by authorized officer; retention permitted for copies in automated backup systems (subject to continuing confidentiality) and as required by law, regulation, or professional standards",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`,
    maxTokens: 5000,
  });
}

async function generatePurchaseAgreementProse(project: MAProjectFull) {
  const context = buildMAContext(project);
  const resolvedType = resolvePurchaseAgreementType(project.transactionType);

  let structureGuidance = "";
  if (resolvedType === "stock_purchase_agreement") {
    structureGuidance = `This is a STOCK PURCHASE AGREEMENT. Buyer acquires shares/equity interests directly from seller.
Key considerations:
- ALL liabilities transfer (known and unknown) — buyer assumes everything
- Buyer gets carryover basis in assets (no step-up unless Section 338 election)
- Section 382 NOL limitations apply if ownership change >50% in 3-year period
- Assignment provisions in contracts may require consent
${project.section338Election ? "- Section 338(h)(10) election applies — treated as deemed asset purchase for tax purposes. IRS Form 8023 required by the 15th day of the 9th month following the month of acquisition (IRC Section 338(g)(2))." : ""}`;
  } else if (resolvedType === "asset_purchase_agreement") {
    structureGuidance = `This is an ASSET PURCHASE AGREEMENT. Buyer acquires specific assets and assumes specified liabilities.
Key considerations:
- Buyer gets stepped-up basis in acquired assets
- Purchase price allocated per Section 1060 (residual method) — IRS Form 8594 required
- Only assumed liabilities transfer; successor liability risk in some states
- Each contract must be individually assigned (consent often required)
- Bulk sales laws may apply`;
  } else {
    structureGuidance = `This is a MERGER AGREEMENT (Section 368 Reorganization).
Key considerations:
- Continuity of interest requirement: 40% historic target (per Rev. Rul. 66-224), but Treas. Reg. 1.368-1(e)(2)(v) reduced to approximately 40%
- Continuity of business enterprise requirement
- DGCL Section 251 requires board approval + majority stockholder vote
- DGCL Section 262 appraisal rights for dissenting stockholders
- Target merges into buyer (or buyer subsidiary) by operation of law`;
  }

  return claudeJson<import("./types").PurchaseAgreementProse>({
    systemPrompt: MA_SYSTEM_PROMPT,
    userPrompt: `${context}

${structureGuidance}

Generate the prose sections for a ${MA_DOC_TYPE_LABELS[resolvedType] ?? "Purchase Agreement"}. The deterministic sections (definitions table, party identification, key terms, consideration table, signature blocks) are handled by the template. You provide the legal clauses.

Consider Section 453 (installment sales), Section 197 (amortization of intangibles/goodwill, 15-year), and Section 280G (golden parachute payments, 3x base amount safe harbor).

\${project.hsrRequired ? "Include HSR filing covenant with 2025 thresholds ($119.5M size-of-transaction minimum). 30-day waiting period (15 for cash tender). Second Request: 30 days after substantial compliance with the Second Request (10 days for cash tender offers per 16 CFR 803.10(b)). HSR filing fees (2025, 6 tiers): >$119.5M-$173.3M = $30,000; >$173.3M-$536.1M = $105,000; >$536.1M-$1.0932B = $260,000; >$1.0932B-$2.186B = $415,000; >$2.186B-$5.466B = $830,000; >$5.466B = $2,335,000. Penalty for failure to file: up to $54,540 per day." : ""}
${project.rwiInsurance ? `Include R&W insurance provisions. Premium: ${project.rwiPremiumPercent ? (project.rwiPremiumPercent * 100).toFixed(1) + "% of policy limit" : "1.0-2.5% of policy limit"}. Buyer-side policy. Standard exclusions for known issues and purchase price adjustments.` : ""}

EARNOUT PROVISIONS (if earnout applies): Include detailed earnout mechanics: (1) measurement period and milestones; (2) specific financial metrics (revenue, EBITDA, gross profit) calculated per GAAP consistently applied; (3) independent accounting firm dispute resolution (each party appoints one firm, two firms appoint third if needed); (4) operating covenants restricting extraordinary transactions that could reduce earnout; (5) confidential access to books/records for earnout calculation.

KNOWLEDGE QUALIFIER / SANDBAGGING: Include a knowledge qualifier provision addressing whether Buyer may seek indemnification for breaches of representations even if Buyer had knowledge of the breach at closing. Common approaches: (1) Pro-sandbagging (Delaware/NY default) — Buyer may recover even with knowledge; (2) Anti-sandbagging (CA/TX default) — Buyer may not recover if it had actual knowledge; (3) Hybrid — Buyer may recover unless it had actual knowledge AND failed to disclose. Follow the governing law's default rule or specify the parties' agreement.

Return JSON matching this exact schema:
{
  "recitals": "string — WHEREAS clauses establishing the parties, their authority, the target company, and the purpose of the transaction",
  "purchaseAndSale": "string — core purchase and sale provision: what is being bought (shares/assets/merger), transfer mechanics, and closing deliverables",
  "considerationProvisions": "string — detailed consideration provisions: form of payment (cash at closing, stock, seller note, earnout), payment mechanics, and escrow if applicable. Use exact numbers from deal terms. If earnout applies, include: measurement period, financial metrics (GAAP), dispute resolution by independent accounting firm, operating covenants, and access rights for calculation.",
  "workingCapitalAdjustment": "string — working capital adjustment mechanism: target working capital amount, preliminary estimate at closing, true-up within 60-90 days, dispute resolution by independent accounting firm, collar/band mechanism if applicable",
  "sellerRepresentations": ["array of strings — each is a seller representation and warranty: organization and good standing, authority, capitalization, subsidiaries, financial statements, absence of undisclosed liabilities, no MAC since last financial statements, material contracts, litigation, IP, real property, environmental, employees/benefits, tax, insurance, regulatory compliance, brokers/finders. 25-40 standard reps."],
  "buyerRepresentations": ["array of strings — each is a buyer representation and warranty: organization and good standing, authority, no conflicts, financing (if applicable), investment intent (for stock purchase), solvency, brokers/finders. 8-12 standard reps."],
  "preClosingCovenants": ["array of strings — each is a pre-closing covenant: conduct of business in ordinary course, access to information, regulatory filings (HSR if applicable), efforts to obtain consents, notification of breaches, non-solicitation/no-shop, employee retention matters, non-compete"],
  "postClosingCovenants": ["array of strings — each is a post-closing covenant: non-compete/non-solicit, cooperation on tax matters, further assurances, books and records access, confidentiality, employee matters"],
  "closingConditions": ["array of strings — each is a condition to closing: accuracy of reps (bring-down), material compliance with covenants, no MAC, HSR clearance (if required), third-party consents, no injunction/legal proceeding, officer certificates, legal opinions, good standing certificates"],
  "indemnificationProvisions": "string — comprehensive indemnification provisions: seller indemnification of buyer (breach of reps, breach of covenants, pre-closing taxes, excluded liabilities); buyer indemnification of seller (breach of buyer reps, breach of buyer covenants, assumed liabilities). Survival periods: general reps 12-24 months, fundamental reps (title, authority, capitalization, taxes) 3-6 years. Cap: 10-20% of purchase price for general reps; uncapped for fundamental reps and fraud. Basket: 0.5-1.5% of purchase price (tipping vs true deductible). Claims process: notice, defense, settlement mechanics. Escrow release mechanics.",
  "terminationProvisions": "string — termination rights: mutual consent, outside date, material breach not cured within cure period, failure of conditions, legal prohibition (injunction/order). Effect of termination: no liability except for willful breach, confidentiality survives, expense provisions survive. Reverse break-up fee if applicable.",
  "nonCompeteProvision": "string — non-compete and non-solicitation provision for seller: scope, geographic limitations, duration, exceptions, reasonableness acknowledgment, enforcement mechanisms",
  "miscellaneous": "string — severability with reformation, amendments (written consent of all parties), counterparts with electronic signatures, entire agreement, no third-party beneficiaries, waiver, notices, assignment, expenses, public announcements",
  "governingLaw": "string — governing law (use the specified governing law state), jurisdiction, venue, jury trial waiver, specific performance availability"
}`,
    maxTokens: 8000,
  });
}

async function generateDisclosureSchedulesProse(project: MAProjectFull) {
  const context = buildMAContext(project);
  return claudeJson<import("./types").DisclosureSchedulesProse>({
    systemPrompt: MA_SYSTEM_PROMPT,
    userPrompt: `${context}

Generate the prose sections for DISCLOSURE SCHEDULES for this M&A transaction. These schedules qualify and supplement the representations and warranties in the purchase agreement.

Each schedule should contain template language and instructions for what must be disclosed. The actual disclosures will be filled in by the parties.

Return JSON matching this exact schema:
{
  "generalDisclosureProvision": "string — general disclosure provision: disclosure in one schedule is deemed disclosed in all other schedules to the extent the relevance of such disclosure is reasonably apparent on the face of such disclosure. Headings are for convenience only. Inclusion of any item does not constitute admission of liability or materiality.",
  "capitalizationSchedule": "string — Schedule [X]: Capitalization. Template language for disclosure of authorized and outstanding equity, options, warrants, convertible securities, preemptive rights, registration rights, and any other equity-linked instruments.",
  "subsidiariesSchedule": "string — Schedule [X]: Subsidiaries. Template for listing all direct and indirect subsidiaries, jurisdiction of organization, ownership percentages, and any minority interests.",
  "materialContractsSchedule": "string — Schedule [X]: Material Contracts. Template for listing all contracts involving aggregate consideration exceeding a materiality threshold, including customer/supplier agreements, leases, employment agreements, IP licenses, and joint ventures.",
  "litigationSchedule": "string — Schedule [X]: Litigation. Template for disclosure of pending or threatened litigation, arbitration, governmental investigations, consent decrees, and any material claims.",
  "ipSchedule": "string — Schedule [X]: Intellectual Property. Template for listing registered patents, trademarks, copyrights, domain names, material unregistered IP, IP licenses (in and out), and any known infringement claims.",
  "realPropertySchedule": "string — Schedule [X]: Real Property. Template for listing all owned and leased real property, encumbrances, zoning issues, environmental conditions, and lease terms.",
  "environmentalSchedule": "string — Schedule [X]: Environmental. Template for disclosure of environmental permits, known contamination, remediation obligations, storage tanks, hazardous materials use, and environmental litigation.",
  "taxSchedule": "string — Schedule [X]: Tax. Template for disclosure of tax returns filed, open tax years, ongoing audits, tax liens, tax sharing agreements, and any positions that could give rise to penalties.",
  "insuranceSchedule": "string — Schedule [X]: Insurance. Template for listing all insurance policies, coverage amounts, deductibles, claims history, and any coverage disputes.",
  "employeesSchedule": "string — Schedule [X]: Employees and Benefits. Template for disclosure of employee benefit plans, compensation arrangements, employment agreements, collective bargaining agreements, COBRA, ERISA compliance, and any pending labor disputes."
}`,
    maxTokens: 6000,
  });
}

// ─── Compliance Check Builders ───────────────────────────────────────

function addDeterministicComplianceChecks(project: MAProjectFull, checks: ComplianceCheck[]) {
  // HSR compliance
  const purchasePrice = safeNumber(project.purchasePrice);
  if (purchasePrice >= 119_500_000 && !project.hsrRequired) {
    checks.push({
      name: "HSR Filing Requirement",
      regulation: "Hart-Scott-Rodino Act, 15 U.S.C. Section 18a",
      category: "hsr",
      passed: false,
      note: `Purchase price of ${formatCurrency(purchasePrice)} exceeds the 2026 HSR size-of-transaction threshold of $119.5 million. HSR filing may be required.`,
    });
  } else if (project.hsrRequired) {
    checks.push({
      name: "HSR Filing Requirement",
      regulation: "Hart-Scott-Rodino Act, 15 U.S.C. Section 18a",
      category: "hsr",
      passed: true,
      note: `HSR filing identified as required. Status: ${project.hsrStatus ?? "pending"}.`,
    });
  }

  // DGCL compliance for mergers
  if (["MERGER_FORWARD", "MERGER_REVERSE_TRIANGULAR", "MERGER_FORWARD_TRIANGULAR", "REVERSE_MERGER"].includes(project.transactionType)) {
    checks.push({
      name: "DGCL Merger Approval",
      regulation: "DGCL Section 251 (merger) / Section 262 (appraisal rights)",
      category: "dgcl",
      passed: true,
      note: "Merger requires board approval and majority stockholder vote per DGCL Section 251. Appraisal rights under Section 262 apply to dissenting stockholders.",
    });
  }

  // Asset sale DGCL compliance
  if (project.transactionType === "ASSET_PURCHASE") {
    checks.push({
      name: "DGCL Asset Sale Approval",
      regulation: "DGCL Section 271",
      category: "dgcl",
      passed: true,
      note: "Sale of substantially all assets requires board approval and majority stockholder vote per DGCL Section 271.",
    });
  }

  // Tax structure compliance
  if (project.section338Election) {
    checks.push({
      name: "Section 338 Election",
      regulation: "26 U.S.C. Section 338",
      category: "tax",
      passed: true,
      note: "Section 338 election applies. IRS Form 8023 must be filed by the 15th day of the 9th month following the month of acquisition (IRC Section 338(g)(2)). Both parties must jointly elect for 338(h)(10).",
    });
  }

  // Escrow check
  if (project.escrowPercent && (project.escrowPercent < 0.05 || project.escrowPercent > 0.15)) {
    checks.push({
      name: "Escrow Percentage",
      regulation: "Market Practice",
      category: "escrow",
      passed: false,
      note: `Escrow percentage of ${(project.escrowPercent * 100).toFixed(1)}% is outside typical market range of 5-15% of purchase price.`,
    });
  }
}

function addLOIComplianceChecks(project: MAProjectFull, checks: ComplianceCheck[]) {
  addDeterministicComplianceChecks(project, checks);

  checks.push({
    name: "Binding/Non-Binding Distinction",
    regulation: "Contract Law — Enforceability",
    category: "general",
    passed: true,
    note: "LOI must clearly distinguish binding provisions (exclusivity, confidentiality, expenses, governing law) from non-binding expressions of intent.",
  });

  if (!project.exclusivityDays) {
    checks.push({
      name: "Exclusivity Period",
      regulation: "M&A Best Practice",
      category: "general",
      passed: false,
      note: "No exclusivity period specified. Buyer typically requires 30-90 day no-shop period.",
    });
  }
}

function addNDAComplianceChecks(project: MAProjectFull, checks: ComplianceCheck[]) {
  checks.push({
    name: "Confidentiality Scope",
    regulation: "Trade Secret Law / Defend Trade Secrets Act",
    category: "general",
    passed: true,
    note: "NDA defines confidential information broadly with standard carveouts for public information.",
  });

  checks.push({
    name: "Non-Solicitation Enforceability",
    regulation: "State Employment Law",
    category: "general",
    passed: true,
    note: "Non-solicitation provision includes reasonable scope (employees only) and duration (1-2 years) with standard carveouts.",
  });
}

function addPurchaseAgreementComplianceChecks(project: MAProjectFull, checks: ComplianceCheck[]) {
  addDeterministicComplianceChecks(project, checks);

  // Indemnification checks
  checks.push({
    name: "Indemnification Cap",
    regulation: "M&A Market Practice",
    category: "indemnification",
    passed: true,
    note: "General rep cap set at 10-20% of purchase price. Fundamental reps (title, authority, capitalization, taxes) uncapped or at 100%.",
  });

  checks.push({
    name: "Indemnification Basket",
    regulation: "M&A Market Practice",
    category: "indemnification",
    passed: true,
    note: "Basket/deductible set at 0.5-1.5% of purchase price.",
  });

  checks.push({
    name: "Rep Survival Periods",
    regulation: "M&A Market Practice / Statute of Limitations",
    category: "indemnification",
    passed: true,
    note: "General reps survive 12-24 months; fundamental reps 3-6 years; tax reps through statute of limitations.",
  });

  // R&W insurance
  if (project.rwiInsurance) {
    checks.push({
      name: "R&W Insurance",
      regulation: "Insurance Regulatory Framework",
      category: "general",
      passed: true,
      note: `R&W insurance policy in place. Premium: ${project.rwiPremiumPercent ? (project.rwiPremiumPercent * 100).toFixed(1) + "%" : "1.0-2.5%"} of policy limit. Buyer-side policy. Standard exclusions apply.`,
    });
  }

  // MAC clause
  checks.push({
    name: "MAC Clause",
    regulation: "Contract Law — Material Adverse Change",
    category: "general",
    passed: true,
    note: "MAC definition includes standard carveouts: general economic conditions, industry conditions, financial markets, changes in law/regulation, GAAP changes, acts of God/natural disasters, pandemics/epidemics, cyberattacks, credit market disruptions.",
  });
}

function addDisclosureComplianceChecks(project: MAProjectFull, checks: ComplianceCheck[]) {
  checks.push({
    name: "General Disclosure Provision",
    regulation: "M&A Best Practice",
    category: "general",
    passed: true,
    note: "General disclosure provision included: disclosure in one schedule deemed disclosed in all where reasonably apparent.",
  });

  checks.push({
    name: "Schedule Completeness",
    regulation: "Contract Law — Indemnification",
    category: "general",
    passed: true,
    note: "All standard disclosure schedules included: capitalization, subsidiaries, material contracts, litigation, IP, real property, environmental, tax, insurance, employees.",
  });
}
