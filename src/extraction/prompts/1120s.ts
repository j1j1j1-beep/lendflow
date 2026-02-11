// IRS Form 1120-S (S-Corporation) Extraction Prompt
// FALLBACK prompt for when deterministic line mapping (irs-field-map.ts) fails.
// Used for edge cases: unusual formatting, Schedule K in non-standard layout,
// fields Textract can't identify via key-value pairs, or low-confidence results.
// Claude receives Textract's raw text output and structures it into our schema.

export const FORM_1120S_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this IRS Form 1120-S (U.S. Income Tax Return for an S Corporation) and its attached schedules.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "taxYear": null,
    "corporationName": null,
    "ein": null,
    "address": null,
    "dateIncorporated": null,
    "dateSElectionEffective": null,
    "totalAssets": null,
    "accountingMethod": null,
    "businessActivityCode": null,
    "numberOfShareholders": null
  },
  "income": {
    "grossReceipts_line1a": null,
    "returnsAllowances_line1b": null,
    "balanceAfterReturns_line1c": null,
    "costOfGoodsSold_line2": null,
    "grossProfit_line3": null,
    "netGainForm4797_line4": null,
    "otherIncome_line5": null,
    "totalIncome_line6": null
  },
  "deductions": {
    "compensationOfOfficers_line7": null,
    "salariesAndWages_line8": null,
    "repairsAndMaintenance_line9": null,
    "badDebts_line10": null,
    "rents_line11": null,
    "taxesAndLicenses_line12": null,
    "interestExpense_line13": null,
    "depreciationNotOnForm4562_line14a": null,
    "depreciationFromForm4562_line14b": null,
    "totalDepreciation_line14c": null,
    "depletion_line15": null,
    "advertising_line16": null,
    "pensionProfitSharing_line17": null,
    "employeeBenefitPrograms_line18": null,
    "energyEfficientBuildings_line19": null,
    "otherDeductions_line20": null,
    "totalDeductions_line21": null
  },
  "ordinaryBusinessIncome_line22": null,
  "taxAndPayments": {
    "excessNetPassiveIncomeTax_line23a": null,
    "builtInGainsTax_line23b": null,
    "totalTax_line23c": null,
    "estimatedTaxPayments_line24a": null,
    "taxDeposited_line24b": null,
    "creditForFederalTaxOnFuels_line24c": null,
    "totalPayments_line24d": null,
    "estimatedTaxPenalty_line25": null,
    "amountOwed_line26": null,
    "overpayment_line27": null,
    "creditToNextYear_line28": null
  },
  "scheduleK": {
    "incomeAndLoss": {
      "ordinaryBusinessIncome_line1": null,
      "netRentalRealEstateIncome_line2": null,
      "otherNetRentalIncome_line3": null,
      "interestIncome_line4": null,
      "ordinaryDividends_line5a": null,
      "qualifiedDividends_line5b": null,
      "royalties_line6": null,
      "netShortTermCapitalGain_line7": null,
      "netLongTermCapitalGain_line8a": null,
      "collectiblesGain_line8b": null,
      "unrealizedSection1250Gain_line8c": null,
      "netSection1231Gain_line9": null,
      "otherIncome_line10": null
    },
    "deductions": {
      "section179Deduction_line11": null,
      "otherDeductions_line12a": null,
      "charitableContributions_line12a_detail": null
    },
    "credits": {
      "lowIncomeHousingCredit_line13a": null,
      "lowIncomeHousingCredit_other_line13b": null,
      "qualifiedRehabExpenses_line13c": null,
      "otherRentalRealEstateCredits_line13d": null,
      "otherRentalCredits_line13e": null,
      "otherCredits_line13f": null
    },
    "foreignTransactions": {
      "foreignCountry": null,
      "grossIncomeForeign_line14a": null,
      "foreignTaxesPaid_line14l": null,
      "foreignTaxesAccrued_line14m": null
    },
    "alternativeMinimumTax": {
      "amtAdjustments_line15a": null,
      "amtAdjustmentsPost2017_line15b": null,
      "depletionAdjustment_line15c": null,
      "amtOilGasDeduction_line15d": null,
      "otherAMTItems_line15e": null
    },
    "distributions": {
      "cashAndMarketableSecurities_line16a": null,
      "propertyDistributions_line16b": null,
      "repaymentOfLoansFromShareholders_line16c": null
    },
    "otherItems": {
      "investmentIncome_line17a": null,
      "investmentExpenses_line17b": null,
      "dividendEquivalents_line17c": null
    }
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
        "capitalStock": null,
        "additionalPaidInCapital": null,
        "retainedEarnings": null,
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
        "capitalStock": null,
        "additionalPaidInCapital": null,
        "retainedEarnings": null,
        "adjustmentsToShareholderEquity": null,
        "lessShareholderTreasuryStock": null,
        "totalLiabilitiesAndEquity": null
      }
    }
  },
  "scheduleM1": {
    "netIncomePerBooks_line1": null,
    "incomeOnScheduleKNotOnBooks_line2": null,
    "expensesOnBooksNotOnScheduleK_line3a": null,
    "depreciation_line3a": null,
    "travelEntertainment_line3b": null,
    "total_line4": null,
    "incomeOnBooksNotOnScheduleK_line5": null,
    "deductionsOnScheduleKNotOnBooks_line6a": null,
    "depreciation_line6a": null,
    "total_line7": null,
    "incomeOnScheduleK_line8": null
  },
  "scheduleM2": {
    "otherAdjustmentsAccount": {
      "balanceBeginningOfYear_line1": null,
      "ordinaryIncome_line2": null,
      "otherAdditions_line3": null,
      "total_line4": null,
      "distributions_line5": null,
      "otherReductions_line6": null,
      "total_line7": null,
      "balanceEndOfYear_line8": null
    },
    "accumulatedAdjustmentsAccount": {
      "balanceBeginningOfYear_line1": null,
      "ordinaryIncome_line2": null,
      "otherAdditions_line3": null,
      "total_line4": null,
      "distributions_line5": null,
      "otherReductions_line6": null,
      "total_line7": null,
      "balanceEndOfYear_line8": null
    },
    "shareholdersUndistributedTaxableIncome": {
      "balanceBeginningOfYear_line1": null,
      "balanceEndOfYear_line8": null
    }
  },
  "officerCompensation": [
    {
      "name": null,
      "ssn_last4": null,
      "percentTimeDevoted": null,
      "percentStockOwned": null,
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
2. Schedule K is the MOST IMPORTANT section for S-Corps — it shows what flows through to shareholders. Extract every line.
3. Schedule L (Balance Sheet) has FOUR columns: Beginning of Year (a/b) and End of Year (c/d). Extract ALL columns.
4. If a number is illegible, set it to null and add a note in extractionNotes.
5. For officer compensation: include ALL officers listed. This is critical for SBA lending — officer comp is a key add-back.
6. NEVER guess or estimate. If you can't read it, say null.
7. Verify your own work: check that totalIncome = sum of income lines, totalDeductions = sum of deduction lines.
8. ordinaryBusinessIncome_line22 should equal totalIncome_line6 minus totalDeductions_line21. Verify this.
9. Schedule L: totalAssets MUST equal totalLiabilitiesAndEquity for both BOY and EOY. If they don't match, note the discrepancy.
10. Distributions on Schedule K line 16a are critical for cash flow analysis — make sure to capture them.`;

export const FORM_1120S_VERSION = "1120s-v1";
