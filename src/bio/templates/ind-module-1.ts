// ind-module-1.ts
// Generates a DOCX for IND Module 1: Administrative and Prescribing Information.
// Mostly deterministic — cover page with Form 1571 fields, sponsor info,
// regulatory history, and fast track/breakthrough designation. AI prose is
// limited to the introductory statement and general investigational plan summary.

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
  signatureBlock,
  keyTermsTable,
  createTable,
  formatDate,
  ensureProseArray,
  COLORS,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, INDModule1Prose } from "./types";

export function buildINDModule1(
  input: BioDocumentInput,
  prose: INDModule1Prose,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);

  // Cover Page

  children.push(spacer(12));
  children.push(documentTitle("Investigational New Drug Application"));
  children.push(
    bodyText("Module 1: Administrative Information and Prescribing Information", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(8));
  children.push(
    bodyText(`Sponsor: ${input.sponsorName}`, { bold: true }),
  );
  if (input.sponsorAddress) {
    children.push(bodyText(input.sponsorAddress));
  }
  children.push(spacer(4));
  children.push(bodyText(`Date: ${dateFormatted}`));
  children.push(spacer(16));

  // Form FDA 1571 Fields

  children.push(sectionHeading("Form FDA 1571 — IND Cover Sheet"));
  children.push(spacer(4));

  const form1571Fields: Array<{ label: string; value: string }> = [
    { label: "Sponsor Name", value: input.sponsorName },
    { label: "Sponsor Address", value: input.sponsorAddress || "[Address TBD]" },
    { label: "Drug Name", value: input.drugName },
    { label: "Drug Class", value: input.drugClass },
    { label: "IND Number", value: input.indNumber || "[To be assigned by FDA]" },
    { label: "NCT Number", value: input.nctNumber || "[Not yet registered]" },
    { label: "Phase of Clinical Investigation", value: input.phase || "Phase 1" },
    { label: "Indication", value: input.indication || "[Indication TBD]" },
    { label: "Date of Submission", value: dateFormatted },
  ];

  if (input.target) {
    form1571Fields.push({ label: "Molecular Target", value: input.target });
  }
  if (input.mechanism) {
    form1571Fields.push({ label: "Mechanism of Action", value: input.mechanism });
  }

  children.push(keyTermsTable(form1571Fields));
  children.push(spacer(8));

  // Table of Contents Placeholder

  children.push(sectionHeading("Table of Contents"));
  children.push(
    bodyText(
      "A comprehensive table of contents for all IND modules and appendices will be generated upon assembly of the complete submission package. Section numbering follows the Common Technical Document (CTD) format.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(4));

  const tocEntries = [
    ["1", "Module 1: Administrative Information", "This document"],
    ["1.1", "Form FDA 1571", "Cover sheet"],
    ["1.2", "Table of Contents", "This section"],
    ["1.3", "Introductory Statement", "See below"],
    ["1.4", "General Investigational Plan", "See below"],
    ["1.5", "Investigator's Brochure", "Separate document"],
    ["1.6", "Clinical Protocol", "Separate document"],
    ["2", "Module 2: Summaries", "Separate document"],
    ["3", "Module 3: Quality (CMC)", "Separate document"],
    ["4", "Module 4: Nonclinical Study Reports", "Separate document"],
    ["5", "Module 5: Clinical Study Reports", "Separate document"],
  ];
  children.push(
    createTable(
      ["Section", "Title", "Reference"],
      tocEntries,
      { columnWidths: [15, 55, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Sponsor Information

  children.push(sectionHeading("Sponsor Information"));

  const sponsorDetails: Array<{ label: string; value: string }> = [
    { label: "Sponsor", value: input.sponsorName },
    { label: "Address", value: input.sponsorAddress || "[Address TBD]" },
    { label: "Regulatory Contact", value: "[Regulatory affairs contact TBD]" },
    { label: "Medical Monitor", value: "[Medical monitor TBD]" },
    { label: "Safety Reporting Contact", value: "[Safety officer TBD]" },
  ];
  children.push(keyTermsTable(sponsorDetails));
  children.push(spacer(4));
  children.push(
    bodyText(
      "The sponsor commits to comply with all applicable requirements under 21 CFR Part 312 regarding the conduct of clinical investigations of investigational new drugs, including but not limited to: maintaining adequate records, reporting adverse events within required timeframes, ensuring investigator qualification, and obtaining informed consent from all study participants.",
    ),
  );
  children.push(spacer(8));

  // Regulatory History

  children.push(sectionHeading("Regulatory History"));

  if (input.indNumber) {
    children.push(
      bodyText(
        `IND ${input.indNumber} was assigned to ${input.drugName} (${input.drugClass}). The following regulatory interactions have occurred:`,
      ),
    );
  } else {
    children.push(
      bodyText(
        `This is an original IND submission for ${input.drugName} (${input.drugClass}). No prior IND number has been assigned by FDA for this investigational product.`,
      ),
    );
  }
  children.push(spacer(4));

  children.push(
    bodyText("Pre-IND Interactions:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    bulletPoint("[Pre-IND meeting date and type — to be populated upon scheduling]"),
  );
  children.push(
    bulletPoint("[FDA feedback summary — to be populated after meeting]"),
  );
  children.push(spacer(4));

  children.push(
    bodyText("Related Applications:", { bold: true, color: COLORS.primary }),
  );
  if (input.nctNumber) {
    children.push(bulletPoint(`ClinicalTrials.gov Registration: ${input.nctNumber}`));
  } else {
    children.push(
      bulletPoint("ClinicalTrials.gov registration will be completed prior to enrollment of first subject."),
    );
  }
  children.push(spacer(8));

  // Fast Track / Breakthrough Therapy Designation

  children.push(sectionHeading("Expedited Program Designations"));

  const pathway = input.regulatoryPathway?.toLowerCase() || "";
  const hasFastTrack = pathway.includes("fast track");
  const hasBreakthrough = pathway.includes("breakthrough");
  const hasOrphan = pathway.includes("orphan");
  const hasAccelerated = pathway.includes("accelerated");

  if (hasFastTrack || hasBreakthrough || hasOrphan || hasAccelerated) {
    children.push(
      bodyText(
        `${input.drugName} has been designated or is being pursued under the following expedited regulatory pathway(s):`,
      ),
    );
    children.push(spacer(4));

    const designationRows: string[][] = [];
    if (hasFastTrack) {
      designationRows.push([
        "Fast Track Designation",
        "FDA Section 506(b)",
        input.indication || "[Indication TBD]",
        "[Date granted or date of request]",
      ]);
    }
    if (hasBreakthrough) {
      designationRows.push([
        "Breakthrough Therapy Designation",
        "FDA Section 506(a)",
        input.indication || "[Indication TBD]",
        "[Date granted or date of request]",
      ]);
    }
    if (hasOrphan) {
      designationRows.push([
        "Orphan Drug Designation",
        "Orphan Drug Act Section 526",
        input.indication || "[Indication TBD]",
        "[Date granted or date of request]",
      ]);
    }
    if (hasAccelerated) {
      designationRows.push([
        "Accelerated Approval Pathway",
        "FDA Section 506(c)",
        input.indication || "[Indication TBD]",
        "[Date of request]",
      ]);
    }

    children.push(
      createTable(
        ["Designation", "Authority", "Indication", "Status/Date"],
        designationRows,
        { columnWidths: [25, 25, 25, 25], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText(
        `No expedited program designations (Fast Track, Breakthrough Therapy, Orphan Drug, or Accelerated Approval) have been granted or requested for ${input.drugName} at this time. The sponsor will evaluate eligibility for expedited pathways based on emerging clinical data.`,
      ),
    );
  }
  children.push(spacer(8));

  // Introductory Statement (AI prose)

  children.push(sectionHeading("1.3 Introductory Statement"));
  children.push(bodyText(prose.introductoryStatement));
  children.push(spacer(8));

  // General Investigational Plan (AI prose)

  children.push(sectionHeading("1.4 General Investigational Plan"));
  children.push(bodyText(prose.generalInvestigationalPlan));
  children.push(spacer(8));

  // 21 CFR Part 312 Commitments

  children.push(sectionHeading("Sponsor Commitments (21 CFR 312)"));

  children.push(
    bodyText(
      "The undersigned sponsor hereby commits to the following obligations in accordance with 21 CFR Part 312:",
    ),
  );
  children.push(spacer(4));
  children.push(
    bulletPoint(
      "The sponsor will not begin clinical investigations until an IND is in effect (21 CFR 312.40).",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will ensure that the investigation is conducted in accordance with the general investigational plan and protocols contained in the IND (21 CFR 312.50).",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will select qualified investigators, provide them with the information they need to conduct the investigation properly, and ensure proper monitoring of the investigation (21 CFR 312.50, 312.53, 312.56).",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will ensure that IRB review and approval is obtained before the study is initiated at each site (21 CFR 312.66).",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will submit IND safety reports as required by 21 CFR 312.32, including 7-day and 15-day reports for serious and unexpected adverse events.",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will submit annual reports as required by 21 CFR 312.33.",
    ),
  );
  children.push(
    bulletPoint(
      "The sponsor will maintain adequate records and make them available for FDA inspection as required by 21 CFR 312.62.",
    ),
  );
  children.push(spacer(8));

  // Diversity Action Plan (FDORA requirement)

  children.push(sectionHeading("Diversity Action Plan"));
  children.push(
    bodyText(
      "In accordance with the Food and Drug Omnibus Reform Act (FDORA), the sponsor will submit a Diversity Action Plan (DAP) with this IND application. The DAP will describe the sponsor's goals and planned enrollment strategies to ensure adequate representation of clinically relevant populations in the clinical investigation, including:",
    ),
  );
  children.push(spacer(4));
  children.push(bulletPoint("Enrollment targets by race, ethnicity, sex, and age group"));
  children.push(bulletPoint("Site selection strategy to reach diverse patient populations"));
  children.push(bulletPoint("Community engagement and outreach plans"));
  children.push(bulletPoint("Decentralized trial elements to reduce participation burden"));
  children.push(bulletPoint("Reporting and monitoring of enrollment demographics"));
  children.push(spacer(8));

  // Signature

  children.push(sectionHeading("Authorized Signature"));
  children.push(
    bodyText(
      "By signing below, the sponsor certifies that the information provided in this IND application is accurate and complete, and that the sponsor will comply with all applicable FDA regulations governing the conduct of clinical investigations.",
    ),
  );
  children.push(...signatureBlock(input.sponsorName, "Authorized Representative"));

  return buildLegalDocument({
    title: "IND Module 1 — Administrative Information",
    headerRight: `IND Module 1 — ${input.drugName}`,
    children,
  });
}
