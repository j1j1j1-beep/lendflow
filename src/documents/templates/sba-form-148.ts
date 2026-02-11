// sba-form-148.ts
// Generates a DOCX SBA Form 148 — Unconditional Guarantee.
// ZERO AI — pure deterministic data mapping from DocumentInput.
// This is the SBA-specific guarantee form, distinct from the general guaranty
// agreement template. References SBA SOP 50 10 and 13 CFR 120.

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
  keyTermsTable,
  spacer,
  formatCurrency,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// Builder

export function buildSbaForm148(input: DocumentInput): Document {
  const { terms } = input;
  const guarantor = input.guarantorName ?? input.borrowerName;
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("SBA Form 148"));
  children.push(spacer(2));
  children.push(
    bodyText("Unconditional Guarantee", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "U.S. Small Business Administration — Unconditional Guarantee executed pursuant to SBA Standard Operating Procedures (SOP 50 10) and 13 CFR 120.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Party Identification
  children.push(sectionHeading("Party Identification"));
  children.push(spacer(4));

  children.push(
    keyTermsTable([
      { label: "Guarantor", value: guarantor },
      { label: "Guarantor Address", value: "[GUARANTOR ADDRESS — TO BE COMPLETED]" },
      { label: "Guarantor SSN/TIN", value: "[SSN/TIN — TO BE COMPLETED]" },
      { label: "Lender", value: input.lenderName },
      { label: "Borrower", value: input.borrowerName },
      { label: "SBA Loan Number", value: "[TO BE ASSIGNED]" },
      {
        label: "Loan Amount",
        value: formatCurrency(terms.approvedAmount),
      },
      { label: "Date of Note", value: formatDate(input.generatedAt) },
      { label: "Loan Program", value: input.programName },
    ]),
  );
  children.push(spacer(8));

  // Guarantee
  children.push(sectionHeading("Unconditional Guarantee"));
  children.push(spacer(4));

  children.push(
    bodyText(
      `For valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the undersigned ("Guarantor") unconditionally guarantees payment to ${input.lenderName} ("Lender") of all amounts owing under the Note dated as of ${formatDate(input.generatedAt)} in the original principal amount of ${formatCurrency(terms.approvedAmount)} (the "Note") executed by ${input.borrowerName} ("Borrower") in favor of Lender, including principal, interest, late charges, and all other amounts due thereunder.`,
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "This Guarantee is unconditional and remains in effect until the Note is paid in full, including all principal, accrued interest, fees, costs, and expenses. This Guarantee shall not be affected by any modification, renewal, or extension of the Note or any related document.",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // Guarantee Provisions
  children.push(sectionHeading("Guarantee Provisions"));
  children.push(spacer(4));

  // 1. Waiver of Notice
  children.push(
    bodyTextRuns([
      { text: "1. Waiver of Notice. ", bold: true },
      {
        text: "Guarantor waives: (a) notice of acceptance of this Guarantee; (b) notice of any loans or advances made, or other action taken, in reliance hereon; (c) presentment, demand, protest, and notice of any kind relating to the Note; (d) any notice of non-payment, non-performance, or non-observance with respect to any of the obligations under the Note; and (e) any requirement that Lender exhaust any right, power, or remedy or proceed against Borrower or any other person under the Note or any other agreement before proceeding against Guarantor under this Guarantee.",
      },
    ]),
  );
  children.push(spacer(4));

  // 2. Waiver of Defenses
  children.push(
    bodyTextRuns([
      { text: "2. Waiver of Defenses. ", bold: true },
      {
        text: "Guarantor waives all defenses based on suretyship or impairment of collateral, including but not limited to: (a) any defense arising from the unenforceability or invalidity of the Note or any related obligation; (b) any defense based on the discharge of Borrower in bankruptcy or any similar proceeding; (c) any defense arising from any action or inaction of Lender, including the failure to perfect or maintain a security interest in any collateral; and (d) any defense based on any statute or rule of law that provides that the obligation of a surety must be neither larger nor more burdensome than that of the principal.",
      },
    ]),
  );
  children.push(spacer(4));

  // 3. Consent to Modifications
  children.push(
    bodyTextRuns([
      { text: "3. Consent to Modifications. ", bold: true },
      {
        text: "Guarantor consents to any modification, amendment, extension, renewal, acceleration, or other change to the terms of the Note or any related document, and to the release, substitution, or addition of any collateral securing the Note, without notice to Guarantor and without affecting Guarantor's obligations hereunder. No such modification, amendment, extension, renewal, or other change shall release or discharge this Guarantee.",
      },
    ]),
  );
  children.push(spacer(4));

  // 4. No Discharge in Bankruptcy
  children.push(
    bodyTextRuns([
      { text: "4. No Discharge in Bankruptcy. ", bold: true },
      {
        text: "Guarantor's obligations under this Guarantee shall not be discharged while any amounts remain owing under the Note. In the event of any proceeding under the United States Bankruptcy Code (11 U.S.C. Section 101 et seq.) or any similar state or federal law, Guarantor's liability under this Guarantee shall not be reduced or discharged by reason of any discharge granted to Borrower in such proceeding.",
      },
    ]),
  );
  children.push(spacer(4));

  // 5. Subordination of Subrogation
  children.push(
    bodyTextRuns([
      { text: "5. Subordination of Subrogation. ", bold: true },
      {
        text: "Until the Note is paid in full, Guarantor subordinates any right of subrogation, reimbursement, indemnification, or contribution that Guarantor may have against Borrower or any collateral to the prior payment in full of all amounts owing under the Note to Lender.",
      },
    ]),
  );
  children.push(spacer(4));

  // 6. Continuing Guarantee
  children.push(
    bodyTextRuns([
      { text: "6. Continuing Guarantee. ", bold: true },
      {
        text: "This is a continuing guarantee and shall remain in full force and effect until all amounts owing under the Note have been paid in full. This Guarantee shall be binding upon Guarantor and Guarantor's heirs, executors, administrators, legal representatives, successors, and assigns.",
      },
    ]),
  );
  children.push(spacer(4));

  // 7. Joint and Several
  children.push(
    bodyTextRuns([
      { text: "7. Joint and Several Liability. ", bold: true },
      {
        text: "If more than one person executes this Guarantee, the obligations hereunder shall be joint and several. Lender may proceed against any or all guarantors, and may release any guarantor from liability without releasing any other guarantor.",
      },
    ]),
  );
  children.push(spacer(4));

  // 8. Attorney Fees
  children.push(
    bodyTextRuns([
      { text: "8. Costs and Attorney Fees. ", bold: true },
      {
        text: "Guarantor agrees to pay all costs and expenses, including reasonable attorney fees, incurred by Lender in enforcing this Guarantee or collecting any amounts due hereunder.",
      },
    ]),
  );
  children.push(spacer(8));

  // SBA Reference
  children.push(sectionHeading("SBA Regulatory Reference"));
  children.push(spacer(4));

  children.push(
    bodyText(
      "This Guarantee is executed pursuant to the requirements of the U.S. Small Business Administration Standard Operating Procedures (SOP 50 10) and the regulations set forth in 13 CFR Part 120. The SBA guaranty of the Note does not alter or diminish Guarantor's obligations under this Guarantee.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "In the event of a conflict between this Guarantee and SBA regulations, the SBA regulations shall govern.",
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // Governing Law
  children.push(sectionHeading("Governing Law"));
  children.push(spacer(4));

  children.push(
    bodyText(
      `This Guarantee shall be governed by and construed in accordance with federal law applicable to SBA loan programs and, to the extent not preempted by federal law, the laws of the State of ${input.stateAbbr ?? "[STATE]"}, without regard to its conflicts of law principles.`,
    ),
  );
  children.push(spacer(8));

  // Signature Block
  children.push(
    bodyText("GUARANTOR:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(guarantor, "Guarantor"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(
    bodyTextRuns([
      { text: "Date: ", bold: true },
      { text: formatDate(input.generatedAt) },
    ]),
  );
  children.push(spacer(4));
  children.push(bodyText("Address: ____________________________"));
  children.push(bodyText("City, State, ZIP: ____________________________"));
  children.push(bodyText("SSN/TIN: ____________________________"));

  children.push(spacer(12));

  // Additional guarantor if applicable
  children.push(
    bodyText("ADDITIONAL GUARANTOR (if applicable):", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock("____________________________", "Guarantor"),
  );
  children.push(spacer(4));
  children.push(bodyText("Print Name: ____________________________"));
  children.push(bodyText("Date: ____________________________"));
  children.push(bodyText("Address: ____________________________"));
  children.push(bodyText("City, State, ZIP: ____________________________"));
  children.push(bodyText("SSN/TIN: ____________________________"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "SBA Form 148 — Unconditional Guarantee",
    headerRight: `SBA Form 148 — ${guarantor}`,
    children,
  });
}
