// OpenShut Analysis Engine — Income Analysis
// 100% deterministic. Zero AI. Pure TypeScript math.

export interface IncomeSource {
  type:
    | "w2"
    | "self_employment"
    | "rental"
    | "partnership"
    | "scorp"
    | "interest"
    | "dividends"
    | "social_security"
    | "pension"
    | "other";
  description: string;
  grossAmount: number;
  netAmount: number;
  year: number;
  recurring: boolean;
}

export interface IncomeAnalysis {
  sources: IncomeSource[];
  totalGrossIncome: number;
  totalNetIncome: number;
  qualifyingIncome: number; // Used for DTI/DSCR — 2-year avg for SE, lower year if declining
  incomeByYear: Record<number, { gross: number; net: number }>;
  trend: "increasing" | "stable" | "declining";
  trendPercent: number; // YoY change as decimal
  selfEmployedIncome: number;
  w2Income: number;
  passiveIncome: number;
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

// Extraction helpers — pull income sources from each document type

function extractW2Income(data: any, year: number): IncomeSource[] {
  const sources: IncomeSource[] = [];

  // W-2 summary or direct W-2 data
  const wages = num(data.wages ?? data.wagesTipsComp ?? data.box1);
  if (wages > 0) {
    sources.push({
      type: "w2",
      description: data.employerName
        ? `W-2: ${data.employerName}`
        : "W-2 Wages",
      grossAmount: wages,
      netAmount: wages,
      year,
      recurring: true,
    });
  }

  // If there's a w2Summary array with multiple W-2s
  if (Array.isArray(data.w2Summary)) {
    for (const w2 of data.w2Summary) {
      const w2wages = num(w2.wages ?? w2.wagesTipsComp ?? w2.box1);
      if (w2wages > 0) {
        sources.push({
          type: "w2",
          description: w2.employerName
            ? `W-2: ${w2.employerName}`
            : "W-2 Wages",
          grossAmount: w2wages,
          netAmount: w2wages,
          year,
          recurring: true,
        });
      }
    }
  }

  return sources;
}

function extract1040Income(data: any, year: number): IncomeSource[] {
  const sources: IncomeSource[] = [];

  // Line 1: Wages (only if we haven't captured individual W-2s)
  const line1 = num(data.line1 ?? data.wages ?? data.wagesSalariesTips);
  if (line1 > 0 && !data.w2Summary && !data.employerName) {
    sources.push({
      type: "w2",
      description: "1040 Line 1 — Wages, Salaries, Tips",
      grossAmount: line1,
      netAmount: line1,
      year,
      recurring: true,
    });
  }

  // Interest income
  const interest = num(data.taxableInterest ?? data.line2b ?? data.interestIncome);
  if (interest > 0) {
    sources.push({
      type: "interest",
      description: "Taxable Interest",
      grossAmount: interest,
      netAmount: interest,
      year,
      recurring: true,
    });
  }

  // Dividends
  const dividends = num(data.ordinaryDividends ?? data.line3b ?? data.dividendIncome);
  if (dividends > 0) {
    sources.push({
      type: "dividends",
      description: "Ordinary Dividends",
      grossAmount: dividends,
      netAmount: dividends,
      year,
      recurring: true,
    });
  }

  // Social Security
  const ss = num(data.socialSecurityBenefits ?? data.line6a ?? data.ssaBenefits);
  const ssTaxable = num(data.taxableSocialSecurity ?? data.line6b);
  if (ss > 0) {
    sources.push({
      type: "social_security",
      description: "Social Security Benefits",
      grossAmount: ss,
      netAmount: ssTaxable > 0 ? ssTaxable : ss,
      year,
      recurring: true,
    });
  }

  // Pension/annuity income
  const pension = num(data.pensionIncome ?? data.line5a ?? data.iRADistributions);
  const pensionTaxable = num(data.taxablePension ?? data.line5b);
  if (pension > 0) {
    sources.push({
      type: "pension",
      description: "Pension / Annuity Income",
      grossAmount: pension,
      netAmount: pensionTaxable > 0 ? pensionTaxable : pension,
      year,
      recurring: true,
    });
  }

  return sources;
}

function extractScheduleCIncome(data: any, year: number): IncomeSource[] {
  const sources: IncomeSource[] = [];

  const grossReceipts = num(data.grossReceipts ?? data.grossIncome ?? data.totalIncome);
  const netProfit = num(data.netProfit ?? data.netIncome ?? data.line31);
  const depreciation = num(data.depreciation ?? data.depreciationDeduction);
  const amortization = num(data.amortization ?? data.amortizationDeduction);

  // Add-backs: depreciation + amortization are non-cash expenses an underwriter adds back
  const adjustedNet = netProfit + depreciation + amortization;

  if (grossReceipts > 0 || netProfit !== 0) {
    sources.push({
      type: "self_employment",
      description: data.businessName
        ? `Schedule C: ${data.businessName}`
        : "Schedule C — Self-Employment",
      grossAmount: grossReceipts,
      netAmount: adjustedNet,
      year,
      recurring: true,
    });
  }

  return sources;
}

function extractScheduleEIncome(data: any, year: number): IncomeSource[] {
  const sources: IncomeSource[] = [];

  // Schedule E often has multiple rental properties
  // Per Fannie Mae B3-3.1-09: add back depreciation/amortization (non-cash expenses)
  if (Array.isArray(data.properties)) {
    for (const prop of data.properties) {
      const rents = num(prop.rentsReceived ?? prop.grossRent ?? prop.totalIncome);
      const netRental = num(prop.netRentalIncome ?? prop.netIncome ?? prop.totalNetIncome);
      const depreciation = num(prop.depreciation ?? prop.depreciationExpense ?? 0);
      const amortization = num(prop.amortization ?? prop.amortizationExpense ?? 0);
      const adjustedNet = netRental + depreciation + amortization;
      sources.push({
        type: "rental",
        description: prop.address
          ? `Rental: ${prop.address}`
          : "Schedule E — Rental Property",
        grossAmount: rents,
        netAmount: adjustedNet,
        year,
        recurring: true,
      });
    }
  } else {
    // Single rental or aggregated
    const rents = num(data.totalRentsReceived ?? data.rentsReceived ?? data.grossRent);
    const netRental = num(data.totalNetRentalIncome ?? data.netRentalIncome ?? data.netIncome);
    const depreciation = num(data.depreciation ?? data.totalDepreciation ?? 0);
    const amortization = num(data.amortization ?? data.totalAmortization ?? 0);
    const adjustedNet = netRental + depreciation + amortization;
    if (rents > 0 || adjustedNet !== 0) {
      sources.push({
        type: "rental",
        description: data.address
          ? `Rental: ${data.address}`
          : "Schedule E — Rental Income",
        grossAmount: rents,
        netAmount: adjustedNet,
        year,
        recurring: true,
      });
    }
  }

  return sources;
}

function extractK1Income(data: any, year: number): IncomeSource[] {
  const sources: IncomeSource[] = [];

  const isScorp = data.formType === "1120S" || data.entityType === "scorp" || data.isSCorp;
  const type: IncomeSource["type"] = isScorp ? "scorp" : "partnership";

  const ordinary = num(data.ordinaryIncome ?? data.ordinaryBusinessIncome ?? data.box1);
  const guaranteed = num(data.guaranteedPayments ?? data.box4);
  const netRental = num(data.netRentalIncome ?? data.box2);

  const grossAmt = ordinary + guaranteed + netRental;
  const netAmt = grossAmt; // K-1 amounts are already net to the partner/shareholder

  if (grossAmt !== 0) {
    sources.push({
      type,
      description: data.entityName
        ? `K-1: ${data.entityName}`
        : `K-1 — ${isScorp ? "S-Corp" : "Partnership"}`,
      grossAmount: grossAmt,
      netAmount: netAmt,
      year,
      recurring: true,
    });
  }

  return sources;
}

// Main analysis function

export function analyzeIncome(
  extractions: Array<{ docType: string; data: any; year?: number }>
): IncomeAnalysis {
  const sources: IncomeSource[] = [];
  const notes: string[] = [];
  const currentYear = new Date().getFullYear();

  // Track which W-2 employers we've seen to avoid double-counting
  const seenW2Employers = new Set<string>();

  for (const extraction of extractions) {
    const { docType, data, year } = extraction;
    const docYear = year ?? (num(data.taxYear ?? data.year) || currentYear);
    const type = docType.toLowerCase().replace(/[\s\-_]/g, "");

    let extracted: IncomeSource[] = [];

    if (type === "w2" || type === "w2summary") {
      extracted = extractW2Income(data, docYear);
    } else if (type === "1040" || type === "form1040" || type === "1040return") {
      // 1040 may contain W-2 summary data too
      extracted = [
        ...extractW2Income(data, docYear),
        ...extract1040Income(data, docYear),
      ];
    } else if (type === "schedulec" || type === "schedc") {
      extracted = extractScheduleCIncome(data, docYear);
    } else if (type === "schedulee" || type === "schede") {
      extracted = extractScheduleEIncome(data, docYear);
    } else if (type === "k1" || type === "schedulek1" || type === "k1partnership" || type === "k1scorp") {
      extracted = extractK1Income(data, docYear);
    } else if (type === "1065" || type === "form1065") {
      // Partnership return — extract like K-1 but mark as partnership
      extracted = extractK1Income({ ...data, entityType: "partnership" }, docYear);
    } else if (type === "1120s" || type === "form1120s") {
      extracted = extractK1Income({ ...data, entityType: "scorp", isSCorp: true }, docYear);
    }

    // Deduplicate W-2 income — same employer + same year = skip
    for (const src of extracted) {
      if (src.type === "w2") {
        const key = `${src.description}::${src.year}::${src.grossAmount}`;
        if (seenW2Employers.has(key)) continue;
        seenW2Employers.add(key);
      }
      sources.push(src);
    }
  }

  // Aggregate by year
  const incomeByYear: Record<number, { gross: number; net: number }> = {};
  for (const src of sources) {
    if (!incomeByYear[src.year]) {
      incomeByYear[src.year] = { gross: 0, net: 0 };
    }
    incomeByYear[src.year].gross += src.grossAmount;
    incomeByYear[src.year].net += src.netAmount;
  }

  const years = Object.keys(incomeByYear)
    .map(Number)
    .sort((a, b) => a - b);

  // Totals (most recent year)
  const latestYear = years[years.length - 1] ?? currentYear;
  const latestYearSources = sources.filter((s) => s.year === latestYear);

  const totalGrossIncome = latestYearSources.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalNetIncome = latestYearSources.reduce((sum, s) => sum + s.netAmount, 0);

  // Income by category
  const w2Income = latestYearSources
    .filter((s) => s.type === "w2")
    .reduce((sum, s) => sum + s.netAmount, 0);

  const selfEmployedIncome = latestYearSources
    .filter((s) => s.type === "self_employment")
    .reduce((sum, s) => sum + s.netAmount, 0);

  const passiveIncome = latestYearSources
    .filter((s) =>
      ["rental", "interest", "dividends", "social_security", "pension"].includes(s.type)
    )
    .reduce((sum, s) => sum + s.netAmount, 0);

  // Trend calculation
  let trend: "increasing" | "stable" | "declining" = "stable";
  let trendPercent = 0;

  if (years.length >= 2) {
    const prevYear = years[years.length - 2];
    const prevNet = incomeByYear[prevYear].net;
    const latestNet = incomeByYear[latestYear].net;

    if (prevNet !== 0) {
      trendPercent = (latestNet - prevNet) / Math.abs(prevNet);
    } else if (latestNet > 0) {
      trendPercent = 1; // went from 0 to positive
    }

    if (trendPercent > 0.05) {
      trend = "increasing";
    } else if (trendPercent < -0.05) {
      trend = "declining";
    }
  }

  // Qualifying income (underwriting rules)
  let qualifyingIncome = 0;

  // W-2: use most recent year
  qualifyingIncome += w2Income;

  // Self-employment: 2-year average, or lower year if declining
  const seSourcesByYear: Record<number, number> = {};
  for (const src of sources) {
    if (src.type === "self_employment") {
      seSourcesByYear[src.year] = (seSourcesByYear[src.year] ?? 0) + src.netAmount;
    }
  }
  const seYears = Object.keys(seSourcesByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (seYears.length >= 2) {
    const recent = seSourcesByYear[seYears[seYears.length - 1]];
    const prior = seSourcesByYear[seYears[seYears.length - 2]];
    const avg = (recent + prior) / 2;

    if (recent < prior) {
      // Declining — use the lower (most recent) year
      qualifyingIncome += recent;
      notes.push(
        `Self-employment income declining (${seYears[seYears.length - 2]}: $${prior.toLocaleString()} -> ${seYears[seYears.length - 1]}: $${recent.toLocaleString()}). Using lower year for qualifying.`
      );
    } else {
      // Stable or increasing — use 2-year average
      qualifyingIncome += avg;
      notes.push(
        `Self-employment income: 2-year average = $${Math.round(avg).toLocaleString()}.`
      );
    }
  } else if (seYears.length === 1) {
    qualifyingIncome += seSourcesByYear[seYears[0]];
    notes.push("Only 1 year of self-employment history available.");
  }

  // Partnership / S-Corp: same rules as self-employment (2-year avg, lower if declining)
  const passthruTypes: IncomeSource["type"][] = ["partnership", "scorp"];
  const passthruByYear: Record<number, number> = {};
  for (const src of sources) {
    if (passthruTypes.includes(src.type)) {
      passthruByYear[src.year] = (passthruByYear[src.year] ?? 0) + src.netAmount;
    }
  }
  const passthruYears = Object.keys(passthruByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (passthruYears.length >= 2) {
    const recent = passthruByYear[passthruYears[passthruYears.length - 1]];
    const prior = passthruByYear[passthruYears[passthruYears.length - 2]];
    const avg = (recent + prior) / 2;
    qualifyingIncome += recent < prior ? recent : avg;
  } else if (passthruYears.length === 1) {
    qualifyingIncome += passthruByYear[passthruYears[0]];
  }

  // Rental income: use net rental from most recent year
  const rentalIncome = latestYearSources
    .filter((s) => s.type === "rental")
    .reduce((sum, s) => sum + s.netAmount, 0);
  qualifyingIncome += rentalIncome;

  // Passive: interest, dividends, SS, pension — use most recent year
  const otherPassive = latestYearSources
    .filter((s) =>
      ["interest", "dividends", "social_security", "pension", "other"].includes(s.type)
    )
    .reduce((sum, s) => sum + s.netAmount, 0);
  qualifyingIncome += otherPassive;

  // Additional notes
  if (sources.length === 0) {
    notes.push("No income sources identified from provided documents.");
  }

  if (trend === "declining") {
    notes.push(
      `Overall income declining ${Math.abs(Math.round(trendPercent * 100))}% year-over-year.`
    );
  }

  const numYears = years.length;
  if (numYears < 2) {
    notes.push("Less than 2 years of income history provided.");
  }

  return {
    sources,
    totalGrossIncome,
    totalNetIncome,
    qualifyingIncome,
    incomeByYear,
    trend,
    trendPercent: Math.round(trendPercent * 10000) / 10000, // 4 decimal places
    selfEmployedIncome,
    w2Income,
    passiveIncome,
    notes,
  };
}
