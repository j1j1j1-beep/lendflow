import { z } from "zod";

const scheduleCExpensesSchema = z.object({
  advertising: z.number().nullable(),
  carAndTruck: z.number().nullable(),
  commissions: z.number().nullable(),
  contractLabor: z.number().nullable(),
  depletion: z.number().nullable(),
  depreciation_line13: z.number().nullable(),
  employeeBenefits: z.number().nullable(),
  insurance: z.number().nullable(),
  interestMortgage: z.number().nullable(),
  interestOther: z.number().nullable(),
  legal: z.number().nullable(),
  officeExpense: z.number().nullable(),
  pensionPlans: z.number().nullable(),
  rent: z.number().nullable(),
  repairs: z.number().nullable(),
  supplies: z.number().nullable(),
  taxes: z.number().nullable(),
  travel: z.number().nullable(),
  meals: z.number().nullable(),
  utilities: z.number().nullable(),
  wages: z.number().nullable(),
  otherExpenses: z.number().nullable(),
});

const scheduleCSchema = z.object({
  businessName: z.string().nullable(),
  principalCode: z.string().nullable(),
  grossReceipts_line1: z.number().nullable(),
  returnsAndAllowances_line2: z.number().nullable(),
  cogs_line4: z.number().nullable(),
  grossProfit_line5: z.number().nullable(),
  otherIncome_line6: z.number().nullable(),
  grossIncome_line7: z.number().nullable(),
  totalExpenses_line28: z.number().nullable(),
  netProfit_line31: z.number().nullable(),
  expenses: scheduleCExpensesSchema,
});

const scheduleEPropertySchema = z.object({
  address: z.string().nullable(),
  propertyType: z.string().nullable(),
  fairRentalDays: z.number().nullable(),
  personalUseDays: z.number().nullable(),
  rentsReceived: z.number().nullable(),
  advertising: z.number().nullable(),
  auto: z.number().nullable(),
  cleaning: z.number().nullable(),
  commissions: z.number().nullable(),
  insurance: z.number().nullable(),
  legal: z.number().nullable(),
  management: z.number().nullable(),
  mortgageInterest: z.number().nullable(),
  otherInterest: z.number().nullable(),
  repairs: z.number().nullable(),
  supplies: z.number().nullable(),
  taxes: z.number().nullable(),
  utilities: z.number().nullable(),
  depreciation: z.number().nullable(),
  other: z.number().nullable(),
  totalExpenses: z.number().nullable(),
  netRentalIncome: z.number().nullable(),
});

const partnershipSCorpIncomeSchema = z.object({
  entityName: z.string().nullable(),
  entityType: z.string().nullable(),
  passiveIncome: z.number().nullable(),
  nonPassiveIncome: z.number().nullable(),
  passiveLoss: z.number().nullable(),
  nonPassiveLoss: z.number().nullable(),
});

export const form1040Schema = z.object({
  metadata: z.object({
    taxYear: z.number(),
    filingStatus: z.string().nullable(),
    taxpayerName: z.string().nullable(),
    spouseName: z.string().nullable(),
    ssn_last4: z.string().nullable(),
    address: z.string().nullable(),
  }),
  income: z.object({
    wages_line1: z.number().nullable(),
    taxExemptInterest_line2a: z.number().nullable(),
    taxableInterest_line2b: z.number().nullable(),
    qualifiedDividends_line3a: z.number().nullable(),
    ordinaryDividends_line3b: z.number().nullable(),
    iraDistributions_line4a: z.number().nullable(),
    taxableIra_line4b: z.number().nullable(),
    pensions_line5a: z.number().nullable(),
    taxablePensions_line5b: z.number().nullable(),
    socialSecurity_line6a: z.number().nullable(),
    taxableSocialSecurity_line6b: z.number().nullable(),
    capitalGain_line7: z.number().nullable(),
    otherIncome_line8: z.number().nullable(),
    totalIncome_line9: z.number().nullable(),
    adjustments_line10: z.number().nullable(),
    agi_line11: z.number().nullable(),
    standardOrItemized_line12: z.number().nullable(),
    qbi_line13a: z.number().nullable(),
    totalDeductions_line14: z.number().nullable(),
    taxableIncome_line15: z.number().nullable(),
  }),
  scheduleC: z.array(scheduleCSchema).default([]),
  scheduleD: z
    .object({
      shortTermGainLoss: z.number().nullable(),
      longTermGainLoss: z.number().nullable(),
      netCapitalGainLoss: z.number().nullable(),
    })
    .nullable()
    .default(null),
  scheduleE: z
    .object({
      properties: z.array(scheduleEPropertySchema).default([]),
      totalRentalIncome_line26: z.number().nullable(),
      partnershipSCorpIncome: z
        .array(partnershipSCorpIncomeSchema)
        .default([]),
    })
    .nullable()
    .default(null),
  scheduleSE: z
    .object({
      netEarnings: z.number().nullable(),
      selfEmploymentTax: z.number().nullable(),
    })
    .nullable()
    .default(null),
  w2Summary: z
    .array(
      z.object({
        employer: z.string().nullable(),
        ein_last4: z.string().nullable(),
        wages_box1: z.number().nullable(),
        federalWithholding_box2: z.number().nullable(),
        socialSecurityWages_box3: z.number().nullable(),
        medicareWages_box5: z.number().nullable(),
      })
    )
    .default([]),
  deductions: z.object({
    type: z.enum(["standard", "itemized"]).default("standard"),
    amount: z.number().nullable(),
    scheduleA: z
      .object({
        medicalDental: z.number().nullable(),
        stateLocalTaxes: z.number().nullable(),
        mortgageInterest: z.number().nullable(),
        charitableContributions: z.number().nullable(),
        totalItemized: z.number().nullable(),
      })
      .nullable()
      .default(null),
  }),
  tax: z.object({
    taxBeforeCredits_line16: z.number().nullable(),
    totalCredits: z.number().nullable(),
    otherTaxes_line23: z.number().nullable(),
    totalTax_line24: z.number().nullable(),
    federalWithholding_line25a: z.number().nullable(),
    totalPayments_line33: z.number().nullable(),
    overpaid_line34: z.number().nullable(),
    amountOwed_line37: z.number().nullable(),
  }),
  extractionNotes: z.array(z.string()).default([]),
});

export type Form1040Data = z.infer<typeof form1040Schema>;
