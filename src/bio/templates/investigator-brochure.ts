// investigator-brochure.ts
// Generates a DOCX Investigator's Brochure (IB) from deterministic data + AI prose.
// In real life, an IB is 80-150 pages. This generates the structured framework with
// all required sections, deterministic tables, and AI prose placeholders.

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

import type { BioDocumentInput, InvestigatorBrochureProse } from "./types";

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

function getToxField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.toxData && key in input.toxData) {
    return String(input.toxData[key]);
  }
  return fallback;
}

function getPkField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.pkData && key in input.pkData) {
    return String(input.pkData[key]);
  }
  return fallback;
}

function getClinicalField(input: BioDocumentInput, key: string, fallback: string): string {
  if (input.clinicalData && key in input.clinicalData) {
    return String(input.clinicalData[key]);
  }
  return fallback;
}

// Builder

export function buildInvestigatorBrochure(
  input: BioDocumentInput,
  prose: InvestigatorBrochureProse,
): Document {
  const dateFormatted = formatDate(input.generatedAt);
  const adc = isADC(input);
  const afucosylated = isAfucosylated(input);
  const bifunctional = isBifunctional(input);
  const requiresCrsMonitoring = bifunctional || afucosylated;

  const children: (Paragraph | Table)[] = [];

  // Title page
  children.push(documentTitle("Investigator's Brochure"));
  children.push(spacer(8));
  children.push(
    bodyText(input.drugName, { bold: true }),
  );
  children.push(
    bodyText(`(${input.drugClass})`, { bold: true }),
  );
  children.push(spacer(4));
  children.push(
    bodyText(`Sponsor: ${input.sponsorName}`),
  );
  if (input.sponsorAddress) {
    children.push(
      bodyText(`Address: ${input.sponsorAddress}`),
    );
  }
  children.push(spacer(2));
  if (input.indNumber) {
    children.push(
      bodyText(`IND Number: ${input.indNumber}`),
    );
  }
  children.push(
    bodyText(`Edition Date: ${dateFormatted}`),
  );
  children.push(
    bodyText("Edition: 1.0"),
  );
  children.push(spacer(8));
  children.push(
    bodyText(
      "CONFIDENTIAL",
      { bold: true, color: COLORS.primary },
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "This Investigator's Brochure is a confidential document provided for the exclusive use " +
      "of investigators and their staff who are involved in clinical trials of this investigational " +
      "product. The information contained herein may not be disclosed to others without written " +
      "authorization from the Sponsor.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  // Table of Contents (structural placeholder)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Table of Contents"));
  children.push(spacer(2));
  children.push(bodyText("Section 1: Drug Description"));
  children.push(bodyText("Section 2: Physical and Chemical Properties"));
  children.push(bodyText("Section 3: Nonclinical Studies Summary"));
  children.push(bodyText("Section 4: Nonclinical Safety"));
  children.push(bodyText("Section 5: Clinical Experience"));
  children.push(bodyText("Section 6: Effects in Humans"));
  children.push(bodyText("Section 7: Dosing and Administration"));
  children.push(bodyText("Section 8: Risk Management"));
  if (adc) {
    children.push(bodyText("Appendix A: ADC-Specific Considerations"));
  }

  // Section 1: Drug Description (AI prose + deterministic table)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 1: Drug Description"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.drugDescription)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  // Deterministic: drug properties table
  children.push(sectionSubheading("1.1", "Drug Properties Summary"));
  children.push(spacer(2));

  const propertiesRows: string[][] = [
    ["Drug Name", input.drugName],
    ["Drug Class", input.drugClass],
    ["Target", input.target ?? "[Target TBD]"],
    ["Mechanism of Action", input.mechanism ?? "[MOA TBD]"],
    ["Indication", input.indication ?? "[Indication TBD]"],
    ["Phase", input.phase ?? "Phase 1"],
    ["Regulatory Pathway", input.regulatoryPathway ?? "Standard IND (21 CFR 312)"],
  ];

  if (adc) {
    propertiesRows.push(["Antibody Type", input.antibodyType ?? "[Antibody Type TBD]"]);
    propertiesRows.push(["Linker Type", input.linkerType ?? "[Linker TBD]"]);
    propertiesRows.push(["Payload Type", input.payloadType ?? "[Payload TBD]"]);
    propertiesRows.push(["DAR (Drug-to-Antibody Ratio)", formatDar(input)]);
  }

  if (afucosylated) {
    propertiesRows.push(["Fc Modification", "Afucosylated (enhanced ADCC)"]);
  }

  if (bifunctional) {
    propertiesRows.push(["Mechanism Category", "Bifunctional (payload + immune-mediated)"]);
  }

  children.push(
    createTable(
      ["Property", "Value"],
      propertiesRows,
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );

  // Section 2: Physical and Chemical Properties
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 2: Physical and Chemical Properties"));
  children.push(spacer(2));

  children.push(sectionSubheading("2.1", "Drug Substance"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `${input.drugName} drug substance is a ${input.drugClass} ` +
      (adc
        ? `consisting of a ${input.antibodyType ?? "[antibody]"} antibody conjugated to ` +
          `${input.payloadType ?? "[payload]"} via a ${input.linkerType ?? "[linker]"} linker.`
        : "produced by recombinant DNA technology."),
    ),
  );

  if (adc) {
    children.push(spacer(2));
    children.push(sectionSubheading("2.2", "ADC Components"));
    children.push(spacer(2));
    children.push(
      createTable(
        ["Component", "Description", "Specification"],
        [
          ["Antibody", input.antibodyType ?? "[Type TBD]", `Target: ${input.target ?? "[TBD]"}`],
          ["Linker", input.linkerType ?? "[Type TBD]", "[Cleavable/Non-cleavable TBD]"],
          ["Payload", input.payloadType ?? "[Type TBD]", "[Mechanism TBD]"],
          ["DAR", formatDar(input), input.darSpec ? `Target: ${input.darSpec.target}, Tolerance: +/- ${input.darSpec.tolerance}` : "[Spec TBD]"],
          ["Free Drug Limit", "[Limit TBD]", "Unconjugated payload specification"],
        ],
        { columnWidths: [20, 40, 40], alternateRows: true },
      ),
    );

    children.push(spacer(4));
    children.push(sectionSubheading("2.3", "Drug Product"));
    children.push(spacer(2));
    children.push(
      bodyText(
        `${input.drugName} drug product is a sterile, preservative-free solution for intravenous ` +
        "infusion. The drug product is supplied in single-use vials.",
      ),
    );
  }

  // Section 3: Nonclinical Studies Summary (AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 3: Nonclinical Studies Summary"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.nonclinicalSummary)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("3.1", "Pharmacology Studies"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `In vitro studies demonstrated that ${input.drugName} binds to ${input.target ?? "[target]"} ` +
      `with high affinity. The proposed mechanism of action (${input.mechanism ?? "[MOA]"}) was ` +
      "confirmed in both cell-based assays and in vivo tumor models.",
    ),
  );

  if (adc && afucosylated) {
    children.push(spacer(2));
    children.push(
      bodyTextRuns([
        { text: "ADCC Activity: ", bold: true },
        {
          text:
            "Afucosylation of the antibody component enhanced Fc-gamma-RIIIa binding, resulting in " +
            "increased ADCC activity compared to the fucosylated parent antibody. ADCC was demonstrated " +
            "using peripheral blood mononuclear cells (PBMCs) from multiple donors, confirming the " +
            "dual mechanism of action (payload cytotoxicity + immune-mediated killing).",
        },
      ]),
    );
  }

  children.push(spacer(4));
  children.push(sectionSubheading("3.2", "Pharmacokinetics"));
  children.push(spacer(2));

  const toxSpecies = getToxField(input, "species", "[Species TBD]");
  const pkHalfLife = getPkField(input, "halfLife", "[T1/2 TBD]");
  const pkClearance = getPkField(input, "clearance", "[CL TBD]");
  const pkVd = getPkField(input, "vd", "[Vd TBD]");

  children.push(
    createTable(
      ["Parameter", "Value", "Species"],
      [
        ["Terminal Half-life", pkHalfLife, toxSpecies],
        ["Clearance", pkClearance, toxSpecies],
        ["Volume of Distribution", pkVd, toxSpecies],
      ],
      { columnWidths: [35, 35, 30], alternateRows: true },
    ),
  );

  if (adc) {
    children.push(spacer(2));
    children.push(
      bodyText(
        "Note: For the ADC, PK was characterized using three analytes per FDA guidance: " +
        "conjugated ADC, total antibody, and free payload. DAR stability in vivo was assessed " +
        "to characterize deconjugation kinetics.",
        { italic: true },
      ),
    );
  }

  // Section 4: Nonclinical Safety (AI prose + deterministic table)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 4: Nonclinical Safety"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.safetyProfile)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  // Deterministic: key safety findings table
  children.push(sectionSubheading("4.1", "Key Safety Findings"));
  children.push(spacer(2));

  const noael = getToxField(input, "noael", "[NOAEL TBD]");
  const loael = getToxField(input, "loael", "[LOAEL TBD]");
  const mtd = getToxField(input, "mtd", "[MTD TBD]");
  const toxRoute = getToxField(input, "route", "[Route TBD]");
  const toxDuration = getToxField(input, "duration", "[Duration TBD]");
  const targetOrgan = getToxField(input, "targetOrgan", "[Target Organ TBD]");
  const reversibility = getToxField(input, "reversibility", "[Reversibility TBD]");

  children.push(
    createTable(
      ["Finding", "Value", "Significance"],
      [
        ["NOAEL", noael, "No-observed-adverse-effect level; basis for starting dose"],
        ["LOAEL", loael, "Lowest dose with adverse effects"],
        ["MTD", mtd, "Maximum tolerated dose"],
        ["Species", toxSpecies, "Primary toxicology species"],
        ["Route", toxRoute, "Consistent with intended clinical route"],
        ["Duration", toxDuration, "Pivotal GLP study duration"],
        ["Target Organ(s)", targetOrgan, "Primary organ(s) affected"],
        ["Reversibility", reversibility, "Recovery assessment"],
      ],
      { columnWidths: [20, 30, 50], alternateRows: true },
    ),
  );

  children.push(spacer(4));
  children.push(sectionSubheading("4.2", "Safety Pharmacology"));
  children.push(spacer(2));
  children.push(
    createTable(
      ["System", "Finding", "Clinical Relevance"],
      [
        ["Cardiovascular", getToxField(input, "cvSafetyFinding", "[Finding TBD]"), "Assessed per ICH S7B"],
        ["CNS", getToxField(input, "cnsSafetyFinding", "[Finding TBD]"), "Assessed per ICH S7A"],
        ["Respiratory", getToxField(input, "respSafetyFinding", "[Finding TBD]"), "Assessed per ICH S7A"],
      ],
      { columnWidths: [25, 40, 35], alternateRows: true },
    ),
  );

  if (adc) {
    children.push(spacer(4));
    children.push(sectionSubheading("4.3", "ADC-Specific Safety Considerations"));
    children.push(spacer(2));

    // Payload toxicity profile (AI prose, ADC-specific)
    if (prose.payloadToxicityProfile) {
      children.push(
        bodyTextRuns([
          { text: "Payload Toxicity Profile: ", bold: true },
          { text: "" },
        ]),
      );
      for (const para of ensureProseArray(prose.payloadToxicityProfile)) {
        children.push(bodyText(para));
      }
    } else {
      children.push(
        bodyTextRuns([
          { text: "Payload Toxicity Profile: ", bold: true },
          {
            text:
              `The cytotoxic payload (${input.payloadType ?? "[payload]"}) has a known toxicity profile ` +
              "based on its class. Expected toxicities include myelosuppression and potential hepatotoxicity. " +
              "Free payload levels are monitored to assess systemic exposure to unconjugated drug.",
          },
        ]),
      );
    }

    // Free payload risk (AI prose, ADC-specific)
    children.push(spacer(2));
    if (prose.freePayloadRisk) {
      children.push(
        bodyTextRuns([
          { text: "Free Payload Risk Assessment: ", bold: true },
          { text: "" },
        ]),
      );
      for (const para of ensureProseArray(prose.freePayloadRisk)) {
        children.push(bodyText(para));
      }
    } else {
      children.push(
        bodyTextRuns([
          { text: "Free Payload Risk: ", bold: true },
          {
            text:
              "Premature deconjugation of the payload from the antibody results in systemic " +
              "exposure to free cytotoxic drug, which may cause off-target toxicity. Linker stability, " +
              "DAR consistency, and free drug specifications are critical quality attributes monitored " +
              "in both nonclinical and clinical settings.",
          },
        ]),
      );
    }

    // ADCC mechanism (afucosylated-specific)
    if (afucosylated) {
      children.push(spacer(2));
      if (prose.adccMechanism) {
        children.push(
          bodyTextRuns([
            { text: "ADCC Mechanism (Afucosylated Antibody): ", bold: true },
            { text: "" },
          ]),
        );
        for (const para of ensureProseArray(prose.adccMechanism)) {
          children.push(bodyText(para));
        }
      } else {
        children.push(
          bodyTextRuns([
            { text: "ADCC Mechanism: ", bold: true },
            {
              text:
                "The afucosylated Fc region of the antibody component enhances binding to " +
                "Fc-gamma-RIIIa on NK cells and macrophages, resulting in enhanced antibody-dependent " +
                "cellular cytotoxicity (ADCC). This immune-mediated mechanism provides additional " +
                "antitumor activity beyond payload-mediated cytotoxicity. However, enhanced Fc-receptor " +
                "engagement also increases the risk of cytokine release syndrome (CRS) and infusion-related " +
                "reactions, which must be monitored clinically.",
            },
          ]),
        );
      }
    }
  }

  // Section 5: Clinical Experience
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 5: Clinical Experience"));
  children.push(spacer(2));

  const hasPriorClinical = input.clinicalData?.hasPriorClinicalData === true;

  if (hasPriorClinical) {
    const priorStudySummary = getClinicalField(input, "priorStudySummary", "[Prior study data to be inserted.]");
    children.push(bodyText(priorStudySummary));
  } else {
    children.push(
      bodyText(
        `${input.drugName} has not been previously administered to humans. This Investigator's Brochure ` +
        "is based entirely on nonclinical data. Clinical data will be incorporated into subsequent " +
        "editions of the IB as the clinical program progresses.",
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        "This section will be updated with clinical experience data following completion of the " +
        "initial clinical studies, including safety, PK, and preliminary efficacy data.",
        { italic: true, color: COLORS.textGray },
      ),
    );
  }

  // Section 6: Effects in Humans
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 6: Effects in Humans"));
  children.push(spacer(2));

  if (hasPriorClinical) {
    const humanEffects = getClinicalField(input, "humanEffectsSummary", "[Human effects data to be inserted.]");
    children.push(bodyText(humanEffects));
  } else {
    children.push(
      bodyText(
        "No clinical data are available for this first-in-human investigational product. " +
        "Expected effects in humans are extrapolated from nonclinical studies and the known " +
        "pharmacology of the drug class.",
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText("Anticipated effects based on nonclinical data and drug class:", { bold: true }),
    );
    children.push(spacer(2));

    children.push(bulletPoint("Expected pharmacological effects related to target modulation."));
    if (adc) {
      children.push(bulletPoint(`Payload-related toxicity: myelosuppression, potential hepatotoxicity (${input.payloadType ?? "[payload]"} class effect).`));
      children.push(bulletPoint("Infusion-related reactions (common with monoclonal antibody-based therapies)."));
      if (afucosylated) {
        children.push(bulletPoint("Cytokine release syndrome (CRS) due to enhanced Fc-receptor engagement."));
      }
      if (bifunctional) {
        children.push(bulletPoint("On-target/off-tumor toxicity in tissues expressing the target antigen."));
        children.push(bulletPoint("Macrophage activation syndrome (MAS) — rare but requires monitoring."));
      }
    }
    children.push(bulletPoint("Immunogenicity (anti-drug antibody formation)."));
    children.push(bulletPoint("Potential hypersensitivity reactions."));
  }

  // Section 7: Dosing and Administration (deterministic + AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 7: Dosing and Administration"));
  children.push(spacer(2));

  // AI prose: dosing rationale
  for (const para of ensureProseArray(prose.dosingRationale)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  // Deterministic: proposed dose table
  children.push(sectionSubheading("7.1", "Proposed Dose Levels"));
  children.push(spacer(2));

  const proposedStartingDose = getToxField(input, "proposedStartingDose", "[Starting Dose TBD]");
  const hed = getToxField(input, "hed", "[HED TBD]");
  const safetyMargin = getToxField(input, "safetyMarginNoael", "[TBD]");

  children.push(
    createTable(
      ["Parameter", "Value", "Basis"],
      [
        ["Proposed Starting Dose", proposedStartingDose, `1/${safetyMargin} of NOAEL-based HED`],
        ["NOAEL-based HED", hed, "BSA-scaled from nonclinical NOAEL"],
        ["NOAEL", noael, `${toxSpecies}, ${toxRoute}, ${toxDuration}`],
        ["Safety Margin", `${safetyMargin}x`, "Relative to NOAEL-based HED"],
        ["Maximum Planned Dose", getClinicalField(input, "maxDose", "[Max Dose TBD]"), "Based on nonclinical MTD and exposure data"],
        ["Route", "Intravenous infusion", "Consistent with nonclinical studies"],
        ["Schedule", getClinicalField(input, "dosingSchedule", "[Schedule TBD]"), "Based on PK half-life and nonclinical data"],
      ],
      { columnWidths: [25, 30, 45], alternateRows: true },
    ),
  );

  children.push(spacer(4));
  children.push(sectionSubheading("7.2", "Administration Instructions"));
  children.push(spacer(2));
  children.push(
    bodyText(
      `${input.drugName} is administered as an intravenous infusion. The drug product should be ` +
      "diluted in the appropriate diluent per pharmacy instructions. Infusion should be administered " +
      "through a 0.2-micron in-line filter.",
    ),
  );
  children.push(spacer(2));
  children.push(bulletPoint("First infusion: administer over 90 minutes minimum with extended post-infusion monitoring (2 hours)."));
  children.push(bulletPoint("Subsequent infusions (if tolerated): may be administered over 60 minutes with 1-hour post-infusion monitoring."));
  children.push(bulletPoint("Pre-medication per protocol (antihistamine, acetaminophen, and/or corticosteroid as specified)."));
  if (requiresCrsMonitoring) {
    children.push(
      bulletPoint(
        "CRS monitoring: vital signs every 15 minutes during infusion and for 2 hours post-infusion " +
        "for initial doses. Tocilizumab must be available at the infusion site.",
        { bold: true },
      ),
    );
  }

  children.push(spacer(4));
  children.push(sectionSubheading("7.3", "Dose Modification Guidelines"));
  children.push(spacer(2));
  children.push(
    createTable(
      ["Toxicity", "Grade", "Action"],
      [
        ["Hematologic (neutropenia)", "Grade 3", "Hold dose until recovery to Grade <= 1; resume at same dose"],
        ["Hematologic (neutropenia)", "Grade 4 > 7 days", "Hold dose; resume at one dose level reduction"],
        ["Non-hematologic", "Grade 2 (clinically significant)", "Hold dose until resolution; resume at same dose or one level reduction per investigator judgment"],
        ["Non-hematologic", "Grade 3", "Hold dose; resume at one dose level reduction after recovery to Grade <= 1"],
        ["Non-hematologic", "Grade 4", "Permanently discontinue (unless clearly not drug-related)"],
        ["Infusion reaction", "Grade 1-2", "Slow/interrupt infusion; pre-medicate for subsequent doses"],
        ["Infusion reaction", "Grade 3-4", "Permanently discontinue"],
        ...(requiresCrsMonitoring
          ? [
              ["CRS", "Grade 1", "Supportive care; continue dosing"],
              ["CRS", "Grade 2", "Hold dose; resume after resolution to Grade <= 1"],
              ["CRS", "Grade 3", "Hold dose; resume at one dose level reduction after resolution"],
              ["CRS", "Grade 4", "Permanently discontinue"],
            ]
          : []),
      ],
      { columnWidths: [25, 25, 50], alternateRows: true },
    ),
  );

  // Section 8: Risk Management (AI prose)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionHeading("Section 8: Risk Management"));
  children.push(spacer(2));

  for (const para of ensureProseArray(prose.riskManagement)) {
    children.push(bodyText(para));
  }
  children.push(spacer(4));

  children.push(sectionSubheading("8.1", "Identified Risks"));
  children.push(spacer(2));

  const identifiedRisks: string[][] = [
    ["Myelosuppression", "Nonclinical tox studies", "CBC monitoring; dose modification guidelines"],
    ["Hepatotoxicity", "Nonclinical tox studies", "LFT monitoring; dose holds per protocol"],
    ["Immunogenicity", "Class effect", "ADA sampling; PK monitoring"],
    ["Infusion-related reactions", "Class effect (mAb)", "Pre-medication; stepwise infusion rate"],
  ];

  if (adc) {
    identifiedRisks.push([
      "Free payload toxicity",
      "ADC deconjugation",
      "Free payload PK monitoring; linker stability assessment",
    ]);
  }

  if (afucosylated || bifunctional) {
    identifiedRisks.push([
      "Cytokine Release Syndrome",
      "Enhanced Fc engagement",
      "ASTCT grading; tocilizumab availability; CRS management protocol",
    ]);
  }

  if (bifunctional) {
    identifiedRisks.push([
      "On-target/off-tumor toxicity",
      "Target expression on normal tissue",
      "Tissue cross-reactivity data; organ function monitoring",
    ]);
    identifiedRisks.push([
      "Macrophage Activation Syndrome",
      "Bifunctional mechanism",
      "Ferritin/LDH/D-dimer monitoring; MAS-directed therapy plan",
    ]);
  }

  children.push(
    createTable(
      ["Risk", "Source", "Mitigation"],
      identifiedRisks,
      { columnWidths: [25, 25, 50], alternateRows: true },
    ),
  );

  children.push(spacer(4));
  children.push(sectionSubheading("8.2", "Potential Risks"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "The following potential risks have been identified based on drug class and mechanism of action " +
      "but have not been observed in the nonclinical program:",
    ),
  );
  children.push(spacer(2));
  children.push(bulletPoint("Embryo-fetal toxicity (reproductive toxicity studies pending or not conducted)."));
  children.push(bulletPoint("Secondary malignancies (theoretical risk with genotoxic payloads; long-term monitoring required)."));
  children.push(bulletPoint("Cardiac toxicity (QTc prolongation if payload class effect; ECG monitoring included)."));
  if (adc) {
    children.push(bulletPoint("Ocular toxicity (reported with certain ADC payload classes; ophthalmologic exams included)."));
    children.push(bulletPoint("Peripheral neuropathy (reported with microtubule-targeting payloads; neurological assessment included)."));
  }

  children.push(spacer(4));
  children.push(sectionSubheading("8.3", "IND Safety Reporting Obligations"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "The Sponsor will comply with all IND safety reporting requirements under 21 CFR 312.32:",
    ),
  );
  children.push(spacer(2));
  children.push(bulletPoint("15-day expedited reports: Serious and unexpected suspected adverse reactions."));
  children.push(bulletPoint("7-day expedited reports: Fatal or life-threatening unexpected suspected adverse reactions."));
  children.push(bulletPoint("Annual reports: Annual summary of safety, protocol amendments, and study progress."));

  // ADC-specific appendix
  if (adc) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHeading("Appendix A: ADC-Specific Considerations"));
    children.push(spacer(2));

    children.push(sectionSubheading("A.1", "ADC Architecture"));
    children.push(spacer(2));
    children.push(
      createTable(
        ["Component", "Detail"],
        [
          ["Antibody", `${input.antibodyType ?? "[Type TBD]"} targeting ${input.target ?? "[target]"}`],
          ["Fc Modification", afucosylated ? "Afucosylated (enhanced ADCC)" : "Standard Fc"],
          ["Linker", `${input.linkerType ?? "[Type TBD]"}`],
          ["Payload", `${input.payloadType ?? "[Type TBD]"}`],
          ["DAR Specification", formatDar(input)],
          ["Mechanism Category", bifunctional ? "Bifunctional (payload + immune-mediated)" : "Standard ADC (payload-mediated)"],
        ],
        { columnWidths: [30, 70], alternateRows: true },
      ),
    );

    children.push(spacer(4));
    children.push(sectionSubheading("A.2", "Three-Analyte PK Requirement"));
    children.push(spacer(2));
    children.push(
      bodyText(
        "Per FDA guidance on Clinical Pharmacology Considerations for ADCs, the following three " +
        "analytes must be measured in all PK studies:",
      ),
    );
    children.push(spacer(2));
    children.push(
      createTable(
        ["Analyte", "Description", "Assay Requirement"],
        [
          ["Conjugated ADC", "Antibody with payload attached", "Validated ligand-binding or LC-MS/MS assay"],
          ["Total Antibody", "All antibody species (with and without payload)", "Validated ligand-binding assay"],
          ["Free Payload", "Unconjugated cytotoxic drug", "Validated LC-MS/MS assay"],
        ],
        { columnWidths: [25, 35, 40], alternateRows: true },
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        "Insufficient analytical sensitivity for any of these analytes may result in a Clinical Hold.",
        { bold: true, color: COLORS.primary },
      ),
    );

    if (afucosylated) {
      children.push(spacer(4));
      children.push(sectionSubheading("A.3", "ADCC Potency Assay Requirement"));
      children.push(spacer(2));
      children.push(
        bodyText(
          "Because the antibody is afucosylated, the potency assay strategy cannot rely solely on " +
          "payload-mediated cytotoxicity. A validated biological assay demonstrating ADCC activity " +
          "must be included in the release testing panel (Module 3, CMC). Failure to include an ADCC " +
          "assay for an afucosylated antibody will result in rejection of the potency characterization.",
          { bold: true },
        ),
      );
    }
  }

  // Document footer
  children.push(spacer(8));
  children.push(
    bodyText(
      `Document generated: ${dateFormatted}`,
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(
    bodyText(
      "This Investigator's Brochure is intended for use by qualified investigators and requires " +
      "review by the Sponsor's medical, regulatory, and safety teams prior to distribution.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  return buildLegalDocument({
    title: "Investigator's Brochure",
    headerRight: `IB — ${input.drugName} — ${input.sponsorName}`,
    children,
  });
}
