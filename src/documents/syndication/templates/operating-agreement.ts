// operating-agreement.ts
// LLC Operating Agreement for the Syndication SPV.
// Manager-managed LLC with sponsor as manager, investors as members.
// Distribution waterfall from WaterfallTier data.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  articleHeading,
  sectionSubheading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  partyBlock,
  keyTermsTable,
  createTable,
  formatCurrency,
  formatPercent,
  ensureProseArray,
  COLORS,
} from "../../doc-helpers";

import { claudeJson } from "@/lib/claude";
import type { SyndicationProjectFull, OperatingAgreementProse, ComplianceCheck } from "../types";
import { buildProjectContext } from "../generate-doc";

// ─── AI Prose Generation ────────────────────────────────────────────

const OA_SYSTEM_PROMPT = `You are a senior corporate/real estate attorney drafting LLC Operating Agreements for real estate syndication SPVs. Your agreements must comply with Delaware LLC Act (6 Del.C. Chapter 18) and provide comprehensive governance terms.

ABSOLUTE RULES:
1. NUMBERS ARE SACRED: Use exact dollar amounts, percentages, and terms from the project data.
2. CITE SPECIFIC STATUTES: Reference Delaware LLC Act sections, IRC sections, and any other applicable law.
3. COMPLETE PROVISIONS: Every section must be a complete, enforceable legal provision.
4. MANAGER-MANAGED: The sponsor/GP is the Manager. Members (investors) are passive.
5. OUTPUT: Respond ONLY with valid JSON matching the requested schema. No commentary.

AI-GENERATED CONTENT DISCLAIMER: This AI-generated content is for document drafting assistance only and does not constitute legal advice. All documents must be reviewed by qualified legal counsel.`;

async function generateOAProse(project: SyndicationProjectFull): Promise<OperatingAgreementProse> {
  const context = buildProjectContext(project);
  const sortedTiers = [...project.waterfallTiers].sort((a, b) => a.tierOrder - b.tierOrder);
  const waterfallDesc = sortedTiers.length > 0
    ? sortedTiers.map((t) =>
        `Tier ${t.tierOrder} (${t.tierName ?? "Unnamed"}): Hurdle ${t.hurdleRate != null ? (t.hurdleRate * 100).toFixed(1) + "%" : "N/A"}, LP ${(t.lpSplit * 100).toFixed(0)}% / GP ${(t.gpSplit * 100).toFixed(0)}%`,
      ).join("; ")
    : "Standard preferred return + promote";

  const userPrompt = `Generate LLC Operating Agreement prose for this real estate syndication SPV.

${context}

WATERFALL STRUCTURE: ${waterfallDesc}

Return a JSON object with these keys:
{
  "recitals": "WHEREAS recitals establishing: formation of the LLC, purpose (acquire and operate the property), manager-managed structure, and member investment. Reference the property address and entity name.",
  "purposeAndBusiness": "Purpose and business of the Company. Limit to: acquisition, ownership, management, improvement, and disposition of the property at the specified address. Include ancillary powers (borrow, contract, sue, etc.).",
  "capitalContributions": "Capital contribution provisions covering: initial contributions, additional capital calls (with 10 business days notice), failure to fund consequences (dilution, default interest, forced sale), and capital accounts maintained per IRC Section 704(b).",
  "distributionWaterfall": "Distribution waterfall prose describing each tier in detail. Use the exact waterfall tiers from the project data. Distinguish between operating distributions (monthly/quarterly) and capital event distributions (sale/refinance). Include timing of distributions.",
  "managementPowers": "Manager powers and authority. Manager-managed under 6 Del.C. Section 18-402. Manager has full authority for day-to-day operations. List major decisions requiring member consent (sale of property, refinancing, capital calls above threshold, admission of new members, amendment of agreement). Manager may delegate to property manager.",
  "feeProvisions": "Fee provisions detailing each fee the Manager/Sponsor earns. Use the exact fee percentages from the project data. Include when each fee is earned and paid. Note that fees are in addition to distributions from the waterfall.",
  "reportingObligations": "Reporting obligations: quarterly financial reports within 45 days of quarter end, annual audited financials within 90 days of year end, annual K-1s by March 15, monthly property performance updates. Manager shall maintain books and records accessible to Members upon reasonable notice.",
  "transferRestrictions": "Transfer restrictions: no transfers without Manager consent (not to be unreasonably withheld). Permitted transfers to affiliates, trusts, and family members. Right of first refusal. Must comply with securities laws (interests are restricted securities). Tag-along/drag-along provisions.",
  "dissolutionProvisions": "Dissolution and winding up provisions: dissolution upon (a) sale of property, (b) vote of Members holding 66.7% of interests, (c) court order. Manager shall wind up affairs, pay debts, distribute remaining assets per waterfall.",
  "indemnification": "Indemnification of Manager: Company shall indemnify Manager and its affiliates against losses arising from good faith actions. Standard of care: gross negligence or willful misconduct. Manager is not liable for business judgments made in good faith. Reference 6 Del.C. Section 18-108.",
  "taxElections": "Tax elections and allocations: Company taxed as partnership for federal income tax purposes. Manager authorized to make Section 754 election, cost segregation elections, and other tax elections. Allocations per IRC Section 704(b). Tax Matters Partner designation. Annual K-1 delivery.",
  "governingLaw": "Governing law: governed by laws of ${project.stateOfFormation ?? "Delaware"} without regard to conflicts of law. Disputes resolved by binding arbitration in ${project.stateOfFormation ?? "Delaware"}. Jury trial waiver. Prevailing party entitled to attorneys' fees."
}`;

  return claudeJson<OperatingAgreementProse>({
    systemPrompt: OA_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 12000,
  });
}

// ─── DOCX Builder ───────────────────────────────────────────────────

export async function buildOperatingAgreement(project: SyndicationProjectFull): Promise<Document> {
  const prose = await generateOAProse(project);

  const purchasePrice = project.purchasePrice ? Number(project.purchasePrice) : 0;
  const totalEquityRaise = project.totalEquityRaise ? Number(project.totalEquityRaise) : 0;
  const loanAmount = project.loanAmount ? Number(project.loanAmount) : 0;
  const sponsorEquity = project.sponsorEquity ? Number(project.sponsorEquity) : 0;
  const sortedTiers = [...project.waterfallTiers].sort((a, b) => a.tierOrder - b.tierOrder);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle(
    project.entityType === "LP"
      ? "Limited Partnership Agreement"
      : "Limited Liability Company Agreement",
  ));
  children.push(spacer(4));
  children.push(
    bodyText(`of`, { bold: false }),
  );
  children.push(documentTitle(project.entityName));
  children.push(spacer(4));
  children.push(
    bodyText(
      `A ${project.stateOfFormation ?? "Delaware"} ${project.entityType === "LP" ? "Limited Partnership" : "Limited Liability Company"}`,
      { italic: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      `Effective Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    ),
  );
  children.push(spacer(8));

  // Parties
  children.push(sectionHeading("Parties"));
  children.push(partyBlock("Manager", project.sponsorName, project.sponsorEntity ?? "the managing member"));
  children.push(partyBlock("Company", project.entityName, `a ${project.stateOfFormation ?? "Delaware"} ${project.entityType}`));
  children.push(spacer(4));

  // Recitals
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(8));

  // Article I: Formation and Purpose
  children.push(articleHeading("I", "Formation and Purpose"));
  children.push(sectionSubheading("1.1", "Formation"));
  children.push(
    bodyText(
      `The Company was formed as a ${project.stateOfFormation ?? "Delaware"} ${project.entityType === "LP" ? "limited partnership" : "limited liability company"} pursuant to the ${project.stateOfFormation === "Delaware" || !project.stateOfFormation ? "Delaware Limited Liability Company Act, 6 Del.C. Chapter 18" : "applicable state law"}. The Company shall be governed by this Agreement and, to the extent not inconsistent herewith, by the Act.`,
    ),
  );
  children.push(sectionSubheading("1.2", "Purpose"));
  children.push(bodyText(prose.purposeAndBusiness));
  children.push(sectionSubheading("1.3", "Principal Office"));
  children.push(bodyText(`The principal office of the Company shall be at such location as the Manager may designate from time to time. The initial registered office is in the State of ${project.stateOfFormation ?? "Delaware"}.`));
  children.push(sectionSubheading("1.4", "Term"));
  children.push(bodyText(`The Company shall continue in existence until dissolved in accordance with the provisions of this Agreement or the Act. The anticipated investment period is ${project.projectedHoldYears ?? 5} years, subject to extension at the Manager's discretion.`));
  children.push(spacer(8));

  // Article II: Capital Contributions
  children.push(articleHeading("II", "Capital Contributions"));
  children.push(bodyText(prose.capitalContributions));
  children.push(spacer(4));

  // Capital summary table
  children.push(bodyText("Initial Capital Structure:", { bold: true }));
  const capitalRows = [
    ["Manager/Sponsor", formatCurrency(sponsorEquity), totalEquityRaise > 0 ? `${((sponsorEquity / totalEquityRaise) * 100).toFixed(1)}%` : "N/A"],
    ["Investor Members", formatCurrency(totalEquityRaise - sponsorEquity), totalEquityRaise > 0 ? `${(((totalEquityRaise - sponsorEquity) / totalEquityRaise) * 100).toFixed(1)}%` : "N/A"],
    ["Total Equity", formatCurrency(totalEquityRaise), "100%"],
  ];
  children.push(
    createTable(
      ["Member Class", "Amount", "% of Equity"],
      capitalRows,
      { columnWidths: [40, 35, 25], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Article III: Distributions
  children.push(articleHeading("III", "Distributions"));
  children.push(bodyText(prose.distributionWaterfall));
  children.push(spacer(4));

  if (sortedTiers.length > 0) {
    children.push(bodyText("Distribution Waterfall Schedule:", { bold: true }));
    const waterfallRows = sortedTiers.map((tier) => [
      `${tier.tierOrder}`,
      tier.tierName ?? `Tier ${tier.tierOrder}`,
      tier.hurdleRate != null ? `${(tier.hurdleRate * 100).toFixed(1)}%` : "N/A",
      `${(tier.lpSplit * 100).toFixed(0)}%`,
      `${(tier.gpSplit * 100).toFixed(0)}%`,
      tier.description ?? "",
    ]);
    children.push(
      createTable(
        ["Order", "Tier", "Hurdle", "LP Split", "GP Split", "Description"],
        waterfallRows,
        { columnWidths: [8, 18, 12, 12, 12, 38], alternateRows: true },
      ),
    );
  }
  children.push(spacer(8));

  // Article IV: Management
  children.push(articleHeading("IV", "Management"));
  children.push(bodyText(prose.managementPowers));
  children.push(spacer(8));

  // Article V: Fees and Compensation
  children.push(articleHeading("V", "Fees and Compensation"));
  children.push(bodyText(prose.feeProvisions));
  children.push(spacer(4));

  // Fee schedule table
  const feeRows: string[][] = [];
  if (project.acquisitionFee) feeRows.push(["Acquisition Fee", `${(project.acquisitionFee * 100).toFixed(1)}%`, "Of purchase price", "At closing"]);
  if (project.assetMgmtFee) feeRows.push(["Asset Management Fee", `${(project.assetMgmtFee * 100).toFixed(1)}%`, "Of EGI or equity", "Monthly/Quarterly"]);
  if (project.propertyMgmtFee) feeRows.push(["Property Management Fee", `${(project.propertyMgmtFee * 100).toFixed(1)}%`, "Of gross rental income", "Monthly"]);
  if (project.constructionMgmtFee) feeRows.push(["Construction Mgmt Fee", `${(project.constructionMgmtFee * 100).toFixed(1)}%`, "Of renovation budget", "As incurred"]);
  if (project.dispositionFee) feeRows.push(["Disposition Fee", `${(project.dispositionFee * 100).toFixed(1)}%`, "Of sale price", "At sale"]);
  if (project.refinancingFee) feeRows.push(["Refinancing Fee", `${(project.refinancingFee * 100).toFixed(1)}%`, "Of new loan amount", "At refinance"]);
  if (project.guaranteeFee) feeRows.push(["Guarantee Fee", `${(project.guaranteeFee * 100).toFixed(1)}%`, "Of loan amount", "At closing"]);

  if (feeRows.length > 0) {
    children.push(
      createTable(
        ["Fee", "Rate", "Basis", "When Paid"],
        feeRows,
        { columnWidths: [25, 15, 30, 30], alternateRows: true },
      ),
    );
  }
  children.push(spacer(8));

  // Article VI: Reporting
  children.push(articleHeading("VI", "Books, Records, and Reporting"));
  children.push(bodyText(prose.reportingObligations));
  children.push(spacer(8));

  // Article VII: Transfer Restrictions
  children.push(articleHeading("VII", "Transfer Restrictions"));
  children.push(bodyText(prose.transferRestrictions));
  children.push(spacer(8));

  // Article VIII: Dissolution
  children.push(articleHeading("VIII", "Dissolution and Winding Up"));
  children.push(bodyText(prose.dissolutionProvisions));
  children.push(spacer(8));

  // Article IX: Indemnification
  children.push(articleHeading("IX", "Indemnification"));
  children.push(bodyText(prose.indemnification));
  children.push(spacer(8));

  // Article X: Tax Matters
  children.push(articleHeading("X", "Tax Elections and Allocations"));
  children.push(bodyText(prose.taxElections));
  children.push(spacer(8));

  // Article XI: Governing Law
  children.push(articleHeading("XI", "Governing Law and Disputes"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // Miscellaneous
  children.push(articleHeading("XII", "Miscellaneous"));
  children.push(sectionSubheading("12.1", "Entire Agreement"));
  children.push(bodyText("This Agreement constitutes the entire agreement among the Members with respect to the subject matter hereof and supersedes all prior agreements and understandings, both written and oral, among the Members."));
  children.push(sectionSubheading("12.2", "Amendments"));
  children.push(bodyText("This Agreement may be amended only by a written instrument signed by the Manager and Members holding at least 66.7% of the outstanding Interests."));
  children.push(sectionSubheading("12.3", "Severability"));
  children.push(bodyText("If any provision of this Agreement is held invalid or unenforceable, such provision shall be reformed to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force and effect."));
  children.push(sectionSubheading("12.4", "Counterparts"));
  children.push(bodyText("This Agreement may be executed in counterparts, each of which shall be deemed an original. Electronic signatures shall be deemed originals for all purposes."));
  children.push(spacer(8));

  // Signature blocks
  children.push(sectionHeading("Execution"));
  children.push(bodyText("IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above."));
  children.push(spacer(4));

  children.push(bodyText("MANAGER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.sponsorName, "Manager"));
  children.push(spacer(16));

  children.push(bodyText("MEMBERS:", { bold: true, color: COLORS.primary }));
  children.push(bodyText("(Each Member shall execute a counterpart signature page and Joinder Agreement upon subscription.)"));
  children.push(...signatureBlock("[Member Name]", "Member"));

  return buildLegalDocument({
    title: "Operating Agreement",
    headerRight: `Operating Agreement — ${project.entityName}`,
    children,
  });
}

// ─── Compliance Checks ──────────────────────────────────────────────

export function runOperatingAgreementComplianceChecks(project: SyndicationProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Manager-managed structure
  checks.push({
    name: "Manager-Managed Structure",
    regulation: "6 Del.C. Section 18-402",
    category: "entity_formation",
    passed: !!project.sponsorName,
    note: project.sponsorName
      ? `Manager: ${project.sponsorName}`
      : "No manager/sponsor specified",
  });

  // Waterfall defined
  checks.push({
    name: "Distribution Waterfall Specified",
    regulation: "LLC Agreement Standard Provisions",
    category: "waterfall",
    passed: project.waterfallTiers.length > 0,
    note: project.waterfallTiers.length > 0
      ? `${project.waterfallTiers.length} tiers defined with LP/GP splits`
      : "No waterfall tiers — distribution terms undefined",
  });

  // Waterfall split validation
  for (const tier of project.waterfallTiers) {
    const totalSplit = tier.lpSplit + tier.gpSplit;
    checks.push({
      name: `Waterfall Tier ${tier.tierOrder} Split Validation`,
      regulation: "Mathematical Consistency",
      category: "waterfall",
      passed: Math.abs(totalSplit - 1.0) < 0.001,
      note: `LP ${(tier.lpSplit * 100).toFixed(0)}% + GP ${(tier.gpSplit * 100).toFixed(0)}% = ${(totalSplit * 100).toFixed(0)}% — ${Math.abs(totalSplit - 1.0) < 0.001 ? "valid" : "does not equal 100%"}`,
    });
  }

  // Fee disclosure
  const feesCount = [
    project.acquisitionFee,
    project.assetMgmtFee,
    project.dispositionFee,
    project.propertyMgmtFee,
    project.constructionMgmtFee,
    project.refinancingFee,
    project.guaranteeFee,
  ].filter((f) => f != null).length;

  checks.push({
    name: "Fee Schedule Completeness",
    regulation: "Anti-Fraud, Full Disclosure",
    category: "fee_disclosure",
    passed: feesCount >= 2,
    note: `${feesCount} fee categories specified`,
  });

  // Entity type
  checks.push({
    name: "Entity Type Specified",
    regulation: "6 Del.C. Chapter 18",
    category: "entity_formation",
    passed: !!project.entityType,
    note: `Entity type: ${project.entityType ?? "Not specified"}`,
  });

  // State of formation
  checks.push({
    name: "State of Formation",
    regulation: "State LLC Formation Requirements",
    category: "entity_formation",
    passed: !!project.stateOfFormation,
    note: project.stateOfFormation ?? "Not specified — defaulting to Delaware",
  });

  return checks;
}
