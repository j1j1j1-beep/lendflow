// =============================================================================
// snda.ts
// Builds a Subordination, Non-Disturbance and Attornment Agreement (SNDA).
// Signed by lender, tenant, and landlord/borrower for multi-tenant CRE deals.
// Protects tenant occupancy rights while preserving lender's mortgage priority.
// All financial numbers from DocumentInput; AI writes prose.
// =============================================================================

import type { DocumentInput, SndaProse } from "../types";
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
  COLORS,
} from "../doc-helpers";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSnda(
  input: DocumentInput,
  prose: SndaProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const propertyAddress = input.propertyAddress ?? "See Exhibit A";

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("Subordination, Non-Disturbance and Attornment Agreement"));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 2. Parties
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Parties"));
  children.push(
    bodyText(
      `This Subordination, Non-Disturbance and Attornment Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and among the following parties:`,
    ),
  );
  children.push(spacer(2));
  children.push(
    partyBlock("Lender", input.lenderName, "the \"Lender\""),
  );
  children.push(
    partyBlock("Tenant", "[Tenant Name \u2014 To Be Completed]", "the \"Tenant\""),
  );
  children.push(
    partyBlock("Landlord", input.borrowerName, "the \"Landlord\" or \"Borrower\""),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 3. Recitals
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyTextRuns([
      { text: "WHEREAS, " },
      { text: "Lender", bold: true },
      {
        text: ` has made a loan (the "Loan") to Landlord in the original principal amount of ${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS), as evidenced by a Promissory Note of even date herewith; and`,
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
      "WHEREAS, Tenant occupies certain premises within the Property pursuant to a lease agreement between Tenant and Landlord (the \"Lease\"); and",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "WHEREAS, Lender requires, as a condition of making the Loan, that Tenant and Landlord enter into this Agreement to establish the relative priorities and rights among Lender, Tenant, and Landlord;",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:",
      { bold: true },
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 4. Key Terms Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      { label: "Property Address", value: propertyAddress },
      { label: "Loan Amount", value: `${loanAmount} (${loanAmountWords.toUpperCase()} DOLLARS)` },
      { label: "Landlord (Borrower)", value: input.borrowerName },
      { label: "Lender", value: input.lenderName },
      { label: "Effective Date", value: effectiveDate },
      { label: "Maturity Date", value: formatDate(input.maturityDate) },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 5. Subordination of Lease (AI prose + deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("1. Subordination of Lease"));
  children.push(bodyText(prose.subordinationTerms));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Notwithstanding the foregoing subordination, so long as Tenant is not in default under the Lease beyond any applicable cure period, Tenant's possession of the Premises and Tenant's rights and privileges under the Lease shall not be diminished, disturbed, or interfered with by Lender.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 6. Non-Disturbance (AI prose + deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("2. Non-Disturbance"));
  children.push(bodyText(prose.nonDisturbanceTerms));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Lender agrees that if Lender or any successor-in-interest to Lender shall acquire title to the Property by foreclosure, deed in lieu of foreclosure, or otherwise, Lender or such successor shall: (a) recognize Tenant as the tenant under the Lease; (b) not disturb Tenant's possession of the Premises; (c) be bound by all terms of the Lease, subject to the limitations set forth in the Lender Protections section hereof; and (d) accept Tenant as tenant, subject to the terms and conditions of the Lease.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 7. Attornment (AI prose + deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("3. Attornment"));
  children.push(bodyText(prose.attornmentTerms));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Tenant agrees that upon any acquisition of title to the Property by Lender or any successor: (a) Tenant shall attorn to and recognize Lender or such successor as Tenant's landlord under the Lease; (b) the Lease shall continue in full force and effect; (c) Tenant shall pay all rent and other sums due under the Lease to the new landlord; and (d) Tenant shall perform all obligations under the Lease for the benefit of the new landlord.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 8. Lender Protections (AI prose + deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("4. Lender Protections"));
  children.push(bodyText(prose.lenderProtections));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Notwithstanding anything in the Lease to the contrary, Lender or any successor shall not be: (a) liable for any act or omission of any prior landlord; (b) subject to any offsets, defenses, or counterclaims that Tenant may have against any prior landlord; (c) bound by any rent prepayment in excess of one month; (d) bound by any lease modification made without Lender's written consent; or (e) liable for the return of any security deposit unless actually received by Lender.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 9. Tenant Protections (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("5. Tenant Protections"));
  children.push(
    bulletPoint(
      "Tenant's right of quiet enjoyment shall not be disturbed so long as Tenant is not in default",
    ),
  );
  children.push(
    bulletPoint(
      "All insurance proceeds payable with respect to Tenant's improvements shall be made available for restoration",
    ),
  );
  children.push(
    bulletPoint(
      "In the event of casualty or condemnation, Tenant's rights under the Lease shall be preserved",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 10. Notice Requirements (deterministic)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("6. Notice Requirements"));
  children.push(
    bodyText(
      "All notices shall be in writing and delivered to the addresses set forth herein. Notice shall be deemed given when personally delivered, sent by nationally recognized overnight courier, or sent by certified mail, return receipt requested.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Tenant shall give Lender written notice of any default by Landlord under the Lease. Lender shall have thirty (30) days following receipt of such notice to cure such default, provided that such cure period shall be extended for a reasonable additional period if the nature of such default is such that it cannot reasonably be cured within thirty (30) days, so long as Lender has commenced cure within such thirty-day period and is diligently prosecuting the same to completion.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 11. Governing Law (AI prose)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("7. Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // Standard legal provisions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("8. Additional Standard Provisions"));
  children.push(
    bodyText(
      "JURY TRIAL WAIVER: LENDER, TENANT, AND LANDLORD HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Severability: If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Counterparts: This Agreement may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 12. Signatures
  // -----------------------------------------------------------------------
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "The undersigned have executed this Subordination, Non-Disturbance and Attornment Agreement as of the date first written above.",
    ),
  );

  // Lender signature
  children.push(
    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.lenderName, "Lender / Authorized Signatory"));
  children.push(...notaryBlock(input.stateAbbr));

  // Tenant signature
  children.push(spacer(12));
  children.push(
    bodyText("TENANT:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock("[Tenant Name]", "Tenant / Authorized Signatory"));
  children.push(...notaryBlock(input.stateAbbr));

  // Landlord signature
  children.push(spacer(12));
  children.push(
    bodyText("LANDLORD:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock(input.borrowerName, "Landlord / Authorized Signatory"));
  children.push(...notaryBlock(input.stateAbbr));

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "Subordination, Non-Disturbance and Attornment Agreement",
    headerRight: `SNDA \u2014 ${input.borrowerName}`,
    children,
  });
}
