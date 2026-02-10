// =============================================================================
// flood-determination.ts
// Generates a DOCX Standard Flood Hazard Determination Form (FEMA Form 086-0-32).
// ZERO AI — pure deterministic data mapping from DocumentInput.
// =============================================================================

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  signatureBlock,
  createTable,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildFloodDetermination(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // 1. Title
  // -------------------------------------------------------------------------
  children.push(
    documentTitle("Standard Flood Hazard Determination Form"),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "FEMA Form 086-0-32 \u2014 Standard Flood Hazard Determination Form as required by the National Flood Insurance Act of 1968 and the Flood Disaster Protection Act of 1973.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 2. Section A — Loan Information
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Section A \u2014 Loan Information"));

  children.push(
    createTable(
      ["Field", "Entry"],
      [
        ["Lender Name", input.lenderName],
        ["Lender ID / NFIP Lender ID", "[LENDER ID]"],
        ["Loan Number", "[TO BE ASSIGNED]"],
        ["Loan Amount", formatCurrency(terms.approvedAmount)],
        ["Loan Effective Date", formatDate(input.generatedAt)],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 3. Section B — Property Information
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Section B \u2014 Property Information"));

  children.push(
    createTable(
      ["Field", "Entry"],
      [
        ["Borrower Name", input.borrowerName],
        ["Property Address", input.propertyAddress ?? "[PROPERTY ADDRESS \u2014 TO BE COMPLETED]"],
        ["City", "[CITY]"],
        ["State", input.stateAbbr ?? "[STATE]"],
        ["ZIP Code", "[ZIP CODE]"],
        ["Legal Description of Property", "[PROPERTY LEGAL DESCRIPTION \u2014 TO BE COMPLETED]"],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 4. Section C — Flood Hazard Determination
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Section C \u2014 Flood Hazard Determination"));

  children.push(
    createTable(
      ["Determination Item", "Entry"],
      [
        ["FEMA Community Name", "[COMMUNITY NAME]"],
        ["County", "[COUNTY]"],
        ["State", input.stateAbbr ?? "[STATE]"],
        ["NFIP Community Number", "[COMMUNITY #]"],
        ["NFIP Map Panel Number", "[MAP PANEL]"],
        ["NFIP Map Panel Effective/Revised Date", "[DATE]"],
        ["LOMA / LOMR", "[ ] Yes  [ ] No"],
        ["Flood Zone Designation", "[ZONE DESIGNATION]"],
        ["Is Building/Mobile Home in Special Flood Hazard Area (SFHA)?", "[ ] Yes  [ ] No \u2014 [TO BE DETERMINED BY FLOOD VENDOR]"],
        ["Is the building/mobile home in a Coastal Barrier Resources Area (CBRA)?", "[ ] Yes  [ ] No"],
        ["Is there map coverage available for the community in which the property is located?", "[ ] Yes  [ ] No"],
      ],
      { columnWidths: [55, 45], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 5. Section D — Mandatory Flood Insurance Purchase Requirements
  // -------------------------------------------------------------------------
  children.push(
    sectionHeading("Section D \u2014 Mandatory Flood Insurance Purchase Requirements"),
  );

  children.push(
    bodyText(
      "If the property is in a Special Flood Hazard Area (SFHA), flood insurance is MANDATORY pursuant to the National Flood Insurance Act of 1968 and the Flood Disaster Protection Act of 1973, as amended by the Biggert-Waters Flood Insurance Reform Act of 2012.",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Federal law requires that, as a condition of obtaining a federally related mortgage loan on a property that is located in a Special Flood Hazard Area, the borrower must purchase and maintain flood insurance in an amount at least equal to the outstanding principal balance of the loan or the maximum limit of coverage available under the National Flood Insurance Program (NFIP), whichever is less.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "Failure to maintain flood insurance coverage may result in the lender purchasing coverage on the borrower's behalf at the borrower's expense (force-placement).",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 6. Notice to Borrower
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Notice to Borrower"));

  children.push(
    bodyTextRuns([
      { text: "IMPORTANT: ", bold: true },
      {
        text: "Federal law requires that flood insurance be purchased for properties located in Special Flood Hazard Areas. You are being notified that the property securing your loan is or may be located in a Special Flood Hazard Area. If so, you must obtain and maintain flood insurance for the term of the loan.",
      },
    ]),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "If you fail to purchase or renew flood insurance on the property, the lender may purchase insurance at your expense. The amount of this insurance may be limited to the outstanding balance of your loan. The cost of this lender-purchased insurance may be significantly higher than the cost of coverage you could obtain on your own.",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Item", "Details"],
      [
        ["Minimum Required Coverage", `Lesser of: (a) ${formatCurrency(terms.approvedAmount)} or (b) Maximum NFIP coverage available`],
        ["Required Insurance Type", "National Flood Insurance Program (NFIP) or equivalent private flood insurance"],
        ["Policy Effective Date", "Must be in effect prior to loan closing"],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 7. Determination Company
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Determination Information"));

  children.push(
    createTable(
      ["Field", "Entry"],
      [
        ["Flood Determination Vendor / Company", "[FLOOD DETERMINATION VENDOR]"],
        ["Determination Date", formatDate(input.generatedAt)],
        ["Determination Expiration", "Life of loan (unless map revision occurs)"],
        ["Determination Tracking Number", "[TRACKING NUMBER]"],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 8. Borrower Acknowledgment
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Borrower Acknowledgment"));

  children.push(
    bodyText(
      "The borrower acknowledges receipt of this Standard Flood Hazard Determination and, if applicable, the notice regarding flood insurance purchase requirements.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Borrower / Authorized Signatory"),
  );

  children.push(spacer(12));

  children.push(
    bodyText("PREPARER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("[FLOOD DETERMINATION VENDOR]", "Authorized Determinator"),
  );

  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 9. Regulatory Reference
  // -------------------------------------------------------------------------
  children.push(
    bodyText(
      "Per 42 U.S.C. \u00A7 4012a; Biggert-Waters Flood Insurance Reform Act of 2012; Homeowner Flood Insurance Affordability Act of 2014. This determination is made in accordance with the Standard Flood Hazard Determination Form requirements under 12 CFR Part 339 (OCC), 12 CFR Part 208 (Federal Reserve), 12 CFR Part 365 (FDIC), and 12 CFR Part 614 (Farm Credit).",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 10. Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "Standard Flood Hazard Determination Form",
    headerRight: `Flood Determination \u2014 ${input.borrowerName}`,
    children,
  });
}
