// generate-all.ts
// Orchestrator: generates all required loan documents for a deal.
// Follows the triple-verification pattern:
//   1. AI prose generation → 2. Template builder → 3. Legal review + verify

import { Packer } from "docx";
import type { DocumentInput, DocumentGenerationResult, AiDocProse } from "./types";
import { DOC_TYPE_LABELS } from "./types";
import { generateDocProse } from "./generate-doc";
import { reviewDocument } from "./legal-review";
import { verifyDocument } from "./verify-doc";
import { runProgramComplianceChecks } from "./compliance-checks";

// Template builders — each returns a docx Document
import { buildPromissoryNote } from "./templates/promissory-note";
import { buildLoanAgreement } from "./templates/loan-agreement";
import { buildSecurityAgreement } from "./templates/security-agreement";
import { buildGuaranty } from "./templates/guaranty";
import { buildCommitmentLetter } from "./templates/commitment-letter";
import { buildEnvironmentalIndemnity } from "./templates/environmental-indemnity";
import { buildAssignmentOfLeases } from "./templates/assignment-of-leases";
import { buildSubordinationAgreement } from "./templates/subordination-agreement";
import { buildIntercreditorAgreement } from "./templates/intercreditor-agreement";
import { buildCorporateResolution } from "./templates/corporate-resolution";
import { buildUccFinancingStatement } from "./templates/ucc-financing-statement";
import { buildSnda } from "./templates/snda";
import { buildEstoppelCertificate } from "./templates/estoppel-certificate";
import { buildSettlementStatement } from "./templates/settlement-statement";
import { buildBorrowersCertificate } from "./templates/borrowers-certificate";
import { buildComplianceCertificate } from "./templates/compliance-certificate";
import { buildAmortizationSchedule } from "./templates/amortization-schedule";
import { buildOpinionLetter } from "./templates/opinion-letter";
import { buildClosingDisclosure } from "./templates/closing-disclosure";
import { buildLoanEstimate } from "./templates/loan-estimate";
import { buildDeedOfTrust } from "./templates/deed-of-trust";
import { buildSbaAuthorization } from "./templates/sba-authorization";
import { buildCdcDebenture } from "./templates/cdc-debenture";
import { buildBorrowingBaseAgreement } from "./templates/borrowing-base-agreement";
import { buildDigitalAssetPledge } from "./templates/digital-asset-pledge";
import { buildCustodyAgreement } from "./templates/custody-agreement";

// SBA regulatory form builders (zero AI)
// Note: SBA Form 1920 was retired in August 2023 and has been removed.
import { buildSbaForm1919 } from "./templates/sba-form-1919";
import { buildSbaForm159 } from "./templates/sba-form-159";
import { buildSbaForm148 } from "./templates/sba-form-148";
import { buildSbaForm1050 } from "./templates/sba-form-1050";

// Compliance / regulatory form builders (zero AI)
import { buildIrs4506c } from "./templates/irs-4506c";
import { buildIrsW9 } from "./templates/irs-w9";
import { buildFloodDetermination } from "./templates/flood-determination";
import { buildPrivacyNotice } from "./templates/privacy-notice";
import { buildPatriotActNotice } from "./templates/patriot-act-notice";
import { buildDisbursementAuthorization } from "./templates/disbursement-authorization";

import type {
  PromissoryNoteProse, LoanAgreementProse, SecurityAgreementProse, GuarantyProse,
  CommitmentLetterProse, EnvironmentalIndemnityProse, AssignmentOfLeasesProse,
  SubordinationProse, IntercreditorProse, CorporateResolutionProse, UccFinancingProse,
  SndaProse, EstoppelProse, BorrowersCertificateProse, OpinionLetterProse,
  DeedOfTrustProse, SbaAuthorizationProse, CdcDebentureProse,
  BorrowingBaseProse, DigitalAssetPledgeProse, CustodyAgreementProse,
} from "./types";
import { formatCurrency, buildLegalDocument, documentTitle, bodyText } from "./doc-helpers";

// Prose shape validation — ensures AI returned the expected keys

const REQUIRED_KEYS: Record<string, string[]> = {
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
  // settlement_statement, compliance_certificate, amortization_schedule, closing_disclosure, loan_estimate: NO required keys (zero AI)
};

// Keys that the AI should return as string[] (not string)
const ARRAY_KEYS = new Set([
  "conditionsPrecedent", "representationsAndWarranties", "covenants",
  "representations", "eventsOfDefault", "borrowerCovenants",
  "waiverOfDefenses", "specialConditions",
]);

function validateProse(docType: string, prose: AiDocProse): void {
  const keys = REQUIRED_KEYS[docType];
  if (!keys) return;

  const missing = keys.filter((k) => prose[k] === undefined || prose[k] === null);
  if (missing.length > 0) {
    // Fill missing keys with placeholder text so templates don't crash
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
  input: DocumentInput,
  prose: AiDocProse,
): ReturnType<typeof buildPromissoryNote> | null {
  // Validate prose shape before casting
  validateProse(docType, prose);

  switch (docType) {
    case "promissory_note":
      return buildPromissoryNote(input, prose as unknown as PromissoryNoteProse);
    case "loan_agreement":
      return buildLoanAgreement(input, prose as unknown as LoanAgreementProse);
    case "security_agreement":
      return buildSecurityAgreement(input, prose as unknown as SecurityAgreementProse);
    case "guaranty":
      return buildGuaranty(input, prose as unknown as GuarantyProse);
    case "commitment_letter":
      return buildCommitmentLetter(input, prose as unknown as CommitmentLetterProse);
    case "environmental_indemnity":
      return buildEnvironmentalIndemnity(input, prose as unknown as EnvironmentalIndemnityProse);
    case "assignment_of_leases":
      return buildAssignmentOfLeases(input, prose as unknown as AssignmentOfLeasesProse);
    case "subordination_agreement":
      return buildSubordinationAgreement(input, prose as unknown as SubordinationProse);
    case "intercreditor_agreement":
      return buildIntercreditorAgreement(input, prose as unknown as IntercreditorProse);
    case "corporate_resolution":
      return buildCorporateResolution(input, prose as unknown as CorporateResolutionProse);
    case "ucc_financing_statement":
      return buildUccFinancingStatement(input, prose as unknown as UccFinancingProse);
    case "snda":
      return buildSnda(input, prose as unknown as SndaProse);
    case "estoppel_certificate":
      return buildEstoppelCertificate(input, prose as unknown as EstoppelProse);
    case "settlement_statement":
      return buildSettlementStatement(input);
    case "borrowers_certificate":
      return buildBorrowersCertificate(input, prose as unknown as BorrowersCertificateProse);
    case "compliance_certificate":
      return buildComplianceCertificate(input);
    case "amortization_schedule":
      return buildAmortizationSchedule(input);
    case "closing_disclosure":
      return buildClosingDisclosure(input);
    case "loan_estimate":
      return buildLoanEstimate(input);
    case "opinion_letter":
      return buildOpinionLetter(input, prose as unknown as OpinionLetterProse);
    case "deed_of_trust":
      return buildDeedOfTrust(input, prose as unknown as DeedOfTrustProse);
    case "sba_authorization":
      return buildSbaAuthorization(input, prose as unknown as SbaAuthorizationProse);
    case "cdc_debenture":
      return buildCdcDebenture(input, prose as unknown as CdcDebentureProse);
    case "borrowing_base_agreement":
      return buildBorrowingBaseAgreement(input, prose as unknown as BorrowingBaseProse);
    case "digital_asset_pledge":
      return buildDigitalAssetPledge(input, prose as unknown as DigitalAssetPledgeProse);
    case "custody_agreement":
      return buildCustodyAgreement(input, prose as unknown as CustodyAgreementProse);

    // SBA regulatory forms (zero AI — no prose needed)
    // Note: SBA Form 1920 was retired in August 2023 and is no longer generated.
    case "sba_form_1919":
      return buildSbaForm1919(input);
    case "sba_form_159":
      return buildSbaForm159(input);
    case "sba_form_148":
      return buildSbaForm148(input);
    case "sba_form_1050":
      return buildSbaForm1050(input);

    // Compliance / regulatory forms (zero AI — no prose needed)
    case "irs_4506c":
      return buildIrs4506c(input);
    case "irs_w9":
      return buildIrsW9(input);
    case "flood_determination":
      return buildFloodDetermination(input);
    case "privacy_notice":
      return buildPrivacyNotice(input);
    case "patriot_act_notice":
      return buildPatriotActNotice(input);
    case "disbursement_authorization":
      return buildDisbursementAuthorization(input);

    default:
      return null;
  }
}

// Single document generation pipeline

// Doc types that are 100% deterministic — no AI prose, no review needed
const ZERO_AI_DOCS = new Set([
  "settlement_statement", "compliance_certificate", "amortization_schedule",
  "closing_disclosure", "loan_estimate",
  "sba_form_1919", "sba_form_159", "sba_form_148", "sba_form_1050",
  "irs_4506c", "irs_w9", "flood_determination",
  "privacy_notice", "patriot_act_notice", "disbursement_authorization",
]);

export async function generateSingleDocument(
  docType: string,
  input: DocumentInput,
  feedback?: string,
): Promise<DocumentGenerationResult> {
  const docTypeLabel = DOC_TYPE_LABELS[docType] ?? docType;
  const isZeroAI = ZERO_AI_DOCS.has(docType);

  // For zero-AI docs: skip prose generation and review entirely
  let prose: AiDocProse = {};
  let legalReview: DocumentGenerationResult["legalReview"] = {
    passed: true,
    issues: [],
    reviewedAt: new Date().toISOString(),
  };
  let complianceChecks: DocumentGenerationResult["complianceChecks"] = [];

  if (!isZeroAI) {
    // Step 1: Generate AI prose (with feedback from previous legal review if provided)
    prose = await generateDocProse(docType, input, feedback);

    // Step 2: Compliance review — finds issues, fixes them, returns corrected prose
    const { review, complianceChecks: checks, correctedProse } = await reviewDocument(docType, input, prose);

    // Step 3: Apply corrections if provided
    if (correctedProse) {
      console.log(`Compliance review corrected prose for ${docType} (${review.issues.length} issues found and resolved)`);
      prose = correctedProse;
    }

    legalReview = review;
    complianceChecks = checks;

    // Validate prose shape before building
    validateProse(docType, prose);
  }

  // Run program-level compliance checks (deterministic — usury, SBA limits, LTV, etc.)
  const programChecks = runProgramComplianceChecks(input.programId, input);
  // Convert ComplianceCheckResult[] to ComplianceCheck[] for the document result
  for (const pc of programChecks) {
    complianceChecks.push({
      name: pc.name,
      regulation: pc.regulation,
      category: pc.severity === "critical" ? "regulatory" : "standard",
      passed: pc.passed,
      note: pc.description,
    });
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
        bodyText(`Deal: ${input.borrowerName}`),
        bodyText(`Amount: ${formatCurrency(input.terms.approvedAmount)}`),
        bodyText(`Generated: ${input.generatedAt.toISOString()}`),
      ],
    });
    buffer = await Packer.toBuffer(placeholder) as Buffer;
  }

  // Step 5: Deterministic verification (runs on ALL docs including zero-AI)
  const verification = verifyDocument(docType, input, prose);

  // Determine status
  let status: DocumentGenerationResult["status"] = "REVIEWED";
  if (!verification.passed || !legalReview.passed) {
    status = "FLAGGED";
  } else if (!doc) {
    status = "DRAFT";
  }

  return {
    docType,
    docTypeLabel,
    buffer,
    legalReview,
    verification,
    complianceChecks,
    status,
  };
}

// Main entry point — generate all docs for a deal

/**
 * Filter the required doc list by applying skip logic based on deal context.
 * Returns only the doc types that should actually be generated.
 */
export function filterRequiredDocs(
  input: DocumentInput,
  requiredDocTypes: string[],
): string[] {
  const hasRealProperty = !!input.propertyAddress || input.collateralTypes.some((t) => {
    const lower = t.toLowerCase();
    return lower.includes("real_estate") || lower.includes("real estate") || lower === "real property"
      || lower.includes("residential") || lower.includes("commercial_real_estate");
  });

  return requiredDocTypes.filter((docType) => {
    if (docType === "guaranty" && !input.terms.personalGuaranty) return false;
    if (docType === "deed_of_trust" && !hasRealProperty) return false;
    if ((docType === "environmental_indemnity" || docType === "assignment_of_leases") && !hasRealProperty) return false;
    if (docType === "subordination_agreement" && !input.subordinateCreditorName) return false;
    if (docType === "intercreditor_agreement" && !input.secondLienLenderName) return false;
    if ((docType === "sba_authorization" || docType === "cdc_debenture") && !input.programId.startsWith("sba_")) return false;
    if (docType === "cdc_debenture" && input.programId !== "sba_504") return false;
    // SBA regulatory forms — only for SBA programs
    // Note: SBA Form 1920 was retired in August 2023 and is no longer generated.
    const sbaForms = ["sba_form_1919", "sba_form_159", "sba_form_148", "sba_form_1050"];
    if (sbaForms.includes(docType) && !input.programId.startsWith("sba_")) return false;
    if (docType === "sba_form_1050" && input.programId !== "sba_7a") return false; // 1050 is 7(a) only
    // Flood determination — only for real property
    if (docType === "flood_determination" && !hasRealProperty) return false;
    if (docType === "borrowing_base_agreement" && input.programId !== "line_of_credit") return false;
    if ((docType === "digital_asset_pledge" || docType === "custody_agreement") && input.programId !== "crypto_collateral") return false;
    if ((docType === "snda" || docType === "estoppel_certificate") && !hasRealProperty) return false;
    if (docType === "compliance_certificate" && input.terms.covenants.length === 0) return false;
    return true;
  });
}

export async function generateAllDocuments(
  input: DocumentInput,
  requiredDocTypes: string[],
): Promise<DocumentGenerationResult[]> {
  const results: DocumentGenerationResult[] = [];
  const filtered = filterRequiredDocs(input, requiredDocTypes);

  for (const docType of filtered) {
    try {
      const result = await generateSingleDocument(docType, input);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate ${docType}:`, error);
      // Create a failed result instead of throwing
      const errorDoc = buildLegalDocument({
        title: "Generation Error",
        children: [
          documentTitle("Document Generation Error"),
          bodyText(`The ${DOC_TYPE_LABELS[docType] ?? docType} could not be generated.`),
          bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`),
          bodyText("Please retry generation or create this document manually."),
        ],
      });
      const errorBuffer = await Packer.toBuffer(errorDoc) as Buffer;

      results.push({
        docType,
        docTypeLabel: DOC_TYPE_LABELS[docType] ?? docType,
        buffer: errorBuffer,
        legalReview: {
          passed: false,
          issues: [
            {
              severity: "critical",
              section: "generation",
              description: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
              recommendation: "Retry generation or create document manually",
            },
          ],
          reviewedAt: new Date().toISOString(),
        },
        verification: { passed: false, issues: [], checksRun: 0, checksPassed: 0 },
        complianceChecks: [],
        status: "FLAGGED",
      });
    }
  }

  return results;
}
