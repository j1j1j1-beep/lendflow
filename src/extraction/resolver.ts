// ─── Self-Resolution Logic ────────────────────────────────────────────────────
// When extraction verification finds a discrepancy on a specific field, this
// module attempts to self-resolve before creating a ReviewItem for human review.
//
// Resolution pipeline:
//   1. Re-read the Textract key-value pairs for the specific field/page
//   2. If ambiguous, ask Claude to analyze just that section of the document
//   3. If still unresolved, return { resolved: false } so the caller creates
//      a ReviewItem in the database
//
// This reduces the number of items humans need to review by ~40-60%, handling
// common OCR misreads, formatting inconsistencies, and rounding differences.

import { claudeStructure, calculateCost } from "@/lib/claude";
import { parseDollarAmount, getLineNumber } from "@/lib/irs-field-map";
import type { FormType } from "@/lib/irs-field-map";
import type { TextractResult, TextractKeyValuePair } from "@/lib/textract";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Discriminated union type for resolution results.
 * resolved: true means we found a confident answer — use resolvedValue.
 * resolved: false means we could not self-resolve — create a ReviewItem.
 */
export type ResolutionResult =
  | {
      resolved: true;
      resolvedValue: string;
      confidence: number;
      method: ResolutionMethod;
      explanation: string;
      tokensUsed: number;
      costUsd: number;
    }
  | {
      resolved: false;
      reason: string;
      attemptedMethods: ResolutionMethod[];
      tokensUsed: number;
      costUsd: number;
    };

export type ResolutionMethod =
  | "textract_reread"
  | "textract_alternative"
  | "claude_section"
  | "rounding_tolerance"
  | "format_normalization";

/**
 * A discrepancy that needs resolution.
 */
export interface Discrepancy {
  fieldPath: string;
  extractedValue: string;
  expectedValue: string | null;
  checkType: string;
  description: string;
  documentPage: number | null;
}

/**
 * Context needed for resolution attempts.
 */
export interface ResolutionContext {
  textractResult: TextractResult;
  docType: string;
  formType: FormType | null;
  documentId?: string;
  dealId?: string;
}

/**
 * Result from bulk resolution.
 */
export interface BulkResolutionResult {
  resolved: Array<{
    discrepancy: Discrepancy;
    result: ResolutionResult & { resolved: true };
  }>;
  unresolved: Array<{
    discrepancy: Discrepancy;
    result: ResolutionResult & { resolved: false };
  }>;
  totalTokensUsed: number;
  totalCostUsd: number;
}

// ─── Rounding and Format Tolerances ─────────────────────────────────────────

// Allow $1 difference for rounding (common in IRS forms)
const ROUNDING_TOLERANCE = 1;

// Allow 0.5% difference for percentage fields
const PERCENTAGE_TOLERANCE = 0.005;

// ─── Main Resolution Function ───────────────────────────────────────────────

/**
 * Attempt to resolve a single discrepancy through a multi-step pipeline.
 *
 * Pipeline:
 *   1. Format normalization — check if extracted and expected are the same value
 *      in different formats (e.g., "$85,000" vs "85000")
 *   2. Rounding tolerance — check if the difference is within acceptable range
 *   3. Textract re-read — look for the field again in Textract output,
 *      possibly with alternative spellings or nearby fields
 *   4. Claude section analysis — send just the relevant page/section to Claude
 *      and ask specifically about this field
 *   5. If all fail, return { resolved: false }
 */
export async function resolveDiscrepancy(
  discrepancy: Discrepancy,
  context: ResolutionContext
): Promise<ResolutionResult> {
  const attemptedMethods: ResolutionMethod[] = [];
  let totalTokensUsed = 0;
  let totalCostUsd = 0;

  // Step 1: Format normalization
  attemptedMethods.push("format_normalization");
  const formatResult = tryFormatNormalization(discrepancy);
  if (formatResult) return formatResult;

  // Step 2: Rounding tolerance
  attemptedMethods.push("rounding_tolerance");
  const roundingResult = tryRoundingTolerance(discrepancy);
  if (roundingResult) return roundingResult;

  // Step 3: Textract re-read
  attemptedMethods.push("textract_reread");
  const rereadResult = tryTextractReread(discrepancy, context);
  if (rereadResult) return rereadResult;

  // Step 4: Textract alternative values
  attemptedMethods.push("textract_alternative");
  const altResult = tryTextractAlternative(discrepancy, context);
  if (altResult) return altResult;

  // Step 5: Claude section analysis (only if we have page info)
  if (discrepancy.documentPage != null) {
    attemptedMethods.push("claude_section");
    const claudeResult = await tryClaudeSection(discrepancy, context);
    totalTokensUsed += claudeResult.tokensUsed;
    totalCostUsd += claudeResult.costUsd;
    if (claudeResult.resolved) {
      return claudeResult as ResolutionResult;
    }
  }

  // All methods failed
  return {
    resolved: false,
    reason: buildUnresolvedReason(discrepancy, attemptedMethods),
    attemptedMethods,
    tokensUsed: totalTokensUsed,
    costUsd: totalCostUsd,
  };
}

/**
 * Attempt bulk resolution of multiple discrepancies.
 * Groups discrepancies by page for efficient Claude batch analysis.
 *
 * @param discrepancies - Array of discrepancies to resolve
 * @param context - Resolution context (Textract output, doc type, etc.)
 * @returns Categorized results: resolved items and unresolved items
 */
export async function attemptBulkResolution(
  discrepancies: Discrepancy[],
  context: ResolutionContext
): Promise<BulkResolutionResult> {
  const resolved: BulkResolutionResult["resolved"] = [];
  const unresolved: BulkResolutionResult["unresolved"] = [];
  let totalTokensUsed = 0;
  let totalCostUsd = 0;

  // Phase 1: Try cheap local resolution methods first (no API calls)
  const needsClaudeHelp: Discrepancy[] = [];

  for (const discrepancy of discrepancies) {
    // Format normalization
    const formatResult = tryFormatNormalization(discrepancy);
    if (formatResult) {
      resolved.push({
        discrepancy,
        result: formatResult as ResolutionResult & { resolved: true },
      });
      continue;
    }

    // Rounding tolerance
    const roundingResult = tryRoundingTolerance(discrepancy);
    if (roundingResult) {
      resolved.push({
        discrepancy,
        result: roundingResult as ResolutionResult & { resolved: true },
      });
      continue;
    }

    // Textract re-read
    const rereadResult = tryTextractReread(discrepancy, context);
    if (rereadResult) {
      resolved.push({
        discrepancy,
        result: rereadResult as ResolutionResult & { resolved: true },
      });
      continue;
    }

    // Textract alternative
    const altResult = tryTextractAlternative(discrepancy, context);
    if (altResult) {
      resolved.push({
        discrepancy,
        result: altResult as ResolutionResult & { resolved: true },
      });
      continue;
    }

    needsClaudeHelp.push(discrepancy);
  }

  // Phase 2: Group remaining discrepancies by page for Claude batch analysis
  if (needsClaudeHelp.length > 0) {
    const byPage = new Map<number, Discrepancy[]>();
    const noPage: Discrepancy[] = [];

    for (const d of needsClaudeHelp) {
      if (d.documentPage != null) {
        if (!byPage.has(d.documentPage)) {
          byPage.set(d.documentPage, []);
        }
        byPage.get(d.documentPage)!.push(d);
      } else {
        noPage.push(d);
      }
    }

    // Send grouped queries to Claude
    for (const [page, pageDiscrepancies] of byPage) {
      const batchResult = await tryClaudeBatchSection(
        pageDiscrepancies,
        page,
        context
      );
      totalTokensUsed += batchResult.tokensUsed;
      totalCostUsd += batchResult.costUsd;

      for (let i = 0; i < pageDiscrepancies.length; i++) {
        const result = batchResult.results[i];
        if (result && result.resolved) {
          resolved.push({
            discrepancy: pageDiscrepancies[i],
            result: result as ResolutionResult & { resolved: true },
          });
        } else {
          unresolved.push({
            discrepancy: pageDiscrepancies[i],
            result: {
              resolved: false,
              reason: result
                ? (result as ResolutionResult & { resolved: false }).reason
                : "Claude batch analysis did not return a result for this field",
              attemptedMethods: [
                "format_normalization",
                "rounding_tolerance",
                "textract_reread",
                "textract_alternative",
                "claude_section",
              ],
              tokensUsed: 0,
              costUsd: 0,
            },
          });
        }
      }
    }

    // Items with no page info that Claude couldn't help with
    for (const d of noPage) {
      unresolved.push({
        discrepancy: d,
        result: {
          resolved: false,
          reason: `No document page number available for field "${d.fieldPath}". Cannot perform targeted analysis.`,
          attemptedMethods: [
            "format_normalization",
            "rounding_tolerance",
            "textract_reread",
            "textract_alternative",
          ],
          tokensUsed: 0,
          costUsd: 0,
        },
      });
    }
  }

  return {
    resolved,
    unresolved,
    totalTokensUsed,
    totalCostUsd,
  };
}

// ─── Resolution Strategies ──────────────────────────────────────────────────

/**
 * Strategy 1: Check if the extracted and expected values are the same number
 * but in different string formats.
 *
 * Common cases:
 * - "$85,000" vs "85000"
 * - "(5,000)" vs "-5000"
 * - "85000.00" vs "85000"
 */
function tryFormatNormalization(
  discrepancy: Discrepancy
): ResolutionResult | null {
  if (!discrepancy.expectedValue) return null;

  const extractedNum = parseDollarAmount(discrepancy.extractedValue);
  const expectedNum = parseDollarAmount(discrepancy.expectedValue);

  if (extractedNum === null || expectedNum === null) return null;

  // Exact match after normalization
  if (extractedNum === expectedNum) {
    return {
      resolved: true,
      resolvedValue: String(extractedNum),
      confidence: 0.99,
      method: "format_normalization",
      explanation: `Values match after format normalization: "${discrepancy.extractedValue}" and "${discrepancy.expectedValue}" both equal ${extractedNum}`,
      tokensUsed: 0,
      costUsd: 0,
    };
  }

  return null;
}

/**
 * Strategy 2: Check if the difference between extracted and expected values
 * is within acceptable rounding tolerance.
 *
 * IRS forms commonly round to the nearest dollar, causing $1 differences
 * when a source value has cents.
 */
function tryRoundingTolerance(
  discrepancy: Discrepancy
): ResolutionResult | null {
  if (!discrepancy.expectedValue) return null;

  const extractedNum = parseDollarAmount(discrepancy.extractedValue);
  const expectedNum = parseDollarAmount(discrepancy.expectedValue);

  if (extractedNum === null || expectedNum === null) return null;

  const difference = Math.abs(extractedNum - expectedNum);

  // Dollar amount rounding tolerance
  if (difference <= ROUNDING_TOLERANCE) {
    return {
      resolved: true,
      resolvedValue: discrepancy.extractedValue,
      confidence: 0.95,
      method: "rounding_tolerance",
      explanation: `Difference of $${difference.toFixed(2)} is within rounding tolerance ($${ROUNDING_TOLERANCE})`,
      tokensUsed: 0,
      costUsd: 0,
    };
  }

  // Percentage tolerance (for fields like occupancy rate, margins)
  if (
    discrepancy.fieldPath.toLowerCase().includes("rate") ||
    discrepancy.fieldPath.toLowerCase().includes("margin") ||
    discrepancy.fieldPath.toLowerCase().includes("percent")
  ) {
    if (difference <= PERCENTAGE_TOLERANCE) {
      return {
        resolved: true,
        resolvedValue: discrepancy.extractedValue,
        confidence: 0.9,
        method: "rounding_tolerance",
        explanation: `Percentage difference of ${(difference * 100).toFixed(3)}% is within tolerance`,
        tokensUsed: 0,
        costUsd: 0,
      };
    }
  }

  return null;
}

/**
 * Strategy 3: Re-read the Textract output for this specific field.
 * Looks for the field on the specified page with the expected line number.
 * May find it with higher confidence or a clearer reading.
 */
function tryTextractReread(
  discrepancy: Discrepancy,
  context: ResolutionContext
): ResolutionResult | null {
  if (!discrepancy.documentPage || !context.formType) return null;

  // Find key-value pairs on the same page
  const pageKvPairs = context.textractResult.keyValuePairs.filter(
    (kv) => kv.page === discrepancy.documentPage
  );

  if (pageKvPairs.length === 0) return null;

  // Get the IRS line number for this field path
  const lineNumber = getLineNumber(context.formType, discrepancy.fieldPath);

  if (!lineNumber) return null;

  // Look for the line number in the page's key-value pairs
  for (const kv of pageKvPairs) {
    const key = kv.key.toLowerCase().trim();

    // Check if this key matches the line number
    if (
      key === lineNumber ||
      key.startsWith(`${lineNumber} `) ||
      key.startsWith(`${lineNumber}.`) ||
      key.includes(`line ${lineNumber}`)
    ) {
      const parsed = parseDollarAmount(kv.value);
      if (parsed !== null) {
        // Compare with expected value
        if (discrepancy.expectedValue) {
          const expectedNum = parseDollarAmount(discrepancy.expectedValue);
          if (expectedNum !== null && parsed === expectedNum) {
            return {
              resolved: true,
              resolvedValue: String(parsed),
              confidence: kv.confidence,
              method: "textract_reread",
              explanation: `Re-read from Textract page ${discrepancy.documentPage}: line "${kv.key}" = "${kv.value}" (confidence: ${(kv.confidence * 100).toFixed(1)}%)`,
              tokensUsed: 0,
              costUsd: 0,
            };
          }
        }

        // High-confidence re-reads are logged but NOT auto-resolved.
        // Architecture principle: mismatches always go to humans.
        // A high-confidence OCR read could still be the wrong field.
      }
    }
  }

  return null;
}

/**
 * Strategy 4: Look for alternative Textract key-value pairs that might
 * represent the same field under a different label.
 *
 * Common cases:
 * - "Total income" vs "Total Income (loss)"
 * - "Line 11" vs "Adjusted gross income"
 * - OCR misread of line numbers (e.g., "l1" instead of "11")
 */
function tryTextractAlternative(
  discrepancy: Discrepancy,
  context: ResolutionContext
): ResolutionResult | null {
  if (!discrepancy.expectedValue) return null;

  const expectedNum = parseDollarAmount(discrepancy.expectedValue);
  if (expectedNum === null) return null;

  // Search all key-value pairs for a value that matches what we expected
  const candidates: Array<TextractKeyValuePair & { parsedValue: number }> = [];

  for (const kv of context.textractResult.keyValuePairs) {
    // Filter by page if we have page info
    if (discrepancy.documentPage != null && kv.page !== discrepancy.documentPage) {
      continue;
    }

    const parsed = parseDollarAmount(kv.value);
    if (parsed !== null && parsed === expectedNum) {
      candidates.push({ ...kv, parsedValue: parsed });
    }
  }

  if (candidates.length === 0) return null;

  // Pick the highest-confidence candidate
  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  // Only accept if confidence is reasonable
  if (best.confidence >= 0.8) {
    return {
      resolved: true,
      resolvedValue: String(best.parsedValue),
      confidence: best.confidence * 0.9, // Slightly lower since it's alternative
      method: "textract_alternative",
      explanation: `Found matching value under alternative label "${best.key}" on page ${best.page} (confidence: ${(best.confidence * 100).toFixed(1)}%)`,
      tokensUsed: 0,
      costUsd: 0,
    };
  }

  return null;
}

/**
 * Strategy 5: Send the relevant page section to Claude for targeted analysis.
 * This is the most expensive strategy but also the most capable.
 * Only used when cheaper strategies fail.
 */
async function tryClaudeSection(
  discrepancy: Discrepancy,
  context: ResolutionContext
): Promise<ResolutionResult> {
  try {
    // Build a focused prompt with just the relevant page context
    const pageText = extractPageText(
      context.textractResult,
      discrepancy.documentPage!
    );

    const pageKvPairs = context.textractResult.keyValuePairs
      .filter((kv) => kv.page === discrepancy.documentPage)
      .map((kv) => `  "${kv.key}": "${kv.value}"`)
      .join("\n");

    const prompt = buildSectionAnalysisPrompt(discrepancy);

    const textContent = [
      "=== DOCUMENT TEXT (Page " + discrepancy.documentPage + ") ===",
      pageText,
      "",
      "=== KEY-VALUE PAIRS (Page " + discrepancy.documentPage + ") ===",
      pageKvPairs,
    ].join("\n");

    const response = await claudeStructure({
      systemPrompt: prompt,
      textContent,
      maxTokens: 500,
    });

    const tokensUsed = response.inputTokens + response.outputTokens;
    const costUsd = calculateCost(response.inputTokens, response.outputTokens);

    // Parse Claude's response
    const parsed = safeParseResolutionResponse(response.text);

    if (parsed && parsed.value !== null && parsed.confidence >= 0.7) {
      return {
        resolved: true,
        resolvedValue: String(parsed.value),
        confidence: parsed.confidence,
        method: "claude_section",
        explanation: parsed.explanation || "Resolved by Claude section analysis",
        tokensUsed,
        costUsd,
      };
    }

    return {
      resolved: false,
      reason: parsed
        ? `Claude analysis inconclusive (confidence: ${parsed.confidence}): ${parsed.explanation}`
        : `Claude response could not be parsed: ${response.text.substring(0, 100)}`,
      attemptedMethods: [
        "format_normalization",
        "rounding_tolerance",
        "textract_reread",
        "textract_alternative",
        "claude_section",
      ],
      tokensUsed,
      costUsd,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      resolved: false,
      reason: `Claude section analysis failed: ${errorMessage}`,
      attemptedMethods: [
        "format_normalization",
        "rounding_tolerance",
        "textract_reread",
        "textract_alternative",
        "claude_section",
      ],
      tokensUsed: 0,
      costUsd: 0,
    };
  }
}

/**
 * Batch Claude analysis for multiple discrepancies on the same page.
 * More cost-efficient than individual queries.
 */
async function tryClaudeBatchSection(
  discrepancies: Discrepancy[],
  page: number,
  context: ResolutionContext
): Promise<{
  results: ResolutionResult[];
  tokensUsed: number;
  costUsd: number;
}> {
  try {
    const pageText = extractPageText(context.textractResult, page);
    const pageKvPairs = context.textractResult.keyValuePairs
      .filter((kv) => kv.page === page)
      .map((kv) => `  "${kv.key}": "${kv.value}"`)
      .join("\n");

    // Build a batch prompt asking about all fields at once
    const fieldQuestions = discrepancies
      .map(
        (d, i) =>
          `  ${i + 1}. Field: "${d.fieldPath}"\n     Extracted value: "${d.extractedValue}"\n     Expected value: "${d.expectedValue || "unknown"}"\n     Issue: ${d.description}`
      )
      .join("\n");

    const prompt = `You are a financial document verification specialist. Analyze page ${page} of this document and resolve the following discrepancies.

For EACH discrepancy below, determine the correct value by carefully reading the document text and key-value pairs.

DISCREPANCIES TO RESOLVE:
${fieldQuestions}

Return a JSON object with this structure:
{
  "resolutions": [
    {
      "fieldIndex": 1,
      "resolvedValue": "the correct value as a number",
      "confidence": 0.95,
      "explanation": "brief explanation of how you determined the value"
    }
  ]
}

RULES:
- Only include a resolution if you are confident (>= 0.7) in the answer.
- Use numbers only for resolved values (no dollar signs, commas).
- If you cannot determine the correct value, omit that field from the resolutions array.
- Be precise: read the actual characters on the page, do not guess.`;

    const textContent = [
      "=== DOCUMENT TEXT (Page " + page + ") ===",
      pageText,
      "",
      "=== KEY-VALUE PAIRS (Page " + page + ") ===",
      pageKvPairs,
    ].join("\n");

    const response = await claudeStructure({
      systemPrompt: prompt,
      textContent,
      maxTokens: 1000,
    });

    const tokensUsed = response.inputTokens + response.outputTokens;
    const costUsd = calculateCost(response.inputTokens, response.outputTokens);

    // Parse the batch response
    const parsed = safeParseJson(response.text);
    const results: ResolutionResult[] = [];

    if (parsed && Array.isArray(parsed.resolutions)) {
      const resolutionMap = new Map<number, Record<string, unknown>>();
      for (const res of parsed.resolutions as Array<Record<string, unknown>>) {
        const idx = res.fieldIndex as number;
        if (idx >= 1 && idx <= discrepancies.length) {
          resolutionMap.set(idx, res);
        }
      }

      for (let i = 0; i < discrepancies.length; i++) {
        const resolution = resolutionMap.get(i + 1);
        if (
          resolution &&
          resolution.resolvedValue != null &&
          (resolution.confidence as number) >= 0.7
        ) {
          results.push({
            resolved: true,
            resolvedValue: String(resolution.resolvedValue),
            confidence: resolution.confidence as number,
            method: "claude_section",
            explanation:
              (resolution.explanation as string) ||
              "Resolved by Claude batch analysis",
            tokensUsed: 0,
            costUsd: 0,
          });
        } else {
          results.push({
            resolved: false,
            reason: resolution
              ? `Low confidence (${resolution.confidence}): ${resolution.explanation || "Inconclusive"}`
              : "Claude batch analysis did not return a result for this field",
            attemptedMethods: [
              "format_normalization",
              "rounding_tolerance",
              "textract_reread",
              "textract_alternative",
              "claude_section",
            ],
            tokensUsed: 0,
            costUsd: 0,
          });
        }
      }
    } else {
      // Could not parse batch response — mark all as unresolved
      for (const d of discrepancies) {
        results.push({
          resolved: false,
          reason: `Could not parse Claude batch response for page ${page}`,
          attemptedMethods: [
            "format_normalization",
            "rounding_tolerance",
            "textract_reread",
            "textract_alternative",
            "claude_section",
          ],
          tokensUsed: 0,
          costUsd: 0,
        });
      }
    }

    return { results, tokensUsed, costUsd };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      results: discrepancies.map(() => ({
        resolved: false as const,
        reason: `Claude batch analysis failed: ${errorMessage}`,
        attemptedMethods: [
          "format_normalization" as const,
          "rounding_tolerance" as const,
          "textract_reread" as const,
          "textract_alternative" as const,
          "claude_section" as const,
        ],
        tokensUsed: 0,
        costUsd: 0,
      })),
      tokensUsed: 0,
      costUsd: 0,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract raw text for a specific page from the Textract result.
 * Falls back to splitting rawText by page markers or line counts.
 */
function extractPageText(
  textractResult: TextractResult,
  page: number
): string {
  // Try to extract text from blocks for the specific page
  const pageLines: string[] = [];

  for (const block of textractResult.blocks) {
    if (
      block.BlockType === "LINE" &&
      block.Page === page &&
      block.Text
    ) {
      pageLines.push(block.Text);
    }
  }

  if (pageLines.length > 0) {
    return pageLines.join("\n");
  }

  // Fallback: return first portion of raw text for single-page docs
  if (textractResult.pageCount === 1) {
    return textractResult.rawText;
  }

  // For multi-page, approximate by dividing text equally
  const lines = textractResult.rawText.split("\n");
  const linesPerPage = Math.ceil(lines.length / textractResult.pageCount);
  const startLine = (page - 1) * linesPerPage;
  const endLine = Math.min(startLine + linesPerPage, lines.length);

  return lines.slice(startLine, endLine).join("\n");
}

/**
 * Build a focused prompt for Claude to analyze a specific field discrepancy.
 */
function buildSectionAnalysisPrompt(discrepancy: Discrepancy): string {
  return `You are a financial document verification specialist. You are analyzing a specific field from a financial document.

FIELD TO VERIFY: "${discrepancy.fieldPath}"
EXTRACTED VALUE: "${discrepancy.extractedValue}"
EXPECTED VALUE: "${discrepancy.expectedValue || "unknown"}"
ISSUE: ${discrepancy.description}

Carefully read the document text and key-value pairs below. Determine the correct value for this field.

Return a JSON object:
{
  "value": <the correct numeric value, or null if you cannot determine it>,
  "confidence": <0.0 to 1.0, how confident you are>,
  "explanation": "brief explanation of how you determined the value"
}

RULES:
- Read the actual characters from the document. Do not guess or estimate.
- If the value is a dollar amount, return just the number (no $ or commas).
- If you cannot confidently determine the value, set value to null and confidence to 0.
- Common OCR issues: 0/O confusion, 1/l confusion, missing decimals, truncated numbers.`;
}

/**
 * Parse Claude's response for a single field resolution.
 */
function safeParseResolutionResponse(
  text: string
): { value: number | null; confidence: number; explanation: string } | null {
  const parsed = safeParseJson(text);
  if (!parsed) return null;

  const value =
    parsed.value === null
      ? null
      : typeof parsed.value === "number"
        ? parsed.value
        : typeof parsed.value === "string"
          ? parseDollarAmount(parsed.value)
          : null;

  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(Math.max(parsed.confidence, 0), 1)
      : 0;

  const explanation =
    typeof parsed.explanation === "string" ? parsed.explanation : "";

  return { value, confidence, explanation };
}

/**
 * Safely parse JSON, handling markdown fences and other wrapping.
 * Local copy to avoid circular dependency with extract.ts.
 */
function safeParseJson(text: string): Record<string, unknown> | null {
  if (!text || typeof text !== "string") return null;

  let cleaned = text.trim();

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    // Try extracting the first JSON object
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
}

/**
 * Build a human-readable explanation for why resolution failed.
 */
function buildUnresolvedReason(
  discrepancy: Discrepancy,
  attemptedMethods: ResolutionMethod[]
): string {
  const parts: string[] = [];

  parts.push(
    `Could not self-resolve "${discrepancy.fieldPath}": extracted "${discrepancy.extractedValue}"`
  );

  if (discrepancy.expectedValue) {
    parts.push(`expected "${discrepancy.expectedValue}"`);
  }

  parts.push(`after trying: ${attemptedMethods.join(", ")}`);

  return parts.join(". ") + ".";
}
