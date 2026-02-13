// types.ts
// Type definitions for the Deals (M&A Transactions) module.

import type {
  MAProject,
  MADocument,
  TransactionType,
  HSRStatus,
  TaxStructure,
} from "@/generated/prisma/client";

// Re-export Prisma enums for convenience
export type { TransactionType, HSRStatus, TaxStructure };

// ─── Full Project Type ───────────────────────────────────────────────

/** MAProject with all relations loaded for doc generation. */
export type MAProjectFull = MAProject & {
  maDocuments: MADocument[];
};

// ─── Compliance Check ────────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  regulation: string;
  category: "hsr" | "securities" | "tax" | "dgcl" | "cfius" | "general" | "indemnification" | "escrow";
  passed: boolean;
  note: string;
}

// ─── AI Prose Types ──────────────────────────────────────────────────
// Each doc type has a prose interface that defines what the AI generates.
// All financial numbers come from project data — AI writes ONLY prose.

export interface LOIProse {
  openingParagraph: string;
  purchasePriceProvision: string;
  structureDescription: string;
  dueDiligenceScope: string[];
  closingConditions: string[];
  exclusivityProvision: string;
  confidentialityProvision: string;
  expenseAllocation: string;
  bindingNonBindingStatement: string;
  governingLaw: string;
}

export interface NDAProse {
  confidentialInfoDefinition: string;
  permittedUse: string;
  permittedDisclosures: string;
  termAndDuration: string;
  nonSolicitation: string;
  standstillProvision: string;
  residualKnowledge: string;
  remedies: string;
  returnOfMaterials: string;
  governingLaw: string;
}

export interface PurchaseAgreementProse {
  recitals: string;
  purchaseAndSale: string;
  considerationProvisions: string;
  workingCapitalAdjustment: string;
  sellerRepresentations: string[];
  buyerRepresentations: string[];
  preClosingCovenants: string[];
  postClosingCovenants: string[];
  closingConditions: string[];
  indemnificationProvisions: string;
  terminationProvisions: string;
  nonCompeteProvision: string;
  miscellaneous: string;
  governingLaw: string;
}

export interface DueDiligenceChecklistItem {
  category: string;
  item: string;
  status: "open";
  priority: "high" | "medium" | "low";
  assignedTo: string;
}

export interface DisclosureSchedulesProse {
  generalDisclosureProvision: string;
  capitalizationSchedule: string;
  subsidiariesSchedule: string;
  materialContractsSchedule: string;
  litigationSchedule: string;
  ipSchedule: string;
  realPropertySchedule: string;
  environmentalSchedule: string;
  taxSchedule: string;
  insuranceSchedule: string;
  employeesSchedule: string;
}

export interface ClosingChecklistItem {
  category: string;
  item: string;
  responsible: "buyer" | "seller" | "both" | "third_party";
  status: "open";
  notes: string;
}

// ─── Doc Type Labels ─────────────────────────────────────────────────

export const MA_DOC_TYPE_LABELS: Record<string, string> = {
  loi: "Letter of Intent / Term Sheet",
  nda: "Non-Disclosure Agreement",
  purchase_agreement: "Purchase Agreement",
  stock_purchase_agreement: "Stock Purchase Agreement",
  asset_purchase_agreement: "Asset Purchase Agreement",
  merger_agreement: "Merger Agreement",
  due_diligence_checklist: "Due Diligence Checklist",
  disclosure_schedules: "Disclosure Schedules",
  closing_checklist: "Closing Checklist",
};

// ─── Doc Type List ───────────────────────────────────────────────────

export const MA_DOC_TYPES = [
  "loi",
  "nda",
  "purchase_agreement",
  "due_diligence_checklist",
  "disclosure_schedules",
  "closing_checklist",
] as const;

export type MADocType = (typeof MA_DOC_TYPES)[number];
