// =============================================================================
// verify-doc.ts
// Deterministic verification of generated document prose. No AI — uses string
// matching to confirm that key data from the rules engine appears correctly.
//
// IMPORTANT: For supported doc types (promissory_note, loan_agreement,
// security_agreement, guaranty), the templates handle all financial numbers
// deterministically. The AI prose is NOT expected to repeat principal amounts,
// interest rates, or payment figures. This verifier only checks prose for
// content the AI is actually responsible for generating.
// =============================================================================

import type {
  DocumentInput,
  AiDocProse,
  VerificationResult,
  VerificationIssue,
} from "@/documents/types";
import {
  formatCurrency,
  formatCurrencyDetailed,
} from "@/documents/doc-helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten all prose values into a single searchable string. */
function flattenProse(prose: AiDocProse): string {
  return Object.values(prose)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .join(" ");
}

/** Check if any of the candidate strings appear in the text (case-insensitive). */
function containsAnyCI(text: string, candidates: string[]): boolean {
  const lower = text.toLowerCase();
  return candidates.some((c) => lower.includes(c.toLowerCase()));
}

// Doc types where templates handle all financial numbers deterministically
const TEMPLATE_HANDLED_TYPES = new Set([
  "promissory_note",
  "loan_agreement",
  "security_agreement",
  "guaranty",
  "commitment_letter",
  "environmental_indemnity",
  "assignment_of_leases",
  "subordination_agreement",
  "intercreditor_agreement",
  "corporate_resolution",
  "ucc_financing_statement",
  "snda",
  "estoppel_certificate",
  "settlement_statement",
  "borrowers_certificate",
  "compliance_certificate",
  "amortization_schedule",
  "closing_disclosure",
  "loan_estimate",
  "opinion_letter",
  "deed_of_trust",
  "sba_authorization",
  "cdc_debenture",
  "borrowing_base_agreement",
  "digital_asset_pledge",
  "custody_agreement",
  // Zero-AI doc types — templates handle everything, no AI prose to verify
  "sba_form_1919",
  "sba_form_1920",
  "sba_form_159",
  "sba_form_148",
  "sba_form_1050",
  "irs_4506c",
  "irs_w9",
  "flood_determination",
  "privacy_notice",
  "patriot_act_notice",
  "disbursement_authorization",
]);

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * For non-template doc types, check that the approved amount appears in prose.
 * For template doc types, the template handles this — skip check.
 */
function checkAmount(
  docType: string,
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): boolean {
  if (TEMPLATE_HANDLED_TYPES.has(docType)) return true; // Template handles it

  const expected = formatCurrency(input.terms.approvedAmount);
  const expectedDetailed = formatCurrencyDetailed(input.terms.approvedAmount);
  const rawFormatted = input.terms.approvedAmount.toLocaleString("en-US");

  if (!containsAnyCI(proseText, [expected, expectedDetailed, rawFormatted])) {
    issues.push({
      field: "approvedAmount",
      expected,
      found: "not found in prose",
      severity: "critical",
    });
    return false;
  }
  return true;
}

/**
 * For non-template doc types, check interest rate in prose.
 * Template doc types handle rates deterministically.
 */
function checkRate(
  docType: string,
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): boolean {
  if (TEMPLATE_HANDLED_TYPES.has(docType)) return true; // Template handles it

  const rate = input.terms.interestRate * 100;
  const candidates = [
    `${rate.toFixed(3)}%`,
    `${rate.toFixed(2)}%`,
    `${rate.toFixed(1)}%`,
    rate.toFixed(3),
    rate.toFixed(2),
  ];

  if (!containsAnyCI(proseText, candidates)) {
    issues.push({
      field: "interestRate",
      expected: `${rate.toFixed(3)}%`,
      found: "not found in prose",
      severity: "critical",
    });
    return false;
  }
  return true;
}

/**
 * Check that term length appears somewhere in prose.
 * This is a soft check (warning) since templates handle the primary display.
 */
function checkTerm(
  docType: string,
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): boolean {
  if (TEMPLATE_HANDLED_TYPES.has(docType)) return true; // Template handles it
  const months = input.terms.termMonths.toString();
  const years = (input.terms.termMonths / 12).toFixed(0);
  const yearsDecimal = (input.terms.termMonths / 12).toFixed(1);

  const candidates = [
    `${months} month`,
    `${months}-month`,
    `${years} year`,
    `${years}-year`,
    `${yearsDecimal} year`,
  ];

  if (!containsAnyCI(proseText, candidates)) {
    issues.push({
      field: "termMonths",
      expected: `${months} months`,
      found: "not found in prose",
      severity: "warning",
    });
    return false;
  }
  return true;
}

/**
 * Borrower name check — case-insensitive since legal docs may uppercase names.
 */
function checkBorrowerName(
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): boolean {
  if (containsAnyCI(proseText, [input.borrowerName])) {
    return true;
  }
  issues.push({
    field: "borrowerName",
    expected: input.borrowerName,
    found: "not found in prose",
    severity: "warning",
  });
  return false;
}

/**
 * Fee checks — only for non-template types where fees are in AI prose.
 * Template types show fees in deterministic tables.
 */
function checkFees(
  docType: string,
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): number {
  if (TEMPLATE_HANDLED_TYPES.has(docType)) return input.terms.fees.length; // Template handles it

  let passed = 0;
  for (const fee of input.terms.fees) {
    const expectedCurrency = formatCurrency(fee.amount);
    const expectedDetailed = formatCurrencyDetailed(fee.amount);
    const rawFormatted = fee.amount.toLocaleString("en-US");

    if (containsAnyCI(proseText, [expectedCurrency, expectedDetailed, rawFormatted])) {
      passed++;
    } else {
      issues.push({
        field: `fee:${fee.name}`,
        expected: `${fee.name}: ${expectedCurrency}`,
        found: "fee amount not found in prose",
        severity: "warning",
      });
    }
  }
  return passed;
}

/**
 * Covenant threshold checks — these CAN appear in AI prose (covenant descriptions).
 * Soft check (warning) since templates also show thresholds in tables.
 */
function checkCovenantThresholds(
  input: DocumentInput,
  proseText: string,
  issues: VerificationIssue[],
): number {
  let passed = 0;
  const covenantsWithThresholds = input.terms.covenants.filter(
    (c) => c.threshold !== undefined,
  );

  for (const covenant of covenantsWithThresholds) {
    const threshold = covenant.threshold!;
    const candidates = [
      threshold.toString(),
      `${threshold}x`,
      `${(threshold * 100).toFixed(0)}%`,
      `${(threshold * 100).toFixed(1)}%`,
      threshold.toFixed(2),
    ];

    if (containsAnyCI(proseText, candidates)) {
      passed++;
    } else {
      issues.push({
        field: `covenant:${covenant.name}`,
        expected: `${covenant.name} threshold: ${threshold}`,
        found: "covenant threshold not found in prose",
        severity: "warning",
      });
    }
  }
  return passed;
}

/**
 * Check that AI prose has all expected keys for the document type.
 * Catches malformed AI responses before they cause undefined in templates.
 */
function checkProseKeys(
  docType: string,
  prose: AiDocProse,
  issues: VerificationIssue[],
): boolean {
  // NOTE: These keys must stay in sync with REQUIRED_KEYS in generate-all.ts
  const expectedKeys: Record<string, string[]> = {
    promissory_note: [
      "defaultProvisions", "accelerationClause", "lateFeeProvision",
      "waiverProvisions", "governingLawClause", "miscellaneousProvisions",
    ],
    loan_agreement: [
      "recitals", "representations", "eventsOfDefault",
      "remediesOnDefault", "waiverAndAmendment", "noticeProvisions",
      "miscellaneous", "governingLaw",
    ],
    security_agreement: [
      "collateralDescription", "perfectionLanguage", "representationsAndWarranties",
      "remediesOnDefault", "dispositionOfCollateral", "governingLaw",
    ],
    guaranty: [
      "guarantyScope", "waiverOfDefenses", "subrogationWaiver",
      "subordination", "miscellaneous", "governingLaw",
    ],
    commitment_letter: [
      "openingParagraph", "conditionsPrecedent", "representationsRequired",
      "expirationClause", "governingLaw",
    ],
    environmental_indemnity: [
      "indemnificationScope", "representationsAndWarranties", "covenants",
      "remediationObligations", "survivalClause", "governingLaw",
    ],
    assignment_of_leases: [
      "assignmentGrant", "representationsAndWarranties", "covenants",
      "lenderRights", "tenantNotification", "governingLaw",
    ],
    subordination_agreement: [
      "subordinationTerms", "seniorDebtDescription", "subordinateDebtDescription",
      "paymentRestrictions", "standstillProvisions", "turnoverProvisions", "governingLaw",
    ],
    intercreditor_agreement: [
      "definitionsAndInterpretation", "lienPriority", "paymentWaterfall",
      "standstillAndCure", "enforcementRights", "purchaseOption",
      "releaseAndAmendment", "bankruptcyProvisions", "governingLaw",
    ],
    corporate_resolution: [
      "resolutionRecitals", "authorizationClause", "authorizedSigners",
      "ratificationClause", "certificateOfSecretary", "governingLaw",
    ],
    ucc_financing_statement: [
      "collateralDescription", "proceedsClause", "filingInstructions", "additionalProvisions",
    ],
    snda: [
      "subordinationTerms", "nonDisturbanceTerms", "attornmentTerms", "lenderProtections", "governingLaw",
    ],
    estoppel_certificate: ["additionalCertifications"],
    borrowers_certificate: ["additionalCertifications", "governingLaw"],
    opinion_letter: ["additionalOpinions", "governingLaw"],
    deed_of_trust: [
      "grantClause", "borrowerCovenants", "defaultProvisions",
      "powerOfSale", "environmentalCovenants", "governingLaw",
    ],
    sba_authorization: ["specialConditions", "useOfProceeds", "governingLaw"],
    cdc_debenture: ["projectDescription", "cdcTermsAndConditions", "governingLaw"],
    borrowing_base_agreement: [
      "eligibilityCriteria", "advanceRates", "reportingRequirements",
      "reserveProvisions", "governingLaw",
    ],
    digital_asset_pledge: [
      "pledgeGrant", "valuationMethodology", "marginCallProvisions",
      "liquidationProvisions", "custodyRequirements", "governingLaw",
    ],
    custody_agreement: [
      "custodyTerms", "accessControl", "insuranceRequirements",
      "transferProvisions", "terminationProvisions", "governingLaw",
    ],
    // settlement_statement, compliance_certificate, amortization_schedule, closing_disclosure, loan_estimate: no expected keys (zero AI)
  };

  const keys = expectedKeys[docType];
  if (!keys) return true; // Unknown doc type, no keys to check

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
        expected: `Non-empty value for "${key}"`,
        found: value === undefined ? "missing" : Array.isArray(value) ? "empty array" : "empty",
        severity: "critical",
      });
      allPresent = false;
    }
  }
  return allPresent;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function verifyDocument(
  docType: string,
  input: DocumentInput,
  prose: AiDocProse,
): VerificationResult {
  const issues: VerificationIssue[] = [];
  const proseText = flattenProse(prose);

  let checksRun = 0;
  let checksPassed = 0;

  // 1. Prose shape check — catches malformed AI responses
  checksRun++;
  if (checkProseKeys(docType, prose, issues)) checksPassed++;

  // 2. Amount check (skipped for template types — template handles it)
  checksRun++;
  if (checkAmount(docType, input, proseText, issues)) checksPassed++;

  // 3. Rate check (skipped for template types — template handles it)
  checksRun++;
  if (checkRate(docType, input, proseText, issues)) checksPassed++;

  // 4. Term check (soft — warning only)
  checksRun++;
  if (checkTerm(docType, input, proseText, issues)) checksPassed++;

  // 5. Borrower name check (case-insensitive) — skip for template-handled types
  //    where the template injects the name deterministically (prose is empty)
  if (!TEMPLATE_HANDLED_TYPES.has(docType)) {
    checksRun++;
    if (checkBorrowerName(input, proseText, issues)) checksPassed++;
  }

  // 6. Fee checks (skipped for template types)
  const feeCount = input.terms.fees.length;
  checksRun += feeCount;
  checksPassed += checkFees(docType, input, proseText, issues);

  // 7. Covenant threshold checks (soft — warning only)
  const covenantCount = input.terms.covenants.filter(
    (c) => c.threshold !== undefined,
  ).length;
  checksRun += covenantCount;
  checksPassed += checkCovenantThresholds(input, proseText, issues);

  // Determine pass/fail: critical issues mean failure
  const hasCritical = issues.some((i) => i.severity === "critical");

  return {
    passed: !hasCritical,
    issues,
    checksRun,
    checksPassed,
  };
}
