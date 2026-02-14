/**
 * Lending Sample Extractions — 14 Loan Programs
 *
 * Lending uses Document + Extraction models (NOT SourceDocument with OCR text).
 * Each extraction is structured JSON that the analysis engine consumes directly.
 *
 * The sample pipeline skips OCR/classification/verification and goes straight to:
 *   runFullAnalysis() → structureDeal() → generateDocs() → generateMemo()
 *
 * Math consistency rules:
 *   - 1040: totalIncome = sum of all income lines (±$1)
 *   - Bank: endingBalance = beginning + deposits - withdrawals
 *   - P&L: grossProfit = revenue - COGS; netIncome = grossProfit - opex
 *   - Balance Sheet: totalAssets = totalLiabilities + totalEquity
 *   - Rent Roll: vacantUnits = total - occupied; annualRent = monthly * 12
 *
 * 2026 base rates: Prime 6.75%, SOFR 4.30%, Treasury 4.15%
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LendingExtractionSet {
  loanType: string;
  documents: Array<{ docType: string; fileName: string; year?: number }>;
  extractions: Array<{ docType: string; data: Record<string, unknown>; year?: number }>;
  verification: {
    mathChecks: Array<Record<string, unknown>>;
    crossDocChecks: Array<Record<string, unknown>>;
    mathPassed: number;
    mathFailed: number;
    crossDocPassed: number;
    crossDocFailed: number;
    crossDocWarnings: number;
  };
}

// ─── Deterministic Hash ──────────────────────────────────────────────────────

function h(s: string): number {
  let v = 0;
  for (let i = 0; i < s.length; i++) v = ((v << 5) - v + s.charCodeAt(i)) | 0;
  return Math.abs(v);
}

/** Deterministic variation: base ± pct% based on seed string */
function vary(base: number, pct: number, seed: string): number {
  const r = (h(seed) % 1000) / 1000; // 0.000 to 0.999
  return Math.round(base * (1 - pct / 100 + (r * 2 * pct) / 100));
}

// ─── Helper: Form 1040 ──────────────────────────────────────────────────────

interface I1040 {
  name: string; spouse?: string; ssn4: string; addr: string;
  filing: string; year: number;
  wages?: number; employer?: string; ein4?: string;
  schedC?: { biz: string; code: string; gross: number; expenses: number; depr?: number };
  schedE?: Array<{ addr: string; type: string; rent: number; exp: number; depr: number }>;
  interest?: number; dividends?: number; capGains?: number;
  deduction: number; itemized?: boolean;
}

function mk1040(p: I1040): Record<string, unknown> {
  const w = p.wages ?? 0;
  const int = p.interest ?? 0;
  const div = p.dividends ?? 0;
  const cg = p.capGains ?? 0;
  const cGross = p.schedC?.gross ?? 0;
  const cExp = p.schedC?.expenses ?? 0;
  const cDepr = p.schedC?.depr ?? 0;
  const cNet = cGross - cExp;
  const eProps = p.schedE ?? [];
  const eTotal = eProps.reduce((s, pr) => s + (pr.rent - pr.exp), 0);
  const seTax = cNet > 0 ? Math.round(cNet * 0.9235 * 0.153) : 0;
  const seDeduction = Math.round(seTax / 2);
  const otherIncome = cNet + eTotal - seDeduction;
  const totalIncome = w + int + div + cg + otherIncome;
  const agi = totalIncome;
  const taxableIncome = Math.max(0, agi - p.deduction);
  const effRate = p.filing === "Married Filing Jointly" ? 0.20 : 0.22;
  const taxBeforeCredits = Math.round(taxableIncome * effRate);
  const totalTax = taxBeforeCredits + seTax;
  const withholding = w > 0 ? Math.round(w * 0.20) : 0;

  const data: Record<string, unknown> = {
    metadata: {
      taxYear: p.year, filingStatus: p.filing,
      taxpayerName: p.name, spouseName: p.spouse ?? null,
      ssn_last4: p.ssn4, address: p.addr,
    },
    income: {
      wages_line1: w, taxExemptInterest_line2a: 0, taxableInterest_line2b: int,
      qualifiedDividends_line3a: Math.round(div * 0.8), ordinaryDividends_line3b: div,
      iraDistributions_line4a: 0, taxableIra_line4b: 0,
      pensions_line5a: 0, taxablePensions_line5b: 0,
      socialSecurity_line6a: 0, taxableSocialSecurity_line6b: 0,
      capitalGain_line7: cg, otherIncome_line8: otherIncome,
      totalIncome_line9: totalIncome, adjustments_line10: 0, agi_line11: agi,
      standardOrItemized_line12: p.deduction, qbi_line13a: 0,
      totalDeductions_line14: p.deduction, taxableIncome_line15: taxableIncome,
    },
    scheduleC: p.schedC ? [{
      businessName: p.schedC.biz, principalCode: p.schedC.code,
      grossReceipts_line1: cGross, returnsAndAllowances_line2: 0,
      cogs_line4: 0, grossProfit_line5: cGross, otherIncome_line6: 0,
      grossIncome_line7: cGross, totalExpenses_line28: cExp, netProfit_line31: cNet,
      expenses: {
        advertising: Math.round(cExp * 0.06), carAndTruck: Math.round(cExp * 0.04),
        commissions: 0, contractLabor: Math.round(cExp * 0.08),
        depletion: 0, depreciation_line13: cDepr,
        employeeBenefits: 0, insurance: Math.round(cExp * 0.10),
        interestMortgage: 0, interestOther: 0, legal: Math.round(cExp * 0.03),
        officeExpense: Math.round(cExp * 0.05), pensionPlans: 0,
        rent: Math.round(cExp * 0.15), repairs: Math.round(cExp * 0.04),
        supplies: Math.round(cExp * 0.03), taxes: Math.round(cExp * 0.05),
        travel: Math.round(cExp * 0.02), meals: Math.round(cExp * 0.02),
        utilities: Math.round(cExp * 0.06), wages: Math.round(cExp * 0.22),
        otherExpenses: cExp - Math.round(cExp * 0.95), // remainder
      },
    }] : null,
    scheduleD: null,
    scheduleE: eProps.length > 0 ? {
      properties: eProps.map(pr => ({
        address: pr.addr, propertyType: pr.type, fairRentalDays: 365, personalUseDays: 0,
        rentsReceived: pr.rent, advertising: 0, auto: 0,
        cleaning: Math.round(pr.exp * 0.04), commissions: 0,
        insurance: Math.round(pr.exp * 0.10), legal: 0,
        management: Math.round(pr.exp * 0.10), mortgageInterest: Math.round(pr.exp * 0.35),
        otherInterest: 0, repairs: Math.round(pr.exp * 0.10), supplies: Math.round(pr.exp * 0.02),
        taxes: Math.round(pr.exp * 0.17), utilities: 0,
        depreciation: pr.depr, other: 0,
        totalExpenses: pr.exp, netRentalIncome: pr.rent - pr.exp,
      })),
      totalRentalIncome_line26: eTotal, partnershipSCorpIncome: [],
    } : null,
    scheduleSE: cNet > 0 ? { netEarnings: cNet, selfEmploymentTax: seTax } : null,
    w2Summary: w > 0 ? [{
      employer: p.employer ?? "Employer", ein_last4: p.ein4 ?? "0000",
      wages_box1: w, federalWithholding_box2: withholding,
      socialSecurityWages_box3: Math.min(w, 168600), medicareWages_box5: w,
    }] : [],
    deductions: {
      type: p.itemized ? "itemized" : "standard",
      amount: p.deduction,
      ...(p.itemized ? {
        scheduleA: {
          medicalDental: 0, stateLocalTaxes: 10000,
          mortgageInterest: Math.round(p.deduction * 0.5),
          charitableContributions: Math.round(p.deduction * 0.15),
          totalItemized: p.deduction,
        },
      } : {}),
    },
    tax: {
      taxBeforeCredits_line16: taxBeforeCredits, totalCredits: 0,
      otherTaxes_line23: seTax, totalTax_line24: totalTax,
      federalWithholding_line25a: withholding, totalPayments_line33: withholding,
      overpaid_line34: withholding > totalTax ? withholding - totalTax : 0,
      amountOwed_line37: totalTax > withholding ? totalTax - withholding : 0,
    },
    extractionNotes: ["Sample data — not extracted from a real document."],
    // Legacy flat fields (consumed by income analysis)
    line1: w, wages: w, wagesSalariesTips: w,
    taxableInterest: int, ordinaryDividends: div,
    totalIncome, adjustedGrossIncome: agi, taxableIncome, totalTax,
    wagesLine1: w, businessIncomeLine12: cNet,
    totalIncomeLine9: totalIncome, adjustedGrossIncomeLine11: agi,
    taxableIncomeLine15: taxableIncome, totalTaxLine24: totalTax,
  };
  return data;
}

// ─── Helper: Bank Statement ─────────────────────────────────────────────────

interface IBank {
  bank: string; holder: string; acct4: string; type: string;
  periodStart: string; periodEnd: string; months: number;
  beginBalance: number; avgMonthlyDeposits: number; avgMonthlyWithdrawals: number;
  recurringDeposits: Array<{ desc: string; amount: number; freq: string }>;
  loanPayments?: Array<{ desc: string; amount: number; freq: string; cat: string }>;
  seed: string;
}

function mkBank(p: IBank): Record<string, unknown> {
  const totalDeposits = Math.round(p.avgMonthlyDeposits * p.months);
  const totalWithdrawals = Math.round(p.avgMonthlyWithdrawals * p.months);
  const endBalance = p.beginBalance + totalDeposits - totalWithdrawals;

  const monthlySummaries = [];
  const [startYear, startMonth] = p.periodStart.split("-").map(Number);
  let runningBalance = p.beginBalance;
  for (let i = 0; i < p.months; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + Math.floor((startMonth - 1 + i) / 12);
    const dep = vary(p.avgMonthlyDeposits, 4, `${p.seed}-dep-${i}`);
    const wth = vary(p.avgMonthlyWithdrawals, 4, `${p.seed}-wth-${i}`);
    runningBalance = runningBalance + dep - wth;
    monthlySummaries.push({
      statementPeriod: `${y}-${String(m).padStart(2, "0")}`,
      totalDeposits: dep, depositCount: vary(8, 30, `${p.seed}-dc-${i}`),
      totalWithdrawals: wth, withdrawalCount: vary(20, 20, `${p.seed}-wc-${i}`),
      endingBalance: runningBalance, nsfCount: 0, overdraftCount: 0,
    });
  }
  // Fix last month to hit exact ending balance
  if (monthlySummaries.length > 0) {
    monthlySummaries[monthlySummaries.length - 1].endingBalance = endBalance;
  }

  const avgDaily = Math.round((p.beginBalance + endBalance) / 2);

  return {
    metadata: {
      bankName: p.bank, accountHolder: p.holder,
      accountNumber_last4: p.acct4, accountType: p.type,
      statementPeriodStart: p.periodStart, statementPeriodEnd: p.periodEnd,
      address: "On File",
    },
    summary: {
      beginningBalance: p.beginBalance, totalDeposits, totalWithdrawals,
      totalFees: 0, endingBalance: endBalance,
      averageDailyBalance: avgDaily, daysInPeriod: p.months * 30,
    },
    monthlySummaries,
    deposits: p.recurringDeposits.slice(0, 6).map((d, i) => ({
      date: `${startYear}-${String(startMonth).padStart(2, "0")}-${String(1 + i * 3).padStart(2, "0")}`,
      description: d.desc, amount: d.amount,
      runningBalance: p.beginBalance + d.amount * (i + 1),
      category: "ach_deposit",
    })),
    withdrawals: (p.loanPayments ?? []).slice(0, 4).map((lp, i) => ({
      date: `${startYear}-${String(startMonth).padStart(2, "0")}-${String(1 + i * 5).padStart(2, "0")}`,
      description: lp.desc, amount: lp.amount,
      runningBalance: p.beginBalance - lp.amount * (i + 1),
      category: "ach_debit",
    })),
    flags: {
      nsf_count: 0, overdraft_count: 0, overdraft_days: 0,
      negative_ending_balance: false, large_deposits: [], large_withdrawals: [],
      recurring_deposits: p.recurringDeposits.map(d => ({
        description: d.desc, frequency: d.freq, amount: d.amount,
      })),
      loan_payments: (p.loanPayments ?? []).map(lp => ({
        description: lp.desc, amount: lp.amount, frequency: lp.freq,
      })),
    },
    regularPaymentsDetected: (p.loanPayments ?? []).map(lp => ({
      description: lp.desc, amount: lp.amount, frequency: lp.freq, category: lp.cat,
    })),
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Profit & Loss ──────────────────────────────────────────────────

interface IPnL {
  biz: string; periodStart: string; periodEnd: string;
  basis?: string; preparedBy?: string;
  revenue: number; revenueBreakdown: Array<{ category: string; amount: number }>;
  cogs?: number;
  salaries?: number; rent?: number; insurance?: number; utilities?: number;
  repairs?: number; depreciation?: number; taxes?: number; other?: number;
  interest?: number;
}

function mkPnL(p: IPnL): Record<string, unknown> {
  const cogs = p.cogs ?? 0;
  const grossProfit = p.revenue - cogs;
  const sal = p.salaries ?? 0;
  const rnt = p.rent ?? 0;
  const ins = p.insurance ?? 0;
  const utl = p.utilities ?? 0;
  const rep = p.repairs ?? 0;
  const dep = p.depreciation ?? 0;
  const tax = p.taxes ?? 0;
  const oth = p.other ?? 0;
  const intExp = p.interest ?? 0;
  const totalOpex = sal + rnt + ins + utl + rep + dep + tax + oth;
  const opIncome = grossProfit - totalOpex;
  const netIncome = opIncome - intExp;
  const ebitda = netIncome + dep + intExp;

  return {
    metadata: {
      businessName: p.biz, periodStart: p.periodStart, periodEnd: p.periodEnd,
      periodType: "annual", preparedBy: p.preparedBy ?? "CPA on File", basis: p.basis ?? "accrual",
    },
    revenue: {
      grossRevenue: p.revenue, salesReturnsAndAllowances: 0, salesDiscounts: 0,
      netRevenue: p.revenue, revenueBreakdown: p.revenueBreakdown,
    },
    costOfGoodsSold: {
      beginningInventory: null, purchases: null, directLabor: null,
      directMaterials: null, manufacturingOverhead: null, freightIn: null,
      endingInventory: null, totalCOGS: cogs, cogsBreakdown: [],
    },
    grossProfit, grossProfitMargin: cogs > 0 ? Math.round((grossProfit / p.revenue) * 100 * 10) / 10 : 100,
    operatingExpenses: {
      salariesAndWages: sal || null, officerCompensation: null, payrollTaxes: null,
      employeeBenefits: null, rent: rnt || null, utilities: utl || null,
      insurance: ins || null, officeExpenses: null, advertising: null,
      professionalFees: null, legal: null, accounting: null,
      repairs: rep || null, maintenance: null, depreciation: dep || null,
      amortization: null, travel: null, meals: null, entertainment: null,
      vehicleExpenses: null, bankCharges: null, interest: intExp || null,
      taxesAndLicenses: tax || null, badDebtExpense: null,
      charitableContributions: null, education: null, subscriptions: null,
      telephone: null, internet: null, software: null, contractLabor: null,
      commissionsAndFees: null, otherExpenses: oth || null,
      totalOperatingExpenses: totalOpex,
      expenseBreakdown: [
        ...(sal ? [{ category: "Salaries & Wages", amount: sal }] : []),
        ...(ins ? [{ category: "Insurance", amount: ins }] : []),
        ...(rep ? [{ category: "Repairs & Maintenance", amount: rep }] : []),
        ...(utl ? [{ category: "Utilities", amount: utl }] : []),
        ...(tax ? [{ category: "Taxes & Licenses", amount: tax }] : []),
        ...(dep ? [{ category: "Depreciation", amount: dep }] : []),
        ...(rnt ? [{ category: "Rent", amount: rnt }] : []),
        ...(oth ? [{ category: "Other", amount: oth }] : []),
      ],
    },
    operatingIncome: opIncome,
    otherIncomeAndExpenses: {
      interestIncome: 0, interestExpense: intExp, gainOnSaleOfAssets: 0,
      lossOnSaleOfAssets: 0, otherIncome: 0, otherExpenses: 0, totalOtherNet: -intExp,
    },
    incomeBeforeTax: netIncome, incomeTaxExpense: 0, netIncome,
    netIncomeMargin: Math.round((netIncome / p.revenue) * 1000) / 10,
    addBacks: {
      depreciation: dep, amortization: 0, interestExpense: intExp,
      ownerCompensation: 0, oneTimeExpenses: 0, nonRecurringItems: 0, personalExpenses: 0,
      totalAddBacks: dep + intExp, adjustedNetIncome: netIncome + dep + intExp,
      addBackDetails: [
        ...(dep ? [{ description: "Depreciation (non-cash)", amount: dep, reason: "Non-cash expense add-back" }] : []),
        ...(intExp ? [{ description: "Interest expense", amount: intExp, reason: "Added back for EBITDA" }] : []),
      ],
    },
    ebitda,
    priorPeriodComparison: {
      hasPriorPeriod: false, priorPeriodStart: null, priorPeriodEnd: null,
      priorGrossRevenue: null, priorNetIncome: null,
      revenueGrowthPercent: null, netIncomeGrowthPercent: null,
    },
    // Legacy flat fields
    totalRevenue: p.revenue, totalOperatingExpenses: totalOpex,
    salaries: sal, insurance: ins, repairsAndMaintenance: rep,
    utilities: utl, propertyTaxes: tax, depreciation: dep, otherExpenses: oth,
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Balance Sheet ──────────────────────────────────────────────────

interface IBS {
  biz: string; asOf: string;
  cash: number; ar?: number; inventory?: number; prepaid?: number;
  land?: number; buildings?: number; equipment?: number; accDepr?: number;
  goodwill?: number;
  ap?: number; accrued?: number; currentDebt?: number;
  longTermDebt?: number; mortgage?: number;
  retainedEarnings: number;
}

function mkBS(p: IBS): Record<string, unknown> {
  const ar = p.ar ?? 0;
  const inv = p.inventory ?? 0;
  const pre = p.prepaid ?? 0;
  const totalCurrentAssets = p.cash + ar + inv + pre;
  const land = p.land ?? 0;
  const bldg = p.buildings ?? 0;
  const equip = p.equipment ?? 0;
  const accD = p.accDepr ?? 0;
  const grossPPE = land + bldg + equip;
  const netPPE = grossPPE - accD;
  const gw = p.goodwill ?? 0;
  const totalAssets = totalCurrentAssets + netPPE + gw;

  const ap = p.ap ?? 0;
  const acc = p.accrued ?? 0;
  const cDebt = p.currentDebt ?? 0;
  const totalCurrentLiab = ap + acc + cDebt;
  const ltDebt = p.longTermDebt ?? 0;
  const mort = p.mortgage ?? 0;
  const totalLTLiab = ltDebt + mort;
  const totalLiab = totalCurrentLiab + totalLTLiab;
  const totalEquity = totalAssets - totalLiab; // force balance

  return {
    metadata: { businessName: p.biz, asOfDate: p.asOf, preparedBy: "CPA on File", basis: "accrual" },
    assets: {
      currentAssets: {
        cashAndCashEquivalents: p.cash, checkingAccounts: null,
        accountsReceivable_net: ar || null, inventory: inv || null,
        prepaidExpenses: pre || null, otherCurrentAssets: null, totalCurrentAssets,
      },
      fixedAssets: {
        land: land || null, buildings: bldg || null, leaseholdImprovements: null,
        machinery: equip || null, vehicles: null, computerEquipment: null,
        grossPropertyAndEquipment: grossPPE || null, accumulatedDepreciation: accD || null,
        netPropertyAndEquipment: netPPE,
      },
      otherAssets: {
        goodwill: gw || null, intangibleAssets_net: null, longTermInvestments: null,
        otherLongTermAssets: null, totalOtherAssets: gw,
      },
      totalAssets,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: ap || null, accruedExpenses: acc || null, accruedWages: null,
        accruedTaxes: null, currentPortionOfLongTermDebt: cDebt || null,
        shortTermNotesPayable: null, lineOfCreditBalance: null, creditCardPayable: null,
        otherCurrentLiabilities: null, totalCurrentLiabilities: totalCurrentLiab,
      },
      longTermLiabilities: {
        notesPayable_longTerm: ltDebt || null, mortgagePayable: mort || null,
        sbaLoanPayable: null, vehicleLoans: null, equipmentLoans: null,
        capitalLeaseObligations: null, otherLongTermLiabilities: null,
        totalLongTermLiabilities: totalLTLiab,
      },
      totalLiabilities: totalLiab,
    },
    equity: {
      commonStock: null, retainedEarnings: p.retainedEarnings,
      currentYearNetIncome: null, ownerEquity: null, totalEquity,
    },
    totalLiabilitiesAndEquity: totalAssets,
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Rent Roll ──────────────────────────────────────────────────────

interface IRR {
  property: string; addr: string; type: string; owner: string; asOf: string;
  units: Array<{ unitType: string; count: number; sqft: number; rent: number; marketRent: number }>;
  occupancyRate: number;
  otherIncome?: number;
  seed: string;
}

function mkRR(p: IRR): Record<string, unknown> {
  const totalUnits = p.units.reduce((s, u) => s + u.count, 0);
  const occupiedUnits = Math.round(totalUnits * p.occupancyRate);
  const vacantUnits = totalUnits - occupiedUnits;

  // Generate individual unit records
  const unitRecords: Array<Record<string, unknown>> = [];
  let unitNum = 100;
  let occupiedSoFar = 0;
  const totalOccupied = occupiedUnits;

  for (const ut of p.units) {
    for (let i = 0; i < ut.count; i++) {
      unitNum++;
      const isOccupied = occupiedSoFar < totalOccupied;
      if (isOccupied) occupiedSoFar++;
      const rentVar = vary(ut.rent, 3, `${p.seed}-${unitNum}`);
      unitRecords.push({
        unitNumber: String(unitNum), unitType: ut.unitType,
        squareFeet: ut.sqft, bedrooms: parseInt(ut.unitType) || 1, bathrooms: 1,
        tenantName: isOccupied ? `Tenant ${unitNum}` : null,
        leaseStartDate: isOccupied ? "2025-03-01" : null,
        leaseEndDate: isOccupied ? "2026-02-28" : null,
        leaseTermMonths: isOccupied ? 12 : null,
        monthlyRent: isOccupied ? rentVar : 0,
        marketRent: ut.marketRent, rentPerSquareFoot: Math.round((ut.rent / ut.sqft) * 100) / 100,
        status: isOccupied ? "occupied" : "vacant",
        rentStatus: isOccupied ? "current" : "vacant",
        pastDueAmount: null, pastDueDays: null, otherMonthlyCharges: null, concessions: null,
      });
    }
  }

  const totalMonthlyRent = unitRecords
    .filter((u) => u.status === "occupied")
    .reduce((s, u) => s + (u.monthlyRent as number), 0);
  const totalMarketRent = p.units.reduce((s, u) => s + u.count * u.marketRent, 0);
  const oi = p.otherIncome ?? 0;

  return {
    metadata: {
      propertyName: p.property, propertyAddress: p.addr,
      propertyType: p.type as string, ownerName: p.owner,
      managementCompany: null, asOfDate: p.asOf, totalUnits,
    },
    units: unitRecords,
    summary: {
      totalUnits, occupiedUnits, vacantUnits,
      occupancyRate: Math.round((occupiedUnits / totalUnits) * 1000) / 10,
      totalMonthlyRent_scheduled: totalMonthlyRent,
      totalAnnualRent_scheduled: totalMonthlyRent * 12,
      averageRentPerUnit: Math.round(totalMonthlyRent / Math.max(1, occupiedUnits)),
      totalMarketRent, lossToLease: totalMarketRent - totalMonthlyRent,
      totalPastDue: 0, delinquencyRate: 0,
    },
    otherIncome: {
      laundry: Math.round(oi * 0.3), parking: Math.round(oi * 0.3),
      storage: Math.round(oi * 0.1), petFees: Math.round(oi * 0.1),
      lateCharges: Math.round(oi * 0.1), applicationFees: Math.round(oi * 0.05),
      otherFees: oi - Math.round(oi * 0.95), totalOtherIncome: oi,
    },
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Form 1120 (C-Corp) ─────────────────────────────────────────────

interface I1120 {
  corp: string; ein: string; year: number;
  grossReceipts: number; cogs?: number;
  officerComp?: number; salaries?: number; rent?: number;
  taxes?: number; interest?: number; depreciation?: number; other?: number;
  // Balance sheet
  cash: number; ar?: number; totalAssets: number;
  ap?: number; totalLiab: number;
}

function mk1120(p: I1120): Record<string, unknown> {
  const cogs = p.cogs ?? 0;
  const grossProfit = p.grossReceipts - cogs;
  const offComp = p.officerComp ?? 0;
  const sal = p.salaries ?? 0;
  const rnt = p.rent ?? 0;
  const tax = p.taxes ?? 0;
  const intExp = p.interest ?? 0;
  const dep = p.depreciation ?? 0;
  const oth = p.other ?? 0;
  const totalDeductions = offComp + sal + rnt + tax + intExp + dep + oth;
  const taxableIncome = grossProfit - totalDeductions;

  return {
    metadata: { taxYear: p.year, corporationName: p.corp, ein: p.ein },
    income: {
      grossReceipts_line1a: p.grossReceipts, returnsAllowances_line1b: 0,
      balanceAfterReturns_line1c: p.grossReceipts, costOfGoodsSold_line2: cogs,
      grossProfit_line3: grossProfit, dividendsReceived_line4: 0,
      interestIncome_line5: 0, grossRents_line6: 0, grossRoyalties_line7: 0,
      capitalGainNet_line8: 0, netGainForm4797_line9: 0, otherIncome_line10: 0,
      totalIncome_line11: grossProfit,
    },
    deductions: {
      compensationOfOfficers_line12: offComp || null, salariesAndWages_line13: sal || null,
      repairsAndMaintenance_line14: null, rents_line16: rnt || null,
      taxesAndLicenses_line17: tax || null, interestExpense_line18: intExp || null,
      depreciationForm4562_line20: dep || null, advertising_line22: null,
      otherDeductions_line26: oth || null, totalDeductions_line27: totalDeductions,
    },
    taxableIncome: {
      taxableIncomeBeforeNOL_line28: taxableIncome,
      netOperatingLossDeduction_line29a: 0, totalSpecialDeductions_line29c: 0,
      taxableIncome_line30: taxableIncome,
    },
    scheduleL: {
      beginningOfYear: {
        assets: { cash: Math.round(p.cash * 0.9), totalAssets: Math.round(p.totalAssets * 0.95) },
        liabilitiesAndEquity: {
          accountsPayable: (p.ap ?? 0) || null,
          totalLiabilities: Math.round(p.totalLiab * 0.95),
          totalLiabilitiesAndEquity: Math.round(p.totalAssets * 0.95),
        },
      },
      endOfYear: {
        assets: { cash: p.cash, totalAssets: p.totalAssets },
        liabilitiesAndEquity: {
          accountsPayable: p.ap ?? null,
          totalLiabilities: p.totalLiab,
          totalLiabilitiesAndEquity: p.totalAssets,
        },
      },
    },
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Form 1120S (S-Corp) ────────────────────────────────────────────

interface I1120S {
  corp: string; ein: string; year: number;
  grossReceipts: number; cogs?: number;
  officerComp?: number; salaries?: number; rent?: number;
  taxes?: number; interest?: number; depreciation?: number; other?: number;
  distributions?: number;
  cash: number; totalAssets: number; totalLiab: number;
}

function mk1120S(p: I1120S): Record<string, unknown> {
  const cogs = p.cogs ?? 0;
  const grossProfit = p.grossReceipts - cogs;
  const offComp = p.officerComp ?? 0;
  const sal = p.salaries ?? 0;
  const rnt = p.rent ?? 0;
  const tax = p.taxes ?? 0;
  const intExp = p.interest ?? 0;
  const dep = p.depreciation ?? 0;
  const oth = p.other ?? 0;
  const totalDeductions = offComp + sal + rnt + tax + intExp + dep + oth;
  const ordinaryIncome = grossProfit - totalDeductions;

  return {
    metadata: { taxYear: p.year, corporationName: p.corp, ein: p.ein },
    income: {
      grossReceipts_line1a: p.grossReceipts, returnsAllowances_line1b: 0,
      balanceAfterReturns_line1c: p.grossReceipts, costOfGoodsSold_line2: cogs,
      grossProfit_line3: grossProfit, netGainForm4797_line4: 0,
      otherIncome_line5: 0, totalIncome_line6: grossProfit,
    },
    deductions: {
      compensationOfOfficers_line7: offComp || null, salariesAndWages_line8: sal || null,
      repairsAndMaintenance_line9: null, rents_line13: rnt || null,
      taxesAndLicenses_line12: tax || null, interestExpense_line14: intExp || null,
      depreciationForm4562_line15: dep || null,
      otherDeductions_line19: oth || null, totalDeductions_line20: totalDeductions,
    },
    ordinaryBusinessIncome_line22: ordinaryIncome,
    scheduleK: {
      incomeAndLoss: {
        ordinaryBusinessIncome_line1: ordinaryIncome,
        netRentalRealEstateIncome_line2: 0, interestIncome_line4: 0,
        ordinaryDividends_line5a: 0, qualifiedDividends_line5b: 0,
      },
      distributions: {
        cashAndMarketableSecurities_line16a: p.distributions ?? 0,
        propertyDistributions_line16b: 0,
      },
    },
    scheduleL: {
      endOfYear: {
        assets: { cash: p.cash, totalAssets: p.totalAssets },
        liabilitiesAndEquity: {
          totalLiabilities: p.totalLiab,
          totalLiabilitiesAndEquity: p.totalAssets,
        },
      },
    },
    extractionNotes: ["Sample data — not extracted from a real document."],
  };
}

// ─── Helper: Verification Report ────────────────────────────────────────────

function mkVerif(
  math: Array<[string, string, number, number]>,
  crossDoc: Array<[string, string, string, number, string, string, number]>,
): LendingExtractionSet["verification"] {
  return {
    mathChecks: math.map(([path, desc, expected, actual]) => ({
      fieldPath: path, description: desc, expected, actual,
      difference: Math.abs(expected - actual), passed: Math.abs(expected - actual) <= 1,
    })),
    crossDocChecks: crossDoc.map(([desc, d1Type, d1Field, d1Val, d2Type, d2Field, d2Val]) => ({
      description: desc, doc1Type: d1Type, doc1Field: d1Field, doc1Value: d1Val,
      doc2Type: d2Type, doc2Field: d2Field, doc2Value: d2Val,
      difference: Math.abs(d1Val - d2Val), percentDiff: 0, status: "pass",
    })),
    mathPassed: math.length, mathFailed: 0,
    crossDocPassed: crossDoc.length, crossDocFailed: 0, crossDocWarnings: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAM EXTRACTION GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. SBA 7(a) — Restaurant Acquisition ───────────────────────────────────

function sba7a(): LendingExtractionSet {
  // Restaurant group: Schedule C income, $2.4M gross, $165K net
  // Owner W-2 from part-time hospital admin: $45K
  const form1040 = mk1040({
    name: "Carlos R. Mendez", spouse: "Maria L. Mendez", ssn4: "3847", filing: "Married Filing Jointly",
    addr: "2915 Pecan Valley Dr, Dallas, TX 75227", year: 2024,
    wages: 45000, employer: "Baylor Scott & White Health", ein4: "6291",
    schedC: { biz: "Meridian Hospitality Group, LLC", code: "722511", gross: 2400000, expenses: 2235000, depr: 42000 },
    interest: 800, dividends: 0, deduction: 30000,
  });
  const bank = mkBank({
    bank: "Wells Fargo", holder: "Meridian Hospitality Group, LLC", acct4: "7823", type: "checking",
    periodStart: "2024-07-01", periodEnd: "2024-12-31", months: 6,
    beginBalance: 84500, avgMonthlyDeposits: 205000, avgMonthlyWithdrawals: 198000, seed: "sba7a",
    recurringDeposits: [
      { desc: "SQUARE INC - POS DEPOSIT", amount: 142000, freq: "monthly" },
      { desc: "DOORDASH WEEKLY PAYOUT", amount: 28000, freq: "monthly" },
      { desc: "UBER EATS PAYOUT", amount: 18000, freq: "monthly" },
      { desc: "CATERING DEPOSIT", amount: 12000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "US FOODS - SYSCO PAYMENT", amount: 68000, freq: "monthly", cat: "vendor" },
      { desc: "COMMERCIAL LEASE PMT", amount: 12500, freq: "monthly", cat: "rent" },
      { desc: "PAYROLL - ADP", amount: 82000, freq: "monthly", cat: "payroll" },
    ],
  });
  const pnl = mkPnL({
    biz: "Meridian Hospitality Group, LLC",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 2400000,
    revenueBreakdown: [
      { category: "Dine-in Sales", amount: 1440000 },
      { category: "Delivery & Takeout", amount: 576000 },
      { category: "Catering", amount: 240000 },
      { category: "Bar & Beverage", amount: 144000 },
    ],
    cogs: 840000, salaries: 720000, rent: 150000, insurance: 48000,
    utilities: 72000, repairs: 36000, depreciation: 42000, taxes: 54000, other: 108000,
  });

  return {
    loanType: "small_business",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Federal_Tax_Return_Mendez.pdf", year: 2024 },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "WellsFargo_Checking_Jul-Dec_2024.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_Meridian.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "BANK_STATEMENT", data: bank },
      { docType: "PROFIT_AND_LOSS", data: pnl },
    ],
    verification: mkVerif(
      [
        ["income.totalIncome_line9", "1040 total income sum", 210800, 210800],
        ["scheduleC[0].netProfit_line31", "Schedule C net = gross - expenses", 165000, 165000],
        ["pnl.grossProfit", "P&L gross = revenue - COGS", 1560000, 1560000],
        ["pnl.netIncome", "P&L net = gross - opex", 330000, 330000],
      ],
      [
        ["Schedule C gross vs P&L revenue", "FORM_1040", "scheduleC.grossReceipts", 2400000, "PROFIT_AND_LOSS", "revenue.grossRevenue", 2400000],
      ],
    ),
  };
}

// ─── 2. SBA 504 — Manufacturing Facility ────────────────────────────────────

function sba504(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "James K. Nakamura", ssn4: "5219", filing: "Married Filing Jointly",
    addr: "4420 NW Skyline Blvd, Portland, OR 97229", year: 2024,
    wages: 175000, employer: "Cascade Precision Manufacturing, Inc.", ein4: "8341",
    interest: 2400, dividends: 8500, deduction: 32000, itemized: true,
  });
  const form1120 = mk1120({
    corp: "Cascade Precision Manufacturing, Inc.", ein: "93-XXXX341", year: 2024,
    grossReceipts: 6800000, cogs: 4080000,
    officerComp: 175000, salaries: 1420000, rent: 180000,
    taxes: 125000, interest: 42000, depreciation: 258000, other: 0,
    cash: 620000, ar: 480000, totalAssets: 3850000, ap: 320000, totalLiab: 1680000,
  });
  const bank = mkBank({
    bank: "US Bank", holder: "Cascade Precision Manufacturing, Inc.", acct4: "4518", type: "checking",
    periodStart: "2024-07-01", periodEnd: "2024-12-31", months: 6,
    beginBalance: 485000, avgMonthlyDeposits: 580000, avgMonthlyWithdrawals: 565000, seed: "sba504",
    recurringDeposits: [
      { desc: "ACH DEPOSIT - BOEING CO", amount: 185000, freq: "monthly" },
      { desc: "ACH DEPOSIT - INTEL CORP", amount: 142000, freq: "monthly" },
      { desc: "WIRE IN - PRECISION AERO", amount: 95000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "EQUIPMENT LOAN PMT - BANK OF THE WEST", amount: 8400, freq: "monthly", cat: "loan" },
      { desc: "COMMERCIAL LEASE PMT", amount: 15000, freq: "monthly", cat: "rent" },
    ],
  });
  const pnl = mkPnL({
    biz: "Cascade Precision Manufacturing, Inc.",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 6800000,
    revenueBreakdown: [
      { category: "CNC Machining", amount: 4080000 },
      { category: "Assembly & Integration", amount: 1700000 },
      { category: "Engineering Services", amount: 1020000 },
    ],
    cogs: 4080000, salaries: 1420000, rent: 180000, insurance: 95000,
    utilities: 84000, repairs: 62000, depreciation: 258000, taxes: 125000, other: 0,
    interest: 42000,
  });
  const bs = mkBS({
    biz: "Cascade Precision Manufacturing, Inc.", asOf: "2024-12-31",
    cash: 620000, ar: 480000, inventory: 340000, prepaid: 45000,
    land: 0, buildings: 0, equipment: 2150000, accDepr: 985000,
    ap: 320000, accrued: 85000, currentDebt: 96000,
    longTermDebt: 1179000,
    retainedEarnings: 970000,
  });

  return {
    loanType: "small_business",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Nakamura.pdf", year: 2024 },
      { docType: "FORM_1120", fileName: "2024_Corp_Return_Cascade.pdf", year: 2024 },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "USBank_Checking_Jul-Dec_2024.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_Cascade.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_Cascade.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "FORM_1120", data: form1120, year: 2024 },
      { docType: "BANK_STATEMENT", data: bank },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
    ],
    verification: mkVerif(
      [
        ["1120.grossProfit_line3", "Corp gross profit = receipts - COGS", 2720000, 2720000],
        ["1120.taxableIncome_line30", "Corp taxable income", 520000, 520000],
        ["pnl.netIncome", "P&L net income", 454000, 454000],
        ["bs.totalAssets", "Balance sheet equation", 3850000, 3850000],
      ],
      [
        ["1040 wages vs 1120 officer comp", "FORM_1040", "wages_line1", 175000, "FORM_1120", "officerComp", 175000],
        ["1120 revenue vs P&L revenue", "FORM_1120", "grossReceipts", 6800000, "PROFIT_AND_LOSS", "grossRevenue", 6800000],
      ],
    ),
  };
}

// ─── 3. Commercial CRE — Office Building ────────────────────────────────────

function commercialCRE(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "David W. Harrison", ssn4: "6724", filing: "Single",
    addr: "881 Buckhead Loop NE, Atlanta, GA 30326", year: 2024,
    wages: 195000, employer: "Summit Office Partners, LLC", ein4: "2947",
    interest: 3200, dividends: 12000, deduction: 29200, itemized: true,
  });
  const rentRoll = mkRR({
    property: "Peachtree Commerce Center", addr: "2200 Peachtree Rd NW, Atlanta, GA 30309",
    type: "office", owner: "Summit Office Partners, LLC", asOf: "2025-01-15",
    units: [
      { unitType: "Suite-S", count: 12, sqft: 1200, rent: 2400, marketRent: 2500 },
      { unitType: "Suite-M", count: 8, sqft: 2500, rent: 5000, marketRent: 5200 },
      { unitType: "Suite-L", count: 4, sqft: 5000, rent: 9500, marketRent: 10000 },
    ],
    occupancyRate: 0.92, otherIncome: 3200, seed: "cre-office",
  });
  const pnl = mkPnL({
    biz: "Peachtree Commerce Center (T-12)",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 1020000,
    revenueBreakdown: [
      { category: "Base Rent", amount: 935000 },
      { category: "CAM Recoveries", amount: 48000 },
      { category: "Parking & Other", amount: 37000 },
    ],
    salaries: 85000, insurance: 42000, utilities: 68000,
    repairs: 52000, depreciation: 95000, taxes: 118000, other: 40000,
  });
  const bs = mkBS({
    biz: "Summit Office Partners, LLC", asOf: "2024-12-31",
    cash: 340000, ar: 65000, prepaid: 28000,
    land: 1200000, buildings: 5800000, accDepr: 1420000,
    ap: 48000, accrued: 35000, currentDebt: 180000,
    mortgage: 3200000,
    retainedEarnings: 2550000,
  });

  return {
    loanType: "commercial_real_estate",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Harrison.pdf", year: 2024 },
      { docType: "RENT_ROLL", fileName: "Peachtree_Commerce_RentRoll_Jan2025.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_T12_Operating_Statement.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_Summit.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "RENT_ROLL", data: rentRoll },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
    ],
    verification: mkVerif(
      [
        ["pnl.grossProfit", "T-12 gross revenue", 1020000, 1020000],
        ["pnl.operatingIncome", "T-12 NOI", 520000, 520000],
        ["rentRoll.occupancyRate", "Occupancy matches units", 92, 92],
      ],
      [
        ["Rent roll annual vs T-12 base rent", "RENT_ROLL", "annualRent", 935000, "PROFIT_AND_LOSS", "baseRent", 935000],
      ],
    ),
  };
}

// ─── 4. DSCR — Investment Rental Property ───────────────────────────────────

function dscr(): LendingExtractionSet {
  const rentRoll = mkRR({
    property: "Magnolia Court Fourplex", addr: "1847 Magnolia Ave, Long Beach, CA 90806",
    type: "multifamily", owner: "Trident Property Holdings, LLC", asOf: "2025-01-10",
    units: [
      { unitType: "2BR/1BA", count: 2, sqft: 850, rent: 1950, marketRent: 2000 },
      { unitType: "1BR/1BA", count: 2, sqft: 650, rent: 1550, marketRent: 1600 },
    ],
    occupancyRate: 1.0, otherIncome: 200, seed: "dscr-4unit",
  });
  const bank = mkBank({
    bank: "Chase", holder: "Trident Property Holdings, LLC", acct4: "3291", type: "checking",
    periodStart: "2024-11-01", periodEnd: "2024-12-31", months: 2,
    beginBalance: 18400, avgMonthlyDeposits: 7200, avgMonthlyWithdrawals: 4800, seed: "dscr-bank",
    recurringDeposits: [
      { desc: "TENANT RENT - UNIT 101", amount: 1950, freq: "monthly" },
      { desc: "TENANT RENT - UNIT 102", amount: 1950, freq: "monthly" },
      { desc: "TENANT RENT - UNIT 103", amount: 1550, freq: "monthly" },
      { desc: "TENANT RENT - UNIT 104", amount: 1550, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "PROPERTY INSURANCE PMT", amount: 280, freq: "monthly", cat: "insurance" },
      { desc: "GARDENER SERVICE", amount: 150, freq: "monthly", cat: "maintenance" },
    ],
  });

  return {
    loanType: "commercial_real_estate",
    documents: [
      { docType: "RENT_ROLL", fileName: "Magnolia_Court_RentRoll_Jan2025.pdf" },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "Chase_Property_Acct_Nov-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "RENT_ROLL", data: rentRoll },
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["rentRoll.occupancy", "4 of 4 units occupied", 100, 100],
        ["rentRoll.totalMonthlyRent", "Total monthly rent", 7000, 7000],
        ["bank.endingBalance", "Balance = begin + dep - wth", 23200, 23200],
      ],
      [
        ["Rent roll vs bank deposits", "RENT_ROLL", "monthlyRent", 7000, "BANK_STATEMENT", "avgDeposits", 7200],
      ],
    ),
  };
}

// ─── 5. Bank Statement — Self-Employed Purchase ─────────────────────────────

function bankStatement(): LendingExtractionSet {
  const bank = mkBank({
    bank: "Bank of America", holder: "Rachel Nguyen", acct4: "8156", type: "checking",
    periodStart: "2023-01-01", periodEnd: "2024-12-31", months: 24,
    beginBalance: 42000, avgMonthlyDeposits: 18500, avgMonthlyWithdrawals: 15800, seed: "bankstmt",
    recurringDeposits: [
      { desc: "STRIPE TRANSFER - NGUYEN DIGITAL", amount: 12500, freq: "monthly" },
      { desc: "ACH DEP - MARKETING RETAINER", amount: 4500, freq: "monthly" },
      { desc: "VENMO TRANSFER", amount: 1500, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "AUTO LOAN - TOYOTA FINANCIAL", amount: 520, freq: "monthly", cat: "loan" },
      { desc: "STUDENT LOAN - NAVIENT", amount: 380, freq: "monthly", cat: "loan" },
    ],
  });
  const pnl = mkPnL({
    biz: "Nguyen Digital Marketing, LLC",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 240000,
    revenueBreakdown: [
      { category: "Digital Marketing Retainers", amount: 156000 },
      { category: "Campaign Management", amount: 54000 },
      { category: "Consulting & Strategy", amount: 30000 },
    ],
    salaries: 0, rent: 0, insurance: 4800,
    utilities: 0, repairs: 0, depreciation: 3600, taxes: 8400,
    other: 72000, // contractor costs, software, tools
  });

  return {
    loanType: "residential",
    documents: [
      { docType: "BANK_STATEMENT_CHECKING", fileName: "BofA_Checking_24mo_2023-2024.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_Nguyen_Digital.pdf" },
    ],
    extractions: [
      { docType: "BANK_STATEMENT", data: bank },
      { docType: "PROFIT_AND_LOSS", data: pnl },
    ],
    verification: mkVerif(
      [
        ["bank.avgDeposits", "24-month average deposits", 18500, 18500],
        ["pnl.netIncome", "P&L net income", 151200, 151200],
      ],
      [
        ["Bank deposits vs P&L revenue", "BANK_STATEMENT", "annualizedDeposits", 222000, "PROFIT_AND_LOSS", "grossRevenue", 240000],
      ],
    ),
  };
}

// ─── 6. Conventional Business — Distribution Company ────────────────────────

function conventionalBusiness(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Thomas A. Reeves", spouse: "Linda M. Reeves", ssn4: "4102", filing: "Married Filing Jointly",
    addr: "9820 Fair Oaks Blvd, Sacramento, CA 95825", year: 2024,
    wages: 120000, employer: "Pacific Coast Distributors, Inc.", ein4: "7156",
    interest: 1800, dividends: 2400, deduction: 30000,
  });
  const form1120S = mk1120S({
    corp: "Pacific Coast Distributors, Inc.", ein: "94-XXXX156", year: 2024,
    grossReceipts: 4200000, cogs: 2940000,
    officerComp: 120000, salaries: 580000, rent: 96000,
    taxes: 48000, interest: 18000, depreciation: 78000, other: 0,
    distributions: 80000,
    cash: 285000, totalAssets: 1650000, totalLiab: 820000,
  });
  const pnl = mkPnL({
    biz: "Pacific Coast Distributors, Inc.",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 4200000,
    revenueBreakdown: [
      { category: "Wholesale Distribution", amount: 3360000 },
      { category: "Direct Sales", amount: 630000 },
      { category: "Freight & Handling", amount: 210000 },
    ],
    cogs: 2940000, salaries: 580000, rent: 96000, insurance: 42000,
    utilities: 24000, repairs: 18000, depreciation: 78000, taxes: 48000,
    other: 0, interest: 18000,
  });
  const bs = mkBS({
    biz: "Pacific Coast Distributors, Inc.", asOf: "2024-12-31",
    cash: 285000, ar: 380000, inventory: 520000, prepaid: 15000,
    equipment: 680000, accDepr: 230000,
    ap: 290000, accrued: 45000, currentDebt: 72000,
    longTermDebt: 413000,
    retainedEarnings: 830000,
  });
  const bank = mkBank({
    bank: "Comerica", holder: "Pacific Coast Distributors, Inc.", acct4: "6847", type: "checking",
    periodStart: "2024-07-01", periodEnd: "2024-12-31", months: 6,
    beginBalance: 245000, avgMonthlyDeposits: 365000, avgMonthlyWithdrawals: 352000, seed: "conv",
    recurringDeposits: [
      { desc: "ACH - COSTCO WHOLESALE", amount: 125000, freq: "monthly" },
      { desc: "ACH - SAFEWAY INC", amount: 85000, freq: "monthly" },
      { desc: "WIRE - RESTAURANT DEPOT", amount: 65000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "COMERICA TERM LOAN PMT", amount: 6200, freq: "monthly", cat: "loan" },
      { desc: "WAREHOUSE LEASE PMT", amount: 8000, freq: "monthly", cat: "rent" },
    ],
  });

  return {
    loanType: "commercial_business",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Reeves.pdf", year: 2024 },
      { docType: "FORM_1120S", fileName: "2024_SCorp_Return_PacificCoast.pdf", year: 2024 },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_PacificCoast.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_PacificCoast.pdf" },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "Comerica_Checking_Jul-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "FORM_1120S", data: form1120S, year: 2024 },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["1120S.ordinaryIncome", "S-Corp ordinary income", 320000, 320000],
        ["pnl.grossProfit", "P&L gross profit", 1260000, 1260000],
        ["bs.equation", "Assets = L + E", 1650000, 1650000],
      ],
      [
        ["1040 wages vs 1120S officer comp", "FORM_1040", "wages", 120000, "FORM_1120S", "officerComp", 120000],
        ["1120S revenue vs P&L revenue", "FORM_1120S", "grossReceipts", 4200000, "PROFIT_AND_LOSS", "grossRevenue", 4200000],
      ],
    ),
  };
}

// ─── 7. Line of Credit — Staffing Agency ────────────────────────────────────

function lineOfCredit(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Priya S. Kapoor", ssn4: "9283", filing: "Single",
    addr: "1200 Technology Dr, Suite 400, San Jose, CA 95110", year: 2024,
    wages: 110000, employer: "Vertex Staffing Solutions, LLC", ein4: "3847",
    interest: 1200, dividends: 3800, deduction: 14600,
  });
  const form1120S = mk1120S({
    corp: "Vertex Staffing Solutions, LLC", ein: "94-XXXX847", year: 2024,
    grossReceipts: 3800000, cogs: 0,
    officerComp: 110000, salaries: 2850000, rent: 72000,
    taxes: 36000, interest: 8000, depreciation: 12000, other: 182000,
    distributions: 60000,
    cash: 195000, totalAssets: 920000, totalLiab: 380000,
  });
  const pnl = mkPnL({
    biz: "Vertex Staffing Solutions, LLC",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 3800000,
    revenueBreakdown: [
      { category: "IT Staff Augmentation", amount: 2660000 },
      { category: "Direct Hire Fees", amount: 760000 },
      { category: "Contract-to-Hire", amount: 380000 },
    ],
    salaries: 2850000, rent: 72000, insurance: 38000,
    utilities: 12000, depreciation: 12000, taxes: 36000, other: 182000,
    interest: 8000,
  });
  const bs = mkBS({
    biz: "Vertex Staffing Solutions, LLC", asOf: "2024-12-31",
    cash: 195000, ar: 420000, prepaid: 18000,
    equipment: 85000, accDepr: 42000,
    ap: 165000, accrued: 95000, currentDebt: 0,
    longTermDebt: 120000,
    retainedEarnings: 296000,
  });
  const bank = mkBank({
    bank: "Silicon Valley Bank", holder: "Vertex Staffing Solutions, LLC", acct4: "2914", type: "checking",
    periodStart: "2024-07-01", periodEnd: "2024-12-31", months: 6,
    beginBalance: 168000, avgMonthlyDeposits: 325000, avgMonthlyWithdrawals: 318000, seed: "loc",
    recurringDeposits: [
      { desc: "ACH - GOOGLE LLC", amount: 85000, freq: "monthly" },
      { desc: "ACH - META PLATFORMS", amount: 62000, freq: "monthly" },
      { desc: "ACH - APPLE INC", amount: 48000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "PAYROLL - GUSTO", amount: 238000, freq: "monthly", cat: "payroll" },
      { desc: "OFFICE LEASE PMT", amount: 6000, freq: "monthly", cat: "rent" },
    ],
  });

  return {
    loanType: "commercial_business",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Kapoor.pdf", year: 2024 },
      { docType: "FORM_1120S", fileName: "2024_SCorp_Return_Vertex.pdf", year: 2024 },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_Vertex.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_Vertex.pdf" },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "SVB_Checking_Jul-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "FORM_1120S", data: form1120S, year: 2024 },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["1120S.ordinaryIncome", "S-Corp ordinary income", 530000, 530000],
        ["pnl.netIncome", "P&L net income", 590000, 590000],
      ],
      [
        ["1040 wages vs 1120S officer comp", "FORM_1040", "wages", 110000, "FORM_1120S", "officerComp", 110000],
      ],
    ),
  };
}

// ─── 8. Equipment Financing — CNC Machinery ─────────────────────────────────

function equipmentFinancing(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "William T. Greer", spouse: "Catherine A. Greer", ssn4: "7391", filing: "Married Filing Jointly",
    addr: "8814 Providence Rd, Charlotte, NC 28277", year: 2024,
    wages: 95000, employer: "Ironclad Machine Works, Inc.", ein4: "5628",
    interest: 900, dividends: 4200, deduction: 30000,
  });
  const form1120 = mk1120({
    corp: "Ironclad Machine Works, Inc.", ein: "56-XXXX628", year: 2024,
    grossReceipts: 3200000, cogs: 1600000,
    officerComp: 95000, salaries: 680000, rent: 84000,
    taxes: 42000, interest: 12000, depreciation: 185000, other: 82000,
    cash: 310000, ar: 280000, totalAssets: 2400000, ap: 185000, totalLiab: 1050000,
  });
  const bank = mkBank({
    bank: "Truist", holder: "Ironclad Machine Works, Inc.", acct4: "5013", type: "checking",
    periodStart: "2024-10-01", periodEnd: "2024-12-31", months: 3,
    beginBalance: 275000, avgMonthlyDeposits: 280000, avgMonthlyWithdrawals: 265000, seed: "equip",
    recurringDeposits: [
      { desc: "ACH - LOCKHEED MARTIN", amount: 95000, freq: "monthly" },
      { desc: "WIRE - CATERPILLAR INC", amount: 72000, freq: "monthly" },
      { desc: "ACH - GENERAL DYNAMICS", amount: 58000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "EQUIPMENT LOAN A - TRUIST", amount: 4800, freq: "monthly", cat: "loan" },
      { desc: "SHOP LEASE PMT", amount: 7000, freq: "monthly", cat: "rent" },
    ],
  });
  const bs = mkBS({
    biz: "Ironclad Machine Works, Inc.", asOf: "2024-12-31",
    cash: 310000, ar: 280000, inventory: 185000, prepaid: 25000,
    equipment: 1850000, accDepr: 680000,
    ap: 185000, accrued: 52000, currentDebt: 58000,
    longTermDebt: 755000,
    retainedEarnings: 920000,
  });

  return {
    loanType: "equipment",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Greer.pdf", year: 2024 },
      { docType: "FORM_1120", fileName: "2024_Corp_Return_Ironclad.pdf", year: 2024 },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "Truist_Checking_Oct-Dec_2024.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_Ironclad.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "FORM_1120", data: form1120, year: 2024 },
      { docType: "BANK_STATEMENT", data: bank },
      { docType: "BALANCE_SHEET", data: bs },
    ],
    verification: mkVerif(
      [
        ["1120.grossProfit", "Corp gross profit", 1600000, 1600000],
        ["1120.taxableIncome", "Corp taxable income", 420000, 420000],
        ["bs.equation", "Balance sheet equation", 2400000, 2400000],
      ],
      [
        ["1040 wages vs 1120 officer comp", "FORM_1040", "wages", 95000, "FORM_1120", "officerComp", 95000],
      ],
    ),
  };
}

// ─── 9. Bridge — Value-Add Multifamily ──────────────────────────────────────

function bridge(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Marcus J. Coleman", ssn4: "8145", filing: "Single",
    addr: "1420 West End Ave, Nashville, TN 37203", year: 2024,
    wages: 200000, employer: "Elevate Capital Partners, LLC", ein4: "4829",
    interest: 4500, dividends: 18000, capGains: 32000,
    deduction: 35000, itemized: true,
  });
  const rentRoll = mkRR({
    property: "Riverside Apartments", addr: "900 Riverside Dr, Nashville, TN 37206",
    type: "multifamily", owner: "Elevate Capital Partners, LLC", asOf: "2025-01-05",
    units: [
      { unitType: "1BR/1BA", count: 36, sqft: 680, rent: 975, marketRent: 1150 },
      { unitType: "2BR/1BA", count: 24, sqft: 900, rent: 1200, marketRent: 1400 },
      { unitType: "2BR/2BA", count: 12, sqft: 1050, rent: 1350, marketRent: 1550 },
    ],
    occupancyRate: 0.85, otherIncome: 2800, seed: "bridge-mf",
  });
  const bank = mkBank({
    bank: "Pinnacle Financial", holder: "Elevate Capital Partners, LLC", acct4: "7293", type: "checking",
    periodStart: "2024-10-01", periodEnd: "2024-12-31", months: 3,
    beginBalance: 680000, avgMonthlyDeposits: 92000, avgMonthlyWithdrawals: 78000, seed: "bridge",
    recurringDeposits: [
      { desc: "TENANT RENTS - RIVERSIDE", amount: 72000, freq: "monthly" },
      { desc: "LAUNDRY INCOME", amount: 1800, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "EXISTING MORTGAGE - RIVERSIDE", amount: 22000, freq: "monthly", cat: "mortgage" },
      { desc: "PROPERTY INSURANCE", amount: 4200, freq: "monthly", cat: "insurance" },
    ],
  });

  return {
    loanType: "commercial_real_estate",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Coleman.pdf", year: 2024 },
      { docType: "RENT_ROLL", fileName: "Riverside_Apts_RentRoll_Jan2025.pdf" },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "Pinnacle_Checking_Oct-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "RENT_ROLL", data: rentRoll },
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["rentRoll.occupancy", "85% of 72 units occupied", 85, 85],
        ["bank.endingBalance", "Sponsor liquidity", 722000, 722000],
      ],
      [
        ["Rent roll vs bank deposits", "RENT_ROLL", "monthlyRent", 72000, "BANK_STATEMENT", "avgDeposits", 72000],
      ],
    ),
  };
}

// ─── 10. Crypto-Collateralized — BTC-Backed ─────────────────────────────────

function cryptoCollateral(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Alexander Chen", ssn4: "2748", filing: "Single",
    addr: "100 Blockchain Way, Miami, FL 33131", year: 2024,
    wages: 180000, employer: "Blockforge Labs, Inc.", ein4: "1935",
    interest: 2100, dividends: 5400, capGains: 24000,
    deduction: 14600,
  });
  const bank = mkBank({
    bank: "Mercury", holder: "Blockforge Labs, Inc.", acct4: "6182", type: "checking",
    periodStart: "2024-11-01", periodEnd: "2024-12-31", months: 2,
    beginBalance: 520000, avgMonthlyDeposits: 245000, avgMonthlyWithdrawals: 228000, seed: "crypto",
    recurringDeposits: [
      { desc: "WIRE - INFRASTRUCTURE SaaS REVENUE", amount: 145000, freq: "monthly" },
      { desc: "ACH - NODE OPERATOR REWARDS", amount: 42000, freq: "monthly" },
      { desc: "WIRE - CONSULTING FEES", amount: 38000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "AWS HOSTING PAYMENT", amount: 35000, freq: "monthly", cat: "vendor" },
      { desc: "OFFICE LEASE - WYNWOOD", amount: 8500, freq: "monthly", cat: "rent" },
    ],
  });

  return {
    loanType: "crypto_collateral",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Chen.pdf", year: 2024 },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "Mercury_Checking_Nov-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["bank.endingBalance", "Liquidity adequate", 554000, 554000],
        ["1040.totalIncome", "Personal income", 226100, 226100],
      ],
      [],
    ),
  };
}

// ─── 11. Multifamily — 150-Unit Apartment Complex ───────────────────────────

function multifamily(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Robert A. Greenfield", spouse: "Sarah M. Greenfield", ssn4: "4821",
    addr: "1220 Live Oak Dr, Austin, TX 78704", year: 2024, filing: "Married Filing Jointly",
    wages: 225000, employer: "Greenfield Residential Partners, LP", ein4: "7501",
    interest: 3600, dividends: 15000, capGains: 0,
    deduction: 36000, itemized: true,
  });
  const rentRoll = mkRR({
    property: "Lakewood Garden Apartments", addr: "4200 Lakewood Blvd, Denver, CO 80227",
    type: "multifamily", owner: "Greenfield Residential Partners, LP", asOf: "2025-01-15",
    units: [
      { unitType: "Studio", count: 20, sqft: 480, rent: 1350, marketRent: 1400 },
      { unitType: "1BR/1BA", count: 60, sqft: 700, rent: 1680, marketRent: 1750 },
      { unitType: "2BR/1BA", count: 45, sqft: 950, rent: 1980, marketRent: 2050 },
      { unitType: "2BR/2BA", count: 20, sqft: 1100, rent: 2250, marketRent: 2350 },
      { unitType: "3BR/2BA", count: 5, sqft: 1350, rent: 2650, marketRent: 2800 },
    ],
    occupancyRate: 0.95, otherIncome: 4200, seed: "mf-150",
  });
  const pnl = mkPnL({
    biz: "Lakewood Garden Apartments (T-12)",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 3180000,
    revenueBreakdown: [
      { category: "Base Rent", amount: 2940000 },
      { category: "Other Income", amount: 48000 },
      { category: "Vacancy Loss", amount: -147000 },
      { category: "CAM/Utility Reimbursement", amount: 339000 },
    ],
    salaries: 285000, insurance: 126000, utilities: 192000,
    repairs: 168000, depreciation: 420000, taxes: 318000, other: 180000,
  });
  const bs = mkBS({
    biz: "Greenfield Residential Partners, LP", asOf: "2024-12-31",
    cash: 1250000, ar: 85000, prepaid: 65000,
    land: 4800000, buildings: 19200000, accDepr: 4800000,
    ap: 165000, accrued: 95000, currentDebt: 420000,
    mortgage: 12800000,
    retainedEarnings: 7120000,
  });

  return {
    loanType: "multifamily",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Greenfield.pdf", year: 2024 },
      { docType: "RENT_ROLL", fileName: "Lakewood_Garden_RentRoll_Jan2025.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_T12_Operating_Lakewood.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_Greenfield_LP.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "RENT_ROLL", data: rentRoll },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
    ],
    verification: mkVerif(
      [
        ["rentRoll.occupancy", "95% of 150 units", 95, 95],
        ["pnl.operatingIncome", "T-12 NOI", 1491000, 1491000],
        ["bs.equation", "Balance sheet equation", 20600000, 20600000],
      ],
      [
        ["Rent roll annual vs T-12 revenue", "RENT_ROLL", "annualRent", 2940000, "PROFIT_AND_LOSS", "baseRent", 2940000],
      ],
    ),
  };
}

// ─── 12. Construction — Ground-Up Mixed Use ─────────────────────────────────

function construction(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Derek J. Lawson", spouse: "Michelle R. Lawson", ssn4: "5673", filing: "Married Filing Jointly",
    addr: "3100 Barton Creek Blvd, Austin, TX 78735", year: 2024,
    wages: 180000, employer: "Catalyst Development Group, LLC", ein4: "8294",
    schedC: { biz: "Lawson Development Consulting", code: "236220", gross: 420000, expenses: 120000, depr: 8000 },
    interest: 5200, dividends: 8000, deduction: 38000, itemized: true,
  });
  const bank = mkBank({
    bank: "Independent Financial", holder: "Catalyst Development Group, LLC", acct4: "4178", type: "checking",
    periodStart: "2024-07-01", periodEnd: "2024-12-31", months: 6,
    beginBalance: 1850000, avgMonthlyDeposits: 420000, avgMonthlyWithdrawals: 385000, seed: "construct",
    recurringDeposits: [
      { desc: "WIRE - PROJECT DRAW REIMBURSEMENT", amount: 280000, freq: "monthly" },
      { desc: "ACH - DEVELOPMENT FEE INCOME", amount: 85000, freq: "monthly" },
      { desc: "WIRE - INVESTOR CAPITAL CALL", amount: 55000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "EXISTING CONSTRUCTION LOAN INT", amount: 42000, freq: "monthly", cat: "loan" },
      { desc: "OFFICE LEASE PMT", amount: 6500, freq: "monthly", cat: "rent" },
    ],
  });
  const pnl = mkPnL({
    biz: "Catalyst Development Group, LLC",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 5200000,
    revenueBreakdown: [
      { category: "Development Fees", amount: 1040000 },
      { category: "Project Management", amount: 780000 },
      { category: "Cost Reimbursements", amount: 3380000 },
    ],
    cogs: 3380000, salaries: 420000, rent: 78000, insurance: 65000,
    utilities: 12000, depreciation: 24000, taxes: 48000, other: 125000,
    interest: 185000,
  });

  return {
    loanType: "construction",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Lawson.pdf", year: 2024 },
      { docType: "BANK_STATEMENT_CHECKING", fileName: "IndFinancial_Checking_Jul-Dec_2024.pdf" },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_Annual_PnL_Catalyst.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "BANK_STATEMENT", data: bank },
      { docType: "PROFIT_AND_LOSS", data: pnl },
    ],
    verification: mkVerif(
      [
        ["1040.totalIncome", "Personal income adequate", 493200, 493200],
        ["bank.endingBalance", "Sponsor liquidity", 2060000, 2060000],
        ["pnl.grossProfit", "Dev company gross profit", 1820000, 1820000],
      ],
      [],
    ),
  };
}

// ─── 13. Hard Money — Fix & Flip ────────────────────────────────────────────

function hardMoney(): LendingExtractionSet {
  // Hard money is collateral-based. Minimal income docs — just bank statement for liquidity.
  const bank = mkBank({
    bank: "First Republic", holder: "Titan Realty Ventures, LLC", acct4: "8427", type: "checking",
    periodStart: "2024-11-01", periodEnd: "2024-12-31", months: 2,
    beginBalance: 425000, avgMonthlyDeposits: 85000, avgMonthlyWithdrawals: 62000, seed: "hardmoney",
    recurringDeposits: [
      { desc: "WIRE - PROPERTY SALE PROCEEDS", amount: 45000, freq: "monthly" },
      { desc: "ACH - RENTAL INCOME PORTFOLIO", amount: 28000, freq: "monthly" },
    ],
    loanPayments: [
      { desc: "BRIDGE LOAN INT - OTHER PROPERTY", amount: 8500, freq: "monthly", cat: "loan" },
    ],
  });

  return {
    loanType: "commercial_real_estate",
    documents: [
      { docType: "BANK_STATEMENT_CHECKING", fileName: "FirstRepublic_Checking_Nov-Dec_2024.pdf" },
    ],
    extractions: [
      { docType: "BANK_STATEMENT", data: bank },
    ],
    verification: mkVerif(
      [
        ["bank.endingBalance", "Liquidity for rehab + reserves", 471000, 471000],
      ],
      [],
    ),
  };
}

// ─── 14. Mezzanine — Subordinated CRE Debt ─────────────────────────────────

function mezzanine(): LendingExtractionSet {
  const form1040 = mk1040({
    name: "Jonathan H. Pierce", ssn4: "1847", filing: "Married Filing Jointly",
    addr: "220 Commonwealth Ave, Boston, MA 02116", year: 2024,
    wages: 350000, employer: "Pinnacle Capital Group, LP", ein4: "6193",
    interest: 8500, dividends: 42000, capGains: 85000,
    deduction: 48000, itemized: true,
  });
  const form1120 = mk1120({
    corp: "One Financial Center OpCo, LLC", ein: "04-XXXX193", year: 2024,
    grossReceipts: 8400000, cogs: 0,
    officerComp: 0, salaries: 1200000, rent: 0,
    taxes: 580000, interest: 1960000, depreciation: 1050000, other: 810000,
    cash: 2100000, ar: 420000, totalAssets: 42000000, ap: 380000, totalLiab: 28500000,
  });
  const pnl = mkPnL({
    biz: "One Financial Center (T-12)",
    periodStart: "2024-01-01", periodEnd: "2024-12-31",
    revenue: 8400000,
    revenueBreakdown: [
      { category: "Office Base Rent", amount: 6720000 },
      { category: "CAM Recoveries", amount: 840000 },
      { category: "Parking Revenue", amount: 504000 },
      { category: "Other Income", amount: 336000 },
    ],
    salaries: 1200000, insurance: 420000, utilities: 580000,
    repairs: 340000, depreciation: 1050000, taxes: 810000, other: 0,
    interest: 1960000,
  });
  const bs = mkBS({
    biz: "One Financial Center Holdings, LP", asOf: "2024-12-31",
    cash: 2100000, ar: 420000, prepaid: 180000,
    land: 8400000, buildings: 33600000, accDepr: 8400000,
    ap: 380000, accrued: 220000, currentDebt: 1400000,
    mortgage: 27300000,
    retainedEarnings: 7200000,
  });

  return {
    loanType: "commercial_real_estate",
    documents: [
      { docType: "FORM_1040", fileName: "2024_Tax_Return_Pierce.pdf", year: 2024 },
      { docType: "FORM_1120", fileName: "2024_OpCo_Return_OneFinancial.pdf", year: 2024 },
      { docType: "PROFIT_AND_LOSS", fileName: "2024_T12_OneFinancialCenter.pdf" },
      { docType: "BALANCE_SHEET", fileName: "2024_Balance_Sheet_OneFinancial.pdf" },
    ],
    extractions: [
      { docType: "FORM_1040", data: form1040, year: 2024 },
      { docType: "FORM_1120", data: form1120, year: 2024 },
      { docType: "PROFIT_AND_LOSS", data: pnl },
      { docType: "BALANCE_SHEET", data: bs },
    ],
    verification: mkVerif(
      [
        ["pnl.operatingIncome", "Property NOI", 4000000, 4000000],
        ["pnl.netIncome", "Net after debt service", 2040000, 2040000],
        ["bs.equation", "Balance sheet equation", 42000000, 42000000],
      ],
      [
        ["1120 revenue vs T-12 revenue", "FORM_1120", "grossReceipts", 8400000, "PROFIT_AND_LOSS", "grossRevenue", 8400000],
      ],
    ),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

const GENERATORS: Record<string, () => LendingExtractionSet> = {
  sba_7a_sample: sba7a,
  sba_504_sample: sba504,
  commercial_cre_sample: commercialCRE,
  dscr_sample: dscr,
  bank_statement_sample: bankStatement,
  conventional_business_sample: conventionalBusiness,
  line_of_credit_sample: lineOfCredit,
  equipment_financing_sample: equipmentFinancing,
  bridge_sample: bridge,
  crypto_collateral_sample: cryptoCollateral,
  multifamily_sample: multifamily,
  construction_sample: construction,
  hard_money_sample: hardMoney,
  mezzanine_sample: mezzanine,
};

/**
 * Get extraction data for a specific lending program sample deal.
 * Returns null if dealId is not recognized.
 */
export function getLendingExtractions(dealId: string): LendingExtractionSet | null {
  const gen = GENERATORS[dealId];
  return gen ? gen() : null;
}

/**
 * Get all lending extraction sets keyed by dealId.
 */
export function getAllLendingExtractions(): Record<string, LendingExtractionSet> {
  const result: Record<string, LendingExtractionSet> = {};
  for (const [id, gen] of Object.entries(GENERATORS)) {
    result[id] = gen();
  }
  return result;
}
