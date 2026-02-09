// ─── Deterministic IRS Line Number → Schema Field Mapping ───────────────────
// NO AI. Pure code. Maps known IRS form line numbers/labels to structured fields.
// This is the ground truth for tax form extraction — Textract reads the characters,
// this code maps them to the right place.

// ─── 1040 Individual Income Tax Return ──────────────────────────────────────

export const IRS_1040_MAP: Record<string, string> = {
  // Income
  "1": "income.wages_line1",
  "1a": "income.wages_line1",
  "2a": "income.taxExemptInterest_line2a",
  "2b": "income.taxableInterest_line2b",
  "3a": "income.qualifiedDividends_line3a",
  "3b": "income.ordinaryDividends_line3b",
  "4a": "income.iraDistributions_line4a",
  "4b": "income.taxableIra_line4b",
  "5a": "income.pensions_line5a",
  "5b": "income.taxablePensions_line5b",
  "6a": "income.socialSecurity_line6a",
  "6b": "income.taxableSocialSecurity_line6b",
  "7": "income.capitalGain_line7",
  "8": "income.otherIncome_line8",
  "9": "income.totalIncome_line9",
  "10": "income.adjustments_line10",
  "11": "income.agi_line11",
  "12": "income.standardOrItemized_line12",
  "13": "income.qbi_line13a",
  "14": "income.totalDeductions_line14",
  "15": "income.taxableIncome_line15",

  // Tax and Credits
  "16": "tax.taxBeforeCredits_line16",
  "23": "tax.otherTaxes_line23",
  "24": "tax.totalTax_line24",
  "25": "tax.federalWithholding_line25a",
  "25a": "tax.federalWithholding_line25a",
  "33": "tax.totalPayments_line33",
  "34": "tax.overpaid_line34",
  "37": "tax.amountOwed_line37",

  // Filing info
  "filing_status": "metadata.filingStatus",
  "spouse": "metadata.spouseName",
  "ssn": "metadata.ssn_last4",
  "occupation": "metadata.taxpayerName",
};

// ─── Schedule C (Profit or Loss from Business) ─────────────────────────────

export const IRS_SCHEDULE_C_MAP: Record<string, string> = {
  "1": "scheduleC.grossReceipts_line1",
  "2": "scheduleC.returns_line2",
  "3": "scheduleC.subtractLine2_line3",
  "4": "scheduleC.costOfGoods_line4",
  "5": "scheduleC.grossProfit_line5",
  "6": "scheduleC.otherIncome_line6",
  "7": "scheduleC.grossIncome_line7",

  // Expenses
  "8": "scheduleC.advertising_line8",
  "9": "scheduleC.carExpenses_line9",
  "10": "scheduleC.commissions_line10",
  "11": "scheduleC.contractLabor_line11",
  "12": "scheduleC.depletion_line12",
  "13": "scheduleC.depreciation_line13",
  "14": "scheduleC.employeeBenefits_line14",
  "15": "scheduleC.insurance_line15",
  "16a": "scheduleC.mortgageInterest_line16a",
  "16b": "scheduleC.otherInterest_line16b",
  "17": "scheduleC.legal_line17",
  "18": "scheduleC.officeExpense_line18",
  "19": "scheduleC.pensionPlans_line19",
  "20a": "scheduleC.rentVehicles_line20a",
  "20b": "scheduleC.rentOther_line20b",
  "21": "scheduleC.repairs_line21",
  "22": "scheduleC.supplies_line22",
  "23": "scheduleC.taxesLicenses_line23",
  "24a": "scheduleC.travel_line24a",
  "24b": "scheduleC.meals_line24b",
  "25": "scheduleC.utilities_line25",
  "26": "scheduleC.wages_line26",
  "27a": "scheduleC.otherExpenses_line27a",
  "27b": "scheduleC.otherExpensesDetail_line27b",
  "28": "scheduleC.totalExpenses_line28",
  "29": "scheduleC.tentativeProfit_line29",
  "30": "scheduleC.homeOffice_line30",
  "31": "scheduleC.netProfitOrLoss_line31",

  // Business info
  "a": "scheduleC.businessName",
  "b": "scheduleC.principalCode",
  "c": "scheduleC.businessNameLine",
  "d": "scheduleC.ein",
  "e": "scheduleC.businessAddress",
  "f": "scheduleC.accountingMethod",
  "g": "scheduleC.materialParticipation",
};

// ─── Schedule E (Supplemental Income — Rental) ─────────────────────────────

export const IRS_SCHEDULE_E_MAP: Record<string, string> = {
  // Per-property fields: these get suffixed with _propN in extraction
  "3": "scheduleE.rentsReceived_line3",
  "4": "scheduleE.royaltiesReceived_line4",

  // Expenses per property
  "5": "scheduleE.advertising_line5",
  "6": "scheduleE.auto_line6",
  "7": "scheduleE.cleaning_line7",
  "8": "scheduleE.commissions_line8",
  "9": "scheduleE.insurance_line9",
  "10": "scheduleE.legal_line10",
  "11": "scheduleE.management_line11",
  "12": "scheduleE.mortgageInterest_line12",
  "13": "scheduleE.otherInterest_line13",
  "14": "scheduleE.repairs_line14",
  "15": "scheduleE.supplies_line15",
  "16": "scheduleE.taxes_line16",
  "17": "scheduleE.utilities_line17",
  "18": "scheduleE.depreciation_line18",
  "19": "scheduleE.other_line19",
  "20": "scheduleE.totalExpenses_line20",
  "21": "scheduleE.netRentOrRoyalty_line21",

  // Totals
  "23a": "scheduleE.totalRentalLoss_line23a",
  "24": "scheduleE.totalNetRental_line24",
  "25": "scheduleE.totalRentalIncome_line25",
  "26": "scheduleE.totalSupplemental_line26",

  // Partnership/S-Corp (Part II)
  "28": "scheduleE.partnershipIncome_line28",
  "29a": "scheduleE.passiveIncome_line29a",
  "29b": "scheduleE.nonpassiveIncome_line29b",
  "30": "scheduleE.passiveLoss_line30",
  "31": "scheduleE.nonpassiveLoss_line31",
  "32": "scheduleE.totalPartnership_line32",

  // Property info
  "1a_address": "scheduleE.property1Address",
  "1b_address": "scheduleE.property2Address",
  "1c_address": "scheduleE.property3Address",
  "1a_type": "scheduleE.property1Type",
  "1b_type": "scheduleE.property2Type",
  "1c_type": "scheduleE.property3Type",
  "2_fairRentalDays": "scheduleE.fairRentalDays",
  "2_personalUseDays": "scheduleE.personalUseDays",
};

// ─── Form 1120 (C-Corp) ────────────────────────────────────────────────────

export const IRS_1120_MAP: Record<string, string> = {
  // Income
  "1a": "income.grossReceipts_line1a",
  "1b": "income.returnsAllowances_line1b",
  "1c": "income.balanceAfterReturns_line1c",
  "2": "income.costOfGoodsSold_line2",
  "3": "income.grossProfit_line3",
  "4": "income.dividendsReceived_line4",
  "5": "income.interestIncome_line5",
  "6": "income.grossRents_line6",
  "7": "income.grossRoyalties_line7",
  "8": "income.capitalGainNet_line8",
  "9": "income.netGainForm4797_line9",
  "10": "income.otherIncome_line10",
  "11": "income.totalIncome_line11",

  // Deductions
  "12": "deductions.compensationOfOfficers_line12",
  "13": "deductions.salariesAndWages_line13",
  "14": "deductions.repairsAndMaintenance_line14",
  "15": "deductions.badDebts_line15",
  "16": "deductions.rents_line16",
  "17": "deductions.taxesAndLicenses_line17",
  "18": "deductions.interestExpense_line18",
  "19": "deductions.charitableContributions_line19",
  "20": "deductions.depreciationForm4562_line20",
  "21": "deductions.depletion_line21",
  "22": "deductions.advertising_line22",
  "23": "deductions.pensionProfitSharing_line23",
  "24": "deductions.employeeBenefitPrograms_line24",
  "25": "deductions.energyEfficientBuildings_line25",
  "26": "deductions.otherDeductions_line26",
  "27": "deductions.totalDeductions_line27",
  "28": "taxableIncome.taxableIncomeBeforeNOL_line28",
  "29a": "taxableIncome.netOperatingLossDeduction_line29a",
  "29b": "taxableIncome.specialDeductions_line29b",
  "29c": "taxableIncome.totalSpecialDeductions_line29c",
  "30": "taxableIncome.taxableIncome_line30",

  // Tax and Payments
  "31": "taxAndPayments.totalTax_line31",
  "32": "taxAndPayments.totalPaymentsAndCredits_line32",
  "33": "taxAndPayments.estimatedTaxPenalty_line33",
  "34": "taxAndPayments.amountOwed_line34",
  "35": "taxAndPayments.overpayment_line35",
  "36": "taxAndPayments.refundedAmount_line36",

  // Schedule L - Balance Sheet (Page 4)
  "schedule_l_total_assets_boy": "scheduleL.beginningOfYear.assets.totalAssets",
  "schedule_l_total_assets_eoy": "scheduleL.endOfYear.assets.totalAssets",
  "schedule_l_total_liabilities_boy": "scheduleL.beginningOfYear.liabilitiesAndEquity.totalLiabilities",
  "schedule_l_total_liabilities_eoy": "scheduleL.endOfYear.liabilitiesAndEquity.totalLiabilities",
  "schedule_l_retained_earnings_boy": "scheduleL.beginningOfYear.liabilitiesAndEquity.retainedEarnings_unappropriated",
  "schedule_l_retained_earnings_eoy": "scheduleL.endOfYear.liabilitiesAndEquity.retainedEarnings_unappropriated",
  "schedule_l_total_liab_equity_boy": "scheduleL.beginningOfYear.liabilitiesAndEquity.totalLiabilitiesAndEquity",
  "schedule_l_total_liab_equity_eoy": "scheduleL.endOfYear.liabilitiesAndEquity.totalLiabilitiesAndEquity",
};

// ─── Form 1120S (S-Corp) ───────────────────────────────────────────────────

export const IRS_1120S_MAP: Record<string, string> = {
  // Income
  "1a": "income.grossReceipts_line1a",
  "1b": "income.returnsAllowances_line1b",
  "1c": "income.balanceAfterReturns_line1c",
  "2": "income.costOfGoodsSold_line2",
  "3": "income.grossProfit_line3",
  "4": "income.netGainForm4797_line4",
  "5": "income.otherIncome_line5",
  "6": "income.totalIncome_line6",

  // Deductions
  "7": "deductions.compensationOfOfficers_line7",
  "8": "deductions.salariesAndWages_line8",
  "9": "deductions.repairsAndMaintenance_line9",
  "10": "deductions.badDebts_line10",
  "11": "deductions.rents_line11",
  "12": "deductions.taxesAndLicenses_line12",
  "13": "deductions.interestExpense_line13",
  "14": "deductions.totalDepreciation_line14c",
  "15": "deductions.depletion_line15",
  "16": "deductions.advertising_line16",
  "17": "deductions.pensionProfitSharing_line17",
  "18": "deductions.employeeBenefitPrograms_line18",
  "19": "deductions.energyEfficientBuildings_line19",
  "20": "deductions.otherDeductions_line20",
  "21": "deductions.totalDeductions_line21",
  "22": "ordinaryBusinessIncome_line22",

  // Tax
  "23a": "taxAndPayments.excessNetPassiveIncomeTax_line23a",
  "23b": "taxAndPayments.builtInGainsTax_line23b",
  "23c": "taxAndPayments.totalTax_line23c",
  "24a": "taxAndPayments.estimatedTaxPayments_line24a",
  "24c": "taxAndPayments.totalPayments_line24d",
  "25": "taxAndPayments.estimatedTaxPenalty_line25",
  "26": "taxAndPayments.amountOwed_line26",
  "27": "taxAndPayments.overpayment_line27",

  // Schedule K (Shareholders' Pro Rata Share Items)
  "k_1": "scheduleK.incomeAndLoss.ordinaryBusinessIncome_line1",
  "k_2": "scheduleK.incomeAndLoss.netRentalRealEstateIncome_line2",
  "k_3": "scheduleK.incomeAndLoss.otherNetRentalIncome_line3",
  "k_4": "scheduleK.incomeAndLoss.interestIncome_line4",
  "k_5a": "scheduleK.incomeAndLoss.ordinaryDividends_line5a",
  "k_5b": "scheduleK.incomeAndLoss.qualifiedDividends_line5b",
  "k_6": "scheduleK.incomeAndLoss.royalties_line6",
  "k_7": "scheduleK.incomeAndLoss.netShortTermCapitalGain_line7",
  "k_8a": "scheduleK.incomeAndLoss.netLongTermCapitalGain_line8a",
  "k_9": "scheduleK.incomeAndLoss.netSection1231Gain_line9",
  "k_10": "scheduleK.incomeAndLoss.otherIncome_line10",
  "k_11": "scheduleK.deductions.section179Deduction_line11",
  "k_12": "scheduleK.deductions.otherDeductions_line12a",
  "k_16a": "scheduleK.distributions.cashAndMarketableSecurities_line16a",
  "k_16b": "scheduleK.distributions.propertyDistributions_line16b",

  // Schedule L - Balance Sheet
  "schedule_l_total_assets_boy": "scheduleL.beginningOfYear.assets.totalAssets",
  "schedule_l_total_assets_eoy": "scheduleL.endOfYear.assets.totalAssets",
  "schedule_l_total_liabilities_boy": "scheduleL.beginningOfYear.liabilitiesAndEquity.totalLiabilities",
  "schedule_l_total_liabilities_eoy": "scheduleL.endOfYear.liabilitiesAndEquity.totalLiabilities",
  "schedule_l_retained_earnings_boy": "scheduleL.beginningOfYear.liabilitiesAndEquity.retainedEarnings",
  "schedule_l_retained_earnings_eoy": "scheduleL.endOfYear.liabilitiesAndEquity.retainedEarnings",

  // Officer Compensation (Schedule E of 1120S)
  "officer_comp_name": "officerCompensation.name",
  "officer_comp_ssn": "officerCompensation.ssn_last4",
  "officer_comp_percent_time": "officerCompensation.percentTimeDevoted",
  "officer_comp_percent_owned": "officerCompensation.percentStockOwned",
  "officer_comp_amount": "officerCompensation.compensationAmount",
};

// ─── Form 1065 (Partnership) ───────────────────────────────────────────────

export const IRS_1065_MAP: Record<string, string> = {
  // Income
  "1a": "income.grossReceipts_line1a",
  "1b": "income.returnsAllowances_line1b",
  "1c": "income.netReceipts_line1c",
  "2": "income.costOfGoodsSold_line2",
  "3": "income.grossProfit_line3",
  "4": "income.ordinaryIncomeFromOtherPartnerships_line4",
  "5": "income.netFarmProfit_line5",
  "6": "income.netGainForm4797_line6",
  "7": "income.otherIncome_line7",
  "8": "income.totalIncome_line8",

  // Deductions
  "9": "deductions.salariesAndWages_line9",
  "10": "deductions.guaranteedPaymentsToPartners_line10",
  "11": "deductions.repairsAndMaintenance_line11",
  "12": "deductions.badDebts_line12",
  "13": "deductions.rent_line13",
  "14": "deductions.taxesAndLicenses_line14",
  "15": "deductions.interestExpense_line15",
  "16a": "deductions.depreciationNotOnForm4562_line16a",
  "16b": "deductions.depreciationFromForm4562_line16b",
  "16c": "deductions.netDepreciation_line16c",
  "17": "deductions.depletion_line17",
  "18": "deductions.retirementPlans_line18",
  "19": "deductions.employeeBenefitPrograms_line19",
  "20": "deductions.energyEfficientBuildings_line20",
  "21": "deductions.otherDeductions_line21",
  "22": "deductions.totalDeductions_line22",
  "23": "ordinaryBusinessIncome_line23",

  // Schedule K
  "k_1": "scheduleK.incomeAndLoss.ordinaryBusinessIncome_line1",
  "k_2": "scheduleK.incomeAndLoss.netRentalRealEstateIncome_line2",
  "k_3": "scheduleK.incomeAndLoss.otherNetRentalIncome_line3",
  "k_4a": "scheduleK.incomeAndLoss.guaranteedPaymentsToPartners_services_line4a",
  "k_4b": "scheduleK.incomeAndLoss.guaranteedPaymentsToPartners_capital_line4b",
  "k_4c": "scheduleK.incomeAndLoss.totalGuaranteedPayments_line4c",
  "k_5": "scheduleK.incomeAndLoss.interestIncome_line5",
  "k_6a": "scheduleK.incomeAndLoss.ordinaryDividends_line6a",
  "k_6b": "scheduleK.incomeAndLoss.qualifiedDividends_line6b",
  "k_7": "scheduleK.incomeAndLoss.royalties_line7",
  "k_8": "scheduleK.incomeAndLoss.netShortTermCapitalGain_line8",
  "k_9a": "scheduleK.incomeAndLoss.netLongTermCapitalGain_line9a",
  "k_10": "scheduleK.incomeAndLoss.netSection1231Gain_line10",
  "k_11": "scheduleK.incomeAndLoss.otherIncome_line11",
  "k_12": "scheduleK.deductions.section179Deduction_line12",
  "k_13a": "scheduleK.deductions.charitableContributions_line13a",
  "k_19a": "scheduleK.distributions.cashAndMarketableSecurities_line19a",
  "k_19b": "scheduleK.distributions.propertyDistributions_line19b",

  // Analysis of Net Income (Schedule K, Line 1 through Line 11)
  "analysis_general_partners": "analysisOfNetIncome.generalPartners.netIncome",
  "analysis_limited_partners": "analysisOfNetIncome.limitedPartners.netIncome",

  // Schedule L - Balance Sheet
  "schedule_l_total_assets_boy": "scheduleL.beginningOfYear.assets.totalAssets",
  "schedule_l_total_assets_eoy": "scheduleL.endOfYear.assets.totalAssets",
  "schedule_l_total_liabilities_boy": "scheduleL.beginningOfYear.liabilitiesAndCapital.totalLiabilities",
  "schedule_l_total_liabilities_eoy": "scheduleL.endOfYear.liabilitiesAndCapital.totalLiabilities",
  "schedule_l_partners_capital_boy": "scheduleL.beginningOfYear.liabilitiesAndCapital.partnersCapitalAccounts",
  "schedule_l_partners_capital_eoy": "scheduleL.endOfYear.liabilitiesAndCapital.partnersCapitalAccounts",
};

// ─── Schedule K-1 ──────────────────────────────────────────────────────────

export const IRS_K1_MAP: Record<string, string> = {
  // Partner/Shareholder info
  "part_i_a": "metadata.partnershipOrCorpName",
  "part_i_b": "metadata.partnershipOrCorpEIN",
  "part_ii_e": "metadata.partnerOrShareholderName",
  "part_ii_f": "metadata.partnerOrShareholderType",
  "part_ii_g": "metadata.partnerOrShareholderType",
  "part_ii_h": "metadata.partnerOrShareholderType",
  "part_ii_i": "metadata.partnerOrShareholderSSN_last4",
  "part_ii_j": "metadata.profitSharingPercent_ending",
  "part_ii_j2": "metadata.lossSharingPercent_ending",
  "part_ii_j3": "metadata.capitalSharingPercent_ending",

  // Income items (Part III)
  "1": "incomeAndLoss.ordinaryBusinessIncome_line1",
  "2": "incomeAndLoss.netRentalRealEstateIncome_line2",
  "3": "incomeAndLoss.otherNetRentalIncome_line3",
  "4a": "incomeAndLoss.guaranteedPayments_line4a",
  "4b": "incomeAndLoss.guaranteedPayments_line4b",
  "4c": "incomeAndLoss.guaranteedPayments_line4c",
  "5": "incomeAndLoss.interestIncome_line5",
  "6a": "incomeAndLoss.ordinaryDividends_line6a",
  "6b": "incomeAndLoss.qualifiedDividends_line6b",
  "7": "incomeAndLoss.royalties_line7",
  "8": "incomeAndLoss.netShortTermCapitalGain_line8",
  "9a": "incomeAndLoss.netLongTermCapitalGain_line9a",
  "10": "incomeAndLoss.netSection1231Gain_line10",
  "11": "incomeAndLoss.otherIncome_line11",

  // Deductions
  "12": "deductions.section179Deduction_line12",
  "13": "deductions.otherDeductions_line13",

  // Self-employment
  "14a": "selfEmployment.netEarningsFromSE_line14a",
  "14b": "selfEmployment.grossFarmingIncome_line14b",
  "14c": "selfEmployment.grossNonfarmIncome_line14c",

  // Credits
  "15a": "credits.lowIncomeHousingCredit_line15a",

  // Distributions
  "19a": "distributions.cashAndMarketableSecurities_line19a",
  "19b": "distributions.propertyDistributions_line19b",

  // Box 20 - QBI / Section 199A
  "20_Z_qbi": "otherInformation.section199A_qbi_line20_codeZ",
  "20_Z_w2": "otherInformation.section199A_w2Wages_line20_codeZ",
  "20_Z_ubia": "otherInformation.section199A_ubia_line20_codeZ",

  // Capital Account
  "capital_beginning": "capitalAccount.beginningCapitalAccount",
  "capital_increase": "capitalAccount.currentYearIncrease",
  "capital_decrease": "capitalAccount.currentYearDecrease",
  "capital_withdrawals": "capitalAccount.withdrawalsAndDistributions",
  "capital_ending": "capitalAccount.endingCapitalAccount",
  "capital_method": "capitalAccount.method",
};

// ─── Lookup Functions ──────────────────────────────────────────────────────

export type FormType = "1040" | "1120" | "1120S" | "1065" | "K1" | "SCHEDULE_C" | "SCHEDULE_E";

const FORM_MAPS: Record<FormType, Record<string, string>> = {
  "1040": IRS_1040_MAP,
  "1120": IRS_1120_MAP,
  "1120S": IRS_1120S_MAP,
  "1065": IRS_1065_MAP,
  "K1": IRS_K1_MAP,
  "SCHEDULE_C": IRS_SCHEDULE_C_MAP,
  "SCHEDULE_E": IRS_SCHEDULE_E_MAP,
};

/**
 * Get the schema field path for a given form type and line number.
 * Returns null if the line number isn't in our mapping (edge case — would need Claude fallback).
 */
export function getFieldPath(formType: FormType, lineNumber: string): string | null {
  const map = FORM_MAPS[formType];
  if (!map) return null;

  // Normalize: strip whitespace, lowercase
  const normalized = lineNumber.trim().toLowerCase();
  return map[normalized] ?? null;
}

/**
 * Get all field paths for a form type.
 * Used by verification to know which fields to expect.
 */
export function getExpectedFields(formType: FormType): string[] {
  const map = FORM_MAPS[formType];
  if (!map) return [];
  return [...new Set(Object.values(map))];
}

/**
 * Reverse lookup: given a schema field path, find the line number.
 * Used for displaying "Line 11: AGI" in the UI.
 */
export function getLineNumber(formType: FormType, fieldPath: string): string | null {
  const map = FORM_MAPS[formType];
  if (!map) return null;

  for (const [line, path] of Object.entries(map)) {
    if (path === fieldPath) return line;
  }
  return null;
}

/**
 * Maps Textract key-value pairs to structured data using deterministic IRS line mapping.
 * This is the core function — takes raw Textract output and returns structured fields.
 *
 * @param formType - The IRS form type
 * @param keyValuePairs - Key-value pairs from Textract's AnalyzeDocument
 * @returns { mapped: Record<field, value>, unmapped: Array<{key, value}> }
 */
export function mapTextractToFields(
  formType: FormType,
  keyValuePairs: Array<{ key: string; value: string; confidence: number; page: number }>
): {
  mapped: Record<string, { value: string; confidence: number; page: number; lineNumber: string }>;
  unmapped: Array<{ key: string; value: string; confidence: number; page: number }>;
} {
  const map = FORM_MAPS[formType];
  if (!map) {
    return { mapped: {}, unmapped: keyValuePairs };
  }

  const mapped: Record<string, { value: string; confidence: number; page: number; lineNumber: string }> = {};
  const unmapped: Array<{ key: string; value: string; confidence: number; page: number }> = [];

  for (const kv of keyValuePairs) {
    const lineNumber = extractLineNumber(kv.key);
    if (!lineNumber) {
      unmapped.push(kv);
      continue;
    }

    const fieldPath = map[lineNumber];
    if (fieldPath) {
      // If we already have this field, keep the one with higher confidence
      if (mapped[fieldPath] && mapped[fieldPath].confidence >= kv.confidence) {
        continue;
      }
      mapped[fieldPath] = {
        value: kv.value,
        confidence: kv.confidence,
        page: kv.page,
        lineNumber,
      };
    } else {
      unmapped.push(kv);
    }
  }

  return { mapped, unmapped };
}

/**
 * Extracts a line number from a Textract key string.
 * Handles various formats:
 * - "Line 1" → "1"
 * - "1a." → "1a"
 * - "Line 2b" → "2b"
 * - "7. Capital gain or (loss)" → "7"
 * - "1a Gross receipts or sales" → "1a"
 */
function extractLineNumber(key: string): string | null {
  // Remove leading/trailing whitespace
  const cleaned = key.trim();

  // Pattern: "Line X" or "line X"
  const lineMatch = cleaned.match(/^[Ll]ine\s+(\d+[a-z]?)/);
  if (lineMatch) return lineMatch[1].toLowerCase();

  // Pattern: starts with number like "1a." or "1a " or just "1"
  const numMatch = cleaned.match(/^(\d+[a-z]?)[\s.)\-:]/);
  if (numMatch) return numMatch[1].toLowerCase();

  // Pattern: just a bare number/letter combo
  const bareMatch = cleaned.match(/^(\d+[a-z]?)$/);
  if (bareMatch) return bareMatch[1].toLowerCase();

  // Schedule K lines: "k_1", "K-1", etc.
  const kMatch = cleaned.match(/^[Kk][\s\-_]?(\d+[a-z]?)/);
  if (kMatch) return `k_${kMatch[1].toLowerCase()}`;

  // Schedule L lines
  const schedLMatch = cleaned.match(/[Ss]chedule\s*[Ll]\s*[-:]?\s*(.+)/);
  if (schedLMatch) {
    const content = schedLMatch[1].toLowerCase();
    if (content.includes("total assets") && content.includes("begin")) return "schedule_l_total_assets_boy";
    if (content.includes("total assets") && content.includes("end")) return "schedule_l_total_assets_eoy";
    if (content.includes("total liab") && content.includes("begin")) return "schedule_l_total_liabilities_boy";
    if (content.includes("total liab") && content.includes("end")) return "schedule_l_total_liabilities_eoy";
    if (content.includes("retained") && content.includes("begin")) return "schedule_l_retained_earnings_boy";
    if (content.includes("retained") && content.includes("end")) return "schedule_l_retained_earnings_eoy";
    if (content.includes("partner") && content.includes("capital") && content.includes("begin")) return "schedule_l_partners_capital_boy";
    if (content.includes("partner") && content.includes("capital") && content.includes("end")) return "schedule_l_partners_capital_eoy";
  }

  return null;
}

/**
 * Parse a dollar amount string into a number.
 * Handles: "$85,000", "85000", "(5,000)" for negatives, "85,000.00"
 */
export function parseDollarAmount(value: string): number | null {
  if (!value || value.trim() === "" || value.trim() === "-") return null;

  let cleaned = value.trim();
  let negative = false;

  // Handle parenthetical negatives: (5,000) = -5000
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Handle leading minus
  if (cleaned.startsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }

  // Remove dollar sign, commas, spaces
  cleaned = cleaned.replace(/[$,\s]/g, "");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return negative ? -num : num;
}
