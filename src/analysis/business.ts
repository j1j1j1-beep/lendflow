// OpenShut Analysis Engine — Business / Self-Employment Analysis
// 100% deterministic. Zero AI. Pure TypeScript math.

export interface BusinessAnalysis {
  revenueByYear: Record<number, number>;
  revenueTrend: "increasing" | "stable" | "declining";
  revenueTrendPercent: number;
  expenseRatio: number; // total expenses / revenue
  ownerCompensation: number;
  addBacks: {
    depreciation: number;
    amortization: number;
    interest: number;
    ownerComp: number;
    oneTime: number;
    total: number;
  };
  adjustedNetIncome: number; // net income + add-backs
  adjustedNetByYear: Record<number, number>;
  notes: string[];
}

// Helpers

function num(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[$,\s]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const BUSINESS_DOC_TYPES = new Set([
  "schedulec",
  "schedc",
  "1120",
  "form1120",
  "1120s",
  "form1120s",
  "1065",
  "form1065",
  "profitandloss",
  "pl",
  "p&l",
  "pandl",
  "incomestatement",
]);

function normalizeDocType(docType: string): string {
  return docType.toLowerCase().replace(/[\s\-_]/g, "");
}

// Per-document extraction

interface BusinessYearData {
  year: number;
  revenue: number;
  totalExpenses: number;
  netIncome: number;
  depreciation: number;
  amortization: number;
  interestExpense: number;
  ownerOfficerComp: number;
  oneTimeItems: number;
  docType: string;
}

function extractScheduleC(data: any, year: number): BusinessYearData {
  const revenue = num(data.grossReceipts ?? data.grossIncome ?? data.totalIncome ?? 0);
  const totalExpenses = num(data.totalExpenses ?? data.totalDeductions ?? 0);
  const netIncome = num(data.netProfit ?? data.netIncome ?? data.line31 ?? revenue - totalExpenses);
  const depreciation = num(data.depreciation ?? data.depreciationDeduction ?? 0);
  const amortization = num(data.amortization ?? data.amortizationDeduction ?? 0);
  const interestExpense = num(
    data.interestExpense ?? data.mortgageInterest ?? data.otherInterest ?? 0
  );

  // Owner draws / personal expenses run through the business
  const ownerOfficerComp = 0; // Schedule C doesn't have officer comp — the net IS the owner's income

  // One-time items: casualty/theft losses should be added back (positive adjustment)
  const oneTimeItems = Math.abs(num(data.casualtyLoss ?? data.otherLoss ?? 0));

  return {
    year,
    revenue,
    totalExpenses,
    netIncome,
    depreciation,
    amortization,
    interestExpense,
    ownerOfficerComp,
    oneTimeItems,
    docType: "schedulec",
  };
}

function extractCorporateReturn(data: any, year: number, docType: string): BusinessYearData {
  // Works for 1120, 1120S, 1065
  const revenue = num(
    data.grossReceipts ??
    data.totalIncome ??
    data.grossRevenue ??
    data.totalRevenue ??
    0
  );

  const totalExpenses = num(
    data.totalDeductions ??
    data.totalExpenses ??
    0
  );

  const netIncome = num(
    data.taxableIncome ??
    data.ordinaryBusinessIncome ??
    data.netIncome ??
    data.netProfit ??
    revenue - totalExpenses
  );

  const depreciation = num(data.depreciation ?? data.depreciationDeduction ?? 0);
  const amortization = num(data.amortization ?? data.amortizationDeduction ?? 0);
  const interestExpense = num(data.interestExpense ?? data.interestPaid ?? 0);

  const ownerOfficerComp = num(
    data.officerCompensation ??
    data.officersCompensation ??
    data.ownerCompensation ??
    data.guaranteedPayments ??
    0
  );

  // One-time adjustment: gains reduce adjusted income (subtract), losses increase it (add back)
  // Convention: positive = loss (add back), negative = gain (subtract)
  const rawGainLoss = num(data.netGainLoss ?? data.otherGainLoss ?? 0);
  const rawExtraordinary = num(data.extraordinaryItems ?? 0);
  // Negate because gains (positive values) should reduce adjusted income
  const oneTimeItems = -rawGainLoss + -rawExtraordinary;

  return {
    year,
    revenue,
    totalExpenses,
    netIncome,
    depreciation,
    amortization,
    interestExpense,
    ownerOfficerComp,
    oneTimeItems,
    docType: normalizeDocType(docType),
  };
}

function extractProfitAndLoss(data: any, year: number): BusinessYearData {
  const revenue = num(
    data.totalRevenue ??
    data.grossRevenue ??
    data.totalSales ??
    data.netSales ??
    data.totalIncome ??
    0
  );

  const totalExpenses = num(
    data.totalExpenses ??
    data.totalOperatingExpenses ??
    0
  );

  const netIncome = num(
    data.netIncome ??
    data.netProfit ??
    data.netProfitLoss ??
    data.bottomLine ??
    revenue - totalExpenses
  );

  const depreciation = num(data.depreciation ?? data.depreciationExpense ?? 0);
  const amortization = num(data.amortization ?? data.amortizationExpense ?? 0);
  const interestExpense = num(data.interestExpense ?? 0);

  const ownerOfficerComp = num(
    data.officerCompensation ??
    data.ownerSalary ??
    data.ownerDraw ??
    data.ownerCompensation ??
    0
  );

  // One-time expenses are losses → add back (positive adjustment)
  // One-time income/gains would be negative in the data → negate to subtract
  const rawOneTime = num(data.oneTimeExpenses ?? data.extraordinaryItems ?? 0);
  // If positive (expense), add back; if negative (gain), subtract
  const oneTimeItems = rawOneTime;

  return {
    year,
    revenue,
    totalExpenses,
    netIncome,
    depreciation,
    amortization,
    interestExpense,
    ownerOfficerComp,
    oneTimeItems,
    docType: "profitandloss",
  };
}

// Main business analysis

export function analyzeBusiness(
  extractions: Array<{ docType: string; data: any; year?: number }>
): BusinessAnalysis | null {
  const currentYear = new Date().getFullYear();

  // Filter to business documents only
  const businessDocs = extractions.filter((e) =>
    BUSINESS_DOC_TYPES.has(normalizeDocType(e.docType))
  );

  if (businessDocs.length === 0) {
    return null;
  }

  // Extract data from each document
  const yearDataEntries: BusinessYearData[] = [];

  for (const doc of businessDocs) {
    const year = doc.year ?? (num(doc.data.taxYear ?? doc.data.year) || currentYear);
    const type = normalizeDocType(doc.docType);

    let entry: BusinessYearData;

    if (type === "schedulec" || type === "schedc") {
      entry = extractScheduleC(doc.data, year);
    } else if (type === "profitandloss" || type === "pl" || type === "p&l" || type === "pandl" || type === "incomestatement") {
      entry = extractProfitAndLoss(doc.data, year);
    } else {
      entry = extractCorporateReturn(doc.data, year, doc.docType);
    }

    yearDataEntries.push(entry);
  }

  // Aggregate by year (sum if multiple business entities per year)
  const byYear: Record<number, BusinessYearData[]> = {};
  for (const entry of yearDataEntries) {
    if (!byYear[entry.year]) {
      byYear[entry.year] = [];
    }
    byYear[entry.year].push(entry);
  }

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);

  // Revenue by year
  const revenueByYear: Record<number, number> = {};
  const adjustedNetByYear: Record<number, number> = {};

  for (const yr of years) {
    const entries = byYear[yr];
    revenueByYear[yr] = entries.reduce((s, e) => s + e.revenue, 0);

    const yearNet = entries.reduce((s, e) => s + e.netIncome, 0);
    const yearAddBacks =
      entries.reduce((s, e) => s + e.depreciation, 0) +
      entries.reduce((s, e) => s + e.amortization, 0) +
      entries.reduce((s, e) => s + e.interestExpense, 0) +
      entries.reduce((s, e) => s + e.ownerOfficerComp, 0) +
      entries.reduce((s, e) => s + e.oneTimeItems, 0);

    adjustedNetByYear[yr] = yearNet + yearAddBacks;
  }

  // Revenue trend
  let revenueTrend: "increasing" | "stable" | "declining" = "stable";
  let revenueTrendPercent = 0;

  if (years.length >= 2) {
    const latestYear = years[years.length - 1];
    const prevYear = years[years.length - 2];
    const latestRev = revenueByYear[latestYear];
    const prevRev = revenueByYear[prevYear];

    if (prevRev > 0) {
      revenueTrendPercent = (latestRev - prevRev) / prevRev;
    } else if (latestRev > 0) {
      revenueTrendPercent = 1;
    }

    if (revenueTrendPercent > 0.05) {
      revenueTrend = "increasing";
    } else if (revenueTrendPercent < -0.05) {
      revenueTrend = "declining";
    }
  }

  revenueTrendPercent = Math.round(revenueTrendPercent * 10000) / 10000;

  // Aggregate add-backs (most recent year, or all if single year)
  const latestYear = years[years.length - 1];
  const latestEntries = byYear[latestYear];

  const depreciation = latestEntries.reduce((s, e) => s + e.depreciation, 0);
  const amortization = latestEntries.reduce((s, e) => s + e.amortization, 0);
  const interest = latestEntries.reduce((s, e) => s + e.interestExpense, 0);
  const ownerComp = latestEntries.reduce((s, e) => s + e.ownerOfficerComp, 0);
  const oneTime = latestEntries.reduce((s, e) => s + e.oneTimeItems, 0);
  const totalAddBacks = depreciation + amortization + interest + ownerComp + oneTime;

  const latestNetIncome = latestEntries.reduce((s, e) => s + e.netIncome, 0);
  const adjustedNetIncome = latestNetIncome + totalAddBacks;

  // Expense ratio
  const latestRevenue = revenueByYear[latestYear] || 0;
  const latestExpenses = latestEntries.reduce((s, e) => s + e.totalExpenses, 0);
  const expenseRatio = latestRevenue > 0
    ? Math.round((latestExpenses / latestRevenue) * 10000) / 10000
    : 0;

  // Notes
  const notes: string[] = [];

  notes.push(
    `Analyzed ${businessDocs.length} business document(s) across ${years.length} year(s).`
  );

  if (totalAddBacks > 0) {
    notes.push(
      `Total add-backs (${latestYear}): $${Math.round(totalAddBacks).toLocaleString()} ` +
      `(depreciation: $${Math.round(depreciation).toLocaleString()}, ` +
      `amortization: $${Math.round(amortization).toLocaleString()}, ` +
      `interest: $${Math.round(interest).toLocaleString()}, ` +
      `owner comp: $${Math.round(ownerComp).toLocaleString()}, ` +
      `one-time: $${Math.round(oneTime).toLocaleString()}).`
    );
  }

  if (expenseRatio > 0.85) {
    notes.push(
      `High expense ratio: ${(expenseRatio * 100).toFixed(1)}%. ` +
      `Margins are thin — small revenue declines could eliminate profitability.`
    );
  }

  if (revenueTrend === "declining") {
    notes.push(
      `Revenue declining ${Math.abs(Math.round(revenueTrendPercent * 100))}% year-over-year.`
    );
  }

  if (years.length < 2) {
    notes.push("Only 1 year of business data. Trend analysis limited.");
  }

  // Check if multiple business entities exist in the same year
  for (const yr of years) {
    if (byYear[yr].length > 1) {
      const types = byYear[yr].map((e) => e.docType).join(", ");
      notes.push(`Multiple business entities in ${yr}: ${types}.`);
    }
  }

  return {
    revenueByYear,
    revenueTrend,
    revenueTrendPercent,
    expenseRatio,
    ownerCompensation: ownerComp,
    addBacks: {
      depreciation,
      amortization,
      interest,
      ownerComp,
      oneTime,
      total: totalAddBacks,
    },
    adjustedNetIncome,
    adjustedNetByYear,
    notes,
  };
}
