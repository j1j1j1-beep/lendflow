// adc-rules.ts
// ADC (Antibody-Drug Conjugate) specific regulatory rules.
// Covers characterization requirements, afucosylation, linker stability,
// payload safety, and required nonclinical study determination.
// Deterministic checks only.

import type { RuleCheckResult } from "./fda-rules";

// Input types

export interface ADCCharacterizationData {
  dar?: number;
  darDistribution?: boolean;
  aggregation?: number;
  purity?: number;
  potencyAssay?: boolean;
  bindingAffinity?: boolean;
  molecularWeight?: boolean;
  conjugationSiteAnalysis?: boolean;
  freePayloadPercentage?: number;
  endotoxin?: boolean;
  sterility?: boolean;
  appearance?: boolean;
  pH?: boolean;
  osmolality?: boolean;
}

export interface AfucosylationData {
  isAfucosylated: boolean;
  hasADCCAssay?: boolean;
  adccPotencyResult?: number;
  hasCDCAssay?: boolean;
  fucosylationLevel?: number;
}

export interface LinkerStabilityData {
  hasPlasmaStability?: boolean;
  plasmaSpecies?: string[];
  stabilityHours?: number;
  percentIntactAtEnd?: number;
  hasSerumStability?: boolean;
  bufferStabilityPH?: number[];
}

export interface PayloadProfile {
  payloadName: string;
  payloadClass?: string;
  knownToxicities?: string[];
  hasGenotoxicityData?: boolean;
  hasCardiacSafety?: boolean;
  hasBoneMarrowToxicity?: boolean;
  hasHepatotoxicity?: boolean;
  hasNeurotoxicity?: boolean;
  isDLT?: boolean;
}

export interface DrugClassification {
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

// Required characterization tests for ADCs per FDA CMC guidance (Module 3).
// ADCs require characterization of both the antibody and conjugate properties
// beyond what's needed for unconjugated antibodies.
const REQUIRED_CHARACTERIZATION_FIELDS: Array<{
  field: keyof ADCCharacterizationData;
  label: string;
  criticalForRelease: boolean;
}> = [
  { field: "dar", label: "Drug-to-Antibody Ratio (DAR)", criticalForRelease: true },
  { field: "darDistribution", label: "DAR distribution analysis", criticalForRelease: true },
  { field: "purity", label: "Purity (SEC-HPLC or equivalent)", criticalForRelease: true },
  { field: "potencyAssay", label: "Potency assay (cytotoxicity)", criticalForRelease: true },
  { field: "bindingAffinity", label: "Binding affinity (target antigen)", criticalForRelease: true },
  { field: "molecularWeight", label: "Molecular weight confirmation", criticalForRelease: false },
  { field: "conjugationSiteAnalysis", label: "Conjugation site characterization", criticalForRelease: false },
  { field: "endotoxin", label: "Endotoxin testing", criticalForRelease: true },
  { field: "sterility", label: "Sterility testing", criticalForRelease: true },
  { field: "appearance", label: "Appearance/visual inspection", criticalForRelease: true },
  { field: "pH", label: "pH measurement", criticalForRelease: true },
  { field: "osmolality", label: "Osmolality", criticalForRelease: false },
];

// Validate that all required ADC characterization data is present.
// Per FDA CMC guidance for ADCs (Module 3.2.S and 3.2.P), the characterization
// package must demonstrate identity, purity, potency, and safety attributes.
export function validateADCCharacterization(data: ADCCharacterizationData): RuleCheckResult {
  const missing: string[] = [];
  const missingCritical: string[] = [];
  const present: string[] = [];

  for (const req of REQUIRED_CHARACTERIZATION_FIELDS) {
    const value = data[req.field];
    // Check if field is present and truthy (for booleans) or has a value (for numbers)
    const isPresent = value !== undefined && value !== null && value !== false;

    if (!isPresent) {
      missing.push(req.label);
      if (req.criticalForRelease) {
        missingCritical.push(req.label);
      }
    } else {
      present.push(req.label);
    }
  }

  // Check aggregation specifically (should be present and below threshold)
  if (data.aggregation === undefined || data.aggregation === null) {
    missing.push("Aggregation level");
  } else if (data.aggregation > 5) {
    return {
      rule: "ADC Characterization",
      status: "fail",
      message: `Aggregation ${data.aggregation.toFixed(1)}% exceeds 5% limit, plus ${missing.length} characterization fields missing`,
      regulation: "FDA CMC Guidance for ADCs (Module 3.2.S, 3.2.P)",
      details: { missing, missingCritical, present, aggregation: data.aggregation },
    };
  }

  if (missingCritical.length > 0) {
    return {
      rule: "ADC Characterization",
      status: "fail",
      message: `Missing critical release-testing data: ${missingCritical.join(", ")}`,
      regulation: "FDA CMC Guidance for ADCs (Module 3.2.S, 3.2.P)",
      details: {
        missing,
        missingCritical,
        present,
        presentCount: present.length,
        totalRequired: REQUIRED_CHARACTERIZATION_FIELDS.length,
      },
    };
  }

  if (missing.length > 0) {
    return {
      rule: "ADC Characterization",
      status: "warning",
      message: `Core characterization complete but missing non-critical data: ${missing.join(", ")}`,
      regulation: "FDA CMC Guidance for ADCs (Module 3.2.S, 3.2.P)",
      details: {
        missing,
        present,
        presentCount: present.length,
        totalRequired: REQUIRED_CHARACTERIZATION_FIELDS.length,
      },
    };
  }

  return {
    rule: "ADC Characterization",
    status: "pass",
    message: `All ${present.length} required characterization tests present`,
    regulation: "FDA CMC Guidance for ADCs (Module 3.2.S, 3.2.P)",
    details: {
      present,
      presentCount: present.length,
      totalRequired: REQUIRED_CHARACTERIZATION_FIELDS.length,
    },
  };
}

// If the antibody is afucosylated, the potency assay MUST include a
// validated ADCC biological assay, not just payload-mediated cytotoxicity.
// Afucosylation enhances Fc-gamma receptor binding and ADCC activity,
// which is part of the mechanism of action and must be characterized.
// Per FDA CMC guidance, Module 3 potency characterization.
export function checkAfucosylationRequirements(data: AfucosylationData): RuleCheckResult {
  if (!data.isAfucosylated) {
    return {
      rule: "Afucosylation ADCC Assay",
      status: "not_applicable",
      message: "Antibody is not afucosylated; ADCC potency assay requirement does not apply",
      regulation: "FDA CMC Guidance, Potency (Module 3.2.P.5)",
    };
  }

  const issues: string[] = [];

  if (!data.hasADCCAssay) {
    issues.push("Afucosylated antibody requires validated ADCC potency assay (not just payload cytotoxicity)");
  }

  // Check fucosylation level if reported
  if (data.fucosylationLevel !== undefined && data.fucosylationLevel > 10) {
    issues.push(
      `Fucosylation level ${data.fucosylationLevel}% is above 10% for a product claimed as afucosylated. Verify manufacturing consistency.`
    );
  }

  if (issues.length > 0) {
    return {
      rule: "Afucosylation ADCC Assay",
      status: "fail",
      message: issues.join(". "),
      regulation: "FDA CMC Guidance, Potency (Module 3.2.P.5)",
      details: {
        isAfucosylated: true,
        hasADCCAssay: !!data.hasADCCAssay,
        adccPotencyResult: data.adccPotencyResult,
        fucosylationLevel: data.fucosylationLevel,
        issues,
      },
    };
  }

  return {
    rule: "Afucosylation ADCC Assay",
    status: "pass",
    message: `ADCC potency assay present for afucosylated antibody${data.adccPotencyResult !== undefined ? ` (result: ${data.adccPotencyResult})` : ""}`,
    regulation: "FDA CMC Guidance, Potency (Module 3.2.P.5)",
    details: {
      isAfucosylated: true,
      hasADCCAssay: true,
      adccPotencyResult: data.adccPotencyResult,
      fucosylationLevel: data.fucosylationLevel,
    },
  };
}

// Validate linker stability data. ADC linker must demonstrate adequate
// plasma stability to ensure the payload is delivered to tumor cells
// rather than released systemically (which causes off-target toxicity).
// FDA expects stability in human plasma and at least one preclinical species.
export function validateLinkerStability(stabilityData: LinkerStabilityData): RuleCheckResult {
  const issues: string[] = [];

  if (!stabilityData.hasPlasmaStability) {
    issues.push("No plasma stability data provided for ADC linker");
  }

  if (stabilityData.hasPlasmaStability) {
    // Must have human plasma data
    if (!stabilityData.plasmaSpecies || !stabilityData.plasmaSpecies.some(
      (s) => s.toLowerCase() === "human"
    )) {
      issues.push("Plasma stability must include human plasma (not just animal species)");
    }

    // Minimum 72 hours of stability assessment recommended
    if (stabilityData.stabilityHours !== undefined && stabilityData.stabilityHours < 72) {
      issues.push(`Plasma stability assessed for only ${stabilityData.stabilityHours} hours; minimum 72 hours recommended`);
    }

    // Intact percentage at end of study
    if (stabilityData.percentIntactAtEnd !== undefined && stabilityData.percentIntactAtEnd < 90) {
      issues.push(
        `Only ${stabilityData.percentIntactAtEnd.toFixed(1)}% intact ADC remaining after plasma incubation (below 90% threshold suggests premature linker cleavage)`
      );
    }
  }

  if (issues.length > 0) {
    const hasAnyData = stabilityData.hasPlasmaStability || stabilityData.hasSerumStability;
    return {
      rule: "Linker Stability",
      status: hasAnyData ? "warning" : "fail",
      message: issues.join(". "),
      regulation: "FDA CMC Guidance for ADCs, Linker Characterization",
      details: {
        hasPlasmaStability: !!stabilityData.hasPlasmaStability,
        plasmaSpecies: stabilityData.plasmaSpecies,
        stabilityHours: stabilityData.stabilityHours,
        percentIntactAtEnd: stabilityData.percentIntactAtEnd,
        hasSerumStability: !!stabilityData.hasSerumStability,
        issues,
      },
    };
  }

  return {
    rule: "Linker Stability",
    status: "pass",
    message: `Linker plasma stability demonstrated: ${stabilityData.percentIntactAtEnd?.toFixed(1) ?? ">90"}% intact at ${stabilityData.stabilityHours ?? 72}+ hours in ${stabilityData.plasmaSpecies?.join(", ") ?? "human"} plasma`,
    regulation: "FDA CMC Guidance for ADCs, Linker Characterization",
    details: {
      hasPlasmaStability: true,
      plasmaSpecies: stabilityData.plasmaSpecies,
      stabilityHours: stabilityData.stabilityHours,
      percentIntactAtEnd: stabilityData.percentIntactAtEnd,
    },
  };
}

// Cross-reference payload against known toxicity profiles.
// Common ADC payload classes have well-characterized toxicities that
// the FDA expects sponsors to address in nonclinical and clinical plans.
const PAYLOAD_CLASS_TOXICITIES: Record<string, string[]> = {
  "maytansinoid": ["hepatotoxicity", "peripheral_neuropathy", "ocular_toxicity"],
  "auristatin": ["neutropenia", "peripheral_neuropathy", "hepatotoxicity"],
  "calicheamicin": ["hepatotoxicity", "veno_occlusive_disease", "myelosuppression"],
  "pbd_dimer": ["myelosuppression", "hepatotoxicity", "edema"],
  "camptothecin": ["diarrhea", "neutropenia", "myelosuppression"],
  "topoisomerase_inhibitor": ["neutropenia", "diarrhea", "nausea"],
};

export function checkPayloadSafetyProfile(payload: PayloadProfile): RuleCheckResult {
  const classLower = payload.payloadClass?.toLowerCase().replace(/[\s-]/g, "_") ?? "";
  const knownToxicities = PAYLOAD_CLASS_TOXICITIES[classLower];
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if safety studies address known toxicities
  if (payload.hasGenotoxicityData === false) {
    issues.push("Missing genotoxicity data for cytotoxic payload");
  }

  if (knownToxicities) {
    if (knownToxicities.includes("hepatotoxicity") && !payload.hasHepatotoxicity) {
      issues.push(`${payload.payloadClass} class has known hepatotoxicity risk; liver safety assessment missing`);
    }
    if (knownToxicities.includes("peripheral_neuropathy") && !payload.hasNeurotoxicity) {
      issues.push(`${payload.payloadClass} class has known neurotoxicity risk; neurological safety assessment missing`);
    }
    if (knownToxicities.includes("myelosuppression") && !payload.hasBoneMarrowToxicity) {
      issues.push(`${payload.payloadClass} class has known myelosuppression risk; bone marrow assessment missing`);
    }

    recommendations.push(
      `Known ${payload.payloadClass} toxicities to monitor: ${knownToxicities.join(", ")}`
    );
  } else if (payload.payloadClass) {
    recommendations.push(
      `Payload class "${payload.payloadClass}" not in standard reference database; ensure comprehensive nonclinical toxicology package`
    );
  }

  // Check if any known toxicities are DLTs
  if (payload.isDLT) {
    recommendations.push("Payload has dose-limiting toxicity history; ensure protocol includes dose-modification guidelines");
  }

  if (issues.length > 0) {
    return {
      rule: "Payload Safety Profile",
      status: "fail",
      message: issues.join(". "),
      regulation: "FDA IND Nonclinical Safety Requirements; ICH S9 Nonclinical Evaluation for Anticancer Pharmaceuticals",
      details: {
        payloadName: payload.payloadName,
        payloadClass: payload.payloadClass,
        knownClassToxicities: knownToxicities ?? [],
        issues,
        recommendations,
      },
    };
  }

  if (recommendations.length > 0 && !knownToxicities) {
    return {
      rule: "Payload Safety Profile",
      status: "warning",
      message: recommendations.join(". "),
      regulation: "FDA IND Nonclinical Safety Requirements; ICH S9 Nonclinical Evaluation for Anticancer Pharmaceuticals",
      details: {
        payloadName: payload.payloadName,
        payloadClass: payload.payloadClass,
        recommendations,
      },
    };
  }

  return {
    rule: "Payload Safety Profile",
    status: "pass",
    message: `Payload ${payload.payloadName} safety profile adequately addressed${knownToxicities ? ` (known class toxicities: ${knownToxicities.join(", ")})` : ""}`,
    regulation: "FDA IND Nonclinical Safety Requirements; ICH S9 Nonclinical Evaluation for Anticancer Pharmaceuticals",
    details: {
      payloadName: payload.payloadName,
      payloadClass: payload.payloadClass,
      knownClassToxicities: knownToxicities ?? [],
      recommendations,
    },
  };
}

// Determine which nonclinical studies are required based on drug
// characteristics. Returns a list of required studies with regulatory
// basis. This is the ADC equivalent of the lending engine's condition
// generation: deterministic rules that produce a checklist.
export function determineRequiredStudies(
  drugClass: string,
  target: string,
  mechanism: string,
  options?: {
    isAfucosylated?: boolean;
    isBifunctional?: boolean;
    payloadClass?: string;
    hasNovelLinker?: boolean;
    hasNovelPayload?: boolean;
    targetExpressedOnNormalTissue?: boolean;
  }
): RuleCheckResult {
  const requiredStudies: Array<{
    study: string;
    reason: string;
    regulation: string;
    priority: "required" | "recommended" | "conditional";
  }> = [];

  // Base requirements for all ADCs (per ICH S9 and FDA guidance)
  requiredStudies.push({
    study: "Single-dose toxicity in rodent and non-rodent",
    reason: "Not required per ICH S9 Section 6 for anticancer pharmaceuticals; information typically captured in repeat-dose studies. Conduct only if needed for dose range-finding.",
    regulation: "ICH S9 Section 6 (standalone single-dose tox not required for anticancer)",
    priority: "recommended",
  });

  requiredStudies.push({
    study: "Repeat-dose GLP toxicity (at least one species)",
    reason: "Required for FIH dose selection and safety assessment",
    regulation: "ICH S9; FDA IND Requirements",
    priority: "required",
  });

  requiredStudies.push({
    study: "In vitro genotoxicity (payload)",
    reason: "Cytotoxic payloads require genotoxicity assessment",
    regulation: "ICH S2(R1)",
    priority: "required",
  });

  requiredStudies.push({
    study: "Safety pharmacology (cardiovascular, CNS, respiratory)",
    reason: "Core battery safety pharmacology endpoints; per ICH S9 Section 7, may be incorporated into repeat-dose toxicity studies rather than conducted as standalone studies",
    regulation: "ICH S9 Section 7 (with reference to ICH S7A)",
    priority: "required",
  });

  requiredStudies.push({
    study: "PK/TK study in relevant species",
    reason: "Pharmacokinetics and toxicokinetics for dose scaling",
    regulation: "ICH S6(R1); FDA ADC Guidance",
    priority: "required",
  });

  requiredStudies.push({
    study: "Tissue cross-reactivity (TCR) study",
    reason: "Assess antibody binding to normal human tissues",
    regulation: "ICH S6(R1)",
    priority: "required",
  });

  // ADC-specific studies
  requiredStudies.push({
    study: "Linker-payload stability in plasma",
    reason: "ADC-specific: assess premature deconjugation risk",
    regulation: "FDA CMC Guidance for ADCs",
    priority: "required",
  });

  requiredStudies.push({
    study: "Free payload PK characterization",
    reason: "Measure systemic exposure to unconjugated payload",
    regulation: "FDA Clinical Pharmacology Considerations for ADCs",
    priority: "required",
  });

  // Afucosylation-specific
  if (options?.isAfucosylated) {
    requiredStudies.push({
      study: "ADCC potency assay (validated biological assay)",
      reason: "Afucosylated antibody: ADCC is part of mechanism, must be characterized",
      regulation: "FDA CMC Guidance, Potency (Module 3.2.P.5)",
      priority: "required",
    });

    requiredStudies.push({
      study: "Fc-gamma receptor binding assay",
      reason: "Afucosylation enhances FcgRIIIa binding; must demonstrate",
      regulation: "FDA CMC Guidance for Biosimilars/ADCs",
      priority: "required",
    });
  }

  // Bifunctional-specific
  if (options?.isBifunctional) {
    requiredStudies.push({
      study: "Cytokine release assay (in vitro)",
      reason: "Bifunctional ADCs carry heightened CRS risk",
      regulation: "FDA IND Safety for Immunomodulatory Biologics",
      priority: "required",
    });

    requiredStudies.push({
      study: "Macrophage activation assessment",
      reason: "Bifunctional mechanism may trigger MAS",
      regulation: "FDA IND Safety for Immunomodulatory Biologics",
      priority: "required",
    });
  }

  // Normal tissue expression
  if (options?.targetExpressedOnNormalTissue) {
    requiredStudies.push({
      study: "Enhanced tissue cross-reactivity panel (expanded tissue set)",
      reason: `Target ${target} expressed on normal tissue; expanded TCR needed to assess on-target/off-tumor risk`,
      regulation: "ICH S6(R1); FDA IND Nonclinical Requirements",
      priority: "required",
    });
  }

  // Novel linker
  if (options?.hasNovelLinker) {
    requiredStudies.push({
      study: "Linker metabolism/catabolism study",
      reason: "Novel linker technology requires characterization of catabolite profiles",
      regulation: "FDA CMC Guidance for ADCs",
      priority: "required",
    });
  }

  // Novel payload
  if (options?.hasNovelPayload) {
    requiredStudies.push({
      study: "Standalone payload toxicity study",
      reason: "Novel payload with limited safety database requires independent toxicity assessment",
      regulation: "ICH S9; FDA IND Requirements",
      priority: "required",
    });

    requiredStudies.push({
      study: "Payload DMPK (absorption, distribution, metabolism, excretion)",
      reason: "Novel payload PK must be independently characterized",
      regulation: "ICH M3(R2)",
      priority: "recommended",
    });
  }

  const requiredCount = requiredStudies.filter((s) => s.priority === "required").length;
  const recommendedCount = requiredStudies.filter((s) => s.priority === "recommended").length;

  return {
    rule: "Required Nonclinical Studies",
    status: "pass",
    message: `${requiredCount} required and ${recommendedCount} recommended nonclinical studies identified for ${drugClass} targeting ${target} (${mechanism})`,
    regulation: "ICH S9; ICH S6(R1); FDA ADC Guidance",
    details: {
      drugClass,
      target,
      mechanism,
      isAfucosylated: options?.isAfucosylated ?? false,
      isBifunctional: options?.isBifunctional ?? false,
      hasNovelLinker: options?.hasNovelLinker ?? false,
      hasNovelPayload: options?.hasNovelPayload ?? false,
      targetExpressedOnNormalTissue: options?.targetExpressedOnNormalTissue ?? false,
      studies: requiredStudies,
      requiredCount,
      recommendedCount,
      totalCount: requiredStudies.length,
    },
  };
}
