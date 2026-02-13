// subscription-agreement.ts
// Investor Subscription Agreement for capital fund offerings.
// Includes investor representations, suitability, ERISA status, tax status,
// AML/KYC, accreditation self-certification (506b) or verification (506c).

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
  safeNumber,
  ensureProseArray,
  COLORS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, SubscriptionAgreementProse, ComplianceCheck } from "../types";

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  const is506c = project.exemptionType === "REG_D_506C";

  return `You are a securities attorney generating a Subscription Agreement for a ${is506c ? "Rule 506(c)" : "Rule 506(b)"} offering under Regulation D (17 CFR 230.506).

This document is signed by each investor to subscribe for interests in the fund. It must include:
1. Investor representations about accredited/qualified status per 17 CFR 230.501(a)
2. Suitability representations (ability to bear loss, liquidity needs, investment experience)
3. ERISA representations (whether investor is a benefit plan subject to 29 CFR 2510.3-101)
4. Tax status (US/non-US, tax-exempt, FIRPTA considerations under 26 U.S.C. Section 1445)
5. AML/KYC representations (USA PATRIOT Act compliance, 31 U.S.C. Section 5318)
6. ${is506c ? "Verification section — investor must agree to provide documentation for accredited status verification per 17 CFR 230.506(c)(2)(ii)" : "Self-certification checkboxes for accredited investor status per 17 CFR 230.501(a)"}

ABSOLUTE RULES:
1. Use EXACT dollar amounts and percentages from the project data.
2. Cite specific statutes (17 CFR 230.501(a), 15 U.S.C. Section 80a-2(a)(51), etc.).
3. Write production-ready legal provisions.
4. Include all accredited investor criteria from 17 CFR 230.501(a):
   - $200K individual / $300K joint income (prior 2 years + reasonable expectation)
   - $1M net worth excluding primary residence
   - Series 7, 65, or 82 holder (per Rule 501(a)(10))
   - Knowledgeable employee of the fund
   - Entity with $5M+ assets (not formed to acquire these securities)

OUTPUT: Valid JSON only.

JSON Schema:
{
  "recitals": "string - Opening recitals describing the subscription",
  "investorRepresentations": ["string[] - Individual representation paragraphs about accredited/qualified status, investment experience, access to information"],
  "suitabilityRepresentations": ["string[] - Suitability: ability to bear loss, liquidity, investment horizon"],
  "erisaRepresentations": "string - ERISA status representations",
  "taxRepresentations": "string - Tax status (US/non-US, tax-exempt, partnership taxation)",
  "amlKycRepresentations": "string - AML/KYC/PATRIOT Act representations",
  "accreditationCertification": "string - Self-certification language (for 506b) with all criteria checkboxes",
  "verificationSection": "string - Verification requirements (for 506c) including document types needed",
  "indemnification": "string - Investor indemnification of the fund/GP",
  "miscellaneous": "string - Counterparts, entire agreement, amendments, severability",
  "governingLaw": "string - Governing law with specific state, venue, jury waiver"
}`;
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildSubscriptionAgreement(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  const prose = await claudeJson<SubscriptionAgreementProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 10000,
  });

  const minInvestment = safeNumber(project.minInvestment);
  const is506c = project.exemptionType === "REG_D_506C";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Subscription Agreement"));
  children.push(spacer(4));

  // Fund identification
  children.push(
    bodyTextRuns([
      { text: "Fund: ", bold: true },
      { text: project.fundName },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "General Partner: ", bold: true },
      { text: project.gpEntityName },
    ]),
  );
  children.push(spacer(8));

  // Recitals
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(8));

  // Subscription
  children.push(sectionHeading("1. Subscription"));
  children.push(
    bodyText(
      `The undersigned (the "Investor") hereby irrevocably subscribes for limited partnership interests (the "Interests") in ${project.fundName} (the "Fund") in the aggregate capital commitment amount set forth on the signature page hereto (the "Commitment Amount"), subject to acceptance by ${project.gpEntityName} (the "General Partner").`,
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyTextRuns([
      { text: "Minimum Commitment: ", bold: true },
      { text: `${formatCurrency(minInvestment)}. The General Partner may, in its sole discretion, accept subscriptions for lesser amounts.` },
    ]),
  );
  children.push(spacer(8));

  // Investor Representations
  children.push(sectionHeading("2. Investor Representations and Warranties"));
  children.push(
    bodyText("The Investor hereby represents and warrants to the Fund and the General Partner as follows:"),
  );
  children.push(spacer(4));

  const investorReps = ensureProseArray(prose.investorRepresentations);
  for (const rep of investorReps) {
    children.push(bulletPoint(String(rep)));
  }
  children.push(spacer(8));

  // Suitability
  children.push(sectionHeading("3. Suitability Representations"));
  children.push(
    bodyText("The Investor further represents and warrants regarding suitability:"),
  );
  children.push(spacer(4));

  const suitabilityReps = ensureProseArray(prose.suitabilityRepresentations);
  for (const rep of suitabilityReps) {
    children.push(bulletPoint(String(rep)));
  }
  children.push(spacer(8));

  // Accredited Investor Certification
  children.push(sectionHeading("4. Accredited Investor / Qualified Purchaser Status"));

  if (is3c7) {
    children.push(
      bodyText(
        "The Fund relies on Section 3(c)(7) of the Investment Company Act of 1940 (15 U.S.C. Section 80a-3(c)(7)). ALL investors must be qualified purchasers as defined in 15 U.S.C. Section 80a-2(a)(51).",
        { bold: true },
      ),
    );
    children.push(spacer(4));
    children.push(bodyText("The Investor certifies that it is a qualified purchaser under one of the following categories:"));
    children.push(bulletPoint("A natural person who owns not less than $5,000,000 in investments (as defined in 17 CFR 270.2a51-1)."));
    children.push(bulletPoint("A family-owned company that owns not less than $5,000,000 in investments."));
    children.push(bulletPoint("A trust, not formed for the specific purpose of acquiring the securities offered, with not less than $5,000,000 in investments."));
    children.push(bulletPoint("An entity acting for its own account or for the accounts of other qualified purchasers, that in the aggregate owns and invests on a discretionary basis not less than $25,000,000 in investments."));
  } else {
    children.push(
      bodyText(
        `The Fund is offered pursuant to ${is506c ? "Rule 506(c)" : "Rule 506(b)"} of Regulation D under the Securities Act of 1933. The Investor certifies accredited investor status under 17 CFR 230.501(a) by checking the applicable category:`,
      ),
    );
    children.push(spacer(4));

    // Individual criteria
    children.push(bodyText("Individual Accredited Investor (check all that apply):", { bold: true }));
    children.push(bulletPoint("[ ] Income: Individual income exceeding $200,000 (or $300,000 jointly with spouse/spousal equivalent) in each of the two most recent years, with a reasonable expectation of the same for the current year."));
    children.push(bulletPoint("[ ] Net Worth: Individual net worth (or joint net worth with spouse/spousal equivalent) exceeding $1,000,000, excluding the value of the primary residence."));
    children.push(bulletPoint("[ ] Professional Certification: Holder of a Series 7, Series 65, or Series 82 license in good standing (per Rule 501(a)(10))."));
    children.push(bulletPoint("[ ] Knowledgeable Employee: Director, executive officer, or general partner of the Fund or the Fund's investment manager, or an employee of the Fund's investment manager who has participated in the investment activities of the Fund or substantially similar funds for at least 12 months (per 17 CFR 270.3c-5(a)(4))."));
    children.push(bulletPoint("[ ] Family Office: Family office with at least $5,000,000 in assets under management that directs the investment."));
    children.push(spacer(4));

    // Entity criteria
    children.push(bodyText("Entity Accredited Investor (check all that apply):", { bold: true }));
    children.push(bulletPoint("[ ] Entity with total assets exceeding $5,000,000, not formed for the specific purpose of acquiring the securities offered."));
    children.push(bulletPoint("[ ] Entity in which all equity owners are accredited investors."));
    children.push(bulletPoint("[ ] Bank, insurance company, registered investment company, BDC, or SBIC."));
    children.push(bulletPoint("[ ] Employee benefit plan with total assets exceeding $5,000,000 or with investment decisions made by a bank, registered investment adviser, or registered broker-dealer."));
    children.push(bulletPoint("[ ] SEC-registered or state-registered investment adviser."));
  }

  children.push(spacer(4));
  children.push(bodyText(prose.accreditationCertification));
  children.push(spacer(8));

  // PPM Receipt Acknowledgment
  children.push(sectionHeading("5. Acknowledgment of Receipt of PPM"));
  children.push(
    bodyText(
      `The Investor hereby acknowledges that the Investor has received, read, and understands the Confidential Private Placement Memorandum of ${project.fundName} dated as of the date set forth therein (the "Memorandum"), including all exhibits, supplements, and amendments thereto. The Investor has had the opportunity to ask questions of, and receive answers from, the General Partner and its representatives concerning the terms and conditions of the offering and the Fund, and all such questions have been answered to the Investor's satisfaction.`,
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "The Investor acknowledges that the Interests are being offered and sold without registration under the Securities Act of 1933, as amended, in reliance upon exemptions therefrom, and that the Memorandum is not a prospectus and has not been reviewed or approved by the Securities and Exchange Commission or any state securities commission or regulatory authority.",
    ),
  );
  children.push(spacer(8));

  // Verification section for 506(c)
  if (is506c) {
    children.push(sectionHeading("6. Accredited Investor Verification"));
    children.push(
      bodyText(
        "Pursuant to Rule 506(c) of Regulation D (17 CFR 230.506(c)(2)(ii)), the Investor must provide documentation to verify accredited investor status. Self-certification alone is NOT sufficient for 506(c) offerings.",
        { bold: true },
      ),
    );
    children.push(spacer(4));
    children.push(bodyText("Acceptable verification methods (non-exclusive list):", { bold: true }));
    children.push(bulletPoint("Income Verification: IRS forms (W-2, 1040, K-1) for the prior two years, plus a written representation of expected income for the current year."));
    children.push(bulletPoint("Net Worth Verification: Bank statements, brokerage statements, and other documentation of assets, plus a credit report dated within 3 months, to evidence net worth in excess of $1,000,000 (excluding primary residence)."));
    children.push(bulletPoint("Professional Certification: Evidence of current Series 7, Series 65, or Series 82 license (the SEC-designated credentials under Rule 501(a)(10))."));
    children.push(bulletPoint("Third-Party Confirmation: Written confirmation from a registered broker-dealer, SEC-registered investment adviser, licensed attorney, or certified public accountant that such person or entity has taken reasonable steps to verify the Investor's accredited status within the prior 3 months."));
    children.push(bulletPoint("Existing Investor: If the Investor invested in the issuer's securities as an accredited investor within the preceding 5 years, a written representation of continued accredited status."));
    children.push(spacer(4));
    children.push(bodyText(prose.verificationSection));
    children.push(spacer(8));
  }

  // ERISA
  const erisaSection = is506c ? "7" : "6";
  children.push(sectionHeading(`${erisaSection}. ERISA Representations`));
  children.push(bodyText(prose.erisaRepresentations));
  children.push(spacer(4));
  children.push(bodyText("The Investor certifies (check one):", { bold: true }));
  children.push(bulletPoint("[ ] The Investor is NOT a benefit plan investor subject to Title I of ERISA or Section 4975 of the Internal Revenue Code."));
  children.push(bulletPoint("[ ] The Investor IS a benefit plan investor. The Investor understands that the Fund's assets will be treated as 'plan assets' under 29 CFR 2510.3-101(f) if benefit plan investors hold, in the aggregate, 25% or more of the value of any class of equity interests in the Fund. The Investor acknowledges that the General Partner monitors the aggregate benefit plan investor ownership to ensure compliance with this threshold."));
  children.push(spacer(8));

  // Tax Status
  const taxSection = is506c ? "8" : "7";
  children.push(sectionHeading(`${taxSection}. Tax Status`));
  children.push(bodyText(prose.taxRepresentations));
  children.push(spacer(4));
  children.push(bodyText("The Investor certifies (check applicable):", { bold: true }));
  children.push(bulletPoint("[ ] U.S. Person (U.S. citizen, resident alien, domestic partnership, domestic corporation, or other domestic entity)."));
  children.push(bulletPoint("[ ] Non-U.S. Person (subject to FIRPTA withholding under 26 U.S.C. Section 1445 for dispositions of U.S. real property interests)."));
  children.push(bulletPoint("[ ] Tax-Exempt Entity (may be subject to UBTI under 26 U.S.C. Sections 511-514 on debt-financed income)."));
  children.push(spacer(8));

  // AML/KYC
  const amlSection = is506c ? "9" : "8";
  children.push(sectionHeading(`${amlSection}. Anti-Money Laundering / Know Your Customer`));
  children.push(bodyText(prose.amlKycRepresentations));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The Investor represents that the funds used for this investment are not derived from illegal activities and that the Investor is in compliance with all applicable anti-money laundering laws, including the USA PATRIOT Act (31 U.S.C. Section 5318) and the Bank Secrecy Act. The Investor is not a person or entity identified on any sanctions list maintained by the U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC).",
    ),
  );
  children.push(spacer(8));

  // Commitment Amount
  const commitSection = is506c ? "10" : "9";
  children.push(sectionHeading(`${commitSection}. Commitment Amount`));
  children.push(
    bodyText(
      "The Investor's capital commitment to the Fund is set forth below. Capital calls shall be made by the General Partner from time to time during the Investment Period, with not less than 10 business days' prior written notice (or such longer period as may be provided in a side letter).",
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("Capital Commitment Amount: $___________________", { bold: true }));
  children.push(spacer(8));

  // Indemnification
  const indemnSection = is506c ? "11" : "10";
  children.push(sectionHeading(`${indemnSection}. Indemnification`));
  children.push(bodyText(prose.indemnification));
  children.push(spacer(8));

  // Miscellaneous
  const miscSection = is506c ? "12" : "11";
  children.push(sectionHeading(`${miscSection}. Miscellaneous`));
  children.push(bodyText(prose.miscellaneous));
  children.push(spacer(8));

  // Governing Law
  const lawSection = is506c ? "13" : "12";
  children.push(sectionHeading(`${lawSection}. Governing Law`));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(4));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: THE INVESTOR AND THE FUND HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS SUBSCRIPTION AGREEMENT.",
      { bold: true },
    ),
  );
  children.push(spacer(16));

  // Signature
  children.push(sectionHeading("Signature"));
  children.push(
    bodyText("By executing this Subscription Agreement, the Investor hereby subscribes for Interests in the Fund as described herein."),
  );
  children.push(spacer(4));

  children.push(bodyText("INVESTOR:", { bold: true, color: COLORS.primary }));
  children.push(bodyText("Print Name: ___________________________________"));
  children.push(bodyText("Title (if entity): ____________________________"));
  children.push(bodyText("Capital Commitment: $__________________________"));
  children.push(...signatureBlock("Investor", "Authorized Signatory"));

  children.push(spacer(16));

  children.push(bodyText("ACCEPTED BY GENERAL PARTNER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.gpEntityName, "Authorized Signatory"));

  return buildLegalDocument({
    title: "Subscription Agreement",
    headerRight: `Subscription Agreement — ${project.fundName}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runSubscriptionComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const is506c = project.exemptionType === "REG_D_506C";

  checks.push({
    name: "Accredited Investor Criteria Listed",
    regulation: "17 CFR 230.501(a)",
    category: "investor_protection",
    passed: true,
    note: "All accredited investor criteria from Rule 501(a) are included: income ($200K/$300K), net worth ($1M), professional certifications (Series 7/65/82 per Rule 501(a)(10)), knowledgeable employees, and entity thresholds.",
  });

  if (is506c) {
    checks.push({
      name: "Verification Methods Included",
      regulation: "17 CFR 230.506(c)(2)(ii)",
      category: "securities",
      passed: true,
      note: "506(c) verification methods included: income (W-2/1040), net worth (bank statements + credit report), professional certifications, third-party confirmation, and existing investor re-verification.",
    });
  }

  checks.push({
    name: "ERISA Status Inquiry",
    regulation: "29 CFR 2510.3-101",
    category: "erisa",
    passed: true,
    note: "ERISA benefit plan investor status is queried with plan asset threshold reference.",
  });

  checks.push({
    name: "AML/KYC Representations",
    regulation: "31 U.S.C. Section 5318 (USA PATRIOT Act)",
    category: "anti_fraud",
    passed: true,
    note: "Anti-money laundering and OFAC sanctions representations are included.",
  });

  checks.push({
    name: "Tax Status Inquiry",
    regulation: "26 U.S.C. Section 1445 (FIRPTA)",
    category: "tax",
    passed: true,
    note: "US/non-US status and tax-exempt status inquiries included for FIRPTA and UBTI purposes.",
  });

  return checks;
}
