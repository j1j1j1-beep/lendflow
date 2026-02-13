// annual-report.ts
// Generates an Annual Report document.
// From the compliance regulations reference Section 8.
//
// AI-generated narrative with deterministic financial tables:
// - Balance sheet (statement of assets and liabilities)
// - Statement of operations
// - Statement of changes in net assets
// - Statement of cash flows
// - Schedule of investments (from portfolioSummary)
// - Auditor info (from auditorName, auditDate, auditOpinion)
// - Fair value measurement hierarchy (ASC 820)

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

import type { ComplianceProjectFull, ComplianceCheck, AnnualReportProse, PortfolioCompany } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior fund controller and financial reporting specialist preparing annual reports for institutional private equity and real estate funds. Your reports must meet GAAP and IPEV valuation standards.

RULES:
1. All financial numbers will be provided in deterministic tables — do not invent numbers.
2. Write professional narrative sections that provide context to the financial statements.
3. Reference ASC 820 fair value hierarchy when discussing valuations.
4. Notes to financial statements should cover significant accounting policies.
5. Management discussion should be substantive and forward-looking.
6. Output ONLY valid JSON matching the requested schema.`;

async function generateAnnualReportProse(project: ComplianceProjectFull): Promise<AnnualReportProse> {
  const context = buildProjectContext(project);

  return claudeJson<AnnualReportProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate narrative prose sections for a Fund Annual Report.

${context}

Return JSON with these keys:
{
  "chairmanLetter": "2-3 paragraph letter from the GP/chairman reviewing the year's performance, market conditions, and strategic outlook",
  "managementDiscussion": "2-3 paragraphs of management discussion and analysis covering fund strategy execution, market environment, and portfolio positioning",
  "investmentActivityNarrative": "1-2 paragraphs describing investment and divestment activity during the year",
  "riskDisclosure": "2-3 paragraphs covering key risk factors: market risk, credit risk, liquidity risk, concentration risk, and operational risk",
  "subsequentEventsDisclosure": "1 paragraph noting any material events after the reporting period end (or stating none if no specific events are indicated)",
  "notesToFinancials": "2-3 paragraphs covering significant accounting policies, basis of presentation, and key estimates used in preparing the financial statements"
}`,
    maxTokens: 5000,
  });
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildAnnualReport(project: ComplianceProjectFull): Promise<Document> {
  const prose = await generateAnnualReportProse(project);

  const nav = safeNumber(project.nav);
  const totalContributions = safeNumber(project.totalContributions);
  const totalDistributions = safeNumber(project.totalDistributions);
  const fundSize = safeNumber(project.fundSize);
  const unfundedCommitments = safeNumber(project.unfundedCommitments);

  const tvpi = totalContributions > 0 ? (totalDistributions + nav) / totalContributions : 0;
  const dpi = totalContributions > 0 ? totalDistributions / totalContributions : 0;
  const rvpi = totalContributions > 0 ? nav / totalContributions : 0;

  const portfolioSummary = Array.isArray(project.portfolioSummary) ? project.portfolioSummary as unknown as PortfolioCompany[] : null;

  const periodEnd = project.periodEnd
    ? project.periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Year End";

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // ─── Cover ─────────────────────────────────────────────────────
  children.push(documentTitle("Annual Report"));
  children.push(spacer(4));
  children.push(
    bodyText(project.fundName, { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(`For the Period Ended ${periodEnd}`, { color: COLORS.textGray }));
  children.push(bodyText(`Report Date: ${dateFormatted}`, { color: COLORS.textGray }));
  if (project.auditorName) {
    children.push(bodyText(`Independent Auditor: ${project.auditorName}`, { color: COLORS.textGray }));
  }
  children.push(spacer(8));

  // ─── Chairman/GP Letter ────────────────────────────────────────
  children.push(sectionHeading("Letter to Limited Partners"));
  children.push(bodyText(prose.chairmanLetter));
  children.push(spacer(8));

  // ─── Auditor Information ───────────────────────────────────────
  if (project.auditorName) {
    children.push(sectionHeading("Independent Auditor's Report"));

    children.push(
      keyTermsTable([
        { label: "Auditor", value: project.auditorName },
        {
          label: "Audit Date",
          value: project.auditDate
            ? project.auditDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "Pending",
        },
        { label: "Opinion", value: project.auditOpinion ?? "Pending" },
      ]),
    );
    children.push(spacer(4));

    if (project.auditOpinion) {
      const opinionText = project.auditOpinion.toLowerCase();
      if (opinionText.includes("unqualified") || opinionText.includes("clean")) {
        children.push(
          bodyText(
            "The independent auditor has issued an unqualified (clean) opinion on the fund's " +
            "financial statements, indicating that the financial statements present fairly, in all " +
            "material respects, the financial position and results of operations in conformity with " +
            "accounting principles generally accepted in the United States of America (U.S. GAAP).",
          ),
        );
      } else if (opinionText.includes("qualified")) {
        children.push(
          bodyText(
            "The independent auditor has issued a qualified opinion. Limited Partners should " +
            "review the auditor's report in its entirety for details on the qualification.",
            { bold: true },
          ),
        );
      } else if (opinionText.includes("adverse")) {
        children.push(
          bodyText(
            "WARNING: The independent auditor has issued an adverse opinion, indicating that " +
            "the financial statements do not present fairly the financial position of the fund. " +
            "Limited Partners should carefully review the auditor's report.",
            { bold: true, color: "CC0000" },
          ),
        );
      } else if (opinionText.includes("disclaimer")) {
        children.push(
          bodyText(
            "Disclaimer of Opinion — The auditor was unable to obtain sufficient appropriate " +
            "audit evidence to provide a basis for an audit opinion. A disclaimer does not indicate " +
            "that the financial statements are incorrect, but rather that the auditor could not " +
            "complete the audit procedures necessary to form an opinion.",
            { bold: true, color: "CC0000" },
          ),
        );
      }
    }
    children.push(spacer(8));
  }

  // ─── Statement of Assets and Liabilities (Balance Sheet) ───────
  children.push(sectionHeading("Statement of Assets and Liabilities"));
  children.push(bodyText(`As of ${periodEnd}`, { italic: true, color: COLORS.textGray }));
  children.push(spacer(4));

  // Compute derived values
  const totalCost = portfolioSummary
    ? portfolioSummary.reduce((sum, p) => sum + safeNumber(p.cost), 0)
    : 0;
  const totalFairValue = portfolioSummary
    ? portfolioSummary.reduce((sum, p) => sum + safeNumber(p.fairValue), 0)
    : nav;
  const unrealizedGainLoss = totalFairValue - totalCost;

  children.push(
    createTable(
      ["", "Amount"],
      [
        ["ASSETS", ""],
        ["Investments at fair value", formatCurrency(totalFairValue)],
        ["Cash and cash equivalents", formatCurrency(nav - totalFairValue > 0 ? nav - totalFairValue : 0)],
        // TODO: These values should come from project data (otherAssets). Hardcoded $0 is not GAAP-compliant for operating funds. Display "See audited financial statements" if data unavailable.
        ["Other assets", "$0"],
        ["Total Assets", formatCurrency(nav)],
        ["", ""],
        ["LIABILITIES", ""],
        // TODO: These values should come from project data (accruedExpenses, otherLiabilities, totalLiabilities). Hardcoded $0 is not GAAP-compliant for operating funds. Display "See audited financial statements" if data unavailable.
        ["Accrued expenses", "$0"],
        ["Other liabilities", "$0"],
        ["Total Liabilities", "$0"],
        ["", ""],
        ["NET ASSETS", formatCurrency(nav)],
      ],
      { columnWidths: [60, 40], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Statement of Operations ───────────────────────────────────
  children.push(sectionHeading("Statement of Operations"));
  children.push(bodyText(`For the Period Ended ${periodEnd}`, { italic: true, color: COLORS.textGray }));
  children.push(spacer(4));

  children.push(
    createTable(
      ["", "Amount"],
      [
        ["INVESTMENT INCOME", ""],
        ["Unrealized appreciation (depreciation)", formatCurrencyDetailed(unrealizedGainLoss)],
        // Realized gains: use project field if available, otherwise note data not available — refer to audited schedule
        ["Realized gains (losses)",
          (project as Record<string, unknown>).realizedGains !== undefined && (project as Record<string, unknown>).realizedGains !== null
            ? formatCurrencyDetailed(safeNumber((project as Record<string, unknown>).realizedGains))
            : "$0 *"],
        ["Interest and dividend income", "$0"],
        ["Total Investment Income", formatCurrencyDetailed(unrealizedGainLoss)],
        ["", ""],
        ["EXPENSES", ""],
        // TODO: These values should come from project data (managementFeesYTD, operatingExpenses). Hardcoded $0 is not GAAP-compliant for operating funds. Display "See audited financial statements" if data unavailable.
        ["Management fees", "$0"],
        ["Fund operating expenses", "$0"],
        ["Total Expenses", "$0"],
        ["", ""],
        ["NET INVESTMENT INCOME (LOSS)", formatCurrencyDetailed(unrealizedGainLoss)],
      ],
      { columnWidths: [60, 40], alternateRows: true },
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "* Realized gains data not available from project data — refer to audited schedule of realized " +
      "and unrealized gains and losses. Management fees, fund operating expenses, and other balance " +
      "sheet items shown as $0 are placeholders — actual values should be sourced from the accounting " +
      "system integration or audited financial statements.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(8));

  // ─── Statement of Changes in Net Assets ────────────────────────
  children.push(sectionHeading("Statement of Changes in Net Assets"));
  children.push(spacer(4));

  children.push(
    createTable(
      ["", "Amount"],
      [
        // Beginning NAV: use project field if available, otherwise estimate from capital account activity
        ["Net assets, beginning of period",
          (project as Record<string, unknown>).beginningNav !== undefined && (project as Record<string, unknown>).beginningNav !== null
            ? formatCurrency(safeNumber((project as Record<string, unknown>).beginningNav))
            : formatCurrency(totalContributions - totalDistributions) + " (estimated from capital account activity; actual NAV per audited financials may differ)"],
        ["Capital contributions", formatCurrency(totalContributions)],
        ["Capital distributions", `(${formatCurrency(totalDistributions)})`],
        ["Net investment income (loss)", formatCurrencyDetailed(unrealizedGainLoss)],
        ["Net assets, end of period", formatCurrency(nav)],
      ],
      { columnWidths: [60, 40], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Statement of Cash Flows ───────────────────────────────────
  children.push(sectionHeading("Statement of Cash Flows"));
  children.push(spacer(4));

  children.push(
    createTable(
      ["", "Amount"],
      [
        ["CASH FLOWS FROM OPERATING ACTIVITIES", ""],
        ["Purchase of investments", `(${formatCurrency(totalCost)})`],
        ["Proceeds from disposition of investments", formatCurrency(totalDistributions)],
        ["Net cash from operating activities", formatCurrency(totalDistributions - totalCost)],
        ["", ""],
        ["CASH FLOWS FROM FINANCING ACTIVITIES", ""],
        ["Capital contributions received", formatCurrency(totalContributions)],
        ["Distributions to partners", `(${formatCurrency(totalDistributions)})`],
        ["Net cash from financing activities", formatCurrency(totalContributions - totalDistributions)],
      ],
      { columnWidths: [60, 40], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule of Investments ───────────────────────────────────
  children.push(sectionHeading("Schedule of Investments"));
  children.push(bodyText(`As of ${periodEnd}`, { italic: true, color: COLORS.textGray }));
  children.push(spacer(4));

  if (portfolioSummary && portfolioSummary.length > 0) {
    children.push(
      createTable(
        ["Company", "Date Invested", "Cost", "Fair Value", "% of NAV", "Status"],
        portfolioSummary.map((p) => [
          String(p.company ?? "N/A"),
          String(p.dateInvested ?? "N/A"),
          formatCurrencyDetailed(safeNumber(p.cost)),
          formatCurrencyDetailed(safeNumber(p.fairValue)),
          nav > 0
            ? `${((safeNumber(p.fairValue) / nav) * 100).toFixed(1)}%`
            : "N/A",
          String(p.status ?? "unrealized").replace(/_/g, " "),
        ]),
        { columnWidths: [20, 15, 18, 18, 14, 15], alternateRows: true },
      ),
    );
    children.push(spacer(4));

    children.push(
      bodyTextRuns([
        { text: "Total: ", bold: true },
        { text: `Cost: ${formatCurrency(totalCost)} | Fair Value: ${formatCurrency(totalFairValue)} | Unrealized Gain/(Loss): ${formatCurrency(unrealizedGainLoss)}` },
      ]),
    );
  } else {
    children.push(bodyText("Schedule of investments is provided under separate cover."));
  }
  children.push(spacer(8));

  // ─── Fair Value Measurement Hierarchy (ASC 820) ────────────────
  children.push(sectionHeading("Fair Value Measurement Hierarchy (ASC 820)"));

  children.push(
    bodyText(
      "The fund follows ASC 820 (Fair Value Measurement) for measuring the fair value of " +
      "its investments. ASC 820 establishes a three-level hierarchy for disclosure of fair " +
      "value measurements:",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Level", "Description", "Examples"],
      [
        ["Level 1", "Quoted prices in active markets for identical assets", "Publicly traded securities"],
        ["Level 2", "Observable inputs other than Level 1 prices", "Comparable transactions, indices, broker quotes"],
        ["Level 3", "Unobservable inputs based on models and assumptions", "Private equity, real estate, venture capital (most fund investments)"],
      ],
      { columnWidths: [15, 50, 35], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Valuations are also consistent with the International Private Equity and Venture Capital " +
      "Valuation (IPEV) Guidelines, the industry-recognized framework for private fund asset valuations.",
    ),
  );
  children.push(spacer(4));

  if (project.valuationMethodology) {
    children.push(
      bodyTextRuns([
        { text: "Primary Valuation Methodology: ", bold: true },
        { text: project.valuationMethodology },
      ]),
    );
  }
  if (project.valuationProvider) {
    children.push(
      bodyTextRuns([
        { text: "Independent Valuation Provider: ", bold: true },
        { text: project.valuationProvider },
      ]),
    );
  }
  if (project.valuationDate) {
    children.push(
      bodyTextRuns([
        { text: "Most Recent Valuation Date: ", bold: true },
        { text: project.valuationDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
      ]),
    );
  }
  children.push(spacer(8));

  // ─── Performance Summary ───────────────────────────────────────
  children.push(sectionHeading("Performance Summary"));

  const performanceRows: Array<{ label: string; value: string }> = [];
  if (project.netIrr !== null && project.netIrr !== undefined) {
    performanceRows.push({ label: "Net IRR (Since Inception)", value: `${(safeNumber(project.netIrr) * 100).toFixed(2)}%` });
  }
  if (project.grossIrr !== null && project.grossIrr !== undefined) {
    performanceRows.push({ label: "Gross IRR (Since Inception)", value: `${(safeNumber(project.grossIrr) * 100).toFixed(2)}%` });
  }
  performanceRows.push({ label: "TVPI", value: `${tvpi.toFixed(3)}x` });
  performanceRows.push({ label: "DPI", value: `${dpi.toFixed(3)}x` });
  performanceRows.push({ label: "RVPI", value: `${rvpi.toFixed(3)}x` });

  children.push(keyTermsTable(performanceRows));
  children.push(spacer(8));

  // ─── Management Discussion & Analysis ──────────────────────────
  children.push(sectionHeading("Management Discussion and Analysis"));
  children.push(bodyText(prose.managementDiscussion));
  children.push(spacer(8));

  // ─── Investment Activity ───────────────────────────────────────
  children.push(sectionHeading("Investment Activity"));
  children.push(bodyText(prose.investmentActivityNarrative));
  children.push(spacer(8));

  // ─── Risk Factors ──────────────────────────────────────────────
  children.push(sectionHeading("Risk Factors"));
  children.push(bodyText(prose.riskDisclosure));
  children.push(spacer(8));

  // ─── Notes to Financial Statements ─────────────────────────────
  children.push(sectionHeading("Notes to Financial Statements"));
  children.push(bodyText(prose.notesToFinancials));
  children.push(spacer(8));

  // ─── Subsequent Events ─────────────────────────────────────────
  children.push(sectionHeading("Subsequent Events"));
  children.push(bodyText(prose.subsequentEventsDisclosure));
  children.push(spacer(8));

  // ─── Required Disclosures ──────────────────────────────────────
  children.push(sectionHeading("Required Disclosures"));

  children.push(bodyText("Fee and Expense Detail:", { bold: true }));
  children.push(bulletPoint("Management fees, fund expenses, and portfolio company fees are disclosed in the Statement of Operations."));
  children.push(spacer(4));

  children.push(bodyText("Related Party Transactions:", { bold: true }));
  children.push(bulletPoint("Related party transactions, if any, are disclosed in the notes to financial statements."));
  children.push(spacer(4));

  children.push(bodyText("Commitment and Contingency Disclosures:", { bold: true }));
  children.push(
    bulletPoint(
      `Total fund commitments: ${formatCurrency(fundSize)}. Unfunded commitments: ${formatCurrency(unfundedCommitments)}.`,
    ),
  );
  children.push(spacer(8));

  // ─── Disclaimer ────────────────────────────────────────────────
  children.push(
    bodyText(
      "This annual report is confidential and is intended solely for the information of the " +
      "limited partners of the fund. The financial statements contained herein should be read in " +
      "conjunction with the independent auditor's report. Past performance is not indicative of " +
      "future results.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "Annual Report",
    headerRight: `${project.fundName} — Annual Report`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runAnnualReportComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Financial statements completeness
  checks.push({
    name: "NAV Reported",
    regulation: "GAAP / IPEV Guidelines",
    category: "valuation",
    passed: project.nav !== null,
    note: project.nav !== null
      ? `NAV: ${formatCurrency(safeNumber(project.nav))}`
      : "NAV not reported — required for financial statements",
  });

  checks.push({
    name: "Contributions and Distributions Reported",
    regulation: "GAAP — Statement of Changes in Net Assets",
    category: "regulatory",
    passed: project.totalContributions !== null && project.totalDistributions !== null,
    note: project.totalContributions !== null && project.totalDistributions !== null
      ? "Contributions and distributions data provided"
      : "Contribution or distribution data missing",
  });

  // Auditor information
  checks.push({
    name: "Independent Auditor Identified",
    regulation: "LPA / Institutional Investor Requirements",
    category: "regulatory",
    passed: !!project.auditorName,
    note: project.auditorName
      ? `Auditor: ${project.auditorName}`
      : "No independent auditor identified — institutional LPs typically require audited financial statements",
  });

  checks.push({
    name: "Audit Opinion Provided",
    regulation: "AICPA Auditing Standards",
    category: "regulatory",
    passed: !!project.auditOpinion,
    note: project.auditOpinion
      ? `Audit opinion: ${project.auditOpinion}`
      : "Audit opinion not provided",
  });

  // Adverse opinion warning
  if (project.auditOpinion && project.auditOpinion.toLowerCase().includes("adverse")) {
    checks.push({
      name: "Adverse Audit Opinion Warning",
      regulation: "AICPA Auditing Standards",
      category: "regulatory",
      passed: false,
      note: "CRITICAL: Adverse audit opinion issued — financial statements may not present fairly",
    });
  }

  // Valuation methodology (ASC 820)
  checks.push({
    name: "ASC 820 Valuation Methodology Disclosed",
    regulation: "FASB ASC 820 — Fair Value Measurement",
    category: "valuation",
    passed: !!project.valuationMethodology,
    note: project.valuationMethodology
      ? `Valuation methodology: ${project.valuationMethodology}`
      : "Valuation methodology not disclosed — ASC 820 requires fair value hierarchy disclosure",
  });

  // Portfolio summary
  const portfolioSummary = Array.isArray(project.portfolioSummary) ? project.portfolioSummary as Array<Record<string, unknown>> : null;
  checks.push({
    name: "Schedule of Investments",
    regulation: "GAAP — Investment Company Reporting",
    category: "regulatory",
    passed: portfolioSummary !== null && portfolioSummary.length > 0,
    note: portfolioSummary && portfolioSummary.length > 0
      ? `${portfolioSummary.length} investments reported in schedule`
      : "Schedule of investments not provided",
  });

  // Reporting period
  checks.push({
    name: "Reporting Period Defined",
    regulation: "GAAP — Financial Statement Presentation",
    category: "standard",
    passed: !!project.periodEnd,
    note: project.periodEnd
      ? `Period ended: ${project.periodEnd.toISOString().split("T")[0]}`
      : "Reporting period end date not specified",
  });

  return checks;
}
