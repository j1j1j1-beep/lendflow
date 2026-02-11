// Loan Program Configuration System
// Each program defines the entire context chain: required docs, structuring
// rules, covenants, fees, compliance checks, and output documents.
// Rules engine owns all numbers. AI never sets rates/LTV/fees.

import type { DocType } from "@/generated/prisma/client";

// Types

export interface LoanProgram {
  id: string;
  name: string;
  description: string;
  category: "commercial" | "residential" | "specialty";

  // Document requirements
  requiredDocuments: Array<{ docType: DocType; label: string; yearsNeeded?: number }>;
  optionalDocuments: Array<{ docType: DocType; label: string }>;

  // Structuring rules (deterministic — rules engine source of truth)
  structuringRules: {
    maxLtv: number;
    minDscr: number;
    maxDti: number;
    baseRate: "prime" | "sofr" | "treasury";
    spreadRange: [number, number]; // e.g. [0.015, 0.03] = 1.5% to 3%
    maxTerm: number; // months
    maxAmortization: number; // months
    maxLoanAmount: number | null; // null = no cap
    minLoanAmount: number;
    prepaymentPenalty: boolean;
    requiresAppraisal: boolean;
    requiresPersonalGuaranty: boolean;
    collateralTypes: string[];
    interestOnly: boolean;
  };

  // Regulatory context
  applicableRegulations: string[];
  stateSpecificRules: boolean;

  // Standard covenants
  standardCovenants: Array<{
    name: string;
    description: string;
    threshold?: number;
    frequency: "annual" | "quarterly" | "monthly";
  }>;

  // Documents to generate
  requiredOutputDocs: string[];

  // Compliance checks
  complianceChecks: string[];

  // Late fee structure
  lateFeePercent: number; // e.g. 0.05 for 5%
  lateFeeGraceDays: number; // e.g. 15

  // Fee structure
  standardFees: Array<{
    name: string;
    type: "percent" | "flat";
    value: number;
    description: string;
  }>;
}

// Loan Programs

const SBA_7A: LoanProgram = {
  id: "sba_7a",
  name: "SBA 7(a)",
  description: "Small business loan up to $5M with SBA guaranty. Standard program for most small businesses.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business Tax Returns (1120/1120S/1065)", yearsNeeded: 2 },
    { docType: "PROFIT_AND_LOSS", label: "Year-to-Date Profit & Loss Statement" },
    { docType: "BALANCE_SHEET", label: "Current Balance Sheet" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Business Bank Statements (3 months)" },
  ],
  optionalDocuments: [
    { docType: "SCHEDULE_K1", label: "Schedule K-1 (if partnership/S-corp)" },
    { docType: "W2", label: "W-2 Forms (if salaried co-borrower)" },
    { docType: "RENT_ROLL", label: "Rent Roll (if commercial property)" },
  ],

  structuringRules: {
    maxLtv: 0.85,
    minDscr: 1.15,
    maxDti: 0.50,
    baseRate: "prime",
    // SBA 7(a) rate caps by loan size (4 tiers per SBA SOP 50 10 8):
    // ≤$50K: Prime+6.5%, $50K-$250K: Prime+6.0%, $250K-$350K: Prime+4.5%, >$350K: Prime+3.0%
    // As of March 1, 2026, SBA also allows SOFR, 5yr Treasury, and 10yr Treasury as
    // alternative base rates in addition to Prime (see SBA Policy Notice 2025-xxx).
    spreadRange: [0.0, 0.03], // Prime + 0% to Prime + 3.0% (for loans >$350K)
    maxTerm: 300, // 25 years for real estate
    maxAmortization: 300,
    maxLoanAmount: 5_000_000,
    minLoanAmount: 25_000,
    prepaymentPenalty: true,
    requiresAppraisal: true,
    requiresPersonalGuaranty: true,
    collateralTypes: ["real_estate", "equipment", "inventory", "accounts_receivable"],
    interestOnly: false,
  },

  applicableRegulations: [
    "SBA SOP 50 10",
    "TILA/Reg Z",
    "ECOA/Reg B",
    "SBA Size Standards (13 CFR 121)",
    "SBA Affiliation Rules",
    "SBA Credit Elsewhere Test",
    "Flood Disaster Protection Act",
    "BSA/AML",
    "13 CFR 120",
    // Effective March 1, 2026: SBA 7(a) allows SOFR, 5yr Treasury, and 10yr Treasury
    // as alternative base rates in addition to WSJ Prime.
    "SBA Alternative Base Rate Policy (SOFR, 5yr/10yr Treasury)",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Annual Financial Statements", description: "Borrower must provide annual compiled/reviewed financial statements within 90 days of fiscal year end.", frequency: "annual" },
    { name: "Annual Tax Returns", description: "Borrower must provide personal and business tax returns within 30 days of filing.", frequency: "annual" },
    { name: "Minimum DSCR", description: "Maintain minimum debt service coverage ratio.", threshold: 1.15, frequency: "annual" },
    { name: "Life Insurance", description: "Key-man life insurance in amount equal to SBA-guaranteed portion.", frequency: "annual" },
    { name: "Hazard Insurance", description: "Maintain adequate hazard insurance on collateral.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "sba_authorization", "security_agreement",
    "deed_of_trust", "environmental_indemnity", "assignment_of_leases", "ucc_financing_statement",
    "commitment_letter", "corporate_resolution", "settlement_statement", "borrowers_certificate",
    "compliance_certificate", "amortization_schedule", "opinion_letter",
    // SBA regulatory forms
    // NOTE: SBA Form 1920 was retired August 2023 — removed from required docs.
    // NOTE: SBA Form 1919 was revised April 2025 per Executive Order 14168.
    "sba_form_1919", "sba_form_159", "sba_form_148", "sba_form_1050",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["sba_size_standard", "sba_credit_elsewhere", "sba_use_of_proceeds", "ofac_screening", "usury_check", "flood_zone"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 15,

  standardFees: [
    // NOTE: SBA guaranty fee is tiered: 2% (≤$150K), 3% ($150K-$700K), 3.5% ($700K-$1M), 3.75% (>$1M)
    // Using 3.0% as default — should be dynamically calculated based on approved amount in production
    { name: "SBA Guaranty Fee", type: "percent", value: 0.03, description: "3.0% of guaranteed portion (default tier; actual fee is tiered by loan size per SBA SOP)" },
    { name: "Packaging Fee", type: "flat", value: 2500, description: "SBA loan packaging and processing" },
    { name: "Closing Fee", type: "percent", value: 0.005, description: "0.5% of loan amount" },
  ],
};

const SBA_504: LoanProgram = {
  id: "sba_504",
  name: "SBA 504",
  description: "Fixed-asset financing through CDC structure. Up to $5.5M for real estate and equipment.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business Tax Returns", yearsNeeded: 2 },
    { docType: "PROFIT_AND_LOSS", label: "Year-to-Date Profit & Loss Statement" },
    { docType: "BALANCE_SHEET", label: "Current Balance Sheet" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Business Bank Statements (3 months)" },
  ],
  optionalDocuments: [
    { docType: "SCHEDULE_K1", label: "Schedule K-1 (if applicable)" },
    { docType: "RENT_ROLL", label: "Rent Roll" },
  ],

  structuringRules: {
    // 504 structure: 50% bank first lien + 40% CDC second lien + borrower equity injection.
    // Equity injection: 10% standard, 15% for new businesses (<2 years), 20% for special-use properties.
    maxLtv: 0.90,
    minDscr: 1.15,
    maxDti: 0.50,
    baseRate: "treasury", // CDC debenture rate (below-market fixed)
    spreadRange: [0.005, 0.015],
    maxTerm: 300, // 20-25 years for real estate
    maxAmortization: 300,
    maxLoanAmount: 5_500_000, // $5.5M for manufacturing and energy projects per SBA guidelines
    minLoanAmount: 100_000,
    prepaymentPenalty: true,
    requiresAppraisal: true,
    requiresPersonalGuaranty: true,
    collateralTypes: ["real_estate", "heavy_equipment"],
    interestOnly: false,
  },

  applicableRegulations: [
    "SBA SOP 50 10",
    "13 CFR 120",
    "TILA/Reg Z",
    "ECOA/Reg B",
    "SBA Size Standards",
    "SBA Job Creation Requirements",
    "Flood Disaster Protection Act",
    "BSA/AML",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Annual Financial Statements", description: "Borrower must provide annual financial statements.", frequency: "annual" },
    { name: "Job Creation Reporting", description: "Borrower must report on job creation/retention goals.", frequency: "annual" },
    { name: "Occupancy Requirement", description: "Borrower must occupy at least 51% of the property.", frequency: "annual" },
    { name: "Hazard Insurance", description: "Maintain adequate hazard insurance.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "sba_authorization", "security_agreement",
    "cdc_debenture", "deed_of_trust", "environmental_indemnity", "assignment_of_leases", "ucc_financing_statement",
    "commitment_letter", "corporate_resolution", "settlement_statement", "borrowers_certificate",
    "compliance_certificate", "amortization_schedule", "opinion_letter",
    // SBA regulatory forms (1050 is 7(a) only; Form 1920 retired August 2023 — removed)
    // NOTE: SBA Form 1919 was revised April 2025 per Executive Order 14168.
    "sba_form_1919", "sba_form_159", "sba_form_148", "sba_form_1050",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["sba_size_standard", "sba_504_eligibility", "job_creation", "ofac_screening", "usury_check", "flood_zone"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 15,

  standardFees: [
    { name: "CDC Processing Fee", type: "percent", value: 0.015, description: "1.5% of CDC portion" },
    { name: "SBA Guaranty Fee", type: "percent", value: 0.005, description: "0.5% guarantee fee" },
    { name: "Closing Fee", type: "percent", value: 0.005, description: "0.5% of loan amount" },
  ],
};

const COMMERCIAL_CRE: LoanProgram = {
  id: "commercial_cre",
  name: "Commercial Real Estate",
  description: "Term loan for commercial property acquisition or refinance. Income property focused.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business/Entity Tax Returns", yearsNeeded: 2 },
    { docType: "RENT_ROLL", label: "Current Rent Roll" },
    { docType: "PROFIT_AND_LOSS", label: "Operating Statement (T-12)" },
    { docType: "BALANCE_SHEET", label: "Personal Financial Statement" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Bank Statements (3 months)" },
  ],
  optionalDocuments: [
    { docType: "SCHEDULE_K1", label: "Schedule K-1" },
    { docType: "W2", label: "W-2 (if salaried income)" },
  ],

  structuringRules: {
    maxLtv: 0.75,
    minDscr: 1.25,
    maxDti: 0.45,
    baseRate: "sofr",
    spreadRange: [0.02, 0.04],
    maxTerm: 120, // 10 years (balloon)
    maxAmortization: 360, // 30-year amortization
    maxLoanAmount: null,
    minLoanAmount: 250_000,
    prepaymentPenalty: true,
    requiresAppraisal: true,
    requiresPersonalGuaranty: true,
    collateralTypes: ["commercial_real_estate"],
    interestOnly: false,
  },

  applicableRegulations: [
    "TILA/Reg Z",
    "RESPA/Reg X (only if owner-occupied with consumer purpose)",
    "ECOA/Reg B",
    "CRA (Community Reinvestment Act)",
    "FIRREA (appraisal requirements)",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Annual Operating Statements", description: "Provide annual property operating statements within 90 days of year end.", frequency: "annual" },
    { name: "Annual Rent Roll", description: "Provide updated rent roll annually.", frequency: "annual" },
    // Covenant threshold (1.20) is lower than origination minDscr (1.25) — origination standard is stricter to provide cushion; covenant is the ongoing maintenance floor
    { name: "Minimum DSCR", description: "Maintain minimum DSCR on the property.", threshold: 1.20, frequency: "annual" },
    { name: "Hazard Insurance", description: "Maintain property insurance with lender as loss payee.", frequency: "annual" },
    { name: "Environmental Compliance", description: "Maintain compliance with all environmental regulations.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "security_agreement", "deed_of_trust",
    "assignment_of_leases", "ucc_financing_statement", "commitment_letter", "corporate_resolution",
    "environmental_indemnity", "snda", "estoppel_certificate", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "flood_zone", "environmental_phase1"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 10,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.01, description: "1% of loan amount" },
    { name: "Appraisal Fee", type: "flat", value: 4500, description: "Commercial appraisal" },
    { name: "Environmental Phase I", type: "flat", value: 3000, description: "Phase I ESA" },
    { name: "Legal Fees", type: "flat", value: 5000, description: "Lender's counsel" },
  ],
};

const DSCR_LOAN: LoanProgram = {
  id: "dscr",
  name: "DSCR Loan",
  description: "Investment property loan qualified by property cash flow, not personal income. 1-4 unit residential.",
  category: "residential",

  requiredDocuments: [
    { docType: "RENT_ROLL", label: "Current Rent Roll / Lease Agreements" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Bank Statements (2 months for reserves)" },
  ],
  optionalDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (not required but helpful)" },
    { docType: "PROFIT_AND_LOSS", label: "Property Operating Statement" },
    { docType: "BALANCE_SHEET", label: "Personal Financial Statement" },
  ],

  structuringRules: {
    maxLtv: 0.80,
    minDscr: 1.00, // Some allow 0.75 with compensating factors
    maxDti: 1.0, // No personal DTI requirement
    baseRate: "sofr",
    spreadRange: [0.03, 0.06],
    maxTerm: 360,
    maxAmortization: 360,
    maxLoanAmount: 3_000_000,
    minLoanAmount: 75_000,
    // Dodd-Frank Section 1414 prohibits prepayment penalties on non-QM residential mortgages.
    // DSCR loans on investment properties are business-purpose and may be exempt, but we
    // default to false for safety. Override only for confirmed investment-property-only deals.
    prepaymentPenalty: false,
    requiresAppraisal: true,
    requiresPersonalGuaranty: false,
    collateralTypes: ["residential_1_4"],
    interestOnly: true,
  },

  applicableRegulations: [
    "TILA/Reg Z",
    // NOTE: DSCR loans on investment properties are likely TRID-exempt as business-purpose
    // under Reg Z 1026.3(a)(1). Review on a per-loan basis — if the borrower occupies the
    // property or uses it as a primary residence, TRID applies.
    "RESPA/Reg X",
    "ECOA/Reg B",
    "HMDA/Reg C",
    "ATR/QM (non-QM)",
    "State licensing requirements",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Property Insurance", description: "Maintain hazard insurance with lender as loss payee.", frequency: "annual" },
    { name: "Annual Rent Roll", description: "Provide updated rent roll.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "deed_of_trust", "closing_disclosure", "loan_estimate",
    "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "flood_zone", "hpml_check", "atr_check"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 15,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.015, description: "1.5% of loan amount" },
    { name: "Appraisal Fee", type: "flat", value: 600, description: "Residential appraisal" },
    { name: "Processing Fee", type: "flat", value: 1500, description: "Loan processing" },
  ],
};

const BANK_STATEMENT: LoanProgram = {
  id: "bank_statement",
  name: "Bank Statement Loan",
  description: "Self-employed borrower program. Uses 12-24 months of bank deposits instead of tax returns.",
  category: "residential",

  requiredDocuments: [
    { docType: "BANK_STATEMENT_CHECKING", label: "Personal/Business Bank Statements (12-24 months)" },
    { docType: "PROFIT_AND_LOSS", label: "CPA-prepared P&L (required by some investors)" },
  ],
  optionalDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns" },
    { docType: "BALANCE_SHEET", label: "Business Balance Sheet" },
    { docType: "W2", label: "W-2 (if hybrid income)" },
  ],

  structuringRules: {
    maxLtv: 0.80,
    minDscr: 1.0, // Uses deposit-based income calculation, but ATR requires repayment ability
    maxDti: 0.50,
    baseRate: "sofr",
    spreadRange: [0.035, 0.06],
    maxTerm: 360,
    maxAmortization: 360,
    maxLoanAmount: 3_000_000,
    minLoanAmount: 100_000,
    // Dodd-Frank Section 1414 prohibits prepayment penalties on non-QM residential mortgages.
    // Bank statement loans may serve primary residences, so default to false.
    prepaymentPenalty: false,
    requiresAppraisal: true,
    requiresPersonalGuaranty: false,
    collateralTypes: ["residential_1_4", "residential_condo"],
    interestOnly: true,
  },

  applicableRegulations: [
    "TILA/Reg Z",
    "RESPA/Reg X",
    "ECOA/Reg B",
    "HMDA/Reg C",
    "ATR/QM (non-QM)",
    "State licensing requirements",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Property Insurance", description: "Maintain hazard insurance.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "deed_of_trust", "closing_disclosure", "loan_estimate",
    "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "flood_zone", "atr_check", "hpml_check"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 15,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.02, description: "2% of loan amount" },
    { name: "Appraisal Fee", type: "flat", value: 600, description: "Residential appraisal" },
    { name: "Processing Fee", type: "flat", value: 1500, description: "Loan processing" },
    { name: "Underwriting Fee", type: "flat", value: 1000, description: "Underwriting review" },
  ],
};

const CONVENTIONAL_BUSINESS: LoanProgram = {
  id: "conventional_business",
  name: "Conventional Business Term",
  description: "Standard unsecured or partially secured business term loan.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business Tax Returns", yearsNeeded: 2 },
    { docType: "PROFIT_AND_LOSS", label: "Year-to-Date P&L" },
    { docType: "BALANCE_SHEET", label: "Current Balance Sheet" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Business Bank Statements (3 months)" },
  ],
  optionalDocuments: [
    { docType: "SCHEDULE_K1", label: "Schedule K-1" },
    { docType: "W2", label: "W-2 (guarantor)" },
  ],

  structuringRules: {
    maxLtv: 0.70,
    minDscr: 1.25,
    maxDti: 0.45,
    baseRate: "prime",
    spreadRange: [0.01, 0.035],
    maxTerm: 84, // 7 years typical
    maxAmortization: 84,
    maxLoanAmount: null,
    minLoanAmount: 50_000,
    prepaymentPenalty: false,
    requiresAppraisal: false,
    requiresPersonalGuaranty: true,
    collateralTypes: ["equipment", "inventory", "accounts_receivable", "blanket_lien"],
    interestOnly: false,
  },

  applicableRegulations: [
    "TILA/Reg Z (if applicable)",
    "ECOA/Reg B",
    "UCC Article 9",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Annual Financial Statements", description: "Provide annual compiled financial statements.", frequency: "annual" },
    { name: "Annual Tax Returns", description: "Provide personal and business tax returns.", frequency: "annual" },
    // Covenant threshold (1.20) is lower than origination minDscr (1.25) — origination standard is stricter to provide cushion; covenant is the ongoing maintenance floor
    { name: "Minimum DSCR", description: "Maintain minimum DSCR.", threshold: 1.20, frequency: "annual" },
    { name: "Minimum Working Capital", description: "Maintain positive working capital.", frequency: "quarterly" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "security_agreement", "ucc_financing_statement",
    "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "flood_zone"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 10,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.01, description: "1% of loan amount" },
    { name: "Documentation Fee", type: "flat", value: 500, description: "Document preparation" },
  ],
};

const LINE_OF_CREDIT: LoanProgram = {
  id: "line_of_credit",
  name: "Business Line of Credit",
  description: "Revolving credit facility for working capital needs.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business Tax Returns", yearsNeeded: 2 },
    { docType: "PROFIT_AND_LOSS", label: "Year-to-Date P&L" },
    { docType: "BALANCE_SHEET", label: "Current Balance Sheet" },
    { docType: "BANK_STATEMENT_CHECKING", label: "Business Bank Statements (6 months)" },
  ],
  optionalDocuments: [
    { docType: "SCHEDULE_K1", label: "Schedule K-1" },
  ],

  structuringRules: {
    maxLtv: 0.60,
    minDscr: 1.20,
    maxDti: 0.45,
    baseRate: "prime",
    spreadRange: [0.005, 0.025],
    maxTerm: 12, // Annual renewal
    maxAmortization: 0, // Interest-only revolving — payment calculations must handle interest-only specially
    maxLoanAmount: null,
    minLoanAmount: 25_000,
    prepaymentPenalty: false,
    requiresAppraisal: false,
    requiresPersonalGuaranty: true,
    collateralTypes: ["accounts_receivable", "inventory", "blanket_lien"],
    interestOnly: true,
  },

  applicableRegulations: [
    "TILA/Reg Z (if applicable)",
    "ECOA/Reg B",
    "UCC Article 9",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Annual Financial Statements", description: "Provide annual financial statements.", frequency: "annual" },
    { name: "Borrowing Base Certificate", description: "Monthly borrowing base certificate.", frequency: "monthly" },
    { name: "Annual Clean-Up", description: "Zero balance for 30 consecutive days annually.", frequency: "annual" },
    { name: "Minimum Current Ratio", description: "Maintain minimum current ratio of 1.2:1.", threshold: 1.2, frequency: "quarterly" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "security_agreement", "ucc_financing_statement",
    "borrowing_base_agreement", "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 10,

  standardFees: [
    { name: "Commitment Fee", type: "percent", value: 0.0025, description: "0.25% on unused portion" },
    { name: "Annual Renewal Fee", type: "flat", value: 500, description: "Annual line renewal" },
  ],
};

const EQUIPMENT_FINANCING: LoanProgram = {
  id: "equipment_financing",
  name: "Equipment Financing",
  description: "Asset-based loan for equipment purchase. Equipment serves as primary collateral.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 2 },
    { docType: "FORM_1120", label: "Business Tax Returns", yearsNeeded: 2 },
    { docType: "BANK_STATEMENT_CHECKING", label: "Business Bank Statements (3 months)" },
    { docType: "BALANCE_SHEET", label: "Current Balance Sheet" },
  ],
  optionalDocuments: [
    { docType: "PROFIT_AND_LOSS", label: "Year-to-Date P&L" },
    { docType: "SCHEDULE_K1", label: "Schedule K-1" },
  ],

  structuringRules: {
    maxLtv: 0.85, // Of equipment value
    minDscr: 1.15,
    maxDti: 0.50,
    baseRate: "prime",
    spreadRange: [0.02, 0.045],
    maxTerm: 84, // 7 years or useful life of equipment
    maxAmortization: 84,
    maxLoanAmount: null,
    minLoanAmount: 10_000,
    prepaymentPenalty: true,
    requiresAppraisal: true, // Equipment appraisal
    requiresPersonalGuaranty: true,
    collateralTypes: ["equipment"],
    interestOnly: false,
  },

  applicableRegulations: [
    "UCC Article 9",
    "ECOA/Reg B",
    "TILA/Reg Z (if consumer purpose)",
  ],
  stateSpecificRules: false,

  standardCovenants: [
    { name: "Equipment Insurance", description: "Maintain insurance on financed equipment.", frequency: "annual" },
    { name: "Annual Financial Statements", description: "Provide annual financial statements.", frequency: "annual" },
    { name: "Equipment Maintenance", description: "Maintain equipment in good working condition.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "security_agreement", "ucc_financing_statement",
    "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "ucc_lien_search"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 10,

  standardFees: [
    { name: "Documentation Fee", type: "flat", value: 500, description: "Document preparation" },
    { name: "UCC Filing Fee", type: "flat", value: 150, description: "UCC-1 filing" },
  ],
};

const BRIDGE_LOAN: LoanProgram = {
  id: "bridge",
  name: "Bridge Loan",
  description: "Short-term financing for acquisition, renovation, or repositioning. Higher rate, faster closing.",
  category: "commercial",

  requiredDocuments: [
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 1 },
    { docType: "BANK_STATEMENT_CHECKING", label: "Bank Statements (proof of liquidity)" },
    { docType: "BALANCE_SHEET", label: "Personal Financial Statement" },
  ],
  optionalDocuments: [
    { docType: "RENT_ROLL", label: "Current/Pro-Forma Rent Roll" },
    { docType: "PROFIT_AND_LOSS", label: "Property Operating Statement" },
    { docType: "FORM_1120", label: "Business Tax Returns" },
  ],

  structuringRules: {
    maxLtv: 0.70,
    minDscr: 1.0, // Minimum repayment ability threshold even for bridge loans
    maxDti: 0.50,
    baseRate: "prime",
    spreadRange: [0.04, 0.08],
    maxTerm: 36, // 3 years max
    maxAmortization: 0, // Interest-only
    maxLoanAmount: null,
    minLoanAmount: 100_000,
    prepaymentPenalty: false,
    requiresAppraisal: true,
    requiresPersonalGuaranty: true,
    collateralTypes: ["real_estate", "commercial_real_estate"],
    interestOnly: true,
  },

  applicableRegulations: [
    "TILA/Reg Z (if consumer purpose)",
    "ECOA/Reg B",
    "FIRREA",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Exit Strategy", description: "Borrower must demonstrate viable exit strategy (refinance or sale).", frequency: "quarterly" },
    { name: "Construction Progress", description: "If renovation, provide progress reports.", frequency: "monthly" },
    { name: "Property Insurance", description: "Maintain builder's risk or hazard insurance.", frequency: "annual" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "guaranty", "deed_of_trust", "security_agreement",
    "environmental_indemnity", "assignment_of_leases", "commitment_letter", "corporate_resolution",
    "settlement_statement", "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "flood_determination", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "flood_zone"],

  lateFeePercent: 0.06,
  lateFeeGraceDays: 5,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.02, description: "2% of loan amount" },
    { name: "Exit Fee", type: "percent", value: 0.01, description: "1% at payoff" },
    { name: "Appraisal Fee", type: "flat", value: 4500, description: "As-is and as-stabilized appraisal" },
  ],
};

const CRYPTO_COLLATERALIZED: LoanProgram = {
  id: "crypto_collateral",
  name: "Crypto-Collateralized Loan",
  description: "Loan secured by digital assets (BTC, ETH). 70% max LTV with real-time margin monitoring.",
  category: "specialty",

  requiredDocuments: [
    { docType: "BANK_STATEMENT_CHECKING", label: "Bank Statements (2 months)" },
    { docType: "FORM_1040", label: "Personal Tax Returns (1040)", yearsNeeded: 1 },
  ],
  optionalDocuments: [
    { docType: "BALANCE_SHEET", label: "Personal Financial Statement" },
  ],

  structuringRules: {
    maxLtv: 0.70, // Conservative due to crypto volatility
    minDscr: 0,
    maxDti: 0.50,
    baseRate: "sofr",
    spreadRange: [0.04, 0.08],
    maxTerm: 60, // 5 years
    maxAmortization: 60,
    maxLoanAmount: 10_000_000,
    minLoanAmount: 50_000,
    prepaymentPenalty: false,
    requiresAppraisal: false,
    requiresPersonalGuaranty: false,
    collateralTypes: ["digital_assets"],
    interestOnly: true,
  },

  applicableRegulations: [
    "TILA/Reg Z",
    "ECOA/Reg B",
    "BSA/AML",
    "State money transmitter laws",
    "FinCEN requirements",
    "SEC digital asset guidance",
    "State digital asset lending laws",
    // GENIUS Act (Guiding and Establishing National Innovation for U.S. Stablecoins)
    // Signed into law July 18, 2025. Establishes federal framework for stablecoin issuers
    // and affects digital asset lending collateral requirements for stablecoin-backed loans.
    "GENIUS Act (stablecoin regulatory framework)",
  ],
  stateSpecificRules: true,

  standardCovenants: [
    { name: "Margin Call", description: "If LTV exceeds 80%, borrower must post additional collateral within 24 hours.", frequency: "monthly" },
    { name: "Liquidation Trigger", description: "If LTV exceeds 90%, lender may liquidate collateral.", frequency: "monthly" },
    { name: "Wallet Verification", description: "Collateral must remain in custodial wallet.", frequency: "monthly" },
  ],

  requiredOutputDocs: [
    "promissory_note", "loan_agreement", "digital_asset_pledge", "custody_agreement",
    "commitment_letter", "corporate_resolution", "settlement_statement",
    "borrowers_certificate", "compliance_certificate", "amortization_schedule", "opinion_letter",
    // Universal compliance forms
    "irs_4506c", "irs_w9", "privacy_notice", "patriot_act_notice", "disbursement_authorization",
  ],
  complianceChecks: ["ofac_screening", "usury_check", "bsa_aml", "source_of_funds", "genius_act"],

  lateFeePercent: 0.05,
  lateFeeGraceDays: 10,

  standardFees: [
    { name: "Origination Fee", type: "percent", value: 0.015, description: "1.5% of loan amount" },
    { name: "Custody Fee", type: "percent", value: 0.005, description: "0.5% annual custody fee on collateral" },
  ],
};

// Registry

export const LOAN_PROGRAMS: Record<string, LoanProgram> = {
  sba_7a: SBA_7A,
  sba_504: SBA_504,
  commercial_cre: COMMERCIAL_CRE,
  dscr: DSCR_LOAN,
  bank_statement: BANK_STATEMENT,
  conventional_business: CONVENTIONAL_BUSINESS,
  line_of_credit: LINE_OF_CREDIT,
  equipment_financing: EQUIPMENT_FINANCING,
  bridge: BRIDGE_LOAN,
  crypto_collateral: CRYPTO_COLLATERALIZED,
};

/** Ordered list for UI dropdowns */
export const LOAN_PROGRAM_LIST: LoanProgram[] = [
  SBA_7A,
  SBA_504,
  COMMERCIAL_CRE,
  DSCR_LOAN,
  BANK_STATEMENT,
  CONVENTIONAL_BUSINESS,
  LINE_OF_CREDIT,
  EQUIPMENT_FINANCING,
  BRIDGE_LOAN,
  CRYPTO_COLLATERALIZED,
];

/** Get a loan program by ID, returns undefined if not found */
export function getLoanProgram(id: string): LoanProgram | undefined {
  return LOAN_PROGRAMS[id];
}
