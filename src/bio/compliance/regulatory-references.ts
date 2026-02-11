// regulatory-references.ts
// Statutory and guidance references for bio compliance checks.
// Each doc type maps to the regulations/guidances the reviewer should cite.

export interface RegulatoryReference {
  regulation: string;
  description: string;
  url?: string;
}

const REFERENCES: Record<string, RegulatoryReference[]> = {
  ind_module_1: [
    {
      regulation: "21 CFR 312.23(a)(1)",
      description: "Form 1571 — IND application cover sheet with sponsor commitments and signatures",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312/subpart-B/section-312.23",
    },
    {
      regulation: "21 CFR 312.23(a)(2)",
      description: "Table of contents for IND submission",
    },
    {
      regulation: "21 CFR 25.31",
      description: "Environmental assessment or categorical exclusion claim required with IND",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-25/subpart-C/section-25.31",
    },
    {
      regulation: "21 CFR Part 11",
      description: "Electronic records and signatures — audit trails, access controls, digital signatures",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11",
    },
  ],

  ind_module_2: [
    {
      regulation: "ICH M4",
      description: "Common Technical Document (CTD) — Module 2 summaries format and content",
      url: "https://www.ich.org/page/ctd",
    },
    {
      regulation: "21 CFR 312.23(a)(3)",
      description: "Introductory statement and general investigational plan",
    },
    {
      regulation: "ICH S9",
      description: "Nonclinical evaluation for anticancer pharmaceuticals — starting dose derivation, safety margins",
      url: "https://www.ich.org/page/safety-guidelines",
    },
    {
      regulation: "ICH M4S(R2)",
      description: "Nonclinical Overview and Nonclinical Written and Tabulated Summaries",
    },
  ],

  ind_module_3: [
    {
      regulation: "21 CFR 312.23(a)(7)",
      description: "Chemistry, manufacturing, and controls information required for IND",
    },
    {
      regulation: "ICH M4Q(R1)",
      description: "CTD Module 3 quality — drug substance and drug product documentation",
      url: "https://www.ich.org/page/quality-guidelines",
    },
    {
      regulation: "ICH Q6B",
      description: "Specifications: test procedures and acceptance criteria for biotech/biological products",
      url: "https://database.ich.org/sites/default/files/Q6B%20Guideline.pdf",
    },
    {
      regulation: "ICH Q5E",
      description: "Comparability of biotechnological/biological products subject to changes in manufacturing process",
    },
    {
      regulation: "FDA ADC Clinical Pharmacology Guidance",
      description: "Clinical pharmacology considerations for ADCs — three-analyte characterization, DAR, free payload",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-pharmacology-considerations-antibody-drug-conjugates",
    },
    {
      regulation: "ICH Q5A(R2)",
      description: "Viral safety evaluation of biotechnology products derived from cell lines of human or animal origin",
    },
  ],

  ind_module_4: [
    {
      regulation: "21 CFR Part 58",
      description: "Good Laboratory Practice (GLP) — required for pivotal nonclinical safety studies",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-58",
    },
    {
      regulation: "21 CFR 312.23(a)(8)",
      description: "Pharmacology and toxicology information required for IND",
    },
    {
      regulation: "ICH S9",
      description: "Nonclinical evaluation for anticancer pharmaceuticals — species selection, study design, starting dose",
      url: "https://www.ich.org/page/safety-guidelines",
    },
    {
      regulation: "ICH S6(R1)",
      description: "Preclinical safety evaluation of biotechnology-derived pharmaceuticals — species relevance, immunogenicity",
      url: "https://database.ich.org/sites/default/files/S6_R1_Guideline.pdf",
    },
    {
      regulation: "FDA SEND",
      description: "Standard for Exchange of Nonclinical Data — required electronic format for tox/PK data submission",
      url: "https://www.fda.gov/industry/fda-data-standards-advisory-board/study-data-standards-resources",
    },
    {
      regulation: "ICH S7A",
      description: "Safety pharmacology studies for human pharmaceuticals (cardiovascular, respiratory, CNS)",
    },
  ],

  ind_module_5: [
    {
      regulation: "21 CFR 312.23(a)(6)",
      description: "Clinical protocol content requirements for IND",
    },
    {
      regulation: "FDA Project Optimus Guidance (Aug 2024)",
      description: "Optimizing the dosage of human prescription drugs and biological products for the treatment of oncology diseases",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/optimizing-dosage-human-prescription-drugs-and-biological-products-treatment-oncology-diseases",
    },
    {
      regulation: "FDORA (Food and Drug Omnibus Reform Act)",
      description: "Diversity Action Plan requirement — sponsors must submit plan to enroll diverse clinical trial populations",
    },
    {
      regulation: "FDA ADC Clinical Pharmacology Guidance",
      description: "Three-analyte PK requirement: conjugated ADC, total antibody, free payload",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-pharmacology-considerations-antibody-drug-conjugates",
    },
    {
      regulation: "ICH E6(R2)",
      description: "Good Clinical Practice — protocol design, monitoring, reporting, informed consent",
      url: "https://database.ich.org/sites/default/files/E6_R2_Addendum.pdf",
    },
    {
      regulation: "21 CFR 50",
      description: "Informed consent of human subjects — readability, required elements, documentation",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-50",
    },
    {
      regulation: "21 CFR 56",
      description: "Institutional Review Board (IRB) requirements",
    },
  ],

  investigator_brochure: [
    {
      regulation: "21 CFR 312.23(a)(5)",
      description: "Investigator's Brochure content requirements for IND",
    },
    {
      regulation: "ICH E6(R2) Section 7",
      description: "IB format, content, and amendment requirements",
      url: "https://database.ich.org/sites/default/files/E6_R2_Addendum.pdf",
    },
    {
      regulation: "ICH S9",
      description: "Nonclinical data presentation for anticancer agents in the IB",
    },
  ],

  clinical_protocol: [
    {
      regulation: "21 CFR 312.23(a)(6)",
      description: "Protocol content requirements — objectives, design, endpoints, eligibility, dosing",
    },
    {
      regulation: "ICH E6(R2)",
      description: "Good Clinical Practice — essential protocol elements",
      url: "https://database.ich.org/sites/default/files/E6_R2_Addendum.pdf",
    },
    {
      regulation: "FDA Project Optimus Guidance (Aug 2024)",
      description: "Dose optimization — randomized dose comparison, not just MTD-finding 3+3",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/optimizing-dosage-human-prescription-drugs-and-biological-products-treatment-oncology-diseases",
    },
    {
      regulation: "FDORA",
      description: "Diversity Action Plan must accompany clinical protocol submission",
    },
    {
      regulation: "FDA ADC Clinical Pharmacology Guidance",
      description: "PK sampling requirements — three analytes with adequate sensitivity",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-pharmacology-considerations-antibody-drug-conjugates",
    },
    {
      regulation: "ASTCT Consensus Grading",
      description: "American Society for Transplantation and Cellular Therapy — CRS and ICANS grading criteria",
      url: "https://doi.org/10.1016/j.bbmt.2018.12.758",
    },
    {
      regulation: "ICH E9(R1)",
      description: "Statistical principles for clinical trials — estimands and sensitivity analyses",
    },
  ],

  pre_ind_briefing: [
    {
      regulation: "21 CFR 312.82",
      description: "Pre-IND meeting — request process, content expectations, FDA response timeline",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312/subpart-E/section-312.82",
    },
    {
      regulation: "FDA Guidance: Formal Meetings Between FDA and Sponsors or Applicants of PDUFA Products (2017)",
      description: "Meeting request format, briefing document content, question formatting (yes/no preferred)",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/formal-meetings-between-fda-and-sponsors-or-applicants-pdufa-products-guidance-industry",
    },
    {
      regulation: "21 CFR 312.23",
      description: "IND content requirements — relevant for framing pre-IND questions around submission readiness",
    },
  ],
  informed_consent: [
    {
      regulation: "21 CFR 50.25",
      description: "Required elements of informed consent — risks, benefits, alternatives, confidentiality, compensation, contact info",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-50/subpart-B/section-50.25",
    },
    {
      regulation: "21 CFR 50.27",
      description: "Documentation of informed consent — written consent form signed by subject or LAR",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-50/subpart-B/section-50.27",
    },
    {
      regulation: "ICH E6(R2) Section 4.8",
      description: "Informed consent process — IRB review, adequate time, non-coercive language, updates for new information",
      url: "https://database.ich.org/sites/default/files/E6_R2_Addendum.pdf",
    },
    {
      regulation: "45 CFR 46 (Common Rule)",
      description: "HHS regulations for protection of human subjects — additional consent elements for federally funded research",
      url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-46",
    },
    {
      regulation: "21 CFR 56",
      description: "IRB review and approval of informed consent documents",
    },
  ],

  diversity_action_plan: [
    {
      regulation: "FDORA Section 3602",
      description: "Diversity Action Plan requirement — sponsors must submit plan for diverse enrollment no later than Phase 3/pivotal protocol",
    },
    {
      regulation: "FDA Draft Guidance: Diversity Plans to Improve Enrollment of Participants from Underrepresented Populations in Clinical Studies (2024)",
      description: "Guidance on DAP content — enrollment goals, eligibility criteria review, site selection, community engagement",
      url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/diversity-plans-improve-enrollment-participants-underrepresented-racial-and-ethnic-populations",
    },
    {
      regulation: "21 CFR 312.23(a)(6)",
      description: "Clinical protocol requirements — DAP submitted alongside protocol",
    },
  ],

  fda_form_1571: [
    {
      regulation: "21 CFR 312.23(a)(1)",
      description: "Form FDA 1571 — IND application cover sheet with sponsor name, drug info, phase, regulatory history",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312/subpart-B/section-312.23",
    },
    {
      regulation: "21 CFR 312.40",
      description: "General requirements for IND filing — 30-day review, clinical hold procedures",
      url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312/subpart-C/section-312.40",
    },
    {
      regulation: "21 CFR 312.23(f)",
      description: "Number of copies and electronic submission requirements for IND",
    },
    {
      regulation: "FDA Electronic Submissions Gateway",
      description: "Electronic Common Technical Document (eCTD) format requirement for IND submissions",
      url: "https://www.fda.gov/drugs/electronic-regulatory-submission-and-review/electronic-common-technical-document-ectd",
    },
  ],
};

/**
 * Returns regulatory references for a given bio document type.
 *
 * @param docType - Document type key (e.g. "ind_module_3", "clinical_protocol")
 * @returns Array of regulatory references, or empty array if docType unknown
 */
export function getBioRegulatoryReferences(docType: string): RegulatoryReference[] {
  return REFERENCES[docType] ?? [];
}

/**
 * Returns all regulatory references across all doc types (deduplicated by regulation name).
 */
export function getAllBioRegulatoryReferences(): RegulatoryReference[] {
  const seen = new Set<string>();
  const result: RegulatoryReference[] = [];

  for (const refs of Object.values(REFERENCES)) {
    for (const ref of refs) {
      if (!seen.has(ref.regulation)) {
        seen.add(ref.regulation);
        result.push(ref);
      }
    }
  }

  return result;
}

/**
 * Returns all doc types that have regulatory references.
 */
export function getReferenceDocTypes(): string[] {
  return Object.keys(REFERENCES);
}
