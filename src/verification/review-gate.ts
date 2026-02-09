// =============================================================================
// review-gate.ts
// Collects all failed verification checks and determines whether extracted
// data can proceed to analysis or needs human review.
// ZERO AI. Pure deterministic gate logic.
//
// TOLERANCE PHILOSOPHY: Small discrepancies from OCR rounding, AI extraction,
// or minor formatting differences should NOT block the pipeline. Only
// genuinely material discrepancies warrant human review.
// =============================================================================

import type { MathCheck } from "./math-checks";
import type { CrossDocCheck } from "./cross-document";
import type { TextractComparison } from "./textract-vs-structured";

// ---------------------------------------------------------------------------
// Tolerance thresholds — discrepancies below these are auto-passed
// ---------------------------------------------------------------------------

// Math checks: if the difference is under $50 AND under 2% of expected, auto-pass
const MATH_TOLERANCE_ABSOLUTE = 50;
const MATH_TOLERANCE_PERCENT = 0.02;

// Cross-doc checks: if the difference is under $100 AND under 5%, auto-pass
const CROSS_DOC_TOLERANCE_ABSOLUTE = 100;
const CROSS_DOC_TOLERANCE_PERCENT = 0.05;

// Textract comparisons: if the difference is under $25 AND under 3%, auto-pass
const TEXTRACT_TOLERANCE_ABSOLUTE = 25;
const TEXTRACT_TOLERANCE_PERCENT = 0.03;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewGateResult {
  canProceed: boolean;
  reviewItems: ReviewItemInput[];
  autoPassedCount: number;
  summary: {
    mathChecksPassed: number;
    mathChecksFailed: number;
    crossDocPassed: number;
    crossDocFailed: number;
    crossDocWarnings: number;
    textractAgreed: number;
    textractDisagreed: number;
  };
}

export interface ReviewItemInput {
  fieldPath: string;
  extractedValue: string;
  expectedValue: string;
  checkType: "math" | "cross_doc" | "textract_mismatch";
  description: string;
  documentPage?: number;
  documentId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function fmtDollar(n: number): string {
  return `$${fmt(Math.abs(n))}${n < 0 ? " (negative)" : ""}`;
}

function percentDiff(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return 0;
  return Math.abs(a - b) / max;
}

// ---------------------------------------------------------------------------
// Review item builders
// ---------------------------------------------------------------------------

function mathCheckToReviewItem(check: MathCheck, documentId?: string): ReviewItemInput {
  return {
    fieldPath: check.fieldPath,
    extractedValue: fmtDollar(check.actual),
    expectedValue: fmtDollar(check.expected),
    checkType: "math",
    description: `${check.description}. Expected ${fmtDollar(check.expected)}, got ${fmtDollar(check.actual)}. Difference: ${fmtDollar(check.difference)}`,
    ...(check.documentPage != null ? { documentPage: check.documentPage } : {}),
    ...(documentId ? { documentId } : {}),
  };
}

function crossDocToReviewItem(check: CrossDocCheck, documentId?: string): ReviewItemInput {
  const pctLabel = `${(check.percentDiff * 100).toFixed(1)}%`;
  return {
    fieldPath: `${check.doc1Field} vs ${check.doc2Field}`,
    extractedValue: fmtDollar(check.doc1Value),
    expectedValue: fmtDollar(check.doc2Value),
    checkType: "cross_doc",
    description: `${check.description}. ${check.doc1Type} shows ${fmtDollar(check.doc1Value)} but ${check.doc2Type} shows ${fmtDollar(check.doc2Value)}. Difference: ${fmtDollar(check.difference)} (${pctLabel})`,
    ...(documentId ? { documentId } : {}),
  };
}

function textractToReviewItem(comparison: TextractComparison, documentId?: string): ReviewItemInput {
  if (comparison.textractValue == null) {
    return {
      fieldPath: comparison.fieldPath,
      extractedValue: fmtDollar(comparison.structuredValue),
      expectedValue: "not found in Textract",
      checkType: "textract_mismatch",
      description: `Textract has no matching key-value pair for ${comparison.fieldPath} (structured value: ${fmtDollar(comparison.structuredValue)}). This field could not be independently verified.`,
      ...(comparison.page != null ? { documentPage: comparison.page } : {}),
      ...(documentId ? { documentId } : {}),
    };
  }

  return {
    fieldPath: comparison.fieldPath,
    extractedValue: fmtDollar(comparison.structuredValue),
    expectedValue: fmtDollar(comparison.textractValue),
    checkType: "textract_mismatch",
    description: `Textract reads "${comparison.textractKey}" as ${fmtDollar(comparison.textractValue)} but extraction shows ${fmtDollar(comparison.structuredValue)}. Difference: ${fmtDollar(comparison.difference)}`,
    ...(comparison.page != null ? { documentPage: comparison.page } : {}),
    ...(documentId ? { documentId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function evaluateReviewGate(params: {
  mathChecks: MathCheck[];
  crossDocChecks: CrossDocCheck[];
  textractComparisons: TextractComparison[];
  documentId?: string;
}): ReviewGateResult {
  const { mathChecks, crossDocChecks, textractComparisons, documentId } = params;

  const reviewItems: ReviewItemInput[] = [];
  let autoPassedCount = 0;

  // ---- Math checks ----
  let mathChecksPassed = 0;
  let mathChecksFailed = 0;

  for (const check of mathChecks) {
    if (check.passed) {
      mathChecksPassed++;
    } else {
      // Apply tolerance: small discrepancies are auto-passed
      const absDiff = Math.abs(check.difference);
      const pctDiff = percentDiff(check.expected, check.actual);
      if (absDiff <= MATH_TOLERANCE_ABSOLUTE && pctDiff <= MATH_TOLERANCE_PERCENT) {
        mathChecksPassed++;
        autoPassedCount++;
      } else {
        mathChecksFailed++;
        reviewItems.push(mathCheckToReviewItem(check, documentId));
      }
    }
  }

  // ---- Cross-doc checks ----
  let crossDocPassed = 0;
  let crossDocFailed = 0;
  let crossDocWarnings = 0;

  for (const check of crossDocChecks) {
    switch (check.status) {
      case "pass":
        crossDocPassed++;
        break;
      case "warning":
        crossDocWarnings++;
        // Warnings do NOT block the pipeline and do NOT create review items
        break;
      case "fail": {
        // Apply tolerance: small cross-doc discrepancies are auto-passed
        const absDiff = Math.abs(check.difference);
        if (absDiff <= CROSS_DOC_TOLERANCE_ABSOLUTE && check.percentDiff <= CROSS_DOC_TOLERANCE_PERCENT) {
          crossDocPassed++;
          autoPassedCount++;
        } else {
          crossDocFailed++;
          reviewItems.push(crossDocToReviewItem(check, documentId));
        }
        break;
      }
    }
  }

  // ---- Textract comparisons ----
  let textractAgreed = 0;
  let textractDisagreed = 0;

  for (const comparison of textractComparisons) {
    if (comparison.matched) {
      textractAgreed++;
    } else if (comparison.textractValue != null) {
      // Apply tolerance: small Textract vs structured differences are auto-passed
      const absDiff = Math.abs(comparison.difference);
      const pctDiff = percentDiff(comparison.structuredValue, comparison.textractValue);
      if (absDiff <= TEXTRACT_TOLERANCE_ABSOLUTE && pctDiff <= TEXTRACT_TOLERANCE_PERCENT) {
        textractAgreed++;
        autoPassedCount++;
      } else {
        textractDisagreed++;
        reviewItems.push(textractToReviewItem(comparison, documentId));
      }
    }
    // If textractValue is null (field not found in Textract), we skip it —
    // it's informational, not a blocking mismatch.
  }

  // ---- Gate decision ----
  const canProceed = reviewItems.length === 0;

  return {
    canProceed,
    reviewItems,
    autoPassedCount,
    summary: {
      mathChecksPassed,
      mathChecksFailed,
      crossDocPassed,
      crossDocFailed,
      crossDocWarnings,
      textractAgreed,
      textractDisagreed,
    },
  };
}
