// distribution-notice.ts
// Generates a Distribution Notice document.
// From the compliance regulations reference Section 3.
//
// Required content:
// 1. Distribution amount — from distributionAmount
// 2. Distribution type — from distributionType (return_of_capital, income, gain)
// 3. Waterfall calculation — show how distribution flows through tiers
// 4. Withholding — from withholdingRate, withholdingAmount, withholdingType
// 5. Post-distribution capital account
//
// Tax withholding table:
// - Foreign LP (non-FIRPTA): 30% (26 USC §1446)
// - USRPI disposition by partnership: 15% of amount realized (26 USC §1445)
// - Transfer of partnership interest (§1446(f)): 10% of amount realized (26 USC §1446(f))
// - Distribution exceeding basis: potentially subject to §1446(f) withholding
// - Backup withholding: 24% (26 USC §3406)
// - State: varies

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
  createTable,
  keyTermsTable,
  formatCurrency,
  formatCurrencyDetailed,
  safeNumber,
  COLORS,
} from "../../doc-helpers";

import type { ComplianceProjectFull, ComplianceCheck, DistributionNoticeProse } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior fund administrator drafting distribution notices for institutional private equity and real estate funds. Your notices must be accurate, comprehensive, and comply with tax withholding regulations.

RULES:
1. All dollar amounts, dates, rates, and percentages will be provided separately — reference them by name but do not invent numbers.
2. Use formal fund administration language appropriate for LP communications.
3. Tax withholding explanations must cite the correct IRC sections.
4. Waterfall explanations should be clear even for non-financial professionals.
5. Output ONLY valid JSON matching the requested schema.`;

async function generateDistributionProse(project: ComplianceProjectFull): Promise<DistributionNoticeProse> {
  const context = buildProjectContext(project);

  return claudeJson<DistributionNoticeProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate narrative prose sections for a Distribution Notice.

${context}

Return JSON with these keys:
{
  "distributionNarrative": "1-2 paragraph formal notice describing the distribution event and its source (portfolio exit, income, etc.)",
  "waterfallExplanation": "2-3 paragraphs explaining how the distribution flows through the waterfall tiers — return of capital first, then preferred return, then carried interest split",
  "taxWithholdingExplanation": "1-2 paragraphs explaining applicable tax withholding, referencing the correct IRC sections (§1446 for foreign, §1445/1446(f) for FIRPTA, §3406 for backup)",
  "postDistributionSummary": "1 paragraph summarizing the LP's capital account position after the distribution"
}`,
    maxTokens: 3000,
  });
}

// ─── Distribution Type Label ─────────────────────────────────────────

function distributionTypeLabel(type: string | null): string {
  switch (type) {
    case "return_of_capital":
      return "Return of Capital (Non-taxable reduction of basis)";
    case "income":
      return "Operating Income (Taxable as ordinary or passive income)";
    case "gain":
      return "Capital Gains (Short-term or long-term)";
    case "preferred_return":
      return "Preferred Return Component";
    case "profit":
    case "promote":
      return "Profit / Promote Component";
    default:
      return type ?? "Not specified";
  }
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildDistributionNotice(project: ComplianceProjectFull): Promise<Document> {
  const prose = await generateDistributionProse(project);

  const distributionAmount = safeNumber(project.distributionAmount);
  const withholdingAmount = safeNumber(project.withholdingAmount);
  const withholdingRate = project.withholdingRate;
  const nav = safeNumber(project.nav);
  const totalContributions = safeNumber(project.totalContributions);
  const totalDistributions = safeNumber(project.totalDistributions);

  const netDistribution = distributionAmount - withholdingAmount;

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // ─── Header ────────────────────────────────────────────────────
  children.push(documentTitle("Distribution Notice"));
  children.push(spacer(4));
  children.push(
    bodyText(project.fundName, { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(`Notice Date: ${dateFormatted}`));
  children.push(spacer(8));

  // ─── Opening Narrative ─────────────────────────────────────────
  children.push(sectionHeading("Notice of Distribution"));
  children.push(bodyText(prose.distributionNarrative));
  children.push(spacer(8));

  // ─── 1. Distribution Summary ───────────────────────────────────
  children.push(sectionHeading("1. Distribution Summary"));

  children.push(
    keyTermsTable([
      { label: "Fund Name", value: project.fundName },
      { label: "Distribution Date", value: dateFormatted },
      { label: "Gross Distribution Amount", value: formatCurrency(distributionAmount) },
      { label: "Distribution Type", value: distributionTypeLabel(project.distributionType) },
      {
        label: "Tax Withholding",
        value: withholdingAmount > 0
          ? `${formatCurrency(withholdingAmount)} (${withholdingRate !== null && withholdingRate !== undefined ? (safeNumber(withholdingRate) * 100).toFixed(1) + "%" : "rate per schedule"})`
          : "None",
      },
      { label: "Net Distribution Amount", value: formatCurrency(netDistribution) },
    ]),
  );
  children.push(spacer(8));

  // ─── 2. Distribution Type Classification ───────────────────────
  children.push(sectionHeading("2. Distribution Type Classification"));

  children.push(
    bodyText(
      "The character of this distribution for tax purposes is classified as follows. " +
      "Final tax characterization will be provided on the Schedule K-1 for the applicable tax year.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "Primary Classification: ", bold: true },
      { text: distributionTypeLabel(project.distributionType) },
    ]),
  );
  children.push(spacer(4));

  if (project.distributionType === "return_of_capital") {
    children.push(
      bodyText(
        "Return of Capital distributions reduce the Limited Partner's tax basis in the partnership " +
        "interest. This distribution is generally not taxable to the extent it does not exceed the " +
        "LP's adjusted basis in the partnership interest. Any amount in excess of basis is treated " +
        "as gain from the sale of the partnership interest.",
      ),
    );
  } else if (project.distributionType === "income") {
    children.push(
      bodyText(
        "Income distributions are taxable as ordinary income or passive income, depending on the " +
        "LP's level of participation in the fund's activities and the character of the underlying " +
        "income at the partnership level. See your Schedule K-1 for specific tax character.",
      ),
    );
  } else if (project.distributionType === "gain") {
    children.push(
      bodyText(
        "Capital gain distributions may be classified as short-term (held less than one year) or " +
        "long-term (held more than one year) based on the fund's holding period for the underlying " +
        "investment. Long-term capital gains are generally taxed at preferential rates.",
      ),
    );
  }
  children.push(spacer(8));

  // ─── 3. Waterfall Calculation ──────────────────────────────────
  children.push(sectionHeading("3. Distribution Waterfall"));

  children.push(
    bodyText(
      "The distribution proceeds flow through the following waterfall tiers in accordance " +
      "with the Limited Partnership Agreement:",
    ),
  );
  children.push(spacer(4));

  // Deterministic waterfall tiers (standard PE waterfall)
  children.push(
    createTable(
      ["Tier", "Description", "Priority"],
      [
        ["1", "Return of Capital — Return of LP contributions", "First priority"],
        ["2", "Preferred Return — Accrued preferred return to LPs", "Second priority"],
        ["3", "GP Catch-Up — GP receives distributions until carried interest is reached", "Third priority"],
        ["4", "Carried Interest Split — Remaining proceeds split per LPA (typically 80/20 LP/GP)", "Residual"],
      ],
      { columnWidths: [10, 55, 35], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText(prose.waterfallExplanation));
  children.push(spacer(8));

  // ─── 4. Tax Withholding ────────────────────────────────────────
  children.push(sectionHeading("4. Tax Withholding"));

  if (withholdingAmount > 0 || (withholdingRate !== null && withholdingRate !== undefined)) {
    children.push(
      bodyTextRuns([
        { text: "Withholding Applied: ", bold: true },
        { text: `${formatCurrency(withholdingAmount)} at ${withholdingRate !== null && withholdingRate !== undefined ? (safeNumber(withholdingRate) * 100).toFixed(1) + "%" : "applicable rate"}` },
      ]),
    );
    if (project.withholdingType) {
      children.push(
        bodyTextRuns([
          { text: "Withholding Type: ", bold: true },
          { text: project.withholdingType },
        ]),
      );
    }
    children.push(spacer(4));
  }

  // Tax withholding reference table (deterministic — from regulations reference)
  children.push(bodyText("Applicable Tax Withholding Rates:", { bold: true }));
  children.push(spacer(4));

  children.push(
    createTable(
      ["Scenario", "Withholding Rate", "Legal Authority"],
      [
        ["Foreign LP (non-FIRPTA)", "30% (or applicable treaty rate)", "26 U.S.C. § 1446"],
        ["USRPI disposition by partnership", "15% of amount realized", "26 U.S.C. § 1445"],
        ["Transfer of partnership interest", "10% of amount realized", "26 U.S.C. § 1446(f)"],
        ["Distribution exceeding basis (foreign partner)", "Potentially subject to § 1446(f) withholding", "26 U.S.C. § 1446(f)"],
        ["Backup withholding (missing TIN)", "24%", "26 U.S.C. § 3406"],
        ["State withholding (CA)", "7%", "CA Revenue & Taxation Code"],
        ["State withholding (NY)", "10.9%", "NY Tax Law (current top rate)"],
        ["State withholding (other)", "Varies by state", "Applicable state tax code"],
      ],
      { columnWidths: [35, 35, 30], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // #214 — FIRPTA withholding: distinguish three scenarios
  children.push(bodyText("FIRPTA Withholding Distinctions:", { bold: true }));
  children.push(spacer(2));
  children.push(bulletPoint("Section 1445 (direct USRPI disposition): 15% of amount realized — applies when the partnership directly disposes of a U.S. real property interest."));
  children.push(bulletPoint("Section 1446(f) (partnership interest transfer): 10% of amount realized — applies when a foreign partner transfers (sells) an interest in a partnership that holds USRPIs."));
  children.push(bulletPoint("Section 1446(a) (effectively connected income): withholding at the partner's applicable tax rate — applies to a foreign partner's allocable share of effectively connected income from the partnership."));
  children.push(spacer(4));

  children.push(bodyText(prose.taxWithholdingExplanation));
  children.push(spacer(8));

  // ─── 5. Post-Distribution Capital Account ──────────────────────
  children.push(sectionHeading("5. Post-Distribution Capital Account"));

  // Deterministic capital account calculation
  const postDistributionNav = nav - distributionAmount;
  const totalDistributionsIncluding = totalDistributions + distributionAmount;

  children.push(
    keyTermsTable([
      { label: "Total Contributions", value: formatCurrency(totalContributions) },
      { label: "Total Distributions (Prior)", value: formatCurrency(totalDistributions) },
      { label: "Current Distribution", value: formatCurrency(distributionAmount) },
      { label: "Total Distributions (Cumulative)", value: formatCurrency(totalDistributionsIncluding) },
      { label: "Current NAV", value: formatCurrency(postDistributionNav) },
      {
        label: "DPI (Post-Distribution)",
        value: totalContributions > 0
          ? `${(totalDistributionsIncluding / totalContributions).toFixed(3)}x`
          : "N/A",
      },
      {
        label: "TVPI (Post-Distribution)",
        value: totalContributions > 0
          ? `${((totalDistributionsIncluding + postDistributionNav) / totalContributions).toFixed(3)}x`
          : "N/A",
      },
    ]),
  );
  children.push(spacer(4));
  children.push(bodyText(prose.postDistributionSummary));
  children.push(spacer(8));

  // ─── Pro Rata Note ─────────────────────────────────────────────
  children.push(sectionHeading("6. Pro Rata Allocation"));

  children.push(
    bodyText(
      "Each Limited Partner's share of this distribution is determined on a pro rata basis " +
      "in accordance with such Limited Partner's interest in the Fund as set forth in the " +
      "Limited Partnership Agreement, subject to any adjustments required by applicable side " +
      "letter agreements. Individual distribution amounts will be provided under separate cover.",
    ),
  );
  children.push(spacer(8));

  // ─── 7. GP Clawback Provision ──────────────────────────────────
  children.push(sectionHeading("7. GP Clawback Provision"));

  children.push(
    bodyText(
      "Per ILPA best practices and the terms of the Limited Partnership Agreement, the General Partner " +
      "is subject to a clawback obligation. If, at the end of the fund's life (or upon interim clawback " +
      "true-up, if applicable), the General Partner has received cumulative carried interest distributions " +
      "in excess of the amount to which it is entitled based on the fund's aggregate performance, the " +
      "General Partner must return such excess amounts to the Limited Partners. The clawback obligation " +
      "ensures that the GP does not retain more than its agreed-upon share of profits over the life of " +
      "the fund. Limited Partners should refer to the LPA for specific clawback mechanics, including " +
      "the timing, netting provisions, and any escrow or guarantee arrangements.",
    ),
  );
  children.push(spacer(8));

  // ─── Tax Disclaimer ────────────────────────────────────────────
  children.push(sectionHeading("Tax Information"));

  children.push(
    bodyText(
      "The tax characterization of this distribution is preliminary and is provided for " +
      "informational purposes only. The final tax characterization will be reported on the " +
      "Schedule K-1 (Form 1065) for the applicable tax year. Limited Partners should consult " +
      "their own tax advisors regarding the tax consequences of this distribution.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(8));

  // ─── Signature ─────────────────────────────────────────────────
  children.push(
    bodyText("By authority of the General Partner,", { italic: true }),
  );
  children.push(spacer(12));
  children.push(bodyText("________________________________________"));
  children.push(bodyText("General Partner, Authorized Signatory", { color: COLORS.textGray }));
  children.push(bodyText(`Date: ${dateFormatted}`, { color: COLORS.textGray }));

  return buildLegalDocument({
    title: "Distribution Notice",
    headerRight: `${project.fundName} — Distribution Notice`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runDistributionComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  const distributionAmount = safeNumber(project.distributionAmount);
  const withholdingRate = project.withholdingRate;
  const withholdingAmount = safeNumber(project.withholdingAmount);

  // Distribution amount
  checks.push({
    name: "Distribution Amount Specified",
    regulation: "LPA Standard Terms",
    category: "regulatory",
    passed: distributionAmount > 0,
    note: distributionAmount > 0
      ? `Distribution amount: ${formatCurrency(distributionAmount)}`
      : "Distribution amount not specified or is zero",
  });

  // Distribution type
  checks.push({
    name: "Distribution Type Classified",
    regulation: "IRC / LPA Standard Terms",
    category: "tax",
    passed: !!project.distributionType,
    note: project.distributionType
      ? `Distribution type: ${project.distributionType}`
      : "Distribution type not specified — required for tax reporting",
  });

  // Withholding consistency
  if (withholdingRate !== null && withholdingRate !== undefined && distributionAmount > 0) {
    const expectedWithholding = distributionAmount * safeNumber(withholdingRate);
    const withholdingMatch = withholdingAmount > 0
      ? Math.abs(withholdingAmount - expectedWithholding) / expectedWithholding < 0.01
      : false;

    checks.push({
      name: "Withholding Amount Consistency",
      regulation: "26 U.S.C. § 1446 / § 3406",
      category: "tax",
      passed: withholdingMatch || (safeNumber(withholdingRate) === 0 && withholdingAmount === 0),
      note: withholdingMatch
        ? `Withholding (${formatCurrency(withholdingAmount)}) consistent with rate (${(safeNumber(withholdingRate) * 100).toFixed(1)}%)`
        : withholdingAmount === 0 && safeNumber(withholdingRate) > 0
          ? "Withholding rate is set but withholding amount is $0 — verify this is intentional"
          : `Withholding (${formatCurrency(withholdingAmount)}) does not match rate (${(safeNumber(withholdingRate) * 100).toFixed(1)}%) x amount (${formatCurrency(distributionAmount)})`,
    });
  }

  // Foreign LP withholding rates — this block uses withholdingRate directly
  if (project.withholdingType) {
    const type = project.withholdingType.toLowerCase();
    let expectedRate: number | null = null;
    let statute = "";

    if (type.includes("foreign") && !type.includes("firpta") && !type.includes("1446(f)") && !type.includes("transfer")) {
      expectedRate = 0.30;
      statute = "26 U.S.C. § 1446";
    } else if (type.includes("firpta") || type.includes("usrpi") || type.includes("1445")) {
      // USRPI disposition by partnership — 15% under §1445
      expectedRate = 0.15;
      statute = "26 U.S.C. § 1445";
    } else if (type.includes("1446(f)") || type.includes("transfer")) {
      // Transfer of partnership interest — 10% under §1446(f)
      expectedRate = 0.10;
      statute = "26 U.S.C. § 1446(f)";
    } else if (type.includes("backup")) {
      expectedRate = 0.24;
      statute = "26 U.S.C. § 3406";
    }

    if (expectedRate !== null && withholdingRate !== null && withholdingRate !== undefined) {
      const whRate = safeNumber(withholdingRate);
      checks.push({
        name: `Withholding Rate — ${project.withholdingType}`,
        regulation: statute,
        category: "tax",
        passed: Math.abs(whRate - expectedRate) < 0.001,
        note: Math.abs(whRate - expectedRate) < 0.001
          ? `Withholding rate (${(whRate * 100).toFixed(1)}%) matches ${statute} requirement`
          : `Withholding rate (${(whRate * 100).toFixed(1)}%) does not match expected ${(expectedRate * 100).toFixed(0)}% under ${statute}`,
    });
    }
  }


  // Waterfall included
  // #216 — Waterfall check: verify distributions follow waterfall structure if data is available
  checks.push({
    name: "Distribution Waterfall Disclosed",
    regulation: "LPA / ILPA Distribution Template",
    category: "ilpa",
    passed: true, // Waterfall structure is always included in template
    note: "Waterfall structure disclosed. Manual verification recommended to confirm distributions follow LPA waterfall provisions.",
  });

  return checks;
}
