// =============================================================================
// cross-document.ts
// Cross-document verification: compares data ACROSS different documents
// in the same deal. ZERO AI. Pure deterministic comparisons.
// =============================================================================

const ABSOLUTE_TOLERANCE = 1; // $1
const PERCENT_TOLERANCE = 0.02; // 2%
const WARNING_THRESHOLD = 0.05; // 5% — warn but don't fail
const CROSS_DOC_FAIL_THRESHOLD = 0.20; // 20% for loose comparisons
const CROSS_DOC_HARD_FAIL_THRESHOLD = 0.50; // 50% for bank-vs-income

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossDocCheck {
  description: string;
  doc1Type: string;
  doc1Field: string;
  doc1Value: number;
  doc2Type: string;
  doc2Field: string;
  doc2Value: number;
  difference: number;
  percentDiff: number;
  status: "pass" | "fail" | "warning";
}

export interface ExtractionInput {
  docType: string;
  data: any;
  year?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function get(obj: any, path: string): number {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return 0;
    // Handle array indexing like "scheduleC[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (!Array.isArray(current)) return 0;
      current = current[parseInt(arrayMatch[2], 10)];
    } else {
      current = current[part];
    }
  }
  const num = Number(current);
  return Number.isFinite(num) ? num : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcPercentDiff(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return 0;
  return Math.abs(a - b) / max;
}

function buildCheck(
  description: string,
  doc1Type: string,
  doc1Field: string,
  doc1Value: number,
  doc2Type: string,
  doc2Field: string,
  doc2Value: number,
  failThreshold: number = PERCENT_TOLERANCE,
  warnThreshold: number = WARNING_THRESHOLD
): CrossDocCheck {
  const difference = round2(Math.abs(doc1Value - doc2Value));
  const percentDiff = round2(calcPercentDiff(doc1Value, doc2Value));

  let status: "pass" | "fail" | "warning";
  if (difference <= ABSOLUTE_TOLERANCE) {
    status = "pass";
  } else if (percentDiff <= failThreshold) {
    status = "pass";
  } else if (percentDiff <= warnThreshold) {
    status = "warning";
  } else {
    status = "fail";
  }

  return {
    description,
    doc1Type,
    doc1Field,
    doc1Value: round2(doc1Value),
    doc2Type,
    doc2Field,
    doc2Value: round2(doc2Value),
    difference,
    percentDiff,
    status,
  };
}

/**
 * Find all extractions matching a given doc type (normalized).
 */
function findByType(extractions: ExtractionInput[], ...types: string[]): ExtractionInput[] {
  const normalizedTypes = types.map((t) => t.toUpperCase().replace(/[\s-]/g, "_"));
  return extractions.filter((e) => {
    const nt = e.docType.toUpperCase().replace(/[\s-]/g, "_");
    return normalizedTypes.includes(nt);
  });
}

function findFirst(extractions: ExtractionInput[], ...types: string[]): ExtractionInput | null {
  const results = findByType(extractions, ...types);
  return results.length > 0 ? results[0] : null;
}

// ---------------------------------------------------------------------------
// Cross-document check implementations
// ---------------------------------------------------------------------------

function checkW2vs1040(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const form1040 = findFirst(extractions, "FORM_1040", "1040", "TAX_RETURN_1040");
  const w2s = findByType(extractions, "W2", "W_2", "FORM_W2");

  if (!form1040 || w2s.length === 0) return checks;

  const w2Total = w2s.reduce((acc, w2) => {
    return acc + (get(w2.data, "wagesTips") || get(w2.data, "box1") || get(w2.data, "wages"));
  }, 0);

  const line1 = get(form1040.data, "income.wages_line1") || get(form1040.data, "wages_line1");

  if (w2Total > 0 && line1 > 0) {
    checks.push(
      buildCheck(
        "Sum of W-2 wages (box 1) should match 1040 Line 1 wages",
        "W-2",
        "wagesTips (sum)",
        w2Total,
        "FORM_1040",
        "income.wages_line1",
        line1,
        PERCENT_TOLERANCE,
        WARNING_THRESHOLD
      )
    );
  }

  return checks;
}

function checkScheduleCvsPnL(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const form1040 = findFirst(extractions, "FORM_1040", "1040", "TAX_RETURN_1040");
  const pnls = findByType(extractions, "PROFIT_AND_LOSS", "P&L", "PNL", "INCOME_STATEMENT");

  if (!form1040 || pnls.length === 0) return checks;

  const scheduleCs = Array.isArray(form1040.data.scheduleC)
    ? form1040.data.scheduleC
    : form1040.data.scheduleC
      ? [form1040.data.scheduleC]
      : [];

  if (scheduleCs.length === 0) return checks;

  // Compare first Schedule C with first P&L (common single-business case)
  const sc = scheduleCs[0];
  const pnl = pnls[0].data;

  const scGrossReceipts = get(sc, "grossReceipts");
  const pnlRevenue = get(pnl, "netRevenue") || get(pnl, "totalRevenue") || get(pnl, "revenue");

  if (scGrossReceipts > 0 && pnlRevenue > 0) {
    checks.push(
      buildCheck(
        "Schedule C gross receipts should match P&L revenue (same business)",
        "FORM_1040 (Schedule C)",
        "scheduleC.grossReceipts",
        scGrossReceipts,
        "PROFIT_AND_LOSS",
        "netRevenue",
        pnlRevenue,
        WARNING_THRESHOLD,
        0.10
      )
    );
  }

  const scNetProfit = get(sc, "netProfit");
  const pnlNetIncome = get(pnl, "netIncome");

  if (scNetProfit !== 0 && pnlNetIncome !== 0) {
    checks.push(
      buildCheck(
        "Schedule C net profit should be close to P&L net income",
        "FORM_1040 (Schedule C)",
        "scheduleC.netProfit",
        scNetProfit,
        "PROFIT_AND_LOSS",
        "netIncome",
        pnlNetIncome,
        WARNING_THRESHOLD,
        0.10
      )
    );
  }

  return checks;
}

function checkBankDepositsVsIncome(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const form1040 = findFirst(extractions, "FORM_1040", "1040", "TAX_RETURN_1040");
  const bankStatements = findByType(extractions, "BANK_STATEMENT", "BANK_STATEMENTS");

  if (!form1040 || bankStatements.length === 0) return checks;

  // Annualize bank deposits
  const totalDeposits = bankStatements.reduce((acc, bs) => {
    const dep = get(bs.data, "summary.totalDeposits") || get(bs.data, "totalDeposits");
    return acc + dep;
  }, 0);

  const months = bankStatements.length;
  if (months === 0 || totalDeposits === 0) return checks;

  const annualizedDeposits = (totalDeposits / months) * 12;
  const totalIncome = get(form1040.data, "income.totalIncome_line9") || get(form1040.data, "totalIncome_line9");

  if (totalIncome > 0) {
    checks.push(
      buildCheck(
        `Annualized bank deposits (${months} months extrapolated to 12) should be in ballpark of 1040 total income`,
        "BANK_STATEMENT",
        "annualizedDeposits",
        round2(annualizedDeposits),
        "FORM_1040",
        "income.totalIncome_line9",
        totalIncome,
        CROSS_DOC_FAIL_THRESHOLD,
        CROSS_DOC_HARD_FAIL_THRESHOLD
      )
    );
  }

  return checks;
}

function checkScheduleEvsRentRoll(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const form1040 = findFirst(extractions, "FORM_1040", "1040", "TAX_RETURN_1040");
  const rentRolls = findByType(extractions, "RENT_ROLL");

  if (!form1040 || rentRolls.length === 0) return checks;

  const scheduleEs = Array.isArray(form1040.data.scheduleE)
    ? form1040.data.scheduleE
    : form1040.data.scheduleE
      ? [form1040.data.scheduleE]
      : [];

  if (scheduleEs.length === 0) return checks;

  // Sum rents from all Schedule E properties
  const seProperties = scheduleEs[0].properties ?? scheduleEs;
  const totalRentsScheduleE = (Array.isArray(seProperties) ? seProperties : []).reduce(
    (acc: number, p: any) => acc + get(p, "rentsReceived"),
    0
  );

  const rentRoll = rentRolls[0].data;
  const totalAnnualRent = get(rentRoll, "summary.totalAnnualRent") || get(rentRoll, "totalAnnualRent");

  if (totalRentsScheduleE > 0 && totalAnnualRent > 0) {
    checks.push(
      buildCheck(
        "Schedule E total rents received should match Rent Roll total annual rent",
        "FORM_1040 (Schedule E)",
        "scheduleE.rentsReceived",
        totalRentsScheduleE,
        "RENT_ROLL",
        "summary.totalAnnualRent",
        totalAnnualRent,
        WARNING_THRESHOLD,
        0.10
      )
    );
  }

  return checks;
}

function check1120SOfficerCompVsW2(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const form1120S = findFirst(extractions, "FORM_1120S", "1120S", "1120_S", "TAX_RETURN_1120S");
  const w2s = findByType(extractions, "W2", "W_2", "FORM_W2");

  if (!form1120S || w2s.length === 0) return checks;

  const officerComp =
    get(form1120S.data, "officerCompensation_line7") ||
    get(form1120S.data, "deductions.officerCompensation_line7") ||
    get(form1120S.data, "officerCompensation");

  const w2Total = w2s.reduce((acc, w2) => {
    return acc + (get(w2.data, "wagesTips") || get(w2.data, "box1") || get(w2.data, "wages"));
  }, 0);

  if (officerComp > 0 && w2Total > 0) {
    checks.push(
      buildCheck(
        "1120S officer compensation (line 7) should match total W-2 wages for that entity",
        "FORM_1120S",
        "officerCompensation_line7",
        officerComp,
        "W-2",
        "wagesTips (sum)",
        w2Total,
        PERCENT_TOLERANCE,
        WARNING_THRESHOLD
      )
    );
  }

  return checks;
}

function checkK1vsScheduleE(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const k1s = findByType(extractions, "K1", "K_1", "SCHEDULE_K1", "FORM_K1");
  const form1040 = findFirst(extractions, "FORM_1040", "1040", "TAX_RETURN_1040");

  if (k1s.length === 0 || !form1040) return checks;

  // Sum K-1 ordinary income
  const k1OrdinaryIncome = k1s.reduce((acc, k1) => {
    return acc + (get(k1.data, "ordinaryIncome") || get(k1.data, "ordinaryBusinessIncome") || get(k1.data, "box1"));
  }, 0);

  // Look for Schedule E Part II reporting
  const scheduleE = form1040.data.scheduleE;
  if (!scheduleE) return checks;

  const partII = scheduleE.partII ?? scheduleE;
  const sePartnershipIncome =
    get(partII, "totalPartnershipIncome") ||
    get(partII, "totalSCorpIncome") ||
    get(partII, "partnershipIncome");

  if (k1OrdinaryIncome !== 0 && sePartnershipIncome !== 0) {
    checks.push(
      buildCheck(
        "K-1 ordinary income should match Schedule E Part II reporting",
        "K-1",
        "ordinaryIncome (sum)",
        k1OrdinaryIncome,
        "FORM_1040 (Schedule E Part II)",
        "partnershipIncome",
        sePartnershipIncome,
        PERCENT_TOLERANCE,
        WARNING_THRESHOLD
      )
    );
  }

  return checks;
}

function checkBalanceSheetEquityVsPnL(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const balanceSheets = findByType(extractions, "BALANCE_SHEET");
  const pnls = findByType(extractions, "PROFIT_AND_LOSS", "P&L", "PNL", "INCOME_STATEMENT");

  if (balanceSheets.length === 0 || pnls.length === 0) return checks;

  const bs = balanceSheets[0].data;
  const pnl = pnls[0].data;

  // Current retained earnings minus prior retained earnings should approximate net income
  const currentRetainedEarnings = get(bs, "retainedEarnings") || get(bs, "retainedEarningsCurrent");
  const priorRetainedEarnings = get(bs, "priorRetainedEarnings") || get(bs, "retainedEarningsPrior");
  const netIncome = get(pnl, "netIncome");

  if (currentRetainedEarnings !== 0 && priorRetainedEarnings !== 0 && netIncome !== 0) {
    const equityChange = currentRetainedEarnings - priorRetainedEarnings;
    checks.push(
      buildCheck(
        "Retained earnings change on balance sheet should approximate P&L net income (same period)",
        "BALANCE_SHEET",
        "retainedEarnings (change)",
        equityChange,
        "PROFIT_AND_LOSS",
        "netIncome",
        netIncome,
        WARNING_THRESHOLD,
        0.15
      )
    );
  }

  return checks;
}

function checkBankStatementChains(extractions: ExtractionInput[]): CrossDocCheck[] {
  const checks: CrossDocCheck[] = [];

  const bankStatements = findByType(extractions, "BANK_STATEMENT", "BANK_STATEMENTS");
  if (bankStatements.length < 2) return checks;

  // Sort by year/month or by statement period if available
  const sorted = [...bankStatements].sort((a, b) => {
    const aDate = getStatementDate(a);
    const bDate = getStatementDate(b);
    return aDate - bDate;
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i].data;
    const next = sorted[i + 1].data;

    const currentEnding =
      get(current, "summary.endingBalance") || get(current, "endingBalance");
    const nextBeginning =
      get(next, "summary.beginningBalance") || get(next, "beginningBalance");

    if (currentEnding !== 0 && nextBeginning !== 0) {
      const periodLabel = getStatementLabel(sorted[i]);
      const nextPeriodLabel = getStatementLabel(sorted[i + 1]);

      checks.push(
        buildCheck(
          `Bank statement chain: ${periodLabel} ending balance should equal ${nextPeriodLabel} beginning balance`,
          `BANK_STATEMENT (${periodLabel})`,
          "summary.endingBalance",
          currentEnding,
          `BANK_STATEMENT (${nextPeriodLabel})`,
          "summary.beginningBalance",
          nextBeginning,
          0, // must be exact (within $1 tolerance from buildCheck)
          0.001 // essentially no warning band — this must match
        )
      );
    }
  }

  return checks;
}

/**
 * Extract a sortable date number from a bank statement extraction.
 */
function getStatementDate(extraction: ExtractionInput): number {
  const d = extraction.data;
  const period = d.statementPeriod ?? d.period ?? d.summary?.period ?? {};
  const dateStr = period.endDate ?? period.end ?? d.endDate ?? d.statementDate ?? "";

  if (dateStr) {
    const ts = Date.parse(dateStr);
    if (!isNaN(ts)) return ts;
  }

  // Fall back to year + month fields
  const year = extraction.year ?? get(d, "year") ?? 0;
  const month = get(d, "month") ?? get(d, "summary.month") ?? 0;
  return year * 100 + month;
}

function getStatementLabel(extraction: ExtractionInput): string {
  const d = extraction.data;
  const period = d.statementPeriod ?? d.period ?? d.summary?.period ?? {};
  if (period.startDate && period.endDate) return `${period.startDate} to ${period.endDate}`;
  const month = get(d, "month") || get(d, "summary.month");
  const year = extraction.year || get(d, "year");
  if (month && year) return `${year}-${String(month).padStart(2, "0")}`;
  return "unknown period";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runCrossDocChecks(
  extractions: Array<{ docType: string; data: any; year?: number }>
): CrossDocCheck[] {
  if (!extractions || extractions.length === 0) return [];

  // Filter out any extractions with null/undefined data
  const valid = extractions.filter((e) => e.data != null);
  if (valid.length === 0) return [];

  const checks: CrossDocCheck[] = [];

  checks.push(...checkW2vs1040(valid));
  checks.push(...checkScheduleCvsPnL(valid));
  checks.push(...checkBankDepositsVsIncome(valid));
  checks.push(...checkScheduleEvsRentRoll(valid));
  checks.push(...check1120SOfficerCompVsW2(valid));
  checks.push(...checkK1vsScheduleE(valid));
  checks.push(...checkBalanceSheetEquityVsPnL(valid));
  checks.push(...checkBankStatementChains(valid));

  return checks;
}
