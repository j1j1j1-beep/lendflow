/**
 * Source Document OCR Text — Capital Module (12 deals × 3 required docs = 36 docs)
 *
 * OPTIMIZED FOR AI OUTPUT QUALITY:
 * These source docs feed directly into Grok prompts that generate PPMs,
 * Operating Agreements, and Subscription Agreements. Every detail here
 * gives the AI more material to produce professional legal documents.
 *
 * Key optimization principles:
 * - Specific numbers everywhere (not ranges)
 * - Prior fund track records with realized exits and multiples
 * - Regulatory references (IRC, ERISA, ICA) the AI can cite
 * - Industry-specific risk factors and market data
 * - Dense signal in every line (8000 char limit per doc)
 */

import { SAMPLE_CAPITAL_DEALS, type SampleCapitalDeal } from "../capital";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// ─────────────────────────────────────────────────────────────────
// FUND BUSINESS PLAN — optimized for PPM generation
// The AI uses this to write: investment strategy, risk factors,
// use of proceeds, tax considerations, ERISA analysis
// ─────────────────────────────────────────────────────────────────

function generateFundBusinessPlan(deal: SampleCapitalDeal): string {
  const isOpenEnded = deal.fundTermYears === 0;
  const termText = isOpenEnded ? "Open-ended (evergreen)" : `${deal.fundTermYears} years from final close, with two 1-year extensions at GP discretion`;
  const investmentPeriod = isOpenEnded ? "Ongoing" : `${Math.min(deal.fundTermYears, 5)} years from final close`;
  const track = getPriorTrackRecord(deal);
  const pipeline = getDealPipeline(deal);
  const risks = getKeyRisks(deal);

  return `CONFIDENTIAL BUSINESS PLAN
${deal.fundName}
Prepared by ${deal.gpEntityName}
January 2026

EXECUTIVE SUMMARY

${deal.gpEntityName} ("GP") seeks capital commitments of $${fmt(deal.targetRaise)} for ${deal.fundName} (the "Fund"). ${deal.investmentStrategy}

KEY TERMS
Target Size: $${fmt(deal.targetRaise)} | Hard Cap: $${fmt(Math.round(deal.targetRaise * 1.2))}
Minimum Commitment: $${fmt(deal.minInvestment)}
Management Fee: ${deal.managementFee}% on committed capital (investment period)${!isOpenEnded ? `; ${(deal.managementFee - 0.25).toFixed(2)}% on invested capital (harvest period)` : ""}
Carried Interest: ${deal.carriedInterest}%${deal.preferredReturn > 0 ? ` over ${deal.preferredReturn}% preferred return (compounded annually)` : " subject to high-water mark"}
GP Commitment: ${deal.fundType === "HEDGE_FUND" ? "5" : deal.fundType === "VENTURE_CAPITAL" ? "3" : "2"}% of total commitments ($${fmt(Math.round(deal.targetRaise * (deal.fundType === "HEDGE_FUND" ? 0.05 : deal.fundType === "VENTURE_CAPITAL" ? 0.03 : 0.02)))})
Fund Term: ${termText}
Investment Period: ${investmentPeriod}
Clawback: ${deal.preferredReturn > 0 ? "GP clawback to ensure LP preferred return on aggregate basis, secured by GP guarantee" : "N/A (open-ended)"}
Key Person: ${getKeyPersonProvision(deal)}

DISTRIBUTION WATERFALL
${getWaterfallDetail(deal)}

PRIOR FUND TRACK RECORD

${track}

INVESTMENT PIPELINE & DEAL FLOW

The GP currently evaluates ${pipeline.dealFlowPerYear}+ opportunities annually, converting approximately ${pipeline.conversionRate}% to completed transactions. Current pipeline includes:

${pipeline.targets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

MARKET ENVIRONMENT (Q1 2026)

Fed Funds: 4.25-4.50% | 10Y Treasury: 4.15% | SOFR: 4.30%
${getMarketContext(deal)}

KEY RISK FACTORS

${risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}

TAX & REGULATORY STRUCTURE

Entity: ${deal.fundName.includes("LLC") ? "Delaware LLC (partnership taxation under IRC Subchapter K)" : "Delaware LP (partnership taxation under IRC Subchapter K)"}
Tax Year: Calendar year | Fiscal Year End: December 31
Carried Interest: Subject to IRC Section 1061 three-year holding period requirement (TCJA 2017). Gains on assets held less than 3 years treated as short-term capital gain to GP.
${deal.preferredReturn > 0 ? `Preferred Return: ${deal.preferredReturn}% per annum. LP allocations under IRC Section 704(b) substantial economic effect safe harbor.` : "Incentive Allocation: Subject to high-water mark crystallization."}
ERISA: ${getERISAProvision(deal)}
ICA Exemption: ${getICAExemption(deal)}
Form D Filing: Within 15 calendar days of first sale of securities per Rule 503 of Regulation D.
FinCEN BOI: Domestic entities exempt from beneficial ownership reporting (March 2025 interim rule).
Anti-Money Laundering: Fund administrator performs KYC/AML checks on all investors per Bank Secrecy Act.

CONFIDENTIAL — FOR AUTHORIZED RECIPIENTS ONLY`;
}

function getWaterfallDetail(deal: SampleCapitalDeal): string {
  if (deal.preferredReturn > 0) {
    return `European-style (whole fund) waterfall:
(i) Return of Contributed Capital — 100% to LPs until cumulative distributions equal cumulative contributions
(ii) Preferred Return — 100% to LPs until ${deal.preferredReturn}% per annum compounded return achieved
(iii) GP Catch-Up — ${deal.carriedInterest > 20 ? "100" : "80"}% to GP until GP has received ${deal.carriedInterest}% of cumulative profits
(iv) Residual Split — ${100 - deal.carriedInterest}% to LPs / ${deal.carriedInterest}% to GP`;
  }
  return `American-style with high-water mark:
(i) Management Fee: ${deal.managementFee}% per annum on NAV
(ii) Incentive Allocation: ${deal.carriedInterest}% of net new profits above prior high-water mark, crystallized annually
(iii) Redemptions: Pro rata distribution at NAV as of redemption date`;
}

function getPriorTrackRecord(deal: SampleCapitalDeal): string {
  const tracks: Record<string, string> = {
    PRIVATE_EQUITY: `Fund I (2018 vintage, $120M committed): Fully realized. 6 investments, 4 full exits, 2 partial realizations.
  Gross IRR: 32.1% | Net IRR: 24.8% | Gross MOIC: 2.7x | Net MOIC: 2.3x | DPI: 2.3x
  Notable exits: TechServ Solutions (acquired by Accenture, 4.1x MOIC), MedPoint Analytics (IPO, 3.8x MOIC)

Fund II (2021 vintage, $180M committed): In harvest period. 8 investments, 3 realized, 5 unrealized.
  Gross IRR: 28.5% | Net IRR: 21.2% | Gross MOIC: 1.9x (incl. unrealized) | DPI: 0.8x | RVPI: 1.1x
  Top performer: DataBridge Systems (3.2x MOIC realized via strategic sale to Oracle)

Aggregate track record across all prior funds: $300M invested, $685M total value, 2.28x gross MOIC, 0.3% loss ratio`,

    VENTURE_CAPITAL: `Fund I (2015 vintage, $30M): Fully realized. 22 investments.
  Gross TVPI: 4.8x | Net TVPI: 3.6x | Net IRR: 35.2% | DPI: 3.6x
  2 IPOs (combined $1.8B market cap at listing), 8 acquisitions, 5 write-offs (22% loss ratio, typical for seed)

Fund II (2018 vintage, $50M): Largely realized. 25 investments.
  Gross TVPI: 3.2x | Net TVPI: 2.5x | Net IRR: 28.7% | DPI: 1.8x | RVPI: 0.7x
  Notable: CloudMesh (Series A to $2.1B acquisition by Salesforce, 12x MOIC)

Fund III (2021 vintage, $75M): In deployment. 18 investments to date.
  Gross TVPI: 1.6x | Net TVPI: 1.3x | Net IRR: 22.1% (early, J-curve effect)
  3 markups above 3x cost basis. No realized exits yet.`,

    REAL_ESTATE: `Fund I (2016 vintage, $80M equity): Fully realized. 8 properties, 1,842 units.
  Net IRR: 21.3% | Net Equity Multiple: 2.1x | Avg Hold: 3.8 years
  100% of properties sold above underwriting. Average rent increase of 28% post-renovation.

Prior to fund formation, principals acquired and managed $2.4B in real estate assets (2004-2015), achieving average unlevered returns of 12.8% across 42 properties in 14 markets.`,

    HEDGE_FUND: `Live track record since inception (${deal.fundTermYears === 0 ? "January 2017" : "2017"}):
  Annualized Net Return: 14.2% | Sharpe Ratio: 1.42 | Sortino Ratio: 2.1
  Max Drawdown: -8.3% (Q1 2020) | Recovery Period: 4 months
  Positive months: 68% | Best month: +6.8% (Nov 2020) | Worst month: -4.2% (Mar 2020)
  Correlation to S&P 500: 0.35 | Beta: 0.28 | Alpha: 9.8% annualized

All returns audited by Ernst & Young LLP. Performance calculated net of all fees and expenses.`,

    CREDIT: `Fund I (2017 vintage, $200M): Fully deployed and harvesting.
  Net IRR: 11.8% | Net MOIC: 1.42x | Current Yield: 10.2% | Default Rate: 0.8%
  42 portfolio companies. 38 performing, 2 fully repaid, 2 in workout (expected 75c recovery).
  Weighted average spread: SOFR + 625 bps. Average loan-to-value: 1.6x at origination.

Total origination since inception: $3.2B across 85 transactions. Cumulative loss rate: 0.4%.`,

    INFRASTRUCTURE: `Prior investments by GP principals (2010-2024):
  18 infrastructure assets totaling $4.2B in enterprise value
  Average unlevered IRR: 12.4% | Average cash yield: 7.8%
  Notable: 450 MW solar portfolio (sold to Brookfield at 1.8x equity multiple)
  350 MW wind farm portfolio (sold to NextEra, 14.2% net IRR over 7-year hold)
  2,200 route-mile fiber optic network (sold to Digital Realty, 2.1x equity multiple)

Combined team has developed/acquired 2.8 GW of generation capacity and $6B+ of digital infrastructure.`,
  };
  return tracks[deal.fundType] || tracks.PRIVATE_EQUITY;
}

type Pipeline = { dealFlowPerYear: number; conversionRate: number; targets: string[] };

function getDealPipeline(deal: SampleCapitalDeal): Pipeline {
  const pipelines: Record<string, Pipeline> = {
    PRIVATE_EQUITY: {
      dealFlowPerYear: 350,
      conversionRate: 2,
      targets: [
        "Healthcare IT platform ($40-60M EV) — exclusive bilateral negotiation, LOI expected Q2 2026",
        "Industrial distribution roll-up ($25-35M EV per add-on) — 3 targets identified in Southeast",
        "Business services company ($50M EV) — proprietary through operating partner relationship",
      ],
    },
    VENTURE_CAPITAL: {
      dealFlowPerYear: 2500,
      conversionRate: 1,
      targets: [
        "AI-native developer tools company (Series A, $8M round) — term sheet under negotiation",
        "Enterprise compliance SaaS (Seed, $3M round) — deep diligence, ex-Palantir founding team",
        "Vertical fintech for construction (Series A, $12M round) — co-lead with Sequoia",
      ],
    },
    REAL_ESTATE: {
      dealFlowPerYear: 200,
      conversionRate: 5,
      targets: [
        "240-unit garden apartments, Raleigh NC ($38M) — PSA executed, 60-day diligence period",
        "180-unit value-add, Tampa FL ($28M) — broker relationship, off-market, LOI submitted",
        "320-unit Class B, Phoenix AZ ($52M) — marketed deal, top 3 bidder shortlist",
      ],
    },
    HEDGE_FUND: {
      dealFlowPerYear: 500,
      conversionRate: 15,
      targets: [
        "Long thesis: 3 industrial companies trading below 8x EV/EBITDA with margin expansion catalysts",
        "Short thesis: 2 SaaS companies with decelerating growth and insider selling",
        "Event-driven: 4 pending M&A situations with 8-15% spread to deal price",
      ],
    },
    CREDIT: {
      dealFlowPerYear: 180,
      conversionRate: 20,
      targets: [
        "Senior secured term loan ($35M) to PE-backed healthcare services company, SOFR + 600 bps",
        "Unitranche facility ($50M) for industrial manufacturer, SOFR + 575 bps, 1.5x coverage",
        "First lien revolver + term loan ($40M) for business services platform, sponsor-backed",
      ],
    },
    INFRASTRUCTURE: {
      dealFlowPerYear: 80,
      conversionRate: 10,
      targets: [
        "200 MW utility-scale solar portfolio, Texas ERCOT — 20-year PPA with investment-grade offtaker",
        "Tier III data center campus (40 MW), Virginia — 85% pre-leased to hyperscaler",
        "1,500 route-mile fiber network, Southeast US — 12-year IRU contracts with 3 carriers",
      ],
    },
  };
  return pipelines[deal.fundType] || pipelines.PRIVATE_EQUITY;
}

function getKeyRisks(deal: SampleCapitalDeal): string[] {
  const common = [
    "Loss of Capital: Investors may lose all or a substantial portion of their investment. There is no guarantee of return of capital.",
    "Illiquidity: Fund interests are not registered under the Securities Act of 1933 and may not be transferred without GP consent. No public market exists or is expected to develop.",
    `Key Person Risk: The Fund depends on ${deal.fundType === "HEDGE_FUND" ? "the CIO's" : "the Managing Partner's"} continued involvement. Departure triggers key person suspension of investment activity.`,
    "Leverage Risk: The Fund may employ leverage which magnifies both gains and losses. Lender margin calls may force liquidation at unfavorable prices.",
    "Tax Risk: Changes in tax law, including potential modification of IRC Section 1061 carried interest provisions or partnership audit rules under the Bipartisan Budget Act of 2015, could materially affect returns.",
    "Regulatory Risk: SEC, CFTC, or state regulatory changes could impose additional compliance costs or restrict investment activities.",
    "Conflicts of Interest: GP manages multiple funds and accounts. Allocation of investment opportunities among funds is governed by the allocation policy but creates inherent conflicts.",
    "Valuation Risk: Unrealized investments are valued at fair value as determined by GP in accordance with ASC 820. Valuations may not reflect realizable values.",
  ];

  const specific: Record<string, string[]> = {
    PRIVATE_EQUITY: [
      "Concentration Risk: The Fund expects to hold 3-5 platform investments. Poor performance of a single investment may significantly impact overall fund returns.",
      "Acquisition Integration: Add-on acquisitions involve integration risk, potential cultural conflicts, and may not achieve projected synergies.",
    ],
    VENTURE_CAPITAL: [
      "Early-Stage Risk: Seed and Series A companies have limited operating history, unproven business models, and high failure rates. Industry data shows 60-70% of venture-backed startups fail to return capital.",
      "Follow-On Risk: Portfolio companies may require additional capital. Failure to participate in follow-on rounds may result in dilution or loss of board representation.",
    ],
    REAL_ESTATE: [
      "Market Risk: Real estate values are cyclical and affected by interest rates, employment, population growth, and local supply/demand dynamics. The Sun Belt markets targeted have experienced significant new supply in 2024-2025.",
      "Construction/Renovation Risk: Value-add renovations may exceed budget, encounter unforeseen conditions, or fail to achieve target rent premiums. Permitting delays are common.",
    ],
    HEDGE_FUND: [
      "Short Selling Risk: Short positions have theoretically unlimited loss potential. Short squeezes and forced covering may result in significant losses.",
      "Counterparty Risk: OTC derivatives, prime brokerage relationships, and repo facilities expose the Fund to counterparty credit risk.",
    ],
    CREDIT: [
      "Credit Risk: Borrower defaults may result in loss of principal and accrued interest. Recovery rates on defaulted loans historically range from 40-80% depending on collateral and seniority.",
      "Interest Rate Risk: Rising rates may reduce the value of fixed-rate positions. SOFR-based floating rate loans provide partial hedge but expose borrowers to payment stress.",
    ],
    INFRASTRUCTURE: [
      "Construction & Development Risk: Greenfield projects face permitting, interconnection, and construction cost overruns. Supply chain delays for equipment (transformers, turbines) may extend timelines.",
      "Regulatory & Policy Risk: Changes in ITC/PTC tax credit eligibility, interconnection queue reform, or renewable portfolio standards could affect project economics. OBBBA 2025 provisions may be modified.",
    ],
  };

  return [...common, ...(specific[deal.fundType] || specific.PRIVATE_EQUITY)];
}

function getKeyPersonProvision(deal: SampleCapitalDeal): string {
  if (deal.fundType === "HEDGE_FUND") return "CIO must dedicate substantially all professional time. Departure suspends new investment activity pending LP vote.";
  return "Managing Partner and one additional Key Person must dedicate substantially all professional time. Loss of both triggers suspension of investment period. LPAC may vote to reinstate or terminate.";
}

function getERISAProvision(deal: SampleCapitalDeal): string {
  const provisions: Record<string, string> = {
    PRIVATE_EQUITY: "VCOC exemption (29 CFR 2510.3-101(d)). Fund will obtain contractual management rights in portfolio companies. Benefit plan investors limited to <25% of any class.",
    VENTURE_CAPITAL: "VCOC exemption. Board seats and contractual management rights secured on all investments. Benefit plan investor test monitored quarterly.",
    REAL_ESTATE: "REOC exemption (29 CFR 2510.3-101(e)). At least 50% of assets will be real estate. Benefit plan investors limited to <25%.",
    HEDGE_FUND: "Significant participation test. Benefit plan investors limited to <25% of each class of equity interests under the plan asset regulation.",
    CREDIT: "No VCOC/REOC exemption available. Compliance via 25% benefit plan investor limitation. GP monitors at each closing and capital call.",
    INFRASTRUCTURE: "REOC exemption for real asset infrastructure. VCOC exemption for operational assets with management rights. <25% benefit plan investor test.",
  };
  return provisions[deal.fundType] || provisions.PRIVATE_EQUITY;
}

function getICAExemption(deal: SampleCapitalDeal): string {
  if (deal.exemptionType === "REG_D_506C" && deal.minInvestment >= 5_000_000) {
    return "Section 3(c)(7) — qualified purchaser exemption. No limit on number of investors. All investors must be \"qualified purchasers\" ($5M+ in investments).";
  }
  return "Section 3(c)(1) — limited to 100 beneficial owners. Investors need not be qualified purchasers.";
}

function getMarketContext(deal: SampleCapitalDeal): string {
  const contexts: Record<string, string> = {
    PRIVATE_EQUITY: "US M&A volume: $1.8T (2025), down from $2.1T peak but recovering. Middle-market EV/EBITDA multiples: 8-12x (down from 12-15x in 2021). Sponsor dry powder: $1.2T globally. Favorable for buyers with committed capital and operational expertise.",
    VENTURE_CAPITAL: "Global VC funding: $285B (2025). AI/ML sector represents 35% of all Series A+ deals. Median pre-money valuations: Seed $12M, Series A $45M, Series B $150M. Down rounds decreased 40% from 2023 peak. IPO window reopening with 180+ tech IPOs expected in 2026.",
    REAL_ESTATE: "Multifamily cap rates: 5.0-6.5% (Sun Belt). New construction starts declining 25% from 2024 peak, reducing supply pressure. Rent growth moderating to 3-4% annually. Wage growth outpacing rent growth in target markets. Favorable entry point for value-add strategies.",
    HEDGE_FUND: "Equity markets: S&P 500 at 5,400 (Jan 2026). VIX averaging 18. Dispersion elevated — top quartile vs bottom quartile sector spread at 35%. Credit spreads: IG 120 bps, HY 380 bps. Strong environment for fundamental stock selection.",
    CREDIT: "Middle-market direct lending yields: SOFR + 500-700 bps (10-14% all-in). Bank pullback from leveraged lending continues post-Basel III endgame. $500B+ in 2024-2026 private credit maturities creating refinancing demand. Default rates: 2.1% (Moody's trailing 12-month).",
    INFRASTRUCTURE: "IRA + OBBBA: $500B+ in clean energy incentives through 2035. Interconnection queue: 2,600 GW nationally (95% renewable/storage). Data center demand: 35 GW by 2030 (up from 17 GW in 2023). Tax credit transferability (IRA Section 6418) creating new monetization paths.",
  };
  return contexts[deal.fundType] || contexts.PRIVATE_EQUITY;
}

// ─────────────────────────────────────────────────────────────────
// FORMATION DOCUMENTS — Certificate of LP/LLC + Good Standing + EIN
// ─────────────────────────────────────────────────────────────────

function generateFormationDocs(deal: SampleCapitalDeal): string {
  const isLLC = deal.fundName.includes("LLC");
  const entityType = isLLC ? "Limited Liability Company" : "Limited Partnership";
  const formationType = isLLC ? "CERTIFICATE OF FORMATION" : "CERTIFICATE OF LIMITED PARTNERSHIP";
  const gpOrManager = isLLC ? "Manager" : "General Partner";
  const fileNum = 7000000 + hashCode(deal.id) % 999999;
  const ein1 = 20 + hashCode(deal.fundName) % 70;
  const ein2 = 1000000 + hashCode(deal.gpEntityName) % 8999999;

  return `STATE OF DELAWARE
SECRETARY OF STATE
DIVISION OF CORPORATIONS

${formationType}
OF
${deal.fundName.toUpperCase()}

Filed: November 15, 2025
File Number: ${fileNum}

FIRST: The name of the ${entityType} is ${deal.fundName}.

SECOND: The address of the registered office in the State of Delaware is Corporation Trust Center, 1209 Orange Street, Wilmington, New Castle County, Delaware 19801. The registered agent at such address is The Corporation Trust Company.

THIRD: The name and address of the ${gpOrManager} is:
${deal.gpEntityName}
345 Park Avenue, Suite 3200
New York, NY 10154

${isLLC ? `FOURTH: The ${entityType} is manager-managed. The name of the initial manager is ${deal.gpEntityName}.

FIFTH: The purpose of the ${entityType} is to engage in any lawful act or activity for which limited liability companies may be formed under the Delaware Limited Liability Company Act (6 Del. C. Chapter 18).

SIXTH: The ${entityType} shall have perpetual existence unless dissolved in accordance with its operating agreement.` : `FOURTH: The ${entityType} shall dissolve no later than ${deal.fundTermYears > 0 ? `December 31, ${2025 + deal.fundTermYears + 2}` : "upon the occurrence of events specified in the Limited Partnership Agreement"}, subject to extension pursuant to the Partnership Agreement.

FIFTH: The purpose of the ${entityType} is to engage in any lawful act or activity for which limited partnerships may be formed under the Delaware Revised Uniform Limited Partnership Act (6 Del. C. Chapter 17).`}

IN WITNESS WHEREOF, the undersigned authorized person has executed this ${formationType.toLowerCase()} as of November 15, 2025.

${deal.gpEntityName}, ${gpOrManager}
By: ________________________
Name: Managing Director
Title: Authorized Signatory

---

INTERNAL REVENUE SERVICE
EMPLOYER IDENTIFICATION NUMBER ASSIGNMENT

Date of Assignment: November 20, 2025
Legal Name: ${deal.fundName}
EIN: ${ein1}-${ein2}
Entity Type: ${isLLC ? "Partnership (LLC electing partnership treatment under IRC Section 301.7701-3)" : "Partnership (limited partnership)"}
Tax Year End: December 31
Accounting Method: Accrual
Filing Requirement: Form 1065 (U.S. Return of Partnership Income)
Effective Date: November 15, 2025

---

STATE OF DELAWARE — CERTIFICATE OF GOOD STANDING

The Secretary of State of the State of Delaware hereby certifies that ${deal.fundName}, filed on November 15, 2025, is in good standing and has a legal existence so far as the records of this office show.

Issued: January 8, 2026
Authentication: ${fileNum}-GS-2026

---

GP ENTITY FORMATION

${deal.gpEntityName}
Type: Delaware Limited Liability Company
Filed: September 10, 2025
EIN: ${ein1 + 1}-${ein2 + 100}
Status: Good Standing
Registered Agent: The Corporation Trust Company
SEC Registration: ${deal.fundType === "HEDGE_FUND" ? "Exempt Reporting Adviser (ERA) — Form ADV filed" : deal.targetRaise >= 150_000_000 ? "Registered Investment Adviser — Form ADV Part 1A and 2A filed" : "Exempt Reporting Adviser (ERA) — reliance on Private Fund Adviser exemption"}
State Registrations: ${deal.geographicFocus.includes("United States") ? "Blue sky filings in all 50 states and DC (via NASAA EFD)" : "Blue sky filings in applicable US states"}`;
}

// ─────────────────────────────────────────────────────────────────
// MANAGEMENT BIOS — optimized for PPM "Sponsor Information" section
// Dense with specific exits, AUM, track record numbers
// ─────────────────────────────────────────────────────────────────

function generateManagementBios(deal: SampleCapitalDeal): string {
  const team = getManagementTeam(deal);

  let text = `MANAGEMENT TEAM BIOGRAPHIES
${deal.gpEntityName}
January 2026

KEY INVESTMENT PROFESSIONALS\n\n`;

  for (const member of team) {
    text += `${"=".repeat(60)}
${member.name.toUpperCase()}
${member.title}
${"=".repeat(60)}

${member.bio}

TRACK RECORD HIGHLIGHTS:
${member.trackRecord}

Education: ${member.education}
${member.certifications ? `Professional Designations: ${member.certifications}` : ""}
Board/Committee Service: ${member.boards}

`;
  }

  const totalYears = team.reduce((sum, m) => sum + m.years, 0);
  text += `${"=".repeat(60)}
TEAM SUMMARY
${"=".repeat(60)}

Combined Investment Experience: ${totalYears}+ years
Total Capital Deployed (team career): ${deal.targetRaise >= 500_000_000 ? "$18B+" : deal.targetRaise >= 200_000_000 ? "$9B+" : "$4B+"}
Total Transactions (team career): ${deal.fundType === "VENTURE_CAPITAL" ? "150+" : deal.fundType === "HEDGE_FUND" ? "N/A (continuous)" : "85+"}
Prior Institutional Employers: ${[...new Set(team.flatMap(m => m.priorFirms))].join(", ")}

OPERATIONS & SUPPORT TEAM
- Chief Financial Officer (15+ years fund accounting experience)
- General Counsel (JD, former associate at Simpson Thacher & Bartlett LLP)
- Head of Investor Relations (12+ years, former IR at Blackstone)
- ${deal.fundType === "REAL_ESTATE" ? "Head of Construction Management (PE, 20+ years)" : deal.fundType === "INFRASTRUCTURE" ? "Head of Engineering (PhD, PE, 18+ years)" : "VP of Portfolio Operations (MBA, ex-McKinsey)"}
- Fund Controller, 2 Senior Accountants, Compliance Officer

SERVICE PROVIDERS
- Legal Counsel: Kirkland & Ellis LLP (fund formation); Ropes & Gray LLP (regulatory)
- Auditor: Ernst & Young LLP
- Fund Administrator: Citco Fund Services
- Tax Advisor: PricewaterhouseCoopers LLP
- Custodian/Prime Broker: ${deal.fundType === "HEDGE_FUND" ? "Goldman Sachs Prime Brokerage" : "N/A"}

CONFIDENTIAL — FOR AUTHORIZED RECIPIENTS ONLY`;

  return text;
}

type TeamMember = {
  name: string;
  title: string;
  bio: string;
  trackRecord: string;
  education: string;
  certifications?: string;
  boards: string;
  years: number;
  priorFirms: string[];
};

function getManagementTeam(deal: SampleCapitalDeal): TeamMember[] {
  const teams: Record<string, TeamMember[]> = {
    PRIVATE_EQUITY: [
      {
        name: "James R. Whitfield",
        title: "Managing Partner & Chief Investment Officer",
        bio: `Mr. Whitfield founded ${deal.gpEntityName} in 2012 after 14 years in private equity. He served as Partner at Silver Lake Partners (2006-2012) where he led 6 control investments totaling $3.2B in enterprise value, and as Vice President at Bain Capital (2002-2006) where he executed leveraged buyouts in healthcare and industrial sectors. Mr. Whitfield has served on 18 portfolio company boards during his career and currently sits on 3 boards.`,
        trackRecord: "- Led TechServ Solutions acquisition ($45M EV, 2019) → sold to Accenture for $185M (4.1x MOIC, 38% IRR)\n- Led MedPoint Analytics ($28M EV, 2018) → IPO at $520M market cap (3.8x MOIC, 42% IRR)\n- Led DataBridge Systems ($62M EV, 2021) → sold to Oracle for $198M (3.2x MOIC, 45% IRR)\n- Career aggregate: 22 investments, $4.5B EV, 2.6x average gross MOIC",
        education: "MBA, Harvard Business School (Baker Scholar); BA Economics, Duke University (summa cum laude)",
        certifications: "CFA Charterholder",
        boards: "ILPA Board of Directors; Duke University Investment Committee; Whitfield Family Foundation",
        years: 24,
        priorFirms: ["Silver Lake Partners", "Bain Capital"],
      },
      {
        name: "Sarah M. Chen",
        title: "Partner & Head of Investments",
        bio: `Ms. Chen leads deal sourcing, execution, and portfolio monitoring. She joined from KKR (2007-2015) where she was a Director in the Americas Private Equity group focused on technology and healthcare services. Prior to KKR, she spent 3 years in Goldman Sachs M&A (2004-2007). At KKR, Ms. Chen was directly involved in transactions totaling $8B in aggregate enterprise value including the $4.7B take-private of BMC Software.`,
        trackRecord: "- Led Apex Medical Group acquisition ($52M EV, 2020) → current fair value 2.4x cost (unrealized)\n- Co-led Vertex Industrial ($35M EV, 2019) → sold for $112M (3.2x MOIC, 31% IRR)\n- At KKR: Key deal team member on 12 transactions totaling $8B aggregate EV\n- Career aggregate: 35+ transactions, $14B cumulative EV",
        education: "MBA, Wharton School (Palmer Scholar); BS Finance, Georgetown University (magna cum laude)",
        boards: "100 Women in Finance; Georgetown Advisory Board for McDonough School of Business",
        years: 20,
        priorFirms: ["KKR", "Goldman Sachs"],
      },
      {
        name: "Michael D. Torres",
        title: "Partner & Chief Operating Officer",
        bio: `Mr. Torres oversees fund operations, portfolio company value creation, and LP reporting. He has 18 years of private equity experience, including 7 years at Advent International (2008-2015) where he led the North American operations group. Mr. Torres developed the firm's proprietary 100-Day Value Creation Plan which has been deployed at all portfolio companies, driving average EBITDA growth of 35% within 18 months of acquisition.`,
        trackRecord: "- Operational oversight of 14 portfolio companies across 2 fund vehicles\n- Average EBITDA improvement: 35% in first 18 months post-acquisition\n- Led 3 add-on integrations with 100% achievement of projected synergies\n- Built firm's ESG monitoring framework (SASB-aligned)",
        education: "MBA, Columbia Business School; BS Industrial Engineering, Georgia Tech (valedictorian)",
        boards: "Operating Partners Forum (founding member); Georgia Tech Advisory Board",
        years: 18,
        priorFirms: ["Advent International"],
      },
    ],
    VENTURE_CAPITAL: [
      {
        name: "David A. Park",
        title: "General Partner & Co-Founder",
        bio: `Mr. Park co-founded ${deal.gpEntityName} in 2014 with 10 years of experience in venture capital and technology. He served as Principal at Andreessen Horowitz (2010-2014, 8 investments, 2 unicorn outcomes) and as Product Manager at Google (2006-2010, led Gmail monetization). Mr. Park focuses on enterprise SaaS, infrastructure, and applied AI investments. He has led 42 investments with 8 exits exceeding $100M including 3 IPOs and 5 strategic acquisitions.`,
        trackRecord: "- CloudMesh (Series A, $4M check → $2.1B acquisition by Salesforce, 12x MOIC)\n- NeuralPath AI (Seed, $2M → IPO at $3.8B market cap, fund returned $95M, 47x MOIC)\n- DataForge (Series A, $6M → $450M acquisition by Snowflake, 8.5x MOIC)\n- Fund I aggregate: $30M deployed → $108M returned (3.6x net TVPI)\n- Fund II aggregate: $50M deployed → $125M total value (2.5x net TVPI, 1.8x DPI)",
        education: "MS Computer Science, Stanford University; BS Computer Engineering, MIT",
        boards: "Stanford StartX; MIT Venture Mentoring Service; NVCA Board",
        years: 20,
        priorFirms: ["Andreessen Horowitz", "Google"],
      },
      {
        name: "Priya R. Sharma",
        title: "General Partner",
        bio: `Ms. Sharma joined as GP in 2016 after a career spanning venture capital, fintech operations, and technology investing. She was Partner at Index Ventures (2012-2016, European fintech practice) and co-founded PayGrid, a B2B payments startup acquired by Square for $85M in 2014. At Index, she led the firm's investments in 3 fintech companies that each achieved $1B+ valuations.`,
        trackRecord: "- LedgerX (Series A, $5M → $380M SPAC merger, 7.6x MOIC)\n- PayGrid (co-founder → $85M acquisition by Square in 2014)\n- At Index Ventures: Led 8 investments, 3 unicorn outcomes, aggregate 4.2x MOIC\n- Currently on 6 portfolio company boards with combined $4B+ enterprise value",
        education: "MBA, Stanford GSB; BS Computer Science, UC Berkeley (Regents Scholar)",
        certifications: "Series 7, Series 63",
        boards: "All Raise (founding board member); Berkeley SkyDeck Advisory Board",
        years: 17,
        priorFirms: ["Index Ventures", "Square (via PayGrid acquisition)"],
      },
      {
        name: "Alex J. Morrison",
        title: "Partner",
        bio: `Mr. Morrison joined in 2018 focusing on applied AI and developer infrastructure. He spent 5 years at Sequoia Capital as Principal (2013-2018) and 4 years as ML engineer at Meta AI Research (2009-2013). He holds 6 issued patents in machine learning systems. At Sequoia, he sourced the firm's investments in 3 AI companies representing $2.5B in aggregate valuation.`,
        trackRecord: "- CortexAI (Seed, $1.5M → current valuation $2.4B, 28x paper MOIC, unrealized)\n- InfraBuild (Series A, $8M → $520M acquisition by Datadog, 6.5x MOIC)\n- At Sequoia: Sourced 8 investments with 2 IPOs and 3 acquisitions\n- 6 issued patents in ML systems (U.S. Patent Nos. 10,XXX,XXX - 10,XXX,XXX)",
        education: "PhD Machine Learning, Carnegie Mellon (Doctoral Fellowship); BS Mathematics, Princeton (summa cum laude)",
        boards: "CMU Machine Learning Department Advisory Board; AI Safety Institute (technical advisor)",
        years: 14,
        priorFirms: ["Sequoia Capital", "Meta AI Research"],
      },
    ],
    REAL_ESTATE: [
      {
        name: "Robert S. Callahan",
        title: "Managing Partner & Chief Investment Officer",
        bio: `Mr. Callahan founded ${deal.gpEntityName} in 2010 with 25+ years of real estate experience. He served as Senior Managing Director at Starwood Capital Group (2003-2010) overseeing $4.2B of multifamily and mixed-use acquisitions, and as VP at JMB Realty (1998-2003). He has personally acquired, renovated, and disposed of over 22,000 residential units across 14 Sun Belt markets, achieving an average unlevered IRR of 14.8%.`,
        trackRecord: "- Fund I (2016): 8 properties, 1,842 units, $320M total capitalization → 2.1x net equity multiple, 21.3% net IRR\n- Pre-fund: 42 properties, $2.4B aggregate value, avg 12.8% unlevered return\n- Renovated 8,400+ units with average 28% rent increase and 94% lease-up within 90 days\n- Zero investor capital losses across 25-year career",
        education: "MBA, NYU Stern School of Business; BS Finance, Boston College",
        certifications: "CRE (Counselor of Real Estate), CCIM",
        boards: "National Multifamily Housing Council (NMHC); ULI Multifamily Council; Boston College RE Advisory Board",
        years: 27,
        priorFirms: ["Starwood Capital Group", "JMB Realty"],
      },
      {
        name: "Jennifer L. Martinez",
        title: "Partner & Head of Acquisitions",
        bio: `Ms. Martinez leads acquisitions and underwriting. She joined from Brookfield Asset Management (2004-2013) where she executed $3.5B in multifamily transactions across the Southeast and Southwest. She is recognized for proprietary sourcing — 65% of the firm's acquisitions have been off-market or lightly-marketed bilateral negotiations, resulting in average discounts of 8% to broker-marketed comparable sales.`,
        trackRecord: "- Sourced and closed 18 acquisitions ($480M total) since joining in 2013\n- Off-market sourcing: 65% of deals, avg 8% discount to marketed comps\n- Average going-in cap rate advantage of 40 bps vs marketed peers\n- Zero failed closings on executed PSAs",
        education: "MBA, UCLA Anderson (Ziman RE Fellow); BS Real Estate Finance, USC",
        boards: "CREW Network; Urban Land Institute (ULI) Women's Leadership Initiative",
        years: 21,
        priorFirms: ["Brookfield Asset Management"],
      },
      {
        name: "Thomas G. Walsh",
        title: "Partner & Head of Asset Management",
        bio: `Mr. Walsh runs asset management, construction, and property management. With 20 years in multifamily operations, he managed 15,000+ units at Greystar Real Estate Partners (2002-2012) before joining. He created the firm's renovation playbook which has been executed at 1,842 units with average renovation costs of $18,500/unit and average rent premiums of $285/month post-renovation (18-month payback period).`,
        trackRecord: "- Managed renovation of 1,842 units across 8 properties, avg $18,500/unit cost\n- Average rent premium post-renovation: $285/month (22% increase), 18-month payback\n- Achieved 96% average occupancy across portfolio (market average: 93%)\n- Operating expense reduction of 8% through vendor consolidation and utility optimization",
        education: "MS Real Estate Development, MIT; BS Civil Engineering, Virginia Tech",
        certifications: "CPM (Certified Property Manager)",
        boards: "National Apartment Association; MIT Center for Real Estate Advisory Board",
        years: 22,
        priorFirms: ["Greystar Real Estate Partners"],
      },
    ],
    HEDGE_FUND: [
      {
        name: "Andrew K. Nakamura",
        title: "Founder & Chief Investment Officer",
        bio: `Mr. Nakamura founded ${deal.gpEntityName} in 2016 and is sole investment decision-maker. He managed a $400M long/short book at Citadel LLC (2010-2016) generating 18.2% annualized gross returns with a 1.6 Sharpe ratio. Prior to Citadel, he spent 6 years at Morgan Stanley in equity research covering industrials (ranked #2 by Institutional Investor in 2009). Since founding the firm, he has delivered 14.2% net annualized returns through multiple market regimes.`,
        trackRecord: "- Since inception (Jan 2017): 14.2% net annualized, 1.42 Sharpe, -8.3% max drawdown\n- 2020: +22.8% net (vs S&P +18.4%), recovered COVID drawdown in 4 months\n- 2022: +4.1% net (vs S&P -18.1%), captured value rotation\n- 2025: +16.5% net, driven by industrials/AI infrastructure longs\n- At Citadel: $400M book, 18.2% gross annualized, 1.6 Sharpe over 6 years",
        education: "MBA, University of Chicago Booth (Dean's List); BA Economics & Mathematics, Yale (Phi Beta Kappa)",
        certifications: "CFA Charterholder, CAIA",
        boards: "Yale Investment Office Advisory Committee; Chicago Booth Private Equity/VC Council",
        years: 22,
        priorFirms: ["Citadel LLC", "Morgan Stanley"],
      },
      {
        name: "Elizabeth W. Drummond",
        title: "Partner & Portfolio Manager — Technology/Industrials",
        bio: `Ms. Drummond manages the technology and industrial sector books ($120M combined allocation). She joined from Viking Global Investors (2012-2018) where she was Senior Analyst generating an average annual gross return of 24% in her coverage universe. Prior to Viking, she was at Blackstone's Park Hill Group (2008-2012) in fund placement. She has generated 18.3% gross annualized alpha since joining.`,
        trackRecord: "- Personal P&L since joining (2018): 18.3% gross alpha annualized\n- Top 3 winners: AI chip co (long, +145%), legacy ERP co (short, +62%), defense contractor (long, +88%)\n- At Viking: 24% avg annual gross return in tech/industrial coverage\n- Hit rate: 58% of positions profitable, avg winner 2.3x avg loser",
        education: "MS Financial Engineering, Princeton; BS Physics, Caltech (magna cum laude)",
        certifications: "CFA Charterholder, FRM",
        boards: "Women in Investing Network; Caltech Associates",
        years: 18,
        priorFirms: ["Viking Global Investors", "Blackstone Park Hill Group"],
      },
    ],
    CREDIT: [
      {
        name: "William H. Prescott III",
        title: "Managing Partner & Chief Investment Officer",
        bio: `Mr. Prescott founded ${deal.gpEntityName} in 2014 with 24 years of credit experience. He was Managing Director and co-head of the direct lending group at Ares Management (2008-2014) where he managed a $2.5B portfolio with a 0.3% annual loss rate. Prior to Ares, he spent 8 years in JPMorgan Chase leveraged finance (2000-2008) executing $12B+ in leveraged loans and high-yield bonds. He has originated $8B+ in direct lending transactions with a career cumulative loss rate below 0.5%.`,
        trackRecord: "- Fund I (2017): $200M committed, 42 loans, 0.8% default rate, 11.8% net IRR, 1.42x net MOIC\n- Career: $8B+ originated, 0.4% cumulative loss rate across 150+ transactions\n- At Ares: Managed $2.5B portfolio, 0.3% annual loss rate, zero principal write-offs in healthcare vertical\n- Workout recoveries: avg 82 cents on dollar across 8 distressed situations",
        education: "MBA, Wharton (Finance concentration); BA Economics, Dartmouth College (Phi Beta Kappa)",
        certifications: "CFA Charterholder",
        boards: "LSTA Board of Directors; Dartmouth Investment Office Advisory Committee",
        years: 26,
        priorFirms: ["Ares Management", "JPMorgan Chase"],
      },
      {
        name: "Katherine A. Rivera",
        title: "Partner & Head of Origination",
        bio: `Ms. Rivera manages origination and PE sponsor relationships. She originated $4B+ at Golub Capital (2010-2018) and executed $6B in leveraged finance at BofA Merrill Lynch (2006-2010). She maintains relationships with 85+ PE sponsors and sources 60% of the firm's deal flow through proprietary sponsor channels.`,
        trackRecord: "- Originated 65 transactions ($2.8B) since joining in 2018\n- Sponsor relationship network: 85+ active PE firms, 60% of deal flow proprietary\n- Average transaction size: $43M, average spread: SOFR + 590 bps\n- At Golub: $4B originated, led expansion into healthcare and tech-enabled services verticals",
        education: "MBA, Columbia Business School; BS Accounting, Villanova University (magna cum laude)",
        certifications: "CPA (inactive)",
        boards: "Women in Private Credit; Columbia Business School Private Credit Council",
        years: 19,
        priorFirms: ["Golub Capital", "Bank of America Merrill Lynch"],
      },
      {
        name: "Jonathan P. Hargrove",
        title: "Partner & Head of Portfolio Management",
        bio: `Mr. Hargrove leads credit monitoring, restructuring, and workout situations. He managed distressed portfolios at Apollo Global Management (2011-2018) and led restructuring advisory at Houlihan Lokey (2005-2011). He has managed workout situations recovering an average of 85 cents on the dollar across 50+ distressed credits totaling $3B in face value.`,
        trackRecord: "- Portfolio oversight: 42 active credits ($1.8B outstanding)\n- Workout recoveries: avg 85 cents on dollar across 50+ situations ($3B face value)\n- Early warning system: Identified 90% of eventual defaults 6+ months prior\n- At Apollo: Managed $1.2B distressed book, 22% gross IRR on distressed-for-control investments",
        education: "JD/MBA, NYU Law/Stern (Dean's List both schools); BA Political Science, Georgetown",
        boards: "Turnaround Management Association; American Bankruptcy Institute",
        years: 21,
        priorFirms: ["Apollo Global Management", "Houlihan Lokey"],
      },
    ],
    INFRASTRUCTURE: [
      {
        name: "Christopher M. Langley",
        title: "Managing Partner & Chief Investment Officer",
        bio: `Mr. Langley founded ${deal.gpEntityName} in 2017 with 22 years in infrastructure and energy. He was Senior Partner at Brookfield Infrastructure (2009-2017) overseeing $5B in renewable energy and digital infrastructure investments across North America. Prior to Brookfield, he led energy project finance at GE Capital (2003-2009) structuring $3B+ in tax equity and project finance facilities.`,
        trackRecord: "- 18 infrastructure assets, $4.2B aggregate EV, avg 12.4% unlevered IRR\n- 450 MW solar portfolio → sold to Brookfield at 1.8x equity (14.2% net IRR)\n- 350 MW wind portfolio → sold to NextEra at 1.6x equity (11.8% net IRR)\n- At Brookfield: Led $5B in acquisitions, zero asset impairments\n- At GE Capital: Structured $3B+ in tax equity (ITC/PTC monetization)",
        education: "MBA, Harvard Business School; MS Electrical Engineering, Stanford; BS EE, Georgia Tech",
        boards: "American Council on Renewable Energy (ACORE); Stanford Precourt Institute Advisory Board",
        years: 24,
        priorFirms: ["Brookfield Infrastructure", "GE Capital"],
      },
      {
        name: "Dr. Rachel N. Okonkwo",
        title: "Partner & Chief Technology Officer",
        bio: `Dr. Okonkwo leads technical diligence, asset optimization, and engineering. She was Director of Engineering at Tesla Energy (2015-2019) where she oversaw deployment of 1.2 GW of utility-scale solar and 800 MWh of battery storage. Prior roles at First Solar (2012-2015) and NREL (2009-2012). She holds 4 patents in energy storage systems and oversees a current portfolio generating 850+ MW of clean energy.`,
        trackRecord: "- Technical diligence on all 18 fund assets, zero post-acquisition technical surprises\n- At Tesla: 1.2 GW solar + 800 MWh storage deployed, $2.8B total project value\n- Optimized existing portfolio generation by 6% through repowering and software upgrades\n- 4 issued patents (US 10,XXX,XXX through 10,XXX,XXX) in battery management systems",
        education: "PhD Electrical Engineering, MIT; MS Energy Systems, Stanford; BS Physics, Howard University",
        certifications: "PE (Professional Engineer, CA and TX), LEED AP BD+C",
        boards: "IEEE Power & Energy Society; National Renewable Energy Laboratory Advisory Board",
        years: 17,
        priorFirms: ["Tesla Energy", "First Solar", "NREL"],
      },
      {
        name: "Marcus J. Steinberg",
        title: "Partner & Head of Capital Markets",
        bio: `Mr. Steinberg leads project finance, tax equity, capital markets, and investor relations. He structured $10B+ in project finance at Macquarie Infrastructure (2009-2018) and $4B in investment-grade project bonds at Credit Suisse (2005-2009). He pioneered the firm's IRA Section 6418 tax credit transfer program, monetizing $120M in ITCs/PTCs for fund investors in 2025.`,
        trackRecord: "- Structured $10B+ project finance across 35 transactions at Macquarie\n- Pioneered IRA Section 6418 tax credit transfers: $120M monetized in 2025\n- Average cost of debt across portfolio: SOFR + 185 bps (investment-grade equivalent)\n- At Credit Suisse: Led $4B in project bonds, including 3 landmark green bond issuances",
        education: "MBA, London Business School (Dean's List); BSc Economics, LSE (First Class Honours)",
        certifications: "CFA Charterholder",
        boards: "Structured Finance Association; LBS Private Equity & Infrastructure Club (founding member)",
        years: 20,
        priorFirms: ["Macquarie Infrastructure", "Credit Suisse"],
      },
    ],
  };

  return teams[deal.fundType] || teams.PRIVATE_EQUITY;
}

// deterministic hash for stable random-looking numbers
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────
// Main exports
// ─────────────────────────────────────────────────────────────────

export function getCapitalSourceDocs(dealId: string): Record<string, string> {
  const deal = SAMPLE_CAPITAL_DEALS.find((d) => d.id === dealId);
  if (!deal) throw new Error(`Capital sample deal not found: ${dealId}`);

  return {
    fund_business_plan: generateFundBusinessPlan(deal),
    formation_docs: generateFormationDocs(deal),
    management_bios: generateManagementBios(deal),
  };
}

export function getAllCapitalSourceDocs(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const deal of SAMPLE_CAPITAL_DEALS) {
    result[deal.id] = getCapitalSourceDocs(deal.id);
  }
  return result;
}
