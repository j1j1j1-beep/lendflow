// IRS Form 1040 Extraction Prompt
// FALLBACK prompt for when deterministic line mapping (irs-field-map.ts) fails.
// Used for edge cases: unusual formatting, schedules in non-standard order,
// fields Textract can't identify via key-value pairs, or low-confidence results.
// Claude receives Textract's raw text output and structures it into our schema.

export const FORM_1040_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this IRS Form 1040 (U.S. Individual Income Tax Return) and its attached schedules.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "taxYear": 2023,
    "filingStatus": "married_filing_jointly",
    "taxpayerName": "John A. Smith",
    "spouseName": "Jane B. Smith",
    "ssn_last4": "1234",
    "address": "123 Main St, Anytown, ST 12345"
  },
  "income": {
    "wages_line1": null,
    "taxExemptInterest_line2a": null,
    "taxableInterest_line2b": null,
    "qualifiedDividends_line3a": null,
    "ordinaryDividends_line3b": null,
    "iraDistributions_line4a": null,
    "taxableIra_line4b": null,
    "pensions_line5a": null,
    "taxablePensions_line5b": null,
    "socialSecurity_line6a": null,
    "taxableSocialSecurity_line6b": null,
    "capitalGain_line7": null,
    "otherIncome_line8": null,
    "totalIncome_line9": null,
    "adjustments_line10": null,
    "agi_line11": null,
    "standardOrItemized_line12": null,
    "qbi_line13a": null,
    "totalDeductions_line14": null,
    "taxableIncome_line15": null
  },
  "scheduleC": [
    {
      "businessName": null,
      "principalCode": null,
      "grossReceipts_line1": null,
      "returnsAndAllowances_line2": null,
      "cogs_line4": null,
      "grossProfit_line5": null,
      "otherIncome_line6": null,
      "grossIncome_line7": null,
      "totalExpenses_line28": null,
      "netProfit_line31": null,
      "expenses": {
        "advertising": null,
        "carAndTruck": null,
        "commissions": null,
        "contractLabor": null,
        "depletion": null,
        "depreciation_line13": null,
        "employeeBenefits": null,
        "insurance": null,
        "interestMortgage": null,
        "interestOther": null,
        "legal": null,
        "officeExpense": null,
        "pensionPlans": null,
        "rent": null,
        "repairs": null,
        "supplies": null,
        "taxes": null,
        "travel": null,
        "meals": null,
        "utilities": null,
        "wages": null,
        "otherExpenses": null
      }
    }
  ],
  "scheduleD": {
    "shortTermGainLoss": null,
    "longTermGainLoss": null,
    "netCapitalGainLoss": null
  },
  "scheduleE": {
    "properties": [
      {
        "address": null,
        "propertyType": null,
        "fairRentalDays": null,
        "personalUseDays": null,
        "rentsReceived": null,
        "advertising": null,
        "auto": null,
        "cleaning": null,
        "commissions": null,
        "insurance": null,
        "legal": null,
        "management": null,
        "mortgageInterest": null,
        "otherInterest": null,
        "repairs": null,
        "supplies": null,
        "taxes": null,
        "utilities": null,
        "depreciation": null,
        "other": null,
        "totalExpenses": null,
        "netRentalIncome": null
      }
    ],
    "totalRentalIncome_line26": null,
    "partnershipSCorpIncome": [
      {
        "entityName": null,
        "entityType": null,
        "passiveIncome": null,
        "nonPassiveIncome": null,
        "passiveLoss": null,
        "nonPassiveLoss": null
      }
    ]
  },
  "scheduleSE": {
    "netEarnings": null,
    "selfEmploymentTax": null
  },
  "w2Summary": [
    {
      "employer": null,
      "ein_last4": null,
      "wages_box1": null,
      "federalWithholding_box2": null,
      "socialSecurityWages_box3": null,
      "medicareWages_box5": null
    }
  ],
  "deductions": {
    "type": "standard",
    "amount": null,
    "scheduleA": {
      "medicalDental": null,
      "stateLocalTaxes": null,
      "mortgageInterest": null,
      "charitableContributions": null,
      "totalItemized": null
    }
  },
  "tax": {
    "taxBeforeCredits_line16": null,
    "totalCredits": null,
    "otherTaxes_line23": null,
    "totalTax_line24": null,
    "federalWithholding_line25a": null,
    "totalPayments_line33": null,
    "overpaid_line34": null,
    "amountOwed_line37": null
  },
  "extractionNotes": []
}

CRITICAL RULES:
1. Extract EVERY number you can find on every page and schedule.
2. If a form has multiple years, create entries for EACH year.
3. If a number is illegible, set it to null and add a note in extractionNotes.
4. For Schedule C: if there are multiple businesses, include ALL in the array.
5. For Schedule E: if there are multiple properties, include ALL.
6. W-2 summary: include ALL W-2s attached.
7. NEVER guess or estimate. If you can't read it, say null.
8. Verify your own work: check that grossProfit = grossReceipts - COGS, that totalIncome sums correctly, etc.`;

export const FORM_1040_VERSION = "1040-v1";
