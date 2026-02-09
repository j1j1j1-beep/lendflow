// ─────────────────────────────────────────────────────────────────────────────
// LendFlow Analysis Engine — Reserves & Liquidity Analysis
// 100% deterministic. Zero AI. Pure TypeScript math.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiquidityAnalysis {
  totalLiquidAssets: number;
  monthsOfReserves: number;
  averageDailyBalance: number;
  minimumBalance: number;
  currentRatio: number | null; // current assets / current liabilities
  quickRatio: number | null; // (current assets - inventory) / current liabilities
  debtToEquity: number | null; // total liabilities / total equity
  rating: "strong" | "adequate" | "weak" | "insufficient";
  notes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function num(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[$,\s]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Extract ending balance from a bank statement extraction.
 */
function getEndingBalance(statement: any): number {
  return num(
    statement.endingBalance ??
    statement.closingBalance ??
    statement.balanceEnd ??
    statement.endBalance ??
    0
  );
}

/**
 * Extract average daily balance from a bank statement extraction.
 */
function getAverageBalance(statement: any): number {
  return num(
    statement.averageDailyBalance ??
    statement.avgDailyBalance ??
    statement.averageBalance ??
    0
  );
}

/**
 * Extract minimum balance from a bank statement extraction.
 */
function getMinBalance(statement: any): number {
  return num(
    statement.minimumBalance ??
    statement.minBalance ??
    statement.lowestBalance ??
    0
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main liquidity analysis
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeLiquidity(params: {
  bankStatementData?: Array<any>;
  balanceSheetData?: any;
  monthlyDebtService: number;
}): LiquidityAnalysis {
  const { bankStatementData, balanceSheetData, monthlyDebtService } = params;
  const notes: string[] = [];

  // ── Bank statement analysis ────────────────────────────────────────────────
  let totalEndingBalances = 0;
  let totalAverageBalance = 0;
  let globalMinBalance = Infinity;
  let statementsWithAvg = 0;
  let statementsWithMin = 0;

  if (bankStatementData && Array.isArray(bankStatementData) && bankStatementData.length > 0) {
    // Group by account to avoid double-counting the same account across months.
    // Use the MOST RECENT ending balance per account.
    const accountBalances: Record<string, { endingBalance: number; period: string }> = {};

    for (const stmt of bankStatementData) {
      const accountId =
        stmt.accountNumber ??
        stmt.accountId ??
        stmt.account ??
        `account_${bankStatementData.indexOf(stmt)}`;

      const endBal = getEndingBalance(stmt);
      const period = stmt.statementPeriod ?? stmt.period ?? stmt.month ?? "";

      // Keep the most recent statement per account (lexicographic sort on period works for YYYY-MM)
      if (!accountBalances[accountId] || period > accountBalances[accountId].period) {
        accountBalances[accountId] = { endingBalance: endBal, period };
      }

      // Aggregate average daily balance across all statements
      const avgBal = getAverageBalance(stmt);
      if (avgBal > 0) {
        totalAverageBalance += avgBal;
        statementsWithAvg++;
      }

      // Track global minimum
      const minBal = getMinBalance(stmt);
      if (minBal > 0 || (minBal < 0 && statementsWithMin === 0)) {
        // Consider negatives too — that's an overdraft
        if (minBal < globalMinBalance) {
          globalMinBalance = minBal;
        }
        statementsWithMin++;
      }
    }

    // Sum most recent ending balances per account
    for (const acct of Object.values(accountBalances)) {
      totalEndingBalances += acct.endingBalance;
    }

    if (Object.keys(accountBalances).length > 1) {
      notes.push(`${Object.keys(accountBalances).length} bank accounts analyzed.`);
    }
  }

  // Fix Infinity if no min found
  if (!Number.isFinite(globalMinBalance)) {
    globalMinBalance = 0;
  }

  // Average daily balance: mean across all statement periods
  const averageDailyBalance =
    statementsWithAvg > 0
      ? Math.round((totalAverageBalance / statementsWithAvg) * 100) / 100
      : 0;

  const minimumBalance = Math.round(globalMinBalance * 100) / 100;

  // ── Balance sheet analysis ─────────────────────────────────────────────────
  let bsCash = 0;
  let currentAssets = 0;
  let currentLiabilities = 0;
  let inventory = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let currentRatio: number | null = null;
  let quickRatio: number | null = null;
  let debtToEquity: number | null = null;

  if (balanceSheetData) {
    bsCash = num(
      balanceSheetData.cash ??
      balanceSheetData.cashAndEquivalents ??
      balanceSheetData.cashAndCashEquivalents ??
      0
    );

    currentAssets = num(
      balanceSheetData.totalCurrentAssets ??
      balanceSheetData.currentAssets ??
      0
    );

    currentLiabilities = num(
      balanceSheetData.totalCurrentLiabilities ??
      balanceSheetData.currentLiabilities ??
      0
    );

    inventory = num(balanceSheetData.inventory ?? 0);

    totalLiabilities = num(
      balanceSheetData.totalLiabilities ??
      balanceSheetData.liabilities ??
      0
    );

    totalEquity = num(
      balanceSheetData.totalEquity ??
      balanceSheetData.equity ??
      balanceSheetData.ownersEquity ??
      balanceSheetData.stockholdersEquity ??
      0
    );

    // Current ratio
    if (currentLiabilities > 0 && currentAssets > 0) {
      currentRatio = Math.round((currentAssets / currentLiabilities) * 100) / 100;
    }

    // Quick ratio (acid test)
    if (currentLiabilities > 0 && currentAssets > 0) {
      quickRatio = Math.round(((currentAssets - inventory) / currentLiabilities) * 100) / 100;
    }

    // Debt to equity — compute even when equity is negative (signals insolvency)
    if (totalEquity !== 0 && totalLiabilities > 0) {
      debtToEquity = Math.round((totalLiabilities / totalEquity) * 100) / 100;
    }

    if (currentRatio !== null) {
      notes.push(`Current ratio: ${currentRatio.toFixed(2)}, Quick ratio: ${(quickRatio ?? 0).toFixed(2)}.`);
    }
    if (debtToEquity !== null) {
      notes.push(`Debt-to-equity: ${debtToEquity.toFixed(2)}.`);
    }
  }

  // ── Total liquid assets ────────────────────────────────────────────────────
  // Use the greater of bank ending balances or balance sheet cash (to avoid double-counting)
  const totalLiquidAssets = Math.max(totalEndingBalances, bsCash);

  if (totalEndingBalances > 0 && bsCash > 0 && Math.abs(totalEndingBalances - bsCash) > 1000) {
    notes.push(
      `Bank ending balances ($${Math.round(totalEndingBalances).toLocaleString()}) and balance sheet cash ` +
      `($${Math.round(bsCash).toLocaleString()}) differ. Using the higher figure.`
    );
  }

  // ── Months of reserves ─────────────────────────────────────────────────────
  let monthsOfReserves = 0;
  if (monthlyDebtService > 0) {
    monthsOfReserves = Math.round((totalLiquidAssets / monthlyDebtService) * 100) / 100;
  } else if (totalLiquidAssets > 0) {
    // No debt service — reserves are effectively unlimited, but we'll note it
    monthsOfReserves = 999; // Sentinel for "unlimited"
    notes.push("No monthly debt service provided. Months of reserves not bounded.");
  }

  // ── Rating ─────────────────────────────────────────────────────────────────
  let rating: LiquidityAnalysis["rating"];

  if (monthsOfReserves >= 12) {
    rating = "strong";
  } else if (monthsOfReserves >= 6) {
    rating = "adequate";
  } else if (monthsOfReserves >= 3) {
    rating = "weak";
    notes.push("Reserves cover 3-6 months. Borrower has limited cushion.");
  } else {
    rating = "insufficient";
    notes.push("Less than 3 months of reserves. Significant liquidity risk.");
  }

  // ── Additional warnings ────────────────────────────────────────────────────
  if (minimumBalance < 0) {
    notes.push(`Account went negative (min balance: $${minimumBalance.toLocaleString()}). Possible overdraft.`);
  }

  if (averageDailyBalance > 0 && totalEndingBalances > 0) {
    const balanceVariation = Math.abs(totalEndingBalances - averageDailyBalance) / averageDailyBalance;
    if (balanceVariation > 0.5) {
      notes.push("Significant variation between average daily balance and ending balance — cash flow may be lumpy.");
    }
  }

  if (!bankStatementData || (Array.isArray(bankStatementData) && bankStatementData.length === 0)) {
    notes.push("No bank statements provided. Liquidity analysis is based solely on balance sheet data.");
  }

  if (!balanceSheetData && (!bankStatementData || bankStatementData.length === 0)) {
    notes.push("No bank statements or balance sheet provided. Liquidity cannot be assessed.");
  }

  return {
    totalLiquidAssets,
    monthsOfReserves: monthsOfReserves === 999 ? monthsOfReserves : monthsOfReserves,
    averageDailyBalance,
    minimumBalance,
    currentRatio,
    quickRatio,
    debtToEquity,
    rating,
    notes,
  };
}
