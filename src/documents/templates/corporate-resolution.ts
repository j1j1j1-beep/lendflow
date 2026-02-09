// =============================================================================
// corporate-resolution.ts
// Generates a DOCX Corporate Borrowing Resolution from deterministic deal
// terms + AI prose. Required for all entity borrowers (LLC, Corp, Partnership).
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
  spacer,
  signatureBlock,
  keyTermsTable,
  formatCurrency,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, CorporateResolutionProse } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildCorporateResolution(
  input: DocumentInput,
  prose: CorporateResolutionProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const maturityFormatted = formatDate(input.maturityDate);
  const dateFormatted = formatDate(input.generatedAt);

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  // Adapt title to entity type
  const entityLabel = (() => {
    switch (input.entityType) {
      case "llc": return "Resolution of Members";
      case "corporation": return "Resolution of Board of Directors";
      case "partnership": return "Resolution of Partners";
      default: return "Corporate Borrowing Resolution";
    }
  })();
  children.push(documentTitle(entityLabel));

  // -----------------------------------------------------------------------
  // 2. Header — Entity name, date, meeting type
  // -----------------------------------------------------------------------
  children.push(
    bodyTextRuns([
      { text: "Entity: ", bold: true },
      { text: input.borrowerName, bold: true, underline: true },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Date: ", bold: true },
      { text: dateFormatted },
    ]),
  );
  const actionLabel = input.entityType === "llc"
    ? "Written Consent of Members in Lieu of Meeting"
    : input.entityType === "partnership"
    ? "Written Consent of Partners in Lieu of Meeting"
    : "Written Consent in Lieu of Meeting of the Board of Directors";
  children.push(
    bodyTextRuns([
      { text: "Action: ", bold: true },
      { text: actionLabel },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 3. Recitals (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Recitals"));
  children.push(bodyText(prose.resolutionRecitals));

  // -----------------------------------------------------------------------
  // 4. Key Terms Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Key Terms"));
  children.push(
    keyTermsTable([
      { label: "Entity / Borrower", value: input.borrowerName },
      { label: "Loan Amount", value: principalFormatted },
      { label: "Lender", value: input.lenderName },
      { label: "Loan Program", value: input.programName },
      { label: "Maturity Date", value: maturityFormatted },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 5. Authorization (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("1. Authorization to Borrow"));
  children.push(bodyText(prose.authorizationClause));

  // -----------------------------------------------------------------------
  // 6. Authorized Signers (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("2. Authorized Signers"));
  children.push(bodyText(prose.authorizedSigners));

  // -----------------------------------------------------------------------
  // 7. Ratification (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("3. Ratification of Prior Actions"));
  children.push(bodyText(prose.ratificationClause));

  // -----------------------------------------------------------------------
  // 8. Certificate of Secretary / Manager (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("4. Certificate of Secretary / Manager"));
  children.push(bodyText(prose.certificateOfSecretary));

  // -----------------------------------------------------------------------
  // Incumbency Certificate
  // -----------------------------------------------------------------------
  const certifierTitle = input.entityType === "llc" ? "Manager" : input.entityType === "partnership" ? "General Partner" : "Secretary";
  children.push(sectionHeading("5. Incumbency Certificate"));
  children.push(
    bodyText(
      `I, the undersigned ${certifierTitle} of ${input.borrowerName}, do hereby certify that the following persons hold the offices or positions set forth opposite their respective names and that the signatures set forth opposite their respective names are their true and genuine signatures:`,
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("Name: _________________________________    Title: _________________________________"));
  children.push(bodyText("Signature: _____________________________"));
  children.push(spacer(4));
  children.push(bodyText("Name: _________________________________    Title: _________________________________"));
  children.push(bodyText("Signature: _____________________________"));
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Organizational Documents
  // -----------------------------------------------------------------------
  const orgDocLabel = input.entityType === "llc"
    ? "Articles of Organization and Operating Agreement"
    : input.entityType === "partnership"
    ? "Certificate of Limited Partnership and Partnership Agreement"
    : "Articles of Incorporation and Bylaws";
  children.push(sectionHeading("6. Organizational Documents"));
  children.push(
    bodyText(
      `The ${certifierTitle} certifies that attached hereto as Exhibit A are true, correct, and complete copies of the ${orgDocLabel} of ${input.borrowerName}, as currently in effect, and that no amendments or modifications thereto have been made that have not been provided to the Lender.`,
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // Quorum Certification
  // -----------------------------------------------------------------------
  const quorumBody = input.entityType === "llc"
    ? "members holding a majority of the membership interests"
    : input.entityType === "partnership"
    ? "partners holding a majority interest in the partnership"
    : "directors constituting a quorum of the Board of Directors";
  children.push(sectionHeading("7. Quorum Certification"));
  children.push(
    bodyText(
      `The ${certifierTitle} certifies that this resolution was adopted by the affirmative vote or written consent of ${quorumBody} of ${input.borrowerName}, and that such vote or consent satisfies the requirements of the ${orgDocLabel} and applicable law for the authorization of the transactions contemplated hereby.`,
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 9. Governing Law (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("8. Governing Law"));
  children.push(bodyText(prose.governingLaw));

  // -----------------------------------------------------------------------
  // Standard Provisions
  // -----------------------------------------------------------------------
  children.push(sectionHeading("9. Additional Provisions"));
  children.push(
    bodyText(
      "Counterparts: This Resolution may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Signatures delivered by facsimile or electronic means (including PDF) shall be deemed original signatures for all purposes.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      "Continuing Authority: The authorizations granted by this Resolution shall remain in full force and effect until revoked or modified by a subsequent resolution duly adopted by the undersigned.",
    ),
  );
  children.push(spacer(4));

  // -----------------------------------------------------------------------
  // 10. Signature blocks
  // -----------------------------------------------------------------------
  children.push(sectionHeading("IN WITNESS WHEREOF"));
  children.push(
    bodyText(
      "The undersigned, being all of the authorized members/directors/partners of the Entity, have executed this Resolution as of the date first written above.",
    ),
  );

  // Authorized Officer / Member signature
  children.push(
    bodyText("AUTHORIZED OFFICER / MEMBER:", {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(
    ...signatureBlock(input.borrowerName, "Authorized Officer / Member"),
  );

  // Secretary / Manager attestation
  children.push(spacer(12));
  const attestTitle = input.entityType === "llc" ? "Manager" : input.entityType === "partnership" ? "General Partner" : "Secretary";
  children.push(
    bodyText(`ATTESTED BY ${attestTitle.toUpperCase()}:`, {
      bold: true,
      color: COLORS.primary,
    }),
  );
  children.push(...signatureBlock(input.borrowerName, attestTitle));

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: entityLabel,
    headerRight: `${entityLabel} — ${input.borrowerName}`,
    children,
  });
}
