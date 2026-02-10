// =============================================================================
// legal-review.ts
// AI-powered legal review of generated document prose. A SEPARATE Claude call
// (independent from generation) reviews the complete document for legal
// accuracy, regulatory compliance, and internal consistency.
// =============================================================================

import type {
  DocumentInput,
  AiDocProse,
  LegalReviewResult,
  LegalIssue,
  ComplianceCheck,
} from "@/documents/types";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
} from "@/documents/doc-helpers";
import { getLegalChecklist } from "./legal-knowledge";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const REVIEW_SYSTEM_PROMPT = `You are a senior bank regulatory compliance officer and legal reviewer with 25+ years of experience examining loan documents for institutional lenders. You have deep expertise in UCC Article 9, federal lending regulations (TILA/Reg Z, ECOA/Reg B, RESPA), state usury laws, SBA lending requirements, CERCLA/RCRA environmental law, bankruptcy code provisions, and ABA legal opinion standards.

YOUR JOB: Review the draft document prose for genuine legal deficiencies — enforceability defects, regulatory non-compliance, missing required provisions, or factual errors. If you find real issues, REWRITE the affected sections to fix them. If the document is well-drafted and compliant, return empty results. Do NOT flag stylistic preferences, theoretical improvements, or issues that do not affect enforceability or compliance.

SPECIFIC LEGAL ISSUES YOU MUST CHECK AND FIX:

1. MISSING STATUTORY CITATIONS: Every legal provision must cite the specific statute it derives from. "Under applicable law" is NEVER acceptable — cite the actual section (UCC §9-610(b), 42 U.S.C. §9601(14), 11 U.S.C. §362(d), etc.).

2. ENFORCEABILITY DEFECTS:
   - Waivers must be specific and explicit (general "waives all defenses" is unenforceable in most jurisdictions)
   - Acceleration clauses must include notice requirements and cure periods per state law
   - Jury trial waivers must be conspicuous, mutual, and clearly voluntary
   - Guaranty must be of PAYMENT not COLLECTION (guarantor directly liable without requiring pursuit of borrower first)
   - Forum selection clauses must specify exact court (e.g., "United States District Court for the Southern District of New York" not just "New York courts")

3. REGULATORY COMPLIANCE:
   - UCC Article 9: Collateral descriptions must use §9-108 categories, not supergeneric descriptions prohibited by §9-108(c). Perfection must reference proper filing office per §9-501.
   - CERCLA/RCRA: Environmental indemnities must define "Hazardous Substances" per 42 U.S.C. §9601(14) including the petroleum exclusion. Must reference CERCLA §9607(a) liability standard.
   - Bankruptcy: Adequate protection provisions must reference 11 U.S.C. §361, §362, §363, §364 specifically. DIP financing consent must address priority under §364(c) and (d).
   - SBA: SBA loans must comply with SBA SOP 50-10 fee limits and authorization requirements.
   - State usury: Must include usury savings clause providing that interest shall not exceed the maximum lawful rate and any excess shall be credited to principal.

4. INTERNAL CONSISTENCY:
   - Every dollar amount, interest rate, fee, date, and term in the prose MUST match the DEAL TERMS provided exactly
   - Cross-references between sections must be accurate
   - Defined terms must be used consistently
   - Covenant thresholds must match the deal terms

5. COMPLETENESS:
   - Default provisions must include: payment default (with specific cure period), covenant breach (with specific cure period), cross-default, bankruptcy/insolvency, material adverse change, judgment default, change of control
   - Remedies must include: acceleration, setoff rights, UCC foreclosure rights (if secured), receiver appointment, collection of rents (if applicable)
   - Notice provisions must specify: method of delivery, addresses, deemed receipt timing

6. STATE-SPECIFIC REQUIREMENTS:
   - Governing law must name the specific state with conflict-of-laws exclusion
   - Must comply with state-specific notice/cure periods for default and acceleration
   - Community property states (AZ, CA, ID, LA, NV, NM, TX, WA, WI) may require spousal consent

RULES FOR YOUR CORRECTIONS:
- NEVER change any dollar amount, interest rate, fee amount, date, term length, LTV, or any other number. These come from the rules engine and are the absolute source of truth. If a number is wrong, flag it but do NOT change it.
- FIX all legal language deficiencies: add missing provisions, add statutory citations, tighten ambiguous clauses, add required carve-outs and exceptions, fix enforceability issues.
- Return the COMPLETE corrected text for each section you modify. Do not return partial snippets or summaries.
- If a section is well-drafted with no issues, do NOT include it in corrected_sections.
- If the entire document is well-drafted, return empty issues_found and empty corrected_sections. Do NOT invent problems.

For each item in the VERIFICATION CHECKLIST (if provided), report whether the document satisfies it AFTER your corrections. Include ALL checklist items — both passed and failed.

Respond ONLY with valid JSON matching this schema:
{
  "issues_found": [
    {
      "severity": "critical" | "warning" | "info",
      "section": "string — the exact section key where the issue exists",
      "description": "string — specific description of the legal deficiency, citing the statute or standard violated",
      "fix_applied": "string — specific description of what you changed in corrected_sections to fix it"
    }
  ],
  "corrected_sections": {
    "sectionKey": "string — the COMPLETE rewritten text for this section with all fixes applied"
  },
  "checklist_results": [
    {
      "provision": "string — the exact checklist item text",
      "category": "required" | "standard" | "regulatory" | "cross_document",
      "passed": true | false,
      "note": "string — specific explanation citing statute or standard"
    }
  ]
}`;

// ---------------------------------------------------------------------------
// User prompt builder
// ---------------------------------------------------------------------------

function buildReviewPrompt(
  docType: string,
  input: DocumentInput,
  prose: AiDocProse,
): string {
  const ratePercent = (input.terms.interestRate * 100).toFixed(3);

  const feesBlock = input.terms.fees
    .map((f) => `  - ${f.name}: ${formatCurrency(f.amount)}`)
    .join("\n");

  const covenantsBlock = input.terms.covenants
    .map(
      (c) =>
        `  - ${c.name}: ${c.description}${c.threshold !== undefined ? ` (threshold: ${c.threshold})` : ""}`,
    )
    .join("\n");

  const conditionsBlock = input.terms.conditions
    .map((c) => `  - [${c.category}] ${c.description}`)
    .join("\n");

  // Serialize the prose sections for review
  const proseSections = Object.entries(prose)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `### ${key}\n${value.map((v, i) => `  ${i + 1}. ${v}`).join("\n")}`;
      }
      return `### ${key}\n${value}`;
    })
    .join("\n\n");

  const specialTermsBlock = input.terms.specialTerms
    ? input.terms.specialTerms.map((s) => {
        if (typeof s === "string") return `  - ${s}`;
        return `  - ${s.title}: ${s.description}`;
      }).join("\n")
    : "  None";

  // Inject legal checklist if available
  const checklist = getLegalChecklist(docType, input.programId);
  let checklistSection = "";
  if (checklist) {
    checklistSection = `
VERIFICATION CHECKLIST — You MUST verify each item below:

REQUIRED PROVISIONS (flag as CRITICAL if missing):
${checklist.requiredProvisions.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

STANDARD PROVISIONS (flag as WARNING if missing):
${checklist.standardProvisions.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

REGULATORY REFERENCES (verify compliance with):
${checklist.regulatoryReferences.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}

CROSS-DOCUMENT CONSISTENCY (verify these match):
${checklist.crossDocConsistency.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

`;
  }

  return `Review the following ${docType.replace(/_/g, " ").toUpperCase()} draft.

DEAL TERMS (source of truth):
Borrower: ${input.borrowerName}
Lender: ${input.lenderName}
Loan Program: ${input.programName} (${input.programCategory})
State: ${input.stateAbbr ?? "Not specified"}
Principal Amount: ${formatCurrency(input.terms.approvedAmount)}
Interest Rate: ${ratePercent}% per annum
Term: ${input.terms.termMonths} months
Monthly Payment: ${formatCurrencyDetailed(input.terms.monthlyPayment)}
Maturity Date: ${formatDate(input.maturityDate)}
LTV: ${input.terms.ltv ? (input.terms.ltv * 100).toFixed(1) + "%" : "N/A"}
Interest Only: ${input.terms.interestOnly ? "Yes" : "No"}
Prepayment Penalty: ${input.terms.prepaymentPenalty ? "Yes" : "No"}
Personal Guaranty: ${input.terms.personalGuaranty ? "Yes" : "No"}
Late Fee: ${(input.terms.lateFeePercent * 100).toFixed(1)}% after ${input.terms.lateFeeGraceDays} day grace period
Collateral Types: ${input.collateralTypes.join(", ")}

FEES:
${feesBlock || "  None"}

COVENANTS:
${covenantsBlock || "  None"}

CONDITIONS:
${conditionsBlock || "  None"}

SPECIAL TERMS:
${specialTermsBlock}

${checklistSection}DOCUMENT PROSE SECTIONS:
${proseSections}

Review this document for legal accuracy, regulatory compliance, and internal consistency. Only flag genuine issues — do not invent problems if the document is well-drafted.`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/** Extract regulatory framework name from a provision description */
function extractRegulation(provision: string): string {
  const lower = provision.toLowerCase();
  if (lower.includes("ucc") || lower.includes("uniform commercial code") || lower.includes("§9-") || lower.includes("section 9-")) return "Uniform Commercial Code";
  if (lower.includes("cercla") || lower.includes("42 usc") || lower.includes("42 u.s.c")) return "CERCLA (42 U.S.C. §9601 et seq.)";
  if (lower.includes("rcra") || lower.includes("resource conservation")) return "RCRA (42 U.S.C. §6901 et seq.)";
  if (lower.includes("clean water") || lower.includes("33 usc")) return "Clean Water Act";
  if (lower.includes("tila") || lower.includes("regulation z") || lower.includes("12 cfr")) return "Truth in Lending Act (Reg Z)";
  if (lower.includes("ecoa") || lower.includes("equal credit")) return "Equal Credit Opportunity Act";
  if (lower.includes("respa")) return "Real Estate Settlement Procedures Act";
  if (lower.includes("bankruptcy") || lower.includes("11 u.s.c") || lower.includes("§36") || lower.includes("section 36")) return "U.S. Bankruptcy Code";
  if (lower.includes("aba") || lower.includes("american bar")) return "ABA Legal Opinion Accord";
  if (lower.includes("tribar")) return "TriBar Opinion Committee Standards";
  if (lower.includes("usury")) return "State Usury Law";
  if (lower.includes("llc act") || lower.includes("corporation act") || lower.includes("partnership act")) return "State Entity Law";
  if (lower.includes("landlord-tenant") || lower.includes("lease subordination")) return "State Landlord-Tenant Law";
  if (lower.includes("recording")) return "State Recording Requirements";
  if (lower.includes("community property")) return "Community Property Law";
  return "Commercial Lending Standards";
}

export async function reviewDocument(
  docType: string,
  input: DocumentInput,
  prose: AiDocProse,
): Promise<{ review: LegalReviewResult; complianceChecks: ComplianceCheck[]; correctedProse: AiDocProse | null }> {
  const { claudeJson } = await import("@/lib/claude");

  try {
    const result = await claudeJson<{
      issues_found?: Array<{
        severity: string;
        section: string;
        description: string;
        fix_applied: string;
      }>;
      corrected_sections?: Record<string, string | string[]>;
      checklist_results?: Array<{
        provision: string;
        category: string;
        passed: boolean;
        note?: string;
      }>;
    }>({
      systemPrompt: REVIEW_SYSTEM_PROMPT,
      userPrompt: buildReviewPrompt(docType, input, prose),
      maxTokens: 8000,
    });

    const rawIssues = Array.isArray(result.issues_found) ? result.issues_found : [];

    // Validate issue shape — map fix_applied to recommendation for downstream compatibility
    const validatedIssues: LegalIssue[] = rawIssues
      .filter(
        (issue) =>
          typeof issue.severity === "string" &&
          typeof issue.section === "string" &&
          typeof issue.description === "string",
      )
      .map((issue) => ({
        severity: (["critical", "warning", "info"].includes(issue.severity)
          ? issue.severity
          : "warning") as LegalIssue["severity"],
        section: issue.section,
        description: issue.description,
        recommendation: issue.fix_applied || "Corrected in revised prose",
      }));

    const hasCritical = validatedIssues.some((i) => i.severity === "critical");

    // Apply corrected sections to prose
    let correctedProse: AiDocProse | null = null;
    if (result.corrected_sections && Object.keys(result.corrected_sections).length > 0) {
      correctedProse = { ...prose };
      for (const [key, value] of Object.entries(result.corrected_sections)) {
        if (key in prose && value != null) {
          correctedProse[key] = value;
        }
      }
    }

    // If the reviewer found critical issues AND provided corrections, the issues
    // are resolved. Only fail if there are criticals with NO corrections applied.
    const issuesResolved = hasCritical && correctedProse !== null;
    const passed = !hasCritical || issuesResolved;

    // Build compliance checks from AI checklist results
    const complianceChecks: ComplianceCheck[] = [];
    if (Array.isArray(result.checklist_results)) {
      for (const item of result.checklist_results) {
        if (typeof item.provision === "string" && typeof item.passed === "boolean") {
          const regulation = extractRegulation(item.provision);
          complianceChecks.push({
            name: item.provision,
            regulation,
            category: (["required", "standard", "regulatory", "cross_document"].includes(item.category)
              ? item.category
              : "standard") as ComplianceCheck["category"],
            passed: item.passed,
            note: item.note,
          });
        }
      }
    }

    return {
      review: {
        passed,
        issues: validatedIssues,
        reviewedAt: new Date().toISOString(),
      },
      complianceChecks,
      correctedProse,
    };
  } catch (error) {
    console.error("Legal review failed:", error);
    return {
      review: {
        passed: false,
        issues: [
          {
            severity: "critical",
            section: "system",
            description: "Legal review could not be completed due to a system error.",
            recommendation:
              "Retry document generation or perform manual legal review before execution.",
          },
        ],
        reviewedAt: new Date().toISOString(),
      },
      complianceChecks: [],
      correctedProse: null,
    };
  }
}
