// subscription-agreement.ts
// Subscription Agreement for RE syndication.
// Investor representations, accredited status, capital call provisions, suitability.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  sectionSubheading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  partyBlock,
  keyTermsTable,
  formatCurrency,
  ensureProseArray,
  safeNumber,
  COLORS,
} from "../../doc-helpers";

import { claudeJson } from "@/lib/claude";
import type { SyndicationProjectFull, SubscriptionAgreementProse, ComplianceCheck } from "../types";
import { buildProjectContext } from "../generate-doc";

// ─── AI Prose Generation ────────────────────────────────────────────

const SUB_SYSTEM_PROMPT = `You are a senior securities attorney drafting Subscription Agreements for real estate syndications under Regulation D. Your documents must comply with SEC regulations and protect both the issuer and investors.

ABSOLUTE RULES:
1. NUMBERS ARE SACRED: Use exact dollar amounts and terms from the project data.
2. INVESTOR REPRESENTATIONS must be specific to real estate syndication risks (illiquidity, leverage, single-asset concentration, passive investment).
3. ACCREDITATION provisions must distinguish between 506(b) (self-certification) and 506(c) (verification required).
4. CAPITAL CALL provisions must include notice periods, failure-to-fund consequences, and dilution mechanisms.
5. SUITABILITY must address: ability to bear total loss, understanding of illiquidity, investment horizon matching hold period.
6. OUTPUT: Respond ONLY with valid JSON. No commentary.

AI-GENERATED CONTENT DISCLAIMER: This AI-generated content is for document drafting assistance only and does not constitute legal advice.`;

async function generateSubProse(project: SyndicationProjectFull): Promise<SubscriptionAgreementProse> {
  const context = buildProjectContext(project);
  const is506c = project.exemptionType === "REG_D_506C";
  const minInvestment = safeNumber(project.minInvestment);

  const userPrompt = `Generate Subscription Agreement prose for this real estate syndication.

${context}

EXEMPTION: ${is506c ? "Rule 506(c) — accreditation VERIFICATION required" : "Rule 506(b) — self-certification acceptable"}
MINIMUM INVESTMENT: ${formatCurrency(minInvestment)}
HOLD PERIOD: ${project.projectedHoldYears ?? 5} years

Return a JSON object with these keys:
{
  "recitals": "Recitals establishing: Company is offering membership interests, investor desires to subscribe, offering pursuant to ${is506c ? "Rule 506(c)" : "Rule 506(b)"} of Regulation D. Reference the PPM, Operating Agreement, and minimum investment amount.",
  "investorRepresentations": ["Array of 8-10 specific investor representations including: (1) received and reviewed the PPM, (2) had opportunity to ask questions of Manager, (3) sole decision to invest without reliance on third parties, (4) understands interests are restricted securities with no secondary market, (5) understands risks of real estate investment including total loss, (6) investment is for own account not for resale, (7) no guarantee of returns, (8) understands leverage risks, (9) acknowledges Manager conflicts of interest, (10) information provided is true and complete"],
  "accreditedStatusReps": "Accredited investor representation section. ${is506c ? "For 506(c): investor must agree to provide verification documents (tax returns for income test, financial statements for net worth test, or professional certification letter). Cite Rule 506(c)(2)(ii)(A)-(D) verification methods." : "For 506(b): investor self-certifies accredited status under Rule 501(a) of Regulation D. List the specific categories: income >$200K individual/$300K joint for last 2 years, net worth >$1M excluding primary residence, certain professional certifications (Series 7, 65, 82), or entity with >$5M assets."}",
  "capitalCallProvisions": "Capital call provisions: Manager may issue capital calls for additional contributions. At least 10 business days written notice. Failure to fund results in: (a) dilution of defaulting member's interest, (b) default interest at 18% per annum, (c) potential forced sale of interest at 50% discount to NAV. Manager shall use commercially reasonable efforts to avoid capital calls beyond the initial subscription amount.",
  "suitabilityRepresentations": "Suitability representations specific to real estate: investor has ability to bear complete loss of investment, investment represents no more than 10% of net worth (recommendation), investor's investment horizon is compatible with ${project.projectedHoldYears ?? 5}-year projected hold period, investor understands there is no redemption mechanism or secondary market, investor has sufficient liquid assets to cover ongoing financial obligations regardless of this investment's performance.",
  "indemnification": "Investor agrees to indemnify and hold harmless the Company, Manager, and their affiliates against any losses, claims, or expenses arising from: (a) breach of any representation in this Agreement, (b) investor's failure to comply with securities laws, (c) investor's unauthorized transfer of interests. Indemnification obligations survive termination of this Agreement.",
  "miscellaneous": "Miscellaneous provisions: entire agreement clause, amendment only with mutual written consent, severability with reformation, counterparts and electronic signatures, waiver of jury trial (CONSPICUOUS AND MUTUAL), no third-party beneficiaries, notices via certified mail or email.",
  "governingLaw": "This Subscription Agreement shall be governed by the laws of ${project.stateOfFormation ?? "Delaware"} without regard to conflicts of law principles. Any dispute shall be resolved by binding arbitration. The investor consents to personal jurisdiction in ${project.stateOfFormation ?? "Delaware"}."
}`;

  return claudeJson<SubscriptionAgreementProse>({
    systemPrompt: SUB_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 10000,
  });
}

// ─── DOCX Builder ───────────────────────────────────────────────────

export async function buildSubscriptionAgreement(project: SyndicationProjectFull): Promise<Document> {
  const prose = await generateSubProse(project);
  const minInvestment = safeNumber(project.minInvestment);
  const totalEquityRaise = safeNumber(project.totalEquityRaise);
  const is506c = project.exemptionType === "REG_D_506C";

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Subscription Agreement"));
  children.push(spacer(4));
  children.push(bodyText(project.entityName, { bold: true }));
  children.push(spacer(8));

  // Parties
  children.push(sectionHeading("Parties"));
  children.push(partyBlock("Company", project.entityName, `a ${project.stateOfFormation ?? "Delaware"} ${project.entityType}`));
  children.push(partyBlock("Manager", project.sponsorName, "Managing Member"));
  children.push(partyBlock("Subscriber", "[INVESTOR NAME]", "Prospective Member"));
  children.push(spacer(4));

  // Date
  children.push(bodyText(`Date: ___________________`));
  children.push(spacer(8));

  // Recitals
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(8));

  // Section 1: Subscription
  children.push(sectionHeading("1. Subscription"));
  children.push(sectionSubheading("1.1", "Subscription Amount"));
  children.push(
    bodyText(
      `The Subscriber hereby subscribes for membership interests in the Company in the amount of $_____________ (the "Subscription Amount"), subject to a minimum subscription of ${formatCurrency(minInvestment)}. The Subscriber acknowledges that the total offering size is ${formatCurrency(totalEquityRaise)}.`,
    ),
  );
  children.push(sectionSubheading("1.2", "Payment"));
  children.push(
    bodyText(
      "The Subscription Amount shall be payable by wire transfer or certified check to the Company's designated account upon acceptance of this Subscription Agreement by the Manager.",
    ),
  );
  children.push(sectionSubheading("1.3", "Acceptance"));
  children.push(
    bodyText(
      "This subscription is subject to acceptance by the Manager in its sole and absolute discretion. The Manager reserves the right to reject any subscription, in whole or in part, for any reason or no reason.",
    ),
  );
  children.push(spacer(8));

  // Section 2: Investor Representations
  children.push(sectionHeading("2. Investor Representations and Warranties"));
  children.push(
    bodyText("The Subscriber hereby represents and warrants to the Company and the Manager as follows:"),
  );
  children.push(spacer(4));

  for (const rep of ensureProseArray(prose.investorRepresentations)) {
    children.push(bulletPoint(rep));
  }
  children.push(spacer(8));

  // Section 3: Accredited Investor Status
  children.push(sectionHeading("3. Accredited Investor Status"));
  children.push(bodyText(prose.accreditedStatusReps));
  children.push(spacer(4));

  if (is506c) {
    children.push(
      bodyText(
        "VERIFICATION REQUIREMENT (Rule 506(c)): Because this offering is made pursuant to Rule 506(c) of Regulation D, the Company is required to take reasonable steps to verify the accredited investor status of each Subscriber. The Subscriber agrees to provide one or more of the following forms of verification:",
        { bold: true },
      ),
    );
    children.push(spacer(2));
    children.push(bulletPoint("Income Verification: Tax returns (IRS Forms W-2, 1099, K-1) for the two most recent years demonstrating income in excess of $200,000 (individual) or $300,000 (joint)"));
    children.push(bulletPoint("Net Worth Verification: Bank statements, brokerage statements, and third-party appraisals demonstrating net worth in excess of $1,000,000 (excluding primary residence)"));
    children.push(bulletPoint("Professional Certification: Evidence of holding a Series 7, Series 65, or Series 82 license in good standing"));
    children.push(bulletPoint("Third-Party Verification Letter: Written confirmation from a registered broker-dealer, SEC-registered investment adviser, licensed attorney, or CPA"));
  } else {
    children.push(
      bodyText(
        "SELF-CERTIFICATION (Rule 506(b)): The Subscriber certifies that it qualifies as an \"accredited investor\" as defined in Rule 501(a) of Regulation D by checking the applicable category below:",
        { bold: true },
      ),
    );
    children.push(spacer(2));
    children.push(bulletPoint("[ ] Individual with income exceeding $200,000 ($300,000 with spouse/partner) in each of the two most recent years with reasonable expectation of same in the current year"));
    children.push(bulletPoint("[ ] Individual with net worth exceeding $1,000,000, individually or with spouse/partner (excluding primary residence)"));
    children.push(bulletPoint("[ ] Holder of Series 7, Series 65, or Series 82 license in good standing"));
    children.push(bulletPoint("[ ] Entity with total assets exceeding $5,000,000, not formed for the specific purpose of acquiring the interests"));
    children.push(bulletPoint("[ ] Entity in which all equity owners are accredited investors"));
    children.push(bulletPoint("[ ] Trust with total assets exceeding $5,000,000, directed by a sophisticated person"));
  }
  children.push(spacer(8));

  // Section 4: Capital Call Provisions
  children.push(sectionHeading("4. Capital Call Provisions"));
  children.push(bodyText(prose.capitalCallProvisions));
  children.push(spacer(8));

  // Section 5: Suitability
  children.push(sectionHeading("5. Suitability Representations"));
  children.push(bodyText(prose.suitabilityRepresentations));
  children.push(spacer(4));

  // Suitability table
  const suitabilityRows: Array<{ label: string; value: string }> = [
    { label: "Minimum Investment", value: formatCurrency(minInvestment) },
    { label: "Expected Hold Period", value: `${project.projectedHoldYears ?? 5} years` },
    { label: "Liquidity", value: "None — no secondary market, no redemption rights" },
    { label: "Risk of Loss", value: "Investor may lose entire investment" },
    { label: "Tax Character", value: "Passive activity (unless REPS qualified)" },
  ];
  children.push(keyTermsTable(suitabilityRows));
  children.push(spacer(8));

  // Section 6: Indemnification
  children.push(sectionHeading("6. Indemnification"));
  children.push(bodyText(prose.indemnification));
  children.push(spacer(8));

  // Section 7: UBTI Warning
  children.push(sectionHeading("7. Tax-Exempt Investor Notice"));
  children.push(
    bodyText(
      "NOTICE TO TAX-EXEMPT INVESTORS: If the Subscriber is investing through a tax-exempt entity (including IRAs, 401(k) plans, SEP-IRAs, or other qualified retirement accounts, endowments, or foundations), the Subscriber acknowledges that the Company's use of debt financing to acquire the Property may generate Unrelated Business Taxable Income (\"UBTI\") pursuant to 26 U.S.C. Sections 511-514. Debt-financed income from leveraged real estate is subject to UBTI tax at ordinary income rates (up to 37%). If UBTI exceeds $1,000, the tax-exempt entity must file IRS Form 990-T. The Subscriber is strongly urged to consult with its own tax advisor regarding the UBTI implications of this investment.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // Section 8: Miscellaneous
  children.push(sectionHeading("8. Miscellaneous"));
  children.push(bodyText(prose.miscellaneous));
  children.push(spacer(8));

  // Section 9: Governing Law
  children.push(sectionHeading("9. Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // Jury trial waiver (conspicuous)
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: THE SUBSCRIBER AND THE COMPANY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS SUBSCRIPTION AGREEMENT OR THE TRANSACTIONS CONTEMPLATED HEREBY. THIS WAIVER APPLIES TO ANY LITIGATION WHETHER SOUNDING IN CONTRACT, TORT, OR OTHERWISE.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // Signature blocks
  children.push(sectionHeading("Execution"));

  // Subscriber info fields
  children.push(bodyText("SUBSCRIBER INFORMATION:", { bold: true, color: COLORS.primary }));
  children.push(spacer(4));
  children.push(bodyText("Subscriber Name: ________________________________________"));
  children.push(bodyText("Address: ________________________________________"));
  children.push(bodyText("City, State, ZIP: ________________________________________"));
  children.push(bodyText("Email: ________________________________________"));
  children.push(bodyText("Phone: ________________________________________"));
  children.push(bodyText("SSN/EIN: ________________________________________"));
  children.push(bodyText(`Subscription Amount: $______________________ (minimum ${formatCurrency(minInvestment)})`));
  children.push(spacer(8));

  children.push(bodyText("SUBSCRIBER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock("[Subscriber Name]", "Subscriber"));
  children.push(spacer(16));

  children.push(bodyText("ACCEPTED BY THE COMPANY:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.sponsorName, "Manager"));

  return buildLegalDocument({
    title: "Subscription Agreement",
    headerRight: `Subscription Agreement — ${project.entityName}`,
    children,
  });
}

// ─── Compliance Checks ──────────────────────────────────────────────

export function runSubscriptionComplianceChecks(project: SyndicationProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const is506c = project.exemptionType === "REG_D_506C";

  checks.push({
    name: "Securities Exemption Type",
    regulation: "SEC Regulation D, Rule 506",
    category: "securities",
    passed: !!project.exemptionType,
    note: project.exemptionType
      ? `Offering under ${project.exemptionType.replace("_", " ")}`
      : "No exemption type — cannot determine accreditation requirements",
  });

  checks.push({
    name: "Minimum Investment Specified",
    regulation: "Investor Protection Standards",
    category: "investor_protection",
    passed: safeNumber(project.minInvestment) > 0,
    note: project.minInvestment
      ? `Minimum: ${formatCurrency(safeNumber(project.minInvestment))}`
      : "No minimum investment — subscription amount unclear",
  });

  if (is506c) {
    checks.push({
      name: "506(c) Verification Methods Included",
      regulation: "SEC Rule 506(c)(2)(ii)",
      category: "securities",
      passed: project.exemptionType !== "REG_D_506C", // Only require for 506(c)
      note: project.exemptionType === "REG_D_506C"
        ? "Rule 506(c) requires verification of accredited investor status via one of four safe harbor methods per 17 CFR 230.506(c)(2)(ii): (A) income verification, (B) net worth verification, (C) professional certification, or (D) third-party letter. Verify all methods are documented."
        : "Rule 506(b) — self-certification acceptable",
    });
  }

  checks.push({
    name: "Illiquidity Disclosure",
    regulation: "Anti-Fraud Provisions",
    category: "investor_protection",
    passed: true,
    note: "Subscription agreement discloses no secondary market and no redemption rights",
  });

  checks.push({
    name: "UBTI Warning for Tax-Exempt Investors",
    regulation: "26 U.S.C. Sections 511-514",
    category: "tax",
    passed: true,
    note: "UBTI warning included for leveraged real estate — Form 990-T filing requirement disclosed",
  });

  checks.push({
    name: "Hold Period Disclosure",
    regulation: "Suitability Standards",
    category: "investor_protection",
    passed: !!project.projectedHoldYears,
    note: project.projectedHoldYears
      ? `Projected hold: ${project.projectedHoldYears} years — investor must be able to hold for full period`
      : "No hold period specified — investor cannot assess suitability",
  });

  return checks;
}
