// =============================================================================
// borrowing-base-agreement.ts
// Builds a Borrowing Base Agreement for revolving lines of credit.
// All financial numbers come from DocumentInput; AI writes prose.
// =============================================================================

import type { DocumentInput, BorrowingBaseProse } from "../types";
import {
  Document,
  buildLegalDocument,
  documentTitle,
  partyBlock,
  signatureBlock,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  articleHeading,
  sectionSubheading,
  sectionHeading,
  keyTermsTable,
  createTable,
  spacer,
  formatCurrency,
  formatDate,
  numberToWords,
  COLORS,
} from "../doc-helpers";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildBorrowingBaseAgreement(
  input: DocumentInput,
  prose: BorrowingBaseProse,
): Document {
  const effectiveDate = formatDate(input.generatedAt);
  const loanAmount = formatCurrency(input.terms.approvedAmount);
  const loanAmountWords = numberToWords(input.terms.approvedAmount);
  const maturityDate = formatDate(input.maturityDate);
  const interestRate = `${(input.terms.interestRate * 100).toFixed(3)}%`;

  const children = [
    // ---- Title ----
    documentTitle("Borrowing Base Agreement"),
    spacer(4),

    bodyText(
      `This Borrowing Base Agreement (this "Agreement") is entered into as of ${effectiveDate}, by and between the following parties:`,
    ),
    spacer(4),

    // ---- Parties ----
    articleHeading("I", "Parties"),
    partyBlock("Borrower", input.borrowerName, "the \"Borrower\""),
    partyBlock("Lender", input.lenderName, "the \"Lender\""),
    spacer(4),

    // ---- Key Terms ----
    articleHeading("II", "Key Terms"),
    keyTermsTable([
      { label: "Revolving Commitment Amount", value: `${loanAmount} (${loanAmountWords} dollars)` },
      { label: "Interest Rate", value: `${interestRate} per annum (${input.terms.baseRateType} + ${(input.terms.spread * 100).toFixed(2)}%)` },
      { label: "Term", value: `${input.terms.termMonths} months` },
      { label: "Maturity Date", value: maturityDate },
      { label: "Loan Program", value: input.programName },
    ]),
    spacer(4),

    // ---- Definitions ----
    articleHeading("III", "Definitions"),
    bodyText(
      "As used in this Agreement, the following terms shall have the meanings set forth below:",
    ),
    spacer(2),
    bodyTextRuns([
      { text: "\"Borrowing Base\" ", bold: true },
      { text: "means, at any time, the sum of (a) the applicable Advance Rate multiplied by the aggregate amount of Eligible Accounts at such time, plus (b) the applicable Advance Rate multiplied by the aggregate value of Eligible Inventory at such time, minus (c) any Reserves established by Lender, all as determined by Lender in its sole but commercially reasonable discretion based on the most recent Borrowing Base Certificate delivered by Borrower." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Eligible Accounts\" ", bold: true },
      { text: "means those accounts receivable of Borrower that satisfy all of the eligibility criteria set forth in this Agreement and that Lender, in its commercially reasonable discretion, deems eligible for inclusion in the Borrowing Base." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Eligible Inventory\" ", bold: true },
      { text: "means that inventory of Borrower consisting of finished goods and raw materials that satisfies all of the eligibility criteria set forth in this Agreement and that Lender, in its commercially reasonable discretion, deems eligible for inclusion in the Borrowing Base." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Advance Rate\" ", bold: true },
      { text: "means, with respect to Eligible Accounts, eighty percent (80%), and with respect to Eligible Inventory, fifty percent (50%), or such other percentage as Lender may establish from time to time in its commercially reasonable discretion." },
    ]),
    spacer(2),
    bodyTextRuns([
      { text: "\"Availability\" ", bold: true },
      { text: "means, at any time, the lesser of (a) the Revolving Commitment Amount and (b) the Borrowing Base, minus the aggregate outstanding principal balance of all revolving advances." },
    ]),
    spacer(4),

    // ---- Borrowing Base Formula ----
    articleHeading("IV", "Borrowing Base Calculation"),
    bodyText(
      "The Borrowing Base shall be calculated as follows:",
    ),
    spacer(2),
    createTable(
      ["Component", "Calculation", "Amount"],
      [
        ["Eligible Accounts Receivable", "x 80% Advance Rate", "$___________"],
        ["Eligible Inventory", "x 50% Advance Rate", "$___________"],
        ["Less: Reserves", "(Dilution, concentration)", "($__________)"],
        ["Equals: Borrowing Base", "", "$___________"],
        ["Maximum Available", "Lesser of Commitment and Borrowing Base", "$___________"],
      ],
      { columnWidths: [40, 35, 25] },
    ),
    spacer(2),
    bodyText(
      `The Revolving Commitment Amount is ${loanAmount}. Maximum availability shall not exceed the lesser of the Revolving Commitment Amount and the Borrowing Base as calculated above.`,
    ),
    spacer(4),

    // ---- Ineligible Accounts ----
    articleHeading("V", "Ineligible Accounts"),
    bodyText(
      "The following accounts receivable shall be excluded from Eligible Accounts and shall not be included in the calculation of the Borrowing Base:",
    ),
    bulletPoint("Accounts that are more than ninety (90) days past the original invoice date;"),
    bulletPoint("Accounts owed by account debtors located outside of the United States, unless supported by letters of credit acceptable to Lender;"),
    bulletPoint("Intercompany accounts or accounts owed by affiliates of Borrower;"),
    bulletPoint("Accounts owed by any federal, state, or local governmental entity, unless properly assigned in compliance with the Federal Assignment of Claims Act or applicable state equivalent;"),
    bulletPoint("Cross-aged accounts: all accounts owed by any single account debtor where more than fifty percent (50%) of the aggregate accounts from such debtor are more than ninety (90) days past due;"),
    bulletPoint("Accounts subject to any lien, security interest, or encumbrance other than in favor of Lender;"),
    bulletPoint("Accounts subject to any setoff, counterclaim, dispute, or defense;"),
    bulletPoint("Accounts where the account debtor is insolvent or the subject of any bankruptcy proceeding;"),
    spacer(4),

    // ---- Ineligible Inventory ----
    articleHeading("VI", "Ineligible Inventory"),
    bodyText(
      "The following inventory shall be excluded from Eligible Inventory and shall not be included in the calculation of the Borrowing Base:",
    ),
    bulletPoint("Work-in-progress inventory;"),
    bulletPoint("Consigned goods or goods held on a bill-and-hold basis;"),
    bulletPoint("Goods in transit, unless covered by insurance and shipping documents acceptable to Lender;"),
    bulletPoint("Obsolete, slow-moving, or damaged inventory as determined by Lender in its commercially reasonable discretion;"),
    bulletPoint("Inventory located at third-party locations without a valid landlord or bailee waiver in favor of Lender;"),
    bulletPoint("Inventory subject to any lien, security interest, or encumbrance other than in favor of Lender;"),
    bulletPoint("Packaging, supplies, and similar materials not held for sale in the ordinary course of business;"),
    spacer(4),

    // ---- Eligibility Criteria (AI prose) ----
    articleHeading("VII", "Additional Eligibility Criteria"),
    bodyText(prose.eligibilityCriteria),
    spacer(4),

    // ---- Advance Rates (AI prose) ----
    articleHeading("VIII", "Advance Rate Provisions"),
    bodyText(prose.advanceRates),
    spacer(4),

    // ---- Reporting Requirements (AI prose) ----
    articleHeading("IX", "Reporting Requirements"),
    bodyText(prose.reportingRequirements),
    spacer(4),

    // ---- Reserve Provisions (AI prose) ----
    articleHeading("X", "Reserves"),
    bodyText(prose.reserveProvisions),
    spacer(4),

    // ---- Borrowing Base Certificate ----
    articleHeading("XI", "Borrowing Base Certificate"),
    bodyText(
      "Borrower shall deliver to Lender a Borrowing Base Certificate in the form attached hereto as Exhibit A, or in such other form as Lender may reasonably require, certified by an authorized officer of Borrower. Each Borrowing Base Certificate shall be delivered:",
    ),
    bulletPoint("Monthly, not later than the fifteenth (15th) day of each calendar month, covering the immediately preceding month;"),
    bulletPoint("At any time upon the reasonable request of Lender; and"),
    bulletPoint("Concurrently with any request for a revolving advance."),
    spacer(2),
    bodyText(
      "Each Borrowing Base Certificate shall set forth in reasonable detail the calculation of the Borrowing Base as of the last day of the period covered, including a summary of Eligible Accounts and Eligible Inventory, applicable Advance Rates, Reserves, and resulting Availability. Borrower certifies that all information in each Borrowing Base Certificate is true, correct, and complete in all material respects.",
    ),
    spacer(4),

    // ---- Events of Default ----
    articleHeading("XII", "Events of Default"),
    bodyText(
      "In addition to any Events of Default set forth in the Loan Agreement, the following shall constitute Events of Default under this Agreement:",
    ),
    bulletPoint("Borrower fails to deliver any Borrowing Base Certificate when due and such failure continues for five (5) business days;"),
    bulletPoint("Any Borrowing Base Certificate or other report contains a material misstatement or omission;"),
    bulletPoint("The outstanding revolving advances exceed the Borrowing Base (an \"Overadvance\") and Borrower fails to cure such Overadvance within two (2) business days of notice;"),
    bulletPoint("Borrower materially breaches any eligibility criteria, reporting obligation, or covenant under this Agreement;"),
    spacer(4),

    // ---- Governing Law (AI prose) ----
    articleHeading("XIII", "Governing Law"),
    bodyText(prose.governingLaw),
    spacer(4),

    // Standard clauses
    bodyTextRuns([
      { text: "JURY TRIAL WAIVER: ", bold: true },
      { text: "BORROWER AND LENDER HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION ARISING OUT OF, UNDER, OR IN CONNECTION WITH THIS AGREEMENT." },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Severability: ", bold: true },
      { text: "If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect." },
    ]),
    spacer(4),
    bodyTextRuns([
      { text: "Counterparts: ", bold: true },
      { text: "This Agreement may be executed in counterparts. Signatures delivered by electronic means shall be deemed originals." },
    ]),
    spacer(8),

    // ---- Signatures ----
    bodyTextRuns([
      {
        text: "IN WITNESS WHEREOF, the parties have executed this Borrowing Base Agreement as of the date first written above.",
        bold: true,
      },
    ]),

    bodyText("BORROWER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.borrowerName, "Borrower"),

    bodyText("LENDER:", { bold: true, color: COLORS.primary }),
    ...signatureBlock(input.lenderName, "Lender"),
  ];

  return buildLegalDocument({
    title: "Borrowing Base Agreement",
    headerRight: `Borrowing Base Agreement — ${input.borrowerName}`,
    children,
  });
}
