// diversity-action-plan.ts
// Generates a DOCX Diversity Action Plan (DAP) per FDORA requirements.
// Required for all IND applications submitted after June 2025.

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
  signatureBlock,
  COLORS,
  formatDate,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, DiversityActionPlanProse } from "./types";

export function buildDiversityActionPlan(
  input: BioDocumentInput,
  prose: DiversityActionPlanProse,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const phase = input.phase ?? "Phase 1";
  const indication = input.indication ?? "[Indication TBD]";

  // -------------------------------------------------------------------------
  // Title Page
  // -------------------------------------------------------------------------
  children.push(documentTitle("Diversity Action Plan"));
  children.push(spacer(2));
  children.push(
    bodyText("Per Section 3602 of the Food and Drug Omnibus Reform Act (FDORA)", {
      italic: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(4));

  children.push(bodyText(`Drug Name: ${input.drugName}`, { bold: true }));
  children.push(bodyText(`Drug Class: ${input.drugClass}`));
  children.push(bodyText(`Indication: ${indication}`));
  children.push(bodyText(`Phase: ${phase}`));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`, { bold: true }));
  if (input.indNumber) {
    children.push(bodyText(`IND Number: ${input.indNumber}`));
  }
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(
    bodyText("CONFIDENTIAL", { bold: true, color: COLORS.primary }),
  );

  // -------------------------------------------------------------------------
  // 1. Background and Regulatory Basis
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("1. Background and Regulatory Basis"));

  children.push(
    bodyText(
      "The Food and Drug Omnibus Reform Act (FDORA), signed into law in December 2022 as part of the Consolidated Appropriations Act of 2023, requires sponsors of certain clinical trials to submit a Diversity Action Plan (DAP) to FDA. Section 3602 of FDORA mandates that for Phase 3 and certain pivotal trials, sponsors must submit a plan that includes the sponsor's goals for enrollment of demographically diverse populations, the rationale for such goals, and an explanation of how the sponsor will meet those goals.",
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "Although FDORA's mandatory DAP requirement applies to pivotal trials, the Sponsor is voluntarily submitting this Diversity Action Plan with the Phase 1 IND application to demonstrate early commitment to inclusive trial design and to establish enrollment infrastructure that will carry forward into later-phase studies. Early implementation aligns with FDA draft guidance on diversity plan submissions and provides a stronger foundation for representative enrollment at the pivotal stage.",
    ),
  );

  // -------------------------------------------------------------------------
  // 2. Disease Epidemiology (AI prose + deterministic indication)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("2. Disease Epidemiology"));

  children.push(
    bodyText(`Indication: ${indication}`, { bold: true }),
  );
  children.push(spacer(2));
  children.push(bodyText(prose.epidemiologySummary));

  // -------------------------------------------------------------------------
  // 3. Enrollment Goals (deterministic table structure, TBD values)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("3. Enrollment Goals"));

  children.push(
    bodyText(
      "The following enrollment targets are based on the known disease epidemiology and U.S. Census data. The Sponsor will monitor enrollment against these targets on a rolling basis and adjust recruitment strategies if enrollment falls below 80% of the target for any demographic group.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Enrollment Targets by Race/Ethnicity:", { bold: true }));
  children.push(
    createTable(
      ["Demographic Group", "U.S. Disease Prevalence (%)", "Enrollment Goal (%)", "Enrollment Goal (N)"],
      [
        ["White (non-Hispanic)", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Black or African American", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Hispanic or Latino", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Asian", "[TBD]%", "[TBD]%", "[TBD]"],
        ["American Indian or Alaska Native", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Native Hawaiian or Other Pacific Islander", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Two or More Races", "[TBD]%", "[TBD]%", "[TBD]"],
      ],
      { columnWidths: [30, 25, 20, 25], alternateRows: true },
    ),
  );

  children.push(spacer(4));
  children.push(bodyText("Enrollment Targets by Sex:", { bold: true }));
  children.push(
    createTable(
      ["Demographic Group", "U.S. Disease Prevalence (%)", "Enrollment Goal (%)", "Enrollment Goal (N)"],
      [
        ["Female", "[TBD]%", "[TBD]%", "[TBD]"],
        ["Male", "[TBD]%", "[TBD]%", "[TBD]"],
      ],
      { columnWidths: [30, 25, 20, 25], alternateRows: true },
    ),
  );

  children.push(spacer(4));
  children.push(bodyText("Enrollment Targets by Age Group:", { bold: true }));
  children.push(
    createTable(
      ["Age Group", "U.S. Disease Prevalence (%)", "Enrollment Goal (%)", "Enrollment Goal (N)"],
      [
        ["18-39 years", "[TBD]%", "[TBD]%", "[TBD]"],
        ["40-64 years", "[TBD]%", "[TBD]%", "[TBD]"],
        ["65-74 years", "[TBD]%", "[TBD]%", "[TBD]"],
        ["75+ years", "[TBD]%", "[TBD]%", "[TBD]"],
      ],
      { columnWidths: [30, 25, 20, 25], alternateRows: true },
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "Note: Enrollment goals are aspirational targets, not strict quotas. The Sponsor recognizes that Phase 1 dose-escalation studies have limited sample sizes, but these targets establish the framework and recruitment infrastructure for later-phase studies.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 4. Recruitment Strategy (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("4. Recruitment Strategy"));
  children.push(bodyText(prose.recruitmentStrategy));

  children.push(spacer(2));
  children.push(bodyText("Key Recruitment Tactics:", { bold: true }));
  children.push(
    bulletPoint(
      "Targeted digital outreach via social media platforms and disease-specific patient advocacy groups serving underrepresented populations.",
    ),
  );
  children.push(
    bulletPoint(
      "Multilingual recruitment materials: All patient-facing materials (advertisements, informed consent, study information sheets) will be available in English and Spanish at a minimum; additional languages will be provided based on site demographics.",
    ),
  );
  children.push(
    bulletPoint(
      "Collaboration with community health centers and Federally Qualified Health Centers (FQHCs) to reach patients who may not have access to academic medical centers.",
    ),
  );
  children.push(
    bulletPoint(
      "Patient navigation services: Dedicated patient navigators at high-enrollment sites to assist patients with appointment scheduling, transportation logistics, and insurance/financial assistance questions.",
    ),
  );
  children.push(
    bulletPoint(
      "Referral networks: Partnerships with community oncologists and primary care providers to identify eligible patients who may not otherwise learn about clinical trial opportunities.",
    ),
  );

  // -------------------------------------------------------------------------
  // 5. Site Selection (deterministic requirements)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("5. Site Selection"));

  children.push(
    bodyText(
      "Clinical trial sites will be selected to maximize geographic and demographic diversity while maintaining the scientific and operational quality required for a first-in-human study.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Site Selection Criteria:", { bold: true }));
  children.push(
    createTable(
      ["Criterion", "Requirement"],
      [
        [
          "Minimum diverse-serving sites",
          "At least 30% of activated sites must serve patient populations where >= 40% identify as underrepresented racial/ethnic groups",
        ],
        [
          "Community sites",
          "At least 2 community-based (non-academic) clinical sites must be included",
        ],
        [
          "Geographic distribution",
          "Sites must be distributed across at least 3 U.S. Census regions (Northeast, South, Midwest, West)",
        ],
        [
          "Language capability",
          "All sites must have access to certified medical interpreters for non-English-speaking patients",
        ],
        [
          "Phase 1 safety infrastructure",
          "All sites must have ICU access and 24-hour monitoring capability (required for first-in-human oncology studies)",
        ],
        [
          "Diversity officer",
          "Each site must designate a diversity enrollment liaison responsible for tracking and reporting demographic enrollment data",
        ],
      ],
      { columnWidths: [30, 70], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 6. Community Engagement (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("6. Community Engagement"));
  children.push(bodyText(prose.communityEngagement));

  children.push(spacer(2));
  children.push(bodyText("Planned Community Engagement Activities:", { bold: true }));
  children.push(
    bulletPoint(
      "Pre-study community advisory board meeting(s) with patient advocates, community leaders, and representatives from underrepresented groups to provide input on study design and recruitment materials.",
    ),
  );
  children.push(
    bulletPoint(
      "Educational events at community organizations and houses of worship in areas near clinical sites to increase clinical trial awareness and address common concerns about research participation.",
    ),
  );
  children.push(
    bulletPoint(
      "Partnership with disease-specific advocacy organizations that serve diverse patient populations.",
    ),
  );
  children.push(
    bulletPoint(
      "Post-study results communication: Aggregate study results will be shared with participating communities and patient advocacy groups in accessible, non-technical language.",
    ),
  );

  // -------------------------------------------------------------------------
  // 7. Accommodations (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("7. Accommodations to Reduce Barriers"));
  children.push(bodyText(prose.accommodations));

  children.push(spacer(2));
  children.push(bodyText("Planned Accommodations:", { bold: true }));
  children.push(
    bulletPoint(
      "Transportation assistance: Reimbursement for travel costs or sponsored ride-share services for patients traveling more than 30 miles to the study site.",
    ),
  );
  children.push(
    bulletPoint(
      "Flexible scheduling: Evening and weekend appointment availability at select sites to accommodate patients with work or caregiving obligations.",
    ),
  );
  children.push(
    bulletPoint(
      "Childcare stipend: Financial assistance for childcare during study visits (up to $50 per visit where permitted by IRB).",
    ),
  );
  children.push(
    bulletPoint(
      "Decentralized elements: Where scientifically appropriate, home health nursing for select safety assessments (e.g., vital signs, blood draws on non-treatment days) to reduce site visit burden.",
    ),
  );
  children.push(
    bulletPoint(
      "Plain-language materials: All patient-facing documents will be written at or below an 8th grade reading level and reviewed by a health literacy specialist.",
    ),
  );
  children.push(
    bulletPoint(
      "Financial transparency: Clear communication about costs, including what is covered by the study sponsor and what may be billed to insurance.",
    ),
  );

  // -------------------------------------------------------------------------
  // 8. Monitoring and Reporting
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("8. Monitoring and Reporting"));

  children.push(
    bodyText(
      "The Sponsor will monitor enrollment demographics on an ongoing basis throughout the study. The following monitoring framework will be used:",
    ),
  );

  children.push(spacer(2));
  children.push(
    bulletPoint(
      "Monthly enrollment reports: Demographic breakdown of enrolled patients compared to targets, reviewed by the Sponsor's clinical operations and diversity team.",
    ),
  );
  children.push(
    bulletPoint(
      "Quarterly diversity review: Formal review of enrollment trends by race/ethnicity, sex, and age group. If any demographic group is enrolled at less than 80% of target, corrective actions will be implemented within 30 days.",
    ),
  );
  children.push(
    bulletPoint(
      "Corrective actions may include: activating additional diverse-serving sites, increasing community outreach in underrepresented areas, adjusting recruitment advertising channels, or adding patient navigation resources.",
    ),
  );
  children.push(
    bulletPoint(
      "Annual FDA reporting: Diversity enrollment data will be included in the IND Annual Report (21 CFR 312.33) with comparison to plan targets.",
    ),
  );
  children.push(
    bulletPoint(
      "Final study report: Demographic enrollment data and comparison to DAP targets will be included in the clinical study report.",
    ),
  );

  // -------------------------------------------------------------------------
  // 9. Accountability
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("9. Accountability"));

  children.push(
    bodyText(
      "The following individuals are responsible for implementation and oversight of this Diversity Action Plan:",
    ),
  );

  children.push(spacer(2));
  children.push(
    createTable(
      ["Role", "Responsibility"],
      [
        ["Sponsor Medical Director", "Overall accountability for DAP implementation and FDA communication"],
        ["Clinical Operations Lead", "Site selection, site training on diversity goals, and enrollment monitoring"],
        ["Diversity Enrollment Liaison", "Day-to-day monitoring of demographic enrollment, community outreach coordination"],
        ["Biostatistician", "Subgroup analyses to ensure safety and efficacy data are interpretable across demographic groups"],
        ["Regulatory Affairs", "DAP submission, amendments, and inclusion in annual reports"],
      ],
      { columnWidths: [30, 70], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Signature
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("Sponsor Attestation"));

  children.push(
    bodyText(
      "The Sponsor attests that the enrollment goals, recruitment strategies, and accommodations described in this Diversity Action Plan represent a good-faith effort to ensure that the clinical trial population reflects the demographics of the patients for whom the drug is intended. The Sponsor acknowledges that FDA may request modifications to this plan.",
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText("SPONSOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.sponsorName, "Authorized Representative"),
  );

  // Wrap in document shell
  return buildLegalDocument({
    title: "Diversity Action Plan",
    headerRight: `Diversity Action Plan -- ${input.drugName}`,
    children,
  });
}
