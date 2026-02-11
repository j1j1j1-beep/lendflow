// IRS Form 1065 (Partnership) Extraction Prompt
// FALLBACK prompt for when deterministic line mapping (irs-field-map.ts) fails.
// Used for edge cases: unusual formatting, guaranteed payments in non-standard
// locations, fields Textract can't identify, or low-confidence results.
// Claude receives Textract's raw text output and structures it into our schema.

export const FORM_1065_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this IRS Form 1065 (U.S. Return of Partnership Income) and its attached schedules.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "taxYear": null,
    "partnershipName": null,
    "ein": null,
    "address": null,
    "businessActivityCode": null,
    "principalProductOrService": null,
    "dateBusinessStarted": null,
    "totalAssets": null,
    "accountingMethod": null,
    "numberOfPartnersScheduleK1": null,
    "partnershipType": null
  },
  "income": {
    "grossReceipts_line1a": null,
    "returnsAllowances_line1b": null,
    "netReceipts_line1c": null,
    "costOfGoodsSold_line2": null,
    "grossProfit_line3": null,
    "ordinaryIncomeFromOtherPartnerships_line4": null,
    "netFarmProfit_line5": null,
    "netGainForm4797_line6": null,
    "otherIncome_line7": null,
    "totalIncome_line8": null
  },
  "deductions": {
    "salariesAndWages_line9": null,
    "guaranteedPaymentsToPartners_line10": null,
    "repairsAndMaintenance_line11": null,
    "badDebts_line12": null,
    "rent_line13": null,
    "taxesAndLicenses_line14": null,
    "interestExpense_line15": null,
    "depreciationNotOnForm4562_line16a": null,
    "depreciationFromForm4562_line16b": null,
    "netDepreciation_line16c": null,
    "depletion_line17": null,
    "retirementPlans_line18": null,
    "employeeBenefitPrograms_line19": null,
    "energyEfficientBuildings_line20": null,
    "otherDeductions_line21": null,
    "totalDeductions_line22": null
  },
  "ordinaryBusinessIncome_line23": null,
  "scheduleK": {
    "incomeAndLoss": {
      "ordinaryBusinessIncome_line1": null,
      "netRentalRealEstateIncome_line2": null,
      "otherNetRentalIncome_line3": null,
      "guaranteedPaymentsToPartners_services_line4a": null,
      "guaranteedPaymentsToPartners_capital_line4b": null,
      "totalGuaranteedPayments_line4c": null,
      "interestIncome_line5": null,
      "ordinaryDividends_line6a": null,
      "qualifiedDividends_line6b": null,
      "royalties_line7": null,
      "netShortTermCapitalGain_line8": null,
      "netLongTermCapitalGain_line9a": null,
      "collectiblesGain_line9b": null,
      "unrealizedSection1250Gain_line9c": null,
      "netSection1231Gain_line10": null,
      "otherIncome_line11": null
    },
    "deductions": {
      "section179Deduction_line12": null,
      "charitableContributions_line13a": null,
      "investmentInterestExpense_line13b": null,
      "section59e2Expenditures_line13c": null,
      "otherDeductions_line13d": null
    },
    "selfEmployment": {
      "netEarningsFromSE_line14a": null,
      "grossFarmingIncome_line14b": null,
      "grossNonfarmIncome_line14c": null
    },
    "credits": {
      "lowIncomeHousingCredit_line15a": null,
      "lowIncomeHousingCredit_other_line15b": null,
      "qualifiedRehabExpenses_line15c": null,
      "otherRentalRealEstateCredits_line15d": null,
      "otherRentalCredits_line15e": null,
      "otherCredits_line15f": null
    },
    "foreignTransactions": {
      "foreignCountry": null,
      "grossIncomeForeign_line16a": null,
      "foreignTaxesPaid_line16l": null,
      "foreignTaxesAccrued_line16m": null
    },
    "alternativeMinimumTax": {
      "amtAdjustments_line17a": null,
      "oilGasDeduction_line17b": null,
      "otherAMTItems_line17c": null
    },
    "taxExemptIncomeAndExpenses": {
      "taxExemptInterest_line18a": null,
      "otherTaxExemptIncome_line18b": null,
      "nondeductibleExpenses_line18c": null
    },
    "distributions": {
      "cashAndMarketableSecurities_line19a": null,
      "propertyDistributions_line19b": null
    },
    "otherInformation": {
      "investmentIncome_line20a": null,
      "investmentExpenses_line20b": null
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
        "mortgageAndRealEstateLoans": null,
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
      "liabilitiesAndCapital": {
        "accountsPayable": null,
        "mortgagesNotesPayable_lessThan1Year": null,
        "otherCurrentLiabilities": null,
        "nonrecourseLoansMortgages": null,
        "loansFromPartners": null,
        "mortgagesNotesPayable_1YearOrMore": null,
        "otherLiabilities": null,
        "totalLiabilities": null,
        "partnersCapitalAccounts": null,
        "totalLiabilitiesAndCapital": null
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
        "mortgageAndRealEstateLoans": null,
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
      "liabilitiesAndCapital": {
        "accountsPayable": null,
        "mortgagesNotesPayable_lessThan1Year": null,
        "otherCurrentLiabilities": null,
        "nonrecourseLoansMortgages": null,
        "loansFromPartners": null,
        "mortgagesNotesPayable_1YearOrMore": null,
        "otherLiabilities": null,
        "totalLiabilities": null,
        "partnersCapitalAccounts": null,
        "totalLiabilitiesAndCapital": null
      }
    }
  },
  "scheduleM1": {
    "netIncomePerBooks_line1": null,
    "incomeOnScheduleKNotOnBooks_line2": null,
    "guaranteedPayments_line3": null,
    "expensesOnBooksNotOnScheduleK_line4a": null,
    "depreciation_line4a": null,
    "travelEntertainment_line4b": null,
    "total_line5": null,
    "incomeOnBooksNotOnScheduleK_line6": null,
    "deductionsOnScheduleKNotOnBooks_line7a": null,
    "depreciation_line7a": null,
    "total_line8": null,
    "incomeOnScheduleK_line9": null
  },
  "scheduleM2": {
    "balanceBeginningOfYear_line1": null,
    "netIncome_line2": null,
    "otherIncreases_line3": null,
    "total_line4": null,
    "distributions_cashProperty_line5a": null,
    "otherDecreases_line6": null,
    "total_line7": null,
    "balanceEndOfYear_line8": null
  },
  "analysisOfNetIncome": {
    "generalPartners": {
      "netIncome": null,
      "count": null
    },
    "limitedPartners": {
      "netIncome": null,
      "count": null
    }
  },
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
2. GUARANTEED PAYMENTS (line 10, Schedule K line 4a/4b/4c) are CRITICAL for lending — they represent owner compensation. Make absolutely sure to capture these.
3. Schedule K is the MOST IMPORTANT section for partnerships — it shows what flows through to partners. Extract every line.
4. Schedule L (Balance Sheet) has FOUR columns: Beginning of Year (a/b) and End of Year (c/d). Extract ALL columns.
5. If a number is illegible, set it to null and add a note in extractionNotes.
6. NEVER guess or estimate. If you can't read it, say null.
7. Verify your own work: totalIncome_line8 should equal sum of lines 1c through 7. totalDeductions_line22 should equal sum of lines 9 through 21.
8. ordinaryBusinessIncome_line23 should equal totalIncome_line8 minus totalDeductions_line22. Verify this.
9. Schedule L: totalAssets MUST equal totalLiabilitiesAndCapital for both BOY and EOY.
10. Analysis of Net Income: general partners + limited partners should equal total net income. Verify.
11. Distributions on Schedule K line 19a are critical for cash flow analysis — make sure to capture them.`;

export const FORM_1065_VERSION = "1065-v1";
