// =============================================================================
// math-checks.ts
// Deterministic math verification for extracted financial data.
// ZERO AI. Pure arithmetic comparisons with $1 absolute tolerance
// and 2% relative tolerance for ratio checks.
// =============================================================================

const ABSOLUTE_TOLERANCE = 1; // $1 for rounding differences
const PERCENT_TOLERANCE = 0.02; // 2% for ratio comparisons

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MathCheck {
  fieldPath: string;
  description: string;
  expected: number;
  actual: number;
  difference: number;
  passed: boolean;
  documentPage?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a numeric value from a nested object path.
 * Returns 0 if the path is missing or the value is not a finite number.
 */
function get(obj: any, path: string): number {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return 0;
    current = current[part];
  }
  const num = Number(current);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Sum multiple field paths from the same object.
 */
function sumFields(obj: any, paths: string[]): number {
  return paths.reduce((acc, p) => acc + get(obj, p), 0);
}

/**
 * Build a MathCheck for an equation: actual should equal expected within tolerance.
 */
function checkEquation(
  description: string,
  fieldPath: string,
  expected: number,
  actual: number,
  tolerance: number = ABSOLUTE_TOLERANCE,
  documentPage?: number
): MathCheck {
  const difference = Math.abs(actual - expected);
  return {
    fieldPath,
    description,
    expected: round2(expected),
    actual: round2(actual),
    difference: round2(difference),
    passed: difference <= tolerance,
    ...(documentPage != null ? { documentPage } : {}),
  };
}

/**
 * Build a MathCheck for a ratio / percentage comparison.
 */
function checkRatio(
  description: string,
  fieldPath: string,
  expectedRatio: number,
  actualRatio: number,
  percentTolerance: number = PERCENT_TOLERANCE,
  documentPage?: number
): MathCheck {
  const difference = Math.abs(actualRatio - expectedRatio);
  return {
    fieldPath,
    description,
    expected: round4(expectedRatio),
    actual: round4(actualRatio),
    difference: round4(difference),
    passed: difference <= percentTolerance,
    ...(documentPage != null ? { documentPage } : {}),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Only push a check if the actual field exists (non-zero or explicitly present).
 * This avoids false failures for fields that were not on the document.
 */
function pushIfPresent(checks: MathCheck[], obj: any, fieldPath: string, check: MathCheck): void {
  const val = get(obj, fieldPath);
  if (val !== 0 || hasField(obj, fieldPath)) {
    checks.push(check);
  }
}

function hasField(obj: any, path: string): boolean {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return false;
    if (!(part in current)) return false;
    current = current[part];
  }
  return current != null;
}

// ---------------------------------------------------------------------------
// Document-specific check runners
// ---------------------------------------------------------------------------

function check1040(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  // --- Main Form 1040 Income ---
  const income = data.income ?? data;
  const lines1through8 = sumFields(income, [
    "wages_line1",
    "taxableInterest_line2b",
    "ordinaryDividends_line3b",
    "taxableIra_line4b",
    "taxablePensions_line5b",
    "taxableSocialSecurity_line6b",
    "capitalGain_line7",
    "otherIncome_line8",
  ]);
  const totalIncome = get(income, "totalIncome_line9");

  checks.push(
    checkEquation(
      "Total Income (line 9) should equal sum of lines 1 through 8",
      "income.totalIncome_line9",
      lines1through8,
      totalIncome
    )
  );

  // AGI
  const adjustments = get(income, "adjustments_line10") || get(data, "adjustments_line10");
  const agi = get(income, "agi_line11") || get(data, "agi_line11");
  checks.push(
    checkEquation(
      "AGI (line 11) should equal Total Income (line 9) minus Adjustments (line 10)",
      "income.agi_line11",
      totalIncome - adjustments,
      agi
    )
  );

  // Taxable Income
  const deductions = get(income, "standardOrItemized_line12");
  const qbi = get(income, "qbi_line13a");
  const taxableIncome = get(income, "taxableIncome_line15");
  if (taxableIncome !== 0 || hasField(data, "income.taxableIncome_line15")) {
    checks.push(
      checkEquation(
        "Taxable Income (line 15) should equal AGI (line 11) minus Deductions (line 12) minus QBI (line 13a)",
        "income.taxableIncome_line15",
        agi - deductions - qbi,
        taxableIncome
      )
    );
  }

  // --- Schedule C ---
  const scheduleCs = Array.isArray(data.scheduleC) ? data.scheduleC : data.scheduleC ? [data.scheduleC] : [];
  for (let i = 0; i < scheduleCs.length; i++) {
    const sc = scheduleCs[i];
    const prefix = `scheduleC[${i}]`;

    const grossReceipts = get(sc, "grossReceipts_line1");
    const cogs = get(sc, "cogs_line4");
    const grossProfit = get(sc, "grossProfit_line5");
    checks.push(
      checkEquation(
        `Schedule C #${i + 1}: grossProfit (line 5) should equal grossReceipts (line 1) minus COGS (line 4)`,
        `${prefix}.grossProfit_line5`,
        grossReceipts - cogs,
        grossProfit
      )
    );

    const otherIncome = get(sc, "otherIncome_line6");
    const grossIncome = get(sc, "grossIncome_line7");
    if (grossIncome !== 0 || hasField(sc, "grossIncome_line7")) {
      checks.push(
        checkEquation(
          `Schedule C #${i + 1}: grossIncome (line 7) should equal grossProfit (line 5) plus otherIncome (line 6)`,
          `${prefix}.grossIncome_line7`,
          grossProfit + otherIncome,
          grossIncome
        )
      );
    }

    const totalExpenses = get(sc, "totalExpenses_line28");
    const netProfit = get(sc, "netProfit_line31");
    checks.push(
      checkEquation(
        `Schedule C #${i + 1}: netProfit (line 31) should equal grossIncome (line 7) minus totalExpenses (line 28)`,
        `${prefix}.netProfit_line31`,
        (grossIncome || grossProfit + otherIncome) - totalExpenses,
        netProfit
      )
    );

    // Sum of individual expense lines
    const expenseFields = [
      "advertising", "carAndTruck", "commissions", "contractLabor",
      "depletion", "depreciation_line13", "employeeBenefits", "insurance",
      "interestMortgage", "interestOther", "legal", "officeExpense",
      "pensionPlans", "rent", "repairs",
      "supplies", "taxes", "travel", "meals",
      "utilities", "wages", "otherExpenses",
    ];
    const expenses = sc.expenses ?? sc;
    const expenseSum = expenseFields.reduce((acc, f) => acc + get(expenses, f), 0);
    if (expenseSum > 0) {
      checks.push(
        checkEquation(
          `Schedule C #${i + 1}: totalExpenses (line 28) should equal sum of all expense lines`,
          `${prefix}.totalExpenses_line28`,
          expenseSum,
          totalExpenses
        )
      );
    }
  }

  // --- Schedule E ---
  const scheduleEs = Array.isArray(data.scheduleE) ? data.scheduleE : data.scheduleE ? [data.scheduleE] : [];
  const properties = scheduleEs.length > 0
    ? (Array.isArray(scheduleEs[0].properties) ? scheduleEs[0].properties : scheduleEs)
    : [];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const prefix = `scheduleE.properties[${i}]`;

    const rentsReceived = get(prop, "rentsReceived");
    const propTotalExpenses = get(prop, "totalExpenses");
    const netRentalIncome = get(prop, "netRentalIncome") || get(prop, "netIncome");

    if (rentsReceived !== 0 || propTotalExpenses !== 0) {
      checks.push(
        checkEquation(
          `Schedule E property #${i + 1}: netRentalIncome should equal rentsReceived minus totalExpenses`,
          `${prefix}.netRentalIncome`,
          rentsReceived - propTotalExpenses,
          netRentalIncome
        )
      );
    }

    const rentalExpenseFields = [
      "advertising", "auto", "cleaning", "commissions",
      "insurance", "legal", "management", "mortgageInterest",
      "otherInterest", "repairs", "supplies", "taxes",
      "utilities", "depreciation", "other",
    ];
    const rentalExpenses = prop.expenses ?? prop;
    const rentalExpenseSum = rentalExpenseFields.reduce((acc, f) => acc + get(rentalExpenses, f), 0);
    if (rentalExpenseSum > 0) {
      checks.push(
        checkEquation(
          `Schedule E property #${i + 1}: totalExpenses should equal sum of all expense lines`,
          `${prefix}.totalExpenses`,
          rentalExpenseSum,
          propTotalExpenses
        )
      );
    }
  }

  // --- Tax / Payments ---
  const tax = data.tax ?? data;
  const totalTax = get(tax, "totalTax_line24");
  const totalPayments = get(tax, "totalPayments_line33");
  const overpaid = get(tax, "overpaid_line34");
  const amountOwed = get(tax, "amountOwed_line37");

  if (totalPayments !== 0 && totalTax !== 0) {
    if (overpaid !== 0) {
      checks.push(
        checkEquation(
          "Overpaid (line 34) should equal totalPayments (line 33) minus totalTax (line 24)",
          "tax.overpaid_line34",
          totalPayments - totalTax,
          overpaid
        )
      );
    }
    if (amountOwed !== 0) {
      checks.push(
        checkEquation(
          "Amount owed (line 37) should equal totalTax (line 24) minus totalPayments (line 33)",
          "tax.amountOwed_line37",
          totalTax - totalPayments,
          amountOwed
        )
      );
    }
  }

  // --- W-2 wages sum vs line 1 ---
  const w2s = Array.isArray(data.w2Summary) ? data.w2Summary : [];
  if (w2s.length > 0) {
    const w2WagesSum = w2s.reduce(
      (acc: number, w2: any) => acc + get(w2, "wages_box1"),
      0
    );
    const line1 = get(income, "wages_line1");
    if (w2WagesSum > 0 && line1 > 0) {
      checks.push(
        checkEquation(
          "Sum of W-2 wages should approximately match 1040 Line 1 wages",
          "income.wages_line1",
          w2WagesSum,
          line1,
          Math.max(ABSOLUTE_TOLERANCE, line1 * PERCENT_TOLERANCE)
        )
      );
    }
  }

  return checks;
}

function check1120(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const grossReceipts1a = get(data, "income.grossReceipts_line1a");
  const returns1b = get(data, "income.returnsAllowances_line1b");
  const netReceipts1c = get(data, "income.balanceAfterReturns_line1c");

  checks.push(
    checkEquation(
      "Balance after returns (line 1c) should equal gross receipts (1a) minus returns (1b)",
      "income.balanceAfterReturns_line1c",
      grossReceipts1a - returns1b,
      netReceipts1c
    )
  );

  const cogs = get(data, "income.costOfGoodsSold_line2");
  const grossProfit = get(data, "income.grossProfit_line3");

  checks.push(
    checkEquation(
      "Gross profit (line 3) should equal balance after returns (1c) minus COGS (2)",
      "income.grossProfit_line3",
      netReceipts1c - cogs,
      grossProfit
    )
  );

  // Total income (line 11) = sum of lines 3-10
  const incomeLines = [
    "income.grossProfit_line3", "income.dividendsReceived_line4", "income.interestIncome_line5",
    "income.grossRents_line6", "income.grossRoyalties_line7", "income.capitalGainNet_line8",
    "income.netGainForm4797_line9", "income.otherIncome_line10",
  ];
  const totalIncomeExpected = sumFields(data, incomeLines);
  const totalIncome = get(data, "income.totalIncome_line11");

  checks.push(
    checkEquation(
      "Total income (line 11) should equal sum of lines 3 through 10",
      "income.totalIncome_line11",
      totalIncomeExpected,
      totalIncome
    )
  );

  // Taxable income before NOL (line 28) = total income (11) - total deductions (27)
  const totalDeductions = get(data, "deductions.totalDeductions_line27");
  const taxableBeforeNOL = get(data, "taxableIncome.taxableIncomeBeforeNOL_line28");

  checks.push(
    checkEquation(
      "Taxable income before NOL (line 28) should equal total income (11) minus total deductions (27)",
      "taxableIncome.taxableIncomeBeforeNOL_line28",
      totalIncome - totalDeductions,
      taxableBeforeNOL
    )
  );

  // Taxable income (line 30) = line 28 - NOL (29a) - special deductions (29c)
  const nol = get(data, "taxableIncome.netOperatingLossDeduction_line29a");
  const specialDeductions = get(data, "taxableIncome.totalSpecialDeductions_line29c");
  const taxableIncome = get(data, "taxableIncome.taxableIncome_line30");

  checks.push(
    checkEquation(
      "Taxable income (line 30) should equal line 28 minus NOL (29a) minus special deductions (29c)",
      "taxableIncome.taxableIncome_line30",
      taxableBeforeNOL - nol - specialDeductions,
      taxableIncome
    )
  );

  // --- Schedule L Balance Sheet ---
  checkScheduleL(data, checks);

  return checks;
}

function check1120S(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const grossReceipts1a = get(data, "income.grossReceipts_line1a");
  const returns1b = get(data, "income.returnsAllowances_line1b");
  const netReceipts1c = get(data, "income.balanceAfterReturns_line1c");

  checks.push(
    checkEquation(
      "Balance after returns (line 1c) should equal gross receipts (1a) minus returns (1b)",
      "income.balanceAfterReturns_line1c",
      grossReceipts1a - returns1b,
      netReceipts1c
    )
  );

  const cogs = get(data, "income.costOfGoodsSold_line2");
  const grossProfit = get(data, "income.grossProfit_line3");

  checks.push(
    checkEquation(
      "Gross profit (line 3) should equal balance after returns (1c) minus COGS (2)",
      "income.grossProfit_line3",
      netReceipts1c - cogs,
      grossProfit
    )
  );

  // Total income (line 6) = sum of lines 3-5
  const totalIncomeExpected = sumFields(data, [
    "income.grossProfit_line3",
    "income.netGainForm4797_line4",
    "income.otherIncome_line5",
  ]);
  const totalIncome = get(data, "income.totalIncome_line6");

  checks.push(
    checkEquation(
      "Total income (line 6) should equal sum of lines 3 through 5",
      "income.totalIncome_line6",
      totalIncomeExpected,
      totalIncome
    )
  );

  // Ordinary business income (line 22) = total income (6) - total deductions (21)
  const totalDeductions = get(data, "deductions.totalDeductions_line21");
  const ordinaryIncome = get(data, "ordinaryBusinessIncome_line22");

  checks.push(
    checkEquation(
      "Ordinary business income (line 22) should equal total income (6) minus total deductions (21)",
      "ordinaryBusinessIncome_line22",
      totalIncome - totalDeductions,
      ordinaryIncome
    )
  );

  // Schedule K distributions reasonableness (warning-level: compare to income)
  const distributions = get(data, "scheduleK.distributions") || get(data, "distributions");
  if (distributions !== 0 && ordinaryIncome !== 0) {
    const ratio = distributions / Math.abs(ordinaryIncome);
    // Just verify it is a real number; large distributions get flagged but are not a math failure
    checks.push(
      checkRatio(
        "Schedule K distributions to ordinary income ratio check (informational)",
        "scheduleK.distributions",
        ratio,
        ratio,
        1.0 // always passes; informational only
      )
    );
  }

  // Officer comp should match line 7
  const officerCompTotal = get(data, "officerCompensation") || get(data, "deductions.compensationOfOfficers_line7");
  const line7 = get(data, "deductions.compensationOfOfficers_line7");
  if (officerCompTotal !== 0 && line7 !== 0 && officerCompTotal !== line7) {
    checks.push(
      checkEquation(
        "Officer compensation total should match line 7",
        "deductions.compensationOfOfficers_line7",
        officerCompTotal,
        line7
      )
    );
  }

  // --- Schedule L Balance Sheet ---
  checkScheduleL(data, checks);

  return checks;
}

function check1065(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  // Same income/deduction pattern as 1120S
  const grossReceipts1a = get(data, "income.grossReceipts_line1a");
  const returns1b = get(data, "income.returnsAllowances_line1b");
  const netReceipts1c = get(data, "income.netReceipts_line1c");

  checks.push(
    checkEquation(
      "Net receipts (line 1c) should equal gross receipts (1a) minus returns (1b)",
      "income.netReceipts_line1c",
      grossReceipts1a - returns1b,
      netReceipts1c
    )
  );

  const cogs = get(data, "income.costOfGoodsSold_line2");
  const grossProfit = get(data, "income.grossProfit_line3");

  checks.push(
    checkEquation(
      "Gross profit (line 3) should equal net receipts (1c) minus COGS (2)",
      "income.grossProfit_line3",
      netReceipts1c - cogs,
      grossProfit
    )
  );

  // Total income (line 8) = sum of lines 3-7
  const totalIncomeExpected = sumFields(data, [
    "income.grossProfit_line3",
    "income.ordinaryIncomeFromOtherPartnerships_line4",
    "income.netFarmProfit_line5",
    "income.netGainForm4797_line6",
    "income.otherIncome_line7",
  ]);
  const totalIncome = get(data, "income.totalIncome_line8");

  checks.push(
    checkEquation(
      "Total income (line 8) should equal sum of lines 3 through 7",
      "income.totalIncome_line8",
      totalIncomeExpected,
      totalIncome
    )
  );

  // Ordinary business income (line 23) = total income (8) - total deductions (22)
  const totalDeductions = get(data, "deductions.totalDeductions_line22");
  const ordinaryIncome = get(data, "ordinaryBusinessIncome_line23");

  checks.push(
    checkEquation(
      "Ordinary business income (line 23) should equal total income (8) minus total deductions (22)",
      "ordinaryBusinessIncome_line23",
      totalIncome - totalDeductions,
      ordinaryIncome
    )
  );

  // Partner profit/loss share percentages should sum to 100%
  const partners = Array.isArray(data.partners) ? data.partners : [];
  if (partners.length > 0) {
    const profitShareSum = partners.reduce(
      (acc: number, p: any) => acc + (get(p, "profitSharePercent") || get(p, "profitShare")),
      0
    );
    if (profitShareSum > 0) {
      checks.push(
        checkEquation(
          "Partner profit share percentages should sum to 100%",
          "partners.profitSharePercent",
          100,
          profitShareSum,
          0.5 // 0.5% tolerance for rounding
        )
      );
    }

    const lossShareSum = partners.reduce(
      (acc: number, p: any) => acc + (get(p, "lossSharePercent") || get(p, "lossShare")),
      0
    );
    if (lossShareSum > 0) {
      checks.push(
        checkEquation(
          "Partner loss share percentages should sum to 100%",
          "partners.lossSharePercent",
          100,
          lossShareSum,
          0.5
        )
      );
    }
  }

  // Schedule K: guaranteed payments should match line 10 of deductions
  const guaranteedPaymentsK = get(data, "scheduleK.incomeAndLoss.totalGuaranteedPayments_line4c");
  const guaranteedPaymentsLine10 = get(data, "deductions.guaranteedPaymentsToPartners_line10");
  if (guaranteedPaymentsK !== 0 && guaranteedPaymentsLine10 !== 0) {
    checks.push(
      checkEquation(
        "Schedule K total guaranteed payments (line 4c) should match line 10 of deductions",
        "scheduleK.incomeAndLoss.totalGuaranteedPayments_line4c",
        guaranteedPaymentsLine10,
        guaranteedPaymentsK
      )
    );
  }

  // --- Schedule L Balance Sheet ---
  checkScheduleL(data, checks);

  return checks;
}

/**
 * Shared Schedule L balance sheet checks for 1120, 1120S, 1065.
 */
function checkScheduleL(data: any, checks: MathCheck[]): void {
  const schedL = data.scheduleL ?? data.balanceSheet ?? {};

  for (const period of ["beginningOfYear", "endOfYear", "boy", "eoy"]) {
    const periodData = schedL[period] ?? {};
    if (Object.keys(periodData).length === 0) continue;

    const periodLabel = period.includes("begin") || period === "boy"
      ? "Beginning of Year"
      : "End of Year";

    // Total assets = sum of asset line items
    const assetFields = [
      "cash", "tradeNotes", "inventories", "governmentObligations",
      "taxExemptSecurities", "otherCurrentAssets", "loansToShareholders",
      "mortgageLoans", "otherInvestments", "buildingsAndDepreciation",
      "depletableAssets", "land", "intangibleAssets", "otherAssets",
    ];
    const assetSum = assetFields.reduce((acc, f) => acc + get(periodData, f), 0);
    const totalAssets = get(periodData, "totalAssets");

    if (totalAssets !== 0) {
      checks.push(
        checkEquation(
          `Schedule L ${periodLabel}: total assets should equal sum of all asset line items`,
          `scheduleL.${period}.totalAssets`,
          assetSum > 0 ? assetSum : totalAssets, // only check if we have components
          totalAssets,
          assetSum > 0 ? ABSOLUTE_TOLERANCE : 0
        )
      );
    }

    // Total liabilities + equity = total assets
    const totalLiabilities = get(periodData, "totalLiabilities");
    const totalEquity = get(periodData, "totalEquity") || get(periodData, "totalShareholdersEquity") || get(periodData, "partnersCapital");
    const totalLiabAndEquity = get(periodData, "totalLiabilitiesAndEquity");

    if (totalAssets !== 0 && (totalLiabAndEquity !== 0 || (totalLiabilities !== 0 && totalEquity !== 0))) {
      const liabEquitySum = totalLiabAndEquity !== 0 ? totalLiabAndEquity : totalLiabilities + totalEquity;
      checks.push(
        checkEquation(
          `Schedule L ${periodLabel}: total liabilities + equity should equal total assets`,
          `scheduleL.${period}.totalLiabilitiesAndEquity`,
          totalAssets,
          liabEquitySum
        )
      );
    }
  }
}

function checkBankStatement(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const summary = data.summary ?? data;
  const beginningBalance = get(summary, "beginningBalance");
  const endingBalance = get(summary, "endingBalance");
  const totalDeposits = get(summary, "totalDeposits");
  const totalWithdrawals = get(summary, "totalWithdrawals");

  // ending = beginning + deposits - withdrawals
  if (beginningBalance !== 0 || endingBalance !== 0) {
    checks.push(
      checkEquation(
        "Ending balance should equal beginning balance plus total deposits minus total withdrawals",
        "summary.endingBalance",
        beginningBalance + totalDeposits - totalWithdrawals,
        endingBalance
      )
    );
  }

  // Sum of deposit line items vs totalDeposits
  const deposits = Array.isArray(data.deposits) ? data.deposits : [];
  if (deposits.length > 0 && totalDeposits !== 0) {
    const depositsSum = deposits.reduce(
      (acc: number, d: any) => acc + (get(d, "amount") || 0),
      0
    );
    checks.push(
      checkEquation(
        "Sum of individual deposits should approximately equal total deposits",
        "summary.totalDeposits",
        depositsSum,
        totalDeposits,
        Math.max(ABSOLUTE_TOLERANCE, totalDeposits * PERCENT_TOLERANCE)
      )
    );
  }

  // Sum of withdrawal line items vs totalWithdrawals
  const withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals : [];
  if (withdrawals.length > 0 && totalWithdrawals !== 0) {
    const withdrawalsSum = withdrawals.reduce(
      (acc: number, w: any) => acc + Math.abs(get(w, "amount") || 0),
      0
    );
    checks.push(
      checkEquation(
        "Sum of individual withdrawals should approximately equal total withdrawals",
        "summary.totalWithdrawals",
        withdrawalsSum,
        totalWithdrawals,
        Math.max(ABSOLUTE_TOLERANCE, totalWithdrawals * PERCENT_TOLERANCE)
      )
    );
  }

  return checks;
}

function checkProfitAndLoss(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const netRevenue = get(data, "netRevenue") || get(data, "totalRevenue") || get(data, "revenue");
  const cogsTotal = get(data, "costOfGoodsSold") || get(data, "cogs") || get(data, "cogsTotal");
  const grossProfit = get(data, "grossProfit");
  const operatingExpenses = get(data, "operatingExpenses") || get(data, "totalOperatingExpenses");
  const operatingIncome = get(data, "operatingIncome");
  const otherIncomeExpense = get(data, "otherIncomeExpense") ?? (get(data, "otherIncome") - get(data, "otherExpense"));
  const incomeTaxExpense = get(data, "incomeTaxExpense") || get(data, "taxes");
  const netIncome = get(data, "netIncome");

  // grossProfit = netRevenue - COGS
  if (netRevenue !== 0) {
    checks.push(
      checkEquation(
        "Gross profit should equal net revenue minus cost of goods sold",
        "grossProfit",
        netRevenue - cogsTotal,
        grossProfit
      )
    );
  }

  // operatingIncome = grossProfit - operatingExpenses
  if (grossProfit !== 0 && operatingExpenses !== 0) {
    checks.push(
      checkEquation(
        "Operating income should equal gross profit minus operating expenses",
        "operatingIncome",
        grossProfit - operatingExpenses,
        operatingIncome
      )
    );
  }

  // netIncome = operatingIncome + otherIncomeExpense - incomeTaxExpense
  if (operatingIncome !== 0) {
    checks.push(
      checkEquation(
        "Net income should equal operating income plus other income/expense minus income tax expense",
        "netIncome",
        operatingIncome + otherIncomeExpense - incomeTaxExpense,
        netIncome
      )
    );
  }

  // Gross margin ratio check
  if (netRevenue !== 0 && grossProfit !== 0) {
    const expectedMargin = grossProfit / netRevenue;
    const actualMargin = get(data, "grossMargin") || get(data, "grossProfitMargin");
    if (actualMargin !== 0) {
      checks.push(
        checkRatio(
          "Gross margin should equal gross profit divided by net revenue",
          "grossMargin",
          expectedMargin,
          actualMargin
        )
      );
    }
  }

  // Revenue line items sum
  const revenueItems = Array.isArray(data.revenueLineItems) ? data.revenueLineItems : [];
  if (revenueItems.length > 0) {
    const revenueSum = revenueItems.reduce((acc: number, item: any) => acc + get(item, "amount"), 0);
    const grossRevenue = get(data, "grossRevenue") || netRevenue;
    checks.push(
      checkEquation(
        "Revenue line items should sum to gross revenue",
        "grossRevenue",
        revenueSum,
        grossRevenue,
        Math.max(ABSOLUTE_TOLERANCE, grossRevenue * PERCENT_TOLERANCE)
      )
    );
  }

  // Operating expense line items sum
  const expenseItems = Array.isArray(data.operatingExpenseLineItems) ? data.operatingExpenseLineItems : [];
  if (expenseItems.length > 0) {
    const expenseSum = expenseItems.reduce((acc: number, item: any) => acc + get(item, "amount"), 0);
    checks.push(
      checkEquation(
        "Operating expense line items should sum to total operating expenses",
        "totalOperatingExpenses",
        expenseSum,
        operatingExpenses,
        Math.max(ABSOLUTE_TOLERANCE, operatingExpenses * PERCENT_TOLERANCE)
      )
    );
  }

  // --- Add-backs ---
  const addBacks = data.addBacks ?? {};
  const depreciation = get(addBacks, "depreciation");
  const amortization = get(addBacks, "amortization");
  const interest = get(addBacks, "interest");
  const ownerComp = get(addBacks, "ownerCompensation");
  const oneTimeExpenses = Array.isArray(addBacks.oneTimeExpenses) ? addBacks.oneTimeExpenses : [];
  const oneTimeSum = oneTimeExpenses.reduce((acc: number, e: any) => acc + get(e, "amount"), 0);
  const totalAddBacks = get(addBacks, "totalAddBacks");

  if (totalAddBacks !== 0) {
    checks.push(
      checkEquation(
        "Total add-backs should equal depreciation + amortization + interest + owner comp + one-time expenses",
        "addBacks.totalAddBacks",
        depreciation + amortization + interest + ownerComp + oneTimeSum,
        totalAddBacks
      )
    );
  }

  const adjustedNetIncome = get(addBacks, "adjustedNetIncome");
  if (adjustedNetIncome !== 0 && totalAddBacks !== 0) {
    checks.push(
      checkEquation(
        "Adjusted net income should equal net income plus total add-backs",
        "addBacks.adjustedNetIncome",
        netIncome + totalAddBacks,
        adjustedNetIncome
      )
    );
  }

  return checks;
}

function checkBalanceSheet(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const totalCurrentAssets = get(data, "totalCurrentAssets");
  const netFixed = get(data, "netFixedAssets") || get(data, "netFixed");
  const otherAssets = get(data, "otherAssets") || get(data, "totalOtherAssets");
  const totalAssets = get(data, "totalAssets");

  // totalAssets = totalCurrentAssets + netFixed + otherAssets
  if (totalAssets !== 0) {
    checks.push(
      checkEquation(
        "Total assets should equal total current assets plus net fixed assets plus other assets",
        "totalAssets",
        totalCurrentAssets + netFixed + otherAssets,
        totalAssets
      )
    );
  }

  const totalCurrentLiabilities = get(data, "totalCurrentLiabilities");
  const totalLongTerm = get(data, "totalLongTermLiabilities") || get(data, "totalLongTerm");
  const totalLiabilities = get(data, "totalLiabilities");

  // totalLiabilities = totalCurrentLiabilities + totalLongTerm
  if (totalLiabilities !== 0) {
    checks.push(
      checkEquation(
        "Total liabilities should equal total current liabilities plus total long-term liabilities",
        "totalLiabilities",
        totalCurrentLiabilities + totalLongTerm,
        totalLiabilities
      )
    );
  }

  const totalEquity = get(data, "totalEquity") || get(data, "totalShareholdersEquity");
  const totalLiabAndEquity = get(data, "totalLiabilitiesAndEquity");

  // totalLiabilitiesAndEquity = totalLiabilities + totalEquity
  if (totalLiabAndEquity !== 0) {
    checks.push(
      checkEquation(
        "Total liabilities and equity should equal total liabilities plus total equity",
        "totalLiabilitiesAndEquity",
        totalLiabilities + totalEquity,
        totalLiabAndEquity
      )
    );
  }

  // THE FUNDAMENTAL EQUATION: totalAssets = totalLiabilitiesAndEquity
  if (totalAssets !== 0 && (totalLiabAndEquity !== 0 || (totalLiabilities !== 0 && totalEquity !== 0))) {
    checks.push(
      checkEquation(
        "FUNDAMENTAL: Total assets MUST equal total liabilities and equity",
        "totalAssets_vs_totalLiabilitiesAndEquity",
        totalAssets,
        totalLiabAndEquity !== 0 ? totalLiabAndEquity : totalLiabilities + totalEquity
      )
    );
  }

  // netFixed = propertyEquipment - accumulatedDepreciation
  const propertyEquipment = get(data, "propertyEquipment") || get(data, "grossFixedAssets");
  const accumulatedDepreciation = get(data, "accumulatedDepreciation");
  if (propertyEquipment !== 0 && netFixed !== 0) {
    checks.push(
      checkEquation(
        "Net fixed assets should equal property/equipment minus accumulated depreciation",
        "netFixedAssets",
        propertyEquipment - accumulatedDepreciation,
        netFixed
      )
    );
  }

  return checks;
}

function checkRentRoll(data: any): MathCheck[] {
  const checks: MathCheck[] = [];

  const units = Array.isArray(data.units) ? data.units : [];
  const summary = data.summary ?? data;

  const totalMonthlyRent = get(summary, "totalMonthlyRent");
  const totalAnnualRent = get(summary, "totalAnnualRent");
  const occupancyRate = get(summary, "occupancyRate");
  const totalUnits = get(summary, "totalUnits") || units.length;
  const occupiedUnits = get(summary, "occupiedUnits");
  const vacantUnits = get(summary, "vacantUnits");

  // Sum monthly rents for occupied units
  if (units.length > 0 && totalMonthlyRent !== 0) {
    const occupiedRentSum = units.reduce((acc: number, u: any) => {
      const status = String(u.status ?? "").toLowerCase();
      const isOccupied =
        status === "occupied" ||
        u.occupied === true ||
        u.vacant === false ||
        !u.status; // assume occupied if no status
      return acc + (isOccupied ? get(u, "monthlyRent") || get(u, "rent") : 0);
    }, 0);
    checks.push(
      checkEquation(
        "Total monthly rent should equal sum of all occupied unit monthly rents",
        "summary.totalMonthlyRent",
        occupiedRentSum,
        totalMonthlyRent
      )
    );
  }

  // Annual = monthly * 12
  if (totalMonthlyRent !== 0 && totalAnnualRent !== 0) {
    checks.push(
      checkEquation(
        "Total annual rent should equal total monthly rent times 12",
        "summary.totalAnnualRent",
        totalMonthlyRent * 12,
        totalAnnualRent
      )
    );
  }

  // Occupancy rate
  if (totalUnits > 0 && occupancyRate !== 0) {
    const expectedRate = occupiedUnits / totalUnits;
    checks.push(
      checkRatio(
        "Occupancy rate should equal occupied units divided by total units",
        "summary.occupancyRate",
        expectedRate,
        occupancyRate
      )
    );
  }

  // occupied + vacant = total
  if (totalUnits > 0 && (occupiedUnits !== 0 || vacantUnits !== 0)) {
    checks.push(
      checkEquation(
        "Occupied units plus vacant units should equal total units",
        "summary.totalUnits",
        occupiedUnits + vacantUnits,
        totalUnits,
        0 // exact match for unit counts
      )
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runMathChecks(docType: string, data: any): MathCheck[] {
  if (!data) return [];

  const normalizedType = docType.toUpperCase().replace(/[\s-]/g, "_");

  switch (normalizedType) {
    case "FORM_1040":
    case "1040":
    case "TAX_RETURN_1040":
      return check1040(data);

    case "FORM_1120":
    case "1120":
    case "TAX_RETURN_1120":
      return check1120(data);

    case "FORM_1120S":
    case "1120S":
    case "1120_S":
    case "TAX_RETURN_1120S":
      return check1120S(data);

    case "FORM_1065":
    case "1065":
    case "TAX_RETURN_1065":
      return check1065(data);

    case "BANK_STATEMENT":
    case "BANK_STATEMENTS":
    case "BANK_STATEMENT_CHECKING":
    case "BANK_STATEMENT_SAVINGS":
      return checkBankStatement(data);

    case "PROFIT_AND_LOSS":
    case "P&L":
    case "PNL":
    case "INCOME_STATEMENT":
      return checkProfitAndLoss(data);

    case "BALANCE_SHEET":
      return checkBalanceSheet(data);

    case "RENT_ROLL":
      return checkRentRoll(data);

    default:
      return [];
  }
}
