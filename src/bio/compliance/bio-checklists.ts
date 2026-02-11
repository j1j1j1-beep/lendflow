// bio-checklists.ts
// Per-document-type compliance checklists for bio/pharma regulatory documents.
// Mirrors the lending pattern in src/documents/legal-knowledge.ts.

export interface BioChecklist {
  docType: string;
  requiredChecks: string[];
  recommendedChecks: string[];
  regulatoryBasis: string[];
  crossModuleConsistency: string[];
}

const CHECKLISTS: Record<string, BioChecklist> = {
  ind_module_1: {
    docType: "ind_module_1",
    requiredChecks: [
      "Form 1571 complete with all required fields",
      "Sponsor signature present",
      "All referenced documents included in submission",
      "Environmental analysis or categorical exclusion claim",
      "Fast track/breakthrough designation request if applicable",
    ],
    recommendedChecks: [
      "Table of contents matches actual document inventory",
      "Serial number and IND number correctly assigned",
      "Cover letter summarizing submission contents",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(1) — Form 1571 requirements",
      "21 CFR 312.23(a)(2) — Table of contents",
      "21 CFR 25.31 — Environmental assessment or categorical exclusion",
    ],
    crossModuleConsistency: [
      "Document list in Form 1571 matches actual modules submitted",
      "Sponsor name consistent across all forms (1571, 1572, 3674)",
    ],
  },

  ind_module_2: {
    docType: "ind_module_2",
    requiredChecks: [
      "Quality Overall Summary consistent with Module 3 data",
      "Nonclinical Overview references all Module 4 studies",
      "Clinical Overview matches Protocol in Module 5",
      "Starting dose justification references NOAEL and HED calculation",
      "Safety margins clearly stated",
      "Cross-references to figures/tables verified",
    ],
    recommendedChecks: [
      "MOA description consistent across QOS, Nonclinical Overview, and Clinical Overview",
      "Tabulated summary of nonclinical studies with GLP status",
      "Benefit-risk assessment included in Clinical Overview",
    ],
    regulatoryBasis: [
      "ICH M4 — CTD Module 2 format and content",
      "21 CFR 312.23(a)(3) — Introductory statement and general investigational plan",
      "ICH S9 Section 8 (anticancer starting dose principles) + FDA 2005 Guidance (BSA/HED conversion methodology)",
    ],
    crossModuleConsistency: [
      "Drug substance/product descriptions match Module 3 CMC data",
      "Nonclinical study references match Module 4 reports",
      "Clinical protocol synopsis matches Module 5 protocol",
      "Starting dose in Clinical Overview matches Protocol dose escalation scheme",
    ],
  },

  ind_module_3: {
    docType: "ind_module_3",
    requiredChecks: [
      "Drug substance characterization complete (for ADC: antibody + payload-linker separately)",
      "Drug product (conjugated ADC) fully characterized",
      "DAR specification and testing method described",
      "Free payload limits defined with validated assay",
      "Potency assay described (cytotoxicity + ADCC if afucosylated)",
      "Manufacturing process described with critical process parameters",
      "Stability data included with proposed storage conditions",
      "Impurity profiles characterized",
      "Reference standard established",
    ],
    recommendedChecks: [
      "Container closure system compatibility data",
      "Hold time studies for intermediates",
      "Shipping validation data or plan",
      "Comparability protocol if manufacturing changes planned",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(7) — Chemistry, manufacturing, and controls",
      "ICH M4Q — CTD Module 3 quality guidance",
      "ICH Q6B — Specifications for biotechnological/biological products",
      "ICH Q5E — Comparability of biotechnological/biological products",
      "FDA ADC Clinical Pharmacology Guidance — Three-analyte characterization",
    ],
    crossModuleConsistency: [
      "Drug substance name matches across all modules",
      "Batch numbers in stability data match manufacturing records",
      "Potency assay method matches specification referenced in Module 2 QOS",
      "Storage conditions match those referenced in Investigator Brochure",
    ],
  },

  ind_module_4: {
    docType: "ind_module_4",
    requiredChecks: [
      "GLP compliance statement for pivotal studies (21 CFR Part 58)",
      "Tissue cross-reactivity study included (for mAb-based drugs)",
      "Single and repeat dose tox studies in relevant species",
      "NOAEL clearly identified with HED calculation",
      "Safety pharmacology (cardiovascular, respiratory, CNS)",
      "Genotoxicity assessment (or justification for waiver for biologics)",
      "PK/TK data in SEND format",
    ],
    recommendedChecks: [
      "Species relevance justification (target expression in tox species vs human)",
      "Recovery group data demonstrating reversibility of findings",
      "Immunogenicity assessment in tox species (ADA formation)",
      "Dose-response relationship characterized",
    ],
    regulatoryBasis: [
      "21 CFR Part 58 — Good Laboratory Practice for nonclinical studies",
      "21 CFR 312.23(a)(8) — Pharmacology and toxicology information",
      "ICH S9 — Nonclinical evaluation for anticancer pharmaceuticals",
      "ICH S6(R1) — Preclinical safety evaluation of biotech-derived pharmaceuticals",
      "FDA SEND — Standard for Exchange of Nonclinical Data",
    ],
    crossModuleConsistency: [
      "NOAEL in tox reports matches HED calculation in Module 2",
      "Species used in tox studies match tissue cross-reactivity findings",
      "Dose levels in tox studies support proposed clinical starting dose",
      "PK parameters match those summarized in Investigator Brochure",
    ],
  },

  ind_module_5: {
    docType: "ind_module_5",
    requiredChecks: [
      "Protocol includes Project Optimus dose optimization (not just MTD)",
      "At least two dose levels for comparison",
      "Diversity Action Plan included (FDORA requirement)",
      "Three-analyte PK plan (conjugated ADC, total antibody, free payload)",
      "CRS monitoring plan with ASTCT grading (if bifunctional/afucosylated)",
      "DLT definition and dose escalation rules",
      "Safety stopping rules defined",
      "Informed consent at 8th grade reading level",
    ],
    recommendedChecks: [
      "Biomarker strategy for patient selection",
      "Companion diagnostic development plan if applicable",
      "Data Safety Monitoring Board charter referenced",
      "Long-term follow-up plan for late-onset toxicities",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(6) — Clinical protocol",
      "FDA Project Optimus Guidance (Aug 2024) — Dose optimization",
      "FDORA — Diversity Action Plan requirement",
      "FDA ADC Clinical Pharmacology Guidance — Three-analyte PK",
      "ICH E6(R2) — Good Clinical Practice",
      "21 CFR 50 — Informed consent requirements",
    ],
    crossModuleConsistency: [
      "Starting dose matches NOAEL-derived HED from Module 4",
      "Eligibility criteria consistent with target indication in Module 2",
      "PK sampling plan covers all three analytes described in Module 3",
      "Safety monitoring plan addresses toxicities identified in Module 4",
    ],
  },

  investigator_brochure: {
    docType: "investigator_brochure",
    requiredChecks: [
      "Known payload toxicity profile included",
      "Nonclinical safety data summarized",
      "PK data from animal studies included",
      "Proposed starting dose with safety margin justification",
      "Risk management plan for known class effects",
      "ADC-specific: DAR, free payload, ADCC data if applicable",
    ],
    recommendedChecks: [
      "MOA description with supporting figures",
      "Summary of manufacturing process relevant to safety",
      "Guidance for investigators on dose modifications",
      "Known drug interactions or contraindications",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(5) — Investigator's Brochure",
      "ICH E6(R2) Section 7 — IB content and format",
      "ICH S9 — Safety data presentation for anticancer agents",
    ],
    crossModuleConsistency: [
      "Toxicity data matches Module 4 nonclinical reports",
      "Dose justification matches Module 2 Clinical Overview",
      "MOA description matches Protocol background section",
      "PK parameters match Module 4 data and Module 5 PK plan",
    ],
  },

  clinical_protocol: {
    docType: "clinical_protocol",
    requiredChecks: [
      "Primary and secondary endpoints clearly defined",
      "Eligibility criteria (inclusion/exclusion) complete",
      "Dose escalation scheme with DLT criteria",
      "Project Optimus: randomized parallel cohorts, not just 3+3",
      "Safety monitoring: CRS/MAS grading for bifunctional ADCs",
      "Pharmacokinetic sampling plan (3 analytes)",
      "Biomarker assessment plan",
      "Statistical analysis plan",
      "Data Safety Monitoring Board provisions",
    ],
    recommendedChecks: [
      "Dose modification and re-treatment criteria",
      "Concomitant medication restrictions",
      "Correlative studies plan (translational endpoints)",
      "Sample size justification for dose expansion cohorts",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(6) — Protocol content requirements",
      "ICH E6(R2) — Good Clinical Practice protocol elements",
      "FDA Project Optimus Guidance (Aug 2024) — Dose optimization design",
      "FDORA — Diversity Action Plan",
      "FDA ADC Clinical Pharmacology Guidance — PK sampling requirements",
      "ASTCT Consensus Grading — CRS/ICANS classification",
    ],
    crossModuleConsistency: [
      "Starting dose matches Investigator Brochure recommendation",
      "Eligibility criteria align with nonclinical safety profile",
      "Endpoints consistent with MOA described in Module 2",
      "PK analytes match Module 3 assay capabilities",
      "Safety monitoring covers all toxicities identified in Module 4",
    ],
  },

  pre_ind_briefing: {
    docType: "pre_ind_briefing",
    requiredChecks: [
      "Clear yes/no questions for FDA",
      "CMC summary with key quality attributes",
      "Nonclinical data summary with safety margins",
      "Proposed Phase 1 design synopsis",
      "Specific questions about starting dose",
      "For afucosylated ADCs: question about ADCC potency assay sufficiency",
    ],
    recommendedChecks: [
      "Target biology and rationale summary",
      "Competitive landscape context",
      "Proposed regulatory pathway (accelerated approval, breakthrough, etc.)",
      "Timeline for IND submission",
    ],
    regulatoryBasis: [
      "21 CFR 312.82 — Pre-IND meeting request and content",
      "FDA Guidance: Formal Meetings Between FDA and Sponsors or Applicants of PDUFA Products (2017)",
    ],
    crossModuleConsistency: [
      "CMC data matches current Module 3 status",
      "Nonclinical data matches current Module 4 status",
      "Proposed design consistent with planned Protocol",
    ],
  },

  informed_consent: {
    docType: "informed_consent",
    requiredChecks: [
      "Written at 8th grade reading level or below",
      "Purpose of the study clearly explained",
      "All known risks and side effects described in plain language",
      "Alternatives to participation explained",
      "Voluntary nature of participation stated",
      "Right to withdraw at any time without penalty",
      "Confidentiality protections described",
      "Contact information for study team and IRB",
      "Financial compensation and costs described",
      "For ADCs: payload-specific toxicities explained",
      "For bifunctional ADCs: CRS/MAS risks described",
    ],
    recommendedChecks: [
      "Use of diagrams or visual aids for complex concepts",
      "Translated versions available for non-English speakers",
      "Separate assent form for adolescent participants if applicable",
      "Certificate of Confidentiality referenced",
    ],
    regulatoryBasis: [
      "21 CFR 50.25 — Elements of informed consent",
      "21 CFR 50.27 — Documentation of informed consent",
      "ICH E6(R2) Section 4.8 — Informed consent of trial subjects",
      "45 CFR 46 — Protection of human subjects (Common Rule)",
    ],
    crossModuleConsistency: [
      "Risks described match safety profile in Investigator Brochure",
      "Study procedures match Protocol visit schedule",
      "Study drug description matches Module 3 characterization",
    ],
  },

  diversity_action_plan: {
    docType: "diversity_action_plan",
    requiredChecks: [
      "Enrollment goals by race/ethnicity reflect disease epidemiology",
      "Enrollment goals by sex/gender included",
      "Enrollment goals by age group included",
      "Rationale for each enrollment target provided",
      "Plan for achieving enrollment diversity (site selection, outreach)",
      "Monitoring and reporting plan for diversity metrics",
    ],
    recommendedChecks: [
      "Geographic diversity of clinical sites",
      "Community engagement plan",
      "Translated materials for diverse populations",
      "Assessment of barriers to enrollment and mitigation strategies",
    ],
    regulatoryBasis: [
      "FDORA Section 3602 — Diversity Action Plan requirement",
      "FDA Draft Guidance: Diversity Action Plans to Improve Enrollment (2024)",
      "21 CFR 312.23(a)(6)(iii)(b) — Selection of subjects",
    ],
    crossModuleConsistency: [
      "Target population matches Protocol eligibility criteria",
      "Disease epidemiology data supports enrollment goals",
      "Site selection strategy aligns with diversity targets",
    ],
  },

  fda_form_1571: {
    docType: "fda_form_1571",
    requiredChecks: [
      "All required fields completed (sponsor name, address, IND number)",
      "Drug name and type correctly identified",
      "IND type correctly marked (original, amendment, etc.)",
      "Phase of clinical investigation specified",
      "Serial number assigned",
      "All submitted modules listed in contents section",
      "Sponsor signature and date present",
      "Environmental impact statement or categorical exclusion",
    ],
    recommendedChecks: [
      "Cross-reference to previous submissions if amendment",
      "Contact person information complete",
      "Pre-IND meeting reference number if applicable",
    ],
    regulatoryBasis: [
      "21 CFR 312.23(a)(1) — Form 1571 content requirements",
      "21 CFR 312.40 — IND application requirements",
    ],
    crossModuleConsistency: [
      "Drug name on Form 1571 matches all module headers",
      "Serial number sequential with previous submissions",
      "Modules listed match actual submission contents",
    ],
  },
};

// Drug-class-specific overlay checks
const DRUG_CLASS_OVERLAYS: Record<string, Partial<Record<string, Partial<BioChecklist>>>> = {
  adc: {
    ind_module_3: {
      requiredChecks: [
        "DAR (Drug-to-Antibody Ratio) specification with acceptance criteria",
        "Free payload quantification with validated assay and specification limits",
        "Linker stability data under physiological conditions",
        "ADCC potency assay included (required for afucosylated antibodies)",
        "Conjugation process characterized with critical quality attributes",
      ],
    },
    ind_module_4: {
      requiredChecks: [
        "Tissue cross-reactivity for both target antigen and off-target binding",
        "Deconjugation assessment in vivo (free payload exposure in tox species)",
      ],
    },
    ind_module_5: {
      requiredChecks: [
        "Three-analyte PK mandatory: conjugated ADC, total antibody, free payload",
        "Hepatotoxicity monitoring plan (common ADC class effect)",
        "Ocular toxicity monitoring if applicable (payload-dependent)",
      ],
    },
    clinical_protocol: {
      requiredChecks: [
        "Three-analyte PK sampling schedule with appropriate time points",
        "Hepatotoxicity monitoring with defined dose modification criteria",
        "Peripheral neuropathy assessment schedule (common for MMAE/DM1 payloads)",
      ],
    },
    investigator_brochure: {
      requiredChecks: [
        "DAR characterization and batch consistency data",
        "Free payload levels and clinical relevance",
        "ADCC data if antibody is afucosylated",
        "Linker-payload stability summary",
      ],
    },
  },

  small_molecule: {
    ind_module_3: {
      requiredChecks: [
        "Solid-state characterization (polymorphism, salt form)",
        "Synthetic route with impurity fate map",
        "Genotoxic impurity assessment per ICH M7",
      ],
    },
    ind_module_4: {
      requiredChecks: [
        "Genotoxicity battery (Ames, in vitro chromosomal aberration, in vivo micronucleus)",
        "Carcinogenicity assessment or justification for deferral per ICH S1A",
        "Absorption, distribution, metabolism, excretion (ADME) studies",
        "Drug-drug interaction potential (CYP inhibition/induction)",
      ],
    },
    clinical_protocol: {
      requiredChecks: [
        "Food effect assessment plan",
        "QTc monitoring plan if structurally flagged",
        "Drug-drug interaction study plan or justification for deferral",
      ],
    },
  },

  biologic: {
    ind_module_3: {
      requiredChecks: [
        "Immunogenicity risk assessment",
        "Anti-drug antibody (ADA) assay validation",
        "Post-translational modification characterization",
        "Host cell protein and residual DNA specifications",
      ],
    },
    ind_module_4: {
      requiredChecks: [
        "Immunogenicity assessment in tox species",
        "Impact of ADA on PK/PD in nonclinical studies",
      ],
    },
    ind_module_5: {
      requiredChecks: [
        "Immunogenicity sampling plan (ADA, neutralizing antibodies)",
        "Infusion reaction monitoring and management plan",
      ],
    },
    clinical_protocol: {
      requiredChecks: [
        "ADA sampling schedule (baseline, on-treatment, follow-up)",
        "Infusion reaction grading and management protocol",
        "Immunogenicity impact on PK assessment plan",
      ],
    },
  },

  gene_therapy: {
    ind_module_3: {
      requiredChecks: [
        "Vector characterization (identity, purity, potency, replication competence)",
        "Transgene expression cassette fully described",
        "Viral particle-to-infectivity ratio specified",
        "Environmental release risk assessment",
      ],
    },
    ind_module_4: {
      requiredChecks: [
        "Biodistribution study with vector shedding assessment",
        "Germline integration risk assessment",
        "Long-term expression durability data if available",
        "Insertional mutagenesis risk evaluation",
      ],
    },
    ind_module_5: {
      requiredChecks: [
        "Long-term follow-up plan (minimum 5 years per FDA guidance, 15 for integrating vectors)",
        "Vector shedding monitoring plan",
        "Delayed adverse event reporting plan",
      ],
    },
    clinical_protocol: {
      requiredChecks: [
        "Long-term follow-up schedule (5-15 years depending on vector type)",
        "Vector shedding sample collection plan",
        "Reproductive counseling requirements",
        "Malignancy monitoring plan for integrating vectors",
      ],
    },
  },

  cell_therapy: {
    ind_module_3: {
      requiredChecks: [
        "Cell characterization (identity, purity, viability, potency)",
        "Sterility testing per USP <71> with rapid methods if applicable",
        "Mycoplasma testing",
        "Adventitious agent testing",
        "Potency assay with defined release criteria",
        "Chain of identity (COI) for autologous products",
      ],
    },
    ind_module_4: {
      requiredChecks: [
        "Tumorigenicity assessment",
        "Biodistribution and persistence data",
        "Toxicity in immunocompromised animal models if relevant",
      ],
    },
    ind_module_5: {
      requiredChecks: [
        "CRS/ICANS monitoring and grading plan (ASTCT consensus)",
        "Long-term follow-up plan for secondary malignancies",
        "Lymphodepletion regimen specified if applicable",
      ],
    },
    clinical_protocol: {
      requiredChecks: [
        "CRS/ICANS management algorithm with tocilizumab/corticosteroid criteria",
        "ICU availability requirements during treatment window",
        "Long-term follow-up for secondary malignancy (minimum 15 years for integrating vectors)",
        "REMS requirements if applicable",
      ],
    },
  },
};

// Merge base checklist with drug-class overlay
function mergeChecklist(base: BioChecklist, overlay: Partial<BioChecklist>): BioChecklist {
  const merge = (baseArr: string[], overlayArr?: string[]): string[] => {
    if (!overlayArr || overlayArr.length === 0) return baseArr;
    const existing = new Set(baseArr);
    const additions = overlayArr.filter((item) => !existing.has(item));
    return [...baseArr, ...additions];
  };

  return {
    docType: base.docType,
    requiredChecks: merge(base.requiredChecks, overlay.requiredChecks),
    recommendedChecks: merge(base.recommendedChecks, overlay.recommendedChecks),
    regulatoryBasis: merge(base.regulatoryBasis, overlay.regulatoryBasis),
    crossModuleConsistency: merge(base.crossModuleConsistency, overlay.crossModuleConsistency),
  };
}

/**
 * Returns the compliance checklist for a bio document type.
 * If drugClass is provided, merges class-specific overlay checks.
 *
 * @param docType - Document type key (e.g. "ind_module_3", "clinical_protocol")
 * @param drugClass - Optional drug class for overlays ("adc", "small_molecule", "biologic", "gene_therapy", "cell_therapy")
 * @returns Array of checklist strings (required + recommended combined), or empty array if docType unknown
 */
export function getBioChecklist(docType: string, drugClass?: string): string[] {
  const base = CHECKLISTS[docType];
  if (!base) return [];

  let checklist = base;

  if (drugClass) {
    const normalized = drugClass.toLowerCase().replace(/[\s-]+/g, "_");
    const classKey = normalized.includes("antibody_drug") || normalized.includes("adc") ? "adc" : normalized;
    const classOverlays = DRUG_CLASS_OVERLAYS[classKey];
    if (classOverlays) {
      const overlay = classOverlays[docType];
      if (overlay) {
        checklist = mergeChecklist(base, overlay);
      }
    }
  }

  return [...checklist.requiredChecks, ...checklist.recommendedChecks];
}

/**
 * Returns the full structured checklist (required, recommended, regulatory, cross-module).
 * Use this when you need categorized checks rather than a flat list.
 */
export function getBioChecklistFull(docType: string, drugClass?: string): BioChecklist | null {
  const base = CHECKLISTS[docType];
  if (!base) return null;

  if (!drugClass) return base;

  const normalized = drugClass.toLowerCase().replace(/[\s-]+/g, "_");
  const classKey = normalized.includes("antibody_drug") || normalized.includes("adc") ? "adc" : normalized;
  const classOverlays = DRUG_CLASS_OVERLAYS[classKey];
  if (!classOverlays) return base;

  const overlay = classOverlays[docType];
  if (!overlay) return base;

  return mergeChecklist(base, overlay);
}

/**
 * Returns all supported doc types.
 */
export function getBioDocTypes(): string[] {
  return Object.keys(CHECKLISTS);
}

/**
 * Returns all supported drug classes.
 */
export function getBioDrugClasses(): string[] {
  return Object.keys(DRUG_CLASS_OVERLAYS);
}
