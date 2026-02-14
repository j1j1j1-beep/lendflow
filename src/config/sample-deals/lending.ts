/**
 * Sample Deals - Lending Module (14 Loan Programs)
 *
 * All rates use Feb 2026 base rates:
 *   Prime: 6.75% | SOFR: 4.30% | 10yr Treasury: 4.15%
 *
 * Every deal is designed to pass compliance checks:
 *   - Rates within program spread ranges
 *   - LTV within program maximums
 *   - Loan amounts within program min/max
 *   - Terms within program maximums
 *
 * LEGAL NOTE: These are fictional scenarios with realistic numbers.
 * All entities are fictitious. Any resemblance to real businesses is coincidental.
 */

export interface SampleLendingDeal {
  id: string;
  label: string;
  description: string;
  borrowerName: string;
  loanAmount: number;
  loanPurpose: string;
  loanProgramId: string;
  propertyAddress: string;
  proposedRate: number;
  proposedTerm: number;
}

export const SAMPLE_LENDING_DEALS: SampleLendingDeal[] = [
  // ─────────────────────────────────────────────────
  // 1. SBA 7(a) — Small business acquisition
  // ─────────────────────────────────────────────────
  {
    id: "sba_7a_sample",
    label: "SBA 7(a) — Restaurant Acquisition",
    description:
      "Family-owned restaurant group acquiring a second location. " +
      "$1.2M loan, 25-year term, SBA guaranty. Rate: Prime + 2.50%.",
    borrowerName: "Meridian Hospitality Group, LLC",
    loanAmount: 1200000,
    loanPurpose: "purchase",
    loanProgramId: "sba_7a",
    propertyAddress: "4521 Commerce Dr, Dallas, TX 75201",
    proposedRate: 9.25, // Prime 6.75% + 2.50% spread (within tier: >$350K max P+3%)
    proposedTerm: 300, // 25 years (max for RE-secured SBA 7(a))
  },

  // ─────────────────────────────────────────────────
  // 2. SBA 504 — Manufacturing expansion
  // ─────────────────────────────────────────────────
  {
    id: "sba_504_sample",
    label: "SBA 504 — Manufacturing Facility",
    description:
      "Precision manufacturer expanding into a new 40,000 SF production facility. " +
      "Total project $2.75M. SBA 504 debenture: $1,100,000 (40%). " +
      "Bank first lien: $1,375,000 (50%). Borrower equity: $275,000 (10%).",
    borrowerName: "Cascade Precision Manufacturing, Inc.",
    loanAmount: 1100000, // SBA 504 debenture portion (40% of $2.75M)
    loanPurpose: "purchase",
    loanProgramId: "sba_504",
    propertyAddress: "8900 Industrial Pkwy, Portland, OR 97203",
    proposedRate: 4.9, // Treasury 4.15% + 0.75% spread (within 0.5-1.5% range)
    proposedTerm: 300, // 25 years (max for 504)
  },

  // ─────────────────────────────────────────────────
  // 3. Commercial Real Estate — Office building
  // ─────────────────────────────────────────────────
  {
    id: "commercial_cre_sample",
    label: "Commercial CRE — Office Building",
    description:
      "Class B+ office building acquisition. 45,000 SF, 92% occupied, NOI $520K. " +
      "$5M loan on $7M property (71% LTV). 10-year balloon, 30-year amortization.",
    borrowerName: "Summit Office Partners, LLC",
    loanAmount: 5000000,
    loanPurpose: "purchase",
    loanProgramId: "commercial_cre",
    propertyAddress: "2200 Peachtree Rd NW, Atlanta, GA 30309",
    proposedRate: 6.8, // SOFR 4.30% + 2.50% spread (within 2.0-4.0% range)
    proposedTerm: 120, // 10-year balloon (max term)
  },

  // ─────────────────────────────────────────────────
  // 4. DSCR — Investment rental property
  // ─────────────────────────────────────────────────
  {
    id: "dscr_sample",
    label: "DSCR — Investment Rental Property",
    description:
      "4-unit residential investment property. Monthly rent $7,200, expenses $1,800. " +
      "$750K loan on $1M property (75% LTV). DSCR 1.12. No personal income verification.",
    borrowerName: "Trident Property Holdings, LLC",
    loanAmount: 750000,
    loanPurpose: "purchase",
    loanProgramId: "dscr",
    propertyAddress: "1847 Magnolia Ave, Long Beach, CA 90806",
    proposedRate: 7.8, // SOFR 4.30% + 3.50% spread (within 3.0-6.0% range)
    proposedTerm: 360, // 30 years
  },

  // ─────────────────────────────────────────────────
  // 5. Bank Statement — Self-employed borrower
  // ─────────────────────────────────────────────────
  {
    id: "bank_statement_sample",
    label: "Bank Statement — Self-Employed Purchase",
    description:
      "Self-employed marketing consultant purchasing primary residence. " +
      "24-month bank statement average deposits: $18,500/month. " +
      "$650K loan on $850K property (76% LTV).",
    borrowerName: "Rachel Nguyen",
    loanAmount: 650000,
    loanPurpose: "purchase",
    loanProgramId: "bank_statement",
    propertyAddress: "3315 Oak Hollow Ln, Scottsdale, AZ 85258",
    proposedRate: 8.3, // SOFR 4.30% + 4.00% spread (within 3.5-6.0% range)
    proposedTerm: 360, // 30 years
  },

  // ─────────────────────────────────────────────────
  // 6. Conventional Business Term — Distribution company
  // ─────────────────────────────────────────────────
  {
    id: "conventional_business_sample",
    label: "Conventional Business — Working Capital",
    description:
      "Regional distribution company expanding operations. " +
      "$500K term loan secured by equipment, inventory, and blanket lien. " +
      "Annual revenue $4.2M, EBITDA $680K.",
    borrowerName: "Pacific Coast Distributors, Inc.",
    loanAmount: 500000,
    loanPurpose: "purchase",
    loanProgramId: "conventional_business",
    propertyAddress: "7700 Distribution Way, Sacramento, CA 95828",
    proposedRate: 8.75, // Prime 6.75% + 2.00% spread (within 1.0-3.5% range)
    proposedTerm: 84, // 7 years (max term)
  },

  // ─────────────────────────────────────────────────
  // 7. Business Line of Credit — Staffing agency
  // ─────────────────────────────────────────────────
  {
    id: "line_of_credit_sample",
    label: "Line of Credit — Staffing Agency",
    description:
      "IT staffing agency with $3.8M annual revenue. " +
      "$350K revolving line secured by accounts receivable. " +
      "Average AR balance $420K. 12-month annual renewal.",
    borrowerName: "Vertex Staffing Solutions, LLC",
    loanAmount: 350000,
    loanPurpose: "refinance", // Closest to revolving facility
    loanProgramId: "line_of_credit",
    propertyAddress: "1200 Technology Dr, Suite 400, San Jose, CA 95110",
    proposedRate: 7.75, // Prime 6.75% + 1.00% spread (within 0.5-2.5% range)
    proposedTerm: 12, // Annual renewal
  },

  // ─────────────────────────────────────────────────
  // 8. Equipment Financing — CNC machines
  // ─────────────────────────────────────────────────
  {
    id: "equipment_financing_sample",
    label: "Equipment Financing — CNC Machinery",
    description:
      "Machine shop purchasing two Haas VF-4SS CNC vertical machining centers. " +
      "Equipment value $500K. $425K loan (85% LTV). 5-year term matching useful life.",
    borrowerName: "Ironclad Machine Works, Inc.",
    loanAmount: 425000,
    loanPurpose: "purchase",
    loanProgramId: "equipment_financing",
    propertyAddress: "5500 Fabrication Blvd, Charlotte, NC 28208",
    proposedRate: 9.25, // Prime 6.75% + 2.50% spread (within 2.0-4.5% range)
    proposedTerm: 60, // 5 years (within 84-month max)
  },

  // ─────────────────────────────────────────────────
  // 9. Bridge Loan — Value-add multifamily
  // ─────────────────────────────────────────────────
  {
    id: "bridge_sample",
    label: "Bridge — Value-Add Multifamily",
    description:
      "72-unit apartment complex requiring $1.2M in renovations. " +
      "As-is value $5.5M, as-stabilized value $8.2M. " +
      "$3.5M bridge loan (64% as-is LTV). 24-month term, interest-only.",
    borrowerName: "Elevate Capital Partners, LLC",
    loanAmount: 3500000,
    loanPurpose: "bridge",
    loanProgramId: "bridge",
    propertyAddress: "900 Riverside Dr, Nashville, TN 37206",
    proposedRate: 11.75, // Prime 6.75% + 5.00% spread (within 4.0-8.0% range)
    proposedTerm: 24, // 2 years (within 36-month max)
  },

  // ─────────────────────────────────────────────────
  // 10. Crypto-Collateralized — BTC-backed business loan
  // ─────────────────────────────────────────────────
  {
    id: "crypto_collateral_sample",
    label: "Crypto — BTC-Backed Business Loan",
    description:
      "Web3 infrastructure company borrowing against BTC holdings. " +
      "Collateral: 45 BTC (approx. $4.3M at $95,000/BTC). " +
      "$2M loan (47% LTV, well below 70% max). " +
      "Margin call at 80% LTV, liquidation at 90% LTV.",
    borrowerName: "Blockforge Labs, Inc.",
    loanAmount: 2000000,
    loanPurpose: "cash-out-refinance",
    loanProgramId: "crypto_collateral",
    propertyAddress: "100 Blockchain Way, Miami, FL 33131",
    proposedRate: 9.3, // SOFR 4.30% + 5.00% spread (within 4.0-8.0% range)
    proposedTerm: 36, // 3 years (within 60-month max)
  },

  // ─────────────────────────────────────────────────
  // 11. Multifamily — Agency-eligible apartment complex
  // ─────────────────────────────────────────────────
  {
    id: "multifamily_sample",
    label: "Multifamily — 150-Unit Apartment Complex",
    description:
      "Class B garden-style apartment complex. 150 units, 95% occupancy. " +
      "NOI $1.44M. $18M loan on $24M property (75% LTV). " +
      "DSCR 1.42. Non-recourse. 30-year fixed.",
    borrowerName: "Greenfield Residential Partners, LP",
    loanAmount: 18000000,
    loanPurpose: "purchase",
    loanProgramId: "multifamily",
    propertyAddress: "4200 Lakewood Blvd, Denver, CO 80227",
    proposedRate: 6.3, // SOFR 4.30% + 2.00% spread (within 1.5-3.5% range)
    proposedTerm: 360, // 30 years
  },

  // ─────────────────────────────────────────────────
  // 12. Construction — Ground-up mixed use
  // ─────────────────────────────────────────────────
  {
    id: "construction_sample",
    label: "Construction — Ground-Up Mixed Use",
    description:
      "5-story mixed-use development: 48 apartments over 8,000 SF ground-floor retail. " +
      "Total project cost $11.5M, completed value $15.2M. " +
      "$8M construction loan (53% LTC, 67% of completed value). " +
      "24-month draw schedule, 12-month interest reserve.",
    borrowerName: "Catalyst Development Group, LLC",
    loanAmount: 8000000,
    loanPurpose: "construction",
    loanProgramId: "construction",
    propertyAddress: "1500 Market St, Austin, TX 78701",
    proposedRate: 9.75, // Prime 6.75% + 3.00% spread (within 2.0-4.5% range)
    proposedTerm: 24, // 24-month construction period (within 36-month max)
  },

  // ─────────────────────────────────────────────────
  // 13. Hard Money — Fix and flip
  // ─────────────────────────────────────────────────
  {
    id: "hard_money_sample",
    label: "Hard Money — Fix & Flip Residential",
    description:
      "Experienced flipper acquiring distressed single-family. " +
      "As-is value $1.1M, ARV $1.65M. Renovation budget $280K. " +
      "$750K loan (68% of as-is value). 12-month term, interest-only. " +
      "Underwritten on collateral, not borrower credit.",
    borrowerName: "Titan Realty Ventures, LLC",
    loanAmount: 750000,
    loanPurpose: "bridge",
    loanProgramId: "hard_money",
    propertyAddress: "2847 Palm Canyon Dr, Palm Springs, CA 92264",
    proposedRate: 13.75, // Prime 6.75% + 7.00% spread (within 5.0-10.0% range)
    proposedTerm: 12, // 12 months (within 24-month max)
  },

  // ─────────────────────────────────────────────────
  // 14. Mezzanine Debt — Subordinated real estate
  // ─────────────────────────────────────────────────
  {
    id: "mezzanine_sample",
    label: "Mezzanine — Subordinated CRE Debt",
    description:
      "Mezzanine financing for Class A office tower acquisition. " +
      "Property value $42M. Senior debt $27.3M (65% LTV). " +
      "Mezzanine: $5M (combined 77% LTV, within 90% max). " +
      "Secured by UCC pledge of membership interests. " +
      "Intercreditor agreement with senior lender required.",
    borrowerName: "Pinnacle Capital Group, LP",
    loanAmount: 5000000,
    loanPurpose: "purchase",
    loanProgramId: "mezzanine",
    propertyAddress: "One Financial Center, Boston, MA 02111",
    proposedRate: 12.3, // SOFR 4.30% + 8.00% spread (within 6.0-12.0% range)
    proposedTerm: 60, // 5 years (within 120-month max)
  },
];

export default SAMPLE_LENDING_DEALS;
