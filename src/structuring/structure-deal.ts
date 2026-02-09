// =============================================================================
// structure-deal.ts
// Orchestrator — runs all 4 layers of deal structuring in sequence:
//   1. Rules Engine (deterministic)
//   2. AI Enhancement (Claude — prose only)
//   3. Compliance Review (deterministic + Claude)
//   4. Final Check (deterministic)
//
// Returns the complete structured deal ready for database storage.
// =============================================================================

import type { FullAnalysis } from "@/analysis/analyze";
import type { LoanProgram } from "@/config/loan-programs";
import { runRulesEngine, type RulesEngineInput, type RulesEngineOutput } from "./rules-engine";
import { runAiStructuring, type AiEnhancement } from "./ai-structuring";
import { runComplianceReview, type ComplianceResult } from "./compliance-review";
import { runFinalCheck, type FinalCheckResult } from "./final-check";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StructureDealInput {
  analysis: FullAnalysis;
  program: LoanProgram;
  borrowerName: string;
  loanPurpose: string | null;
  propertyAddress: string | null;
  requestedAmount: number;
  requestedRate?: number;
  requestedTermMonths?: number;
  propertyValue?: number;
  collateralValue?: number;
  stateAbbr: string | null;
}

export interface StructureDealOutput {
  rulesEngine: RulesEngineOutput;
  aiEnhancement: AiEnhancement;
  compliance: ComplianceResult;
  finalCheck: FinalCheckResult;
  status: "approved" | "needs_review";
  declineReasons: string[];
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function structureDeal(input: StructureDealInput): Promise<StructureDealOutput> {
  // -------------------------------------------------------------------------
  // Layer 1: Rules Engine (deterministic)
  // -------------------------------------------------------------------------
  const rulesInput: RulesEngineInput = {
    analysis: input.analysis,
    program: input.program,
    requestedAmount: input.requestedAmount,
    requestedRate: input.requestedRate,
    requestedTermMonths: input.requestedTermMonths,
    propertyValue: input.propertyValue,
    collateralValue: input.collateralValue,
    stateAbbr: input.stateAbbr ?? undefined,
  };

  const rulesEngine = runRulesEngine(rulesInput);

  // -------------------------------------------------------------------------
  // Layer 2: AI Enhancement (Claude — prose only)
  // -------------------------------------------------------------------------
  const aiEnhancement = await runAiStructuring({
    rulesOutput: rulesEngine,
    analysis: input.analysis,
    program: input.program,
    borrowerName: input.borrowerName,
    loanPurpose: input.loanPurpose,
    propertyAddress: input.propertyAddress,
    stateAbbr: input.stateAbbr,
  });

  // -------------------------------------------------------------------------
  // Layer 3: Compliance Review (deterministic + Claude)
  // -------------------------------------------------------------------------
  const isCommercial = input.program.category === "commercial" || input.program.category === "specialty";

  const compliance = await runComplianceReview({
    rulesOutput: rulesEngine,
    aiEnhancement,
    program: input.program,
    borrowerName: input.borrowerName,
    stateAbbr: input.stateAbbr,
    loanAmount: rulesEngine.approvedAmount,
    isCommercial,
  });

  // -------------------------------------------------------------------------
  // Layer 4: Deterministic Final Check
  // -------------------------------------------------------------------------
  const finalCheck = runFinalCheck({
    rulesOutput: rulesEngine,
    aiEnhancement,
    compliance,
    program: input.program,
  });

  // -------------------------------------------------------------------------
  // Determine status
  // -------------------------------------------------------------------------
  const declineReasons: string[] = [];

  // Not eligible per rules engine
  if (!rulesEngine.eligibility.eligible) {
    for (const failure of rulesEngine.eligibility.failures) {
      declineReasons.push(failure.message);
    }
  }

  // Critical compliance issues
  if (!compliance.compliant) {
    for (const issue of compliance.issues.filter(i => i.severity === "critical")) {
      declineReasons.push(`[Compliance] ${issue.description}`);
    }
  }

  // Final check errors
  if (!finalCheck.passed) {
    for (const issue of finalCheck.issues.filter(i => i.severity === "error")) {
      declineReasons.push(`[Verification] ${issue.message}`);
    }
  }

  let status: "approved" | "needs_review";

  if (declineReasons.length > 0) {
    // If there are eligibility failures, it's a decline that needs human review
    // We never auto-decline — always flag for review
    status = "needs_review";
  } else if (
    rulesEngine.eligibility.warnings.length > 0 ||
    compliance.issues.some(i => i.severity === "warning") ||
    finalCheck.issues.some(i => i.severity === "warning")
  ) {
    // Warnings exist — needs human review but terms are valid
    status = "needs_review";
  } else {
    // Clean deal — can proceed to doc generation
    status = "approved";
  }

  return {
    rulesEngine,
    aiEnhancement,
    compliance,
    finalCheck,
    status,
    declineReasons,
  };
}
