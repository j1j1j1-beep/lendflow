import { z } from "zod";

// Unit Schema

const unitSchema = z.object({
  unitNumber: z.string().nullable(),
  unitType: z.string().nullable(),
  squareFeet: z.number().nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  tenantName: z.string().nullable(),
  leaseStartDate: z.string().nullable(),
  leaseEndDate: z.string().nullable(),
  leaseTermMonths: z.number().nullable(),
  monthlyRent: z.number().nullable(),
  marketRent: z.number().nullable(),
  rentPerSquareFoot: z.number().nullable(),
  securityDeposit: z.number().nullable(),
  lastRentIncrease: z.string().nullable(),
  status: z.enum(["occupied", "vacant", "down_unit", "model", "employee"]).nullable(),
  moveInDate: z.string().nullable(),
  rentStatus: z.enum(["current", "past_due", "eviction", "vacant", "pre_leased"]).nullable(),
  pastDueAmount: z.number().nullable(),
  pastDueDays: z.number().nullable(),
  otherMonthlyCharges: z.number().nullable(),
  otherChargesDescription: z.string().nullable(),
  concessions: z.number().nullable(),
  concessionsDescription: z.string().nullable(),
  notes: z.string().nullable(),
}).passthrough();

// Unit Mix Schema

const unitMixSchema = z.object({
  unitType: z.string().nullable(),
  count: z.number().nullable(),
  averageRent: z.number().nullable(),
  averageSquareFeet: z.number().nullable(),
  occupiedCount: z.number().nullable(),
  vacantCount: z.number().nullable(),
}).passthrough();

// Delinquency Bucket Schema

const delinquencyBucketSchema = z.object({
  unitCount: z.number().nullable(),
  totalAmount: z.number().nullable(),
}).passthrough();

// Lease Expiration Entry Schema

const leaseExpirationEntrySchema = z.object({
  period: z.string().nullable(),
  unitCount: z.number().nullable(),
  monthlyRent: z.number().nullable(),
  percentOfTotal: z.number().nullable(),
}).passthrough();

// Other Income Breakdown Schema

const otherIncomeBreakdownSchema = z.object({
  category: z.string().nullable(),
  monthlyAmount: z.number().nullable(),
  annualAmount: z.number().nullable(),
}).passthrough();

// Main Rent Roll Schema

export const rentRollSchema = z.object({
  metadata: z.object({
    propertyName: z.string().nullable(),
    propertyAddress: z.string().nullable(),
    propertyType: z.enum([
      "multifamily", "office", "retail", "industrial",
      "mixed_use", "single_family_portfolio",
    ]).nullable(),
    ownerName: z.string().nullable(),
    managementCompany: z.string().nullable(),
    asOfDate: z.string().nullable(),
    preparedBy: z.string().nullable(),
    totalUnits: z.number().nullable(),
    totalSquareFeet: z.number().nullable(),
    yearBuilt: z.number().nullable(),
  }).passthrough(),
  units: z.array(unitSchema).default([]),
  summary: z.object({
    totalUnits: z.number().nullable(),
    occupiedUnits: z.number().nullable(),
    vacantUnits: z.number().nullable(),
    occupancyRate: z.number().nullable(),
    totalMonthlyRent_scheduled: z.number().nullable(),
    totalMonthlyRent_actual: z.number().nullable(),
    totalAnnualRent_scheduled: z.number().nullable(),
    totalAnnualRent_actual: z.number().nullable(),
    averageRentPerUnit: z.number().nullable(),
    averageRentPerSquareFoot: z.number().nullable(),
    totalMarketRent: z.number().nullable(),
    lossToLease: z.number().nullable(),
    totalSecurityDeposits: z.number().nullable(),
    totalPastDue: z.number().nullable(),
    delinquencyRate: z.number().nullable(),
    totalOtherIncome: z.number().nullable(),
  }).passthrough(),
  unitMix: z.array(unitMixSchema).default([]),
  delinquencySummary: z.object({
    current: delinquencyBucketSchema,
    thirtyDays: delinquencyBucketSchema,
    sixtyDays: delinquencyBucketSchema,
    ninetyPlusDays: delinquencyBucketSchema,
  }).passthrough().nullable().default(null),
  leaseExpirationSchedule: z.array(leaseExpirationEntrySchema).default([]),
  otherIncome: z.object({
    laundry: z.number().nullable(),
    parking: z.number().nullable(),
    storage: z.number().nullable(),
    petFees: z.number().nullable(),
    lateCharges: z.number().nullable(),
    applicationFees: z.number().nullable(),
    otherFees: z.number().nullable(),
    totalOtherIncome: z.number().nullable(),
    otherIncomeBreakdown: z.array(otherIncomeBreakdownSchema).default([]),
  }).passthrough().nullable().default(null),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type RentRollData = z.infer<typeof rentRollSchema>;
