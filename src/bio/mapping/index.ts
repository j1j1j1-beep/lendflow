// mapping/index.ts
// Data mapper layer between extraction output (deeply nested Zod schemas)
// and the flat interfaces expected by rules engine + document templates.
// This is the critical bridge — extraction produces rich nested data from OCR,
// and rules/templates need specific flat shapes.

import type { BatchRecordData } from "../extraction/schemas/batch-record";
import type { CertificateOfAnalysisData } from "../extraction/schemas/certificate-of-analysis";
import type { StabilityData } from "../extraction/schemas/stability-data";
import type { ToxicologyReportData } from "../extraction/schemas/toxicology-report";
import type { PkStudyData } from "../extraction/schemas/pk-study";
import type { ClinicalProtocolData } from "../extraction/schemas/clinical-protocol";

import type {
  DARSpec,
  PKData,
  ProtocolDesign,
  BatchRecord,
  StabilityTimepoint,
} from "../rules/fda-rules";

import type {
  ADCCharacterizationData,
  AfucosylationData,
  LinkerStabilityData,
  PayloadProfile,
} from "../rules/adc-rules";

import type { ExtractedBioData, BioProgram } from "../rules/index";
import type { BioDocumentInput } from "../templates/types";

// Parse a darSpec string like "4.0 ± 0.5" or "4.0 +/- 0.5" into { target, tolerance }
export function parseDarSpec(darSpecStr: string | null | undefined): DARSpec | null {
  if (!darSpecStr) return null;
  const match = darSpecStr.match(/(\d+(?:\.\d+)?)\s*(?:±|\+\/?-)\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return {
    target: parseFloat(match[1]),
    tolerance: parseFloat(match[2]),
  };
}

// Map BatchRecordData[] → BatchRecord[] (rules engine shape)
export function mapBatchRecordsForRules(batches: BatchRecordData[]): BatchRecord[] {
  return batches
    .filter((b) => b.conjugation?.dar != null && b.purity?.secHplcMonomer != null)
    .map((b) => ({
      batchId: b.metadata?.batchNumber ?? b.metadata?.lotNumber ?? "unknown",
      dar: b.conjugation.dar!,
      purity: b.purity.secHplcMonomer!,
      potency: b.potency?.relativeActivity ?? b.potency?.cytotoxicityIC50 ?? 100,
    }));
}

// Map BatchRecordData[] → Record<string, unknown>[] (template shape)
export function mapBatchRecordsForTemplate(batches: BatchRecordData[]): Record<string, unknown>[] {
  return batches.map((b) => ({
    batchNumber: b.metadata?.batchNumber ?? b.metadata?.lotNumber,
    manufacturingDate: b.metadata?.manufacturingDate,
    manufacturer: b.metadata?.manufacturer,
    manufacturingSite: b.metadata?.manufacturingSite,
    batchSize: b.metadata?.batchSize,
    dar: b.conjugation?.dar,
    darMethod: b.conjugation?.darMethod,
    darPass: b.conjugation?.darPass,
    freePayloadPercent: b.conjugation?.freePayloadPercent,
    freePayloadPass: b.conjugation?.freePayloadPass,
    secHplcMonomer: b.purity?.secHplcMonomer,
    secHplcAggregate: b.purity?.secHplcAggregate,
    hicMainPeak: b.purity?.hicMainPeak,
    cytotoxicityIC50: b.potency?.cytotoxicityIC50,
    adccActivity: b.potency?.adccActivity,
    relativeActivity: b.potency?.relativeActivity,
    endotoxin: b.safetyTests?.endotoxin,
    endotoxinPass: b.safetyTests?.endotoxinPass,
    sterility: b.safetyTests?.sterility,
    sterilityPass: b.safetyTests?.sterilityPass,
    ph: b.physicalProperties?.ph,
    phPass: b.physicalProperties?.phPass,
    appearance: b.physicalProperties?.appearance,
    appearancePass: b.physicalProperties?.appearancePass,
    concentration: b.yieldAndConcentration?.concentration,
    yieldPercent: b.yieldAndConcentration?.yieldPercent,
    disposition: b.overallDisposition?.status,
    deviationCount: b.overallDisposition?.deviations?.length ?? 0,
    oosCount: b.overallDisposition?.oosResults?.length ?? 0,
  }));
}

// Map StabilityData → StabilityTimepoint[] (rules engine shape)
export function mapStabilityForRules(data: StabilityData): StabilityTimepoint[] {
  const timepoints: StabilityTimepoint[] = [];

  for (const condition of data.storageConditions ?? []) {
    if (condition.studyType !== "long_term" && condition.studyType !== "accelerated") continue;
    for (const tp of condition.timepoints ?? []) {
      if (tp.timepointMonths == null) continue;
      timepoints.push({
        timeMonths: tp.timepointMonths,
        purity: tp.purity ?? 0,
        potency: tp.potency ?? 0,
        dar: tp.dar ?? undefined,
        aggregation: tp.aggregation ?? undefined,
      });
    }
  }

  return timepoints.sort((a, b) => a.timeMonths - b.timeMonths);
}

// Map StabilityData → Record<string, unknown> (template shape)
export function mapStabilityForTemplate(data: StabilityData): Record<string, unknown> {
  return {
    productName: data.metadata?.productName,
    batchNumber: data.metadata?.batchNumber,
    manufacturer: data.metadata?.manufacturer,
    ichGuideline: data.metadata?.ichGuideline,
    proposedShelfLife: data.shelfLife?.proposedShelfLife,
    proposedShelfLifeUnit: data.shelfLife?.proposedShelfLifeUnit,
    storageStatement: data.shelfLife?.storageStatement,
    supportedByData: data.shelfLife?.supportedByData,
    conditionCount: data.storageConditions?.length ?? 0,
    conditions: (data.storageConditions ?? []).map((c) => ({
      condition: c.condition,
      temperature: c.temperature,
      studyType: c.studyType,
      timepointCount: c.timepoints?.length ?? 0,
      latestTimepoint: c.timepoints?.length
        ? c.timepoints[c.timepoints.length - 1]?.timepointMonths
        : null,
    })),
    degradationProducts: (data.degradationProducts ?? []).map((d) => ({
      name: d.name,
      maxLevel: d.observedMaxLevel,
      qualifiedLevel: d.qualifiedLevel,
    })),
    overallConclusion: data.summary?.overallConclusion,
    significantTrends: data.summary?.significantTrends,
    outOfSpecCount: data.summary?.outOfSpecResults?.length ?? 0,
  };
}

// Map ToxicologyReportData → partial ExtractedBioData fields for rules
export function mapToxForRules(data: ToxicologyReportData): {
  animalDose?: { dose: number; species: string; humanWeight?: number };
  noael?: number;
  proposedStartingDose?: number;
  toxSpecies?: string;
} {
  const noael = data.doseLevels?.noael ?? null;
  const species = data.studyDesign?.species ?? null;

  const result: ReturnType<typeof mapToxForRules> = {};

  if (noael != null && species) {
    result.animalDose = { dose: noael, species };
    result.noael = noael;
  }

  if (species) {
    result.toxSpecies = species;
  }

  if (data.humanEquivalentDose?.proposedStartingDose != null) {
    result.proposedStartingDose = data.humanEquivalentDose.proposedStartingDose;
  }

  return result;
}

// Map ToxicologyReportData → Record<string, unknown> (template shape)
export function mapToxForTemplate(data: ToxicologyReportData): Record<string, unknown> {
  return {
    studyTitle: data.metadata?.studyTitle,
    studyNumber: data.metadata?.studyNumber,
    studyType: data.metadata?.studyType,
    glpCompliant: data.metadata?.glpCompliant,
    testArticle: data.metadata?.testArticle,
    species: data.studyDesign?.species,
    strain: data.studyDesign?.strain,
    route: data.studyDesign?.route,
    dosingDuration: data.studyDesign?.dosingDuration,
    recoveryPeriod: data.studyDesign?.recoveryPeriod,
    doseGroupCount: data.studyDesign?.doseGroups?.length ?? 0,
    noael: data.doseLevels?.noael,
    noaelUnit: data.doseLevels?.noaelUnit,
    noaelBasis: data.doseLevels?.noaelBasis,
    loael: data.doseLevels?.loael,
    loaelBasis: data.doseLevels?.loaelBasis,
    mtd: data.doseLevels?.mtd,
    hnstd: data.doseLevels?.highestNonSeverelyToxicDose,
    targetOrgans: data.findings?.targetOrgans,
    mortalityOccurred: data.findings?.mortality?.occurred,
    hed: data.humanEquivalentDose?.hed,
    hedUnit: data.humanEquivalentDose?.hedUnit,
    scalingMethod: data.humanEquivalentDose?.scalingMethod,
    safetyFactor: data.humanEquivalentDose?.safetyFactor,
    proposedStartingDose: data.humanEquivalentDose?.proposedStartingDose,
    tcrPerformed: data.tissueCrossReactivity?.performed,
    tcrPositiveTissues: data.tissueCrossReactivity?.humanTissuesPositive,
    tcrClinicalImplications: data.tissueCrossReactivity?.clinicalImplications,
    summary: data.conclusions?.summary,
    principalFindings: data.conclusions?.principalFindings,
    monitoringRecommendations: data.conclusions?.clinicalMonitoringRecommendations,
  };
}

// Map PkStudyData → PKData (rules engine shape)
export function mapPkForRules(data: PkStudyData): PKData {
  const analytes = data.analytes ?? [];
  const types = analytes.map((a) => a.analyteType).filter(Boolean);

  return {
    conjugatedADC: types.includes("conjugated_adc"),
    totalAntibody: types.includes("total_antibody"),
    freePayload: types.includes("free_payload"),
    analytesMeasured: analytes.map((a) => a.analyteName).filter(Boolean) as string[],
  };
}

// Map PkStudyData → Record<string, unknown> (template shape)
export function mapPkForTemplate(data: PkStudyData): Record<string, unknown> {
  return {
    studyTitle: data.metadata?.studyTitle,
    studyNumber: data.metadata?.studyNumber,
    studyType: data.metadata?.studyType,
    species: data.studyDesign?.species,
    route: data.studyDesign?.route,
    doseLevelCount: data.studyDesign?.doseLevels?.length ?? 0,
    analyteCount: data.analytes?.length ?? 0,
    analytes: (data.analytes ?? []).map((a) => ({
      name: a.analyteName,
      type: a.analyteType,
      method: a.bioanalyticalMethod,
      lloq: a.lloq,
      lloqUnit: a.lloqUnit,
      validated: a.validationStatus,
      doseLevelCount: a.doseLevels?.length ?? 0,
    })),
    hasConjugatedADC: (data.analytes ?? []).some((a) => a.analyteType === "conjugated_adc"),
    hasTotalAntibody: (data.analytes ?? []).some((a) => a.analyteType === "total_antibody"),
    hasFreePayload: (data.analytes ?? []).some((a) => a.analyteType === "free_payload"),
    doseProportionality: (data.doseProportionality ?? []).map((dp) => ({
      analyte: dp.analyte,
      proportional: dp.proportional,
      conclusion: dp.conclusion,
    })),
    darShiftObserved: data.catabolism?.darShiftObserved,
    deconjugationRate: data.catabolism?.deconjugationRate,
    adaDetected: data.immunogenicity?.adaPositiveIncidence,
    adaImpactOnPk: data.immunogenicity?.impactOnPk,
    summary: data.conclusions?.summary,
    keyFindings: data.conclusions?.keyFindings,
  };
}

// Map ClinicalProtocolData → ProtocolDesign (rules engine shape)
export function mapProtocolForRules(data: ClinicalProtocolData): ProtocolDesign {
  const optimus = data.projectOptimus;
  const diversity = data.diversityActionPlan;
  const safety = data.safetyMonitoring;
  const dosing = data.dosing;

  return {
    doseLevels: dosing?.doseLevels?.length ?? 0,
    escalationMethod: dosing?.doseEscalation?.method ?? undefined,
    hasBackfillCohorts: optimus?.backfillStrategy != null,
    hasExpansionCohorts: (optimus?.expansionCohortStrategy ?? null) != null,
    hasParallelComparison: optimus?.randomizedDoseComparison ?? false,
    diversityPlan: diversity
      ? {
          hasEnrollmentGoals: (diversity.enrollmentTargets?.length ?? 0) > 0,
          populations: (diversity.enrollmentTargets ?? [])
            .map((t) => t.population)
            .filter(Boolean) as string[],
          targetPercentages: Object.fromEntries(
            (diversity.enrollmentTargets ?? [])
              .filter((t) => t.population && t.targetPercent != null)
              .map((t) => [t.population!, t.targetPercent!])
          ),
        }
      : undefined,
    safetyMonitoring: {
      hasCRSGrading: safety?.crsGradingScale != null,
      hasCRSManagementPlan: safety?.crsManagementPlan ?? false,
      hasMASMonitoring: safety?.masMonitoring ?? false,
      gradingSystem: safety?.crsGradingScale ?? undefined,
    },
  };
}

// Map ClinicalProtocolData → Record<string, unknown> (template shape)
export function mapProtocolForTemplate(data: ClinicalProtocolData): Record<string, unknown> {
  return {
    studyTitle: data.metadata?.studyTitle,
    protocolNumber: data.metadata?.protocolNumber,
    indNumber: data.metadata?.indNumber,
    nctNumber: data.metadata?.nctNumber,
    phase: data.metadata?.phase,
    studyDesign: data.metadata?.studyDesign,
    sponsor: data.metadata?.sponsor,
    primaryObjectives: data.objectives?.primary,
    secondaryObjectives: data.objectives?.secondary,
    endpointCount: data.endpoints?.length ?? 0,
    indication: data.studyPopulation?.indication,
    targetPopulation: data.studyPopulation?.targetPopulation,
    inclusionCriteriaCount: data.studyPopulation?.inclusionCriteria?.length ?? 0,
    exclusionCriteriaCount: data.studyPopulation?.exclusionCriteria?.length ?? 0,
    doseLevelCount: data.dosing?.doseLevels?.length ?? 0,
    startingDose: data.dosing?.doseEscalation?.startingDose,
    startingDoseUnit: data.dosing?.doseEscalation?.startingDoseUnit,
    escalationMethod: data.dosing?.doseEscalation?.method,
    optimusCompliant: data.projectOptimus?.compliant,
    randomizedDoseComparison: data.projectOptimus?.randomizedDoseComparison,
    diversityPlanIncluded: data.diversityActionPlan?.included,
    diversityTargetCount: data.diversityActionPlan?.enrollmentTargets?.length ?? 0,
    fdoraCompliant: data.diversityActionPlan?.fdoraCompliant,
    totalEnrollment: data.sampleSize?.totalEnrollment,
    numberOfSites: data.sampleSize?.numberOfSites,
    crsGradingScale: data.safetyMonitoring?.crsGradingScale,
    crsManagementPlan: data.safetyMonitoring?.crsManagementPlan,
    masMonitoring: data.safetyMonitoring?.masMonitoring,
    dsmb: data.safetyMonitoring?.dsmb,
    dltCount: data.safetyMonitoring?.dltDefinitions?.length ?? 0,
  };
}

// Map BatchRecordData → ADCCharacterizationData (rules engine shape)
export function mapBatchToCharacterization(batch: BatchRecordData): ADCCharacterizationData {
  return {
    dar: batch.conjugation?.dar ?? undefined,
    darDistribution: batch.conjugation?.darDistribution != null,
    aggregation: batch.purity?.secHplcAggregate ?? undefined,
    purity: batch.purity?.secHplcMonomer ?? undefined,
    potencyAssay: batch.potency?.cytotoxicityIC50 != null,
    bindingAffinity: undefined,
    molecularWeight: undefined,
    conjugationSiteAnalysis: undefined,
    freePayloadPercentage: batch.conjugation?.freePayloadPercent ?? undefined,
    endotoxin: batch.safetyTests?.endotoxinPass ?? undefined,
    sterility: batch.safetyTests?.sterilityPass ?? undefined,
    appearance: batch.physicalProperties?.appearancePass ?? undefined,
    pH: batch.physicalProperties?.phPass ?? undefined,
    osmolality: batch.physicalProperties?.osmolalityPass ?? undefined,
  };
}

// Map BatchRecordData → AfucosylationData (if afucosylated)
export function mapBatchToAfucosylation(
  batch: BatchRecordData,
  isAfucosylated: boolean
): AfucosylationData | null {
  if (!isAfucosylated) return null;
  return {
    isAfucosylated: true,
    hasADCCAssay: batch.potency?.adccActivity != null,
    adccPotencyResult: batch.potency?.adccActivity ?? undefined,
    hasCDCAssay: undefined,
    fucosylationLevel: undefined,
  };
}

// Map BatchRecordData → LinkerStabilityData (rules engine shape)
// Linker stability info can be inferred from batch record conjugation data
export function mapBatchToLinkerStability(batch: BatchRecordData): LinkerStabilityData | null {
  if (!batch.conjugation?.linkerType) return null;
  return {
    hasPlasmaStability: undefined,
    plasmaSpecies: undefined,
    stabilityHours: undefined,
    percentIntactAtEnd: undefined,
    hasSerumStability: undefined,
    bufferStabilityPH: undefined,
  };
}

// Map BatchRecordData → PayloadProfile (rules engine shape)
export function mapBatchToPayloadProfile(batch: BatchRecordData): PayloadProfile | null {
  if (!batch.conjugation?.payloadName) return null;
  return {
    payloadName: batch.conjugation.payloadName,
    payloadClass: undefined,
    knownToxicities: undefined,
    hasGenotoxicityData: undefined,
    hasCardiacSafety: undefined,
    hasBoneMarrowToxicity: undefined,
    hasHepatotoxicity: undefined,
    hasNeurotoxicity: undefined,
    isDLT: undefined,
  };
}

// Map CertificateOfAnalysisData → ADCCharacterizationData (rules engine shape)
export function mapCoaToCharacterization(coa: CertificateOfAnalysisData): ADCCharacterizationData {
  return {
    dar: coa.conjugationTests?.dar ?? undefined,
    darDistribution: undefined,
    aggregation: coa.purityTests?.secHplcAggregate ?? undefined,
    purity: coa.purityTests?.secHplcMonomer ?? undefined,
    potencyAssay: coa.potencyTests?.cytotoxicityIC50 != null,
    bindingAffinity: coa.potencyTests?.bindingAffinity != null,
    molecularWeight: undefined,
    conjugationSiteAnalysis: undefined,
    freePayloadPercentage: coa.conjugationTests?.freePayloadPercent ?? undefined,
    endotoxin: coa.safetyTests?.endotoxinPass ?? undefined,
    sterility: coa.safetyTests?.sterilityPass ?? undefined,
    appearance: coa.physicalTests?.appearancePass ?? undefined,
    pH: coa.physicalTests?.phPass ?? undefined,
    osmolality: coa.physicalTests?.osmolalityPass ?? undefined,
  };
}

// Map CertificateOfAnalysisData → Record<string, unknown> (template shape)
export function mapCoaForTemplate(coa: CertificateOfAnalysisData): Record<string, unknown> {
  return {
    productName: coa.metadata?.productName,
    batchNumber: coa.metadata?.batchNumber,
    lotNumber: coa.metadata?.lotNumber,
    manufacturer: coa.metadata?.manufacturer,
    dateOfAnalysis: coa.metadata?.dateOfAnalysis,
    referenceStandard: coa.metadata?.referenceStandard,
    dar: coa.conjugationTests?.dar,
    darPass: coa.conjugationTests?.darPass,
    freePayloadPercent: coa.conjugationTests?.freePayloadPercent,
    freePayloadPass: coa.conjugationTests?.freePayloadPass,
    secHplcMonomer: coa.purityTests?.secHplcMonomer,
    secHplcAggregate: coa.purityTests?.secHplcAggregate,
    cytotoxicityIC50: coa.potencyTests?.cytotoxicityIC50,
    adccActivity: coa.potencyTests?.adccActivity,
    bindingAffinity: coa.potencyTests?.bindingAffinity,
    endotoxin: coa.safetyTests?.endotoxin,
    endotoxinPass: coa.safetyTests?.endotoxinPass,
    sterility: coa.safetyTests?.sterility,
    sterilityPass: coa.safetyTests?.sterilityPass,
    ph: coa.physicalTests?.ph,
    phPass: coa.physicalTests?.phPass,
    appearance: coa.physicalTests?.appearance,
    disposition: coa.overallResult?.disposition,
    approvedBy: coa.overallResult?.approvedBy,
    totalTestCount: coa.allTests?.length ?? 0,
    failedTestCount: coa.allTests?.filter((t) => t.pass === false).length ?? 0,
  };
}

// Aggregate: build full ExtractedBioData from all extraction outputs
export function buildExtractedBioData(sources: {
  batches?: BatchRecordData[];
  coa?: CertificateOfAnalysisData;
  stability?: StabilityData;
  toxicology?: ToxicologyReportData;
  pkStudy?: PkStudyData;
  protocol?: ClinicalProtocolData;
  isAfucosylated?: boolean;
}): ExtractedBioData {
  const result: ExtractedBioData = {};

  // Batch records → DAR, free payload, batch consistency, ADC characterization, linker, payload
  if (sources.batches && sources.batches.length > 0) {
    const firstBatch = sources.batches[0];
    if (firstBatch.conjugation?.dar != null) {
      const darSpec = parseDarSpec(firstBatch.conjugation.darSpec);
      if (darSpec) {
        result.dar = { value: firstBatch.conjugation.dar, spec: darSpec };
      }
    }
    if (firstBatch.conjugation?.freePayloadPercent != null) {
      const limit = parseFloat(firstBatch.conjugation.freePayloadSpec ?? "5");
      result.freePayload = {
        percentage: firstBatch.conjugation.freePayloadPercent,
        limit: isNaN(limit) ? 5 : limit,
      };
    }
    result.batches = mapBatchRecordsForRules(sources.batches);
    result.characterization = mapBatchToCharacterization(firstBatch);
    const afuc = mapBatchToAfucosylation(firstBatch, sources.isAfucosylated ?? false);
    if (afuc) result.afucosylation = afuc;

    // Linker stability and payload profile from batch data
    const linker = mapBatchToLinkerStability(firstBatch);
    if (linker) result.linkerStability = linker;
    const payload = mapBatchToPayloadProfile(firstBatch);
    if (payload) result.payload = payload;
  }

  // CoA → can supplement/override characterization data
  if (sources.coa) {
    if (!result.characterization) {
      result.characterization = mapCoaToCharacterization(sources.coa);
    }
  }

  // Stability data
  if (sources.stability) {
    result.stabilityData = mapStabilityForRules(sources.stability);
  }

  // Toxicology → animal dose, NOAEL, species, proposed starting dose
  if (sources.toxicology) {
    const toxRules = mapToxForRules(sources.toxicology);
    if (toxRules.animalDose) result.animalDose = toxRules.animalDose;
    if (toxRules.noael != null) result.noael = toxRules.noael;
    if (toxRules.proposedStartingDose != null) result.proposedStartingDose = toxRules.proposedStartingDose;
    if (toxRules.toxSpecies) result.toxSpecies = toxRules.toxSpecies;
  }

  // PK study → three-analyte check
  if (sources.pkStudy) {
    result.pkData = mapPkForRules(sources.pkStudy);
  }

  // Protocol → Project Optimus, diversity, CRS monitoring
  if (sources.protocol) {
    result.protocol = mapProtocolForRules(sources.protocol);
  }

  return result;
}

// Build BioDocumentInput from program data + all extraction sources
export function buildBioDocumentInput(
  program: {
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
    antibodyType?: string;
    linkerType?: string;
    payloadType?: string;
  },
  sources: {
    batches?: BatchRecordData[];
    stability?: StabilityData;
    toxicology?: ToxicologyReportData;
    pkStudy?: PkStudyData;
    protocol?: ClinicalProtocolData;
  }
): BioDocumentInput {
  const firstBatch = sources.batches?.[0];
  const darSpec = firstBatch?.conjugation?.darSpec
    ? parseDarSpec(firstBatch.conjugation.darSpec)
    : null;

  return {
    programName: program.programName,
    drugName: program.drugName,
    drugClass: program.drugClass,
    target: program.target,
    mechanism: program.mechanism,
    indication: program.indication,
    phase: program.phase,
    sponsorName: program.sponsorName,
    sponsorAddress: program.sponsorAddress,
    indNumber: program.indNumber,
    nctNumber: program.nctNumber,
    regulatoryPathway: program.regulatoryPathway,
    generatedAt: new Date(),
    antibodyType: program.antibodyType,
    linkerType: program.linkerType,
    payloadType: program.payloadType,
    dar: firstBatch?.conjugation?.dar ?? undefined,
    darSpec: darSpec ?? undefined,
    batchData: sources.batches ? mapBatchRecordsForTemplate(sources.batches) : undefined,
    stabilityData: sources.stability ? mapStabilityForTemplate(sources.stability) : undefined,
    toxData: sources.toxicology ? mapToxForTemplate(sources.toxicology) : undefined,
    pkData: sources.pkStudy ? mapPkForTemplate(sources.pkStudy) : undefined,
    clinicalData: sources.protocol ? mapProtocolForTemplate(sources.protocol) : undefined,
  };
}

// Build BioProgram (rules engine input) from program metadata
export function buildBioProgram(program: {
  drugClass: string;
  target: string;
  mechanism: string;
  isAfucosylated?: boolean;
  isBifunctional?: boolean;
  payloadClass?: string;
  hasNovelLinker?: boolean;
  hasNovelPayload?: boolean;
  targetExpressedOnNormalTissue?: boolean;
}): BioProgram {
  return {
    drugClass: program.drugClass,
    target: program.target,
    mechanism: program.mechanism,
    isAfucosylated: program.isAfucosylated,
    isBifunctional: program.isBifunctional,
    payloadClass: program.payloadClass,
    hasNovelLinker: program.hasNovelLinker,
    hasNovelPayload: program.hasNovelPayload,
    targetExpressedOnNormalTissue: program.targetExpressedOnNormalTissue,
  };
}
