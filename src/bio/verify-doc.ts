// verify-doc.ts
// Deterministic verification of generated bio document prose. No AI — uses string
// matching to confirm that key data from the program context appears correctly.
//
// IMPORTANT: For all supported doc types, the templates handle deterministic
// fields (sponsor info, drug name, dates). The AI prose is responsible for
// narrative content. This verifier checks that prose references the correct
// drug, sponsor, regulatory citations, and ADC-specific data where applicable.

import type { BioDocumentInput } from "./templates/types";

// Helpers

/** Flatten all prose values into a single searchable string. */
function flattenProse(prose: Record<string, unknown>): string {
  return Object.values(prose)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v) => typeof v === "string")
    .join(" ");
}

/** Check if any of the candidate strings appear in the text (case-insensitive). */
function containsAnyCI(text: string, candidates: string[]): boolean {
  const lower = text.toLowerCase();
  return candidates.some((c) => c && lower.includes(c.toLowerCase()));
}

// Result types

export interface BioVerificationIssue {
  field: string;
  severity: "critical" | "warning";
  message: string;
}

export interface BioVerificationResult {
  passed: boolean;
  issues: BioVerificationIssue[];
  checksRun: number;
  checksPassed: number;
}


// Prose shape validation — expected keys per doc type (must stay in sync with generate-all.ts)
const EXPECTED_KEYS: Record<string, string[]> = {
  ind_module_1: ["introductoryStatement", "generalInvestigationalPlan"],
  ind_module_2: [
    "qualitySummary", "nonclinicalOverview", "clinicalOverview",
    "startingDoseJustification", "safetyMarginAnalysis",
  ],
  ind_module_3: [
    "manufacturingProcessDescription", "controlStrategy",
    "stabilityConclusions", "impurityProfile",
  ],
  ind_module_4: [
    "toxicologyNarrative", "pharmacologyNarrative",
    "pkNarrative", "safetyPharmacologyNarrative",
  ],
  ind_module_5: [
    "studyRationale", "safetyMonitoringPlan", "statisticalApproach",
  ],
  investigator_brochure: [
    "drugDescription", "nonclinicalSummary", "safetyProfile",
    "riskManagement", "dosingRationale",
  ],
  clinical_protocol: [
    "backgroundRationale", "studyDesignRationale", "safetyMonitoringPlan",
    "statisticalMethods", "ethicalConsiderations",
  ],
  pre_ind_briefing: [
    "executiveSummary", "cmcSummary", "nonclinicalSummary",
    "clinicalPlanSummary", "fdaQuestions",
  ],
  informed_consent: [
    "studyPurpose", "procedures", "risks",
    "benefits", "alternatives", "confidentiality",
  ],
  diversity_action_plan: [
    "epidemiologySummary", "recruitmentStrategy",
    "communityEngagement", "accommodations",
  ],
};

// Regulatory references that should appear in prose per doc type
const EXPECTED_REFERENCES: Record<string, string[]> = {
  ind_module_1: ["21 CFR 312", "Form 1571"],
  ind_module_2: ["ICH M4", "ICH S9", "NOAEL", "HED"],
  ind_module_3: ["21 CFR 312.23(a)(7)", "ICH Q6B"],
  ind_module_4: ["21 CFR Part 58", "ICH S9", "ICH S6", "GLP", "NOAEL"],
  ind_module_5: ["Project Optimus", "FDORA", "21 CFR 312", "DLT"],
  investigator_brochure: ["21 CFR 312.23(a)(5)", "ICH E6"],
  clinical_protocol: ["21 CFR 312.23(a)(6)", "Project Optimus", "ICH E6"],
  pre_ind_briefing: ["21 CFR 312.82", "pre-IND"],
  informed_consent: ["21 CFR 50", "IRB"],
  diversity_action_plan: ["FDORA"],
};

// Individual checks

/** Check that prose has all expected keys for the document type. */
function checkProseKeys(
  docType: string,
  prose: Record<string, unknown>,
  issues: BioVerificationIssue[],
): boolean {
  const keys = EXPECTED_KEYS[docType];
  if (!keys) return true;

  let allPresent = true;
  for (const key of keys) {
    const value = prose[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      issues.push({
        field: `prose:${key}`,
        severity: "critical",
        message: `Missing or empty prose section "${key}"`,
      });
      allPresent = false;
    }
  }
  return allPresent;
}

/** Check that the drug name appears in the prose. */
function checkDrugName(
  input: BioDocumentInput,
  proseText: string,
  issues: BioVerificationIssue[],
): boolean {
  if (containsAnyCI(proseText, [input.drugName])) {
    return true;
  }
  issues.push({
    field: "drugName",
    severity: "warning",
    message: `Drug name "${input.drugName}" not found in document prose`,
  });
  return false;
}

/** Check that the sponsor name appears in the prose. */
function checkSponsorName(
  input: BioDocumentInput,
  proseText: string,
  issues: BioVerificationIssue[],
): boolean {
  if (containsAnyCI(proseText, [input.sponsorName])) {
    return true;
  }
  issues.push({
    field: "sponsorName",
    severity: "warning",
    message: `Sponsor name "${input.sponsorName}" not found in document prose`,
  });
  return false;
}

/** For ADC drug class, check that DAR value appears in prose where relevant. */
function checkADCData(
  input: BioDocumentInput,
  docType: string,
  proseText: string,
  issues: BioVerificationIssue[],
): boolean {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  if (!isADC) return true;

  // DAR check — only for doc types that should reference DAR
  const darRelevantTypes = new Set([
    "ind_module_2", "ind_module_3", "ind_module_4",
    "investigator_brochure", "pre_ind_briefing",
  ]);

  if (input.dar !== undefined && darRelevantTypes.has(docType)) {
    const darCandidates = [
      `DAR`,
      input.dar.toString(),
      `${input.dar}`,
    ];
    if (!containsAnyCI(proseText, darCandidates)) {
      issues.push({
        field: "dar",
        severity: "warning",
        message: `DAR value (${input.dar}) not found in ADC document prose`,
      });
      return false;
    }
  }

  return true;
}

/** Check that key regulatory references appear in prose. */
function checkRegulatoryReferences(
  docType: string,
  proseText: string,
  issues: BioVerificationIssue[],
): number {
  const refs = EXPECTED_REFERENCES[docType];
  if (!refs) return 0;

  let passed = 0;
  for (const ref of refs) {
    if (containsAnyCI(proseText, [ref])) {
      passed++;
    } else {
      issues.push({
        field: `regulatory:${ref}`,
        severity: "warning",
        message: `Expected regulatory reference "${ref}" not found in document prose`,
      });
    }
  }
  return passed;
}

// Main entry point

export function verifyBioDocument(
  docType: string,
  input: BioDocumentInput,
  prose: Record<string, unknown>,
): BioVerificationResult {
  const issues: BioVerificationIssue[] = [];
  const proseText = flattenProse(prose);

  let checksRun = 0;
  let checksPassed = 0;

  // Zero-AI docs (fda_form_1571) — no prose to verify
  if (docType === "fda_form_1571") {
    return { passed: true, issues: [], checksRun: 0, checksPassed: 0 };
  }

  // 1. Prose shape check — catches malformed AI responses
  checksRun++;
  if (checkProseKeys(docType, prose, issues)) checksPassed++;

  // 2. Drug name check
  checksRun++;
  if (checkDrugName(input, proseText, issues)) checksPassed++;

  // 3. Sponsor name check
  checksRun++;
  if (checkSponsorName(input, proseText, issues)) checksPassed++;

  // 4. ADC-specific data check (DAR)
  checksRun++;
  if (checkADCData(input, docType, proseText, issues)) checksPassed++;

  // 5. Regulatory reference checks
  const refs = EXPECTED_REFERENCES[docType];
  if (refs) {
    checksRun += refs.length;
    checksPassed += checkRegulatoryReferences(docType, proseText, issues);
  }

  // Determine pass/fail: critical issues mean failure
  const hasCritical = issues.some((i) => i.severity === "critical");

  return {
    passed: !hasCritical,
    issues,
    checksRun,
    checksPassed,
  };
}
