// k1-summary.ts
// Generates a K-1 Summary Report.
// From the compliance regulations reference Section 4.
//
// This is MOSTLY DETERMINISTIC — presents data in K-1 format.
// AI generates explanatory notes only.
//
// Maps all 19 K-1 fields to their IRS Form 1065 Schedule K-1 boxes:
// k1OrdinaryIncome → Box 1, k1NetRentalIncome → Box 2,
// k1GuaranteedPayments → Box 4c, k1InterestIncome → Box 5,
// k1DividendIncome → Box 6a, k1ShortTermCapGain → Box 8,
// k1LongTermCapGain → Box 9a, k1Section1231Gain → Box 10,
// k1Section179Deduction → Box 12, k1OtherDeductions → Box 13,
// k1SelfEmploymentIncome → Box 14, k1ForeignTaxPaid → Box 16/21,
// k1AMTItems → Box 17, k1TaxExemptIncome → Box 18,
// k1Distributions → Box 19, k1EndingCapitalAccount → Part II Item L,
// k1UnrecapturedSec1250 → Box 9c, k1QBIDeduction → Box 20 Code Z,
// k1UBTI → Box 20 Code V
//
// Filing deadline: March 15 (or September 15 with extension)
// Late filing penalty: $240/partner/month (2025 rate, 26 USC §6698)

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  createTable,
  keyTermsTable,
  formatCurrency,
  formatCurrencyDetailed,
  COLORS,
} from "../../doc-helpers";

import type { ComplianceProjectFull, ComplianceCheck, K1SummaryProse } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation (minimal — explanatory notes only) ──────────

const SYSTEM_PROMPT = `You are a tax specialist preparing K-1 summary reports for limited partners. Your summaries must accurately explain the K-1 line items and filing requirements.

RULES:
1. All financial numbers will be provided separately in a table — do not invent or modify numbers.
2. Explain what each major K-1 category means for the LP's tax return.
3. Reference correct IRS form numbers and IRC sections.
4. Filing deadline and penalty information must be accurate (March 15, or Sept 15 with extension; $240/partner/month late penalty under 26 USC §6698).
5. Output ONLY valid JSON matching the requested schema.`;

async function generateK1Prose(project: ComplianceProjectFull): Promise<K1SummaryProse> {
  const context = buildProjectContext(project);

  return claudeJson<K1SummaryProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate narrative prose sections for a K-1 Summary Report.

${context}

Return JSON with these keys:
{
  "coverLetter": "1-2 paragraph cover letter to the LP explaining the enclosed K-1 summary and key items to note for their tax return",
  "filingInstructions": "1-2 paragraphs explaining how the LP should use this K-1 information when preparing their individual tax return, including which IRS forms to reference",
  "specialAllocationsNote": "1 paragraph explaining any special allocations (if applicable) or noting that allocations follow standard pro rata methodology per the LPA",
  "stateFilingNote": "1 paragraph noting that the LP may have state filing obligations in the state where the fund operates and any states where portfolio companies are located"
}`,
    maxTokens: 2000,
  });
}

// ─── Helper: Decimal to Number ───────────────────────────────────────

function d2n(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildK1Summary(project: ComplianceProjectFull): Promise<Document> {
  const prose = await generateK1Prose(project);

  const taxYear = project.taxYear ?? new Date().getFullYear() - 1;

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filing deadline
  const filingDeadline = project.filingDeadline
    ? project.filingDeadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : `March 15, ${taxYear + 1}`;

  const extensionDeadline = `September 15, ${taxYear + 1}`;

  // Extract all 19 K-1 fields
  const k1Data = {
    ordinaryIncome: d2n(project.k1OrdinaryIncome),
    netRentalIncome: d2n(project.k1NetRentalIncome),
    guaranteedPayments: d2n(project.k1GuaranteedPayments),
    interestIncome: d2n(project.k1InterestIncome),
    dividendIncome: d2n(project.k1DividendIncome),
    shortTermCapGain: d2n(project.k1ShortTermCapGain),
    longTermCapGain: d2n(project.k1LongTermCapGain),
    section1231Gain: d2n(project.k1Section1231Gain),
    section179Deduction: d2n(project.k1Section179Deduction),
    otherDeductions: d2n(project.k1OtherDeductions),
    selfEmploymentIncome: d2n(project.k1SelfEmploymentIncome),
    foreignTaxPaid: d2n(project.k1ForeignTaxPaid),
    amtItems: d2n(project.k1AMTItems),
    taxExemptIncome: d2n(project.k1TaxExemptIncome),
    distributions: d2n(project.k1Distributions),
    endingCapitalAccount: d2n(project.k1EndingCapitalAccount),
    unrecapturedSec1250: d2n(project.k1UnrecapturedSec1250),
    qbiDeduction: d2n(project.k1QBIDeduction),
    ubti: d2n(project.k1UBTI),
  };

  // Compute total income/loss
  const totalIncome =
    k1Data.ordinaryIncome +
    k1Data.netRentalIncome +
    k1Data.guaranteedPayments +
    k1Data.interestIncome +
    k1Data.dividendIncome +
    k1Data.shortTermCapGain +
    k1Data.longTermCapGain +
    k1Data.section1231Gain;

  const totalDeductions =
    k1Data.section179Deduction +
    k1Data.otherDeductions;

  const children: (Paragraph | Table)[] = [];

  // ─── Title ─────────────────────────────────────────────────────
  children.push(documentTitle("Schedule K-1 Summary Report"));
  children.push(spacer(4));
  children.push(
    bodyText(project.fundName, { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(`Tax Year: ${taxYear}`, { bold: true }));
  children.push(bodyText(`IRS Form 1065 — Schedule K-1 (Partner's Share of Income, Deductions, Credits)`, { color: COLORS.textGray }));
  children.push(bodyText(`Report Date: ${dateFormatted}`, { color: COLORS.textGray }));
  children.push(spacer(8));

  // ─── Cover Letter ──────────────────────────────────────────────
  children.push(sectionHeading("To Our Limited Partners"));
  children.push(bodyText(prose.coverLetter));
  children.push(spacer(8));

  // ─── Filing Deadlines ──────────────────────────────────────────
  children.push(sectionHeading("Filing Deadlines"));

  children.push(
    keyTermsTable([
      { label: "Tax Year", value: taxYear.toString() },
      { label: "Partnership Return (Form 1065)", value: filingDeadline },
      { label: "K-1 Delivery Deadline", value: filingDeadline },
      { label: "Extension Deadline (Form 7004)", value: extensionDeadline },
      { label: "Late Filing Penalty", value: "$240 per partner per month (max 12 months)" },
      { label: "Penalty Authority", value: "26 U.S.C. § 6698" },
    ]),
  );
  children.push(spacer(8));

  // ─── K-1 Summary Table (DETERMINISTIC) ─────────────────────────
  children.push(sectionHeading("Schedule K-1 — Partner's Share of Current Year Income, Deductions, Credits"));

  children.push(
    bodyText(
      "The following table summarizes your allocable share of the partnership's income, " +
      "deductions, and credits for the tax year as reported on IRS Schedule K-1 (Form 1065).",
      { italic: true },
    ),
  );
  children.push(spacer(4));

  // Part III: Income
  children.push(bodyText("Part III — Income (Loss)", { bold: true, color: COLORS.primary }));
  children.push(spacer(2));

  children.push(
    createTable(
      ["K-1 Box", "Description", "Tax Character", "Amount"],
      [
        ["Box 1", "Ordinary business income (loss)", "Ordinary", formatCurrencyDetailed(k1Data.ordinaryIncome)],
        ["Box 2", "Net rental real estate income (loss)", "Passive (unless REPS)", formatCurrencyDetailed(k1Data.netRentalIncome)],
        ["Box 4c", "Total guaranteed payments", "Ordinary", formatCurrencyDetailed(k1Data.guaranteedPayments)],
        ["Box 5", "Interest income", "Portfolio", formatCurrencyDetailed(k1Data.interestIncome)],
        ["Box 6a", "Ordinary dividends", "Portfolio", formatCurrencyDetailed(k1Data.dividendIncome)],
        ["Box 8", "Net short-term capital gain (loss)", "Capital", formatCurrencyDetailed(k1Data.shortTermCapGain)],
        ["Box 9a", "Net long-term capital gain (loss)", "Capital", formatCurrencyDetailed(k1Data.longTermCapGain)],
        ["Box 9c", "Unrecaptured Section 1250 gain", "Capital (25% rate)", formatCurrencyDetailed(k1Data.unrecapturedSec1250)],
        ["Box 10", "Net Section 1231 gain (loss)", "Ordinary or capital", formatCurrencyDetailed(k1Data.section1231Gain)],
      ],
      { alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Total income line
  children.push(
    bodyTextRuns([
      { text: "Total Income (Loss): ", bold: true },
      { text: formatCurrencyDetailed(totalIncome) },
    ]),
  );
  children.push(spacer(8));

  // Part III: Deductions
  children.push(bodyText("Part III — Deductions", { bold: true, color: COLORS.primary }));
  children.push(spacer(2));

  children.push(
    createTable(
      ["K-1 Box", "Description", "Tax Character", "Amount"],
      [
        ["Box 12", "Section 179 deduction", "Ordinary", formatCurrencyDetailed(k1Data.section179Deduction)],
        ["Box 13", "Other deductions", "Various", formatCurrencyDetailed(k1Data.otherDeductions)],
      ],
      { alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "Total Deductions: ", bold: true },
      { text: formatCurrencyDetailed(totalDeductions) },
    ]),
  );
  children.push(spacer(8));

  // Other items
  children.push(bodyText("Part III — Other Items", { bold: true, color: COLORS.primary }));
  children.push(spacer(2));

  children.push(
    createTable(
      ["K-1 Box", "Description", "Tax Character", "Amount"],
      [
        ["Box 14", "Self-employment earnings (loss)", "SE tax", formatCurrencyDetailed(k1Data.selfEmploymentIncome)],
        ["Box 16/21", "Foreign taxes paid or accrued", "Foreign tax credit", formatCurrencyDetailed(k1Data.foreignTaxPaid)],
        ["Box 17", "Alternative minimum tax (AMT) items", "AMT adjustment", formatCurrencyDetailed(k1Data.amtItems)],
        ["Box 18", "Tax-exempt income", "Various", formatCurrencyDetailed(k1Data.taxExemptIncome)],
        ["Box 19", "Distributions", "Non-taxable (reduce basis)", formatCurrencyDetailed(k1Data.distributions)],
        ["Box 20, Code Z", "Section 199A (QBI) deduction", "QBI", formatCurrencyDetailed(k1Data.qbiDeduction)],
        ["Box 20, Code V", "Unrelated business taxable income (UBTI)", "UBTI", formatCurrencyDetailed(k1Data.ubti)],
      ],
      { alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Capital account
  children.push(bodyText("Part II, Item L — Partner's Capital Account", { bold: true, color: COLORS.primary }));
  children.push(spacer(2));

  children.push(
    keyTermsTable([
      {
        label: "Ending Capital Account",
        value: formatCurrencyDetailed(k1Data.endingCapitalAccount),
      },
    ]),
  );
  children.push(spacer(8));

  // ─── Net Income Summary ────────────────────────────────────────
  children.push(sectionHeading("Net Income Summary"));

  children.push(
    keyTermsTable([
      { label: "Total Income (Loss)", value: formatCurrencyDetailed(totalIncome) },
      { label: "Total Deductions", value: formatCurrencyDetailed(totalDeductions) },
      { label: "Net Income (Loss)", value: formatCurrencyDetailed(totalIncome - totalDeductions) },
      { label: "Distributions (Box 19)", value: formatCurrencyDetailed(k1Data.distributions) },
      { label: "Ending Capital Account", value: formatCurrencyDetailed(k1Data.endingCapitalAccount) },
    ]),
  );
  children.push(spacer(8));

  // ─── UBTI Note (important for IRA/tax-exempt LPs) ──────────────
  if (k1Data.ubti !== 0) {
    children.push(sectionHeading("UBTI Notice — Tax-Exempt Partners"));

    children.push(
      bodyText(
        `This partnership has allocated ${formatCurrencyDetailed(k1Data.ubti)} of Unrelated Business ` +
        "Taxable Income (UBTI) to your account. Tax-exempt partners (including IRAs, 401(k)s, and " +
        "charitable organizations) may be required to file Form 990-T and pay unrelated business income " +
        "tax (UBIT) on UBTI in excess of $1,000. Please consult your tax advisor.",
        { bold: true },
      ),
    );
    children.push(spacer(8));
  }

  // ─── QBI Note ──────────────────────────────────────────────────
  if (k1Data.qbiDeduction !== 0) {
    children.push(sectionHeading("Section 199A (QBI) Deduction"));

    children.push(
      bodyText(
        `Your allocable share of qualified business income for Section 199A purposes is ` +
        `${formatCurrencyDetailed(k1Data.qbiDeduction)}. The Section 199A deduction allows eligible ` +
        "taxpayers to deduct up to 20% of QBI from pass-through entities. Eligibility and limitations " +
        "depend on your taxable income, filing status, and the type of trade or business. " +
        "This information is reported on Box 20, Code Z of your Schedule K-1.",
      ),
    );
    children.push(spacer(8));
  }

  // ─── Filing Instructions ───────────────────────────────────────
  children.push(sectionHeading("Filing Instructions"));
  children.push(bodyText(prose.filingInstructions));
  children.push(spacer(8));

  // ─── Special Allocations ───────────────────────────────────────
  children.push(sectionHeading("Special Allocations"));
  children.push(bodyText(prose.specialAllocationsNote));
  children.push(spacer(8));

  // ─── State Filing Obligations ──────────────────────────────────
  children.push(sectionHeading("State Filing Obligations"));
  children.push(bodyText(prose.stateFilingNote));
  children.push(spacer(8));

  // ─── Important Notices ─────────────────────────────────────────
  children.push(sectionHeading("Important Notices"));

  children.push(bulletPoint("This summary is provided for informational purposes and does not constitute tax advice."));
  children.push(bulletPoint("The official Schedule K-1 (Form 1065) will be furnished to you and filed with the IRS."));
  children.push(bulletPoint("Please provide this information to your tax preparer when filing your individual return."));
  children.push(bulletPoint("If you received an extension, the K-1 may be revised; please check with the fund administrator."));
  children.push(
    bulletPoint(
      `Late filing penalty: $240 per partner per month, up to 12 months, under 26 U.S.C. § 6698 (2025 rate).`,
    ),
  );
  children.push(spacer(8));

  // ─── Disclaimer ────────────────────────────────────────────────
  children.push(
    bodyText(
      "DISCLAIMER: This K-1 Summary Report is prepared for informational convenience only and does " +
      "not replace the official Schedule K-1 (Form 1065). The information herein may differ from " +
      "the final K-1 due to year-end adjustments, audit adjustments, or amended returns. Partners " +
      "should rely solely on the official K-1 for tax reporting purposes and consult their own " +
      "tax advisors regarding their individual tax situations.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "K-1 Summary Report",
    headerRight: `${project.fundName} — K-1 Summary (TY ${taxYear})`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runK1ComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  const taxYear = project.taxYear ?? new Date().getFullYear() - 1;

  // Tax year specified
  checks.push({
    name: "Tax Year Specified",
    regulation: "IRS Form 1065 / Schedule K-1",
    category: "irs",
    passed: project.taxYear !== null,
    note: project.taxYear !== null
      ? `Tax year: ${project.taxYear}`
      : `Tax year not specified — defaulting to ${taxYear}`,
  });

  // Filing deadline
  const now = new Date();
  const march15 = new Date(taxYear + 1, 2, 15); // March 15 of following year
  const isPastDeadline = now > march15;

  checks.push({
    name: "K-1 Filing Deadline",
    regulation: "26 U.S.C. § 6031 — March 15 or September 15 with extension",
    category: "irs",
    passed: !isPastDeadline || !!project.filingDeadline,
    note: isPastDeadline
      ? project.filingDeadline
        ? `Extension filed — deadline: ${project.filingDeadline.toISOString().split("T")[0]}`
        : `WARNING: March 15, ${taxYear + 1} has passed — ensure Form 7004 extension was filed`
      : `Filing deadline: March 15, ${taxYear + 1}`,
  });

  // K-1 data completeness
  const k1Fields = [
    { field: "k1OrdinaryIncome", box: "Box 1" },
    { field: "k1NetRentalIncome", box: "Box 2" },
    { field: "k1GuaranteedPayments", box: "Box 4c" },
    { field: "k1InterestIncome", box: "Box 5" },
    { field: "k1DividendIncome", box: "Box 6a" },
    { field: "k1ShortTermCapGain", box: "Box 8" },
    { field: "k1LongTermCapGain", box: "Box 9a" },
    { field: "k1Section1231Gain", box: "Box 10" },
    { field: "k1Section179Deduction", box: "Box 12" },
    { field: "k1OtherDeductions", box: "Box 13" },
    { field: "k1SelfEmploymentIncome", box: "Box 14" },
    { field: "k1ForeignTaxPaid", box: "Box 16/21" },
    { field: "k1AMTItems", box: "Box 17" },
    { field: "k1TaxExemptIncome", box: "Box 18" },
    { field: "k1Distributions", box: "Box 19" },
    { field: "k1EndingCapitalAccount", box: "Part II Item L" },
    { field: "k1UnrecapturedSec1250", box: "Box 9c" },
    { field: "k1QBIDeduction", box: "Box 20 Code Z" },
    { field: "k1UBTI", box: "Box 20 Code V" },
  ];

  const populatedFields = k1Fields.filter(
    (f) => (project as Record<string, unknown>)[f.field] !== null && (project as Record<string, unknown>)[f.field] !== undefined,
  );
  const nonZeroFields = k1Fields.filter(
    (f) => {
      const val = (project as Record<string, unknown>)[f.field];
      return val !== null && val !== undefined && Number(val) !== 0;
    },
  );

  checks.push({
    name: "K-1 Data Completeness",
    regulation: "IRS Schedule K-1 (Form 1065)",
    category: "irs",
    passed: populatedFields.length > 0,
    note: `${populatedFields.length}/19 K-1 fields populated, ${nonZeroFields.length} with non-zero values`,
  });

  // Ending capital account
  checks.push({
    name: "Ending Capital Account Reported",
    regulation: "IRS Schedule K-1 Part II, Item L",
    category: "irs",
    passed: project.k1EndingCapitalAccount !== null,
    note: project.k1EndingCapitalAccount !== null
      ? `Ending capital account: ${formatCurrencyDetailed(Number(project.k1EndingCapitalAccount))}`
      : "Ending capital account not reported — required on K-1 Part II, Item L",
  });

  // UBTI warning for tax-exempt investors
  const ubti = project.k1UBTI ? Number(project.k1UBTI) : 0;
  if (ubti !== 0) {
    checks.push({
      name: "UBTI Disclosure",
      regulation: "26 U.S.C. § 511-514 — Unrelated Business Income Tax",
      category: "tax",
      passed: true, // Disclosure is provided in template
      note: `UBTI of ${formatCurrencyDetailed(ubti)} reported — tax-exempt partners may owe UBIT on amounts exceeding $1,000`,
    });
  }

  // Late filing penalty note
  checks.push({
    name: "Late Filing Penalty Disclosed",
    regulation: "26 U.S.C. § 6698",
    category: "irs",
    passed: true, // Always included in template
    note: "Late filing penalty of $240/partner/month (2025 rate) disclosed per 26 U.S.C. § 6698",
  });

  return checks;
}
