// ─── Textract Lending API Field Mapper ────────────────────────────────────────
// Maps Textract Lending's standardized field names (the `Type` field on each
// LendingField) to our Zod schema dot-paths. Textract Lending returns
// well-structured fields for IRS tax forms (1040, W-2), so we can map them
// deterministically without Claude.
//
// Bank statements come from Textract Lending as ExpenseDocuments (not
// LendingDocuments with LendingFields), so they still require Claude for
// structuring.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LendingFieldInput {
  type: string;       // Textract Lending field name (e.g. "WAGES_TIPS_OTHER_COMP")
  value: string;      // raw value from Textract
  confidence: number; // 0-100 confidence score
}

export interface LendingMappingResult {
  mapped: Record<string, unknown>;  // nested object matching our Zod schema shape
  unmappedFields: string[];         // Textract field types we couldn't map
  mappedCount: number;
  totalFields: number;
}

// ─── Supported Page Types ────────────────────────────────────────────────────
// Only IRS forms with LendingFields are supported. Bank statements arrive as
// ExpenseDocuments and need Claude extraction.

export const LENDING_SUPPORTED_TYPES = new Set(["1040", "W-2", "W2"]);

// ─── Form 1040 Mapping ──────────────────────────────────────────────────────
// Textract Lending field Type -> our 1040.schema.ts dot-path

const FORM_1040_LENDING_MAP: Record<string, string> = {
  // Income fields
  "WAGES_TIPS_OTHER_COMP": "income.wages_line1",
  "WAGES_TIPS": "income.wages_line1",
  "TAX_EXEMPT_INTEREST": "income.taxExemptInterest_line2a",
  "TAXABLE_INTEREST": "income.taxableInterest_line2b",
  "QUALIFIED_DIVIDENDS": "income.qualifiedDividends_line3a",
  "ORDINARY_DIVIDENDS": "income.ordinaryDividends_line3b",
  "IRA_DISTRIBUTIONS": "income.iraDistributions_line4a",
  "IRA_DISTRIBUTIONS_TAXABLE": "income.taxableIra_line4b",
  "PENSIONS_ANNUITIES": "income.pensions_line5a",
  "PENSIONS_ANNUITIES_TAXABLE": "income.taxablePensions_line5b",
  "SOCIAL_SECURITY_BENEFITS": "income.socialSecurity_line6a",
  "SOCIAL_SECURITY_BENEFITS_TAXABLE": "income.taxableSocialSecurity_line6b",
  "CAPITAL_GAIN_OR_LOSS": "income.capitalGain_line7",
  "OTHER_INCOME": "income.otherIncome_line8",
  "TOTAL_INCOME": "income.totalIncome_line9",
  "ADJUSTMENTS_TO_INCOME": "income.adjustments_line10",
  "ADJUSTED_GROSS_INCOME": "income.agi_line11",
  "STANDARD_DEDUCTION_OR_ITEMIZED": "income.standardOrItemized_line12",
  "STANDARD_DEDUCTION": "income.standardOrItemized_line12",
  "QUALIFIED_BUSINESS_INCOME_DEDUCTION": "income.qbi_line13a",
  "TOTAL_DEDUCTIONS": "income.totalDeductions_line14",
  "TAXABLE_INCOME": "income.taxableIncome_line15",

  // Tax fields
  "TAX": "tax.taxBeforeCredits_line16",
  "TOTAL_TAX": "tax.totalTax_line24",
  "TOTAL_PAYMENTS": "tax.totalPayments_line33",
  "OVERPAID": "tax.overpaid_line34",
  "AMOUNT_YOU_OWE": "tax.amountOwed_line37",
  "AMOUNT_OWED": "tax.amountOwed_line37",
  // Federal withholding is a COMPONENT of total payments (line 25a), NOT line 33
  "FEDERAL_INCOME_TAX_WITHHELD": "tax.federalWithholding_line25a",

  // Metadata
  "FILING_STATUS": "metadata.filingStatus",
  "TAX_YEAR": "metadata.taxYear",
  "TAXPAYER_NAME": "metadata.taxpayerName",
  "SPOUSE_NAME": "metadata.spouseName",
  "SSN": "metadata.ssn_last4",
  "ADDRESS": "metadata.address",
};

// ─── W-2 Mapping ─────────────────────────────────────────────────────────────
// Textract Lending field Type -> our w2.schema.ts dot-path

const W2_LENDING_MAP: Record<string, string> = {
  // Metadata
  "EMPLOYER_NAME": "metadata.employerName",
  "EMPLOYER_EIN": "metadata.employerEIN",
  "EMPLOYER_ADDRESS": "metadata.employerAddress",
  "EMPLOYEE_NAME": "metadata.employeeName",
  "EMPLOYEE_SSN": "metadata.employeeSSN_last4",
  "EMPLOYEE_ADDRESS": "metadata.employeeAddress",
  "TAX_YEAR": "metadata.taxYear",

  // Wage / compensation boxes
  "WAGES_TIPS_OTHER_COMP": "wages.wagesTipsOther_box1",
  "WAGES_TIPS": "wages.wagesTipsOther_box1",
  "FEDERAL_INCOME_TAX_WITHHELD": "wages.federalIncomeTaxWithheld_box2",
  "SOCIAL_SECURITY_WAGES": "wages.socialSecurityWages_box3",
  "SOCIAL_SECURITY_TAX_WITHHELD": "wages.socialSecurityTaxWithheld_box4",
  "MEDICARE_WAGES_TIPS": "wages.medicareWages_box5",
  "MEDICARE_WAGES": "wages.medicareWages_box5",
  "MEDICARE_TAX_WITHHELD": "wages.medicareTaxWithheld_box6",
  "SOCIAL_SECURITY_TIPS": "wages.socialSecurityTips_box7",
  "ALLOCATED_TIPS": "wages.allocatedTips_box8",
  "DEPENDENT_CARE_BENEFITS": "wages.dependentCareBenefits_box10",

  // State / local
  "STATE": "stateTaxInfo.state",
  "STATE_WAGES": "stateTaxInfo.stateWages_box16",
  "STATE_INCOME_TAX": "stateTaxInfo.stateIncomeTax_box17",
  "LOCAL_WAGES": "localTaxInfo.localWages_box18",
  "LOCAL_INCOME_TAX": "localTaxInfo.localIncomeTax_box19",
};

// ─── Lookup table: page type -> field map ────────────────────────────────────

const LENDING_MAPS: Record<string, Record<string, string>> = {
  "1040": FORM_1040_LENDING_MAP,
  "W-2": W2_LENDING_MAP,
  "W2": W2_LENDING_MAP,
};

// ─── String-valued field detection ───────────────────────────────────────────
// Schema paths whose leaf values should remain as strings (not parsed as
// dollar amounts). We match on the final segment of the dot-path.

const STRING_FIELD_SUFFIXES = new Set([
  "filingStatus",
  "taxpayerName",
  "spouseName",
  "ssn_last4",
  "address",
  "employerName",
  "employerEIN",
  "employerAddress",
  "employeeName",
  "employeeSSN_last4",
  "employeeAddress",
  "state",
]);

function isStringField(schemaPath: string): boolean {
  const leaf = schemaPath.split(".").pop() ?? "";
  return STRING_FIELD_SUFFIXES.has(leaf);
}

// ─── Dollar Parsing ──────────────────────────────────────────────────────────

/**
 * Parse a dollar/numeric string into a number.
 * - Strips $, commas, whitespace
 * - Handles parenthetical negatives: "(5,000)" -> -5000
 * - Handles leading minus: "-5,000" -> -5000
 * - Returns null for non-numeric strings, empty values, "N/A", etc.
 */
function parseDollar(value: string): number | null {
  if (!value) return null;

  let cleaned = value.trim();
  if (cleaned === "" || cleaned === "-" || cleaned.toUpperCase() === "N/A") {
    return null;
  }

  let negative = false;

  // Parenthetical negatives: (5,000) = -5000
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Leading minus
  if (cleaned.startsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }

  // Remove $, commas, spaces
  cleaned = cleaned.replace(/[$,\s]/g, "");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return negative ? -num : num;
}

// ─── Nested Object Builder ───────────────────────────────────────────────────

/**
 * Set a value at a dot-separated path in a nested object.
 * Creates intermediate objects as needed.
 *
 * Example: setNestedValue(obj, "income.wages_line1", 85000)
 * Result:  obj = { income: { wages_line1: 85000 } }
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    if (typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

// ─── Main Mapping Function ───────────────────────────────────────────────────

/**
 * Map Textract Lending fields to our Zod schema shape for a given page type.
 *
 * @param pageType - Document type from Textract Lending (e.g. "1040", "W-2")
 * @param lendingFields - Array of fields from Textract Lending response
 * @returns Nested object matching schema shape, plus mapping diagnostics
 */
export function mapLendingFieldsToSchema(
  pageType: string,
  lendingFields: LendingFieldInput[],
): LendingMappingResult {
  const fieldMap = LENDING_MAPS[pageType];

  if (!fieldMap) {
    return {
      mapped: {},
      unmappedFields: lendingFields.map((f) => f.type),
      mappedCount: 0,
      totalFields: lendingFields.length,
    };
  }

  const mapped: Record<string, unknown> = {};
  const unmappedFields: string[] = [];
  let mappedCount = 0;

  for (const field of lendingFields) {
    // Skip fields with empty values
    if (!field.value || field.value.trim() === "") {
      continue;
    }

    const schemaPath = fieldMap[field.type];
    if (!schemaPath) {
      unmappedFields.push(field.type);
      continue;
    }

    // Determine the value: string fields stay as-is, numeric fields get parsed
    let resolvedValue: unknown;
    if (isStringField(schemaPath)) {
      resolvedValue = field.value.trim();
    } else {
      // taxYear is numeric in the schema even though it looks like metadata
      const parsed = parseDollar(field.value);
      resolvedValue = parsed;
    }

    // Only set if we got a usable value
    if (resolvedValue !== null && resolvedValue !== undefined) {
      setNestedValue(mapped, schemaPath, resolvedValue);
      mappedCount++;
    }
  }

  return {
    mapped,
    unmappedFields,
    mappedCount,
    totalFields: lendingFields.length,
  };
}
