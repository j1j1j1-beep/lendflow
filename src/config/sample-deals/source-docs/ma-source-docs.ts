/**
 * Source Document OCR Text — Deals/M&A Module (8 deals × 4 required docs = 32 docs)
 *
 * Required source doc types:
 *   1. target_financials — Target Company Financials
 *   2. target_tax_returns — Target Tax Returns
 *   3. articles_of_incorporation — Articles of Incorporation
 *   4. material_contracts — Material Contracts List
 *
 * Each function returns Record<docType, ocrText> for pipeline injection.
 * All financials are internally consistent with purchase price multiples.
 */

import { SAMPLE_MA_DEALS, type SampleMADeal } from "../deals";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// ─────────────────────────────────────────────────────────────────
// Target Company Financials — audited P&L + balance sheet
// ─────────────────────────────────────────────────────────────────

function generateTargetFinancials(deal: SampleMADeal): string {
  // Derive financials from purchase price using industry-standard multiples
  const evMultiple = getEVMultiple(deal);
  const ebitda = Math.round(deal.purchasePrice / evMultiple);
  const revenue = Math.round(ebitda / getEbitdaMargin(deal));
  const cogs = Math.round(revenue * getCOGSPercent(deal));
  const grossProfit = revenue - cogs;
  const sgaExpense = Math.round(revenue * getSGAPercent(deal));
  const depAmort = Math.round(revenue * 0.03);
  const operatingIncome = grossProfit - sgaExpense - depAmort;
  const interestExpense = Math.round(deal.purchasePrice * 0.01);
  const preTaxIncome = operatingIncome - interestExpense;
  const taxProvision = Math.round(preTaxIncome * 0.25);
  const netIncome = preTaxIncome - taxProvision;

  // Balance sheet
  const totalAssets = Math.round(deal.purchasePrice * 0.85);
  const cash = Math.round(totalAssets * 0.12);
  const receivables = Math.round(revenue * 0.12);
  const inventory = deal.targetIndustry.includes("Retail") ? Math.round(revenue * 0.15) : Math.round(revenue * 0.05);
  const currentAssets = cash + receivables + inventory;
  const ppe = Math.round(totalAssets * 0.25);
  const intangibles = Math.round(totalAssets * 0.20);
  const goodwill = totalAssets - currentAssets - ppe - intangibles;
  const currentLiabilities = Math.round(receivables * 1.1);
  const longTermDebt = Math.round(totalAssets * 0.25);
  const totalLiabilities = currentLiabilities + longTermDebt;
  const equity = totalAssets - totalLiabilities;

  // Prior year (5% growth)
  const priorRevenue = Math.round(revenue / 1.05);
  const priorEbitda = Math.round(ebitda / 1.05);

  return `${deal.targetCompany.toUpperCase()}
AUDITED FINANCIAL STATEMENTS
FOR THE FISCAL YEARS ENDED DECEMBER 31, 2025 AND 2024

INDEPENDENT AUDITOR'S REPORT

To the Board of Directors and Shareholders of ${deal.targetCompany}

Opinion
We have audited the accompanying financial statements of ${deal.targetCompany}, which comprise the balance sheets as of December 31, 2025 and 2024, and the related statements of operations, comprehensive income, stockholders' equity, and cash flows for the years then ended, and the related notes to the financial statements.

In our opinion, the financial statements referred to above present fairly, in all material respects, the financial position of ${deal.targetCompany} as of December 31, 2025 and 2024, and the results of its operations and its cash flows for the years then ended in accordance with accounting principles generally accepted in the United States of America.

Basis for Opinion
We conducted our audit in accordance with auditing standards generally accepted in the United States of America (GAAS). Our responsibilities under those standards are further described in the Auditor's Responsibilities section. We are independent of the Company in accordance with the relevant ethical requirements.

[Signature]
Grant Thornton LLP
January 28, 2026

---

CONSOLIDATED STATEMENTS OF OPERATIONS
(In thousands)
                                    FY 2025         FY 2024
Revenue                           $${fmt(revenue)}      $${fmt(priorRevenue)}
Cost of revenue                   (${fmt(cogs)})      (${fmt(Math.round(cogs / 1.05))})
                                  ---------       ---------
Gross profit                       ${fmt(grossProfit)}       ${fmt(Math.round(grossProfit / 1.05))}
Gross margin                       ${(grossProfit / revenue * 100).toFixed(1)}%         ${(grossProfit / revenue * 100).toFixed(1)}%

Operating expenses:
  Selling, general & admin        (${fmt(sgaExpense)})      (${fmt(Math.round(sgaExpense / 1.05))})
  Depreciation & amortization     (${fmt(depAmort)})       (${fmt(Math.round(depAmort / 1.05))})
                                  ---------       ---------
Operating income                   ${fmt(operatingIncome)}       ${fmt(Math.round(operatingIncome / 1.05))}

Interest expense                  (${fmt(interestExpense)})       (${fmt(Math.round(interestExpense * 1.02))})
                                  ---------       ---------
Income before taxes                ${fmt(preTaxIncome)}       ${fmt(Math.round(preTaxIncome / 1.05))}
Income tax provision              (${fmt(taxProvision)})      (${fmt(Math.round(taxProvision / 1.05))})
                                  ---------       ---------
Net income                        $${fmt(netIncome)}      $${fmt(Math.round(netIncome / 1.05))}

EBITDA                            $${fmt(ebitda)}      $${fmt(priorEbitda)}
EBITDA Margin                      ${(ebitda / revenue * 100).toFixed(1)}%         ${(priorEbitda / priorRevenue * 100).toFixed(1)}%

---

CONSOLIDATED BALANCE SHEET
As of December 31, 2025
(In thousands)

ASSETS
Current assets:
  Cash and cash equivalents       $${fmt(cash)}
  Accounts receivable, net         ${fmt(receivables)}
  Inventory                        ${fmt(inventory)}
  Prepaid expenses                 ${fmt(Math.round(revenue * 0.02))}
                                  ---------
Total current assets               ${fmt(currentAssets + Math.round(revenue * 0.02))}

Property and equipment, net        ${fmt(ppe)}
Intangible assets, net             ${fmt(intangibles)}
Goodwill                           ${fmt(goodwill > 0 ? goodwill : 0)}
Other assets                       ${fmt(Math.round(totalAssets * 0.03))}
                                  ---------
Total assets                      $${fmt(totalAssets)}

LIABILITIES AND STOCKHOLDERS' EQUITY
Current liabilities:
  Accounts payable                $${fmt(Math.round(currentLiabilities * 0.5))}
  Accrued expenses                 ${fmt(Math.round(currentLiabilities * 0.35))}
  Current portion of LTD           ${fmt(Math.round(currentLiabilities * 0.15))}
                                  ---------
Total current liabilities          ${fmt(currentLiabilities)}

Long-term debt                     ${fmt(longTermDebt)}
Deferred tax liabilities           ${fmt(Math.round(totalAssets * 0.05))}
                                  ---------
Total liabilities                  ${fmt(totalLiabilities + Math.round(totalAssets * 0.05))}

Stockholders' equity               ${fmt(equity - Math.round(totalAssets * 0.05))}
                                  ---------
Total liabilities and equity      $${fmt(totalAssets)}

---

KEY FINANCIAL METRICS

Revenue (FY 2025):                $${fmt(revenue)}
Revenue Growth (YoY):              5.0%
EBITDA:                           $${fmt(ebitda)}
EBITDA Margin:                     ${(ebitda / revenue * 100).toFixed(1)}%
Net Income:                       $${fmt(netIncome)}
Total Debt:                       $${fmt(longTermDebt + Math.round(currentLiabilities * 0.15))}
Net Debt:                         $${fmt(longTermDebt + Math.round(currentLiabilities * 0.15) - cash)}
Employees:                         ${getEmployeeCount(deal)}`;
}

// ─────────────────────────────────────────────────────────────────
// Target Tax Returns — Federal Form 1120 summary
// ─────────────────────────────────────────────────────────────────

function generateTargetTaxReturns(deal: SampleMADeal): string {
  const evMultiple = getEVMultiple(deal);
  const ebitda = Math.round(deal.purchasePrice / evMultiple);
  const revenue = Math.round(ebitda / getEbitdaMargin(deal));
  const taxableIncome = Math.round(ebitda * 0.75);
  const federalTax = Math.round(taxableIncome * 0.21);
  const stateTax = Math.round(taxableIncome * 0.05);
  const depAmort = Math.round(revenue * 0.03);
  const compensation = Math.round(revenue * getSGAPercent(deal) * 0.6);

  return `FORM 1120 — U.S. CORPORATION INCOME TAX RETURN
Department of the Treasury — Internal Revenue Service

Tax Year: January 1, 2025 — December 31, 2025
Date Filed: March 15, 2026 (Extension filed)

A. Name: ${deal.targetCompany}
B. Employer Identification Number: ${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 9000000 + 1000000)}
C. Date Incorporated: ${2025 - Math.floor(Math.random() * 15 + 5)}
D. State of Incorporation: ${deal.governingLaw}
E. Total Assets (end of year): $${fmt(Math.round(deal.purchasePrice * 0.85))}

INCOME
1a. Gross receipts or sales                    $${fmt(revenue)}
1b. Returns and allowances                     (${fmt(Math.round(revenue * 0.005))})
1c. Net receipts                               $${fmt(Math.round(revenue * 0.995))}
2. Cost of goods sold (Schedule A)             (${fmt(Math.round(revenue * getCOGSPercent(deal)))})
3. Gross profit                                $${fmt(Math.round(revenue * (1 - getCOGSPercent(deal))))}
4. Dividends (Schedule C)                       ${fmt(0)}
5. Interest income                              ${fmt(Math.round(revenue * 0.002))}
6. Gross rents                                  ${fmt(0)}
7. Gross royalties                              ${fmt(0)}
8. Capital gain net income                      ${fmt(0)}
9. Net gain or loss (Form 4797)                 ${fmt(0)}
10. Other income                                ${fmt(Math.round(revenue * 0.005))}
11. TOTAL INCOME                               $${fmt(Math.round(revenue * (1 - getCOGSPercent(deal)) + revenue * 0.007))}

DEDUCTIONS
12. Compensation of officers                   $${fmt(Math.round(compensation * 0.15))}
13. Salaries and wages                          ${fmt(Math.round(compensation * 0.85))}
14. Repairs and maintenance                     ${fmt(Math.round(revenue * 0.01))}
15. Bad debts                                   ${fmt(Math.round(revenue * 0.003))}
16. Rents                                       ${fmt(Math.round(revenue * 0.03))}
17. Taxes and licenses                          ${fmt(Math.round(revenue * 0.02))}
18. Interest                                    ${fmt(Math.round(deal.purchasePrice * 0.01))}
19. Charitable contributions                    ${fmt(Math.round(revenue * 0.001))}
20. Depreciation (Form 4562)                    ${fmt(depAmort)}
21. Depletion                                   ${fmt(0)}
22. Advertising                                 ${fmt(Math.round(revenue * 0.02))}
23. Pension, profit-sharing plans               ${fmt(Math.round(compensation * 0.04))}
24. Employee benefit programs                   ${fmt(Math.round(compensation * 0.08))}
25. Reserved
26. Other deductions (attach statement)         ${fmt(Math.round(revenue * 0.03))}
27. TOTAL DEDUCTIONS                           $${fmt(Math.round(revenue * (1 - getCOGSPercent(deal)) - taxableIncome + revenue * 0.007))}

28. Taxable income before NOL deduction         $${fmt(taxableIncome)}
29a. Net operating loss deduction                ${fmt(0)}
29b. Special deductions                          ${fmt(0)}
30. Taxable income                             $${fmt(taxableIncome)}
31. Total tax (Schedule J)                     $${fmt(federalTax)}
    Federal income tax rate                      21.0%

SCHEDULE J — TAX COMPUTATION
1. Federal income tax (21% of line 30)         $${fmt(federalTax)}
2. Alternative minimum tax                      ${fmt(0)}
5. Total tax                                   $${fmt(federalTax)}
6. Estimated tax payments                       ${fmt(Math.round(federalTax * 0.9))}
7. Tax due (overpayment)                       $${fmt(Math.round(federalTax * 0.1))}

---

STATE TAX RETURN — ${deal.governingLaw.toUpperCase()}
Taxable income apportioned to state            $${fmt(taxableIncome)}
State income tax rate                            ${(stateTax / taxableIncome * 100).toFixed(2)}%
State income tax                               $${fmt(stateTax)}

---

FORM 1120 — TAX YEAR 2024

Gross receipts                                 $${fmt(Math.round(revenue / 1.05))}
Taxable income                                 $${fmt(Math.round(taxableIncome / 1.05))}
Federal income tax                             $${fmt(Math.round(federalTax / 1.05))}

---

FORM 1120 — TAX YEAR 2023

Gross receipts                                 $${fmt(Math.round(revenue / 1.10))}
Taxable income                                 $${fmt(Math.round(taxableIncome / 1.10))}
Federal income tax                             $${fmt(Math.round(federalTax / 1.10))}

3-YEAR TAX SUMMARY
                        FY 2025     FY 2024     FY 2023
Gross Receipts        $${fmt(revenue)}  $${fmt(Math.round(revenue / 1.05))}  $${fmt(Math.round(revenue / 1.10))}
Taxable Income        $${fmt(taxableIncome)}  $${fmt(Math.round(taxableIncome / 1.05))}  $${fmt(Math.round(taxableIncome / 1.10))}
Federal Tax           $${fmt(federalTax)}   $${fmt(Math.round(federalTax / 1.05))}   $${fmt(Math.round(federalTax / 1.10))}
Effective Rate          21.0%       21.0%       21.0%

No material tax controversies, audits, or pending disputes with the IRS or state tax authorities.
All returns filed timely. No NOL carryforwards or carrybacks.`;
}

// ─────────────────────────────────────────────────────────────────
// Articles of Incorporation
// ─────────────────────────────────────────────────────────────────

function generateArticlesOfIncorporation(deal: SampleMADeal): string {
  const isCorp = deal.targetCompany.includes("Inc.") || deal.targetCompany.includes("Corporation");
  const isLLC = deal.targetCompany.includes("LLC");
  const formYear = 2025 - Math.floor(Math.random() * 15 + 5);

  if (isLLC) {
    return `STATE OF ${deal.governingLaw.toUpperCase()}
SECRETARY OF STATE

CERTIFICATE OF FORMATION
OF
${deal.targetCompany.toUpperCase()}

Filed: ${getMonthName(Math.floor(Math.random() * 12))} ${Math.floor(Math.random() * 28 + 1)}, ${formYear}
File Number: ${Math.floor(Math.random() * 9000000 + 1000000)}

FIRST: The name of the limited liability company is ${deal.targetCompany}.

SECOND: The address of its registered office in the State of ${deal.governingLaw} is Corporation Trust Center, 1209 Orange Street, Wilmington, New Castle County, Delaware 19801. The name of its registered agent at such address is The Corporation Trust Company.

THIRD: The purpose of the limited liability company is to engage in any lawful act or activity for which limited liability companies may be formed under the Delaware Limited Liability Company Act.

IN WITNESS WHEREOF, the undersigned has executed this Certificate of Formation on ${getMonthName(Math.floor(Math.random() * 12))} ${Math.floor(Math.random() * 28 + 1)}, ${formYear}.

[Authorized Person Signature]

---

CERTIFICATE OF GOOD STANDING

I, the Secretary of State of the State of ${deal.governingLaw}, do hereby certify that ${deal.targetCompany}, formed on the date noted above, is in good standing and has a legal existence so far as the records of this office show as of January 10, 2026.

---

OPERATING AGREEMENT SUMMARY (EXCERPTS)

Members: See Schedule A (Member List)
Manager: Board of Managers (3 members)
Membership Interests: 1,000,000 authorized units
Tax Classification: Partnership (default for multi-member LLC)
Fiscal Year: Calendar year ending December 31
Distribution Policy: As determined by Board of Managers
Transfer Restrictions: Right of first refusal; board consent required
Dissolution Events: Per Section 12 of Operating Agreement

AMENDMENTS:
- Amendment No. 1 (${formYear + 2}): Increased authorized units to 2,000,000
- Amendment No. 2 (${formYear + 4}): Added Series B preferred units
${deal.purchasePrice > 119500000 ? "- Amendment No. 3 (" + (formYear + 5) + "): Anti-dilution provisions added" : ""}`;
  }

  return `STATE OF ${deal.governingLaw.toUpperCase()}
SECRETARY OF STATE
DIVISION OF CORPORATIONS

CERTIFICATE OF INCORPORATION
OF
${deal.targetCompany.toUpperCase()}

Filed: ${getMonthName(Math.floor(Math.random() * 12))} ${Math.floor(Math.random() * 28 + 1)}, ${formYear}
File Number: ${Math.floor(Math.random() * 9000000 + 1000000)}

ARTICLE I — NAME
The name of the corporation is ${deal.targetCompany}.

ARTICLE II — REGISTERED AGENT
The address of the corporation's registered office in the State of ${deal.governingLaw} is Corporation Trust Center, 1209 Orange Street, Wilmington, New Castle County, Delaware 19801. The name of its registered agent at such address is The Corporation Trust Company.

ARTICLE III — PURPOSE
The purpose of the corporation is to engage in any lawful act or activity for which corporations may be organized under the General Corporation Law of the State of ${deal.governingLaw}.

ARTICLE IV — AUTHORIZED SHARES
The total number of shares of stock which the corporation shall have authority to issue is:
  Common Stock: 100,000,000 shares, par value $0.001 per share
  Preferred Stock: 10,000,000 shares, par value $0.001 per share

The Board of Directors is hereby authorized to provide for the issuance of the Preferred Stock in one or more series with such rights, preferences, and privileges as may be determined.

ARTICLE V — BOARD OF DIRECTORS
The business and affairs of the corporation shall be managed by or under the direction of the Board of Directors. The number of directors shall be fixed from time to time by resolution of the Board, but shall be no less than three (3) and no more than nine (9).

The current Board of Directors consists of:
${getBoardMembers(deal)}

ARTICLE VI — LIABILITY LIMITATION
A director of the corporation shall not be personally liable to the corporation or its stockholders for monetary damages for breach of fiduciary duty as a director, except to the extent such exemption from liability is not permitted under the Delaware General Corporation Law as in effect at the time such liability is determined.

ARTICLE VII — INDEMNIFICATION
The corporation shall indemnify its directors and officers to the fullest extent permitted by the Delaware General Corporation Law.

ARTICLE VIII — AMENDMENT
The corporation reserves the right to amend or repeal any provision contained in this Certificate of Incorporation in the manner prescribed by the laws of the State of ${deal.governingLaw}.

---

BYLAWS SUMMARY (KEY PROVISIONS)
Annual Meeting: Second Tuesday of March
Record Date: Set by Board, not less than 10 or more than 60 days before meeting
Quorum: Majority of shares entitled to vote
Board Meetings: Quarterly, with special meetings on 48 hours notice
Fiscal Year: Calendar year ending December 31
Officers: CEO, CFO, General Counsel, Corporate Secretary

---

CERTIFICATE OF GOOD STANDING

I, the Secretary of State of the State of ${deal.governingLaw}, do hereby certify that ${deal.targetCompany}, incorporated on the date noted above, is in good standing and has a legal existence so far as the records of this office show.

Issued: January 10, 2026`;
}

// ─────────────────────────────────────────────────────────────────
// Material Contracts List
// ─────────────────────────────────────────────────────────────────

function generateMaterialContracts(deal: SampleMADeal): string {
  const evMultiple = getEVMultiple(deal);
  const ebitda = Math.round(deal.purchasePrice / evMultiple);
  const revenue = Math.round(ebitda / getEbitdaMargin(deal));
  const contracts = getMaterialContractsForIndustry(deal, revenue);

  let text = `${deal.targetCompany.toUpperCase()}
SCHEDULE OF MATERIAL CONTRACTS
As of January 15, 2026

Prepared in connection with the proposed ${deal.transactionType.replace(/_/g, " ").toLowerCase()} transaction.

The following is a complete list of all material contracts, agreements, and commitments to which the Company is a party or by which it or its properties are bound, having an aggregate value in excess of $${fmt(Math.round(revenue * 0.01))} or that are otherwise material to the business, operations, or financial condition of the Company.

---

`;

  for (let i = 0; i < contracts.length; i++) {
    text += `CONTRACT ${i + 1}: ${contracts[i].title}
Type: ${contracts[i].type}
Counterparty: ${contracts[i].counterparty}
Effective Date: ${contracts[i].effectiveDate}
Expiration: ${contracts[i].expiration}
Annual Value: $${fmt(contracts[i].annualValue)}
Change of Control: ${contracts[i].changeOfControl}
Assignment: ${contracts[i].assignment}
Key Terms: ${contracts[i].keyTerms}

`;
  }

  text += `---

SUMMARY
Total Material Contracts: ${contracts.length}
Contracts with Change-of-Control Provisions: ${contracts.filter(c => c.changeOfControl.includes("consent") || c.changeOfControl.includes("terminat")).length}
Contracts Requiring Assignment Consent: ${contracts.filter(c => c.assignment.includes("consent")).length}
Aggregate Annual Contract Value: $${fmt(contracts.reduce((sum, c) => sum + c.annualValue, 0))}

CERTIFICATION
The undersigned officer of ${deal.targetCompany} hereby certifies that the foregoing list is complete and accurate as of the date set forth above, and that no material contracts have been entered into, modified, or terminated since such date.

[Signature]
Chief Financial Officer
${deal.targetCompany}
January 15, 2026`;

  return text;
}

// ─────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────

function getEVMultiple(deal: SampleMADeal): number {
  const multiples: Record<string, number> = {
    "Healthcare Technology": 12,
    "Restaurant / Food Service": 8,
    "Insurance Brokerage": 10,
    "Logistics Technology": 11,
    "Defense Technology": 14,
    "Biotechnology / Pharmaceuticals": 18,
    "Enterprise Data Analytics": 15,
    "Specialty Retail": 5,
  };
  return multiples[deal.targetIndustry] || 10;
}

function getEbitdaMargin(deal: SampleMADeal): number {
  const margins: Record<string, number> = {
    "Healthcare Technology": 0.30,
    "Restaurant / Food Service": 0.12,
    "Insurance Brokerage": 0.25,
    "Logistics Technology": 0.22,
    "Defense Technology": 0.20,
    "Biotechnology / Pharmaceuticals": 0.15,
    "Enterprise Data Analytics": 0.28,
    "Specialty Retail": 0.08,
  };
  return margins[deal.targetIndustry] || 0.20;
}

function getCOGSPercent(deal: SampleMADeal): number {
  const cogs: Record<string, number> = {
    "Healthcare Technology": 0.25,
    "Restaurant / Food Service": 0.55,
    "Insurance Brokerage": 0.30,
    "Logistics Technology": 0.40,
    "Defense Technology": 0.45,
    "Biotechnology / Pharmaceuticals": 0.35,
    "Enterprise Data Analytics": 0.20,
    "Specialty Retail": 0.65,
  };
  return cogs[deal.targetIndustry] || 0.40;
}

function getSGAPercent(deal: SampleMADeal): number {
  const sga: Record<string, number> = {
    "Healthcare Technology": 0.35,
    "Restaurant / Food Service": 0.28,
    "Insurance Brokerage": 0.38,
    "Logistics Technology": 0.30,
    "Defense Technology": 0.28,
    "Biotechnology / Pharmaceuticals": 0.40,
    "Enterprise Data Analytics": 0.40,
    "Specialty Retail": 0.22,
  };
  return sga[deal.targetIndustry] || 0.30;
}

function getEmployeeCount(deal: SampleMADeal): string {
  const empPerMil: Record<string, number> = {
    "Healthcare Technology": 5,
    "Restaurant / Food Service": 35,
    "Insurance Brokerage": 4,
    "Logistics Technology": 8,
    "Defense Technology": 6,
    "Biotechnology / Pharmaceuticals": 3,
    "Enterprise Data Analytics": 4,
    "Specialty Retail": 40,
  };
  const ratio = empPerMil[deal.targetIndustry] || 5;
  return fmt(Math.round(deal.purchasePrice / 1_000_000 * ratio));
}

function getMonthName(idx: number): string {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][idx];
}

function getBoardMembers(deal: SampleMADeal): string {
  const names = [
    "Dr. Patricia L. Morrison — Independent Director (Chair)",
    "James T. Henderson — Director (CEO)",
    "Maria C. Fernandez — Independent Director",
    "Robert K. Yamamoto — Independent Director",
    "Sandra D. Williams — Director (CFO)",
  ];
  return names.slice(0, deal.purchasePrice > 200_000_000 ? 5 : 3).map(n => `  - ${n}`).join("\n");
}

type MaterialContract = {
  title: string;
  type: string;
  counterparty: string;
  effectiveDate: string;
  expiration: string;
  annualValue: number;
  changeOfControl: string;
  assignment: string;
  keyTerms: string;
};

function getMaterialContractsForIndustry(deal: SampleMADeal, revenue: number): MaterialContract[] {
  const baseContracts: MaterialContract[] = [
    {
      title: "Office Lease Agreement",
      type: "Real Property Lease",
      counterparty: "Meridian Properties, LLC",
      effectiveDate: "March 1, 2022",
      expiration: "February 28, 2029",
      annualValue: Math.round(revenue * 0.03),
      changeOfControl: "Landlord consent required for change of control",
      assignment: "Not assignable without landlord consent",
      keyTerms: "Triple net lease with 3% annual escalations. Early termination penalty of 12 months rent.",
    },
    {
      title: "Employment Agreement — CEO",
      type: "Executive Employment",
      counterparty: "Chief Executive Officer",
      effectiveDate: "January 1, 2024",
      expiration: "December 31, 2026 (auto-renews)",
      annualValue: Math.round(revenue * 0.005),
      changeOfControl: "Double trigger acceleration of equity. 18-month severance on CIC termination.",
      assignment: "Personal services; not assignable",
      keyTerms: "2-year non-compete (sale-of-business exception applies). Section 280G gross-up provision.",
    },
    {
      title: "Credit Facility Agreement",
      type: "Revolving Credit Facility",
      counterparty: "JPMorgan Chase Bank, N.A. (as Administrative Agent)",
      effectiveDate: "June 15, 2023",
      expiration: "June 15, 2028",
      annualValue: Math.round(revenue * 0.02),
      changeOfControl: "Mandatory prepayment on change of control. Event of default trigger.",
      assignment: "Lender consent required for borrower assignment",
      keyTerms: `$${fmt(Math.round(revenue * 0.15))} revolving facility. SOFR + 225 bps. Financial covenants: Total Leverage < 3.5x, Fixed Charge Coverage > 1.25x.`,
    },
    {
      title: "Professional Liability Insurance",
      type: "Insurance Policy",
      counterparty: "AIG / National Union Fire Insurance Company",
      effectiveDate: "January 1, 2026",
      expiration: "January 1, 2027",
      annualValue: Math.round(revenue * 0.005),
      changeOfControl: "Policy may be cancelled by insurer on change of control",
      assignment: "Not assignable",
      keyTerms: `$${fmt(Math.round(deal.purchasePrice * 0.1))} D&O liability. $${fmt(Math.round(deal.purchasePrice * 0.05))} E&O coverage. Tail coverage available for 6 years.`,
    },
  ];

  // Add industry-specific contracts
  const industryContracts: MaterialContract[] = getIndustrySpecificContracts(deal, revenue);

  return [...baseContracts, ...industryContracts];
}

function getIndustrySpecificContracts(deal: SampleMADeal, revenue: number): MaterialContract[] {
  switch (deal.targetIndustry) {
    case "Healthcare Technology":
      return [
        {
          title: "Master Services Agreement — Hospital Network",
          type: "Customer Contract",
          counterparty: "HCA Healthcare (12 facilities)",
          effectiveDate: "April 1, 2023",
          expiration: "March 31, 2028",
          annualValue: Math.round(revenue * 0.18),
          changeOfControl: "Consent required; 90-day notice period",
          assignment: "Not assignable without customer consent",
          keyTerms: "SaaS subscription. 99.9% uptime SLA. BAA and HIPAA compliance required. Annual price escalator tied to CPI.",
        },
        {
          title: "AWS Cloud Infrastructure Agreement",
          type: "Technology / Hosting",
          counterparty: "Amazon Web Services, Inc.",
          effectiveDate: "January 1, 2025",
          expiration: "December 31, 2027",
          annualValue: Math.round(revenue * 0.08),
          changeOfControl: "No restriction",
          assignment: "Assignable with AWS consent (not unreasonably withheld)",
          keyTerms: "Enterprise support tier. Committed spend agreement with volume discounts. HIPAA-eligible services.",
        },
      ];
    case "Restaurant / Food Service":
      return [
        {
          title: "Master Franchise Agreement",
          type: "Franchise License",
          counterparty: "Harvest Kitchen Franchising, LLC",
          effectiveDate: "June 1, 2018",
          expiration: "May 31, 2038",
          annualValue: Math.round(revenue * 0.06),
          changeOfControl: "Franchisor approval required. Successor must meet financial qualifications.",
          assignment: "Franchisor consent required; ROFR applies",
          keyTerms: "22 locations. 6% royalty on gross sales. 2% national ad fund. Territory exclusivity within defined DMAs.",
        },
        {
          title: "Food Distribution Agreement",
          type: "Supply Agreement",
          counterparty: "Sysco Corporation",
          effectiveDate: "January 1, 2025",
          expiration: "December 31, 2027",
          annualValue: Math.round(revenue * 0.25),
          changeOfControl: "No restriction; may be terminated on 90-day notice",
          assignment: "Assignable with notice",
          keyTerms: "Primary food distributor for all 22 locations. Volume-based pricing tiers. Quarterly rebate program.",
        },
      ];
    default:
      return [
        {
          title: "Enterprise Customer Master Agreement",
          type: "Customer Contract",
          counterparty: "Top 3 Customers (aggregated)",
          effectiveDate: "Various (2022-2025)",
          expiration: "Various (2026-2029)",
          annualValue: Math.round(revenue * 0.35),
          changeOfControl: "Consent required for 2 of 3 agreements",
          assignment: "Not assignable without customer consent",
          keyTerms: `Top 3 customers represent ${Math.round(revenue * 0.35 / revenue * 100)}% of revenue. Auto-renewing with 90-day termination notice.`,
        },
        {
          title: "Technology License Agreement",
          type: "IP License",
          counterparty: "Various third-party licensors",
          effectiveDate: "Various",
          expiration: "Various",
          annualValue: Math.round(revenue * 0.04),
          changeOfControl: "Two licenses require consent on change of control",
          assignment: "Licensor consent required for assignment",
          keyTerms: "Perpetual licenses for core platform components. Annual maintenance fees. Source code escrow for 3 critical licenses.",
        },
      ];
  }
}

// ─────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────

export function getMASourceDocs(dealId: string): Record<string, string> {
  const deal = SAMPLE_MA_DEALS.find((d) => d.id === dealId);
  if (!deal) throw new Error(`M&A sample deal not found: ${dealId}`);

  return {
    target_financials: generateTargetFinancials(deal),
    target_tax_returns: generateTargetTaxReturns(deal),
    articles_of_incorporation: generateArticlesOfIncorporation(deal),
    material_contracts: generateMaterialContracts(deal),
  };
}

export function getAllMASourceDocs(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const deal of SAMPLE_MA_DEALS) {
    result[deal.id] = getMASourceDocs(deal.id);
  }
  return result;
}
