// types.ts
// Type definitions for the Syndication (Real Estate Syndication) module.

import type {
  SyndicationProject,
  SyndicationDocument,
  SyndicationInvestor,
  WaterfallTier,
  SyndicationPropertyType,
  EntityType,
  ExemptionType,
} from "@/generated/prisma/client";

// Re-export Prisma enums for convenience
export type { SyndicationPropertyType, EntityType, ExemptionType };

// ─── Full Project Type ───────────────────────────────────────────────

/** SyndicationProject with all relations loaded for doc generation. */
export type SyndicationProjectFull = SyndicationProject & {
  syndicationDocuments: SyndicationDocument[];
  waterfallTiers: WaterfallTier[];
  syndicationInvestors: SyndicationInvestor[];
};

// ─── Compliance Check ────────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  regulation: string;
  category:
    | "securities"
    | "investor_protection"
    | "anti_fraud"
    | "tax"
    | "entity_formation"
    | "fee_disclosure"
    | "waterfall"
    | "financial";
  passed: boolean;
  note: string;
}

// ─── AI Prose Types ──────────────────────────────────────────────────
// Each doc type has a prose interface that defines what the AI generates.
// All financial numbers come from project data — AI writes ONLY prose.

export interface PPMProse {
  secLegend: string;
  executiveSummary: string;
  riskFactors: string[];
  propertyDescription: string;
  marketAnalysis: string;
  businessPlan: string;
  sponsorInformation: string;
  taxConsiderations: string;
  subscriptionProcedures: string;
  operatingAgreementSummary: string;
}

export interface OperatingAgreementProse {
  recitals: string;
  purposeAndBusiness: string;
  capitalContributions: string;
  distributionWaterfall: string;
  managementPowers: string;
  feeProvisions: string;
  reportingObligations: string;
  transferRestrictions: string;
  dissolutionProvisions: string;
  indemnification: string;
  taxElections: string;
  governingLaw: string;
}

export interface SubscriptionAgreementProse {
  recitals: string;
  investorRepresentations: string[];
  accreditedStatusReps: string;
  capitalCallProvisions: string;
  suitabilityRepresentations: string;
  indemnification: string;
  miscellaneous: string;
  governingLaw: string;
}

export interface InvestorQuestionnaireProse {
  introduction: string;
  accreditedIndividualCriteria: string[];
  accreditedEntityCriteria: string[];
  verificationMethods506b: string;
  verificationMethods506c: string;
  incomeVerification: string;
  netWorthVerification: string;
  professionalVerification: string;
  thirdPartyVerification: string;
  ubtiWarning: string;
  representationsAndWarranties: string[];
  certification: string;
}

// ─── Doc Type Labels ─────────────────────────────────────────────────

export const SYNDICATION_DOC_TYPE_LABELS: Record<string, string> = {
  ppm: "Private Placement Memorandum",
  operating_agreement: "LLC Operating Agreement",
  subscription_agreement: "Subscription Agreement",
  investor_questionnaire: "Investor Questionnaire",
  pro_forma: "Pro Forma Financial Projections",
};

// ─── Doc Type List ───────────────────────────────────────────────────

export const SYNDICATION_DOC_TYPES = [
  "ppm",
  "operating_agreement",
  "subscription_agreement",
  "investor_questionnaire",
  "pro_forma",
] as const;

export type SyndicationDocType = (typeof SYNDICATION_DOC_TYPES)[number];
