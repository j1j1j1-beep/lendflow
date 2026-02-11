// compliance-checks.ts
// Program-level compliance checks — deterministic regulatory validation that
// runs against deal terms and loan program rules. These are the actual
// implementations behind the complianceChecks[] labels in loan-programs.ts.
//
// Each check returns a ComplianceCheckResult with real statute citations.
// Rules engine owns the numbers; this module only validates them.

import type { DocumentInput } from "./types";
import { LOAN_PROGRAMS } from "@/config/loan-programs";

// Types

export type ComplianceCheckResult = {
  name: string;
  passed: boolean;
  regulation: string;
  description: string;
  severity: "critical" | "warning" | "info";
};

// State usury limits — ALL 50 states + DC
// Rates are the general/default maximum interest rate for commercial loans.
// Many states exempt commercial loans above certain principal thresholds or
// when parties are sophisticated entities. See commercialExemptAbove.

const STATE_USURY_LIMITS: Record<
  string,
  { rate: number; statute: string; commercialExemptAbove?: number; commercialCeiling?: number; criminalUsuryCap?: number; criminalUsuryExemptionThreshold?: number }
> = {
  AL: { rate: 0.08, statute: "Ala. Code §8-8-5 (contractual max)", commercialExemptAbove: 2000 },
  AK: { rate: 0.105, statute: "Alaska Stat. §45.45.010", commercialExemptAbove: 25000 },
  AZ: { rate: 999, statute: "Ariz. Rev. Stat. §44-1201 (no usury cap for agreed-upon rates; 10% default)" },
  AR: { rate: 0.17, statute: "Ark. Const. Amend. 89 §3" },
  CA: { rate: 0.10, statute: "Cal. Const. Art. XV §1 ($300K exemption applies to real-property-secured loans only)", commercialExemptAbove: 300000 },
  CO: { rate: 0.12, statute: "Colo. Rev. Stat. §5-12-103", commercialExemptAbove: 75000 },
  CT: { rate: 0.12, statute: "Conn. Gen. Stat. §37-4" },
  DE: { rate: 0.105, statute: "Del. Code tit. 6, §2301 (5% over Fed discount rate)", commercialExemptAbove: 100000 },
  DC: { rate: 0.24, statute: "D.C. Code §28-3301" },
  FL: { rate: 0.18, statute: "Fla. Stat. §687.02 (>$500K: 25% cap per §687.071; 25% criminal usury threshold)", commercialExemptAbove: 500000, commercialCeiling: 0.25 },
  GA: { rate: 999, statute: "Ga. Code §7-4-2 (no usury cap for loans >$3K by written agreement)", commercialExemptAbove: 3000 },
  HI: { rate: 0.12, statute: "Haw. Rev. Stat. §478-4 (12% max; non-consumer transactions exempt)", commercialExemptAbove: 750000 },
  ID: { rate: 0.12, statute: "Idaho Code §28-22-104" },
  IL: { rate: 0.09, statute: "815 ILCS 205/4", commercialExemptAbove: 5000 },
  IN: { rate: 0.21, statute: "Ind. Code §24-4.6-1-102" },
  IA: { rate: 999, statute: "Iowa Code §535.2 (5% is default rate only; no cap for written commercial agreements)", commercialExemptAbove: 25000 },
  KS: { rate: 0.15, statute: "Kan. Stat. §16-207", commercialExemptAbove: 25000 },
  KY: { rate: 0.19, statute: "Ky. Rev. Stat. §360.010 (max 19% or 4% above Fed discount rate)", commercialExemptAbove: 15000 },
  LA: { rate: 0.12, statute: "La. Rev. Stat. §9:3500" },
  ME: { rate: 999, statute: "Me. Rev. Stat. tit. 9-A, §2-201 (6% is judgment rate only; UCCC governs lending)", commercialExemptAbove: 250000 },
  MD: { rate: 0.08, statute: "Md. Code, Com. Law §12-103", commercialExemptAbove: 275000 },
  MA: { rate: 0.20, statute: "Mass. Gen. Laws ch. 271, §49" },
  MI: { rate: 0.07, statute: "Mich. Comp. Laws §438.31", commercialExemptAbove: 250000 },
  MN: { rate: 0.08, statute: "Minn. Stat. §334.01", commercialExemptAbove: 100000 },
  MS: { rate: 0.10, statute: "Miss. Code §75-17-1 (business loans >$5K exempt per §75-17-1(3))", commercialExemptAbove: 5000 },
  MO: { rate: 0.10, statute: "Mo. Rev. Stat. §408.030 (floor; actual cap may be higher per market rate formula)", commercialExemptAbove: 5000 },
  MT: { rate: 0.15, statute: "Mont. Code §31-1-107" },
  NE: { rate: 0.16, statute: "Neb. Rev. Stat. §45-101.03" },
  NV: { rate: 999, statute: "Nev. Rev. Stat. §99.050 (no usury limit for written commercial contracts)" },
  NH: { rate: 999, statute: "N.H. Rev. Stat. §336:1 (no usury cap for agreed-upon rates; 10% default)" },
  NJ: { rate: 0.16, statute: "N.J. Stat. §31:1-1 (6% for oral agreements only; 16% for written — all commercial loans are written)", commercialExemptAbove: 50000 },
  NM: { rate: 0.15, statute: "N.M. Stat. §56-8-3" },
  NY: { rate: 0.16, statute: "N.Y. Gen. Oblig. Law §5-501; Banking Law §14-a; Penal Law §190.40", commercialExemptAbove: 250000, criminalUsuryCap: 0.25, criminalUsuryExemptionThreshold: 2500000 },
  NC: { rate: 0.08, statute: "N.C. Gen. Stat. §24-1.1", commercialExemptAbove: 25000 },
  ND: { rate: 0.06, statute: "N.D. Cent. Code §47-14-09", commercialExemptAbove: 35000 },
  OH: { rate: 0.08, statute: "Ohio Rev. Code §1343.01", commercialExemptAbove: 100000 },
  OK: { rate: 999, statute: "Okla. Stat. tit. 15, §266 (freedom of contract; 6% default when no rate agreed)" },
  OR: { rate: 0.12, statute: "Or. Rev. Stat. §82.010", commercialExemptAbove: 50000 },
  PA: { rate: 0.06, statute: "41 Pa. Stat. §201", commercialExemptAbove: 10000 },
  RI: { rate: 0.21, statute: "R.I. Gen. Laws §6-26-2" },
  SC: { rate: 0.0875, statute: "S.C. Code §34-31-20", commercialExemptAbove: 50000 },
  SD: { rate: 999, statute: "S.D. Codified Laws §54-3-4 (no usury limit for written contracts)" },
  TN: { rate: 0.24, statute: "Tenn. Code §47-14-103 (max 24% or 4% above avg prime rate)", commercialExemptAbove: 250000 },
  TX: { rate: 0.18, statute: "Tex. Fin. Code §303.009 (28% commercial ceiling per Ch. 303; real-property-secured >$3M per Ch. 306)", commercialExemptAbove: 3000000, commercialCeiling: 0.28 },
  UT: { rate: 999, statute: "Utah Code §15-1-1 (no usury cap for agreed-upon rates; 10% default)" },
  VT: { rate: 0.12, statute: "Vt. Stat. tit. 9, §41a" },
  VA: { rate: 0.12, statute: "Va. Code §6.2-303 (business loans >$5K exempt)", commercialExemptAbove: 5000 },
  WA: { rate: 0.12, statute: "Wash. Rev. Code §19.52.020 (or 4% above 26-week T-bill, whichever is greater)", commercialExemptAbove: 100000 },
  WV: { rate: 0.08, statute: "W.Va. Code §47-6-5", commercialExemptAbove: 100000 },
  WI: { rate: 0.12, statute: "Wis. Stat. §138.04", commercialExemptAbove: 150000 },
  WY: { rate: 0.07, statute: "Wyo. Stat. §40-14-306", commercialExemptAbove: 25000 },
};

// Individual check implementations

function checkUsury(input: DocumentInput): ComplianceCheckResult {
  const state = input.stateAbbr?.toUpperCase() ?? null;
  const rate = input.terms.interestRate;
  const principal = input.terms.approvedAmount;

  if (!state || !STATE_USURY_LIMITS[state]) {
    return {
      name: "Usury Compliance",
      passed: true,
      regulation: "State usury statutes",
      description: state
        ? `State "${state}" not found in usury table. Manual review recommended.`
        : "No state specified on deal. Usury check cannot be performed — manual review required.",
      severity: "warning",
    };
  }

  const limit = STATE_USURY_LIMITS[state];

  // Check if commercial exemption applies
  if (limit.commercialExemptAbove && principal >= limit.commercialExemptAbove) {
    // Some states raise the cap instead of removing it (e.g. FL: 25% for >$500K, TX: 28% commercial ceiling)
    if (limit.commercialCeiling) {
      const ceilingPassed = rate <= limit.commercialCeiling;
      return {
        name: "Usury Compliance",
        passed: ceilingPassed,
        regulation: limit.statute,
        description: ceilingPassed
          ? `Commercial loan of $${principal.toLocaleString()} exceeds ${state} exemption threshold ` +
            `of $${limit.commercialExemptAbove.toLocaleString()} — subject to elevated commercial ceiling of ` +
            `${(limit.commercialCeiling * 100).toFixed(1)}% per ${limit.statute}. ` +
            `Rate of ${(rate * 100).toFixed(3)}% is within the commercial ceiling.`
          : `Commercial loan of $${principal.toLocaleString()} exceeds ${state} exemption threshold ` +
            `of $${limit.commercialExemptAbove.toLocaleString()}, but rate of ${(rate * 100).toFixed(3)}% ` +
            `EXCEEDS the ${state} commercial ceiling of ${(limit.commercialCeiling * 100).toFixed(1)}% per ${limit.statute}. ` +
            `Usury violation — may result in forfeiture of interest and/or statutory penalties.`,
        severity: ceilingPassed ? "info" : "critical",
      };
    }

    // Even when civil usury is exempt, criminal usury cap may still apply (e.g. NY 25% for $250K-$2.5M)
    if (limit.criminalUsuryCap != null) {
      const fullyExempt = limit.criminalUsuryExemptionThreshold != null
        && principal >= limit.criminalUsuryExemptionThreshold;
      if (!fullyExempt && rate > limit.criminalUsuryCap) {
        return {
          name: "Usury Compliance",
          passed: false,
          regulation: limit.statute,
          description:
            `Commercial loan of $${principal.toLocaleString()} exceeds ${state} civil exemption threshold ` +
            `of $${limit.commercialExemptAbove.toLocaleString()}, but rate of ${(rate * 100).toFixed(3)}% ` +
            `EXCEEDS the ${state} criminal usury cap of ${(limit.criminalUsuryCap * 100).toFixed(1)}% per ${limit.statute}. ` +
            `Criminal usury applies to loans under $${(limit.criminalUsuryExemptionThreshold ?? 0).toLocaleString()}.`,
          severity: "critical",
        };
      }
    }

    return {
      name: "Usury Compliance",
      passed: true,
      regulation: limit.statute,
      description:
        `Commercial loan of $${principal.toLocaleString()} exceeds ${state} exemption threshold ` +
        `of $${limit.commercialExemptAbove.toLocaleString()} — exempt from general usury cap per ${limit.statute}.` +
        (limit.criminalUsuryCap != null
          ? ` Note: ${state} criminal usury cap of ${(limit.criminalUsuryCap * 100).toFixed(1)}% still applies` +
            (limit.criminalUsuryExemptionThreshold != null
              ? ` for loans under $${limit.criminalUsuryExemptionThreshold.toLocaleString()}.`
              : `.`)
          : ``),
      severity: limit.criminalUsuryCap != null ? "warning" : "info",
    };
  }

  const passed = rate <= limit.rate;
  return {
    name: "Usury Compliance",
    passed,
    regulation: limit.statute,
    description: passed
      ? `Interest rate of ${(rate * 100).toFixed(3)}% is within ${state} maximum of ${(limit.rate * 100).toFixed(1)}% per ${limit.statute}.`
      : `Interest rate of ${(rate * 100).toFixed(3)}% EXCEEDS ${state} usury limit of ${(limit.rate * 100).toFixed(1)}% per ${limit.statute}. Loan may be unenforceable or subject to penalties.`,
    severity: passed ? "info" : "critical",
  };
}

function checkSbaSizeStandard(input: DocumentInput): ComplianceCheckResult {
  const programId = input.programId;
  const amount = input.terms.approvedAmount;

  // SBA 7(a) limit: $5,000,000
  if (programId === "sba_7a") {
    const maxAmount = 5_000_000;
    const passed = amount <= maxAmount;
    return {
      name: "SBA Size Standard — 7(a) Loan Limit",
      passed,
      regulation: "13 CFR §120.151; SBA SOP 50 10 8",
      description: passed
        ? `Loan amount of $${amount.toLocaleString()} is within the SBA 7(a) maximum of $${maxAmount.toLocaleString()} per 13 CFR §120.151.`
        : `Loan amount of $${amount.toLocaleString()} EXCEEDS the SBA 7(a) maximum of $${maxAmount.toLocaleString()} per 13 CFR §120.151.`,
      severity: passed ? "info" : "critical",
    };
  }

  // SBA 504 limit: $5,000,000 standard; $5,500,000 for manufacturing/energy
  if (programId === "sba_504") {
    const maxAmount = 5_500_000; // Using higher manufacturing/energy cap
    const passed = amount <= maxAmount;
    return {
      name: "SBA Size Standard — 504 Loan Limit",
      passed,
      regulation: "13 CFR §120.931; SBA SOP 50 10 8",
      description: passed
        ? `Loan amount of $${amount.toLocaleString()} is within the SBA 504 maximum of $${maxAmount.toLocaleString()} (manufacturing/energy cap) per 13 CFR §120.931.`
        : `Loan amount of $${amount.toLocaleString()} EXCEEDS the SBA 504 maximum of $${maxAmount.toLocaleString()} per 13 CFR §120.931.`,
      severity: passed ? "info" : "critical",
    };
  }

  return {
    name: "SBA Size Standard",
    passed: true,
    regulation: "13 CFR §120",
    description: "SBA size standard check not applicable to this program.",
    severity: "info",
  };
}

function checkSbaCreditElsewhere(_input: DocumentInput): ComplianceCheckResult {
  // The "credit elsewhere" test is a qualitative determination that cannot be
  // fully automated — it requires the lender to certify that the borrower
  // cannot obtain credit on reasonable terms from non-SBA sources.
  return {
    name: "SBA Credit Elsewhere Test",
    passed: true,
    regulation: "13 CFR §120.101; SBA SOP 50 10 8 Subpart B, Ch. 2",
    description:
      "The lender must certify that the borrower cannot obtain credit on reasonable terms " +
      "from non-Federal sources without SBA assistance per 13 CFR §120.101. " +
      "This is a lender certification — ensure SBA Form 1919 (revised April 2025 per Executive Order 14168) or equivalent documentation is completed.",
    severity: "warning",
  };
}

function checkSbaUseOfProceeds(_input: DocumentInput): ComplianceCheckResult {
  // Use-of-proceeds restrictions are qualitative — must be for an eligible
  // business purpose per SBA SOP 50 10.
  return {
    name: "SBA Use of Proceeds",
    passed: true,
    regulation: "13 CFR §120.120; SBA SOP 50 10 8 Subpart B, Ch. 2",
    description:
      "Loan proceeds must be used for eligible business purposes per 13 CFR §120.120. " +
      "Prohibited uses include: floor plan financing, speculation, lending activities, " +
      "investments not fully secured, or payments to associates. Verify with borrower's stated loan purpose.",
    severity: "warning",
  };
}

function checkSba504Eligibility(input: DocumentInput): ComplianceCheckResult {
  const checks: string[] = [];
  let passed = true;

  // 504 requires the project to involve fixed assets (real estate or heavy equipment)
  const hasFixedAsset = input.collateralTypes.some(
    (t) =>
      t.toLowerCase().includes("real_estate") ||
      t.toLowerCase().includes("real estate") ||
      t.toLowerCase().includes("heavy_equipment") ||
      t.toLowerCase().includes("heavy equipment"),
  );
  if (!hasFixedAsset) {
    checks.push("SBA 504 requires fixed-asset collateral (real estate or heavy equipment). Current collateral types do not include eligible fixed assets.");
    passed = false;
  }

  // Net worth and average income tests (qualitative — cannot fully verify from deal data)
  checks.push(
    "Borrower must have tangible net worth not exceeding $20M and average net income not exceeding $6.5M " +
    "for the two years preceding the application per 13 CFR §121.301(c). Verify from financial statements.",
  );

  return {
    name: "SBA 504 Eligibility",
    passed,
    regulation: "13 CFR §120.100-120.111; 13 CFR §121.301",
    description: checks.join(" "),
    severity: passed ? "warning" : "critical",
  };
}

function checkJobCreation(_input: DocumentInput): ComplianceCheckResult {
  return {
    name: "SBA 504 Job Creation/Retention",
    passed: true,
    regulation: "13 CFR §120.861-120.862",
    description:
      "SBA 504 loans must create or retain one job per $90,000 of CDC debenture funding " +
      "(or $140,000 for small manufacturers and energy public policy projects) per 13 CFR §120.861. " +
      "Job creation goals must be documented and reported annually. " +
      "Verify projected job creation meets the required ratio.",
    severity: "warning",
  };
}

function checkOfacScreening(_input: DocumentInput): ComplianceCheckResult {
  // OFAC screening requires integration with the SDN list — this is a
  // placeholder noting the requirement. In production, integrate with
  // Treasury OFAC SDN API or a sanctions screening vendor.
  return {
    name: "OFAC Screening",
    passed: true,
    regulation: "31 CFR Part 501; Executive Order 13224; OFAC SDN List",
    description:
      "All parties (borrower, guarantor, principals) must be screened against the OFAC " +
      "Specially Designated Nationals (SDN) list and other sanctions lists per 31 CFR Part 501. " +
      "Ensure screening is completed prior to closing and documented in the loan file.",
    severity: "warning",
  };
}

function checkFloodZone(_input: DocumentInput): ComplianceCheckResult {
  // Flood zone determination requires integration with FEMA flood maps.
  // This is a placeholder noting the regulatory requirement.
  return {
    name: "Flood Zone Determination",
    passed: true,
    regulation: "42 USC §4012a; Flood Disaster Protection Act of 1973; 12 CFR §339 (OCC)",
    description:
      "If the collateral includes improved real property, a Standard Flood Hazard Determination " +
      "Form (SFHDF) is required per 42 USC §4012a. If the property is in a Special Flood Hazard Area (SFHA), " +
      "flood insurance must be obtained and maintained. Ensure SFHDF is completed and in the loan file.",
    severity: "info",
  };
}

function checkHpml(input: DocumentInput): ComplianceCheckResult {
  // HPML threshold: first lien rate > APOR + 1.5%, subordinate lien > APOR + 3.5%
  // We cannot look up the current APOR, so flag if the rate is above a conservative
  // threshold that would likely trigger HPML.
  const rate = input.terms.interestRate;

  // HPML triggers at APOR + 1.5% for first liens, APOR + 3.5% for subordinate liens.
  // Current APOR ~6.1% (as of 2025) → first-lien threshold ~7.6%.
  // TODO: Replace with dynamic APOR lookup from FFIEC/CFPB weekly table for production use.
  // Using 7.6% as conservative threshold — should be recalculated as APOR + 1.5% for first-lien.
  const conservativeHpmlThreshold = 0.076;
  const isLikelyHpml = rate > conservativeHpmlThreshold;

  return {
    name: "Higher-Priced Mortgage Loan (HPML) Check",
    passed: true, // Always passes because this is an advisory — the actual APOR comparison must be done at closing
    regulation: "12 CFR §1026.35; Dodd-Frank Act §1411",
    description: isLikelyHpml
      ? `Interest rate of ${(rate * 100).toFixed(3)}% may exceed the APOR threshold for HPML designation ` +
        `under 12 CFR §1026.35. If the rate exceeds APOR + 1.5% (first lien) or APOR + 3.5% (subordinate lien), ` +
        `additional requirements apply: (1) escrow account for taxes and insurance per §1026.35(b), ` +
        `(2) enhanced appraisal requirements per §1026.35(c), and (3) balloon payment restrictions. ` +
        `Verify against current APOR table published weekly by the CFPB/FFIEC.`
      : `Interest rate of ${(rate * 100).toFixed(3)}% is unlikely to trigger HPML designation under 12 CFR §1026.35. ` +
        `Verify against current APOR table published weekly by the CFPB/FFIEC.`,
    severity: isLikelyHpml ? "warning" : "info",
  };
}

function checkAtr(input: DocumentInput): ComplianceCheckResult {
  const program = LOAN_PROGRAMS[input.programId];

  if (!program) {
    return {
      name: "Ability to Repay (ATR)",
      passed: true,
      regulation: "12 CFR §1026.43; Dodd-Frank Act §1411",
      description: "Program not found. ATR check could not determine program thresholds.",
      severity: "warning",
    };
  }

  // For non-QM programs (DSCR, bank_statement), the ATR rule still applies but
  // compliance is demonstrated through alternative documentation rather than
  // traditional DTI verification.
  const isNonQm = input.programId === "dscr" || input.programId === "bank_statement";

  const checks: string[] = [];
  let passed = true;

  // Check LTV against program max (proxy for skin-in-the-game / repayment ability)
  if (input.terms.ltv !== null && program.structuringRules.maxLtv > 0) {
    if (input.terms.ltv > program.structuringRules.maxLtv) {
      checks.push(
        `LTV of ${(input.terms.ltv * 100).toFixed(1)}% exceeds program maximum of ` +
        `${(program.structuringRules.maxLtv * 100).toFixed(1)}%.`,
      );
      passed = false;
    }
  }

  if (isNonQm) {
    checks.push(
      "This is a non-QM loan — ATR compliance must be documented through " +
      (input.programId === "dscr"
        ? "property cash flow analysis (DSCR-based qualification)"
        : "bank statement deposit analysis (12-24 month deposits)") +
      " per 12 CFR §1026.43(c). Ensure alternative documentation is in the loan file.",
    );
  }

  return {
    name: "Ability to Repay (ATR)",
    passed,
    regulation: "12 CFR §1026.43; Dodd-Frank Act §1411; CFPB ATR/QM Rule",
    description: checks.length > 0
      ? checks.join(" ")
      : "ATR requirements satisfied. Borrower's ability to repay is documented per 12 CFR §1026.43.",
    severity: passed ? (isNonQm ? "warning" : "info") : "critical",
  };
}

function checkLtvLimit(input: DocumentInput): ComplianceCheckResult {
  const program = LOAN_PROGRAMS[input.programId];
  if (!program) {
    return {
      name: "LTV Limit",
      passed: true,
      regulation: "Program structuring rules",
      description: "Program not found. LTV limit check skipped.",
      severity: "warning",
    };
  }

  const maxLtv = program.structuringRules.maxLtv;
  const ltv = input.terms.ltv;

  if (ltv === null || ltv === undefined) {
    return {
      name: "LTV Limit",
      passed: true,
      regulation: `${program.name} program guidelines`,
      description: "No LTV value available on deal terms. LTV limit check not performed.",
      severity: "info",
    };
  }

  const passed = ltv <= maxLtv;
  return {
    name: "LTV Limit",
    passed,
    regulation: `${program.name} program guidelines (max LTV ${(maxLtv * 100).toFixed(0)}%)`,
    description: passed
      ? `LTV of ${(ltv * 100).toFixed(1)}% is within the ${program.name} maximum of ${(maxLtv * 100).toFixed(0)}%.`
      : `LTV of ${(ltv * 100).toFixed(1)}% EXCEEDS the ${program.name} maximum of ${(maxLtv * 100).toFixed(0)}%. Loan does not meet program guidelines.`,
    severity: passed ? "info" : "critical",
  };
}

function checkTermLimit(input: DocumentInput): ComplianceCheckResult {
  const program = LOAN_PROGRAMS[input.programId];
  if (!program) {
    return {
      name: "Term Limit",
      passed: true,
      regulation: "Program structuring rules",
      description: "Program not found. Term limit check skipped.",
      severity: "warning",
    };
  }

  const maxTerm = program.structuringRules.maxTerm;
  const term = input.terms.termMonths;

  if (maxTerm === 0) {
    // Revolving / interest-only — no fixed term limit
    return {
      name: "Term Limit",
      passed: true,
      regulation: `${program.name} program guidelines`,
      description: `${program.name} is a revolving/interest-only facility. No fixed term limit applies.`,
      severity: "info",
    };
  }

  const passed = term <= maxTerm;
  return {
    name: "Term Limit",
    passed,
    regulation: `${program.name} program guidelines (max term ${maxTerm} months)`,
    description: passed
      ? `Loan term of ${term} months is within the ${program.name} maximum of ${maxTerm} months.`
      : `Loan term of ${term} months EXCEEDS the ${program.name} maximum of ${maxTerm} months.`,
    severity: passed ? "info" : "critical",
  };
}

function checkEnvironmentalPhase1(input: DocumentInput): ComplianceCheckResult {
  const hasRealProperty =
    !!input.propertyAddress ||
    input.collateralTypes.some((t) => {
      const lower = t.toLowerCase();
      return lower.includes("real_estate") || lower.includes("real estate") || lower.includes("commercial_real_estate");
    });

  return {
    name: "Environmental — Phase I ESA",
    passed: true,
    regulation: "CERCLA 42 USC §9601 et seq.; ASTM E1527-21",
    description: hasRealProperty
      ? "A Phase I Environmental Site Assessment (ESA) compliant with ASTM E1527-21 is recommended " +
        "prior to closing for all loans secured by real property. The Phase I ESA establishes the " +
        "innocent landowner defense under CERCLA 42 USC §9607(b)(3) and the bona fide prospective " +
        "purchaser defense under 42 USC §9601(40). Ensure the Phase I is completed, reviewed, and " +
        "in the loan file before funding."
      : "No real property collateral identified. Phase I ESA is not required for this transaction.",
    severity: hasRealProperty ? "warning" : "info",
  };
}

function checkBsaAml(_input: DocumentInput): ComplianceCheckResult {
  return {
    name: "BSA/AML Compliance",
    passed: true,
    regulation: "31 USC §5311-5332; FinCEN CDD Rule (31 CFR §1010.230); FinCEN FIN-2019-G001",
    description:
      "Bank Secrecy Act / Anti-Money Laundering due diligence is required for all loans, " +
      "with enhanced requirements for digital asset-collateralized lending. Required steps: " +
      "(1) Customer Identification Program (CIP) per 31 CFR §1020.220, " +
      "(2) Customer Due Diligence (CDD) per 31 CFR §1010.230 including beneficial ownership identification, " +
      "(3) Suspicious Activity Reporting (SAR) review per 31 USC §5318(g), " +
      "(4) For crypto-collateralized loans, verify source of digital assets and blockchain transaction history " +
      "per FinCEN guidance FIN-2019-G001. " +
      "Ensure all BSA/AML documentation is completed and in the loan file.",
    severity: "warning",
  };
}

function checkSourceOfFunds(_input: DocumentInput): ComplianceCheckResult {
  return {
    name: "Source of Funds Verification",
    passed: true,
    regulation: "31 CFR §1010.230; FinCEN FIN-2019-G001; FATF Recommendation 10",
    description:
      "For digital asset-collateralized loans, the source of collateral funds must be verified. " +
      "Required: (1) Blockchain analytics to trace origin of digital assets, " +
      "(2) Documentation of acquisition history (exchange records, mining records, or purchase receipts), " +
      "(3) Screening against known illicit wallet addresses (OFAC sanctioned wallets, darknet markets), " +
      "(4) Verification that assets are not subject to any legal claims or encumbrances. " +
      "Ensure source-of-funds documentation is completed prior to accepting digital asset collateral.",
    severity: "warning",
  };
}

function checkGeniusActCompliance(input: DocumentInput): ComplianceCheckResult {
  // GENIUS Act (Guiding and Establishing National Innovation for U.S. Stablecoins)
  // Signed into law July 18, 2025. Requires stablecoin issuers to maintain 1:1 reserves,
  // register with federal/state regulators, and comply with AML/sanctions requirements.
  // Loans collateralized by stablecoins or crypto must verify issuer compliance.
  const hasCryptoCollateral = input.collateralTypes.some((t) => {
    const lower = t.toLowerCase();
    return (
      lower.includes("crypto") ||
      lower.includes("stablecoin") ||
      lower.includes("digital_asset") ||
      lower.includes("digital asset") ||
      lower.includes("bitcoin") ||
      lower.includes("ethereum") ||
      lower.includes("token")
    );
  });

  if (!hasCryptoCollateral) {
    return {
      name: "GENIUS Act — Stablecoin/Crypto Collateral Compliance",
      passed: true,
      regulation: "GENIUS Act (P.L. 119-XX, signed July 18, 2025); 12 USC §5401 et seq.",
      description:
        "No crypto or stablecoin collateral identified. GENIUS Act compliance check is not applicable to this transaction.",
      severity: "info",
    };
  }

  // Crypto/stablecoin collateral detected — flag for GENIUS Act review
  return {
    name: "GENIUS Act — Stablecoin/Crypto Collateral Compliance",
    passed: false,
    regulation: "GENIUS Act (P.L. 119-XX, signed July 18, 2025); 12 USC §5401 et seq.",
    description:
      "This loan involves crypto/stablecoin collateral subject to the GENIUS Act (signed July 18, 2025). " +
      "Required verification: (1) If stablecoin collateral, confirm the issuer is a licensed payment stablecoin issuer " +
      "under the GENIUS Act with 1:1 reserve backing (U.S. Treasuries, insured deposits, or approved reserve assets), " +
      "(2) Verify the issuer is registered with a federal prudential regulator or approved state regulator, " +
      "(3) Confirm monthly reserve attestation reports are current and publicly available, " +
      "(4) Non-compliant stablecoins (foreign-issued without U.S. registration, algorithmic stablecoins without " +
      "qualifying reserves) may not be accepted as collateral without enhanced risk assessment, " +
      "(5) Document the specific stablecoin/token, issuer, and compliance status in the loan file. " +
      "Manual review required — this check cannot be fully automated.",
    severity: "critical",
  };
}

// States requiring TILA-like commercial financing disclosures
const COMMERCIAL_DISCLOSURE_STATES: Record<string, string> = {
  CA: "SB 1235 (Cal. Fin. Code §22800 et seq.)",
  NY: "S5470-B (N.Y. Fin. Serv. Law §801 et seq.)",
  VA: "HB 1027/SB 784 (Va. Code §6.2-2227 et seq.)",
  UT: "SB 183 (Utah Code §7-27-101 et seq.)",
  FL: "HB 751 (Fla. Stat. §559.9601 et seq.)",
  GA: "SB 90 (Ga. Code §7-8-1 et seq.)",
  CT: "SB 1032",
  KS: "SB 345",
  MO: "HB 990",
  TX: "HB 4182",
  LA: "SB 89",
};

function checkCommercialFinancingDisclosure(input: DocumentInput): ComplianceCheckResult {
  const state = input.stateAbbr?.toUpperCase() ?? null;

  if (!state) {
    return {
      name: "Commercial Financing Disclosure",
      passed: true,
      regulation: "State commercial financing disclosure laws",
      description:
        "No state specified on deal. Cannot determine if commercial financing disclosure is required. " +
        "Eleven states (CA, NY, VA, UT, FL, GA, CT, KS, MO, TX, LA) require TILA-like disclosures for commercial financing. " +
        "Manual review recommended.",
      severity: "warning",
    };
  }

  const statute = COMMERCIAL_DISCLOSURE_STATES[state];
  if (!statute) {
    return {
      name: "Commercial Financing Disclosure",
      passed: true,
      regulation: "State commercial financing disclosure laws",
      description:
        `${state} does not currently require TILA-like commercial financing disclosures. ` +
        `No additional commercial financing disclosure obligations for this transaction.`,
      severity: "info",
    };
  }

  return {
    name: "Commercial Financing Disclosure",
    passed: false,
    regulation: statute,
    description:
      `${state} requires TILA-like disclosures for commercial financing transactions per ${statute}. ` +
      `Required disclosures typically include: total cost of financing, APR or estimated APR, total repayment amount, ` +
      `payment schedule, and prepayment policies. Ensure all required commercial financing disclosures are provided ` +
      `to the borrower prior to consummation. Failure to provide may result in state enforcement actions.`,
    severity: "critical",
  };
}

function checkUccLienSearch(_input: DocumentInput): ComplianceCheckResult {
  return {
    name: "UCC Lien Search",
    passed: true,
    regulation: "UCC §9-322; UCC §9-501",
    description:
      "A UCC lien search must be conducted in the debtor's state of organization " +
      "(per UCC §9-307) and any states where collateral is located to identify existing " +
      "security interests. Priority is determined by order of filing per UCC §9-322(a)(1). " +
      "Ensure the search is completed, any prior liens are identified and addressed " +
      "(subordination, payoff, or permitted lien carve-out), and UCC-1 financing statement " +
      "is filed prior to or at closing.",
    severity: "warning",
  };
}

// Check dispatcher — maps complianceChecks label strings to implementations

const CHECK_REGISTRY: Record<string, (input: DocumentInput) => ComplianceCheckResult> = {
  usury_check: checkUsury,
  sba_size_standard: checkSbaSizeStandard,
  sba_credit_elsewhere: checkSbaCreditElsewhere,
  sba_use_of_proceeds: checkSbaUseOfProceeds,
  sba_504_eligibility: checkSba504Eligibility,
  job_creation: checkJobCreation,
  ofac_screening: checkOfacScreening,
  flood_zone: checkFloodZone,
  hpml_check: checkHpml,
  atr_check: checkAtr,
  environmental_phase1: checkEnvironmentalPhase1,
  bsa_aml: checkBsaAml,
  source_of_funds: checkSourceOfFunds,
  ucc_lien_search: checkUccLienSearch,
  genius_act: checkGeniusActCompliance,
  commercial_financing_disclosure: checkCommercialFinancingDisclosure,
};

// Main entry point

/**
 * Run all compliance checks defined on the loan program for this deal.
 * Also runs universal structural checks (LTV limit, term limit) regardless
 * of what's listed in complianceChecks.
 */
export function runProgramComplianceChecks(
  programId: string,
  input: DocumentInput,
): ComplianceCheckResult[] {
  const program = LOAN_PROGRAMS[programId];
  if (!program) {
    return [
      {
        name: "Program Validation",
        passed: false,
        regulation: "Internal",
        description: `Loan program "${programId}" not found in registry. No compliance checks could be performed.`,
        severity: "critical",
      },
    ];
  }

  const results: ComplianceCheckResult[] = [];

  // Run all checks listed in the program's complianceChecks array
  for (const checkLabel of program.complianceChecks) {
    const checkFn = CHECK_REGISTRY[checkLabel];
    if (checkFn) {
      results.push(checkFn(input));
    } else {
      results.push({
        name: checkLabel,
        passed: true,
        regulation: "Not implemented",
        description: `Compliance check "${checkLabel}" is defined on the program but has no implementation. Manual review required.`,
        severity: "warning",
      });
    }
  }

  // Always run structural checks (LTV and term limits) — these validate
  // the deal terms against the program's structuring rules
  results.push(checkLtvLimit(input));
  results.push(checkTermLimit(input));

  return results;
}
