// Bio Document Extraction
// Extracts structured data from biopharmaceutical/IND documents using AI.
//
// Flow:
//   1. Look up the Zod schema for the document type
//   2. Build a targeted extraction prompt including the schema shape
//   3. Call Grok (via claudeJson) to extract structured data
//   4. Validate the result against the Zod schema
//   5. Return data + any validation errors
//
// All 6 bio document types are supported:
//   BATCH_RECORD, CERTIFICATE_OF_ANALYSIS, STABILITY_DATA,
//   TOXICOLOGY_REPORT, PK_STUDY, CLINICAL_PROTOCOL

import { z } from "zod";
import { claudeJson, calculateCost } from "@/lib/claude";
import { getBioExtractionSchema, type BioDocType } from "./schemas";

const MODEL_NAME = "grok-4-1-fast-reasoning";

export interface BioExtractionResult {
  data: Record<string, unknown>;
  validationErrors: string[] | null;
  tokensUsed: number;
  model: string;
  costUsd: number;
}

// Human-readable descriptions for each doc type, used in the extraction prompt
// to give the AI context about what it's extracting.
const DOC_TYPE_DESCRIPTIONS: Record<BioDocType, string> = {
  BATCH_RECORD:
    "A manufacturing batch record for a biopharmaceutical drug substance or drug product. " +
    "Contains batch/lot identifiers, manufacturing dates, process parameters, in-process controls, " +
    "conjugation data (for ADCs), purity analysis, yield, safety tests, physical properties, " +
    "and overall disposition (release/reject). Per GMP requirements (21 CFR 211.188).",
  CERTIFICATE_OF_ANALYSIS:
    "A certificate of analysis (CoA) for a biopharmaceutical product. " +
    "Contains batch/lot metadata, identity tests, purity tests (SEC-HPLC, CE-SDS, HCP, residual DNA), " +
    "potency tests (cytotoxicity, ADCC, binding), conjugation tests (DAR, free payload), " +
    "safety tests (endotoxin, sterility, mycoplasma), physical tests (appearance, pH, osmolality), " +
    "and overall disposition. Per ICH Q6B specifications.",
  STABILITY_DATA:
    "A stability study report for a biopharmaceutical product. " +
    "Contains study metadata, storage conditions (long-term, accelerated, stress, photostability), " +
    "test results at multiple timepoints, trend analysis, degradation products, " +
    "shelf life determination, and container closure information. Per ICH Q1A/Q5C guidelines.",
  TOXICOLOGY_REPORT:
    "A nonclinical toxicology study report. " +
    "Contains study design (species, dose groups, route, duration), key dose levels (NOAEL, LOAEL, MTD), " +
    "findings (mortality, clinical observations, body weight, clinical pathology, histopathology), " +
    "dose-limiting toxicities, toxicokinetics, recovery findings, human equivalent dose calculations, " +
    "and conclusions. GLP-compliant per 21 CFR 58.",
  PK_STUDY:
    "A pharmacokinetic (PK) or ADME study report. " +
    "Contains study design (species, dose levels, sampling), analyte data (Cmax, AUC, Tmax, half-life, " +
    "clearance, volume of distribution), dose proportionality, catabolism/deconjugation (for ADCs), " +
    "distribution, immunogenicity, bioanalytical method summary, and conclusions.",
  CLINICAL_PROTOCOL:
    "A clinical study protocol for a Phase 1-3 trial. " +
    "Contains study metadata (IND/NCT numbers, phase, design), objectives, endpoints, " +
    "study population (eligibility criteria), dosing (dose levels, escalation design), " +
    "safety monitoring (DLT definitions, DSMB, stopping rules), Project Optimus compliance, " +
    "diversity action plan, sample size, statistical plan, and assessment schedule. Per 21 CFR 312.23.",
};

/**
 * Convert a Zod schema into a simplified JSON shape description for the AI prompt.
 * Recursively walks the schema to produce a human-readable structure description.
 * Uses runtime constructor name checks for Zod v4 compatibility.
 */
function zodSchemaToJsonShape(schema: z.ZodType, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  const typeName = (schema as any)._def?.typeName as string ?? (schema as any).constructor?.name as string;

  // Unwrap optional/nullable/default wrappers
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    return zodSchemaToJsonShape((schema as any).unwrap(), depth);
  }
  if (typeName === "ZodDefault") {
    return zodSchemaToJsonShape((schema as any)._def.innerType, depth);
  }

  // Object
  if (typeName === "ZodObject") {
    const shape = (schema as any).shape as Record<string, z.ZodType>;
    const entries = Object.entries(shape);
    if (entries.length === 0) return "{}";

    const lines = entries.map(([key, value]) => {
      const valueStr = zodSchemaToJsonShape(value, depth + 1);
      return `${indent}  "${key}": ${valueStr}`;
    });
    return `{\n${lines.join(",\n")}\n${indent}}`;
  }

  // Array
  if (typeName === "ZodArray") {
    const itemStr = zodSchemaToJsonShape((schema as any).element, depth);
    return `[${itemStr}, ...]`;
  }

  // Enum
  if (typeName === "ZodEnum") {
    const values = (schema as any).options as string[];
    return `"${values.join(" | ")}"`;
  }

  // Primitives
  if (typeName === "ZodString") return '"string or null"';
  if (typeName === "ZodNumber") return '"number or null"';
  if (typeName === "ZodBoolean") return '"boolean or null"';

  return '"any"';
}

/**
 * Extract structured data from a biopharmaceutical document.
 *
 * @param ocrText - Raw OCR text from the document (Textract output)
 * @param docType - The classified document type (e.g. "BATCH_RECORD")
 * @returns Extracted data, validation errors (if any), and token usage
 */
export async function extractBioDocument(
  ocrText: string,
  docType: string,
): Promise<BioExtractionResult> {
  // 1. Look up the Zod schema for this document type
  const schema = getBioExtractionSchema(docType);
  if (!schema) {
    return {
      data: {},
      validationErrors: [`No extraction schema configured for document type: ${docType}`],
      tokensUsed: 0,
      model: MODEL_NAME,
      costUsd: 0,
    };
  }

  // 2. Build the schema shape for the prompt
  const jsonShape = zodSchemaToJsonShape(schema as z.ZodType);
  const description = DOC_TYPE_DESCRIPTIONS[docType as BioDocType] ?? "A biopharmaceutical document.";

  // 3. Build the extraction prompt
  const systemPrompt = `You are a biopharmaceutical document data extractor for FDA IND applications.
You are extracting structured data from a ${docType.replace(/_/g, " ").toLowerCase()}.

Document description: ${description}

Extract all available data from the provided document text into the following JSON structure:

${jsonShape}

CRITICAL RULES:
- Return ONLY a valid JSON object matching the structure above.
- Use null for any field where the data is not present in the document. NEVER invent or hallucinate data.
- For numeric fields, extract the number only (no units in numeric fields — units go in separate unit fields).
- For arrays, include all items found. Use an empty array [] if none found.
- For boolean fields, use true/false based on document content, or null if not determinable.
- For enum fields, use the exact enum value that best matches. Use null if no match.
- For date fields, use ISO 8601 format (YYYY-MM-DD) where possible.
- Include an "extractionNotes" array with any important observations about data quality, missing sections, or ambiguities.
- Be thorough — extract every field that has data in the document.`;

  // Truncate very long documents to stay within token limits.
  // 30K chars ~ 7500 tokens input, well within Grok's context window.
  const maxChars = 30000;
  const truncatedText = ocrText.length > maxChars
    ? ocrText.slice(0, maxChars) + "\n\n[... document truncated for extraction — remaining content not processed ...]"
    : ocrText;

  // 4. Call AI for extraction
  let rawData: Record<string, unknown>;
  let tokensUsed = 0;
  let costUsd = 0;

  try {
    rawData = await claudeJson<Record<string, unknown>>({
      systemPrompt,
      userPrompt: truncatedText,
      maxTokens: 8000,
    });

    // Estimate tokens: ~4 chars per token for input, output from response size.
    // claudeJson doesn't expose usage, so we estimate conservatively.
    const inputTokensEst = Math.ceil((systemPrompt.length + truncatedText.length) / 4);
    const outputTokensEst = Math.ceil(JSON.stringify(rawData).length / 4);
    tokensUsed = inputTokensEst + outputTokensEst;
    costUsd = calculateCost(inputTokensEst, outputTokensEst);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BioExtractor] AI extraction failed for ${docType}: ${message}`);
    return {
      data: {},
      validationErrors: [`AI extraction failed: ${message}`],
      tokensUsed: 0,
      model: MODEL_NAME,
      costUsd: 0,
    };
  }

  // 5. Validate against the Zod schema
  const parseResult = schema.safeParse(rawData);

  if (parseResult.success) {
    return {
      data: parseResult.data as Record<string, unknown>,
      validationErrors: null,
      tokensUsed,
      model: MODEL_NAME,
      costUsd,
    };
  }

  // Validation failed — return the raw data with error details.
  // The raw data is still useful even if some fields don't match the schema
  // (e.g. a number came back as a string). Callers can decide whether to use it.
  const validationErrors = parseResult.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `${path}: ${issue.message}`;
  });

  return {
    data: rawData,
    validationErrors,
    tokensUsed,
    model: MODEL_NAME,
    costUsd,
  };
}
