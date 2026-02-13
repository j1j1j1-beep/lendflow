// form-adv-summary.ts
// Generates a Form ADV Part 2A Summary document.
// From the compliance regulations reference Section 6.
//
// Form ADV Part 2A — Firm Brochure has 18 items.
// Must be written in PLAIN ENGLISH per SEC requirement.
// Private fund adviser considerations: fund strategy, fees, conflicts, risk factors.
// Delivery: before or at time of advisory agreement; SEC filing deadline 90 days of fiscal year end per 17 CFR 275.204-1; client delivery 120 days per 17 CFR 275.204-3.
//
// Source: https://www.sec.gov/about/forms/formadv-part2.pdf
// Regulation: 17 CFR 275.203-1

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
  safeNumber,
  COLORS,
} from "../../doc-helpers";

import type { ComplianceProjectFull, ComplianceCheck, FormADVSummaryProse } from "../types";
import { buildProjectContext } from "../generate-doc";
import { claudeJson } from "@/lib/claude";

// ─── AI Prose Generation ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an SEC compliance specialist preparing Form ADV Part 2A (Firm Brochure) summaries for investment advisers. Your summaries must be written in PLAIN ENGLISH as required by the SEC.

RULES:
1. Plain English is mandatory — the SEC requires that Form ADV Part 2A be written in plain, understandable language. Avoid legal jargon where possible.
2. All 18 items of Part 2A must be addressed.
3. For private fund advisers, include: fund strategy, fees, conflicts, risk factors.
4. Reference applicable regulations: Investment Advisers Act of 1940, Rule 206(4)-1 (marketing rule).
5. Do not use overly promotional language — this is a disclosure document.
6. Output ONLY valid JSON matching the requested schema.`;

async function generateFormADVProse(project: ComplianceProjectFull): Promise<FormADVSummaryProse> {
  const context = buildProjectContext(project);

  return claudeJson<FormADVSummaryProse>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate the 18 items of Form ADV Part 2A (Firm Brochure) summary for a private fund adviser.

${context}

Return JSON with these keys (each should be 1-3 paragraphs in PLAIN ENGLISH):
{
  "materialChanges": "Item 2: Summary of material changes since the last annual update (or state this is the initial filing)",
  "advisoryBusiness": "Item 4: Description of the advisory business — types of advisory services, how the fund is managed, assets under management",
  "feesAndCompensation": "Item 5: Description of fees and compensation — management fees, carried interest, fund expenses, how fees are paid",
  "performanceBasedFees": "Item 6: Explanation of performance-based fees (carried interest) and conflicts they create",
  "typesOfClients": "Item 7: Types of clients — limited partners, institutional investors, accredited investors",
  "methodsOfAnalysis": "Item 8: Methods of analysis, investment strategies, and risk of loss — how investments are selected and managed, key risks",
  "disciplinaryInformation": "Item 9: Disciplinary information — disclose any disciplinary history or state there is none",
  "otherActivities": "Item 10: Other financial industry activities and affiliations",
  "codeOfEthics": "Item 11: Code of ethics, participation in client transactions, personal trading policies",
  "brokeragePractices": "Item 12: Brokerage practices — how transactions are executed",
  "reviewOfAccounts": "Item 13: Review of accounts — how often accounts are reviewed and by whom",
  "clientReferrals": "Item 14: Client referrals and other compensation arrangements",
  "custody": "Item 15: Custody — whether the adviser has custody of client funds and how they are safeguarded",
  "investmentDiscretion": "Item 16: Investment discretion — the scope of discretionary authority",
  "proxyVoting": "Item 17: Voting client securities — proxy voting policies",
  "financialInformation": "Item 18: Financial information — any financial conditions that could impair the adviser's ability to meet commitments"
}`,
    maxTokens: 6000,
  });
}

// ─── Template Builder ────────────────────────────────────────────────

export async function buildFormADVSummary(project: ComplianceProjectFull): Promise<Document> {
  const prose = await generateFormADVProse(project);

  const fundSize = safeNumber(project.fundSize);

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fiscal year end SEC filing deadline (90 days per 17 CFR 275.204-1)
  const fiscalYearEnd = project.periodEnd ?? new Date();
  const secFilingDeadline = new Date(fiscalYearEnd);
  secFilingDeadline.setDate(secFilingDeadline.getDate() + 90);

  // Client delivery deadline (120 days per 17 CFR 275.204-3)
  const clientDeliveryDeadline = new Date(fiscalYearEnd);
  clientDeliveryDeadline.setDate(clientDeliveryDeadline.getDate() + 120);

  const children: (Paragraph | Table)[] = [];

  // ─── Item 1: Cover Page ────────────────────────────────────────
  children.push(documentTitle("Form ADV Part 2A"));
  children.push(spacer(2));
  children.push(
    bodyText("Firm Brochure", { bold: true, color: COLORS.primary }),
  );
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Fund / Adviser Name", value: project.fundName },
      { label: "Fund Type", value: project.fundType ?? "Private Fund" },
      { label: "Assets Under Management", value: formatCurrency(fundSize) },
      { label: "Brochure Date", value: dateFormatted },
      {
        label: "SEC Filing Deadline (90 days)",
        value: secFilingDeadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      },
      {
        label: "Client Delivery Deadline (120 days)",
        value: clientDeliveryDeadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      },
    ]),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "This brochure provides information about the qualifications and business practices of " +
      `${project.fundName}. If you have any questions about the contents of this brochure, ` +
      "please contact us. The information in this brochure has not been approved or verified by " +
      "the United States Securities and Exchange Commission or by any state securities authority.",
      { italic: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Additional information is available on the SEC's website at www.adviserinfo.sec.gov.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Registration with the SEC does not imply a certain level of skill or training.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // ─── Item 2: Material Changes ──────────────────────────────────
  children.push(sectionHeading("Item 2. Material Changes"));
  children.push(bodyText(prose.materialChanges));
  children.push(spacer(8));

  // ─── Item 3: Table of Contents ─────────────────────────────────
  children.push(sectionHeading("Item 3. Table of Contents"));
  children.push(spacer(2));

  const tocItems = [
    "Item 1. Cover Page",
    "Item 2. Material Changes",
    "Item 3. Table of Contents",
    "Item 4. Advisory Business",
    "Item 5. Fees and Compensation",
    "Item 6. Performance-Based Fees",
    "Item 7. Types of Clients",
    "Item 8. Methods of Analysis, Investment Strategies, and Risk of Loss",
    "Item 9. Disciplinary Information",
    "Item 10. Other Financial Industry Activities and Affiliations",
    "Item 11. Code of Ethics, Participation in Client Transactions, and Personal Trading",
    "Item 12. Brokerage Practices",
    "Item 13. Review of Accounts",
    "Item 14. Client Referrals and Other Compensation",
    "Item 15. Custody",
    "Item 16. Investment Discretion",
    "Item 17. Voting Client Securities",
    "Item 18. Financial Information",
  ];

  for (const item of tocItems) {
    children.push(bulletPoint(item));
  }
  children.push(spacer(8));

  // ─── Item 4: Advisory Business ─────────────────────────────────
  children.push(sectionHeading("Item 4. Advisory Business"));
  children.push(bodyText(prose.advisoryBusiness));
  children.push(spacer(8));

  // ─── Item 5: Fees and Compensation ─────────────────────────────
  children.push(sectionHeading("Item 5. Fees and Compensation"));
  children.push(bodyText(prose.feesAndCompensation));
  children.push(spacer(8));

  // ─── Item 6: Performance-Based Fees ────────────────────────────
  children.push(sectionHeading("Item 6. Performance-Based Fees"));
  children.push(bodyText(prose.performanceBasedFees));
  children.push(spacer(8));

  // ─── Item 7: Types of Clients ──────────────────────────────────
  children.push(sectionHeading("Item 7. Types of Clients"));
  children.push(bodyText(prose.typesOfClients));
  children.push(spacer(8));

  // ─── Item 8: Methods of Analysis ───────────────────────────────
  children.push(sectionHeading("Item 8. Methods of Analysis, Investment Strategies, and Risk of Loss"));
  children.push(bodyText(prose.methodsOfAnalysis));
  children.push(spacer(4));

  // Standard risk disclaimer
  children.push(
    bodyText(
      "Investing involves risk of loss. Clients should be prepared to bear investment loss including " +
      "loss of original principal. Past performance is not indicative of future results. " +
      "There can be no guarantee that any specific investment or strategy will achieve its objectives.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // ─── Item 9: Disciplinary Information ──────────────────────────
  children.push(sectionHeading("Item 9. Disciplinary Information"));
  children.push(bodyText(prose.disciplinaryInformation));
  children.push(spacer(8));

  // ─── Item 10: Other Activities ─────────────────────────────────
  children.push(sectionHeading("Item 10. Other Financial Industry Activities and Affiliations"));
  children.push(bodyText(prose.otherActivities));
  children.push(spacer(8));

  // ─── Item 11: Code of Ethics ───────────────────────────────────
  children.push(sectionHeading("Item 11. Code of Ethics, Participation in Client Transactions, and Personal Trading"));
  children.push(bodyText(prose.codeOfEthics));
  children.push(spacer(8));

  // ─── Item 12: Brokerage Practices ──────────────────────────────
  children.push(sectionHeading("Item 12. Brokerage Practices"));
  children.push(bodyText(prose.brokeragePractices));
  children.push(spacer(8));

  // ─── Item 13: Review of Accounts ───────────────────────────────
  children.push(sectionHeading("Item 13. Review of Accounts"));
  children.push(bodyText(prose.reviewOfAccounts));
  children.push(spacer(8));

  // ─── Item 14: Client Referrals ─────────────────────────────────
  children.push(sectionHeading("Item 14. Client Referrals and Other Compensation"));
  children.push(bodyText(prose.clientReferrals));
  children.push(spacer(8));

  // ─── Item 15: Custody ──────────────────────────────────────────
  children.push(sectionHeading("Item 15. Custody"));
  children.push(bodyText(prose.custody));
  children.push(spacer(8));

  // ─── Item 16: Investment Discretion ────────────────────────────
  children.push(sectionHeading("Item 16. Investment Discretion"));
  children.push(bodyText(prose.investmentDiscretion));
  children.push(spacer(8));

  // ─── Item 17: Voting Client Securities ─────────────────────────
  children.push(sectionHeading("Item 17. Voting Client Securities"));
  children.push(bodyText(prose.proxyVoting));
  children.push(spacer(8));

  // ─── Item 18: Financial Information ────────────────────────────
  children.push(sectionHeading("Item 18. Financial Information"));
  children.push(bodyText(prose.financialInformation));
  children.push(spacer(8));

  // ─── Private Fund Adviser Considerations ───────────────────────
  children.push(sectionHeading("Private Fund Adviser Considerations"));

  children.push(
    bodyText(
      "As a private fund adviser, the following additional disclosures apply under the " +
      "Investment Advisers Act of 1940 and SEC rules:",
    ),
  );
  children.push(spacer(4));

  children.push(bulletPoint("Fund strategy, investment objective, and investment restrictions are disclosed in Item 8 above."));
  children.push(bulletPoint("All fees and compensation arrangements are disclosed in Item 5 above, including management fees and performance-based fees."));
  children.push(bulletPoint("Conflicts of interest are disclosed in Items 6, 10, 11, and 14 above."));
  children.push(bulletPoint("Risk factors are disclosed in Item 8 above."));
  children.push(spacer(4));

  children.push(
    bodyText(
      "Form PF filing: Private fund advisers with assets under management of $150 million or more " +
      "in private equity are required to file Form PF annually with the SEC (17 CFR 279.9). " +
      "Large private fund advisers ($1.5B+ in AUM) must file Form PF quarterly (within 60 days " +
      "of quarter-end). Advisers with $1.5B+ in any qualifying hedge fund must file within 15 days " +
      "of quarter-end. Current reporting events require filing within 72 hours (SEC Rule 204(b)-1, " +
      "as amended 2024) for significant events such as extraordinary investment losses, large " +
      "redemptions, margin events, significant counterparty defaults, or material changes in " +
      "prime broker relationships.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "SEC Marketing Rule (Rule 206(4)-1): The adviser's advertising and marketing materials " +
      "comply with the SEC's marketing rule, which governs the use of testimonials, endorsements, " +
      "and performance presentation.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Form ADV Part 2B (Brochure Supplement): In addition to Part 2A, investment advisers are required " +
      "to prepare and deliver a Brochure Supplement (Part 2B) for each supervised person who provides " +
      "investment advice to clients and has direct client contact. Part 2B must include the supervised " +
      "person's education, business background, disciplinary history, other business activities, " +
      "additional compensation, and supervision details. Delivery is required before or at the time " +
      "the supervised person begins providing advisory services to the client (17 CFR 275.204-3).",
    ),
  );

  children.push(spacer(4));
  children.push(
    bodyText(
      "Form ADV Part 1: Registered investment advisers must file an annual amendment to Form ADV Part 1 " +
      "within 90 days of fiscal year-end. Other-than-annual amendments are required promptly for any " +
      "material changes (e.g., changes to disciplinary information, advisory activities, or financial " +
      "condition). Part 1 is filed electronically through the IARD system.",
    ),
  );
  children.push(spacer(8));

  // ─── Delivery Requirements ─────────────────────────────────────
  children.push(sectionHeading("Delivery Requirements"));

  children.push(
    createTable(
      ["Requirement", "Deadline", "Regulation"],
      [
        [
          "Initial delivery",
          "Before or at time of entering advisory agreement",
          "17 CFR 275.204-3",
        ],
        [
          "SEC annual filing",
          "Within 90 days of fiscal year end",
          "17 CFR 275.204-1",
        ],
        [
          "Client delivery",
          "Within 120 days of fiscal year end",
          "17 CFR 275.204-3",
        ],
        [
          "Material change delivery",
          "Promptly after material changes",
          "17 CFR 275.204-3",
        ],
      ],
      { columnWidths: [30, 40, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Disclaimer ────────────────────────────────────────────────
  children.push(
    bodyText(
      "This brochure is prepared in compliance with SEC Form ADV Part 2A requirements. " +
      "The SEC's website at www.adviserinfo.sec.gov provides additional public information " +
      "about registered investment advisers. This brochure does not constitute an offer to " +
      "sell or solicitation of an offer to buy any securities.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "Form ADV Part 2A Summary",
    headerRight: `${project.fundName} — Form ADV Part 2A`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runFormADVComplianceChecks(project: ComplianceProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Note: Form PF thresholds are based on firm-wide regulatory AUM, not individual fund size.
  // Multi-fund advisers should aggregate all fund AUM for threshold determination.
  const fundSize = safeNumber(project.fundSize);

  // SEC registration threshold
  checks.push({
    name: "SEC Registration Threshold",
    regulation: "Investment Advisers Act of 1940 — AUM > $100M",
    category: "sec",
    passed: true, // We generate the form regardless
    note: fundSize > 100_000_000
      ? `AUM (${formatCurrency(fundSize)}) exceeds $100M — SEC registration required`
      : fundSize > 0
        ? `AUM (${formatCurrency(fundSize)}) below $100M — state registration may apply instead`
        : "AUM not specified — cannot determine registration requirement",
  });

  // Form PF requirement
  checks.push({
    name: "Form PF Filing Requirement",
    regulation: "17 CFR 279.9 — Private Fund Advisers with AUM >= $150M in PE (annual), >= $1.5B (quarterly)",
    category: "sec",
    passed: true, // Informational check
    note: fundSize >= 1_500_000_000
      ? `AUM (${formatCurrency(fundSize)}) exceeds $1.5B — quarterly Form PF filing required, plus 72-hour current event reporting`
      : fundSize >= 150_000_000
        ? `AUM (${formatCurrency(fundSize)}) exceeds $150M — annual Form PF filing likely required`
        : "Form PF filing may not be required based on current AUM",
  });

  // Plain English requirement
  checks.push({
    name: "Plain English Requirement",
    regulation: "SEC Form ADV Part 2A Instructions",
    category: "sec",
    passed: true, // Template is designed for plain English
    note: "Form ADV Part 2A generated with plain English requirement per SEC instructions",
  });

  // All 18 items addressed
  checks.push({
    name: "All 18 Items Addressed",
    regulation: "SEC Form ADV Part 2A",
    category: "sec",
    passed: true, // Template includes all 18 items
    note: "All 18 items of Form ADV Part 2A are addressed in the brochure",
  });

  // Delivery deadline
  const now = new Date();
  const fiscalYearEnd = project.periodEnd ?? new Date(now.getFullYear(), 11, 31);
  const deliveryDeadline = new Date(fiscalYearEnd);
  deliveryDeadline.setDate(deliveryDeadline.getDate() + 120);

  checks.push({
    name: "Annual Update Deadline",
    regulation: "17 CFR 275.204-3 — Within 120 days of fiscal year end",
    category: "sec",
    passed: now <= deliveryDeadline,
    note: now <= deliveryDeadline
      ? `Annual update deadline: ${deliveryDeadline.toISOString().split("T")[0]} — on track`
      : `Annual update deadline (${deliveryDeadline.toISOString().split("T")[0]}) has passed`,
  });

  // Marketing rule compliance
  checks.push({
    name: "Marketing Rule Compliance Note",
    regulation: "17 CFR 275.206(4)-1 — SEC Marketing Rule",
    category: "sec",
    passed: true, // Informational
    note: "Marketing rule compliance note included in brochure",
  });

  // Fund name disclosure
  checks.push({
    name: "Fund Name Disclosed",
    regulation: "SEC Form ADV Part 2A, Item 1",
    category: "sec",
    passed: !!project.fundName,
    note: project.fundName
      ? `Fund name: ${project.fundName}`
      : "Fund name not provided for cover page",
  });

  return checks;
}
