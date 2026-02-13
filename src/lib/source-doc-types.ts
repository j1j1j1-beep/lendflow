// Source document definitions per module.
// Each entry defines an upload slot with its label, required flag,
// and which generated output documents it affects.

export type SourceDocDef = {
  key: string;
  label: string;
  required: boolean;
  description: string;
  affectsOutputDocs: string[];
};

export type ModuleName = "capital" | "syndication" | "ma" | "compliance";

export const SOURCE_DOCS: Record<ModuleName, SourceDocDef[]> = {
  capital: [
    {
      key: "fund_business_plan",
      label: "Fund Business Plan",
      required: true,
      description: "The fund's business plan outlining strategy, target returns, and investment thesis",
      affectsOutputDocs: ["PPM", "Operating Agreement"],
    },
    {
      key: "formation_docs",
      label: "Formation Documents / Articles",
      required: true,
      description: "Articles of incorporation or formation, organizational documents",
      affectsOutputDocs: ["PPM", "Operating Agreement", "Form D Draft"],
    },
    {
      key: "management_bios",
      label: "Management Team Bios",
      required: true,
      description: "Biographies and track records of the management team / key persons",
      affectsOutputDocs: ["PPM", "Investor Questionnaire"],
    },
    {
      key: "prior_fund_track_record",
      label: "Prior Fund Track Record",
      required: false,
      description: "Performance data from prior funds managed by the same team",
      affectsOutputDocs: ["PPM"],
    },
    {
      key: "tax_opinion",
      label: "Tax Opinion Letter",
      required: false,
      description: "Tax counsel opinion on fund structure and tax treatment",
      affectsOutputDocs: ["PPM", "Subscription Agreement"],
    },
    {
      key: "existing_investor_agreements",
      label: "Existing Investor Agreements",
      required: false,
      description: "Any existing side letters or investor agreements that must be referenced",
      affectsOutputDocs: ["Side Letter"],
    },
  ],

  syndication: [
    {
      key: "property_appraisal",
      label: "Property Appraisal",
      required: true,
      description: "Independent appraisal of the subject property",
      affectsOutputDocs: ["PPM", "Pro Forma"],
    },
    {
      key: "rent_roll",
      label: "Current Rent Roll",
      required: true,
      description: "Current tenant rent roll showing units, rents, lease terms",
      affectsOutputDocs: ["Pro Forma", "PPM"],
    },
    {
      key: "property_financials",
      label: "Property Financial Statements",
      required: true,
      description: "Historical financial statements (T-12, P&L) for the property",
      affectsOutputDocs: ["Pro Forma", "PPM"],
    },
    {
      key: "purchase_contract",
      label: "Purchase Contract",
      required: true,
      description: "The executed or draft purchase and sale agreement",
      affectsOutputDocs: ["PPM", "Operating Agreement"],
    },
    {
      key: "environmental_phase1",
      label: "Phase I Environmental",
      required: false,
      description: "Phase I environmental site assessment",
      affectsOutputDocs: ["PPM"],
    },
    {
      key: "property_inspection",
      label: "Property Inspection Report",
      required: false,
      description: "Physical inspection / condition report of the property",
      affectsOutputDocs: ["PPM"],
    },
    {
      key: "title_commitment",
      label: "Title Commitment",
      required: false,
      description: "Title commitment or preliminary title report",
      affectsOutputDocs: ["PPM"],
    },
    {
      key: "survey",
      label: "Survey / Site Plan",
      required: false,
      description: "ALTA survey or site plan for the property",
      affectsOutputDocs: ["PPM"],
    },
  ],

  ma: [
    {
      key: "target_financials",
      label: "Target Company Financials",
      required: true,
      description: "Audited or reviewed financial statements for the target company",
      affectsOutputDocs: ["Purchase Agreement", "Due Diligence Checklist", "Disclosure Schedules"],
    },
    {
      key: "target_tax_returns",
      label: "Target Tax Returns",
      required: true,
      description: "Federal and state tax returns for the target company (last 3 years)",
      affectsOutputDocs: ["Purchase Agreement", "Due Diligence Checklist"],
    },
    {
      key: "articles_of_incorporation",
      label: "Articles of Incorporation",
      required: true,
      description: "Certificate of incorporation and bylaws of the target company",
      affectsOutputDocs: ["Purchase Agreement", "NDA"],
    },
    {
      key: "material_contracts",
      label: "Material Contracts List",
      required: true,
      description: "List and copies of all material contracts, leases, and agreements",
      affectsOutputDocs: ["Purchase Agreement", "Disclosure Schedules", "Due Diligence Checklist"],
    },
    {
      key: "employee_roster",
      label: "Employee Roster / Org Chart",
      required: false,
      description: "Complete employee roster with compensation data and organizational chart",
      affectsOutputDocs: ["Purchase Agreement", "Due Diligence Checklist"],
    },
    {
      key: "ip_inventory",
      label: "IP / Intangible Assets Inventory",
      required: false,
      description: "Inventory of all intellectual property, patents, trademarks, and trade secrets",
      affectsOutputDocs: ["Purchase Agreement", "Disclosure Schedules"],
    },
    {
      key: "environmental_reports",
      label: "Environmental Reports",
      required: false,
      description: "Environmental assessments and compliance reports",
      affectsOutputDocs: ["Due Diligence Checklist"],
    },
    {
      key: "existing_loi",
      label: "Existing LOI (if any)",
      required: false,
      description: "Any existing letter of intent or term sheet already executed",
      affectsOutputDocs: ["LOI"],
    },
  ],

  compliance: [
    {
      key: "prior_period_financials",
      label: "Prior Period Financials",
      required: true,
      description: "Financial statements for the prior reporting period",
      affectsOutputDocs: ["LP Quarterly Report", "Annual Report"],
    },
    {
      key: "capital_account_data",
      label: "Capital Account Data",
      required: true,
      description: "Capital account statements and activity for all LPs",
      affectsOutputDocs: ["Capital Call Notice", "Distribution Notice", "K-1 Summary"],
    },
    {
      key: "nav_calculations",
      label: "NAV Calculations",
      required: false,
      description: "Net asset value calculations and supporting schedules",
      affectsOutputDocs: ["LP Quarterly Report", "Valuation Report"],
    },
    {
      key: "prior_audit_report",
      label: "Prior Audit Report",
      required: false,
      description: "Most recent audited financial statements and auditor's report",
      affectsOutputDocs: ["Annual Report", "Audited Financials"],
    },
  ],
};

/** Get source doc definitions for a module. Returns empty array for unknown modules. */
export function getSourceDocsForModule(module: string): SourceDocDef[] {
  return SOURCE_DOCS[module as ModuleName] ?? [];
}

/** Get a specific source doc definition by module and key. */
export function getSourceDocDef(module: string, key: string): SourceDocDef | undefined {
  return getSourceDocsForModule(module).find((d) => d.key === key);
}
