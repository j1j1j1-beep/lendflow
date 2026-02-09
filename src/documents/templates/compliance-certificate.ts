// =============================================================================
// compliance-certificate.ts
// Generates a DOCX Compliance Certificate — periodic covenant compliance
// worksheet. ZERO AI — pure deterministic math and rules engine data.
// =============================================================================

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bulletPoint,
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
// Helpers
// ---------------------------------------------------------------------------

function formatThreshold(name: string, value: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("ltv") || lower.includes("percent") || lower.includes("%")) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (lower.includes("dscr") || lower.includes("ratio") || lower.includes("coverage")) {
    return `${value.toFixed(2)}x`;
  }
  if (value >= 1000) {
    return formatCurrency(value);
  }
  return value.toString();
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildComplianceCertificate(
  input: DocumentInput,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const dateFormatted = formatDate(input.generatedAt);

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("Compliance Certificate"));

  // -----------------------------------------------------------------------
  // 2. Header
  // -----------------------------------------------------------------------
  children.push(
    bodyText(
      `This Compliance Certificate is delivered pursuant to the Loan Agreement dated as of ${dateFormatted} between ${input.borrowerName} ("Borrower") and ${input.lenderName} ("Lender").`,
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 3. Key Terms Table
  // -----------------------------------------------------------------------
  children.push(
    keyTermsTable([
      { label: "Borrower", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      { label: "Loan Amount", value: principalFormatted },
      { label: "Loan Program", value: input.programName },
      { label: "Reporting Period", value: "For the period ending: ____________________" },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 4. Certification
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Certification"));
  children.push(
    bodyText(
      "The undersigned, being a duly authorized representative of Borrower, hereby certifies to Lender as follows:",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 5. Financial Covenant Compliance
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Financial Covenant Compliance"));

  if (terms.covenants.length > 0) {
    children.push(
      createTable(
        ["Covenant", "Required", "Actual", "Compliant?"],
        terms.covenants.map((c) => [
          `${c.name} (${c.frequency})`,
          c.threshold !== undefined ? formatThreshold(c.name, c.threshold) : "See Loan Agreement",
          "____________",
          "\u2610 Yes  \u2610 No",
        ]),
        { columnWidths: [35, 20, 20, 25], alternateRows: true },
      ),
    );
  } else {
    children.push(
      bodyText("No specific financial covenants apply to this Loan."),
    );
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 6. Covenant Descriptions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Covenant Descriptions"));

  if (terms.covenants.length > 0) {
    for (const covenant of terms.covenants) {
      children.push(
        bulletPoint(`${covenant.name}: ${covenant.description}`),
      );
    }
  } else {
    children.push(bodyText("No covenant descriptions applicable."));
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 7. Financial Reporting Status
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Financial Reporting Status"));

  const reportingRows: string[][] = [
    ["Annual Audited Financial Statements", "Annual", "\u2610 Delivered  \u2610 Pending"],
    ["Federal Tax Returns", "Annual", "\u2610 Delivered  \u2610 Pending"],
    ["Quarterly Financial Statements", "Quarterly", "\u2610 Delivered  \u2610 Pending"],
    ["Annual Budget", "Annual", "\u2610 Delivered  \u2610 Pending"],
    ["Insurance Certificates", "Annual", "\u2610 Delivered  \u2610 Pending"],
  ];

  // Conditional reporting items based on collateral types
  const hasRealEstate = input.collateralTypes.some(
    (ct) => ct.includes("real_estate") || ct.includes("property"),
  );
  if (hasRealEstate) {
    reportingRows.push(["Rent Roll", "Annual", "\u2610 Delivered  \u2610 Pending"]);
  }

  const hasAR = input.collateralTypes.some(
    (ct) => ct.includes("accounts_receivable"),
  );
  if (hasAR) {
    reportingRows.push(["Accounts Receivable Aging", "Monthly", "\u2610 Delivered  \u2610 Pending"]);
  }

  children.push(
    createTable(
      ["Reporting Item", "Required Frequency", "Status"],
      reportingRows,
      { columnWidths: [45, 25, 30], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 8. Additional Reporting Requirements
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Additional Reporting Requirements"));

  const postClosingConditions = terms.conditions.filter(
    (c) => c.category === "post_closing",
  );

  if (postClosingConditions.length > 0) {
    for (const condition of postClosingConditions) {
      children.push(bulletPoint(condition.description));
    }
  } else {
    children.push(
      bodyText("No additional post-closing reporting requirements."),
    );
  }
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 9. Certification Statement
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Certification Statement"));
  children.push(
    bodyText(
      "I hereby certify that: (a) the financial information provided herein is true, correct, and complete; (b) no Event of Default or event which with the passage of time or giving of notice would constitute an Event of Default has occurred and is continuing; and (c) all financial covenants set forth in the Loan Agreement have been complied with during the reporting period, except as set forth on a schedule attached hereto, if any.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 10. Jury Trial Waiver, Severability, Counterparts
  // -----------------------------------------------------------------------
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: BORROWER AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS CERTIFICATE OR ANY LOAN DOCUMENT.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Severability: If any provision of this Certificate is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Counterparts: This Certificate may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 11. Governing Law
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Governing Law"));
  children.push(
    bodyText(
      `This Certificate shall be governed by and construed in accordance with the laws of the State of ${input.stateAbbr ?? "[STATE]"}, as specified in the Loan Agreement, without regard to conflicts of law principles.`,
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 12. Signatures
  // -----------------------------------------------------------------------
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Authorized Signatory"),
  );

  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));

  children.push(spacer(12));

  children.push(
    bodyText("CFO / CONTROLLER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock("____________________________", "Chief Financial Officer / Controller"),
  );

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Compliance Certificate",
    headerRight: `Compliance Certificate — ${input.borrowerName}`,
    children,
  });
}
