// fda-rules.ts
// Core FDA regulatory rules engine for biopharma IND submissions.
// Deterministic checks only. No AI calls. Each function references
// the specific regulation it enforces.

// Shared result type
export type RuleCheckResult = {
  rule: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  message: string;
  regulation?: string;
  details?: Record<string, unknown>;
};

// Input types

export interface DARSpec {
  target: number;
  tolerance: number;
}

export interface PKData {
  conjugatedADC?: boolean;
  totalAntibody?: boolean;
  freePayload?: boolean;
  analytesMeasured?: string[];
}

export interface ProtocolDesign {
  doseLevels?: number;
  escalationMethod?: string;
  hasBackfillCohorts?: boolean;
  hasExpansionCohorts?: boolean;
  hasParallelComparison?: boolean;
  diversityPlan?: {
    hasEnrollmentGoals: boolean;
    populations?: string[];
    targetPercentages?: Record<string, number>;
  };
  safetyMonitoring?: {
    hasCRSGrading?: boolean;
    hasCRSManagementPlan?: boolean;
    hasMASMonitoring?: boolean;
    gradingSystem?: string;
  };
}

export interface BatchRecord {
  batchId: string;
  dar: number;
  purity: number;
  potency: number;
}

export interface StabilityTimepoint {
  timeMonths: number;
  purity: number;
  potency: number;
  dar?: number;
  aggregation?: number;
}

// FDA body surface area Km factors per species.
// Source: FDA Guidance "Estimating the Maximum Safe Starting Dose in
// Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (2005), Table 1.
// Standard Km values: Human=37, Mouse=3, Rat=6, Hamster=5, Guinea Pig=8,
// Rabbit=12, Dog=20, Monkey(NHP)=12, Mini-pig=27, Micro-pig=35.
// Conversion factor = Human Km / Animal Km (used to calculate HED from animal dose).
const SPECIES_KM_FACTORS: Record<string, number> = {
  human: 37,
  mouse: 3,
  rat: 6,
  hamster: 5,
  guinea_pig: 8,
  rabbit: 12,
  dog: 20,
  monkey: 12,        // Non-human primate (NHP), Km = 12 per FDA 2005 guidance
  mini_pig: 27,
  minipig: 27,       // Alias
  micro_pig: 35,
};

// BSA conversion factors = Human Km / Animal Km. HED = Animal Dose / factor.
const BSA_CONVERSION_FACTORS: Record<string, number> = Object.fromEntries(
  Object.entries(SPECIES_KM_FACTORS)
    .filter(([species]) => species !== "human")
    .map(([species, km]) => [species, SPECIES_KM_FACTORS.human / km]),
);

const DEFAULT_HUMAN_WEIGHT_KG = 60;

// Validate DAR (Drug-to-Antibody Ratio) within specification.
// Per FDA CMC guidance for ADCs, DAR must be consistent within defined tolerance.
export function validateDAR(
  dar: number,
  spec: DARSpec
): RuleCheckResult {
  const lowerBound = spec.target - spec.tolerance;
  const upperBound = spec.target + spec.tolerance;

  if (dar < lowerBound || dar > upperBound) {
    return {
      rule: "DAR Specification",
      status: "fail",
      message: `DAR ${dar.toFixed(2)} is outside specification range ${lowerBound.toFixed(1)}-${upperBound.toFixed(1)} (target ${spec.target} +/- ${spec.tolerance})`,
      regulation: "FDA CMC Guidance for ADCs, Module 3.2.S/3.2.P",
      details: { dar, target: spec.target, tolerance: spec.tolerance, lowerBound, upperBound },
    };
  }

  // Warn if DAR is within spec but near the boundary (within 20% of tolerance from edge)
  const warningMargin = spec.tolerance * 0.2;
  if (dar < lowerBound + warningMargin || dar > upperBound - warningMargin) {
    return {
      rule: "DAR Specification",
      status: "warning",
      message: `DAR ${dar.toFixed(2)} is within spec but near the boundary (${lowerBound.toFixed(1)}-${upperBound.toFixed(1)})`,
      regulation: "FDA CMC Guidance for ADCs, Module 3.2.S/3.2.P",
      details: { dar, target: spec.target, tolerance: spec.tolerance, lowerBound, upperBound },
    };
  }

  return {
    rule: "DAR Specification",
    status: "pass",
    message: `DAR ${dar.toFixed(2)} is within specification (${lowerBound.toFixed(1)}-${upperBound.toFixed(1)})`,
    regulation: "FDA CMC Guidance for ADCs, Module 3.2.S/3.2.P",
    details: { dar, target: spec.target, tolerance: spec.tolerance },
  };
}

// Validate free (unconjugated) payload percentage against release limit.
// Unconjugated cytotoxic payload is a critical safety parameter.
export function validateFreePayload(
  percentage: number,
  limit: number
): RuleCheckResult {
  if (percentage < 0 || percentage > 100) {
    return {
      rule: "Free Payload Limit",
      status: "fail",
      message: `Free payload percentage ${percentage}% is invalid (must be 0-100)`,
      regulation: "FDA CMC Guidance for ADCs, Release Testing",
      details: { percentage, limit },
    };
  }

  if (percentage > limit) {
    return {
      rule: "Free Payload Limit",
      status: "fail",
      message: `Free payload ${percentage.toFixed(2)}% exceeds limit of ${limit}%`,
      regulation: "FDA CMC Guidance for ADCs, Release Testing",
      details: { percentage, limit },
    };
  }

  // Warn if above 80% of the limit
  if (percentage > limit * 0.8) {
    return {
      rule: "Free Payload Limit",
      status: "warning",
      message: `Free payload ${percentage.toFixed(2)}% is within spec but approaching limit of ${limit}%`,
      regulation: "FDA CMC Guidance for ADCs, Release Testing",
      details: { percentage, limit },
    };
  }

  return {
    rule: "Free Payload Limit",
    status: "pass",
    message: `Free payload ${percentage.toFixed(2)}% is within limit of ${limit}%`,
    regulation: "FDA CMC Guidance for ADCs, Release Testing",
    details: { percentage, limit },
  };
}

// Verify all 3 required PK analytes are measured.
// Per FDA "Clinical Pharmacology Considerations for ADCs" guidance:
// PK studies must measure (1) conjugated ADC, (2) total antibody, (3) free payload.
// Insufficient analyte sensitivity = Clinical Hold risk.
export function checkThreeAnalytePK(pkData: PKData): RuleCheckResult {
  const missing: string[] = [];

  if (!pkData.conjugatedADC) missing.push("Conjugated ADC");
  if (!pkData.totalAntibody) missing.push("Total Antibody");
  if (!pkData.freePayload) missing.push("Free Payload");

  if (missing.length > 0) {
    return {
      rule: "Three-Analyte PK Requirement",
      status: "fail",
      message: `Missing required PK analytes: ${missing.join(", ")}. All three (conjugated ADC, total antibody, free payload) must be measured.`,
      regulation: "FDA Clinical Pharmacology Considerations for ADCs",
      details: {
        conjugatedADC: !!pkData.conjugatedADC,
        totalAntibody: !!pkData.totalAntibody,
        freePayload: !!pkData.freePayload,
        missing,
      },
    };
  }

  return {
    rule: "Three-Analyte PK Requirement",
    status: "pass",
    message: "All three required PK analytes are included (conjugated ADC, total antibody, free payload)",
    regulation: "FDA Clinical Pharmacology Considerations for ADCs",
    details: {
      conjugatedADC: true,
      totalAntibody: true,
      freePayload: true,
    },
  };
}

// Per FDA Project Optimus guidance (finalized Aug 2024), oncology protocols
// must identify Optimal Biological Dose (OBD), not just Maximum Tolerated
// Dose (MTD). Protocol must include dose-optimization strategy with multiple
// dose levels and a comparison mechanism (parallel cohorts, backfill, or
// expansion). Traditional 3+3 dose escalation alone is insufficient.
export function checkProjectOptimus(protocol: ProtocolDesign): RuleCheckResult {
  const issues: string[] = [];

  if (!protocol.doseLevels || protocol.doseLevels < 2) {
    issues.push("Protocol must test at least 2 dose levels to identify OBD");
  }

  if (protocol.escalationMethod === "3+3" && !protocol.hasBackfillCohorts && !protocol.hasExpansionCohorts) {
    issues.push("3+3 dose escalation alone is insufficient; must include backfill or expansion cohorts");
  }

  if (!protocol.hasParallelComparison && !protocol.hasExpansionCohorts && !protocol.hasBackfillCohorts) {
    issues.push("No dose-comparison strategy found (parallel cohorts, backfill, or expansion required)");
  }

  if (issues.length > 0) {
    return {
      rule: "Project Optimus Dose Optimization",
      status: "fail",
      message: issues.join(". "),
      regulation: "FDA Project Optimus Guidance, Aug 2024",
      details: {
        doseLevels: protocol.doseLevels ?? 0,
        escalationMethod: protocol.escalationMethod ?? "unknown",
        hasBackfillCohorts: !!protocol.hasBackfillCohorts,
        hasExpansionCohorts: !!protocol.hasExpansionCohorts,
        hasParallelComparison: !!protocol.hasParallelComparison,
        issues,
      },
    };
  }

  return {
    rule: "Project Optimus Dose Optimization",
    status: "pass",
    message: `Protocol includes ${protocol.doseLevels} dose levels with dose-comparison strategy`,
    regulation: "FDA Project Optimus Guidance, Aug 2024",
    details: {
      doseLevels: protocol.doseLevels,
      escalationMethod: protocol.escalationMethod,
      hasBackfillCohorts: protocol.hasBackfillCohorts,
      hasExpansionCohorts: protocol.hasExpansionCohorts,
      hasParallelComparison: protocol.hasParallelComparison,
    },
  };
}

// Per FDORA (Food and Drug Omnibus Reform Act), a Diversity Action Plan
// (DAP) with enrollment goals must be submitted with the IND.
export function checkDiversityPlan(protocol: ProtocolDesign): RuleCheckResult {
  if (!protocol.diversityPlan) {
    return {
      rule: "Diversity Action Plan",
      status: "fail",
      message: "No Diversity Action Plan found. FDORA requires enrollment goals with IND submission.",
      regulation: "FDORA (Food and Drug Omnibus Reform Act), Diversity Action Plan requirement",
    };
  }

  if (!protocol.diversityPlan.hasEnrollmentGoals) {
    return {
      rule: "Diversity Action Plan",
      status: "fail",
      message: "Diversity Action Plan exists but lacks specific enrollment goals",
      regulation: "FDORA (Food and Drug Omnibus Reform Act), Diversity Action Plan requirement",
      details: {
        populations: protocol.diversityPlan.populations ?? [],
      },
    };
  }

  const populationCount = protocol.diversityPlan.populations?.length ?? 0;
  if (populationCount === 0) {
    return {
      rule: "Diversity Action Plan",
      status: "warning",
      message: "Diversity Action Plan has enrollment goals but no specific populations defined",
      regulation: "FDORA (Food and Drug Omnibus Reform Act), Diversity Action Plan requirement",
      details: {
        hasEnrollmentGoals: true,
        populations: [],
      },
    };
  }

  return {
    rule: "Diversity Action Plan",
    status: "pass",
    message: `Diversity Action Plan includes enrollment goals for ${populationCount} population(s)`,
    regulation: "FDORA (Food and Drug Omnibus Reform Act), Diversity Action Plan requirement",
    details: {
      hasEnrollmentGoals: true,
      populations: protocol.diversityPlan.populations,
      targetPercentages: protocol.diversityPlan.targetPercentages,
    },
  };
}

// Calculate Human Equivalent Dose (HED) from animal data using FDA body
// surface area (BSA) normalization method.
// Source: FDA Guidance "Estimating the Maximum Safe Starting Dose in
// Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (2005)
// Formula: HED (mg/kg) = Animal Dose (mg/kg) * (Animal Km / Human Km)
// Equivalent: HED = Animal Dose / (Human Km / Animal Km), where conversion factors below are Human Km / Animal Km
export function calculateHED(
  animalDose: number,
  species: string,
  humanWeight: number = DEFAULT_HUMAN_WEIGHT_KG
): RuleCheckResult {
  const speciesLower = species.toLowerCase();
  const factor = BSA_CONVERSION_FACTORS[speciesLower];

  if (!factor) {
    return {
      rule: "Human Equivalent Dose Calculation",
      status: "fail",
      message: `Unknown species "${species}". Supported: ${Object.keys(BSA_CONVERSION_FACTORS).join(", ")}`,
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { animalDose, species, supportedSpecies: Object.keys(BSA_CONVERSION_FACTORS) },
    };
  }

  if (animalDose <= 0) {
    return {
      rule: "Human Equivalent Dose Calculation",
      status: "fail",
      message: "Animal dose must be greater than 0",
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { animalDose, species },
    };
  }

  const hedMgPerKg = animalDose / factor;
  const hedTotalMg = hedMgPerKg * humanWeight;

  return {
    rule: "Human Equivalent Dose Calculation",
    status: "pass",
    message: `HED = ${hedMgPerKg.toFixed(4)} mg/kg (${hedTotalMg.toFixed(2)} mg total for ${humanWeight} kg human) from ${species} dose of ${animalDose} mg/kg using BSA factor ${factor}`,
    regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
    details: {
      animalDose,
      species: speciesLower,
      conversionFactor: factor,
      hedMgPerKg,
      hedTotalMg,
      humanWeight,
    },
  };
}

// Calculate safety margin: NOAEL-derived HED / proposed starting dose.
// Per FDA 2005 guidance, the MRSD is typically HED(NOAEL) / safety factor (10x standard).
// This function checks whether the proposed starting dose has adequate safety margin.
export function calculateSafetyMargin(
  noaelHed: number,
  proposedStartingDose: number
): RuleCheckResult {
  if (noaelHed <= 0) {
    return {
      rule: "Safety Margin Calculation",
      status: "fail",
      message: "NOAEL-derived HED must be greater than 0",
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { noaelHed, proposedStartingDose },
    };
  }

  if (proposedStartingDose <= 0) {
    return {
      rule: "Safety Margin Calculation",
      status: "fail",
      message: "Proposed starting dose must be greater than 0",
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { noaelHed, proposedStartingDose },
    };
  }

  const margin = noaelHed / proposedStartingDose;

  if (margin < 10) {
    return {
      rule: "Safety Margin Calculation",
      status: "fail",
      message: `Safety margin ${margin.toFixed(1)}x is below the standard 10x threshold. Starting dose may be too high.`,
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { noaelHed, proposedStartingDose, safetyMargin: margin, threshold: 10 },
    };
  }

  if (margin < 20) {
    return {
      rule: "Safety Margin Calculation",
      status: "warning",
      message: `Safety margin ${margin.toFixed(1)}x meets minimum 10x threshold but is below the preferred 20x margin for high-risk molecules`,
      regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
      details: { noaelHed, proposedStartingDose, safetyMargin: margin, threshold: 10 },
    };
  }

  return {
    rule: "Safety Margin Calculation",
    status: "pass",
    message: `Safety margin ${margin.toFixed(1)}x provides adequate separation (NOAEL HED ${noaelHed} mg/kg / starting dose ${proposedStartingDose} mg/kg)`,
    regulation: "FDA Guidance: Estimating Maximum Safe Starting Dose (2005)",
    details: { noaelHed, proposedStartingDose, safetyMargin: margin },
  };
}

// For bifunctional ADCs (especially afucosylated), verify CRS and MAS
// monitoring plans exist in the protocol safety section.
// Afucosylated antibodies enhance NK cell and macrophage activation,
// increasing cytokine release risk. Protocol must include CRS grading
// (ASTCT consensus grading) and MAS monitoring.
export function checkCRSMonitoring(protocol: ProtocolDesign): RuleCheckResult {
  const safety = protocol.safetyMonitoring;

  if (!safety) {
    return {
      rule: "CRS/MAS Monitoring Plan",
      status: "fail",
      message: "No safety monitoring section found in protocol. Bifunctional ADCs require CRS grading and MAS monitoring plans.",
      regulation: "FDA IND Safety Requirements for Bifunctional ADCs; ASTCT CRS Consensus Grading",
    };
  }

  const issues: string[] = [];

  if (!safety.hasCRSGrading) {
    issues.push("Missing CRS grading scale (ASTCT consensus grading recommended)");
  }

  if (!safety.hasCRSManagementPlan) {
    issues.push("Missing CRS management/treatment algorithm");
  }

  if (!safety.hasMASMonitoring) {
    issues.push("Missing MAS (Macrophage Activation Syndrome) monitoring plan");
  }

  if (issues.length > 0) {
    return {
      rule: "CRS/MAS Monitoring Plan",
      status: "fail",
      message: issues.join(". "),
      regulation: "FDA IND Safety Requirements for Bifunctional ADCs; ASTCT CRS Consensus Grading",
      details: {
        hasCRSGrading: !!safety.hasCRSGrading,
        hasCRSManagementPlan: !!safety.hasCRSManagementPlan,
        hasMASMonitoring: !!safety.hasMASMonitoring,
        gradingSystem: safety.gradingSystem,
        issues,
      },
    };
  }

  return {
    rule: "CRS/MAS Monitoring Plan",
    status: "pass",
    message: `CRS/MAS monitoring plan complete (grading: ${safety.gradingSystem ?? "present"})`,
    regulation: "FDA IND Safety Requirements for Bifunctional ADCs; ASTCT CRS Consensus Grading",
    details: {
      hasCRSGrading: true,
      hasCRSManagementPlan: true,
      hasMASMonitoring: true,
      gradingSystem: safety.gradingSystem,
    },
  };
}

// Flag whether a Tissue Cross-Reactivity (TCR) study is needed.
// TCR studies are required when the tox species may not express the target
// antigen similarly to humans. For targets expressed on normal human tissues
// (e.g., mucosal epithelial cells), TCR scrutiny is heightened.
export function checkTCRRequirement(
  drugTarget: string,
  toxSpecies: string
): RuleCheckResult {
  // Known targets with broad normal-tissue expression that demand TCR
  const highRiskTargets = [
    "her2", "egfr", "trop2", "nectin-4", "folr1",
    "dem-t02", "dem-txx",
  ];

  const targetLower = drugTarget.toLowerCase();
  const isHighRiskTarget = highRiskTargets.some((t) => targetLower.includes(t));

  // Species where target expression data is often limited
  const limitedExpressionSpecies = ["mouse", "rat", "rabbit"];
  const speciesLower = toxSpecies.toLowerCase();
  const isLimitedSpecies = limitedExpressionSpecies.includes(speciesLower);

  if (isHighRiskTarget && isLimitedSpecies) {
    return {
      rule: "Tissue Cross-Reactivity Study",
      status: "fail",
      message: `Target ${drugTarget} has broad normal-tissue expression and tox species ${toxSpecies} has limited cross-reactivity data. TCR study required with human and ${toxSpecies} tissue panels.`,
      regulation: "FDA IND Nonclinical Requirements; ICH S6(R1) Preclinical Safety for Biotechnology Products",
      details: { drugTarget, toxSpecies, isHighRiskTarget, isLimitedSpecies },
    };
  }

  if (isHighRiskTarget) {
    return {
      rule: "Tissue Cross-Reactivity Study",
      status: "warning",
      message: `Target ${drugTarget} is expressed on normal human tissues. Verify that ${toxSpecies} expresses the target similarly to humans. TCR study likely needed.`,
      regulation: "FDA IND Nonclinical Requirements; ICH S6(R1) Preclinical Safety for Biotechnology Products",
      details: { drugTarget, toxSpecies, isHighRiskTarget, isLimitedSpecies },
    };
  }

  if (isLimitedSpecies) {
    return {
      rule: "Tissue Cross-Reactivity Study",
      status: "warning",
      message: `Tox species ${toxSpecies} may have limited target cross-reactivity. Confirm target expression comparability.`,
      regulation: "FDA IND Nonclinical Requirements; ICH S6(R1) Preclinical Safety for Biotechnology Products",
      details: { drugTarget, toxSpecies, isHighRiskTarget, isLimitedSpecies },
    };
  }

  return {
    rule: "Tissue Cross-Reactivity Study",
    status: "pass",
    message: `Target ${drugTarget} with tox species ${toxSpecies}: standard TCR assessment expected to be sufficient`,
    regulation: "FDA IND Nonclinical Requirements; ICH S6(R1) Preclinical Safety for Biotechnology Products",
    details: { drugTarget, toxSpecies, isHighRiskTarget, isLimitedSpecies },
  };
}

// Validate batch-to-batch consistency for DAR, purity, and potency.
// FDA expects consistency across manufacturing batches for ADC release
// testing. Coefficient of variation (CV) above thresholds flags inconsistency.
export function validateBatchConsistency(batches: BatchRecord[]): RuleCheckResult {
  if (batches.length < 2) {
    return {
      rule: "Batch Consistency",
      status: "not_applicable",
      message: "Fewer than 2 batches provided; consistency comparison requires at least 2 batches",
      regulation: "FDA CMC Guidance, Batch Analysis (Module 3.2.S.4)",
      details: { batchCount: batches.length },
    };
  }

  const dars = batches.map((b) => b.dar);
  const purities = batches.map((b) => b.purity);
  const potencies = batches.map((b) => b.potency);

  const cv = (values: number[]): number => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return Infinity;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return (Math.sqrt(variance) / mean) * 100;
  };

  const darCV = cv(dars);
  const purityCV = cv(purities);
  const potencyCV = cv(potencies);

  // Thresholds: DAR CV < 10%, purity CV < 5%, potency CV < 15%
  const DAR_CV_LIMIT = 10;
  const PURITY_CV_LIMIT = 5;
  const POTENCY_CV_LIMIT = 15;

  const failures: string[] = [];
  const warnings: string[] = [];

  if (darCV > DAR_CV_LIMIT) {
    failures.push(`DAR CV ${darCV.toFixed(1)}% exceeds ${DAR_CV_LIMIT}% limit`);
  } else if (darCV > DAR_CV_LIMIT * 0.7) {
    warnings.push(`DAR CV ${darCV.toFixed(1)}% is approaching ${DAR_CV_LIMIT}% limit`);
  }

  if (purityCV > PURITY_CV_LIMIT) {
    failures.push(`Purity CV ${purityCV.toFixed(1)}% exceeds ${PURITY_CV_LIMIT}% limit`);
  } else if (purityCV > PURITY_CV_LIMIT * 0.7) {
    warnings.push(`Purity CV ${purityCV.toFixed(1)}% is approaching ${PURITY_CV_LIMIT}% limit`);
  }

  if (potencyCV > POTENCY_CV_LIMIT) {
    failures.push(`Potency CV ${potencyCV.toFixed(1)}% exceeds ${POTENCY_CV_LIMIT}% limit`);
  } else if (potencyCV > POTENCY_CV_LIMIT * 0.7) {
    warnings.push(`Potency CV ${potencyCV.toFixed(1)}% is approaching ${POTENCY_CV_LIMIT}% limit`);
  }

  if (failures.length > 0) {
    return {
      rule: "Batch Consistency",
      status: "fail",
      message: failures.join(". "),
      regulation: "FDA CMC Guidance, Batch Analysis (Module 3.2.S.4)",
      details: {
        batchCount: batches.length,
        darCV,
        purityCV,
        potencyCV,
        failures,
        warnings,
      },
    };
  }

  if (warnings.length > 0) {
    return {
      rule: "Batch Consistency",
      status: "warning",
      message: warnings.join(". "),
      regulation: "FDA CMC Guidance, Batch Analysis (Module 3.2.S.4)",
      details: { batchCount: batches.length, darCV, purityCV, potencyCV, warnings },
    };
  }

  return {
    rule: "Batch Consistency",
    status: "pass",
    message: `Batch consistency acceptable across ${batches.length} batches (DAR CV ${darCV.toFixed(1)}%, Purity CV ${purityCV.toFixed(1)}%, Potency CV ${potencyCV.toFixed(1)}%)`,
    regulation: "FDA CMC Guidance, Batch Analysis (Module 3.2.S.4)",
    details: { batchCount: batches.length, darCV, purityCV, potencyCV },
  };
}

// Check stability data for degradation trends that would shorten shelf life.
// FDA expects stability studies to demonstrate acceptable quality throughout
// the proposed shelf life (ICH Q1A/Q5C guidelines).
// Flags: purity dropping > 5% per timepoint, potency dropping > 10% from
// initial, or aggregation increasing above 5%.
export function checkStabilityTrend(stabilityData: StabilityTimepoint[]): RuleCheckResult {
  if (stabilityData.length < 2) {
    return {
      rule: "Stability Trend Analysis",
      status: "not_applicable",
      message: "Fewer than 2 timepoints provided; trend analysis requires at least 2 timepoints",
      regulation: "ICH Q1A(R2) Stability Testing; ICH Q5C Quality of Biotechnological Products",
      details: { timepointCount: stabilityData.length },
    };
  }

  // Sort by time
  const sorted = [...stabilityData].sort((a, b) => a.timeMonths - b.timeMonths);
  const issues: string[] = [];
  const initial = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    // Purity drop per interval (guard NaN from null extraction data)
    if (!isNaN(prev.purity) && !isNaN(current.purity)) {
      const purityDrop = prev.purity - current.purity;
      if (purityDrop > 5) {
        issues.push(
          `Purity dropped ${purityDrop.toFixed(1)}% between month ${prev.timeMonths} and ${current.timeMonths} (exceeds 5% per interval)`
        );
      }
    }

    // Potency drop from initial (guard NaN)
    if (!isNaN(initial.potency) && !isNaN(current.potency) && initial.potency - current.potency > 10) {
      const drop = initial.potency - current.potency;
      issues.push(
        `Potency dropped ${drop.toFixed(1)}% from initial at month ${current.timeMonths} (exceeds 10% from initial)`
      );
    }

    // Aggregation increase
    if (current.aggregation !== undefined && current.aggregation > 5) {
      issues.push(
        `Aggregation ${current.aggregation.toFixed(1)}% at month ${current.timeMonths} exceeds 5% limit`
      );
    }
  }

  if (issues.length > 0) {
    return {
      rule: "Stability Trend Analysis",
      status: "fail",
      message: issues.join(". "),
      regulation: "ICH Q1A(R2) Stability Testing; ICH Q5C Quality of Biotechnological Products",
      details: {
        timepointCount: sorted.length,
        timeRange: `${sorted[0].timeMonths}-${sorted[sorted.length - 1].timeMonths} months`,
        issues,
      },
    };
  }

  // Check for mild degradation trends (warning level)
  const totalPurityDrop = initial.purity - sorted[sorted.length - 1].purity;
  if (totalPurityDrop > 3) {
    return {
      rule: "Stability Trend Analysis",
      status: "warning",
      message: `Total purity decline of ${totalPurityDrop.toFixed(1)}% over ${sorted[sorted.length - 1].timeMonths} months. Monitor trend closely.`,
      regulation: "ICH Q1A(R2) Stability Testing; ICH Q5C Quality of Biotechnological Products",
      details: {
        timepointCount: sorted.length,
        totalPurityDrop,
        timeRange: `${sorted[0].timeMonths}-${sorted[sorted.length - 1].timeMonths} months`,
      },
    };
  }

  return {
    rule: "Stability Trend Analysis",
    status: "pass",
    message: `Stability data across ${sorted.length} timepoints (${sorted[0].timeMonths}-${sorted[sorted.length - 1].timeMonths} months) shows acceptable trends`,
    regulation: "ICH Q1A(R2) Stability Testing; ICH Q5C Quality of Biotechnological Products",
    details: {
      timepointCount: sorted.length,
      timeRange: `${sorted[0].timeMonths}-${sorted[sorted.length - 1].timeMonths} months`,
      totalPurityDrop,
    },
  };
}
