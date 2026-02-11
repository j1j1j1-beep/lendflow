// state-rules.ts
// State-specific lending rules — usury limits, licensing, and disclosure
// requirements. Used by the compliance review layer.

export interface StateRule {
  state: string;
  abbreviation: string;
  maxInterestRate: number; // Annual rate cap (decimal, e.g. 0.25 = 25%)
  commercialExemption: boolean; // Whether commercial loans are exempt from usury
  commercialExemptionThreshold: number; // Loan amount above which commercial exemption applies
  commercialExemptionCap?: number; // If set, exemption raises cap to this instead of removing it (e.g. FL 25%)
  criminalUsuryCap?: number; // Hard criminal-usury ceiling that applies even when civil usury is exempt (decimal)
  criminalUsuryExemptionThreshold?: number; // Loan amount above which even criminal usury is exempt (e.g. NY $2.5M)
  commercialDisclosureRequired?: boolean; // True if state requires TILA-like disclosures for commercial financing
  requiresStateLicense: boolean;
  disclosureRequirements: string[];
  notes: string;
}

// Comprehensive state rules table — usury limits and licensing
// Sources: Individual state statutes, compiled from public legal databases
const STATE_RULES_MAP: Record<string, StateRule> = {
  AL: { state: "Alabama", abbreviation: "AL", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 2000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% default; parties may agree to higher for commercial" },
  AK: { state: "Alaska", abbreviation: "AK", maxInterestRate: 0.105, commercialExemption: true, commercialExemptionThreshold: 25000, requiresStateLicense: false, disclosureRequirements: [], notes: "10.5% or 5% above Federal Reserve discount rate (Alaska Stat. §45.45.010)" },
  AZ: { state: "Arizona", abbreviation: "AZ", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "No usury cap for agreed-upon rates; 10% default (Ariz. Rev. Stat. §44-1201)" },
  AR: { state: "Arkansas", abbreviation: "AR", maxInterestRate: 0.17, commercialExemption: false, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Total interest cost"], notes: "Constitutional cap at 17%; one of strictest states" },
  CA: { state: "California", abbreviation: "CA", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 300000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "CFL disclosure", "Commercial financing disclosure (SB 1235)"], notes: "10% for personal; commercial >$300K exempt ONLY IF borrower is an entity (corp/LLC/partnership) AND loan is for non-personal/business purpose (Cal. Const. Art. XV §1). Licensed lenders may charge more." },
  CO: { state: "Colorado", abbreviation: "CO", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 75000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% consumer cap (Colo. Rev. Stat. §5-12-103); 45% criminal usury; commercial >$75K exempt" },
  CT: { state: "Connecticut", abbreviation: "CT", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "12% general; commercial loans generally exempt" },
  DE: { state: "Delaware", abbreviation: "DE", maxInterestRate: 0.105, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: false, disclosureRequirements: [], notes: "5% over Fed discount rate (Del. Code tit. 6, §2301); banks/licensed lenders effectively uncapped; >$100K exempt" },
  FL: { state: "Florida", abbreviation: "FL", maxInterestRate: 0.18, commercialExemption: true, commercialExemptionThreshold: 500000, commercialExemptionCap: 0.25, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "18% for <$500K; >$500K capped at 25%; 25% criminal usury threshold" },
  GA: { state: "Georgia", abbreviation: "GA", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 3000, criminalUsuryCap: 0.60, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "Civil usury uncapped for loans >$3K by written agreement (Ga. Code §7-4-2); 7% default legal rate; CRIMINAL usury at 5%/month (60%/yr) applies regardless (Ga. Code §7-4-18)" },
  HI: { state: "Hawaii", abbreviation: "HI", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 750000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general (HRS §478-4); non-consumer transactions exempt; commercialExemptAbove $750K" },
  ID: { state: "Idaho", abbreviation: "ID", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "No usury statute; parties free to agree" },
  IL: { state: "Illinois", abbreviation: "IL", maxInterestRate: 0.09, commercialExemption: true, commercialExemptionThreshold: 5000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "9% general (815 ILCS 205/4); commercial and business loans >$5K exempt" },
  IN: { state: "Indiana", abbreviation: "IN", maxInterestRate: 0.21, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "21% consumer cap; commercial generally exempt" },
  IA: { state: "Iowa", abbreviation: "IA", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 25000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "5% is default rate only; no cap for written commercial agreements (Iowa Code §535.2)" },
  KS: { state: "Kansas", abbreviation: "KS", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 25000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "15% general (Kan. Stat. §16-207); higher for supervised lenders; commercial >$25K exempt" },
  KY: { state: "Kentucky", abbreviation: "KY", maxInterestRate: 0.19, commercialExemption: true, commercialExemptionThreshold: 15000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "19% for consumer; commercial generally exempt" },
  LA: { state: "Louisiana", abbreviation: "LA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "12% conventional; 21% for certain categories" },
  ME: { state: "Maine", abbreviation: "ME", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 250000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% is judgment rate only; UCCC governs lending; no cap for commercial (Me. Rev. Stat. tit. 9-A, §2-201)" },
  MD: { state: "Maryland", abbreviation: "MD", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 275000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Total cost of credit"], notes: "8% legal (Md. Code, Com. Law §12-103); 24% criminal usury; commercial >$275K exempt" },
  MA: { state: "Massachusetts", abbreviation: "MA", maxInterestRate: 0.20, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "20% criminal usury; commercial generally exempt" },
  MI: { state: "Michigan", abbreviation: "MI", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 250000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "7% legal (Mich. Comp. Laws §438.31); 25% criminal usury; commercial >$250K exempt" },
  MN: { state: "Minnesota", abbreviation: "MN", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% legal (Minn. Stat. §334.01); commercial loans >$100K exempt" },
  MS: { state: "Mississippi", abbreviation: "MS", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 5000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "10% per annum or 5% over Federal Reserve discount rate; business loans >$5K exempt (Miss. Code §75-17-1(3))" },
  MO: { state: "Missouri", abbreviation: "MO", maxInterestRate: 0.10, commercialExemption: true, commercialExemptionThreshold: 5000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "10% general; business loans may be higher" },
  MT: { state: "Montana", abbreviation: "MT", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "15% contract rate; no usury for business" },
  NE: { state: "Nebraska", abbreviation: "NE", maxInterestRate: 0.16, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "16% general; licensee exemptions available" },
  NV: { state: "Nevada", abbreviation: "NV", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: [], notes: "No usury limit; parties free to contract" },
  NH: { state: "New Hampshire", abbreviation: "NH", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: [], notes: "No usury statute" },
  NJ: { state: "New Jersey", abbreviation: "NJ", maxInterestRate: 0.16, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% for oral agreements only; 16% for written agreements (N.J. Stat. §31:1-1); 30% criminal threshold; all commercial loans are written → 16% applies; commercial >$50K exempt" },
  NM: { state: "New Mexico", abbreviation: "NM", maxInterestRate: 0.15, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "No usury for commercial; 15% legal for consumer" },
  NY: { state: "New York", abbreviation: "NY", maxInterestRate: 0.16, commercialExemption: true, commercialExemptionThreshold: 250000, criminalUsuryCap: 0.25, criminalUsuryExemptionThreshold: 2500000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Rate/fee schedule", "Commercial financing disclosure"], notes: "16% civil usury; 25% criminal usury (Penal Law §190.40); commercial $250K-$2.5M exempt from civil but 25% criminal cap still applies; only >$2.5M fully exempt" },
  NC: { state: "North Carolina", abbreviation: "NC", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 25000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% general (N.C. Gen. Stat. §24-1.1); business entities >$25K exempt (§24-9)" },
  ND: { state: "North Dakota", abbreviation: "ND", maxInterestRate: 0.06, commercialExemption: true, commercialExemptionThreshold: 35000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% per annum (N.D. Cent. Code §47-14-09); variable rate or >$35K commercial exempt" },
  OH: { state: "Ohio", abbreviation: "OH", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% general; 25% criminal usury; commercial >$100K exempt" },
  OK: { state: "Oklahoma", abbreviation: "OK", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "Freedom of contract (Okla. Stat. tit. 15, §266); 6% default when no rate agreed; commercial exempt" },
  OR: { state: "Oregon", abbreviation: "OR", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% or 5% above discount rate; commercial >$50K exempt" },
  PA: { state: "Pennsylvania", abbreviation: "PA", maxInterestRate: 0.06, commercialExemption: true, commercialExemptionThreshold: 10000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "6% legal; 25% criminal usury; business loans >$10K exempt from usury (41 P.S. §201)" },
  RI: { state: "Rhode Island", abbreviation: "RI", maxInterestRate: 0.21, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "21% alternate max; commercial generally exempt" },
  SC: { state: "South Carolina", abbreviation: "SC", maxInterestRate: 0.0875, commercialExemption: true, commercialExemptionThreshold: 50000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8.75% legal (S.C. Code §34-31-20); regulated lenders exempt; commercial >$50K exempt" },
  SD: { state: "South Dakota", abbreviation: "SD", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: false, disclosureRequirements: [], notes: "No usury limit; parties free to contract" },
  TN: { state: "Tennessee", abbreviation: "TN", maxInterestRate: 0.24, commercialExemption: true, commercialExemptionThreshold: 250000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "Max 24% or 4% above avg prime rate (Tenn. Code §47-14-103); commercial >$250K exempt" },
  TX: { state: "Texas", abbreviation: "TX", maxInterestRate: 0.28, commercialExemption: true, commercialExemptionThreshold: 3000000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "28% usury ceiling (Tex. Fin. Code §303.009 weekly ceiling); real-property-secured exemption threshold is $3M (Ch. 306); usury violation = forfeiture of all interest + treble damages" },
  UT: { state: "Utah", abbreviation: "UT", maxInterestRate: 999, commercialExemption: true, commercialExemptionThreshold: 0, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["Commercial financing disclosure"], notes: "No usury limit; parties free to contract; commercial financing disclosure required" },
  VT: { state: "Vermont", abbreviation: "VT", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 0, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; commercial generally exempt" },
  VA: { state: "Virginia", abbreviation: "VA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 5000, commercialDisclosureRequired: true, requiresStateLicense: true, disclosureRequirements: ["APR disclosure", "Commercial financing disclosure"], notes: "12% legal (Va. Code §6.2-303); business loans >$5K exempt" },
  WA: { state: "Washington", abbreviation: "WA", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% or 4% above 26-week T-bill (Wash. Rev. Code §19.52.020); commercial >$100K exempt" },
  WV: { state: "West Virginia", abbreviation: "WV", maxInterestRate: 0.08, commercialExemption: true, commercialExemptionThreshold: 100000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "8% legal (W.Va. Code §47-6-5); supervised lenders may charge more; commercial >$100K exempt" },
  WI: { state: "Wisconsin", abbreviation: "WI", maxInterestRate: 0.12, commercialExemption: true, commercialExemptionThreshold: 150000, requiresStateLicense: true, disclosureRequirements: ["APR disclosure"], notes: "12% general; business >$150K exempt" },
  WY: { state: "Wyoming", abbreviation: "WY", maxInterestRate: 0.07, commercialExemption: true, commercialExemptionThreshold: 25000, requiresStateLicense: false, disclosureRequirements: [], notes: "7% legal (Wyo. Stat. §40-14-306); commercial >$25K exempt" },
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

      // Criminal usury cap still applies even when civil usury is exempt,
      // UNLESS the loan exceeds the criminal usury exemption threshold
      // (e.g. NY: $250K-$2.5M exempt from civil but 25% criminal cap still applies; >$2.5M fully exempt)
      if (rules.criminalUsuryCap != null) {
        const fullyExempt = rules.criminalUsuryExemptionThreshold != null
          && params.loanAmount >= rules.criminalUsuryExemptionThreshold;
        if (!fullyExempt && params.annualRate > rules.criminalUsuryCap) {
          return {
            violates: true,
            limit: rules.criminalUsuryCap,
            message: `Rate ${(params.annualRate * 100).toFixed(2)}% exceeds ${rules.state} criminal usury cap of ${(rules.criminalUsuryCap * 100).toFixed(2)}% (civil exemption applies but criminal cap still in effect)`,
          };
        }
      }

      return { violates: false, limit: rules.maxInterestRate, message: "Commercial exemption applies" };
    }
  }

  // No usury cap states — still check criminal usury if it exists
  if (rules.maxInterestRate >= 999) {
    if (rules.criminalUsuryCap != null && params.annualRate > rules.criminalUsuryCap) {
      return {
        violates: true,
        limit: rules.criminalUsuryCap,
        message: `Rate ${(params.annualRate * 100).toFixed(2)}% exceeds ${rules.state} criminal usury cap of ${(rules.criminalUsuryCap * 100).toFixed(2)}% (no civil cap but criminal cap applies)`,
      };
    }
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
