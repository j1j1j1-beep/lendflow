/**
 * Source Document OCR Text — Syndication Module (12 deals × 4 required docs = 48 docs)
 *
 * OPTIMIZED FOR AI OUTPUT QUALITY:
 * These docs feed Grok prompts generating syndication PPMs, Operating Agreements,
 * and Subscription Agreements. The PPM is the crown jewel — buyers judge the
 * product by how professional and detailed the PPM looks.
 *
 * Required source doc types:
 *   1. property_appraisal — Independent appraisal with comps and income approach
 *   2. rent_roll — Unit-by-unit tenant detail with rents, occupancy, lease dates
 *   3. property_financials — T-12 operating statement with line-item detail
 *   4. purchase_contract — PSA with specific legal terms and contingencies
 *
 * Key optimization: Dense with specific numbers, property details, market data,
 * and comparable transactions so the AI writes detailed PPM sections on property
 * description, market analysis, risk factors, and financial projections.
 */

import { SAMPLE_SYNDICATION_DEALS, type SampleSyndicationDeal } from "../syndication";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────
// PROPERTY APPRAISAL — feeds PPM property description + market analysis
// ─────────────────────────────────────────────────────────────────

function generatePropertyAppraisal(deal: SampleSyndicationDeal): string {
  const noi = getPropertyNOI(deal);
  const capRate = (noi / deal.purchasePrice * 100);
  const incomeValue = Math.round(noi / (capRate / 100));
  const salesCompValue = Math.round(deal.purchasePrice * (1 + (hashCode(deal.id) % 8 - 4) / 100));
  const reconciledValue = Math.round((incomeValue * 0.6 + salesCompValue * 0.4));
  const comps = getSalesComps(deal);
  const propertyDetails = getPropertyDetails(deal);
  const perUnit = deal.units > 0 ? Math.round(reconciledValue / deal.units) : Math.round(reconciledValue / (propertyDetails.sqft / 1000));

  return `APPRAISAL REPORT
RESTRICTED USE — FOR LENDER AND INVESTOR USE ONLY

Property: ${deal.name.replace(" Fund", "")}
Address: ${deal.propertyAddress}
Effective Date: January 10, 2026
Appraiser: Michael T. Reynolds, MAI, SRA
Firm: Cushman & Wakefield Valuation Advisory
License: State Certified General Appraiser #CGA-${4000 + hashCode(deal.id) % 5000}

SUBJECT PROPERTY SUMMARY

Property Type: ${deal.propertyType.replace(/_/g, " ")}
${propertyDetails.description}
Year Built: ${deal.yearBuilt}${deal.yearBuilt < 2020 ? ` | Last Renovated: ${deal.yearBuilt + Math.min(Math.floor((2025 - deal.yearBuilt) * 0.6), 15)}` : ""}
${deal.units > 0 ? `Units: ${deal.units} | Occupancy: ${propertyDetails.occupancy}%` : `Square Footage: ${fmt(propertyDetails.sqft)} SF | Occupancy: ${propertyDetails.occupancy}%`}
Zoning: ${propertyDetails.zoning}
Flood Zone: ${propertyDetails.floodZone}
Parking: ${propertyDetails.parking}
Site Area: ${propertyDetails.acres} acres

HIGHEST AND BEST USE

As Improved: Continued use as ${deal.propertyType.replace(/_/g, " ").toLowerCase()} property. The improvements represent the highest and best use of the site.
As Vacant: ${propertyDetails.vacantUse}

INCOME CAPITALIZATION APPROACH

Potential Gross Income:              $${fmt(Math.round(noi / (1 - getExpenseRatio(deal)) * 1.05))}
Less: Vacancy & Collection Loss      (${fmt(Math.round(noi / (1 - getExpenseRatio(deal)) * 0.05))}) [${(5).toFixed(1)}%]
Effective Gross Income:              $${fmt(Math.round(noi / (1 - getExpenseRatio(deal))))}
Less: Operating Expenses             (${fmt(Math.round(noi / (1 - getExpenseRatio(deal)) * getExpenseRatio(deal)))}) [${(getExpenseRatio(deal) * 100).toFixed(1)}%]
Net Operating Income:                $${fmt(noi)}
Capitalization Rate:                  ${capRate.toFixed(2)}%
Indicated Value (Income Approach):   $${fmt(incomeValue)}
${deal.units > 0 ? `Per Unit: $${fmt(Math.round(incomeValue / deal.units))}` : `Per SF: $${fmt(Math.round(incomeValue / propertyDetails.sqft))}`}

SALES COMPARISON APPROACH

${comps.map((c, i) => `Comp ${i + 1}: ${c.name}
  ${c.address} | ${c.date} | $${fmt(c.price)}${c.units > 0 ? ` ($${fmt(c.pricePerUnit)}/unit)` : ` ($${fmt(c.pricePerSF)}/SF)`}
  ${c.details}`).join("\n\n")}

Adjusted Sales Comparison Value:     $${fmt(salesCompValue)}
${deal.units > 0 ? `Per Unit: $${fmt(Math.round(salesCompValue / deal.units))}` : `Per SF: $${fmt(Math.round(salesCompValue / propertyDetails.sqft))}`}

RECONCILIATION

Income Approach (60% weight):        $${fmt(incomeValue)}
Sales Comparison (40% weight):       $${fmt(salesCompValue)}
Reconciled Value:                    $${fmt(reconciledValue)}
${deal.units > 0 ? `Per Unit: $${fmt(perUnit)}` : `Per SF: $${fmt(perUnit)}`}

FINAL OPINION OF VALUE

As-Is Market Value:                  $${fmt(reconciledValue)}
${deal.propertyType === "BUILD_TO_RENT" || deal.yearBuilt >= 2024 ? `As-Stabilized Value (upon completion): $${fmt(Math.round(reconciledValue * 1.18))}` : `As-Stabilized Value (post-renovation): $${fmt(Math.round(reconciledValue * 1.15))}`}

Exposure Time: 6-9 months
Marketing Time: 3-6 months

EXTRAORDINARY ASSUMPTIONS AND HYPOTHETICAL CONDITIONS
1. The property is assumed free of environmental contamination.
2. Reported income/expense data provided by current owner is assumed accurate.
3. Current zoning is assumed to permit continued use as ${deal.propertyType.replace(/_/g, " ").toLowerCase()}.

This appraisal conforms to USPAP (Uniform Standards of Professional Appraisal Practice) 2024 Edition and the requirements of Title XI of FIRREA.`;
}

// ─────────────────────────────────────────────────────────────────
// RENT ROLL — feeds PPM financial projections + Pro Forma
// ─────────────────────────────────────────────────────────────────

function generateRentRoll(deal: SampleSyndicationDeal): string {
  const details = getPropertyDetails(deal);
  const unitMix = getUnitMix(deal);
  const totalMonthlyRent = unitMix.reduce((sum, u) => sum + u.count * u.monthlyRent, 0);
  const occupiedUnits = unitMix.reduce((sum, u) => sum + u.occupied, 0);
  const totalUnits = unitMix.reduce((sum, u) => sum + u.count, 0);
  const occupancyRate = (occupiedUnits / totalUnits * 100).toFixed(1);

  let text = `CURRENT RENT ROLL
${deal.name.replace(" Fund", "")}
${deal.propertyAddress}
As of: January 1, 2026

PROPERTY SUMMARY
Total Units: ${totalUnits}
Occupied Units: ${occupiedUnits}
Vacant Units: ${totalUnits - occupiedUnits}
Occupancy Rate: ${occupancyRate}%
Total Monthly Scheduled Rent: $${fmt(totalMonthlyRent)}
Total Annual Scheduled Rent: $${fmt(totalMonthlyRent * 12)}
Average Rent Per Unit: $${fmt(Math.round(totalMonthlyRent / totalUnits))}/month

UNIT MIX SUMMARY

`;

  text += `${"Type".padEnd(25)} ${"Count".padStart(6)} ${"Occupied".padStart(9)} ${"Avg SF".padStart(8)} ${"Avg Rent".padStart(10)} ${"Rent/SF".padStart(9)} ${"Market".padStart(10)}
${"-".repeat(80)}\n`;

  for (const unit of unitMix) {
    const rentPerSF = (unit.monthlyRent / unit.avgSF).toFixed(2);
    const marketRent = Math.round(unit.monthlyRent * unit.marketMultiple);
    text += `${unit.type.padEnd(25)} ${String(unit.count).padStart(6)} ${String(unit.occupied).padStart(9)} ${String(unit.avgSF).padStart(8)} $${String(fmt(unit.monthlyRent)).padStart(9)} $${String(rentPerSF).padStart(8)} $${String(fmt(marketRent)).padStart(9)}\n`;
  }

  const totalMarketRent = unitMix.reduce((sum, u) => sum + u.count * Math.round(u.monthlyRent * u.marketMultiple), 0);
  const lossFactor = ((totalMarketRent - totalMonthlyRent) / totalMarketRent * 100).toFixed(1);

  text += `${"-".repeat(80)}
${"TOTAL".padEnd(25)} ${String(totalUnits).padStart(6)} ${String(occupiedUnits).padStart(9)} ${"".padStart(8)} $${String(fmt(totalMonthlyRent)).padStart(9)} ${"".padStart(9)} $${String(fmt(totalMarketRent)).padStart(9)}

LOSS-TO-LEASE ANALYSIS
Current Gross Potential Rent: $${fmt(totalMonthlyRent * 12)}/year
Market Gross Potential Rent: $${fmt(totalMarketRent * 12)}/year
Loss to Lease: ${lossFactor}% ($${fmt((totalMarketRent - totalMonthlyRent) * 12)}/year)
Mark-to-Market Opportunity: $${fmt((totalMarketRent - totalMonthlyRent) * 12)} additional annual revenue at market rents

LEASE EXPIRATION SCHEDULE

`;

  const expirations = getLeaseExpirations(deal, totalUnits);
  text += `${"Quarter".padEnd(12)} ${"Expiring".padStart(10)} ${"% of Total".padStart(12)} ${"Cumulative %".padStart(14)}\n`;
  text += `${"-".repeat(50)}\n`;
  let cumPct = 0;
  for (const exp of expirations) {
    cumPct += exp.pct;
    text += `${exp.quarter.padEnd(12)} ${String(exp.count).padStart(10)} ${(exp.pct.toFixed(1) + "%").padStart(12)} ${(cumPct.toFixed(1) + "%").padStart(14)}\n`;
  }

  text += `
OTHER INCOME (MONTHLY)
${getOtherIncome(deal).map(i => `  ${i.name}: $${fmt(i.amount)}`).join("\n")}
Total Other Income: $${fmt(getOtherIncome(deal).reduce((sum, i) => sum + i.amount, 0))}/month ($${fmt(getOtherIncome(deal).reduce((sum, i) => sum + i.amount, 0) * 12)}/year)

NOTES
- All rents are base rent exclusive of utility reimbursements unless noted
- ${deal.propertyType === "NNN_RETAIL" ? "All leases are absolute NNN with tenant responsible for taxes, insurance, and maintenance" : "Tenants pay electric; owner pays water/sewer/trash/gas"}
- ${deal.units > 50 ? "No single tenant represents more than 2% of total rental income" : "Largest tenant represents approximately " + (100 / deal.units * 2).toFixed(0) + "% of rental income"}
- Rent concessions: ${details.occupancy >= 95 ? "None currently offered" : "$200 off first month on new leases (budget: $" + fmt(Math.round((totalUnits - occupiedUnits) * 200)) + ")"}`;

  return text;
}

// ─────────────────────────────────────────────────────────────────
// PROPERTY FINANCIALS — T-12 P&L feeds PPM and Pro Forma
// ─────────────────────────────────────────────────────────────────

function generatePropertyFinancials(deal: SampleSyndicationDeal): string {
  const noi = getPropertyNOI(deal);
  const egi = Math.round(noi / (1 - getExpenseRatio(deal)));
  const pgi = Math.round(egi / 0.95); // 5% vacancy
  const vacancyLoss = pgi - egi;
  const expenses = getExpenseBreakdown(deal, egi);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const otherIncome = getOtherIncome(deal).reduce((sum, i) => sum + i.amount, 0) * 12;
  const debtService = Math.round(deal.loanAmount * (deal.interestRate / 100 + 0.02)); // rough P&I
  const cashFlow = noi - debtService + otherIncome;

  // Prior year (2% growth)
  const priorNOI = Math.round(noi / 1.02);
  const priorEGI = Math.round(egi / 1.02);

  return `${deal.name.replace(" Fund", "").toUpperCase()}
OPERATING STATEMENT — TRAILING 12 MONTHS
January 1, 2025 through December 31, 2025
Prepared by: ${deal.sponsorName} (Property Manager)

INCOME                                    T-12 Actual      Prior Year     Variance
                                         (Jan-Dec 2025)   (Jan-Dec 2024)
─────────────────────────────────────────────────────────────────────────────
Gross Potential Rent                     $${fmt(pgi).padStart(12)}  $${fmt(Math.round(pgi / 1.02)).padStart(12)}   ${((pgi / Math.round(pgi / 1.02) - 1) * 100).toFixed(1)}%
Less: Vacancy & Collection Loss          (${fmt(vacancyLoss).padStart(11)}) (${fmt(Math.round(vacancyLoss / 1.02)).padStart(11)})
                                         ────────────   ────────────
Effective Gross Rental Income             ${fmt(egi).padStart(12)}   ${fmt(priorEGI).padStart(12)}   ${((egi / priorEGI - 1) * 100).toFixed(1)}%
Other Income                              ${fmt(otherIncome).padStart(12)}   ${fmt(Math.round(otherIncome / 1.02)).padStart(12)}
                                         ────────────   ────────────
TOTAL EFFECTIVE GROSS INCOME             $${fmt(egi + otherIncome).padStart(12)}  $${fmt(priorEGI + Math.round(otherIncome / 1.02)).padStart(12)}   ${(((egi + otherIncome) / (priorEGI + Math.round(otherIncome / 1.02)) - 1) * 100).toFixed(1)}%

OPERATING EXPENSES
─────────────────────────────────────────────────────────────────────────────
${expenses.map(e => `${e.name.padEnd(40)} ${fmt(e.amount).padStart(12)}   ${fmt(Math.round(e.amount / 1.02)).padStart(12)}   [${(e.amount / (egi + otherIncome) * 100).toFixed(1)}%]`).join("\n")}
                                         ────────────   ────────────
TOTAL OPERATING EXPENSES                 $${fmt(totalExpenses).padStart(12)}  $${fmt(Math.round(totalExpenses / 1.02)).padStart(12)}   [${(totalExpenses / (egi + otherIncome) * 100).toFixed(1)}%]

                                         ────────────   ────────────
NET OPERATING INCOME                     $${fmt(noi + otherIncome).padStart(12)}  $${fmt(priorNOI + Math.round(otherIncome / 1.02)).padStart(12)}   ${(((noi + otherIncome) / (priorNOI + Math.round(otherIncome / 1.02)) - 1) * 100).toFixed(1)}%

BELOW-THE-LINE
─────────────────────────────────────────────────────────────────────────────
Debt Service (P&I)                       (${fmt(debtService).padStart(11)})
Capital Reserves (${deal.propertyType === "HOTEL" ? "4.0% FF&E" : "$250/unit"})${deal.units > 0 ? `         (${fmt(deal.units * 250).padStart(11)})` : `         (${fmt(Math.round(egi * 0.02)).padStart(11)})`}
                                         ────────────
NET CASH FLOW                            $${fmt(cashFlow - (deal.units > 0 ? deal.units * 250 : Math.round(egi * 0.02))).padStart(12)}

KEY METRICS
─────────────────────────────────────────────────────────────────────────────
NOI:                                     $${fmt(noi + otherIncome)}
NOI Margin:                               ${((noi + otherIncome) / (egi + otherIncome) * 100).toFixed(1)}%
Operating Expense Ratio:                  ${(totalExpenses / (egi + otherIncome) * 100).toFixed(1)}%
Going-In Cap Rate:                        ${((noi + otherIncome) / deal.purchasePrice * 100).toFixed(2)}%
DSCR:                                     ${((noi + otherIncome) / debtService).toFixed(2)}x
${deal.units > 0 ? `Revenue Per Unit:                         $${fmt(Math.round((egi + otherIncome) / deal.units))}/year` : `Revenue Per SF:                           $${fmt(Math.round((egi + otherIncome) / getPropertyDetails(deal).sqft))}/SF/year`}
${deal.units > 0 ? `Expense Per Unit:                         $${fmt(Math.round(totalExpenses / deal.units))}/year` : `Expense Per SF:                           $${fmt(Math.round(totalExpenses / getPropertyDetails(deal).sqft))}/SF/year`}
NOI Growth (YoY):                         ${(((noi + otherIncome) / (priorNOI + Math.round(otherIncome / 1.02)) - 1) * 100).toFixed(1)}%

NOTES
1. Financial statements are unaudited and prepared on a cash basis.
2. Real estate taxes based on current assessed value; reassessment expected upon sale.
3. ${deal.propertyType.includes("MULTI") || deal.propertyType.includes("STUDENT") || deal.propertyType.includes("SENIOR") || deal.propertyType === "BUILD_TO_RENT" || deal.propertyType === "MOBILE_HOME_PARK" ? "Depreciation: 27.5-year straight-line (residential classification)" : "Depreciation: 39-year straight-line (commercial classification)"}
4. Bonus Depreciation: 100% on qualifying personal property and land improvements (OBBBA July 2025, for property acquired after January 19, 2025).
5. Insurance reflects current market; premiums have increased 15-25% in ${deal.propertyAddress.includes("FL") ? "Florida" : deal.propertyAddress.includes("TX") ? "Texas" : "target"} market since 2023.`;
}

// ─────────────────────────────────────────────────────────────────
// PURCHASE CONTRACT — feeds PPM terms and Operating Agreement
// ─────────────────────────────────────────────────────────────────

function generatePurchaseContract(deal: SampleSyndicationDeal): string {
  const earnestMoney = Math.round(deal.purchasePrice * 0.02);
  const closingDate = "April 15, 2026";
  const dueDiligenceDays = 45;
  const financingDays = 60;
  const details = getPropertyDetails(deal);

  return `PURCHASE AND SALE AGREEMENT

This Purchase and Sale Agreement ("Agreement") is entered into as of January 20, 2026 ("Effective Date"), by and between:

SELLER: ${getSellerName(deal)} ("Seller")
        ${getSellerAddress(deal)}

BUYER:  ${deal.entityName} ("Buyer")
        c/o ${deal.sponsorName}
        [Buyer Address]

or Buyer's permitted assignee.

ARTICLE 1 — PROPERTY

Seller agrees to sell, and Buyer agrees to purchase, the following property:

Street Address: ${deal.propertyAddress}
Legal Description: See Exhibit A (attached)
${deal.units > 0 ? `Units/Pads: ${deal.units}` : `Square Footage: ${fmt(details.sqft)} SF`}
${details.acres} acres (${fmt(Math.round(parseFloat(details.acres) * 43560))} SF)
Year Built: ${deal.yearBuilt}
Tax Parcel: ${hashCode(deal.propertyAddress) % 9000000 + 1000000}
Zoning: ${details.zoning}

Together with all improvements, fixtures, equipment, tenant leases, service contracts, permits, licenses, warranties, and intangible property related thereto (collectively, the "Property").

ARTICLE 2 — PURCHASE PRICE AND PAYMENT

Purchase Price:                     $${fmt(deal.purchasePrice)}
Earnest Money Deposit:              $${fmt(earnestMoney)} (within 3 business days of Effective Date)
Additional Deposit (Day ${dueDiligenceDays + 1}):      $${fmt(earnestMoney)} (upon expiration of Due Diligence Period)
Balance Due at Closing:             $${fmt(deal.purchasePrice - earnestMoney * 2)}

Earnest money to be held by ${getEscrowAgent(deal)} in FDIC-insured escrow account.
Earnest money becomes non-refundable upon expiration of the Due Diligence Period, except as otherwise provided herein.

ARTICLE 3 — DUE DILIGENCE

Due Diligence Period: ${dueDiligenceDays} calendar days from Effective Date (expires ${getDueDiligenceExpiry(dueDiligenceDays)})
Buyer's Right to Terminate: Buyer may terminate for any reason during Due Diligence Period with full return of Earnest Money.

Seller shall provide within 5 business days of Effective Date:
(a) Copies of all tenant leases and amendments
(b) Trailing 24-month operating statements
(c) Current rent roll certified by property manager
(d) Real estate tax bills for prior 3 years
(e) All service and maintenance contracts
(f) Environmental reports in Seller's possession
(g) Most recent property condition assessment
(h) Title commitment and survey (if available)
(i) ${deal.propertyType === "HOTEL" ? "Franchise agreement and PIP" : deal.propertyType.includes("NNN") ? "Tenant financial statements and guarantor information" : "Capital expenditure history for prior 5 years"}

ARTICLE 4 — FINANCING CONTINGENCY

Buyer shall have ${financingDays} calendar days from Effective Date to obtain a commitment for first mortgage financing on the following terms:
  Loan Amount: $${fmt(deal.loanAmount)} (${(deal.loanAmount / deal.purchasePrice * 100).toFixed(0)}% LTV)
  Interest Rate: Not to exceed ${(deal.interestRate + 0.50).toFixed(2)}% per annum
  Term: ${deal.projectedHoldYears >= 7 ? "10" : "5"} years${deal.projectedHoldYears < 7 ? " with 30-year amortization" : ""}
  Lender: ${getLender(deal)}

Failure to obtain financing on substantially similar terms by the Financing Contingency Date shall entitle Buyer to terminate with full refund of Earnest Money.

ARTICLE 5 — CLOSING

Closing Date: ${closingDate}, or such earlier date as mutually agreed ("Closing Date")
Closing Location: Offices of ${getClosingAttorney(deal)}
Extensions: Buyer may extend Closing Date up to 30 days upon payment of $${fmt(Math.round(earnestMoney * 0.25))} non-refundable extension fee.

ARTICLE 6 — TITLE AND SURVEY

Seller shall convey marketable fee simple title by ${deal.propertyAddress.includes("TX") || deal.propertyAddress.includes("AZ") || deal.propertyAddress.includes("FL") ? "Special Warranty Deed" : "Bargain and Sale Deed with Covenants"}, free of all liens, encumbrances, and defects, subject only to Permitted Exceptions (Exhibit B).

Buyer shall obtain an ALTA Owner's Policy of Title Insurance in the amount of the Purchase Price from ${getTitleCompany(deal)}.

ARTICLE 7 — PRORATIONS AND CLOSING COSTS

The following shall be prorated as of 11:59 PM on the day before Closing:
(a) Real estate taxes (based on most recent assessment)
(b) Rents (collected and uncollected, with credit to Buyer for prepaid rents)
(c) Security deposits (transferred to Buyer)
(d) Utility charges
(e) Service contract payments
(f) Insurance premiums (if assumed)

Seller pays: Deed preparation, transfer tax (${getTransferTax(deal)}), title search, Seller's attorney fees
Buyer pays: ALTA survey, title insurance premium, recording fees, Buyer's attorney fees, loan costs

ARTICLE 8 — REPRESENTATIONS AND WARRANTIES

Seller represents and warrants:
(a) Authority: Seller has full power and authority to execute this Agreement and consummate the transaction.
(b) No Litigation: No pending or threatened litigation affecting the Property.
(c) Environmental: No known Hazardous Substances on or under the Property in violation of Environmental Laws.
(d) Compliance: Property complies in all material respects with applicable zoning, building, and fire codes.
(e) Leases: Rent roll delivered is accurate and complete. No tenant defaults in excess of 30 days.
(f) Contracts: Schedule of service contracts is complete. All contracts are terminable on 30 days' notice, except as disclosed.
(g) OFAC/AML: Seller is not a Prohibited Person under Executive Order 13224 or the USA PATRIOT Act.

Representations survive Closing for 12 months. Cap on Seller liability: ${(deal.purchasePrice * 0.03).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} (3% of Purchase Price).

ARTICLE 9 — DEFAULT AND REMEDIES

Buyer Default: Seller's sole remedy is retention of Earnest Money as liquidated damages.
Seller Default: Buyer may (i) seek specific performance or (ii) terminate and receive return of Earnest Money plus documented out-of-pocket expenses up to $${fmt(Math.round(deal.purchasePrice * 0.005))}.

ARTICLE 10 — GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of ${deal.propertyAddress.split(", ").pop()?.split(" ")[0] || "Delaware"}, without regard to conflicts of law principles. Venue: ${getVenue(deal)}.

ARTICLE 11 — ASSIGNMENT

Buyer may assign this Agreement to an entity controlled by Buyer or ${deal.sponsorName} without Seller's consent, provided Buyer remains liable for all obligations hereunder.

ARTICLE 12 — 1031 EXCHANGE

Either party may structure its participation in the transaction as a tax-deferred exchange under IRC Section 1031. The other party shall reasonably cooperate, provided such cooperation does not delay Closing or impose additional cost or liability.

EXECUTED as of the Effective Date.

SELLER:                              BUYER:
${getSellerName(deal)}               ${deal.entityName}
By: ______________________           By: ______________________
Name: Managing Member                Name: ${deal.sponsorName.split(" ").slice(-1)[0]}, Managing Member
Date: January 20, 2026               Date: January 20, 2026`;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions — property-specific data generators
// ─────────────────────────────────────────────────────────────────

function getPropertyNOI(deal: SampleSyndicationDeal): number {
  const capRate = deal.purchasePrice > 0 ? getTargetCapRate(deal) : 0.06;
  return Math.round(deal.purchasePrice * capRate);
}

function getTargetCapRate(deal: SampleSyndicationDeal): number {
  const rates: Record<string, number> = {
    MULTIFAMILY: 0.055, OFFICE: 0.068, RETAIL: 0.065, INDUSTRIAL: 0.058,
    MIXED_USE: 0.058, SELF_STORAGE: 0.062, MOBILE_HOME_PARK: 0.071,
    HOTEL: 0.069, NNN_RETAIL: 0.060, SENIOR_HOUSING: 0.068,
    STUDENT_HOUSING: 0.058, BUILD_TO_RENT: 0.055,
  };
  return rates[deal.propertyType] || 0.06;
}

function getExpenseRatio(deal: SampleSyndicationDeal): number {
  const ratios: Record<string, number> = {
    MULTIFAMILY: 0.40, OFFICE: 0.45, RETAIL: 0.35, INDUSTRIAL: 0.28,
    MIXED_USE: 0.42, SELF_STORAGE: 0.35, MOBILE_HOME_PARK: 0.30,
    HOTEL: 0.65, NNN_RETAIL: 0.05, SENIOR_HOUSING: 0.55,
    STUDENT_HOUSING: 0.42, BUILD_TO_RENT: 0.38,
  };
  return ratios[deal.propertyType] || 0.40;
}

type PropertyDetails = {
  description: string; sqft: number; occupancy: number; zoning: string;
  floodZone: string; parking: string; acres: string; vacantUse: string;
};

function getPropertyDetails(deal: SampleSyndicationDeal): PropertyDetails {
  const defaults: Record<string, PropertyDetails> = {
    MULTIFAMILY: {
      description: `${deal.units}-unit garden-style apartment community\nUnit Mix: 1BR/1BA, 2BR/2BA, 3BR/2BA\nAverage Unit Size: 925 SF\nAmenities: Pool, fitness center, business center, dog park, covered parking`,
      sqft: deal.units * 925, occupancy: 94, zoning: "R-3 (Multi-Family Residential)",
      floodZone: "Zone X (outside 500-year floodplain)", parking: `${deal.units * 1.5} surface spaces (1.5/unit)`,
      acres: (deal.units * 925 / 43560 * 3.5).toFixed(1), vacantUse: "Multi-family residential development",
    },
    OFFICE: {
      description: `175,000 SF Class A suburban office campus\n3 buildings, 4 stories each\nFloor plates: 15,000 SF average\nAmenities: Conference center, tenant lounge, fitness center, structured parking`,
      sqft: 175000, occupancy: 88, zoning: "O-2 (Office/Professional)",
      floodZone: "Zone X", parking: "525 structured spaces (3.0/1,000 SF)",
      acres: "12.5", vacantUse: "Office or mixed-use development",
    },
    RETAIL: {
      description: `120,000 SF grocery-anchored neighborhood shopping center\nAnchor: Kroger (52,000 SF, 15 years remaining)\n12 inline tenants (5,000-8,000 SF each)\nOutparcels: 2 (pad-ready, included in sale)`,
      sqft: 120000, occupancy: 94, zoning: "C-2 (General Commercial)",
      floodZone: "Zone X", parking: "540 surface spaces (4.5/1,000 SF)",
      acres: "14.2", vacantUse: "Retail/commercial development",
    },
    INDUSTRIAL: {
      description: `250,000 SF Class A distribution/warehouse facility\n32-foot clear height, 50 dock-high doors, 4 drive-in doors\nEIFS/tilt-up construction, T-5 LED lighting throughout\nSingle tenant: National logistics company (NNN lease)`,
      sqft: 250000, occupancy: 100, zoning: "I-2 (Heavy Industrial/Distribution)",
      floodZone: "Zone X", parking: "185 auto spaces + 45 trailer positions",
      acres: "22.0", vacantUse: "Industrial/distribution development",
    },
    MIXED_USE: {
      description: `5-story mixed-use building\nResidential: ${deal.units} apartments (floors 2-5)\nRetail: 12,000 SF ground-floor retail (2 tenants)\nUnit Mix: Studio, 1BR, 2BR\nAmenities: Rooftop terrace, co-working lounge, bike storage`,
      sqft: deal.units * 850 + 12000, occupancy: 96, zoning: "MU-1 (Mixed Use Urban)",
      floodZone: "Zone X", parking: `${deal.units + 20} structured spaces`,
      acres: "1.2", vacantUse: "Mixed-use infill development",
    },
    SELF_STORAGE: {
      description: `85,000 net rentable SF self-storage facility\n650 units across 3 buildings + outdoor RV/boat storage\n78% climate-controlled, 22% drive-up\nSecurity: 24/7 camera surveillance, electronic gate access, individual unit alarms`,
      sqft: 85000, occupancy: 82, zoning: "C-3 (Commercial)",
      floodZone: "Zone X", parking: "45 spaces + loading areas",
      acres: "4.8", vacantUse: "Storage or light commercial development",
    },
    MOBILE_HOME_PARK: {
      description: `${deal.units}-pad manufactured housing community\nAll pads: Tenant-owned homes (park owns land only)\nLot Size: Average 4,500 SF per pad\nUtilities: City water and sewer (no well/septic)\nAmenities: Community center, playground, laundry facility`,
      sqft: deal.units * 4500, occupancy: 95, zoning: "MH (Manufactured Housing)",
      floodZone: "Zone X", parking: "2 spaces per pad (${deal.units * 2} total)",
      acres: (deal.units * 4500 / 43560 * 1.3).toFixed(1), vacantUse: "Manufactured housing community",
    },
    HOTEL: {
      description: `${deal.units}-key boutique select-service hotel\n5 stories, interior corridors\nRoom Mix: 80 King, 30 Double Queen, 10 Suites\nAmenities: Restaurant/bar, pool, fitness, 3,500 SF meeting space\nBrand: Independent (no franchise)`,
      sqft: deal.units * 550, occupancy: 76, zoning: "C-2/H (Commercial/Hospitality)",
      floodZone: "Zone X", parking: `${Math.round(deal.units * 1.1)} surface spaces`,
      acres: "2.8", vacantUse: "Hospitality or mixed-use development",
    },
    NNN_RETAIL: {
      description: `Portfolio of 5 single-tenant NNN retail properties\nTenants: Dollar General (3), Walgreens (1), O'Reilly Auto (1)\nAverage building size: 10,000 SF\nAll absolute NNN: Tenant pays taxes, insurance, CAM`,
      sqft: 50000, occupancy: 100, zoning: "Various (C-1, C-2)",
      floodZone: "All Zone X", parking: "Various (25-50 spaces per location)",
      acres: "8.5 (combined)", vacantUse: "Retail pad development",
    },
    SENIOR_HOUSING: {
      description: `${deal.units}-bed assisted living and memory care community\n64 assisted living beds + 32 memory care beds\n2-story wood-frame construction\nAmenities: Full commercial kitchen, dining room, salon, therapy room, courtyard\nLicensed operator: Regional operator with 12 communities`,
      sqft: deal.units * 550, occupancy: 89, zoning: "R-3/SP (Residential/Special Purpose)",
      floodZone: "Zone X", parking: `${Math.round(deal.units * 0.5)} spaces (staff and visitors)`,
      acres: "5.2", vacantUse: "Senior housing or residential development",
    },
    STUDENT_HOUSING: {
      description: `${deal.units}-bed purpose-built student housing\n0.3 miles from flagship state university\nUnit Mix: 2BR/2BA and 4BR/4BA (per-bed leases)\n98% pre-leased for Fall 2026\nAmenities: Pool, gym, study rooms, computer lab, shuttle to campus`,
      sqft: deal.units * 450, occupancy: 98, zoning: "PUD (Planned Unit Development)",
      floodZone: "Zone X", parking: `${Math.round(deal.units * 0.7)} spaces`,
      acres: "6.8", vacantUse: "Student housing or multi-family development",
    },
    BUILD_TO_RENT: {
      description: `${deal.units}-home build-to-rent single-family community\n3BR/2BA detached homes averaging 1,450 SF\nLot Size: 5,500 SF average\nAmenities: Clubhouse, pool, dog park, pocket parks, walking trails\nConstruction: Slab-on-grade, wood frame, architectural shingle roof`,
      sqft: deal.units * 1450, occupancy: 0, zoning: "PUD-R (Planned Residential)",
      floodZone: "Zone X", parking: "2-car garage per home + guest parking",
      acres: (deal.units * 5500 / 43560 * 1.4).toFixed(1), vacantUse: "Single-family residential development",
    },
  };
  return defaults[deal.propertyType] || defaults.MULTIFAMILY;
}

type UnitMixEntry = {
  type: string; count: number; occupied: number; avgSF: number;
  monthlyRent: number; marketMultiple: number;
};

function getUnitMix(deal: SampleSyndicationDeal): UnitMixEntry[] {
  const mixes: Record<string, UnitMixEntry[]> = {
    MULTIFAMILY: [
      { type: "1BR/1BA", count: Math.round(deal.units * 0.35), occupied: Math.round(deal.units * 0.35 * 0.94), avgSF: 725, monthlyRent: 1150, marketMultiple: 1.15 },
      { type: "2BR/2BA", count: Math.round(deal.units * 0.45), occupied: Math.round(deal.units * 0.45 * 0.95), avgSF: 985, monthlyRent: 1425, marketMultiple: 1.18 },
      { type: "3BR/2BA", count: deal.units - Math.round(deal.units * 0.35) - Math.round(deal.units * 0.45), occupied: Math.round((deal.units - Math.round(deal.units * 0.35) - Math.round(deal.units * 0.45)) * 0.93), avgSF: 1175, monthlyRent: 1725, marketMultiple: 1.12 },
    ],
    OFFICE: [
      { type: "Suite A (Anchor)", count: 1, occupied: 1, avgSF: 45000, monthlyRent: 78750, marketMultiple: 1.12 },
      { type: "Suite B (15K SF)", count: 3, occupied: 3, avgSF: 15000, monthlyRent: 26250, marketMultiple: 1.15 },
      { type: "Suite C (8K SF)", count: 6, occupied: 5, avgSF: 8000, monthlyRent: 15000, marketMultiple: 1.10 },
      { type: "Suite D (5K SF)", count: 5, occupied: 4, avgSF: 5000, monthlyRent: 9375, marketMultiple: 1.18 },
    ],
    RETAIL: [
      { type: "Anchor (Kroger)", count: 1, occupied: 1, avgSF: 52000, monthlyRent: 52000, marketMultiple: 1.05 },
      { type: "Jr Anchor", count: 1, occupied: 1, avgSF: 18000, monthlyRent: 27000, marketMultiple: 1.10 },
      { type: "Inline (8K SF)", count: 4, occupied: 4, avgSF: 8000, monthlyRent: 16000, marketMultiple: 1.15 },
      { type: "Inline (5K SF)", count: 5, occupied: 4, avgSF: 5000, monthlyRent: 10000, marketMultiple: 1.18 },
      { type: "Small Shop (3K SF)", count: 3, occupied: 3, avgSF: 3000, monthlyRent: 7500, marketMultiple: 1.12 },
    ],
    INDUSTRIAL: [
      { type: "Warehouse/Distribution", count: 1, occupied: 1, avgSF: 250000, monthlyRent: 145833, marketMultiple: 1.08 },
    ],
    SELF_STORAGE: [
      { type: "5x5 Climate", count: 100, occupied: 85, avgSF: 25, monthlyRent: 75, marketMultiple: 1.20 },
      { type: "5x10 Climate", count: 150, occupied: 125, avgSF: 50, monthlyRent: 115, marketMultiple: 1.18 },
      { type: "10x10 Climate", count: 120, occupied: 98, avgSF: 100, monthlyRent: 165, marketMultiple: 1.15 },
      { type: "10x15 Climate", count: 80, occupied: 62, avgSF: 150, monthlyRent: 210, marketMultiple: 1.12 },
      { type: "10x20 Drive-Up", count: 100, occupied: 80, avgSF: 200, monthlyRent: 185, marketMultiple: 1.10 },
      { type: "10x30 Drive-Up", count: 60, occupied: 42, avgSF: 300, monthlyRent: 250, marketMultiple: 1.08 },
      { type: "RV/Boat Outdoor", count: 40, occupied: 35, avgSF: 300, monthlyRent: 175, marketMultiple: 1.05 },
    ],
    MOBILE_HOME_PARK: [
      { type: "Standard Lot", count: deal.units, occupied: Math.round(deal.units * 0.95), avgSF: 4500, monthlyRent: 425, marketMultiple: 1.15 },
    ],
    HOTEL: [
      { type: "King Room", count: 80, occupied: 61, avgSF: 350, monthlyRent: 3712, marketMultiple: 1.10 },
      { type: "Double Queen", count: 30, occupied: 23, avgSF: 400, monthlyRent: 3465, marketMultiple: 1.08 },
      { type: "Suite", count: 10, occupied: 8, avgSF: 550, monthlyRent: 5775, marketMultiple: 1.12 },
    ],
    NNN_RETAIL: [
      { type: "Dollar General #1", count: 1, occupied: 1, avgSF: 9100, monthlyRent: 7583, marketMultiple: 1.05 },
      { type: "Dollar General #2", count: 1, occupied: 1, avgSF: 9100, monthlyRent: 7280, marketMultiple: 1.08 },
      { type: "Dollar General #3", count: 1, occupied: 1, avgSF: 9100, monthlyRent: 7887, marketMultiple: 1.03 },
      { type: "Walgreens", count: 1, occupied: 1, avgSF: 14500, monthlyRent: 18125, marketMultiple: 1.02 },
      { type: "O'Reilly Auto Parts", count: 1, occupied: 1, avgSF: 8200, monthlyRent: 9430, marketMultiple: 1.06 },
    ],
    SENIOR_HOUSING: [
      { type: "Assisted Living (Private)", count: 48, occupied: 43, avgSF: 400, monthlyRent: 5200, marketMultiple: 1.08 },
      { type: "Assisted Living (Semi)", count: 16, occupied: 14, avgSF: 300, monthlyRent: 4500, marketMultiple: 1.10 },
      { type: "Memory Care (Private)", count: 24, occupied: 22, avgSF: 350, monthlyRent: 6800, marketMultiple: 1.06 },
      { type: "Memory Care (Semi)", count: 8, occupied: 7, avgSF: 280, monthlyRent: 5900, marketMultiple: 1.08 },
    ],
    STUDENT_HOUSING: [
      { type: "2BR/2BA (per bed)", count: 160, occupied: 157, avgSF: 350, monthlyRent: 850, marketMultiple: 1.10 },
      { type: "4BR/4BA (per bed)", count: 160, occupied: 157, avgSF: 280, monthlyRent: 750, marketMultiple: 1.12 },
    ],
    BUILD_TO_RENT: [
      { type: "3BR/2BA Type A", count: Math.round(deal.units * 0.6), occupied: 0, avgSF: 1400, monthlyRent: 2050, marketMultiple: 1.00 },
      { type: "3BR/2BA Type B", count: deal.units - Math.round(deal.units * 0.6), occupied: 0, avgSF: 1550, monthlyRent: 2200, marketMultiple: 1.00 },
    ],
  };

  const mix = mixes[deal.propertyType] || mixes.MULTIFAMILY;
  // Adjust for MIXED_USE
  if (deal.propertyType === "MIXED_USE") {
    return [
      { type: "Studio", count: Math.round(deal.units * 0.20), occupied: Math.round(deal.units * 0.20 * 0.96), avgSF: 550, monthlyRent: 1350, marketMultiple: 1.12 },
      { type: "1BR/1BA", count: Math.round(deal.units * 0.45), occupied: Math.round(deal.units * 0.45 * 0.97), avgSF: 750, monthlyRent: 1650, marketMultiple: 1.15 },
      { type: "2BR/2BA", count: deal.units - Math.round(deal.units * 0.20) - Math.round(deal.units * 0.45), occupied: Math.round((deal.units - Math.round(deal.units * 0.20) - Math.round(deal.units * 0.45)) * 0.95), avgSF: 1050, monthlyRent: 2150, marketMultiple: 1.10 },
      { type: "Retail Suite A", count: 1, occupied: 1, avgSF: 7000, monthlyRent: 14583, marketMultiple: 1.08 },
      { type: "Retail Suite B", count: 1, occupied: 1, avgSF: 5000, monthlyRent: 10417, marketMultiple: 1.10 },
    ];
  }
  return mix;
}

type LeaseExpiration = { quarter: string; count: number; pct: number };

function getLeaseExpirations(deal: SampleSyndicationDeal, totalUnits: number): LeaseExpiration[] {
  return [
    { quarter: "Q1 2026", count: Math.round(totalUnits * 0.12), pct: 12 },
    { quarter: "Q2 2026", count: Math.round(totalUnits * 0.15), pct: 15 },
    { quarter: "Q3 2026", count: Math.round(totalUnits * 0.18), pct: 18 },
    { quarter: "Q4 2026", count: Math.round(totalUnits * 0.14), pct: 14 },
    { quarter: "Q1 2027", count: Math.round(totalUnits * 0.11), pct: 11 },
    { quarter: "Q2 2027", count: Math.round(totalUnits * 0.10), pct: 10 },
    { quarter: "H2 2027+", count: Math.round(totalUnits * 0.20), pct: 20 },
  ];
}

type OtherIncomeItem = { name: string; amount: number };

function getOtherIncome(deal: SampleSyndicationDeal): OtherIncomeItem[] {
  const incomes: Record<string, OtherIncomeItem[]> = {
    MULTIFAMILY: [
      { name: "Pet rent ($35/pet, ~40% of units)", amount: Math.round(deal.units * 0.4 * 35) },
      { name: "Parking (covered/garage premium)", amount: Math.round(deal.units * 0.2 * 75) },
      { name: "Laundry/vending", amount: Math.round(deal.units * 12) },
      { name: "Late fees and application fees", amount: Math.round(deal.units * 8) },
      { name: "Storage units ($50-100/month)", amount: Math.round(deal.units * 0.15 * 75) },
    ],
    OFFICE: [
      { name: "Parking (structured, $125/space)", amount: 12500 },
      { name: "Common area charges", amount: 8500 },
      { name: "After-hours HVAC", amount: 3200 },
    ],
    SELF_STORAGE: [
      { name: "Tenant insurance premiums", amount: Math.round(deal.units * 0.6 * 12) },
      { name: "Late fees", amount: Math.round(deal.units * 3) },
      { name: "Merchandise sales (locks, boxes)", amount: 2500 },
    ],
    HOTEL: [
      { name: "Food & beverage", amount: Math.round(deal.units * 120 * 0.76 * 45 / 12) },
      { name: "Meeting room rental", amount: 8500 },
      { name: "Parking", amount: 4200 },
    ],
    MOBILE_HOME_PARK: [
      { name: "Application/transfer fees", amount: Math.round(deal.units * 5) },
      { name: "Laundry income", amount: Math.round(deal.units * 6) },
      { name: "RV storage ($75/space, 15 spaces)", amount: 1125 },
    ],
  };
  return incomes[deal.propertyType] || incomes.MULTIFAMILY;
}

type ExpenseItem = { name: string; amount: number };

function getExpenseBreakdown(deal: SampleSyndicationDeal, egi: number): ExpenseItem[] {
  const ratio = getExpenseRatio(deal);
  const total = Math.round(egi * ratio);

  const breakdowns: Record<string, (t: number) => ExpenseItem[]> = {
    MULTIFAMILY: (t) => [
      { name: "Real Estate Taxes", amount: Math.round(t * 0.28) },
      { name: "Insurance", amount: Math.round(t * 0.12) },
      { name: "Utilities (water/sewer/gas/common electric)", amount: Math.round(t * 0.15) },
      { name: "Repairs & Maintenance", amount: Math.round(t * 0.14) },
      { name: "Management Fee (5% of EGI)", amount: Math.round(egi * 0.05) },
      { name: "Payroll & Benefits", amount: Math.round(t * 0.15) },
      { name: "Marketing & Advertising", amount: Math.round(t * 0.03) },
      { name: "General & Administrative", amount: Math.round(t * 0.05) },
      { name: "Contract Services (landscaping, pest, etc.)", amount: Math.round(t * 0.04) },
      { name: "Turnover Costs", amount: Math.round(t * 0.04) },
    ],
    OFFICE: (t) => [
      { name: "Real Estate Taxes", amount: Math.round(t * 0.30) },
      { name: "Insurance", amount: Math.round(t * 0.08) },
      { name: "Utilities", amount: Math.round(t * 0.18) },
      { name: "Janitorial", amount: Math.round(t * 0.10) },
      { name: "Repairs & Maintenance", amount: Math.round(t * 0.10) },
      { name: "Management Fee (4% of EGI)", amount: Math.round(egi * 0.04) },
      { name: "Landscaping & Grounds", amount: Math.round(t * 0.03) },
      { name: "Security", amount: Math.round(t * 0.04) },
      { name: "General & Administrative", amount: Math.round(t * 0.05) },
    ],
    HOTEL: (t) => [
      { name: "Rooms Department", amount: Math.round(t * 0.25) },
      { name: "Food & Beverage Department", amount: Math.round(t * 0.12) },
      { name: "General & Administrative", amount: Math.round(t * 0.10) },
      { name: "Sales & Marketing", amount: Math.round(t * 0.08) },
      { name: "Property Operations & Maintenance", amount: Math.round(t * 0.08) },
      { name: "Utilities", amount: Math.round(t * 0.08) },
      { name: "Real Estate Taxes", amount: Math.round(t * 0.10) },
      { name: "Insurance", amount: Math.round(t * 0.05) },
      { name: "Management Fee (3% of Gross Revenue)", amount: Math.round(t * 0.07) },
      { name: "FF&E Reserve (4% of Gross Revenue)", amount: Math.round(t * 0.07) },
    ],
    NNN_RETAIL: (t) => [
      { name: "Management Fee (1% of EGI)", amount: Math.round(egi * 0.01) },
      { name: "Insurance (landlord portion)", amount: Math.round(t * 0.30) },
      { name: "General & Administrative", amount: Math.round(t * 0.30) },
      { name: "Professional Fees (legal, accounting)", amount: Math.round(t * 0.40) },
    ],
  };

  const fn = breakdowns[deal.propertyType] || breakdowns.MULTIFAMILY;
  return fn(total);
}

type SalesComp = {
  name: string; address: string; date: string; price: number;
  units: number; pricePerUnit: number; pricePerSF: number; details: string;
};

function getSalesComps(deal: SampleSyndicationDeal): SalesComp[] {
  const basePerUnit = deal.units > 0 ? Math.round(deal.purchasePrice / deal.units) : 0;
  const basePSF = Math.round(deal.purchasePrice / getPropertyDetails(deal).sqft);

  if (deal.propertyType === "MULTIFAMILY" || deal.propertyType === "STUDENT_HOUSING" || deal.propertyType === "SENIOR_HOUSING") {
    return [
      { name: `${deal.propertyType === "MULTIFAMILY" ? "Sunset Ridge Apartments" : deal.propertyType === "STUDENT_HOUSING" ? "Campus Edge" : "Sunrise Senior Living"}`, address: `2.1 miles from subject`, date: "October 2025", price: Math.round(deal.purchasePrice * 1.05), units: Math.round(deal.units * 0.85), pricePerUnit: Math.round(basePerUnit * 1.08), pricePerSF: 0, details: `${deal.yearBuilt + 2} vintage, renovated 2023. ${(getTargetCapRate(deal) * 100 - 0.15).toFixed(2)}% cap rate. Sold by institutional seller.` },
      { name: `${deal.propertyType === "MULTIFAMILY" ? "Willow Creek Village" : deal.propertyType === "STUDENT_HOUSING" ? "University Lofts" : "Heritage Gardens"}`, address: `3.8 miles from subject`, date: "August 2025", price: Math.round(deal.purchasePrice * 0.88), units: Math.round(deal.units * 1.15), pricePerUnit: Math.round(basePerUnit * 0.95), pricePerSF: 0, details: `${deal.yearBuilt - 3} vintage, partially renovated. ${(getTargetCapRate(deal) * 100 + 0.20).toFixed(2)}% cap rate. Value-add buyer.` },
      { name: `${deal.propertyType === "MULTIFAMILY" ? "The Preserve at Oak Park" : deal.propertyType === "STUDENT_HOUSING" ? "The Quad" : "Autumn Hills"}`, address: `5.2 miles from subject`, date: "June 2025", price: Math.round(deal.purchasePrice * 1.12), units: Math.round(deal.units * 1.3), pricePerUnit: Math.round(basePerUnit * 1.02), pricePerSF: 0, details: `${deal.yearBuilt + 5} vintage, excellent condition. ${(getTargetCapRate(deal) * 100 - 0.25).toFixed(2)}% cap rate. 1031 exchange buyer.` },
    ];
  }

  return [
    { name: "Comparable Sale 1", address: "2.5 miles from subject", date: "November 2025", price: Math.round(deal.purchasePrice * 1.03), units: 0, pricePerUnit: 0, pricePerSF: Math.round(basePSF * 1.05), details: `Similar quality, ${(getTargetCapRate(deal) * 100 - 0.10).toFixed(2)}% cap rate. Institutional buyer.` },
    { name: "Comparable Sale 2", address: "4.0 miles from subject", date: "September 2025", price: Math.round(deal.purchasePrice * 0.92), units: 0, pricePerUnit: 0, pricePerSF: Math.round(basePSF * 0.96), details: `Slightly inferior location, ${(getTargetCapRate(deal) * 100 + 0.15).toFixed(2)}% cap rate. Private buyer.` },
    { name: "Comparable Sale 3", address: "6.1 miles from subject", date: "July 2025", price: Math.round(deal.purchasePrice * 1.08), units: 0, pricePerUnit: 0, pricePerSF: Math.round(basePSF * 1.01), details: `Superior condition, ${(getTargetCapRate(deal) * 100 - 0.20).toFixed(2)}% cap rate. REIT acquisition.` },
  ];
}

function getSellerName(deal: SampleSyndicationDeal): string {
  const h = hashCode(deal.id);
  const names = ["Greystone Properties, LLC", "Pacific Realty Holdings, LLC", "Meridian Capital Partners, LLC", "Atlas Property Group, LLC", "Heritage Investment Company, LLC"];
  return names[h % names.length];
}

function getSellerAddress(_deal: SampleSyndicationDeal): string {
  return "1800 Century Park East, Suite 1200\nLos Angeles, CA 90067";
}

function getEscrowAgent(_deal: SampleSyndicationDeal): string {
  return "First American Title Insurance Company";
}

function getDueDiligenceExpiry(days: number): string {
  const d = new Date(2026, 0, 20 + days);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getLender(deal: SampleSyndicationDeal): string {
  if (deal.loanAmount > 15_000_000) return "Freddie Mac (SBL or conventional) / CBRE Capital Markets";
  if (deal.propertyType === "HOTEL") return "Stonehill Strategic Capital / Ready Capital";
  if (deal.propertyType === "SELF_STORAGE") return "KeyBank Real Estate Capital";
  return "Arbor Realty Trust / Walker & Dunlop";
}

function getClosingAttorney(deal: SampleSyndicationDeal): string {
  const state = deal.propertyAddress.split(", ").pop()?.split(" ")[0] || "";
  if (state === "TX") return "Winstead PC, Austin, Texas";
  if (state === "FL") return "Shutts & Bowen LLP, Miami, Florida";
  if (state === "AZ") return "Snell & Wilmer LLP, Phoenix, Arizona";
  return "Holland & Knight LLP";
}

function getTitleCompany(_deal: SampleSyndicationDeal): string {
  return "First American Title Insurance Company";
}

function getTransferTax(deal: SampleSyndicationDeal): string {
  const state = deal.propertyAddress.split(", ").pop()?.split(" ")[0] || "";
  if (state === "TX") return "None (Texas has no transfer tax)";
  if (state === "FL") return "$0.70 per $100 (Florida documentary stamp tax)";
  if (state === "AZ") return "$2.00 flat (Arizona affidavit of value fee)";
  if (state === "NC") return "$1.00 per $500 (North Carolina excise tax)";
  if (state === "OH") return "$1.00 per $1,000 (Ohio conveyance fee)";
  if (state === "SC") return "$1.85 per $500 (South Carolina deed stamp)";
  return "Per applicable state and local transfer tax schedule";
}

function getVenue(deal: SampleSyndicationDeal): string {
  const addr = deal.propertyAddress;
  if (addr.includes("AZ")) return "Maricopa County Superior Court, Arizona";
  if (addr.includes("TX") && addr.includes("San Antonio")) return "Bexar County District Court, Texas";
  if (addr.includes("TX") && addr.includes("Austin")) return "Travis County District Court, Texas";
  if (addr.includes("TX") && addr.includes("Georgetown")) return "Williamson County District Court, Texas";
  if (addr.includes("FL") && addr.includes("Tampa")) return "Hillsborough County Circuit Court, Florida";
  if (addr.includes("FL") && addr.includes("Jacksonville")) return "Duval County Circuit Court, Florida";
  if (addr.includes("FL") && addr.includes("Sarasota")) return "Sarasota County Circuit Court, Florida";
  if (addr.includes("FL") && addr.includes("Gainesville")) return "Alachua County Circuit Court, Florida";
  if (addr.includes("NC")) return "Wake County Superior Court, North Carolina";
  if (addr.includes("OH")) return "Franklin County Court of Common Pleas, Ohio";
  if (addr.includes("SC")) return "Charleston County Court of Common Pleas, South Carolina";
  return "Delaware Court of Chancery";
}

// ─────────────────────────────────────────────────────────────────
// Main exports
// ─────────────────────────────────────────────────────────────────

export function getSyndicationSourceDocs(dealId: string): Record<string, string> {
  const deal = SAMPLE_SYNDICATION_DEALS.find((d) => d.id === dealId);
  if (!deal) throw new Error(`Syndication sample deal not found: ${dealId}`);

  return {
    property_appraisal: generatePropertyAppraisal(deal),
    rent_roll: generateRentRoll(deal),
    property_financials: generatePropertyFinancials(deal),
    purchase_contract: generatePurchaseContract(deal),
  };
}

export function getAllSyndicationSourceDocs(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const deal of SAMPLE_SYNDICATION_DEALS) {
    result[deal.id] = getSyndicationSourceDocs(deal.id);
  }
  return result;
}
