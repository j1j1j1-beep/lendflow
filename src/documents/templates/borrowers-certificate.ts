// borrowers-certificate.ts
// Generates a DOCX Borrower's Certificate — closing-day certificate where
// borrower certifies that all representations and warranties remain true.

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
  signatureBlock,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, BorrowersCertificateProse } from "../types";

// Builder

export function buildBorrowersCertificate(
  input: DocumentInput,
  prose: BorrowersCertificateProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const dateFormatted = formatDate(input.generatedAt);

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Borrower's Certificate"));

  // 2. Header
  children.push(
    bodyTextRuns([
      { text: "This Borrower's Certificate is delivered in connection with the Loan Agreement dated as of " },
      { text: dateFormatted, bold: true },
      { text: " between " },
      { text: input.borrowerName, bold: true },
      { text: " (\"Borrower\") and " },
      { text: input.lenderName, bold: true },
      { text: " (\"Lender\")." },
    ]),
  );
  children.push(spacer(8));

  // 3. Key Terms Table
  children.push(
    keyTermsTable([
      { label: "Borrower", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      { label: "Loan Amount", value: principalFormatted },
      { label: "Effective Date", value: dateFormatted },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(8));

  // 4. Certifications (deterministic)
  children.push(sectionHeading("Certifications"));
  children.push(
    bodyText(
      "The undersigned, being a duly authorized representative of Borrower, hereby certifies to Lender as of the date hereof:",
    ),
  );
  children.push(spacer(4));

  children.push(
    bulletPoint(
      "All representations and warranties of Borrower contained in the Loan Agreement and related Loan Documents are true and correct in all material respects as of the date hereof, with the same effect as if made on the date hereof.",
    ),
  );
  children.push(
    bulletPoint(
      "No Event of Default, and no event which with the giving of notice or the passage of time or both would constitute an Event of Default, has occurred and is continuing under the Loan Agreement or any other Loan Document.",
    ),
  );
  children.push(
    bulletPoint(
      "All conditions precedent to the making of the Loan set forth in the Loan Agreement have been satisfied or waived by Lender.",
    ),
  );
  children.push(
    bulletPoint(
      "All financial statements, tax returns, and other financial information previously delivered to Lender are true, complete, and correct in all material respects and fairly present the financial condition of Borrower as of the dates indicated.",
    ),
  );
  children.push(
    bulletPoint(
      "Since the date of the most recent financial statements delivered to Lender, there has been no Material Adverse Change (as defined in the Loan Agreement) in the business, operations, property, or financial condition of Borrower.",
    ),
  );
  const isIndividual = !input.entityType || input.entityType === "sole_proprietor";
  children.push(
    bulletPoint(
      isIndividual
        ? "Borrower has full legal capacity to execute, deliver, and perform the Borrower's obligations under the Loan Agreement and all related Loan Documents."
        : "Borrower is duly organized, validly existing, and in good standing under the laws of its state of organization, and is qualified to do business in all jurisdictions where the nature of its business requires such qualification.",
    ),
  );
  children.push(
    bulletPoint(
      "The execution, delivery, and performance of the Loan Agreement and all related Loan Documents have been duly authorized by all necessary action on the part of Borrower.",
    ),
  );
  children.push(
    bulletPoint(
      "The proceeds of the Loan will be used solely for the purposes set forth in the Loan Agreement.",
    ),
  );
  children.push(
    bulletPoint(
      "All insurance required under the Loan Agreement has been obtained and is in full force and effect.",
    ),
  );
  children.push(
    bulletPoint(
      "All governmental approvals, permits, and licenses required for Borrower's business and for the transactions contemplated by the Loan Documents have been obtained and are in full force and effect.",
    ),
  );
  children.push(spacer(8));

  // 5. Additional Certifications (AI prose)
  children.push(sectionHeading("Additional Certifications"));
  children.push(bodyText(prose.additionalCertifications));
  children.push(spacer(8));

  // 6. Governing Law (AI prose)
  children.push(sectionHeading("Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // 7. Jury Trial Waiver, Severability, Counterparts
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: BORROWER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVES ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS CERTIFICATE OR ANY LOAN DOCUMENT.",
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

  // 8. Signature
  children.push(
    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Authorized Signatory"),
  );

  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Borrower's Certificate",
    headerRight: `Borrower's Certificate — ${input.borrowerName}`,
    children,
  });
}
