/**
 * Sample Deals — Master Index
 *
 * 52 total sample deals across 5 modules:
 *   - Lending: 14 (one per loan program)
 *   - Capital: 12 (6 fund types × 2 exemption types)
 *   - Deals/M&A: 8 (one per transaction type)
 *   - Syndication: 12 (one per property type)
 *   - Compliance: 6 (one per report type)
 *
 * All data is legally accurate for 2026:
 *   - Interest rates based on Feb 2026 base rates (Prime 6.75%, SOFR 4.30%, Treasury 4.15%)
 *   - Regulatory thresholds current (HSR $119.5M, K-1 penalty $260/partner/month)
 *   - Securities exemptions per current Reg D rules
 *   - Tax structures per TCJA 2017 + subsequent amendments
 *   - All numbers internally consistent (LTV, DSCR, TVPI = DPI + RVPI, etc.)
 */

export {
  SAMPLE_LENDING_DEALS,
  type SampleLendingDeal,
} from "./lending";

export {
  SAMPLE_CAPITAL_DEALS,
  type SampleCapitalDeal,
} from "./capital";

export {
  SAMPLE_MA_DEALS,
  type SampleMADeal,
} from "./deals";

export {
  SAMPLE_SYNDICATION_DEALS,
  type SampleSyndicationDeal,
} from "./syndication";

export {
  SAMPLE_COMPLIANCE_DEALS,
  type SampleComplianceDeal,
} from "./compliance";

export {
  getLendingExtractions,
  getAllLendingExtractions,
  type LendingExtractionSet,
} from "./lending-extractions";
