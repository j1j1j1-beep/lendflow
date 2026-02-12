# Compliance Module — Regulatory Reference (2026)

LP reporting, fund administration, K-1 preparation, capital calls, distributions.
All statutes verified from sec.gov, irs.gov, ilpa.org as of February 2026.

---

## 1. ILPA Reporting Standards (2026)

Source: https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/

### Updated ILPA Reporting Template (v2.0, effective Q1 2026)
- Replaces 2016 template for funds still in investment period during Q1 2026
- For funds commencing operations on or after January 1, 2026
- GPs may continue 2016 template for funds no longer in investment period as of Q1 2026

### ILPA Performance Template (New, effective Q1 2026)
- New template developed through industry collaboration
- Used alongside Reporting Template for funds commencing on or after Jan 1, 2026

### Updated Capital Call & Distribution Template (Sep 2025)
- Aligns with updated Reporting Template and Performance Template
- First delivery not required until Q1 2027
- Provides standardized framework for capital call and distribution notice accounting details

### ILPA Quarterly Report Standard Contents
1. **Fund overview** — fund name, vintage year, strategy, size, investment period status
2. **Financial summary** — NAV, total contributions, total distributions, unfunded commitments
3. **Performance metrics** — Net IRR, Gross IRR, MOIC (TVPI), DPI, RVPI
4. **Portfolio company summary** — for each investment: company name, date invested, cost, fair value, % of fund NAV, IRR, MOIC, status (unrealized/partially realized/fully realized)
5. **Cash flow summary** — contributions and distributions for the period
6. **Fee and expense disclosure** — management fees, fund expenses, portfolio company fees, offsets
7. **GP commitment status** — GP commitment amount, contributed, percentage
8. **ESG reporting** (increasingly standard) — ESG policy, metrics, incidents

---

## 2. Capital Call Notices

### Required Content
1. **Call amount** — total and per-LP (pro rata based on commitment percentage)
2. **Purpose** — investment acquisition, follow-on, fund expenses, management fee
3. **Due date** — typically **10-15 business days** from notice
4. **Wire instructions** — bank, account, reference
5. **Unfunded commitment** — remaining commitment after this call
6. **Default provisions** — consequences of failure to fund

### Default Provisions (Standard LPA Terms)
- **Grace period**: 5-10 business days after due date
- **Default interest**: prime rate + 2-5% on late amount
- **Remedies** (escalating):
  1. Interest on late payment
  2. Forfeiture of a portion of LP's interest (typically 50% penalty on defaulted amount)
  3. Forced sale of LP's interest at discount (50-80% of NAV)
  4. Reduction of unfunded commitment to zero (LP loses future upside)
  5. Clawback of prior distributions to cover default
- LP Agreement specifies which remedies apply and in what order
- Non-defaulting LPs may have option to fund the defaulting LP's share

### Regulatory Requirements
- Capital calls must comply with LPA terms (no overcalling)
- Notice period must match LPA minimum (typically 10 business days)
- Pro rata allocation required unless LPA permits otherwise
- Must track recycling provisions (reinvested proceeds count against commitment)

---

## 3. Distribution Notices

### Required Content
1. **Distribution amount** — total and per-LP
2. **Distribution type**:
   - Return of capital (non-taxable reduction of basis)
   - Operating income (taxable as ordinary or passive income)
   - Capital gains (short-term or long-term)
   - Preferred return component
   - Profit/promote component
3. **Waterfall calculation** — show progression through waterfall tiers
4. **Withholding** — amounts withheld for taxes (if applicable)
5. **Post-distribution capital account** — updated balance

### Tax Withholding Requirements
| Scenario | Withholding Rate | Authority |
|----------|-----------------|-----------|
| Foreign LP (non-FIRPTA) | **30%** (or treaty rate) | 26 U.S.C. § 1446 |
| Foreign LP (FIRPTA — US real property) | **15%** of amount realized (or 35% of gain) | 26 U.S.C. § 1445/1446(f) |
| Backup withholding (missing TIN) | **24%** | 26 U.S.C. § 3406 |
| State withholding | Varies by state (CA: 7%, NY: 8.82%, etc.) | State tax codes |

---

## 4. Schedule K-1 (Form 1065) — Line Items

Source: https://www.irs.gov/pub/irs-pdf/f1065sk1.pdf (2025 form, applicable for TY 2025 filed in 2026)

### Part III — Partner's Share of Current Year Income, Deductions, Credits

| Box | Description | Tax Character |
|-----|------------|---------------|
| 1 | Ordinary business income (loss) | Ordinary |
| 2 | Net rental real estate income (loss) | Passive (unless REPS) |
| 3 | Other net rental income (loss) | Passive |
| 4a | Guaranteed payments for services | Ordinary / SE |
| 4b | Guaranteed payments for capital | Ordinary |
| 4c | Total guaranteed payments | Ordinary |
| 5 | Interest income | Portfolio |
| 6a | Ordinary dividends | Portfolio |
| 6b | Qualified dividends | Preferential rate |
| 7 | Royalties | Portfolio |
| 8 | Net short-term capital gain (loss) | Capital |
| 9a | Net long-term capital gain (loss) | Capital |
| 9b | Collectibles (28%) gain (loss) | Capital (28% rate) |
| 9c | Unrecaptured Section 1250 gain | Capital (25% rate) |
| 10 | Net Section 1231 gain (loss) | Ordinary or capital |
| 11 | Other income (loss) — multiple codes | Various |
| 12 | Section 179 deduction | Ordinary |
| 13 | Other deductions — multiple codes | Various |
| 14 | Self-employment earnings (loss) | SE tax |
| 15 | Credits — multiple codes | Various |
| 16 | Foreign transactions | Foreign tax credit |
| 17 | Alternative minimum tax (AMT) items | AMT adjustment |
| 18 | Tax-exempt income and nondeductible expenses | Various |
| 19 | Distributions | Non-taxable (reduce basis) |
| 20 | Other information — multiple codes | Various |
| 21 | Foreign taxes paid or accrued | FTC |

### Key Box 20 Codes (2025)
- Code A: Investment income
- Code B: Investment expenses
- Code N: Net investment income (Sec 1411)
- Code V: Unrelated business taxable income (UBTI)
- Code Z: Section 199A (QBI) information
- Code AH: Section 250 deduction (FDII/GILTI)
- Code AR: IRA partner UBTI notification
- Code AZ: Reimbursement of preformation expenditures (new 2025)

### K-1 Fields We Model in ComplianceProject
| Our Field | K-1 Box |
|-----------|---------|
| k1OrdinaryIncome | Box 1 |
| k1NetRentalIncome | Box 2 |
| k1GuaranteedPayments | Box 4c |
| k1InterestIncome | Box 5 |
| k1DividendIncome | Box 6a |
| k1ShortTermCapGain | Box 8 |
| k1LongTermCapGain | Box 9a |
| k1Section1231Gain | Box 10 |
| k1Section179Deduction | Box 12 |
| k1OtherDeductions | Box 13 |
| k1SelfEmploymentIncome | Box 14 |
| k1ForeignTaxPaid | Box 16/21 |
| k1AMTItems | Box 17 |
| k1TaxExemptIncome | Box 18 |
| k1Distributions | Box 19 |
| k1EndingCapitalAccount | Part II, Item L |
| k1UnrecapturedSec1250 | Box 9c |
| k1QBIDeduction | Box 20, Code Z |
| k1UBTI | Box 20, Code V |

### K-1 Filing Deadlines
- Partnership files Form 1065 by **March 15** (calendar year partnerships)
- K-1s must be furnished to partners by March 15
- Extension: Form 7004 → 6-month extension to **September 15**
- Late filing penalty: **$240/partner/month** (2025 rate), max 12 months

---

## 5. Fund Performance Metrics

### Net IRR
- Internal rate of return net of all fees and expenses
- Time-weighted, accounts for timing of cash flows
- Industry standard: calculated from inception using actual cash flow dates
- Since-inception IRR (SI-IRR) is the standard ILPA metric

### Gross IRR
- Before management fees and carried interest
- After fund-level expenses
- Shows investment performance vs manager skill (net shows LP experience)

### TVPI (Total Value to Paid-In)
- Formula: **(Distributions + NAV) / Total Contributions**
- Also called "investment multiple" or "MOIC" (Multiple on Invested Capital)
- >1.0x means fund has returned more than invested
- Benchmark: top quartile PE typically >2.0x

### DPI (Distributions to Paid-In)
- Formula: **Total Distributions / Total Contributions**
- Also called "realization ratio" or "cash-on-cash multiple"
- Shows how much cash has actually been returned
- Most important for mature funds (>year 5)

### RVPI (Residual Value to Paid-In)
- Formula: **NAV / Total Contributions**
- Shows unrealized value remaining
- TVPI = DPI + RVPI
- Decreases as fund realizes investments

---

## 6. Form ADV — Investment Adviser Disclosure

Source: https://www.sec.gov/about/forms/formadv-part2.pdf

### Who Must File
- SEC-registered investment advisers (AUM >$100M for most; >$150M for private fund advisers)
- State-registered advisers file with state regulators
- Exempt reporting advisers (ERAs) file abbreviated Form ADV

### Part 2A — Firm Brochure (18 Items)
Must be written in **plain English**:
1. Cover page
2. Material changes summary
3. Table of contents
4. Advisory business description
5. Fees and compensation
6. Performance-based fees
7. Types of clients
8. Methods of analysis, investment strategies, risk of loss
9. Disciplinary information
10. Other financial industry activities/affiliations
11. Code of ethics, participation in client transactions
12. Brokerage practices
13. Review of accounts
14. Client referrals and other compensation
15. Custody
16. Investment discretion
17. Voting client securities (proxy voting)
18. Financial information

### Delivery Requirements
- Deliver to prospective clients **before or at** time of entering advisory agreement
- Annual update: within **120 days** of fiscal year end
- Deliver updated brochure or summary of material changes to existing clients annually

### Private Fund Adviser Considerations
- Must disclose fund strategy, fees, conflicts, risk factors
- Form PF filing also required for large private fund advisers (AUM ≥ $150M in PE)
- SEC marketing rule (Rule 206(4)-1): governs advertising, testimonials, performance presentation

---

## 7. Valuation Standards

### ASC 820 (Fair Value Measurement)
- **Level 1**: Quoted prices in active markets (publicly traded securities)
- **Level 2**: Observable inputs other than Level 1 (comparable transactions, indices)
- **Level 3**: Unobservable inputs (models, assumptions — most PE/RE investments)

### Common Valuation Methodologies
| Method | Use Case | Key Inputs |
|--------|----------|-----------|
| Comparable company analysis | Public market approach | Revenue/EBITDA multiples from comparable public companies |
| Comparable transaction analysis | Market approach | Multiples from recent M&A transactions |
| Discounted cash flow (DCF) | Income approach | Projected cash flows, discount rate (WACC) |
| Net asset value | Cost/asset approach | Sum of individual asset fair values less liabilities |
| Cap rate approach | Real estate | NOI / cap rate from comparable property sales |

### IPEV Guidelines (International Private Equity and Venture Capital Valuation)
- Industry standard for PE/VC fund valuations
- Quarterly valuation required for most institutional investors
- Annual independent valuation recommended
- Fair value = price that would be received in orderly transaction between market participants

---

## 8. Annual Report Content

### Financial Statements (Audited)
- Balance sheet (statement of assets and liabilities)
- Statement of operations (income/expenses)
- Statement of changes in net assets (contributions, distributions, gains/losses)
- Statement of cash flows
- Schedule of investments (cost and fair value for each position)
- Notes to financial statements
- Auditor's opinion (unqualified, qualified, adverse, disclaimer)

### Required Disclosures
- Fee and expense detail
- Related party transactions
- Subsequent events
- Commitment and contingency disclosures
- Fair value measurement hierarchy (ASC 820 levels)

---

## 9. Key Statute Citations

| Regulation | Citation | URL |
|-----------|----------|-----|
| Form 1065 / K-1 | 26 U.S.C. § 701-777 | https://www.irs.gov/forms-pubs/about-form-1065 |
| K-1 instructions | IRS Pub | https://www.irs.gov/instructions/i1065sk1 |
| Form ADV | 17 CFR 275.203-1 | https://www.sec.gov/about/forms/formadv-part2.pdf |
| Marketing rule | 17 CFR 275.206(4)-1 | https://www.sec.gov/rules-regulations/2020/12/investment-adviser-marketing |
| Form PF | 17 CFR 279.9 | https://www.sec.gov/about/divisions-offices/division-investment-management/form-pf |
| FIRPTA withholding | 26 U.S.C. § 1445, 1446(f) | https://www.law.cornell.edu/uscode/text/26/1445 |
| Partnership withholding | 26 U.S.C. § 1446 | https://www.law.cornell.edu/uscode/text/26/1446 |
| Backup withholding | 26 U.S.C. § 3406 | https://www.law.cornell.edu/uscode/text/26/3406 |
| ASC 820 | FASB ASC 820 | https://asc.fasb.org/820 |
| ILPA Templates | ILPA.org | https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/ |
| ILPA Capital Call Template | ILPA.org | https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/ilpa-capital-call-distribution-template/ |
| Late filing penalty | 26 U.S.C. § 6698 | https://www.law.cornell.edu/uscode/text/26/6698 |
