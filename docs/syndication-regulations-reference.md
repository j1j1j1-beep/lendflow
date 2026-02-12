# Syndication Module — Regulatory Reference (2026)

All statutes, thresholds, and requirements verified from sec.gov, irs.gov, law.cornell.edu as of February 2026.

---

## 1. Securities Compliance for RE Syndications

Real estate syndications are securities offerings. The sponsor (GP/manager) sells limited partnership or LLC membership interests to passive investors. Must comply with SEC registration or find an exemption.

### Most Common Exemption: Regulation D Rule 506(b)
- No general solicitation (cannot advertise the deal publicly)
- Unlimited accredited investors + up to 35 sophisticated non-accredited investors
- Self-certification of accredited status acceptable
- **Most RE syndications use 506(b)** because sponsors raise from existing relationships

### Rule 506(c) — General Solicitation Permitted
- Can advertise (social media, webinars, podcasts, websites)
- ALL investors must be accredited — zero non-accredited
- Must take reasonable steps to **verify** accreditation (not just self-certify)
- Growing in popularity for sponsors with large online audiences

### Form D Filing
- File within **15 days** of first sale (first investor's subscription is accepted)
- File electronically via SEC EDGAR
- Annual amendment required if offering continues
- State blue sky notice filings also required (see Capital reference doc)

### Investment Company Act Considerations
- Most RE syndications use **Section 3(c)(5)(C)** exemption (primarily engaged in real estate)
- Alternatively: Section 3(c)(1) (≤100 investors) or 3(c)(7) (all qualified purchasers)
- Must maintain 55%+ qualifying real estate interests / 80%+ real estate-related assets for 3(c)(5)

---

## 2. Entity Structure

### Delaware LLC (Most Common)
- Sponsor forms SPV as Delaware LLC
- Governed by LLC Agreement (operating agreement)
- 6 Del.C. Chapter 18 (Delaware LLC Act)
- Maximum freedom of contract — parties can modify/eliminate fiduciary duties (except implied covenant of good faith)
- No annual report to state (but annual franchise tax of $300)
- Members have limited liability

### Delaware LP
- General Partner (GP) entity + Limited Partners (LPs)
- 6 Del.C. Chapter 17 (DRULPA)
- GP has unlimited liability unless GP is itself an LLC/corp
- LP has limited liability as long as LP does not participate in control
- Certificate of Limited Partnership filed with Delaware Secretary of State

### Typical Structure
```
Investors (LPs) ──→ [Deal LLC/LP] ──→ Property
                        ↑
                  Sponsor/GP Entity
                  (manages, takes fees + promote)
```

---

## 3. PPM Content for Syndications

### Required/Standard Sections
1. **Cover page** — deal name, offering amount, minimum investment, 506(b)/506(c) legend
2. **Executive summary** — property description, investment thesis, projected returns
3. **Risk factors** (extensive):
   - Real estate market risk (vacancy, rental rates, cap rate expansion)
   - Property-specific risk (deferred maintenance, environmental, zoning)
   - Leverage risk (debt service, refinance risk, interest rate changes)
   - Illiquidity (no secondary market for LP interests)
   - Concentration risk (single asset)
   - Sponsor risk (key person, limited track record)
   - Tax risk (changes in tax law, bonus depreciation phase-out, SALT limitations)
   - Regulatory risk (rent control, zoning changes, building codes)
   - Force majeure (natural disasters, pandemic)
   - Conflict of interest (sponsor's other deals, fees)
4. **Property description** — location, physical description, condition, improvements planned
5. **Market analysis** — submarket data, comparable properties, rental comps, vacancy rates
6. **Business plan** — value-add strategy, renovation scope, timeline, target rents
7. **Financial projections** — pro forma income/expenses, debt service, cash flow, disposition, IRR/equity multiple
8. **Sponsor information** — principals, track record (prior deals with realized returns), team, management structure
9. **Fee structure** — all fees disclosed (acquisition, asset mgmt, construction mgmt, property mgmt, disposition, refinancing, guarantee)
10. **Distribution waterfall** — preferred return, promote tiers, catch-up, clawback
11. **Tax considerations** — depreciation, bonus depreciation, passive activity rules, UBTI, 1031 exchange potential
12. **Subscription procedures** — minimum investment, process, closing conditions
13. **Operating agreement summary** — key terms, voting rights, transfer restrictions, reporting obligations

---

## 4. Waterfall Structures (Most Litigated Aspect)

### Standard Preferred Return + Promote Structure
| Tier | Distribution | LP Share | GP Share |
|------|-------------|----------|----------|
| 1. Return of capital | First dollars go to return investor capital | 100% | 0% |
| 2. Preferred return | Cash flow until LPs achieve X% IRR (typically 8%) | 100% | 0% |
| 3. Catch-up | GP receives all distributions until GP has received Y% of total profits | 0% | 100% |
| 4. Residual split | Remaining distributions split | 70% | 30% |

### Variations
- **No catch-up**: Skip tier 3, go straight to residual split
- **Multiple hurdle tiers**: e.g., 8% pref → 70/30 split → at 12% IRR → 60/40 split → at 18% IRR → 50/50 split
- **Lookback provision**: at disposition, recalculate as if IRR waterfall; GP returns excess promote
- **European vs American**: European = whole-fund (calculate on all invested capital); American = deal-by-deal
- Most single-asset RE syndications use **deal-level European waterfall** (return of all capital first, then promote)

---

## 5. Fee Structure (Market Standards 2024-2026)

| Fee | Typical Range | Basis | When Paid |
|-----|--------------|-------|-----------|
| Acquisition fee | **1-3%** | Of purchase price | At closing |
| Asset management fee | **1-2%** | Of effective gross income or equity invested | Monthly/quarterly |
| Property management fee | **4-8%** | Of gross rental income | Monthly |
| Construction management fee | **5-10%** | Of renovation budget | As incurred |
| Disposition fee | **1-2%** | Of sale price | At sale |
| Refinancing fee | **0.5-1%** | Of new loan amount | At refinance |
| Guarantee fee | **0.5-1%** | Of loan amount | At closing or annually |
| Loan placement fee | **0.5-1%** | Of loan amount | At closing |

---

## 6. Tax Considerations

### Depreciation
- Residential rental property: **27.5 years** straight-line
- Commercial property: **39 years** straight-line
- Cost segregation study can accelerate depreciation (reclassify components to 5, 7, or 15-year life)

### Bonus Depreciation (TCJA Phase-Down)
| Year | Bonus Depreciation % |
|------|---------------------|
| 2022 | 100% |
| 2023 | 80% |
| 2024 | 60% |
| 2025 | 40% |
| 2026 | **20%** |
| 2027+ | 0% |

**Note**: OBBBA (One Big Beautiful Bill Act) under consideration in 2025-2026 may restore 100% bonus depreciation retroactively. Build flexibility into system to handle either 20% or 100%.

### Passive Activity Rules (Section 469)
- RE syndication income/losses are generally **passive** for LPs
- Passive losses can only offset passive income (not W-2/active business income)
- **Exception — Real Estate Professional Status (REPS)**:
  - 750+ hours in real estate activities AND
  - More than 50% of personal services in real estate
  - If qualified, losses become non-passive (can offset any income)
- Material participation test: 7 tests under Reg 1.469-5T

### Qualified Opportunity Zones (Section 1400Z)
- Invest capital gains into QOZ Fund within 180 days of realization
- **Benefits** (if held 10+ years): exclusion of gain on QOZ investment
- Original deferral benefit (10% step-up at 5 years, 15% at 7 years) expired Dec 31, 2026
- Must be QOZ property — located in designated census tracts
- Substantial improvement requirement: must invest equal to adjusted basis within 30 months

### 1031 Exchange
- **NOT available to LP investors** — only available if investor owns real property directly
- Sponsor/GP may structure disposition as 1031 for the entity (but partnership interests don't qualify)
- Some syndications offer **tenant-in-common (TIC)** structures to enable individual 1031 exchanges

### UBTI (Unrelated Business Taxable Income)
- Tax-exempt investors (IRAs, 401(k)s, endowments) investing in leveraged real estate
- **Debt-financed income** from leveraged property generates UBTI
- UBTI tax rate: ordinary income rates for trusts (up to 37%)
- Threshold: UBTI > **$1,000** triggers filing requirement (Form 990-T)
- Many tax-exempt investors avoid heavily leveraged syndications for this reason

---

## 7. Property Types

| Type | Key Metrics | Typical Hold |
|------|-------------|-------------|
| Multifamily | Units, rent/unit, occupancy, rent growth | 3-7 years |
| Office | RSF, rent/RSF, occupancy, WALT | 5-10 years |
| Retail | GLA, rent/SF, occupancy, tenant mix | 5-10 years |
| NNN Retail | Single tenant, lease term, credit rating | 7-15 years |
| Industrial | SF, clear height, dock doors, rent/SF | 3-7 years |
| Self-storage | Units, SF, occupancy, rate/SF | 3-7 years |
| Mobile home park | Pads, lot rent, occupancy, cap rate | 5-10 years |
| Senior housing | Units/beds, occupancy, revenue/unit | 5-10 years |
| Student housing | Beds, rent/bed, occupancy, proximity to campus | 3-7 years |
| Hotel | Rooms, RevPAR, ADR, occupancy | 5-10 years |
| Build-to-rent | Homes, rent/home, lease-up timeline | 3-7 years |

---

## 8. Key Financial Metrics

| Metric | Formula | Typical Target |
|--------|---------|---------------|
| Cap Rate | NOI / Purchase Price | 4-8% (varies by market/type) |
| Cash-on-Cash | Annual Cash Flow / Equity Invested | 6-10% |
| IRR | Internal Rate of Return (time-weighted) | 15-25% |
| Equity Multiple | Total Distributions / Total Equity Invested | 1.5-2.5x |
| DSCR | NOI / Annual Debt Service | >1.25x (lender requirement) |
| LTV | Loan Amount / Property Value | 60-75% |
| Breakeven Occupancy | (Operating Expenses + Debt Service) / Gross Potential Income | <85% |

---

## 9. Key Statute Citations

| Regulation | Citation | URL |
|-----------|----------|-----|
| Regulation D | 17 CFR 230.500-508 | https://www.ecfr.gov/current/title-17/chapter-II/part-230 |
| Section 3(c)(5)(C) | 15 U.S.C. § 80a-3(c)(5)(C) | https://www.law.cornell.edu/uscode/text/15/80a-3 |
| Passive activity rules | 26 U.S.C. § 469 | https://www.law.cornell.edu/uscode/text/26/469 |
| REPS | Treas. Reg. 1.469-5T | https://www.law.cornell.edu/cfr/text/26/1.469-5T |
| QOZ | 26 U.S.C. § 1400Z-1, 1400Z-2 | https://www.law.cornell.edu/uscode/text/26/1400Z-2 |
| 1031 Exchange | 26 U.S.C. § 1031 | https://www.law.cornell.edu/uscode/text/26/1031 |
| Bonus depreciation | 26 U.S.C. § 168(k) | https://www.law.cornell.edu/uscode/text/26/168 |
| UBTI | 26 U.S.C. § 511-514 | https://www.law.cornell.edu/uscode/text/26/512 |
| Cost segregation | Rev. Proc. 87-56 (asset classes) | https://www.irs.gov/pub/irs-pdf/p946.pdf |
| Delaware LLC Act | 6 Del.C. Chapter 18 | https://delcode.delaware.gov/title6/c018/index.html |
| Delaware RULPA | 6 Del.C. Chapter 17 | https://delcode.delaware.gov/title6/c017/index.html |
