// pro-forma.ts
// Pro Forma Financial Projections for RE syndication.
// 100% DETERMINISTIC — no AI. Builds financial projections from project data.
// Year-by-year NOI, debt service, cash flow, waterfall distributions, exit analysis.

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
  keyTermsTable,
  createTable,
  formatCurrency,
  formatCurrencyDetailed,
  safeNumber,
  COLORS,
  AlignmentType,
  TextRun,
} from "../../doc-helpers";

import type { SyndicationProjectFull, ComplianceCheck } from "../types";

// ─── Financial Calculation Helpers ──────────────────────────────────

interface YearProjection {
  year: number;
  grossRevenue: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlowAfterDebt: number;
  cashOnCash: number;
  dscr: number;
}

interface WaterfallDistribution {
  tierOrder: number;
  tierName: string;
  lpAmount: number;
  gpAmount: number;
}

interface ExitAnalysis {
  exitYear: number;
  exitNoi: number;
  exitValue: number;
  loanPayoff: number;
  dispositionFee: number;
  netProceeds: number;
  totalDistributions: number;
  totalEquityInvested: number;
  equityMultiple: number;
  irr: number;
}

/**
 * Calculate annual debt service for a fixed-rate loan.
 * Returns annual payment amount.
 */
function calculateAnnualDebtService(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  interestOnly: boolean,
  ioTermMonths: number | null,
  year: number,
): number {
  if (loanAmount <= 0 || annualRate <= 0) return 0;

  const monthlyRate = annualRate / 12;

  // Check if this year is within the IO period
  const ioYears = ioTermMonths ? ioTermMonths / 12 : 0;
  if (interestOnly && year <= ioYears) {
    // Interest-only payment
    return loanAmount * annualRate;
  }

  // Amortizing payment (P&I) — fixed payment based on full loan term
  const totalAmortMonths = termYears * 12;
  if (totalAmortMonths <= 0) return 0;

  // Check if loan has been fully amortized
  const elapsedMonths = (year - 1) * 12;
  if (elapsedMonths >= totalAmortMonths) return 0;

  const monthlyPayment =
    loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalAmortMonths)) /
    (Math.pow(1 + monthlyRate, totalAmortMonths) - 1);

  return monthlyPayment * 12;
}

/**
 * Calculate remaining loan balance at the end of a given year.
 */
function calculateLoanBalance(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  interestOnly: boolean,
  ioTermMonths: number | null,
  atYear: number,
): number {
  if (loanAmount <= 0) return 0;

  const monthlyRate = annualRate / 12;
  const ioMonths = ioTermMonths ?? 0;
  const totalMonths = atYear * 12;

  if (interestOnly && totalMonths <= ioMonths) {
    // Still in IO period — full balance remains
    return loanAmount;
  }

  // Calculate months of amortization
  const amortizingMonths = interestOnly
    ? Math.max(0, totalMonths - ioMonths)
    : totalMonths;

  if (amortizingMonths <= 0) return loanAmount;

  const n = termYears * 12;
  if (monthlyRate === 0) {
    return loanAmount - (loanAmount / n) * amortizingMonths;
  }

  const monthlyPayment =
    loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1);

  // Remaining balance after amortizingMonths payments
  const balance =
    loanAmount * Math.pow(1 + monthlyRate, amortizingMonths) -
    monthlyPayment * ((Math.pow(1 + monthlyRate, amortizingMonths) - 1) / monthlyRate);

  return Math.max(0, balance);
}

/**
 * Cumulative tracking state for the waterfall across years.
 * Tracks cumulative LP distributions to determine when preferred return
 * thresholds are met before GP participates in higher tiers.
 */
interface WaterfallCumulativeState {
  cumulativeLpDistributions: number;
  cumulativeGpDistributions: number;
}

/**
 * Apply waterfall tiers to a distribution amount with cumulative tracking.
 * LP receives preferred return on unreturned capital before GP split advances to higher tiers.
 */
function applyWaterfall(
  cashFlow: number,
  tiers: SyndicationProjectFull["waterfallTiers"],
  preferredReturn: number,
  totalEquity: number,
  cumulativeState?: WaterfallCumulativeState,
): WaterfallDistribution[] {
  if (tiers.length === 0 || cashFlow <= 0) {
    const lpAmt = cashFlow * 0.7;
    const gpAmt = cashFlow * 0.3;
    if (cumulativeState) {
      cumulativeState.cumulativeLpDistributions += lpAmt;
      cumulativeState.cumulativeGpDistributions += gpAmt;
    }
    return [{
      tierOrder: 1,
      tierName: "Default Split",
      lpAmount: lpAmt,
      gpAmount: gpAmt,
    }];
  }

  const sorted = [...tiers].sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0));
  const distributions: WaterfallDistribution[] = [];
  let remaining = cashFlow;

  // Track cumulative LP distributions to determine tier thresholds
  const cumLpBefore = cumulativeState?.cumulativeLpDistributions ?? 0;
  let cumLpRunning = cumLpBefore;

  for (const tier of sorted) {
    if (remaining <= 0) break;

    if (tier.hurdleRate != null && tier.hurdleRate > 0) {
      // Cumulative hurdle: LP should have received totalEquity * hurdleRate cumulatively
      // before distributions advance to the next tier
      const cumulativeHurdleTarget = totalEquity * tier.hurdleRate;
      const lpShortfall = Math.max(0, cumulativeHurdleTarget - cumLpRunning);

      if (lpShortfall > 0) {
        // LP needs to catch up to the hurdle before GP gets higher-tier splits
        const tierAmount = Math.min(remaining, lpShortfall / (tier.lpSplit > 0 ? tier.lpSplit : 1));
        const actualTierAmount = Math.min(remaining, Math.max(tierAmount, lpShortfall));
        const lpAmount = Math.min(actualTierAmount, remaining) * tier.lpSplit;
        const gpAmount = Math.min(actualTierAmount, remaining) * tier.gpSplit;

        distributions.push({
          tierOrder: tier.tierOrder,
          tierName: tier.tierName ?? `Tier ${tier.tierOrder}`,
          lpAmount,
          gpAmount,
        });
        remaining -= (lpAmount + gpAmount);
        cumLpRunning += lpAmount;
      } else {
        // Hurdle already met cumulatively, skip to next tier
        continue;
      }
    } else {
      // Residual tier — takes all remaining
      const lpAmount = remaining * tier.lpSplit;
      const gpAmount = remaining * tier.gpSplit;
      distributions.push({
        tierOrder: tier.tierOrder,
        tierName: tier.tierName ?? `Tier ${tier.tierOrder}`,
        lpAmount,
        gpAmount,
      });
      cumLpRunning += lpAmount;
      remaining = 0;
    }
  }

  // If any remains (no residual tier), split 70/30 default
  if (remaining > 0) {
    const lpAmount = remaining * 0.7;
    const gpAmount = remaining * 0.3;
    distributions.push({
      tierOrder: sorted.length + 1,
      tierName: "Residual",
      lpAmount,
      gpAmount,
    });
    cumLpRunning += lpAmount;
  }

  // Update cumulative state
  if (cumulativeState) {
    const totalLp = distributions.reduce((s, d) => s + d.lpAmount, 0);
    const totalGp = distributions.reduce((s, d) => s + d.gpAmount, 0);
    cumulativeState.cumulativeLpDistributions += totalLp;
    cumulativeState.cumulativeGpDistributions += totalGp;
  }

  return distributions;
}

/**
 * Calculate IRR using Newton's method.
 * cashFlows[0] is the initial investment (negative), rest are annual returns.
 */
function calculateIRR(cashFlows: number[], maxIterations = 100, tolerance = 0.0001): number {
  if (cashFlows.length < 2) return 0;

  let rate = 0.1; // Initial guess 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      if (t > 0) {
        derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) return rate;
    if (Math.abs(derivative) < 1e-10) break;

    rate = rate - npv / derivative;

    // Bound the rate to prevent divergence
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 5;
  }

  return rate;
}

/**
 * Expense ratio by property type (operating expenses as % of gross revenue).
 * Industry benchmarks — used for NOI decomposition and growth projections.
 */
function getExpenseRatio(propertyType: string): number {
  switch (propertyType) {
    case "HOTEL":
      return 0.65; // Hotels/hospitality: 55-75%
    case "INDUSTRIAL":
      return 0.30; // Industrial/warehouse: 25-35%
    case "NNN_RETAIL":
      return 0.15; // NNN retail: 10-20% (tenant pays most expenses)
    case "OFFICE":
      return 0.45; // Office: 40-50%
    case "RETAIL":
      return 0.40; // Gross retail: 35-45%
    case "SELF_STORAGE":
      return 0.35; // Self-storage: 30-40%
    case "MOBILE_HOME_PARK":
      return 0.35; // MHP: 30-40%
    case "SENIOR_HOUSING":
      return 0.55; // Senior housing: 50-65% (staffing-intensive)
    case "STUDENT_HOUSING":
      return 0.45; // Student housing: 40-50%
    case "MIXED_USE":
      return 0.42; // Mixed-use: varies, ~40-45%
    case "BUILD_TO_RENT":
    case "MULTIFAMILY":
    default:
      return 0.40; // Multifamily/BTR: 35-45%
  }
}

// ─── DOCX Builder (Deterministic) ───────────────────────────────────

export function buildProForma(project: SyndicationProjectFull): Document {
  const purchasePrice = safeNumber(project.purchasePrice);
  const renovationBudget = safeNumber(project.renovationBudget);
  const closingCosts = safeNumber(project.closingCosts);
  const totalEquityRaise = safeNumber(project.totalEquityRaise);
  const loanAmount = safeNumber(project.loanAmount);
  const interestRate = safeNumber(project.interestRate);
  const loanTermYears = project.loanTermYears ?? 30;
  const holdYears = project.projectedHoldYears ?? 5;
  const currentNoi = safeNumber(project.currentNoi);
  const proFormaNoi = safeNumber(project.proFormaNoi);
  const vacancyRate = safeNumber(project.vacancyRate, 0.05);
  const rentGrowthRate = safeNumber(project.rentGrowthRate, 0.03);
  const expenseGrowthRate = safeNumber(project.expenseGrowthRate, 0.02);
  const exitCapRate = safeNumber(project.exitCapRate, 0.06);
  const preferredReturn = safeNumber(project.preferredReturn, 0.08);
  const totalCost = purchasePrice + renovationBudget + closingCosts;
  const capRate = purchasePrice > 0 ? currentNoi / purchasePrice : 0;
  const ltv = purchasePrice > 0 ? loanAmount / purchasePrice : 0;

  // Derive expense ratio from NOI
  // NOI = Revenue - Vacancy - Expenses, so Expenses = Revenue * (1 - vacancy) - NOI
  // We'll use a simplified model: NOI grows from current to pro forma over years 1-2, then by rent/expense growth
  const stabilizationYear = renovationBudget > 0 ? 2 : 1;

  // Build year-by-year projections
  const projections: YearProjection[] = [];
  for (let year = 1; year <= holdYears; year++) {
    let noi: number;

    if (year < stabilizationYear) {
      // Transitioning from current to pro forma NOI
      const progress = year / stabilizationYear;
      noi = currentNoi + (proFormaNoi - currentNoi) * progress;
    } else if (year === stabilizationYear) {
      noi = proFormaNoi;
    } else {
      // Post-stabilization: grow NOI by net of rent growth - expense growth
      const yearsAfterStab = year - stabilizationYear;
      // Revenue grows by rentGrowthRate, expenses grow by expenseGrowthRate
      // Simplified: NOI grows approximately by the net rate
      const expRatio = getExpenseRatio(project.propertyType);
      const netGrowthRate = rentGrowthRate - (expenseGrowthRate * expRatio);
      noi = proFormaNoi * Math.pow(1 + netGrowthRate, yearsAfterStab);
    }

    // Decompose for display
    // Property-type-specific expense ratio
    const expenseRatio = getExpenseRatio(project.propertyType);
    const grossRevenue = noi / Math.max(0.01, 1 - vacancyRate - expenseRatio);
    const vacancyLoss = grossRevenue * vacancyRate;
    const operatingExpenses = grossRevenue * expenseRatio;
    const effectiveGrossIncome = grossRevenue - vacancyLoss;
    const calculatedNoi = effectiveGrossIncome - operatingExpenses;

    // Use the actual NOI (not the decomposed one) for accuracy
    const debtService = calculateAnnualDebtService(
      loanAmount,
      interestRate,
      loanTermYears,
      project.interestOnly,
      project.ioTermMonths ?? null,
      year,
    );
    const cashFlowAfterDebt = noi - debtService;
    const cashOnCash = totalEquityRaise > 0 ? cashFlowAfterDebt / totalEquityRaise : 0;
    const dscr = debtService > 0 ? noi / debtService : 0;

    projections.push({
      year,
      grossRevenue,
      vacancyLoss,
      effectiveGrossIncome,
      operatingExpenses,
      noi,
      debtService,
      cashFlowAfterDebt,
      cashOnCash,
      dscr,
    });
  }

  // Exit analysis
  const exitNoi = projections[holdYears - 1]?.noi ?? proFormaNoi;
  const exitValue = exitCapRate > 0 ? exitNoi / exitCapRate : 0;
  const loanPayoff = calculateLoanBalance(
    loanAmount,
    interestRate,
    loanTermYears,
    project.interestOnly,
    project.ioTermMonths ?? null,
    holdYears,
  );
  const dispositionFeeAmount = exitValue * (project.dispositionFee ?? 0);
  const netProceeds = exitValue - loanPayoff - dispositionFeeAmount;

  // Total distributions over hold period
  const totalCashFlow = projections.reduce((sum, p) => sum + Math.max(0, p.cashFlowAfterDebt), 0);
  const totalDistributions = totalCashFlow + netProceeds;
  const equityMultiple = totalEquityRaise > 0 ? totalDistributions / totalEquityRaise : 0;

  // IRR calculation
  const irrCashFlows = [
    -totalEquityRaise,
    ...projections.map((p, i) =>
      i === projections.length - 1
        ? Math.max(0, p.cashFlowAfterDebt) + netProceeds
        : Math.max(0, p.cashFlowAfterDebt),
    ),
  ];
  const calculatedIrr = calculateIRR(irrCashFlows);

  // Waterfall distributions per year with cumulative tracking
  const waterfallCumulativeState: WaterfallCumulativeState = {
    cumulativeLpDistributions: 0,
    cumulativeGpDistributions: 0,
  };
  const waterfallPerYear = projections.map((p) =>
    applyWaterfall(
      Math.max(0, p.cashFlowAfterDebt),
      project.waterfallTiers,
      preferredReturn,
      totalEquityRaise,
      waterfallCumulativeState,
    ),
  );

  // Build DOCX
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Pro Forma Financial Projections"));
  children.push(spacer(4));
  children.push(bodyText(project.name, { bold: true }));
  children.push(bodyText(project.propertyAddress, { italic: true }));
  children.push(
    bodyText(
      `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(8));

  // Disclaimer
  children.push(
    bodyText(
      "IMPORTANT: These projections are estimates based on assumptions described herein. Actual results may differ materially. Past performance is not indicative of future results. These projections do not constitute a guarantee of returns.",
      { bold: true, italic: true },
    ),
  );
  children.push(spacer(8));

  // ── Section 1: Key Assumptions ─────────────────────────────────────

  children.push(sectionHeading("Key Assumptions"));

  const assumptionRows: Array<{ label: string; value: string }> = [
    { label: "Purchase Price", value: formatCurrency(purchasePrice) },
    { label: "Renovation Budget", value: formatCurrency(renovationBudget) },
    { label: "Closing Costs", value: formatCurrency(closingCosts) },
    { label: "Total Project Cost", value: formatCurrency(totalCost) },
    { label: "Senior Debt", value: `${formatCurrency(loanAmount)} at ${(interestRate * 100).toFixed(3)}%` },
    { label: "LTV", value: `${(ltv * 100).toFixed(1)}%` },
    { label: "Loan Term", value: `${loanTermYears} years${project.interestOnly ? ` (IO: ${project.ioTermMonths ?? 0} months)` : ""}` },
    { label: "Total Equity", value: formatCurrency(totalEquityRaise) },
    { label: "Hold Period", value: `${holdYears} years` },
    { label: "Going-In Cap Rate", value: `${(capRate * 100).toFixed(2)}%` },
    { label: "Exit Cap Rate", value: `${(exitCapRate * 100).toFixed(2)}%` },
    { label: "Vacancy Rate", value: `${(vacancyRate * 100).toFixed(1)}%` },
    { label: "Rent Growth Rate", value: `${(rentGrowthRate * 100).toFixed(1)}% per annum` },
    { label: "Expense Growth Rate", value: `${(expenseGrowthRate * 100).toFixed(1)}% per annum` },
  ];
  children.push(keyTermsTable(assumptionRows));
  children.push(spacer(8));

  // ── Section 2: Key Metrics Summary ─────────────────────────────────

  children.push(sectionHeading("Projected Returns Summary"));

  const returnRows: Array<{ label: string; value: string }> = [
    { label: "Projected IRR", value: `${(calculatedIrr * 100).toFixed(1)}%` },
    { label: "Projected Equity Multiple", value: `${equityMultiple.toFixed(2)}x` },
    { label: "Total Distributions (Hold Period)", value: formatCurrency(totalCashFlow) },
    { label: "Net Sale Proceeds", value: formatCurrency(netProceeds) },
    { label: "Total Return", value: formatCurrency(totalDistributions) },
    { label: "Average Cash-on-Cash", value: `${(projections.reduce((s, p) => s + p.cashOnCash, 0) / projections.length * 100).toFixed(1)}%` },
    { label: "Average DSCR", value: `${(projections.reduce((s, p) => s + p.dscr, 0) / projections.length).toFixed(2)}x` },
    { label: "Preferred Return", value: `${(preferredReturn * 100).toFixed(1)}%` },
  ];
  children.push(keyTermsTable(returnRows));
  children.push(spacer(8));

  // ── Section 3: Year-by-Year Projections ────────────────────────────

  children.push(sectionHeading("Year-by-Year Cash Flow Projections"));

  const yearHeaders = ["", ...projections.map((p) => `Year ${p.year}`)];
  const yearData = [
    ["Gross Revenue", ...projections.map((p) => formatCurrency(p.grossRevenue))],
    ["Vacancy Loss", ...projections.map((p) => `(${formatCurrency(p.vacancyLoss)})`)],
    ["Effective Gross Income", ...projections.map((p) => formatCurrency(p.effectiveGrossIncome))],
    ["Operating Expenses", ...projections.map((p) => `(${formatCurrency(p.operatingExpenses)})`)],
    ["Net Operating Income", ...projections.map((p) => formatCurrency(p.noi))],
    ["Debt Service", ...projections.map((p) => `(${formatCurrency(p.debtService)})`)],
    ["Cash Flow After Debt", ...projections.map((p) => formatCurrency(p.cashFlowAfterDebt))],
    ["Cash-on-Cash Return", ...projections.map((p) => `${(p.cashOnCash * 100).toFixed(1)}%`)],
    ["DSCR", ...projections.map((p) => `${p.dscr.toFixed(2)}x`)],
  ];

  // Calculate column widths: first column wider, rest equal
  const totalCols = yearHeaders.length;
  const firstColWidth = 24;
  const remainingWidth = Math.floor((100 - firstColWidth) / (totalCols - 1));
  const colWidths = [firstColWidth, ...Array(totalCols - 1).fill(remainingWidth)];

  children.push(
    createTable(yearHeaders, yearData, { columnWidths: colWidths, alternateRows: true }),
  );
  children.push(spacer(8));

  // ── Section 4: Distribution Waterfall ──────────────────────────────

  if (project.waterfallTiers.length > 0) {
    children.push(sectionHeading("Distribution Waterfall Analysis"));
    children.push(
      bodyText("Projected annual distributions by waterfall tier:"),
    );
    children.push(spacer(4));

    // Summary for each year
    for (let i = 0; i < projections.length; i++) {
      const p = projections[i];
      const wf = waterfallPerYear[i];
      if (p.cashFlowAfterDebt <= 0) {
        children.push(
          bodyText(`Year ${p.year}: No distributable cash flow (cash flow: ${formatCurrency(p.cashFlowAfterDebt)})`, { italic: true }),
        );
        continue;
      }

      const wfRows = wf.map((d) => [
        d.tierName,
        formatCurrency(d.lpAmount),
        formatCurrency(d.gpAmount),
        formatCurrency(d.lpAmount + d.gpAmount),
      ]);
      wfRows.push([
        "Total",
        formatCurrency(wf.reduce((s, d) => s + d.lpAmount, 0)),
        formatCurrency(wf.reduce((s, d) => s + d.gpAmount, 0)),
        formatCurrency(p.cashFlowAfterDebt),
      ]);

      children.push(bodyText(`Year ${p.year} — Distributable: ${formatCurrency(p.cashFlowAfterDebt)}`, { bold: true }));
      children.push(
        createTable(
          ["Tier", "LP Distribution", "GP Distribution", "Total"],
          wfRows,
          { columnWidths: [30, 25, 25, 20], alternateRows: true },
        ),
      );
      children.push(spacer(4));
    }
    children.push(spacer(8));
  }

  // ── Section 5: Exit Analysis ───────────────────────────────────────

  children.push(sectionHeading("Exit / Disposition Analysis"));

  const exitRows: Array<{ label: string; value: string }> = [
    { label: "Exit Year", value: `Year ${holdYears}` },
    { label: "Exit NOI", value: formatCurrency(exitNoi) },
    { label: "Exit Cap Rate", value: `${(exitCapRate * 100).toFixed(2)}%` },
    { label: "Implied Exit Value", value: formatCurrency(exitValue) },
    { label: "Loan Payoff", value: `(${formatCurrency(loanPayoff)})` },
    { label: "Disposition Fee", value: project.dispositionFee ? `(${formatCurrency(dispositionFeeAmount)}) — ${(safeNumber(project.dispositionFee) * 100).toFixed(1)}%` : "None" },
    { label: "Net Sale Proceeds to Equity", value: formatCurrency(netProceeds) },
  ];
  children.push(keyTermsTable(exitRows));
  children.push(spacer(8));

  // ── Section 6: Sensitivity Analysis ────────────────────────────────

  children.push(sectionHeading("Sensitivity Analysis — Exit Cap Rate"));
  children.push(
    bodyText("The following table shows projected equity multiple and IRR at various exit cap rates:"),
  );
  children.push(spacer(4));

  const capRateScenarios = [-0.01, -0.005, 0, 0.005, 0.01, 0.015, 0.02];
  const sensitivityRows = capRateScenarios.map((delta) => {
    const scenarioCapRate = exitCapRate + delta;
    if (scenarioCapRate <= 0) return null;
    const scenarioExitValue = exitNoi / scenarioCapRate;
    const scenarioNetProceeds = scenarioExitValue - loanPayoff - (scenarioExitValue * (project.dispositionFee ?? 0));
    const scenarioTotal = totalCashFlow + scenarioNetProceeds;
    const scenarioEM = totalEquityRaise > 0 ? scenarioTotal / totalEquityRaise : 0;

    const scenarioCF = [
      -totalEquityRaise,
      ...projections.map((p, idx) =>
        idx === projections.length - 1
          ? Math.max(0, p.cashFlowAfterDebt) + scenarioNetProceeds
          : Math.max(0, p.cashFlowAfterDebt),
      ),
    ];
    const scenarioIrr = calculateIRR(scenarioCF);

    return [
      `${(scenarioCapRate * 100).toFixed(2)}%`,
      formatCurrency(scenarioExitValue),
      `${scenarioEM.toFixed(2)}x`,
      `${(scenarioIrr * 100).toFixed(1)}%`,
    ];
  }).filter((r): r is string[] => r !== null);

  children.push(
    createTable(
      ["Exit Cap Rate", "Exit Value", "Equity Multiple", "IRR"],
      sensitivityRows,
      { columnWidths: [20, 30, 25, 25], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ── Section 7: Breakeven Analysis ──────────────────────────────────

  children.push(sectionHeading("Breakeven Analysis"));

  // Breakeven occupancy = (OpEx + Debt Service) / Gross Potential Income
  const yearOneGross = projections[0]?.grossRevenue ?? 0;
  const yearOneExpenses = projections[0]?.operatingExpenses ?? 0;
  const yearOneDebt = projections[0]?.debtService ?? 0;
  const breakEvenOccupancy = yearOneGross > 0 ? (yearOneExpenses + yearOneDebt) / yearOneGross : 0;

  const breakEvenRows: Array<{ label: string; value: string }> = [
    { label: "Year 1 Gross Potential Income", value: formatCurrency(yearOneGross) },
    { label: "Year 1 Operating Expenses", value: formatCurrency(yearOneExpenses) },
    { label: "Year 1 Debt Service", value: formatCurrency(yearOneDebt) },
    { label: "Breakeven Occupancy", value: `${(breakEvenOccupancy * 100).toFixed(1)}%` },
    { label: "Breakeven Assessment", value: breakEvenOccupancy < 0.85 ? "Favorable (<85%)" : breakEvenOccupancy < 0.90 ? "Acceptable (85-90%)" : "Elevated (>90%)" },
  ];
  children.push(keyTermsTable(breakEvenRows));
  children.push(spacer(8));

  // ── Footnotes ──────────────────────────────────────────────────────

  children.push(sectionHeading("Notes and Assumptions"));
  children.push(bodyText("1. Revenue projections assume straight-line rent growth from current NOI to pro forma NOI over the stabilization period, then annual growth at the stated rent growth rate."));
  children.push(bodyText(`2. Operating expenses are estimated at approximately ${(getExpenseRatio(project.propertyType) * 100).toFixed(0)}% of gross revenue (based on ${project.propertyType.replace(/_/g, " ").toLowerCase()} industry benchmarks), growing at the stated expense growth rate.`));
  children.push(bodyText("3. Debt service is calculated based on the stated loan terms. Interest-only periods are reflected where applicable."));
  children.push(bodyText("4. Exit value is calculated as the final year NOI divided by the exit cap rate (direct capitalization method)."));
  children.push(bodyText("5. IRR is calculated using the Newton-Raphson method on the projected cash flow stream."));
  children.push(bodyText("6. Waterfall distributions are applied to annual distributable cash flow. Capital event (sale) proceeds are distributed separately per the Operating Agreement."));
  children.push(bodyText("7. These projections do not account for income taxes, depreciation benefits, capital expenditure reserves, or property management fee deductions from NOI."));
  children.push(spacer(8));

  // ── Depreciation Schedule (Estimated) ──────────────────────────────

  children.push(sectionHeading("Depreciation Schedule (Estimated)"));

  const isResidential = project.propertyType?.toLowerCase().includes("residential") ||
    project.propertyType?.toLowerCase().includes("multifamily") ||
    project.propertyType?.toLowerCase().includes("apartment") ||
    project.propertyType?.toLowerCase().includes("student_housing") ||
    project.propertyType?.toLowerCase().includes("build_to_rent") ||
    project.propertyType?.toLowerCase().includes("senior_housing") ||
    project.propertyType?.toLowerCase().includes("mobile_home_park");
  const depreciationYears = isResidential ? 27.5 : 39;
  const landValue = purchasePrice * 0.20; // Estimate land at 20% of purchase price
  const depreciableBasis = purchasePrice - landValue;
  const annualDepreciation = depreciationYears > 0 ? depreciableBasis / depreciationYears : 0;
  const bonusDepreciationRate = project.bonusDepreciationPct != null ? safeNumber(project.bonusDepreciationPct) : 1.0; // Default 100% per The One Big Beautiful Bill Act (OBBBA) of July 2025 — restored for property acquired after January 19, 2025
  const bonusDepreciationYear1 = depreciableBasis * bonusDepreciationRate;

  children.push(bodyText(
    `Under 26 U.S.C. Section 168, the depreciable basis of the property (excluding land) is depreciated on a straight-line basis over ${depreciationYears} years (${isResidential ? "residential rental property" : "nonresidential real property"}).`,
  ));
  children.push(spacer(4));

  children.push(bulletPoint(`Purchase Price: ${formatCurrency(purchasePrice)}`));
  children.push(bulletPoint(`Estimated Land Value (20%): ${formatCurrency(landValue)}`));
  children.push(bulletPoint(`Depreciable Basis: ${formatCurrency(depreciableBasis)}`));
  children.push(bulletPoint(`Depreciation Period: ${depreciationYears} years (${isResidential ? "residential — 27.5 years" : "commercial — 39 years"})`));
  children.push(bulletPoint(`Annual Straight-Line Depreciation: ${formatCurrency(annualDepreciation)}`));
  children.push(spacer(4));

  children.push(bodyText("Bonus Depreciation (2026):", { bold: true }));
  children.push(bodyText(
    `Per 26 U.S.C. Section 168(k), as modified by The One Big Beautiful Bill Act (OBBBA) of July 2025, 100% bonus depreciation has been restored for qualifying property placed in service after January 19, 2025. The previous TCJA phase-down schedule no longer applies.`,
  ));
  children.push(bulletPoint(`Year 1 Bonus Depreciation (${(bonusDepreciationRate * 100).toFixed(0)}%): ${formatCurrency(bonusDepreciationYear1)}`));
  children.push(bulletPoint(`Remaining Basis After Bonus: ${formatCurrency(depreciableBasis - bonusDepreciationYear1)}`));
  children.push(spacer(4));

  if (purchasePrice > 1000000) {
    children.push(bodyText("Cost Segregation Study:", { bold: true }));
    children.push(bodyText(
      `For properties valued above $1,000,000, a cost segregation study is recommended. Cost segregation reclassifies building components (e.g., electrical, plumbing, flooring, site improvements) into shorter-lived asset categories (5, 7, or 15 years), accelerating depreciation deductions. For a property with a depreciable basis of ${formatCurrency(depreciableBasis)}, a cost segregation study may reclassify 15-30% of the basis into shorter-lived categories, significantly increasing early-year tax deductions. Investors should consult their tax advisors regarding the applicability and benefits of a cost segregation study for this investment.`,
    ));
    children.push(spacer(4));
  }

  children.push(bodyText(
    "NOTE: Depreciation estimates are for illustrative purposes only. Actual depreciation deductions depend on the taxpayer's individual circumstances, cost basis allocations determined by an independent appraisal, and applicable IRS rules. Investors should consult their own tax advisors.",
    { italic: true },
  ));

  return buildLegalDocument({
    title: "Pro Forma Financial Projections",
    headerRight: `Pro Forma — ${project.name}`,
    children,
  });
}

// ─── Compliance Checks ──────────────────────────────────────────────

export function runProFormaComplianceChecks(project: SyndicationProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  const purchasePrice = safeNumber(project.purchasePrice);
  const loanAmount = safeNumber(project.loanAmount);
  const totalEquityRaise = safeNumber(project.totalEquityRaise);
  const currentNoi = safeNumber(project.currentNoi);
  const proFormaNoi = safeNumber(project.proFormaNoi);
  const ltv = purchasePrice > 0 ? loanAmount / purchasePrice : 0;

  // DSCR check
  const interestRate = project.interestRate ?? 0;
  const loanTermYears = project.loanTermYears ?? 30;
  const annualDebt = calculateAnnualDebtService(
    loanAmount,
    interestRate,
    loanTermYears,
    project.interestOnly,
    project.ioTermMonths ?? null,
    1,
  );
  const dscr = annualDebt > 0 ? currentNoi / annualDebt : 0;

  checks.push({
    name: "Debt Service Coverage Ratio (DSCR)",
    regulation: "Prudent Lending Standards (>1.25x required)",
    category: "financial",
    passed: dscr >= 1.25,
    note: `DSCR: ${dscr.toFixed(2)}x — ${dscr >= 1.25 ? "meets minimum 1.25x requirement" : "below minimum 1.25x — refinancing risk"}`,
  });

  // LTV check
  checks.push({
    name: "Loan-to-Value Ratio (LTV)",
    regulation: "Prudent Lending Standards (60-75%)",
    category: "financial",
    passed: ltv <= 0.75,
    note: `LTV: ${(ltv * 100).toFixed(1)}% — ${ltv <= 0.75 ? "within standard range" : "exceeds standard 75% maximum"}`,
  });

  // NOI data present
  checks.push({
    name: "NOI Data Provided",
    regulation: "Pro Forma Standards",
    category: "financial",
    passed: currentNoi > 0 || proFormaNoi > 0,
    note: currentNoi > 0 || proFormaNoi > 0
      ? `Current NOI: ${formatCurrency(currentNoi)}, Pro Forma: ${formatCurrency(proFormaNoi)}`
      : "No NOI data — projections cannot be calculated",
  });

  // Exit cap rate reasonableness
  const exitCapRate = project.exitCapRate ?? 0;
  const goingInCapRate = purchasePrice > 0 ? currentNoi / purchasePrice : 0;

  checks.push({
    name: "Exit Cap Rate Reasonableness",
    regulation: "Underwriting Standards",
    category: "financial",
    passed: exitCapRate >= goingInCapRate,
    note: `Exit cap: ${(exitCapRate * 100).toFixed(2)}%, Going-in: ${(goingInCapRate * 100).toFixed(2)}% — ${exitCapRate >= goingInCapRate ? "conservative (exit >= going-in)" : "aggressive (exit < going-in) — cap rate compression assumed"}`,
  });

  // Breakeven occupancy
  const expRatioForChecks = getExpenseRatio(project.propertyType);
  const grossRevenue = currentNoi / Math.max(0.01, 1 - (project.vacancyRate ?? 0.05) - expRatioForChecks);
  const opEx = grossRevenue * expRatioForChecks;
  const breakEven = grossRevenue > 0 ? (opEx + annualDebt) / grossRevenue : 0;

  checks.push({
    name: "Breakeven Occupancy",
    regulation: "Underwriting Standards (<85%)",
    category: "financial",
    passed: breakEven < 0.85,
    note: `Breakeven: ${(breakEven * 100).toFixed(1)}% — ${breakEven < 0.85 ? "favorable" : breakEven < 0.90 ? "acceptable" : "elevated risk"}`,
  });

  // Hold period specified
  checks.push({
    name: "Hold Period Specified",
    regulation: "Projection Standards",
    category: "financial",
    passed: !!project.projectedHoldYears && project.projectedHoldYears > 0,
    note: project.projectedHoldYears
      ? `${project.projectedHoldYears}-year hold period`
      : "No hold period — defaulting to 5 years",
  });

  // Capital stack adds up
  const totalCost = purchasePrice + safeNumber(project.renovationBudget) + safeNumber(project.closingCosts);
  const totalSources = loanAmount + totalEquityRaise;
  const gapPercent = totalCost > 0 ? Math.abs(totalSources - totalCost) / totalCost : 0;

  checks.push({
    name: "Capital Stack Balance",
    regulation: "Sources = Uses",
    category: "financial",
    passed: gapPercent < 0.05,
    note: `Sources: ${formatCurrency(totalSources)}, Uses: ${formatCurrency(totalCost)} — ${gapPercent < 0.05 ? "balanced" : `${(gapPercent * 100).toFixed(1)}% gap`}`,
  });

  // IRR Plausibility check
  const holdYears = project.projectedHoldYears ?? 5;
  const rentGrowthRate = project.rentGrowthRate ?? 0.03;
  const expenseGrowthRate = project.expenseGrowthRate ?? 0.02;

  if (totalEquityRaise > 0 && proFormaNoi > 0) {
    // Build cash flow stream for IRR
    const netGrowthRate = rentGrowthRate - (expenseGrowthRate * expRatioForChecks);
    const irrFlows: number[] = [-totalEquityRaise];

    for (let y = 1; y <= holdYears; y++) {
      const yearNoi = proFormaNoi * Math.pow(1 + netGrowthRate, Math.max(0, y - 1));
      const yearDebt = calculateAnnualDebtService(
        loanAmount, interestRate, loanTermYears,
        project.interestOnly, project.ioTermMonths ?? null, y,
      );
      const yearCf = Math.max(0, yearNoi - yearDebt);

      if (y === holdYears) {
        // Add exit proceeds
        const exitNoi = yearNoi;
        const exitVal = exitCapRate > 0 ? exitNoi / exitCapRate : 0;
        const loanPayoff = calculateLoanBalance(
          loanAmount, interestRate, loanTermYears,
          project.interestOnly, project.ioTermMonths ?? null, holdYears,
        );
        const dispFee = exitVal * (project.dispositionFee ?? 0);
        const netProceeds = exitVal - loanPayoff - dispFee;
        irrFlows.push(yearCf + netProceeds);
      } else {
        irrFlows.push(yearCf);
      }
    }

    const estimatedIrr = calculateIRR(irrFlows);
    const irrPlausible = estimatedIrr >= -0.20 && estimatedIrr <= 1.00;

    checks.push({
      name: "IRR Plausibility",
      regulation: "Underwriting Best Practices",
      category: "financial",
      passed: irrPlausible,
      note: irrPlausible
        ? `Projected IRR: ${(estimatedIrr * 100).toFixed(1)}% — within plausible range (-20% to 100%)`
        : `Projected IRR: ${(estimatedIrr * 100).toFixed(1)}% — outside plausible range (-20% to 100%). Review assumptions for reasonableness.`,
    });
  }

  return checks;
}
