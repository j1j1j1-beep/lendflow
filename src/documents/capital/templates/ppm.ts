// ppm.ts
// Private Placement Memorandum — the most important capital raising document.
// AI generates prose for risk factors, legal language, and representations.
// All financial terms (fees, commitments, hurdles) come from project data.

import {
  Document,
  Paragraph,
  Table,
  TextRun,
  AlignmentType,
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
  formatPercent,
  safeNumber,
  ensureProseArray,
  COLORS,
  FONTS,
} from "../../doc-helpers";
import { claudeJson } from "@/lib/claude";
import { buildProjectContext } from "../generate-doc";
import type { CapitalProjectFull, PPMProse, ComplianceCheck } from "../types";

// ─── SEC Legend ───────────────────────────────────────────────────────

const SEC_LEGEND = `THESE SECURITIES HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR THE SECURITIES LAWS OF ANY STATE OR OTHER JURISDICTION. THESE SECURITIES ARE BEING OFFERED AND SOLD IN RELIANCE ON EXEMPTIONS FROM THE REGISTRATION REQUIREMENTS OF THE SECURITIES ACT AND SUCH STATE LAWS. THESE SECURITIES MAY NOT BE SOLD, TRANSFERRED, PLEDGED, OR HYPOTHECATED EXCEPT IN A TRANSACTION THAT IS EXEMPT FROM, OR NOT SUBJECT TO, THE REGISTRATION REQUIREMENTS OF THE SECURITIES ACT AND APPLICABLE STATE SECURITIES LAWS.`;

const SEC_LEGEND_506B_ADDENDUM = `This offering is being made pursuant to Rule 506(b) of Regulation D under the Securities Act. No general solicitation or general advertising has been or will be used in connection with this offering. Each investor must represent that they are acquiring the securities for their own account, for investment, and not with a view to any distribution thereof.`;

const SEC_LEGEND_506C_ADDENDUM = `This offering is being made pursuant to Rule 506(c) of Regulation D under the Securities Act. General solicitation may be used in connection with this offering. All purchasers must be accredited investors, and the issuer must take reasonable steps to verify the accredited investor status of each purchaser pursuant to 17 CFR 230.506(c)(2)(ii).`;

// ─── AI System Prompt ────────────────────────────────────────────────

function buildSystemPrompt(project: CapitalProjectFull): string {
  const exemptionLabel = project.exemptionType === "REG_D_506C"
    ? "Rule 506(c) of Regulation D (17 CFR 230.506(c))"
    : "Rule 506(b) of Regulation D (17 CFR 230.506(b))";

  const icaLabel = project.icaExemption === "SECTION_3C7"
    ? "Section 3(c)(7) of the Investment Company Act (15 U.S.C. Section 80a-3(c)(7))"
    : "Section 3(c)(1) of the Investment Company Act (15 U.S.C. Section 80a-3(c)(1))";

  return `You are a securities attorney generating a Private Placement Memorandum for a ${exemptionLabel} offering. The fund relies on ${icaLabel} for exclusion from the Investment Company Act of 1940.

ABSOLUTE RULES:
1. NUMBERS ARE SACRED: Use the EXACT dollar amounts, percentages, fee rates, terms, and investor counts provided in the project data. Never round, approximate, or invent any number.
2. CITE SPECIFIC STATUTES: Reference 17 CFR 230.501(a) for accredited investor definitions (note: income test is $200K individual or $300K joint with spouse or spousal equivalent per 2020 amendments to Rule 501(a)(6)), 17 CFR 230.502(d) for the SEC legend, Rule 10b-5 (17 CFR 240.10b-5) for anti-fraud, Section 17(a) (15 U.S.C. Section 77q(a)) for securities fraud.
3. COMPLETE PROVISIONS: Write production-ready legal language. Every section must be a complete, standalone legal provision that would survive judicial scrutiny.
4. RISK FACTORS: Must be specific to this fund type (${project.fundType}) and include: market risk, illiquidity, loss of capital, concentration risk, leverage risk, regulatory risk, tax risk, key person risk, and conflicts of interest.
5. TAX CONSIDERATIONS: Address partnership taxation (26 U.S.C. Section 701 et seq.), UBTI concerns for tax-exempt investors (26 U.S.C. Section 511-514), FIRPTA for non-US investors (26 U.S.C. Section 1445), state tax nexus, and carried interest taxation under IRC Section 1061 (TCJA 2017) — specifically note the 3-year holding period requirement for carried interest to qualify for long-term capital gains treatment.
6. ERISA: Address plan asset rules under 29 CFR 2510.3-101, VCOC/REOC exemptions.
7. For 506(b): Emphasize no general solicitation permitted per 17 CFR 230.502(c).
8. For 506(c): Emphasize verification requirements per 17 CFR 230.506(c)(2)(ii).

OUTPUT: Respond ONLY with valid JSON matching the PPMProse schema. No commentary.

JSON Schema:
{
  "secLegend": "string - Additional SEC disclosure language specific to this offering",
  "summaryOfTerms": "string - Comprehensive summary of fund terms, structure, and objectives",
  "riskFactors": ["string[] - Array of individual risk factor paragraphs, at least 10"],
  "useOfProceeds": "string - Detailed description of how capital will be deployed",
  "managementBios": "string - Description of GP principals and track record (use placeholder names if not provided)",
  "investmentStrategy": "string - Detailed investment thesis and approach",
  "termsOfOffering": "string - Classes of interests, capital commitments, drawdown procedures, distribution waterfall",
  "conflictsOfInterest": "string - Allocation of opportunities, co-investment, GP other activities",
  "taxConsiderations": "string - Full tax analysis including partnership taxation, UBTI, FIRPTA, carried interest",
  "erisaConsiderations": "string - Plan asset rules, VCOC/REOC exemptions, benefit plan investor limitations",
  "subscriptionProcedures": "string - How to invest, minimum commitment, closing mechanics",
  "legalMatters": "string - Governing law, dispute resolution, amendments, confidentiality",
  "generalSolicitationDisclosure": "string - Disclosure about general solicitation status",
  "accreditationDisclosure": "string - Disclosure about accreditation/qualification requirements"
}`;
}

// ─── Builder ─────────────────────────────────────────────────────────

export async function buildPPM(project: CapitalProjectFull): Promise<Document> {
  const context = buildProjectContext(project);

  // Call AI for prose
  const prose = await claudeJson<PPMProse>({
    systemPrompt: buildSystemPrompt(project),
    userPrompt: context,
    maxTokens: 12000,
  });

  const targetRaise = safeNumber(project.targetRaise);
  const minInvestment = safeNumber(project.minInvestment);
  const gpCommitment = safeNumber(project.gpCommitment);
  const managementFee = safeNumber(project.managementFee);
  const carriedInterest = safeNumber(project.carriedInterest);
  const preferredReturn = safeNumber(project.preferredReturn);
  const hurdles = (Array.isArray(project.hurdles) ? project.hurdles : []) as Array<{ rate: number; split: string }>;
  const keyPersonNames = (Array.isArray(project.keyPersonNames) ? project.keyPersonNames : []) as string[];
  const is506c = project.exemptionType === "REG_D_506C";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  const children: (Paragraph | Table)[] = [];

  // ─── 1. Cover Page ───────────────────────────────────────────────

  children.push(spacer(20));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "CONFIDENTIAL PRIVATE PLACEMENT MEMORANDUM",
          bold: true,
          size: 36,
          color: COLORS.primary,
          font: FONTS.legal,
          allCaps: true,
        }),
      ],
    }),
  );
  children.push(spacer(8));

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: project.fundName,
          bold: true,
          size: 32,
          color: COLORS.primary,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `A ${project.gpStateOfFormation ?? "Delaware"} Limited Partnership`,
          size: 24,
          color: COLORS.black,
          font: FONTS.legal,
          italics: true,
        }),
      ],
    }),
  );

  children.push(spacer(8));

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Offering Amount: ${formatCurrency(targetRaise)}`,
          bold: true,
          size: 24,
          color: COLORS.black,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Minimum Investment: ${formatCurrency(minInvestment)}`,
          size: 22,
          color: COLORS.black,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Exemption: ${is506c ? "Rule 506(c)" : "Rule 506(b)"} of Regulation D`,
          size: 22,
          color: COLORS.textGray,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  children.push(spacer(8));

  // SEC Legend
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: SEC_LEGEND,
          bold: true,
          size: 16,
          color: COLORS.black,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  // Exemption-specific addendum
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: is506c ? SEC_LEGEND_506C_ADDENDUM : SEC_LEGEND_506B_ADDENDUM,
          size: 16,
          color: COLORS.black,
          font: FONTS.legal,
          italics: true,
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: `Dated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          size: 20,
          color: COLORS.textGray,
          font: FONTS.legal,
        }),
      ],
    }),
  );

  children.push(spacer(16));

  // ─── 2. Summary of Terms ─────────────────────────────────────────

  children.push(sectionHeading("I. Summary of Terms"));
  children.push(bodyText(prose.summaryOfTerms));
  children.push(spacer(4));

  const termRows: Array<{ label: string; value: string }> = [
    { label: "Fund Name", value: project.fundName },
    { label: "Fund Type", value: project.fundType.replace(/_/g, " ") },
    { label: "General Partner", value: project.gpEntityName },
    { label: "Target Raise", value: formatCurrency(targetRaise) },
    { label: "Minimum Investment", value: formatCurrency(minInvestment) },
    { label: "Management Fee", value: `${(managementFee * 100).toFixed(2)}% per annum` },
    { label: "Carried Interest", value: `${(carriedInterest * 100).toFixed(1)}%` },
    { label: "Preferred Return", value: `${(preferredReturn * 100).toFixed(1)}% per annum` },
    { label: "GP Commitment", value: formatCurrency(gpCommitment) },
    { label: "Fund Term", value: `${project.fundTermYears ?? 10} years` },
    { label: "Investment Period", value: `${project.investmentPeriod ?? 5} years` },
    { label: "Securities Exemption", value: is506c ? "Rule 506(c) — Regulation D" : "Rule 506(b) — Regulation D" },
    { label: "ICA Exemption", value: is3c7 ? "Section 3(c)(7)" : "Section 3(c)(1)" },
    { label: "Key Person Provision", value: project.keyPersonProvision ? "Yes" : "No" },
    { label: "Clawback", value: project.clawbackProvision ? "Yes" : "No" },
  ];

  children.push(keyTermsTable(termRows));
  children.push(spacer(8));

  // ─── 3. Risk Factors ─────────────────────────────────────────────

  children.push(sectionHeading("II. Risk Factors"));
  children.push(
    bodyText(
      "AN INVESTMENT IN THE FUND INVOLVES A HIGH DEGREE OF RISK. PROSPECTIVE INVESTORS SHOULD CAREFULLY CONSIDER THE FOLLOWING RISK FACTORS, AS WELL AS THE OTHER INFORMATION SET FORTH IN THIS MEMORANDUM, BEFORE DECIDING TO INVEST.",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  const riskFactors = ensureProseArray(prose.riskFactors);
  for (const risk of riskFactors) {
    children.push(bulletPoint(String(risk)));
  }
  children.push(spacer(8));

  // ─── 4. Use of Proceeds ──────────────────────────────────────────

  children.push(sectionHeading("III. Use of Proceeds"));
  children.push(bodyText(prose.useOfProceeds));
  children.push(spacer(4));

  // Deterministic fee breakdown
  children.push(
    bodyTextRuns([
      { text: "Management Fee: ", bold: true },
      { text: `${(managementFee * 100).toFixed(2)}% per annum on committed capital during the investment period, calculated on invested capital thereafter.` },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Organizational Expenses: ", bold: true },
      { text: "The Fund shall bear all organizational and offering expenses incurred in connection with the formation of the Fund and the offering of interests." },
    ]),
  );
  children.push(spacer(8));

  // ─── 5. Management ───────────────────────────────────────────────

  children.push(sectionHeading("IV. Management"));
  children.push(
    bodyTextRuns([
      { text: "General Partner: ", bold: true },
      { text: project.gpEntityName },
    ]),
  );
  if (keyPersonNames.length > 0) {
    children.push(
      bodyTextRuns([
        { text: "Key Persons: ", bold: true },
        { text: keyPersonNames.join(", ") },
      ]),
    );
  }
  children.push(spacer(4));
  children.push(bodyText(prose.managementBios));
  children.push(spacer(8));

  // ─── 6. Investment Strategy ──────────────────────────────────────

  children.push(sectionHeading("V. Investment Strategy"));
  children.push(bodyText(prose.investmentStrategy));
  children.push(spacer(4));

  if (project.investmentStrategy) {
    children.push(
      bodyTextRuns([
        { text: "Strategy Overview: ", bold: true },
        { text: project.investmentStrategy },
      ]),
    );
  }
  if (project.geographicFocus) {
    children.push(
      bodyTextRuns([
        { text: "Geographic Focus: ", bold: true },
        { text: project.geographicFocus },
      ]),
    );
  }
  const targetIndustries = (Array.isArray(project.targetIndustries) ? project.targetIndustries : []) as string[];
  if (targetIndustries.length > 0) {
    children.push(
      bodyTextRuns([
        { text: "Target Industries: ", bold: true },
        { text: targetIndustries.join(", ") },
      ]),
    );
  }
  children.push(spacer(8));

  // ─── 7. Terms of the Offering ────────────────────────────────────

  children.push(sectionHeading("VI. Terms of the Offering"));
  children.push(bodyText(prose.termsOfOffering));
  children.push(spacer(4));

  // Deterministic waterfall
  children.push(bodyText("Distribution Waterfall:", { bold: true }));
  children.push(bulletPoint(`First, 100% to all partners until each has received a return of its contributed capital.`));
  children.push(bulletPoint(`Second, ${(preferredReturn * 100).toFixed(1)}% preferred return to all partners (pro rata).`));
  if (carriedInterest > 0) {
    children.push(bulletPoint(`Third, GP Catch-Up: 100% to the General Partner until the General Partner has received, cumulatively, an amount equal to ${(carriedInterest * 100).toFixed(1)}% of the aggregate amounts distributed under Steps 2 and 3 (the "catch-up").`));
    children.push(bulletPoint(`Fourth, ${(100 - carriedInterest * 100).toFixed(1)}% to Limited Partners and ${(carriedInterest * 100).toFixed(1)}% to the General Partner (as carried interest).`));
  }

  if (hurdles.length > 0) {
    children.push(spacer(4));
    children.push(bodyText("Hurdle Tiers:", { bold: true }));
    for (const h of hurdles) {
      children.push(bulletPoint(`${(safeNumber(h.rate) * 100).toFixed(1)}% hurdle: ${String(h.split ?? "")}`));
    }
  }
  children.push(spacer(8));

  // ─── 8. Conflicts of Interest ────────────────────────────────────

  children.push(sectionHeading("VII. Conflicts of Interest"));
  children.push(bodyText(prose.conflictsOfInterest));
  children.push(spacer(8));

  // ─── 9. Tax Considerations ───────────────────────────────────────

  children.push(sectionHeading("VIII. Tax Considerations"));
  children.push(bodyText(prose.taxConsiderations));
  children.push(spacer(8));

  // ─── 10. ERISA Considerations ────────────────────────────────────

  children.push(sectionHeading("IX. ERISA Considerations"));
  children.push(bodyText(prose.erisaConsiderations));
  children.push(spacer(8));

  // ─── 11. Subscription Procedures ─────────────────────────────────

  children.push(sectionHeading("X. Subscription Procedures"));
  children.push(bodyText(prose.subscriptionProcedures));
  children.push(spacer(4));

  // Deterministic subscription info
  children.push(
    bodyTextRuns([
      { text: "Minimum Commitment: ", bold: true },
      { text: formatCurrency(minInvestment) },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Investor Qualification: ", bold: true },
      { text: is3c7
        ? "All investors must be qualified purchasers as defined in 15 U.S.C. Section 80a-2(a)(51)."
        : is506c
          ? "All investors must be accredited investors as defined in 17 CFR 230.501(a). Accredited status must be verified pursuant to 17 CFR 230.506(c)(2)(ii)."
          : "All investors must be accredited investors as defined in 17 CFR 230.501(a), or meet the sophistication requirements for non-accredited investors under 17 CFR 230.506(b)(2)(ii)."
      },
    ]),
  );
  children.push(spacer(8));

  // ─── 12. Legal Matters ───────────────────────────────────────────

  children.push(sectionHeading("XI. Legal Matters"));
  children.push(bodyText(prose.legalMatters));
  children.push(spacer(4));

  // General solicitation disclosure
  children.push(bodyText(prose.generalSolicitationDisclosure));
  children.push(spacer(4));

  // Accreditation disclosure
  children.push(bodyText(prose.accreditationDisclosure));
  children.push(spacer(8));

  // ─── Anti-Fraud Disclosure ───────────────────────────────────────

  children.push(sectionHeading("XII. Important Disclosures"));
  children.push(
    bodyText(
      "This Memorandum is subject to the anti-fraud provisions of Rule 10b-5 under the Securities Exchange Act of 1934 (17 CFR 240.10b-5) and Section 17(a) of the Securities Act of 1933 (15 U.S.C. Section 77q(a)). The General Partner has endeavored to ensure that this Memorandum does not contain any untrue statement of a material fact or omit to state a material fact necessary to make the statements herein not misleading.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "FORWARD-LOOKING STATEMENTS: This Memorandum contains forward-looking statements that involve risks and uncertainties. Actual results may differ materially from those contemplated by such forward-looking statements. Past performance is not indicative of future results. There can be no assurance that the Fund will achieve its investment objectives.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // ─── AI Disclaimer ──────────────────────────────────────────────

  children.push(sectionHeading("Disclaimer"));
  children.push(
    bodyText(
      "This document was prepared with AI-assisted drafting technology and is for document drafting assistance only. It does not constitute legal advice. All terms, provisions, and representations must be reviewed by qualified securities counsel before distribution to potential investors. The issuer is solely responsible for the accuracy and completeness of all disclosures.",
      { italic: true },
    ),
  );

  return buildLegalDocument({
    title: "Private Placement Memorandum",
    headerRight: `PPM — ${project.fundName}`,
    children,
  });
}

// ─── Compliance Checks ───────────────────────────────────────────────

export function runPPMComplianceChecks(project: CapitalProjectFull): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const is506c = project.exemptionType === "REG_D_506C";
  const is3c1 = project.icaExemption === "SECTION_3C1";
  const is3c7 = project.icaExemption === "SECTION_3C7";

  // 1. SEC legend required
  checks.push({
    name: "SEC Legend Present",
    regulation: "17 CFR 230.502(d)",
    category: "securities",
    passed: true, // Always included by template
    note: "The required SEC legend per Rule 502(d) is included on the cover page.",
  });

  // 2. General solicitation compliance
  checks.push({
    name: "General Solicitation Disclosure",
    regulation: is506c ? "17 CFR 230.506(c)" : "17 CFR 230.502(c)",
    category: "securities",
    passed: true,
    note: is506c
      ? "506(c) offering: general solicitation is permitted. All purchasers must be verified accredited investors."
      : "506(b) offering: no general solicitation or advertising is permitted per Rule 502(c).",
  });

  // 3. Investor limit for 3(c)(1)
  if (is3c1) {
    const maxInvestors = project.maxInvestors ?? 100;
    checks.push({
      name: "3(c)(1) Investor Limit",
      regulation: "15 U.S.C. Section 80a-3(c)(1)",
      category: "ica",
      passed: maxInvestors <= 100,
      note: maxInvestors <= 100
        ? `Maximum ${maxInvestors} investors — within the 100 beneficial owner limit.`
        : `Maximum ${maxInvestors} investors exceeds the 100 beneficial owner limit for Section 3(c)(1) funds.`,
    });
  }

  // 4. Qualified purchaser requirement for 3(c)(7)
  if (is3c7) {
    checks.push({
      name: "Qualified Purchaser Requirement",
      regulation: "15 U.S.C. Section 80a-3(c)(7)",
      category: "ica",
      passed: true,
      note: "Section 3(c)(7) fund: all investors must be qualified purchasers ($5M+ in investments for individuals, $25M+ for institutions).",
    });
  }

  // 5. Risk factors included
  checks.push({
    name: "Risk Factors Disclosure",
    regulation: "Rule 10b-5 (17 CFR 240.10b-5)",
    category: "anti_fraud",
    passed: project.riskFactorsIncluded === true,
    note: project.riskFactorsIncluded === true
      ? "Risk factors are flagged as included in the project."
      : "WARNING: Risk factors not flagged as included. Anti-fraud rules require complete disclosure of material risks.",
  });

  // 6. Use of proceeds disclosure
  checks.push({
    name: "Use of Proceeds Disclosure",
    regulation: "Section 17(a) (15 U.S.C. Section 77q(a))",
    category: "anti_fraud",
    passed: project.useOfProceedsDisclosed === true,
    note: project.useOfProceedsDisclosed === true
      ? "Use of proceeds is flagged as disclosed."
      : "WARNING: Use of proceeds not flagged as disclosed. This is a standard PPM requirement under anti-fraud rules.",
  });

  // 7. Accreditation verification for 506(c)
  if (is506c) {
    checks.push({
      name: "Accreditation Verification Method",
      regulation: "17 CFR 230.506(c)(2)(ii)",
      category: "investor_protection",
      passed: true,
      note: "506(c) offering requires reasonable steps to verify accredited investor status. Verification methods include: income (W-2/1040), net worth (bank statements + credit report), professional certifications (Series 7/65/82 per Rule 501(a)(10)), or third-party confirmation.",
    });
  }

  // 8. Non-accredited investor limit for 506(b)
  if (!is506c) {
    const nonAccreditedLimit = project.nonAccreditedLimit ?? 35;
    checks.push({
      name: "Non-Accredited Investor Limit",
      regulation: "17 CFR 230.506(b)(2)(i)",
      category: "investor_protection",
      passed: nonAccreditedLimit <= 35,
      note: nonAccreditedLimit <= 35
        ? `Non-accredited investor limit: ${nonAccreditedLimit} (max 35 allowed under 506(b)).`
        : `Non-accredited investor limit of ${nonAccreditedLimit} exceeds the maximum 35 allowed under Rule 506(b).`,
    });
  }

  // 9. Form D filing
  checks.push({
    name: "Form D Filing Status",
    regulation: "17 CFR 239.500",
    category: "form_d",
    passed: true, // Informational — filing is separate from PPM
    note: project.formDFilingDate
      ? `Form D filed on ${project.formDFilingDate.toISOString().split("T")[0]}. Amendment required annually if offering continues.`
      : "Form D not yet filed. Must be filed within 15 calendar days after first sale of securities.",
  });

  // 10. Management fee within market norms
  const mgmtFee = safeNumber(project.managementFee);
  checks.push({
    name: "Management Fee Market Standard",
    regulation: "Market Standard (informational)",
    category: "investor_protection",
    passed: mgmtFee <= 0.03,
    note: mgmtFee <= 0.03
      ? `Management fee of ${(mgmtFee * 100).toFixed(2)}% is within market standard (1.5-2.0% typical).`
      : `Management fee of ${(mgmtFee * 100).toFixed(2)}% exceeds typical market range. Ensure adequate disclosure in risk factors.`,
  });

  return checks;
}
