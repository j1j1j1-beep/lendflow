/**
 * Sample Deals - Compliance Module (6 Report Types)
 *
 * Report Types:
 *   LP Quarterly Report, Capital Call Notice, Distribution Notice,
 *   K-1 Summary, Annual Report, Form ADV Summary
 *
 * Key legal considerations (2026):
 *   - K-1 late filing penalty: $260/partner/month (IRS Rev Proc 2025-32)
 *   - K-1 filing deadline: March 15 (September 15 with extension)
 *   - Form ADV Part 2A: Annual amendment required
 *   - Form PF: $150M AUM annual filing, $1.5B AUM quarterly
 *   - ILPA: Quarterly reporting template compliance
 *   - FIRPTA withholding: Section 1445 (15%), Section 1446(f) (10%)
 *   - Performance metrics: TVPI = DPI + RVPI (must be internally consistent)
 *   - Capital call: 10+ business days notice (excluding federal holidays)
 *
 * All fund names and figures are fictitious.
 */

export interface SampleComplianceDeal {
  id: string;
  label: string;
  description: string;
  name: string;
  reportType: string;
  fundName: string;
  fundType: string;
  reportingQuarter: string;
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date
  // Performance fields (LP Quarterly & Annual)
  nav?: number;
  totalContributions?: number;
  totalDistributions?: number;
  netIrr?: number;  // As percentage (e.g., 18.5)
  moic?: number;    // Multiple (e.g., 1.45)
  // Capital Call fields
  callAmount?: number;
  callDueDate?: string;
  callPurpose?: string;
  // Distribution fields
  distributionAmount?: number;
  distributionType?: string;
  // K-1 fields
  taxYear?: number;
  filingDeadline?: string;
}

export const SAMPLE_COMPLIANCE_DEALS: SampleComplianceDeal[] = [
  // ─────────────────────────────────────────────────
  // 1. LP Quarterly Report — PE Fund Q4 2025
  // ─────────────────────────────────────────────────
  {
    id: "lp_quarterly_sample",
    label: "LP Quarterly Report — PE Fund Q4 2025",
    description:
      "Fourth quarter 2025 LP report for a $250M PE buyout fund (2022 vintage). " +
      "Currently in deployment phase. 6 portfolio companies, 72% deployed. " +
      "Net IRR 22.4%, MOIC 1.45x. ILPA-compliant format.",
    name: "Ridgeline Fund III — Q4 2025 LP Report",
    reportType: "LP_QUARTERLY_REPORT",
    fundName: "Ridgeline Partners Fund III, L.P.",
    fundType: "PRIVATE_EQUITY",
    reportingQuarter: "Q4 2025",
    periodStart: "2025-10-01",
    periodEnd: "2025-12-31",
    nav: 285000000,
    totalContributions: 180000000,  // 72% of $250M called
    totalDistributions: 42000000,
    netIrr: 22.4,
    moic: 1.45,
    // DPI = 42M / 180M = 0.23x
    // RVPI = 285M / 180M = 1.58x
    // TVPI = (42M + 285M) / 180M = 1.82x (internally consistent: DPI + RVPI = 0.23 + 1.58 = 1.81 ~ 1.82)
  },

  // ─────────────────────────────────────────────────
  // 2. Capital Call Notice — $8.5M for new investment
  // ─────────────────────────────────────────────────
  {
    id: "capital_call_sample",
    label: "Capital Call — New Platform Investment",
    description:
      "Capital call of $8.5M for new platform acquisition. " +
      "Fund: $150M RE value-add fund. Unfunded commitments: $62M. " +
      "10 business days notice required per LPA. " +
      "Default penalty: Prime + 3% (9.75% in Feb 2026).",
    name: "Cornerstone RE Fund II — Capital Call #7",
    reportType: "CAPITAL_CALL_NOTICE",
    fundName: "Cornerstone Real Estate Value-Add Fund II, L.P.",
    fundType: "REAL_ESTATE",
    reportingQuarter: "Q1 2026",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    callAmount: 8500000,
    callDueDate: "2026-03-14", // 10+ business days from a Feb notice
    callPurpose:
      "Acquisition of Sycamore Creek Apartments, a 200-unit garden-style multifamily " +
      "property located at 4200 Sycamore Creek Dr, Phoenix, AZ 85042. " +
      "Total acquisition cost: $32,000,000. Fund equity requirement: $12,800,000 " +
      "(this call represents a partial draw of committed capital for the acquisition).",
  },

  // ─────────────────────────────────────────────────
  // 3. Distribution Notice — Return of capital + income
  // ─────────────────────────────────────────────────
  {
    id: "distribution_sample",
    label: "Distribution Notice — Property Sale Proceeds",
    description:
      "Distribution of $14.2M from sale of portfolio property. " +
      "Return of capital component. Fund has distributed $45M to date on " +
      "$100M called. Waterfall: return of capital first, then 8% preferred, " +
      "then 80/20 LP/GP split.",
    name: "Cornerstone RE Fund II — Distribution #4",
    reportType: "DISTRIBUTION_NOTICE",
    fundName: "Cornerstone Real Estate Value-Add Fund II, L.P.",
    fundType: "REAL_ESTATE",
    reportingQuarter: "Q1 2026",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    distributionAmount: 14200000,
    distributionType: "return_of_capital",
  },

  // ─────────────────────────────────────────────────
  // 4. K-1 Summary — Tax Year 2025
  // ─────────────────────────────────────────────────
  {
    id: "k1_summary_sample",
    label: "K-1 Summary — Tax Year 2025",
    description:
      "Schedule K-1 (Form 1065) summary for tax year 2025. " +
      "PE fund with 42 limited partners. " +
      "Filing deadline: March 15, 2026 (September 15 with extension). " +
      "Late filing penalty: $260 per partner per month (2026 rate). " +
      "42 partners x $260 = $10,920/month penalty exposure.",
    name: "Ridgeline Fund III — 2025 K-1 Package",
    reportType: "K1_SUMMARY",
    fundName: "Ridgeline Partners Fund III, L.P.",
    fundType: "PRIVATE_EQUITY",
    reportingQuarter: "Annual 2025",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    taxYear: 2025,
    filingDeadline: "2026-03-15", // Standard deadline (Sept 15 with extension)
  },

  // ─────────────────────────────────────────────────
  // 5. Annual Report — FY 2025
  // ─────────────────────────────────────────────────
  {
    id: "annual_report_sample",
    label: "Annual Report — PE Fund FY 2025",
    description:
      "Annual report for PE fund fiscal year 2025. " +
      "Fund: $250M (2022 vintage), year 3 of 10-year term. " +
      "6 portfolio companies. Audited financials (unqualified opinion). " +
      "ILPA-compliant. Includes full GP clawback calculation.",
    name: "Ridgeline Fund III — 2025 Annual Report",
    reportType: "ANNUAL_REPORT",
    fundName: "Ridgeline Partners Fund III, L.P.",
    fundType: "PRIVATE_EQUITY",
    reportingQuarter: "Annual 2025",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    nav: 285000000,
    totalContributions: 180000000,
    totalDistributions: 42000000,
    netIrr: 22.4,
    moic: 1.45,
  },

  // ─────────────────────────────────────────────────
  // 6. Form ADV Summary — 2026 Annual Update
  // ─────────────────────────────────────────────────
  {
    id: "form_adv_sample",
    label: "Form ADV Summary — 2026 Annual Amendment",
    description:
      "Form ADV Part 2A annual amendment for registered investment adviser. " +
      "AUM: $1.2B across 4 fund vehicles. 38 advisory clients. " +
      "SEC-registered (>$150M AUM threshold). " +
      "Annual amendment due within 90 days of fiscal year end. " +
      "Must offer to deliver updated brochure to all existing clients.",
    name: "Ridgeline Capital Management — Form ADV 2026",
    reportType: "FORM_ADV_SUMMARY",
    fundName: "Ridgeline Capital Management, LLC",
    fundType: "PRIVATE_EQUITY",
    reportingQuarter: "Annual 2025",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
  },
];

export default SAMPLE_COMPLIANCE_DEALS;
