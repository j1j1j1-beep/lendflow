// side-letter.ts
// Side Letter template for capital fund offerings.
// Common provisions: MFN, fee discount, co-investment rights, enhanced reporting,
// excuse rights, key person modifications, transfer rights, regulatory carve-outs.

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
  signatureBlock,
  formatCurrency,
  COLORS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, SideLetterProse, ComplianceCheck } from "../types";

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  return `You are a securities attorney generating a Side Letter for a private fund offering. Side letters modify or supplement the terms of the fund's governing documents for specific investors.

This side letter is between ${project.gpEntityName} (the General Partner of ${project.fundName}) and an individual Limited Partner.

Common side letter provisions to include:
1. MFN (Most Favored Nation) — right to elect terms granted to other LPs
2. Fee discount or waiver — reduced management fee or carried interest
3. Co-investment rights — priority or guaranteed co-invest opportunities
4. Enhanced reporting / transparency — additional financial reporting
5. Excuse rights — ability to opt out of specific investments (regulatory, ESG, etc.)
6. Key person modifications — custom key person triggers
7. Transfer rights — enhanced transfer or redemption provisions
8. Regulatory compliance carve-outs — ERISA (29 CFR 2510.3-101), Volcker Rule (12 CFR 248), state pension fund requirements

RULES:
1. Use exact terms from project data. Do not invent numbers.
2. Write each provision as a complete, enforceable legal clause.
3. Reference the fund's Operating Agreement/LPA as the governing document being modified.
4. Include severability — invalid provisions don't void the entire side letter.
5. Side letter provisions prevail over the Operating Agreement to the extent of any conflict.

OUTPUT: Valid JSON only.

JSON Schema:
{
  "recitals": "string - Opening recitals describing the side letter relationship",
  "mfnProvision": "string - Most Favored Nation provision with notification and election mechanics",
  "feeDiscount": "string - Management fee discount and/or carried interest reduction provisions",
  "coInvestmentRights": "string - Co-investment opportunity rights and mechanics",
  "enhancedReporting": "string - Additional reporting requirements (quarterly, annual, ad-hoc)",
  "excuseRights": "string - Right to excuse from specific investments (regulatory, ethical, legal conflict)",
  "keyPersonModifications": "string - Any modifications to the key person provision",
  "transferRights": "string - Enhanced transfer or redemption rights",
  "regulatoryCarveOuts": "string - ERISA, Volcker Rule, state pension fund carve-outs",
  "miscellaneous": "string - Severability, counterparts, entire side letter agreement, amendment",
  "governingLaw": "string - Governing law, venue, dispute resolution"
}`;
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildSideLetter(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  const prose = await claudeJson<SideLetterProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 8000,
  });

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Side Letter"));
  children.push(spacer(4));

  children.push(bodyTextRuns([
    { text: "Fund: ", bold: true },
    { text: project.fundName },
  ]));
  children.push(bodyTextRuns([
    { text: "General Partner: ", bold: true },
    { text: project.gpEntityName },
  ]));
  children.push(bodyTextRuns([
    { text: "Limited Partner: ", bold: true },
    { text: "[INVESTOR NAME]" },
  ]));
  children.push(bodyTextRuns([
    { text: "Date: ", bold: true },
    { text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
  ]));
  children.push(spacer(8));

  // Recitals
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(4));
  children.push(
    bodyText(
      `This Side Letter (this "Letter") is entered into by and between ${project.gpEntityName} (the "General Partner") on behalf of ${project.fundName} (the "Fund"), and the Limited Partner identified above (the "Investor"). This Letter supplements and modifies the terms of the ${project.fundType === "HEDGE_FUND" ? "Operating Agreement" : "Limited Partnership Agreement"} of the Fund dated as of [DATE] (the "Agreement"). In the event of any conflict between this Letter and the Agreement, the terms of this Letter shall prevail as to the Investor.`,
    ),
  );
  children.push(spacer(8));

  // 1. MFN Provision
  children.push(sectionHeading("1. Most Favored Nation (MFN)"));
  children.push(bodyText(prose.mfnProvision));
  children.push(spacer(4));
  children.push(
    bodyText(
      "If the General Partner enters into any side letter or similar agreement with any other Limited Partner that provides such Limited Partner with rights, benefits, or privileges that are more favorable than those provided to the Investor hereunder, the General Partner shall promptly notify the Investor of such terms (subject to any confidentiality obligations). The Investor shall have the right, exercisable within 30 days of receipt of such notice, to elect to receive the benefit of any or all of such more favorable terms.",
    ),
  );
  children.push(spacer(8));

  // 2. Fee Discount
  children.push(sectionHeading("2. Fee Discount"));
  children.push(bodyText(prose.feeDiscount));
  children.push(spacer(4));
  const managementFee = project.managementFee ?? 0;
  children.push(bodyTextRuns([
    { text: "Standard Management Fee: ", bold: true },
    { text: `${(managementFee * 100).toFixed(2)}% per annum` },
  ]));
  children.push(bodyText("Discounted Rate (if applicable): __________% per annum"));
  children.push(bodyText("Carried Interest Reduction (if applicable): From ________% to ________%"));
  children.push(spacer(8));

  // 3. Co-Investment Rights
  children.push(sectionHeading("3. Co-Investment Rights"));
  children.push(bodyText(prose.coInvestmentRights));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The General Partner shall provide the Investor with the opportunity to co-invest alongside the Fund in portfolio investments on a no-fee, no-carry basis (or such other terms as may be agreed). Co-investment opportunities shall be allocated in the General Partner's reasonable discretion, taking into account the Investor's expressed interest, the Investor's commitment amount, and operational considerations.",
    ),
  );
  children.push(spacer(8));

  // 4. Enhanced Reporting
  children.push(sectionHeading("4. Enhanced Reporting and Transparency"));
  children.push(bodyText(prose.enhancedReporting));
  children.push(spacer(4));
  children.push(bodyText("In addition to the standard reporting provided to all Limited Partners, the General Partner shall provide the Investor with:"));
  children.push(bulletPoint("Quarterly portfolio company updates (within 45 days of quarter-end)"));
  children.push(bulletPoint("Annual audited financial statements (within 90 days of fiscal year-end)"));
  children.push(bulletPoint("Capital call and distribution notices not less than 15 business days in advance"));
  children.push(bulletPoint("Ad-hoc reporting reasonably requested by the Investor for regulatory or compliance purposes"));
  children.push(bulletPoint("ESG/impact reporting (if applicable to the Fund's strategy)"));
  children.push(spacer(8));

  // 5. Excuse Rights
  children.push(sectionHeading("5. Excuse Rights"));
  children.push(bodyText(prose.excuseRights));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The Investor may request to be excused from participating in a specific portfolio investment if such investment would: (a) violate any law, rule, or regulation applicable to the Investor; (b) cause the Investor to be in violation of its governing documents or investment policies; (c) give rise to a material conflict of interest; or (d) cause material adverse tax consequences to the Investor. The General Partner shall evaluate such requests in good faith.",
    ),
  );
  children.push(spacer(8));

  // 6. Key Person Modifications
  children.push(sectionHeading("6. Key Person Modifications"));
  children.push(bodyText(prose.keyPersonModifications));
  children.push(spacer(8));

  // 7. Transfer Rights
  children.push(sectionHeading("7. Transfer Rights"));
  children.push(bodyText(prose.transferRights));
  children.push(spacer(8));

  // 8. Regulatory Carve-Outs
  children.push(sectionHeading("8. Regulatory Compliance Carve-Outs"));
  children.push(bodyText(prose.regulatoryCarveOuts));
  children.push(spacer(4));
  children.push(bodyText("The following regulatory accommodations apply:", { bold: true }));
  children.push(bulletPoint("ERISA: If the Investor is a benefit plan investor subject to Title I of ERISA or Section 4975 of the Internal Revenue Code, the General Partner shall use commercially reasonable efforts to ensure that the Fund's assets do not constitute 'plan assets' under 29 CFR 2510.3-101."));
  children.push(bulletPoint("Volcker Rule: If the Investor is a banking entity subject to Section 13 of the Bank Holding Company Act (the Volcker Rule, 12 CFR 248), the General Partner shall provide such information and cooperation as reasonably necessary for the Investor to comply with the Volcker Rule."));
  children.push(bulletPoint("State Pension: If the Investor is a state or local government pension plan, the General Partner shall comply with applicable disclosure and reporting requirements under the Investor's governing statutes."));
  children.push(spacer(8));

  // 9. Miscellaneous
  children.push(sectionHeading("9. Miscellaneous"));
  children.push(bodyText(prose.miscellaneous));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Severability: If any provision of this Letter is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. Entire Agreement: This Letter, together with the Agreement, constitutes the entire understanding between the parties with respect to the subject matter hereof.",
    ),
  );
  children.push(spacer(8));

  // 10. Governing Law
  children.push(sectionHeading("10. Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(16));

  // Signatures
  children.push(sectionHeading("Execution"));
  children.push(
    bodyText("IN WITNESS WHEREOF, the parties have executed this Side Letter as of the date first written above."),
  );
  children.push(spacer(4));

  children.push(bodyText("GENERAL PARTNER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.gpEntityName, "General Partner"));
  children.push(spacer(16));

  children.push(bodyText("LIMITED PARTNER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock("[INVESTOR NAME]", "Authorized Signatory"));

  return buildLegalDocument({
    title: "Side Letter",
    headerRight: `Side Letter — ${project.fundName}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runSideLetterComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  checks.push({
    name: "MFN Provision Included",
    regulation: "Market Standard (LP Protection)",
    category: "investor_protection",
    passed: true,
    note: "Most Favored Nation provision included with 30-day election period.",
  });

  checks.push({
    name: "ERISA Carve-Out",
    regulation: "29 CFR 2510.3-101",
    category: "erisa",
    passed: true,
    note: "ERISA regulatory carve-out included for benefit plan investors.",
  });

  checks.push({
    name: "Volcker Rule Carve-Out",
    regulation: "12 CFR 248 (Volcker Rule)",
    category: "securities",
    passed: true,
    note: "Volcker Rule compliance carve-out included for banking entity investors.",
  });

  checks.push({
    name: "Conflict with Operating Agreement Addressed",
    regulation: "Contract Law",
    category: "investor_protection",
    passed: true,
    note: "Side letter includes standard conflict resolution clause — side letter terms prevail over the Operating Agreement.",
  });

  return checks;
}
