// nda.ts
// Generates a DOCX Non-Disclosure Agreement for an M&A transaction.
// Includes: confidential info definition, permitted use/disclosures, term,
// non-solicitation, standstill, residual knowledge, remedies.

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
  partyBlock,
  keyTermsTable,
  formatDate,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, NDAProse } from "../types";

export function buildNDA(
  project: MAProjectFull,
  prose: NDAProse,
): Document {
  const dateFormatted = formatDate(new Date());
  const governingLaw = project.governingLaw ?? "Delaware";

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Non-Disclosure Agreement"));
  children.push(spacer(4));

  // 2. Date and Parties
  children.push(
    bodyText(
      `This Non-Disclosure Agreement (this "Agreement") is entered into as of ${dateFormatted} (the "Effective Date"), by and between:`,
    ),
  );
  children.push(spacer(4));
  children.push(partyBlock(
    "Disclosing Party",
    project.sellerName,
    project.sellerEntity ?? "the owner(s) of the Target Company",
  ));
  children.push(spacer(2));
  children.push(partyBlock(
    "Receiving Party",
    project.buyerName,
    project.buyerEntity ?? "the prospective acquirer",
  ));
  children.push(spacer(4));

  // 3. Recitals
  children.push(sectionHeading("Recitals"));
  children.push(
    bodyText(
      `WHEREAS, the Disclosing Party owns or controls ${project.targetCompany} (the "Target Company"${project.targetIndustry ? `, operating in the ${project.targetIndustry} industry` : ""}); and`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `WHEREAS, the Receiving Party desires to evaluate a potential acquisition of or investment in the Target Company (the "Potential Transaction"); and`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `WHEREAS, in connection with such evaluation, the Disclosing Party may disclose certain confidential and proprietary information to the Receiving Party; and`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `WHEREAS, the parties desire to set forth their agreement regarding the treatment of such information;`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:`,
    ),
  );
  children.push(spacer(8));

  // 4. Key Terms Table
  children.push(sectionHeading("Key Terms"));
  const termRows: Array<{ label: string; value: string }> = [
    { label: "Disclosing Party", value: project.sellerName },
    { label: "Receiving Party", value: project.buyerName },
    { label: "Target Company", value: project.targetCompany },
    { label: "Governing Law", value: `State of ${governingLaw}` },
  ];
  if (project.targetIndustry) {
    termRows.push({ label: "Industry", value: project.targetIndustry });
  }
  children.push(keyTermsTable(termRows));
  children.push(spacer(8));

  // 5. Confidential Information Definition (AI prose)
  children.push(sectionHeading("Section 1. Definition of Confidential Information"));
  children.push(bodyText(prose.confidentialInfoDefinition));
  children.push(spacer(4));

  // 6. Permitted Use (AI prose)
  children.push(sectionHeading("Section 2. Permitted Use"));
  children.push(bodyText(prose.permittedUse));
  children.push(spacer(4));

  // 7. Permitted Disclosures (AI prose)
  children.push(sectionHeading("Section 3. Permitted Disclosures"));
  children.push(bodyText(prose.permittedDisclosures));
  children.push(spacer(4));

  // 8. Standard of Care (deterministic)
  children.push(sectionHeading("Section 4. Standard of Care"));
  children.push(
    bodyText(
      `The Receiving Party shall protect the Confidential Information using the same degree of care it uses to protect its own confidential information of a similar nature, but in no event less than a reasonable degree of care. The Receiving Party shall be responsible for any breach of this Agreement by its Representatives.`,
    ),
  );
  children.push(spacer(4));

  // 9. Term and Duration (AI prose)
  children.push(sectionHeading("Section 5. Term and Duration"));
  children.push(bodyText(prose.termAndDuration));
  children.push(spacer(4));

  // 10. Non-Solicitation (AI prose)
  children.push(sectionHeading("Section 6. Non-Solicitation of Employees"));
  children.push(bodyText(prose.nonSolicitation));
  children.push(spacer(4));

  // 11. Standstill (AI prose)
  children.push(sectionHeading("Section 7. Standstill"));
  children.push(bodyText(prose.standstillProvision));
  children.push(spacer(4));

  // 12. Residual Knowledge (AI prose)
  children.push(sectionHeading("Section 8. Residual Knowledge"));
  children.push(bodyText(prose.residualKnowledge));
  children.push(spacer(4));

  // 13. Return of Materials (AI prose)
  children.push(sectionHeading("Section 9. Return and Destruction of Materials"));
  children.push(bodyText(prose.returnOfMaterials));
  children.push(spacer(4));

  // 14. No Obligation (deterministic)
  children.push(sectionHeading("Section 10. No Obligation to Proceed"));
  children.push(
    bodyText(
      `Nothing in this Agreement shall obligate either party to proceed with the Potential Transaction or any other transaction, or to negotiate or enter into any agreement relating thereto. Either party may terminate discussions regarding the Potential Transaction at any time, for any reason or no reason, without liability to the other party.`,
    ),
  );
  children.push(spacer(4));

  // 15. No Representation or Warranty (deterministic)
  children.push(sectionHeading("Section 11. No Representation or Warranty"));
  children.push(
    bodyText(
      `Neither the Disclosing Party nor any of its Representatives makes any representation or warranty, express or implied, as to the accuracy or completeness of the Confidential Information. The Receiving Party agrees that neither the Disclosing Party nor any of its Representatives shall have any liability to the Receiving Party or any of its Representatives relating to or resulting from the use of the Confidential Information or any errors therein or omissions therefrom.`,
    ),
  );
  children.push(spacer(4));

  // 16. Remedies (AI prose)
  children.push(sectionHeading("Section 12. Remedies"));
  children.push(bodyText(prose.remedies));
  children.push(spacer(4));

  // 17. No Public Disclosure (deterministic)
  children.push(sectionHeading("Section 13. Public Disclosure"));
  children.push(
    bodyText(
      `Neither party shall, without the prior written consent of the other party, disclose to any person (other than as permitted by Section 3) the fact that Confidential Information has been made available, that discussions or negotiations are taking place concerning the Potential Transaction, or any of the terms, conditions, or other facts with respect to any such Potential Transaction, including the status thereof.`,
    ),
  );
  children.push(spacer(4));

  // 18. Governing Law (AI prose)
  children.push(sectionHeading("Section 14. Governing Law and Dispute Resolution"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(4));

  // 19. Miscellaneous (deterministic)
  children.push(sectionHeading("Section 15. Miscellaneous"));
  children.push(
    bodyText(
      `(a) Entire Agreement. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, commitments, offers, and agreements, whether written or oral, relating to such subject matter.`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `(b) Amendments. This Agreement may not be amended, supplemented, or modified except by a written instrument signed by both parties.`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `(c) Severability. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be reformed to the minimum extent necessary to make it valid and enforceable.`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `(d) Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Signatures delivered by electronic means (including PDF, DocuSign, or similar platforms) shall be deemed originals.`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `(e) Assignment. Neither party may assign this Agreement or any of its rights or obligations hereunder without the prior written consent of the other party, except that the Receiving Party may assign this Agreement to an affiliate without consent, provided such affiliate agrees to be bound by the terms hereof.`,
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText(
      `(f) JURY TRIAL WAIVER. EACH PARTY HEREBY IRREVOCABLY AND UNCONDITIONALLY WAIVES, TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ANY RIGHT IT MAY HAVE TO A TRIAL BY JURY IN ANY LEGAL PROCEEDING DIRECTLY OR INDIRECTLY ARISING OUT OF OR RELATING TO THIS AGREEMENT.`,
    ),
  );
  children.push(spacer(8));

  // 20. Signature blocks
  children.push(sectionHeading("Execution"));
  children.push(
    bodyText(
      `IN WITNESS WHEREOF, the parties have executed this Non-Disclosure Agreement as of the Effective Date.`,
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("DISCLOSING PARTY:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.sellerName, "Authorized Signatory"));
  children.push(spacer(16));

  children.push(bodyText("RECEIVING PARTY:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.buyerName, "Authorized Signatory"));

  return buildLegalDocument({
    title: "Non-Disclosure Agreement",
    headerRight: `NDA — ${project.targetCompany}`,
    children,
  });
}
