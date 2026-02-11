// ind-module-2.ts
// Generates a DOCX for IND Module 2: Common Technical Document Summaries.
// Heavy AI prose — Quality Overall Summary (QOS), Nonclinical Overview,
// Clinical Overview, starting dose justification, and safety margin analysis.
// Deterministic content includes drug identification, key terms tables, and
// section structure per CTD format.

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
  keyTermsTable,
  createTable,
  formatDate,
  ensureProseArray,
  COLORS,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, INDModule2Prose } from "./types";

export function buildINDModule2(
  input: BioDocumentInput,
  prose: INDModule2Prose,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);

  // Cover Page

  children.push(spacer(12));
  children.push(documentTitle("Investigational New Drug Application"));
  children.push(
    bodyText("Module 2: Common Technical Document Summaries", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(8));
  children.push(bodyText(`Drug Name: ${input.drugName}`, { bold: true }));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`));
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(spacer(16));

  // Drug Identification Table

  children.push(sectionHeading("Drug Identification"));

  const drugInfoTerms: Array<{ label: string; value: string }> = [
    { label: "Drug Name", value: input.drugName },
    { label: "Drug Class", value: input.drugClass },
  ];

  if (input.target) {
    drugInfoTerms.push({ label: "Molecular Target", value: input.target });
  }
  if (input.mechanism) {
    drugInfoTerms.push({ label: "Mechanism of Action", value: input.mechanism });
  }
  if (input.indication) {
    drugInfoTerms.push({ label: "Indication", value: input.indication });
  }
  if (input.phase) {
    drugInfoTerms.push({ label: "Phase", value: input.phase });
  }

  // ADC-specific fields
  if (input.antibodyType) {
    drugInfoTerms.push({ label: "Antibody Type", value: input.antibodyType });
  }
  if (input.linkerType) {
    drugInfoTerms.push({ label: "Linker Type", value: input.linkerType });
  }
  if (input.payloadType) {
    drugInfoTerms.push({ label: "Payload Type", value: input.payloadType });
  }
  if (input.dar !== undefined) {
    drugInfoTerms.push({
      label: "Drug-to-Antibody Ratio (DAR)",
      value: String(input.dar),
    });
  }
  if (input.darSpec) {
    drugInfoTerms.push({
      label: "DAR Specification",
      value: `${input.darSpec.target} +/- ${input.darSpec.tolerance}`,
    });
  }

  children.push(keyTermsTable(drugInfoTerms));
  children.push(spacer(8));

  // Section 2.3: Quality Overall Summary (QOS)

  children.push(sectionHeading("2.3 Quality Overall Summary (QOS)"));
  children.push(
    bodyText(
      `This section provides a summary of the pharmaceutical quality information for ${input.drugName}, including drug substance characterization, manufacturing process, analytical methods, and specifications. The QOS synthesizes information from Module 3 (Quality/CMC) into a concise overview for regulatory assessment.`,
    ),
  );
  children.push(spacer(4));

  // Key terms table for QOS context
  const qosTerms: Array<{ label: string; value: string }> = [
    { label: "Drug Class", value: input.drugClass },
    { label: "Phase", value: input.phase || "Phase 1" },
  ];
  if (input.dar !== undefined) {
    qosTerms.push({ label: "Target DAR", value: String(input.dar) });
  }
  if (input.indication) {
    qosTerms.push({ label: "Indication", value: input.indication });
  }
  children.push(keyTermsTable(qosTerms));
  children.push(spacer(4));

  children.push(bodyText(prose.qualitySummary));
  children.push(spacer(8));

  // Section 2.4: Nonclinical Overview

  children.push(sectionHeading("2.4 Nonclinical Overview"));
  children.push(
    bodyText(
      `This section provides an integrated summary of the nonclinical pharmacology, pharmacokinetics, and toxicology data for ${input.drugName}. The nonclinical program was designed to support initiation of the proposed ${input.phase || "Phase 1"} clinical study in ${input.indication || "the target indication"}.`,
    ),
  );
  children.push(spacer(4));

  // Nonclinical program summary table
  const nonclinicalSections: string[][] = [
    ["Primary Pharmacology", "In vitro binding, cytotoxicity, and mechanism studies"],
    ["Secondary Pharmacology", "Off-target activity assessment and selectivity profiling"],
    ["Safety Pharmacology", "Cardiovascular, respiratory, and CNS safety evaluation"],
    ["Pharmacokinetics", "ADME characterization in relevant species"],
    ["Single-Dose Toxicology", "Acute toxicity in rodent and non-rodent species"],
    ["Repeat-Dose Toxicology", "GLP-compliant studies in relevant species"],
    ["Genotoxicity", "Standard battery or waiver justification"],
    ["Tissue Cross-Reactivity", "Human and animal tissue panel binding assessment"],
  ];
  children.push(
    createTable(
      ["Study Type", "Description"],
      nonclinicalSections,
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  children.push(bodyText(prose.nonclinicalOverview));
  children.push(spacer(8));

  // ADC-specific analytes note
  if (
    input.drugClass?.toLowerCase().includes("adc") ||
    input.drugClass?.toLowerCase().includes("antibody-drug conjugate")
  ) {
    children.push(
      bodyText("ADC Pharmacokinetic Analytes (FDA Requirement)", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyText(
        "Per FDA guidance on Clinical Pharmacology Considerations for Antibody-Drug Conjugates, nonclinical and clinical PK assessments must measure three distinct analytes:",
      ),
    );
    children.push(spacer(2));
    children.push(bulletPoint("Conjugated ADC (antibody with payload attached)"));
    children.push(bulletPoint("Total Antibody (conjugated + unconjugated antibody)"));
    children.push(bulletPoint("Free (Unconjugated) Payload"));
    children.push(spacer(2));
    children.push(
      bodyText(
        "Insufficient bioanalytical sensitivity for any of these analytes may result in a clinical hold. Validated assays for all three analytes must be in place prior to first-in-human dosing.",
        { italic: true },
      ),
    );
    children.push(spacer(8));
  }

  // Section 2.5: Clinical Overview

  children.push(sectionHeading("2.5 Clinical Overview"));
  children.push(
    bodyText(
      `This section provides a summary of the clinical development strategy for ${input.drugName}. For an initial IND submission, this section describes the rationale for the proposed clinical study design, patient population, dosing strategy, and safety monitoring plan.`,
    ),
  );
  children.push(spacer(4));

  // Clinical development summary
  const clinicalTerms: Array<{ label: string; value: string }> = [
    { label: "Proposed Study Phase", value: input.phase || "Phase 1" },
    { label: "Indication", value: input.indication || "[Indication TBD]" },
    { label: "Study Population", value: `Adults with ${input.indication || "[indication TBD]"}` },
  ];
  if (input.nctNumber) {
    clinicalTerms.push({ label: "ClinicalTrials.gov", value: input.nctNumber });
  }
  children.push(keyTermsTable(clinicalTerms));
  children.push(spacer(4));

  children.push(bodyText(prose.clinicalOverview));
  children.push(spacer(8));

  // Starting Dose Justification

  children.push(sectionHeading("2.5.1 Starting Dose Justification"));
  children.push(
    bodyText(
      "The proposed starting dose for the first-in-human study has been determined based on nonclinical toxicology data using FDA-accepted methods for dose translation. The following considerations were applied:",
    ),
  );
  children.push(spacer(4));
  children.push(bulletPoint("NOAEL (No Observed Adverse Effect Level) from GLP toxicology studies"));
  children.push(bulletPoint("Allometric scaling from preclinical species to human equivalent dose (HED)"));
  children.push(bulletPoint("Application of appropriate safety factor per ICH S9 (1/6 of HNSTD for anticancer) or FDA 2005 Guidance (1/10 of HED at NOAEL for non-oncology)"));
  children.push(bulletPoint("Consideration of MABEL (Minimum Anticipated Biological Effect Level) where applicable"));
  children.push(bulletPoint("Target-mediated drug disposition and receptor occupancy modeling"));
  children.push(spacer(4));

  children.push(bodyText(prose.startingDoseJustification));
  children.push(spacer(8));

  // Project Optimus compliance note
  children.push(
    bodyText("Dose Optimization (Project Optimus)", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      "In accordance with FDA's Project Optimus initiative (finalized August 2024), the dose escalation and expansion strategy is designed to identify the Optimal Biological Dose (OBD) rather than relying solely on the Maximum Tolerated Dose (MTD). The clinical protocol includes provisions for randomized parallel cohorts to evaluate multiple dose levels and support dose optimization.",
    ),
  );
  children.push(spacer(8));

  // Safety Margin Analysis

  children.push(sectionHeading("2.5.2 Safety Margin Analysis"));
  children.push(
    bodyText(
      `The safety margin analysis compares the proposed clinical exposures for ${input.drugName} with the nonclinical exposure levels at which toxicity was observed. This analysis uses AUC- and Cmax-based comparisons between human projected exposures and animal NOAEL exposures.`,
    ),
  );
  children.push(spacer(4));

  // Toxicology reference data
  if (input.toxData) {
    const toxEntries = Object.entries(input.toxData);
    if (toxEntries.length > 0) {
      const toxRows = toxEntries
        .filter(([, value]) => typeof value !== "object")
        .map(([key, value]) => [
          key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          String(value ?? "N/A"),
        ]);
      children.push(
        createTable(
          ["Parameter", "Value"],
          toxRows,
          { columnWidths: [40, 60], alternateRows: true },
        ),
      );
      children.push(spacer(4));
    }
  }

  children.push(bodyText(prose.safetyMarginAnalysis));
  children.push(spacer(8));

  // Bifunctional ADC safety considerations
  if (
    input.drugClass?.toLowerCase().includes("bifunctional") ||
    input.antibodyType?.toLowerCase().includes("afucosylated")
  ) {
    children.push(sectionHeading("2.5.3 Bifunctional ADC Safety Considerations"));
    children.push(
      bodyText(
        "Due to the bifunctional nature of the ADC and the afucosylated antibody backbone, the following additional safety considerations have been incorporated into the clinical development plan:",
      ),
    );
    children.push(spacer(4));

    children.push(
      bodyText("Cytokine Release Syndrome (CRS)", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyText(
        "Afucosylated antibodies enhance ADCC (antibody-dependent cellular cytotoxicity) through increased FcgammaRIIIa binding, which activates NK cells and macrophages. This immune activation carries a risk of cytokine release syndrome. The clinical protocol includes CRS monitoring using ASTCT consensus grading criteria and a pre-specified management algorithm.",
      ),
    );
    children.push(spacer(4));

    children.push(
      bodyText("Macrophage Activation Syndrome (MAS)", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyText(
        "Enhanced macrophage activation from afucosylated Fc engagement requires monitoring for MAS, including serial ferritin, triglycerides, fibrinogen, and liver function tests.",
      ),
    );
    children.push(spacer(4));

    children.push(
      bodyText("On-Target/Off-Tumor Toxicity", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyText(
        "Tissue cross-reactivity studies must demonstrate that the target antigen expression pattern in normal human tissues is consistent with the acceptable risk profile. Particular attention to mucosal epithelial expression and potential GI toxicity is required.",
      ),
    );
    children.push(spacer(8));
  }

  // Cross-reference to other modules

  children.push(sectionHeading("Cross-References"));
  children.push(
    bodyText(
      "The summaries in Module 2 are derived from and consistent with the detailed data presented in the following modules:",
    ),
  );
  children.push(spacer(4));
  children.push(
    createTable(
      ["Summary Section", "Source Module", "Key Content"],
      [
        ["2.3 Quality Overall Summary", "Module 3 (Quality/CMC)", "Drug substance, drug product, manufacturing, specifications"],
        ["2.4 Nonclinical Overview", "Module 4 (Nonclinical)", "Pharmacology, PK, toxicology study reports"],
        ["2.5 Clinical Overview", "Module 5 (Clinical)", "Protocol, investigator's brochure, prior clinical data"],
      ],
      { columnWidths: [30, 25, 45], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Any discrepancies between the summaries in Module 2 and the detailed reports in Modules 3-5 should be resolved in favor of the source module data. The sponsor is responsible for ensuring cross-module consistency prior to submission.",
      { italic: true },
    ),
  );

  return buildLegalDocument({
    title: "IND Module 2 — CTD Summaries",
    headerRight: `IND Module 2 — ${input.drugName}`,
    children,
  });
}
