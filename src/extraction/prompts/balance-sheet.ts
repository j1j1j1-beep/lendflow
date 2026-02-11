// Balance Sheet Extraction Prompt
// This is the PRIMARY extraction method for Balance Sheets / Statements of
// Financial Position. Textract extracts raw text and tables, then Claude
// structures the data. Balance sheets have no standardized format across
// different businesses, so AI-driven structuring does the heavy lifting here.

export const BALANCE_SHEET_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this Balance Sheet (Statement of Financial Position).

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "businessName": null,
    "asOfDate": null,
    "preparedBy": null,
    "basis": null
  },
  "assets": {
    "currentAssets": {
      "cashAndCashEquivalents": null,
      "checkingAccounts": null,
      "savingsAccounts": null,
      "accountsReceivable_gross": null,
      "allowanceForDoubtfulAccounts": null,
      "accountsReceivable_net": null,
      "inventory": null,
      "rawMaterials": null,
      "workInProgress": null,
      "finishedGoods": null,
      "prepaidExpenses": null,
      "prepaidInsurance": null,
      "prepaidRent": null,
      "shortTermInvestments": null,
      "notesReceivable_current": null,
      "dueFromOfficers_current": null,
      "otherCurrentAssets": null,
      "totalCurrentAssets": null,
      "currentAssetBreakdown": [
        {
          "category": null,
          "amount": null
        }
      ]
    },
    "fixedAssets": {
      "land": null,
      "buildings": null,
      "leaseholdImprovements": null,
      "furnitureAndFixtures": null,
      "machineryAndEquipment": null,
      "vehicles": null,
      "computerEquipment": null,
      "constructionInProgress": null,
      "grossPropertyAndEquipment": null,
      "accumulatedDepreciation": null,
      "netPropertyAndEquipment": null,
      "fixedAssetBreakdown": [
        {
          "category": null,
          "grossAmount": null,
          "accumulatedDepreciation": null,
          "netAmount": null
        }
      ]
    },
    "otherAssets": {
      "goodwill": null,
      "intangibleAssets_gross": null,
      "accumulatedAmortization": null,
      "intangibleAssets_net": null,
      "longTermInvestments": null,
      "notesReceivable_longTerm": null,
      "dueFromOfficers_longTerm": null,
      "deposits": null,
      "deferredTaxAssets": null,
      "otherLongTermAssets": null,
      "totalOtherAssets": null,
      "otherAssetBreakdown": [
        {
          "category": null,
          "amount": null
        }
      ]
    },
    "totalAssets": null
  },
  "liabilities": {
    "currentLiabilities": {
      "accountsPayable": null,
      "accruedExpenses": null,
      "accruedWages": null,
      "accruedTaxes": null,
      "accruedInterest": null,
      "unearnedRevenue": null,
      "currentPortionOfLongTermDebt": null,
      "shortTermNotesPayable": null,
      "lineOfCreditBalance": null,
      "creditCardPayable": null,
      "customerDeposits": null,
      "dueToOfficers_current": null,
      "currentPortionOfCapitalLeases": null,
      "otherCurrentLiabilities": null,
      "totalCurrentLiabilities": null,
      "currentLiabilityBreakdown": [
        {
          "category": null,
          "amount": null
        }
      ]
    },
    "longTermLiabilities": {
      "notesPayable_longTerm": null,
      "mortgagePayable": null,
      "sbaLoanPayable": null,
      "vehicleLoans": null,
      "equipmentLoans": null,
      "capitalLeaseObligations": null,
      "dueToOfficers_longTerm": null,
      "deferredTaxLiabilities": null,
      "deferredRevenue_longTerm": null,
      "otherLongTermLiabilities": null,
      "totalLongTermLiabilities": null,
      "longTermLiabilityBreakdown": [
        {
          "category": null,
          "amount": null
        }
      ]
    },
    "totalLiabilities": null
  },
  "equity": {
    "commonStock": null,
    "preferredStock": null,
    "additionalPaidInCapital": null,
    "retainedEarnings": null,
    "currentYearNetIncome": null,
    "ownerEquity": null,
    "ownerDraws": null,
    "partnerCapital": null,
    "memberCapital": null,
    "treasuryStock": null,
    "accumulatedOtherComprehensiveIncome": null,
    "otherEquity": null,
    "totalEquity": null,
    "equityBreakdown": [
      {
        "category": null,
        "amount": null
      }
    ]
  },
  "totalLiabilitiesAndEquity": null,
  "ratios": {
    "currentRatio": null,
    "quickRatio": null,
    "debtToEquity": null,
    "workingCapital": null,
    "tangibleNetWorth": null
  },
  "priorPeriodComparison": {
    "hasPriorPeriod": false,
    "priorAsOfDate": null,
    "priorTotalAssets": null,
    "priorTotalLiabilities": null,
    "priorTotalEquity": null,
    "assetChangePercent": null,
    "liabilityChangePercent": null,
    "equityChangePercent": null
  },
  "extractionNotes": []
}

FIELD DETAILS:
- "asOfDate": ISO format date YYYY-MM-DD (balance sheets are as of a specific date, not a period)
- "basis": one of "cash", "accrual", or null if not specified
- "currentRatio": totalCurrentAssets / totalCurrentLiabilities (calculate this yourself)
- "quickRatio": (totalCurrentAssets - inventory) / totalCurrentLiabilities (calculate this yourself)
- "debtToEquity": totalLiabilities / totalEquity (calculate this yourself)
- "workingCapital": totalCurrentAssets - totalCurrentLiabilities (calculate this yourself)
- "tangibleNetWorth": totalEquity - goodwill - intangibleAssets_net (calculate this yourself)

CRITICAL RULES:
1. Extract EVERY line item on the balance sheet, even if it doesn't map to a named field — put extra items in the breakdown arrays.
2. THE ACCOUNTING EQUATION MUST BALANCE: totalAssets MUST equal totalLiabilitiesAndEquity. If it doesn't, this is a major red flag — note it prominently in extractionNotes.
3. Verify sub-totals: totalCurrentAssets + netPropertyAndEquipment + totalOtherAssets should equal totalAssets. Note discrepancies.
4. Verify: totalCurrentLiabilities + totalLongTermLiabilities should equal totalLiabilities. Note discrepancies.
5. Verify: totalLiabilities + totalEquity should equal totalLiabilitiesAndEquity. Note discrepancies.
6. If the balance sheet has a prior period comparison column, extract it into priorPeriodComparison.
7. NEVER guess or estimate. If you can't read it, say null.
8. "Due from officers" and "Due to officers" are important for lending — they may indicate related-party transactions. Always capture these.
9. Owner draws / distributions reduce equity and are important for cash flow analysis. Always capture these.
10. SBA loan payable and line of credit balances are critical for understanding existing debt obligations. Always capture these.
11. Calculate ALL ratios yourself. Do not use pre-printed ratios from the document (they may be wrong).
12. Accumulated depreciation should be shown as a positive number (it will be subtracted from gross fixed assets).`;

export const BALANCE_SHEET_VERSION = "balance-sheet-v1";
