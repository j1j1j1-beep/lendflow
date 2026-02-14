/**
 * Sample Deals - Deals/M&A Module (8 Transaction Types)
 *
 * Transaction Types:
 *   Stock Purchase, Asset Purchase, Forward Merger, Reverse Triangular Merger,
 *   Forward Triangular Merger, Reverse Merger, Tender Offer, Section 363 Sale
 *
 * Key legal considerations (2026):
 *   - HSR Act: $119.5M size-of-transaction threshold (2025 adjustment)
 *   - HSR filing fees: 6 tiers from $30K to $2.335M
 *   - HSR daily penalty for gun-jumping: ~$54,540 (2026 FTC inflation)
 *   - CFIUS/FIRRMA: Mandatory declarations for TID US businesses
 *   - WARN Act: 60-day notice for 100+ employees
 *   - State mini-WARN: CA (75 emp), NY (50 emp), NJ (90-day notice)
 *   - Section 280G golden parachute: 20% excise on excess parachute payments
 *   - Non-compete: Sale-of-business exception; CA/MN/ND/OK ban non-competes
 *   - MAC: 9 standard carveouts (pandemic, cyber, credit markets, etc.)
 *   - Indemnification: 10-20% cap, 0.5-1.5% basket, 12-18mo general / 6yr fundamental
 *   - Escrow: Market range 5-15% of purchase price
 *   - FIRPTA: Section 1445 withholding (15%)
 *   - Section 338(h)(10): Form 8023 filing deadline = 15th day of 9th month after close
 *
 * All entities are fictitious.
 */

export interface SampleMADeal {
  id: string;
  label: string;
  description: string;
  name: string;
  transactionType: string;
  buyerName: string;
  sellerName: string;
  targetCompany: string;
  purchasePrice: number;
  cashComponent: number;
  stockComponent: number;
  earnoutAmount: number;
  exclusivityDays: number;
  dueDiligenceDays: number;
  targetIndustry: string;
  governingLaw: string;
  nonCompeteYears: number;
  escrowPercent: number; // As percentage 0-100 (form value)
}

export const SAMPLE_MA_DEALS: SampleMADeal[] = [
  // ─────────────────────────────────────────────────
  // 1. Stock Purchase — Healthcare tech company
  // ─────────────────────────────────────────────────
  {
    id: "stock_purchase_sample",
    label: "Stock Purchase — Healthcare Tech",
    description:
      "PE firm acquiring 100% of healthcare SaaS company. " +
      "$185M all-cash deal. HSR filing required ($119.5M threshold). " +
      "Section 338(h)(10) election for step-up in basis. 10% escrow for 18 months.",
    name: "Acquisition of MedVault Technologies",
    transactionType: "STOCK_PURCHASE",
    buyerName: "Granite Peak Capital Partners, LLC",
    sellerName: "MedVault Technologies, Inc. Shareholders",
    targetCompany: "MedVault Technologies, Inc.",
    purchasePrice: 185000000,
    cashComponent: 185000000,
    stockComponent: 0,
    earnoutAmount: 0,
    exclusivityDays: 45,
    dueDiligenceDays: 60,
    targetIndustry: "Healthcare Technology",
    governingLaw: "Delaware",
    nonCompeteYears: 3,
    escrowPercent: 10, // 10% = $18.5M in escrow
  },

  // ─────────────────────────────────────────────────
  // 2. Asset Purchase — Restaurant chain
  // ─────────────────────────────────────────────────
  {
    id: "asset_purchase_sample",
    label: "Asset Purchase — Restaurant Group",
    description:
      "Strategic acquirer purchasing assets (brand, leases, equipment, IP) of " +
      "22-location fast-casual restaurant chain. $42M deal with $6M earnout " +
      "tied to same-store sales growth. Below HSR threshold. " +
      "Asset deal to avoid successor liability.",
    name: "Acquisition of Harvest Kitchen Assets",
    transactionType: "ASSET_PURCHASE",
    buyerName: "Continental Dining Group, Inc.",
    sellerName: "Harvest Kitchen Holdings, LLC",
    targetCompany: "Harvest Kitchen, LLC",
    purchasePrice: 42000000,
    cashComponent: 36000000,
    stockComponent: 0,
    earnoutAmount: 6000000, // Tied to EBITDA targets over 2 years
    exclusivityDays: 30,
    dueDiligenceDays: 45,
    targetIndustry: "Restaurant / Food Service",
    governingLaw: "Delaware",
    nonCompeteYears: 5, // Sale-of-business exception applies
    escrowPercent: 10, // 10% = $4.2M
  },

  // ─────────────────────────────────────────────────
  // 3. Forward Merger — Two regional competitors
  // ─────────────────────────────────────────────────
  {
    id: "forward_merger_sample",
    label: "Forward Merger — Regional Insurance Agencies",
    description:
      "Two regional insurance brokerages combining via forward merger. " +
      "$95M deal with 60/40 cash/stock split. Target merges into Buyer. " +
      "Below HSR threshold. Tax-free reorganization under Section 368(a)(1)(A) " +
      "with continuity of interest (40% stock).",
    name: "Merger of Sterling and Beacon Insurance",
    transactionType: "MERGER_FORWARD",
    buyerName: "Sterling Insurance Group, Inc.",
    sellerName: "Beacon Risk Advisors, Inc.",
    targetCompany: "Beacon Risk Advisors, Inc.",
    purchasePrice: 95000000,
    cashComponent: 57000000,
    stockComponent: 38000000,
    earnoutAmount: 0,
    exclusivityDays: 60,
    dueDiligenceDays: 75,
    targetIndustry: "Insurance Brokerage",
    governingLaw: "Delaware",
    nonCompeteYears: 3,
    escrowPercent: 7.5, // 7.5% = $7.125M
  },

  // ─────────────────────────────────────────────────
  // 4. Reverse Triangular Merger — PE platform add-on
  // ─────────────────────────────────────────────────
  {
    id: "reverse_triangular_sample",
    label: "Reverse Triangular Merger — PE Add-On",
    description:
      "PE-backed platform company acquiring competitor via reverse triangular merger. " +
      "$275M deal. HSR filing required. Merger sub merges into Target, " +
      "Target survives as wholly-owned subsidiary. Preserves Target contracts " +
      "and licenses without assignment consents.",
    name: "Atlas Logistics Acquires FreightLink",
    transactionType: "MERGER_REVERSE_TRIANGULAR",
    buyerName: "Atlas Logistics Holdings, Inc.",
    sellerName: "FreightLink Systems, Inc. Stockholders",
    targetCompany: "FreightLink Systems, Inc.",
    purchasePrice: 275000000,
    cashComponent: 250000000,
    stockComponent: 25000000, // Rollover equity for management
    earnoutAmount: 0,
    exclusivityDays: 60,
    dueDiligenceDays: 90,
    targetIndustry: "Logistics Technology",
    governingLaw: "Delaware",
    nonCompeteYears: 4,
    escrowPercent: 8, // 8% = $22M
  },

  // ─────────────────────────────────────────────────
  // 5. Forward Triangular Merger — Public sub acquiring private
  // ─────────────────────────────────────────────────
  {
    id: "forward_triangular_sample",
    label: "Forward Triangular Merger — Subsidiary Acquisition",
    description:
      "Public company subsidiary acquiring private company. " +
      "$155M deal. HSR filing required. Target merges into newly-formed " +
      "acquisition sub. Parent company guarantees obligations. " +
      "Qualifies as Section 368(a)(2)(D) tax-free reorganization.",
    name: "Orion Defense Systems Acquires Tactical AI",
    transactionType: "MERGER_FORWARD_TRIANGULAR",
    buyerName: "Orion Defense Systems, Inc.",
    sellerName: "Tactical AI Solutions, LLC Members",
    targetCompany: "Tactical AI Solutions, LLC",
    purchasePrice: 155000000,
    cashComponent: 100000000,
    stockComponent: 55000000, // Parent company stock
    earnoutAmount: 0,
    exclusivityDays: 45,
    dueDiligenceDays: 60,
    targetIndustry: "Defense Technology",
    governingLaw: "Delaware",
    nonCompeteYears: 3,
    escrowPercent: 10, // 10% = $15.5M
  },

  // ─────────────────────────────────────────────────
  // 6. Reverse Merger — Private going public via shell
  // ─────────────────────────────────────────────────
  {
    id: "reverse_merger_sample",
    label: "Reverse Merger — Private-to-Public",
    description:
      "Private biotech company going public via reverse merger with public shell. " +
      "$320M implied valuation. Former private company shareholders receive 85% " +
      "of combined entity. SEC Form 8-K Super filing required within 4 business days.",
    name: "NovaBio Therapeutics Reverse Merger",
    transactionType: "REVERSE_MERGER",
    buyerName: "Clearpath Acquisition Corp.",
    sellerName: "NovaBio Therapeutics, Inc. Stockholders",
    targetCompany: "NovaBio Therapeutics, Inc.",
    purchasePrice: 320000000, // Implied equity value
    cashComponent: 40000000,  // PIPE financing
    stockComponent: 280000000,
    earnoutAmount: 0,
    exclusivityDays: 90,
    dueDiligenceDays: 120,
    targetIndustry: "Biotechnology / Pharmaceuticals",
    governingLaw: "Delaware",
    nonCompeteYears: 2,
    escrowPercent: 5, // 5% = $16M (lower for reverse merger)
  },

  // ─────────────────────────────────────────────────
  // 7. Tender Offer — Public company acquisition
  // ─────────────────────────────────────────────────
  {
    id: "tender_offer_sample",
    label: "Tender Offer — Public Company Acquisition",
    description:
      "Cash tender offer for all outstanding shares of public company. " +
      "$1.2B deal at 35% premium to 30-day VWAP. HSR filing required " +
      "(Tier 4 fee: $415K). Minimum tender condition: 90% of outstanding shares. " +
      "Back-end merger to acquire remaining shares.",
    name: "Acquisition of Vertex Data Corp",
    transactionType: "TENDER_OFFER",
    buyerName: "Apex Technology Holdings, Inc.",
    sellerName: "Vertex Data Corporation Shareholders",
    targetCompany: "Vertex Data Corporation",
    purchasePrice: 1200000000,
    cashComponent: 1200000000,
    stockComponent: 0,
    earnoutAmount: 0,
    exclusivityDays: 0,  // No exclusivity in hostile/public offers
    dueDiligenceDays: 30, // Limited DD in public company context
    targetIndustry: "Enterprise Data Analytics",
    governingLaw: "Delaware",
    nonCompeteYears: 0, // Not applicable for public company
    escrowPercent: 0,    // Not applicable for tender offer
  },

  // ─────────────────────────────────────────────────
  // 8. Section 363 Sale — Bankruptcy acquisition
  // ─────────────────────────────────────────────────
  {
    id: "section_363_sample",
    label: "Section 363 Sale — Bankruptcy Acquisition",
    description:
      "Stalking horse bidder acquiring assets of bankrupt retailer. " +
      "$68M bid for 85 store locations, inventory, brand IP, and customer database. " +
      "Free and clear of liens (11 USC 363(f)). Breakup fee: $2.04M (3%). " +
      "Subject to higher and better offers at bankruptcy auction.",
    name: "Acquisition of Northstar Retail Assets",
    transactionType: "SECTION_363_SALE",
    buyerName: "Meridian Retail Acquisitions, LLC",
    sellerName: "Northstar Retail Holdings, Inc. (Debtor-in-Possession)",
    targetCompany: "Northstar Retail Holdings, Inc.",
    purchasePrice: 68000000,
    cashComponent: 68000000,
    stockComponent: 0,
    earnoutAmount: 0,
    exclusivityDays: 0,   // No exclusivity in 363 sales (open auction)
    dueDiligenceDays: 21, // Compressed timeline in bankruptcy
    targetIndustry: "Specialty Retail",
    governingLaw: "Delaware", // Bankruptcy venue
    nonCompeteYears: 0,   // Debtor typically cannot provide non-compete
    escrowPercent: 5,     // 5% good faith deposit = $3.4M
  },
];

export default SAMPLE_MA_DEALS;
