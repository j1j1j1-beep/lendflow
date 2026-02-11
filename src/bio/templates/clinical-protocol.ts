// clinical-protocol.ts
// Generates a DOCX Phase 1 Clinical Protocol from deterministic data + AI prose.
// Follows FDA Project Optimus, FDORA diversity, and ADC-specific safety requirements.

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
  COLORS,
  formatDate,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, ClinicalProtocolProse } from "./types";

// Helper: build a two-column key-value table (label | value) for synopsis-style layouts

function synopsisTable(
  rows: Array<{ label: string; value: string }>,
): Table {
  return createTable(
    ["Parameter", "Detail"],
    rows.map((r) => [r.label, r.value]),
    { columnWidths: [30, 70], alternateRows: true },
  );
}

export function buildClinicalProtocol(
  input: BioDocumentInput,
  prose: ClinicalProtocolProse,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const phase = input.phase ?? "Phase 1";
  const protocolNumber = input.indNumber
    ? `${input.indNumber}-PROTO-001`
    : `[Protocol Number TBD]`;

  // -------------------------------------------------------------------------
  // 1. Title Page
  // -------------------------------------------------------------------------
  children.push(documentTitle("Clinical Protocol"));
  children.push(spacer(4));
  children.push(
    bodyText(`Protocol Number: ${protocolNumber}`, { bold: true }),
  );
  children.push(bodyText(`Sponsor: ${input.sponsorName}`, { bold: true }));
  if (input.sponsorAddress) {
    children.push(bodyText(`Address: ${input.sponsorAddress}`));
  }
  children.push(bodyText(`Drug Name: ${input.drugName}`, { bold: true }));
  children.push(bodyText(`Drug Class: ${input.drugClass}`));
  if (input.target) {
    children.push(bodyText(`Molecular Target: ${input.target}`));
  }
  if (input.indication) {
    children.push(bodyText(`Indication: ${input.indication}`));
  }
  children.push(bodyText(`Phase: ${phase}`));
  if (input.indNumber) {
    children.push(bodyText(`IND Number: ${input.indNumber}`));
  }
  if (input.nctNumber) {
    children.push(bodyText(`ClinicalTrials.gov: ${input.nctNumber}`));
  }
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(
    bodyText("CONFIDENTIAL", { bold: true, color: COLORS.primary }),
  );

  // -------------------------------------------------------------------------
  // 2. Protocol Synopsis
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("1. Protocol Synopsis"));

  const synopsisRows: Array<{ label: string; value: string }> = [
    { label: "Protocol Title", value: `${phase} Study of ${input.drugName} in ${input.indication ?? "[Indication TBD]"}` },
    { label: "Protocol Number", value: protocolNumber },
    { label: "Sponsor", value: input.sponsorName },
    { label: "Study Phase", value: phase },
    { label: "Study Design", value: `Open-label, multicenter, ${phase} dose-escalation and expansion study` },
    { label: "Study Drug", value: `${input.drugName} (${input.drugClass})` },
    { label: "Target Population", value: `Adults with ${input.indication ?? "[indication TBD]"} who have progressed on or are intolerant to standard therapy` },
    { label: "Primary Endpoint", value: "Safety, tolerability, and determination of the Recommended Phase 2 Dose (RP2D) / Optimal Biological Dose (OBD)" },
    { label: "Secondary Endpoints", value: "Pharmacokinetics (three-analyte), immunogenicity (ADA), preliminary anti-tumor activity (RECIST v1.1 / disease-specific criteria)" },
    { label: "Estimated Sample Size", value: "Dose escalation: approximately 30-60 patients; Expansion: approximately 20-40 patients per cohort" },
  ];

  if (input.dar !== undefined) {
    synopsisRows.push({
      label: "Drug-to-Antibody Ratio (DAR)",
      value: `${input.dar}${input.darSpec ? ` (specification: ${input.darSpec.target} +/- ${input.darSpec.tolerance})` : ""}`,
    });
  }

  children.push(synopsisTable(synopsisRows));

  // -------------------------------------------------------------------------
  // 3. Background and Rationale (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("2. Background and Rationale"));
  children.push(bodyText(prose.backgroundRationale));

  // -------------------------------------------------------------------------
  // 4. Objectives
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("3. Study Objectives"));

  children.push(bodyText("Primary Objectives:", { bold: true }));
  children.push(
    bulletPoint(
      "To evaluate the safety and tolerability of escalating doses of " +
      input.drugName +
      " administered intravenously.",
    ),
  );
  children.push(
    bulletPoint(
      "To determine the Maximum Tolerated Dose (MTD) and identify the Optimal Biological Dose (OBD) per FDA Project Optimus guidance.",
    ),
  );
  children.push(
    bulletPoint(
      "To establish the Recommended Phase 2 Dose (RP2D) based on integrated safety, efficacy, and pharmacokinetic data.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Secondary Objectives:", { bold: true }));
  children.push(
    bulletPoint(
      "To characterize the pharmacokinetic profile of " +
      input.drugName +
      " using a three-analyte assay (conjugated ADC, total antibody, free payload).",
    ),
  );
  children.push(
    bulletPoint(
      "To evaluate immunogenicity by measuring anti-drug antibodies (ADA).",
    ),
  );
  children.push(
    bulletPoint(
      "To assess preliminary anti-tumor activity (overall response rate, duration of response, disease control rate).",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Exploratory Objectives:", { bold: true }));
  children.push(
    bulletPoint(
      "To identify predictive biomarkers of response (e.g., target expression level, circulating tumor DNA).",
    ),
  );
  children.push(
    bulletPoint(
      "To evaluate exposure-response relationships for safety and efficacy endpoints.",
    ),
  );

  // -------------------------------------------------------------------------
  // 5. Study Design
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("4. Study Design"));
  children.push(bodyText(prose.studyDesignRationale));

  children.push(spacer(2));
  children.push(bodyText("Project Optimus Dose Optimization:", { bold: true }));
  children.push(
    bodyText(
      "In accordance with FDA Project Optimus guidance (finalized August 2024), this protocol employs a dose optimization strategy that goes beyond identifying the MTD. The study includes randomized parallel dose-expansion cohorts to compare at least two dose levels on the basis of safety, tolerability, pharmacokinetics, pharmacodynamics, and preliminary efficacy. The RP2D will be selected as the Optimal Biological Dose (OBD), which may be lower than the MTD, supported by integrated benefit-risk assessment.",
    ),
  );

  // Dose Escalation Schema Table
  children.push(spacer(4));
  children.push(bodyText("Dose Escalation Schema:", { bold: true }));
  children.push(
    createTable(
      ["Dose Level", "Dose (mg/kg)", "Number of Patients", "DLT Evaluation Period", "Escalation Decision Rule"],
      [
        ["-1 (De-escalation)", "[TBD]", "3-6", "21 days (Cycle 1)", "Triggered by excessive DLTs at Dose Level 1"],
        ["1 (Starting Dose)", "[TBD]", "3-6", "21 days (Cycle 1)", "mTPI-2 / BOIN design: escalate if 0/3 DLT; expand if 1/3 DLT"],
        ["2", "[TBD]", "3-6", "21 days (Cycle 1)", "Continue escalation per model-guided rules"],
        ["3", "[TBD]", "3-6", "21 days (Cycle 1)", "Continue escalation per model-guided rules"],
        ["4", "[TBD]", "3-6", "21 days (Cycle 1)", "Continue escalation per model-guided rules"],
        ["5", "[TBD]", "3-6", "21 days (Cycle 1)", "Maximum planned dose; expand at MTD or below"],
      ],
      { alternateRows: true },
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "Dose-limiting toxicity (DLT) evaluation will use a model-guided design (Bayesian optimal interval or modified toxicity probability interval). A Safety Review Committee (SRC) will review all available safety, PK, and biomarker data before each escalation decision. Intra-patient dose escalation is not permitted during the DLT evaluation period.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 6. Study Population
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("5. Study Population"));

  children.push(bodyText("Key Inclusion Criteria:", { bold: true }));
  children.push(
    bulletPoint(
      `Histologically or cytologically confirmed ${input.indication ?? "[indication]"} that is advanced, metastatic, or unresectable.`,
    ),
  );
  children.push(
    bulletPoint(
      "Disease progression on or intolerance to at least one prior line of standard systemic therapy, or no available standard therapy.",
    ),
  );
  children.push(bulletPoint("Age 18 years or older."));
  children.push(
    bulletPoint(
      "Eastern Cooperative Oncology Group (ECOG) performance status of 0 or 1.",
    ),
  );
  children.push(
    bulletPoint(
      "Adequate organ function as defined by: ANC >= 1,500/uL, platelets >= 100,000/uL, hemoglobin >= 9.0 g/dL, total bilirubin <= 1.5x ULN, AST/ALT <= 3x ULN (or <= 5x ULN if liver metastases), creatinine clearance >= 50 mL/min (Cockcroft-Gault).",
    ),
  );
  children.push(
    bulletPoint("Measurable disease per RECIST v1.1 (or disease-specific criteria as applicable)."),
  );
  children.push(
    bulletPoint(
      "Adequate cardiac function: LVEF >= 50% by echocardiogram or MUGA scan.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Key Exclusion Criteria:", { bold: true }));
  children.push(
    bulletPoint("Known active central nervous system metastases (treated, stable CNS metastases are permitted)."),
  );
  children.push(
    bulletPoint("Prior treatment with an ADC targeting the same antigen within the last 6 months."),
  );
  children.push(
    bulletPoint("Active autoimmune disease requiring systemic immunosuppressive therapy."),
  );
  children.push(
    bulletPoint(
      "Known hypersensitivity to any component of the study drug or to monoclonal antibodies.",
    ),
  );
  children.push(
    bulletPoint(
      "Significant cardiovascular disease: myocardial infarction or unstable angina within 6 months, NYHA Class III/IV heart failure, QTcF > 470 ms.",
    ),
  );
  children.push(
    bulletPoint("Active, uncontrolled infection requiring IV antibiotics."),
  );
  children.push(
    bulletPoint("Pregnancy or breastfeeding; patients of childbearing potential must use effective contraception."),
  );

  // -------------------------------------------------------------------------
  // 7. Treatment Plan
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("6. Treatment Plan"));

  children.push(bodyText("Study Drug Administration:", { bold: true }));
  children.push(
    bodyText(
      `${input.drugName} will be administered as an intravenous (IV) infusion on Day 1 of each 21-day cycle. The first infusion will be administered over a minimum of 120 minutes with mandatory observation. If the first infusion is tolerated without infusion-related reactions, subsequent infusions may be administered over 60 minutes at the investigator's discretion.`,
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Premedication:", { bold: true }));
  children.push(
    bulletPoint("Acetaminophen 650 mg orally, 30-60 minutes prior to infusion."),
  );
  children.push(
    bulletPoint("Diphenhydramine 25-50 mg IV or orally, 30-60 minutes prior to infusion."),
  );
  children.push(
    bulletPoint("Dexamethasone 8 mg IV, 30-60 minutes prior to infusion (mandatory for first two cycles; optional thereafter at investigator's discretion)."),
  );

  children.push(spacer(2));
  children.push(bodyText("Dose Modifications:", { bold: true }));
  children.push(
    createTable(
      ["Toxicity Grade (CTCAE v5.0)", "Action", "Dose Adjustment"],
      [
        ["Grade 1", "Continue treatment", "No dose reduction"],
        ["Grade 2 (first occurrence)", "Hold until recovery to Grade <= 1", "Resume at same dose level"],
        ["Grade 2 (recurrent)", "Hold until recovery to Grade <= 1", "Reduce by one dose level"],
        ["Grade 3 (first occurrence)", "Hold until recovery to Grade <= 1", "Reduce by one dose level"],
        ["Grade 3 (recurrent)", "Hold until recovery to Grade <= 1", "Discontinue study drug"],
        ["Grade 4", "Hold until recovery to Grade <= 1", "Discontinue study drug (exceptions per protocol)"],
      ],
      { alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 8. Safety Assessments
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("7. Safety Assessments"));
  children.push(bodyText(prose.safetyMonitoringPlan));

  // CRS/MAS Monitoring (required for afucosylated ADCs)
  const isAfucosylated =
    input.antibodyType?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("bifunctional");

  if (isAfucosylated) {
    children.push(spacer(2));
    children.push(
      bodyText("Cytokine Release Syndrome (CRS) Monitoring:", { bold: true }),
    );
    children.push(
      bodyText(
        "Given the afucosylated antibody backbone of " +
        input.drugName +
        ", enhanced ADCC activity may increase the risk of cytokine release syndrome (CRS) and macrophage activation syndrome (MAS). The following monitoring plan is mandated:",
      ),
    );
    children.push(
      bulletPoint(
        "CRS Grading: Per ASTCT (American Society for Transplantation and Cellular Therapy) consensus grading system.",
      ),
    );
    children.push(
      bulletPoint(
        "Pre-dose cytokine panel (IL-6, TNF-alpha, IFN-gamma, ferritin) at Cycle 1 Day 1 pre-dose, 2h, 6h, 24h, and as clinically indicated thereafter.",
      ),
    );
    children.push(
      bulletPoint(
        "Vital signs monitoring every 15 minutes during infusion and for 2 hours post-infusion (Cycles 1-2); every 30 minutes for subsequent cycles if no prior CRS.",
      ),
    );
    children.push(
      bulletPoint(
        "Tocilizumab must be available on-site at all study centers for CRS management.",
      ),
    );

    children.push(spacer(2));
    children.push(
      bodyText("CRS Management Algorithm:", { bold: true }),
    );
    children.push(
      createTable(
        ["CRS Grade", "Symptoms", "Management"],
        [
          ["Grade 1", "Fever >= 38C; no hypotension; no hypoxia", "Supportive care; continue monitoring; antipyretics"],
          ["Grade 2", "Fever + hypotension not requiring vasopressors; or hypoxia requiring low-flow O2", "Hold infusion; IV fluids; consider tocilizumab 8 mg/kg IV; hospitalize if needed"],
          ["Grade 3", "Fever + hypotension requiring vasopressors; or hypoxia requiring high-flow O2 / non-invasive ventilation", "Tocilizumab 8 mg/kg IV (repeat x1 if no improvement in 8h); dexamethasone 10 mg IV q6h; ICU transfer"],
          ["Grade 4", "Life-threatening: hypotension requiring multiple vasopressors (excluding vasopressin); or hypoxia requiring positive pressure ventilation (CPAP/BiPAP/intubation); or multi-organ toxicity", "ICU management; tocilizumab + high-dose corticosteroids; discontinue study drug permanently"],
        ],
        { alternateRows: true },
      ),
    );

    children.push(spacer(2));
    children.push(
      bodyText("Macrophage Activation Syndrome (MAS) Monitoring:", { bold: true }),
    );
    children.push(
      bulletPoint(
        "Ferritin, triglycerides, fibrinogen, and LDH at baseline and on Days 1, 2, 8, and 15 of Cycle 1; then per schedule.",
      ),
    );
    children.push(
      bulletPoint(
        "MAS diagnostic criteria: Ferritin > 10,000 ng/mL with at least 2 of: splenomegaly, cytopenias affecting >= 2 lineages, triglycerides > 265 mg/dL, fibrinogen < 150 mg/dL, elevated soluble IL-2 receptor.",
      ),
    );
    children.push(
      bulletPoint(
        "If MAS is suspected, immediate discontinuation of study drug and initiation of high-dose corticosteroids with hematology/oncology consultation.",
      ),
    );
  }

  // Visit Schedule Table
  children.push(spacer(4));
  children.push(bodyText("Visit Schedule:", { bold: true }));
  children.push(
    createTable(
      ["Assessment", "Screening", "C1D1", "C1D2", "C1D8", "C1D15", "C2D1+", "EOT", "Follow-up"],
      [
        ["Informed Consent", "X", "", "", "", "", "", "", ""],
        ["Medical History", "X", "", "", "", "", "", "", ""],
        ["Physical Exam", "X", "X", "", "", "X", "X", "X", "X"],
        ["Vital Signs", "X", "X", "X", "X", "X", "X", "X", "X"],
        ["ECOG Performance Status", "X", "X", "", "", "", "X", "X", ""],
        ["12-Lead ECG", "X", "X", "", "", "X", "X", "X", ""],
        ["Echocardiogram/MUGA", "X", "", "", "", "", "Q12W", "X", ""],
        ["Hematology", "X", "X", "", "X", "X", "X", "X", "X"],
        ["Chemistry + LFTs", "X", "X", "", "X", "X", "X", "X", "X"],
        ["Coagulation (PT/INR, aPTT)", "X", "X", "", "", "X", "X", "X", ""],
        ["Urinalysis", "X", "", "", "", "", "X", "X", ""],
        ["Pregnancy Test", "X", "X", "", "", "", "X", "X", ""],
        ["PK Sampling (3-analyte)", "", "X", "X", "X", "X", "X", "X", ""],
        ["ADA Sampling", "", "X", "", "", "", "Q2C", "X", "X"],
        ["Cytokine Panel (CRS)", "", "X", "X", "", "", "X", "", ""],
        ["Tumor Assessment", "X", "", "", "", "", "Q6W", "X", ""],
        ["Adverse Events", "", "X", "X", "X", "X", "X", "X", "X"],
        ["Concomitant Medications", "X", "X", "X", "X", "X", "X", "X", "X"],
        ["Biomarker Sampling", "X", "X", "", "", "", "Q6W", "X", ""],
      ],
      { alternateRows: true },
    ),
  );

  // Lab Monitoring Table
  children.push(spacer(4));
  children.push(bodyText("Laboratory Monitoring Parameters:", { bold: true }));
  children.push(
    createTable(
      ["Panel", "Parameters", "Frequency"],
      [
        ["Hematology", "CBC with differential, platelet count, reticulocyte count", "Days 1, 8, 15 of each cycle"],
        ["Chemistry", "BUN, creatinine, sodium, potassium, chloride, bicarbonate, calcium, magnesium, phosphorus, glucose, uric acid", "Days 1 and 15 of each cycle"],
        ["Hepatic", "AST, ALT, total bilirubin, direct bilirubin, alkaline phosphatase, albumin, GGT", "Days 1 and 15 of each cycle"],
        ["Coagulation", "PT/INR, aPTT, fibrinogen, D-dimer", "Day 1 of each cycle (more frequent if CRS concern)"],
        ["Cardiac", "Troponin I/T, BNP or NT-proBNP", "Day 1 of Cycles 1-4, then every other cycle"],
        ["Inflammatory", "CRP, ferritin, IL-6, TNF-alpha, IFN-gamma", "C1D1 pre/post-dose, C1D2, C1D8; then Day 1 each cycle"],
        ["Thyroid", "TSH, free T3, free T4", "Screening, then every 6 weeks"],
        ["Urinalysis", "Protein, blood, glucose, specific gravity", "Day 1 of every other cycle"],
      ],
      { alternateRows: true },
    ),
  );

  // Three-analyte PK Sampling Plan
  children.push(spacer(4));
  children.push(
    bodyText("Three-Analyte Pharmacokinetic Sampling Plan:", { bold: true }),
  );
  children.push(
    bodyText(
      "Per FDA Clinical Pharmacology Considerations for ADCs, three analytes must be measured to characterize the PK of the conjugated and unconjugated drug species:",
    ),
  );
  children.push(
    createTable(
      ["Analyte", "Assay Method", "LLOQ Target", "Purpose"],
      [
        [
          "Conjugated ADC (drug-conjugated antibody)",
          "Validated ligand-binding assay (ELISA) with anti-payload capture",
          "[TBD] ng/mL",
          "Primary efficacy-driving species; determines exposure of active drug",
        ],
        [
          "Total Antibody (conjugated + unconjugated mAb)",
          "Validated ligand-binding assay (ELISA) with anti-idiotype capture",
          "[TBD] ng/mL",
          "Total mAb clearance; deconjugation rate calculation (total minus conjugated)",
        ],
        [
          "Free (unconjugated) Payload",
          "Validated LC-MS/MS",
          "[TBD] ng/mL",
          "Safety assessment; free payload drives off-target toxicity",
        ],
      ],
      { alternateRows: true },
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("PK Sampling Timepoints (Cycle 1):", { bold: true }));
  children.push(
    createTable(
      ["Timepoint", "Day", "Time Relative to Infusion", "Analytes"],
      [
        ["Pre-dose", "Day 1", "Within 60 min before infusion start", "All three"],
        ["End of infusion", "Day 1", "Within 15 min of infusion end", "All three"],
        ["2 hours post-infusion", "Day 1", "2h (+/- 15 min) after infusion end", "All three"],
        ["6 hours post-infusion", "Day 1", "6h (+/- 30 min) after infusion end", "Conjugated ADC, Free Payload"],
        ["24 hours", "Day 2", "24h (+/- 2h) after infusion start", "All three"],
        ["168 hours", "Day 8", "168h (+/- 4h) after infusion start", "All three"],
        ["336 hours", "Day 15", "336h (+/- 4h) after infusion start", "All three"],
      ],
      { alternateRows: true },
    ),
  );
  children.push(
    bodyText(
      "Note: Insufficient PK sensitivity for any of the three analytes may result in a clinical hold per FDA guidance. All assays must be validated prior to first patient dosing.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 9. Efficacy Assessments
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("8. Efficacy Assessments"));

  children.push(bodyText("Tumor Response Assessment:", { bold: true }));
  children.push(
    bulletPoint(
      "Radiographic assessment (CT or MRI per RECIST v1.1) at screening and every 6 weeks (+/- 7 days) for the first 6 months, then every 9 weeks thereafter.",
    ),
  );
  children.push(
    bulletPoint(
      "Response categories: Complete Response (CR), Partial Response (PR), Stable Disease (SD), Progressive Disease (PD) per RECIST v1.1.",
    ),
  );
  children.push(
    bulletPoint(
      "Confirmation of response required at least 4 weeks after initial documentation of CR or PR.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Efficacy Endpoints:", { bold: true }));
  children.push(
    bulletPoint("Overall Response Rate (ORR): proportion of patients achieving CR or PR."),
  );
  children.push(
    bulletPoint("Duration of Response (DoR): time from first response to progression or death."),
  );
  children.push(
    bulletPoint("Disease Control Rate (DCR): proportion of patients achieving CR, PR, or SD lasting >= 6 weeks."),
  );
  children.push(
    bulletPoint("Progression-Free Survival (PFS): time from first dose to progression or death (exploratory in Phase 1)."),
  );

  // -------------------------------------------------------------------------
  // 10. Statistical Plan (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("9. Statistical Plan"));
  children.push(bodyText(prose.statisticalMethods));

  children.push(spacer(2));
  children.push(bodyText("Sample Size Justification:", { bold: true }));
  children.push(
    bodyText(
      "Dose Escalation: Approximately 30-60 patients, depending on the number of dose levels explored and the dose-escalation model outcomes. The sample size follows standard Phase 1 dose-finding methodology and is not based on formal power calculations for efficacy.",
    ),
  );
  children.push(
    bodyText(
      "Dose Expansion: Approximately 20-40 patients per expansion cohort. With 20 patients, the study has approximately 90% probability of observing at least one event if the true event rate is >= 10%, providing adequate safety characterization. With 40 patients and a true ORR of 30%, the two-sided 95% exact confidence interval is approximately (16.6%, 46.5%).",
    ),
  );

  // -------------------------------------------------------------------------
  // 11. Diversity Action Plan (FDORA)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("10. Diversity Action Plan"));
  children.push(
    bodyText(
      "In compliance with the Food and Drug Omnibus Reform Act (FDORA), a Diversity Action Plan is included as a companion document to this protocol. The plan establishes enrollment targets by race, ethnicity, sex, and age group that reflect the disease epidemiology in the intended treatment population. Enrollment will be monitored on an ongoing basis, and recruitment strategies will be adjusted if enrollment milestones are not met. The complete Diversity Action Plan is submitted as a separate document with the IND application.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Site Selection Diversity Requirements:", { bold: true }));
  children.push(
    bulletPoint(
      "A minimum of 30% of clinical sites must be located in geographic areas with high representation of underrepresented racial and ethnic populations.",
    ),
  );
  children.push(
    bulletPoint(
      "At least 2 community-based clinical sites (non-academic) must be included to improve access for patients who do not reside near major academic medical centers.",
    ),
  );
  children.push(
    bulletPoint(
      "Trial materials (informed consent, patient-facing documents) will be available in English and Spanish at a minimum.",
    ),
  );

  // -------------------------------------------------------------------------
  // 12. Ethical Considerations (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("11. Ethical Considerations"));
  children.push(bodyText(prose.ethicalConsiderations));

  children.push(spacer(2));
  children.push(
    bodyText(
      "This study will be conducted in accordance with the Declaration of Helsinki, ICH E6(R2) Good Clinical Practice guidelines, and all applicable local and federal regulations (including 21 CFR Parts 50, 56, and 312). Written informed consent will be obtained from all patients prior to any study-related procedures. The protocol, informed consent form, and any amendments must be approved by the IRB/Ethics Committee at each participating site before implementation.",
    ),
  );

  // -------------------------------------------------------------------------
  // 13. Data Safety Monitoring Board
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("12. Data Safety Monitoring"));

  children.push(
    bodyText(
      "An independent Safety Review Committee (SRC) will be established to monitor patient safety throughout the study. The SRC will consist of at least two external oncologists, one biostatistician, and one pharmacologist who are not otherwise involved in the conduct of the study.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("SRC Responsibilities:", { bold: true }));
  children.push(
    bulletPoint("Review all DLTs and serious adverse events (SAEs) in real time."),
  );
  children.push(
    bulletPoint("Recommend dose escalation, de-escalation, or study modification decisions."),
  );
  children.push(
    bulletPoint("Conduct formal safety reviews at each dose level before escalation."),
  );
  children.push(
    bulletPoint(
      "Review cumulative safety data at minimum quarterly intervals and recommend protocol amendments if needed.",
    ),
  );
  children.push(
    bulletPoint(
      "Authority to pause enrollment, modify dosing, or recommend study termination for safety reasons.",
    ),
  );

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Clinical Protocol",
    headerRight: `${protocolNumber} -- ${input.drugName} ${phase}`,
    children,
  });
}
