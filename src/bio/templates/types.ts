// types.ts
// Shared types for bio document generation (FDA IND submission modules).

// Input type — data needed to generate any IND module document.

export interface BioDocumentInput {
  programName: string;
  drugName: string;
  drugClass: string;
  target?: string;
  mechanism?: string;
  indication?: string;
  phase?: string;
  sponsorName: string;
  sponsorAddress?: string;
  indNumber?: string;
  nctNumber?: string;
  regulatoryPathway?: string;
  generatedAt: Date;

  // ADC-specific fields
  antibodyType?: string;
  linkerType?: string;
  payloadType?: string;
  dar?: number;
  darSpec?: { target: number; tolerance: number };

  // Data from extractions
  batchData?: Record<string, unknown>[];
  stabilityData?: Record<string, unknown>;
  toxData?: Record<string, unknown>;
  pkData?: Record<string, unknown>;
  clinicalData?: Record<string, unknown>;
}

// Prose interfaces for each IND module — AI-generated narrative sections.

export interface INDModule1Prose {
  introductoryStatement: string;
  generalInvestigationalPlan: string;
}

export interface INDModule2Prose {
  qualitySummary: string;
  nonclinicalOverview: string;
  clinicalOverview: string;
  startingDoseJustification: string;
  safetyMarginAnalysis: string;
}

export interface INDModule3Prose {
  manufacturingProcessDescription: string;
  controlStrategy: string;
  stabilityConclusions: string;
  impurityProfile: string;
}

/** Module 4 — Nonclinical Study Reports AI sections */
export interface INDModule4Prose {
  toxicologyNarrative: string;
  pharmacologyNarrative: string;
  pkNarrative: string;
  safetyPharmacologyNarrative: string;
  tissueCrossReactivityNarrative?: string; // ADC-specific
  darCharacterizationNarrative?: string;   // ADC-specific: DAR in tox species
}

/** Module 5 — Clinical Protocol + IB Reference AI sections */
export interface INDModule5Prose {
  studyRationale: string;
  safetyMonitoringPlan: string;
  statisticalApproach: string;
  crsMonitoringPlan?: string;   // Required if bifunctional/afucosylated
  diversityPlanNarrative?: string;
}

/** Investigator's Brochure AI sections */
export interface InvestigatorBrochureProse {
  drugDescription: string;
  nonclinicalSummary: string;
  safetyProfile: string;
  riskManagement: string;
  dosingRationale: string;
  payloadToxicityProfile?: string;  // ADC-specific
  adccMechanism?: string;           // Afucosylated-specific
  freePayloadRisk?: string;         // ADC-specific
}

/** Clinical Protocol AI sections */
export interface ClinicalProtocolProse {
  backgroundRationale: string;
  studyDesignRationale: string;
  safetyMonitoringPlan: string;
  statisticalMethods: string;
  ethicalConsiderations: string;
}

/** Pre-IND Briefing Book AI sections */
export interface PreINDBriefingProse {
  executiveSummary: string;
  cmcSummary: string;
  nonclinicalSummary: string;
  clinicalPlanSummary: string;
  fdaQuestions: string[];
}

/** Informed Consent Form AI sections (all at 8th grade reading level) */
export interface InformedConsentProse {
  studyPurpose: string;
  procedures: string;
  risks: string;
  benefits: string;
  alternatives: string;
  confidentiality: string;
}

/** Diversity Action Plan AI sections (FDORA-required) */
export interface DiversityActionPlanProse {
  epidemiologySummary: string;
  recruitmentStrategy: string;
  communityEngagement: string;
  accommodations: string;
}
