// operating-agreement.ts
// LLC Operating Agreement / Limited Partnership Agreement.
// Covers formation, capital, allocations, waterfall, management fees,
// clawback, key person, investment restrictions, advisory committee,
// transfer restrictions, removal, term, and indemnification.

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
  keyTermsTable,
  formatCurrency,
  COLORS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, OperatingAgreementProse, ComplianceCheck } from "../types";

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  const stateOfFormation = project.gpStateOfFormation ?? "Delaware";
  const entityType = project.fundType === "HEDGE_FUND" ? "LLC" : "Limited Partnership";

  return `You are a securities attorney generating an ${entityType === "LLC" ? "LLC Operating Agreement" : "Limited Partnership Agreement"} for a private investment fund formed in ${stateOfFormation}.

This is the governing document that defines rights, obligations, and economics between the GP and LPs. Reference Delaware RULPA (6 Del.C. Chapter 17) for LP agreements or Delaware LLC Act (6 Del.C. Chapter 18) for LLC agreements.

MUST include these sections:
1. Formation and purpose
2. Capital contributions and commitments
3. Capital accounts and allocations (tax and economic)
4. Distribution waterfall (preferred return -> catch-up -> carried interest split)
5. Management fee provisions (rate, basis, timing)
6. Clawback provision (GP returns excess carry at fund wind-down)
7. Key person provision (suspension of investment period if key persons depart)
8. Investment restrictions and limitations
9. Advisory committee composition and authority
10. Transfer restrictions (ROFR, consent requirements)
11. No-fault removal/dissolution (75%+ LP vote by commitment)
12. Term and extensions
13. Indemnification and exculpation
14. Confidentiality
15. Side letter disclosure (MFN provisions)

ABSOLUTE RULES:
1. Use EXACT numbers from project data. Never invent financial terms.
2. Cite specific statutes: Delaware RULPA (6 Del.C. Section 17-xxx), IRC Section 704(b) for allocations, Section 1061 for carried interest.
3. Write complete, enforceable legal provisions.

OUTPUT: Valid JSON only.

JSON Schema:
{
  "recitals": "string - Opening recitals and WHEREAS clauses",
  "formationAndPurpose": "string - Formation, registered agent, purpose clause",
  "capitalContributions": "string - Contribution obligations, capital calls, default remedies",
  "capitalAccounts": "string - Capital account maintenance per IRC Section 704(b), tax allocations",
  "distributionWaterfall": "string - Complete waterfall with preferred return, catch-up, and carry split",
  "managementFeeProvisions": "string - Fee rate, calculation basis, timing, offset provisions",
  "clawbackProvision": "string - GP clawback of excess carried interest at fund termination",
  "keyPersonProvision": "string - Suspension/termination triggers if key persons depart",
  "investmentRestrictions": "string - Concentration limits, leverage limits, prohibited investments",
  "advisoryCommittee": "string - Composition, authority, conflict review, valuation oversight",
  "transferRestrictions": "string - ROFR, consent requirements, ERISA/tax transfer restrictions",
  "noFaultRemoval": "string - GP removal provisions (75%+ LP vote without cause)",
  "termAndExtensions": "string - Fund term, extension rights, early dissolution",
  "indemnification": "string - GP/LP indemnification, exculpation, standard of care",
  "confidentiality": "string - Confidentiality obligations, permitted disclosures",
  "sideLetterDisclosure": "string - MFN provisions, side letter transparency",
  "governingLaw": "string - Governing law (state), venue, dispute resolution"
}`;
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildOperatingAgreement(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  const prose = await claudeJson<OperatingAgreementProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 12000,
  });

  const targetRaise = Number(project.targetRaise ?? 0);
  const minInvestment = Number(project.minInvestment ?? 0);
  const gpCommitment = Number(project.gpCommitment ?? 0);
  const managementFee = project.managementFee ?? 0;
  const carriedInterest = project.carriedInterest ?? 0;
  const preferredReturn = project.preferredReturn ?? 0;
  const hurdles = project.hurdles as Array<{ rate: number; split: string }> | null;
  const keyPersonNames = project.keyPersonNames as string[] | null;
  const stateOfFormation = project.gpStateOfFormation ?? "Delaware";
  const entityType = project.fundType === "HEDGE_FUND" ? "LLC" : "Limited Partnership";

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle(`${entityType === "LLC" ? "Limited Liability Company Operating" : "Limited Partnership"} Agreement`));
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: `${entityType} Agreement of `, bold: false },
      { text: project.fundName, bold: true },
    ]),
  );
  children.push(
    bodyText(`A ${stateOfFormation} ${entityType}`, { italic: true }),
  );
  children.push(
    bodyText(`Dated as of: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`),
  );
  children.push(spacer(8));

  // Recitals
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(8));

  // Article I: Formation and Purpose
  children.push(sectionHeading("Article I — Formation and Purpose"));
  children.push(bodyText(prose.formationAndPurpose));
  children.push(spacer(4));

  // Deterministic terms table
  const termRows: Array<{ label: string; value: string }> = [
    { label: "Fund Name", value: project.fundName },
    { label: "Entity Type", value: entityType },
    { label: "State of Formation", value: stateOfFormation },
    { label: "General Partner", value: project.gpEntityName },
    { label: "Fund Term", value: `${project.fundTermYears ?? 10} years from the date of the initial closing` },
    { label: "Investment Period", value: `${project.investmentPeriod ?? 5} years from the date of the initial closing` },
    { label: "Target Fund Size", value: formatCurrency(targetRaise) },
  ];
  children.push(keyTermsTable(termRows));
  children.push(spacer(8));

  // Article II: Capital Contributions
  children.push(sectionHeading("Article II — Capital Contributions and Commitments"));
  children.push(bodyText(prose.capitalContributions));
  children.push(spacer(4));

  children.push(bodyTextRuns([
    { text: "Minimum Commitment: ", bold: true },
    { text: formatCurrency(minInvestment) },
  ]));
  children.push(bodyTextRuns([
    { text: "GP Commitment: ", bold: true },
    { text: `${formatCurrency(gpCommitment)} (${targetRaise > 0 ? ((gpCommitment / targetRaise) * 100).toFixed(1) : "0"}% of target fund size)` },
  ]));
  children.push(spacer(8));

  // Article III: Capital Accounts
  children.push(sectionHeading("Article III — Capital Accounts and Allocations"));
  children.push(bodyText(prose.capitalAccounts));
  children.push(spacer(8));

  // Article IV: Distribution Waterfall
  children.push(sectionHeading("Article IV — Distributions"));
  children.push(bodyText(prose.distributionWaterfall));
  children.push(spacer(4));

  // Deterministic waterfall
  children.push(bodyText("Distribution Waterfall:", { bold: true, color: COLORS.primary }));
  children.push(bulletPoint(`Step 1 — Return of Capital: 100% to all partners, pro rata, until each partner has received distributions equal to its aggregate capital contributions.`));
  children.push(bulletPoint(`Step 2 — Preferred Return: 100% to all partners, pro rata, until each partner has received a cumulative compounded annual return of ${(preferredReturn * 100).toFixed(1)}% on unreturned capital contributions.`));
  if (carriedInterest > 0) {
    children.push(bulletPoint(`Step 3 — GP Catch-Up: ${(carriedInterest * 100).toFixed(1)}% to the General Partner and ${(100 - carriedInterest * 100).toFixed(1)}% to Limited Partners until the General Partner has received ${(carriedInterest * 100).toFixed(1)}% of the aggregate amount distributed under Steps 2 and 3.`));
    children.push(bulletPoint(`Step 4 — Carried Interest Split: ${(100 - carriedInterest * 100).toFixed(1)}% to Limited Partners (pro rata) and ${(carriedInterest * 100).toFixed(1)}% to the General Partner as carried interest.`));
  }

  if (hurdles && hurdles.length > 0) {
    children.push(spacer(4));
    children.push(bodyText("Hurdle Rate Tiers:", { bold: true }));
    for (const h of hurdles) {
      children.push(bulletPoint(`${(h.rate * 100).toFixed(1)}% hurdle: ${h.split}`));
    }
  }
  children.push(spacer(8));

  // Article V: Management Fee
  children.push(sectionHeading("Article V — Management Fee"));
  children.push(bodyText(prose.managementFeeProvisions));
  children.push(spacer(4));

  children.push(bodyTextRuns([
    { text: "Management Fee Rate: ", bold: true },
    { text: `${(managementFee * 100).toFixed(2)}% per annum` },
  ]));
  children.push(bodyTextRuns([
    { text: "Calculation Basis (Investment Period): ", bold: true },
    { text: "Aggregate commitments of all partners" },
  ]));
  children.push(bodyTextRuns([
    { text: "Calculation Basis (Post-Investment Period): ", bold: true },
    { text: "Invested capital (cost basis of unrealized investments plus unfunded reserves)" },
  ]));
  children.push(bodyTextRuns([
    { text: "Payment Frequency: ", bold: true },
    { text: "Quarterly in advance, prorated for partial quarters" },
  ]));
  children.push(spacer(8));

  // Article VI: Clawback
  children.push(sectionHeading("Article VI — Clawback Provision"));
  if (project.clawbackProvision) {
    children.push(bodyText(prose.clawbackProvision));
    children.push(spacer(4));
    children.push(
      bodyText(
        `Upon the final liquidation of the Fund, the General Partner shall return to the Fund any previously distributed carried interest that exceeds the amount that would have been distributable to the General Partner had all distributions been calculated on a cumulative, whole-fund basis. The clawback obligation shall survive termination of this Agreement and may be net of taxes actually paid by the General Partner on such carried interest distributions.`,
      ),
    );
  } else {
    children.push(bodyText("No clawback provision applies to this Fund."));
  }
  children.push(spacer(8));

  // Article VII: Key Person
  children.push(sectionHeading("Article VII — Key Person Provision"));
  if (project.keyPersonProvision && keyPersonNames && keyPersonNames.length > 0) {
    children.push(bodyText(prose.keyPersonProvision));
    children.push(spacer(4));
    children.push(bodyTextRuns([
      { text: "Designated Key Persons: ", bold: true },
      { text: keyPersonNames.join(", ") },
    ]));
    children.push(spacer(4));
    children.push(
      bodyText(
        `If any Key Person ceases to devote substantially all of their business time and efforts (generally interpreted as not less than 50% of professional time) to the affairs of the Fund, the Investment Period shall be automatically suspended. The General Partner shall promptly notify all Limited Partners. Within 90 days, Limited Partners holding not less than 75% of the aggregate commitments (excluding the GP commitment) may elect to: (a) reinstate the Investment Period; (b) terminate the Investment Period; or (c) appoint a replacement Key Person.`,
      ),
    );
  } else {
    children.push(bodyText("No key person provision applies to this Fund."));
  }
  children.push(spacer(8));

  // Article VIII: Investment Restrictions
  children.push(sectionHeading("Article VIII — Investment Restrictions"));
  children.push(bodyText(prose.investmentRestrictions));
  children.push(spacer(8));

  // Article IX: Advisory Committee
  children.push(sectionHeading("Article IX — Advisory Committee"));
  children.push(bodyText(prose.advisoryCommittee));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The Advisory Committee shall consist of 3-7 representatives selected from the largest Limited Partners by commitment amount. The Advisory Committee shall review and provide guidance on: (a) conflicts of interest; (b) valuation of Fund assets; (c) modifications to investment restrictions; (d) extension of the Fund term; and (e) any other matters submitted to it by the General Partner. The Advisory Committee shall have no authority to make investment decisions on behalf of the Fund.",
    ),
  );
  children.push(spacer(8));

  // Article X: Transfer Restrictions
  children.push(sectionHeading("Article X — Transfer Restrictions"));
  children.push(bodyText(prose.transferRestrictions));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Right of First Refusal: Prior to any proposed transfer of Interests, the transferring partner shall first offer such Interests to the General Partner and the other Limited Partners on the same terms and conditions. The General Partner shall have 30 days, and the Limited Partners shall have an additional 15 days, to exercise the right of first refusal.",
    ),
  );
  children.push(spacer(8));

  // Article XI: No-Fault Removal
  children.push(sectionHeading("Article XI — Removal of General Partner"));
  children.push(bodyText(prose.noFaultRemoval));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Limited Partners holding not less than 75% of the aggregate commitments (excluding the GP commitment) may, by written notice delivered to the General Partner, remove the General Partner without cause. Upon removal, the outgoing General Partner shall cooperate in the orderly transition of management to a successor General Partner elected by a majority of Limited Partners by commitment amount.",
    ),
  );
  children.push(spacer(8));

  // Article XII: Term and Extensions
  children.push(sectionHeading("Article XII — Term and Extensions"));
  children.push(bodyText(prose.termAndExtensions));
  children.push(spacer(4));
  children.push(bodyTextRuns([
    { text: "Initial Term: ", bold: true },
    { text: `${project.fundTermYears ?? 10} years from the date of the initial closing.` },
  ]));
  children.push(bodyTextRuns([
    { text: "Extensions: ", bold: true },
    { text: "Up to two (2) one-year extensions at the discretion of the General Partner, with notice to Limited Partners not less than 90 days prior to the scheduled termination date." },
  ]));
  children.push(spacer(8));

  // Article XIII: Indemnification
  children.push(sectionHeading("Article XIII — Indemnification and Exculpation"));
  children.push(bodyText(prose.indemnification));
  children.push(spacer(8));

  // Article XIV: Confidentiality
  children.push(sectionHeading("Article XIV — Confidentiality"));
  children.push(bodyText(prose.confidentiality));
  children.push(spacer(8));

  // Article XV: Side Letter Disclosure
  children.push(sectionHeading("Article XV — Side Letter Disclosure (MFN)"));
  children.push(bodyText(prose.sideLetterDisclosure));
  children.push(spacer(8));

  // Article XVI: Governing Law
  children.push(sectionHeading("Article XVI — Governing Law and Dispute Resolution"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(4));
  children.push(
    bodyText(
      `JURY TRIAL WAIVER: EACH PARTNER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVES ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT.`,
      { bold: true },
    ),
  );
  children.push(spacer(16));

  // Signatures
  children.push(sectionHeading("Execution"));
  children.push(
    bodyText("IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first written above."),
  );
  children.push(spacer(4));

  children.push(bodyText("GENERAL PARTNER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.gpEntityName, "General Partner"));
  children.push(spacer(16));

  children.push(bodyText("LIMITED PARTNERS:", { bold: true, color: COLORS.primary }));
  children.push(bodyText("(As set forth on the schedule of Limited Partners attached hereto as Exhibit A)"));
  children.push(...signatureBlock("Limited Partner", "Authorized Signatory"));

  return buildLegalDocument({
    title: `${entityType} Agreement`,
    headerRight: `${entityType} Agreement — ${project.fundName}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runOperatingAgreementComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Clawback
  checks.push({
    name: "Clawback Provision",
    regulation: "Market Standard (LP Protection)",
    category: "investor_protection",
    passed: project.clawbackProvision,
    note: project.clawbackProvision
      ? "Clawback provision included — GP must return excess carried interest at fund wind-down."
      : "WARNING: No clawback provision. This is a significant LP protection that is market standard for institutional funds.",
  });

  // Key Person
  checks.push({
    name: "Key Person Provision",
    regulation: "Market Standard (LP Protection)",
    category: "investor_protection",
    passed: project.keyPersonProvision,
    note: project.keyPersonProvision
      ? `Key person provision included. Key persons: ${(project.keyPersonNames as string[] | null)?.join(", ") ?? "Not specified"}.`
      : "WARNING: No key person provision. LPs typically require suspension of the investment period if key persons depart.",
  });

  // GP Commitment
  const gpCommitment = Number(project.gpCommitment ?? 0);
  const targetRaise = Number(project.targetRaise ?? 0);
  const gpPct = targetRaise > 0 ? (gpCommitment / targetRaise) * 100 : 0;
  checks.push({
    name: "GP Commitment Alignment",
    regulation: "Market Standard (1-5% of fund size)",
    category: "investor_protection",
    passed: gpPct >= 1,
    note: gpPct >= 1
      ? `GP commitment of ${formatCurrency(gpCommitment)} (${gpPct.toFixed(1)}%) shows alignment. Market standard is 1-5%.`
      : `GP commitment of ${formatCurrency(gpCommitment)} (${gpPct.toFixed(1)}%) is below the market standard minimum of 1%.`,
  });

  // Management fee
  const mgmtFee = project.managementFee ?? 0;
  checks.push({
    name: "Management Fee Disclosed",
    regulation: "Rule 10b-5 (17 CFR 240.10b-5)",
    category: "anti_fraud",
    passed: mgmtFee > 0,
    note: mgmtFee > 0
      ? `Management fee of ${(mgmtFee * 100).toFixed(2)}% is disclosed in the agreement.`
      : "Management fee is zero or not set. Verify this is intentional.",
  });

  // Carried interest
  const carry = project.carriedInterest ?? 0;
  checks.push({
    name: "Carried Interest Disclosed",
    regulation: "26 U.S.C. Section 1061",
    category: "tax",
    passed: carry > 0,
    note: carry > 0
      ? `Carried interest of ${(carry * 100).toFixed(1)}% is disclosed. Subject to 3-year holding period requirement under Section 1061.`
      : "Carried interest is zero or not set. Verify this is intentional.",
  });

  return checks;
}
