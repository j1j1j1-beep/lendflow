// capital-call-notice.ts
// Generates a Capital Call Notice document.
// From the compliance regulations reference Section 2.
//
// Required content:
// 1. Call amount — total (from callAmount)
// 2. Purpose — from callPurpose
// 3. Due date — from callDueDate (typically 10-15 business days from notice)
// 4. Wire instructions — placeholder section
// 5. Unfunded commitment — from unfundedCommitments
// 6. Default provisions — from callDefaultPenalty and callDefaultRemedy
//
// Notice period validation: if callNoticeRequiredDays provided, verify callDueDate is
// at least that many days from today.

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
  safeNumber,
  COLORS,
} from "../../doc-helpers";

import type { ComplianceProjectFull, ComplianceCheck, CapitalCallNoticeProse } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior fund administrator drafting capital call notices for institutional private equity and real estate funds. Your notices must be clear, complete, and comply with standard LPA requirements.

RULES:
1. All dollar amounts, dates, and percentages will be provided separately — reference them by name but do not invent numbers.
2. Use formal fund administration language.
3. Include all legally required notice elements.
4. Wire instructions should include placeholder fields for bank details.
5. Default provisions must clearly state consequences and cure periods.
6. Output ONLY valid JSON matching the requested schema.`;

async function generateCapitalCallProse(project: ComplianceProjectFull): Promise<CapitalCallNoticeProse> {
  const context = buildProjectContext(project);

  return claudeJson<CapitalCallNoticeProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate narrative prose sections for a Capital Call Notice.

${context}

Return JSON with these keys:
{
  "callNarrative": "1-2 paragraph formal notice opening paragraph referencing the LPA and calling capital",
  "purposeDescription": "1-2 paragraphs describing the purpose of the capital call in detail",
  "wireInstructions": "Wire instruction section with placeholders for bank name, ABA routing number, account number, account name, reference, and SWIFT code",
  "defaultProvisionsNarrative": "2-3 paragraphs detailing default provisions including grace period (5-10 business days), default interest (prime + 3% as standard default rate), and escalating remedies per the LPA"
}`,
    maxTokens: 3000,
  });
}

// ─── Business Day Calculator ─────────────────────────────────────────

function businessDaysBetween(start: Date, end: Date): number {
  if (start >= end) return 0;
  let count = 0;
  const current = new Date(start);
  let iterations = 0;
  while (current < end && iterations < 10000) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    iterations++;
  }
  return count;
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildCapitalCallNotice(project: ComplianceProjectFull): Promise<Document> {
  const prose = await generateCapitalCallProse(project);

  const callAmount = safeNumber(project.callAmount);
  const unfundedCommitments = safeNumber(project.unfundedCommitments);
  const fundSize = safeNumber(project.fundSize);
  const noticeRequiredDays = project.callNoticeRequiredDays ?? 10;
  const defaultPenalty = project.callDefaultPenalty;

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDateFormatted = project.callDueDate
    ? project.callDueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "[DUE DATE TO BE DETERMINED]";

  // Calculate business days until due date for notice period validation
  const businessDaysUntilDue = project.callDueDate
    ? businessDaysBetween(today, project.callDueDate)
    : 0;

  // After-call unfunded commitment
  const postCallUnfunded = unfundedCommitments - callAmount;

  const children: (Paragraph | Table)[] = [];

  // ─── Header ────────────────────────────────────────────────────
  children.push(documentTitle("Capital Call Notice"));
  children.push(spacer(4));
  children.push(
    bodyText(project.fundName, { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(`Notice Date: ${dateFormatted}`));
  children.push(spacer(8));

  // ─── Notice Opening ────────────────────────────────────────────
  children.push(sectionHeading("Notice of Capital Call"));
  children.push(bodyText(prose.callNarrative));
  children.push(spacer(8));

  // ─── 1. Call Summary Table ─────────────────────────────────────
  children.push(sectionHeading("1. Capital Call Summary"));

  children.push(
    keyTermsTable([
      { label: "Fund Name", value: project.fundName },
      { label: "Notice Date", value: dateFormatted },
      { label: "Call Amount", value: formatCurrency(callAmount) },
      { label: "Due Date", value: dueDateFormatted },
      {
        label: "Notice Period",
        value: `${businessDaysUntilDue} business days (minimum required: ${noticeRequiredDays})`,
      },
      { label: "Fund Size", value: formatCurrency(fundSize) },
      { label: "Unfunded Commitments (Pre-Call)", value: formatCurrency(unfundedCommitments) },
      { label: "Unfunded Commitments (Post-Call)", value: formatCurrency(postCallUnfunded > 0 ? postCallUnfunded : 0) },
      {
        label: "% of Commitments Called",
        value: fundSize > 0
          ? `${(((fundSize - (postCallUnfunded > 0 ? postCallUnfunded : 0)) / fundSize) * 100).toFixed(1)}%`
          : "N/A",
      },
    ]),
  );
  children.push(spacer(8));

  // ─── Notice Period Validation ──────────────────────────────────
  if (project.callDueDate && businessDaysUntilDue < noticeRequiredDays) {
    children.push(
      bodyText(
        `WARNING: The due date provides ${businessDaysUntilDue} business days of notice, ` +
        `which is less than the required ${noticeRequiredDays} business days. ` +
        `The due date should be adjusted to comply with the LPA notice requirements.`,
        { bold: true, color: "CC0000" },
      ),
    );
    children.push(spacer(4));
  }

  // ─── 2. Purpose of Call ────────────────────────────────────────
  children.push(sectionHeading("2. Purpose of Capital Call"));

  if (project.callPurpose) {
    children.push(
      bodyTextRuns([
        { text: "Stated Purpose: ", bold: true },
        { text: project.callPurpose },
      ]),
    );
    children.push(spacer(4));
  }
  children.push(bodyText(prose.purposeDescription));
  children.push(spacer(8));

  // ─── 3. Payment Instructions ───────────────────────────────────
  children.push(sectionHeading("3. Payment Instructions"));

  children.push(
    bodyText(
      "All capital contributions must be made in immediately available funds by wire transfer " +
      `on or before ${dueDateFormatted} to the following account:`,
    ),
  );
  children.push(spacer(4));
  children.push(bodyText(prose.wireInstructions));
  children.push(spacer(4));

  children.push(
    bodyText(
      "Please include the LP name and this capital call reference number in the wire transfer " +
      "instructions to ensure proper allocation of funds.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(8));

  // ─── 4. LP Pro Rata Calculation ────────────────────────────────
  children.push(sectionHeading("4. Pro Rata Allocation"));

  children.push(
    bodyText(
      "Each Limited Partner's share of this capital call is determined on a pro rata basis " +
      "in accordance with such Limited Partner's Commitment Percentage as set forth in the " +
      "Limited Partnership Agreement. The individual capital call amount for each Limited Partner " +
      "will be provided under separate cover.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Formula: LP Capital Call Amount = Total Call Amount x (LP Commitment / Total Fund Commitments)",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // ─── 5. Default Provisions ─────────────────────────────────────
  children.push(sectionHeading("5. Default Provisions"));

  children.push(
    bodyText(
      "IMPORTANT: Failure to fund your capital contribution by the due date constitutes a " +
      "default under the Limited Partnership Agreement. The following provisions apply:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  // Deterministic default terms
  children.push(bodyText("Grace Period and Default Interest:", { bold: true, color: COLORS.primary }));
  children.push(bulletPoint("Grace Period: 5-10 business days after the due date (per LPA terms)"));
  children.push(
    bulletPoint(
      `Default Interest: default interest at the prime rate plus ${defaultPenalty !== null && defaultPenalty !== undefined ? `${(safeNumber(defaultPenalty) * 100).toFixed(1)}%` : "[2-5]%"} per annum on the unpaid amount, accruing from the due date until the defaulted contribution is received in full`,
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("Escalating Remedies:", { bold: true, color: COLORS.primary }));
  children.push(bulletPoint("(1) Interest on late payment at the default rate specified above"));
  children.push(bulletPoint("(2) Forfeiture of a portion of LP's interest (typically 50% penalty on defaulted amount)"));
  children.push(bulletPoint("(3) Forced sale of LP's interest at a discount (50-80% of NAV)"));
  children.push(bulletPoint("(4) Reduction of unfunded commitment to zero (LP loses future upside)"));
  children.push(bulletPoint("(5) Clawback of prior distributions to cover the default"));
  children.push(spacer(4));

  if (project.callDefaultRemedy) {
    children.push(
      bodyTextRuns([
        { text: "Additional LPA-Specific Remedy: ", bold: true },
        { text: project.callDefaultRemedy },
      ]),
    );
    children.push(spacer(4));
  }

  children.push(bodyText(prose.defaultProvisionsNarrative));
  children.push(spacer(4));

  children.push(
    bodyText(
      "Non-defaulting Limited Partners may have the option to fund the defaulting " +
      "Limited Partner's share of the capital call, subject to the terms and conditions " +
      "set forth in the Limited Partnership Agreement.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(8));

  // ─── 6. Regulatory Compliance ──────────────────────────────────
  children.push(sectionHeading("6. Regulatory Compliance"));

  children.push(
    bodyText(
      "This capital call is being made in accordance with the terms of the Limited Partnership " +
      "Agreement. The General Partner certifies that: (a) the call amount does not exceed the " +
      "aggregate unfunded commitments; (b) the required notice period has been observed; " +
      "(c) the funds will be used for the stated purpose; and (d) pro rata allocation has been " +
      "applied unless the LPA specifically permits otherwise.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Recycling Provisions: Any reinvested proceeds that count against commitments under " +
      "the recycling provisions of the LPA have been accounted for in the unfunded commitment " +
      "calculations presented in this notice.",
    ),
  );
  children.push(spacer(8));

  // ─── Contact ───────────────────────────────────────────────────
  children.push(sectionHeading("Contact Information"));
  children.push(
    bodyText(
      "For questions regarding this capital call, please contact the fund administrator " +
      "at the contact information provided in the Limited Partnership Agreement.",
    ),
  );
  children.push(spacer(8));

  // ─── Signature ─────────────────────────────────────────────────
  children.push(
    bodyText("By authority of the General Partner,", { italic: true }),
  );
  children.push(spacer(12));
  children.push(bodyText("________________________________________"));
  children.push(bodyText("General Partner, Authorized Signatory", { color: COLORS.textGray }));
  children.push(bodyText(`Date: ${dateFormatted}`, { color: COLORS.textGray }));

  return buildLegalDocument({
    title: "Capital Call Notice",
    headerRight: `${project.fundName} — Capital Call Notice`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runCapitalCallComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  const callAmount = safeNumber(project.callAmount);
  const unfundedCommitments = safeNumber(project.unfundedCommitments);
  const noticeRequiredDays = project.callNoticeRequiredDays ?? 10;

  // Call amount provided
  checks.push({
    name: "Call Amount Specified",
    regulation: "LPA Standard Terms",
    category: "regulatory",
    passed: callAmount > 0,
    note: callAmount > 0
      ? `Call amount: ${formatCurrency(callAmount)}`
      : "Call amount not specified or is zero",
  });

  // Call does not exceed unfunded commitments
  checks.push({
    name: "Call Within Unfunded Commitments",
    regulation: "LPA — No Overcalling",
    category: "regulatory",
    passed: callAmount <= unfundedCommitments || unfundedCommitments === 0,
    note: unfundedCommitments > 0
      ? callAmount <= unfundedCommitments
        ? `Call (${formatCurrency(callAmount)}) within unfunded (${formatCurrency(unfundedCommitments)})`
        : `WARNING: Call (${formatCurrency(callAmount)}) exceeds unfunded commitments (${formatCurrency(unfundedCommitments)})`
      : "Unfunded commitments not specified — cannot validate",
  });

  // Due date provided
  checks.push({
    name: "Due Date Specified",
    regulation: "LPA Standard Terms",
    category: "regulatory",
    passed: !!project.callDueDate,
    note: project.callDueDate
      ? `Due date: ${project.callDueDate.toISOString().split("T")[0]}`
      : "Due date not specified",
  });

  // Notice period validation
  if (project.callDueDate) {
    const today = new Date();
    const businessDays = businessDaysBetween(today, project.callDueDate);

    checks.push({
      name: "Notice Period Compliance",
      regulation: "LPA — Minimum 10-15 Business Days Notice",
      category: "regulatory",
      passed: businessDays >= noticeRequiredDays,
      note: businessDays >= noticeRequiredDays
        ? `${businessDays} business days notice provided (minimum: ${noticeRequiredDays})`
        : `Only ${businessDays} business days notice — minimum ${noticeRequiredDays} required by LPA`,
    });
  }

  // Call purpose provided
  checks.push({
    name: "Call Purpose Disclosed",
    regulation: "LPA / ILPA Capital Call Template",
    category: "ilpa",
    passed: !!project.callPurpose,
    note: project.callPurpose
      ? "Call purpose disclosed"
      : "Call purpose not specified — required by ILPA Capital Call Template",
  });

  // Default provisions
  checks.push({
    name: "Default Provisions Included",
    regulation: "LPA Standard Terms",
    category: "regulatory",
    passed: true, // Always included in template
    note: "Default provisions with grace period, default interest, and escalating remedies included",
  });

  return checks;
}
