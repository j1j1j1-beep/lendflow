import { z } from "zod";

const doseGroupSchema = z.object({
  group: z.string().nullable(),
  doseLevel: z.number().nullable(),
  doseUnit: z.string().nullable(),
  route: z.string().nullable(),
  numberOfAnimals: z.number().nullable(),
  sex: z.enum(["male", "female", "both"]).nullable(),
  dosingFrequency: z.string().nullable(),
  dosingDuration: z.string().nullable(),
}).passthrough();

const organFindingSchema = z.object({
  organ: z.string().nullable(),
  finding: z.string().nullable(),
  severity: z.enum(["minimal", "mild", "moderate", "marked", "severe"]).nullable(),
  incidence: z.string().nullable(),
  doseRelated: z.boolean().nullable(),
  reversible: z.boolean().nullable(),
  adverseOrNonAdverse: z.enum(["adverse", "non_adverse", "equivocal"]).nullable(),
}).passthrough();

const clinicalObservationSchema = z.object({
  observation: z.string().nullable(),
  doseGroup: z.string().nullable(),
  incidence: z.string().nullable(),
  onsetDay: z.number().nullable(),
  duration: z.string().nullable(),
  doseRelated: z.boolean().nullable(),
}).passthrough();

const clinicalPathologySchema = z.object({
  parameter: z.string().nullable(),
  unit: z.string().nullable(),
  controlMean: z.number().nullable(),
  lowDoseMean: z.number().nullable(),
  midDoseMean: z.number().nullable(),
  highDoseMean: z.number().nullable(),
  statisticallySignificant: z.boolean().nullable(),
  toxicologicallySignificant: z.boolean().nullable(),
}).passthrough();

const tkParameterSchema = z.object({
  doseLevel: z.number().nullable(),
  doseUnit: z.string().nullable(),
  cmax: z.number().nullable(),
  cmaxUnit: z.string().nullable(),
  auc: z.number().nullable(),
  aucUnit: z.string().nullable(),
  tmax: z.number().nullable(),
  tmaxUnit: z.string().nullable(),
  halfLife: z.number().nullable(),
  halfLifeUnit: z.string().nullable(),
  day: z.number().nullable(),
  sex: z.string().nullable(),
  accumulation: z.number().nullable(),
}).passthrough();

const recoveryFindingSchema = z.object({
  organ: z.string().nullable(),
  findingDuringDosing: z.string().nullable(),
  findingAtRecovery: z.string().nullable(),
  recoveryStatus: z.enum(["full", "partial", "no_recovery", "not_assessed"]).nullable(),
  recoveryDuration: z.string().nullable(),
}).passthrough();

export const toxicologyReportSchema = z.object({
  metadata: z.object({
    studyTitle: z.string().nullable(),
    studyNumber: z.string().nullable(),
    studyType: z.enum([
      "single_dose",
      "repeat_dose",
      "tissue_cross_reactivity",
      "reproductive",
      "genotoxicity",
      "carcinogenicity",
      "immunotoxicity",
      "juvenile",
      "other",
    ]).nullable(),
    glpCompliant: z.boolean().nullable(),
    testArticle: z.string().nullable(),
    sponsor: z.string().nullable(),
    testFacility: z.string().nullable(),
    studyDirector: z.string().nullable(),
    studyInitiationDate: z.string().nullable(),
    studyCompletionDate: z.string().nullable(),
    reportDate: z.string().nullable(),
    amendments: z.array(z.string()).default([]),
  }).passthrough(),
  studyDesign: z.object({
    species: z.string().nullable(),
    strain: z.string().nullable(),
    speciesJustification: z.string().nullable(),
    targetExpression: z.string().nullable(),
    route: z.string().nullable(),
    dosingSchedule: z.string().nullable(),
    dosingDuration: z.string().nullable(),
    recoveryPeriod: z.string().nullable(),
    numberOfAnimalsPerGroup: z.string().nullable(),
    doseGroups: z.array(doseGroupSchema).default([]),
    vehicleControl: z.string().nullable(),
  }).passthrough(),
  doseLevels: z.object({
    noael: z.number().nullable(),
    noaelUnit: z.string().nullable(),
    noaelBasis: z.string().nullable(),
    loael: z.number().nullable(),
    loaelUnit: z.string().nullable(),
    loaelBasis: z.string().nullable(),
    mtd: z.number().nullable(),
    mtdUnit: z.string().nullable(),
    std: z.number().nullable(),
    stdUnit: z.string().nullable(),
    highestNonSeverelyToxicDose: z.number().nullable(),
    highestNonSeverelyToxicDoseUnit: z.string().nullable(),
  }).passthrough(),
  findings: z.object({
    mortality: z.object({
      occurred: z.boolean().nullable(),
      details: z.string().nullable(),
      doseGroup: z.string().nullable(),
      cause: z.string().nullable(),
    }).passthrough().nullable().default(null),
    clinicalObservations: z.array(clinicalObservationSchema).default([]),
    bodyWeight: z.object({
      effectObserved: z.boolean().nullable(),
      details: z.string().nullable(),
      maxDecreasePercent: z.number().nullable(),
      doseGroup: z.string().nullable(),
    }).passthrough().nullable().default(null),
    foodConsumption: z.object({
      effectObserved: z.boolean().nullable(),
      details: z.string().nullable(),
    }).passthrough().nullable().default(null),
    clinicalPathology: z.array(clinicalPathologySchema).default([]),
    organWeights: z.array(z.object({
      organ: z.string().nullable(),
      effectObserved: z.boolean().nullable(),
      details: z.string().nullable(),
      doseGroup: z.string().nullable(),
    }).passthrough()).default([]),
    grossPathology: z.array(organFindingSchema).default([]),
    histopathology: z.array(organFindingSchema).default([]),
    targetOrgans: z.array(z.string()).default([]),
  }).passthrough(),
  doseLimitingToxicities: z.array(z.object({
    finding: z.string().nullable(),
    organ: z.string().nullable(),
    doseLevel: z.number().nullable(),
    doseUnit: z.string().nullable(),
    severity: z.string().nullable(),
    reversibility: z.string().nullable(),
  }).passthrough()).default([]),
  toxicokinetics: z.object({
    evaluated: z.boolean().nullable(),
    analytes: z.array(z.string()).default([]),
    parameters: z.array(tkParameterSchema).default([]),
    exposureMargins: z.string().nullable(),
    sexDifferences: z.string().nullable(),
    accumulation: z.string().nullable(),
    antidrug_antibodies: z.object({
      detected: z.boolean().nullable(),
      incidence: z.string().nullable(),
      impact: z.string().nullable(),
    }).passthrough().nullable().default(null),
  }).passthrough(),
  recoveryFindings: z.array(recoveryFindingSchema).default([]),
  humanEquivalentDose: z.object({
    hed: z.number().nullable(),
    hedUnit: z.string().nullable(),
    scalingMethod: z.string().nullable(),
    scalingFactor: z.number().nullable(),
    basisDose: z.number().nullable(),
    basisDoseUnit: z.string().nullable(),
    safetyFactor: z.number().nullable(),
    proposedStartingDose: z.number().nullable(),
    proposedStartingDoseUnit: z.string().nullable(),
    mrghdCalculation: z.string().nullable(),
  }).passthrough().nullable().default(null),
  tissueCrossReactivity: z.object({
    performed: z.boolean().nullable(),
    humanTissuesPositive: z.array(z.string()).default([]),
    humanTissuesNegative: z.array(z.string()).default([]),
    clinicalImplications: z.string().nullable(),
  }).passthrough().nullable().default(null),
  conclusions: z.object({
    summary: z.string().nullable(),
    principalFindings: z.array(z.string()).default([]),
    clinicalMonitoringRecommendations: z.array(z.string()).default([]),
  }).passthrough().nullable().default(null),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type ToxicologyReportData = z.infer<typeof toxicologyReportSchema>;
