import { z } from "zod";

const box12EntrySchema = z.object({
  code: z.string().nullable(),
  amount: z.number().nullable(),
}).passthrough();

export const w2Schema = z.object({
  metadata: z.object({
    taxYear: z.number().nullable(),
    employerName: z.string().nullable(),
    employerEIN: z.string().nullable(),
    employerAddress: z.string().nullable(),
    employeeName: z.string().nullable(),
    employeeSSN_last4: z.string().nullable(),
    employeeAddress: z.string().nullable(),
  }).passthrough(),
  wages: z.object({
    wagesTipsOther_box1: z.number().nullable(),
    federalIncomeTaxWithheld_box2: z.number().nullable(),
    socialSecurityWages_box3: z.number().nullable(),
    socialSecurityTaxWithheld_box4: z.number().nullable(),
    medicareWages_box5: z.number().nullable(),
    medicareTaxWithheld_box6: z.number().nullable(),
    socialSecurityTips_box7: z.number().nullable(),
    allocatedTips_box8: z.number().nullable(),
    dependentCareBenefits_box10: z.number().nullable(),
    nonqualifiedPlans_box11: z.number().nullable(),
    deferredCompensation_box12: z.array(box12EntrySchema).default([]),
    statutoryEmployee_box13: z.boolean().default(false),
    retirementPlan_box13: z.boolean().default(false),
    thirdPartySickPay_box13: z.boolean().default(false),
  }).passthrough(),
  stateTaxInfo: z.object({
    state: z.string().nullable(),
    stateEmployerID: z.string().nullable(),
    stateWages_box16: z.number().nullable(),
    stateIncomeTax_box17: z.number().nullable(),
  }).passthrough(),
  localTaxInfo: z.object({
    localWages_box18: z.number().nullable(),
    localIncomeTax_box19: z.number().nullable(),
    localityName_box20: z.string().nullable(),
  }).passthrough(),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type W2Data = z.infer<typeof w2Schema>;
