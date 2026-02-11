// ind-module-4.ts
// Generates a DOCX IND Module 4: Nonclinical Study Reports from deterministic data + AI prose.

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

import type { BioDocumentInput, INDModule4Prose } from "./types";

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

/** Extract tox data fields safely with fallback placeholders. */
function getToxField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.toxData && key in input.toxData) {
    return String(input.toxData[key]);
  }
  return fallback;
}

/** Extract PK data fields safely with fallback placeholders. */
function getPkField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.pkData && key in input.pkData) {
    return String(input.pkData[key]);
  }
  return fallback;
}

// Builder

export function buildINDModule4(
  input: BioDocumentInput,
  prose: INDModule4Prose,
): Document {
  const dateFormatted = formatDate(input.generatedAt);
  const adc = isADC(input);
  const afucosylated = isAfucosylated(input);
  const bifunctional = isBifunctional(input);

  const children: (Paragraph | Table)[] = [];

  // Title page
  children.push(documentTitle("IND Module 4: Nonclinical Study Reports"));
  children.push(spacer(4));
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
  if (input.indNumber) {
    children.push(
      bodyText(`IND Number: ${input.indNumber}`, { bold: true }),
    );
  }
  children.push(
    bodyText(`Date: ${dateFormatted}`, { bold: true }),
  );
  children.push(
    bodyText(`Regulatory Pathway: ${input.regulatoryPathway ?? "Standard IND (21 CFR 312)"}`, { bold: true }),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "CONFIDENTIAL: This document contains proprietary nonclinical data submitted in support of an Investigational New Drug Application. Unauthorized disclosure is prohibited.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  // Section 1: Toxicology Summary
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("4.1 Toxicology Summary"));
  children.push(spacer(2));

  // AI prose: toxicology narrative
  for (const para of ensureProseArray(prose.toxicologyNarrative)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  // Deterministic: NOAEL/LOAEL/MTD table
  children.push(sectionSubheading("4.1.1", "Key Toxicology Findings"));
  children.push(spacer(2));

  const noael = getToxField(input, "noael", "[NOAEL TBD]");
  const loael = getToxField(input, "loael", "[LOAEL TBD]");
  const mtd = getToxField(input, "mtd", "[MTD TBD]");
  const toxSpecies = getToxField(input, "species", "[Species TBD]");
  const toxRoute = getToxField(input, "route", "[Route TBD]");
  const toxDuration = getToxField(input, "duration", "[Duration TBD]");
  const glpCompliant = getToxField(input, "glpCompliant", "[GLP Status TBD]");

  children.push(
    createTable(
      ["Parameter", "Value", "Notes"],
      [
        ["NOAEL", noael, "No-Observed-Adverse-Effect Level"],
        ["LOAEL", loael, "Lowest-Observed-Adverse-Effect Level"],
        ["MTD", mtd, "Maximum Tolerated Dose"],
        ["Species", toxSpecies, "Primary toxicology species"],
        ["Route of Administration", toxRoute, "Route used in pivotal studies"],
        ["Study Duration", toxDuration, "Duration of pivotal tox study"],
        ["GLP Compliance", glpCompliant, "21 CFR 58"],
      ],
      { columnWidths: [30, 30, 40], alternateRows: true },
    ),
  );
  children.push(spacer(4));

  // Deterministic: Dose levels table
  children.push(sectionSubheading("4.1.2", "Dose Levels Evaluated"));
  children.push(spacer(2));

  const toxDoseLevels = (input.toxData?.doseLevels as Array<Record<string, unknown>>) ?? null;

  if (toxDoseLevels && toxDoseLevels.length > 0) {
    children.push(
      createTable(
        ["Dose Level", "Dose (mg/kg)", "Animals (N)", "Key Findings"],
        toxDoseLevels.map((d) => [
          String(d.level ?? ""),
          String(d.dose ?? ""),
          String(d.n ?? ""),
          String(d.findings ?? ""),
        ]),
        { columnWidths: [15, 20, 15, 50], alternateRows: true },
      ),
    );
  } else {
    children.push(
      createTable(
        ["Dose Level", "Dose (mg/kg)", "Animals (N)", "Key Findings"],
        [
          ["Low", "[TBD]", "[TBD]", "[Pending final study report]"],
          ["Mid", "[TBD]", "[TBD]", "[Pending final study report]"],
          ["High", "[TBD]", "[TBD]", "[Pending final study report]"],
        ],
        { columnWidths: [15, 20, 15, 50], alternateRows: true },
      ),
    );
  }
  children.push(spacer(4));

  // Deterministic: Species and route information
  children.push(sectionSubheading("4.1.3", "Species and Route Selection Rationale"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `The primary toxicology species selected for ${input.drugName} is ${toxSpecies}. ` +
      `The route of administration is ${toxRoute}, consistent with the intended clinical route. ` +
      "Species selection was based on target expression, pharmacological relevance, and cross-reactivity data.",
    ),
  );

  if (adc) {
    children.push(spacer(2));
    children.push(
      bodyText(
        `As an ADC, species selection also considered expression of the target antigen (${input.target ?? "[target]"}) ` +
        "in the tox species to ensure relevant assessment of on-target toxicity. " +
        "Cross-reactivity of the antibody component was confirmed in the selected species.",
        { italic: true },
      ),
    );
  }
  children.push(spacer(4));

  // Deterministic: HED calculation and safety margin table
  children.push(sectionSubheading("4.1.4", "Human Equivalent Dose (HED) and Safety Margins"));
  children.push(spacer(2));

  const hed = getToxField(input, "hed", "[HED TBD]");
  const proposedStartingDose = getToxField(input, "proposedStartingDose", "[Starting Dose TBD]");
  const safetyMarginNoael = getToxField(input, "safetyMarginNoael", "[TBD]");
  const safetyMarginMtd = getToxField(input, "safetyMarginMtd", "[TBD]");

  children.push(
    createTable(
      ["Parameter", "Animal Dose", "HED", "Proposed Clinical Dose", "Safety Margin"],
      [
        ["Based on NOAEL", noael, hed, proposedStartingDose, safetyMarginNoael + "x"],
        ["Based on MTD", mtd, "[MTD-HED TBD]", proposedStartingDose, safetyMarginMtd + "x"],
      ],
      { columnWidths: [20, 18, 18, 22, 22], alternateRows: true },
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "HED calculations follow FDA Guidance for Industry: Estimating the Maximum Safe Starting Dose " +
      "in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers (July 2005). " +
      "Body surface area (BSA) scaling factors were applied as appropriate for the species used.",
    ),
  );

  // Section 2: Pharmacology Summary
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("4.2 Pharmacology Summary"));
  children.push(spacer(2));

  // AI prose: pharmacology narrative
  for (const para of ensureProseArray(prose.pharmacologyNarrative)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("4.2.1", "Primary Pharmacodynamics"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `${input.drugName} is a ${input.drugClass} that targets ${input.target ?? "[target]"}. ` +
      `The proposed mechanism of action is: ${input.mechanism ?? "[mechanism TBD]"}.`,
    ),
  );
  if (adc) {
    children.push(spacer(2));
    children.push(
      bodyTextRuns([
        { text: "ADC Mechanism: ", bold: true },
        {
          text:
            `The antibody component (${input.antibodyType ?? "[antibody type TBD]"}) delivers the cytotoxic payload ` +
            `(${input.payloadType ?? "[payload TBD]"}) via a ${input.linkerType ?? "[linker TBD]"} linker. ` +
            `Target DAR: ${formatDar(input)}.`,
        },
      ]),
    );
    if (afucosylated) {
      children.push(spacer(2));
      children.push(
        bodyTextRuns([
          { text: "ADCC Activity: ", bold: true },
          {
            text:
              "The antibody is afucosylated, enhancing Fc-receptor binding and antibody-dependent " +
              "cellular cytotoxicity (ADCC). This dual mechanism (payload + ADCC) contributes to " +
              "antitumor activity but also requires assessment of immune-mediated toxicity.",
          },
        ]),
      );
    }
  }

  // Section 3: Pharmacokinetics Summary
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("4.3 Pharmacokinetics Summary"));
  children.push(spacer(2));

  // AI prose: PK narrative
  for (const para of ensureProseArray(prose.pkNarrative)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  // Deterministic: PK parameters
  children.push(sectionSubheading("4.3.1", "Nonclinical PK Parameters"));
  children.push(spacer(2));

  const pkHalfLife = getPkField(input, "halfLife", "[T1/2 TBD]");
  const pkCmax = getPkField(input, "cmax", "[Cmax TBD]");
  const pkAuc = getPkField(input, "auc", "[AUC TBD]");
  const pkClearance = getPkField(input, "clearance", "[CL TBD]");
  const pkVd = getPkField(input, "vd", "[Vd TBD]");
  const pkBioavailability = getPkField(input, "bioavailability", "[F TBD]");

  children.push(
    createTable(
      ["PK Parameter", "Value", "Species", "Notes"],
      [
        ["Half-life (T1/2)", pkHalfLife, toxSpecies, "Terminal elimination half-life"],
        ["Cmax", pkCmax, toxSpecies, "Peak plasma concentration"],
        ["AUC", pkAuc, toxSpecies, "Area under the curve"],
        ["Clearance (CL)", pkClearance, toxSpecies, "Systemic clearance"],
        ["Volume of Distribution (Vd)", pkVd, toxSpecies, "Apparent volume of distribution"],
        ["Bioavailability (F)", pkBioavailability, toxSpecies, "Absolute bioavailability"],
      ],
      { columnWidths: [25, 25, 20, 30], alternateRows: true },
    ),
  );

  if (adc) {
    children.push(spacer(4));
    children.push(sectionSubheading("4.3.2", "ADC-Specific PK Analytes"));
    children.push(spacer(2));
    children.push(
      bodyText(
        "Per FDA Clinical Pharmacology Considerations for Antibody-Drug Conjugates, " +
        "three analytes must be measured in nonclinical and clinical PK studies:",
      ),
    );
    children.push(spacer(2));
    children.push(
      createTable(
        ["Analyte", "Description", "Method"],
        [
          ["Conjugated ADC", "Intact antibody with payload attached (active drug)", "[Assay TBD]"],
          ["Total Antibody", "All antibody species (conjugated + deconjugated)", "[Assay TBD]"],
          ["Free Payload", `Unconjugated ${input.payloadType ?? "payload"} in circulation`, "[Assay TBD]"],
        ],
        { columnWidths: [25, 45, 30], alternateRows: true },
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        "Insufficient analytical sensitivity for any of these three analytes may result in " +
        "a Clinical Hold. Assay validation must demonstrate adequate sensitivity, specificity, " +
        "and dynamic range for each analyte.",
        { italic: true, color: COLORS.primary },
      ),
    );
  }

  // Section 4: Safety Pharmacology
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("4.4 Safety Pharmacology"));
  children.push(spacer(2));

  // AI prose: safety pharmacology narrative
  for (const para of ensureProseArray(prose.safetyPharmacologyNarrative)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("4.4.1", "Core Battery Studies (ICH S7A/S7B)"));
  children.push(spacer(2));
  children.push(
    createTable(
      ["System", "Study Type", "Status", "Key Finding"],
      [
        ["Cardiovascular", "hERG assay + telemetry", getToxField(input, "cvSafetyStatus", "[Status TBD]"), getToxField(input, "cvSafetyFinding", "[Finding TBD]")],
        ["Central Nervous System", "Irwin/FOB assessment", getToxField(input, "cnsSafetyStatus", "[Status TBD]"), getToxField(input, "cnsSafetyFinding", "[Finding TBD]")],
        ["Respiratory", "Plethysmography", getToxField(input, "respSafetyStatus", "[Status TBD]"), getToxField(input, "respSafetyFinding", "[Finding TBD]")],
      ],
      { columnWidths: [20, 25, 20, 35], alternateRows: true },
    ),
  );

  // ADC-specific: Tissue Cross-Reactivity section
  if (adc) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHeading("4.5 Tissue Cross-Reactivity (ADC-Specific)"));
    children.push(spacer(2));

    if (prose.tissueCrossReactivityNarrative) {
      for (const para of ensureProseArray(prose.tissueCrossReactivityNarrative)) {
        children.push(bodyText(para));
      }
    } else {
      children.push(
        bodyText(
          "[Tissue cross-reactivity narrative not yet generated. Manual review required.]",
          { italic: true, color: COLORS.textGray },
        ),
      );
    }

    children.push(spacer(4));
    children.push(sectionSubheading("4.5.1", "TCR Study Design"));
    children.push(spacer(2));
    children.push(
      bodyText(
        `Tissue cross-reactivity (TCR) studies evaluated binding of ${input.drugName} antibody component ` +
        `to a panel of normal human tissues (minimum 38 tissues per FDA guidance). ` +
        `Target antigen: ${input.target ?? "[target]"}. Particular attention was directed to ` +
        "tissues with known expression of the target antigen to assess on-target/off-tumor risk.",
      ),
    );

    if (bifunctional) {
      children.push(spacer(2));
      children.push(
        bodyText(
          "Note: As a bifunctional ADC, tissue cross-reactivity assessment included evaluation " +
          "of both target-dependent binding and Fc-mediated interactions. On-target/off-tumor risk " +
          "is elevated due to the bifunctional mechanism, particularly in tissues where the target " +
          "is expressed on normal cells (e.g., mucosal epithelial cells).",
          { italic: true, color: COLORS.primary },
        ),
      );
    }

    // ADC-specific: DAR characterization in tox species
    children.push(spacer(4));
    children.push(sectionHeading("4.6 DAR Characterization in Toxicology Species"));
    children.push(spacer(2));

    if (prose.darCharacterizationNarrative) {
      for (const para of ensureProseArray(prose.darCharacterizationNarrative)) {
        children.push(bodyText(para));
      }
    } else {
      children.push(
        bodyText(
          "[DAR characterization narrative not yet generated. Manual review required.]",
          { italic: true, color: COLORS.textGray },
        ),
      );
    }

    children.push(spacer(4));
    children.push(sectionSubheading("4.6.1", "DAR Stability In Vivo"));
    children.push(spacer(2));
    children.push(
      createTable(
        ["Parameter", "Specification", "Observed (Tox Species)", "Notes"],
        [
          ["Target DAR", formatDar(input), getToxField(input, "observedDar", "[Observed TBD]"), "Drug-to-antibody ratio at dosing"],
          ["DAR at 24h", "[Spec TBD]", getToxField(input, "dar24h", "[TBD]"), "Deconjugation assessment"],
          ["DAR at 168h", "[Spec TBD]", getToxField(input, "dar168h", "[TBD]"), "1-week stability"],
          ["Free Payload (Cmax)", "[Limit TBD]", getToxField(input, "freePayloadCmax", "[TBD]"), "Unconjugated payload exposure"],
        ],
        { columnWidths: [22, 22, 26, 30], alternateRows: true },
      ),
    );
  }

  // Summary and Conclusions
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading(adc ? "4.7 Nonclinical Summary and Conclusions" : "4.5 Nonclinical Summary and Conclusions"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `Based on the nonclinical program for ${input.drugName}, the following conclusions support ` +
      "initiation of clinical studies:",
    ),
  );
  children.push(spacer(2));
  children.push(
    bulletPoint(
      `NOAEL was established at ${noael} in ${toxSpecies} following ${toxRoute} administration for ${toxDuration}.`,
    ),
  );
  children.push(
    bulletPoint(
      `The proposed starting dose of ${proposedStartingDose} provides a safety margin of ` +
      `${safetyMarginNoael}x relative to the NOAEL-based HED.`,
    ),
  );
  children.push(
    bulletPoint(
      "No unexpected or irreversible toxicity was observed at doses below the MTD.",
    ),
  );
  children.push(
    bulletPoint(
      "Safety pharmacology core battery studies did not identify any dose-limiting safety signals " +
      "in cardiovascular, CNS, or respiratory systems at clinically relevant exposures.",
    ),
  );
  if (adc) {
    children.push(
      bulletPoint(
        "ADC-specific assessments (tissue cross-reactivity, DAR stability, three-analyte PK) " +
        "support the proposed clinical development program.",
      ),
    );
  }

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
      "qualified nonclinical and regulatory professionals prior to filing.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "IND Module 4: Nonclinical Study Reports",
    headerRight: `Module 4 — ${input.drugName} — ${input.sponsorName}`,
    children,
  });
}
