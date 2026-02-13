// types.ts
// Type definitions for the Compliance (LP Reporting / Fund Administration) module.

import type {
  ComplianceProject,
  ComplianceDocument,
  ReportType,
} from "@/generated/prisma/client";

// Re-export Prisma enums for convenience
export type { ReportType };

// ─── Full Project Type ───────────────────────────────────────────────

/** ComplianceProject with all relations loaded for doc generation. */
export type ComplianceProjectFull = ComplianceProject & {
  complianceDocuments: ComplianceDocument[];
};

// ─── Portfolio Company (from portfolioSummary JSON) ──────────────────

export interface PortfolioCompany {
  company: string;
  dateInvested?: string;
  cost: number;
  fairValue: number;
  percentOfNav?: number;
  irr?: number;
  moic?: number;
  status?: "unrealized" | "partially_realized" | "fully_realized";
}

// ─── Compliance Check ────────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  regulation: string;
  category: "ilpa" | "irs" | "sec" | "regulatory" | "valuation" | "tax" | "standard";
  passed: boolean;
  note: string;
}

// ─── AI Prose Types ──────────────────────────────────────────────────
// Each doc type has a prose interface that defines what the AI generates.
// All financial numbers come from project data — AI writes ONLY prose sections.

export interface LPQuarterlyReportProse {
  fundOverviewNarrative: string;
  marketCommentary: string;
  portfolioHighlights: string;
  feeAndExpenseDisclosure: string;
  gpCommitmentStatus: string;
  outlook: string;
}

export interface CapitalCallNoticeProse {
  callNarrative: string;
  purposeDescription: string;
  wireInstructions: string;
  defaultProvisionsNarrative: string;
}

export interface DistributionNoticeProse {
  distributionNarrative: string;
  waterfallExplanation: string;
  taxWithholdingExplanation: string;
  postDistributionSummary: string;
}

export interface K1SummaryProse {
  coverLetter: string;
  filingInstructions: string;
  specialAllocationsNote: string;
  stateFilingNote: string;
}

export interface AnnualReportProse {
  chairmanLetter: string;
  managementDiscussion: string;
  investmentActivityNarrative: string;
  riskDisclosure: string;
  subsequentEventsDisclosure: string;
  notesToFinancials: string;
}

export interface FormADVSummaryProse {
  materialChanges: string;
  advisoryBusiness: string;
  feesAndCompensation: string;
  performanceBasedFees: string;
  typesOfClients: string;
  methodsOfAnalysis: string;
  disciplinaryInformation: string;
  otherActivities: string;
  codeOfEthics: string;
  brokeragePractices: string;
  reviewOfAccounts: string;
  clientReferrals: string;
  custody: string;
  investmentDiscretion: string;
  proxyVoting: string;
  financialInformation: string;
}

// ─── Doc Type Labels ─────────────────────────────────────────────────

export const COMPLIANCE_DOC_TYPE_LABELS: Record<string, string> = {
  lp_quarterly_report: "LP Quarterly Report",
  capital_call_notice: "Capital Call Notice",
  distribution_notice: "Distribution Notice",
  k1_summary: "K-1 Summary Report",
  annual_report: "Annual Report",
  form_adv_summary: "Form ADV Part 2A Summary",
};

// ─── Report Type → Doc Type Mapping ──────────────────────────────────

export const REPORT_TYPE_TO_DOC_TYPE: Record<string, string> = {
  LP_QUARTERLY_REPORT: "lp_quarterly_report",
  CAPITAL_CALL_NOTICE: "capital_call_notice",
  DISTRIBUTION_NOTICE: "distribution_notice",
  K1_SUMMARY: "k1_summary",
  ANNUAL_REPORT: "annual_report",
  FORM_ADV_SUMMARY: "form_adv_summary",
  // Additional report types that map to existing templates
  CAPITAL_ACCOUNT_STATEMENT: "lp_quarterly_report",
  VALUATION_REPORT: "annual_report",
  AUDITED_FINANCIALS: "annual_report",
  SIDE_LETTER_SUMMARY: "lp_quarterly_report",
};

// ─── Doc Type List ───────────────────────────────────────────────────

export const COMPLIANCE_DOC_TYPES = [
  "lp_quarterly_report",
  "capital_call_notice",
  "distribution_notice",
  "k1_summary",
  "annual_report",
  "form_adv_summary",
] as const;

export type ComplianceDocType = (typeof COMPLIANCE_DOC_TYPES)[number];
