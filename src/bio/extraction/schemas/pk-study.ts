import { z } from "zod";

// PK parameters for a single analyte at a single dose level
const pkParameterSetSchema = z.object({
  cmax: z.number().nullable(),
  cmaxUnit: z.string().nullable(),
  tmax: z.number().nullable(),
  tmaxUnit: z.string().nullable(),
  auc0Inf: z.number().nullable(),
  auc0InfUnit: z.string().nullable(),
  auc0T: z.number().nullable(),
  auc0TUnit: z.string().nullable(),
  halfLife: z.number().nullable(),
  halfLifeUnit: z.string().nullable(),
  clearance: z.number().nullable(),
  clearanceUnit: z.string().nullable(),
  volumeOfDistribution: z.number().nullable(),
  volumeOfDistributionUnit: z.string().nullable(),
  mrt: z.number().nullable(),
  mrtUnit: z.string().nullable(),
  bioavailability: z.number().nullable(),
  cmaxCv: z.number().nullable(),
  aucCv: z.number().nullable(),
}).passthrough();

// Per-dose-level PK data for a single analyte
const doseLevelPkSchema = z.object({
  doseLevel: z.number().nullable(),
  doseUnit: z.string().nullable(),
  route: z.string().nullable(),
  numberOfSubjects: z.number().nullable(),
  sex: z.string().nullable(),
  day: z.number().nullable(),
  parameters: pkParameterSetSchema,
}).passthrough();

// FDA-required: three analytes for ADC PK
const analyteSchema = z.object({
  analyteName: z.string().nullable(),
  analyteType: z.enum([
    "conjugated_adc",
    "total_antibody",
    "free_payload",
    "unconjugated_antibody",
    "other",
  ]).nullable(),
  bioanalyticalMethod: z.string().nullable(),
  assaySensitivity: z.number().nullable(),
  assaySensitivityUnit: z.string().nullable(),
  lloq: z.number().nullable(),
  lloqUnit: z.string().nullable(),
  uloq: z.number().nullable(),
  uloqUnit: z.string().nullable(),
  matrixType: z.string().nullable(),
  validationStatus: z.string().nullable(),
  doseLevels: z.array(doseLevelPkSchema).default([]),
}).passthrough();

const doseProportionalitySchema = z.object({
  analyte: z.string().nullable(),
  parameter: z.string().nullable(),
  doseRange: z.string().nullable(),
  proportional: z.boolean().nullable(),
  slope: z.number().nullable(),
  rSquared: z.number().nullable(),
  method: z.string().nullable(),
  conclusion: z.string().nullable(),
}).passthrough();

const immunogenicitySchema = z.object({
  adaAssayPerformed: z.boolean().nullable(),
  adaMethod: z.string().nullable(),
  adaPositiveIncidence: z.string().nullable(),
  neutralizingAntibodyTested: z.boolean().nullable(),
  neutralizingAntibodyIncidence: z.string().nullable(),
  impactOnPk: z.string().nullable(),
  impactOnSafety: z.string().nullable(),
}).passthrough();

export const pkStudySchema = z.object({
  metadata: z.object({
    studyTitle: z.string().nullable(),
    studyNumber: z.string().nullable(),
    studyType: z.enum([
      "single_dose",
      "repeat_dose",
      "dose_escalation",
      "mass_balance",
      "drug_interaction",
      "population_pk",
      "other",
    ]).nullable(),
    glpCompliant: z.boolean().nullable(),
    testArticle: z.string().nullable(),
    sponsor: z.string().nullable(),
    testFacility: z.string().nullable(),
    studyDirector: z.string().nullable(),
    studyDate: z.string().nullable(),
    reportDate: z.string().nullable(),
  }).passthrough(),
  studyDesign: z.object({
    species: z.string().nullable(),
    strain: z.string().nullable(),
    numberOfAnimals: z.number().nullable(),
    sex: z.string().nullable(),
    route: z.string().nullable(),
    dosingRegimen: z.string().nullable(),
    doseLevels: z.array(z.object({
      level: z.number().nullable(),
      unit: z.string().nullable(),
      route: z.string().nullable(),
      groupSize: z.number().nullable(),
    }).passthrough()).default([]),
    samplingTimepoints: z.array(z.string()).default([]),
    matrixCollected: z.array(z.string()).default([]),
  }).passthrough(),
  analytes: z.array(analyteSchema).default([]),
  doseProportionality: z.array(doseProportionalitySchema).default([]),
  catabolism: z.object({
    darShiftObserved: z.boolean().nullable(),
    darShiftDetails: z.string().nullable(),
    deconjugationRate: z.string().nullable(),
    payloadMetabolites: z.array(z.string()).default([]),
    metabolismRoute: z.string().nullable(),
  }).passthrough().nullable().default(null),
  distribution: z.object({
    tissueDistributionStudied: z.boolean().nullable(),
    targetTissueUptake: z.string().nullable(),
    tumorToPlasmaRatio: z.number().nullable(),
    offTargetDistribution: z.string().nullable(),
    bloodBrainBarrier: z.string().nullable(),
  }).passthrough().nullable().default(null),
  immunogenicity: immunogenicitySchema.nullable().default(null),
  bioanalyticalSummary: z.object({
    conjugatedAdcMethodSensitivity: z.string().nullable(),
    totalAntibodyMethodSensitivity: z.string().nullable(),
    freePayloadMethodSensitivity: z.string().nullable(),
    methodValidationComplete: z.boolean().nullable(),
    crossReactivity: z.string().nullable(),
    interferenceByDar: z.string().nullable(),
  }).passthrough().nullable().default(null),
  conclusions: z.object({
    summary: z.string().nullable(),
    keyFindings: z.array(z.string()).default([]),
    clinicalImplications: z.array(z.string()).default([]),
    recommendedClinicalDose: z.string().nullable(),
  }).passthrough().nullable().default(null),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type PkStudyData = z.infer<typeof pkStudySchema>;
