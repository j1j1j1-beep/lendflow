// =============================================================================
// privacy-notice.ts
// Generates a DOCX Gramm-Leach-Bliley Act Privacy Notice.
// ZERO AI — pure deterministic data mapping from DocumentInput.
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
  createTable,
  keyTermsTable,
  spacer,
  formatDate,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildPrivacyNotice(input: DocumentInput): Document {
  const children: (Paragraph | Table)[] = [];

  // -------------------------------------------------------------------------
  // 1. Title
  // -------------------------------------------------------------------------
  children.push(
    documentTitle(
      "Privacy Notice \u2014 Gramm-Leach-Bliley Act Disclosure",
    ),
  );
  children.push(spacer(4));

  // -------------------------------------------------------------------------
  // 2. FACTS header
  // -------------------------------------------------------------------------
  children.push(sectionHeading("FACTS"));

  children.push(
    bodyTextRuns([
      { text: "What does ", bold: true },
      { text: input.lenderName, bold: true, underline: true },
      { text: " do with your personal information?", bold: true },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 3. WHY? section
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Why?"));

  children.push(
    bodyText(
      "Financial companies choose how they share your personal information. Federal law gives consumers the right to limit some but not all sharing. Federal law also requires us to tell you how we collect, share, and protect your personal information. Please read this notice carefully to understand what we do.",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 4. WHAT? section
  // -------------------------------------------------------------------------
  children.push(sectionHeading("What?"));

  children.push(
    bodyText(
      "The types of personal information we collect and share depend on the product or service you have with us. This information can include:",
    ),
  );
  children.push(spacer(4));

  children.push(
    createTable(
      ["Category", "Examples of Information Collected"],
      [
        ["Identifying Information", "Social Security number, name, address, date of birth"],
        ["Financial Information", "Income, assets, account balances, payment history"],
        ["Credit Information", "Credit history, credit scores, outstanding debts"],
        ["Transaction Information", "Account transactions, wire transfers, loan payments"],
        ["Employment Information", "Employer name, occupation, employment history"],
        ["Tax Information", "Tax returns, W-2 forms, tax transcripts"],
      ],
      { columnWidths: [35, 65], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 5. HOW? section
  // -------------------------------------------------------------------------
  children.push(sectionHeading("How?"));

  children.push(
    bodyText(
      `All financial companies need to share customers\u2019 personal information to run their everyday business. In the section below, we list the reasons financial companies can share their customers\u2019 personal information; the reasons ${input.lenderName} chooses to share; and whether you can limit this sharing.`,
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 6. Sharing Table — Standard GLBA Categories
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Reasons We Can Share Your Personal Information"));

  children.push(
    createTable(
      ["Reasons We Can Share Your Personal Information", "Does " + input.lenderName + " Share?", "Can You Limit This Sharing?"],
      [
        [
          "For our everyday business purposes \u2014 such as to process your transactions, maintain your account(s), respond to court orders and legal investigations, or report to credit bureaus",
          "Yes",
          "No",
        ],
        [
          "For our marketing purposes \u2014 to offer our products and services to you",
          "Yes",
          "No",
        ],
        [
          "For joint marketing with other financial companies",
          "[Yes/No]",
          "[Yes/No]",
        ],
        [
          "For our affiliates\u2019 everyday business purposes \u2014 information about your transactions and experiences",
          "[Yes/No]",
          "[Yes/No]",
        ],
        [
          "For our affiliates\u2019 everyday business purposes \u2014 information about your creditworthiness",
          "[Yes/No]",
          "[Yes/No]",
        ],
        [
          "For nonaffiliates to market to you",
          "[Yes/No]",
          "[Yes/No]",
        ],
      ],
      { columnWidths: [50, 25, 25], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 7. To Limit Our Sharing
  // -------------------------------------------------------------------------
  children.push(sectionHeading("To Limit Our Sharing"));

  children.push(
    bodyText(
      "If applicable, you may contact us to limit sharing for the categories marked above. Please note: if you are a new customer, we can begin sharing your information 30 days from the date we sent this notice. When you are no longer our customer, we continue to share your information as described in this notice. However, you can contact us at any time to limit our sharing.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      "To limit our sharing or for questions, contact us at: [PHONE NUMBER] or [EMAIL ADDRESS]",
      { bold: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 8. Who We Are
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Who We Are"));

  children.push(
    keyTermsTable([
      { label: "Who is providing this notice?", value: input.lenderName },
      { label: "Company Address", value: "[LENDER ADDRESS \u2014 TO BE COMPLETED]" },
      { label: "Phone", value: "[PHONE NUMBER]" },
      { label: "Website", value: "[WEBSITE]" },
    ]),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 9. What We Do
  // -------------------------------------------------------------------------
  children.push(sectionHeading("What We Do"));

  children.push(
    bodyTextRuns([
      { text: "How does " },
      { text: input.lenderName, bold: true },
      { text: " protect my personal information?" },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "To protect your personal information from unauthorized access and use, we use security measures that comply with federal law. These measures include computer safeguards and secured files and buildings. We also limit access to information to those employees who need it to conduct our business.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "How does " },
      { text: input.lenderName, bold: true },
      { text: " collect my personal information?" },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "We collect your personal information, for example, when you:",
    ),
  );
  children.push(
    createTable(
      ["Activity", "Information Collected"],
      [
        ["Apply for a loan", "Name, address, SSN, income, employment"],
        ["Provide financial statements", "Assets, liabilities, net worth"],
        ["Provide tax returns", "Income, filing status, deductions"],
        ["Make loan payments", "Account numbers, payment amounts, dates"],
        ["Provide collateral information", "Property details, valuations"],
      ],
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "We also collect your personal information from others, such as credit bureaus, affiliates, or other companies.",
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyTextRuns([
      { text: "Why can\u2019t I limit all sharing?" },
    ]),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      "Federal law gives you the right to limit only: (1) sharing for affiliates\u2019 everyday business purposes \u2014 information about your creditworthiness; (2) affiliates from using your information to market to you; and (3) sharing for nonaffiliates to market to you. State laws and individual companies may give you additional rights to limit sharing.",
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 10. Definitions
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Definitions"));

  children.push(
    createTable(
      ["Term", "Definition"],
      [
        ["Affiliates", `Companies related by common ownership or control. They can be financial and nonfinancial companies. ${input.lenderName}\u2019s affiliates may include [LIST AFFILIATES IF ANY].`],
        ["Nonaffiliates", `Companies not related by common ownership or control. They can be financial and nonfinancial companies. ${input.lenderName} does not share with nonaffiliates so they can market to you unless indicated above.`],
        ["Joint Marketing", `A formal agreement between nonaffiliated financial companies that together market financial products or services to you. ${input.lenderName}\u2019s joint marketing partners may include [LIST PARTNERS IF ANY].`],
      ],
      { columnWidths: [25, 75], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // -------------------------------------------------------------------------
  // 11. Effective Date & Regulatory Reference
  // -------------------------------------------------------------------------
  children.push(sectionHeading("Effective Date"));

  children.push(
    bodyText(
      `This privacy notice is effective as of ${formatDate(input.generatedAt)}.`,
    ),
  );
  children.push(spacer(4));

  children.push(
    bodyText(
      `This notice is provided pursuant to the Gramm-Leach-Bliley Act (15 U.S.C. \u00A7 6801-6809) and Regulation P (12 CFR Part 1016).`,
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 12. Wrap in legal document shell
  // -------------------------------------------------------------------------
  return buildLegalDocument({
    title: "Privacy Notice",
    headerRight: `Privacy Notice \u2014 ${input.lenderName}`,
    children,
  });
}
