import { z } from "zod";

export const k1Schema = z.object({
  metadata: z.object({
    taxYear: z.number().nullable(),
    sourceForm: z.string().nullable(),
    partnershipOrCorpName: z.string().nullable(),
    partnershipOrCorpEIN: z.string().nullable(),
    partnerOrShareholderName: z.string().nullable(),
    partnerOrShareholderSSN_last4: z.string().nullable(),
    partnerOrShareholderType: z.string().nullable(),
    profitSharingPercent_beginning: z.number().nullable(),
    profitSharingPercent_ending: z.number().nullable(),
    lossSharingPercent_beginning: z.number().nullable(),
    lossSharingPercent_ending: z.number().nullable(),
    capitalSharingPercent_beginning: z.number().nullable(),
    capitalSharingPercent_ending: z.number().nullable(),
  }).passthrough(),
  incomeAndLoss: z.object({
    ordinaryBusinessIncome_line1: z.number().nullable(),
    netRentalRealEstateIncome_line2: z.number().nullable(),
    otherNetRentalIncome_line3: z.number().nullable(),
    guaranteedPayments_line4a: z.number().nullable(),
    guaranteedPayments_line4b: z.number().nullable(),
    guaranteedPayments_line4c: z.number().nullable(),
    interestIncome_line5: z.number().nullable(),
    ordinaryDividends_line6a: z.number().nullable(),
    qualifiedDividends_line6b: z.number().nullable(),
    royalties_line7: z.number().nullable(),
    netShortTermCapitalGain_line8: z.number().nullable(),
    netLongTermCapitalGain_line9a: z.number().nullable(),
    collectiblesGain_line9b: z.number().nullable(),
    unrealizedSection1250Gain_line9c: z.number().nullable(),
    netSection1231Gain_line10: z.number().nullable(),
    otherIncome_line11: z.number().nullable(),
  }).passthrough(),
  deductions: z.object({
    section179Deduction_line12: z.number().nullable(),
    otherDeductions_line13: z.number().nullable(),
  }).passthrough(),
  selfEmployment: z.object({
    netEarningsFromSE_line14a: z.number().nullable(),
    grossFarmingIncome_line14b: z.number().nullable(),
    grossNonfarmIncome_line14c: z.number().nullable(),
  }).passthrough(),
  credits: z.object({
    lowIncomeHousingCredit_line15a: z.number().nullable(),
    otherCredits_line15f: z.number().nullable(),
  }).passthrough(),
  foreignTransactions: z.object({
    foreignCountry: z.string().nullable(),
    foreignTaxesPaid: z.number().nullable(),
    foreignTaxesAccrued: z.number().nullable(),
  }).passthrough(),
  distributions: z.object({
    cashAndMarketableSecurities_line19a: z.number().nullable(),
    propertyDistributions_line19b: z.number().nullable(),
  }).passthrough(),
  otherInformation: z.object({
    section199A_qbi_line20_codeZ: z.number().nullable(),
    section199A_w2Wages_line20_codeZ: z.number().nullable(),
    section199A_ubia_line20_codeZ: z.number().nullable(),
    otherInfo_line20: z.string().nullable(),
  }).passthrough(),
  capitalAccount: z.object({
    beginningCapitalAccount: z.number().nullable(),
    currentYearIncrease: z.number().nullable(),
    currentYearDecrease: z.number().nullable(),
    withdrawalsAndDistributions: z.number().nullable(),
    endingCapitalAccount: z.number().nullable(),
    method: z.string().nullable(),
  }).passthrough(),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type K1Data = z.infer<typeof k1Schema>;
