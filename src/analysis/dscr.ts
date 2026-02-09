// ─────────────────────────────────────────────────────────────────────────────
// LendFlow Analysis Engine — Debt Service Coverage Ratio (DSCR)
// 100% deterministic. Zero AI. Pure TypeScript math.
// ─────────────────────────────────────────────────────────────────────────────

export interface DscrAnalysis {
  globalDscr: number | null; // total NOI / total debt service
  propertyDscr: number | null; // property NOI / property debt service
  noi: number; // Net Operating Income
  totalDebtService: number; // Annual debt payments
  proposedDebtService: number; // The loan being applied for (annual)
  existingDebtService: number; // Existing debt payments (annual)
  rating: "strong" | "adequate" | "weak" | "insufficient";
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
 * Calculate monthly mortgage payment using standard amortization formula.
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param principal  Loan amount
 * @param annualRate Annual interest rate as decimal (e.g. 0.065 for 6.5%)
 * @param termMonths Loan term in months
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) {
    // Interest-free: simple division
    return principal / termMonths;
  }

  const r = annualRate / 12;
  const n = termMonths;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Detect regular recurring payments from bank statement data that
 * look like debt service (loans, mortgages, credit cards).
 */
function detectExistingDebtFromBankStatements(
  bankStatementData: any
): { monthlyAmount: number; items: Array<{ description: string; amount: number }> } {
  const items: Array<{ description: string; amount: number }> = [];
  let monthlyAmount = 0;

  if (!bankStatementData) return { monthlyAmount, items };

  // regularPaymentsDetected is populated by the extraction/verification pipeline
  const payments = bankStatementData.regularPaymentsDetected ??
    bankStatementData.regularPayments ??
    bankStatementData.recurringDebits ??
    [];

  if (Array.isArray(payments)) {
    for (const payment of payments) {
      const amount = num(payment.amount ?? payment.monthlyAmount ?? payment.averageAmount);
      const desc = payment.description ?? payment.payee ?? payment.name ?? "Unknown payment";
      const category = (payment.category ?? "").toLowerCase();
      const descLower = desc.toLowerCase();

      // Only count items that look like debt payments
      const isDebt =
        category === "debt" ||
        category === "loan" ||
        category === "mortgage" ||
        /\b(mortgage|loan|auto pay|car pay|student|credit card|min payment|capital one|chase|discover|amex|wells fargo|boa|usaa|navy fed)\b/i.test(descLower);

      if (isDebt && amount > 0) {
        // Determine if the amount is already monthly or needs conversion
        const freq = (payment.frequency ?? "monthly").toLowerCase();
        let monthly = amount;
        if (freq === "biweekly" || freq === "bi-weekly") {
          monthly = (amount * 26) / 12;
        } else if (freq === "weekly") {
          monthly = (amount * 52) / 12;
        } else if (freq === "quarterly") {
          monthly = amount / 3;
        } else if (freq === "annual" || freq === "annually") {
          monthly = amount / 12;
        }

        items.push({ description: desc, amount: Math.round(monthly * 100) / 100 });
        monthlyAmount += monthly;
      }
    }
  }

  return { monthlyAmount: Math.round(monthlyAmount * 100) / 100, items };
}

/**
 * Extract rental property NOI from rental data (Schedule E / rent roll).
 */
function extractPropertyNoi(rentalData: any): {
  noi: number;
  debtService: number;
} {
  if (!rentalData) return { noi: 0, debtService: 0 };

  // If we have explicit NOI
  if (rentalData.noi !== undefined) {
    return {
      noi: num(rentalData.noi),
      debtService: num(rentalData.debtService ?? rentalData.mortgagePayment ?? 0) * 12,
    };
  }

  // Calculate NOI from gross rents - operating expenses
  const grossRents = num(
    rentalData.grossRents ??
    rentalData.totalRentsReceived ??
    rentalData.rentsReceived ??
    rentalData.grossRentalIncome ??
    0
  );

  const operatingExpenses = num(
    rentalData.totalOperatingExpenses ??
    rentalData.totalExpenses ??
    rentalData.operatingExpenses ??
    0
  );

  // Mortgage/debt service on the property (not included in operating expenses for DSCR)
  const mortgageInterest = num(rentalData.mortgageInterest ?? rentalData.interestExpense ?? 0);
  const mortgagePrincipal = num(rentalData.principalPayments ?? 0);

  // If operating expenses include mortgage interest, back it out for NOI calculation
  // NOI should be BEFORE debt service
  let noi = grossRents - operatingExpenses;
  if (operatingExpenses > 0 && mortgageInterest > 0) {
    // Assume operating expenses included mortgage interest — add it back
    noi += mortgageInterest;
  }

  const annualDebtService = (mortgageInterest + mortgagePrincipal) > 0
    ? mortgageInterest + mortgagePrincipal
    : 0;

  return { noi, debtService: annualDebtService };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main DSCR calculation
// ─────────────────────────────────────────────────────────────────────────────

export function calculateDscr(params: {
  incomeAnalysis: { qualifyingIncome: number; sources: any[] };
  bankStatementData?: any;
  rentalData?: any;
  proposedLoanPayment?: number; // monthly
  proposedRate?: number;
  proposedTerm?: number; // months
  loanAmount?: number;
}): DscrAnalysis {
  const {
    incomeAnalysis,
    bankStatementData,
    rentalData,
    proposedLoanPayment,
    proposedRate,
    proposedTerm,
    loanAmount,
  } = params;

  const notes: string[] = [];

  // ── Calculate proposed debt service ────────────────────────────────────────
  let proposedMonthly = 0;

  if (proposedLoanPayment && proposedLoanPayment > 0) {
    proposedMonthly = proposedLoanPayment;
  } else if (loanAmount && loanAmount > 0 && proposedRate !== undefined && proposedTerm) {
    proposedMonthly = calculateMonthlyPayment(loanAmount, proposedRate, proposedTerm);
    notes.push(
      `Calculated proposed monthly payment: $${Math.round(proposedMonthly).toLocaleString()} ` +
      `(${loanAmount.toLocaleString()} at ${(proposedRate * 100).toFixed(2)}% for ${proposedTerm} months).`
    );
  }

  const proposedDebtService = Math.round(proposedMonthly * 12 * 100) / 100;

  // ── Detect existing debt from bank statements ──────────────────────────────
  const existingDebt = detectExistingDebtFromBankStatements(bankStatementData);
  const existingDebtService = Math.round(existingDebt.monthlyAmount * 12 * 100) / 100;

  if (existingDebt.items.length > 0) {
    notes.push(
      `Detected ${existingDebt.items.length} recurring debt payment(s) from bank statements ` +
      `totaling $${Math.round(existingDebt.monthlyAmount).toLocaleString()}/month.`
    );
  }

  // ── Total debt service ─────────────────────────────────────────────────────
  const totalDebtService = existingDebtService + proposedDebtService;

  // ── Cash flow for debt service ─────────────────────────────────────────────
  // For investment properties, property NOI should be used instead of
  // personal qualifying income (which may include W-2 wages).
  const propertyInfo = extractPropertyNoi(rentalData);
  const noi = propertyInfo.noi > 0
    ? propertyInfo.noi
    : incomeAnalysis.qualifyingIncome;

  if (propertyInfo.noi > 0) {
    notes.push(
      `Using property NOI ($${Math.round(propertyInfo.noi).toLocaleString()}/year) as cash flow for global DSCR.`
    );
  }

  // ── Global DSCR ────────────────────────────────────────────────────────────
  let globalDscr: number | null = null;
  if (totalDebtService > 0) {
    globalDscr = Math.round((noi / totalDebtService) * 100) / 100;
  } else {
    notes.push("No debt service identified. DSCR cannot be calculated.");
  }

  // ── Property-level DSCR (if rental data provided) ──────────────────────────
  let propertyDscr: number | null = null;

  if (propertyInfo.noi > 0) {
    const propertyDebt = proposedDebtService > 0
      ? proposedDebtService
      : propertyInfo.debtService;

    if (propertyDebt > 0) {
      propertyDscr = Math.round((propertyInfo.noi / propertyDebt) * 100) / 100;
      notes.push(
        `Property NOI: $${Math.round(propertyInfo.noi).toLocaleString()}, ` +
        `Property debt service: $${Math.round(propertyDebt).toLocaleString()}/year.`
      );
    }
  }

  // ── Rating ─────────────────────────────────────────────────────────────────
  const dscrForRating = globalDscr ?? propertyDscr;
  let rating: DscrAnalysis["rating"] = "insufficient";

  if (dscrForRating !== null) {
    if (dscrForRating >= 1.5) {
      rating = "strong";
    } else if (dscrForRating >= 1.25) {
      rating = "adequate";
    } else if (dscrForRating >= 1.0) {
      rating = "weak";
      notes.push("DSCR is marginal — borrower may have difficulty servicing debt if income decreases.");
    } else {
      rating = "insufficient";
      notes.push("DSCR below 1.0 — income does not cover debt obligations.");
    }
  }

  return {
    globalDscr,
    propertyDscr,
    noi,
    totalDebtService,
    proposedDebtService,
    existingDebtService,
    rating,
    notes,
  };
}
