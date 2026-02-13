// form-d-draft.ts
// Pre-populated Form D draft with all fields from project data.
// Form D is filed with the SEC within 15 days of first sale (17 CFR 239.500).
// This generates a DOCX draft for review before filing on EDGAR.

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
  keyTermsTable,
  createTable,
  formatCurrency,
  safeNumber,
  COLORS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, FormDDraftProse, ComplianceCheck } from "../types";

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  return `You are a securities attorney preparing a Form D notice filing draft for an offering under ${project.exemptionType === "REG_D_506C" ? "Rule 506(c)" : "Rule 506(b)"} of Regulation D.

Form D is required under 17 CFR 239.500 and must be filed electronically on EDGAR within 15 calendar days after the first sale of securities.

Generate prose descriptions for the following Form D sections:
1. Issuer description — brief description of the fund and its business
2. Offering description — type of securities, nature of the offering
3. Use of proceeds — how raised capital will be deployed
4. Sales compensation — placement agent fees if any
5. Related persons — description of GP principals and their roles
6. Additional notes — any additional disclosures for the Form D filing

RULES:
1. Use EXACT numbers from project data (offering amount, minimum investment).
2. Be concise — Form D descriptions should be factual, not promotional.
3. Reference the specific exemption claimed (Rule 506(b) or 506(c) under Regulation D).
4. Note that this is a DRAFT for review before electronic filing on EDGAR.

OUTPUT: Valid JSON only.

JSON Schema:
{
  "issuerDescription": "string - Brief description of the fund/issuer",
  "offeringDescription": "string - Description of the offering (type of securities, terms)",
  "useOfProceeds": "string - How proceeds will be used",
  "salesCompensation": "string - Placement agent/finder fee description if applicable",
  "relatedPersonsDescription": "string - Description of related persons (GP principals)",
  "additionalNotes": "string - Any additional filing notes"
}`;
}

// ─── Exemption Type Mapping ──────────────────────────────────────────

function exemptionRule(project: CapitalProjectFull): string {
  switch (project.exemptionType) {
    case "REG_D_506B": return "Rule 506(b)";
    case "REG_D_506C": return "Rule 506(c)";
    case "REG_A_TIER1": return "Regulation A, Tier 1";
    case "REG_A_TIER2": return "Regulation A, Tier 2";
    case "REG_CF": return "Regulation CF";
    default: return "Rule 506(b)";
  }
}

function exemptionCFR(project: CapitalProjectFull): string {
  switch (project.exemptionType) {
    case "REG_D_506B": return "17 CFR 230.506(b)";
    case "REG_D_506C": return "17 CFR 230.506(c)";
    case "REG_A_TIER1": return "17 CFR 230.251-263 (Tier 1)";
    case "REG_A_TIER2": return "17 CFR 230.251-263 (Tier 2)";
    case "REG_CF": return "17 CFR Part 227";
    default: return "17 CFR 230.506(b)";
  }
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildFormDDraft(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  const prose = await claudeJson<FormDDraftProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 4000,
  });

  const targetRaise = safeNumber(project.targetRaise);
  const minInvestment = safeNumber(project.minInvestment);
  const keyPersonNames = (Array.isArray(project.keyPersonNames) ? project.keyPersonNames : []) as string[];
  const stateFilings = (Array.isArray(project.stateFilings) ? project.stateFilings : []) as string[];
  const is506c = project.exemptionType === "REG_D_506C";

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Form D — Notice of Exempt Offering of Securities"));
  children.push(spacer(4));

  children.push(
    bodyText("DRAFT — FOR REVIEW BEFORE ELECTRONIC FILING ON EDGAR", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      "This document is a draft of the Form D notice filing required under 17 CFR 239.500. The actual filing must be made electronically through the SEC's EDGAR system within 15 calendar days after the first sale of securities.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Item 1: Issuer's Identity
  children.push(sectionHeading("Item 1 — Issuer's Identity"));
  const issuerRows: Array<{ label: string; value: string }> = [
    { label: "Exact Name of Issuer", value: project.fundName },
    { label: "Jurisdiction of Incorporation/Organization", value: project.gpStateOfFormation ?? "Delaware" },
    // Uses current year as default; override with actual formation year from schema if available
    { label: "Year of Incorporation/Organization", value: new Date().getFullYear().toString() },
    { label: "Entity Type", value: project.fundType === "HEDGE_FUND" ? "Limited Liability Company" : "Limited Partnership" },
    { label: "CIK Number", value: "[TO BE OBTAINED FROM EDGAR]" },
    { label: "IRS Employer Identification Number (EIN)", value: "[TO BE OBTAINED]" },
  ];
  children.push(keyTermsTable(issuerRows));
  children.push(spacer(4));
  children.push(bodyText(prose.issuerDescription));
  children.push(spacer(8));

  // Item 2: Principal Place of Business
  children.push(sectionHeading("Item 2 — Principal Place of Business and Contact Information"));
  children.push(bodyText("Street Address 1: _____________________________________________"));
  children.push(bodyText("Street Address 2: _____________________________________________"));
  children.push(bodyText("City: _________________ State: _______ ZIP: __________________"));
  children.push(bodyText("Phone Number: _________________________________________________"));
  children.push(spacer(8));

  // Item 3: Related Persons
  children.push(sectionHeading("Item 3 — Related Persons"));
  children.push(
    bodyText("The following persons are related to the issuer (executive officers, directors, and promoters):"),
  );
  children.push(spacer(4));

  if (keyPersonNames.length > 0) {
    const personRows = keyPersonNames.map((name) => [
      name,
      "Executive Officer / Director",
      "[ADDRESS]",
      "[ ] Director  [ ] Executive Officer  [ ] Promoter",
    ]);
    children.push(
      createTable(
        ["Name", "Title", "Address", "Relationship"],
        personRows,
        { columnWidths: [25, 25, 25, 25], alternateRows: true },
      ),
    );
  } else {
    children.push(bodyText("[To be completed — list all executive officers, directors, and promoters of the GP]"));
  }
  children.push(spacer(4));
  children.push(bodyText(prose.relatedPersonsDescription));
  children.push(spacer(8));

  // Item 4: Industry Group
  children.push(sectionHeading("Item 4 — Industry Group"));
  children.push(bodyTextRuns([
    { text: "Industry Group: ", bold: true },
    { text: "Pooled Investment Fund" },
  ]));
  children.push(bodyTextRuns([
    { text: "Investment Fund Type: ", bold: true },
    { text: fundTypeLabel(project.fundType) },
  ]));
  children.push(spacer(8));

  // Item 5: Issuer Size
  children.push(sectionHeading("Item 5 — Issuer Size"));
  children.push(bodyTextRuns([
    { text: "Revenue Range: ", bold: true },
    { text: "Not Applicable (investment fund)" },
  ]));
  children.push(bodyTextRuns([
    { text: "Aggregate Net Asset Value Range: ", bold: true },
    { text: "[TO BE DETERMINED]" },
  ]));
  children.push(spacer(8));

  // Item 6: Federal Exemption(s) and Exclusion(s) Claimed
  children.push(sectionHeading("Item 6 — Federal Exemption(s) and Exclusion(s) Claimed"));
  children.push(bodyTextRuns([
    { text: "Exemption Claimed: ", bold: true },
    { text: `${exemptionRule(project)} (${exemptionCFR(project)})` },
  ]));

  if (is506c) {
    children.push(bodyTextRuns([
      { text: "General Solicitation: ", bold: true },
      { text: "YES — Permitted under Rule 506(c)" },
    ]));
  } else {
    children.push(bodyTextRuns([
      { text: "General Solicitation: ", bold: true },
      { text: "NO — Prohibited under Rule 506(b)" },
    ]));
  }

  children.push(bodyTextRuns([
    { text: "Investment Company Act Exclusion: ", bold: true },
    { text: project.icaExemption === "SECTION_3C7"
      ? "Section 3(c)(7) (15 U.S.C. Section 80a-3(c)(7))"
      : "Section 3(c)(1) (15 U.S.C. Section 80a-3(c)(1))"
    },
  ]));
  children.push(spacer(8));

  // Item 7: Type of Filing
  children.push(sectionHeading("Item 7 — Type of Filing"));
  children.push(bodyTextRuns([
    { text: "Type: ", bold: true },
    { text: project.formDFilingDate ? "Amendment" : "New Notice" },
  ]));
  if (project.formDFilingDate) {
    children.push(bodyTextRuns([
      { text: "Date of Previous Filing: ", bold: true },
      { text: project.formDFilingDate.toISOString().split("T")[0] },
    ]));
  }
  children.push(spacer(8));

  // Item 8: Duration of Offering
  children.push(sectionHeading("Item 8 — Duration of Offering"));
  children.push(bodyTextRuns([
    { text: "Does the issuer intend this to be a continuing offering? ", bold: true },
    { text: "Yes" },
  ]));
  children.push(spacer(8));

  // Item 9: Type(s) of Securities Offered
  children.push(sectionHeading("Item 9 — Type(s) of Securities Offered"));
  children.push(bodyTextRuns([
    { text: "Type: ", bold: true },
    { text: project.fundType === "HEDGE_FUND" ? "Limited Liability Company Interests" : "Limited Partnership Interests" },
  ]));
  children.push(spacer(8));

  // Item 10: Business Combination Transaction
  children.push(sectionHeading("Item 10 — Business Combination Transaction"));
  children.push(bodyTextRuns([
    { text: "Is this a business combination transaction? ", bold: true },
    { text: "No" },
  ]));
  children.push(spacer(8));

  // Item 11: Minimum Investment
  children.push(sectionHeading("Item 11 — Minimum Investment"));
  children.push(bodyTextRuns([
    { text: "Minimum Investment Accepted from any Outside Investor: ", bold: true },
    { text: formatCurrency(minInvestment) },
  ]));
  children.push(spacer(8));

  // Item 12: Sales Compensation
  children.push(sectionHeading("Item 12 — Sales Compensation"));
  children.push(bodyText(prose.salesCompensation));
  children.push(spacer(4));
  children.push(bodyText("Recipient Name: _____________________________________________"));
  children.push(bodyText("CRD Number (if applicable): __________________________________"));
  children.push(bodyText("Compensation Amount / Percentage: ____________________________"));
  children.push(spacer(8));

  // Item 13: Offering and Sales Amounts
  children.push(sectionHeading("Item 13 — Offering and Sales Amounts"));
  const amountRows: Array<{ label: string; value: string }> = [
    { label: "Total Offering Amount", value: formatCurrency(targetRaise) },
    { label: "Total Amount Sold", value: "[TO BE UPDATED AT FILING]" },
    { label: "Total Remaining to Be Sold", value: "[TO BE UPDATED AT FILING]" },
  ];
  children.push(keyTermsTable(amountRows));
  children.push(spacer(4));
  children.push(bodyText(prose.offeringDescription));
  children.push(spacer(8));

  // Item 14: Investors
  children.push(sectionHeading("Item 14 — Investors"));
  const investorRows: Array<{ label: string; value: string }> = [
    { label: "Number of Accredited Investors", value: "[TO BE UPDATED AT FILING]" },
    { label: "Number of Non-Accredited Investors", value: is506c ? "0 (none permitted under 506(c))" : "[TO BE UPDATED AT FILING]" },
    { label: "Total Number of Investors", value: "[TO BE UPDATED AT FILING]" },
  ];
  children.push(keyTermsTable(investorRows));
  children.push(spacer(8));

  // Item 15: Sales Commissions & Finder's Fees Expenses
  children.push(sectionHeading("Item 15 — Sales Commissions & Finder's Fees Expenses"));
  children.push(bodyText("Sales Commissions: $__________________"));
  children.push(bodyText("Finder's Fees: $__________________"));
  children.push(bodyText("Total Offering Expenses: $__________________"));
  children.push(spacer(8));

  // Item 16: Use of Proceeds
  children.push(sectionHeading("Item 16 — Use of Proceeds"));
  children.push(bodyText(prose.useOfProceeds));
  children.push(spacer(8));

  // State Filings
  children.push(sectionHeading("State Blue Sky Notice Filings"));
  children.push(
    bodyText(
      "Regulation D Rule 506 offerings are preempted from state registration under the National Securities Markets Improvement Act (NSMIA), but states may require notice filings, fees, and consent to service of process.",
    ),
  );
  children.push(spacer(4));

  if (stateFilings.length > 0) {
    children.push(bodyText("Notice filings required in:", { bold: true }));
    for (const state of stateFilings) {
      children.push(bulletPoint(`${state} — notice filing fee and Form D copy required`));
    }
  } else {
    children.push(bodyText("State filings will be determined based on investor residency at the time of the first closing."));
  }
  children.push(spacer(4));
  children.push(bodyText("Common states requiring notice filings: CA, NY, TX, FL, IL, MA, CT, NJ, PA. Filing deadlines vary by state (e.g., 15 days after first sale in most states, pre-sale notice in some). Consult Blue Sky counsel for state-specific requirements.", { italic: true }));
  children.push(spacer(8));

  // Additional Notes
  children.push(sectionHeading("Additional Notes"));
  children.push(bodyText(prose.additionalNotes));
  children.push(spacer(4));
  children.push(
    bodyText(
      "FILING DEADLINE: Form D must be filed electronically through EDGAR within 15 calendar days after the first sale of securities (note: 'first sale' includes the date of any irrevocable contractual commitment to invest per SEC Release 33-8891). An amendment is required annually if the offering continues beyond 12 months, or upon any material change in the information provided.",
      { bold: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "EDGAR NEXT ENROLLMENT: New filers must enroll in EDGAR Next (the SEC's updated electronic filing system) before submitting Form D. Enrollment requires verifying identity, creating login credentials, and linking to an EDGAR filer account. Enrollment typically takes 2-5 business days. Existing EDGAR filers can continue using legacy EDGAR or migrate to EDGAR Next. For enrollment instructions, visit: www.sec.gov/edgar/next",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "NOTE: Failure to file Form D does not void the Regulation D exemption, but may result in SEC enforcement action and may be considered by courts in evaluating whether the offering conditions were met. State Blue Sky enforcement varies and may carry additional consequences (e.g., NY Martin Act provides broad anti-fraud authority without requiring proof of scienter).",
      { italic: true },
    ),
  );

  return buildLegalDocument({
    title: "Form D Draft",
    headerRight: `Form D Draft — ${project.fundName}`,
    children,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────

function fundTypeLabel(fundType: string): string {
  switch (fundType) {
    case "PRIVATE_EQUITY": return "Private Equity Fund";
    case "VENTURE_CAPITAL": return "Venture Capital Fund";
    case "REAL_ESTATE": return "Real Estate Fund";
    case "HEDGE_FUND": return "Hedge Fund";
    case "CREDIT": return "Credit Fund";
    case "INFRASTRUCTURE": return "Infrastructure Fund";
    default: return "Other Investment Fund";
  }
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runFormDComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Filing deadline
  checks.push({
    name: "Form D Filing Deadline",
    regulation: "17 CFR 239.500",
    category: "form_d",
    passed: true,
    note: project.formDFilingDate
      ? `Form D was filed on ${project.formDFilingDate.toISOString().split("T")[0]}. Remember to amend annually.`
      : "Form D not yet filed. Must be filed within 15 calendar days after the first sale of securities.",
  });

  // Reg A/CF incompatibility check
  const isRegAOrCF = project.exemptionType === "REG_A_TIER1" || project.exemptionType === "REG_A_TIER2" || project.exemptionType === "REG_CF";
  if (isRegAOrCF) {
    checks.push({
      name: "Reg A/CF Document Incompatibility",
      regulation: "17 CFR 230.251 (Reg A) / 17 CFR 227 (Reg CF)",
      category: "securities",
      passed: false,
      note: `Reg A and Reg CF offerings use different disclosure documents (Offering Circular / Form C), not Reg D PPM. Document generation templates for ${project.exemptionType} are not currently supported.`,
    });
  }

  // Exemption correctly claimed
  checks.push({
    name: "Exemption Claimed",
    regulation: exemptionCFR(project),
    category: "securities",
    passed: true,
    note: `Exemption claimed: ${exemptionRule(project)}. Ensure all conditions of the exemption are met before filing.`,
  });

  // Bad actor check
  checks.push({
    name: "Bad Actor Disqualification",
    regulation: "17 CFR 230.506(d)",
    category: "securities",
    passed: true, // Informational — actual check requires manual verification
    note: "Rule 506(d) bad actor disqualification applies. Verify that no covered person (issuer, directors, officers, 20%+ holders, promoters, placement agents) is subject to disqualification events. Note: Rule 506(d)(2) provides an exception for disqualification events that occurred before September 23, 2013 (pre-existing events). Rule 506(e) requires mandatory written disclosure to investors of any disqualification events that would have been disqualifying but for the pre-existing event exception or a waiver.",
  });

  // State filings
  const complianceStateFilings = (Array.isArray(project.stateFilings) ? project.stateFilings : []) as string[];
  checks.push({
    name: "State Blue Sky Notice Filings",
    regulation: "NSMIA / State securities laws",
    category: "state_filing",
    passed: true,
    note: complianceStateFilings.length > 0
      ? `State notice filings identified: ${complianceStateFilings.join(", ")}. File within 15 days of first sale to residents of each state.`
      : "No state filings specified. Determine required filings based on investor residency before first closing.",
  });

  return checks;
}
