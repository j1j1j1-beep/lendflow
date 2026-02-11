// pre-ind-briefing.ts
// Generates a DOCX Pre-IND Meeting Briefing Book from deterministic data + AI prose.
// Follows FDA guidance for Type B Pre-IND meeting request packages.

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

import type { BioDocumentInput, PreINDBriefingProse } from "./types";

export function buildPreINDBriefing(
  input: BioDocumentInput,
  prose: PreINDBriefingProse,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const phase = input.phase ?? "Phase 1";

  // -------------------------------------------------------------------------
  // Title Page
  // -------------------------------------------------------------------------
  children.push(documentTitle("Pre-IND Meeting Briefing Document"));
  children.push(spacer(4));
  children.push(
    bodyText("Type B Pre-IND Meeting Request", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(bodyText(`Drug Name: ${input.drugName}`, { bold: true }));
  children.push(bodyText(`Drug Class: ${input.drugClass}`));
  if (input.target) {
    children.push(bodyText(`Molecular Target: ${input.target}`));
  }
  if (input.indication) {
    children.push(bodyText(`Proposed Indication: ${input.indication}`));
  }
  children.push(bodyText(`Proposed Phase: ${phase}`));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`, { bold: true }));
  if (input.sponsorAddress) {
    children.push(bodyText(`Address: ${input.sponsorAddress}`));
  }
  children.push(bodyText(`Date Prepared: ${dateFormatted}`));
  children.push(
    bodyText("CONFIDENTIAL", { bold: true, color: COLORS.primary }),
  );

  // -------------------------------------------------------------------------
  // Table of Contents (placeholder structure)
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("Table of Contents"));
  children.push(bodyText("1. Executive Summary"));
  children.push(bodyText("2. Drug Overview"));
  children.push(bodyText("3. Chemistry, Manufacturing, and Controls (CMC) Summary"));
  children.push(bodyText("4. Nonclinical Summary"));
  children.push(bodyText("5. Proposed Clinical Plan"));
  children.push(bodyText("6. Specific Questions for FDA"));

  // -------------------------------------------------------------------------
  // 1. Executive Summary (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("1. Executive Summary"));
  children.push(bodyText(prose.executiveSummary));

  // -------------------------------------------------------------------------
  // 2. Drug Overview (deterministic)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("2. Drug Overview"));

  const drugRows: string[][] = [
    ["Drug Name", input.drugName],
    ["Drug Class", input.drugClass],
  ];

  if (input.target) {
    drugRows.push(["Molecular Target", input.target]);
  }
  if (input.mechanism) {
    drugRows.push(["Mechanism of Action", input.mechanism]);
  }
  if (input.indication) {
    drugRows.push(["Proposed Indication", input.indication]);
  }
  drugRows.push(["Proposed Phase", phase]);
  drugRows.push(["Regulatory Pathway", input.regulatoryPathway ?? "Standard IND (21 CFR 312)"]);

  // ADC-specific properties
  if (input.antibodyType) {
    drugRows.push(["Antibody Type", input.antibodyType]);
  }
  if (input.linkerType) {
    drugRows.push(["Linker Type", input.linkerType]);
  }
  if (input.payloadType) {
    drugRows.push(["Payload Type", input.payloadType]);
  }
  if (input.dar !== undefined) {
    const darStr = input.darSpec
      ? `${input.dar} (specification: ${input.darSpec.target} +/- ${input.darSpec.tolerance})`
      : String(input.dar);
    drugRows.push(["Drug-to-Antibody Ratio (DAR)", darStr]);
  }

  children.push(
    createTable(
      ["Property", "Detail"],
      drugRows,
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );

  const isAfucosylated =
    input.antibodyType?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("bifunctional");

  if (isAfucosylated) {
    children.push(spacer(2));
    children.push(
      bodyText(
        "Note: The antibody component is afucosylated, resulting in enhanced Fc-gamma receptor IIIa (FcgRIIIa) binding and increased antibody-dependent cellular cytotoxicity (ADCC). This dual mechanism (payload cytotoxicity + ADCC) classifies this agent as a bifunctional ADC, which is subject to heightened regulatory scrutiny compared to standard ADCs.",
        { italic: true },
      ),
    );
  }

  // -------------------------------------------------------------------------
  // 3. CMC Summary (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("3. Chemistry, Manufacturing, and Controls (CMC) Summary"));
  children.push(bodyText(prose.cmcSummary));

  // ADC-specific CMC requirements table (deterministic)
  children.push(spacer(2));
  children.push(bodyText("ADC-Specific CMC Requirements:", { bold: true }));

  const cmcRows: string[][] = [
    [
      "DAR Consistency",
      "Drug-to-Antibody Ratio must demonstrate batch-to-batch consistency within defined specification",
      input.darSpec
        ? `${input.darSpec.target} +/- ${input.darSpec.tolerance}`
        : "[Specification TBD]",
    ],
    [
      "Free Drug Limits",
      "Unconjugated payload must be below defined threshold in Drug Product release testing",
      "[Specification TBD]",
    ],
    [
      "Potency Assay (Cytotoxicity)",
      "Cell-based cytotoxicity assay measuring payload-mediated killing",
      "Required for release testing",
    ],
  ];

  if (isAfucosylated) {
    cmcRows.push([
      "Potency Assay (ADCC)",
      "Validated biological assay demonstrating ADCC activity via afucosylated Fc",
      "Required for release testing (afucosylated antibody)",
    ]);
  }

  cmcRows.push(
    [
      "Aggregation",
      "High molecular weight species (HMWS) by SEC must be below defined limit",
      "[Specification TBD]",
    ],
    [
      "Stability",
      "Real-time and accelerated stability studies for Drug Substance and Drug Product",
      "Minimum 3 months data at time of IND submission",
    ],
  );

  children.push(
    createTable(
      ["CMC Parameter", "Description", "Specification / Status"],
      cmcRows,
      { columnWidths: [25, 45, 30], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 4. Nonclinical Summary (AI prose + deterministic findings table)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("4. Nonclinical Summary"));
  children.push(bodyText(prose.nonclinicalSummary));

  children.push(spacer(2));
  children.push(bodyText("Key Nonclinical Findings:", { bold: true }));
  children.push(
    createTable(
      ["Study Type", "Species", "Key Finding", "NOAEL / HNSTD", "Safety Margin"],
      [
        [
          "Single-dose toxicity",
          "[Species TBD]",
          "[Key findings from single-dose tox study]",
          "[NOAEL TBD]",
          "[Margin TBD]",
        ],
        [
          "Repeat-dose toxicity (GLP)",
          "[Species TBD]",
          "[Key findings from repeat-dose tox study]",
          "[NOAEL TBD]",
          "[Margin TBD]",
        ],
        [
          "Tissue cross-reactivity (TCR)",
          "Human tissues + tox species",
          "[Binding pattern in normal human tissues]",
          "N/A",
          "N/A",
        ],
        [
          "In vitro pharmacology",
          "Cell lines",
          "[IC50 / EC50 against target-expressing cells]",
          "N/A",
          "N/A",
        ],
        [
          "In vivo efficacy",
          "Xenograft models",
          "[Tumor growth inhibition, regression data]",
          "N/A",
          "N/A",
        ],
        [
          "PK/ADME",
          "[Species TBD]",
          "[Half-life, clearance, volume of distribution]",
          "N/A",
          "N/A",
        ],
        [
          "Safety pharmacology (CV, CNS, resp)",
          "[Species TBD]",
          "[Cardiovascular, neurological, respiratory findings]",
          "N/A",
          "N/A",
        ],
      ],
      { alternateRows: true },
    ),
  );

  // Proposed dose rationale table (deterministic structure, TBD values)
  children.push(spacer(4));
  children.push(bodyText("Proposed Starting Dose Rationale:", { bold: true }));
  children.push(
    createTable(
      ["Parameter", "Value", "Basis"],
      [
        [
          "NOAEL (most sensitive species)",
          "[TBD] mg/kg",
          "GLP repeat-dose toxicology study",
        ],
        [
          "Human Equivalent Dose (HED)",
          "[TBD] mg/kg",
          "Body surface area conversion (FDA Guidance for Industry: Estimating the Maximum Safe Starting Dose)",
        ],
        [
          "Safety Factor Applied",
          "[TBD]x",
          "Standard safety factor for oncology FIH (typically 1/6 to 1/10 of HNSTD)",
        ],
        [
          "Proposed Starting Dose",
          "[TBD] mg/kg",
          "HED / safety factor; confirmed by pharmacologically active dose in efficacy models",
        ],
        [
          "Pharmacologically Active Dose",
          "[TBD] mg/kg",
          "Minimum efficacious dose in xenograft models",
        ],
        [
          "Predicted Therapeutic Window",
          "[TBD] to [TBD] mg/kg",
          "Range between minimum efficacious dose and NOAEL-derived HED",
        ],
      ],
      { columnWidths: [30, 25, 45], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 5. Proposed Clinical Plan (AI prose)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("5. Proposed Clinical Plan"));
  children.push(bodyText(prose.clinicalPlanSummary));

  children.push(spacer(2));
  children.push(bodyText("Key Design Elements:", { bold: true }));
  children.push(
    bulletPoint(
      "Dose Optimization (Project Optimus): Protocol includes randomized parallel cohorts at expansion to identify OBD, not solely MTD.",
    ),
  );
  children.push(
    bulletPoint(
      "Three-analyte PK: Conjugated ADC, total antibody, and free payload measured at all PK sampling timepoints.",
    ),
  );
  children.push(
    bulletPoint(
      "FDORA Diversity Action Plan: Submitted concurrently; enrollment targets reflect disease epidemiology.",
    ),
  );
  if (isAfucosylated) {
    children.push(
      bulletPoint(
        "CRS/MAS Monitoring: Mandatory cytokine panels and ASTCT grading given afucosylated antibody backbone.",
      ),
    );
  }
  children.push(
    bulletPoint(
      "21 CFR Part 11 Compliance: All electronic data capture systems include time-stamped, tamper-evident audit trails.",
    ),
  );

  // -------------------------------------------------------------------------
  // 6. Specific Questions for FDA (AI-generated questions)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("6. Specific Questions for FDA"));
  children.push(
    bodyText(
      "The Sponsor respectfully requests the Agency's feedback on the following specific questions. For each question, a brief description of the Sponsor's current position is provided.",
      { italic: true },
    ),
  );

  children.push(spacer(2));
  const fdaQs = Array.isArray(prose.fdaQuestions) ? prose.fdaQuestions : [];
  if (fdaQs.length > 0) {
    fdaQs.forEach((question, idx) => {
      children.push(
        bodyTextRuns([
          { text: `Question ${idx + 1}: `, bold: true },
          { text: question },
        ]),
      );
      children.push(spacer(2));
    });
  } else {
    children.push(
      bodyText("[FDA questions to be generated based on program-specific considerations.]"),
    );
  }

  // ADCC potency assay question (required for afucosylated ADCs)
  if (isAfucosylated) {
    children.push(spacer(2));
    children.push(
      bodyText("Afucosylated ADC-Specific Question:", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyTextRuns([
        { text: "Question (ADCC Potency): ", bold: true },
        {
          text:
            "The Sponsor has developed a validated ADCC biological assay to characterize the enhanced Fc-effector function of the afucosylated antibody component. In addition to the standard cytotoxicity potency assay (measuring payload-mediated killing), does the Agency consider the proposed ADCC potency assay sufficient for release testing and stability characterization of the Drug Product? If not, what additional functional assays would the Agency recommend?",
        },
      ]),
    );
  }

  // -------------------------------------------------------------------------
  // Closing / Signature
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("Sponsor Contact Information"));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`));
  if (input.sponsorAddress) {
    children.push(bodyText(`Address: ${input.sponsorAddress}`));
  }
  children.push(bodyText("Contact Person: [Name, Title]"));
  children.push(bodyText("Phone: [Phone Number]"));
  children.push(bodyText("Email: [Email Address]"));

  children.push(spacer(4));
  children.push(
    ...signatureBlock(input.sponsorName, "Authorized Representative"),
  );

  // Wrap in document shell
  return buildLegalDocument({
    title: "Pre-IND Briefing Document",
    headerRight: `Pre-IND Briefing -- ${input.drugName}`,
    children,
  });
}
