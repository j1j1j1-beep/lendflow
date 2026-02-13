// types.ts
// Type definitions for the Capital (Fund Formation / Private Placement) module.

import type {
  CapitalProject,
  CapitalDocument,
  CapitalInvestor,
  ExemptionType,
  ICAExemption,
  FundType,
} from "@/generated/prisma/client";

// Re-export Prisma enums for convenience
export type { ExemptionType, ICAExemption, FundType };

// ─── Full Project Type ───────────────────────────────────────────────

/** CapitalProject with all relations loaded for doc generation. */
export type CapitalProjectFull = CapitalProject & {
  capitalDocuments: CapitalDocument[];
  capitalInvestors: CapitalInvestor[];
};

// ─── Compliance Check ────────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  regulation: string;
  category: "securities" | "investor_protection" | "anti_fraud" | "ica" | "form_d" | "state_filing" | "erisa" | "tax";
  passed: boolean;
  note: string;
}

// ─── AI Prose Types ──────────────────────────────────────────────────
// Each doc type has a prose interface that defines what the AI generates.
// All financial numbers come from project data — AI writes ONLY prose.

export interface PPMProse {
  secLegend: string;
  summaryOfTerms: string;
  riskFactors: string[];
  useOfProceeds: string;
  managementBios: string;
  investmentStrategy: string;
  termsOfOffering: string;
  conflictsOfInterest: string;
  taxConsiderations: string;
  erisaConsiderations: string;
  subscriptionProcedures: string;
  legalMatters: string;
  generalSolicitationDisclosure: string;
  accreditationDisclosure: string;
}

export interface SubscriptionAgreementProse {
  recitals: string;
  investorRepresentations: string[];
  suitabilityRepresentations: string[];
  erisaRepresentations: string;
  taxRepresentations: string;
  amlKycRepresentations: string;
  accreditationCertification: string;
  verificationSection: string;
  indemnification: string;
  miscellaneous: string;
  governingLaw: string;
}

export interface OperatingAgreementProse {
  recitals: string;
  formationAndPurpose: string;
  capitalContributions: string;
  capitalAccounts: string;
  distributionWaterfall: string;
  managementFeeProvisions: string;
  clawbackProvision: string;
  keyPersonProvision: string;
  investmentRestrictions: string;
  advisoryCommittee: string;
  transferRestrictions: string;
  noFaultRemoval: string;
  termAndExtensions: string;
  indemnification: string;
  confidentiality: string;
  sideLetterDisclosure: string;
  governingLaw: string;
}

export interface InvestorQuestionnaireProse {
  introduction: string;
  accreditedIndividualCriteria: string[];
  accreditedEntityCriteria: string[];
  qualifiedPurchaserCriteria: string[];
  verificationInstructions: string;
  incomeVerification: string;
  netWorthVerification: string;
  professionalVerification: string;
  thirdPartyVerification: string;
  representationsAndWarranties: string[];
  certification: string;
}

export interface SideLetterProse {
  recitals: string;
  mfnProvision: string;
  feeDiscount: string;
  coInvestmentRights: string;
  enhancedReporting: string;
  excuseRights: string;
  keyPersonModifications: string;
  transferRights: string;
  regulatoryCarveOuts: string;
  miscellaneous: string;
  governingLaw: string;
}

export interface FormDDraftProse {
  issuerDescription: string;
  offeringDescription: string;
  useOfProceeds: string;
  salesCompensation: string;
  relatedPersonsDescription: string;
  additionalNotes: string;
}

// ─── Doc Type Labels ─────────────────────────────────────────────────

export const CAPITAL_DOC_TYPE_LABELS: Record<string, string> = {
  ppm: "Private Placement Memorandum",
  subscription_agreement: "Subscription Agreement",
  operating_agreement: "Operating Agreement",
  investor_questionnaire: "Investor Questionnaire",
  side_letter: "Side Letter",
  form_d_draft: "Form D Draft",
};

// ─── Doc Type List ───────────────────────────────────────────────────

export const CAPITAL_DOC_TYPES = [
  "ppm",
  "subscription_agreement",
  "operating_agreement",
  "investor_questionnaire",
  "side_letter",
  "form_d_draft",
] as const;

export type CapitalDocType = (typeof CAPITAL_DOC_TYPES)[number];
