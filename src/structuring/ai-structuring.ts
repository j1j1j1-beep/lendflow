// =============================================================================
// ai-structuring.ts
// AI enhancement layer for deal structuring. Takes the rules engine output
// and adds custom covenant language, condition recommendations, and narrative
// justification. Claude writes PROSE ONLY — never changes numbers.
// =============================================================================

import type { FullAnalysis } from "@/analysis/analyze";
import type { LoanProgram } from "@/config/loan-programs";
import type { RulesEngineOutput } from "./rules-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiStructuringInput {
  rulesOutput: RulesEngineOutput;
  analysis: FullAnalysis;
  program: LoanProgram;
  borrowerName: string;
  loanPurpose: string | null;
  propertyAddress: string | null;
  stateAbbr: string | null;
}

export interface AiEnhancement {
  customCovenants: Array<{
    name: string;
    description: string;
    rationale: string;
    frequency: "annual" | "quarterly" | "monthly";
  }>;
  additionalConditions: Array<{
    category: "prior_to_closing" | "prior_to_funding" | "post_closing";
    description: string;
    rationale: string;
    priority: "required" | "recommended";
  }>;
  specialTerms: string[];
  justification: string;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(program: LoanProgram): string {
  return `You are a senior commercial lending officer structuring a ${program.name} loan.

Your role is to ENHANCE the deal terms that have already been set by the rules engine. You do NOT set rates, amounts, LTV, or any numerical values. Those are already determined.

You provide:
1. CUSTOM COVENANTS — additional covenants beyond the standard program covenants, based on the specific risk profile of this borrower. Only add covenants that are genuinely warranted by the analysis.
2. ADDITIONAL CONDITIONS — conditions beyond the standard ones, triggered by specific risk flags or unusual circumstances.
3. SPECIAL TERMS — any deal-specific language or provisions needed.
4. JUSTIFICATION — a narrative explaining WHY these terms are appropriate for this borrower.

Applicable regulations for this program: ${program.applicableRegulations.join(", ")}

RULES:
- Never suggest changing the interest rate, loan amount, LTV, or any number
- Focus on protective language, not restrictive pricing
- Be specific and actionable — generic covenants add no value
- Only add covenants/conditions that are warranted by the actual risk flags
- Write in professional lending language
- Keep justification to 2-4 paragraphs

Respond in JSON format matching this schema:
{
  "customCovenants": [{ "name": string, "description": string, "rationale": string, "frequency": "annual"|"quarterly"|"monthly" }],
  "additionalConditions": [{ "category": "prior_to_closing"|"prior_to_funding"|"post_closing", "description": string, "rationale": string, "priority": "required"|"recommended" }],
  "specialTerms": [string],
  "justification": string
}`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

function buildUserPrompt(input: AiStructuringInput): string {
  const { rulesOutput, analysis, program, borrowerName, loanPurpose } = input;

  const riskFlagsSummary = analysis.riskFlags
    .map((f) => `[${f.severity}] ${f.title}: ${f.description}`)
    .join("\n");

  return `Structure enhancement for ${borrowerName}

LOAN PROGRAM: ${program.name} (${program.category})
LOAN PURPOSE: ${loanPurpose ?? "Not specified"}
APPROVED AMOUNT: $${rulesOutput.approvedAmount.toLocaleString()}
INTEREST RATE: ${(rulesOutput.rate.totalRate * 100).toFixed(3)}% (${rulesOutput.rate.baseRateType} ${(rulesOutput.rate.baseRateValue * 100).toFixed(2)}% + ${(rulesOutput.rate.spread * 100).toFixed(3)}% spread)
TERM: ${rulesOutput.termMonths} months${rulesOutput.interestOnly ? " (interest only)" : ""}
LTV: ${rulesOutput.ltv ? (rulesOutput.ltv * 100).toFixed(1) + "%" : "N/A"}
MONTHLY PAYMENT: $${rulesOutput.monthlyPayment.toLocaleString()}

BORROWER ANALYSIS SUMMARY:
- Qualifying Income: $${analysis.summary.qualifyingIncome.toLocaleString()}/year
- DSCR: ${analysis.summary.globalDscr?.toFixed(2) ?? "N/A"}x
- DTI: ${analysis.summary.backEndDti ? (analysis.summary.backEndDti * 100).toFixed(1) + "%" : "N/A"}
- Reserves: ${analysis.summary.monthsOfReserves.toFixed(1)} months
- Risk Rating: ${analysis.summary.riskRating.toUpperCase()}
- Risk Score: ${analysis.riskScore}/100

RISK FLAGS:
${riskFlagsSummary || "None identified"}

ELIGIBILITY:
${rulesOutput.eligibility.eligible ? "ELIGIBLE" : "NOT ELIGIBLE — " + rulesOutput.eligibility.failures.map(f => f.message).join("; ")}
${rulesOutput.eligibility.warnings.length > 0 ? "Warnings: " + rulesOutput.eligibility.warnings.join("; ") : ""}

STANDARD COVENANTS ALREADY INCLUDED:
${rulesOutput.covenants.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

STANDARD CONDITIONS ALREADY INCLUDED:
${rulesOutput.conditions.map((c) => `- [${c.category}] ${c.description}`).join("\n")}

Based on this borrower's specific risk profile, provide ONLY additional covenants, conditions, and terms that are warranted beyond the standard ones already listed. If the deal is clean with low risk, it's acceptable to return empty arrays — don't add unnecessary restrictions.`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runAiStructuring(input: AiStructuringInput): Promise<AiEnhancement> {
  const { claudeJson } = await import("@/lib/claude");

  const systemPrompt = buildSystemPrompt(input.program);
  const userPrompt = buildUserPrompt(input);

  try {
    const result = await claudeJson<AiEnhancement>({
      systemPrompt,
      userPrompt,
    });

    // Validate the response shape
    return {
      customCovenants: Array.isArray(result.customCovenants) ? result.customCovenants : [],
      additionalConditions: Array.isArray(result.additionalConditions) ? result.additionalConditions : [],
      specialTerms: Array.isArray(result.specialTerms) ? result.specialTerms : [],
      justification: typeof result.justification === "string" ? result.justification : "",
    };
  } catch (error) {
    console.error("AI structuring failed, returning empty enhancement:", error);
    // Graceful degradation — rules engine output is still valid without AI enhancement
    return {
      customCovenants: [],
      additionalConditions: [],
      specialTerms: [],
      justification: "AI enhancement unavailable — terms based on rules engine only.",
    };
  }
}
