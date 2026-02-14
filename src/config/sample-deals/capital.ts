/**
 * Sample Deals - Capital Module (6 Fund Types × 2 Exemptions = 12 Combinations)
 *
 * Fund Types: PE, VC, RE, Hedge, Credit, Infrastructure
 * Exemptions: Reg D 506(b), Reg D 506(c)
 *
 * Key legal considerations (2026):
 *   - 506(b): Up to 35 non-accredited sophisticated investors, no general solicitation
 *   - 506(c): All accredited, reasonable steps verification required, general solicitation OK
 *   - Accredited investor: $200K income / $300K joint / $1M net worth (excl. primary residence)
 *   - Qualified purchaser: $5M+ investments (for 3(c)(7))
 *   - Form D filing: 15 days after first sale
 *   - Carried interest: 3-year holding period (IRC 1061, TCJA 2017)
 *   - FinCEN BOI: Domestic entities exempt since March 2025 interim rule
 *   - ICA exemptions: 3(c)(1) = 100 beneficial owners, 3(c)(7) = qualified purchasers
 *   - ERISA: 25% aggregate benefit plan investor test
 *
 * Fee structures are market-standard per fund type.
 * All entities are fictitious.
 */

export interface SampleCapitalDeal {
  id: string;
  label: string;
  description: string;
  name: string;
  fundName: string;
  fundType: string;
  gpEntityName: string;
  exemptionType: string;
  targetRaise: number;
  minInvestment: number;
  managementFee: number;   // as percentage (e.g., 2.0 = 2%)
  carriedInterest: number; // as percentage (e.g., 20.0 = 20%)
  preferredReturn: number; // as percentage (e.g., 8.0 = 8%)
  fundTermYears: number;
  investmentStrategy: string;
  geographicFocus: string;
}

export const SAMPLE_CAPITAL_DEALS: SampleCapitalDeal[] = [
  // ─────────────────────────────────────────────────
  // 1. Private Equity — 506(b) Buyout Fund
  // ─────────────────────────────────────────────────
  {
    id: "pe_506b_sample",
    label: "PE 506(b) — Buyout Fund",
    description:
      "Mid-market buyout fund targeting $250M. " +
      "2% management fee, 20% carry over 8% preferred return. " +
      "506(b) exemption, 3(c)(1) ICA exemption (up to 100 investors).",
    name: "Ridgeline Partners Fund III",
    fundName: "Ridgeline Partners Fund III, L.P.",
    fundType: "PRIVATE_EQUITY",
    gpEntityName: "Ridgeline Capital Management, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 250000000,
    minInvestment: 1000000,
    managementFee: 2.0,
    carriedInterest: 20.0,
    preferredReturn: 8.0,
    fundTermYears: 10,
    investmentStrategy:
      "Control buyouts of lower middle-market companies with $15M-$75M enterprise value " +
      "in the business services, healthcare services, and industrial technology sectors. " +
      "Target 3-5 platform acquisitions with add-on acquisition strategy to build scale.",
    geographicFocus: "United States and Canada",
  },

  // ─────────────────────────────────────────────────
  // 2. Private Equity — 506(c) Growth Equity Fund
  // ─────────────────────────────────────────────────
  {
    id: "pe_506c_sample",
    label: "PE 506(c) — Growth Equity Fund",
    description:
      "Growth equity fund targeting $400M. " +
      "1.75% management fee, 20% carry over 8% preferred. " +
      "506(c) exemption (all accredited, general solicitation permitted).",
    name: "Vanguard Growth Equity II",
    fundName: "Vanguard Growth Equity Fund II, L.P.",
    fundType: "PRIVATE_EQUITY",
    gpEntityName: "Vanguard Growth Capital Advisors, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 400000000,
    minInvestment: 5000000,
    managementFee: 1.75,
    carriedInterest: 20.0,
    preferredReturn: 8.0,
    fundTermYears: 10,
    investmentStrategy:
      "Minority and majority growth equity investments in technology-enabled services " +
      "companies with $10M-$50M revenue growing 20%+ annually. Focus on companies " +
      "with proven unit economics transitioning from founder-led to institutional management.",
    geographicFocus: "North America",
  },

  // ─────────────────────────────────────────────────
  // 3. Venture Capital — 506(b) Early Stage
  // ─────────────────────────────────────────────────
  {
    id: "vc_506b_sample",
    label: "VC 506(b) — Early Stage Fund",
    description:
      "Seed and Series A fund targeting $75M. " +
      "2.0% management fee, 20% carry, no preferred return (standard for VC). " +
      "506(b) with VCOC exemption for ERISA compliance.",
    name: "Catalyst Ventures Fund IV",
    fundName: "Catalyst Ventures Fund IV, L.P.",
    fundType: "VENTURE_CAPITAL",
    gpEntityName: "Catalyst Venture Management, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 75000000,
    minInvestment: 500000,
    managementFee: 2.0,
    carriedInterest: 20.0,
    preferredReturn: 0.0, // Standard for VC: no preferred return
    fundTermYears: 10,
    investmentStrategy:
      "Seed and Series A investments in enterprise SaaS, fintech, and applied AI companies. " +
      "Initial checks $1M-$5M with significant reserves for follow-on. " +
      "Target 25-30 portfolio companies. Board seats on all investments.",
    geographicFocus: "United States, with selective investments in Western Europe",
  },

  // ─────────────────────────────────────────────────
  // 4. Venture Capital — 506(c) Late Stage
  // ─────────────────────────────────────────────────
  {
    id: "vc_506c_sample",
    label: "VC 506(c) — Late Stage / Pre-IPO Fund",
    description:
      "Late-stage fund targeting $200M. " +
      "1.5% management fee, 20% carry, no preferred. " +
      "506(c) to allow general solicitation for institutional LPs.",
    name: "Horizon Late Stage Fund I",
    fundName: "Horizon Late Stage Fund I, L.P.",
    fundType: "VENTURE_CAPITAL",
    gpEntityName: "Horizon Growth Partners, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 200000000,
    minInvestment: 2500000,
    managementFee: 1.5,
    carriedInterest: 20.0,
    preferredReturn: 0.0,
    fundTermYears: 7,
    investmentStrategy:
      "Series C through pre-IPO investments in companies with $50M+ revenue " +
      "and clear path to public listing or strategic acquisition within 2-4 years. " +
      "Investments of $15M-$40M per company. Target 8-12 portfolio companies.",
    geographicFocus: "United States",
  },

  // ─────────────────────────────────────────────────
  // 5. Real Estate — 506(b) Value-Add Fund
  // ─────────────────────────────────────────────────
  {
    id: "re_506b_sample",
    label: "RE 506(b) — Value-Add Fund",
    description:
      "Real estate value-add fund targeting $150M equity. " +
      "1.5% management fee, 20% carry over 8% preferred. " +
      "506(b) with 3(c)(5)(C) real estate fund ICA exemption.",
    name: "Cornerstone Value-Add Fund II",
    fundName: "Cornerstone Real Estate Value-Add Fund II, L.P.",
    fundType: "REAL_ESTATE",
    gpEntityName: "Cornerstone Realty Advisors, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 150000000,
    minInvestment: 250000,
    managementFee: 1.5,
    carriedInterest: 20.0,
    preferredReturn: 8.0,
    fundTermYears: 7,
    investmentStrategy:
      "Acquire underperforming multifamily and mixed-use properties in Sun Belt metros " +
      "with strong population growth. Invest $2M-$8M in capital improvements per asset " +
      "to drive 15-25% rent increases. Target 12-18 month hold per renovation cycle.",
    geographicFocus: "Southeastern and Southwestern United States",
  },

  // ─────────────────────────────────────────────────
  // 6. Real Estate — 506(c) Opportunistic Fund
  // ─────────────────────────────────────────────────
  {
    id: "re_506c_sample",
    label: "RE 506(c) — Opportunistic Fund",
    description:
      "Opportunistic real estate fund targeting $350M. " +
      "2.0% management fee, 20% carry over 10% preferred. " +
      "506(c) for broader marketing to institutional investors.",
    name: "Apex Opportunistic Real Estate Fund I",
    fundName: "Apex Opportunistic Real Estate Fund I, L.P.",
    fundType: "REAL_ESTATE",
    gpEntityName: "Apex Real Estate Capital, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 350000000,
    minInvestment: 5000000,
    managementFee: 2.0,
    carriedInterest: 20.0,
    preferredReturn: 10.0,
    fundTermYears: 8,
    investmentStrategy:
      "Ground-up development and deep value-add repositioning of commercial properties " +
      "in top 25 US metros. Focus on office-to-residential conversions, adaptive reuse, " +
      "and Qualified Opportunity Zone investments for tax-advantaged returns.",
    geographicFocus: "Top 25 US Metropolitan Statistical Areas",
  },

  // ─────────────────────────────────────────────────
  // 7. Hedge Fund — 506(b) Long/Short Equity
  // ─────────────────────────────────────────────────
  {
    id: "hedge_506b_sample",
    label: "Hedge 506(b) — Long/Short Equity",
    description:
      "Long/short equity hedge fund targeting $100M AUM. " +
      "2.0% management fee, 20% incentive fee with high-water mark. " +
      "506(b) exemption. Structured as LLC (not LP) per hedge fund convention.",
    name: "Citadel Point Capital Fund",
    fundName: "Citadel Point Capital Fund, LLC",
    fundType: "HEDGE_FUND",
    gpEntityName: "Citadel Point Capital Management, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 100000000,
    minInvestment: 1000000,
    managementFee: 2.0,
    carriedInterest: 20.0, // Incentive allocation for hedge funds
    preferredReturn: 0.0,  // Hedge funds typically use high-water mark, not preferred return
    fundTermYears: 0,      // Open-ended (evergreen structure)
    investmentStrategy:
      "Fundamental long/short equity strategy focused on US mid-cap industrials " +
      "and technology. Net long bias of 40-60%. Gross exposure capped at 200%. " +
      "Position sizing: 2-5% per position. Monthly liquidity with 60-day notice.",
    geographicFocus: "United States public equities",
  },

  // ─────────────────────────────────────────────────
  // 8. Hedge Fund — 506(c) Multi-Strategy
  // ─────────────────────────────────────────────────
  {
    id: "hedge_506c_sample",
    label: "Hedge 506(c) — Multi-Strategy Fund",
    description:
      "Multi-strategy hedge fund targeting $500M AUM. " +
      "1.5% management fee, 17.5% incentive fee (institutional terms). " +
      "506(c) with 3(c)(7) ICA exemption (qualified purchasers, no 100-investor cap).",
    name: "Onyx Multi-Strategy Fund",
    fundName: "Onyx Multi-Strategy Fund, LLC",
    fundType: "HEDGE_FUND",
    gpEntityName: "Onyx Capital Advisors, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 500000000,
    minInvestment: 10000000,
    managementFee: 1.5,
    carriedInterest: 17.5, // Institutional discount from standard 20%
    preferredReturn: 0.0,
    fundTermYears: 0, // Open-ended
    investmentStrategy:
      "Multi-strategy approach allocating across event-driven, relative value, " +
      "global macro, and quantitative strategies. Maximum 30% allocation to any single " +
      "sub-strategy. Dynamic allocation based on opportunity set. " +
      "Quarterly liquidity with 90-day notice for redemptions.",
    geographicFocus: "Global",
  },

  // ─────────────────────────────────────────────────
  // 9. Credit — 506(b) Direct Lending Fund
  // ─────────────────────────────────────────────────
  {
    id: "credit_506b_sample",
    label: "Credit 506(b) — Direct Lending Fund",
    description:
      "Direct lending fund targeting $300M. " +
      "1.5% management fee, 15% carry over 6% preferred. " +
      "506(b) exemption. Lending to middle-market companies.",
    name: "Iron Bridge Credit Fund II",
    fundName: "Iron Bridge Credit Fund II, L.P.",
    fundType: "CREDIT",
    gpEntityName: "Iron Bridge Credit Management, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 300000000,
    minInvestment: 2000000,
    managementFee: 1.5,
    carriedInterest: 15.0, // Lower carry for credit funds (lower return profile)
    preferredReturn: 6.0,
    fundTermYears: 6,
    investmentStrategy:
      "Senior secured direct loans to US middle-market companies with $25M-$150M revenue. " +
      "First lien and unitranche structures. Target yields of 10-14% with 1.5-2.0x loan-to-value. " +
      "Average hold period 3-4 years. Diversified across 30-40 portfolio companies.",
    geographicFocus: "United States",
  },

  // ─────────────────────────────────────────────────
  // 10. Credit — 506(c) Distressed Debt Fund
  // ─────────────────────────────────────────────────
  {
    id: "credit_506c_sample",
    label: "Credit 506(c) — Distressed Debt Fund",
    description:
      "Distressed debt fund targeting $200M. " +
      "1.75% management fee, 20% carry over 8% preferred. " +
      "506(c) for broader institutional marketing.",
    name: "Sentinel Distressed Opportunities Fund I",
    fundName: "Sentinel Distressed Opportunities Fund I, L.P.",
    fundType: "CREDIT",
    gpEntityName: "Sentinel Capital Partners, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 200000000,
    minInvestment: 5000000,
    managementFee: 1.75,
    carriedInterest: 20.0,
    preferredReturn: 8.0,
    fundTermYears: 7,
    investmentStrategy:
      "Acquire distressed corporate debt and structured credit at significant discounts " +
      "to par. Active participation in restructuring processes, creditor committees, " +
      "and Section 363 sales. Target returns of 15-20% net IRR through operational " +
      "turnaround and capital structure optimization.",
    geographicFocus: "North America and Western Europe",
  },

  // ─────────────────────────────────────────────────
  // 11. Infrastructure — 506(b) Renewable Energy
  // ─────────────────────────────────────────────────
  {
    id: "infra_506b_sample",
    label: "Infrastructure 506(b) — Renewable Energy",
    description:
      "Renewable energy infrastructure fund targeting $500M. " +
      "1.5% management fee, 15% carry over 7% preferred. " +
      "506(b) exemption. Long-dated cash flow from contracted power.",
    name: "Solstice Energy Infrastructure Fund I",
    fundName: "Solstice Energy Infrastructure Fund I, L.P.",
    fundType: "INFRASTRUCTURE",
    gpEntityName: "Solstice Infrastructure Partners, LLC",
    exemptionType: "REG_D_506B",
    targetRaise: 500000000,
    minInvestment: 5000000,
    managementFee: 1.5,
    carriedInterest: 15.0,
    preferredReturn: 7.0,
    fundTermYears: 15,
    investmentStrategy:
      "Develop and acquire utility-scale solar, onshore wind, and battery storage " +
      "assets across the United States. Target contracted revenue from investment-grade " +
      "offtakers via 15-25 year power purchase agreements. Portfolio of 1.5-2.0 GW " +
      "across 15-20 projects. ITC and PTC benefits flow through to investors.",
    geographicFocus: "United States (ERCOT, PJM, CAISO, MISO)",
  },

  // ─────────────────────────────────────────────────
  // 12. Infrastructure — 506(c) Digital Infrastructure
  // ─────────────────────────────────────────────────
  {
    id: "infra_506c_sample",
    label: "Infrastructure 506(c) — Digital Infrastructure",
    description:
      "Digital infrastructure fund targeting $750M. " +
      "1.75% management fee, 20% carry over 8% preferred. " +
      "506(c) for broad institutional marketing. Data centers, fiber, towers.",
    name: "Nexus Digital Infrastructure Fund I",
    fundName: "Nexus Digital Infrastructure Fund I, L.P.",
    fundType: "INFRASTRUCTURE",
    gpEntityName: "Nexus Infrastructure Capital, LLC",
    exemptionType: "REG_D_506C",
    targetRaise: 750000000,
    minInvestment: 10000000,
    managementFee: 1.75,
    carriedInterest: 20.0,
    preferredReturn: 8.0,
    fundTermYears: 12,
    investmentStrategy:
      "Develop and acquire data centers, fiber-optic networks, and cell tower portfolios " +
      "in Tier 1 and Tier 2 US markets. Focus on hyperscale and enterprise colocation " +
      "facilities with long-term contracted revenue. Target 200+ MW of data center " +
      "capacity and 15,000+ route miles of fiber.",
    geographicFocus: "United States (primary) and Western Europe (selective)",
  },
];

export default SAMPLE_CAPITAL_DEALS;
