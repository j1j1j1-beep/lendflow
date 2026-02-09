// ─── IRS Form 1120 (C-Corporation) Extraction Prompt ──────────────────────────
// FALLBACK prompt for when deterministic line mapping (irs-field-map.ts) fails.
// Used for edge cases: unusual formatting, Schedule L in non-standard layout,
// fields Textract can't identify via key-value pairs, or low-confidence results.
// Claude receives Textract's raw text output and structures it into our schema.

export const FORM_1120_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this IRS Form 1120 (U.S. Corporation Income Tax Return) and its attached schedules.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "taxYear": null,
    "corporationName": null,
    "ein": null,
    "address": null,
    "dateIncorporated": null,
    "totalAssets": null,
    "accountingMethod": null,
    "businessActivityCode": null
  },
  "income": {
    "grossReceipts_line1a": null,
    "returnsAllowances_line1b": null,
    "balanceAfterReturns_line1c": null,
    "costOfGoodsSold_line2": null,
    "grossProfit_line3": null,
    "dividendsReceived_line4": null,
    "interestIncome_line5": null,
    "grossRents_line6": null,
    "grossRoyalties_line7": null,
    "capitalGainNet_line8": null,
    "netGainForm4797_line9": null,
    "otherIncome_line10": null,
    "totalIncome_line11": null
  },
  "deductions": {
    "compensationOfOfficers_line12": null,
    "salariesAndWages_line13": null,
    "repairsAndMaintenance_line14": null,
    "badDebts_line15": null,
    "rents_line16": null,
    "taxesAndLicenses_line17": null,
    "interestExpense_line18": null,
    "charitableContributions_line19": null,
    "depreciationForm4562_line20": null,
    "depletion_line21": null,
    "advertising_line22": null,
    "pensionProfitSharing_line23": null,
    "employeeBenefitPrograms_line24": null,
    "energyEfficientBuildings_line25": null,
    "otherDeductions_line26": null,
    "totalDeductions_line27": null
  },
  "taxableIncome": {
    "taxableIncomeBeforeNOL_line28": null,
    "netOperatingLossDeduction_line29a": null,
    "specialDeductions_line29b": null,
    "totalSpecialDeductions_line29c": null,
    "taxableIncome_line30": null
  },
  "taxAndPayments": {
    "totalTax_line31": null,
    "totalPaymentsAndCredits_line32": null,
    "estimatedTaxPenalty_line33": null,
    "amountOwed_line34": null,
    "overpayment_line35": null,
    "refundedAmount_line36": null,
    "creditToNextYear_line36": null
  },
  "scheduleC": {
    "dividendsFromDomesticCorps": null,
    "dividendsFromForeignCorps": null,
    "dividendsReceivedDeduction": null,
    "totalDividends": null,
    "totalSpecialDeductions": null
  },
  "scheduleJ": {
    "taxRateAmount_line2": null,
    "alternativeMinimumTax_line3": null,
    "totalTax_line4": null,
    "foreignTaxCredit_line5a": null,
    "generalBusinessCredit_line5b": null,
    "priorYearMinimumTax_line5d": null,
    "totalCredits_line5e": null,
    "subtotal_line6": null,
    "personalHoldingCompanyTax_line7": null,
    "recaptureCredits_line8": null,
    "totalTax_line10": null,
    "estimatedTaxPayments_line11": null,
    "overpaymentCredited_line12": null,
    "extensionPayment_line13": null,
    "federalTaxOnFuels_line14": null,
    "totalPayments_line18": null,
    "taxDue_line19": null,
    "overpayment_line20": null
  },
  "scheduleK": {
    "cashDistributions": null,
    "propertyDistributions": null,
    "stockDividends": null
  },
  "scheduleL": {
    "beginningOfYear": {
      "assets": {
        "cash": null,
        "tradeNotesAndReceivables_gross": null,
        "tradeNotesAndReceivables_allowance": null,
        "tradeNotesAndReceivables_net": null,
        "inventories": null,
        "usGovernmentObligations": null,
        "taxExemptSecurities": null,
        "otherCurrentAssets": null,
        "loansToShareholders": null,
        "mortgageAndRealEstate": null,
        "otherInvestments": null,
        "buildingsAndOtherDepreciable_gross": null,
        "buildingsAndOtherDepreciable_accumulatedDepreciation": null,
        "buildingsAndOtherDepreciable_net": null,
        "depletableAssets_gross": null,
        "depletableAssets_accumulatedDepletion": null,
        "depletableAssets_net": null,
        "land": null,
        "intangibleAssets_gross": null,
        "intangibleAssets_accumulatedAmortization": null,
        "intangibleAssets_net": null,
        "otherAssets": null,
        "totalAssets": null
      },
      "liabilitiesAndEquity": {
        "accountsPayable": null,
        "mortgagesNotesPayable_lessThan1Year": null,
        "otherCurrentLiabilities": null,
        "loansFromShareholders": null,
        "mortgagesNotesPayable_1YearOrMore": null,
        "otherLiabilities": null,
        "totalLiabilities": null,
        "capitalStock_preferred": null,
        "capitalStock_common": null,
        "additionalPaidInCapital": null,
        "retainedEarnings_appropriated": null,
        "retainedEarnings_unappropriated": null,
        "adjustmentsToShareholderEquity": null,
        "lessShareholderTreasuryStock": null,
        "totalLiabilitiesAndEquity": null
      }
    },
    "endOfYear": {
      "assets": {
        "cash": null,
        "tradeNotesAndReceivables_gross": null,
        "tradeNotesAndReceivables_allowance": null,
        "tradeNotesAndReceivables_net": null,
        "inventories": null,
        "usGovernmentObligations": null,
        "taxExemptSecurities": null,
        "otherCurrentAssets": null,
        "loansToShareholders": null,
        "mortgageAndRealEstate": null,
        "otherInvestments": null,
        "buildingsAndOtherDepreciable_gross": null,
        "buildingsAndOtherDepreciable_accumulatedDepreciation": null,
        "buildingsAndOtherDepreciable_net": null,
        "depletableAssets_gross": null,
        "depletableAssets_accumulatedDepletion": null,
        "depletableAssets_net": null,
        "land": null,
        "intangibleAssets_gross": null,
        "intangibleAssets_accumulatedAmortization": null,
        "intangibleAssets_net": null,
        "otherAssets": null,
        "totalAssets": null
      },
      "liabilitiesAndEquity": {
        "accountsPayable": null,
        "mortgagesNotesPayable_lessThan1Year": null,
        "otherCurrentLiabilities": null,
        "loansFromShareholders": null,
        "mortgagesNotesPayable_1YearOrMore": null,
        "otherLiabilities": null,
        "totalLiabilities": null,
        "capitalStock_preferred": null,
        "capitalStock_common": null,
        "additionalPaidInCapital": null,
        "retainedEarnings_appropriated": null,
        "retainedEarnings_unappropriated": null,
        "adjustmentsToShareholderEquity": null,
        "lessShareholderTreasuryStock": null,
        "totalLiabilitiesAndEquity": null
      }
    }
  },
  "scheduleM1": {
    "netIncomePerBooks_line1": null,
    "federalIncomeTax_line2": null,
    "excessCapitalLossesOverGains_line3": null,
    "incomeSubjectToTaxNotOnBooks_line4": null,
    "expensesOnBooksNotOnReturn_line5": null,
    "totalAdditions_line6": null,
    "incomeOnReturnNotInBooks_line7": null,
    "deductionsNotOnBooks_line8": null,
    "totalSubtractions_line9": null,
    "incomePerReturn_line10": null
  },
  "scheduleM2": {
    "balanceBeginningOfYear_line1": null,
    "netIncomePerBooks_line2": null,
    "otherIncreases_line3": null,
    "total_line4": null,
    "distributions_cashProperty_line5a": null,
    "distributions_stock_line5b": null,
    "otherDecreases_line6": null,
    "total_line7": null,
    "balanceEndOfYear_line8": null
  },
  "officerCompensation": [
    {
      "name": null,
      "ssn_last4": null,
      "percentTimeDevoted": null,
      "percentStockOwned_common": null,
      "percentStockOwned_preferred": null,
      "compensationAmount": null
    }
  ],
  "costOfGoodsSold": {
    "inventoryBeginning_line1": null,
    "purchases_line2": null,
    "laborCost_line3": null,
    "additionalSection263A_line4": null,
    "otherCosts_line5": null,
    "total_line6": null,
    "inventoryEnding_line7": null,
    "costOfGoodsSold_line8": null,
    "inventoryMethod": null
  },
  "extractionNotes": []
}

CRITICAL RULES:
1. Extract EVERY number you can find on every page and schedule.
2. Schedule L (Balance Sheet) has FOUR columns: Beginning of Year (a/b) and End of Year (c/d). Extract ALL columns.
3. If a number is illegible, set it to null and add a note in extractionNotes.
4. For officer compensation: include ALL officers listed.
5. NEVER guess or estimate. If you can't read it, say null.
6. Verify your own work: check that totalIncome = sum of income lines, totalDeductions = sum of deduction lines, taxableIncome = totalIncome - totalDeductions.
7. Schedule L: totalAssets MUST equal totalLiabilitiesAndEquity for both BOY and EOY. If they don't match, note the discrepancy.
8. Schedule M-1: line 10 should reconcile book income to taxable income. Verify the math.`;

export const FORM_1120_VERSION = "1120-v1";
