// OpenShut Analysis Engine — Debt-to-Income Ratio (DTI)
// 100% deterministic. Zero AI. Pure TypeScript math.

export interface DtiAnalysis {
  frontEndDti: number | null; // housing expense / gross monthly income
  backEndDti: number | null; // total debt / gross monthly income
  grossMonthlyIncome: number;
  monthlyHousingExpense: number;
  totalMonthlyDebt: number;
  debtItems: Array<{ description: string; monthlyAmount: number }>;
  rating: "excellent" | "good" | "acceptable" | "high" | "excessive";
  notes: string[];
}

// Helpers

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
 * Classify a detected payment as housing vs. non-housing debt.
 * Returns { isHousing, isDebt } so we can bucket it correctly.
 */
function classifyPayment(payment: any): { isHousing: boolean; isDebt: boolean } {
  const desc = (payment.description ?? payment.payee ?? payment.name ?? "").toLowerCase();
  const category = (payment.category ?? "").toLowerCase();

  const housingPatterns = /\b(mortgage|rent|hoa|homeowner|property tax|home insurance|piti|escrow)\b/;
  const debtPatterns = /\b(mortgage|loan|auto pay|car pay|student|credit card|min payment|capital one|chase|discover|amex|wells fargo|boa|usaa|navy fed|sallie mae|navient|sofi|earnest|upstart|lending club|prosper)\b/;

  const isHousing = housingPatterns.test(desc) || category === "housing" || category === "mortgage" || category === "rent";
  const isDebt = debtPatterns.test(desc) || category === "debt" || category === "loan" || isHousing;

  return { isHousing, isDebt };
}

/**
 * Normalize a payment amount to monthly based on its frequency.
 */
function toMonthly(amount: number, frequency: string): number {
  const freq = (frequency ?? "monthly").toLowerCase();
  switch (freq) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
    case "bi-weekly":
      return (amount * 26) / 12;
    case "semimonthly":
    case "semi-monthly":
      return amount * 2;
    case "quarterly":
      return amount / 3;
    case "semiannual":
    case "semi-annual":
      return amount / 6;
    case "annual":
    case "annually":
      return amount / 12;
    case "monthly":
    default:
      return amount;
  }
}

// Main DTI calculation

export function calculateDti(params: {
  incomeAnalysis: { qualifyingIncome: number };
  bankStatementData?: any;
  proposedMonthlyPayment?: number;
  loanPurpose?: "purchase" | "refinance" | "other";
}): DtiAnalysis {
  const { incomeAnalysis, bankStatementData, proposedMonthlyPayment, loanPurpose } = params;
  const notes: string[] = [];
  const debtItems: Array<{ description: string; monthlyAmount: number }> = [];

  // Gross monthly income
  const grossMonthlyIncome = Math.round((incomeAnalysis.qualifyingIncome / 12) * 100) / 100;

  if (grossMonthlyIncome <= 0) {
    notes.push("Qualifying income is zero or negative. DTI cannot be meaningfully calculated.");
  }

  // Detect debt payments from bank statements
  let monthlyHousingExpense = 0;
  let totalNonHousingDebt = 0;

  if (bankStatementData) {
    const payments =
      bankStatementData.regularPaymentsDetected ??
      bankStatementData.regularPayments ??
      bankStatementData.recurringDebits ??
      [];

    if (Array.isArray(payments)) {
      for (const payment of payments) {
        const rawAmount = num(payment.amount ?? payment.monthlyAmount ?? payment.averageAmount);
        if (rawAmount <= 0) continue;

        const frequency = payment.frequency ?? "monthly";
        const monthlyAmount = Math.round(toMonthly(rawAmount, frequency) * 100) / 100;
        const { isHousing, isDebt } = classifyPayment(payment);

        if (!isDebt) continue;

        const desc = payment.description ?? payment.payee ?? payment.name ?? "Unknown payment";
        debtItems.push({ description: desc, monthlyAmount });

        if (isHousing) {
          monthlyHousingExpense += monthlyAmount;
        } else {
          totalNonHousingDebt += monthlyAmount;
        }
      }
    }
  }

  // Proposed loan payment
  if (proposedMonthlyPayment && proposedMonthlyPayment > 0) {
    debtItems.push({
      description: "Proposed loan payment",
      monthlyAmount: proposedMonthlyPayment,
    });

    if (loanPurpose === "refinance" && monthlyHousingExpense > 0) {
      // Refinance replaces existing mortgage — don't double-count.
      // Remove the existing housing expense and use the proposed payment instead.
      notes.push(
        `Refinance detected: replacing existing housing expense ($${Math.round(monthlyHousingExpense).toLocaleString()}/mo) ` +
        `with proposed payment ($${Math.round(proposedMonthlyPayment).toLocaleString()}/mo).`
      );
      monthlyHousingExpense = proposedMonthlyPayment;
    } else {
      monthlyHousingExpense += proposedMonthlyPayment;
    }
  }

  // Compute DTI
  const totalMonthlyDebt = monthlyHousingExpense + totalNonHousingDebt;

  let frontEndDti: number | null = null;
  let backEndDti: number | null = null;

  if (grossMonthlyIncome > 0) {
    frontEndDti = Math.round((monthlyHousingExpense / grossMonthlyIncome) * 10000) / 10000;
    backEndDti = Math.round((totalMonthlyDebt / grossMonthlyIncome) * 10000) / 10000;
  }

  // Rating
  // Thresholds: front-end / back-end
  // excellent: <=28% / <=36%
  // good:      <=31% / <=43%
  // acceptable: <=33% / <=45%
  // high:      <=36% / <=50%
  // excessive: >36% / >50%

  let rating: DtiAnalysis["rating"] = "excessive";

  if (frontEndDti !== null && backEndDti !== null) {
    if (frontEndDti <= 0.28 && backEndDti <= 0.36) {
      rating = "excellent";
    } else if (frontEndDti <= 0.31 && backEndDti <= 0.43) {
      rating = "good";
    } else if (frontEndDti <= 0.33 && backEndDti <= 0.45) {
      rating = "acceptable";
    } else if (frontEndDti <= 0.36 && backEndDti <= 0.50) {
      rating = "high";
      notes.push("DTI is elevated. Compensating factors may be needed for approval.");
    } else {
      rating = "excessive";
      notes.push("DTI exceeds standard guidelines. Significant compensating factors required.");
    }
  } else if (backEndDti !== null) {
    // No housing expense identified — rate on back-end only
    if (backEndDti <= 0.36) rating = "excellent";
    else if (backEndDti <= 0.43) rating = "good";
    else if (backEndDti <= 0.45) rating = "acceptable";
    else if (backEndDti <= 0.50) rating = "high";
    else rating = "excessive";

    if (monthlyHousingExpense === 0) {
      notes.push("No housing expense detected. Front-end DTI may be understated.");
    }
  }

  // Informational notes
  if (debtItems.length === 0 && !proposedMonthlyPayment) {
    notes.push("No debt obligations detected. DTI is effectively 0%.");
  }

  notes.push(
    `Gross monthly income: $${Math.round(grossMonthlyIncome).toLocaleString()}, ` +
    `Housing: $${Math.round(monthlyHousingExpense).toLocaleString()}/mo, ` +
    `Total debt: $${Math.round(totalMonthlyDebt).toLocaleString()}/mo.`
  );

  return {
    frontEndDti,
    backEndDti,
    grossMonthlyIncome,
    monthlyHousingExpense,
    totalMonthlyDebt,
    debtItems,
    rating,
    notes,
  };
}
