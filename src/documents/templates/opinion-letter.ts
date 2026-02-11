// opinion-letter.ts
// Generates a DOCX Legal Opinion Letter — formal opinion from borrower's
// counsel confirming due organization, authority, enforceability, and
// compliance with applicable law.

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
  spacer,
  formatCurrency,
  formatDate,
  numberToWords,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, OpinionLetterProse } from "../types";

// Builder

export function buildOpinionLetter(
  input: DocumentInput,
  prose: OpinionLetterProse,
): Document {
  const { terms } = input;
  const principalFormatted = formatCurrency(terms.approvedAmount);
  const principalWords = numberToWords(terms.approvedAmount);
  const dateFormatted = formatDate(input.generatedAt);
  const stateDisplay = input.stateAbbr ?? "___";

  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(documentTitle("Legal Opinion Letter"));

  // 2. Letterhead placeholder
  children.push(bodyText("[Law Firm Name]", { italic: true }));
  children.push(bodyText("[Address]", { italic: true }));
  children.push(bodyText("[City, State ZIP]", { italic: true }));
  children.push(bodyText("[Phone/Fax]", { italic: true }));
  children.push(spacer(8));

  // 3. Date
  children.push(bodyText(dateFormatted));
  children.push(spacer(4));

  // 4. Addressee
  children.push(bodyText(input.lenderName, { bold: true }));
  children.push(bodyText("[Address]", { italic: true }));
  children.push(bodyText("[City, State ZIP]", { italic: true }));
  children.push(spacer(4));

  // 5. Reference line
  children.push(
    bodyTextRuns([
      { text: "Re: ", bold: true },
      { text: `Loan in the amount of ${principalFormatted} to ${input.borrowerName}` },
    ]),
  );
  children.push(spacer(4));

  // 6. Opening
  children.push(bodyText("Ladies and Gentlemen:"));
  children.push(spacer(4));

  // 7. Introductory paragraph (deterministic)
  children.push(
    bodyText(
      // TODO: The "Section [___]" placeholder below should ideally be populated
      // from deal data (e.g., input.opinionSectionRef) once that field is
      // available in the deal/terms model.
      `We have acted as counsel to ${input.borrowerName} (the "Borrower") in connection with the loan (the "Loan") in the original principal amount of ${principalFormatted} (${principalWords} dollars) from ${input.lenderName} (the "Lender") to the Borrower. This opinion is delivered to you pursuant to Section [___] of the Loan Agreement dated ${dateFormatted} between the Borrower and the Lender (the "Loan Agreement").`,
    ),
  );
  children.push(spacer(4));

  // 7a. ABA Legal Opinion Accord & TriBar Opinion Committee reference
  children.push(
    bodyText(
      "This opinion is rendered in accordance with the guidelines set forth in the American Bar Association Legal Opinion Accord (the \"Accord\") and the recommendations of the TriBar Opinion Committee, except as otherwise noted herein. Certain terms used herein have the meanings ascribed to them in the Accord. To the extent any opinion expressed herein differs from the standard assumptions and qualifications of the Accord, such differences are expressly noted in the Qualifications and Limitations section below.",
    ),
  );
  children.push(spacer(8));

  // 8. Documents Reviewed
  children.push(sectionHeading("Documents Reviewed"));
  children.push(
    bodyText(
      "In connection with this opinion, we have reviewed the following documents:",
    ),
  );
  children.push(spacer(4));

  children.push(bulletPoint(`The Loan Agreement dated ${dateFormatted}`));
  children.push(
    bulletPoint(
      `The Promissory Note dated ${dateFormatted} in the principal amount of ${principalFormatted}`,
    ),
  );
  children.push(bulletPoint(`The Security Agreement dated ${dateFormatted}`));

  if (terms.personalGuaranty) {
    children.push(bulletPoint(`The Guaranty Agreement dated ${dateFormatted}`));
  }

  // Organizational document label based on entity type
  const isIndividual = !input.entityType || input.entityType === "sole_proprietor";
  if (!isIndividual) {
    const orgDocLabel = (() => {
      switch (input.entityType) {
        case "llc":
          return "certificate of formation";
        case "corporation":
          return "articles of incorporation";
        case "partnership":
          return "partnership agreement";
        default:
          return "certificate of formation/articles of incorporation/partnership agreement";
      }
    })();
    children.push(
      bulletPoint(
        `The organizational documents of the Borrower, including ${orgDocLabel}`,
      ),
    );
  }

  children.push(
    bulletPoint(
      "Such other documents, records, and certificates as we have deemed necessary for the purposes of this opinion",
    ),
  );
  children.push(spacer(8));

  // 9. Assumptions
  children.push(sectionHeading("Assumptions"));
  children.push(
    bodyText(
      "In rendering the opinions expressed herein, we have assumed:",
    ),
  );
  children.push(spacer(4));

  children.push(
    bulletPoint(
      "The genuineness of all signatures and the authenticity of all documents submitted to us as originals",
    ),
  );
  children.push(
    bulletPoint(
      "The conformity to authentic originals of all documents submitted to us as copies",
    ),
  );
  children.push(
    bulletPoint(
      "That each party to the Loan Documents (other than the Borrower) has the legal capacity and authority to execute, deliver, and perform its obligations under the Loan Documents",
    ),
  );
  children.push(
    bulletPoint(
      "That the Loan Documents have been duly authorized, executed, and delivered by each party thereto (other than the Borrower)",
    ),
  );
  children.push(
    bulletPoint(
      `That the laws of jurisdictions other than ${stateDisplay} are substantially similar to the laws of ${stateDisplay} with respect to the matters opined upon herein`,
    ),
  );
  children.push(spacer(8));

  // 10. Opinions (deterministic)
  children.push(sectionHeading("Opinions"));
  children.push(
    bodyText(
      "Based upon and subject to the foregoing and the qualifications set forth herein, we are of the opinion that:",
    ),
  );
  children.push(spacer(4));

  if (isIndividual) {
    // Individual / sole proprietor — no organization or good standing opinion
    children.push(
      bulletPoint(
        `The Borrower, ${input.borrowerName}, is an individual with full legal capacity to execute, deliver, and perform the Borrower's obligations under the Loan Documents.`,
      ),
    );
    children.push(
      bulletPoint(
        "The execution, delivery, and performance by the Borrower of the Loan Documents do not and will not violate any law, rule, or regulation applicable to the Borrower, or result in a breach of, or constitute a default under, any material agreement to which the Borrower is a party.",
      ),
    );
  } else {
    const entityTypeLabel = (() => {
      switch (input.entityType) {
        case "llc":
          return "limited liability company";
        case "corporation":
          return "corporation";
        case "partnership":
          return "partnership";
        default:
          return "limited liability company";
      }
    })();

    children.push(
      bulletPoint(
        `The Borrower is a ${entityTypeLabel} duly organized, validly existing, and in good standing under the laws of ${stateDisplay}, and has all requisite power and authority to own its properties and to conduct its business as currently conducted.`,
      ),
    );
    children.push(
      bulletPoint(
        "The Borrower has the power and authority to execute, deliver, and perform its obligations under the Loan Agreement, the Promissory Note, and all other Loan Documents to which it is a party. The execution, delivery, and performance of the Loan Documents have been duly authorized by all necessary action on the part of the Borrower.",
      ),
    );
    children.push(
      bulletPoint(
        "The execution, delivery, and performance by the Borrower of the Loan Documents do not and will not: (a) violate the organizational documents of the Borrower; (b) violate any law, rule, or regulation applicable to the Borrower; or (c) result in a breach of, or constitute a default under, any material agreement to which the Borrower is a party.",
      ),
    );
  }
  children.push(
    bulletPoint(
      "Each of the Loan Documents to which the Borrower is a party constitutes a legal, valid, and binding obligation of the Borrower, enforceable against the Borrower in accordance with its terms, except as enforcement may be limited by: (a) applicable bankruptcy, insolvency, reorganization, moratorium, or similar laws affecting the enforcement of creditors' rights generally; (b) general principles of equity (regardless of whether enforcement is sought in a proceeding in equity or at law); and (c) applicable fraudulent transfer, fraudulent conveyance, and preference laws.",
    ),
  );
  children.push(
    bulletPoint(
      "To our knowledge, there is no action, suit, proceeding, or investigation pending or threatened against the Borrower that would have a material adverse effect on the Borrower's ability to perform its obligations under the Loan Documents.",
    ),
  );
  children.push(
    bulletPoint(
      "To our knowledge, the Borrower is in compliance with all applicable laws, rules, and regulations material to its business operations.",
    ),
  );
  children.push(spacer(8));

  // 11. Additional Opinions (AI prose)
  children.push(sectionHeading("Additional Opinions"));
  children.push(bodyText(prose.additionalOpinions));
  children.push(spacer(8));

  // 12. Qualifications and Limitations
  children.push(sectionHeading("Qualifications and Limitations"));
  children.push(
    bodyText(
      "The opinions expressed herein are subject to the following qualifications and limitations:",
    ),
  );
  children.push(spacer(4));

  children.push(
    bulletPoint(
      `This opinion is limited to the laws of the State of ${stateDisplay} and the federal laws of the United States, and we express no opinion as to the laws of any other jurisdiction.`,
    ),
  );
  children.push(
    bulletPoint(
      "We express no opinion as to tax matters, environmental matters, or regulatory compliance beyond general corporate law.",
    ),
  );
  children.push(
    bulletPoint(
      "This opinion is rendered as of the date hereof and we assume no obligation to update or supplement this opinion for events occurring after the date hereof.",
    ),
  );
  children.push(
    bulletPoint(
      "This opinion is solely for the benefit of the Lender and may not be relied upon by any other person or entity without our prior written consent.",
    ),
  );
  children.push(
    bulletPoint(
      "We express no opinion as to the application or effect of any fraudulent transfer, fraudulent conveyance, or preference law on any of the transactions contemplated by the Loan Documents.",
    ),
  );
  children.push(
    bulletPoint(
      "We express no opinion as to the applicability or effect of any federal or state securities laws, including any blue sky or similar laws, to any of the transactions contemplated by the Loan Documents.",
    ),
  );
  children.push(
    bulletPoint(
      "To the extent that our opinions relate to factual matters, we have relied upon certificates of officers and representatives of the Borrower and upon representations made in the Loan Documents, and we have not independently verified such factual matters.",
    ),
  );
  children.push(
    bulletPoint(
      "We express no opinion as to the practical realization of any rights or remedies under the Loan Documents, including the availability of specific performance, injunctive relief, or other equitable remedies.",
    ),
  );
  children.push(
    bulletPoint(
      "This opinion is rendered solely in connection with the Loan transaction described herein and may not be relied upon in connection with any other transaction.",
    ),
  );
  children.push(spacer(8));

  // 13. Governing Law (AI prose)
  children.push(sectionHeading("Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // 14. Closing
  children.push(bodyText("Very truly yours,", { italic: true }));

  // 15. Signature
  children.push(...signatureBlock("[Law Firm Name]", "Counsel to Borrower"));

  // Wrap in legal document shell
  return buildLegalDocument({
    title: "Legal Opinion Letter",
    headerRight: `Legal Opinion Letter — ${input.borrowerName}`,
    children,
  });
}
