// =============================================================================
// compliance-review.ts
// AI-powered compliance review layer. A SEPARATE Claude call reviews the
// complete proposed terms against federal/state regulations. If not compliant,
// flags for human review — never auto-fixes.
// =============================================================================

import type { LoanProgram } from "@/config/loan-programs";
import type { RulesEngineOutput } from "./rules-engine";
import type { AiEnhancement } from "./ai-structuring";
import { checkUsury, getDisclosureRequirements } from "@/config/state-rules";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceIssue {
  severity: "critical" | "warning" | "info";
  regulation: string;
  description: string;
  recommendation: string;
}

export interface ComplianceResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  deterministicChecks: ComplianceIssue[];
  aiReviewIssues: ComplianceIssue[];
  reviewedAt: string;
}

export interface ComplianceReviewInput {
  rulesOutput: RulesEngineOutput;
  aiEnhancement: AiEnhancement;
  program: LoanProgram;
  borrowerName: string;
  stateAbbr: string | null;
  loanAmount: number;
  isCommercial: boolean;
}

// ---------------------------------------------------------------------------
// Deterministic compliance checks (Layer 3a — no AI)
// ---------------------------------------------------------------------------

function runDeterministicChecks(input: ComplianceReviewInput): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const { rulesOutput, program, stateAbbr, loanAmount, isCommercial } = input;

  // 1. State usury check
  if (stateAbbr) {
    const usuryResult = checkUsury({
      stateAbbr,
      annualRate: rulesOutput.rate.totalRate,
      loanAmount,
      isCommercial,
    });

    if (usuryResult.violates) {
      issues.push({
        severity: "critical",
        regulation: `State Usury — ${stateAbbr}`,
        description: usuryResult.message,
        recommendation: `Reduce rate to below ${(usuryResult.limit * 100).toFixed(2)}% or verify commercial exemption applies`,
      });
    }
  }

  // 2. SBA-specific checks
  if (program.id === "sba_7a") {
    // SBA 7(a) loan amount cap
    if (loanAmount > 5_000_000) {
      issues.push({
        severity: "critical",
        regulation: "SBA 7(a) — 13 CFR 120.151",
        description: "SBA 7(a) loans may not exceed $5,000,000",
        recommendation: "Reduce loan amount to $5,000,000 or less",
      });
    }

    // SBA rate caps by size
    const totalRate = rulesOutput.rate.totalRate;
    const prime = rulesOutput.rate.baseRateValue;
    if (loanAmount <= 50000 && totalRate > prime + 0.065) {
      issues.push({
        severity: "critical",
        regulation: "SBA 7(a) Rate Cap — ≤$50K",
        description: `Rate ${(totalRate * 100).toFixed(2)}% exceeds SBA cap of Prime + 6.5% = ${((prime + 0.065) * 100).toFixed(2)}%`,
        recommendation: "Reduce rate to within SBA maximum spread",
      });
    } else if (loanAmount <= 250000 && totalRate > prime + 0.06) {
      issues.push({
        severity: "critical",
        regulation: "SBA 7(a) Rate Cap — $50K-$250K",
        description: `Rate ${(totalRate * 100).toFixed(2)}% exceeds SBA cap of Prime + 6.0% = ${((prime + 0.06) * 100).toFixed(2)}%`,
        recommendation: "Reduce rate to within SBA maximum spread",
      });
    } else if (loanAmount > 250000 && totalRate > prime + 0.0275) {
      issues.push({
        severity: "critical",
        regulation: "SBA 7(a) Rate Cap — >$250K",
        description: `Rate ${(totalRate * 100).toFixed(2)}% exceeds SBA cap of Prime + 2.75% (variable) = ${((prime + 0.0275) * 100).toFixed(2)}%`,
        recommendation: "Reduce rate to within SBA maximum spread for variable-rate loans over $250K",
      });
    }
  }

  if (program.id === "sba_504") {
    if (loanAmount > 5_000_000) {
      issues.push({
        severity: "critical",
        regulation: "SBA 504 — 13 CFR 120.932",
        description: "SBA 504 CDC portion may not exceed $5,000,000 ($5,500,000 for manufacturing/energy)",
        recommendation: "Verify loan qualifies for manufacturing/energy exception or reduce amount",
      });
    }
  }

  // 3. TILA/Reg Z checks — only for consumer-purpose or residential programs
  const isConsumerProgram = program.category === "residential" ||
    program.applicableRegulations.some(r => r === "TILA/Reg Z" || r === "TILA" || r === "RESPA");
  if (isConsumerProgram) {
    // APR calculation check (rough estimate — proper Reg Z Appendix J would use actuarial method)
    const termYears = rulesOutput.termMonths / 12;
    const apr = termYears > 0 ? rulesOutput.rate.totalRate + (rulesOutput.totalFees / loanAmount / termYears) : rulesOutput.rate.totalRate;
    if (apr > rulesOutput.rate.totalRate * 1.5) {
      issues.push({
        severity: "warning",
        regulation: "TILA/Reg Z — High-cost mortgage test",
        description: `Effective APR including fees (~${(apr * 100).toFixed(2)}%) significantly exceeds note rate — may trigger high-cost mortgage provisions`,
        recommendation: "Review fee structure; perform full Reg Z Appendix J APR calculation before closing",
      });
    }
  }

  // 4. Disclosure requirements
  if (stateAbbr) {
    const disclosures = getDisclosureRequirements(stateAbbr);
    if (disclosures.length > 0) {
      issues.push({
        severity: "info",
        regulation: `State Disclosure — ${stateAbbr}`,
        description: `Required disclosures for ${stateAbbr}: ${disclosures.join(", ")}`,
        recommendation: "Ensure all required state disclosures are included in loan documents",
      });
    }
  }

  // 5. Prepayment penalty compliance
  if (rulesOutput.prepaymentPenalty) {
    if (program.applicableRegulations.some(r => r.includes("Dodd-Frank") || r.includes("ATR"))) {
      issues.push({
        severity: "warning",
        regulation: "Dodd-Frank — Prepayment penalty restrictions",
        description: "Prepayment penalties on covered mortgages are restricted under Dodd-Frank/ATR rules",
        recommendation: "Verify prepayment penalty structure complies with QM/ATR requirements or that loan qualifies for business purpose exemption",
      });
    }
  }

  // 6. ECOA/Reg B — fair lending
  issues.push({
    severity: "info",
    regulation: "ECOA/Reg B",
    description: "Ensure pricing and terms do not result in disparate treatment or disparate impact",
    recommendation: "Document legitimate, non-discriminatory business reasons for all term decisions",
  });

  return issues;
}

// ---------------------------------------------------------------------------
// AI compliance review (Layer 3b)
// ---------------------------------------------------------------------------

function buildCompliancePrompt(input: ComplianceReviewInput): string {
  const { rulesOutput, aiEnhancement, program, borrowerName, stateAbbr } = input;

  return `Review the following proposed loan terms for regulatory compliance.

LOAN PROGRAM: ${program.name}
BORROWER: ${borrowerName}
STATE: ${stateAbbr ?? "Unknown"}
AMOUNT: $${rulesOutput.approvedAmount.toLocaleString()}
RATE: ${(rulesOutput.rate.totalRate * 100).toFixed(3)}%
TERM: ${rulesOutput.termMonths} months
LTV: ${rulesOutput.ltv ? (rulesOutput.ltv * 100).toFixed(1) + "%" : "N/A"}

APPLICABLE REGULATIONS: ${program.applicableRegulations.join(", ")}
COMPLIANCE CHECKS REQUIRED: ${program.complianceChecks.join(", ")}

COVENANTS (standard + custom):
${rulesOutput.covenants.map(c => `- ${c.name}: ${c.description}`).join("\n")}
${aiEnhancement.customCovenants.map(c => `- [CUSTOM] ${c.name}: ${c.description}`).join("\n")}

CONDITIONS:
${rulesOutput.conditions.map(c => `- [${c.category}] ${c.description}`).join("\n")}
${aiEnhancement.additionalConditions.map(c => `- [${c.category}] [AI] ${c.description}`).join("\n")}

FEES:
${rulesOutput.fees.map(f => `- ${f.name}: $${f.amount.toLocaleString()} (${f.description})`).join("\n")}
Total fees: $${rulesOutput.totalFees.toLocaleString()}

Review for:
1. Missing required regulatory provisions
2. Covenant language that could be challenged as unfair/deceptive (UDAP)
3. Fee reasonableness and disclosure requirements
4. Any terms that conflict with applicable regulations
5. Missing conditions that should be required for compliance

Respond in JSON format:
{
  "issues": [{ "severity": "critical"|"warning"|"info", "regulation": string, "description": string, "recommendation": string }]
}

Only flag REAL issues. Do not generate generic warnings. If the deal looks compliant, return an empty issues array.`;
}

async function runAiComplianceReview(input: ComplianceReviewInput): Promise<ComplianceIssue[]> {
  try {
    const { claudeJson } = await import("@/lib/claude");

    const result = await claudeJson<{ issues: ComplianceIssue[] }>({
      systemPrompt: "You are a bank compliance officer reviewing proposed loan terms for regulatory compliance. Be specific and cite actual regulations. Only flag genuine issues — do not generate boilerplate warnings.",
      userPrompt: buildCompliancePrompt(input),
    });

    return Array.isArray(result.issues) ? result.issues : [];
  } catch (error) {
    console.error("AI compliance review failed:", error);
    return [{
      severity: "warning",
      regulation: "System",
      description: "AI compliance review was unavailable — manual compliance review required",
      recommendation: "Have compliance officer manually review all terms before approval",
    }];
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runComplianceReview(input: ComplianceReviewInput): Promise<ComplianceResult> {
  // Layer 3a: Deterministic checks (always run)
  const deterministicChecks = runDeterministicChecks(input);

  // Layer 3b: AI review (adds nuance)
  const aiReviewIssues = await runAiComplianceReview(input);

  // Combine all issues
  const allIssues = [...deterministicChecks, ...aiReviewIssues];

  // Deal is non-compliant if any critical issues exist
  const compliant = !allIssues.some((i) => i.severity === "critical");

  return {
    compliant,
    issues: allIssues,
    deterministicChecks,
    aiReviewIssues,
    reviewedAt: new Date().toISOString(),
  };
}
