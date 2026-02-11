// sba-form-1919.ts
// Generates a DOCX SBA Form 1919 — Borrower Information Form.
// ZERO AI — pure deterministic data mapping from DocumentInput.
// Fields not available in DocumentInput use placeholder text for manual entry.

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
  collateralLabel,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Helpers

function entityTypeLabel(et: DocumentInput["entityType"]): string {
  switch (et) {
    case "llc":
      return "Limited Liability Company (LLC)";
    case "corporation":
      return "Corporation";
    case "partnership":
      return "Partnership";
    case "sole_proprietor":
      return "Sole Proprietorship";
    default:
      return "[ENTITY TYPE — TO BE COMPLETED]";
  }
}

// Builder

export function buildSbaForm1919(input: DocumentInput): Document {
  const { terms } = input;
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("SBA Form 1919"));
  children.push(spacer(2));
  children.push(
    bodyText("Borrower Information Form", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "U.S. Small Business Administration — This form collects information about the applicant and its principals for SBA loan programs.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Section A: Applicant/Borrower Information
  children.push(sectionHeading("Section A: Applicant/Borrower Information"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Legal Name of Applicant", value: input.borrowerName },
      { label: "DBA / Trade Name", value: "[DBA NAME — TO BE COMPLETED]" },
      {
        label: "Business Address",
        value: input.propertyAddress ?? "[BUSINESS ADDRESS — TO BE COMPLETED]",
      },
      { label: "City, State, ZIP", value: "[CITY, STATE, ZIP — TO BE COMPLETED]" },
      { label: "Business Phone", value: "[PHONE — TO BE COMPLETED]" },
      { label: "Email Address", value: "[EMAIL — TO BE COMPLETED]" },
      {
        label: "Tax Identification Number (TIN/EIN)",
        value: "[TIN/EIN — TO BE COMPLETED]",
      },
      { label: "Type of Business Entity", value: entityTypeLabel(input.entityType) },
      {
        label: "Date Business Established",
        value: "[DATE ESTABLISHED — TO BE COMPLETED]",
      },
      {
        label: "State of Organization/Incorporation",
        value:
          input.debtorStateOfOrganization ??
          input.stateAbbr ??
          "[STATE — TO BE COMPLETED]",
      },
      {
        label: "NAICS Code",
        value: "[NAICS CODE — TO BE COMPLETED]",
      },
      {
        label: "Number of Employees",
        value: "[NUMBER OF EMPLOYEES — TO BE COMPLETED]",
      },
    ]),
  );
  children.push(spacer(8));

  // Section B: About the Loan Request
  children.push(sectionHeading("Section B: About the Loan Request"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      {
        label: "Loan Amount Requested",
        value: formatCurrency(terms.approvedAmount),
      },
      {
        label: "Purpose of Loan",
        value: input.loanPurpose ?? "[LOAN PURPOSE — TO BE COMPLETED]",
      },
      { label: "Loan Program", value: input.programName },
      { label: "Loan Term", value: `${terms.termMonths} months` },
      {
        label: "Collateral Offered",
        value:
          input.collateralTypes.length > 0
            ? input.collateralTypes.map(collateralLabel).join("; ")
            : "[COLLATERAL DESCRIPTION — TO BE COMPLETED]",
      },
      {
        label: "Property Address (if real estate)",
        value: input.propertyAddress ?? "N/A",
      },
    ]),
  );
  children.push(spacer(8));

  // Section C: Indebtedness
  children.push(sectionHeading("Section C: Indebtedness"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "List all existing debts of the applicant business. Include all loans, lines of credit, notes payable, and other obligations.",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      [
        "Creditor Name",
        "Original Amount",
        "Current Balance",
        "Monthly Payment",
        "Maturity Date",
        "Collateral",
      ],
      [
        ["[CREDITOR 1]", "[AMOUNT]", "[BALANCE]", "[PAYMENT]", "[DATE]", "[COLLATERAL]"],
        ["[CREDITOR 2]", "[AMOUNT]", "[BALANCE]", "[PAYMENT]", "[DATE]", "[COLLATERAL]"],
        ["[CREDITOR 3]", "[AMOUNT]", "[BALANCE]", "[PAYMENT]", "[DATE]", "[COLLATERAL]"],
        ["[CREDITOR 4]", "[AMOUNT]", "[BALANCE]", "[PAYMENT]", "[DATE]", "[COLLATERAL]"],
        ["[CREDITOR 5]", "[AMOUNT]", "[BALANCE]", "[PAYMENT]", "[DATE]", "[COLLATERAL]"],
      ],
      { columnWidths: [20, 16, 16, 16, 16, 16], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Section D: Management Information
  children.push(sectionHeading("Section D: Management Information"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "List all owners, officers, directors, and key management personnel with 20% or greater ownership interest.",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      [
        "Full Legal Name",
        "Title/Position",
        "Ownership %",
        "SSN",
        "Date of Birth",
        "Home Address",
      ],
      [
        [
          input.borrowerName,
          "Principal / Owner",
          "[OWNERSHIP % — TO BE COMPLETED]",
          "[SSN — TO BE COMPLETED]",
          "[DOB — TO BE COMPLETED]",
          "[HOME ADDRESS — TO BE COMPLETED]",
        ],
        [
          "[NAME — TO BE COMPLETED]",
          "[TITLE]",
          "[%]",
          "[SSN — TO BE COMPLETED]",
          "[DOB — TO BE COMPLETED]",
          "[HOME ADDRESS — TO BE COMPLETED]",
        ],
        [
          "[NAME — TO BE COMPLETED]",
          "[TITLE]",
          "[%]",
          "[SSN — TO BE COMPLETED]",
          "[DOB — TO BE COMPLETED]",
          "[HOME ADDRESS — TO BE COMPLETED]",
        ],
      ],
      { columnWidths: [20, 15, 13, 17, 15, 20], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Section E: Certifications and Declarations
  children.push(sectionHeading("Section E: Certifications and Declarations"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "Each principal must answer all questions. If the answer to any question is \"Yes,\" attach a separate written explanation.",
      { italic: true },
    ),
  );
  children.push(spacer(4));

  const declarations = [
    {
      question:
        "Are you a U.S. Citizen?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "If not a U.S. Citizen, do you have lawful permanent resident alien status (Green Card)?",
      answer: "[YES/NO/N/A — TO BE COMPLETED]",
    },
    {
      question:
        "Have you or any officer of the applicant business ever been arrested for or charged with any criminal offense other than a minor motor vehicle violation?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Have you or any officer of the applicant business ever been convicted of any criminal offense other than a minor motor vehicle violation?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Are you presently subject to an indictment, criminal information, arraignment, or other means by which formal criminal charges are brought in any jurisdiction?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Are you currently delinquent or have you ever defaulted on any Federal debt, including but not limited to Federal student loans, SBA loans, or any other Federal obligation?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Are you presently suspended, debarred, proposed for debarment, declared ineligible, or voluntarily excluded from participation in any Federal program?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Is the applicant business or any of its principals an owner of, or have any ownership interest in, any other business?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
    {
      question:
        "Does any member of your household, or anyone who owns, manages, or directs your business, work for SBA, a Small Business Advisory Council, SCORE, or an SBA-funded resource partner?",
      answer: "[YES/NO — TO BE COMPLETED]",
    },
  ];

  children.push(
    createTable(
      ["#", "Question", "Response"],
      declarations.map((d, i) => [
        `${i + 1}.`,
        d.question,
        d.answer,
      ]),
      { columnWidths: [5, 75, 20], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Certification Statement
  children.push(sectionHeading("Certification"));
  children.push(spacer(4));
  children.push(
    bodyText(
      "By signing below, I/we certify that the information provided in this Borrower Information Form is true and accurate to the best of my/our knowledge. I/we understand that knowingly making a false statement to obtain a guaranteed loan from SBA is punishable under law, including 18 U.S.C. 1001 and 3571 by imprisonment of not more than five years and/or a fine of not more than $250,000; and under 15 U.S.C. 645 by imprisonment of not more than two years and/or a fine of not more than $5,000.",
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "I/we authorize SBA to make inquiries as necessary to verify the accuracy of the statements made and to determine my/our creditworthiness.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Signature Block
  children.push(
    bodyText("APPLICANT/BORROWER:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Authorized Signatory"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));
  children.push(
    bodyTextRuns([
      { text: "Date: ", bold: true },
      { text: formatDate(input.generatedAt) },
    ]),
  );

  children.push(spacer(12));

  children.push(
    bodyText("ADDITIONAL PRINCIPAL (if applicable):", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock("____________________________", "Principal / Owner"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Title: ____________________________"));
  children.push(bodyText("Date: ____________________________"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "SBA Form 1919 — Borrower Information Form",
    headerRight: `SBA Form 1919 — ${input.borrowerName}`,
    children,
  });
}
