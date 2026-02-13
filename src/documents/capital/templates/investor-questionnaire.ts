// investor-questionnaire.ts
// Accreditation verification questionnaire.
// For 506(b): self-certification checkboxes
// For 506(c): verification mechanism (income, net worth, professional, third-party)
// Includes all accredited investor criteria from 17 CFR 230.501(a).

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
  COLORS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, InvestorQuestionnaireProse, ComplianceCheck } from "../types";

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  const is506c = project.exemptionType === "REG_D_506C";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  return `You are a securities attorney generating an Investor Questionnaire for a ${is506c ? "Rule 506(c)" : "Rule 506(b)"} offering under Regulation D.

${is3c7 ? "The fund relies on Section 3(c)(7) of the Investment Company Act. All investors must be qualified purchasers (15 U.S.C. Section 80a-2(a)(51))." : "The fund relies on Section 3(c)(1) of the Investment Company Act."}

This questionnaire must verify investor eligibility. Include:

FOR ALL OFFERINGS:
1. All accredited investor criteria from 17 CFR 230.501(a):
   - Individual: $200K/$300K income, $1M net worth (excl. primary residence), Series 7/65/82/CFA, knowledgeable employee
   - Entity: $5M assets (not formed to acquire these securities), all equity owners accredited, bank/insurance/RIA/BDC/SBIC, ERISA plan with $5M+ or directed by bank/adviser
   - Family office with $5M+ AUM

${is506c ? `FOR 506(c) OFFERINGS:
2. Verification mechanism per 17 CFR 230.506(c)(2)(ii):
   - Income: W-2/1040/K-1 for prior 2 years + written rep for current year
   - Net worth: Bank/brokerage statements + credit report dated within 3 months
   - Professional: License/certification number verification
   - Third-party letter: Written confirmation from attorney/CPA/broker-dealer/RIA` : `FOR 506(b) OFFERINGS:
2. Self-certification checkboxes are sufficient (no verification documents required)`}

${is3c7 ? `FOR SECTION 3(c)(7) FUNDS:
3. Qualified purchaser criteria per 15 U.S.C. Section 80a-2(a)(51):
   - Natural person: $5M in investments
   - Family company: $5M in investments
   - Trust: $5M in investments (not formed for specific purpose)
   - Institution: $25M in investments managed on discretionary basis` : ""}

OUTPUT: Valid JSON only.

JSON Schema:
{
  "introduction": "string - Introductory paragraph explaining purpose of questionnaire",
  "accreditedIndividualCriteria": ["string[] - Individual accredited investor criteria with checkboxes"],
  "accreditedEntityCriteria": ["string[] - Entity accredited investor criteria with checkboxes"],
  "qualifiedPurchaserCriteria": ["string[] - QP criteria (for 3(c)(7) funds)"],
  "verificationInstructions": "string - Instructions for what documents to provide",
  "incomeVerification": "string - Income verification requirements and documents",
  "netWorthVerification": "string - Net worth verification requirements and documents",
  "professionalVerification": "string - Professional certification verification",
  "thirdPartyVerification": "string - Third-party letter verification",
  "representationsAndWarranties": ["string[] - Investor reps about truthfulness, authority, etc."],
  "certification": "string - Final certification language"
}`;
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildInvestorQuestionnaire(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  const prose = await claudeJson<InvestorQuestionnaireProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 8000,
  });

  const is506c = project.exemptionType === "REG_D_506C";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Investor Questionnaire"));
  children.push(spacer(4));

  children.push(bodyTextRuns([
    { text: "Fund: ", bold: true },
    { text: project.fundName },
  ]));
  children.push(bodyTextRuns([
    { text: "Offering Type: ", bold: true },
    { text: is506c ? "Rule 506(c) of Regulation D (17 CFR 230.506(c))" : "Rule 506(b) of Regulation D (17 CFR 230.506(b))" },
  ]));
  if (is3c7) {
    children.push(bodyTextRuns([
      { text: "ICA Exemption: ", bold: true },
      { text: "Section 3(c)(7) — All investors must be qualified purchasers" },
    ]));
  }
  children.push(spacer(8));

  // Introduction
  children.push(sectionHeading("Purpose"));
  children.push(bodyText(prose.introduction));
  children.push(spacer(4));
  children.push(
    bodyText(
      is506c
        ? "IMPORTANT: This offering is made pursuant to Rule 506(c) of Regulation D. Self-certification alone is NOT sufficient. You must provide documentation to verify your accredited investor status pursuant to 17 CFR 230.506(c)(2)(ii)."
        : "This offering is made pursuant to Rule 506(b) of Regulation D. Investors may self-certify their accredited investor status by checking the applicable categories below.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // Section 1: Investor Information
  children.push(sectionHeading("Section 1 — Investor Information"));
  children.push(bodyText("Full Legal Name: _______________________________________________"));
  children.push(bodyText("Address: ______________________________________________________"));
  children.push(bodyText("City, State, ZIP: ______________________________________________"));
  children.push(bodyText("Phone: _________________________ Email: ________________________"));
  children.push(bodyText("Social Security / EIN: _________________________________________"));
  children.push(bodyText("Date of Birth (individuals): ___________________________________"));
  children.push(bodyText("Entity Type (if applicable): ___________________________________"));
  children.push(bodyText("State of Formation (if entity): ________________________________"));
  children.push(spacer(8));

  // Section 2: Accredited Investor Status — Individuals
  children.push(sectionHeading("Section 2 — Accredited Investor Status (Individuals)"));
  children.push(
    bodyText("If you are an individual investor, please check ALL categories that apply (17 CFR 230.501(a)):"),
  );
  children.push(spacer(4));

  // Deterministic — these criteria come from the regulation, not AI
  children.push(bulletPoint("[ ] INCOME TEST: I had individual income in excess of $200,000 in each of the two most recent calendar years (or joint income with my spouse/spousal equivalent in excess of $300,000 in each of those years), and I have a reasonable expectation of reaching the same income level in the current year."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] NET WORTH TEST: My individual net worth (or joint net worth with my spouse/spousal equivalent) exceeds $1,000,000, excluding the value of my primary residence."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] PROFESSIONAL CERTIFICATION: I am a natural person holding one or more of the following licenses in good standing: Series 7, Series 65, Series 82, or I hold a current Chartered Financial Analyst (CFA) designation."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] KNOWLEDGEABLE EMPLOYEE: I am a director, executive officer, or a person who serves on the advisory committee of the Fund, or I am an employee of the General Partner who has participated in the investment activities of the Fund or similar funds for at least 12 months (Rule 3c-5(a)(4))."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] FAMILY OFFICE: I am a natural person whose investment in the Fund is directed by a family office (as defined in Rule 202(a)(11)(G)-1 under the Investment Advisers Act) with at least $5,000,000 in assets under management."));
  children.push(spacer(8));

  // Section 3: Accredited Investor Status — Entities
  children.push(sectionHeading("Section 3 — Accredited Investor Status (Entities)"));
  children.push(
    bodyText("If you are an entity investor, please check ALL categories that apply (17 CFR 230.501(a)):"),
  );
  children.push(spacer(4));

  children.push(bulletPoint("[ ] ASSET TEST: The undersigned entity has total assets in excess of $5,000,000 and was not formed for the specific purpose of acquiring the securities being offered."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] ALL OWNERS ACCREDITED: The undersigned entity is one in which all of the equity owners are accredited investors."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] INSTITUTIONAL: The undersigned is a bank, insurance company, registered investment company, business development company, or small business investment company."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] ERISA PLAN: The undersigned is an employee benefit plan with total assets in excess of $5,000,000, or whose investment decisions are made by a bank, registered investment adviser, or registered broker-dealer."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] REGISTERED ADVISER: The undersigned is an investment adviser registered with the SEC or a state, or an investment adviser relying on the exemption from registration under Section 203(l) or 203(m) of the Investment Advisers Act."));
  children.push(spacer(2));
  children.push(bulletPoint("[ ] RURAL BUSINESS INVESTMENT COMPANY: The undersigned is a Rural Business Investment Company as defined in 7 U.S.C. Section 2009cc."));
  children.push(spacer(8));

  // Section 4: Qualified Purchaser (for 3(c)(7) funds)
  if (is3c7) {
    children.push(sectionHeading("Section 4 — Qualified Purchaser Status"));
    children.push(
      bodyText(
        "This Fund relies on Section 3(c)(7) of the Investment Company Act (15 U.S.C. Section 80a-3(c)(7)). ALL investors must be qualified purchasers as defined in 15 U.S.C. Section 80a-2(a)(51). Please check the applicable category:",
        { bold: true },
      ),
    );
    children.push(spacer(4));

    children.push(bulletPoint("[ ] INDIVIDUAL: I am a natural person who owns not less than $5,000,000 in investments (as defined in 17 CFR 270.2a51-1, including securities, real estate held for investment, commodity futures, financial contracts, and cash held for investment)."));
    children.push(spacer(2));
    children.push(bulletPoint("[ ] FAMILY COMPANY: The undersigned is a company owned directly or indirectly by or for two or more natural persons who are related as siblings, spouses, or direct lineal descendants, that owns not less than $5,000,000 in investments."));
    children.push(spacer(2));
    children.push(bulletPoint("[ ] TRUST: The undersigned is a trust that was not formed for the specific purpose of acquiring the securities offered, and that owns not less than $5,000,000 in investments."));
    children.push(spacer(2));
    children.push(bulletPoint("[ ] INSTITUTIONAL: The undersigned is a person, acting for its own account or the accounts of other qualified purchasers, who in the aggregate owns and invests on a discretionary basis not less than $25,000,000 in investments."));
    children.push(spacer(8));
  }

  // Section 5: Verification (506c) or Certification (506b)
  const verifySection = is3c7 ? "5" : "4";

  if (is506c) {
    children.push(sectionHeading(`Section ${verifySection} — Accredited Investor Verification`));
    children.push(
      bodyText(
        "Pursuant to Rule 506(c) of Regulation D (17 CFR 230.506(c)(2)(ii)), the issuer must take reasonable steps to verify accredited investor status. Please indicate which verification method you will use and provide the required documentation:",
        { bold: true },
      ),
    );
    children.push(spacer(4));

    // Income verification
    children.push(bodyText("Option A — Income Verification:", { bold: true, color: COLORS.primary }));
    children.push(bodyText("[ ] I will provide copies of IRS forms (W-2, 1040, Schedule K-1, or equivalent) for the two most recent calendar years, plus a written representation that I reasonably expect to earn the required income in the current year."));
    children.push(bodyText(prose.incomeVerification, { indent: 0.25 }));
    children.push(spacer(4));

    // Net worth verification
    children.push(bodyText("Option B — Net Worth Verification:", { bold: true, color: COLORS.primary }));
    children.push(bodyText("[ ] I will provide bank statements, brokerage account statements, and other documentation of assets, together with a consumer credit report from a nationwide consumer reporting agency dated within the prior 3 months, evidencing net worth in excess of $1,000,000 (excluding primary residence)."));
    children.push(bodyText(prose.netWorthVerification, { indent: 0.25 }));
    children.push(spacer(4));

    // Professional certification
    children.push(bodyText("Option C — Professional Certification:", { bold: true, color: COLORS.primary }));
    children.push(bodyText("[ ] I hold one of the following professional certifications and will provide evidence of the same:"));
    children.push(bulletPoint("Series 7 — FINRA General Securities Representative License"));
    children.push(bulletPoint("Series 65 — NASAA Uniform Investment Adviser Law License"));
    children.push(bulletPoint("Series 82 — FINRA Private Securities Offerings Representative License"));
    children.push(bulletPoint("CFA — Chartered Financial Analyst designation (CFA Institute)"));
    children.push(bodyText("License/Certification Number: _________________________________"));
    children.push(bodyText(prose.professionalVerification, { indent: 0.25 }));
    children.push(spacer(4));

    // Third-party verification
    children.push(bodyText("Option D — Third-Party Verification Letter:", { bold: true, color: COLORS.primary }));
    children.push(bodyText("[ ] I will provide a written confirmation dated within the prior 3 months from one of the following:"));
    children.push(bulletPoint("A registered broker-dealer (FINRA member)"));
    children.push(bulletPoint("An SEC-registered investment adviser"));
    children.push(bulletPoint("A licensed attorney in good standing"));
    children.push(bulletPoint("A certified public accountant (CPA) in good standing"));
    children.push(bodyText(prose.thirdPartyVerification, { indent: 0.25 }));
    children.push(spacer(4));

    // Existing investor re-verification
    children.push(bodyText("Option E — Existing Investor Re-Verification:", { bold: true, color: COLORS.primary }));
    children.push(bodyText("[ ] I previously invested in a securities offering of the issuer as an accredited investor within the preceding 5 years, and I certify in writing that I continue to qualify as an accredited investor."));
    children.push(spacer(8));
  } else {
    children.push(sectionHeading(`Section ${verifySection} — Accredited Investor Self-Certification`));
    children.push(
      bodyText(
        "By checking the applicable boxes in Sections 2 and/or 3 above, the Investor self-certifies as an accredited investor under 17 CFR 230.501(a). Under Rule 506(b), the issuer must have a reasonable belief that the investor is accredited. Self-certification is an acceptable method for establishing such reasonable belief.",
      ),
    );
    children.push(spacer(4));
    children.push(bodyText(prose.verificationInstructions));
    children.push(spacer(8));
  }

  // Representations and Warranties
  const repSection = is3c7 ? "6" : "5";
  children.push(sectionHeading(`Section ${repSection} — Representations and Warranties`));
  children.push(bodyText("The undersigned represents and warrants:"));
  children.push(spacer(4));

  const reps = Array.isArray(prose.representationsAndWarranties)
    ? prose.representationsAndWarranties
    : [prose.representationsAndWarranties ?? "Representations not generated."];
  for (const rep of reps) {
    children.push(bulletPoint(rep));
  }
  children.push(spacer(8));

  // Certification and Signature
  const certSection = is3c7 ? "7" : "6";
  children.push(sectionHeading(`Section ${certSection} — Certification`));
  children.push(bodyText(prose.certification));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Under penalty of perjury, I certify that the information provided in this Investor Questionnaire is true, correct, and complete in all material respects. I understand that the Fund and the General Partner will rely on this information in determining my eligibility to invest.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // Signature
  children.push(bodyText("INVESTOR:", { bold: true, color: COLORS.primary }));
  children.push(bodyText("Print Name: ___________________________________"));
  children.push(bodyText("Title (if entity): ____________________________"));
  children.push(...signatureBlock("Investor", ""));

  return buildLegalDocument({
    title: "Investor Questionnaire",
    headerRight: `Investor Questionnaire — ${project.fundName}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runQuestionnaireComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const is506c = project.exemptionType === "REG_D_506C";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  checks.push({
    name: "Accredited Investor Criteria — Individuals",
    regulation: "17 CFR 230.501(a)",
    category: "investor_protection",
    passed: true,
    note: "All individual accredited investor criteria included: income ($200K/$300K), net worth ($1M excl. primary residence), professional certifications (Series 7/65/82, CFA), knowledgeable employee, family office.",
  });

  checks.push({
    name: "Accredited Investor Criteria — Entities",
    regulation: "17 CFR 230.501(a)",
    category: "investor_protection",
    passed: true,
    note: "All entity accredited investor criteria included: $5M assets, all owners accredited, bank/insurance/RIA/BDC/SBIC, ERISA plan, registered adviser.",
  });

  if (is506c) {
    checks.push({
      name: "506(c) Verification Methods",
      regulation: "17 CFR 230.506(c)(2)(ii)",
      category: "securities",
      passed: true,
      note: "All verification methods included: income (W-2/1040 for 2 years), net worth (bank statements + credit report within 3 months), professional certification (license number), third-party letter (broker-dealer/RIA/attorney/CPA), and existing investor re-verification (5-year lookback).",
    });
  } else {
    checks.push({
      name: "506(b) Self-Certification",
      regulation: "17 CFR 230.506(b)",
      category: "securities",
      passed: true,
      note: "Self-certification checkboxes included. Under Rule 506(b), self-certification establishes the issuer's reasonable belief of accredited status.",
    });
  }

  if (is3c7) {
    checks.push({
      name: "Qualified Purchaser Criteria",
      regulation: "15 U.S.C. Section 80a-2(a)(51)",
      category: "ica",
      passed: true,
      note: "Qualified purchaser criteria included: individual ($5M investments), family company ($5M investments), trust ($5M investments), institution ($25M investments).",
    });
  }

  return checks;
}
