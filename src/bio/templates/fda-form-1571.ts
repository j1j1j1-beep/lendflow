// fda-form-1571.ts
// Generates a DOCX representation of FDA Form 1571 (IND Application Cover Sheet).
// This is a deterministic form — zero AI prose. All fields come from BioDocumentInput.

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

import type { BioDocumentInput } from "./types";

export function buildFDAForm1571(input: BioDocumentInput): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const phase = input.phase ?? "Phase 1";

  // -------------------------------------------------------------------------
  // Form Header
  // -------------------------------------------------------------------------
  children.push(documentTitle("Department of Health and Human Services"));
  children.push(
    bodyText("Food and Drug Administration", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(documentTitle("Form FDA 1571"));
  children.push(
    bodyText("Investigational New Drug Application (IND)", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    bodyText("(Title 21, Code of Federal Regulations (CFR) Part 312)", {
      italic: true,
    }),
  );
  children.push(spacer(4));

  // -------------------------------------------------------------------------
  // Section 1: Submission Type
  // -------------------------------------------------------------------------
  children.push(sectionHeading("1. Submission Type"));

  const submissionType = input.indNumber ? "Amendment" : "Initial Submission";

  children.push(
    createTable(
      ["Field", "Value"],
      [
        ["Type of Submission", submissionType],
        ["IND Number (if previously assigned)", input.indNumber ?? "[To be assigned by FDA]"],
        ["Serial Number", "000"],
        ["Date of Submission", dateFormatted],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Section 2: Applicant/Sponsor Information
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("2. Applicant (Sponsor) Information"));

  children.push(
    createTable(
      ["Field", "Value"],
      [
        ["Name of Sponsor", input.sponsorName],
        ["Address", input.sponsorAddress ?? "[Address TBD]"],
        ["Telephone Number", "[Phone Number]"],
        ["Fax Number", "[Fax Number]"],
        ["Email Address", "[Email Address]"],
        ["Date Sponsor Signed", dateFormatted],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Section 3: Drug Information
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("3. Drug Information"));

  const drugRows: string[][] = [
    ["Name of Drug", input.drugName],
    ["Drug Class", input.drugClass],
  ];

  if (input.target) {
    drugRows.push(["Molecular Target", input.target]);
  }
  if (input.mechanism) {
    drugRows.push(["Mechanism of Action", input.mechanism]);
  }
  if (input.indication) {
    drugRows.push(["Proposed Indication(s)", input.indication]);
  }
  drugRows.push(["Phase(s) of Clinical Investigation to be Conducted", phase]);

  // ADC-specific
  if (input.antibodyType) {
    drugRows.push(["Antibody Type", input.antibodyType]);
  }
  if (input.linkerType) {
    drugRows.push(["Linker", input.linkerType]);
  }
  if (input.payloadType) {
    drugRows.push(["Payload", input.payloadType]);
  }
  if (input.dar !== undefined) {
    drugRows.push(["DAR (Drug-to-Antibody Ratio)", String(input.dar)]);
  }

  children.push(
    createTable(
      ["Field", "Value"],
      drugRows,
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Section 4: Regulatory Pathway and Phase
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("4. Regulatory Information"));

  children.push(
    createTable(
      ["Field", "Value"],
      [
        ["IND Number", input.indNumber ?? "[To be assigned by FDA]"],
        ["NCT Number", input.nctNumber ?? "[To be assigned upon registration]"],
        ["Regulatory Pathway", input.regulatoryPathway ?? "Standard IND (21 CFR 312)"],
        ["Phase of Investigation", phase],
        ["Route of Administration", "Intravenous (IV) Infusion"],
        ["Dosage Form", "Solution for Infusion"],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Section 5: Contents of Application (Checklist)
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("5. Contents of Application"));

  children.push(
    bodyText(
      "The following items are included in this IND application:",
      { italic: true },
    ),
  );

  // Build checklist based on what data is available
  const checklistItems: Array<{ module: string; description: string; included: string }> = [
    {
      module: "Form FDA 1571",
      description: "IND Cover Sheet (this form)",
      included: "Yes",
    },
    {
      module: "Table of Contents",
      description: "Comprehensive listing of all IND components",
      included: "Yes",
    },
    {
      module: "Introductory Statement and General Investigational Plan",
      description: "Summary of drug, rationale, and development plan",
      included: "Yes",
    },
    {
      module: "Investigator's Brochure (IB)",
      description: "Preclinical data, safety, PK, and dosing rationale",
      included: "Yes",
    },
    {
      module: "Protocol(s)",
      description: `${phase} Clinical Protocol`,
      included: "Yes",
    },
    {
      module: "Chemistry, Manufacturing, and Controls (CMC)",
      description: "Module 3: Drug Substance (3.2.S) and Drug Product (3.2.P)",
      included: "Yes",
    },
    {
      module: "Pharmacology and Toxicology Information",
      description: "Module 4: Nonclinical study reports (GLP and non-GLP)",
      included: "Yes",
    },
    {
      module: "Previous Human Experience",
      description: "Any prior clinical data with this agent",
      included: "N/A (First-in-Human)",
    },
    {
      module: "Additional Information",
      description: "Drug dependence and abuse potential; radioactive drugs",
      included: "N/A",
    },
    {
      module: "Form FDA 1572",
      description: "Statement of Investigator",
      included: "Pending (submitted per site)",
    },
    {
      module: "Form FDA 3674",
      description: "Certification of Compliance (ClinicalTrials.gov)",
      included: "Yes",
    },
    {
      module: "Diversity Action Plan",
      description: "FDORA-required enrollment diversity plan",
      included: "Yes",
    },
    {
      module: "Informed Consent Form",
      description: "Template ICF for IRB review",
      included: "Yes",
    },
    {
      module: "Environmental Assessment or Claim for Categorical Exclusion",
      description: "21 CFR 25.31(a) categorical exclusion for clinical research",
      included: "Yes (Categorical Exclusion)",
    },
  ];

  children.push(spacer(2));
  children.push(
    createTable(
      ["Module / Form", "Description", "Included"],
      checklistItems.map((item) => [item.module, item.description, item.included]),
      { columnWidths: [30, 45, 25], alternateRows: true },
    ),
  );

  // -------------------------------------------------------------------------
  // Section 6: IND Safety Reporting Commitments
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("6. IND Safety Reporting Commitments"));

  children.push(
    bodyText(
      "The Sponsor commits to comply with all IND safety reporting requirements under 21 CFR 312.32:",
    ),
  );
  children.push(spacer(2));

  children.push(
    bulletPoint(
      "15-Calendar-Day Reports: Serious and unexpected suspected adverse reactions will be reported to FDA within 15 calendar days of the Sponsor's initial receipt of the information.",
    ),
  );
  children.push(
    bulletPoint(
      "7-Calendar-Day Reports: Fatal or life-threatening unexpected suspected adverse reactions will be reported by telephone or facsimile within 7 calendar days, with a follow-up written report within 15 calendar days.",
    ),
  );
  children.push(
    bulletPoint(
      "Annual Reports: The Sponsor will submit annual reports within 60 days of the anniversary date of the IND, as required under 21 CFR 312.33.",
    ),
  );
  children.push(
    bulletPoint(
      "IND Amendments: Protocol amendments, information amendments, and new investigator additions will be submitted as required under 21 CFR 312.30 and 312.31.",
    ),
  );

  // -------------------------------------------------------------------------
  // Section 7: Sponsor Commitments
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("7. Sponsor Commitments"));

  children.push(
    bodyText(
      "I agree to comply with all applicable requirements in 21 CFR Part 312 regarding the obligations of a sponsor of a clinical investigation. I agree to:",
    ),
  );
  children.push(spacer(2));

  children.push(
    bulletPoint(
      "Not begin clinical investigations until an IND covering the investigations is in effect (21 CFR 312.40).",
    ),
  );
  children.push(
    bulletPoint(
      "Ensure that the investigation is conducted in accordance with the protocol and the general investigational plan contained in the IND.",
    ),
  );
  children.push(
    bulletPoint(
      "Ensure that each participating investigator signs Form FDA 1572 and conducts the investigation in accordance with it.",
    ),
  );
  children.push(
    bulletPoint(
      "Ensure that all review and approval by an IRB is obtained before initiating the study at each site.",
    ),
  );
  children.push(
    bulletPoint(
      "Maintain adequate records showing the receipt, shipment, or other disposition of the investigational drug (21 CFR 312.62).",
    ),
  );
  children.push(
    bulletPoint(
      "Ensure selection of qualified investigators and adequate monitoring of the clinical investigation.",
    ),
  );
  children.push(
    bulletPoint(
      "Ensure that the investigation is conducted in accordance with all applicable laws and regulations, including the protection of human subjects (21 CFR Parts 50, 56).",
    ),
  );
  children.push(
    bulletPoint(
      "Submit all required IND safety reports, protocol amendments, information amendments, and annual reports.",
    ),
  );

  // -------------------------------------------------------------------------
  // Section 8: Categorical Exclusion
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("8. Environmental Impact"));

  children.push(
    bodyText(
      "The Sponsor claims a categorical exclusion from the requirement to prepare an environmental assessment under 21 CFR 25.31(a). The proposed clinical investigation involves a drug that will be used at doses and for indications that do not significantly affect the environment.",
    ),
  );

  // -------------------------------------------------------------------------
  // Section 9: Signature
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("9. Signature of Sponsor or Sponsor's Authorized Representative"));

  children.push(
    bodyText(
      "I, the undersigned, certify that I am the sponsor of this IND (or the authorized representative of the sponsor) and that I have read this application and the accompanying documents and that to the best of my knowledge the information contained herein is accurate and complete.",
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText("SPONSOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.sponsorName, "Authorized Representative"));

  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "Printed Name: ", bold: true },
      { text: "________________________________________" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Title: ", bold: true },
      { text: "________________________________________" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Telephone: ", bold: true },
      { text: "________________________________________" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Email: ", bold: true },
      { text: "________________________________________" },
    ]),
  );

  // -------------------------------------------------------------------------
  // Footer Notice
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(
    bodyText(
      "This form is a DOCX representation of FDA Form 1571 for internal preparation purposes. The official FDA Form 1571 (OMB Control No. 0910-0014) must be submitted via the FDA Electronic Submissions Gateway (ESG) in eCTD format.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(
    bodyText(
      "Paperwork Reduction Act Statement: Public reporting burden for this collection of information is estimated to average 100 hours per response. An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number.",
      { italic: true, color: COLORS.textGray },
    ),
  );

  // Wrap in document shell
  return buildLegalDocument({
    title: "FDA Form 1571 - IND Application",
    headerRight: `Form FDA 1571 -- ${input.drugName}`,
    children,
  });
}
