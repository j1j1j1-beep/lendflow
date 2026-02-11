import { z } from "zod";

const testAtTimepointSchema = z.object({
  testName: z.string().nullable(),
  method: z.string().nullable(),
  specification: z.string().nullable(),
  result: z.string().nullable(),
  numericResult: z.number().nullable(),
  unit: z.string().nullable(),
  pass: z.boolean().nullable(),
}).passthrough();

const timepointSchema = z.object({
  timepointMonths: z.number().nullable(),
  timepointLabel: z.string().nullable(),
  tests: z.array(testAtTimepointSchema).default([]),
  purity: z.number().nullable(),
  potency: z.number().nullable(),
  dar: z.number().nullable(),
  aggregation: z.number().nullable(),
  freePayload: z.number().nullable(),
  fragmentation: z.number().nullable(),
  appearance: z.string().nullable(),
  ph: z.number().nullable(),
  concentration: z.number().nullable(),
}).passthrough();

const trendAnalysisSchema = z.object({
  parameter: z.string().nullable(),
  degradationRatePerMonth: z.number().nullable(),
  degradationRateUnit: z.string().nullable(),
  rSquared: z.number().nullable(),
  model: z.string().nullable(),
  projectedValueAt24Months: z.number().nullable(),
  projectedValueAt36Months: z.number().nullable(),
  exceedsSpecAtMonth: z.number().nullable(),
}).passthrough();

const storageConditionDataSchema = z.object({
  condition: z.string().nullable(),
  temperature: z.string().nullable(),
  humidity: z.string().nullable(),
  lightExposure: z.string().nullable(),
  containerType: z.string().nullable(),
  orientation: z.string().nullable(),
  studyType: z.enum([
    "long_term",
    "accelerated",
    "stress",
    "photostability",
    "freeze_thaw",
    "in_use",
  ]).nullable(),
  timepoints: z.array(timepointSchema).default([]),
  trendAnalysis: z.array(trendAnalysisSchema).default([]),
}).passthrough();

export const stabilityDataSchema = z.object({
  metadata: z.object({
    productName: z.string().nullable(),
    productCode: z.string().nullable(),
    batchNumber: z.string().nullable(),
    lotNumber: z.string().nullable(),
    dosageForm: z.string().nullable(),
    strength: z.string().nullable(),
    manufacturer: z.string().nullable(),
    manufacturingSite: z.string().nullable(),
    studyNumber: z.string().nullable(),
    studyInitiationDate: z.string().nullable(),
    reportDate: z.string().nullable(),
    protocol: z.string().nullable(),
    ichGuideline: z.string().nullable(),
  }).passthrough(),
  storageConditions: z.array(storageConditionDataSchema).default([]),
  shelfLife: z.object({
    proposedShelfLife: z.number().nullable(),
    proposedShelfLifeUnit: z.string().nullable(),
    supportedByData: z.boolean().nullable(),
    storageStatement: z.string().nullable(),
    reTestDate: z.string().nullable(),
    justification: z.string().nullable(),
  }).passthrough().nullable().default(null),
  degradationProducts: z.array(z.object({
    name: z.string().nullable(),
    structure: z.string().nullable(),
    origin: z.string().nullable(),
    qualifiedLevel: z.number().nullable(),
    qualifiedLevelUnit: z.string().nullable(),
    observedMaxLevel: z.number().nullable(),
    identificationMethod: z.string().nullable(),
  }).passthrough()).default([]),
  containerClosure: z.object({
    primaryContainer: z.string().nullable(),
    closureSystem: z.string().nullable(),
    extractablesLeachables: z.string().nullable(),
    compatibilityTested: z.boolean().nullable(),
  }).passthrough().nullable().default(null),
  summary: z.object({
    overallConclusion: z.string().nullable(),
    significantTrends: z.array(z.string()).default([]),
    outOfSpecResults: z.array(z.object({
      condition: z.string().nullable(),
      timepoint: z.string().nullable(),
      parameter: z.string().nullable(),
      result: z.string().nullable(),
      specification: z.string().nullable(),
    }).passthrough()).default([]),
    recommendations: z.array(z.string()).default([]),
  }).passthrough(),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type StabilityData = z.infer<typeof stabilityDataSchema>;
