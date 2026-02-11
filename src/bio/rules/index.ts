// index.ts
// Bio rules engine entry point. Exports all individual rule functions
// and provides runBioRulesCheck() which runs all applicable checks
// against a biopharma program's extracted data.
// Deterministic only. No AI calls.

// Re-export all rule functions and types
export {
  type RuleCheckResult,
  type DARSpec,
  type PKData,
  type ProtocolDesign,
  type BatchRecord,
  type StabilityTimepoint,
  validateDAR,
  validateFreePayload,
  checkThreeAnalytePK,
  checkProjectOptimus,
  checkDiversityPlan,
  calculateHED,
  calculateSafetyMargin,
  checkCRSMonitoring,
  checkTCRRequirement,
  validateBatchConsistency,
  checkStabilityTrend,
} from "./fda-rules";

export {
  type AuditTrailEntry,
  type ElectronicDocument,
  type UserSession,
  type ElectronicSignature,
  type ElectronicRecord,
  checkAuditTrail,
  checkAccessControl,
  checkSignatureRequirements,
  validateElectronicRecord,
} from "./part11-rules";

export {
  type ADCCharacterizationData,
  type AfucosylationData,
  type LinkerStabilityData,
  type PayloadProfile,
  type DrugClassification,
  validateADCCharacterization,
  checkAfucosylationRequirements,
  validateLinkerStability,
  checkPayloadSafetyProfile,
  determineRequiredStudies,
} from "./adc-rules";

// Aggregated input for the main rules check

import type { RuleCheckResult, DARSpec, PKData, ProtocolDesign, BatchRecord, StabilityTimepoint } from "./fda-rules";
import type { ElectronicDocument, UserSession, ElectronicSignature, ElectronicRecord } from "./part11-rules";
import type { ADCCharacterizationData, AfucosylationData, LinkerStabilityData, PayloadProfile } from "./adc-rules";

import { validateDAR, validateFreePayload, checkThreeAnalytePK, checkProjectOptimus, checkDiversityPlan, calculateHED, calculateSafetyMargin, checkCRSMonitoring, checkTCRRequirement, validateBatchConsistency, checkStabilityTrend } from "./fda-rules";
import { checkAuditTrail, checkAccessControl, checkSignatureRequirements, validateElectronicRecord } from "./part11-rules";
import { validateADCCharacterization, checkAfucosylationRequirements, validateLinkerStability, checkPayloadSafetyProfile, determineRequiredStudies } from "./adc-rules";

export interface BioProgram {
  drugClass: string;
  target: string;
  mechanism: string;
  isAfucosylated?: boolean;
  isBifunctional?: boolean;
  payloadClass?: string;
  hasNovelLinker?: boolean;
  hasNovelPayload?: boolean;
  targetExpressedOnNormalTissue?: boolean;
}

export interface ExtractedBioData {
  // CMC data
  dar?: { value: number; spec: DARSpec };
  freePayload?: { percentage: number; limit: number };
  batches?: BatchRecord[];
  stabilityData?: StabilityTimepoint[];
  characterization?: ADCCharacterizationData;
  afucosylation?: AfucosylationData;
  linkerStability?: LinkerStabilityData;
  payload?: PayloadProfile;

  // PK data
  pkData?: PKData;

  // Protocol data
  protocol?: ProtocolDesign;

  // Dose calculation data
  animalDose?: { dose: number; species: string; humanWeight?: number };
  noael?: number;
  proposedStartingDose?: number;

  // Target/species data
  toxSpecies?: string;

  // Part 11 data
  documents?: ElectronicDocument[];
  userSession?: UserSession;
  signatures?: ElectronicSignature[];
  electronicRecords?: ElectronicRecord[];
}

export interface BioRulesCheckOutput {
  programSummary: {
    drugClass: string;
    target: string;
    mechanism: string;
    isAfucosylated: boolean;
    isBifunctional: boolean;
  };
  results: RuleCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
  };
  overallStatus: "pass" | "fail" | "warning";
  requiredStudies: RuleCheckResult | null;
}

// Main entry point. Runs all applicable bio rules checks against
// the extracted data and returns a structured result per check.
// This mirrors the lending engine's runRulesEngine() pattern:
// one function, deterministic, returns everything.
export function runBioRulesCheck(
  program: BioProgram,
  extractedData: ExtractedBioData
): BioRulesCheckOutput {
  const results: RuleCheckResult[] = [];

  // 1. CMC checks

  // DAR validation
  if (extractedData.dar) {
    results.push(validateDAR(extractedData.dar.value, extractedData.dar.spec));
  }

  // Free payload
  if (extractedData.freePayload) {
    results.push(validateFreePayload(
      extractedData.freePayload.percentage,
      extractedData.freePayload.limit
    ));
  }

  // ADC characterization
  if (extractedData.characterization) {
    results.push(validateADCCharacterization(extractedData.characterization));
  }

  // Afucosylation requirements
  if (extractedData.afucosylation) {
    results.push(checkAfucosylationRequirements(extractedData.afucosylation));
  } else if (program.isAfucosylated) {
    // Program says afucosylated but no data provided
    results.push({
      rule: "Afucosylation ADCC Assay",
      status: "fail",
      message: "Program is afucosylated but no afucosylation characterization data provided",
      regulation: "FDA CMC Guidance, Potency (Module 3.2.P.5)",
    });
  }

  // Linker stability
  if (extractedData.linkerStability) {
    results.push(validateLinkerStability(extractedData.linkerStability));
  }

  // Payload safety
  if (extractedData.payload) {
    results.push(checkPayloadSafetyProfile(extractedData.payload));
  }

  // Batch consistency
  if (extractedData.batches) {
    results.push(validateBatchConsistency(extractedData.batches));
  }

  // Stability trend
  if (extractedData.stabilityData) {
    results.push(checkStabilityTrend(extractedData.stabilityData));
  }

  // 2. PK checks

  if (extractedData.pkData) {
    results.push(checkThreeAnalytePK(extractedData.pkData));
  }

  // 3. Protocol checks

  if (extractedData.protocol) {
    results.push(checkProjectOptimus(extractedData.protocol));
    results.push(checkDiversityPlan(extractedData.protocol));

    // CRS monitoring (only for bifunctional ADCs)
    if (program.isBifunctional || program.isAfucosylated) {
      results.push(checkCRSMonitoring(extractedData.protocol));
    }
  }

  // 4. Dose calculation checks

  if (extractedData.animalDose) {
    const hedResult = calculateHED(
      extractedData.animalDose.dose,
      extractedData.animalDose.species,
      extractedData.animalDose.humanWeight
    );
    results.push(hedResult);

    // If HED was calculated successfully, compute safety margin against proposed starting dose.
    // The HED from the animal NOAEL is the numerator; the proposed starting dose is the denominator.
    // If no proposed starting dose, default to HED/10 (standard 10x safety factor).
    if (hedResult.status === "pass") {
      const hedMgPerKg = hedResult.details?.hedMgPerKg as number;
      const startingDose = extractedData.proposedStartingDose ?? hedMgPerKg / 10;
      results.push(calculateSafetyMargin(hedMgPerKg, startingDose));
    }
  }

  // 5. TCR requirement
  if (extractedData.toxSpecies) {
    results.push(checkTCRRequirement(program.target, extractedData.toxSpecies));
  }

  // 6. Part 11 compliance checks

  if (extractedData.documents) {
    for (const doc of extractedData.documents) {
      results.push(checkAuditTrail(doc));
    }
  }

  if (extractedData.userSession) {
    results.push(checkAccessControl(extractedData.userSession));
  }

  if (extractedData.signatures) {
    for (const sig of extractedData.signatures) {
      results.push(checkSignatureRequirements(sig));
    }
  }

  if (extractedData.electronicRecords) {
    for (const record of extractedData.electronicRecords) {
      results.push(validateElectronicRecord(record));
    }
  }

  // 7. Required studies determination
  const requiredStudies = determineRequiredStudies(
    program.drugClass,
    program.target,
    program.mechanism,
    {
      isAfucosylated: program.isAfucosylated,
      isBifunctional: program.isBifunctional,
      payloadClass: program.payloadClass,
      hasNovelLinker: program.hasNovelLinker,
      hasNovelPayload: program.hasNovelPayload,
      targetExpressedOnNormalTissue: program.targetExpressedOnNormalTissue,
    }
  );
  results.push(requiredStudies);

  // Compute summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const notApplicable = results.filter((r) => r.status === "not_applicable").length;

  let overallStatus: "pass" | "fail" | "warning" = "pass";
  if (failed > 0) {
    overallStatus = "fail";
  } else if (warnings > 0) {
    overallStatus = "warning";
  }

  return {
    programSummary: {
      drugClass: program.drugClass,
      target: program.target,
      mechanism: program.mechanism,
      isAfucosylated: program.isAfucosylated ?? false,
      isBifunctional: program.isBifunctional ?? false,
    },
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      warnings,
      notApplicable,
    },
    overallStatus,
    requiredStudies,
  };
}
