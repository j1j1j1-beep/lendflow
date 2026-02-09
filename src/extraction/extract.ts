// ─── Core Extraction Orchestrator ─────────────────────────────────────────────
// This file orchestrates all extraction. It does NOT call Textract (that happens
// in the Inngest pipeline). It receives Textract output and routes to the right
// extraction method:
//   - Lending-supported forms (1040, W-2): deterministic field mapping via
//     lending-field-map.ts using Textract Lending API output
//   - Non-standard docs: Claude structures Textract's raw output
//   - Classifier: Claude's native PDF support for document identification

import { z } from "zod";
import { claudeStructure, claudeWithPdf, calculateCost } from "@/lib/claude";
import type { TextractResult } from "@/lib/textract";
import type { LendingPage } from "@/lib/textract";
import {
  mapLendingFieldsToSchema,
  LENDING_SUPPORTED_TYPES,
} from "./lending-field-map";

// Import all prompts
import { CLASSIFIER_PROMPT, CLASSIFIER_VERSION } from "./prompts/classifier";
import { FORM_1040_PROMPT, FORM_1040_VERSION } from "./prompts/1040";
import { FORM_1120_PROMPT, FORM_1120_VERSION } from "./prompts/1120";
import { FORM_1120S_PROMPT, FORM_1120S_VERSION } from "./prompts/1120s";
import { FORM_1065_PROMPT, FORM_1065_VERSION } from "./prompts/1065";
import {
  BANK_STATEMENT_PROMPT,
  BANK_STATEMENT_VERSION,
} from "./prompts/bank-statement";
import { PNL_PROMPT, PNL_VERSION } from "./prompts/pnl";
import {
  BALANCE_SHEET_PROMPT,
  BALANCE_SHEET_VERSION,
} from "./prompts/balance-sheet";
import { RENT_ROLL_PROMPT, RENT_ROLL_VERSION } from "./prompts/rent-roll";
import { W2_PROMPT, W2_VERSION } from "./prompts/w2";
import { K1_PROMPT, K1_VERSION } from "./prompts/k1";

// Import all schemas
import { form1040Schema } from "./schemas/1040.schema";
import { form1120Schema } from "./schemas/1120.schema";
import { form1120SSchema } from "./schemas/1120s.schema";
import { form1065Schema } from "./schemas/1065.schema";
import { bankStatementSchema } from "./schemas/bank-statement.schema";
import { pnlSchema } from "./schemas/pnl.schema";
import { balanceSheetSchema } from "./schemas/balance-sheet.schema";
import { rentRollSchema } from "./schemas/rent-roll.schema";
import { w2Schema } from "./schemas/w2.schema";
import { k1Schema } from "./schemas/k1.schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  docType: string;
  year: number | null;
  details: string;
  tokensUsed: number;
  costUsd: number;
}

export interface ExtractionResult {
  structuredData: Record<string, unknown>;
  rawResponse: string;
  promptVersion: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  validationErrors: Array<{ path: string; message: string }> | null;
  method: "deterministic" | "claude_fallback" | "claude_primary";
}

export interface ValidationResult {
  success: boolean;
  data: unknown;
  errors: Array<{ path: string; message: string }>;
}

// ─── Prompt Map ──────────────────────────────────────────────────────────────

export const PROMPT_MAP: Record<
  string,
  { prompt: string; version: string; schema: z.ZodSchema }
> = {
  FORM_1040: {
    prompt: FORM_1040_PROMPT,
    version: FORM_1040_VERSION,
    schema: form1040Schema,
  },
  FORM_1120: {
    prompt: FORM_1120_PROMPT,
    version: FORM_1120_VERSION,
    schema: form1120Schema,
  },
  FORM_1120S: {
    prompt: FORM_1120S_PROMPT,
    version: FORM_1120S_VERSION,
    schema: form1120SSchema,
  },
  FORM_1065: {
    prompt: FORM_1065_PROMPT,
    version: FORM_1065_VERSION,
    schema: form1065Schema,
  },
  SCHEDULE_K1: {
    prompt: K1_PROMPT,
    version: K1_VERSION,
    schema: k1Schema,
  },
  W2: {
    prompt: W2_PROMPT,
    version: W2_VERSION,
    schema: w2Schema,
  },
  BANK_STATEMENT_CHECKING: {
    prompt: BANK_STATEMENT_PROMPT,
    version: BANK_STATEMENT_VERSION,
    schema: bankStatementSchema,
  },
  BANK_STATEMENT_SAVINGS: {
    prompt: BANK_STATEMENT_PROMPT,
    version: BANK_STATEMENT_VERSION,
    schema: bankStatementSchema,
  },
  PROFIT_AND_LOSS: {
    prompt: PNL_PROMPT,
    version: PNL_VERSION,
    schema: pnlSchema,
  },
  BALANCE_SHEET: {
    prompt: BALANCE_SHEET_PROMPT,
    version: BALANCE_SHEET_VERSION,
    schema: balanceSheetSchema,
  },
  RENT_ROLL: {
    prompt: RENT_ROLL_PROMPT,
    version: RENT_ROLL_VERSION,
    schema: rentRollSchema,
  },
};

// These doc types always use Claude for structuring (no Lending API mapping)
const CLAUDE_ONLY_DOC_TYPES = new Set([
  "FORM_1120",
  "FORM_1120S",
  "FORM_1065",
  "SCHEDULE_K1",
  "BANK_STATEMENT_CHECKING",
  "BANK_STATEMENT_SAVINGS",
  "PROFIT_AND_LOSS",
  "BALANCE_SHEET",
  "RENT_ROLL",
  "OTHER",
]);

// Valid DocType enum values for classification validation
const VALID_DOC_TYPES = new Set([
  "FORM_1040",
  "FORM_1120",
  "FORM_1120S",
  "FORM_1065",
  "SCHEDULE_K1",
  "W2",
  "BANK_STATEMENT_CHECKING",
  "BANK_STATEMENT_SAVINGS",
  "PROFIT_AND_LOSS",
  "BALANCE_SHEET",
  "RENT_ROLL",
  "OTHER",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a dollar/numeric string into a number.
 * - Strips $, commas, whitespace
 * - Handles parenthetical negatives: "(5,000)" -> -5000
 * - Handles leading minus: "-5,000" -> -5000
 * - Returns null for non-numeric strings, empty values, etc.
 */
function parseDollarAmount(value: string): number | null {
  if (!value || value.trim() === "" || value.trim() === "-") return null;

  let cleaned = value.trim();
  let negative = false;

  // Handle parenthetical negatives: (5,000) = -5000
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Handle leading minus
  if (cleaned.startsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }

  // Remove dollar sign, commas, spaces
  cleaned = cleaned.replace(/[$,\s]/g, "");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return negative ? -num : num;
}

/**
 * Safely parse JSON from text that may contain markdown code fences or other
 * wrapping. All JSON.parse calls in extraction must go through this function.
 */
export function safeParseJson(text: string): Record<string, unknown> | null {
  if (!text || typeof text !== "string") return null;

  let cleaned = text.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // First attempt: direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    // Ignore and try fallback
  }

  // Second attempt: find the first { ... } block in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Could not parse
    }
  }

  return null;
}

/**
 * Convert flat dot-separated field paths to a nested object.
 * Example: { "income.wages_line1": { value: "85000", ... } }
 * becomes: { income: { wages_line1: 85000 } }
 *
 * Parses dollar amounts automatically.
 */
export function buildNestedObject(
  mappedFields: Record<
    string,
    { value: string; confidence: number; page: number; lineNumber: string }
  >
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldPath, fieldData] of Object.entries(mappedFields)) {
    const parts = fieldPath.split(".");
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      if (typeof current[part] !== "object" || Array.isArray(current[part])) {
        // Conflict: a leaf node already exists where we need an object.
        // Wrap the existing value and continue.
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const leafKey = parts[parts.length - 1];
    const parsed = parseDollarAmount(fieldData.value);
    current[leafKey] = parsed !== null ? parsed : fieldData.value;
  }

  return result;
}

/**
 * Build a text summary of Textract key-value pairs for sending to Claude.
 * Groups by page for better context.
 */
export function buildKeyValueSummary(
  keyValuePairs: Array<{
    key: string;
    value: string;
    confidence: number;
    page: number;
  }>
): string {
  const byPage = new Map<number, string[]>();

  for (const kv of keyValuePairs) {
    if (!byPage.has(kv.page)) {
      byPage.set(kv.page, []);
    }
    byPage
      .get(kv.page)!
      .push(
        `  "${kv.key}": "${kv.value}" (confidence: ${(kv.confidence * 100).toFixed(1)}%)`
      );
  }

  const sections: string[] = [];
  const sortedPages = [...byPage.keys()].sort((a, b) => a - b);
  for (const page of sortedPages) {
    sections.push(`--- Page ${page} ---`);
    sections.push(...byPage.get(page)!);
  }

  return sections.join("\n");
}

// ─── Classification ──────────────────────────────────────────────────────────

/**
 * Classify a document using Claude's native PDF support.
 * Sends the raw PDF to Claude with the classifier prompt.
 * Returns the detected document type, year, and details.
 */
export async function classifyDocument(
  pdfBuffer: Buffer
): Promise<ClassificationResult> {
  const response = await claudeWithPdf({
    pdfBuffer,
    prompt: CLASSIFIER_PROMPT,
    maxTokens: 1000,
  });

  const costUsd = calculateCost(response.inputTokens, response.outputTokens);
  const tokensUsed = response.inputTokens + response.outputTokens;

  const parsed = safeParseJson(response.text);
  if (!parsed) {
    return {
      docType: "OTHER",
      year: null,
      details: `Classification failed: could not parse response. Raw: ${response.text.substring(0, 200)}`,
      tokensUsed,
      costUsd,
    };
  }

  // Validate docType against known enum values
  let docType = String(parsed.docType || "OTHER").toUpperCase().trim();
  if (!VALID_DOC_TYPES.has(docType)) {
    // Try common variations and aliases
    const ALIASES: Record<string, string> = {
      "W-2": "W2",
      "W_2": "W2",
      "FORM_W2": "W2",
      "FORM_W-2": "W2",
      "1040": "FORM_1040",
      "1120": "FORM_1120",
      "1120S": "FORM_1120S",
      "1120-S": "FORM_1120S",
      "FORM_1120-S": "FORM_1120S",
      "1065": "FORM_1065",
      "SCHEDULE_C": "PROFIT_AND_LOSS",
      "SCHEDULEC": "PROFIT_AND_LOSS",
      "SCHEDULE_E": "FORM_1040",
      "SCHEDULEE": "FORM_1040",
      "INCOME_STATEMENT": "PROFIT_AND_LOSS",
      "P&L": "PROFIT_AND_LOSS",
      "PNL": "PROFIT_AND_LOSS",
      "K-1": "SCHEDULE_K1",
      "K1": "SCHEDULE_K1",
      "SCHEDULE_K-1": "SCHEDULE_K1",
      "BANK_STATEMENT": "BANK_STATEMENT_CHECKING",
    };
    const alias = ALIASES[docType];
    if (alias) {
      docType = alias;
    } else {
      // Generic normalization: spaces/hyphens to underscores, add FORM_ prefix
      const normalized = docType.replace(/[-\s]/g, "_").replace(/^FORM(?!_)/, "FORM_");
      if (VALID_DOC_TYPES.has(normalized)) {
        docType = normalized;
      } else {
        docType = "OTHER";
      }
    }
  }

  const year =
    typeof parsed.year === "number"
      ? parsed.year
      : typeof parsed.year === "string"
        ? parseInt(parsed.year, 10) || null
        : null;

  return {
    docType,
    year,
    details: typeof parsed.details === "string" ? parsed.details : "",
    tokensUsed,
    costUsd,
  };
}

// ─── Lending Extraction ──────────────────────────────────────────────────────

/**
 * Extract structured data from a Textract Lending page using deterministic
 * field mapping. No AI involved — maps Lending's standardized fields to our
 * Zod schema paths via lending-field-map.ts.
 */
function extractFromLending(
  lendingPage: LendingPage,
  docType: string
): ExtractionResult {
  const result = mapLendingFieldsToSchema(
    lendingPage.pageType,
    lendingPage.lendingFields
  );

  // Validate against Zod schema
  const validation = validateExtraction(docType, result.mapped);

  return {
    structuredData: validation.success
      ? (validation.data as Record<string, unknown>)
      : result.mapped,
    rawResponse: JSON.stringify({
      lendingPageType: lendingPage.pageType,
      lendingPageTypeConfidence: lendingPage.pageTypeConfidence,
      mappedCount: result.mappedCount,
      totalFields: result.totalFields,
      unmappedFields: result.unmappedFields,
    }),
    promptVersion: "textract-lending-v1",
    model: "textract-lending",
    tokensUsed: 0,
    costUsd: 0,
    validationErrors: validation.errors.length > 0 ? validation.errors : null,
    method: "deterministic",
  };
}

// ─── Main Extraction Orchestrator ────────────────────────────────────────────

/**
 * Extract structured data from a document. Routes to the appropriate extraction
 * method based on document type:
 *   - Lending-supported forms: deterministic mapping from Textract Lending output
 *   - Non-standard docs: Claude structures Textract output
 */
export async function extractDocument(
  textractResult: TextractResult,
  docType: string,
  pdfBuffer: Buffer,
  lendingPage?: LendingPage
): Promise<ExtractionResult> {
  // Lending-supported forms: use deterministic mapping if LendingPage is available
  if (lendingPage && LENDING_SUPPORTED_TYPES.has(lendingPage.pageType)) {
    const lendingResult = extractFromLending(lendingPage, docType);
    // If lending mapping produced meaningful data, use it.
    // Otherwise fall back to AI extraction (e.g. Courier text PDFs where
    // Lending returns few/no fields but OCR text is available).
    const dataKeys = Object.keys(lendingResult.structuredData);
    const hasData = dataKeys.some((k) => {
      const v = lendingResult.structuredData[k];
      return v && typeof v === "object" && Object.values(v as Record<string, unknown>).some((val) => val !== null && val !== undefined && val !== 0);
    });
    if (hasData) return lendingResult;
    // Lending returned empty/near-empty — fall through to AI extraction
  }

  // Everything else: use AI for structuring
  return extractNonStandardDoc(textractResult, docType, pdfBuffer);
}

// ─── Non-Standard Document Extraction ────────────────────────────────────────

/**
 * Extract data from a non-standard document (bank statements, P&Ls, etc.)
 * using Claude to structure Textract's raw output.
 *
 * 1. Gets the appropriate prompt and schema from PROMPT_MAP
 * 2. Sends Textract raw text + key-value summary to Claude
 * 3. Parses response JSON
 * 4. Validates against Zod schema
 */
async function extractNonStandardDoc(
  textractResult: TextractResult,
  docType: string,
  pdfBuffer: Buffer
): Promise<ExtractionResult> {
  const result = await extractWithClaude(textractResult, docType, pdfBuffer);

  return {
    ...result,
    method: "claude_primary",
  };
}

/**
 * Shared Claude extraction logic used by both fallback and non-standard docs.
 */
async function extractWithClaude(
  textractResult: TextractResult,
  docType: string,
  pdfBuffer: Buffer
): Promise<Omit<ExtractionResult, "method">> {
  const MODEL_NAME = "grok-4-1-fast-reasoning";
  const promptConfig = PROMPT_MAP[docType];

  if (!promptConfig) {
    // No prompt configured for this doc type; return empty with error
    return {
      structuredData: {},
      rawResponse: "",
      promptVersion: "unknown",
      model: MODEL_NAME,
      tokensUsed: 0,
      costUsd: 0,
      validationErrors: [
        {
          path: "_root",
          message: `No extraction prompt configured for document type: ${docType}`,
        },
      ],
    };
  }

  // Build the text content from Textract output
  const kvSummary = buildKeyValueSummary(textractResult.keyValuePairs);
  const textContent = [
    "=== RAW TEXT FROM DOCUMENT ===",
    textractResult.rawText,
    "",
    "=== KEY-VALUE PAIRS DETECTED ===",
    kvSummary,
    "",
    "=== TABLES DETECTED ===",
    ...textractResult.tables.map((table, i) => {
      const rows = table.rows
        .map((row) => row.map((cell) => `"${cell}"`).join(" | "))
        .join("\n");
      return `Table ${i + 1} (Page ${table.page}):\n${rows}`;
    }),
  ].join("\n");

  // Send to Claude
  const response = await claudeStructure({
    systemPrompt: promptConfig.prompt,
    textContent,
    maxTokens: 8000,
  });

  const tokensUsed = response.inputTokens + response.outputTokens;
  const costUsd = calculateCost(response.inputTokens, response.outputTokens);

  // Parse the response
  const parsed = safeParseJson(response.text);
  if (!parsed) {
    return {
      structuredData: {},
      rawResponse: response.text,
      promptVersion: promptConfig.version,
      model: MODEL_NAME,
      tokensUsed,
      costUsd,
      validationErrors: [
        {
          path: "_root",
          message: `Failed to parse Claude response as JSON. Response starts with: ${response.text.substring(0, 100)}`,
        },
      ],
    };
  }

  // Validate against schema
  const validation = validateExtraction(docType, parsed);

  return {
    structuredData: validation.success
      ? (validation.data as Record<string, unknown>)
      : parsed,
    rawResponse: response.text,
    promptVersion: promptConfig.version,
    model: MODEL_NAME,
    tokensUsed,
    costUsd,
    validationErrors: validation.errors.length > 0 ? validation.errors : null,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate extracted data against the appropriate Zod schema for the document type.
 * Returns { success, data, errors }.
 *
 * If there's no schema for the doc type, returns success with the raw data
 * (we still extract, we just can't validate).
 */
export function validateExtraction(
  docType: string,
  data: unknown
): ValidationResult {
  const promptConfig = PROMPT_MAP[docType];

  if (!promptConfig) {
    return {
      success: true,
      data,
      errors: [],
    };
  }

  const result = promptConfig.schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
    };
  }

  // Convert Zod errors to our format
  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return {
    success: false,
    data,
    errors,
  };
}
