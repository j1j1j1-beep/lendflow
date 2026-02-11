// generate-all.ts
// Orchestrator: generates all required bio/pharma IND documents for a program.
// Follows the triple-verification pattern:
//   1. AI prose generation → 2. Template builder → 3. Legal review + verify

import { Packer } from "docx";
import type {
  BioDocumentInput,
  INDModule1Prose,
  INDModule2Prose,
  INDModule3Prose,
  INDModule4Prose,
  INDModule5Prose,
  InvestigatorBrochureProse,
  ClinicalProtocolProse,
  PreINDBriefingProse,
  InformedConsentProse,
  DiversityActionPlanProse,
} from "./templates/types";
import { generateBioDocProse } from "./generate-doc";
import { reviewBioDocument } from "./legal-review";
import { verifyBioDocument } from "./verify-doc";

// Template builders — each returns a docx Document
import { buildINDModule1 } from "./templates/ind-module-1";
import { buildINDModule2 } from "./templates/ind-module-2";
import { buildINDModule3 } from "./templates/ind-module-3";
import { buildINDModule4 } from "./templates/ind-module-4";
import { buildINDModule5 } from "./templates/ind-module-5";
import { buildInvestigatorBrochure } from "./templates/investigator-brochure";
import { buildClinicalProtocol } from "./templates/clinical-protocol";
import { buildPreINDBriefing } from "./templates/pre-ind-briefing";
import { buildInformedConsent } from "./templates/informed-consent";
import { buildDiversityActionPlan } from "./templates/diversity-action-plan";
import { buildFDAForm1571 } from "./templates/fda-form-1571";

import { buildLegalDocument, documentTitle, bodyText } from "../documents/doc-helpers";

// Result type for each generated document

export interface BioDocumentGenerationResult {
  docType: string;
  buffer: Buffer;
  status: "DRAFT" | "REVIEWED";
  complianceReview: { passed: boolean; issues: any[] };
  verification: { passed: boolean; issues: any[] };
  regulatoryChecks: any[];
}

// Doc type labels for display

export const BIO_DOC_TYPE_LABELS: Record<string, string> = {
  ind_module_1: "IND Module 1 — Administrative Information",
  ind_module_2: "IND Module 2 — Summaries",
  ind_module_3: "IND Module 3 — Quality (CMC)",
  ind_module_4: "IND Module 4 — Nonclinical Study Reports",
  ind_module_5: "IND Module 5 — Clinical Study Information",
  investigator_brochure: "Investigator's Brochure",
  clinical_protocol: "Clinical Protocol",
  pre_ind_briefing: "Pre-IND Briefing Book",
  informed_consent: "Informed Consent Form",
  diversity_action_plan: "Diversity Action Plan",
  fda_form_1571: "FDA Form 1571",
};

// Prose shape validation — ensures AI returned the expected keys

const REQUIRED_KEYS: Record<string, string[]> = {
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
  // fda_form_1571: zero AI — no prose keys
};

// Keys that the AI should return as string[] (not string)
const ARRAY_KEYS = new Set(["fdaQuestions"]);

// Doc types that are 100% deterministic — no AI prose, no review needed
const ZERO_AI_DOCS = new Set(["fda_form_1571"]);

function validateProse(docType: string, prose: Record<string, unknown>): void {
  const keys = REQUIRED_KEYS[docType];
  if (!keys) return;

  const missing = keys.filter((k) => prose[k] === undefined || prose[k] === null);
  if (missing.length > 0) {
    for (const key of missing) {
      if (ARRAY_KEYS.has(key)) {
        prose[key] = [`[${key} — AI generation did not produce this section. Manual review required.]`];
      } else {
        prose[key] = `[${key} — AI generation did not produce this section. Manual review required.]`;
      }
    }
    console.warn(`AI prose for ${docType} missing keys: ${missing.join(", ")}. Placeholders injected.`);
  }
}

// Template dispatcher

function buildDocFromTemplate(
  docType: string,
  input: BioDocumentInput,
  prose: Record<string, unknown>,
): ReturnType<typeof buildINDModule1> | null {
  validateProse(docType, prose);

  switch (docType) {
    case "ind_module_1":
      return buildINDModule1(input, prose as unknown as INDModule1Prose);
    case "ind_module_2":
      return buildINDModule2(input, prose as unknown as INDModule2Prose);
    case "ind_module_3":
      return buildINDModule3(input, prose as unknown as INDModule3Prose);
    case "ind_module_4":
      return buildINDModule4(input, prose as unknown as INDModule4Prose);
    case "ind_module_5":
      return buildINDModule5(input, prose as unknown as INDModule5Prose);
    case "investigator_brochure":
      return buildInvestigatorBrochure(input, prose as unknown as InvestigatorBrochureProse);
    case "clinical_protocol":
      return buildClinicalProtocol(input, prose as unknown as ClinicalProtocolProse);
    case "pre_ind_briefing":
      return buildPreINDBriefing(input, prose as unknown as PreINDBriefingProse);
    case "informed_consent":
      return buildInformedConsent(input, prose as unknown as InformedConsentProse);
    case "diversity_action_plan":
      return buildDiversityActionPlan(input, prose as unknown as DiversityActionPlanProse);
    case "fda_form_1571":
      return buildFDAForm1571(input);
    default:
      return null;
  }
}

// Single document generation pipeline

export async function generateSingleBioDocument(
  docType: string,
  input: BioDocumentInput,
  feedback?: string,
): Promise<BioDocumentGenerationResult> {
  const docTypeLabel = BIO_DOC_TYPE_LABELS[docType] ?? docType;
  const isZeroAI = ZERO_AI_DOCS.has(docType);

  let prose: Record<string, unknown> = {};
  let complianceReview: BioDocumentGenerationResult["complianceReview"] = {
    passed: true,
    issues: [],
  };
  let regulatoryChecks: BioDocumentGenerationResult["regulatoryChecks"] = [];

  if (!isZeroAI) {
    // Step 1: Generate AI prose (with feedback from previous review if provided)
    prose = await generateBioDocProse(docType, input, feedback);

    // Step 2: Compliance review — finds issues, fixes them, returns corrected prose
    const { review, complianceChecks, correctedProse } = await reviewBioDocument(docType, input, prose);

    // Step 3: Apply corrections if provided
    if (correctedProse) {
      console.log(`Compliance review corrected prose for ${docType} (${review.issues.length} issues found and resolved)`);
      prose = correctedProse;
    }

    complianceReview = { passed: review.passed, issues: review.issues };
    regulatoryChecks = complianceChecks;
  }

  // Step 4: Build docx from template
  const doc = buildDocFromTemplate(docType, input, prose);
  let buffer: Buffer;

  if (doc) {
    buffer = await Packer.toBuffer(doc) as Buffer;
  } else {
    const placeholder = buildLegalDocument({
      title: docTypeLabel,
      children: [
        documentTitle(docTypeLabel),
        bodyText(`This document template (${docTypeLabel}) is pending implementation.`),
        bodyText(`Program: ${input.programName}`),
        bodyText(`Drug: ${input.drugName}`),
        bodyText(`Generated: ${new Date(input.generatedAt).toISOString()}`),
      ],
    });
    buffer = await Packer.toBuffer(placeholder) as Buffer;
  }

  // Step 5: Deterministic verification (runs on ALL docs including zero-AI)
  const verification = verifyBioDocument(docType, input, prose);

  // Determine status
  let status: BioDocumentGenerationResult["status"] = "REVIEWED";
  if (!verification.passed || !complianceReview.passed) {
    status = "DRAFT";
  } else if (!doc) {
    status = "DRAFT";
  }

  return {
    docType,
    buffer,
    status,
    complianceReview,
    verification,
    regulatoryChecks,
  };
}

// Main entry point — generate all docs for a bio program

export async function generateAllBioDocuments(
  input: BioDocumentInput,
  requiredDocTypes: string[],
): Promise<BioDocumentGenerationResult[]> {
  const results: BioDocumentGenerationResult[] = [];

  for (const docType of requiredDocTypes) {
    try {
      const result = await generateSingleBioDocument(docType, input);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate bio doc ${docType}:`, error);
      const errorDoc = buildLegalDocument({
        title: "Generation Error",
        children: [
          documentTitle("Document Generation Error"),
          bodyText(`The ${BIO_DOC_TYPE_LABELS[docType] ?? docType} could not be generated.`),
          bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`),
          bodyText("Please retry generation or create this document manually."),
        ],
      });
      const errorBuffer = await Packer.toBuffer(errorDoc) as Buffer;

      results.push({
        docType,
        buffer: errorBuffer,
        status: "DRAFT",
        complianceReview: {
          passed: false,
          issues: [
            {
              severity: "critical",
              section: "generation",
              description: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
              recommendation: "Retry generation or create document manually",
            },
          ],
        },
        verification: { passed: false, issues: [] },
        regulatoryChecks: [],
      });
    }
  }

  return results;
}
