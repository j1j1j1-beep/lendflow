/**
 * Source Document OCR Text — Compliance Module (6 deals × 2 required docs = 12 docs)
 *
 * OPTIMIZED FOR AI OUTPUT QUALITY:
 * These feed Grok prompts generating LP Reports, Capital Call Notices,
 * Distribution Notices, K-1 Summaries, Annual Reports, and Form ADV Summaries.
 * The AI needs dense financial data and portfolio details to write
 * professional ILPA-compliant fund reports.
 *
 * Required source doc types:
 *   1. prior_period_financials — Fund financial statements with portfolio detail
 *   2. capital_account_data — LP-level capital account activity
 */

import { SAMPLE_COMPLIANCE_DEALS, type SampleComplianceDeal } from "../compliance";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────
// PRIOR PERIOD FINANCIALS — feeds LP Quarterly, Annual Report, K-1
// Dense with portfolio company detail, valuations, fee calculations
// ─────────────────────────────────────────────────────────────────

function generatePriorPeriodFinancials(deal: SampleComplianceDeal): string {
  const isQuarterly = deal.reportType === "LP_QUARTERLY_REPORT" || deal.reportType === "CAPITAL_CALL_NOTICE" || deal.reportType === "DISTRIBUTION_NOTICE";
  const contributions = deal.totalContributions || 180_000_000;
  const distributions = deal.totalDistributions || 42_000_000;
  const nav = deal.nav || 285_000_000;
  const fundSize = 250_000_000; // Ridgeline is $250M
  const deployedPct = contributions / fundSize;

  // Portfolio companies (for PE funds)
  const portfolio = getPortfolioCompanies(deal);
  const totalCost = portfolio.reduce((sum, p) => sum + p.cost, 0);
  const totalFV = portfolio.reduce((sum, p) => sum + p.fairValue, 0);

  // Fee calculations
  const mgmtFeeBase = contributions; // During investment period, fee on committed
  const mgmtFeeRate = 0.02;
  const quarterlyMgmtFee = Math.round(mgmtFeeBase * mgmtFeeRate / 4);
  const annualMgmtFee = quarterlyMgmtFee * 4;

  const period = isQuarterly ? `Q4 2025 (October 1 - December 31, 2025)` : `Fiscal Year Ended December 31, 2025`;

  return `${deal.fundName.toUpperCase()}
FINANCIAL STATEMENTS (UNAUDITED)
${period}
Prepared by: Citco Fund Services (Fund Administrator)

STATEMENT OF ASSETS AND LIABILITIES
As of December 31, 2025

ASSETS
Investments at fair value (cost: $${fmt(totalCost)}):
${portfolio.map(p => `  ${p.name.padEnd(40)} $${fmt(p.fairValue).padStart(14)} [cost: $${fmt(p.cost)}, ${p.status}]`).join("\n")}
                                              ──────────────
  Total Investments                           $${fmt(totalFV)}

Cash and cash equivalents                      ${fmt(Math.round(nav * 0.08))}
Interest receivable                            ${fmt(Math.round(nav * 0.002))}
Other receivables                              ${fmt(Math.round(nav * 0.003))}
                                              ──────────────
TOTAL ASSETS                                  $${fmt(nav + Math.round(nav * 0.085))}

LIABILITIES
Management fee payable                        $${fmt(quarterlyMgmtFee)}
Accrued expenses                               ${fmt(Math.round(nav * 0.002))}
Accounts payable                               ${fmt(Math.round(nav * 0.001))}
                                              ──────────────
TOTAL LIABILITIES                             $${fmt(quarterlyMgmtFee + Math.round(nav * 0.003))}

NET ASSETS                                    $${fmt(nav)}

STATEMENT OF OPERATIONS
${period}

INVESTMENT INCOME
Dividend income                               $${fmt(Math.round(nav * 0.005))}
Interest income                                ${fmt(Math.round(nav * 0.003))}
Fee income (monitoring, transaction)           ${fmt(Math.round(nav * 0.004))}
                                              ──────────────
Total Investment Income                        ${fmt(Math.round(nav * 0.012))}

EXPENSES
Management fees (${(mgmtFeeRate * 100).toFixed(1)}% per annum)          ${fmt(isQuarterly ? quarterlyMgmtFee : annualMgmtFee)}
Administration fees                            ${fmt(Math.round(annualMgmtFee * 0.08 / (isQuarterly ? 4 : 1)))}
Legal fees                                     ${fmt(Math.round(annualMgmtFee * 0.06 / (isQuarterly ? 4 : 1)))}
Audit fees                                     ${fmt(Math.round(annualMgmtFee * 0.04 / (isQuarterly ? 4 : 1)))}
Custody fees                                   ${fmt(Math.round(annualMgmtFee * 0.02 / (isQuarterly ? 4 : 1)))}
Insurance (D&O, E&O)                          ${fmt(Math.round(annualMgmtFee * 0.03 / (isQuarterly ? 4 : 1)))}
Other fund expenses                            ${fmt(Math.round(annualMgmtFee * 0.02 / (isQuarterly ? 4 : 1)))}
                                              ──────────────
Total Expenses                                 ${fmt(Math.round((isQuarterly ? quarterlyMgmtFee : annualMgmtFee) * 1.25))}
Less: Management fee offset (portfolio co fees) (${fmt(Math.round((isQuarterly ? quarterlyMgmtFee : annualMgmtFee) * 0.08))})
                                              ──────────────
Net Expenses                                   ${fmt(Math.round((isQuarterly ? quarterlyMgmtFee : annualMgmtFee) * 1.17))}

NET INVESTMENT INCOME (LOSS)                  $${fmt(Math.round(nav * 0.012 - (isQuarterly ? quarterlyMgmtFee : annualMgmtFee) * 1.17))}

REALIZED AND UNREALIZED GAINS
Net realized gain on investments               ${fmt(Math.round(distributions * 0.6))}
Net change in unrealized appreciation          ${fmt(Math.round(totalFV - totalCost - distributions * 0.6))}
                                              ──────────────
Net Gain on Investments                        ${fmt(Math.round(totalFV - totalCost))}

NET INCREASE IN NET ASSETS                    $${fmt(Math.round(totalFV - totalCost + nav * 0.012 - (isQuarterly ? quarterlyMgmtFee : annualMgmtFee) * 1.17))}

FUND PERFORMANCE METRICS (NET OF FEES)

Total Commitments:                            $${fmt(fundSize)}
Capital Called to Date:                       $${fmt(contributions)} (${(deployedPct * 100).toFixed(1)}%)
Unfunded Commitments:                         $${fmt(fundSize - contributions)} (${((1 - deployedPct) * 100).toFixed(1)}%)
Cumulative Distributions:                     $${fmt(distributions)}
NAV:                                          $${fmt(nav)}
Total Value (Distributions + NAV):            $${fmt(distributions + nav)}

TVPI:  ${((distributions + nav) / contributions).toFixed(2)}x
DPI:   ${(distributions / contributions).toFixed(2)}x
RVPI:  ${(nav / contributions).toFixed(2)}x
Net IRR: ${deal.netIrr || 22.4}%
Gross IRR: ${((deal.netIrr || 22.4) + 5.2).toFixed(1)}%

PORTFOLIO SUMMARY
                                    Cost Basis    Fair Value    MOIC    Status
${portfolio.map(p => `${p.name.padEnd(30)} $${fmt(p.cost).padStart(12)} $${fmt(p.fairValue).padStart(12)}  ${(p.fairValue / p.cost).toFixed(1)}x  ${p.status}`).join("\n")}
${"─".repeat(80)}
${"TOTAL".padEnd(30)} $${fmt(totalCost).padStart(12)} $${fmt(totalFV).padStart(12)}  ${(totalFV / totalCost).toFixed(1)}x

VALUATION METHODOLOGY
All investments valued at fair value in accordance with ASC 820 (Fair Value Measurement).
Level 1: Quoted prices in active markets — $0
Level 2: Observable inputs — $0
Level 3: Unobservable inputs — $${fmt(totalFV)} (100%)

Valuation techniques: Comparable company analysis, precedent transactions, DCF (WACC: 11-14%), and LBO analysis. Valuations reviewed quarterly by Valuation Committee and annually by independent third-party (Duff & Phelps).

AUDITOR
Ernst & Young LLP — Annual audit (unqualified opinion on 2024 statements)
2025 audit in progress, expected completion: March 31, 2026

NOTES
1. Financial statements prepared in accordance with U.S. GAAP (ASC 946 — Financial Services — Investment Companies).
2. Fund operates as a partnership for U.S. federal income tax purposes under IRC Subchapter K.
3. Management fees calculated on committed capital during investment period per LPA Section 6.1.
4. GP catch-up and carried interest calculated on whole-fund (European) basis per LPA Section 7.2.`;
}

// ─────────────────────────────────────────────────────────────────
// CAPITAL ACCOUNT DATA — feeds Capital Call, Distribution, K-1
// LP-level detail with individual accounts and activity
// ─────────────────────────────────────────────────────────────────

function generateCapitalAccountData(deal: SampleComplianceDeal): string {
  const fundSize = 250_000_000;
  const contributions = deal.totalContributions || 180_000_000;
  const distributions = deal.totalDistributions || 42_000_000;
  const nav = deal.nav || 285_000_000;
  const lps = getLPData(deal, fundSize, contributions, distributions, nav);
  const gpCommitment = Math.round(fundSize * 0.02);

  const isCapitalCall = deal.reportType === "CAPITAL_CALL_NOTICE";
  const isDistribution = deal.reportType === "DISTRIBUTION_NOTICE";
  const isK1 = deal.reportType === "K1_SUMMARY";

  let text = `${deal.fundName.toUpperCase()}
CAPITAL ACCOUNT STATEMENT
As of December 31, 2025
Prepared by: Citco Fund Services (Fund Administrator)

FUND SUMMARY
─────────────────────────────────────────────────────────────────
Total Commitments:                            $${fmt(fundSize)}
GP Commitment (2.0%):                         $${fmt(gpCommitment)}
LP Commitments:                               $${fmt(fundSize - gpCommitment)}
Number of Limited Partners:                    42
Capital Called to Date:                       $${fmt(contributions)}
Unfunded Commitments:                         $${fmt(fundSize - contributions)}
Cumulative Distributions:                     $${fmt(distributions)}
Current NAV:                                  $${fmt(nav)}

CAPITAL ACCOUNT DETAIL BY LIMITED PARTNER
─────────────────────────────────────────────────────────────────

`;

  // Header
  text += `${"Partner".padEnd(28)} ${"Commitment".padStart(14)} ${"Called".padStart(14)} ${"Unfunded".padStart(14)} ${"Distributed".padStart(14)} ${"NAV Share".padStart(14)} ${"Own %".padStart(7)}\n`;
  text += `${"─".repeat(107)}\n`;

  // GP first
  const gpCalled = Math.round(gpCommitment * (contributions / fundSize));
  const gpDist = Math.round(distributions * (gpCommitment / fundSize));
  const gpNav = Math.round(nav * (gpCommitment / fundSize));
  text += `${"GP — " + deal.fundName.split(",")[0].split(" ").slice(-2).join(" ").substring(0, 23)}`.padEnd(28);
  text += `$${fmt(gpCommitment).padStart(13)} $${fmt(gpCalled).padStart(13)} $${fmt(gpCommitment - gpCalled).padStart(13)} $${fmt(gpDist).padStart(13)} $${fmt(gpNav).padStart(13)} ${((gpCommitment / fundSize * 100).toFixed(1) + "%").padStart(7)}\n`;

  // LPs
  for (const lp of lps) {
    const called = Math.round(lp.commitment * (contributions / fundSize));
    const dist = Math.round(distributions * (lp.commitment / fundSize));
    const navShare = Math.round(nav * (lp.commitment / fundSize));
    text += `${lp.name.padEnd(28)} $${fmt(lp.commitment).padStart(13)} $${fmt(called).padStart(13)} $${fmt(lp.commitment - called).padStart(13)} $${fmt(dist).padStart(13)} $${fmt(navShare).padStart(13)} ${((lp.commitment / fundSize * 100).toFixed(1) + "%").padStart(7)}\n`;
  }

  const lpTotal = lps.reduce((sum, lp) => sum + lp.commitment, 0);
  text += `${"─".repeat(107)}\n`;
  text += `${"TOTAL".padEnd(28)} $${fmt(fundSize).padStart(13)} $${fmt(contributions).padStart(13)} $${fmt(fundSize - contributions).padStart(13)} $${fmt(distributions).padStart(13)} $${fmt(nav).padStart(13)} ${"100.0%".padStart(7)}\n`;

  // Capital call detail
  if (isCapitalCall && deal.callAmount) {
    text += `\nCAPITAL CALL #7 — DETAIL
─────────────────────────────────────────────────────────────────
Call Date: February 28, 2026
Due Date: ${deal.callDueDate || "March 14, 2026"}
Total Call Amount: $${fmt(deal.callAmount)}
Purpose: ${deal.callPurpose || "New investment acquisition"}

Default Provisions (per LPA Section 8.4):
- Interest on late payment: Prime + 3% (currently 9.75% per annum)
- After 10 business days: GP may exercise default remedies including forfeiture of up to 50% of defaulting LP's capital account
- Cure period: 30 calendar days from notice of default

CALL ALLOCATION BY PARTNER:
${lps.slice(0, 8).map(lp => {
  const callShare = Math.round(deal.callAmount! * (lp.commitment / fundSize));
  return `  ${lp.name.padEnd(28)} $${fmt(callShare).padStart(12)} (${(lp.commitment / fundSize * 100).toFixed(2)}%)`;
}).join("\n")}
  ... and ${lps.length - 8} additional limited partners
  ${"GP".padEnd(28)} $${fmt(Math.round(deal.callAmount * (gpCommitment / fundSize))).padStart(12)} (${(gpCommitment / fundSize * 100).toFixed(2)}%)`;
  }

  // Distribution detail
  if (isDistribution && deal.distributionAmount) {
    const returnOfCapital = Math.round(deal.distributionAmount * 0.65);
    const preferredReturn = Math.round(deal.distributionAmount * 0.25);
    const profitSplit = deal.distributionAmount - returnOfCapital - preferredReturn;

    text += `\nDISTRIBUTION #4 — WATERFALL CALCULATION
─────────────────────────────────────────────────────────────────
Distribution Date: March 15, 2026
Total Distribution: $${fmt(deal.distributionAmount)}
Source: Sale of Willow Creek Apartments (realized investment)

WATERFALL APPLICATION:
Tier 1 — Return of Capital:         $${fmt(returnOfCapital)} (100% to LPs)
Tier 2 — Preferred Return (8%):     $${fmt(preferredReturn)} (100% to LPs)
Tier 3 — GP Catch-Up (to 20%):      $${fmt(Math.round(profitSplit * 0.5))} (100% to GP)
Tier 4 — Residual Split (80/20):    $${fmt(Math.round(profitSplit * 0.5))} ($${fmt(Math.round(profitSplit * 0.5 * 0.8))} LP / $${fmt(Math.round(profitSplit * 0.5 * 0.2))} GP)

LP Total: $${fmt(returnOfCapital + preferredReturn + Math.round(profitSplit * 0.5 * 0.8))}
GP Total (Carry): $${fmt(Math.round(profitSplit * 0.5) + Math.round(profitSplit * 0.5 * 0.2))}

Clawback Status: No GP clawback obligation at this time. Cumulative distributions exceed return of capital + preferred return on whole-fund basis.`;
  }

  // K-1 detail
  if (isK1) {
    const ordinaryIncome = Math.round(nav * 0.012); // investment income
    const stcg = Math.round(distributions * 0.1);
    const ltcg = Math.round(distributions * 0.5);
    const sec1231 = 0;
    const sec1250 = Math.round(distributions * 0.05);
    const deductions = Math.round(nav * 0.015);

    text += `\nSCHEDULE K-1 (FORM 1065) — TAX YEAR 2025
─────────────────────────────────────────────────────────────────
Filing Deadline: March 15, 2026 (September 15 with extension)
Late Filing Penalty: $260/partner/month (IRC Section 6698, 2026 rate)
Total Partners: 42
Maximum Monthly Penalty: $10,920 (42 × $260)

AGGREGATE TAX ALLOCATIONS (ALL PARTNERS):
Box 1 — Ordinary Business Income:                $${fmt(ordinaryIncome)}
Box 4a — Guaranteed Payments (Mgmt Fee):          $${fmt(Math.round(fundSize * 0.02))}
Box 8 — Net Short-Term Capital Gain:              $${fmt(stcg)}
Box 9a — Net Long-Term Capital Gain:              $${fmt(ltcg)}
Box 9c — Unrecaptured Section 1250 Gain:          $${fmt(sec1250)}
Box 11 — Other Income (monitoring fees):          $${fmt(Math.round(nav * 0.004))}
Box 13d — Deductions (Section 179):               ($${fmt(deductions)})
Box 13e — Other Deductions:                       ($${fmt(Math.round(deductions * 0.3))})
Box 15a — Alternative Minimum Tax Items:          $${fmt(Math.round(nav * 0.001))}
Box 16a — Foreign Tax Paid:                       $0
Box 20 — Other Information:
  20A — Investment income                         $${fmt(Math.round(nav * 0.008))}
  20B — Investment expenses                       ($${fmt(Math.round(nav * 0.002))})
  20V — Section 199A qualified business income    $0 (N/A for investment partnership)
  20AH — Section 1061 information                 See attachment

SECTION 1061 CARRIED INTEREST DISCLOSURE:
API (Applicable Partnership Interest) holder: ${deal.fundName.split(",")[0].split(" ").slice(-2).join(" ")} Management, LLC (GP)
One-Year Amount: $${fmt(stcg)}
Three-Year Amount: $${fmt(ltcg)}
Recharacterization Required: ${stcg > 0 ? `$${fmt(stcg)} recharacterized as short-term (held < 3 years)` : "None"}

STATE TAX CONSIDERATIONS:
- Partnership files Form 1065 (federal) and composite returns in: CA, NY, IL, TX, FL, MA, CT
- ${deal.fundName.includes("Ridgeline") ? "7" : "5"} states require PTE (pass-through entity) election or withholding
- SALT deduction cap: $10,000 individual (consider PTE election for SALT workaround)`;
  }

  text += `\n\nCERTIFICATION
The undersigned certifies that the capital account data presented herein is complete and accurate as of the date indicated, and has been prepared in accordance with the terms of the Limited Partnership Agreement and U.S. GAAP.

Fund Administrator: Citco Fund Services
Date: January 15, 2026`;

  return text;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

type PortfolioCo = {
  name: string; cost: number; fairValue: number; status: string;
};

function getPortfolioCompanies(deal: SampleComplianceDeal): PortfolioCo[] {
  const contributions = deal.totalContributions || 180_000_000;
  const distributions = deal.totalDistributions || 42_000_000;
  const nav = deal.nav || 285_000_000;

  // 6 portfolio companies for PE fund
  return [
    { name: "Apex Medical Group", cost: Math.round(contributions * 0.22), fairValue: Math.round(nav * 0.28), status: "Unrealized" },
    { name: "DataBridge Systems", cost: Math.round(contributions * 0.18), fairValue: Math.round(nav * 0.22), status: "Unrealized" },
    { name: "Vertex Industrial Solutions", cost: Math.round(contributions * 0.15), fairValue: Math.round(nav * 0.18), status: "Unrealized" },
    { name: "Summit Business Services", cost: Math.round(contributions * 0.14), fairValue: Math.round(nav * 0.15), status: "Unrealized" },
    { name: "Precision Healthcare IT", cost: Math.round(contributions * 0.12), fairValue: Math.round(nav * 0.10), status: "Unrealized" },
    { name: "TechServ Solutions", cost: Math.round(contributions * 0.08), fairValue: Math.round(distributions * 0.85), status: "Realized (Q2 2025)" },
  ];
}

type LPEntry = { name: string; commitment: number; type: string };

function getLPData(deal: SampleComplianceDeal, fundSize: number, _contributions: number, _distributions: number, _nav: number): LPEntry[] {
  const gpCommitment = Math.round(fundSize * 0.02);
  const remaining = fundSize - gpCommitment;

  // Generate realistic LP base with consistent types and sizes
  const baseLPs: LPEntry[] = [
    { name: "CalPERS", type: "Public Pension", commitment: Math.round(remaining * 0.12) },
    { name: "NY State Common Fund", type: "Public Pension", commitment: Math.round(remaining * 0.10) },
    { name: "Harvard Management Company", type: "Endowment", commitment: Math.round(remaining * 0.08) },
    { name: "Metropolitan Life Insurance", type: "Insurance", commitment: Math.round(remaining * 0.07) },
    { name: "Abu Dhabi Investment Authority", type: "Sovereign Wealth", commitment: Math.round(remaining * 0.06) },
    { name: "Whitfield Family Office", type: "Family Office", commitment: Math.round(remaining * 0.05) },
    { name: "Stanford Management Company", type: "Endowment", commitment: Math.round(remaining * 0.05) },
    { name: "Ontario Teachers' Pension", type: "Public Pension", commitment: Math.round(remaining * 0.04) },
    { name: "Ford Foundation", type: "Foundation", commitment: Math.round(remaining * 0.04) },
    { name: "Alaska Permanent Fund", type: "Sovereign Wealth", commitment: Math.round(remaining * 0.035) },
    { name: "Northwestern Mutual", type: "Insurance", commitment: Math.round(remaining * 0.03) },
    { name: "Koch Industries", type: "Corporate", commitment: Math.round(remaining * 0.03) },
  ];

  // Add remaining as "Other LPs (30)" to reach 42 total
  const allocatedCommitment = baseLPs.reduce((sum, lp) => sum + lp.commitment, 0);
  const remainingCommitment = remaining - allocatedCommitment;

  // Just return top 12 named + aggregated remainder
  return [
    ...baseLPs,
    { name: "Other LPs (30 investors)", type: "Various", commitment: remainingCommitment },
  ];
}

// ─────────────────────────────────────────────────────────────────
// Main exports
// ─────────────────────────────────────────────────────────────────

export function getComplianceSourceDocs(dealId: string): Record<string, string> {
  const deal = SAMPLE_COMPLIANCE_DEALS.find((d) => d.id === dealId);
  if (!deal) throw new Error(`Compliance sample deal not found: ${dealId}`);

  return {
    prior_period_financials: generatePriorPeriodFinancials(deal),
    capital_account_data: generateCapitalAccountData(deal),
  };
}

export function getAllComplianceSourceDocs(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const deal of SAMPLE_COMPLIANCE_DEALS) {
    result[deal.id] = getComplianceSourceDocs(deal.id);
  }
  return result;
}
