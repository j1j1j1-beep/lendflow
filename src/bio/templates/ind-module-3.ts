// ind-module-3.ts
// Generates a DOCX for IND Module 3: Quality (Chemistry, Manufacturing, and Controls).
// Mixed content — lots of deterministic data tables (DAR specifications, purity,
// potency, batch data, stability) combined with AI-generated prose for manufacturing
// process descriptions, control strategy, stability conclusions, and impurity profiles.

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

import type { BioDocumentInput, INDModule3Prose } from "./types";

// Helpers

function formatDarSpec(input: BioDocumentInput): string {
  if (input.darSpec) {
    return `${input.darSpec.target} +/- ${input.darSpec.tolerance}`;
  }
  if (input.dar !== undefined) {
    return `${input.dar} (nominal)`;
  }
  return "[DAR specification TBD]";
}

function buildBatchDataTable(batchData: Record<string, unknown>[]): Table | null {
  if (batchData.length === 0) return null;

  // Extract column headers from all batch records
  const allKeys = new Set<string>();
  for (const batch of batchData) {
    for (const key of Object.keys(batch)) {
      allKeys.add(key);
    }
  }
  const headers = Array.from(allKeys).map((k) =>
    k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  );
  const keys = Array.from(allKeys);

  const rows = batchData.map((batch) =>
    keys.map((key) => {
      const val = batch[key];
      if (val === null || val === undefined) return "N/A";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    }),
  );

  return createTable(headers, rows, { alternateRows: true });
}

function buildStabilityTable(stabilityData: Record<string, unknown>): Table | null {
  const entries = Object.entries(stabilityData);
  if (entries.length === 0) return null;

  const rows = entries.map(([key, value]) => [
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value === null || value === undefined ? "N/A" : typeof value === "object" ? JSON.stringify(value) : String(value),
  ]);

  return createTable(
    ["Parameter", "Result"],
    rows,
    { columnWidths: [40, 60], alternateRows: true },
  );
}

// Builder

export function buildINDModule3(
  input: BioDocumentInput,
  prose: INDModule3Prose,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const isAdc =
    input.drugClass?.toLowerCase().includes("adc") ||
    input.drugClass?.toLowerCase().includes("antibody-drug conjugate") ||
    false;

  // Cover Page

  children.push(spacer(12));
  children.push(documentTitle("Investigational New Drug Application"));
  children.push(
    bodyText("Module 3: Quality (Chemistry, Manufacturing, and Controls)", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(8));
  children.push(bodyText(`Drug Name: ${input.drugName}`, { bold: true }));
  children.push(bodyText(`Drug Class: ${input.drugClass}`));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`));
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(spacer(16));

  // Product Overview Table

  children.push(sectionHeading("Product Overview"));

  const overviewTerms: Array<{ label: string; value: string }> = [
    { label: "Drug Name", value: input.drugName },
    { label: "Drug Class", value: input.drugClass },
    { label: "Phase", value: input.phase || "Phase 1" },
    { label: "Indication", value: input.indication || "[Indication TBD]" },
  ];
  if (input.target) {
    overviewTerms.push({ label: "Target", value: input.target });
  }
  if (isAdc) {
    if (input.antibodyType) {
      overviewTerms.push({ label: "Antibody Component", value: input.antibodyType });
    }
    if (input.linkerType) {
      overviewTerms.push({ label: "Linker", value: input.linkerType });
    }
    if (input.payloadType) {
      overviewTerms.push({ label: "Payload", value: input.payloadType });
    }
    overviewTerms.push({ label: "DAR Specification", value: formatDarSpec(input) });
  }
  children.push(keyTermsTable(overviewTerms));
  children.push(spacer(8));

  // Section 3.2.S — Drug Substance: Antibody Characterization
  // (For ADCs this covers the monoclonal antibody component; for non-ADC biologics
  // this covers the primary drug substance.)

  if (isAdc) {
    children.push(sectionHeading("3.2.S Drug Substance — Antibody Characterization"));
  } else {
    children.push(sectionHeading("3.2.S Drug Substance"));
  }

  children.push(
    bodyText("3.2.S.1 General Information", { bold: true, color: COLORS.primary }),
  );

  if (isAdc) {
    children.push(
      bodyText(
        `${input.drugName} is a ${input.drugClass} comprising a monoclonal antibody component${input.antibodyType ? ` (${input.antibodyType})` : ""} directed against ${input.target || "[target TBD]"}. The antibody serves as the targeting moiety, delivering the cytotoxic payload selectively to cells expressing the target antigen.`,
      ),
    );
    children.push(spacer(4));

    // Antibody characterization table
    const antibodyChars: string[][] = [
      ["Antibody Type", input.antibodyType || "[TBD]"],
      ["Isotype", "IgG1 (human or humanized)"],
      ["Target Antigen", input.target || "[TBD]"],
      ["Fucosylation Status", input.antibodyType?.toLowerCase().includes("afucosylated") ? "Afucosylated" : "Standard"],
      ["Expression System", "[Expression system TBD — e.g., CHO cells]"],
      ["Molecular Weight (mAb)", "[Approx. 150 kDa]"],
    ];
    children.push(
      createTable(
        ["Attribute", "Value"],
        antibodyChars,
        { columnWidths: [40, 60], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText(
        `${input.drugName} is a ${input.drugClass} targeting ${input.target || "[target TBD]"}. This section describes the general properties, nomenclature, and structural characterization of the drug substance.`,
      ),
    );
  }
  children.push(spacer(8));

  // Section 3.2.S — Payload-Linker (ADC-specific)

  if (isAdc) {
    children.push(sectionHeading("3.2.S Drug Substance — Payload-Linker"));

    children.push(
      bodyText("3.2.S.1 Payload-Linker General Information", {
        bold: true,
        color: COLORS.primary,
      }),
    );
    children.push(
      bodyText(
        `The payload-linker component of ${input.drugName} consists of a ${input.linkerType || "[linker type TBD]"} linker conjugated to a ${input.payloadType || "[payload type TBD]"} cytotoxic payload. The linker chemistry is designed to ensure stability in circulation while allowing efficient release of the payload upon internalization into target cells.`,
      ),
    );
    children.push(spacer(4));

    const payloadChars: string[][] = [
      ["Linker Type", input.linkerType || "[TBD]"],
      ["Linker Chemistry", "[Cleavable / Non-cleavable — specify]"],
      ["Payload", input.payloadType || "[TBD]"],
      ["Payload Class", "[Tubulin inhibitor / DNA-damaging agent / etc.]"],
      ["Conjugation Site", "[Cysteine / Lysine / Site-specific — specify]"],
      ["Target DAR", formatDarSpec(input)],
    ];
    children.push(
      createTable(
        ["Attribute", "Value"],
        payloadChars,
        { columnWidths: [40, 60], alternateRows: true },
      ),
    );
    children.push(spacer(8));
  }

  // Section 3.2.P — Drug Product (Conjugated ADC / Final Product)

  if (isAdc) {
    children.push(sectionHeading("3.2.P Drug Product — Conjugated ADC"));
  } else {
    children.push(sectionHeading("3.2.P Drug Product"));
  }

  children.push(
    bodyText("3.2.P.1 Description and Composition", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      `The drug product is the final formulated ${input.drugClass} presented in a dosage form suitable for clinical administration. The composition includes the active ingredient, formulation buffer components, and any excipients required for stability and administration.`,
    ),
  );
  children.push(spacer(4));

  const productComposition: string[][] = [
    ["Active Ingredient", input.drugName],
    ["Dosage Form", "[Lyophilized powder for reconstitution / Solution for injection]"],
    ["Route of Administration", "[Intravenous infusion]"],
    ["Container Closure", "[Glass vial with rubber stopper and aluminum seal]"],
    ["Storage Conditions", "[2-8 degrees C, protect from light]"],
  ];
  children.push(
    createTable(
      ["Component", "Description"],
      productComposition,
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Manufacturing Process

  children.push(sectionHeading("3.2.P.3 Manufacturing Process"));
  children.push(
    bodyText("3.2.P.3.1 Process Description", {
      bold: true,
      color: COLORS.primary,
    }),
  );

  if (isAdc) {
    children.push(
      bodyText(
        `The manufacturing of ${input.drugName} involves three distinct supply chains that must be coordinated: (1) monoclonal antibody production, (2) payload-linker synthesis, and (3) conjugation and final drug product fill/finish.`,
      ),
    );
    children.push(spacer(4));

    const mfgSteps: string[][] = [
      ["1", "Antibody Production", "Cell culture, harvest, and purification of mAb intermediate"],
      ["2", "Payload-Linker Synthesis", "Chemical synthesis and purification of drug-linker"],
      ["3", "Conjugation", "Attachment of payload-linker to antibody to form ADC"],
      ["4", "Purification", "Removal of unconjugated species, aggregates, and process impurities"],
      ["5", "Formulation", "Buffer exchange and formulation to target concentration"],
      ["6", "Fill/Finish", "Sterile filtration, vial filling, lyophilization (if applicable), and sealing"],
      ["7", "Testing and Release", "QC testing per release specifications"],
    ];
    children.push(
      createTable(
        ["Step", "Operation", "Description"],
        mfgSteps,
        { columnWidths: [10, 25, 65], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText(
        `The manufacturing process for ${input.drugName} encompasses cell culture or synthesis, purification, formulation, and fill/finish operations. Each step is controlled by in-process specifications to ensure consistent product quality.`,
      ),
    );
  }
  children.push(spacer(4));

  children.push(bodyText(prose.manufacturingProcessDescription));
  children.push(spacer(8));

  // Controls and Specifications

  children.push(sectionHeading("3.2.P.5 Controls and Specifications"));
  children.push(
    bodyText("3.2.P.5.1 Release Specifications", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      `The following release specifications have been established for ${input.drugName} drug product. Specifications are based on characterization of clinical trial material and are appropriate for the ${input.phase || "Phase 1"} stage of development.`,
    ),
  );
  children.push(spacer(4));

  // DAR Specification Table (ADC-specific)
  if (isAdc) {
    children.push(
      bodyText("DAR Specification", { bold: true, color: COLORS.primary }),
    );

    const darRows: string[][] = [
      ["Drug-to-Antibody Ratio (DAR)", formatDarSpec(input), "HIC, RP-HPLC"],
      ["DAR Distribution", "[Specified per method]", "HIC"],
      ["Unconjugated Antibody", "[NMT X%]", "HIC, SEC"],
      ["Free Drug (Unconjugated Payload)", "[NMT X ng/mg]", "RP-HPLC or LC-MS/MS"],
    ];
    children.push(
      createTable(
        ["Attribute", "Specification", "Method"],
        darRows,
        { columnWidths: [40, 35, 25], alternateRows: true },
      ),
    );
    children.push(spacer(4));
  }

  // Purity Specifications Table
  children.push(
    bodyText("Purity Specifications", { bold: true, color: COLORS.primary }),
  );

  const purityRows: string[][] = [
    ["Purity (Monomer by SEC)", "[NLT 95.0%]", "SE-HPLC"],
    ["High Molecular Weight Species", "[NMT 5.0%]", "SE-HPLC"],
    ["Low Molecular Weight Species", "[Report results]", "SE-HPLC / CE-SDS"],
    ["Charge Variants (Main Peak)", "[Report results]", "CEX-HPLC or iCIEF"],
    ["Residual Host Cell Protein", "[NMT X ppm]", "ELISA"],
    ["Residual Host Cell DNA", "[NMT X pg/mg]", "qPCR"],
    ["Endotoxin", "[NMT X EU/mg]", "LAL"],
    ["Bioburden", "[NMT X CFU/mL]", "USP <61>"],
    ["Sterility", "Sterile", "USP <71>"],
  ];
  children.push(
    createTable(
      ["Test", "Specification", "Method"],
      purityRows,
      { columnWidths: [40, 35, 25], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Potency Specifications Table
  children.push(
    bodyText("Potency Specifications", { bold: true, color: COLORS.primary }),
  );

  const potencyRows: string[][] = [
    ["Cytotoxicity Potency", "[X-Y% relative to reference]", "Cell-based cytotoxicity assay"],
    ["Binding Affinity", "[KD within X-fold of reference]", "SPR (Biacore) or ELISA"],
  ];

  // Afucosylated ADCs require ADCC potency assay
  if (input.antibodyType?.toLowerCase().includes("afucosylated")) {
    potencyRows.push([
      "ADCC Potency",
      "[X-Y% relative to reference]",
      "ADCC reporter gene assay or NK cell killing assay",
    ]);
    children.push(
      createTable(
        ["Test", "Specification", "Method"],
        potencyRows,
        { columnWidths: [30, 35, 35], alternateRows: true },
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        "Note: ADCC potency assay is required for afucosylated antibody-based products. The afucosylated Fc region enhances ADCC activity, and this biological function must be characterized and controlled as part of the release specification. Cytotoxicity assay alone is insufficient for potency characterization.",
        { italic: true },
      ),
    );
  } else {
    children.push(
      createTable(
        ["Test", "Specification", "Method"],
        potencyRows,
        { columnWidths: [30, 35, 35], alternateRows: true },
      ),
    );
  }
  children.push(spacer(4));

  children.push(bodyText(prose.controlStrategy));
  children.push(spacer(8));

  // Batch Data Summary

  children.push(sectionHeading("3.2.P.5.4 Batch Analyses"));
  children.push(
    bodyText(
      `Batch analysis data for ${input.drugName} clinical trial material is summarized below. All batches met release specifications.`,
    ),
  );
  children.push(spacer(4));

  if (input.batchData && input.batchData.length > 0) {
    const batchTable = buildBatchDataTable(input.batchData);
    if (batchTable) {
      children.push(batchTable);
    }
  } else {
    children.push(
      bodyText(
        "[Batch data will be populated upon completion of clinical manufacturing campaigns. At minimum, data from the GMP qualification batch and clinical supply batches will be included.]",
        { italic: true, color: COLORS.textGray },
      ),
    );
  }
  children.push(spacer(8));

  // Impurity Profile

  children.push(sectionHeading("3.2.P.5.5 Characterization of Impurities"));
  children.push(
    bodyText(
      `The impurity profile for ${input.drugName} includes process-related impurities (host cell proteins, host cell DNA, residual reagents) and product-related impurities (aggregates, fragments, charge variants${isAdc ? ", unconjugated antibody, free payload" : ""}). Impurities are controlled through the manufacturing process and monitored by release specifications.`,
    ),
  );
  children.push(spacer(4));

  if (isAdc) {
    const impurityCategories: string[][] = [
      ["Process-Related", "Host cell protein (HCP)", "ELISA", "In-process and release"],
      ["Process-Related", "Host cell DNA", "qPCR", "In-process and release"],
      ["Process-Related", "Residual Protein A", "ELISA", "In-process"],
      ["Product-Related", "Aggregates (HMW)", "SE-HPLC", "Release and stability"],
      ["Product-Related", "Fragments (LMW)", "CE-SDS", "Release and stability"],
      ["Product-Related", "Unconjugated antibody", "HIC", "Release"],
      ["Product-Related", "Free (unconjugated) payload", "RP-HPLC", "Release and stability"],
      ["Product-Related", "DAR variants", "HIC", "Release"],
    ];
    children.push(
      createTable(
        ["Category", "Impurity", "Method", "Testing Point"],
        impurityCategories,
        { columnWidths: [20, 30, 20, 30], alternateRows: true },
      ),
    );
  } else {
    const impurityCategories: string[][] = [
      ["Process-Related", "Host cell protein (HCP)", "ELISA", "In-process and release"],
      ["Process-Related", "Host cell DNA", "qPCR", "In-process and release"],
      ["Product-Related", "Aggregates (HMW)", "SE-HPLC", "Release and stability"],
      ["Product-Related", "Fragments (LMW)", "CE-SDS", "Release and stability"],
      ["Product-Related", "Charge variants", "CEX or iCIEF", "Release and stability"],
    ];
    children.push(
      createTable(
        ["Category", "Impurity", "Method", "Testing Point"],
        impurityCategories,
        { columnWidths: [20, 30, 20, 30], alternateRows: true },
      ),
    );
  }
  children.push(spacer(4));

  children.push(bodyText(prose.impurityProfile));
  children.push(spacer(8));

  // Stability

  children.push(sectionHeading("3.2.P.8 Stability"));
  children.push(
    bodyText("3.2.P.8.1 Stability Summary", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText(
      `Stability studies for ${input.drugName} drug product are being conducted in accordance with ICH Q1A(R2) and ICH Q5C guidelines. Studies include long-term (2-8 degrees C), accelerated (25 degrees C/60% RH), and stress conditions to establish shelf life and support storage recommendations.`,
    ),
  );
  children.push(spacer(4));

  // Stability study design table
  const stabilityDesign: string[][] = [
    ["Long-term", "2-8 degrees C", "0, 1, 3, 6, 9, 12, 18, 24 months", "Ongoing"],
    ["Accelerated", "25 degrees C / 60% RH", "0, 1, 3, 6 months", "Ongoing"],
    ["Stress", "40 degrees C / 75% RH", "0, 1, 3 months", "Complete or ongoing"],
  ];
  children.push(
    createTable(
      ["Condition", "Temperature/Humidity", "Timepoints", "Status"],
      stabilityDesign,
      { columnWidths: [20, 25, 35, 20], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Stability-indicating parameters
  children.push(
    bodyText("Stability-Indicating Parameters", {
      bold: true,
      color: COLORS.primary,
    }),
  );

  const stabilityParams: string[][] = [
    ["Appearance", "Visual inspection"],
    ["pH", "Potentiometry"],
    ["Protein Concentration", "UV A280"],
    ["Purity (Monomer)", "SE-HPLC"],
    ["Aggregation (HMW)", "SE-HPLC"],
    ["Fragmentation (LMW)", "CE-SDS (reducing and non-reducing)"],
    ["Potency", "Cell-based assay"],
    ["Sub-visible Particles", "USP <787> / <788>"],
  ];

  if (isAdc) {
    stabilityParams.push(["DAR", "HIC"]);
    stabilityParams.push(["Free Drug", "RP-HPLC"]);
  }

  children.push(
    createTable(
      ["Parameter", "Method"],
      stabilityParams,
      { columnWidths: [45, 55], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Stability data table (if available)
  if (input.stabilityData) {
    children.push(
      bodyText("Stability Data Summary", { bold: true, color: COLORS.primary }),
    );
    const stabilityTable = buildStabilityTable(input.stabilityData);
    if (stabilityTable) {
      children.push(stabilityTable);
      children.push(spacer(4));
    }
  }

  children.push(bodyText(prose.stabilityConclusions));
  children.push(spacer(8));

  // 21 CFR Part 11 Compliance Note

  children.push(sectionHeading("Electronic Records Compliance"));
  children.push(
    bodyText(
      "All analytical data, batch records, and stability data supporting this CMC submission are maintained in compliance with 21 CFR Part 11 requirements, including:",
    ),
  );
  children.push(spacer(4));
  children.push(bulletPoint("Time-stamped, computer-generated audit trails that cannot be overwritten"));
  children.push(bulletPoint("Unique user identification and access controls for all electronic systems"));
  children.push(bulletPoint("Digital signatures equivalent to handwritten signatures per 21 CFR 11.100"));
  children.push(bulletPoint("System validation documentation per 21 CFR 11.10(a)"));
  children.push(bulletPoint("Backup and recovery procedures for electronic records"));

  return buildLegalDocument({
    title: "IND Module 3 — Quality (CMC)",
    headerRight: `IND Module 3 — ${input.drugName}`,
    children,
  });
}
