// =============================================================================
// textract-vs-structured.ts
// Compares every numerical field in Claude's structured extraction output
// against Textract's raw key-value pairs. ZERO AI. Pure deterministic matching.
// =============================================================================

const ABSOLUTE_TOLERANCE = 1; // $1 for rounding differences

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextractComparison {
  fieldPath: string;
  structuredValue: number;
  textractValue: number | null;
  textractKey: string | null;
  matched: boolean;
  difference: number;
  page?: number;
}

export interface TextractKeyValuePair {
  key: string;
  value: string;
  confidence: number;
  page: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Flatten a nested object into dot-separated paths with their values.
 * Only includes paths whose values are finite numbers.
 *
 * Example:
 *   { income: { wages: 50000, interest: 100 } }
 *   => [{ path: "income.wages", value: 50000 }, { path: "income.interest", value: 100 }]
 */
export function flattenObject(
  obj: any,
  prefix: string = ""
): Array<{ path: string; value: number }> {
  const results: Array<{ path: string; value: number }> = [];

  if (obj == null || typeof obj !== "object") return results;

  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (val == null) continue;

    if (typeof val === "number" && Number.isFinite(val)) {
      results.push({ path: fullPath, value: val });
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const item = val[i];
        if (typeof item === "number" && Number.isFinite(item)) {
          results.push({ path: `${fullPath}[${i}]`, value: item });
        } else if (typeof item === "object" && item != null) {
          results.push(...flattenObject(item, `${fullPath}[${i}]`));
        }
      }
    } else if (typeof val === "object") {
      results.push(...flattenObject(val, fullPath));
    }
  }

  return results;
}

/**
 * Parse a string as a number, handling common formatting:
 * - Remove dollar signs, commas, parentheses (negative)
 * - Handle percentages
 */
function parseNumericValue(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;

  let cleaned = raw.trim();

  // Handle parentheses as negative: (1,234) => -1234
  const isNegative = cleaned.startsWith("(") && cleaned.endsWith(")");
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove currency symbols and commas
  cleaned = cleaned.replace(/[$,]/g, "").trim();

  // Handle percentage
  const isPercent = cleaned.endsWith("%");
  if (isPercent) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;

  let result = isNegative ? -num : num;
  if (isPercent) {
    result = result / 100;
  }

  return result;
}

// ---------------------------------------------------------------------------
// IRS Field Mapping
// Maps structured field paths to known IRS form line labels as they appear
// in Textract output.
// ---------------------------------------------------------------------------

const IRS_FIELD_MAP: Record<string, string[]> = {
  // 1040
  "income.wages_line1": ["1", "Wages, salaries, tips", "Line 1"],
  "income.taxableInterest_line2b": ["2b", "Taxable interest", "Line 2b"],
  "income.ordinaryDividends_line3b": ["3b", "Ordinary dividends", "Line 3b"],
  "income.capitalGain_line7": ["7", "Capital gain or (loss)", "Line 7"],
  "income.otherIncome_line8": ["8", "Other income", "Line 8"],
  "income.totalIncome_line9": ["9", "Total income", "Line 9"],
  "income.adjustments_line10": ["10", "Adjustments to income", "Line 10"],
  "income.agi_line11": ["11", "Adjusted gross income", "Line 11"],
  "income.standardOrItemized_line12": ["12", "Standard deduction or itemized", "Line 12"],
  "income.qbi_line13a": ["13a", "Qualified business income", "Line 13a"],
  "income.totalDeductions_line14": ["14", "Total deductions", "Line 14"],
  "income.taxableIncome_line15": ["15", "Taxable income", "Line 15"],
  "tax.totalTax_line24": ["24", "Total tax", "Line 24"],
  "tax.federalWithholding_line25a": ["25a", "Federal income tax withheld", "Line 25a"],
  "tax.totalPayments_line33": ["33", "Total payments", "Line 33"],

  // Schedule C
  "scheduleC.grossReceipts_line1": ["1", "Gross receipts", "Line 1"],
  "scheduleC.grossProfit_line5": ["5", "Gross profit", "Line 5"],
  "scheduleC.grossIncome_line7": ["7", "Gross income", "Line 7"],
  "scheduleC.totalExpenses_line28": ["28", "Total expenses", "Line 28"],
  "scheduleC.netProfit_line31": ["31", "Net profit or (loss)", "Line 31"],

  // 1120
  "income.grossReceipts_line1a": ["1a", "Gross receipts", "Line 1a"],
  "income.balanceAfterReturns_line1c": ["1c", "Balance", "Line 1c"],
  "income.costOfGoodsSold_line2": ["2", "Cost of goods sold", "Line 2"],
  "income.grossProfit_line3": ["3", "Gross profit", "Line 3"],
  "income.totalIncome_line11": ["11", "Total income", "Line 11"],
  "deductions.totalDeductions_line27": ["27", "Total deductions", "Line 27"],
  "taxableIncome.taxableIncomeBeforeNOL_line28": ["28", "Taxable income before NOL", "Line 28"],
  "taxableIncome.taxableIncome_line30": ["30", "Taxable income", "Line 30"],

  // 1120S
  "income.totalIncome_line6": ["6", "Total income (loss)", "Line 6"],
  "deductions.totalDeductions_line21": ["21", "Total deductions", "Line 21"],
  "ordinaryBusinessIncome_line22": ["22", "Ordinary business income", "Line 22"],

  // 1065
  "income.totalIncome_line8": ["8", "Total income (loss)", "Line 8"],
  "deductions.totalDeductions_line22": ["22", "Total deductions", "Line 22"],
  "ordinaryBusinessIncome_line23": ["23", "Ordinary business income", "Line 23"],
};

// ---------------------------------------------------------------------------
// Fuzzy matching for non-standard documents
// ---------------------------------------------------------------------------

/**
 * Normalized key for comparison: lowercase, stripped of punctuation/spaces.
 */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Map of common Textract key phrases to structured field path segments.
 */
const FUZZY_MAP: Array<{ textractPatterns: string[]; fieldPatterns: string[] }> = [
  // Bank statements
  { textractPatterns: ["total deposits", "deposits total"], fieldPatterns: ["totaldeposits"] },
  { textractPatterns: ["total withdrawals", "withdrawals total", "total debits"], fieldPatterns: ["totalwithdrawals"] },
  { textractPatterns: ["beginning balance", "opening balance", "previous balance"], fieldPatterns: ["beginningbalance"] },
  { textractPatterns: ["ending balance", "closing balance", "new balance"], fieldPatterns: ["endingbalance"] },

  // P&L
  { textractPatterns: ["gross profit", "gross margin"], fieldPatterns: ["grossprofit"] },
  { textractPatterns: ["net income", "net profit", "net earnings"], fieldPatterns: ["netincome"] },
  { textractPatterns: ["operating income", "income from operations"], fieldPatterns: ["operatingincome"] },
  { textractPatterns: ["total revenue", "net revenue", "gross revenue", "total sales"], fieldPatterns: ["netrevenue", "totalrevenue", "grossrevenue", "revenue"] },
  { textractPatterns: ["cost of goods sold", "cogs", "cost of sales"], fieldPatterns: ["costofgoodssold", "cogs", "cogstotal"] },
  { textractPatterns: ["operating expenses", "total operating expenses"], fieldPatterns: ["operatingexpenses", "totaloperatingexpenses"] },

  // Balance sheet
  { textractPatterns: ["total assets"], fieldPatterns: ["totalassets"] },
  { textractPatterns: ["total liabilities"], fieldPatterns: ["totalliabilities"] },
  { textractPatterns: ["total equity", "shareholders equity", "stockholders equity"], fieldPatterns: ["totalequity", "totalshareholdersequity"] },
  { textractPatterns: ["total current assets"], fieldPatterns: ["totalcurrentassets"] },
  { textractPatterns: ["total current liabilities"], fieldPatterns: ["totalcurrentliabilities"] },
  { textractPatterns: ["total liabilities and equity", "total liabilities & equity"], fieldPatterns: ["totalliabilitiesandequity"] },
  { textractPatterns: ["retained earnings"], fieldPatterns: ["retainedearnings"] },
  { textractPatterns: ["accumulated depreciation"], fieldPatterns: ["accumulateddepreciation"] },

  // Rent roll
  { textractPatterns: ["total monthly rent", "monthly rent total"], fieldPatterns: ["totalmonthlyrent"] },
  { textractPatterns: ["total annual rent", "annual rent total"], fieldPatterns: ["totalannualrent"] },
  { textractPatterns: ["occupancy rate", "occupancy"], fieldPatterns: ["occupancyrate"] },
  { textractPatterns: ["total units"], fieldPatterns: ["totalunits"] },
];

/**
 * Returns true if a Textract key could correspond to the given structured field path.
 * Checks:
 *   1. IRS field map (for tax forms)
 *   2. Fuzzy map (for non-standard docs)
 *   3. Direct normalized substring match
 */
export function fuzzyMatchKey(textractKey: string, fieldPath: string): boolean {
  // 1. Check IRS field map
  const irsLabels = IRS_FIELD_MAP[fieldPath];
  if (irsLabels) {
    const normalizedTextract = normalizeKey(textractKey);
    for (const label of irsLabels) {
      if (normalizedTextract.includes(normalizeKey(label))) {
        return true;
      }
    }
  }

  // 2. Check fuzzy map
  const normalizedTextract = normalizeKey(textractKey);
  const normalizedField = normalizeKey(fieldPath.split(".").pop() || fieldPath);

  for (const entry of FUZZY_MAP) {
    const textractMatch = entry.textractPatterns.some(
      (p) => normalizedTextract.includes(normalizeKey(p))
    );
    const fieldMatch = entry.fieldPatterns.some(
      (p) => normalizedField.includes(p) || p.includes(normalizedField)
    );
    if (textractMatch && fieldMatch) {
      return true;
    }
  }

  // 3. Direct substring match: if the last segment of the field path is
  //    contained in the textract key (or vice versa), consider it a match
  const fieldTail = normalizedField;
  if (fieldTail.length >= 4) {
    if (normalizedTextract.includes(fieldTail) || fieldTail.includes(normalizedTextract)) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main comparison function
// ---------------------------------------------------------------------------

export function compareTextractVsStructured(
  docType: string,
  structuredData: any,
  textractKeyValuePairs: TextractKeyValuePair[]
): TextractComparison[] {
  if (!structuredData || !textractKeyValuePairs || textractKeyValuePairs.length === 0) {
    return [];
  }

  const flatFields = flattenObject(structuredData);
  const comparisons: TextractComparison[] = [];

  // Pre-parse all Textract values once
  const parsedTextract = textractKeyValuePairs.map((kvp) => ({
    ...kvp,
    numericValue: parseNumericValue(kvp.value),
  }));

  for (const field of flatFields) {
    // Skip zero values and non-financial fields
    if (field.value === 0) continue;
    if (isMetadataField(field.path)) continue;

    let bestMatch: {
      textractValue: number;
      textractKey: string;
      difference: number;
      page: number;
    } | null = null;

    for (const kvp of parsedTextract) {
      if (kvp.numericValue == null) continue;

      // Check if this Textract key matches the structured field
      if (!fuzzyMatchKey(kvp.key, field.path)) continue;

      const diff = Math.abs(field.value - kvp.numericValue);

      // Take the closest match
      if (!bestMatch || diff < bestMatch.difference) {
        bestMatch = {
          textractValue: kvp.numericValue,
          textractKey: kvp.key,
          difference: diff,
          page: kvp.page,
        };
      }
    }

    if (bestMatch) {
      comparisons.push({
        fieldPath: field.path,
        structuredValue: field.value,
        textractValue: bestMatch.textractValue,
        textractKey: bestMatch.textractKey,
        matched: bestMatch.difference <= ABSOLUTE_TOLERANCE,
        difference: Math.round(bestMatch.difference * 100) / 100,
        page: bestMatch.page,
      });
    } else {
      // No Textract key-value pair found for this field
      comparisons.push({
        fieldPath: field.path,
        structuredValue: field.value,
        textractValue: null,
        textractKey: null,
        matched: false,
        difference: Math.abs(field.value),
      });
    }
  }

  return comparisons;
}

/**
 * Returns true for field paths that are metadata (not financial values).
 * These should not be compared against Textract.
 */
function isMetadataField(path: string): boolean {
  const metadataSegments = [
    "page", "confidence", "status", "type", "name", "address",
    "ein", "ssn", "tin", "filingStatus", "taxYear", "year", "month",
    "businessCode", "accountNumber", "routingNumber", "description",
    "label", "category", "date", "id", "index", "count", "unit",
  ];

  const lastSegment = path.split(".").pop()?.replace(/\[\d+\]$/, "") ?? "";
  return metadataSegments.some((m) =>
    lastSegment.toLowerCase() === m.toLowerCase() ||
    lastSegment.toLowerCase().startsWith(m.toLowerCase() + "_") ||
    lastSegment.toLowerCase().endsWith("_" + m.toLowerCase())
  );
}
