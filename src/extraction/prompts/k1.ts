export const K1_PROMPT = `You are a financial data extraction specialist. Extract ALL data from this IRS Schedule K-1 (Partner's/Shareholder's Share of Income, Deductions, Credits, etc.).

This could be a K-1 from Form 1065 (Partnership) or Form 1120-S (S-Corporation). Extract accordingly.

Return a JSON object with this EXACT structure:

{
  "metadata": {
    "taxYear": null,
    "sourceForm": null,
    "partnershipOrCorpName": null,
    "partnershipOrCorpEIN": null,
    "partnerOrShareholderName": null,
    "partnerOrShareholderSSN_last4": null,
    "partnerOrShareholderType": null,
    "profitSharingPercent_beginning": null,
    "profitSharingPercent_ending": null,
    "lossSharingPercent_beginning": null,
    "lossSharingPercent_ending": null,
    "capitalSharingPercent_beginning": null,
    "capitalSharingPercent_ending": null
  },
  "incomeAndLoss": {
    "ordinaryBusinessIncome_line1": null,
    "netRentalRealEstateIncome_line2": null,
    "otherNetRentalIncome_line3": null,
    "guaranteedPayments_line4a": null,
    "guaranteedPayments_line4b": null,
    "guaranteedPayments_line4c": null,
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
    "otherDeductions_line13": null
  },
  "selfEmployment": {
    "netEarningsFromSE_line14a": null,
    "grossFarmingIncome_line14b": null,
    "grossNonfarmIncome_line14c": null
  },
  "credits": {
    "lowIncomeHousingCredit_line15a": null,
    "otherCredits_line15f": null
  },
  "foreignTransactions": {
    "foreignCountry": null,
    "foreignTaxesPaid": null,
    "foreignTaxesAccrued": null
  },
  "distributions": {
    "cashAndMarketableSecurities_line19a": null,
    "propertyDistributions_line19b": null
  },
  "capitalAccount": {
    "beginningCapitalAccount": null,
    "currentYearIncrease": null,
    "currentYearDecrease": null,
    "withdrawalsAndDistributions": null,
    "endingCapitalAccount": null,
    "method": null
  },
  "extractionNotes": []
}

CRITICAL RULES:
1. Identify whether this is from a 1065 (Partnership) or 1120-S (S-Corp). Put the source form in sourceForm.
2. Line numbers may differ between partnership K-1 and S-Corp K-1. Map them to the closest matching field.
3. Guaranteed payments (lines 4a/4b/4c) are CRITICAL for lending — they represent owner compensation.
4. The capital account analysis section is important for understanding partner's basis.
5. All amounts should be numbers (no dollar signs or commas).
6. NEVER guess or estimate. If you can't read it, say null.`;

export const K1_VERSION = "k1-v1";
