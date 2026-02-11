// assignment-of-leases.ts
// Builds an Assignment of Leases and Rents docx assigning the borrower's rights
// in rental income to the lender as additional collateral. Required for CRE and
// rental property deals. All financial numbers from DocumentInput; AI writes prose.

import type { DocumentInput, AssignmentOfLeasesProse } from "../types";
import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  signatureBlock,
  notaryBlock,
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  numberToWords,
  ensureProseArray,
  COLORS,
} from "../doc-helpers";

// Builder

export function buildAssignmentOfLeases(
  input: DocumentInput,
  prose: AssignmentOfLeasesProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const propertyAddress = input.propertyAddress ?? "See Exhibit A";

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Assignment of Leases and Rents"));
  children.push(spacer(4));

  // 2. Parties
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      `This Assignment of Leases and Rents (this "Assignment") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
  );
  children.push(spacer(2));
  children.push(
    partyBlock("Assignor", input.borrowerName, "the \"Assignor\" or \"Borrower\""),
  );
  children.push(
    partyBlock("Assignee", input.lenderName, "the \"Assignee\" or \"Lender\""),
  );
  children.push(spacer(4));

  // 3. Recitals
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Assignee", bold: true },
      {
        text: ` has agreed to make a loan (the "Loan") to Assignor in the original principal amount of ${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS), as evidenced by a Promissory Note of even date herewith; and`,
      },
    ]),
  );
  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      {
        text: `the Loan is secured by, among other things, a deed of trust, mortgage, or other security instrument encumbering certain real property located at `,
      },
      { text: propertyAddress, bold: true, underline: true },
      { text: " (the \"Property\"); and" },
    ]),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "WHEREAS, as additional security for the Loan, Assignee requires Assignor to execute and deliver this Assignment, assigning to Assignee all of Assignor's right, title, and interest in and to all leases, rents, issues, and profits arising from the Property; and",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "WHEREAS, the Property may be subject to existing leases or may hereafter become subject to future leases entered into by Assignor as landlord;",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the Loan and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Assignor agrees as follows:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  // 4. Key Terms Table
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      { label: "Property Address", value: propertyAddress },
      { label: "Loan Amount", value: `${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS)` },
      { label: "Assignor (Borrower)", value: input.borrowerName },
      { label: "Assignee (Lender)", value: input.lenderName },
      { label: "Effective Date", value: effectiveDate },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(4));

  // 5. Assignment Grant (AI prose)
  children.push(sectionHeading("1. Assignment of Leases and Rents"));
  children.push(bodyText(prose.assignmentGrant));
  children.push(spacer(4));

  // Assignment Type Clarification (deterministic)
  children.push(sectionHeading("Nature of Assignment"));
  children.push(
    bodyText(
      "This Assignment constitutes an absolute and present assignment of all Leases and Rents to Assignee, subject to a revocable license granted by Assignee to Assignor to collect and receive the Rents, which license shall automatically terminate upon the occurrence of an Event of Default under the Loan Agreement or any other Loan Document. Upon such termination, Assignee shall be entitled to collect and receive all Rents directly, without notice to Assignor and without the necessity of taking possession of the Property.",
    ),
  );
  children.push(spacer(4));

  // 6. Representations & Warranties (AI array)
  children.push(sectionHeading("2. Representations and Warranties"));
  children.push(
    bodyText(
      "Assignor represents and warrants to Assignee as of the date hereof and at all times while any portion of the Loan remains outstanding:",
    ),
  );
  for (const item of ensureProseArray(prose.representationsAndWarranties)) {
    children.push(bulletPoint(item));
  }
  children.push(spacer(4));

  // 7. Covenants (AI array)
  children.push(sectionHeading("3. Covenants"));
  children.push(
    bodyText(
      "Assignor covenants and agrees that, until all obligations under the Loan are fully satisfied:",
    ),
  );
  for (const item of ensureProseArray(prose.covenants)) {
    children.push(bulletPoint(item));
  }
  children.push(spacer(4));

  // Cash Management Provisions (deterministic)
  children.push(sectionHeading("Cash Management"));
  children.push(
    bodyText(
      "Assignee may require Assignor to establish and maintain a lockbox account or cash management account at a financial institution acceptable to Assignee for the collection and deposit of all Rents. Assignor shall direct all tenants to make rental payments directly to such lockbox account upon written notice from Assignee. Funds deposited in the lockbox account shall be applied in accordance with the terms of the Loan Agreement and any cash management agreement entered into by the parties.",
    ),
  );
  children.push(spacer(4));

  // 8. Lender Rights Upon Default (AI prose)
  children.push(sectionHeading("4. Lender Rights Upon Default"));
  children.push(bodyText(prose.lenderRights));
  children.push(spacer(4));

  // Receivership Provisions (deterministic)
  children.push(sectionHeading("Receivership"));
  children.push(
    bodyText(
      "Upon the occurrence of an Event of Default, Assignee shall be entitled, as a matter of right and without regard to the adequacy of its security, to the appointment of a receiver to take possession of the Property, collect Rents, and manage the Property. Assignor hereby consents to the appointment of such receiver and waives any right to contest or object to such appointment. The receiver shall have all powers permitted under applicable law, including the power to enter into, modify, and terminate leases.",
    ),
  );
  children.push(spacer(4));

  // 9. Tenant Notification (AI prose)
  children.push(sectionHeading("5. Tenant Notification"));
  children.push(bodyText(prose.tenantNotification));
  children.push(spacer(4));

  // Subordination, Non-Disturbance, and Attornment (deterministic)
  children.push(sectionHeading("Subordination, Non-Disturbance, and Attornment"));
  children.push(
    bodyText(
      "Assignee may require execution and delivery of a Subordination, Non-Disturbance, and Attornment Agreement (\"SNDA\") from any tenant of the Property, in form and substance acceptable to Assignee. Assignor shall cooperate in obtaining such agreements and shall include in all new leases entered into after the date hereof a provision requiring the tenant to execute an SNDA upon request by Assignee.",
    ),
  );
  children.push(spacer(4));

  // Recording (deterministic)
  children.push(sectionHeading("Recording"));
  children.push(
    bodyText(
      "This Assignment may be recorded in the land records of the county or jurisdiction in which the Property is located. Assignor hereby authorizes Assignee to record this Assignment and any amendments or supplements hereto at any time without the consent of Assignor.",
    ),
  );
  children.push(spacer(4));

  // 10. Governing Law (AI prose)
  children.push(sectionHeading("Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // Standard legal provisions
  children.push(sectionHeading("Additional Standard Provisions"));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: ASSIGNOR AND ASSIGNEE HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS ASSIGNMENT.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Severability: If any provision of this Assignment is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Counterparts: This Assignment may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(8));

  // 11. Signatures
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "The undersigned has executed this Assignment of Leases and Rents as of the date first written above.",
    ),
  );

  // Assignor signature
  children.push(
    bodyText("ASSIGNOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.borrowerName, "Assignor / Authorized Signatory"));

  // Assignee signature
  children.push(spacer(12));
  children.push(
    bodyText("ACCEPTED AND AGREED — ASSIGNEE:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Assignee / Authorized Signatory"));

  children.push(...notaryBlock(input.stateAbbr));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Assignment of Leases and Rents",
    headerRight: `Assignment of Leases — ${input.borrowerName}`,
    children,
  });
}
