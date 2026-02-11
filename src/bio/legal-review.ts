// legal-review.ts
// AI-powered regulatory compliance review of generated bio document prose.
// A SEPARATE Grok call (independent from generation) reviews the complete
// document for FDA regulatory accuracy, CFR citation correctness, and
// internal consistency with the program data.

import type { BioDocumentInput } from "./templates/types";
import { getBioChecklistFull } from "./compliance/bio-checklists";
import { getBioRegulatoryReferences } from "./compliance/regulatory-references";

// System prompt

const REVIEW_SYSTEM_PROMPT = `You are an FDA regulatory affairs reviewer with 25+ years of expertise in IND submissions for biologics, antibody-drug conjugates (ADCs), gene therapies, and cell therapies. You have deep knowledge of 21 CFR Part 312 (IND requirements), 21 CFR Part 58 (GLP), ICH guidelines (M4, S6(R1), S9, E6(R2)/E6(R3), E9(R1), Q5C, Q5E, Q6B), FDA Project Optimus dose optimization guidance, FDORA diversity requirements, and the FDA ADC Clinical Pharmacology Guidance.

YOUR JOB: Review the draft IND document prose for genuine regulatory deficiencies — missing CFR citations, incorrect regulation references, ADC-specific omissions, enforceability defects, or factual errors relative to the program data. If you find real issues, REWRITE the affected sections to fix them. If the document is well-drafted and compliant, return empty results. Do NOT flag stylistic preferences or theoretical improvements.

SPECIFIC REGULATORY ISSUES YOU MUST CHECK AND FIX:

1. MISSING CFR/ICH CITATIONS: Every regulatory claim must cite the specific section. "Per FDA regulations" is NEVER acceptable — cite the actual section (e.g., "per 21 CFR 312.23(a)(7)", "per ICH S9 Section 6", "per 21 CFR 50.25(a)"). Fix by adding the correct citation.

2. ADC-SPECIFIC REQUIREMENTS (when drug class is ADC):
   - Three-analyte PK must be specified: conjugated ADC, total antibody, free payload (per FDA ADC Clinical Pharmacology Guidance)
   - DAR specification and testing must be described in CMC sections
   - Free payload limits must be defined
   - Tissue cross-reactivity must be addressed for mAb-based drugs
   - If afucosylated: ADCC potency, CRS monitoring (ASTCT grading), and MAS surveillance must be included

3. PROJECT OPTIMUS COMPLIANCE (oncology):
   - Dose optimization must identify Optimal Biological Dose (OBD), not just MTD
   - Traditional 3+3 design alone is NOT sufficient
   - Must include dose comparison strategy (parallel cohorts, backfill, expansion)

4. FDORA DIVERSITY:
   - Diversity Action Plan must be referenced where applicable
   - Enrollment goals should reflect disease epidemiology

5. INTERNAL CONSISTENCY:
   - All program data (drug name, class, target, mechanism, DAR, NOAEL, etc.) must match the PROGRAM DATA provided exactly
   - Cross-references between sections must be accurate

6. COMPLETENESS:
   - Each prose section must be a complete regulatory narrative, not a summary or outline
   - No placeholder text like "[insert data]" or "[TBD]"
   - All required subsections per the checklist must be addressed

RULES FOR YOUR CORRECTIONS:
- NEVER change any number from the program data (DAR, NOAEL, HED, safety margins, batch data, stability timepoints). These come from the rules engine and are the absolute source of truth.
- FIX all regulatory language deficiencies: add missing CFR/ICH citations, add required ADC-specific sections, correct regulation references, tighten ambiguous claims.
- Return the COMPLETE corrected text for each section you modify. Do not return partial snippets.
- If a section is well-drafted with no issues, do NOT include it in corrected_sections.
- If the entire document is well-drafted, return empty issues_found and empty corrected_sections.

For each item in the VERIFICATION CHECKLIST (if provided), report whether the document satisfies it AFTER your corrections.

Respond ONLY with valid JSON matching this schema:
{
  "issues_found": [
    {
      "severity": "critical" | "warning" | "info",
      "section": "string — the exact section key where the issue exists",
      "description": "string — specific description of the regulatory deficiency, citing the CFR/ICH standard violated",
      "fix_applied": "string — specific description of what you changed in corrected_sections to fix it"
    }
  ],
  "corrected_sections": {
    "sectionKey": "string — the COMPLETE rewritten text for this section with all fixes applied"
  },
  "checklist_results": [
    {
      "provision": "string — the exact checklist item text",
      "category": "required" | "recommended" | "regulatory" | "cross_module",
      "passed": true | false,
      "note": "string — specific explanation citing CFR/ICH standard"
    }
  ]
}`;

// User prompt builder

function buildReviewPrompt(
  docType: string,
  input: BioDocumentInput,
  prose: Record<string, unknown>,
): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");

  let programContext = `PROGRAM DATA (source of truth):
Drug Name: ${input.drugName}
Drug Class: ${input.drugClass}
Target: ${input.target ?? "Not specified"}
Mechanism of Action: ${input.mechanism ?? "Not specified"}
Indication: ${input.indication ?? "Not specified"}
Phase: ${input.phase ?? "Pre-IND"}
Sponsor: ${input.sponsorName}
IND Number: ${input.indNumber ?? "To be assigned by FDA"}
Regulatory Pathway: ${input.regulatoryPathway ?? "Standard IND (21 CFR 312)"}`;

  if (isADC) {
    programContext += `
Antibody Type: ${input.antibodyType ?? "Not specified"}
Linker Type: ${input.linkerType ?? "Not specified"}
Payload Type: ${input.payloadType ?? "Not specified"}
DAR: ${input.dar ?? "Not specified"}`;
    if (input.darSpec) {
      programContext += `
DAR Specification: ${input.darSpec.target} ± ${input.darSpec.tolerance}`;
    }
  }

  // Serialize prose sections for review
  const proseSections = Object.entries(prose)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `### ${key}\n${value.map((v, i) => `  ${i + 1}. ${v}`).join("\n")}`;
      }
      return `### ${key}\n${value}`;
    })
    .join("\n\n");

  // Inject checklist if available
  const checklist = getBioChecklistFull(docType, input.drugClass);
  let checklistSection = "";
  if (checklist) {
    checklistSection = `
VERIFICATION CHECKLIST — You MUST verify each item below:

REQUIRED CHECKS (flag as CRITICAL if missing):
${checklist.requiredChecks.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

RECOMMENDED CHECKS (flag as WARNING if missing):
${checklist.recommendedChecks.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

REGULATORY BASIS (verify compliance with):
${checklist.regulatoryBasis.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}

CROSS-MODULE CONSISTENCY (verify these match):
${checklist.crossModuleConsistency.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

`;
  }

  // Inject regulatory references
  const refs = getBioRegulatoryReferences(docType);
  let refsSection = "";
  if (refs.length > 0) {
    const refsLines = refs.map(
      (r) => `  - ${r.regulation}: ${r.description}`,
    );
    refsSection = `APPLICABLE REGULATIONS AND GUIDANCES:\n${refsLines.join("\n")}\n\n`;
  }

  return `Review the following ${docType.replace(/_/g, " ").toUpperCase()} draft.

${programContext}

${refsSection}${checklistSection}DOCUMENT PROSE SECTIONS:
${proseSections}

Review this document for FDA regulatory accuracy, CFR/ICH citation correctness, ADC-specific completeness (if applicable), and internal consistency with the program data. Only flag genuine issues — do not invent problems if the document is well-drafted.`;
}

// Helper to extract regulation name from a provision

function extractRegulation(provision: string): string {
  const lower = provision.toLowerCase();
  if (lower.includes("21 cfr 312")) return "21 CFR Part 312 (IND Requirements)";
  if (lower.includes("21 cfr part 58") || lower.includes("21 cfr 58")) return "21 CFR Part 58 (GLP)";
  if (lower.includes("21 cfr 50")) return "21 CFR Part 50 (Informed Consent)";
  if (lower.includes("21 cfr 56")) return "21 CFR Part 56 (IRB)";
  if (lower.includes("ich m4")) return "ICH M4 (CTD Format)";
  if (lower.includes("ich s9")) return "ICH S9 (Anticancer Nonclinical)";
  if (lower.includes("ich s6")) return "ICH S6(R1) (Biotech Safety)";
  if (lower.includes("ich s7")) return "ICH S7A (Safety Pharmacology)";
  if (lower.includes("ich e6")) return "ICH E6(R2) (GCP)";
  if (lower.includes("ich e9")) return "ICH E9(R1) (Biostatistics)";
  if (lower.includes("ich q6b")) return "ICH Q6B (Biotech Specifications)";
  if (lower.includes("ich q5")) return "ICH Q5 (Biotech Quality)";
  if (lower.includes("project optimus")) return "FDA Project Optimus (Dose Optimization)";
  if (lower.includes("fdora")) return "FDORA (Diversity Action Plan)";
  if (lower.includes("adc") && lower.includes("guidance")) return "FDA ADC Clinical Pharmacology Guidance";
  if (lower.includes("astct")) return "ASTCT Consensus Grading (CRS/ICANS)";
  if (lower.includes("send")) return "FDA SEND (Nonclinical Data Standards)";
  if (lower.includes("form 1571")) return "FDA Form 1571";
  return "FDA Regulatory Standards";
}

// Main entry point

export async function reviewBioDocument(
  docType: string,
  input: BioDocumentInput,
  prose: Record<string, unknown>,
): Promise<{
  review: { passed: boolean; issues: any[] };
  complianceChecks: any[];
  correctedProse: Record<string, unknown> | null;
}> {
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

    // Validate issue shape
    const validatedIssues = rawIssues
      .filter(
        (issue) =>
          typeof issue.severity === "string" &&
          typeof issue.section === "string" &&
          typeof issue.description === "string",
      )
      .map((issue) => ({
        severity: (["critical", "warning", "info"].includes(issue.severity)
          ? issue.severity
          : "warning") as "critical" | "warning" | "info",
        section: issue.section,
        description: issue.description,
        recommendation: issue.fix_applied || "Corrected in revised prose",
      }));

    const hasCritical = validatedIssues.some((i) => i.severity === "critical");

    // Apply corrected sections to prose
    let correctedProse: Record<string, unknown> | null = null;
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
    const complianceChecks: any[] = [];
    if (Array.isArray(result.checklist_results)) {
      for (const item of result.checklist_results) {
        if (typeof item.provision === "string" && typeof item.passed === "boolean") {
          const regulation = extractRegulation(item.provision);
          complianceChecks.push({
            name: item.provision,
            regulation,
            category: (["required", "recommended", "regulatory", "cross_module"].includes(item.category)
              ? item.category
              : "required") as string,
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
      },
      complianceChecks,
      correctedProse,
    };
  } catch (error) {
    console.error("Bio regulatory review failed:", error);
    return {
      review: {
        passed: false,
        issues: [
          {
            severity: "critical",
            section: "system",
            description: "Regulatory review could not be completed due to a system error.",
            recommendation: "Retry document generation or perform manual regulatory review before submission.",
          },
        ],
      },
      complianceChecks: [],
      correctedProse: null,
    };
  }
}
