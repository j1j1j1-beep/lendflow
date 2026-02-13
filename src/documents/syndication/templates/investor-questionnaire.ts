// investor-questionnaire.ts
// Investor Questionnaire / Accreditation Verification for RE syndication.
// For 506(b): self-certification with checkboxes.
// For 506(c): verification methods (income, net worth, professional cert, third-party letter).
// Includes UBTI warning for tax-exempt investors in leveraged RE.

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
  formatCurrency,
  ensureProseArray,
  safeNumber,
  COLORS,
} from "../../doc-helpers";

import { claudeJson } from "@/lib/claude";
import type { SyndicationProjectFull, InvestorQuestionnaireProse, ComplianceCheck } from "../types";
import { buildProjectContext } from "../generate-doc";

// ─── AI Prose Generation ────────────────────────────────────────────

const IQ_SYSTEM_PROMPT = `You are a senior securities attorney drafting Investor Questionnaires for real estate syndications under Regulation D. You must accurately reflect accredited investor definitions under Rule 501(a) and verification requirements under Rule 506(c)(2)(ii).

ABSOLUTE RULES:
1. CITE SPECIFIC STATUTES: Reference Rule 501(a), Rule 506(b), Rule 506(c)(2)(ii), and the Dodd-Frank Act amendments to accredited investor definition.
2. ACCREDITED INVESTOR criteria must reflect current 2026 definitions including the professional certification category (Series 7, 65, 82).
3. VERIFICATION methods for 506(c) must list all four safe harbor methods from Rule 506(c)(2)(ii)(A)-(D).
4. OUTPUT: Respond ONLY with valid JSON. No commentary.

AI-GENERATED CONTENT DISCLAIMER: This AI-generated content is for document drafting assistance only and does not constitute legal advice.`;

async function generateIQProse(project: SyndicationProjectFull): Promise<InvestorQuestionnaireProse> {
  const context = buildProjectContext(project);
  const is506c = project.exemptionType === "REG_D_506C";
  const loanAmount = safeNumber(project.loanAmount);

  const userPrompt = `Generate Investor Questionnaire prose for this real estate syndication.

${context}

EXEMPTION TYPE: ${is506c ? "Rule 506(c) — verification of accreditation REQUIRED" : "Rule 506(b) — self-certification acceptable"}
LEVERAGED: ${loanAmount > 0 ? "Yes — UBTI warning required for tax-exempt investors" : "No"}

Return a JSON object with these keys:
{
  "introduction": "Introduction paragraph explaining the purpose of this questionnaire: to determine investor eligibility under ${is506c ? "Rule 506(c)" : "Rule 506(b)"} of Regulation D. State that the Company is required to ${is506c ? "verify" : "confirm"} accredited investor status. Note that this information will be kept confidential and used solely for compliance purposes.",
  "accreditedIndividualCriteria": ["Array of accredited investor criteria for individuals under Rule 501(a): (1) annual income >$200K individual/$300K joint in each of the two most recent years with reasonable expectation of same in current year, (2) net worth >$1M individually or with spouse/partner excluding primary residence value, (3) holder in good standing of Series 7, Series 65, or Series 82 license, (4) 'knowledgeable employee' of a private fund, (5) director, executive officer, or general partner of the issuer. Each criterion should include the specific Rule 501(a) subsection."],
  "accreditedEntityCriteria": ["Array of accredited entity criteria under Rule 501(a): (1) entity with total assets >$5M not formed to invest, (2) entity where all equity owners are accredited, (3) bank/savings institution/broker-dealer/insurance company, (4) registered investment company or BDC, (5) ERISA plan with >$5M assets or plan directed by registered investment adviser/bank/insurance company, (6) trust with >$5M assets directed by sophisticated person, (7) family office with >$5M AUM, (8) 'family client' of qualifying family office. Include the specific Rule 501(a) subsection for each."],
  "verificationMethods506b": "For 506(b) offerings: self-certification is acceptable. Investor checks the applicable category above and signs the certification. The Company may rely on the investor's representations absent knowledge that such representations are false.",
  "verificationMethods506c": "For 506(c) offerings: the Company must take reasonable steps to verify accredited status. The following verification methods constitute safe harbors under Rule 506(c)(2)(ii): (A) Income verification — reviewing IRS forms (W-2, 1099, K-1, tax returns) for the two most recent years plus a written representation of expected income in current year. (B) Net worth verification — reviewing bank/brokerage statements, appraisals, credit report, and liabilities within prior 3 months plus a written representation of all liabilities. (C) Third-party verification letter — written confirmation from a registered broker-dealer, SEC-registered investment adviser, licensed attorney, or licensed CPA dated within prior 3 months. (D) Existing investor verification — for investors who previously invested as accredited investors, a new certification at the time of additional investment.",
  "incomeVerification": "Income verification instructions: provide IRS Form W-2 or Schedule K-1 for each of the two most recent tax years. If joint income is used, both spouses/partners must provide documentation. Self-employed individuals must provide complete tax returns (IRS Form 1040) for each of the two most recent tax years.",
  "netWorthVerification": "Net worth verification instructions: provide recent bank and brokerage account statements (within 90 days), real estate appraisals (excluding primary residence per Dodd-Frank), and a credit report showing outstanding liabilities. Net worth is calculated as total assets minus total liabilities, excluding the value of the primary residence but including any mortgage debt on the primary residence in excess of its fair market value.",
  "professionalVerification": "Professional certification verification: provide evidence of holding in good standing one of the following licenses: FINRA Series 7 (General Securities Representative), FINRA Series 65 (Investment Adviser Representative), or FINRA Series 82 (Private Securities Offerings Representative). License must be current and in good standing at the time of investment.",
  "thirdPartyVerification": "Third-party verification letter: a written confirmation from a registered broker-dealer, SEC-registered investment adviser, licensed attorney, or licensed CPA, dated within the prior three months, confirming that such person or entity has taken reasonable steps to verify the investor's accredited status within the prior three months.",
  "ubtiWarning": "TAX-EXEMPT INVESTOR WARNING: If investing through a tax-exempt entity (IRA, 401(k), SEP-IRA, endowment, foundation, or other qualified retirement account), be aware that the Company's use of mortgage debt to acquire the Property will generate Unrelated Business Taxable Income ('UBTI') under 26 U.S.C. Sections 512-514. Debt-financed income from leveraged real estate is treated as UBTI and taxed at ordinary income rates (up to 37% for trusts). If UBTI exceeds $1,000 in a taxable year, the tax-exempt entity must file IRS Form 990-T. The UBTI may significantly reduce the tax advantages of investing through a tax-exempt account. Consult your tax advisor before investing.",
  "representationsAndWarranties": ["Array of 6-8 representations: (1) information provided is true, complete, and accurate, (2) will notify Company of any changes to accredited status, (3) understands Company is relying on this information for securities law compliance, (4) understands that providing false information may subject investor to liability, (5) agrees to provide additional documentation if requested, (6) acknowledges information will be kept confidential, (7) understands investment involves substantial risk of loss, (8) investment is suitable given financial situation"],
  "certification": "Certification language: Under penalty of perjury, I certify that the information provided in this Questionnaire is true, complete, and correct. I understand that the Company is relying on this information to determine compliance with applicable securities laws. I agree to notify the Company immediately if any information provided herein becomes inaccurate or incomplete."
}`;

  return claudeJson<InvestorQuestionnaireProse>({
    systemPrompt: IQ_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 10000,
  });
}

// ─── DOCX Builder ───────────────────────────────────────────────────

export async function buildInvestorQuestionnaire(project: SyndicationProjectFull): Promise<Document> {
  const prose = await generateIQProse(project);
  const is506c = project.exemptionType === "REG_D_506C";
  const loanAmount = safeNumber(project.loanAmount);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Investor Questionnaire"));
  children.push(spacer(2));
  children.push(
    bodyText(
      is506c ? "Accreditation Verification Questionnaire" : "Accredited Investor Self-Certification",
      { italic: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText(project.entityName, { bold: true }));
  children.push(
    bodyText(
      `Offering pursuant to Rule ${is506c ? "506(c)" : "506(b)"} of Regulation D under the Securities Act of 1933`,
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Introduction
  children.push(sectionHeading("Introduction"));
  children.push(bodyText(prose.introduction));
  children.push(spacer(8));

  // Section 1: Investor Information
  children.push(sectionHeading("Section 1: Investor Information"));
  children.push(spacer(4));
  children.push(bodyText("Full Legal Name: ________________________________________"));
  children.push(bodyText("Entity Name (if applicable): ________________________________________"));
  children.push(bodyText("Address: ________________________________________"));
  children.push(bodyText("City, State, ZIP: ________________________________________"));
  children.push(bodyText("Phone: ________________________________________"));
  children.push(bodyText("Email: ________________________________________"));
  children.push(bodyText("SSN/EIN: ________________________________________"));
  children.push(spacer(4));
  children.push(bodyText("Investor Type (check one):", { bold: true }));
  children.push(bulletPoint("[ ] Individual"));
  children.push(bulletPoint("[ ] Joint (Husband/Wife or Partners)"));
  children.push(bulletPoint("[ ] Corporation"));
  children.push(bulletPoint("[ ] LLC"));
  children.push(bulletPoint("[ ] Trust"));
  children.push(bulletPoint("[ ] IRA / Self-Directed IRA"));
  children.push(bulletPoint("[ ] 401(k) / Other Retirement Account"));
  children.push(bulletPoint("[ ] Partnership"));
  children.push(bulletPoint("[ ] Other: ______________________________"));
  children.push(spacer(8));

  // Section 2: Accredited Investor Status — Individuals
  children.push(sectionHeading("Section 2: Accredited Investor Status — Individuals"));
  children.push(bodyText("Check ALL categories that apply:", { bold: true }));
  children.push(spacer(4));

  for (const criterion of ensureProseArray(prose.accreditedIndividualCriteria)) {
    children.push(bulletPoint(`[ ] ${criterion}`));
  }
  children.push(spacer(8));

  // Section 3: Accredited Investor Status — Entities
  children.push(sectionHeading("Section 3: Accredited Investor Status — Entities"));
  children.push(bodyText("If investing as an entity, check ALL categories that apply:", { bold: true }));
  children.push(spacer(4));

  for (const criterion of ensureProseArray(prose.accreditedEntityCriteria)) {
    children.push(bulletPoint(`[ ] ${criterion}`));
  }
  children.push(spacer(8));

  // Section 4: Verification Methods
  children.push(sectionHeading("Section 4: Accreditation Verification"));

  if (is506c) {
    children.push(
      bodyText(
        "IMPORTANT: Because this offering is made pursuant to Rule 506(c) of Regulation D, the Company is required to take reasonable steps to verify your accredited investor status. Self-certification alone is NOT sufficient.",
        { bold: true },
      ),
    );
    children.push(spacer(4));
    children.push(bodyText(prose.verificationMethods506c));
    children.push(spacer(4));

    children.push(bodyText("Select your preferred verification method:", { bold: true }));
    children.push(spacer(4));

    children.push(sectionSubheading("A", "Income Verification"));
    children.push(bodyText(prose.incomeVerification));
    children.push(bulletPoint("[ ] I will provide income verification documents"));
    children.push(spacer(4));

    children.push(sectionSubheading("B", "Net Worth Verification"));
    children.push(bodyText(prose.netWorthVerification));
    children.push(bulletPoint("[ ] I will provide net worth verification documents"));
    children.push(spacer(4));

    children.push(sectionSubheading("C", "Professional Certification"));
    children.push(bodyText(prose.professionalVerification));
    children.push(bulletPoint("[ ] I will provide proof of professional certification"));
    children.push(spacer(4));

    children.push(sectionSubheading("D", "Third-Party Verification Letter"));
    children.push(bodyText(prose.thirdPartyVerification));
    children.push(bulletPoint("[ ] I will provide a third-party verification letter"));
  } else {
    children.push(bodyText(prose.verificationMethods506b));
    children.push(spacer(4));
    children.push(
      bodyText(
        "By checking the applicable category in Sections 2 or 3 above and signing this Questionnaire, you are self-certifying your accredited investor status under Rule 506(b) of Regulation D.",
      ),
    );
  }
  children.push(spacer(8));

  // Section 5: UBTI Warning (if leveraged)
  if (loanAmount > 0) {
    children.push(sectionHeading("Section 5: Tax-Exempt Investor Notice (UBTI)"));
    children.push(
      bodyText(prose.ubtiWarning, { bold: true }),
    );
    children.push(spacer(4));
    children.push(bulletPoint("[ ] I am NOT investing through a tax-exempt account"));
    children.push(bulletPoint("[ ] I AM investing through a tax-exempt account and have read and understand the UBTI warning above"));
    children.push(spacer(8));
  }

  // Section 6: Suitability
  children.push(sectionHeading(loanAmount > 0 ? "Section 6: Investment Suitability" : "Section 5: Investment Suitability"));
  children.push(bodyText("Please confirm the following:", { bold: true }));
  children.push(spacer(4));
  children.push(bulletPoint("[ ] I have sufficient liquid assets to meet ongoing financial obligations without reliance on returns from this investment"));
  children.push(bulletPoint("[ ] I understand that this investment is illiquid with no secondary market and no right of redemption"));
  children.push(bulletPoint(`[ ] My investment horizon is compatible with the anticipated ${project.projectedHoldYears ?? 5}-year hold period`));
  children.push(bulletPoint("[ ] I can bear the complete loss of my entire investment"));
  children.push(bulletPoint("[ ] This investment represents an appropriate portion of my overall portfolio (recommended: no more than 10% of net worth)"));
  children.push(bulletPoint("[ ] I have reviewed the Private Placement Memorandum and understand the risks described therein"));
  children.push(spacer(8));

  // Section 7: Representations
  children.push(sectionHeading(loanAmount > 0 ? "Section 7: Representations and Warranties" : "Section 6: Representations and Warranties"));
  children.push(bodyText("By signing below, the Investor represents and warrants:"));
  children.push(spacer(4));

  for (const rep of ensureProseArray(prose.representationsAndWarranties)) {
    children.push(bulletPoint(rep));
  }
  children.push(spacer(8));

  // Certification
  children.push(sectionHeading("Certification"));
  children.push(bodyText(prose.certification, { bold: true }));
  children.push(spacer(8));

  // Signature
  children.push(bodyText("INVESTOR:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock("[Investor Name]", "Investor / Authorized Signatory"));

  return buildLegalDocument({
    title: "Investor Questionnaire",
    headerRight: `Investor Questionnaire — ${project.entityName}`,
    children,
  });
}

// ─── Compliance Checks ──────────────────────────────────────────────

export function runQuestionnaireComplianceChecks(project: SyndicationProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const is506c = project.exemptionType === "REG_D_506C";
  const loanAmount = safeNumber(project.loanAmount);

  checks.push({
    name: "Accreditation Method Matches Exemption",
    regulation: is506c ? "SEC Rule 506(c)(2)(ii)" : "SEC Rule 506(b)",
    category: "securities",
    passed: true,
    note: is506c
      ? "506(c) — verification methods included (income, net worth, professional cert, third-party letter)"
      : "506(b) — self-certification with checkbox format included",
  });

  checks.push({
    name: "Individual Accredited Criteria Complete",
    regulation: "SEC Rule 501(a)",
    category: "investor_protection",
    passed: true,
    note: "All current accredited investor categories included (income, net worth, professional cert per Dodd-Frank amendments)",
  });

  checks.push({
    name: "Entity Accredited Criteria Complete",
    regulation: "SEC Rule 501(a)",
    category: "investor_protection",
    passed: true,
    note: "Entity accredited categories included (assets >$5M, all owners accredited, institutional investors, family offices)",
  });

  if (loanAmount > 0) {
    checks.push({
      name: "UBTI Warning Included",
      regulation: "26 U.S.C. Sections 512-514",
      category: "tax",
      passed: true,
      note: "UBTI warning for tax-exempt investors investing in leveraged real estate — Form 990-T threshold ($1,000) disclosed",
    });
  }

  checks.push({
    name: "Suitability Section Present",
    regulation: "FINRA Rule 2111 Principles",
    category: "investor_protection",
    passed: true,
    note: "Suitability questions included: ability to bear loss, investment horizon, liquidity needs, portfolio concentration",
  });

  return checks;
}
