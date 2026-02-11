import { z } from "zod";

const endpointSchema = z.object({
  name: z.string().nullable(),
  type: z.enum(["primary", "secondary", "exploratory"]).nullable(),
  description: z.string().nullable(),
  assessmentMethod: z.string().nullable(),
  timeframe: z.string().nullable(),
}).passthrough();

const doseLevelSchema = z.object({
  level: z.number().nullable(),
  unit: z.string().nullable(),
  schedule: z.string().nullable(),
  route: z.string().nullable(),
  numberOfPatients: z.number().nullable(),
  cohort: z.string().nullable(),
  rationale: z.string().nullable(),
}).passthrough();

const eligibilityCriterionSchema = z.object({
  criterion: z.string().nullable(),
  type: z.enum(["inclusion", "exclusion"]).nullable(),
  number: z.number().nullable(),
}).passthrough();

const dltDefinitionSchema = z.object({
  toxicity: z.string().nullable(),
  grade: z.string().nullable(),
  evaluationWindow: z.string().nullable(),
  exceptions: z.string().nullable(),
}).passthrough();

const safetyMonitoringSchema = z.object({
  crsGradingScale: z.string().nullable(),
  crsManagementPlan: z.boolean().nullable(),
  crsManagementDetails: z.string().nullable(),
  masMonitoring: z.boolean().nullable(),
  masMonitoringDetails: z.string().nullable(),
  dltDefinitions: z.array(dltDefinitionSchema).default([]),
  dltEvaluationWindow: z.string().nullable(),
  dsmb: z.boolean().nullable(),
  dsmbCharter: z.boolean().nullable(),
  stoppingRules: z.array(z.string()).default([]),
  cardiacMonitoring: z.string().nullable(),
  hepaticMonitoring: z.string().nullable(),
  ocularMonitoring: z.string().nullable(),
  neurotoxicityMonitoring: z.string().nullable(),
  requiredLabMonitoring: z.array(z.string()).default([]),
  reportingTimelines: z.object({
    seriousAdverseEvents: z.string().nullable(),
    fatalEvents: z.string().nullable(),
    annualReports: z.string().nullable(),
  }).passthrough().nullable().default(null),
}).passthrough();

const doseEscalationSchema = z.object({
  method: z.string().nullable(),
  startingDose: z.number().nullable(),
  startingDoseUnit: z.string().nullable(),
  startingDoseRationale: z.string().nullable(),
  maxDose: z.number().nullable(),
  maxDoseUnit: z.string().nullable(),
  escalationIncrement: z.string().nullable(),
  deEscalationRules: z.string().nullable(),
  intraPatientEscalation: z.boolean().nullable(),
  acceleratedTitrationPhase: z.boolean().nullable(),
}).passthrough();

const projectOptimusSchema = z.object({
  compliant: z.boolean().nullable(),
  multipleDoseLevelsTested: z.boolean().nullable(),
  obdDeterminationPlan: z.string().nullable(),
  randomizedDoseComparison: z.boolean().nullable(),
  expansionCohortStrategy: z.string().nullable(),
  doseOptimizationEndpoints: z.array(z.string()).default([]),
  backfillStrategy: z.string().nullable(),
}).passthrough();

const diversityActionPlanSchema = z.object({
  included: z.boolean().nullable(),
  enrollmentTargets: z.array(z.object({
    population: z.string().nullable(),
    targetPercent: z.number().nullable(),
    rationale: z.string().nullable(),
  }).passthrough()).default([]),
  siteDiversityStrategy: z.string().nullable(),
  communityEngagement: z.string().nullable(),
  decentralizedElements: z.array(z.string()).default([]),
  languageAccommodations: z.array(z.string()).default([]),
  transportationSupport: z.boolean().nullable(),
  fdoraCompliant: z.boolean().nullable(),
}).passthrough();

const correlativeStudiesSchema = z.object({
  pharmacodynamicBiomarkers: z.array(z.string()).default([]),
  predictiveBiomarkers: z.array(z.string()).default([]),
  tumorBiopsies: z.object({
    required: z.boolean().nullable(),
    timing: z.string().nullable(),
    mandatory: z.boolean().nullable(),
  }).passthrough().nullable().default(null),
  ctcEnumeration: z.boolean().nullable(),
  cfDnaAnalysis: z.boolean().nullable(),
  immuneProfiling: z.boolean().nullable(),
}).passthrough();

export const clinicalProtocolSchema = z.object({
  metadata: z.object({
    studyTitle: z.string().nullable(),
    protocolNumber: z.string().nullable(),
    indNumber: z.string().nullable(),
    nctNumber: z.string().nullable(),
    phase: z.enum(["1", "1a", "1b", "1_2", "2", "2a", "2b", "3", "4"]).nullable(),
    studyDesign: z.string().nullable(),
    designType: z.enum([
      "open_label",
      "single_blind",
      "double_blind",
      "randomized",
      "non_randomized",
      "crossover",
      "parallel",
      "adaptive",
      "basket",
      "umbrella",
      "platform",
    ]).nullable(),
    sponsor: z.string().nullable(),
    principalInvestigator: z.string().nullable(),
    medicalMonitor: z.string().nullable(),
    protocolVersion: z.string().nullable(),
    protocolDate: z.string().nullable(),
    amendmentNumber: z.string().nullable(),
    amendmentDate: z.string().nullable(),
  }).passthrough(),
  objectives: z.object({
    primary: z.array(z.string()).default([]),
    secondary: z.array(z.string()).default([]),
    exploratory: z.array(z.string()).default([]),
  }).passthrough(),
  endpoints: z.array(endpointSchema).default([]),
  studyPopulation: z.object({
    targetPopulation: z.string().nullable(),
    indication: z.string().nullable(),
    priorTherapyRequirements: z.string().nullable(),
    eligibilityCriteria: z.array(eligibilityCriterionSchema).default([]),
    inclusionCriteria: z.array(z.string()).default([]),
    exclusionCriteria: z.array(z.string()).default([]),
    ageRange: z.string().nullable(),
    ecogPerformanceStatus: z.string().nullable(),
    requiredOrganFunction: z.array(z.string()).default([]),
  }).passthrough(),
  dosing: z.object({
    investigationalProduct: z.string().nullable(),
    dosageForm: z.string().nullable(),
    route: z.string().nullable(),
    doseLevels: z.array(doseLevelSchema).default([]),
    dosingSchedule: z.string().nullable(),
    cycleLength: z.string().nullable(),
    treatmentDuration: z.string().nullable(),
    doseModificationRules: z.array(z.string()).default([]),
    premedication: z.array(z.string()).default([]),
    infusionDuration: z.string().nullable(),
    doseEscalation: doseEscalationSchema.nullable().default(null),
  }).passthrough(),
  safetyMonitoring: safetyMonitoringSchema,
  projectOptimus: projectOptimusSchema.nullable().default(null),
  diversityActionPlan: diversityActionPlanSchema.nullable().default(null),
  sampleSize: z.object({
    totalEnrollment: z.number().nullable(),
    doseEscalationPhase: z.number().nullable(),
    expansionPhase: z.number().nullable(),
    sampleSizeJustification: z.string().nullable(),
    estimatedEnrollmentRate: z.string().nullable(),
    numberOfSites: z.number().nullable(),
    countries: z.array(z.string()).default([]),
  }).passthrough(),
  statisticalPlan: z.object({
    analysisSets: z.array(z.string()).default([]),
    primaryAnalysisMethod: z.string().nullable(),
    interimAnalyses: z.string().nullable(),
    missingDataHandling: z.string().nullable(),
  }).passthrough().nullable().default(null),
  correlativeStudies: correlativeStudiesSchema.nullable().default(null),
  schedule: z.object({
    screeningWindow: z.string().nullable(),
    assessmentSchedule: z.array(z.object({
      visit: z.string().nullable(),
      timepoint: z.string().nullable(),
      procedures: z.array(z.string()).default([]),
    }).passthrough()).default([]),
    responseAssessmentFrequency: z.string().nullable(),
    responseAssessmentCriteria: z.string().nullable(),
    survivalFollowUp: z.string().nullable(),
  }).passthrough().nullable().default(null),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type ClinicalProtocolData = z.infer<typeof clinicalProtocolSchema>;
