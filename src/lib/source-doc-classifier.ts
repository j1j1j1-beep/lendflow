// Source document classifier + extractor.
// Runs Textract OCR on a source document, then uses Grok AI to classify it
// against the module's source doc type definitions.

import { analyzeDocument, type TextractResult } from "@/lib/textract";
import { claudeJson } from "@/lib/claude";
import { getSourceDocsForModule, type ModuleName } from "@/lib/source-doc-types";

export interface ClassificationResult {
  docType: string | null;
  confidence: number;
  ocrText: string;
  textractOutput: TextractResult;
}

/**
 * Run Textract on an S3 object, then classify it against the module's
 * known source doc types using Grok AI.
 */
export async function classifyAndExtractSourceDoc(
  s3Key: string,
  module: ModuleName,
): Promise<ClassificationResult> {
  // Step 1: Run Textract OCR
  const textractResult = await analyzeDocument(s3Key);
  const ocrText = textractResult.rawText;

  // Step 2: Get module source doc definitions for classification
  const defs = getSourceDocsForModule(module);
  if (defs.length === 0 || ocrText.trim().length === 0) {
    return {
      docType: null,
      confidence: 0,
      ocrText,
      textractOutput: textractResult,
    };
  }

  // Step 3: Send first ~4000 chars + source doc list to Grok for classification
  const textSnippet = ocrText.slice(0, 4000);
  const docTypeList = defs
    .map((d) => `  - "${d.key}": ${d.label} — ${d.description}`)
    .join("\n");

  try {
    const result = await claudeJson<{
      docType: string | null;
      confidence: number;
    }>({
      systemPrompt: `You are a document classifier for a legal document automation platform. Given OCR text from an uploaded source document, determine which type of source document it is from the provided list.

Rules:
1. Return the exact "key" string from the list if you find a match.
2. Return null for docType if the text doesn't clearly match any type.
3. Confidence should be 0.0-1.0. Only return confidence > 0.7 if you're reasonably sure.
4. Base your classification on the content, headings, and structure of the text.
5. Return ONLY valid JSON: {"docType": "key_or_null", "confidence": 0.0-1.0}`,
      userPrompt: `Module: ${module}

Available source document types:
${docTypeList}

OCR text from the uploaded document (first ~4000 chars):
---
${textSnippet}
---

Classify this document. Return JSON: {"docType": "matching_key_or_null", "confidence": 0.0-1.0}`,
      maxTokens: 200,
    });

    // Validate the returned docType is actually in our definitions
    const validDocType =
      result.docType && defs.some((d) => d.key === result.docType)
        ? result.docType
        : null;

    return {
      docType: validDocType,
      confidence: validDocType ? Math.min(result.confidence ?? 0, 1) : 0,
      ocrText,
      textractOutput: textractResult,
    };
  } catch (error) {
    console.error("[SourceDocClassifier] Grok classification failed:", error);
    // Return extraction without classification — docs still usable for generation
    return {
      docType: null,
      confidence: 0,
      ocrText,
      textractOutput: textractResult,
    };
  }
}
