// estoppel-certificate.ts
// Builds a Tenant Estoppel Certificate for CRE loan transactions.
// Signed by the tenant to certify the status of their lease and confirm that
// the landlord/borrower is not in default. Lender relies on this certificate
// when underwriting loans secured by multi-tenant commercial properties.
// All financial numbers from DocumentInput; AI writes prose.

import type { DocumentInput, EstoppelProse } from "../types";
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
  formatDate,
  COLORS,
} from "../doc-helpers";

// Builder

export function buildEstoppelCertificate(
  input: DocumentInput,
  prose: EstoppelProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const propertyAddress = input.propertyAddress ?? "See Exhibit A";

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Tenant Estoppel Certificate"));
  children.push(spacer(4));

  // 2. Addressee
  children.push(
    bodyTextRuns([
      { text: "TO: ", bold: true },
      { text: input.lenderName },
      { text: " (the \"Lender\")" },
    ]),
  );
  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "RE: ", bold: true },
      { text: `Property at ${propertyAddress}` },
    ]),
  );
  children.push(spacer(4));

  // 3. Date
  children.push(
    bodyTextRuns([
      { text: "Date: ", bold: true },
      { text: effectiveDate },
    ]),
  );
  children.push(spacer(4));

  // 4. Opening
  children.push(
    bodyText(
      "The undersigned tenant (the \"Tenant\") of the above-referenced property hereby certifies to the Lender as follows, understanding that the Lender is relying on these certifications in connection with a loan secured by the Property:",
    ),
  );
  children.push(spacer(4));

  // 5. Tenant Information Table
  children.push(sectionHeading("Tenant Information"));
  children.push(
    keyTermsTable([
      { label: "Tenant Name", value: "____________________________" },
      { label: "Suite/Unit", value: "____________________________" },
      { label: "Lease Date", value: "____________________________" },
      { label: "Lease Commencement", value: "____________________________" },
      { label: "Lease Expiration", value: "____________________________" },
      { label: "Monthly Base Rent", value: "$___________________" },
      { label: "Security Deposit", value: "$___________________" },
    ]),
  );
  children.push(spacer(4));

  // 6. Certifications (deterministic numbered items)
  children.push(sectionHeading("Certifications"));
  children.push(
    bodyText(
      "The undersigned Tenant hereby certifies to the Lender as follows:",
    ),
  );
  children.push(spacer(2));
  children.push(
    bulletPoint(
      "1. The Lease is in full force and effect and has not been modified, supplemented, or amended in any way, except as follows: ________________________________________________",
    ),
  );
  children.push(
    bulletPoint(
      "2. Neither Tenant nor Landlord is in default under the Lease, and no event has occurred which, with the passage of time or giving of notice or both, would constitute a default.",
    ),
  );
  children.push(
    bulletPoint(
      "3. Tenant has no claim, defense, or offset against Landlord for any amounts due under the Lease.",
    ),
  );
  children.push(
    bulletPoint(
      "4. Rent has been paid through ______________ [insert date] and no rent has been paid more than one month in advance.",
    ),
  );
  children.push(
    bulletPoint(
      "5. The security deposit held by Landlord is in the amount set forth above.",
    ),
  );
  children.push(
    bulletPoint(
      "6. Tenant has no option to purchase the Property or any right of first refusal with respect thereto.",
    ),
  );
  children.push(
    bulletPoint(
      "7. Tenant has not assigned the Lease or sublet any portion of the premises, except as follows: ________________________________________________",
    ),
  );
  children.push(
    bulletPoint(
      "8. All improvements required to be made by Landlord under the Lease have been completed to Tenant's satisfaction.",
    ),
  );
  children.push(
    bulletPoint(
      "9. Tenant has not received any notice of any sale, transfer, or assignment of the Lease or the rents thereunder.",
    ),
  );
  children.push(spacer(4));

  // 7. Additional Certifications (AI prose)
  children.push(sectionHeading("Additional Certifications"));
  children.push(bodyText(prose.additionalCertifications));
  children.push(spacer(4));

  // 8. Reliance
  children.push(sectionHeading("Reliance"));
  children.push(
    bodyText(
      "This Certificate is given with the understanding that Lender will rely hereon in connection with the making of a loan to Landlord. This Certificate may be relied upon by Lender and its successors and assigns, including any purchaser, participant, or servicer of the Loan, without the prior consent of the undersigned.",
    ),
  );
  children.push(spacer(4));

  // 9. Binding Effect
  children.push(
    bodyText(
      "This Certificate shall be binding upon the undersigned and its successors and assigns.",
    ),
  );
  children.push(spacer(8));

  // 10. Governing Law and Counterparts
  children.push(sectionHeading("Governing Law"));
  children.push(
    bodyText(
      "This Certificate shall be governed by and construed in accordance with the laws of the state in which the Property is located, without regard to conflicts of law principles.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "This Certificate may be executed in counterparts, each of which shall be deemed an original. Signatures delivered by electronic means shall be deemed originals.",
    ),
  );
  children.push(spacer(8));

  // 11. Signature (Tenant only)
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "The undersigned has executed this Tenant Estoppel Certificate as of the date first written above.",
    ),
  );

  children.push(
    bodyText("TENANT:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock("[Tenant Name]", "Tenant / Authorized Signatory"));

  children.push(spacer(4));
  children.push(
    bodyText("Print Name: ____________________________"),
  );
  children.push(
    bodyText("Title: ____________________________"),
  );

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Tenant Estoppel Certificate",
    headerRight: `Estoppel Certificate \u2014 ${input.borrowerName}`,
    children,
  });
}
