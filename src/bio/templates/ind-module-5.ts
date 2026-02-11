// ind-module-5.ts
// Generates a DOCX IND Module 5: Clinical Protocol + IB Reference from deterministic data + AI prose.

import {
  Document,
  Paragraph,
  Table,
  PageBreak,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  sectionSubheading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  createTable,
  formatDate,
  ensureProseArray,
  COLORS,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, INDModule5Prose } from "./types";

// Helpers

function isADC(input: BioDocumentInput): boolean {
  return (
    input.drugClass?.toLowerCase().includes("adc") ||
    input.drugClass?.toLowerCase().includes("antibody-drug conjugate") ||
    !!input.linkerType ||
    !!input.payloadType
  );
}

function isAfucosylated(input: BioDocumentInput): boolean {
  return input.antibodyType?.toLowerCase().includes("afucosylat") ?? false;
}

function isBifunctional(input: BioDocumentInput): boolean {
  return (
    input.drugClass?.toLowerCase().includes("bifunctional") ||
    input.mechanism?.toLowerCase().includes("bifunctional") ||
    false
  );
}

function formatDar(input: BioDocumentInput): string {
  if (input.darSpec) {
    return `${input.darSpec.target} +/- ${input.darSpec.tolerance}`;
  }
  if (input.dar !== undefined) {
    return String(input.dar);
  }
  return "[DAR TBD]";
}

function getClinicalField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.clinicalData && key in input.clinicalData) {
    return String(input.clinicalData[key]);
  }
  return fallback;
}

function getToxField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.toxData && key in input.toxData) {
    return String(input.toxData[key]);
  }
  return fallback;
}

// Builder

export function buildINDModule5(
  input: BioDocumentInput,
  prose: INDModule5Prose,
): Document {
  const dateFormatted = formatDate(input.generatedAt);
  const adc = isADC(input);
  const afucosylated = isAfucosylated(input);
  const bifunctional = isBifunctional(input);
  const requiresCrsMonitoring = bifunctional || afucosylated;

  const children: (Paragraph | Table)[] = [];

  // Title page
  children.push(documentTitle("IND Module 5: Clinical Protocol"));
  children.push(spacer(4));
  children.push(
    bodyText(`Protocol Title: Phase 1, Open-Label, Dose-Escalation Study of ${input.drugName} in Patients with ${input.indication ?? "[Indication TBD]"}`, { bold: true }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(`Drug Name: ${input.drugName}`, { bold: true }),
  );
  children.push(
    bodyText(`Drug Class: ${input.drugClass}`, { bold: true }),
  );
  if (input.target) {
    children.push(
      bodyText(`Target: ${input.target}`, { bold: true }),
    );
  }
  children.push(
    bodyText(`Sponsor: ${input.sponsorName}`, { bold: true }),
  );
  if (input.sponsorAddress) {
    children.push(
      bodyText(`Address: ${input.sponsorAddress}`),
    );
  }
  if (input.indNumber) {
    children.push(
      bodyText(`IND Number: ${input.indNumber}`, { bold: true }),
    );
  }
  if (input.nctNumber) {
    children.push(
      bodyText(`ClinicalTrials.gov: ${input.nctNumber}`, { bold: true }),
    );
  }
  children.push(
    bodyText(`Phase: ${input.phase ?? "Phase 1"}`, { bold: true }),
  );
  children.push(
    bodyText(`Date: ${dateFormatted}`, { bold: true }),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "CONFIDENTIAL: This document contains proprietary clinical protocol information. " +
      "Unauthorized disclosure is prohibited.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  // Section 1: Protocol Synopsis
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.1 Protocol Synopsis"));
  children.push(spacer(2));

  const proposedStartingDose = getToxField(input, "proposedStartingDose", "[Starting Dose TBD]");
  const maxDose = getClinicalField(input, "maxDose", "[Max Dose TBD]");
  const doseLevels = getClinicalField(input, "numberOfDoseLevels", "[N TBD]");
  const enrollmentTarget = getClinicalField(input, "enrollmentTarget", "[N TBD]");
  const studyDuration = getClinicalField(input, "studyDuration", "[Duration TBD]");

  children.push(
    createTable(
      ["Element", "Description"],
      [
        ["Study Title", `Phase 1, Open-Label, Dose-Escalation Study of ${input.drugName} in Patients with ${input.indication ?? "[Indication TBD]"}`],
        ["Sponsor", input.sponsorName],
        ["Drug", `${input.drugName} (${input.drugClass})`],
        ["Phase", input.phase ?? "Phase 1"],
        ["Study Design", "Open-label, multi-center, dose-escalation with expansion cohorts"],
        ["Indication", input.indication ?? "[Indication TBD]"],
        ["Target Population", `Adults with ${input.indication ?? "[indication]"} who have failed standard therapy`],
        ["Starting Dose", proposedStartingDose],
        ["Maximum Planned Dose", maxDose],
        ["Number of Dose Levels", doseLevels],
        ["Estimated Enrollment", enrollmentTarget],
        ["Estimated Study Duration", studyDuration],
        ["Primary Endpoint", "Safety and tolerability; determination of MTD and/or Optimal Biological Dose (OBD)"],
      ],
      { columnWidths: [30, 70], alternateRows: true },
    ),
  );

  // Section 2: Study Objectives
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.2 Study Objectives"));
  children.push(spacer(2));

  children.push(sectionSubheading("5.2.1", "Primary Objectives"));
  children.push(spacer(2));
  children.push(
    bulletPoint(
      `Evaluate the safety and tolerability of ${input.drugName} administered to patients with ${input.indication ?? "[indication]"}.`,
    ),
  );
  children.push(
    bulletPoint(
      `Determine the Maximum Tolerated Dose (MTD) and/or Optimal Biological Dose (OBD) of ${input.drugName}.`,
    ),
  );

  children.push(spacer(2));
  children.push(sectionSubheading("5.2.2", "Secondary Objectives"));
  children.push(spacer(2));
  children.push(
    bulletPoint(
      `Characterize the pharmacokinetic (PK) profile of ${input.drugName}.`,
    ),
  );
  if (adc) {
    children.push(
      bulletPoint(
        "Characterize the PK of all three analytes: conjugated ADC, total antibody, and free payload.",
      ),
    );
  }
  children.push(
    bulletPoint(
      "Evaluate preliminary antitumor activity per RECIST v1.1.",
    ),
  );
  children.push(
    bulletPoint(
      "Assess immunogenicity (anti-drug antibodies, ADA).",
    ),
  );

  children.push(spacer(2));
  children.push(sectionSubheading("5.2.3", "Exploratory Objectives"));
  children.push(spacer(2));
  children.push(
    bulletPoint(
      "Evaluate potential predictive biomarkers of response and resistance.",
    ),
  );
  children.push(
    bulletPoint(
      `Assess target expression (${input.target ?? "[target]"}) in tumor biopsies and correlation with clinical outcome.`,
    ),
  );
  if (afucosylated) {
    children.push(
      bulletPoint(
        "Assess ADCC activity markers (NK cell activation, cytokine profiles) as pharmacodynamic endpoints.",
      ),
    );
  }

  // Section 3: Study Rationale (AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.3 Study Design and Rationale"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.studyRationale)) {
    children.push(bodyText(para));
  }

  // Section 4: Dosing Plan with Dose Escalation Table (deterministic)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.4 Dosing Plan"));
  children.push(spacer(2));

  children.push(sectionSubheading("5.4.1", "Dose Escalation Schema"));
  children.push(spacer(2));

  const doseEscalationLevels = (input.clinicalData?.doseEscalation as Array<Record<string, unknown>>) ?? null;

  if (doseEscalationLevels && doseEscalationLevels.length > 0) {
    children.push(
      createTable(
        ["Dose Level", "Dose", "Schedule", "Patients (N)", "DLT Window"],
        doseEscalationLevels.map((d) => [
          String(d.level ?? ""),
          String(d.dose ?? ""),
          String(d.schedule ?? ""),
          String(d.n ?? ""),
          String(d.dltWindow ?? ""),
        ]),
        { columnWidths: [15, 20, 25, 15, 25], alternateRows: true },
      ),
    );
  } else {
    children.push(
      createTable(
        ["Dose Level", "Dose", "Schedule", "Patients (N)", "DLT Window"],
        [
          ["1", proposedStartingDose, "[Schedule TBD]", "3-6", "21 days"],
          ["2", "[Dose 2 TBD]", "[Schedule TBD]", "3-6", "21 days"],
          ["3", "[Dose 3 TBD]", "[Schedule TBD]", "3-6", "21 days"],
          ["4", "[Dose 4 TBD]", "[Schedule TBD]", "3-6", "21 days"],
          ["Expansion", "[OBD or MTD]", "[Schedule TBD]", "[N TBD]", "N/A"],
        ],
        { columnWidths: [15, 20, 25, 15, 25], alternateRows: true },
      ),
    );
  }

  children.push(spacer(4));

  // Project Optimus compliance section (REQUIRED)
  children.push(sectionSubheading("5.4.2", "Project Optimus Compliance: Dose Optimization"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "This protocol is designed in compliance with FDA's Project Optimus framework " +
      "(finalized August 2024), which requires identification of the Optimal Biological Dose (OBD), " +
      "not solely the Maximum Tolerated Dose (MTD).",
      { bold: true },
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "The dose optimization strategy includes the following elements:",
    ),
  );
  children.push(spacer(2));
  children.push(
    bulletPoint(
      "Multiple dose levels will be evaluated beyond MTD determination: expansion cohorts will " +
      "compare at least two dose levels to identify the OBD based on the totality of safety, " +
      "efficacy, and PK/PD data.",
    ),
  );
  children.push(
    bulletPoint(
      "Randomized parallel cohorts in the dose expansion phase will enable direct comparison " +
      "of selected dose levels.",
    ),
  );
  children.push(
    bulletPoint(
      "Both exposure-response (PK/PD) and dose-response (clinical outcomes) relationships " +
      "will be characterized.",
    ),
  );
  children.push(
    bulletPoint(
      "Dose selection for Phase 2 will be based on integrated analysis of safety, preliminary " +
      "efficacy, PK, and biomarker data across all dose levels, not solely the highest tolerated dose.",
    ),
  );
  if (adc) {
    children.push(
      bulletPoint(
        "ADC-specific dose optimization will include assessment of all three PK analytes " +
        "(conjugated ADC, total antibody, free payload) at each dose level to characterize the " +
        "exposure-response relationship for both efficacy and toxicity.",
      ),
    );
  }

  // Section 5: Eligibility Criteria (deterministic)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.5 Eligibility Criteria"));
  children.push(spacer(2));

  children.push(sectionSubheading("5.5.1", "Inclusion Criteria"));
  children.push(spacer(2));

  const inclusionCriteria = (input.clinicalData?.inclusionCriteria as string[]) ?? null;

  if (inclusionCriteria && inclusionCriteria.length > 0) {
    for (const criterion of inclusionCriteria) {
      children.push(bulletPoint(criterion));
    }
  } else {
    children.push(bulletPoint("Age >= 18 years at time of informed consent."));
    children.push(bulletPoint(`Histologically or cytologically confirmed ${input.indication ?? "[indication]"}.`));
    children.push(bulletPoint("Documented progressive disease after at least one prior line of systemic therapy."));
    children.push(bulletPoint("ECOG Performance Status 0 or 1."));
    children.push(bulletPoint("Measurable disease per RECIST v1.1."));
    children.push(bulletPoint("Adequate organ function as defined by protocol-specified laboratory values."));
    children.push(bulletPoint("Life expectancy >= 12 weeks."));
    children.push(bulletPoint("Ability to provide written informed consent."));
    if (adc) {
      children.push(bulletPoint(`Tumor must express ${input.target ?? "[target]"} as confirmed by IHC or validated assay.`));
    }
  }

  children.push(spacer(4));
  children.push(sectionSubheading("5.5.2", "Exclusion Criteria"));
  children.push(spacer(2));

  const exclusionCriteria = (input.clinicalData?.exclusionCriteria as string[]) ?? null;

  if (exclusionCriteria && exclusionCriteria.length > 0) {
    for (const criterion of exclusionCriteria) {
      children.push(bulletPoint(criterion));
    }
  } else {
    children.push(bulletPoint("Active or untreated brain metastases."));
    children.push(bulletPoint("Prior treatment with the same target class within 4 weeks of first dose."));
    children.push(bulletPoint("Known hypersensitivity to any component of the study drug."));
    children.push(bulletPoint("Significant cardiovascular disease (NYHA Class III/IV, QTc > 480 ms, uncontrolled hypertension)."));
    children.push(bulletPoint("Active autoimmune disease requiring systemic immunosuppressive therapy."));
    children.push(bulletPoint("Active infection requiring IV antibiotics within 14 days of first dose."));
    children.push(bulletPoint("Pregnant or breastfeeding."));
    children.push(bulletPoint("Major surgery within 4 weeks of first dose."));
    if (adc) {
      children.push(bulletPoint("Prior severe (Grade >= 3) infusion-related reaction to a monoclonal antibody."));
      children.push(bulletPoint(`Known corneal disease or ocular toxicity history (for ${input.payloadType ?? "payload"}-class ADCs, as applicable).`));
    }
  }

  // Deterministic: eligibility criteria summary table
  children.push(spacer(4));
  children.push(sectionSubheading("5.5.3", "Key Eligibility Summary"));
  children.push(spacer(2));
  children.push(
    createTable(
      ["Criterion", "Requirement"],
      [
        ["Age", ">= 18 years"],
        ["ECOG PS", "0-1"],
        ["Prior Lines of Therapy", ">= 1"],
        ["Measurable Disease", "RECIST v1.1"],
        ["Target Expression", adc ? `${input.target ?? "[target]"} positive by IHC` : "N/A"],
        ["Organ Function", "Per protocol-defined thresholds"],
        ["Washout Period", "4 weeks from prior anticancer therapy"],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );

  // Section 6: Safety Monitoring (AI prose + deterministic)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.6 Safety Monitoring"));
  children.push(spacer(2));

  // AI prose: safety monitoring plan
  for (const para of ensureProseArray(prose.safetyMonitoringPlan)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("5.6.1", "Dose-Limiting Toxicity (DLT) Definitions"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Dose-limiting toxicities are defined as any of the following events occurring during the " +
      "DLT evaluation window that are assessed as related to the study drug (CTCAE v5.0):",
    ),
  );
  children.push(spacer(2));
  children.push(bulletPoint("Grade >= 4 hematologic toxicity lasting > 7 days."));
  children.push(bulletPoint("Grade >= 3 non-hematologic toxicity (excluding alopecia, nausea/vomiting controlled with antiemetics)."));
  children.push(bulletPoint("Grade >= 3 febrile neutropenia."));
  children.push(bulletPoint("Any treatment-related death."));
  children.push(bulletPoint("Any toxicity requiring dose delay > 21 days."));
  if (requiresCrsMonitoring) {
    children.push(bulletPoint("Grade >= 3 CRS (per ASTCT grading) that does not resolve to Grade <= 1 within 72 hours of intervention."));
  }

  // CRS monitoring section (required for bifunctional/afucosylated)
  if (requiresCrsMonitoring) {
    children.push(spacer(4));
    children.push(sectionSubheading("5.6.2", "Cytokine Release Syndrome (CRS) Monitoring and Management"));
    children.push(spacer(2));

    if (prose.crsMonitoringPlan) {
      for (const para of ensureProseArray(prose.crsMonitoringPlan)) {
        children.push(bodyText(para));
      }
    }

    children.push(spacer(2));
    children.push(
      bodyText(
        "CRS grading follows the American Society for Transplantation and Cellular Therapy (ASTCT) " +
        "consensus grading system:",
        { bold: true },
      ),
    );
    children.push(spacer(2));
    children.push(
      createTable(
        ["Grade", "Symptoms", "Management"],
        [
          ["1", "Fever only (>= 38.0 C)", "Supportive care, antipyretics"],
          ["2", "Fever + hypotension (no vasopressors) and/or hypoxia (low-flow O2)", "IV fluids, low-flow oxygen, consider tocilizumab"],
          ["3", "Fever + hypotension (1 vasopressor +/- vasopressin) and/or hypoxia (high-flow O2)", "Tocilizumab +/- corticosteroids, ICU transfer"],
          ["4", "Fever + hypotension (multiple vasopressors) and/or hypoxia (mechanical ventilation)", "Tocilizumab + corticosteroids, ICU, consider siltuximab"],
        ],
        { columnWidths: [10, 40, 50], alternateRows: true },
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        "Pre-medication with corticosteroids and/or antihistamines may be considered for initial doses. " +
        "Tocilizumab must be available at the study site prior to enrollment of the first patient.",
        { italic: true, color: COLORS.primary },
      ),
    );

    if (bifunctional) {
      children.push(spacer(2));
      children.push(
        bodyTextRuns([
          { text: "Macrophage Activation Syndrome (MAS) Monitoring: ", bold: true },
          {
            text:
              "Due to the bifunctional mechanism, MAS/hemophagocytic lymphohistiocytosis (HLH) " +
              "monitoring is required. Ferritin, LDH, D-dimer, and triglycerides will be monitored " +
              "at each visit. If MAS is suspected (hyperferritinemia > 10,000 ng/mL with progressive " +
              "organ dysfunction), treatment should be withheld and MAS-directed therapy initiated.",
          },
        ]),
      );
    }
  }

  // Deterministic: Visit schedule table
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.7 Visit Schedule"));
  children.push(spacer(2));

  const visitSchedule = (input.clinicalData?.visitSchedule as Array<Record<string, unknown>>) ?? null;

  if (visitSchedule && visitSchedule.length > 0) {
    children.push(
      createTable(
        ["Visit", "Day/Cycle", "Assessments"],
        visitSchedule.map((v) => [
          String(v.visit ?? ""),
          String(v.timing ?? ""),
          String(v.assessments ?? ""),
        ]),
        { columnWidths: [20, 20, 60], alternateRows: true },
      ),
    );
  } else {
    children.push(
      createTable(
        ["Visit", "Day/Cycle", "Key Assessments"],
        [
          ["Screening", "Day -28 to -1", "Informed consent, eligibility, baseline imaging, labs, ECG, ECHO"],
          ["Cycle 1 Day 1", "Day 1", "Pre-dose labs, study drug administration, PK sampling, vitals Q15min x 4h"],
          ["Cycle 1 Day 2", "Day 2", "Post-dose labs, vitals, adverse event assessment"],
          ["Cycle 1 Day 8", "Day 8", "Labs, vitals, AE assessment, PK trough"],
          ["Cycle 1 Day 15", "Day 15", "Labs, vitals, AE assessment, PK trough"],
          ["Cycle 2 Day 1", "Day 22", "Pre-dose labs, study drug administration, PK sampling"],
          ["Every 2 Cycles", "Q6W-Q8W", "Tumor imaging (RECIST v1.1), ADA sampling"],
          ["End of Treatment", "EOT + 30 days", "Safety follow-up, labs, imaging if applicable"],
          ["Long-term Follow-up", "Q12W", "Survival status, subsequent anticancer therapy"],
        ],
        { columnWidths: [20, 20, 60], alternateRows: true },
      ),
    );
  }

  // Section 8: Endpoints (deterministic)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.8 Endpoints"));
  children.push(spacer(2));

  children.push(
    createTable(
      ["Category", "Endpoint", "Assessment"],
      [
        ["Primary", "Incidence of DLTs", "DLT evaluation window (Cycle 1)"],
        ["Primary", "Determination of MTD and/or OBD", "Modified 3+3 with Bayesian augmentation"],
        ["Secondary", "Overall Response Rate (ORR)", "RECIST v1.1 (confirmed responses)"],
        ["Secondary", "Duration of Response (DoR)", "Time from first response to progression"],
        ["Secondary", "Progression-Free Survival (PFS)", "Time from first dose to progression or death"],
        ["Secondary", `PK of ${input.drugName}`, adc ? "Conjugated ADC, total antibody, free payload" : "Standard PK parameters"],
        ["Secondary", "Immunogenicity (ADA)", "Anti-drug antibody incidence and titer"],
        ["Exploratory", "Biomarker analysis", "Tumor and blood-based biomarkers"],
        ["Exploratory", "ctDNA dynamics", "Circulating tumor DNA as early response marker"],
      ],
      { columnWidths: [15, 35, 50], alternateRows: true },
    ),
  );

  // Section 9: Statistical Considerations (AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.9 Statistical Considerations"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.statisticalApproach)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("5.9.1", "Sample Size Rationale"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `The planned enrollment of approximately ${enrollmentTarget} patients is based on ` +
      "the dose escalation design (modified 3+3) with expansion cohorts. The sample size is " +
      "not based on formal power calculations, as the primary objective is safety characterization " +
      "and dose finding. Expansion cohorts of 10-20 patients per dose level will provide " +
      "preliminary efficacy estimates with adequate precision.",
    ),
  );

  // Section 10: Diversity Action Plan (REQUIRED per FDORA)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.10 Diversity Action Plan"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "This Diversity Action Plan (DAP) is submitted in compliance with the Food and Drug " +
      "Omnibus Reform Act (FDORA), which requires submission of a DAP with the IND application.",
      { bold: true },
    ),
  );
  children.push(spacer(2));

  if (prose.diversityPlanNarrative) {
    for (const para of ensureProseArray(prose.diversityPlanNarrative)) {
      children.push(bodyText(para));
    }
  }
  children.push(spacer(2));

  children.push(sectionSubheading("5.10.1", "Enrollment Goals"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "The following enrollment diversity targets reflect the demographics of the disease population " +
      "for the target indication:",
    ),
  );
  children.push(spacer(2));

  const diversityGoals = (input.clinicalData?.diversityGoals as Array<Record<string, unknown>>) ?? null;

  if (diversityGoals && diversityGoals.length > 0) {
    children.push(
      createTable(
        ["Demographic Group", "Target Enrollment (%)", "Rationale"],
        diversityGoals.map((g) => [
          String(g.group ?? ""),
          String(g.target ?? ""),
          String(g.rationale ?? ""),
        ]),
        { columnWidths: [30, 25, 45], alternateRows: true },
      ),
    );
  } else {
    children.push(
      createTable(
        ["Demographic Group", "Target Enrollment (%)", "Rationale"],
        [
          ["Women", "[TBD]%", "Reflect disease epidemiology"],
          ["Black/African American", "[TBD]%", "Reflect disease epidemiology"],
          ["Hispanic/Latino", "[TBD]%", "Reflect disease epidemiology"],
          ["Asian", "[TBD]%", "Reflect disease epidemiology"],
          ["Age >= 65", "[TBD]%", "Reflect typical patient population"],
        ],
        { columnWidths: [30, 25, 45], alternateRows: true },
      ),
    );
  }

  children.push(spacer(4));
  children.push(sectionSubheading("5.10.2", "Strategies to Achieve Diversity Goals"));
  children.push(spacer(2));
  children.push(bulletPoint("Site selection to include community oncology centers and academic medical centers in diverse geographic areas."));
  children.push(bulletPoint("Decentralized trial elements (remote consent, local labs) where feasible."));
  children.push(bulletPoint("Multilingual informed consent documents and study materials."));
  children.push(bulletPoint("Community engagement and outreach to underrepresented patient populations."));
  children.push(bulletPoint("Partnerships with patient advocacy organizations representing diverse communities."));
  children.push(bulletPoint("Transportation and logistical support for patients in underserved areas."));
  children.push(bulletPoint("Regular monitoring of enrollment demographics with protocol-level triggers for corrective action."));

  // IB reference section
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("5.11 Investigator's Brochure Reference"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `The Investigator's Brochure (IB) for ${input.drugName} provides comprehensive nonclinical and clinical ` +
      "(if applicable) data supporting this protocol. The IB should be reviewed in conjunction with " +
      "this protocol. Key IB sections relevant to the clinical protocol include:",
    ),
  );
  children.push(spacer(2));
  children.push(bulletPoint("Drug substance characterization and mechanism of action (IB Section 2)"));
  children.push(bulletPoint("Nonclinical pharmacology and toxicology (IB Sections 3-4)"));
  children.push(bulletPoint("Starting dose justification and safety margins (IB Section 7)"));
  children.push(bulletPoint("Risk management and known class effects (IB Section 8)"));
  if (adc) {
    children.push(bulletPoint("ADC-specific considerations: payload toxicity, DAR stability, free payload PK (IB Section 2, 3)"));
  }

  // Footer
  children.push(spacer(8));
  children.push(
    bodyText(
      `Document generated: ${dateFormatted}`,
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(
    bodyText(
      "This document is intended for regulatory submission purposes and requires review by " +
      "qualified clinical, regulatory, and biostatistics professionals prior to filing.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "IND Module 5: Clinical Protocol",
    headerRight: `Module 5 — ${input.drugName} — ${input.sponsorName}`,
    children,
  });
}
