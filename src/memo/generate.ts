import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  TableLayoutType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  VerticalAlign,
  LevelFormat,
  convertInchesToTwip,
} from "docx";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface MemoInput {
  borrowerName: string;
  loanAmount: number;
  loanPurpose: string;
  loanType?: string;
  propertyAddress?: string;
  proposedRate?: number;
  proposedTerm?: number;

  analysis: {
    income: {
      sources: Array<{
        type: string;
        description: string;
        grossAmount: number;
        netAmount: number;
        year: number;
      }>;
      totalGrossIncome: number;
      totalNetIncome: number;
      qualifyingIncome: number;
      trend: string;
      trendPercent: number;
      notes: string[];
    };
    dscr: {
      globalDscr: number | null;
      propertyDscr: number | null;
      noi: number;
      totalDebtService: number;
      rating: string;
      notes: string[];
    };
    dti: {
      frontEndDti: number | null;
      backEndDti: number | null;
      grossMonthlyIncome: number;
      totalMonthlyDebt: number;
      debtItems: Array<{ description: string; monthlyAmount: number }>;
      rating: string;
      notes: string[];
    };
    liquidity: {
      totalLiquidAssets: number;
      monthsOfReserves: number;
      averageDailyBalance: number;
      currentRatio: number | null;
      quickRatio: number | null;
      rating: string;
      notes: string[];
    };
    cashflow: {
      averageMonthlyDeposits: number;
      depositToIncomeRatio: number | null;
      nsfCount: number;
      largeDeposits: Array<{
        date: string;
        amount: number;
        description: string;
      }>;
      notes: string[];
    };
    business: {
      revenueByYear: Record<number, number>;
      revenueTrend: string;
      expenseRatio: number;
      ownerCompensation: number;
      addBacks: { total: number };
      adjustedNetIncome: number;
      notes: string[];
    } | null;
    riskFlags: Array<{
      severity: string;
      category: string;
      title: string;
      description: string;
      recommendation: string;
    }>;
    riskScore: number;
    summary: {
      qualifyingIncome: number;
      globalDscr: number | null;
      backEndDti: number | null;
      monthsOfReserves: number;
      riskRating: string;
    };
  };

  documents: Array<{
    fileName: string;
    docType: string;
    year?: number;
  }>;

  verificationSummary: {
    mathChecksPassed: number;
    mathChecksFailed: number;
    crossDocPassed: number;
    crossDocFailed: number;
    textractAgreed: number;
    textractDisagreed: number;
    reviewItemsResolved: number;
  };

  generatedAt: Date;
  analystName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Formatting helpers                                                        */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}

function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Color / rating helpers                                                    */
/* -------------------------------------------------------------------------- */

const COLORS = {
  primary: "1B3A5C",       // Dark navy
  primaryLight: "2C5F8A",  // Medium blue
  accent: "0D7C66",        // Professional green
  headerBg: "1B3A5C",      // Navy header background
  headerText: "FFFFFF",     // White header text
  altRowBg: "F0F4F8",      // Light blue-gray alternating row
  white: "FFFFFF",
  black: "1A1A1A",
  textGray: "4A5568",
  borderGray: "CBD5E0",
  lightBorder: "E2E8F0",
  // Rating colors
  excellent: "0D7C66",     // Green
  good: "2B8A3E",          // Medium green
  adequate: "E8A317",      // Amber
  belowAverage: "E65100",  // Orange
  poor: "C62828",          // Red
  critical: "B71C1C",      // Dark red
  // Rating backgrounds (lighter versions)
  excellentBg: "E8F5E9",
  goodBg: "E8F5E9",
  adequateBg: "FFF8E1",
  belowAverageBg: "FFF3E0",
  poorBg: "FFEBEE",
  criticalBg: "FFCDD2",
};

function ratingColor(rating: string): string {
  const r = rating.toLowerCase();
  if (r.includes("excellent") || r.includes("strong")) return COLORS.excellent;
  if (r.includes("good")) return COLORS.good;
  if (r.includes("adequate") || r.includes("acceptable") || r.includes("moderate"))
    return COLORS.adequate;
  if (r.includes("below") || r.includes("marginal") || r.includes("weak"))
    return COLORS.belowAverage;
  if (r.includes("poor") || r.includes("high risk")) return COLORS.poor;
  if (r.includes("critical") || r.includes("severe")) return COLORS.critical;
  return COLORS.textGray;
}

function ratingBgColor(rating: string): string {
  const r = rating.toLowerCase();
  if (r.includes("excellent") || r.includes("strong")) return COLORS.excellentBg;
  if (r.includes("good")) return COLORS.goodBg;
  if (r.includes("adequate") || r.includes("acceptable") || r.includes("moderate"))
    return COLORS.adequateBg;
  if (r.includes("below") || r.includes("marginal") || r.includes("weak"))
    return COLORS.belowAverageBg;
  if (r.includes("poor") || r.includes("high risk")) return COLORS.poorBg;
  if (r.includes("critical") || r.includes("severe")) return COLORS.criticalBg;
  return COLORS.white;
}

function severityColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return COLORS.critical;
  if (s === "medium" || s === "moderate") return COLORS.adequate;
  if (s === "low" || s === "info") return COLORS.good;
  return COLORS.textGray;
}

function severityBgColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return COLORS.criticalBg;
  if (s === "medium" || s === "moderate") return COLORS.adequateBg;
  if (s === "low" || s === "info") return COLORS.goodBg;
  return COLORS.white;
}

/* -------------------------------------------------------------------------- */
/*  Reusable docx element builders                                            */
/* -------------------------------------------------------------------------- */

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const THIN_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
};

function spacer(points = 6): Paragraph {
  return new Paragraph({ spacing: { before: points * 20, after: points * 20 } });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        color: COLORS.primary,
        font: "Calibri",
      }),
    ],
  });
}

function bodyText(text: string, options?: { bold?: boolean; italic?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        bold: options?.bold,
        italics: options?.italic,
        color: options?.color ?? COLORS.black,
      }),
    ],
  });
}

function bulletPoint(text: string, options?: { bold?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        bold: options?.bold,
        color: options?.color ?? COLORS.black,
      }),
    ],
  });
}

/** Build a cell for a header row. */
function headerCell(
  text: string,
  widthPercent?: number,
): TableCell {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: COLORS.headerBg, fill: COLORS.headerBg },
    borders: THIN_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    width: widthPercent
      ? { size: widthPercent, type: WidthType.PERCENTAGE }
      : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18,
            color: COLORS.headerText,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

/** Build a data cell. */
function dataCell(
  text: string,
  options?: {
    bold?: boolean;
    color?: string;
    bgColor?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    widthPercent?: number;
  },
): TableCell {
  return new TableCell({
    borders: THIN_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    shading: options?.bgColor
      ? { type: ShadingType.SOLID, color: options.bgColor, fill: options.bgColor }
      : undefined,
    width: options?.widthPercent
      ? { size: options.widthPercent, type: WidthType.PERCENTAGE }
      : undefined,
    children: [
      new Paragraph({
        alignment: options?.alignment ?? AlignmentType.LEFT,
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text,
            size: 18,
            font: "Calibri",
            bold: options?.bold,
            color: options?.color ?? COLORS.black,
          }),
        ],
      }),
    ],
  });
}

/**
 * Build a complete styled table from arrays of header strings and row data.
 * Each row entry is an array of cell values (strings).
 */
function createTable(
  headers: string[],
  rows: string[][],
  options?: {
    columnWidths?: number[]; // percentages
    rowOptions?: Array<{
      bold?: boolean;
      color?: string;
      bgColor?: string;
    } | null>;
    cellOptions?: Array<
      Array<{
        bold?: boolean;
        color?: string;
        bgColor?: string;
        alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
      } | null> | null
    >;
  },
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      headerCell(h, options?.columnWidths?.[i]),
    ),
  });

  const dataRows = rows.map((row, rowIdx) => {
    const isAlt = rowIdx % 2 === 1;
    const rowOpts = options?.rowOptions?.[rowIdx];
    return new TableRow({
      children: row.map((cellText, colIdx) => {
        const cellOpts = options?.cellOptions?.[rowIdx]?.[colIdx];
        return dataCell(cellText, {
          bold: cellOpts?.bold ?? rowOpts?.bold,
          color: cellOpts?.color ?? rowOpts?.color,
          bgColor: cellOpts?.bgColor ?? rowOpts?.bgColor ?? (isAlt ? COLORS.altRowBg : undefined),
          alignment: cellOpts?.alignment,
          widthPercent: options?.columnWidths?.[colIdx],
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

/** Build a section: heading + content paragraphs/tables. */
function createSection(
  title: string,
  content: (Paragraph | Table)[],
): (Paragraph | Table)[] {
  return [sectionHeading(title), ...content];
}

/* -------------------------------------------------------------------------- */
/*  Executive summary generation                                              */
/* -------------------------------------------------------------------------- */

function generateExecutiveSummary(input: MemoInput): Paragraph[] {
  const { analysis, borrowerName, loanAmount } = input;
  const { summary, riskFlags } = analysis;

  // Determine recommendation strength
  const riskRating = summary.riskRating.toLowerCase();
  let recommendation: string;
  if (riskRating.includes("low") || riskRating.includes("excellent") || riskRating.includes("strong")) {
    recommendation =
      `Based on the comprehensive analysis of ${borrowerName}'s financial profile, this credit request for ${formatCurrency(loanAmount)} presents a favorable risk profile. ` +
      `The borrower demonstrates strong fundamentals across key underwriting metrics, and the overall risk assessment supports a positive lending decision, subject to standard conditions.`;
  } else if (riskRating.includes("moderate") || riskRating.includes("acceptable") || riskRating.includes("adequate")) {
    recommendation =
      `The analysis of ${borrowerName}'s financial profile for the requested ${formatCurrency(loanAmount)} facility reveals an acceptable risk profile with certain areas requiring attention. ` +
      `While key metrics meet minimum thresholds, the identified risk factors should be carefully weighed and appropriate mitigants or conditions considered before final approval.`;
  } else {
    recommendation =
      `The comprehensive review of ${borrowerName}'s financial position for the ${formatCurrency(loanAmount)} request reveals material concerns that warrant heightened scrutiny. ` +
      `Multiple risk indicators suggest the borrower's capacity to service the proposed obligation may be constrained. Additional due diligence and risk mitigants are strongly recommended prior to any credit decision.`;
  }

  // Gather strengths
  const strengths: string[] = [];
  if (summary.globalDscr !== null && summary.globalDscr >= 1.25)
    strengths.push(`DSCR of ${formatNumber(summary.globalDscr)}x exceeds the 1.25x benchmark`);
  if (summary.backEndDti !== null && summary.backEndDti < 0.36)
    strengths.push(`Back-end DTI of ${formatPercent(summary.backEndDti)} is well within acceptable limits`);
  if (summary.monthsOfReserves >= 6)
    strengths.push(`${formatNumber(summary.monthsOfReserves, 1)} months of reserves provides a comfortable liquidity cushion`);
  if (analysis.income.trend === "increasing" || analysis.income.trendPercent > 0.05)
    strengths.push(`Income demonstrates a positive trajectory with ${formatPercent(analysis.income.trendPercent)} growth`);
  if (analysis.cashflow.nsfCount === 0)
    strengths.push("No NSF or overdraft occurrences in the review period");
  if (analysis.liquidity.rating.toLowerCase().includes("good") || analysis.liquidity.rating.toLowerCase().includes("excellent"))
    strengths.push("Liquidity position is strong relative to obligations");

  // Gather concerns
  const concerns: string[] = [];
  if (summary.backEndDti !== null && summary.backEndDti >= 0.45)
    concerns.push(`Elevated back-end DTI of ${formatPercent(summary.backEndDti)} approaches maximum thresholds`);
  if (summary.globalDscr !== null && summary.globalDscr < 1.1)
    concerns.push(`DSCR of ${formatNumber(summary.globalDscr)}x is below the preferred minimum of 1.25x`);
  if (analysis.income.trend === "decreasing")
    concerns.push(`Declining income trend of ${formatPercent(Math.abs(analysis.income.trendPercent))}`);
  if (analysis.cashflow.nsfCount > 0)
    concerns.push(`${analysis.cashflow.nsfCount} NSF/overdraft occurrence(s) noted in the review period`);
  if (summary.monthsOfReserves < 3)
    concerns.push(`Limited reserves of ${formatNumber(summary.monthsOfReserves, 1)} months`);

  const criticalFlags = riskFlags.filter(
    (f) => f.severity.toLowerCase() === "critical" || f.severity.toLowerCase() === "high",
  );
  for (const flag of criticalFlags.slice(0, 3)) {
    concerns.push(flag.title);
  }

  // Build paragraphs
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: recommendation, size: 20, font: "Calibri", color: COLORS.black }),
      ],
    }),
  );

  if (strengths.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: "Key Strengths:", bold: true, size: 20, font: "Calibri", color: COLORS.accent }),
        ],
      }),
    );
    for (const s of strengths) {
      paragraphs.push(bulletPoint(s, { color: COLORS.accent }));
    }
  }

  if (concerns.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: "Key Concerns:", bold: true, size: 20, font: "Calibri", color: COLORS.belowAverage }),
        ],
      }),
    );
    for (const c of concerns) {
      paragraphs.push(bulletPoint(c, { color: COLORS.belowAverage }));
    }
  }

  return paragraphs;
}

/* -------------------------------------------------------------------------- */
/*  Section builders                                                          */
/* -------------------------------------------------------------------------- */

function buildTitlePage(input: MemoInput): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Top spacing
  elements.push(spacer(40));

  // Title
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: "CREDIT ANALYSIS",
          bold: true,
          size: 52,
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
    }),
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "MEMORANDUM",
          bold: true,
          size: 52,
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
    }),
  );

  // Decorative line
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
      },
      children: [new TextRun({ text: " ", size: 8 })],
    }),
  );

  // Borrower name
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: input.borrowerName,
          bold: true,
          size: 36,
          color: COLORS.primaryLight,
          font: "Calibri",
        }),
      ],
    }),
  );

  // Loan amount
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Requested Amount: ${formatCurrency(input.loanAmount)}`,
          size: 28,
          color: COLORS.textGray,
          font: "Calibri",
        }),
      ],
    }),
  );

  // Loan purpose
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Purpose: ${input.loanPurpose}`,
          size: 24,
          color: COLORS.textGray,
          font: "Calibri",
        }),
      ],
    }),
  );

  // Date and analyst info table (borderless)
  const infoRows = [
    ["Date Prepared:", formatDate(input.generatedAt)],
    ["Prepared By:", input.analystName || "OpenShut AI"],
    ["Risk Rating:", input.analysis.summary.riskRating],
  ];

  const infoTable = new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: infoRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders: NO_BORDERS,
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 30, after: 30 },
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: COLORS.textGray,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: NO_BORDERS,
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 30, after: 30 },
                  children: [
                    new TextRun({
                      text: `  ${value}`,
                      size: 22,
                      color: COLORS.black,
                      font: "Calibri",
                      bold: label === "Risk Rating:",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [],
    }),
  );
  elements.push(infoTable);

  // Confidentiality notice
  elements.push(spacer(30));
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: "CONFIDENTIAL",
          bold: true,
          size: 18,
          color: COLORS.textGray,
          font: "Calibri",
          allCaps: true,
        }),
      ],
    }),
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "This document contains confidential financial information and is intended solely for authorized recipients.",
          size: 16,
          color: COLORS.textGray,
          font: "Calibri",
          italics: true,
        }),
      ],
    }),
  );

  // Page break after title
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
  );

  return elements;
}

function buildBorrowerSummary(input: MemoInput): (Paragraph | Table)[] {
  const rows: string[][] = [
    ["Borrower Name", input.borrowerName],
    ["Loan Amount", formatCurrency(input.loanAmount)],
    ["Loan Purpose", input.loanPurpose],
  ];

  if (input.propertyAddress) {
    rows.push(["Property Address", input.propertyAddress]);
  }
  if (input.loanType) {
    rows.push(["Loan Type", input.loanType]);
  }
  if (input.proposedRate !== undefined) {
    rows.push(["Proposed Rate", `${input.proposedRate.toFixed(3)}%`]);
  }
  if (input.proposedTerm !== undefined) {
    rows.push(["Proposed Term", `${input.proposedTerm} months`]);
  }
  rows.push(["Qualifying Income", formatCurrency(input.analysis.summary.qualifyingIncome)]);

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: {
                type: ShadingType.SOLID,
                color: COLORS.headerBg,
                fill: COLORS.headerBg,
              },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 20,
                      color: COLORS.headerText,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 65, type: WidthType.PERCENTAGE },
              shading:
                idx % 2 === 1
                  ? { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg }
                  : undefined,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: value,
                      size: 20,
                      color: COLORS.black,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });

  return createSection("Borrower Summary", [table]);
}

function buildFinancialRatios(input: MemoInput): (Paragraph | Table)[] {
  const { dscr, dti, liquidity, summary } = input.analysis;

  interface RatioRow {
    metric: string;
    value: string;
    rating: string;
  }

  const ratioData: RatioRow[] = [];

  if (dscr.globalDscr !== null) {
    ratioData.push({
      metric: "Global DSCR",
      value: `${formatNumber(dscr.globalDscr)}x`,
      rating: dscr.rating,
    });
  }
  if (dscr.propertyDscr !== null) {
    ratioData.push({
      metric: "Property DSCR",
      value: `${formatNumber(dscr.propertyDscr)}x`,
      rating: dscr.rating,
    });
  }
  if (dti.frontEndDti !== null) {
    ratioData.push({
      metric: "Front-End DTI",
      value: formatPercent(dti.frontEndDti),
      rating: dti.frontEndDti <= 0.28 ? "Good" : dti.frontEndDti <= 0.33 ? "Acceptable" : "Elevated",
    });
  }
  if (dti.backEndDti !== null) {
    ratioData.push({
      metric: "Back-End DTI",
      value: formatPercent(dti.backEndDti),
      rating: dti.rating,
    });
  }
  ratioData.push({
    metric: "Months of Reserves",
    value: formatNumber(liquidity.monthsOfReserves, 1),
    rating: liquidity.rating,
  });
  if (liquidity.currentRatio !== null) {
    ratioData.push({
      metric: "Current Ratio",
      value: `${formatNumber(liquidity.currentRatio)}x`,
      rating: liquidity.currentRatio >= 2 ? "Strong" : liquidity.currentRatio >= 1 ? "Adequate" : "Weak",
    });
  }
  ratioData.push({
    metric: "Overall Risk Score",
    value: `${input.analysis.riskScore} / 100`,
    rating: summary.riskRating,
  });

  const headers = ["Metric", "Value", "Rating"];
  const rows = ratioData.map((r) => [r.metric, r.value, r.rating]);
  const cellOptions = ratioData.map((r) => [
    null,
    { bold: true, alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
    {
      bold: true,
      color: ratingColor(r.rating),
      bgColor: ratingBgColor(r.rating),
      alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType],
    },
  ]);

  const table = createTable(headers, rows, {
    columnWidths: [40, 30, 30],
    cellOptions,
  });

  return createSection("Financial Ratios Summary", [table]);
}

function buildIncomeAnalysis(input: MemoInput): (Paragraph | Table)[] {
  const { income } = input.analysis;
  const elements: (Paragraph | Table)[] = [];

  // Income sources table
  if (income.sources.length > 0) {
    const headers = ["Source", "Description", "Gross Amount", "Net Amount", "Year"];
    const rows = income.sources.map((s) => [
      s.type,
      s.description,
      formatCurrency(s.grossAmount),
      formatCurrency(s.netAmount),
      String(s.year),
    ]);

    const cellOptions = rows.map(() => [
      null,
      null,
      { alignment: AlignmentType.RIGHT as (typeof AlignmentType)[keyof typeof AlignmentType] },
      { alignment: AlignmentType.RIGHT as (typeof AlignmentType)[keyof typeof AlignmentType] },
      { alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
    ]);

    elements.push(createTable(headers, rows, { columnWidths: [18, 30, 18, 18, 16], cellOptions }));
    elements.push(spacer(6));
  }

  // Summary metrics
  elements.push(
    bodyText(`Total Gross Income: ${formatCurrency(income.totalGrossIncome)}`, { bold: true }),
  );
  elements.push(
    bodyText(`Total Net Income: ${formatCurrency(income.totalNetIncome)}`, { bold: true }),
  );
  elements.push(
    bodyText(`Qualifying Income: ${formatCurrency(income.qualifyingIncome)}`, {
      bold: true,
      color: COLORS.primary,
    }),
  );

  // Trend
  const trendDirection = income.trendPercent >= 0 ? "increasing" : "declining";
  const trendColor = income.trendPercent >= 0 ? COLORS.accent : COLORS.belowAverage;
  elements.push(
    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: "Income Trend: ",
          bold: true,
          size: 20,
          font: "Calibri",
          color: COLORS.black,
        }),
        new TextRun({
          text: `${income.trend || trendDirection} (${formatPercent(Math.abs(income.trendPercent))})`,
          size: 20,
          font: "Calibri",
          color: trendColor,
          bold: true,
        }),
      ],
    }),
  );

  // Notes
  for (const note of income.notes) {
    elements.push(bulletPoint(note));
  }

  return createSection("Income Analysis", elements);
}

function buildCashFlowAnalysis(input: MemoInput): (Paragraph | Table)[] {
  const { cashflow } = input.analysis;
  const elements: (Paragraph | Table)[] = [];

  // Key metrics
  const metricsRows: string[][] = [
    ["Average Monthly Deposits", formatCurrency(cashflow.averageMonthlyDeposits)],
    [
      "Deposit-to-Income Ratio",
      cashflow.depositToIncomeRatio !== null
        ? formatPercent(cashflow.depositToIncomeRatio)
        : "N/A",
    ],
    ["NSF / Overdraft Count", String(cashflow.nsfCount)],
  ];

  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: metricsRows.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: {
                type: ShadingType.SOLID,
                color: COLORS.headerBg,
                fill: COLORS.headerBg,
              },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 18,
                      color: COLORS.headerText,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading:
                idx % 2 === 1
                  ? { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg }
                  : undefined,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: value,
                      bold: true,
                      size: 18,
                      color:
                        label.includes("NSF") && cashflow.nsfCount > 0
                          ? COLORS.belowAverage
                          : COLORS.black,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });

  elements.push(metricsTable);

  // Large deposits
  if (cashflow.largeDeposits.length > 0) {
    elements.push(spacer(8));
    elements.push(
      bodyText("Large Deposits Identified:", { bold: true, color: COLORS.primary }),
    );

    const ldHeaders = ["Date", "Amount", "Description"];
    const ldRows = cashflow.largeDeposits.map((d) => [
      d.date,
      formatCurrency(d.amount),
      d.description,
    ]);
    const ldCellOptions = ldRows.map(() => [
      { alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
      { alignment: AlignmentType.RIGHT as (typeof AlignmentType)[keyof typeof AlignmentType], bold: true },
      null,
    ]);
    elements.push(
      createTable(ldHeaders, ldRows, { columnWidths: [20, 25, 55], cellOptions: ldCellOptions }),
    );
  }

  // Notes
  if (cashflow.notes.length > 0) {
    elements.push(spacer(4));
    for (const note of cashflow.notes) {
      elements.push(bulletPoint(note));
    }
  }

  return createSection("Cash Flow Analysis", elements);
}

function buildBusinessAnalysis(input: MemoInput): (Paragraph | Table)[] | null {
  const { business } = input.analysis;
  if (!business) return null;

  const elements: (Paragraph | Table)[] = [];

  // Revenue by year
  const years = Object.keys(business.revenueByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length > 0) {
    elements.push(bodyText("Revenue by Year:", { bold: true, color: COLORS.primary }));
    const revHeaders = ["Year", "Revenue"];
    const revRows = years.map((y) => [String(y), formatCurrency(business.revenueByYear[y])]);
    const revCellOptions = revRows.map(() => [
      { alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
      { alignment: AlignmentType.RIGHT as (typeof AlignmentType)[keyof typeof AlignmentType], bold: true },
    ]);
    elements.push(createTable(revHeaders, revRows, { columnWidths: [40, 60], cellOptions: revCellOptions }));
    elements.push(spacer(4));
  }

  // Revenue trend
  elements.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Revenue Trend: ", bold: true, size: 20, font: "Calibri" }),
        new TextRun({
          text: business.revenueTrend,
          size: 20,
          font: "Calibri",
          bold: true,
          color: business.revenueTrend.toLowerCase().includes("increas") ? COLORS.accent : COLORS.belowAverage,
        }),
      ],
    }),
  );

  // Key metrics table
  const bizMetrics: string[][] = [
    ["Expense Ratio", formatPercent(business.expenseRatio)],
    ["Owner Compensation", formatCurrency(business.ownerCompensation)],
    ["Total Add-Backs", formatCurrency(business.addBacks.total)],
    ["Adjusted Net Income", formatCurrency(business.adjustedNetIncome)],
  ];

  const bizTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: bizMetrics.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 45, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: COLORS.headerBg, fill: COLORS.headerBg },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: label, bold: true, size: 18, color: COLORS.headerText, font: "Calibri" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: THIN_BORDERS,
              width: { size: 55, type: WidthType.PERCENTAGE },
              shading:
                label === "Adjusted Net Income"
                  ? { type: ShadingType.SOLID, color: COLORS.excellentBg, fill: COLORS.excellentBg }
                  : idx % 2 === 1
                    ? { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg }
                    : undefined,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({
                      text: value,
                      bold: label === "Adjusted Net Income",
                      size: 18,
                      color: label === "Adjusted Net Income" ? COLORS.accent : COLORS.black,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });

  elements.push(spacer(4));
  elements.push(bizTable);

  // Notes
  if (business.notes.length > 0) {
    elements.push(spacer(4));
    for (const note of business.notes) {
      elements.push(bulletPoint(note));
    }
  }

  return createSection("Business Analysis", elements);
}

function buildRiskAssessment(input: MemoInput): (Paragraph | Table)[] {
  const { riskFlags, riskScore, summary } = input.analysis;
  const elements: (Paragraph | Table)[] = [];

  // Overall risk score callout
  const scoreColor = ratingColor(summary.riskRating);
  const scoreBg = ratingBgColor(summary.riskRating);

  const riskScoreTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: scoreColor },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: scoreColor },
              left: { style: BorderStyle.SINGLE, size: 2, color: scoreColor },
              right: { style: BorderStyle.SINGLE, size: 2, color: scoreColor },
            },
            shading: { type: ShadingType.SOLID, color: scoreBg, fill: scoreBg },
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 40 },
                children: [
                  new TextRun({
                    text: "OVERALL RISK ASSESSMENT",
                    bold: true,
                    size: 22,
                    color: scoreColor,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `Score: ${riskScore} / 100`,
                    bold: true,
                    size: 32,
                    color: scoreColor,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: summary.riskRating,
                    bold: true,
                    size: 26,
                    color: scoreColor,
                    font: "Calibri",
                    allCaps: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(riskScoreTable);

  // Risk flags sorted by severity
  if (riskFlags.length > 0) {
    elements.push(spacer(8));
    elements.push(
      bodyText("Identified Risk Factors:", { bold: true, color: COLORS.primary }),
    );

    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      moderate: 2,
      low: 3,
      info: 4,
    };

    const sorted = [...riskFlags].sort(
      (a, b) =>
        (severityOrder[a.severity.toLowerCase()] ?? 5) -
        (severityOrder[b.severity.toLowerCase()] ?? 5),
    );

    for (const flag of sorted) {
      const sevColor = severityColor(flag.severity);
      const sevBg = severityBgColor(flag.severity);

      // Flag as a bordered box
      const flagTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              // Severity badge column
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: sevColor },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: sevColor },
                  left: { style: BorderStyle.SINGLE, size: 4, color: sevColor },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: sevBg, fill: sevBg },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: flag.severity.toUpperCase(),
                        bold: true,
                        size: 16,
                        color: sevColor,
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),
              // Content column
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: sevColor },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: sevColor },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: sevColor },
                },
                width: { size: 85, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: sevBg, fill: sevBg },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    spacing: { before: 40, after: 20 },
                    children: [
                      new TextRun({
                        text: `${flag.title}`,
                        bold: true,
                        size: 18,
                        color: COLORS.black,
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: `  [${flag.category}]`,
                        size: 16,
                        color: COLORS.textGray,
                        font: "Calibri",
                        italics: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { after: 20 },
                    children: [
                      new TextRun({
                        text: flag.description,
                        size: 17,
                        color: COLORS.textGray,
                        font: "Calibri",
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { after: 40 },
                    children: [
                      new TextRun({
                        text: "Recommendation: ",
                        bold: true,
                        size: 17,
                        color: COLORS.primaryLight,
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: flag.recommendation,
                        size: 17,
                        color: COLORS.primaryLight,
                        font: "Calibri",
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      elements.push(spacer(3));
      elements.push(flagTable);
    }
  } else {
    elements.push(spacer(4));
    elements.push(bodyText("No significant risk flags were identified during the analysis.", { color: COLORS.accent }));
  }

  return createSection("Risk Assessment", elements);
}

function buildVerificationSummary(input: MemoInput): (Paragraph | Table)[] {
  const v = input.verificationSummary;
  const elements: (Paragraph | Table)[] = [];

  const totalMath = v.mathChecksPassed + v.mathChecksFailed;
  const totalCrossDoc = v.crossDocPassed + v.crossDocFailed;
  const totalTextract = v.textractAgreed + v.textractDisagreed;

  const verificationRows: string[][] = [
    [
      "Mathematical Accuracy Checks",
      `${v.mathChecksPassed} passed`,
      `${v.mathChecksFailed} failed`,
      totalMath > 0 ? formatPercent(v.mathChecksPassed / totalMath) : "N/A",
    ],
    [
      "Cross-Document Consistency",
      `${v.crossDocPassed} passed`,
      `${v.crossDocFailed} failed`,
      totalCrossDoc > 0 ? formatPercent(v.crossDocPassed / totalCrossDoc) : "N/A",
    ],
    [
      "OCR / Textract Agreement",
      `${v.textractAgreed} agreed`,
      `${v.textractDisagreed} disagreed`,
      totalTextract > 0 ? formatPercent(v.textractAgreed / totalTextract) : "N/A",
    ],
    [
      "Review Items Resolved",
      `${v.reviewItemsResolved} items`,
      "",
      "",
    ],
  ];

  const headers = ["Verification Type", "Passed", "Failed", "Pass Rate"];
  const cellOptions = verificationRows.map((row) => {
    // Color the pass rate cell
    const passRate = row[3];
    let prColor = COLORS.black;
    let prBg: string | undefined;
    if (passRate !== "N/A" && passRate !== "") {
      const pct = parseFloat(passRate);
      if (pct >= 95) {
        prColor = COLORS.accent;
        prBg = COLORS.excellentBg;
      } else if (pct >= 80) {
        prColor = COLORS.adequate;
        prBg = COLORS.adequateBg;
      } else {
        prColor = COLORS.poor;
        prBg = COLORS.poorBg;
      }
    }
    return [
      { bold: true },
      {
        color: COLORS.accent,
        alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType],
      },
      {
        color: row[2] && !row[2].startsWith("0") ? COLORS.belowAverage : COLORS.textGray,
        alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType],
      },
      {
        bold: true,
        color: prColor,
        bgColor: prBg,
        alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType],
      },
    ];
  });

  elements.push(
    createTable(headers, verificationRows, {
      columnWidths: [35, 22, 22, 21],
      cellOptions,
    }),
  );

  // Explanatory note
  elements.push(spacer(4));
  elements.push(
    bodyText(
      "Verification checks compare AI-extracted data against source documents using mathematical validation, " +
        "cross-document consistency analysis, and AWS Textract OCR as an independent extraction baseline.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return createSection("Verification Summary", elements);
}

function buildDocumentInventory(input: MemoInput): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  if (input.documents.length === 0) {
    elements.push(bodyText("No documents were provided for this analysis."));
    return createSection("Document Inventory", elements);
  }

  const headers = ["#", "File Name", "Document Type", "Year"];
  const rows = input.documents.map((doc, idx) => [
    String(idx + 1),
    doc.fileName,
    doc.docType,
    doc.year ? String(doc.year) : "-",
  ]);

  const cellOptions = rows.map(() => [
    { alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
    null,
    null,
    { alignment: AlignmentType.CENTER as (typeof AlignmentType)[keyof typeof AlignmentType] },
  ]);

  elements.push(
    createTable(headers, rows, {
      columnWidths: [8, 42, 30, 20],
      cellOptions,
    }),
  );

  elements.push(spacer(4));
  elements.push(
    bodyText(`Total documents analyzed: ${input.documents.length}`, {
      bold: true,
      color: COLORS.primary,
    }),
  );

  return createSection("Document Inventory", elements);
}

function buildDisclaimer(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  const disclaimerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray },
              left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray },
              right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray },
            },
            shading: { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg },
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 60 },
                children: [
                  new TextRun({
                    text: "DISCLAIMER",
                    bold: true,
                    size: 20,
                    color: COLORS.textGray,
                    font: "Calibri",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text:
                      "This analysis was generated by OpenShut AI and should be reviewed by a qualified underwriter " +
                      "before making lending decisions. The automated analysis is based on the documents provided and " +
                      "the data extracted from them. While every effort is made to ensure accuracy, AI-generated " +
                      "results may contain errors and should not be the sole basis for credit decisions.",
                    size: 18,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text:
                      "All financial figures, ratios, and assessments are derived from the submitted documentation " +
                      "and should be independently verified. This memorandum does not constitute a commitment to lend " +
                      "and is intended for internal use by authorized personnel only.",
                    size: 18,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(spacer(12));
  elements.push(disclaimerTable);

  return elements;
}

/* -------------------------------------------------------------------------- */
/*  DTI detail section                                                        */
/* -------------------------------------------------------------------------- */

function buildDtiDetail(input: MemoInput): (Paragraph | Table)[] {
  const { dti } = input.analysis;
  const elements: (Paragraph | Table)[] = [];

  // Debt items table
  if (dti.debtItems.length > 0) {
    elements.push(bodyText("Monthly Debt Obligations:", { bold: true, color: COLORS.primary }));
    const headers = ["Description", "Monthly Amount"];
    const rows = dti.debtItems.map((d) => [d.description, formatCurrencyDetailed(d.monthlyAmount)]);
    // Add total row
    rows.push(["TOTAL", formatCurrencyDetailed(dti.totalMonthlyDebt)]);

    const cellOptions = rows.map((_, idx) => {
      const isTotal = idx === rows.length - 1;
      return [
        {
          bold: isTotal,
          color: isTotal ? COLORS.primary : undefined,
          bgColor: isTotal ? COLORS.altRowBg : undefined,
        },
        {
          bold: isTotal,
          color: isTotal ? COLORS.primary : undefined,
          bgColor: isTotal ? COLORS.altRowBg : undefined,
          alignment: AlignmentType.RIGHT as (typeof AlignmentType)[keyof typeof AlignmentType],
        },
      ];
    });

    elements.push(createTable(headers, rows, { columnWidths: [60, 40], cellOptions }));
    elements.push(spacer(4));
  }

  // Summary
  elements.push(
    bodyText(`Gross Monthly Income: ${formatCurrencyDetailed(dti.grossMonthlyIncome)}`, { bold: true }),
  );
  if (dti.frontEndDti !== null) {
    elements.push(bodyText(`Front-End DTI: ${formatPercent(dti.frontEndDti)}`));
  }
  if (dti.backEndDti !== null) {
    elements.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Back-End DTI: ", size: 20, font: "Calibri", bold: true }),
          new TextRun({
            text: formatPercent(dti.backEndDti),
            size: 20,
            font: "Calibri",
            bold: true,
            color: ratingColor(dti.rating),
          }),
          new TextRun({
            text: ` (${dti.rating})`,
            size: 20,
            font: "Calibri",
            color: ratingColor(dti.rating),
          }),
        ],
      }),
    );
  }

  // Notes
  for (const note of dti.notes) {
    elements.push(bulletPoint(note));
  }

  return createSection("Debt-to-Income Analysis", elements);
}

/* -------------------------------------------------------------------------- */
/*  Main generator                                                            */
/* -------------------------------------------------------------------------- */

export async function generateCreditMemo(input: MemoInput): Promise<Buffer> {
  // Collect all document sections
  const children: (Paragraph | Table)[] = [];

  // 1. Title page
  children.push(...buildTitlePage(input));

  // 2. Borrower summary
  children.push(...buildBorrowerSummary(input));
  children.push(spacer(8));

  // 3. Executive summary
  children.push(...createSection("Executive Summary", generateExecutiveSummary(input)));
  children.push(spacer(8));

  // 4. Financial ratios
  children.push(...buildFinancialRatios(input));
  children.push(spacer(8));

  // 5. Income analysis
  children.push(...buildIncomeAnalysis(input));
  children.push(spacer(8));

  // DTI detail
  children.push(...buildDtiDetail(input));
  children.push(spacer(8));

  // 6. Cash flow analysis
  children.push(...buildCashFlowAnalysis(input));
  children.push(spacer(8));

  // 7. Business analysis (conditional)
  const bizSection = buildBusinessAnalysis(input);
  if (bizSection) {
    children.push(...bizSection);
    children.push(spacer(8));
  }

  // 8. Risk assessment
  children.push(...buildRiskAssessment(input));
  children.push(spacer(8));

  // 9. Verification summary
  children.push(...buildVerificationSummary(input));
  children.push(spacer(8));

  // 10. Document inventory
  children.push(...buildDocumentInventory(input));

  // 11. Disclaimer
  children.push(...buildDisclaimer());

  // Build the document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 20,
            color: COLORS.black,
          },
        },
        heading2: {
          run: {
            font: "Calibri",
            size: 26,
            bold: true,
            color: COLORS.primary,
          },
          paragraph: {
            spacing: { before: 360, after: 120 },
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: "Calibri",
            size: 20,
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.85),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.85),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
                },
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: "OpenShut AI ",
                    bold: true,
                    size: 16,
                    color: COLORS.primary,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: " |  Credit Analysis Memorandum",
                    size: 16,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
                },
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: "Confidential  |  ",
                    size: 14,
                    color: COLORS.textGray,
                    font: "Calibri",
                    italics: true,
                  }),
                  new TextRun({
                    text: `${input.borrowerName}  |  `,
                    size: 14,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: "Page ",
                    size: 14,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 14,
                    color: COLORS.textGray,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
