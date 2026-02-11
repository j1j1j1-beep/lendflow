import { z } from "zod";

export { batchRecordSchema } from "./batch-record";
export type { BatchRecordData } from "./batch-record";

export { certificateOfAnalysisSchema } from "./certificate-of-analysis";
export type { CertificateOfAnalysisData } from "./certificate-of-analysis";

export { stabilityDataSchema } from "./stability-data";
export type { StabilityData } from "./stability-data";

export { toxicologyReportSchema } from "./toxicology-report";
export type { ToxicologyReportData } from "./toxicology-report";

export { pkStudySchema } from "./pk-study";
export type { PkStudyData } from "./pk-study";

export { clinicalProtocolSchema } from "./clinical-protocol";
export type { ClinicalProtocolData } from "./clinical-protocol";

import { batchRecordSchema } from "./batch-record";
import { certificateOfAnalysisSchema } from "./certificate-of-analysis";
import { stabilityDataSchema } from "./stability-data";
import { toxicologyReportSchema } from "./toxicology-report";
import { pkStudySchema } from "./pk-study";
import { clinicalProtocolSchema } from "./clinical-protocol";

export type BioDocType =
  | "BATCH_RECORD"
  | "CERTIFICATE_OF_ANALYSIS"
  | "STABILITY_DATA"
  | "TOXICOLOGY_REPORT"
  | "PK_STUDY"
  | "CLINICAL_PROTOCOL";

const BIO_SCHEMA_MAP: Record<BioDocType, z.ZodSchema> = {
  BATCH_RECORD: batchRecordSchema,
  CERTIFICATE_OF_ANALYSIS: certificateOfAnalysisSchema,
  STABILITY_DATA: stabilityDataSchema,
  TOXICOLOGY_REPORT: toxicologyReportSchema,
  PK_STUDY: pkStudySchema,
  CLINICAL_PROTOCOL: clinicalProtocolSchema,
};

export function getBioExtractionSchema(docType: string): z.ZodSchema | null {
  return BIO_SCHEMA_MAP[docType as BioDocType] ?? null;
}
