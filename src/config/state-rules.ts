// =============================================================================
// state-rules.ts
// State-specific lending rules — usury limits, licensing, and disclosure
// requirements. Used by the compliance review layer.
// =============================================================================

export interface StateRule {
  state: string;
  abbreviation: string;
  maxInterestRate: number; // Annual rate cap (decimal, e.g. 0.25 = 25%)
  commercialExemption: boolean; // Whether commercial loans are exempt from usury
  commercialExemptionThreshold: number; // Loan amount above which commercial exemption applies
  commercialExemptionCap?: number; // If set, exemption raises cap to this instead of removing it (e.g. FL 25%)
  requiresStateLicense: boolean;
  disclosureRequirements: string[];
  notes: string;
}

// Comprehensive state rules table — usury limits and licensing
// Sources: Individual state statutes, compiled from public legal databases
const STATE_RULES_MAP: Record<string, StateRule> = {
  AL: { state: "Alabama", abbreviation: "AL", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 2000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% default; parties may agree to higher for commercial" },
  AK: { state: "Alaska", abbreviation: "AK", maxInterestRate: 0.105, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "10.5% or 5% above Federal Reserve discount rate" },
  AZ: { state: "Arizona", abbreviation: "AZ", maxInterestRate: 0.36, commercialExemption: true, commercialExemptionThreshold: 10000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "No usury cap for most commercial loans" },
  AR: { state: "Arkansas", abbreviation: "AR", maxInterestRate: 0.17, commercialExemption: false, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Total interest cost"], notes: "Constitutional cap at 17%; one of strictest states" },
  CA: { state: "California", abbreviation: "CA", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 300000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "CFL disclosure"], notes: "10% for personal; commercial >$300K exempt. Licensed lenders may charge more." },
  CO: { state: "Colorado", abbreviation: "CO", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% consumer cap; 45% criminal usury threshold; no cap for commercial" },
  CT: { state: "Connecticut", abbreviation: "CT", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; commercial loans generally exempt" },
  DE: { state: "Delaware", abbreviation: "DE", maxInterestRate: 0.09, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: false, disclosureRequirements: [], notes: "5% + Fed discount rate (floor ~9%); banks/licensed lenders effectively uncapped; >$100K exempt" },
  FL: { state: "Florida", abbreviation: "FL", maxInterestRate: 0.18, commercialExemption: true, commercialExemptionThreshold: 500000, commercialExemptionCap: 0.25, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "18% for <$500K; >$500K capped at 25%; 25% criminal usury threshold" },
  GA: { state: "Georgia", abbreviation: "GA", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 3000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "7% legal rate (O.C.G.A. §7-4-2); written contracts >$3K may agree to any rate" },
  HI: { state: "Hawaii", abbreviation: "HI", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; non-consumer transactions exempt (HRS §478-4)" },
  ID: { state: "Idaho", abbreviation: "ID", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "No usury statute; parties free to agree" },
  IL: { state: "Illinois", abbreviation: "IL", maxInterestRate: 0.09, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "9% general; commercial and business loans exempt" },
  IN: { state: "Indiana", abbreviation: "IN", maxInterestRate: 0.21, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "21% consumer cap; commercial generally exempt" },
  IA: { state: "Iowa", abbreviation: "IA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 25000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% statutory; regulated lenders may exceed" },
  KS: { state: "Kansas", abbreviation: "KS", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "15% general; higher for supervised lenders" },
  KY: { state: "Kentucky", abbreviation: "KY", maxInterestRate: 0.19, commercialExemption: true, commercialExemptionThreshold: 15000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "19% for consumer; commercial generally exempt" },
  LA: { state: "Louisiana", abbreviation: "LA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% conventional; 21% for certain categories" },
  ME: { state: "Maine", abbreviation: "ME", maxInterestRate: 0.06, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% legal rate; business loans generally exempt" },
  MD: { state: "Maryland", abbreviation: "MD", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Total cost of credit"], notes: "8% legal; 24% criminal usury; commercial exempt" },
  MA: { state: "Massachusetts", abbreviation: "MA", maxInterestRate: 0.20, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "20% criminal usury; commercial generally exempt" },
  MI: { state: "Michigan", abbreviation: "MI", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "7% legal; 25% criminal usury; regulated lenders exempt" },
  MN: { state: "Minnesota", abbreviation: "MN", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% legal; commercial loans over $100K exempt" },
  MS: { state: "Mississippi", abbreviation: "MS", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 5000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "10% per annum or 5% over Federal Reserve discount rate" },
  MO: { state: "Missouri", abbreviation: "MO", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 5000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "10% general; business loans may be higher" },
  MT: { state: "Montana", abbreviation: "MT", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "15% contract rate; no usury for business" },
  NE: { state: "Nebraska", abbreviation: "NE", maxInterestRate: 0.16, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "16% general; licensee exemptions available" },
  NV: { state: "Nevada", abbreviation: "NV", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: [], notes: "No usury limit; parties free to contract" },
  NH: { state: "New Hampshire", abbreviation: "NH", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: [], notes: "No usury statute" },
  NJ: { state: "New Jersey", abbreviation: "NJ", maxInterestRate: 0.30, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "30% criminal usury; 6% legal rate; commercial exempt >$50K" },
  NM: { state: "New Mexico", abbreviation: "NM", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "No usury for commercial; 15% legal for consumer" },
  NY: { state: "New York", abbreviation: "NY", maxInterestRate: 0.16, commercialExemption: true, commercialExemptionThreshold: 250000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Rate/fee schedule"], notes: "16% civil usury; 25% criminal usury; commercial >$250K or >$2.5M exempt" },
  NC: { state: "North Carolina", abbreviation: "NC", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 35000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% general; 15% for certain installment; business entities >$35K exempt" },
  ND: { state: "North Dakota", abbreviation: "ND", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 35000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "5.5% + T-Bill rate (floor 7%); variable rate or >$35K commercial exempt" },
  OH: { state: "Ohio", abbreviation: "OH", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% general; 25% criminal usury; commercial >$100K exempt" },
  OK: { state: "Oklahoma", abbreviation: "OK", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "10% usury limit (unlicensed); 6% default absent agreement; commercial exempt" },
  OR: { state: "Oregon", abbreviation: "OR", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% or 5% above discount rate; commercial >$50K exempt" },
  PA: { state: "Pennsylvania", abbreviation: "PA", maxInterestRate: 0.06, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% legal; 25% criminal usury; commercial >$50K exempt" },
  RI: { state: "Rhode Island", abbreviation: "RI", maxInterestRate: 0.21, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "21% alternate max; commercial generally exempt" },
  SC: { state: "South Carolina", abbreviation: "SC", maxInterestRate: 0.085, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8.75% legal; regulated lenders exempt" },
  SD: { state: "South Dakota", abbreviation: "SD", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "No usury limit; parties free to contract" },
  TN: { state: "Tennessee", abbreviation: "TN", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "10% general; 24% max; commercial exempt" },
  TX: { state: "Texas", abbreviation: "TX", maxInterestRate: 0.18, commercialExemption: true, commercialExemptionThreshold: 500000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "18% usury ceiling (Tex. Fin. Code §303.009); commercial >$500K exempt (Ch. 306)" },
  UT: { state: "Utah", abbreviation: "UT", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: [], notes: "No usury limit; parties free to contract" },
  VT: { state: "Vermont", abbreviation: "VT", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; commercial generally exempt" },
  VA: { state: "Virginia", abbreviation: "VA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 5000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% legal; business >$5K generally exempt" },
  WA: { state: "Washington", abbreviation: "WA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% or 4% above T-bill; commercial exempt" },
  WV: { state: "West Virginia", abbreviation: "WV", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% legal; supervised lenders may charge more" },
  WI: { state: "Wisconsin", abbreviation: "WI", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 150000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; business >$150K exempt" },
  WY: { state: "Wyoming", abbreviation: "WY", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "7% legal; no usury for most commercial" },
  DC: { state: "District of Columbia", abbreviation: "DC", maxInterestRate: 0.24, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "24% max; 6% legal rate; commercial generally exempt" },
};

/** Get state rules by 2-letter abbreviation */
export function getStateRules(stateAbbr: string): StateRule | undefined {
  return STATE_RULES_MAP[stateAbbr.toUpperCase()];
}

/** Check if a rate violates state usury for the given loan context */
export function checkUsury(params: {
  stateAbbr: string;
  annualRate: number;
  loanAmount: number;
  isCommercial: boolean;
}): { violates: boolean; limit: number; message: string } {
  const rules = getStateRules(params.stateAbbr);
  if (!rules) {
    return { violates: false, limit: 999, message: "State not found; no usury check possible" };
  }

  // Commercial exemption check
  if (params.isCommercial && rules.commercialExemption) {
    if (params.loanAmount >= rules.commercialExemptionThreshold) {
      // Some states raise the cap instead of removing it (e.g. FL: 25% for >$500K)
      if (rules.commercialExemptionCap != null) {
        if (params.annualRate > rules.commercialExemptionCap) {
          return {
            violates: true,
            limit: rules.commercialExemptionCap,
            message: `Rate ${(params.annualRate * 100).toFixed(2)}% exceeds ${rules.state} commercial cap of ${(rules.commercialExemptionCap * 100).toFixed(2)}%`,
          };
        }
        return { violates: false, limit: rules.commercialExemptionCap, message: "Commercial exemption applies (higher cap)" };
      }
      return { violates: false, limit: rules.maxInterestRate, message: "Commercial exemption applies" };
    }
  }

  // No usury cap states
  if (rules.maxInterestRate >= 999) {
    return { violates: false, limit: 999, message: `${rules.state} has no usury limit` };
  }

  if (params.annualRate > rules.maxInterestRate) {
    return {
      violates: true,
      limit: rules.maxInterestRate,
      message: `Rate ${(params.annualRate * 100).toFixed(2)}% exceeds ${rules.state} usury limit of ${(rules.maxInterestRate * 100).toFixed(2)}%`,
    };
  }

  return { violates: false, limit: rules.maxInterestRate, message: "Within state limit" };
}

/** Get disclosure requirements for a state */
export function getDisclosureRequirements(stateAbbr: string): string[] {
  return getStateRules(stateAbbr)?.disclosureRequirements ?? [];
}

/** All states as a flat array */
export const ALL_STATES = Object.values(STATE_RULES_MAP);
