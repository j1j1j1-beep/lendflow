// lp-quarterly-report.ts
// Generates an ILPA-aligned Quarterly LP Report.
// Performance metrics (TVPI, DPI, RVPI) are computed deterministically.
// AI generates narrative commentary only.
//
// ILPA Quarterly Report Standard Contents (2026):
// 1. Fund overview — fund name, vintage year, strategy, size, investment period status
// 2. Financial summary — NAV, total contributions, total distributions, unfunded commitments
// 3. Performance metrics — Net IRR, Gross IRR, MOIC (TVPI), DPI, RVPI
// 4. Portfolio company summary — from portfolioSummary JSON
// 5. Cash flow summary — contributions and distributions for the period
// 6. Fee and expense disclosure
// 7. GP commitment status

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
  COLORS,
  AlignmentType,
} from "../../doc-helpers";

import type { ComplianceProjectFull, ComplianceCheck, LPQuarterlyReportProse, PortfolioCompany } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior fund administrator and investor relations professional with 15+ years of experience at top-tier private equity funds. You write LP quarterly reports that are clear, professional, and compliant with ILPA reporting standards (2026).

RULES:
1. Write narrative commentary only. All financial numbers will be provided separately — reference them by name but do not invent numbers.
2. Be specific and substantive. Avoid generic platitudes.
3. Use professional fund management terminology.
4. Maintain a balanced tone — acknowledge challenges alongside achievements.
5. ILPA compliance: ensure all narrative sections align with ILPA Reporting Template v2.0 standards.
6. Output ONLY valid JSON matching the requested schema. No commentary outside the JSON.`;

async function generateLPReportProse(project: ComplianceProjectFull): Promise<LPQuarterlyReportProse> {
  const context = buildProjectContext(project);

  return claudeJson<LPQuarterlyReportProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate narrative prose sections for an LP Quarterly Report.

${context}

Return JSON with these keys:
{
  "fundOverviewNarrative": "2-3 paragraph fund overview covering strategy, vintage year, investment period status, and key developments during the quarter",
  "marketCommentary": "1-2 paragraphs on market conditions affecting the fund's portfolio",
  "portfolioHighlights": "2-3 paragraphs highlighting key portfolio company developments, value creation initiatives, and any exits or write-downs during the period",
  "feeAndExpenseDisclosure": "1 paragraph disclosing management fees, fund expenses, portfolio company fees, and any offsets applied during the period",
  "gpCommitmentStatus": "1 paragraph on GP commitment amount, amount contributed, and percentage of total commitment called",
  "outlook": "1-2 paragraphs on fund outlook and anticipated near-term activity"
}`,
    maxTokens: 4000,
  });
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildLPQuarterlyReport(project: ComplianceProjectFull): Promise<Document> {
  // Generate AI prose
  const prose = await generateLPReportProse(project);

  // Extract numeric values
  const nav = project.nav ? Number(project.nav) : 0;
  const totalContributions = project.totalContributions ? Number(project.totalContributions) : 0;
  const totalDistributions = project.totalDistributions ? Number(project.totalDistributions) : 0;
  const fundSize = project.fundSize ? Number(project.fundSize) : 0;
  const unfundedCommitments = project.unfundedCommitments ? Number(project.unfundedCommitments) : 0;

  // Compute performance metrics deterministically
  // TVPI = (totalDistributions + NAV) / totalContributions
  // DPI = totalDistributions / totalContributions
  // RVPI = NAV / totalContributions
  // TVPI = DPI + RVPI (identity)
  const tvpi = totalContributions > 0 ? (totalDistributions + nav) / totalContributions : 0;
  const dpi = totalContributions > 0 ? totalDistributions / totalContributions : 0;
  const rvpi = totalContributions > 0 ? nav / totalContributions : 0;

  const netIrr = project.netIrr;
  const grossIrr = project.grossIrr;

  const portfolioSummary = project.portfolioSummary as PortfolioCompany[] | null;

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // ─── Cover / Title ─────────────────────────────────────────────
  children.push(documentTitle("Quarterly LP Report"));
  children.push(spacer(4));
  children.push(
    bodyText(project.fundName, { bold: true, color: COLORS.primary }),
  );
  children.push(
    bodyText(`Reporting Period: ${project.reportingQuarter ?? "Current Quarter"}`, { color: COLORS.textGray }),
  );
  if (project.periodStart && project.periodEnd) {
    children.push(
      bodyText(
        `${project.periodStart.toISOString().split("T")[0]} through ${project.periodEnd.toISOString().split("T")[0]}`,
        { color: COLORS.textGray },
      ),
    );
  }
  children.push(bodyText(`Report Date: ${dateFormatted}`, { color: COLORS.textGray }));
  if (project.ilpaCompliant) {
    children.push(bodyText("ILPA Reporting Template v2.0 Compliant", { bold: true, color: COLORS.accent }));
  }
  children.push(spacer(8));

  // ─── 1. Fund Overview ──────────────────────────────────────────
  children.push(sectionHeading("1. Fund Overview"));

  children.push(
    keyTermsTable([
      { label: "Fund Name", value: project.fundName },
      { label: "Fund Type", value: project.fundType ?? "Not specified" },
      { label: "Vintage Year", value: project.vintageYear?.toString() ?? "Not specified" },
      { label: "Fund Size", value: formatCurrency(fundSize) },
      { label: "Reporting Quarter", value: project.reportingQuarter ?? "Current" },
    ]),
  );
  children.push(spacer(4));
  children.push(bodyText(prose.fundOverviewNarrative));
  children.push(spacer(8));

  // ─── 2. Financial Summary ──────────────────────────────────────
  children.push(sectionHeading("2. Financial Summary"));

  children.push(
    keyTermsTable([
      { label: "Net Asset Value (NAV)", value: formatCurrency(nav) },
      { label: "Total Contributions (Paid-In)", value: formatCurrency(totalContributions) },
      { label: "Total Distributions", value: formatCurrency(totalDistributions) },
      { label: "Unfunded Commitments", value: formatCurrency(unfundedCommitments) },
      { label: "Fund Size", value: formatCurrency(fundSize) },
      {
        label: "% Called",
        value: fundSize > 0 ? `${((totalContributions / fundSize) * 100).toFixed(1)}%` : "N/A",
      },
    ]),
  );
  children.push(spacer(8));

  // ─── 3. Performance Metrics (Deterministic) ────────────────────
  children.push(sectionHeading("3. Performance Metrics"));

  const performanceRows: Array<{ label: string; value: string }> = [];

  if (netIrr !== null && netIrr !== undefined) {
    performanceRows.push({ label: "Net IRR (Since Inception)", value: `${(netIrr * 100).toFixed(2)}%` });
  }
  if (grossIrr !== null && grossIrr !== undefined) {
    performanceRows.push({ label: "Gross IRR (Since Inception)", value: `${(grossIrr * 100).toFixed(2)}%` });
  }
  performanceRows.push({ label: "TVPI (Total Value to Paid-In)", value: `${tvpi.toFixed(3)}x` });
  performanceRows.push({ label: "DPI (Distributions to Paid-In)", value: `${dpi.toFixed(3)}x` });
  performanceRows.push({ label: "RVPI (Residual Value to Paid-In)", value: `${rvpi.toFixed(3)}x` });

  // Verify identity: TVPI = DPI + RVPI
  const identityCheck = Math.abs(tvpi - (dpi + rvpi));
  if (identityCheck > 0.001) {
    performanceRows.push({
      label: "TVPI Identity Check",
      value: `WARNING: TVPI (${tvpi.toFixed(3)}) != DPI (${dpi.toFixed(3)}) + RVPI (${rvpi.toFixed(3)})`,
    });
  }

  if (project.moic !== null && project.moic !== undefined) {
    performanceRows.push({ label: "MOIC", value: `${project.moic.toFixed(3)}x` });
  }

  children.push(keyTermsTable(performanceRows));
  children.push(spacer(4));

  // Performance metric definitions
  children.push(bodyText("Performance Metric Definitions:", { bold: true }));
  children.push(bulletPoint("TVPI (Total Value to Paid-In): (Distributions + NAV) / Total Contributions"));
  children.push(bulletPoint("DPI (Distributions to Paid-In): Total Distributions / Total Contributions"));
  children.push(bulletPoint("RVPI (Residual Value to Paid-In): NAV / Total Contributions"));
  children.push(bulletPoint("Net IRR: Internal rate of return net of all fees and carried interest"));
  children.push(bulletPoint("Gross IRR: Internal rate of return before management fees and carried interest"));
  children.push(spacer(4));
  children.push(bodyText(prose.marketCommentary));
  children.push(spacer(8));

  // ─── 4. Portfolio Company Summary ──────────────────────────────
  children.push(sectionHeading("4. Portfolio Company Summary"));

  if (portfolioSummary && portfolioSummary.length > 0) {
    children.push(
      createTable(
        ["Company", "Date Invested", "Cost", "Fair Value", "% of NAV", "IRR", "MOIC", "Status"],
        portfolioSummary.map((p) => [
          String(p.company ?? "N/A"),
          String(p.dateInvested ?? "N/A"),
          formatCurrencyDetailed(Number(p.cost ?? 0)),
          formatCurrencyDetailed(Number(p.fairValue ?? 0)),
          nav > 0 && p.fairValue
            ? `${((Number(p.fairValue) / nav) * 100).toFixed(1)}%`
            : p.percentOfNav
              ? `${(Number(p.percentOfNav) * 100).toFixed(1)}%`
              : "N/A",
          p.irr !== undefined && p.irr !== null ? `${(Number(p.irr) * 100).toFixed(1)}%` : "N/A",
          p.moic !== undefined && p.moic !== null ? `${Number(p.moic).toFixed(2)}x` : "N/A",
          String(p.status ?? "unrealized").replace(/_/g, " "),
        ]),
        { alternateRows: true },
      ),
    );
    children.push(spacer(4));

    // Portfolio totals row
    const totalCost = portfolioSummary.reduce((sum, p) => sum + Number(p.cost ?? 0), 0);
    const totalFV = portfolioSummary.reduce((sum, p) => sum + Number(p.fairValue ?? 0), 0);
    children.push(
      bodyTextRuns([
        { text: "Total Portfolio: ", bold: true },
        { text: `Cost: ${formatCurrency(totalCost)} | Fair Value: ${formatCurrency(totalFV)} | ${portfolioSummary.length} investments` },
      ]),
    );
  } else {
    children.push(bodyText("No portfolio company data provided for this reporting period."));
  }

  children.push(spacer(4));
  children.push(bodyText(prose.portfolioHighlights));
  children.push(spacer(8));

  // ─── 5. Cash Flow Summary ──────────────────────────────────────
  children.push(sectionHeading("5. Cash Flow Summary"));

  children.push(
    keyTermsTable([
      { label: "Total Contributions (Period)", value: formatCurrency(totalContributions) },
      { label: "Total Distributions (Period)", value: formatCurrency(totalDistributions) },
      { label: "Net Cash Flow", value: formatCurrency(totalDistributions - totalContributions) },
    ]),
  );
  children.push(spacer(8));

  // ─── 6. Fee and Expense Disclosure ─────────────────────────────
  children.push(sectionHeading("6. Fee and Expense Disclosure"));
  children.push(bodyText(prose.feeAndExpenseDisclosure));
  children.push(spacer(8));

  // ─── 7. GP Commitment Status ───────────────────────────────────
  children.push(sectionHeading("7. GP Commitment Status"));
  children.push(bodyText(prose.gpCommitmentStatus));
  children.push(spacer(8));

  // ─── 8. Outlook ────────────────────────────────────────────────
  children.push(sectionHeading("8. Outlook"));
  children.push(bodyText(prose.outlook));
  children.push(spacer(8));

  // ─── Valuation Methodology Note ────────────────────────────────
  if (project.valuationMethodology) {
    children.push(sectionHeading("Valuation Methodology"));
    children.push(
      bodyText(
        `Investments are valued in accordance with ASC 820 (Fair Value Measurement). ` +
        `The fund uses ${project.valuationMethodology} as the primary valuation methodology. ` +
        (project.valuationProvider ? `Independent valuation services are provided by ${project.valuationProvider}. ` : "") +
        (project.valuationDate ? `Most recent valuation date: ${project.valuationDate.toISOString().split("T")[0]}.` : ""),
      ),
    );
    children.push(spacer(4));
    children.push(bodyText("ASC 820 Fair Value Hierarchy:", { bold: true }));
    children.push(bulletPoint("Level 1: Quoted prices in active markets for identical assets"));
    children.push(bulletPoint("Level 2: Observable inputs other than Level 1 prices (comparable transactions, indices)"));
    children.push(bulletPoint("Level 3: Unobservable inputs (models, assumptions) — applies to most PE/RE investments"));
    children.push(spacer(8));
  }

  // ─── Disclaimers ───────────────────────────────────────────────
  children.push(sectionHeading("Important Disclaimers"));
  children.push(
    bodyText(
      "This report is confidential and is intended solely for the information of the limited partners of the fund. " +
      "Past performance is not indicative of future results. The performance metrics presented herein are calculated " +
      "net of management fees and fund expenses unless otherwise noted. IRR calculations use actual cash flow dates " +
      "and are presented on a since-inception basis. Valuations of unrealized investments are based on estimates and " +
      "may not reflect the amounts that could be realized upon sale. This report has been prepared for informational " +
      "purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities.",
      { color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "LP Quarterly Report",
    headerRight: `${project.fundName} — ${project.reportingQuarter ?? "Quarterly Report"}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runLPReportComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const totalContributions = project.totalContributions ? Number(project.totalContributions) : 0;
  const totalDistributions = project.totalDistributions ? Number(project.totalDistributions) : 0;
  const nav = project.nav ? Number(project.nav) : 0;

  // ILPA reporting completeness
  checks.push({
    name: "ILPA Fund Overview",
    regulation: "ILPA Reporting Template v2.0",
    category: "ilpa",
    passed: !!project.fundName && project.vintageYear !== null,
    note: project.fundName && project.vintageYear !== null
      ? "Fund name and vintage year provided"
      : "Fund name or vintage year missing — required by ILPA",
  });

  checks.push({
    name: "ILPA Financial Summary",
    regulation: "ILPA Reporting Template v2.0",
    category: "ilpa",
    passed: project.nav !== null && project.totalContributions !== null,
    note: project.nav !== null && project.totalContributions !== null
      ? "NAV and contributions data provided"
      : "NAV or contributions data missing — required by ILPA",
  });

  checks.push({
    name: "ILPA Performance Metrics",
    regulation: "ILPA Reporting Template v2.0",
    category: "ilpa",
    passed: project.netIrr !== null || totalContributions > 0,
    note: project.netIrr !== null
      ? "Net IRR provided"
      : totalContributions > 0
        ? "Performance calculated from contribution data"
        : "No performance data available — ILPA requires performance metrics",
  });

  // TVPI identity check: TVPI = DPI + RVPI
  if (totalContributions > 0) {
    const tvpi = (totalDistributions + nav) / totalContributions;
    const dpi = totalDistributions / totalContributions;
    const rvpi = nav / totalContributions;
    const identityHolds = Math.abs(tvpi - (dpi + rvpi)) < 0.001;

    checks.push({
      name: "TVPI = DPI + RVPI Identity",
      regulation: "ILPA Performance Template",
      category: "ilpa",
      passed: identityHolds,
      note: identityHolds
        ? `TVPI (${tvpi.toFixed(3)}) = DPI (${dpi.toFixed(3)}) + RVPI (${rvpi.toFixed(3)})`
        : `TVPI identity does not hold: ${tvpi.toFixed(3)} != ${dpi.toFixed(3)} + ${rvpi.toFixed(3)}`,
    });
  }

  // Portfolio summary
  const portfolioSummary = project.portfolioSummary as Array<Record<string, unknown>> | null;
  checks.push({
    name: "ILPA Portfolio Company Detail",
    regulation: "ILPA Reporting Template v2.0",
    category: "ilpa",
    passed: portfolioSummary !== null && portfolioSummary.length > 0,
    note: portfolioSummary && portfolioSummary.length > 0
      ? `${portfolioSummary.length} portfolio companies reported`
      : "No portfolio company detail provided — ILPA requires individual investment reporting",
  });

  // Reporting period
  checks.push({
    name: "Reporting Period Defined",
    regulation: "ILPA Reporting Template v2.0",
    category: "ilpa",
    passed: !!project.periodStart && !!project.periodEnd,
    note: project.periodStart && project.periodEnd
      ? "Reporting period start and end dates provided"
      : "Reporting period not fully defined",
  });

  // ILPA compliance flag
  checks.push({
    name: "ILPA Template Compliance",
    regulation: "ILPA Reporting Template v2.0 (effective Q1 2026)",
    category: "ilpa",
    passed: project.ilpaCompliant,
    note: project.ilpaCompliant
      ? "Project marked as ILPA compliant"
      : "Project not marked as ILPA compliant — verify alignment with ILPA Reporting Template v2.0",
  });

  // Valuation methodology disclosure
  checks.push({
    name: "Valuation Methodology Disclosure",
    regulation: "ASC 820 / IPEV Guidelines",
    category: "valuation",
    passed: !!project.valuationMethodology,
    note: project.valuationMethodology
      ? `Valuation methodology: ${project.valuationMethodology}`
      : "Valuation methodology not disclosed — ASC 820 requires fair value hierarchy disclosure",
  });

  return checks;
}
