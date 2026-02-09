// ─────────────────────────────────────────────────────────────────────────────
// LendFlow Analysis Engine — Cash Flow / Bank Deposit Analysis
// 100% deterministic. Zero AI. Pure TypeScript math.
// ─────────────────────────────────────────────────────────────────────────────

export interface CashflowAnalysis {
  monthlyDeposits: Array<{ month: string; total: number; count: number }>;
  averageMonthlyDeposits: number;
  depositToIncomeRatio: number | null; // annual deposits / reported income
  nsfCount: number;
  overdraftCount: number;
  largeDeposits: Array<{ date: string; amount: number; description: string }>;
  regularPayments: Array<{ description: string; amount: number; frequency: string }>;
  cashflowTrend: "increasing" | "stable" | "declining";
  notes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function num(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    let cleaned = val.replace(/[$,\s]/g, "");
    // Handle accounting-style negatives: (1,234) → -1234
    const parenMatch = cleaned.match(/^\((.+)\)$/);
    if (parenMatch) {
      cleaned = "-" + parenMatch[1];
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Extract a month key (YYYY-MM) from a date string.
 * Handles common formats: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, etc.
 */
function extractMonthKey(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}`;
  }

  // Try MM/DD/YYYY or M/D/YYYY
  const usMatch = dateStr.match(/^(\d{1,2})[/-]\d{1,2}[/-](\d{4})$/);
  if (usMatch) {
    return `${usMatch[2]}-${usMatch[1].padStart(2, "0")}`;
  }

  // Try "Month YYYY" or "Mon YYYY"
  const monthNames: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
  };

  const wordMatch = dateStr.toLowerCase().match(/^(\w+)\s+(\d{4})$/);
  if (wordMatch && monthNames[wordMatch[1]]) {
    return `${wordMatch[2]}-${monthNames[wordMatch[1]]}`;
  }

  return null;
}

const LARGE_DEPOSIT_THRESHOLD = 5000;

/**
 * Check if a deposit description looks like payroll / regular income.
 */
function isPayroll(description: string): boolean {
  const lower = (description ?? "").toLowerCase();
  return /\b(payroll|direct dep|salary|wage|adp|paychex|gusto|intuit payroll|employer)\b/.test(lower);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main cashflow analysis
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeCashflow(params: {
  bankStatements: Array<any>;
  reportedIncome?: number;
}): CashflowAnalysis {
  const { bankStatements, reportedIncome } = params;
  const notes: string[] = [];

  // ── Aggregate deposits by month ────────────────────────────────────────────
  const monthMap: Record<string, { total: number; count: number }> = {};
  const allDeposits: Array<{ date: string; amount: number; description: string; month: string }> = [];
  let nsfCount = 0;
  let overdraftCount = 0;
  const regularPayments: Array<{ description: string; amount: number; frequency: string }> = [];

  for (const stmt of bankStatements) {
    // ── Process individual transactions ────────────────────────────────────
    const transactions: any[] =
      stmt.transactions ?? stmt.deposits ?? stmt.lineItems ?? [];

    for (const txn of transactions) {
      const amount = num(txn.amount ?? txn.credit ?? txn.depositAmount);
      const date = txn.date ?? txn.transactionDate ?? "";
      const desc = txn.description ?? txn.memo ?? txn.payee ?? "";
      const type = (txn.type ?? txn.transactionType ?? "").toLowerCase();

      // Detect NSFs
      if (
        type === "nsf" ||
        /\b(nsf|non.?sufficient|insufficient funds|returned item|returned check)\b/i.test(desc)
      ) {
        nsfCount++;
        continue;
      }

      // Detect overdrafts
      if (
        type === "overdraft" ||
        /\b(overdraft|od fee|od protection|od charge)\b/i.test(desc)
      ) {
        overdraftCount++;
        continue;
      }

      // Only count deposits (positive amounts or credit-type transactions)
      const isDeposit =
        amount > 0 &&
        (type === "" || type === "deposit" || type === "credit" || type === "ach credit" || type === "wire in");

      if (!isDeposit) continue;

      const monthKey = extractMonthKey(date);
      if (monthKey) {
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { total: 0, count: 0 };
        }
        monthMap[monthKey].total += amount;
        monthMap[monthKey].count++;
        allDeposits.push({ date, amount, description: desc, month: monthKey });
      }
    }

    // ── Use statement-level summaries if no transactions ───────────────────
    if (transactions.length === 0) {
      const totalDeposits = num(stmt.totalDeposits ?? stmt.depositsTotal ?? 0);
      const depositCount = num(stmt.depositCount ?? stmt.numberOfDeposits ?? 0);
      const period = stmt.statementPeriod ?? stmt.period ?? stmt.month ?? "";

      if (totalDeposits > 0) {
        const monthKey = extractMonthKey(period) ?? period;
        if (monthKey) {
          if (!monthMap[monthKey]) {
            monthMap[monthKey] = { total: 0, count: 0 };
          }
          monthMap[monthKey].total += totalDeposits;
          monthMap[monthKey].count += depositCount || 1;
        }
      }
    }

    // ── Statement-level NSF/OD counts (only if no transactions were scanned) ──
    if (transactions.length === 0) {
      nsfCount += num(stmt.nsfCount ?? stmt.nsfItems ?? 0);
      overdraftCount += num(stmt.overdraftCount ?? stmt.overdraftItems ?? 0);
    }

    // ── Regular payments detected at statement level ───────────────────────
    const detected =
      stmt.regularPaymentsDetected ?? stmt.regularPayments ?? stmt.recurringDebits ?? [];
    if (Array.isArray(detected)) {
      for (const pmt of detected) {
        const desc = pmt.description ?? pmt.payee ?? pmt.name ?? "Unknown";
        const amt = num(pmt.amount ?? pmt.monthlyAmount ?? pmt.averageAmount);
        const freq = pmt.frequency ?? "monthly";

        // Only add if we haven't already captured this payment
        const exists = regularPayments.some(
          (rp) => rp.description === desc && Math.abs(rp.amount - amt) < 1
        );
        if (!exists && amt > 0) {
          regularPayments.push({ description: desc, amount: amt, frequency: freq });
        }
      }
    }
  }

  // ── Build monthly deposits array (sorted chronologically) ──────────────────
  const monthlyDeposits = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));

  // ── Average monthly deposits ───────────────────────────────────────────────
  const totalDepositsAllMonths = monthlyDeposits.reduce((sum, m) => sum + m.total, 0);
  const numMonths = monthlyDeposits.length || 1;
  const averageMonthlyDeposits = Math.round((totalDepositsAllMonths / numMonths) * 100) / 100;

  // ── Deposit-to-income ratio ────────────────────────────────────────────────
  let depositToIncomeRatio: number | null = null;
  if (reportedIncome && reportedIncome > 0) {
    // Annualize deposits
    const annualDeposits = averageMonthlyDeposits * 12;
    depositToIncomeRatio = Math.round((annualDeposits / reportedIncome) * 100) / 100;

    if (depositToIncomeRatio > 1.5) {
      notes.push(
        `Deposit-to-income ratio is ${depositToIncomeRatio.toFixed(2)}x — ` +
        `deposits significantly exceed reported income. May indicate unreported income or non-income deposits.`
      );
    } else if (depositToIncomeRatio < 0.7) {
      notes.push(
        `Deposit-to-income ratio is ${depositToIncomeRatio.toFixed(2)}x — ` +
        `deposits are well below reported income. Income may be deposited elsewhere.`
      );
    }
  }

  // ── Large deposits (non-payroll over threshold) ────────────────────────────
  const largeDeposits = allDeposits
    .filter((d) => d.amount >= LARGE_DEPOSIT_THRESHOLD && !isPayroll(d.description))
    .sort((a, b) => b.amount - a.amount)
    .map((d) => ({
      date: d.date,
      amount: Math.round(d.amount * 100) / 100,
      description: d.description,
    }));

  if (largeDeposits.length > 0) {
    notes.push(
      `${largeDeposits.length} large non-payroll deposit(s) over $${LARGE_DEPOSIT_THRESHOLD.toLocaleString()} detected. ` +
      `These may require sourcing/explanation.`
    );
  }

  // ── Cash flow trend ────────────────────────────────────────────────────────
  let cashflowTrend: "increasing" | "stable" | "declining" = "stable";

  if (monthlyDeposits.length >= 4) {
    // Compare first half average to second half average
    const midpoint = Math.floor(monthlyDeposits.length / 2);
    const firstHalf = monthlyDeposits.slice(0, midpoint);
    const secondHalf = monthlyDeposits.slice(midpoint);

    const firstAvg = firstHalf.reduce((s, m) => s + m.total, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.total, 0) / secondHalf.length;

    if (firstAvg > 0) {
      const change = (secondAvg - firstAvg) / firstAvg;
      if (change > 0.05) {
        cashflowTrend = "increasing";
      } else if (change < -0.05) {
        cashflowTrend = "declining";
        notes.push(
          `Cash flow declining: first-half average $${Math.round(firstAvg).toLocaleString()}/mo ` +
          `vs. second-half $${Math.round(secondAvg).toLocaleString()}/mo.`
        );
      }
    }
  } else if (monthlyDeposits.length >= 2) {
    // With only 2-3 months, compare first and last
    const first = monthlyDeposits[0].total;
    const last = monthlyDeposits[monthlyDeposits.length - 1].total;
    if (first > 0) {
      const change = (last - first) / first;
      if (change > 0.1) cashflowTrend = "increasing";
      else if (change < -0.1) cashflowTrend = "declining";
    }
  }

  // ── NSF / Overdraft notes ──────────────────────────────────────────────────
  if (nsfCount > 0) {
    notes.push(`${nsfCount} NSF (non-sufficient funds) item(s) detected.`);
  }
  if (overdraftCount > 0) {
    notes.push(`${overdraftCount} overdraft occurrence(s) detected.`);
  }

  // ── Summary note ───────────────────────────────────────────────────────────
  if (monthlyDeposits.length > 0) {
    notes.push(
      `Analyzed ${monthlyDeposits.length} month(s) of bank deposits. ` +
      `Average: $${Math.round(averageMonthlyDeposits).toLocaleString()}/mo.`
    );
  } else {
    notes.push("No deposit data available from bank statements.");
  }

  return {
    monthlyDeposits,
    averageMonthlyDeposits,
    depositToIncomeRatio,
    nsfCount,
    overdraftCount,
    largeDeposits,
    regularPayments,
    cashflowTrend,
    notes,
  };
}
