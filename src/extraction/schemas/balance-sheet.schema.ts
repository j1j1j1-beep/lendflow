import { z } from "zod";

const categoryAmountSchema = z.object({
  category: z.string().nullable(),
  amount: z.number().nullable(),
}).passthrough();

const fixedAssetBreakdownSchema = z.object({
  category: z.string().nullable(),
  grossAmount: z.number().nullable(),
  accumulatedDepreciation: z.number().nullable(),
  netAmount: z.number().nullable(),
}).passthrough();

const otherIncomeBreakdownSchema = z.object({
  category: z.string().nullable(),
  monthlyAmount: z.number().nullable(),
  annualAmount: z.number().nullable(),
}).passthrough();

// Asset Sections

const currentAssetsSchema = z.object({
  cashAndCashEquivalents: z.number().nullable(),
  checkingAccounts: z.number().nullable(),
  savingsAccounts: z.number().nullable(),
  accountsReceivable_gross: z.number().nullable(),
  allowanceForDoubtfulAccounts: z.number().nullable(),
  accountsReceivable_net: z.number().nullable(),
  inventory: z.number().nullable(),
  rawMaterials: z.number().nullable(),
  workInProgress: z.number().nullable(),
  finishedGoods: z.number().nullable(),
  prepaidExpenses: z.number().nullable(),
  prepaidInsurance: z.number().nullable(),
  prepaidRent: z.number().nullable(),
  shortTermInvestments: z.number().nullable(),
  notesReceivable_current: z.number().nullable(),
  dueFromOfficers_current: z.number().nullable(),
  otherCurrentAssets: z.number().nullable(),
  totalCurrentAssets: z.number().nullable(),
  currentAssetBreakdown: z.array(categoryAmountSchema).default([]),
}).passthrough();

const fixedAssetsSchema = z.object({
  land: z.number().nullable(),
  buildings: z.number().nullable(),
  leaseholdImprovements: z.number().nullable(),
  furnitureAndFixtures: z.number().nullable(),
  machineryAndEquipment: z.number().nullable(),
  vehicles: z.number().nullable(),
  computerEquipment: z.number().nullable(),
  constructionInProgress: z.number().nullable(),
  grossPropertyAndEquipment: z.number().nullable(),
  accumulatedDepreciation: z.number().nullable(),
  netPropertyAndEquipment: z.number().nullable(),
  fixedAssetBreakdown: z.array(fixedAssetBreakdownSchema).default([]),
}).passthrough();

const otherAssetsSchema = z.object({
  goodwill: z.number().nullable(),
  intangibleAssets_gross: z.number().nullable(),
  accumulatedAmortization: z.number().nullable(),
  intangibleAssets_net: z.number().nullable(),
  longTermInvestments: z.number().nullable(),
  notesReceivable_longTerm: z.number().nullable(),
  dueFromOfficers_longTerm: z.number().nullable(),
  deposits: z.number().nullable(),
  deferredTaxAssets: z.number().nullable(),
  otherLongTermAssets: z.number().nullable(),
  totalOtherAssets: z.number().nullable(),
  otherAssetBreakdown: z.array(categoryAmountSchema).default([]),
}).passthrough();

// Liability Sections

const currentLiabilitiesSchema = z.object({
  accountsPayable: z.number().nullable(),
  accruedExpenses: z.number().nullable(),
  accruedWages: z.number().nullable(),
  accruedTaxes: z.number().nullable(),
  accruedInterest: z.number().nullable(),
  unearnedRevenue: z.number().nullable(),
  currentPortionOfLongTermDebt: z.number().nullable(),
  shortTermNotesPayable: z.number().nullable(),
  lineOfCreditBalance: z.number().nullable(),
  creditCardPayable: z.number().nullable(),
  customerDeposits: z.number().nullable(),
  dueToOfficers_current: z.number().nullable(),
  currentPortionOfCapitalLeases: z.number().nullable(),
  otherCurrentLiabilities: z.number().nullable(),
  totalCurrentLiabilities: z.number().nullable(),
  currentLiabilityBreakdown: z.array(categoryAmountSchema).default([]),
}).passthrough();

const longTermLiabilitiesSchema = z.object({
  notesPayable_longTerm: z.number().nullable(),
  mortgagePayable: z.number().nullable(),
  sbaLoanPayable: z.number().nullable(),
  vehicleLoans: z.number().nullable(),
  equipmentLoans: z.number().nullable(),
  capitalLeaseObligations: z.number().nullable(),
  dueToOfficers_longTerm: z.number().nullable(),
  deferredTaxLiabilities: z.number().nullable(),
  deferredRevenue_longTerm: z.number().nullable(),
  otherLongTermLiabilities: z.number().nullable(),
  totalLongTermLiabilities: z.number().nullable(),
  longTermLiabilityBreakdown: z.array(categoryAmountSchema).default([]),
}).passthrough();

// Equity

const equitySchema = z.object({
  commonStock: z.number().nullable(),
  preferredStock: z.number().nullable(),
  additionalPaidInCapital: z.number().nullable(),
  retainedEarnings: z.number().nullable(),
  currentYearNetIncome: z.number().nullable(),
  ownerEquity: z.number().nullable(),
  ownerDraws: z.number().nullable(),
  partnerCapital: z.number().nullable(),
  memberCapital: z.number().nullable(),
  treasuryStock: z.number().nullable(),
  accumulatedOtherComprehensiveIncome: z.number().nullable(),
  otherEquity: z.number().nullable(),
  totalEquity: z.number().nullable(),
  equityBreakdown: z.array(categoryAmountSchema).default([]),
}).passthrough();

// Main Balance Sheet Schema

export const balanceSheetSchema = z.object({
  metadata: z.object({
    businessName: z.string().nullable(),
    asOfDate: z.string().nullable(),
    preparedBy: z.string().nullable(),
    basis: z.string().nullable(),
  }).passthrough(),
  assets: z.object({
    currentAssets: currentAssetsSchema,
    fixedAssets: fixedAssetsSchema,
    otherAssets: otherAssetsSchema,
    totalAssets: z.number().nullable(),
  }).passthrough(),
  liabilities: z.object({
    currentLiabilities: currentLiabilitiesSchema,
    longTermLiabilities: longTermLiabilitiesSchema,
    totalLiabilities: z.number().nullable(),
  }).passthrough(),
  equity: equitySchema,
  totalLiabilitiesAndEquity: z.number().nullable(),
  ratios: z.object({
    currentRatio: z.number().nullable(),
    quickRatio: z.number().nullable(),
    debtToEquity: z.number().nullable(),
    workingCapital: z.number().nullable(),
    tangibleNetWorth: z.number().nullable(),
  }).passthrough().nullable().default(null),
  priorPeriodComparison: z.object({
    hasPriorPeriod: z.boolean().default(false),
    priorAsOfDate: z.string().nullable(),
    priorTotalAssets: z.number().nullable(),
    priorTotalLiabilities: z.number().nullable(),
    priorTotalEquity: z.number().nullable(),
    assetChangePercent: z.number().nullable(),
    liabilityChangePercent: z.number().nullable(),
    equityChangePercent: z.number().nullable(),
  }).passthrough().nullable().default(null),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type BalanceSheetData = z.infer<typeof balanceSheetSchema>;
