// OpenShut Analysis Engine — Master Orchestrator
// 100% deterministic. Zero AI. Pure TypeScript math.
//
// Runs the full analysis pipeline on verified extraction data.
// Input: structured extractions that have passed verification (or human review).
// Output: complete financial analysis with risk assessment.

import { analyzeIncome, type IncomeAnalysis } from "./income";
import { calculateDscr, type DscrAnalysis } from "./dscr";
import { calculateDti, type DtiAnalysis } from "./dti";
import { analyzeLiquidity, type LiquidityAnalysis } from "./liquidity";
import { analyzeCashflow, type CashflowAnalysis } from "./cashflow";
import { analyzeBusiness, type BusinessAnalysis } from "./business";
import {
  detectRiskFlags,
  calculateRiskScore,
  type RiskFlag,
} from "./risk-flags";

// Types

export interface FullAnalysis {
  income: IncomeAnalysis;
  dscr: DscrAnalysis;
  dti: DtiAnalysis;
  liquidity: LiquidityAnalysis;
  cashflow: CashflowAnalysis;
  business: BusinessAnalysis | null;
  riskFlags: RiskFlag[];
  riskScore: number;
  summary: {
    qualifyingIncome: number;
    globalDscr: number | null;
    backEndDti: number | null;
    monthsOfReserves: number;
    riskRating: "low" | "moderate" | "elevated" | "high";
  };
}

// Helpers

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
 * Calculate monthly mortgage payment using standard amortization formula.
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;

  const r = annualRate / 12;
  const n = termMonths;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Classify extraction documents into categories for routing.
 */
function classifyExtractions(extractions: Array<{ docType: string; data: any; year?: number }>) {
  const taxForms: typeof extractions = [];
  const bankStatements: typeof extractions = [];
  const profitAndLoss: typeof extractions = [];
  const balanceSheets: typeof extractions = [];
  const rentRolls: typeof extractions = [];
  const other: typeof extractions = [];

  const taxTypes = new Set([
    "1040", "form1040", "1040return",
    "w2", "w2summary",
    "schedulec", "schedc",
    "schedulee", "schede",
    "k1", "schedulek1", "k1partnership", "k1scorp",
    "1065", "form1065",
    "1120", "form1120",
    "1120s", "form1120s",
  ]);

  const bankTypes = new Set([
    "bankstatement", "bankstatementchecking", "bankstatementsavings",
    "bank_statement", "bankstmt",
    "checking", "savings", "bankaccount",
  ]);

  const plTypes = new Set([
    "profitandloss", "pl", "p&l", "pandl", "incomestatement",
  ]);

  const bsTypes = new Set([
    "balancesheet", "bs", "balance_sheet",
  ]);

  const rrTypes = new Set([
    "rentroll", "rent_roll", "rentalschedule",
  ]);

  for (const ext of extractions) {
    const normalized = ext.docType.toLowerCase().replace(/[\s\-_]/g, "");

    if (taxTypes.has(normalized)) {
      taxForms.push(ext);
    } else if (bankTypes.has(normalized)) {
      bankStatements.push(ext);
    } else if (plTypes.has(normalized)) {
      profitAndLoss.push(ext);
      // P&L also goes to tax forms for income analysis
      taxForms.push(ext);
    } else if (bsTypes.has(normalized)) {
      balanceSheets.push(ext);
    } else if (rrTypes.has(normalized)) {
      rentRolls.push(ext);
    } else {
      // Unknown doc type — include in tax forms so income analysis can attempt extraction
      other.push(ext);
    }
  }

  return { taxForms, bankStatements, profitAndLoss, balanceSheets, rentRolls, other };
}

// Master orchestrator

export function runFullAnalysis(params: {
  extractions: Array<{ docType: string; data: any; year?: number }>;
  proposedLoanAmount?: number;
  proposedRate?: number;
  proposedTerm?: number;
  proposedMonthlyPayment?: number;
}): FullAnalysis {
  const {
    extractions,
    proposedLoanAmount,
    proposedRate,
    proposedTerm,
    proposedMonthlyPayment,
  } = params;

  // Step 1: Classify extractions by document type

  const classified = classifyExtractions(extractions);

  // Step 2: Income Analysis — runs on all tax forms and P&Ls

  const allIncomeExtractions = [
    ...classified.taxForms,
    ...classified.other, // Include unknown docs in case they contain income data
  ];

  const income = analyzeIncome(allIncomeExtractions);

  // Step 3: Business Analysis — only if business docs present

  const businessExtractions = [
    ...classified.taxForms,
    ...classified.profitAndLoss,
  ];

  const business = analyzeBusiness(businessExtractions);

  // Step 4: Cash Flow Analysis — bank statements

  const bankStatementDataArray = classified.bankStatements.map((e) => e.data);

  const cashflow = analyzeCashflow({
    bankStatements: bankStatementDataArray,
    reportedIncome: income.qualifyingIncome,
  });

  // Step 5: Calculate proposed monthly payment if not provided

  let proposedMonthly = proposedMonthlyPayment ?? 0;

  if (
    proposedMonthly <= 0 &&
    proposedLoanAmount &&
    proposedLoanAmount > 0 &&
    proposedRate !== undefined &&
    proposedTerm &&
    proposedTerm > 0
  ) {
    proposedMonthly = calculateMonthlyPayment(
      proposedLoanAmount,
      proposedRate,
      proposedTerm
    );
  }

  // Step 6: DSCR — income + bank data + proposed loan

  // Merge bank statement data for DSCR detection (use first statement or aggregate)
  const mergedBankData =
    bankStatementDataArray.length === 1
      ? bankStatementDataArray[0]
      : bankStatementDataArray.length > 1
        ? mergeBankStatementData(bankStatementDataArray)
        : undefined;

  // Rental data from rent rolls or Schedule E
  const rentalData =
    classified.rentRolls.length > 0
      ? classified.rentRolls[0].data
      : classified.taxForms.find((e) => {
          const t = e.docType.toLowerCase().replace(/[\s\-_]/g, "");
          return t === "schedulee" || t === "schede";
        })?.data ?? undefined;

  const dscr = calculateDscr({
    incomeAnalysis: income,
    bankStatementData: mergedBankData,
    rentalData,
    proposedLoanPayment: proposedMonthly > 0 ? proposedMonthly : undefined,
    proposedRate,
    proposedTerm,
    loanAmount: proposedLoanAmount,
  });

  // Step 7: DTI — income + bank data + proposed loan

  const dti = calculateDti({
    incomeAnalysis: income,
    bankStatementData: mergedBankData,
    proposedMonthlyPayment: proposedMonthly > 0 ? proposedMonthly : undefined,
  });

  // Step 8: Liquidity — bank statements + balance sheet

  const balanceSheetData =
    classified.balanceSheets.length > 0 ? classified.balanceSheets[0].data : undefined;

  const monthlyDebtService = dti.totalMonthlyDebt > 0
    ? dti.totalMonthlyDebt
    : proposedMonthly > 0
      ? proposedMonthly
      : 0;

  const liquidity = analyzeLiquidity({
    bankStatementData: bankStatementDataArray.length > 0 ? bankStatementDataArray : undefined,
    balanceSheetData,
    monthlyDebtService,
  });

  // Step 9: Risk Flag Detection

  const riskFlags = detectRiskFlags({
    incomeAnalysis: income,
    dscrAnalysis: dscr,
    dtiAnalysis: dti,
    liquidityAnalysis: liquidity,
    cashflowAnalysis: cashflow,
    businessAnalysis: business,
    extractions,
  });

  // Step 10: Risk Score + Summary

  const riskScore = calculateRiskScore(riskFlags);

  let riskRating: "low" | "moderate" | "elevated" | "high";
  if (riskScore <= 25) {
    riskRating = "low";
  } else if (riskScore <= 45) {
    riskRating = "moderate";
  } else if (riskScore <= 70) {
    riskRating = "elevated";
  } else {
    riskRating = "high";
  }

  return {
    income,
    dscr,
    dti,
    liquidity,
    cashflow,
    business,
    riskFlags,
    riskScore,
    summary: {
      qualifyingIncome: income.qualifyingIncome,
      globalDscr: dscr.globalDscr,
      backEndDti: dti.backEndDti,
      monthsOfReserves: liquidity.monthsOfReserves,
      riskRating,
    },
  };
}

// Internal: merge multiple bank statement data objects for DSCR/DTI detection

function mergeBankStatementData(
  statements: any[]
): any {
  // Merge regular payments from all statements, deduplicating by description + amount
  const seenPayments = new Map<string, any>();

  for (const stmt of statements) {
    const payments =
      stmt.regularPaymentsDetected ??
      stmt.regularPayments ??
      stmt.recurringDebits ??
      [];

    if (Array.isArray(payments)) {
      for (const pmt of payments) {
        const desc = pmt.description ?? pmt.payee ?? pmt.name ?? "Unknown";
        const amount = num(pmt.amount ?? pmt.monthlyAmount ?? pmt.averageAmount);
        const key = `${desc}::${Math.round(amount)}`;

        if (!seenPayments.has(key)) {
          seenPayments.set(key, pmt);
        }
      }
    }
  }

  return {
    regularPaymentsDetected: Array.from(seenPayments.values()),
  };
}

// Re-exports for convenience

export type {
  IncomeAnalysis,
  DscrAnalysis,
  DtiAnalysis,
  LiquidityAnalysis,
  CashflowAnalysis,
  BusinessAnalysis,
  RiskFlag,
};
