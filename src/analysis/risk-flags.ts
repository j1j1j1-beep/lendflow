// ─────────────────────────────────────────────────────────────────────────────
// OpenShut Analysis Engine — Risk Flag Detection
// 100% deterministic. Zero AI. Pure TypeScript math.
// ─────────────────────────────────────────────────────────────────────────────

export interface RiskFlag {
  severity: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function num(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  return 0;
}

function flag(
  severity: RiskFlag["severity"],
  category: string,
  title: string,
  description: string,
  recommendation: string
): RiskFlag {
  return { severity, category, title, description, recommendation };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main risk flag detection
// ─────────────────────────────────────────────────────────────────────────────

export function detectRiskFlags(params: {
  incomeAnalysis: any;
  dscrAnalysis: any;
  dtiAnalysis: any;
  liquidityAnalysis: any;
  cashflowAnalysis: any;
  businessAnalysis: any | null;
  extractions: Array<{ docType: string; data: any; year?: number }>;
}): RiskFlag[] {
  const {
    incomeAnalysis,
    dscrAnalysis,
    dtiAnalysis,
    liquidityAnalysis,
    cashflowAnalysis,
    businessAnalysis,
    extractions,
  } = params;

  const flags: RiskFlag[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH SEVERITY FLAGS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── DSCR < 1.0 ─────────────────────────────────────────────────────────────
  const globalDscr = num(dscrAnalysis?.globalDscr);
  if (dscrAnalysis?.globalDscr !== null && globalDscr < 1.0) {
    flags.push(
      flag(
        "high",
        "debt_service",
        "DSCR Below 1.0",
        `Global DSCR is ${globalDscr.toFixed(2)}. Income does not cover debt obligations.`,
        "Loan may require additional collateral, guarantor, or restructuring to achieve positive coverage."
      )
    );
  }

  // ── DTI back-end > 50% ─────────────────────────────────────────────────────
  const backEndDti = num(dtiAnalysis?.backEndDti);
  if (dtiAnalysis?.backEndDti !== null && backEndDti > 0.50) {
    flags.push(
      flag(
        "high",
        "debt_to_income",
        "Excessive Debt-to-Income",
        `Back-end DTI is ${(backEndDti * 100).toFixed(1)}%, exceeding the 50% maximum threshold.`,
        "Borrower may need to reduce existing debt or provide additional income documentation."
      )
    );
  }

  // ── NSF count > 3 ──────────────────────────────────────────────────────────
  const nsfCount = num(cashflowAnalysis?.nsfCount);
  if (nsfCount > 3) {
    flags.push(
      flag(
        "high",
        "cash_management",
        "Frequent NSF Items",
        `${nsfCount} NSF (non-sufficient funds) items detected in bank statements.`,
        "Request explanation for NSFs. Pattern suggests cash flow management issues."
      )
    );
  }

  // ── Declining income > 20% ─────────────────────────────────────────────────
  const trendPercent = num(incomeAnalysis?.trendPercent);
  if (incomeAnalysis?.trend === "declining" && trendPercent < -0.20) {
    flags.push(
      flag(
        "high",
        "income_stability",
        "Significant Income Decline",
        `Income declined ${Math.abs(Math.round(trendPercent * 100))}% year-over-year.`,
        "Request explanation for income decline. Consider using the lower year for qualification."
      )
    );
  }

  // ── Less than 3 months reserves ────────────────────────────────────────────
  const monthsOfReserves = num(liquidityAnalysis?.monthsOfReserves);
  if (liquidityAnalysis && monthsOfReserves < 3) {
    flags.push(
      flag(
        "high",
        "liquidity",
        "Insufficient Reserves",
        `Only ${monthsOfReserves.toFixed(1)} months of reserves available (minimum 3 recommended).`,
        "Borrower should demonstrate additional liquid assets or reduce proposed loan amount."
      )
    );
  }

  // ── Balance sheet doesn't balance ──────────────────────────────────────────
  for (const extraction of extractions) {
    const type = extraction.docType.toLowerCase().replace(/[\s\-_]/g, "");
    if (type === "balancesheet" || type === "bs") {
      const d = extraction.data;
      const totalAssets = num(d.totalAssets ?? d.assets);
      const totalLiab = num(d.totalLiabilities ?? d.liabilities);
      const totalEquity = num(d.totalEquity ?? d.equity ?? d.ownersEquity ?? d.stockholdersEquity);

      if (totalAssets > 0 && (totalLiab + totalEquity) > 0) {
        const diff = Math.abs(totalAssets - (totalLiab + totalEquity));
        // Allow a small tolerance (rounding)
        if (diff > Math.max(1, totalAssets * 0.001)) {
          flags.push(
            flag(
              "high",
              "data_integrity",
              "Balance Sheet Imbalance",
              `Assets ($${Math.round(totalAssets).toLocaleString()}) do not equal ` +
              `Liabilities + Equity ($${Math.round(totalLiab + totalEquity).toLocaleString()}). ` +
              `Difference: $${Math.round(diff).toLocaleString()}.`,
              "Verify balance sheet data. This may indicate extraction error or incomplete financials."
            )
          );
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIUM SEVERITY FLAGS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── DSCR 1.0-1.25 ──────────────────────────────────────────────────────────
  if (dscrAnalysis?.globalDscr !== null && globalDscr >= 1.0 && globalDscr < 1.25) {
    flags.push(
      flag(
        "medium",
        "debt_service",
        "Marginal DSCR",
        `Global DSCR is ${globalDscr.toFixed(2)}. Coverage is positive but thin.`,
        "Consider compensating factors: strong reserves, stable employment, additional collateral."
      )
    );
  }

  // ── DTI back-end 43-50% ────────────────────────────────────────────────────
  if (dtiAnalysis?.backEndDti !== null && backEndDti > 0.43 && backEndDti <= 0.50) {
    flags.push(
      flag(
        "medium",
        "debt_to_income",
        "Elevated Debt-to-Income",
        `Back-end DTI is ${(backEndDti * 100).toFixed(1)}%, between 43-50%.`,
        "May require compensating factors for conventional approval. FHA may be more lenient."
      )
    );
  }

  // ── 1-3 NSFs ───────────────────────────────────────────────────────────────
  if (nsfCount >= 1 && nsfCount <= 3) {
    flags.push(
      flag(
        "medium",
        "cash_management",
        "NSF Items Present",
        `${nsfCount} NSF item(s) detected in bank statements.`,
        "Request letter of explanation for each NSF event."
      )
    );
  }

  // ── Large unexplained deposits ─────────────────────────────────────────────
  const largeDeposits = cashflowAnalysis?.largeDeposits ?? [];
  if (Array.isArray(largeDeposits) && largeDeposits.length > 0) {
    const totalLarge = largeDeposits.reduce(
      (s: number, d: any) => s + num(d.amount),
      0
    );
    flags.push(
      flag(
        "medium",
        "cash_management",
        "Large Unexplained Deposits",
        `${largeDeposits.length} large non-payroll deposit(s) totaling $${Math.round(totalLarge).toLocaleString()} ` +
        `detected. These may require sourcing.`,
        "Request documentation for the source of each large deposit (gift letter, asset sale docs, etc.)."
      )
    );
  }

  // ── Declining revenue trend (business) ─────────────────────────────────────
  if (businessAnalysis?.revenueTrend === "declining") {
    const bTrend = num(businessAnalysis.revenueTrendPercent);
    flags.push(
      flag(
        "medium",
        "business_performance",
        "Declining Business Revenue",
        `Business revenue declined ${Math.abs(Math.round(bTrend * 100))}% year-over-year.`,
        "Assess whether decline is industry-wide or company-specific. Request current-year financials."
      )
    );
  }

  // ── High expense ratio (>85%) ──────────────────────────────────────────────
  if (businessAnalysis && num(businessAnalysis.expenseRatio) > 0.85) {
    flags.push(
      flag(
        "medium",
        "business_performance",
        "High Expense Ratio",
        `Business expense ratio is ${(num(businessAnalysis.expenseRatio) * 100).toFixed(1)}%. Profit margins are thin.`,
        "Small revenue decreases could eliminate profitability. Assess cost structure and trends."
      )
    );
  }

  // ── 3-6 months reserves ────────────────────────────────────────────────────
  if (liquidityAnalysis && monthsOfReserves >= 3 && monthsOfReserves < 6) {
    flags.push(
      flag(
        "medium",
        "liquidity",
        "Limited Reserves",
        `${monthsOfReserves.toFixed(1)} months of reserves. Adequate but limited cushion.`,
        "Consider whether borrower has additional undisclosed assets. 6+ months preferred."
      )
    );
  }

  // ── Deposit-to-income ratio outliers ───────────────────────────────────────
  const dtiRatio = cashflowAnalysis?.depositToIncomeRatio;
  if (dtiRatio !== null && dtiRatio !== undefined) {
    if (num(dtiRatio) > 1.5) {
      flags.push(
        flag(
          "medium",
          "income_verification",
          "Deposits Exceed Reported Income",
          `Bank deposits are ${num(dtiRatio).toFixed(2)}x reported income. ` +
          `May indicate unreported income or non-income deposits.`,
          "Request explanation for deposit sources exceeding reported income."
        )
      );
    } else if (num(dtiRatio) < 0.7 && num(dtiRatio) > 0) {
      flags.push(
        flag(
          "medium",
          "income_verification",
          "Deposits Below Reported Income",
          `Bank deposits are only ${num(dtiRatio).toFixed(2)}x reported income. ` +
          `Income may be deposited elsewhere.`,
          "Request all bank accounts. Verify income is being deposited in disclosed accounts."
        )
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOW SEVERITY FLAGS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Self-employed < 2 years history ────────────────────────────────────────
  const seIncome = num(incomeAnalysis?.selfEmployedIncome);
  if (seIncome > 0) {
    const seYears = new Set<number>();
    for (const src of incomeAnalysis?.sources ?? []) {
      if (src.type === "self_employment") {
        seYears.add(src.year);
      }
    }
    if (seYears.size < 2) {
      flags.push(
        flag(
          "low",
          "income_stability",
          "Limited Self-Employment History",
          "Less than 2 years of self-employment documentation provided.",
          "Most programs require 2 years of self-employment. Verify business start date."
        )
      );
    }
  }

  // ── Multiple businesses ────────────────────────────────────────────────────
  if (businessAnalysis) {
    // Check if there are multiple business documents in the same year
    const businessDocsByYear: Record<number, number> = {};
    for (const ext of extractions) {
      const type = ext.docType.toLowerCase().replace(/[\s\-_]/g, "");
      const businessTypes = ["schedulec", "schedc", "1120", "form1120", "1120s", "form1120s", "1065", "form1065"];
      if (businessTypes.includes(type)) {
        const yr = ext.year ?? (num(ext.data?.taxYear ?? ext.data?.year) || new Date().getFullYear());
        businessDocsByYear[yr] = (businessDocsByYear[yr] ?? 0) + 1;
      }
    }

    const maxEntities = Math.max(0, ...Object.values(businessDocsByYear));
    if (maxEntities > 1) {
      flags.push(
        flag(
          "low",
          "complexity",
          "Multiple Business Entities",
          `Borrower has ${maxEntities} business entities. Adds complexity to income analysis.`,
          "Ensure all entities are accounted for and intercompany transactions are understood."
        )
      );
    }
  }

  // ── Seasonal income patterns ───────────────────────────────────────────────
  const monthlyDeposits = cashflowAnalysis?.monthlyDeposits ?? [];
  if (Array.isArray(monthlyDeposits) && monthlyDeposits.length >= 6) {
    const amounts = monthlyDeposits.map((m: any) => num(m.total)).filter((a: number) => a > 0);
    if (amounts.length >= 6) {
      const avg = amounts.reduce((s: number, a: number) => s + a, 0) / amounts.length;
      if (avg > 0) {
        // Coefficient of variation
        const variance =
          amounts.reduce((s: number, a: number) => s + Math.pow(a - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / avg;

        if (cv > 0.35) {
          flags.push(
            flag(
              "low",
              "income_stability",
              "Seasonal Income Pattern",
              `Monthly deposit variation is high (CV: ${(cv * 100).toFixed(0)}%). Income may be seasonal.`,
              "Evaluate whether income pattern supports consistent debt service year-round."
            )
          );
        }
      }
    }
  }

  // ── First-time landlord ────────────────────────────────────────────────────
  const rentalSources = (incomeAnalysis?.sources ?? []).filter(
    (s: any) => s.type === "rental"
  );
  if (rentalSources.length > 0) {
    const rentalYears = new Set(rentalSources.map((s: any) => s.year));
    if (rentalYears.size === 1) {
      flags.push(
        flag(
          "low",
          "experience",
          "First-Time Landlord",
          "Only 1 year of rental income (Schedule E) history. Borrower may be a new landlord.",
          "Verify landlord experience. Consider using 75% of rental income for qualification."
        )
      );
    }
  }

  // ── Declining income 5-20% (low severity, not yet high) ───────────────────
  if (
    incomeAnalysis?.trend === "declining" &&
    trendPercent >= -0.20 &&
    trendPercent < -0.05
  ) {
    flags.push(
      flag(
        "low",
        "income_stability",
        "Modest Income Decline",
        `Income declined ${Math.abs(Math.round(trendPercent * 100))}% year-over-year.`,
        "Monitor for continued decline. May need to use lower year if trend continues."
      )
    );
  }

  // ── Overdraft occurrences ──────────────────────────────────────────────────
  const overdraftCount = num(cashflowAnalysis?.overdraftCount);
  if (overdraftCount > 0) {
    const severity: RiskFlag["severity"] = overdraftCount > 3 ? "medium" : "low";
    flags.push(
      flag(
        severity,
        "cash_management",
        "Overdraft Activity",
        `${overdraftCount} overdraft occurrence(s) detected in bank statements.`,
        "Request explanation. Assess whether this is a pattern or isolated incident."
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Sort: high first, then medium, then low — alphabetically within severity
  // ═══════════════════════════════════════════════════════════════════════════

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  flags.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return a.title.localeCompare(b.title);
  });

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Score Calculation
// ─────────────────────────────────────────────────────────────────────────────

export function calculateRiskScore(flags: RiskFlag[]): number {
  let score = 0;

  for (const f of flags) {
    switch (f.severity) {
      case "high":
        score += 20;
        break;
      case "medium":
        score += 10;
        break;
      case "low":
        score += 3;
        break;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}
