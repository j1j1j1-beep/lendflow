// ppm.ts
// Syndication Private Placement Memorandum — THE critical document.
// Generates a DOCX PPM from deterministic project data + AI prose.
// All numbers are injected into the AI prompt as context; AI writes prose only.
// Must include all 13 sections per SEC Regulation D compliance.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  keyTermsTable,
  createTable,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatPercentShort,
  ensureProseArray,
  safeNumber,
  COLORS,
  FONTS,
  PageBreak,
  TextRun,
  AlignmentType,
} from "../../doc-helpers";

import { claudeJson } from "@/lib/claude";
import type { SyndicationProjectFull, PPMProse, ComplianceCheck } from "../types";
import { buildProjectContext } from "../generate-doc";

// ─── AI Prose Generation ────────────────────────────────────────────

const PPM_SYSTEM_PROMPT = `You are a senior securities attorney specializing in real estate syndications under Regulation D. You draft enforceable Private Placement Memorandums for real estate syndication offerings. Your PPMs must comply with SEC regulations and withstand regulatory scrutiny.

ABSOLUTE RULES:
1. NUMBERS ARE SACRED: Use the EXACT dollar amounts, percentages, rates, and metrics provided in the project data. Never round, estimate, or omit any number.
2. CITE SPECIFIC STATUTES: Reference SEC Rule 506(b) or 506(c), the Securities Act of 1933, the Investment Company Act of 1940, and applicable tax code sections by number.
3. COMPLETE PROVISIONS: Every section must be substantive legal disclosure, not a summary or outline.
4. RISK FACTORS must be comprehensive, specific to the actual property and deal, and cover all categories specified.
5. TAX CONSIDERATIONS must accurately reflect current 2026 tax law including 100% bonus depreciation under The One Big Beautiful Bill Act (OBBBA) of July 2025 for property acquired after January 19, 2025.
6. OUTPUT: Respond ONLY with valid JSON matching the requested schema. No commentary or disclaimers.

AI-GENERATED CONTENT DISCLAIMER: This AI-generated content is for document drafting assistance only and does not constitute legal advice or a securities offering. All offering documents must be reviewed by qualified securities counsel before distribution to investors.`;

async function generatePPMProse(project: SyndicationProjectFull): Promise<PPMProse> {
  const context = buildProjectContext(project);
  const isResidential = ["MULTIFAMILY", "STUDENT_HOUSING", "MOBILE_HOME_PARK", "BUILD_TO_RENT", "SENIOR_HOUSING"].includes(project.propertyType);
  const depreciationYears = isResidential ? "27.5" : "39";

  const userPrompt = `Generate PPM prose sections for this real estate syndication.

${context}

ADDITIONAL CONTEXT:
- Depreciation schedule: ${depreciationYears}-year straight-line (${isResidential ? "residential" : "commercial"})
- Bonus depreciation: ${project.bonusDepreciationPct != null ? (safeNumber(project.bonusDepreciationPct) * 100).toFixed(0) : "100"}% (The One Big Beautiful Bill Act of July 2025 permanently restored 100% bonus depreciation for property acquired after January 19, 2025)
- Property classification: ${isResidential ? "Residential rental" : "Commercial"}

Return a JSON object with these keys:
{
  "secLegend": "The SEC/securities legend for the cover page. Must include: offering amount, minimum investment, 506(b) or 506(c) designation, statement that interests are not registered under the Securities Act, and that interests are illiquid with no secondary market. Reference Rule 506(b) or 506(c) of Regulation D under the Securities Act of 1933.",
  "executiveSummary": "Executive summary paragraph covering: property description, investment thesis, projected returns (use exact IRR and equity multiple from data), hold period, and why this investment opportunity is compelling. Be specific to this property.",
  "riskFactors": ["Array of 12-15 specific risk factor paragraphs covering: (1) real estate market risk, (2) property-specific risk, (3) leverage/debt service risk, (4) illiquidity risk, (5) concentration/single-asset risk, (6) sponsor risk, (7) tax risk including bonus depreciation phase-out, (8) regulatory/zoning risk, (9) force majeure, (10) conflict of interest, (11) vacancy/rental rate risk, (12) interest rate/refinancing risk. Each must be a complete paragraph, not a bullet."],
  "propertyDescription": "Detailed property description covering: location, physical characteristics, current condition, unit count/SF, year built, and planned improvements/renovations if applicable.",
  "marketAnalysis": "Market analysis covering: submarket overview, comparable properties, rental rate trends, vacancy rate context, population/employment growth drivers, and competitive positioning.",
  "businessPlan": "Business plan covering: value-add strategy (if renovation budget exists), renovation scope and timeline, target rents after stabilization, property management approach, and exit strategy.",
  "sponsorInformation": "Sponsor information covering: principal biography, relevant track record (use data if provided), management team, and organizational structure.",
  "taxConsiderations": "Tax considerations covering: depreciation (${depreciationYears}-year for ${isResidential ? "residential" : "commercial"}), bonus depreciation at ${project.bonusDepreciationPct != null ? (safeNumber(project.bonusDepreciationPct) * 100).toFixed(0) : "100"}% under The One Big Beautiful Bill Act (OBBBA) of July 2025 for property acquired after January 19, 2025, passive activity rules under Section 469, REPS qualification, QOZ benefits if applicable, 1031 exchange limitations for LP interests, UBTI for tax-exempt investors, and SALT limitations.",
  "subscriptionProcedures": "Subscription procedures covering: minimum investment amount, subscription process, closing conditions, capital call rights, and investor communication.",
  "operatingAgreementSummary": "Summary of key operating agreement terms: manager-managed structure, voting rights, transfer restrictions, reporting obligations, and dissolution provisions."
}`;

  return claudeJson<PPMProse>({
    systemPrompt: PPM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 16000,
  });
}

// ─── DOCX Builder ───────────────────────────────────────────────────

export async function buildPPM(project: SyndicationProjectFull): Promise<Document> {
  const prose = await generatePPMProse(project);

  const purchasePrice = safeNumber(project.purchasePrice);
  const renovationBudget = safeNumber(project.renovationBudget);
  const closingCosts = safeNumber(project.closingCosts);
  const totalEquityRaise = safeNumber(project.totalEquityRaise);
  const minInvestment = safeNumber(project.minInvestment);
  const loanAmount = safeNumber(project.loanAmount);
  const sponsorEquity = safeNumber(project.sponsorEquity);
  const currentNoi = safeNumber(project.currentNoi);
  const proFormaNoi = safeNumber(project.proFormaNoi);
  const totalCost = purchasePrice + renovationBudget + closingCosts;
  const capRate = purchasePrice > 0 ? currentNoi / purchasePrice : 0;
  const ltv = purchasePrice > 0 ? loanAmount / purchasePrice : 0;
  const sortedTiers = [...project.waterfallTiers].sort((a, b) => a.tierOrder - b.tierOrder);

  const children: (Paragraph | Table)[] = [];

  // ── Section 1: Cover Page ──────────────────────────────────────────

  children.push(spacer(20));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "CONFIDENTIAL PRIVATE PLACEMENT MEMORANDUM",
          bold: true,
          size: 36,
          color: COLORS.primary,
          font: FONTS.legal,
          allCaps: true,
        }),
      ],
    }),
  );
  children.push(spacer(8));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: project.entityName,
          bold: true,
          size: 32,
          color: COLORS.primary,
          font: FONTS.legal,
        }),
      ],
    }),
  );
  children.push(spacer(4));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `A ${project.stateOfFormation ?? "Delaware"} ${project.entityType === "LP" ? "Limited Partnership" : "Limited Liability Company"}`,
          size: 22,
          font: FONTS.legal,
          color: COLORS.textGray,
        }),
      ],
    }),
  );
  children.push(spacer(8));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Offering Amount: ${formatCurrency(totalEquityRaise)}`,
          bold: true,
          size: 26,
          font: FONTS.legal,
          color: COLORS.primary,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Minimum Investment: ${formatCurrency(minInvestment)}`,
          size: 22,
          font: FONTS.legal,
          color: COLORS.textGray,
        }),
      ],
    }),
  );
  children.push(spacer(4));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: project.exemptionType === "REG_D_506C"
            ? "Offered Pursuant to Rule 506(c) of Regulation D"
            : "Offered Pursuant to Rule 506(b) of Regulation D",
          bold: true,
          size: 20,
          font: FONTS.legal,
          color: COLORS.accent,
        }),
      ],
    }),
  );
  children.push(spacer(8));

  // SEC Legend
  const ruleRef = project.exemptionType === "REG_D_506C" ? "506(c)" : "506(b)";
  children.push(bodyText(prose.secLegend ?? `THE MEMBERSHIP INTERESTS OFFERED HEREBY HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "ACT"), OR UNDER THE SECURITIES LAWS OF ANY STATE. THESE INTERESTS ARE BEING OFFERED AND SOLD IN RELIANCE ON RULE ${ruleRef} OF REGULATION D AND EXEMPTIONS FROM THE REGISTRATION REQUIREMENTS OF THE ACT AND SUCH STATE LAWS. THE INTERESTS MAY NOT BE TRANSFERRED OR RESOLD EXCEPT AS PERMITTED UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO REGISTRATION OR AN EXEMPTION THEREFROM. THERE IS NO PUBLIC MARKET FOR THESE INTERESTS AND NONE IS EXPECTED TO DEVELOP.`, { italic: true }));

  children.push(spacer(4));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          size: 20,
          font: FONTS.legal,
          color: COLORS.textGray,
        }),
      ],
    }),
  );

  // Page break after cover
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Section 2: Executive Summary ───────────────────────────────────

  children.push(sectionHeading("I. Executive Summary"));
  children.push(bodyText(prose.executiveSummary));
  children.push(spacer(4));

  // Investment highlights table
  children.push(bodyText("Investment Highlights:", { bold: true }));

  const highlightRows: Array<{ label: string; value: string }> = [
    { label: "Property", value: project.propertyName ?? project.propertyAddress },
    { label: "Property Type", value: project.propertyType.replace(/_/g, " ") },
    { label: "Purchase Price", value: formatCurrency(purchasePrice) },
    { label: "Total Project Cost", value: formatCurrency(totalCost) },
    { label: "Total Equity Raise", value: formatCurrency(totalEquityRaise) },
    { label: "Senior Debt", value: `${formatCurrency(loanAmount)} (${(ltv * 100).toFixed(1)}% LTV)` },
    { label: "Preferred Return", value: project.preferredReturn ? `${(safeNumber(project.preferredReturn) * 100).toFixed(1)}%` : "N/A" },
    { label: "Projected IRR", value: project.projectedIrr ? `${(safeNumber(project.projectedIrr) * 100).toFixed(1)}%` : "N/A" },
    { label: "Projected Equity Multiple", value: project.projectedEquityMultiple ? `${safeNumber(project.projectedEquityMultiple).toFixed(2)}x` : "N/A" },
    { label: "Projected Hold Period", value: project.projectedHoldYears ? `${project.projectedHoldYears} years` : "N/A" },
    { label: "Going-In Cap Rate", value: `${(capRate * 100).toFixed(2)}%` },
    { label: "Minimum Investment", value: formatCurrency(minInvestment) },
  ];
  children.push(keyTermsTable(highlightRows));
  children.push(spacer(8));

  // ── Section 3: Risk Factors ────────────────────────────────────────

  children.push(sectionHeading("II. Risk Factors"));
  children.push(
    bodyText(
      "AN INVESTMENT IN THE INTERESTS INVOLVES SIGNIFICANT RISKS. PROSPECTIVE INVESTORS SHOULD CAREFULLY CONSIDER THE FOLLOWING RISK FACTORS, TOGETHER WITH ALL OTHER INFORMATION CONTAINED IN THIS MEMORANDUM, BEFORE DECIDING TO INVEST. THE FOLLOWING RISKS ARE NOT INTENDED TO BE EXHAUSTIVE.",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  for (const risk of ensureProseArray(prose.riskFactors)) {
    children.push(bodyText(risk));
    children.push(spacer(2));
  }
  children.push(spacer(8));

  // ── Section 4: Property Description ────────────────────────────────

  children.push(sectionHeading("III. Property Description"));
  children.push(bodyText(prose.propertyDescription));
  children.push(spacer(4));

  // Property details table
  const propertyRows: Array<{ label: string; value: string }> = [
    { label: "Property Address", value: project.propertyAddress },
    { label: "Property Type", value: project.propertyType.replace(/_/g, " ") },
  ];
  if (project.units) propertyRows.push({ label: "Units", value: project.units.toString() });
  if (project.squareFeet) propertyRows.push({ label: "Square Feet", value: project.squareFeet.toLocaleString() });
  if (project.yearBuilt) propertyRows.push({ label: "Year Built", value: project.yearBuilt.toString() });
  if (renovationBudget > 0) propertyRows.push({ label: "Renovation Budget", value: formatCurrency(renovationBudget) });

  children.push(keyTermsTable(propertyRows));
  children.push(spacer(8));

  // ── Section 5: Market Analysis ─────────────────────────────────────

  children.push(sectionHeading("IV. Market Analysis"));
  children.push(bodyText(prose.marketAnalysis));
  children.push(spacer(8));

  // ── Section 6: Business Plan ───────────────────────────────────────

  children.push(sectionHeading("V. Business Plan"));
  children.push(bodyText(prose.businessPlan));
  children.push(spacer(8));

  // ── Section 7: Financial Projections Summary ───────────────────────

  children.push(sectionHeading("VI. Financial Projections"));
  children.push(
    bodyText(
      "The following financial projections are estimates based on assumptions described in this Memorandum. Actual results may differ materially from these projections. See the attached Pro Forma Financial Projections for detailed year-by-year analysis.",
    ),
  );
  children.push(spacer(4));

  const financialRows: Array<{ label: string; value: string }> = [
    { label: "Current NOI", value: formatCurrency(currentNoi) },
    { label: "Pro Forma NOI (Stabilized)", value: formatCurrency(proFormaNoi) },
    { label: "Going-In Cap Rate", value: `${(capRate * 100).toFixed(2)}%` },
    { label: "Exit Cap Rate", value: project.exitCapRate ? `${(safeNumber(project.exitCapRate) * 100).toFixed(2)}%` : "N/A" },
    { label: "Vacancy Assumption", value: project.vacancyRate ? `${(safeNumber(project.vacancyRate) * 100).toFixed(1)}%` : "N/A" },
    { label: "Rent Growth Assumption", value: project.rentGrowthRate ? `${(safeNumber(project.rentGrowthRate) * 100).toFixed(1)}% per annum` : "N/A" },
    { label: "Projected IRR", value: project.projectedIrr ? `${(safeNumber(project.projectedIrr) * 100).toFixed(1)}%` : "N/A" },
    { label: "Projected Equity Multiple", value: project.projectedEquityMultiple ? `${safeNumber(project.projectedEquityMultiple).toFixed(2)}x` : "N/A" },
  ];
  children.push(keyTermsTable(financialRows));
  children.push(spacer(4));

  // Capital stack
  children.push(bodyText("Capital Stack:", { bold: true }));
  const capitalStackRows = [
    ["Senior Debt", formatCurrency(loanAmount), `${(ltv * 100).toFixed(1)}%`],
    ["Sponsor Equity", formatCurrency(sponsorEquity), totalCost > 0 ? `${((sponsorEquity / totalCost) * 100).toFixed(1)}%` : "N/A"],
    ["Investor Equity", formatCurrency(totalEquityRaise - sponsorEquity), totalCost > 0 ? `${(((totalEquityRaise - sponsorEquity) / totalCost) * 100).toFixed(1)}%` : "N/A"],
    ["Total", formatCurrency(loanAmount + totalEquityRaise), "100.0%"],
  ];
  children.push(
    createTable(
      ["Source", "Amount", "% of Total"],
      capitalStackRows,
      { columnWidths: [40, 35, 25], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ── Section 8: Sponsor Information ─────────────────────────────────

  children.push(sectionHeading("VII. Sponsor Information"));
  children.push(bodyText(prose.sponsorInformation));
  children.push(spacer(8));

  // ── Section 9: Fee Structure ───────────────────────────────────────

  children.push(sectionHeading("VIII. Fee Structure"));
  children.push(
    bodyText(
      "The Manager/Sponsor is entitled to the following fees and compensation in connection with the acquisition, management, and disposition of the Property:",
    ),
  );
  children.push(spacer(4));

  const feeRows: string[][] = [];
  if (project.acquisitionFee) {
    const acqFee = safeNumber(project.acquisitionFee);
    feeRows.push([
      "Acquisition Fee",
      `${(acqFee * 100).toFixed(1)}%`,
      "Of purchase price",
      "At closing",
      formatCurrency(purchasePrice * acqFee),
    ]);
  }
  if (project.assetMgmtFee) {
    feeRows.push([
      "Asset Management Fee",
      `${(safeNumber(project.assetMgmtFee) * 100).toFixed(1)}%`,
      "Of effective gross income",
      "Monthly/Quarterly",
      "Varies",
    ]);
  }
  if (project.propertyMgmtFee) {
    feeRows.push([
      "Property Management Fee",
      `${(safeNumber(project.propertyMgmtFee) * 100).toFixed(1)}%`,
      "Of gross rental income",
      "Monthly",
      "Varies",
    ]);
  }
  if (project.constructionMgmtFee && renovationBudget > 0) {
    const constFee = safeNumber(project.constructionMgmtFee);
    feeRows.push([
      "Construction Management Fee",
      `${(constFee * 100).toFixed(1)}%`,
      "Of renovation budget",
      "As incurred",
      formatCurrency(renovationBudget * constFee),
    ]);
  }
  if (project.dispositionFee) {
    feeRows.push([
      "Disposition Fee",
      `${(safeNumber(project.dispositionFee) * 100).toFixed(1)}%`,
      "Of sale price",
      "At sale",
      "Varies",
    ]);
  }
  if (project.refinancingFee) {
    feeRows.push([
      "Refinancing Fee",
      `${(safeNumber(project.refinancingFee) * 100).toFixed(1)}%`,
      "Of new loan amount",
      "At refinance",
      "Varies",
    ]);
  }
  if (project.guaranteeFee) {
    const guarFee = safeNumber(project.guaranteeFee);
    feeRows.push([
      "Guarantee Fee",
      `${(guarFee * 100).toFixed(1)}%`,
      "Of loan amount",
      "At closing/Annually",
      formatCurrency(loanAmount * guarFee),
    ]);
  }

  if (feeRows.length > 0) {
    children.push(
      createTable(
        ["Fee", "Rate", "Basis", "When Paid", "Estimated Amount"],
        feeRows,
        { columnWidths: [22, 10, 22, 18, 18], alternateRows: true },
      ),
    );
  } else {
    children.push(bodyText("No sponsor fees have been specified for this offering."));
  }
  children.push(spacer(8));

  // ── Section 10: Distribution Waterfall ─────────────────────────────

  children.push(sectionHeading("IX. Distribution Waterfall"));
  children.push(
    bodyText(
      "Distributable cash flow and net sale/refinance proceeds shall be distributed to the Members in the following order of priority:",
    ),
  );
  children.push(spacer(4));

  if (sortedTiers.length > 0) {
    const waterfallRows = sortedTiers.map((tier) => [
      `Tier ${tier.tierOrder}`,
      tier.tierName ?? `Tier ${tier.tierOrder}`,
      tier.hurdleRate != null ? `${(tier.hurdleRate * 100).toFixed(1)}%` : "N/A",
      `${(tier.lpSplit * 100).toFixed(0)}%`,
      `${(tier.gpSplit * 100).toFixed(0)}%`,
      tier.description ?? "",
    ]);
    children.push(
      createTable(
        ["Tier", "Name", "Hurdle Rate", "LP Share", "GP Share", "Description"],
        waterfallRows,
        { columnWidths: [8, 15, 14, 12, 12, 39], alternateRows: true },
      ),
    );
  } else {
    children.push(bodyText("Distribution waterfall tiers have not yet been defined for this offering."));
  }
  children.push(spacer(8));

  // ── Section 11: Tax Considerations ─────────────────────────────────

  children.push(sectionHeading("X. Tax Considerations"));
  children.push(
    bodyText(
      "THE TAX DISCUSSION SET FORTH BELOW IS INCLUDED FOR GENERAL INFORMATION ONLY AND IS NOT A SUBSTITUTE FOR CAREFUL TAX PLANNING. EACH PROSPECTIVE INVESTOR IS URGED TO CONSULT WITH HIS OR HER OWN TAX ADVISOR REGARDING THE FEDERAL, STATE, LOCAL, AND FOREIGN INCOME TAX CONSEQUENCES OF AN INVESTMENT.",
      { bold: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText(prose.taxConsiderations));
  children.push(spacer(8));

  // ── Section 12: Subscription Procedures ────────────────────────────

  children.push(sectionHeading("XI. Subscription Procedures"));
  children.push(bodyText(prose.subscriptionProcedures));
  children.push(spacer(4));

  // Subscription details table
  const subRows: Array<{ label: string; value: string }> = [
    { label: "Minimum Investment", value: formatCurrency(minInvestment) },
    { label: "Exemption Type", value: project.exemptionType === "REG_D_506C" ? "Rule 506(c) — General solicitation permitted" : "Rule 506(b) — No general solicitation" },
    { label: "Accreditation", value: project.exemptionType === "REG_D_506C" ? "Verification required (506(c))" : "Self-certification acceptable (506(b))" },
    { label: "Offering Type", value: "Equity membership interests" },
  ];
  children.push(keyTermsTable(subRows));
  children.push(spacer(8));

  // ── Section 13: Operating Agreement Summary ────────────────────────

  children.push(sectionHeading("XII. Operating Agreement Summary"));
  children.push(bodyText(prose.operatingAgreementSummary));
  children.push(spacer(8));

  // ── Additional Disclosure Sections (State Laws, Environmental, Insurance, etc.) ───

  // State Securities Law Compliance
  children.push(sectionHeading("State Securities Laws Compliance"));
  children.push(
    bodyText(
      "This offering is made in compliance with applicable state securities laws. While offerings under Rule 506 of Regulation D are federally covered securities and preempted from state registration requirements under the National Securities Markets Improvement Act (NSMIA), states retain authority to require notice filings, collect fees, and enforce anti-fraud provisions. The Company will file required notices and consent to service of process in states where investors reside. Investors may have rights under state securities laws in addition to federal securities laws. For questions regarding state law compliance, investors should consult their legal advisors.",
    ),
  );
  children.push(spacer(8));

  // Environmental Disclosure
  children.push(sectionHeading("Environmental Matters"));
  children.push(
    bodyText(
      "A Phase I Environmental Site Assessment (ESA) will be conducted prior to acquisition to identify recognized environmental conditions (RECs) in accordance with ASTM E1527-21 standards. The property is located in a flood zone designation to be confirmed by FEMA Flood Insurance Rate Map (FIRM) review. Flood insurance will be obtained if the property is located in a Special Flood Hazard Area (SFHA) as required by lenders and prudent risk management. The Company will comply with all applicable federal, state, and local environmental laws, including but not limited to the Comprehensive Environmental Response, Compensation, and Liability Act (CERCLA), the Resource Conservation and Recovery Act (RCRA), and applicable state environmental regulations. Any environmental remediation costs identified in the Phase I ESA or subsequent assessments will be disclosed to investors and factored into the purchase price and budget.",
    ),
  );
  children.push(spacer(8));

  // Insurance Disclosure
  children.push(sectionHeading("Insurance Coverage"));
  children.push(
    bodyText(
      "The property will be insured with commercially reasonable insurance coverage including: (1) Property insurance covering replacement cost of buildings and improvements; (2) General liability insurance with minimum coverage of $1-2 million per occurrence and $2-4 million aggregate; (3) Flood insurance if the property is located in a Special Flood Hazard Area, with coverage amounts sufficient to satisfy lender requirements and protect equity; (4) Umbrella liability insurance providing additional coverage above primary liability limits; (5) Loss of rents / business interruption insurance; and (6) Any additional coverage required by lenders or applicable law. All insurance policies will name the Company as the insured and lenders as loss payees or additional insureds as required. Insurance costs are included in the operating expense projections.",
    ),
  );
  children.push(spacer(8));

  // Title and Zoning
  children.push(sectionHeading("Title Insurance and Zoning Compliance"));
  children.push(
    bodyText(
      "The Company will obtain an ALTA (American Land Title Association) owner's policy of title insurance insuring the Company's fee simple title to the property, subject only to Permitted Exceptions as defined in the purchase agreement. The title policy will include standard and customary endorsements including zoning, access, and survey endorsements. A current ALTA survey will be obtained confirming that the property improvements are within lot lines, do not encroach on easements or setbacks, and comply with local zoning ordinances. The property's current zoning designation and permitted uses will be verified to confirm that the intended use (multifamily residential, commercial, etc.) is a permitted use or legal nonconforming use. Any zoning variances, conditional use permits, or special exceptions required for the business plan will be obtained prior to or promptly after closing.",
    ),
  );
  children.push(spacer(8));

  // Placement Agent / Broker-Dealer Fees
  children.push(sectionHeading("Placement Agent Compensation"));
  children.push(
    bodyText(
      "The Company has not engaged a placement agent or broker-dealer for this offering. If a placement agent is engaged in the future, their compensation and any affiliated entity relationships will be disclosed in a supplement to this Memorandum and in the Form D filing. Any such fees (typically 1-3% of capital raised) would be paid from offering proceeds. Investors introduced by any placement agent should review FINRA BrokerCheck (www.finra.org/brokercheck) for the agent's registration status and disciplinary history.",
    ),
  );
  children.push(spacer(8));

  // Passive Activity Loss Rules Expansion
  children.push(sectionHeading("Passive Activity Loss Rules — Detailed Analysis"));
  children.push(
    bodyText(
      "Under Section 469 of the Internal Revenue Code, losses from passive activities (including rental real estate) may only offset income from passive activities and cannot offset wages, business income, or portfolio income. However, qualifying taxpayers may utilize the following exceptions:",
    ),
  );
  children.push(spacer(4));
  children.push(bulletPoint("Active Participation Exception (26 U.S.C. § 469(i)): Individuals who actively participate in rental real estate activities may deduct up to $25,000 of rental real estate losses against non-passive income. This exception phases out ratably for taxpayers with adjusted gross income (AGI) between $100,000 and $150,000. No deduction is available for AGI above $150,000."));
  children.push(bulletPoint("Real Estate Professional Status (REPS) (26 U.S.C. § 469(c)(7)): Taxpayers who qualify as real estate professionals may treat rental real estate losses as non-passive. To qualify, the taxpayer must: (1) spend more than 50% of personal service time in real property trades or businesses; and (2) perform more than 750 hours of services in real property trades or businesses during the tax year. Material participation (generally 500+ hours per property or activity) is also required."));
  children.push(bulletPoint("Suspended Losses: Passive losses that cannot be deducted in the current year are carried forward indefinitely and may be deducted in future years when the taxpayer has sufficient passive income or upon full disposition of the activity."));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Most investors in this offering will be passive investors and will not qualify for the active participation exception or REPS. Investors should consult their tax advisors regarding the applicability of passive activity loss limitations to their individual circumstances.",
    ),
  );
  children.push(spacer(8));

  // 1031 Exchange Clarification
  children.push(sectionHeading("Section 1031 Exchange Limitations"));
  children.push(
    bodyText(
      "LLC membership interests or limited partnership interests in the Company are NOT eligible for Section 1031 like-kind exchange treatment under 26 U.S.C. § 1031. Section 1031 applies only to direct ownership of real property, not to interests in entities that own real property (see Rev. Rul. 2004-86). Investors seeking to use 1031 exchange proceeds to invest in this offering will recognize gain on the relinquished property and cannot defer such gain through investment in the Company. However, the Company itself may conduct a Section 1031 exchange upon disposition of the property, which may defer gain recognition at the entity level and preserve more capital for distribution to investors. The availability and structure of any such entity-level 1031 exchange will be evaluated at the time of disposition based on then-current tax law and market conditions.",
    ),
  );
  children.push(spacer(8));

  // Interest Rate Validation (Compliance Check)
  const interestRate = project.interestRate ?? 0;
  if (interestRate < 0.045 || interestRate > 0.12) {
    children.push(sectionHeading("Interest Rate Risk Disclosure"));
    children.push(
      bodyText(
        `The senior debt for this acquisition carries an interest rate of ${(interestRate * 100).toFixed(2)}%, which is ${interestRate < 0.045 ? "below" : "above"} the typical market range of 4.5% to 12.0% for commercial real estate financing as of 2026. ${interestRate < 0.045 ? "While this favorable rate reduces debt service costs and improves cash flow, investors should verify the terms of the financing commitment and ensure there are no unusual conditions, prepayment penalties, or yield maintenance provisions that could impact the economics." : "This elevated interest rate increases debt service costs and may constrain cash flow available for distribution. Investors should carefully review the debt service coverage ratio (DSCR) projections and assess refinancing risk if interest rates remain elevated at the anticipated refinance or sale date. The high interest rate may reflect higher leverage, shorter loan term, construction/renovation risk, or borrower credit profile."}`,
      ),
    );
    children.push(spacer(8));
  }

  // ── Disclaimers and Signature ──────────────────────────────────────

  children.push(sectionHeading("XIII. Important Notices"));
  children.push(
    bodyText(
      "This Memorandum is submitted on a confidential basis to a limited number of investors for the sole purpose of evaluating a potential investment in the Interests. This Memorandum is not to be reproduced or distributed to any other persons (other than professional advisors of the prospective investors receiving this Memorandum). By accepting delivery of this Memorandum, each prospective investor agrees to the foregoing and to make no photocopies of this Memorandum or any documents referred to herein.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "No person has been authorized to give any information or make any representation concerning the Company or the Interests other than as contained in this Memorandum, and, if given or made, such information or representation must not be relied upon as having been authorized by the Company or the Manager. This Memorandum does not constitute an offer to sell, or a solicitation of an offer to buy, Interests in any jurisdiction in which such offer or solicitation is not authorized or in which the person making such offer or solicitation is not qualified to do so, or to any person to whom it is unlawful to make such an offer or solicitation.",
    ),
  );
  children.push(spacer(8));

  // Forward-looking statements disclaimer
  children.push(
    bodyText(
      "FORWARD-LOOKING STATEMENTS: This Memorandum contains forward-looking statements based upon current expectations that involve a number of risks and uncertainties. The forward-looking statements are made pursuant to safe harbor provisions under applicable securities laws. Forward-looking statements involve risks and uncertainties because they relate to events and depend on circumstances that may or may not occur in the future. The actual results may differ materially from the projected results described in this Memorandum. Investors should not place undue reliance on forward-looking statements.",
      { italic: true },
    ),
  );

  return buildLegalDocument({
    title: "Private Placement Memorandum",
    headerRight: `PPM — ${project.entityName}`,
    children,
  });
}

// ─── Compliance Checks ──────────────────────────────────────────────

export function runPPMComplianceChecks(project: SyndicationProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const purchasePrice = safeNumber(project.purchasePrice);
  const loanAmount = safeNumber(project.loanAmount);
  const totalEquityRaise = safeNumber(project.totalEquityRaise);
  const ltv = purchasePrice > 0 ? loanAmount / purchasePrice : 0;

  // Securities exemption disclosure
  checks.push({
    name: "Securities Exemption Disclosed",
    regulation: "SEC Rule 506(b)/506(c), Securities Act of 1933",
    category: "securities",
    passed: !!project.exemptionType,
    note: project.exemptionType
      ? `Offering under ${project.exemptionType.replace("_", " ")}`
      : "No securities exemption type specified",
  });

  // Entity formation
  checks.push({
    name: "SPV Entity Formation",
    regulation: "6 Del.C. Chapter 18 (Delaware LLC Act)",
    category: "entity_formation",
    passed: !!project.entityName && !!project.entityType,
    note: project.entityName
      ? `${project.entityName} (${project.entityType})`
      : "SPV entity not specified",
  });

  // Offering amount
  checks.push({
    name: "Offering Amount Disclosed",
    regulation: "SEC Regulation D",
    category: "securities",
    passed: totalEquityRaise > 0,
    note: totalEquityRaise > 0
      ? `Total equity raise: ${formatCurrency(totalEquityRaise)}`
      : "No offering amount specified",
  });

  // Minimum investment
  checks.push({
    name: "Minimum Investment Disclosed",
    regulation: "Investor Protection Standards",
    category: "investor_protection",
    passed: safeNumber(project.minInvestment) > 0,
    note: project.minInvestment
      ? `Minimum: ${formatCurrency(safeNumber(project.minInvestment))}`
      : "No minimum investment specified",
  });

  // LTV check
  checks.push({
    name: "Leverage Ratio (LTV)",
    regulation: "Prudent Lending Standards",
    category: "financial",
    passed: ltv <= 0.80,
    note: `LTV: ${(ltv * 100).toFixed(1)}% — ${ltv <= 0.75 ? "within standard range (60-75%)" : ltv <= 0.80 ? "elevated but acceptable" : "exceeds standard maximum of 75-80%"}`,
  });

  // Waterfall tiers
  checks.push({
    name: "Distribution Waterfall Defined",
    regulation: "LLC Agreement / Partnership Agreement Standards",
    category: "waterfall",
    passed: project.waterfallTiers.length > 0,
    note: project.waterfallTiers.length > 0
      ? `${project.waterfallTiers.length} waterfall tiers defined`
      : "No waterfall tiers defined — distribution terms unclear",
  });

  // Fee disclosure
  const feesDisclosed = [
    project.acquisitionFee,
    project.assetMgmtFee,
    project.dispositionFee,
  ].filter((f) => f != null).length;

  checks.push({
    name: "Fee Structure Disclosure",
    regulation: "Anti-Fraud Provisions, Rule 10b-5",
    category: "fee_disclosure",
    passed: feesDisclosed >= 2,
    note: feesDisclosed >= 2
      ? `${feesDisclosed} fee categories disclosed`
      : "Insufficient fee disclosure — at minimum, acquisition and asset management fees must be disclosed",
  });

  // Form D filing
  checks.push({
    name: "Form D Filing Status",
    regulation: "SEC Rule 503, Form D",
    category: "securities",
    passed: !!project.formDFilingDate,
    note: project.formDFilingDate
      ? `Form D filed: ${project.formDFilingDate.toISOString().split("T")[0]}`
      : "Form D not yet filed — must be filed within 15 days of first investor subscription per 17 CFR 230.503",
  });

  // 506(c) accreditation verification
  if (project.exemptionType === "REG_D_506C") {
    checks.push({
      name: "506(c) Accreditation Verification Required",
      regulation: "SEC Rule 506(c)(2)(ii)",
      category: "securities",
      passed: true, // Reminder check
      note: "506(c) offering — must take reasonable steps to verify accredited status of all investors (income, net worth, professional cert, or third-party letter)",
    });
  }

  // UBTI warning for leveraged RE
  if (loanAmount > 0) {
    checks.push({
      name: "UBTI Risk Disclosure",
      regulation: "26 U.S.C. 511-514 (UBTI)",
      category: "tax",
      passed: true, // Informational
      note: "Leveraged real estate — tax-exempt investors (IRAs, 401(k)s) may be subject to UBTI on debt-financed income. Disclosure required.",
    });
  }

  // Sponsor equity
  checks.push({
    name: "Sponsor Co-Investment",
    regulation: "Best Practices — Alignment of Interest",
    category: "investor_protection",
    passed: safeNumber(project.sponsorEquity) > 0,
    note: project.sponsorEquity
      ? `Sponsor co-investing ${formatCurrency(safeNumber(project.sponsorEquity))}`
      : "No sponsor co-investment disclosed — potential alignment concern",
  });

  return checks;
}
