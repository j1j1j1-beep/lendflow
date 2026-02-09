// =============================================================================
// final-check.ts
// Deterministic final verification of the complete deal terms. Runs AFTER the
// rules engine, AI enhancement, and compliance review. Catches any internal
// inconsistencies before terms are saved.
// =============================================================================

import type { RulesEngineOutput } from "./rules-engine";
import type { AiEnhancement } from "./ai-structuring";
import type { ComplianceResult } from "./compliance-review";
import type { LoanProgram } from "@/config/loan-programs";
import { calculateMonthlyPayment } from "./rules-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FinalCheckIssue {
  field: string;
  expected: string;
  actual: string;
  severity: "error" | "warning";
  message: string;
}

export interface FinalCheckResult {
  passed: boolean;
  issues: FinalCheckIssue[];
}

// ---------------------------------------------------------------------------
// Tolerances
// ---------------------------------------------------------------------------

const PAYMENT_TOLERANCE = 1; // $1 for rounding
const RATE_TOLERANCE = 0.0001; // 0.01% for rounding

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runFinalCheck(params: {
  rulesOutput: RulesEngineOutput;
  aiEnhancement: AiEnhancement;
  compliance: ComplianceResult;
  program: LoanProgram;
}): FinalCheckResult {
  const { rulesOutput, program, compliance } = params;
  const issues: FinalCheckIssue[] = [];
  const rules = program.structuringRules;

  // 1. Payment math verification
  const recalcPayment = calculateMonthlyPayment(
    rulesOutput.approvedAmount,
    rulesOutput.rate.totalRate,
    rulesOutput.amortizationMonths,
    rulesOutput.interestOnly
  );

  if (Math.abs(recalcPayment - rulesOutput.monthlyPayment) > PAYMENT_TOLERANCE) {
    issues.push({
      field: "monthlyPayment",
      expected: `$${recalcPayment.toFixed(2)}`,
      actual: `$${rulesOutput.monthlyPayment.toFixed(2)}`,
      severity: "error",
      message: "Monthly payment does not match recalculation from rate, amount, and term",
    });
  }

  // 2. Rate = base + spread
  const expectedRate = rulesOutput.rate.baseRateValue + rulesOutput.rate.spread;
  if (Math.abs(expectedRate - rulesOutput.rate.totalRate) > RATE_TOLERANCE) {
    issues.push({
      field: "totalRate",
      expected: `${(expectedRate * 100).toFixed(4)}%`,
      actual: `${(rulesOutput.rate.totalRate * 100).toFixed(4)}%`,
      severity: "error",
      message: "Total rate does not equal base rate plus spread",
    });
  }

  // 3. Spread within program range
  const [minSpread, maxSpread] = rules.spreadRange;
  if (rulesOutput.rate.spread < minSpread - RATE_TOLERANCE || rulesOutput.rate.spread > maxSpread + RATE_TOLERANCE) {
    issues.push({
      field: "spread",
      expected: `${(minSpread * 100).toFixed(3)}% - ${(maxSpread * 100).toFixed(3)}%`,
      actual: `${(rulesOutput.rate.spread * 100).toFixed(3)}%`,
      severity: "error",
      message: "Spread is outside program allowed range",
    });
  }

  // 4. Amount within program limits
  if (rules.maxLoanAmount !== null && rulesOutput.approvedAmount > rules.maxLoanAmount) {
    issues.push({
      field: "approvedAmount",
      expected: `≤$${rules.maxLoanAmount.toLocaleString()}`,
      actual: `$${rulesOutput.approvedAmount.toLocaleString()}`,
      severity: "error",
      message: "Approved amount exceeds program maximum",
    });
  }

  if (rulesOutput.approvedAmount < rules.minLoanAmount) {
    issues.push({
      field: "approvedAmount",
      expected: `≥$${rules.minLoanAmount.toLocaleString()}`,
      actual: `$${rulesOutput.approvedAmount.toLocaleString()}`,
      severity: "error",
      message: "Approved amount is below program minimum",
    });
  }

  // 5. Term within limits
  if (rulesOutput.termMonths > rules.maxTerm) {
    issues.push({
      field: "termMonths",
      expected: `≤${rules.maxTerm}`,
      actual: `${rulesOutput.termMonths}`,
      severity: "error",
      message: "Term exceeds program maximum",
    });
  }

  // 6. Amortization within limits
  if (!rulesOutput.interestOnly && rulesOutput.amortizationMonths > rules.maxAmortization) {
    issues.push({
      field: "amortizationMonths",
      expected: `≤${rules.maxAmortization}`,
      actual: `${rulesOutput.amortizationMonths}`,
      severity: "error",
      message: "Amortization exceeds program maximum",
    });
  }

  // 7. LTV within limits (if available)
  if (rulesOutput.ltv !== null && rulesOutput.ltv > rules.maxLtv + 0.001) {
    issues.push({
      field: "ltv",
      expected: `≤${(rules.maxLtv * 100).toFixed(0)}%`,
      actual: `${(rulesOutput.ltv * 100).toFixed(1)}%`,
      severity: "error",
      message: "LTV exceeds program maximum",
    });
  }

  // 8. Fee totals add up
  const recalcTotalFees = rulesOutput.fees.reduce((sum, f) => sum + f.amount, 0);
  if (Math.abs(recalcTotalFees - rulesOutput.totalFees) > 0.01) {
    issues.push({
      field: "totalFees",
      expected: `$${recalcTotalFees.toFixed(2)}`,
      actual: `$${rulesOutput.totalFees.toFixed(2)}`,
      severity: "error",
      message: "Total fees do not match sum of individual fees",
    });
  }

  // 9. Interest-only consistency
  if (rulesOutput.interestOnly && rulesOutput.amortizationMonths > 0) {
    issues.push({
      field: "interestOnly",
      expected: "amortizationMonths = 0 when interest-only",
      actual: `amortizationMonths = ${rulesOutput.amortizationMonths}`,
      severity: "warning",
      message: "Interest-only flag is set but amortization months is non-zero",
    });
  }

  // 10. All required fields populated
  if (rulesOutput.approvedAmount <= 0) {
    issues.push({
      field: "approvedAmount",
      expected: "> 0",
      actual: `${rulesOutput.approvedAmount}`,
      severity: "error",
      message: "Approved amount must be positive",
    });
  }

  if (rulesOutput.rate.totalRate <= 0) {
    issues.push({
      field: "totalRate",
      expected: "> 0",
      actual: `${rulesOutput.rate.totalRate}`,
      severity: "error",
      message: "Total rate must be positive",
    });
  }

  if (rulesOutput.termMonths <= 0) {
    issues.push({
      field: "termMonths",
      expected: "> 0",
      actual: `${rulesOutput.termMonths}`,
      severity: "error",
      message: "Term must be positive",
    });
  }

  // 11. Compliance critical issues should block
  const criticalCompliance = compliance.issues.filter(i => i.severity === "critical");
  if (criticalCompliance.length > 0) {
    issues.push({
      field: "compliance",
      expected: "No critical compliance issues",
      actual: `${criticalCompliance.length} critical issue(s)`,
      severity: "error",
      message: `Critical compliance issues must be resolved: ${criticalCompliance.map(i => i.description).join("; ")}`,
    });
  }

  // 12. Projected DSCR with payment still meets minimum
  if (
    rulesOutput.projectedDscrWithProposedPayment !== null &&
    rules.minDscr > 0 &&
    rulesOutput.projectedDscrWithProposedPayment < rules.minDscr
  ) {
    issues.push({
      field: "projectedDscr",
      expected: `≥${rules.minDscr}`,
      actual: `${rulesOutput.projectedDscrWithProposedPayment}`,
      severity: "warning",
      message: `Projected DSCR with proposed payment (${rulesOutput.projectedDscrWithProposedPayment}x) is below program minimum (${rules.minDscr}x)`,
    });
  }

  return {
    passed: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
