import { z } from "zod";

const specResultSchema = z.object({
  parameter: z.string().nullable(),
  specification: z.string().nullable(),
  result: z.string().nullable(),
  unit: z.string().nullable(),
  pass: z.boolean().nullable(),
}).passthrough();

const darDistributionSchema = z.object({
  dar0: z.number().nullable(),
  dar2: z.number().nullable(),
  dar4: z.number().nullable(),
  dar6: z.number().nullable(),
  dar8: z.number().nullable(),
  other: z.number().nullable(),
}).passthrough();

const puritySchema = z.object({
  secHplcMonomer: z.number().nullable(),
  secHplcAggregate: z.number().nullable(),
  secHplcFragment: z.number().nullable(),
  hicMainPeak: z.number().nullable(),
  hicMethod: z.string().nullable(),
  ceDsNonReducedIntact: z.number().nullable(),
  ceDsReducedHeavyChain: z.number().nullable(),
  ceDsReducedLightChain: z.number().nullable(),
}).passthrough();

const potencySchema = z.object({
  cytotoxicityIC50: z.number().nullable(),
  cytotoxicityIC50Unit: z.string().nullable(),
  cytotoxicityCellLine: z.string().nullable(),
  adccActivity: z.number().nullable(),
  adccActivityUnit: z.string().nullable(),
  adccEffectorCellType: z.string().nullable(),
  relativeActivity: z.number().nullable(),
  referenceStandard: z.string().nullable(),
}).passthrough();

const safetyTestsSchema = z.object({
  endotoxin: z.number().nullable(),
  endotoxinUnit: z.string().nullable(),
  endotoxinSpec: z.string().nullable(),
  endotoxinPass: z.boolean().nullable(),
  sterility: z.string().nullable(),
  sterilityPass: z.boolean().nullable(),
  bioburden: z.number().nullable(),
  bioburdenPass: z.boolean().nullable(),
  mycoplasma: z.string().nullable(),
  mycoplasmaPass: z.boolean().nullable(),
  bacterialEndotoxinMethod: z.string().nullable(),
}).passthrough();

const processParameterSchema = z.object({
  step: z.string().nullable(),
  parameter: z.string().nullable(),
  setpoint: z.string().nullable(),
  actual: z.string().nullable(),
  unit: z.string().nullable(),
  withinSpec: z.boolean().nullable(),
}).passthrough();

export const batchRecordSchema = z.object({
  metadata: z.object({
    batchNumber: z.string().nullable(),
    lotNumber: z.string().nullable(),
    productName: z.string().nullable(),
    productCode: z.string().nullable(),
    manufacturingDate: z.string().nullable(),
    releaseDate: z.string().nullable(),
    expirationDate: z.string().nullable(),
    manufacturingSite: z.string().nullable(),
    manufacturer: z.string().nullable(),
    batchSize: z.string().nullable(),
    batchSizeUnit: z.string().nullable(),
    gmpCompliance: z.string().nullable(),
  }).passthrough(),
  conjugation: z.object({
    dar: z.number().nullable(),
    darMethod: z.string().nullable(),
    darSpec: z.string().nullable(),
    darPass: z.boolean().nullable(),
    darDistribution: darDistributionSchema.nullable().default(null),
    freePayloadPercent: z.number().nullable(),
    freePayloadSpec: z.string().nullable(),
    freePayloadPass: z.boolean().nullable(),
    freePayloadMethod: z.string().nullable(),
    conjugationEfficiency: z.number().nullable(),
    linkerType: z.string().nullable(),
    payloadName: z.string().nullable(),
  }).passthrough(),
  purity: puritySchema,
  yieldAndConcentration: z.object({
    yield: z.number().nullable(),
    yieldUnit: z.string().nullable(),
    yieldPercent: z.number().nullable(),
    concentration: z.number().nullable(),
    concentrationUnit: z.string().nullable(),
    concentrationMethod: z.string().nullable(),
    totalProtein: z.number().nullable(),
    totalProteinUnit: z.string().nullable(),
    volumeFilled: z.number().nullable(),
    volumeFilledUnit: z.string().nullable(),
  }).passthrough(),
  potency: potencySchema,
  safetyTests: safetyTestsSchema,
  physicalProperties: z.object({
    ph: z.number().nullable(),
    phSpec: z.string().nullable(),
    phPass: z.boolean().nullable(),
    osmolality: z.number().nullable(),
    osmolalityUnit: z.string().nullable(),
    osmolalitySpec: z.string().nullable(),
    osmolalityPass: z.boolean().nullable(),
    appearance: z.string().nullable(),
    appearanceSpec: z.string().nullable(),
    appearancePass: z.boolean().nullable(),
    color: z.string().nullable(),
    colorSpec: z.string().nullable(),
    colorPass: z.boolean().nullable(),
    particulates: z.string().nullable(),
    particulatesPass: z.boolean().nullable(),
  }).passthrough(),
  processParameters: z.array(processParameterSchema).default([]),
  inProcessControls: z.array(specResultSchema).default([]),
  releaseTests: z.array(specResultSchema).default([]),
  overallDisposition: z.object({
    status: z.enum(["released", "rejected", "quarantine", "pending"]).nullable(),
    dispositionDate: z.string().nullable(),
    approvedBy: z.string().nullable(),
    deviations: z.array(z.object({
      deviationNumber: z.string().nullable(),
      description: z.string().nullable(),
      impact: z.string().nullable(),
      resolution: z.string().nullable(),
    }).passthrough()).default([]),
    oosResults: z.array(z.object({
      parameter: z.string().nullable(),
      result: z.string().nullable(),
      investigation: z.string().nullable(),
      rootCause: z.string().nullable(),
    }).passthrough()).default([]),
  }).passthrough(),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type BatchRecordData = z.infer<typeof batchRecordSchema>;
