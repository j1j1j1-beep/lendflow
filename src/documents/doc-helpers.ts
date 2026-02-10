// =============================================================================
// doc-helpers.ts
// Shared docx building blocks for loan document generation.
// Extracted from memo/generate.ts pattern + legal-document-specific additions.
// =============================================================================

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
  ShadingType,
  Header,
  Footer,
  PageNumber,
  VerticalAlign,
  LevelFormat,
  convertInchesToTwip,
  PageBreak,
  NumberFormat,
  Tab,
  TabStopType,
  TabStopPosition,
} from "docx";

// Re-export docx types that templates need
export {
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
  ShadingType,
  Header,
  Footer,
  PageNumber,
  VerticalAlign,
  LevelFormat,
  convertInchesToTwip,
  PageBreak,
  NumberFormat,
  Tab,
  TabStopType,
  TabStopPosition,
};

// ---------------------------------------------------------------------------
// Colors — consistent with credit memo
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: "1B3A5C",
  primaryLight: "2C5F8A",
  accent: "0D7C66",
  headerBg: "1B3A5C",
  headerText: "FFFFFF",
  altRowBg: "F0F4F8",
  white: "FFFFFF",
  black: "1A1A1A",
  textGray: "4A5568",
  borderGray: "CBD5E0",
  lightBorder: "E2E8F0",
};

// ---------------------------------------------------------------------------
// Border presets
// ---------------------------------------------------------------------------

export const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

export const THIN_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "[Amount TBD]";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number): string {
  if (isNaN(amount)) return "[Amount TBD]";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(decimal: number): string {
  if (isNaN(decimal)) return "[Rate TBD]";
  return `${(decimal * 100).toFixed(3)}%`;
}

export function formatPercentShort(decimal: number): string {
  if (isNaN(decimal)) return "[Rate TBD]";
  return `${(decimal * 100).toFixed(2)}%`;
}

export function formatDate(d: Date | null | undefined): string {
  if (!d) return "[Date TBD]";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function numberToWords(n: number): string {
  if (n === 0) return "zero";
  if (n < 0) return "negative " + numberToWords(Math.abs(n));

  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function chunk(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? "-" + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " hundred" + (num % 100 ? " " + chunk(num % 100) : "");
    return "";
  }

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = Math.floor(n % 1_000);

  let result = "";
  if (billions) result += chunk(billions) + " billion ";
  if (millions) result += chunk(millions) + " million ";
  if (thousands) result += chunk(thousands) + " thousand ";
  if (remainder) result += chunk(remainder);

  return result.trim();
}

/**
 * Compute maturity date from a start date + term in months.
 */
export function computeMaturityDate(startDate: Date, termMonths: number): Date {
  const d = new Date(startDate);
  const targetMonth = d.getMonth() + termMonths;
  const originalDay = d.getDate();
  d.setMonth(targetMonth);
  // Handle month-end overflow (e.g., Jan 31 + 1 month → Feb 28, not Mar 3)
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Roll back to last day of previous month
  }
  return d;
}

/**
 * Compute first payment date (1 month after closing).
 */
export function computeFirstPaymentDate(closingDate: Date): Date {
  const d = new Date(closingDate);
  d.setMonth(d.getMonth() + 1, 1); // First of next month (no overflow risk since day=1)
  return d;
}

// ---------------------------------------------------------------------------
// Reusable docx element builders
// ---------------------------------------------------------------------------

export function spacer(points = 6): Paragraph {
  return new Paragraph({ spacing: { before: points * 20, after: points * 20 } });
}

export function sectionHeading(text: string): Paragraph {
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

export function articleHeading(number: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text: `ARTICLE ${number}`,
        bold: true,
        size: 24,
        color: COLORS.primary,
        font: "Calibri",
        allCaps: true,
      }),
      new TextRun({
        text: `  ${title}`,
        bold: true,
        size: 24,
        color: COLORS.primary,
        font: "Calibri",
        allCaps: true,
      }),
    ],
  });
}

export function sectionSubheading(number: string, title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: `Section ${number}. `,
        bold: true,
        size: 20,
        color: COLORS.primary,
        font: "Calibri",
      }),
      new TextRun({
        text: title,
        bold: true,
        size: 20,
        color: COLORS.primary,
        font: "Calibri",
      }),
    ],
  });
}

export function bodyText(
  text: string,
  options?: { bold?: boolean; italic?: boolean; color?: string; indent?: number },
): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    indent: options?.indent ? { left: convertInchesToTwip(options.indent) } : undefined,
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

/** Multi-run paragraph for mixed formatting within a single paragraph. */
export function bodyTextRuns(runs: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean }>): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          size: 20,
          font: "Calibri",
          bold: r.bold,
          italics: r.italic,
          underline: r.underline ? {} : undefined,
        }),
    ),
  });
}

export function bulletPoint(
  text: string,
  options?: { bold?: boolean; color?: string },
): Paragraph {
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

export function numberedItem(text: string, level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: "legal-numbering", level },
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        color: COLORS.black,
      }),
    ],
  });
}

/** Build a cell for a header row. */
export function headerCell(text: string, widthPercent?: number): TableCell {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: COLORS.headerBg, fill: COLORS.headerBg },
    borders: THIN_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
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
export function dataCell(
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
    width: options?.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
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
 * Build a complete styled table.
 */
export function createTable(
  headers: string[],
  rows: string[][],
  options?: {
    columnWidths?: number[];
    alternateRows?: boolean;
  },
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      headerCell(h, options?.columnWidths?.[i]),
    ),
  });

  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      children: row.map((cell, colIdx) =>
        dataCell(cell, {
          bgColor:
            options?.alternateRows !== false && rowIdx % 2 === 1
              ? COLORS.altRowBg
              : undefined,
          widthPercent: options?.columnWidths?.[colIdx],
        }),
      ),
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: "fixed" as any,
    rows: [headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// Legal document specific helpers
// ---------------------------------------------------------------------------

/** Title block for a legal document (centered, bold, document name). */
export function documentTitle(title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 32,
        color: COLORS.primary,
        font: "Calibri",
        allCaps: true,
      }),
    ],
  });
}

/** Signature block with name + title + date lines. */
export function signatureBlock(
  partyName: string,
  title?: string,
): Paragraph[] {
  return [
    spacer(20),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: "________________________________________",
          size: 20,
          font: "Calibri",
          color: COLORS.textGray,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 0 },
      children: [
        new TextRun({
          text: partyName,
          bold: true,
          size: 20,
          font: "Calibri",
        }),
      ],
    }),
    ...(title
      ? [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: title,
                size: 18,
                font: "Calibri",
                color: COLORS.textGray,
              }),
            ],
          }),
        ]
      : []),
    spacer(4),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: "Date: ___________________",
          size: 18,
          font: "Calibri",
          color: COLORS.textGray,
        }),
      ],
    }),
  ];
}

/** Party identification block (BETWEEN clause). */
export function partyBlock(role: string, name: string, description?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: `${role}: `,
        bold: true,
        size: 20,
        font: "Calibri",
        color: COLORS.primary,
      }),
      new TextRun({
        text: name,
        bold: true,
        size: 20,
        font: "Calibri",
      }),
      ...(description
        ? [
            new TextRun({
              text: ` (${description})`,
              size: 20,
              font: "Calibri",
              color: COLORS.textGray,
            }),
          ]
        : []),
    ],
  });
}

/** Key terms summary table (Term | Value pairs). */
export function keyTermsTable(
  terms: Array<{ label: string; value: string }>,
): Table {
  return createTable(
    ["Term", "Value"],
    terms.map((t) => [t.label, t.value]),
    { columnWidths: [40, 60], alternateRows: true },
  );
}

/** Notary acknowledgment block for documents requiring notarization. */
export function notaryBlock(stateAbbr: string | null): Paragraph[] {
  const stateName = stateAbbr ? stateAbbr.toUpperCase() : "___________";
  return [
    spacer(16),
    sectionHeading("Notary Acknowledgment"),
    bodyText(`STATE OF ${stateName}`),
    bodyText("COUNTY OF _______________"),
    spacer(4),
    bodyText(
      `On this _____ day of _______________, 20___, before me, the undersigned notary public, personally appeared ___________________________________, known to me (or proved to me on the basis of satisfactory evidence) to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies), and that by his/her/their signature(s) on the instrument the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.`,
    ),
    spacer(8),
    bodyText("WITNESS my hand and official seal."),
    spacer(12),
    bodyText("________________________________________"),
    bodyText("Notary Public"),
    bodyText("My Commission Expires: _______________"),
    bodyText("[SEAL]", { italic: true }),
  ];
}

// ---------------------------------------------------------------------------
// Document wrapper — builds a complete Document with standard page setup
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Collateral type descriptions — human-readable labels for enum values
// ---------------------------------------------------------------------------

const COLLATERAL_DESCRIPTIONS: Record<string, string> = {
  real_estate:
    "All real property, including but not limited to land, buildings, fixtures, and improvements thereto",
  commercial_real_estate:
    "First Priority Deed of Trust/Mortgage on the commercial real property",
  residential_1_4:
    "First Priority Deed of Trust/Mortgage on the residential property (1-4 family)",
  residential_condo:
    "First Priority Deed of Trust/Mortgage on the residential condominium unit",
  equipment:
    "All equipment, machinery, tools, furniture, fixtures, and other tangible personal property",
  heavy_equipment:
    "All heavy equipment, machinery, and related attachments, together with all accessories and replacements",
  inventory:
    "All inventory, including raw materials, work-in-process, finished goods, and supplies",
  accounts_receivable:
    "All accounts, accounts receivable, chattel paper, instruments, and general intangibles",
  blanket_lien:
    "Blanket lien on all assets of the Borrower, including all present and after-acquired property",
  vehicles:
    "All motor vehicles, trailers, and other titled goods, together with all certificates of title",
  intellectual_property:
    "All intellectual property, including patents, trademarks, copyrights, trade secrets, and licenses",
  securities:
    "All investment property, securities, securities accounts, and financial assets",
  digital_assets:
    "All digital assets, cryptocurrency, tokens, and rights associated therewith, including private keys and wallet access",
  cash_and_deposits:
    "All deposit accounts, cash, and cash equivalents held at any financial institution",
  general_intangibles:
    "All general intangibles, including payment intangibles, software, and contract rights",
};

/**
 * Convert a collateral type enum value to a human-readable description.
 * Falls back to title-casing the raw value if not in the map.
 */
export function collateralLabel(type: string): string {
  return COLLATERAL_DESCRIPTIONS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Prose array safety — prevents character-by-character rendering
// ---------------------------------------------------------------------------

/**
 * Safely convert an AI prose value that should be a string[] into an actual
 * string[]. Handles all edge cases:
 *   - Already a proper string[] → returned as-is
 *   - A string (AI returned prose as single text) → wrapped in [string]
 *   - An array of single characters (string was spread) → joined back
 *   - null/undefined → placeholder array
 */
export function ensureProseArray(value: unknown): string[] {
  if (!value) {
    return ["[This section was not generated. Manual review required.]"];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    // Filter out non-strings and empty values
    const strings = value.filter((v): v is string => typeof v === "string" && v.length > 0);
    if (strings.length === 0) {
      return ["[This section was not generated. Manual review required.]"];
    }
    // Detect character-by-character arrays: if average length ≤ 2, it's a spread string
    const avgLen = strings.reduce((sum, s) => sum + s.length, 0) / strings.length;
    if (avgLen <= 2) {
      return [strings.join("")];
    }
    return strings;
  }

  return [String(value)];
}

export function buildLegalDocument(options: {
  title: string;
  headerLeft?: string;
  headerRight?: string;
  children: Paragraph[] | (Paragraph | Table)[];
}): Document {
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: COLORS.black },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "legal-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "(%1)",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.3) } } },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "(%2)",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.3) } } },
            },
          ],
        },
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
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
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: options.headerRight ?? options.title,
                    size: 16,
                    font: "Calibri",
                    color: COLORS.textGray,
                    italics: true,
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
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 16,
                    font: "Calibri",
                    color: COLORS.textGray,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: "Calibri",
                    color: COLORS.textGray,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [
                  new TextRun({
                    text: "CONFIDENTIAL — DRAFT",
                    size: 14,
                    font: "Calibri",
                    color: COLORS.textGray,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: options.children as any[],
      },
    ],
  });
}
