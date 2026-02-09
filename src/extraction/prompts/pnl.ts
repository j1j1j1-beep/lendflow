// ─── Profit and Loss Statement Extraction Prompt ──────────────────────────────
// This is the PRIMARY extraction method for P&L / Income Statements.
// Textract extracts raw text and tables, then Claude structures the data.
// P&Ls have no standardized format — every business/accountant uses a different
// layout — so AI-driven structuring does the heavy lifting here.

export const PNL_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this Profit and Loss Statement (Income Statement).

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "businessName": null,
    "periodStart": null,
    "periodEnd": null,
    "periodType": null,
    "preparedBy": null,
    "basis": null
  },
  "revenue": {
    "grossRevenue": null,
    "salesReturnsAndAllowances": null,
    "salesDiscounts": null,
    "netRevenue": null,
    "revenueBreakdown": [
      {
        "category": null,
        "amount": null
      }
    ]
  },
  "costOfGoodsSold": {
    "beginningInventory": null,
    "purchases": null,
    "directLabor": null,
    "directMaterials": null,
    "manufacturingOverhead": null,
    "freightIn": null,
    "endingInventory": null,
    "totalCOGS": null,
    "cogsBreakdown": [
      {
        "category": null,
        "amount": null
      }
    ]
  },
  "grossProfit": null,
  "grossProfitMargin": null,
  "operatingExpenses": {
    "salariesAndWages": null,
    "officerCompensation": null,
    "payrollTaxes": null,
    "employeeBenefits": null,
    "rent": null,
    "utilities": null,
    "insurance": null,
    "officeExpenses": null,
    "advertising": null,
    "professionalFees": null,
    "legal": null,
    "accounting": null,
    "repairs": null,
    "maintenance": null,
    "depreciation": null,
    "amortization": null,
    "travel": null,
    "meals": null,
    "entertainment": null,
    "vehicleExpenses": null,
    "bankCharges": null,
    "interest": null,
    "taxesAndLicenses": null,
    "badDebtExpense": null,
    "charitableContributions": null,
    "education": null,
    "subscriptions": null,
    "telephone": null,
    "internet": null,
    "software": null,
    "contractLabor": null,
    "commissionsAndFees": null,
    "otherExpenses": null,
    "totalOperatingExpenses": null,
    "expenseBreakdown": [
      {
        "category": null,
        "amount": null
      }
    ]
  },
  "operatingIncome": null,
  "otherIncomeAndExpenses": {
    "interestIncome": null,
    "interestExpense": null,
    "gainOnSaleOfAssets": null,
    "lossOnSaleOfAssets": null,
    "otherIncome": null,
    "otherExpenses": null,
    "totalOtherNet": null
  },
  "incomeBeforeTax": null,
  "incomeTaxExpense": null,
  "netIncome": null,
  "netIncomeMargin": null,
  "addBacks": {
    "depreciation": null,
    "amortization": null,
    "interestExpense": null,
    "ownerCompensation": null,
    "oneTimeExpenses": null,
    "nonRecurringItems": null,
    "personalExpenses": null,
    "totalAddBacks": null,
    "adjustedNetIncome": null,
    "addBackDetails": [
      {
        "description": null,
        "amount": null,
        "reason": null
      }
    ]
  },
  "ebitda": null,
  "priorPeriodComparison": {
    "hasPriorPeriod": false,
    "priorPeriodStart": null,
    "priorPeriodEnd": null,
    "priorGrossRevenue": null,
    "priorNetIncome": null,
    "revenueGrowthPercent": null,
    "netIncomeGrowthPercent": null
  },
  "extractionNotes": []
}

FIELD DETAILS:
- "periodType": one of "monthly", "quarterly", "annual", "ytd", "custom"
- "basis": one of "cash", "accrual", or null if not specified
- "grossProfitMargin": calculated as grossProfit / netRevenue (as a decimal, e.g., 0.45 for 45%)
- "netIncomeMargin": calculated as netIncome / netRevenue (as a decimal)
- "ebitda": netIncome + interestExpense + incomeTaxExpense + depreciation + amortization
- "revenueBreakdown": If the P&L breaks revenue into categories, list each one
- "cogsBreakdown": If COGS is broken into line items beyond the standard fields, list each one
- "expenseBreakdown": List ALL expense line items from the P&L, even if they map to a named field above. This ensures we capture everything.

ADD-BACKS (Critical for Lending):
The addBacks section identifies expenses that should be added back to net income for cash flow analysis:
- "depreciation": Non-cash expense (always add back)
- "amortization": Non-cash expense (always add back)
- "interestExpense": Added back because the new loan will have different interest
- "ownerCompensation": If officer/owner compensation appears unusually high, flag the total amount (we don't auto-adjust — humans review this)
- "oneTimeExpenses": Any clearly one-time/non-recurring expenses (lawsuit settlement, moving costs, etc.)
- "nonRecurringItems": Other non-recurring items
- "personalExpenses": Expenses that appear to be personal rather than business (flagged for review)
- "adjustedNetIncome": netIncome + totalAddBacks

CRITICAL RULES:
1. Extract EVERY line item on the P&L, even if it doesn't map to a named field — put extra items in the breakdown arrays.
2. All dates must be in ISO format: YYYY-MM-DD.
3. Verify: grossProfit = netRevenue - totalCOGS. If it doesn't match, note in extractionNotes.
4. Verify: operatingIncome = grossProfit - totalOperatingExpenses. If it doesn't match, note.
5. Verify: netIncome = operatingIncome + totalOtherNet - incomeTaxExpense. If it doesn't match, note.
6. If there's a prior period comparison column, extract it into priorPeriodComparison.
7. NEVER guess or estimate. If you can't read it, say null.
8. If the P&L has quarterly or monthly columns, extract the TOTAL/ANNUAL column. Note per-period data in extractionNotes.
9. Officer/owner compensation is one of the most important fields for lending — search the entire document for it.
10. Calculate EBITDA yourself and verify it against the stated value if one is given.`;

export const PNL_VERSION = "pnl-v1";
