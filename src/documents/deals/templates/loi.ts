// loi.ts
// Generates a DOCX Letter of Intent / Term Sheet for an M&A transaction.
// Binding provisions: exclusivity, confidentiality, expense allocation, governing law.
// Non-binding provisions: purchase price, structure, due diligence, conditions, timeline.

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
  spacer,
  signatureBlock,
  keyTermsTable,
  formatCurrency,
  formatDate,
  ensureProseArray,
  safeNumber,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, LOIProse } from "../types";

export function buildLOI(
  project: MAProjectFull,
  prose: LOIProse,
): Document {
  const purchasePrice = safeNumber(project.purchasePrice);
  const cashComponent = safeNumber(project.cashComponent);
  const stockComponent = safeNumber(project.stockComponent);
  const sellerNote = safeNumber(project.sellerNote);
  const earnoutAmount = safeNumber(project.earnoutAmount);
  const workingCapitalTarget = safeNumber(project.workingCapitalTarget);
  const dateFormatted = formatDate(new Date());
  const governingLaw = project.governingLaw ?? "Delaware";

  const transactionTypeLabel: Record<string, string> = {
    STOCK_PURCHASE: "Stock Purchase",
    ASSET_PURCHASE: "Asset Purchase",
    MERGER_FORWARD: "Forward Merger",
    MERGER_REVERSE_TRIANGULAR: "Reverse Triangular Merger",
    MERGER_FORWARD_TRIANGULAR: "Forward Triangular Merger",
    REVERSE_MERGER: "Reverse Merger",
    TENDER_OFFER: "Tender Offer",
    SECTION_363_SALE: "Section 363 Bankruptcy Sale",
  };

  const children: (Paragraph | Table)[] = [];

  // 1. Header
  children.push(bodyText(project.buyerName, { bold: true, color: COLORS.primary }));
  children.push(bodyText(dateFormatted));
  children.push(spacer(8));
  children.push(documentTitle("Letter of Intent"));
  children.push(spacer(4));

  // 2. Addressee
  children.push(bodyText("CONFIDENTIAL"));
  children.push(spacer(2));
  children.push(bodyText(`Dear ${project.sellerName},`));
  children.push(spacer(4));

  // 3. Opening (AI prose)
  children.push(bodyText(prose.openingParagraph));
  children.push(spacer(4));

  // 4. Key Terms Table
  children.push(sectionHeading("Summary of Key Terms"));

  const termRows: Array<{ label: string; value: string }> = [
    { label: "Buyer", value: `${project.buyerName}${project.buyerEntity ? ` (${project.buyerEntity})` : ""}` },
    { label: "Seller", value: `${project.sellerName}${project.sellerEntity ? ` (${project.sellerEntity})` : ""}` },
    { label: "Target Company", value: project.targetCompany },
    { label: "Transaction Structure", value: transactionTypeLabel[project.transactionType] ?? project.transactionType },
  ];

  if (purchasePrice) {
    termRows.push({ label: "Purchase Price", value: formatCurrency(purchasePrice) });
  }
  if (cashComponent) {
    termRows.push({ label: "Cash Component", value: formatCurrency(cashComponent) });
  }
  if (stockComponent) {
    termRows.push({ label: "Stock Component", value: formatCurrency(stockComponent) });
  }
  if (sellerNote) {
    termRows.push({ label: "Seller Note", value: formatCurrency(sellerNote) });
  }
  if (earnoutAmount) {
    termRows.push({
      label: "Earnout",
      value: `${formatCurrency(earnoutAmount)}${project.earnoutTermMonths ? ` over ${project.earnoutTermMonths} months` : ""}`,
    });
  }
  if (workingCapitalTarget) {
    termRows.push({ label: "Working Capital Target", value: formatCurrency(workingCapitalTarget) });
  }
  if (project.escrowPercent) {
    termRows.push({
      label: "Escrow",
      value: `${(safeNumber(project.escrowPercent) * 100).toFixed(1)}%${project.escrowTermMonths ? ` for ${project.escrowTermMonths} months` : ""}`,
    });
  }
  if (project.exclusivityDays) {
    termRows.push({ label: "Exclusivity Period", value: `${project.exclusivityDays} days` });
  }
  if (project.dueDiligenceDays) {
    termRows.push({ label: "Due Diligence Period", value: `${project.dueDiligenceDays} days` });
  }
  if (project.targetCloseDate) {
    termRows.push({ label: "Target Close Date", value: formatDate(project.targetCloseDate) });
  }
  termRows.push({ label: "Governing Law", value: `State of ${governingLaw}` });

  children.push(keyTermsTable(termRows));
  children.push(spacer(8));

  // 5. NON-BINDING header
  children.push(sectionHeading("Non-Binding Provisions"));
  children.push(
    bodyText(
      "The following provisions are non-binding expressions of intent and do not create enforceable obligations. They are included solely to facilitate negotiations toward a definitive agreement.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(4));

  // 6. Purchase Price (AI prose)
  children.push(
    bodyText("1. Purchase Price and Consideration", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.purchasePriceProvision));
  children.push(spacer(4));

  // 7. Transaction Structure (AI prose)
  children.push(
    bodyText("2. Transaction Structure", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.structureDescription));
  children.push(spacer(4));

  // 8. Due Diligence (AI prose)
  children.push(
    bodyText("3. Due Diligence", { bold: true, color: COLORS.primary }),
  );
  if (project.dueDiligenceDays) {
    children.push(
      bodyText(
        `Buyer shall have a period of ${project.dueDiligenceDays} days from the date of this Letter of Intent to complete its due diligence investigation of the Target Company. Buyer's due diligence shall include, without limitation, the following categories:`,
      ),
    );
  } else {
    children.push(
      bodyText(
        "Buyer shall conduct a comprehensive due diligence investigation of the Target Company, which shall include, without limitation, the following categories:",
      ),
    );
  }
  for (const item of ensureProseArray(prose.dueDiligenceScope)) {
    children.push(bulletPoint(item));
  }
  children.push(spacer(4));

  // 9. Closing Conditions (AI prose)
  children.push(
    bodyText("4. Conditions to Closing", { bold: true, color: COLORS.primary }),
  );
  children.push(
    bodyText("The consummation of the transaction contemplated hereby shall be subject to the satisfaction (or waiver) of the following conditions:"),
  );
  for (const condition of ensureProseArray(prose.closingConditions)) {
    children.push(bulletPoint(condition));
  }
  children.push(spacer(8));

  // 10. BINDING header
  children.push(sectionHeading("Binding Provisions"));
  children.push(
    bodyText(
      "The following provisions are legally binding and enforceable obligations of the parties, effective upon execution of this Letter of Intent.",
      { italic: true, color: COLORS.textGray },
    ),
  );
  children.push(spacer(4));

  // 11. Exclusivity (AI prose — BINDING)
  children.push(
    bodyText("5. Exclusivity / No-Shop", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.exclusivityProvision));
  children.push(spacer(4));

  // 12. Confidentiality (AI prose — BINDING)
  children.push(
    bodyText("6. Confidentiality", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.confidentialityProvision));
  children.push(spacer(4));

  // 13. Expenses (AI prose — BINDING)
  children.push(
    bodyText("7. Expenses", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.expenseAllocation));
  children.push(spacer(4));

  // 14. Binding/Non-Binding Statement (AI prose — BINDING)
  children.push(
    bodyText("8. Nature of this Letter", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.bindingNonBindingStatement));
  children.push(spacer(4));

  // 15. Governing Law (AI prose — BINDING)
  children.push(
    bodyText("9. Governing Law", { bold: true, color: COLORS.primary }),
  );
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(8));

  // 16. HSR Notice (deterministic — if applicable)
  if (project.hsrRequired) {
    children.push(sectionHeading("HSR Act Notice"));
    children.push(
      bodyText(
        `The parties acknowledge that this transaction may be subject to premerger notification requirements under the Hart-Scott-Rodino Antitrust Improvements Act of 1976, as amended (15 U.S.C. Section 18a). Based on the 2026 jurisdictional thresholds, transactions valued at $119.5 million or above require HSR filing. Each party shall use its reasonable best efforts to prepare and file all required notifications and shall cooperate fully with any requests from the Federal Trade Commission or the Department of Justice.`,
      ),
    );
    children.push(spacer(8));
  }

  // 17. Expiration
  children.push(sectionHeading("Expiration"));
  children.push(
    bodyText(
      `This Letter of Intent shall expire if not executed by both parties within fifteen (15) business days from the date first written above, unless extended by mutual written agreement of the parties.`,
    ),
  );
  children.push(spacer(8));

  // 18. Signature blocks
  children.push(sectionHeading("Execution"));
  children.push(
    bodyText(
      "If the foregoing accurately reflects the understanding between the parties, please indicate your acceptance by executing this Letter of Intent in the space provided below.",
    ),
  );
  children.push(spacer(4));

  children.push(bodyText("BUYER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.buyerName, "Authorized Signatory"));
  children.push(spacer(16));

  children.push(bodyText("ACCEPTED AND AGREED — SELLER:", { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.sellerName, "Authorized Signatory"));

  return buildLegalDocument({
    title: "Letter of Intent",
    headerRight: `LOI — ${project.targetCompany}`,
    children,
  });
}
