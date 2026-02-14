/**
 * Sample Deals - Syndication Module (12 Property Types)
 *
 * Property Types:
 *   Multifamily, Office, Retail, Industrial, Mixed Use, Self Storage,
 *   Mobile Home Park, Hotel, NNN Retail, Senior Housing, Student Housing, Build to Rent
 *
 * Key legal & financial considerations (2026):
 *   - Depreciation: 27.5yr residential (Multifamily, Student, Senior, BTR, MHP)
 *                    39yr commercial (Office, Retail, Industrial, Mixed, Storage, Hotel, NNN)
 *   - Bonus depreciation: TCJA phase-down; OBBBA 2025 potential 100% restoration
 *   - QOZ: 10-year hold for capital gains exclusion, 90% asset test
 *   - 1031: 45-day ID period, 180-day closing, real property only post-TCJA
 *   - Passive loss: Section 469, $100K/$150K AGI phase-out (not adjusted since 1986)
 *   - NOI expense ratios: Hotels 55-75%, Industrial 25-35%, Multifamily 35-45%, Office 40-50%
 *   - Reg D 506(b)/506(c) securities compliance
 *   - UBTI implications for IRA/trust investors (37% bracket at ~$14,450 for trusts)
 *
 * All entities and properties are fictitious.
 */

export interface SampleSyndicationDeal {
  id: string;
  label: string;
  description: string;
  name: string;
  entityName: string;
  sponsorName: string;
  propertyAddress: string;
  propertyType: string;
  purchasePrice: number;
  totalEquityRaise: number;
  minInvestment: number;
  loanAmount: number;
  interestRate: number;      // Percentage (e.g., 5.5)
  preferredReturn: number;   // Percentage (e.g., 8.0)
  projectedIrr: number;      // Percentage (e.g., 18.0)
  acquisitionFee: number;    // Percentage (e.g., 2.0)
  assetMgmtFee: number;     // Percentage (e.g., 1.5)
  projectedHoldYears: number;
  units: number;
  yearBuilt: number;
}

export const SAMPLE_SYNDICATION_DEALS: SampleSyndicationDeal[] = [
  // ─────────────────────────────────────────────────
  // 1. Multifamily — 200-unit garden-style apartments
  //    Depreciation: 27.5 years (residential)
  // ─────────────────────────────────────────────────
  {
    id: "multifamily_sample",
    label: "Multifamily — 200-Unit Apartments",
    description:
      "Class B garden-style apartment complex in Sun Belt market. " +
      "200 units, value-add strategy with $3.2M renovation budget. " +
      "Target 15-20% rent increases post-renovation. 27.5-year depreciation.",
    name: "Sycamore Creek Apartments Fund",
    entityName: "Sycamore Creek Investors, LLC",
    sponsorName: "Atlas Multifamily Partners",
    propertyAddress: "4200 Sycamore Creek Dr, Phoenix, AZ 85042",
    propertyType: "MULTIFAMILY",
    purchasePrice: 32000000,
    totalEquityRaise: 12800000, // 40% equity
    minInvestment: 50000,
    loanAmount: 22400000, // 70% LTV
    interestRate: 5.8,
    preferredReturn: 8.0,
    projectedIrr: 18.5,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 5,
    units: 200,
    yearBuilt: 1998,
  },

  // ─────────────────────────────────────────────────
  // 2. Office — Class A suburban office
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "office_sample",
    label: "Office — Class A Suburban Office",
    description:
      "175,000 SF Class A suburban office campus. 88% occupied with 5.2-year WALT. " +
      "Below-market rents with 12% mark-to-market opportunity. " +
      "39-year depreciation. Expense ratio ~45%.",
    name: "Parkway Office Campus Fund",
    entityName: "Parkway Office Investors, LLC",
    sponsorName: "Granite Office Partners",
    propertyAddress: "One Parkway Center, Raleigh, NC 27615",
    propertyType: "OFFICE",
    purchasePrice: 45000000,
    totalEquityRaise: 18000000, // 40% equity
    minInvestment: 100000,
    loanAmount: 29250000, // 65% LTV
    interestRate: 6.2,
    preferredReturn: 8.0,
    projectedIrr: 15.0,
    acquisitionFee: 1.5,
    assetMgmtFee: 1.0,
    projectedHoldYears: 7,
    units: 0, // Not applicable for office (use SF instead)
    yearBuilt: 2008,
  },

  // ─────────────────────────────────────────────────
  // 3. Retail — Grocery-anchored shopping center
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "retail_sample",
    label: "Retail — Grocery-Anchored Center",
    description:
      "120,000 SF grocery-anchored neighborhood center. " +
      "Kroger anchor (15 years remaining on lease). 94% occupied. " +
      "NOI $1.85M. 6.5% going-in cap rate. 39-year depreciation.",
    name: "Harvest Square Shopping Center Fund",
    entityName: "Harvest Square Investors, LLC",
    sponsorName: "Cornerstone Retail Partners",
    propertyAddress: "8500 Harvest Square Blvd, Tampa, FL 33615",
    propertyType: "RETAIL",
    purchasePrice: 28500000,
    totalEquityRaise: 11400000, // 40% equity
    minInvestment: 50000,
    loanAmount: 18525000, // 65% LTV
    interestRate: 5.9,
    preferredReturn: 7.0,
    projectedIrr: 14.0,
    acquisitionFee: 1.5,
    assetMgmtFee: 1.0,
    projectedHoldYears: 7,
    units: 0,
    yearBuilt: 2005,
  },

  // ─────────────────────────────────────────────────
  // 4. Industrial — Distribution warehouse
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "industrial_sample",
    label: "Industrial — Distribution Warehouse",
    description:
      "250,000 SF Class A industrial/distribution facility. " +
      "32-foot clear height, 50 dock doors. Single tenant NNN lease, " +
      "8 years remaining. Expense ratio ~28%. 39-year depreciation.",
    name: "Gateway Industrial Fund",
    entityName: "Gateway Industrial Investors, LLC",
    sponsorName: "Iron Gate Industrial Partners",
    propertyAddress: "2100 Logistics Pkwy, Columbus, OH 43228",
    propertyType: "INDUSTRIAL",
    purchasePrice: 38000000,
    totalEquityRaise: 13300000, // 35% equity
    minInvestment: 75000,
    loanAmount: 26600000, // 70% LTV
    interestRate: 5.5,
    preferredReturn: 7.0,
    projectedIrr: 14.5,
    acquisitionFee: 1.0,
    assetMgmtFee: 0.75,
    projectedHoldYears: 7,
    units: 0,
    yearBuilt: 2019,
  },

  // ─────────────────────────────────────────────────
  // 5. Mixed Use — Retail + apartments
  //    Depreciation: 39 years (commercial — IRS treats as commercial
  //    when >20% of gross rental income is from commercial tenants)
  // ─────────────────────────────────────────────────
  {
    id: "mixed_use_sample",
    label: "Mixed Use — Retail + Apartments",
    description:
      "5-story mixed-use: 72 apartments over 12,000 SF ground-floor retail. " +
      "Urban infill location. 96% residential occupancy, 100% retail leased. " +
      "Combined NOI $1.25M. Blended cap rate 5.8%.",
    name: "Union Square Mixed-Use Fund",
    entityName: "Union Square Investors, LLC",
    sponsorName: "Urban Core Development Partners",
    propertyAddress: "400 Union Square, Charlotte, NC 28202",
    propertyType: "MIXED_USE",
    purchasePrice: 21500000,
    totalEquityRaise: 8600000, // 40% equity
    minInvestment: 50000,
    loanAmount: 14475000, // 67% LTV
    interestRate: 6.0,
    preferredReturn: 8.0,
    projectedIrr: 16.0,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 5,
    units: 72,
    yearBuilt: 2015,
  },

  // ─────────────────────────────────────────────────
  // 6. Self Storage — Climate-controlled facility
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "self_storage_sample",
    label: "Self Storage — Climate-Controlled Facility",
    description:
      "85,000 net rentable SF, 650 units. 78% climate-controlled. " +
      "Current occupancy 82% (stabilized market: 92%). " +
      "Revenue management upside via dynamic pricing. Expense ratio ~35%.",
    name: "StoreRight Self Storage Fund",
    entityName: "StoreRight Storage Investors, LLC",
    sponsorName: "National Storage Partners",
    propertyAddress: "3300 Storage Way, San Antonio, TX 78245",
    propertyType: "SELF_STORAGE",
    purchasePrice: 11500000,
    totalEquityRaise: 4600000, // 40% equity
    minInvestment: 25000,
    loanAmount: 7475000, // 65% LTV
    interestRate: 6.1,
    preferredReturn: 8.0,
    projectedIrr: 19.0,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 5,
    units: 650, // Storage units
    yearBuilt: 2012,
  },

  // ─────────────────────────────────────────────────
  // 7. Mobile Home Park — Stabilized community
  //    Depreciation: 27.5 years (residential — mobile home parks
  //    with tenant-owned homes are residential per IRS Rev. Rul. 57-187)
  // ─────────────────────────────────────────────────
  {
    id: "mobile_home_park_sample",
    label: "Mobile Home Park — 140-Pad Community",
    description:
      "140-pad mobile home park. 95% occupied. Tenant-owned homes (park owns land only). " +
      "Lot rent $425/month (15% below market). City water/sewer. " +
      "NOI $580K. 27.5-year residential depreciation schedule.",
    name: "Meadowbrook Community Fund",
    entityName: "Meadowbrook MHP Investors, LLC",
    sponsorName: "Heartland Communities Group",
    propertyAddress: "5600 Meadowbrook Rd, Jacksonville, FL 32244",
    propertyType: "MOBILE_HOME_PARK",
    purchasePrice: 8200000,
    totalEquityRaise: 3280000, // 40% equity
    minInvestment: 25000,
    loanAmount: 5740000, // 70% LTV
    interestRate: 5.8,
    preferredReturn: 8.0,
    projectedIrr: 20.0,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 5,
    units: 140, // Pads
    yearBuilt: 1985,
  },

  // ─────────────────────────────────────────────────
  // 8. Hotel — Boutique select-service
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "hotel_sample",
    label: "Hotel — Boutique Select-Service",
    description:
      "120-key boutique select-service hotel. RevPAR $125, ADR $165, occupancy 76%. " +
      "Revenue $7.2M. NOI $1.8M (25% NOI margin). " +
      "Expense ratio ~65% (typical for hotels). 39-year depreciation. " +
      "FF&E reserve: 4% of gross revenue.",
    name: "The Meridian Hotel Fund",
    entityName: "Meridian Hospitality Investors, LLC",
    sponsorName: "Sterling Hospitality Group",
    propertyAddress: "200 Waterfront Dr, Charleston, SC 29401",
    propertyType: "HOTEL",
    purchasePrice: 26000000,
    totalEquityRaise: 11700000, // 45% equity (higher for hotels)
    minInvestment: 50000,
    loanAmount: 15600000, // 60% LTV (lower for hotels due to volatility)
    interestRate: 6.5,
    preferredReturn: 9.0, // Higher pref for hotel risk
    projectedIrr: 17.0,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 5,
    units: 120, // Keys
    yearBuilt: 2016,
  },

  // ─────────────────────────────────────────────────
  // 9. NNN Retail — Single-tenant net lease
  //    Depreciation: 39 years (commercial)
  // ─────────────────────────────────────────────────
  {
    id: "nnn_retail_sample",
    label: "NNN Retail — Single-Tenant Net Lease Portfolio",
    description:
      "Portfolio of 5 single-tenant NNN retail properties. " +
      "Investment-grade tenants (Dollar General, Walgreens, O'Reilly Auto). " +
      "Weighted average lease term 11.2 years. Absolute NNN (tenant pays all expenses). " +
      "1.5% annual rent escalations. Expense ratio <5%.",
    name: "Evergreen NNN Portfolio Fund",
    entityName: "Evergreen Net Lease Investors, LLC",
    sponsorName: "Evergreen Capital Advisors",
    propertyAddress: "Various — Southeast US (5 locations)",
    propertyType: "NNN_RETAIL",
    purchasePrice: 18500000,
    totalEquityRaise: 7400000, // 40% equity
    minInvestment: 50000,
    loanAmount: 12025000, // 65% LTV
    interestRate: 5.6,
    preferredReturn: 7.0,
    projectedIrr: 12.0, // Lower IRR for lower-risk NNN
    acquisitionFee: 1.0,
    assetMgmtFee: 0.75,
    projectedHoldYears: 10,
    units: 5, // Properties
    yearBuilt: 2018, // Weighted average
  },

  // ─────────────────────────────────────────────────
  // 10. Senior Housing — Assisted living facility
  //     Depreciation: 27.5 years (residential)
  // ─────────────────────────────────────────────────
  {
    id: "senior_housing_sample",
    label: "Senior Housing — Assisted Living Facility",
    description:
      "96-bed assisted living and memory care community. " +
      "Occupancy 89%. Monthly rent $5,200 (all-inclusive). Revenue $5.8M. " +
      "NOI $1.5M. Operator: experienced regional operator with 12 communities. " +
      "27.5-year residential depreciation.",
    name: "Golden Oaks Senior Living Fund",
    entityName: "Golden Oaks Senior Investors, LLC",
    sponsorName: "Paramount Senior Living Partners",
    propertyAddress: "1200 Golden Oaks Blvd, Sarasota, FL 34236",
    propertyType: "SENIOR_HOUSING",
    purchasePrice: 22000000,
    totalEquityRaise: 8800000, // 40% equity
    minInvestment: 50000,
    loanAmount: 14300000, // 65% LTV
    interestRate: 6.2,
    preferredReturn: 8.0,
    projectedIrr: 16.0,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 7,
    units: 96, // Beds
    yearBuilt: 2010,
  },

  // ─────────────────────────────────────────────────
  // 11. Student Housing — Purpose-built near university
  //     Depreciation: 27.5 years (residential)
  // ─────────────────────────────────────────────────
  {
    id: "student_housing_sample",
    label: "Student Housing — Purpose-Built University",
    description:
      "320-bed purpose-built student housing. 0.3 miles from flagship state university. " +
      "98% pre-leased for Fall 2026. Per-bed lease model ($850/bed/month). " +
      "Amenity-rich (pool, gym, study rooms). 27.5-year residential depreciation.",
    name: "University Heights Student Living Fund",
    entityName: "University Heights Investors, LLC",
    sponsorName: "Collegiate Housing Partners",
    propertyAddress: "150 University Ave, Gainesville, FL 32601",
    propertyType: "STUDENT_HOUSING",
    purchasePrice: 28000000,
    totalEquityRaise: 11200000, // 40% equity
    minInvestment: 50000,
    loanAmount: 19600000, // 70% LTV
    interestRate: 5.8,
    preferredReturn: 8.0,
    projectedIrr: 15.5,
    acquisitionFee: 2.0,
    assetMgmtFee: 1.5,
    projectedHoldYears: 7,
    units: 320, // Beds
    yearBuilt: 2014,
  },

  // ─────────────────────────────────────────────────
  // 12. Build to Rent — Single-family rental community
  //     Depreciation: 27.5 years (residential)
  // ─────────────────────────────────────────────────
  {
    id: "build_to_rent_sample",
    label: "Build to Rent — SFR Community",
    description:
      "85-home build-to-rent single-family rental community. " +
      "3-bed/2-bath homes averaging 1,450 SF. Monthly rent $2,100. " +
      "Ground-up development on 22-acre site. 18-month construction timeline. " +
      "27.5-year residential depreciation. Stabilized yield-on-cost 6.8%.",
    name: "Harvest Ranch BTR Community Fund",
    entityName: "Harvest Ranch BTR Investors, LLC",
    sponsorName: "Sunbelt Residential Partners",
    propertyAddress: "Harvest Ranch Rd & FM 1431, Georgetown, TX 78628",
    propertyType: "BUILD_TO_RENT",
    purchasePrice: 24500000, // Total development cost
    totalEquityRaise: 9800000, // 40% equity
    minInvestment: 50000,
    loanAmount: 17150000, // 70% LTC
    interestRate: 6.0, // Construction then perm
    preferredReturn: 8.0,
    projectedIrr: 17.0,
    acquisitionFee: 3.0, // Higher for development
    assetMgmtFee: 1.5,
    projectedHoldYears: 5, // Build + stabilize + exit
    units: 85,
    yearBuilt: 2026, // New construction
  },
];

export default SAMPLE_SYNDICATION_DEALS;
