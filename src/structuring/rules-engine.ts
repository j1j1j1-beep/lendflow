// rules-engine.ts
// Deterministic deal structuring engine. Takes FullAnalysis + LoanProgram config
// and outputs recommended deal terms. ZERO AI. Pure rules.
//
// THIS IS THE SOURCE OF TRUTH FOR ALL NUMBERS.
// AI never sets rates, LTV, fees, or financial values.

import type { FullAnalysis } from "@/analysis/analyze";
import type { LoanProgram } from "@/config/loan-programs";

// Types

export interface RulesEngineInput {
  analysis: FullAnalysis;
  program: LoanProgram;
  requestedAmount: number;
  requestedRate?: number;      // Borrower's proposed rate (decimal)
  requestedTermMonths?: number;
  propertyValue?: number;      // Appraised or estimated value
  collateralValue?: number;    // For non-real-estate programs
  stateAbbr?: string;          // For state-specific rules
}

export interface EligibilityResult {
  eligible: boolean;
  failures: EligibilityFailure[];
  warnings: string[];
}

export interface EligibilityFailure {
  rule: string;
  required: number | string;
  actual: number | string;
  message: string;
}

export interface RateCalculation {
  baseRateType: "prime" | "sofr" | "treasury";
  baseRateValue: number;
  spread: number;
  totalRate: number;
}

export interface FeeCalculation {
  name: string;
  type: "percent" | "flat";
  rate: number;         // The fee rate or flat amount from config
  amount: number;       // Calculated dollar amount
  description: string;
}

export interface ConditionItem {
  category: "prior_to_closing" | "prior_to_funding" | "post_closing";
  description: string;
  source: "rules_engine";
  priority: "required" | "recommended";
}

export interface RulesEngineOutput {
  eligibility: EligibilityResult;
  approvedAmount: number;
  ltv: number | null;
  rate: RateCalculation;
  termMonths: number;
  amortizationMonths: number;
  monthlyPayment: number;
  interestOnly: boolean;
  prepaymentPenalty: boolean;
  personalGuaranty: boolean;
  requiresAppraisal: boolean;
  covenants: Array<{
    name: string;
    description: string;
    threshold?: number;
    frequency: "annual" | "quarterly" | "monthly";
    source: "program_standard";
  }>;
  conditions: ConditionItem[];
  fees: FeeCalculation[];
  totalFees: number;
  projectedDscrWithProposedPayment: number | null;
}

// IMPORTANT: These base rates are static fallbacks as of Feb 2026.
// In production, these should be fetched from a live rate feed (FRED API, Bloomberg, or similar).
// Stale rates directly impact loan pricing for every deal.
// Last updated: 2026-02-11
// WARNING: These rates are hardcoded approximations for development/demo only.
// In production, fetch live rates from FRED API (https://fred.stlouisfed.org/)
// or a market data provider. Stale rates will mis-price loans.

const BASE_RATES: Record<string, number> = {
  prime: 0.0675,    // WSJ Prime Rate (updated Feb 2026)
  sofr: 0.0430,     // Secured Overnight Financing Rate (updated Feb 2026)
  treasury: 0.0415, // 10-year Treasury (updated Feb 2026)
};

/** Get the current base rate. In production, this would call a rate API. */
export function getBaseRate(type: "prime" | "sofr" | "treasury"): number {
  return BASE_RATES[type];
}

// Eligibility check

function checkEligibility(input: RulesEngineInput): EligibilityResult {
  const { analysis, program, requestedAmount } = input;
  const rules = program.structuringRules;
  const failures: EligibilityFailure[] = [];
  const warnings: string[] = [];

  const dscr = analysis.summary.globalDscr;
  const dti = analysis.summary.backEndDti;

  // 1. DSCR check (skip if program doesn't require it, e.g. crypto)
  if (rules.minDscr > 0) {
    if (dscr === null) {
      warnings.push("DSCR could not be calculated — manual review required");
    } else if (dscr < rules.minDscr) {
      failures.push({
        rule: "Minimum DSCR",
        required: rules.minDscr,
        actual: dscr,
        message: `DSCR ${dscr.toFixed(2)}x is below program minimum of ${rules.minDscr}x`,
      });
    } else if (dscr < rules.minDscr * 1.1) {
      warnings.push(`DSCR ${dscr.toFixed(2)}x is close to the minimum of ${rules.minDscr}x — limited cushion`);
    }
  }

  // 2. DTI check (skip for DSCR-only programs where maxDti = 0)
  if (rules.maxDti > 0) {
    if (dti === null) {
      warnings.push("DTI could not be calculated — manual review required");
    } else if (dti > rules.maxDti) {
      failures.push({
        rule: "Maximum DTI",
        required: `≤${(rules.maxDti * 100).toFixed(0)}%`,
        actual: `${(dti * 100).toFixed(1)}%`,
        message: `DTI ${(dti * 100).toFixed(1)}% exceeds program maximum of ${(rules.maxDti * 100).toFixed(0)}%`,
      });
    }
  }

  // 3. Loan amount range
  if (rules.maxLoanAmount !== null && requestedAmount > rules.maxLoanAmount) {
    failures.push({
      rule: "Maximum Loan Amount",
      required: `≤$${rules.maxLoanAmount.toLocaleString()}`,
      actual: `$${requestedAmount.toLocaleString()}`,
      message: `Requested amount $${requestedAmount.toLocaleString()} exceeds program maximum of $${rules.maxLoanAmount.toLocaleString()}`,
    });
  }

  if (requestedAmount < rules.minLoanAmount) {
    failures.push({
      rule: "Minimum Loan Amount",
      required: `≥$${rules.minLoanAmount.toLocaleString()}`,
      actual: `$${requestedAmount.toLocaleString()}`,
      message: `Requested amount $${requestedAmount.toLocaleString()} is below program minimum of $${rules.minLoanAmount.toLocaleString()}`,
    });
  }

  // 4. LTV check (only if property/collateral value provided)
  if (input.propertyValue && input.propertyValue > 0) {
    const proposedLtv = requestedAmount / input.propertyValue;
    if (proposedLtv > rules.maxLtv) {
      failures.push({
        rule: "Maximum LTV",
        required: `≤${(rules.maxLtv * 100).toFixed(0)}%`,
        actual: `${(proposedLtv * 100).toFixed(1)}%`,
        message: `LTV ${(proposedLtv * 100).toFixed(1)}% exceeds program maximum of ${(rules.maxLtv * 100).toFixed(0)}%`,
      });
    }
  }

  // 5. Risk rating warning
  if (analysis.summary.riskRating === "high") {
    warnings.push("Borrower risk rating is HIGH — manual review strongly recommended");
  } else if (analysis.summary.riskRating === "elevated") {
    warnings.push("Borrower risk rating is ELEVATED — additional conditions may be warranted");
  }

  // 6. Reserves check
  if (analysis.summary.monthsOfReserves < 3) {
    warnings.push(`Only ${analysis.summary.monthsOfReserves.toFixed(1)} months of reserves — consider requiring additional reserves`);
  }

  return {
    eligible: failures.length === 0,
    failures,
    warnings,
  };
}

// Amount calculation

function calculateApprovedAmount(input: RulesEngineInput): { amount: number; ltv: number | null } {
  const { requestedAmount, program, propertyValue, collateralValue } = input;
  const rules = program.structuringRules;

  let maxByCollateral = Infinity;
  let ltv: number | null = null;

  // Calculate max by LTV if collateral value is known
  const valueForLtv = propertyValue ?? collateralValue ?? null;
  if (valueForLtv && valueForLtv > 0) {
    maxByCollateral = valueForLtv * rules.maxLtv;
  }

  // Calculate max by program limit
  const maxByProgram = rules.maxLoanAmount ?? Infinity;

  // Approved = min of all constraints
  const approved = Math.min(requestedAmount, maxByCollateral, maxByProgram);

  // No floor — eligibility check already flags amounts below minimum.
  // Inflating approved amount above requestedAmount would be incorrect.
  const finalAmount = approved;

  // Calculate actual LTV
  if (valueForLtv && valueForLtv > 0) {
    ltv = finalAmount / valueForLtv;
  }

  return { amount: Math.round(finalAmount * 100) / 100, ltv };
}

// Rate calculation

function calculateRate(input: RulesEngineInput): RateCalculation {
  const { analysis, program, requestedAmount } = input;
  const rules = program.structuringRules;

  const baseRateValue = getBaseRate(rules.baseRate);
  const [minSpread, maxSpread] = rules.spreadRange;

  // SBA 7(a) special case: enforce per-tier rate caps per SBA SOP 50 10 8
  // Tier caps are absolute maximums — the spread is capped at the tier limit regardless of risk rating.
  if (program.id === "sba_7a") {
    let tierMaxSpread: number;
    if (requestedAmount <= 50_000) {
      tierMaxSpread = 0.065; // Prime + 6.5%
    } else if (requestedAmount <= 250_000) {
      tierMaxSpread = 0.060; // Prime + 6.0%
    } else if (requestedAmount <= 350_000) {
      tierMaxSpread = 0.045; // Prime + 4.5%
    } else {
      tierMaxSpread = 0.030; // Prime + 3.0%
    }

    // Determine spread based on risk within the tier cap
    const riskRating = analysis.summary.riskRating;
    let spread: number;
    const spreadRange = tierMaxSpread - minSpread;

    switch (riskRating) {
      case "low":
        spread = minSpread;
        break;
      case "moderate":
        spread = minSpread + spreadRange * 0.33;
        break;
      case "elevated":
        spread = minSpread + spreadRange * 0.67;
        break;
      case "high":
        spread = tierMaxSpread;
        break;
      default:
        spread = minSpread + spreadRange * 0.5;
    }

    // Round spread to nearest 0.125% (standard pricing grid)
    spread = Math.round(spread * 800) / 800;
    // Enforce tier cap after rounding
    spread = Math.min(spread, tierMaxSpread);

    const totalRate = baseRateValue + spread;

    return {
      baseRateType: rules.baseRate,
      baseRateValue,
      spread,
      totalRate,
    };
  }

  // Determine spread based on risk tier
  // Lower risk = lower spread (closer to min), higher risk = higher spread (closer to max)
  let spread: number;
  const riskRating = analysis.summary.riskRating;
  const spreadRange = maxSpread - minSpread;

  switch (riskRating) {
    case "low":
      spread = minSpread;
      break;
    case "moderate":
      spread = minSpread + spreadRange * 0.33;
      break;
    case "elevated":
      spread = minSpread + spreadRange * 0.67;
      break;
    case "high":
      spread = maxSpread;
      break;
    default:
      spread = minSpread + spreadRange * 0.5;
  }

  // Round spread to nearest 0.125% (standard pricing grid)
  spread = Math.round(spread * 800) / 800;

  const totalRate = baseRateValue + spread;

  return {
    baseRateType: rules.baseRate,
    baseRateValue,
    spread,
    totalRate,
  };
}

// Term & amortization

function calculateTerms(input: RulesEngineInput): {
  termMonths: number;
  amortizationMonths: number;
  interestOnly: boolean;
} {
  const rules = input.program.structuringRules;

  // Term: use requested if within limits, otherwise cap at program max
  const requestedTerm = input.requestedTermMonths ?? rules.maxTerm;
  const termMonths = Math.min(requestedTerm, rules.maxTerm);

  // Amortization: for interest-only programs, set to 0; otherwise cap at max
  const interestOnly = rules.interestOnly;
  const amortizationMonths = interestOnly ? 0 : rules.maxAmortization;

  return { termMonths, amortizationMonths, interestOnly };
}

// Payment calculation

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  amortizationMonths: number,
  interestOnly: boolean
): number {
  if (principal <= 0) return 0;

  if (interestOnly || amortizationMonths <= 0) {
    // Interest-only payment
    // Use 4 decimal places internally to avoid compounding rounding errors
    return Math.round((principal * annualRate / 12) * 10000) / 10000;
  }

  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    // Use 4 decimal places internally to avoid compounding rounding errors
    return Math.round((principal / amortizationMonths) * 10000) / 10000;
  }

  // Standard amortization formula: P * r(1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, amortizationMonths);
  const payment = principal * (monthlyRate * factor) / (factor - 1);

  // Use 4 decimal places internally to avoid compounding rounding errors
  return Math.round(payment * 10000) / 10000;
}

// Fee calculation

function calculateFees(approvedAmount: number, program: LoanProgram): FeeCalculation[] {
  return program.standardFees.map((fee) => {
    const amount = fee.type === "percent"
      ? Math.round(approvedAmount * fee.value * 100) / 100
      : fee.value;

    return {
      name: fee.name,
      type: fee.type,
      rate: fee.value,
      amount,
      description: fee.description,
    };
  });
}

// Covenant generation (from program config)

function generateCovenants(program: LoanProgram) {
  return program.standardCovenants.map((cov) => ({
    ...cov,
    source: "program_standard" as const,
  }));
}

// Condition generation (deterministic, from program requirements)

function generateConditions(input: RulesEngineInput): ConditionItem[] {
  const { program } = input;
  const conditions: ConditionItem[] = [];

  // Prior to closing
  if (program.structuringRules.requiresAppraisal) {
    conditions.push({
      category: "prior_to_closing",
      description: "Obtain current appraisal from approved appraiser",
      source: "rules_engine",
      priority: "required",
    });
  }

  if (program.structuringRules.requiresPersonalGuaranty) {
    conditions.push({
      category: "prior_to_closing",
      description: "Execute personal guaranty agreement from all owners with ≥20% ownership",
      source: "rules_engine",
      priority: "required",
    });
  }

  // Standard prior-to-closing conditions
  conditions.push({
    category: "prior_to_closing",
    description: "Title search and title insurance commitment",
    source: "rules_engine",
    priority: "required",
  });

  conditions.push({
    category: "prior_to_closing",
    description: "Proof of property/casualty insurance with lender named as loss payee",
    source: "rules_engine",
    priority: "required",
  });

  // Flood zone check
  if (program.complianceChecks.includes("flood_zone")) {
    conditions.push({
      category: "prior_to_closing",
      description: "Flood zone determination — if in flood zone, obtain flood insurance",
      source: "rules_engine",
      priority: "required",
    });
  }

  // SBA-specific conditions
  if (program.id.startsWith("sba_")) {
    conditions.push({
      category: "prior_to_closing",
      description: "SBA Authorization letter and all required SBA forms",
      source: "rules_engine",
      priority: "required",
    });

    conditions.push({
      category: "prior_to_closing",
      description: "Verification of borrower eligibility per SBA size standards",
      source: "rules_engine",
      priority: "required",
    });
  }

  // Prior to funding
  conditions.push({
    category: "prior_to_funding",
    description: "UCC filing or mortgage/deed of trust recording confirmation",
    source: "rules_engine",
    priority: "required",
  });

  if (program.complianceChecks.includes("bsa_aml")) {
    conditions.push({
      category: "prior_to_funding",
      description: "BSA/AML compliance verification — CIP, CDD, beneficial ownership",
      source: "rules_engine",
      priority: "required",
    });
  }

  if (program.complianceChecks.includes("ofac_screening")) {
    conditions.push({
      category: "prior_to_funding",
      description: "OFAC screening completed with no matches",
      source: "rules_engine",
      priority: "required",
    });
  }

  // Post closing
  conditions.push({
    category: "post_closing",
    description: "Annual financial statements due within 120 days of fiscal year end",
    source: "rules_engine",
    priority: "required",
  });

  conditions.push({
    category: "post_closing",
    description: "Annual tax returns due within 30 days of filing",
    source: "rules_engine",
    priority: "required",
  });

  conditions.push({
    category: "post_closing",
    description: "Maintain required insurance coverage throughout loan term",
    source: "rules_engine",
    priority: "required",
  });

  return conditions;
}

// Projected DSCR with proposed payment

/**
 * Projects borrower payment coverage ratio using qualifying income (not NOI).
 * This is a borrower-level affordability metric, not a property-level DSCR.
 * Named projectedDscrWithProposedPayment in the output for downstream compatibility.
 */
function projectDscrWithPayment(
  analysis: FullAnalysis,
  monthlyPayment: number
): number | null {
  const qualifyingIncome = analysis.summary.qualifyingIncome;
  if (!qualifyingIncome || qualifyingIncome <= 0) return null;

  const monthlyIncome = qualifyingIncome / 12;
  if (monthlyPayment <= 0) return null;

  return Math.round((monthlyIncome / monthlyPayment) * 100) / 100;
}

// Main entry point

export function runRulesEngine(input: RulesEngineInput): RulesEngineOutput {
  // 1. Eligibility
  const eligibility = checkEligibility(input);

  // 2. Amount (calculate even if not eligible — shows what would be approved)
  const { amount: approvedAmount, ltv } = calculateApprovedAmount(input);

  // 3. Rate
  const rate = calculateRate(input);

  // 4. Terms
  const { termMonths, amortizationMonths, interestOnly } = calculateTerms(input);

  // 5. Payment
  const monthlyPayment = calculateMonthlyPayment(
    approvedAmount,
    rate.totalRate,
    amortizationMonths,
    interestOnly
  );

  // 6. Fees
  const fees = calculateFees(approvedAmount, input.program);
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);

  // 7. Covenants
  const covenants = generateCovenants(input.program);

  // 8. Conditions
  const conditions = generateConditions(input);

  // 9. Projected DSCR with this payment
  const projectedDscrWithProposedPayment = projectDscrWithPayment(
    input.analysis,
    monthlyPayment
  );

  return {
    eligibility,
    approvedAmount,
    ltv,
    rate,
    termMonths,
    amortizationMonths,
    monthlyPayment,
    interestOnly,
    prepaymentPenalty: input.program.structuringRules.prepaymentPenalty,
    personalGuaranty: input.program.structuringRules.requiresPersonalGuaranty,
    requiresAppraisal: input.program.structuringRules.requiresAppraisal,
    covenants,
    conditions,
    fees,
    totalFees,
    projectedDscrWithProposedPayment,
  };
}
