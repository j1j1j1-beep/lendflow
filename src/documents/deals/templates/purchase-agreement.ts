// purchase-agreement.ts
// Generates a DOCX Purchase Agreement for an M&A transaction.
// Handles: stock purchase, asset purchase, and merger agreements.
// Includes: reps & warranties, covenants, conditions, indemnification, termination.
// References: HSR ($133.9M threshold), Section 338/368, R&W insurance, MAC carveouts.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  articleHeading,
  sectionSubheading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  partyBlock,
  keyTermsTable,
  createTable,
  formatCurrency,
  formatDate,
  numberToWords,
  ensureProseArray,
  safeNumber,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, PurchaseAgreementProse } from "../types";

/**
 * Resolve human-readable agreement title based on transaction type.
 */
function resolveTitle(transactionType: string): string {
  switch (transactionType) {
    case "STOCK_PURCHASE":
    case "TENDER_OFFER":
      return "Stock Purchase Agreement";
    case "ASSET_PURCHASE":
    case "SECTION_363_SALE":
      return "Asset Purchase Agreement";
    case "MERGER_FORWARD":
    case "MERGER_REVERSE_TRIANGULAR":
    case "MERGER_FORWARD_TRIANGULAR":
    case "REVERSE_MERGER":
      return "Agreement and Plan of Merger";
    default:
      return "Purchase Agreement";
  }
}

export function buildPurchaseAgreement(
  project: MAProjectFull,
  prose: PurchaseAgreementProse,
): Document {
  const purchasePrice = safeNumber(project.purchasePrice);
  const cashComponent = safeNumber(project.cashComponent);
  const stockComponent = safeNumber(project.stockComponent);
  const sellerNote = safeNumber(project.sellerNote);
  const earnoutAmount = safeNumber(project.earnoutAmount);
  const workingCapitalTarget = safeNumber(project.workingCapitalTarget);
  const dateFormatted = formatDate(new Date());
  const governingLaw = project.governingLaw ?? "Delaware";
  const title = resolveTitle(project.transactionType);
  const isMerger = ["MERGER_FORWARD", "MERGER_REVERSE_TRIANGULAR", "MERGER_FORWARD_TRIANGULAR", "REVERSE_MERGER"].includes(project.transactionType);
  const isAsset = ["ASSET_PURCHASE", "SECTION_363_SALE"].includes(project.transactionType);

  const macCarveouts = (Array.isArray(project.macCarveouts) ? project.macCarveouts : null) as string[] | null ?? [
    "Changes in general economic or market conditions",
    "Changes affecting the industry generally",
    "Changes in applicable law or accounting standards",
    "Natural disasters, pandemics, acts of terrorism, or war",
    "Effects of announcement of this transaction",
    "Failure to meet projections (but underlying cause may be considered)",
    "Changes in interest rates or exchange rates",
  ];

  const children: (Paragraph | Table)[] = [];

  // ───────────────────────────────────────────────────
  // Title and Preamble
  // ───────────────────────────────────────────────────
  children.push(documentTitle(title));
  children.push(spacer(4));
  children.push(
    bodyText(
      `This ${title} (this "Agreement") is entered into as of ${dateFormatted} (the "Execution Date"), by and between:`,
    ),
  );
  children.push(spacer(4));

  if (isMerger) {
    children.push(partyBlock("Parent / Buyer", project.buyerName, project.buyerEntity ?? undefined));
    children.push(spacer(2));
    children.push(partyBlock("Target Company", project.targetCompany, `a ${project.targetState ?? "Delaware"} corporation`));
  } else {
    children.push(partyBlock("Buyer", project.buyerName, project.buyerEntity ?? undefined));
    children.push(spacer(2));
    children.push(partyBlock("Seller", project.sellerName, project.sellerEntity ?? undefined));
  }
  children.push(spacer(4));
  children.push(
    bodyText(
      `(each a "Party" and together the "Parties").`,
      { italic: true },
    ),
  );
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Key Terms Table
  // ───────────────────────────────────────────────────
  children.push(sectionHeading("Key Terms Summary"));

  const termRows: Array<{ label: string; value: string }> = [
    { label: "Transaction Type", value: title },
    { label: "Target Company", value: project.targetCompany },
  ];

  if (project.targetIndustry) termRows.push({ label: "Industry", value: project.targetIndustry });
  if (project.targetState) termRows.push({ label: "State of Incorporation", value: project.targetState });
  if (purchasePrice) termRows.push({ label: "Purchase Price", value: `${formatCurrency(purchasePrice)} (${numberToWords(purchasePrice).toUpperCase()} DOLLARS)` });
  if (cashComponent) termRows.push({ label: "Cash at Closing", value: formatCurrency(cashComponent) });
  if (stockComponent) termRows.push({ label: "Stock Consideration", value: formatCurrency(stockComponent) });
  if (sellerNote) termRows.push({ label: "Seller Note", value: formatCurrency(sellerNote) });
  if (earnoutAmount) termRows.push({ label: "Earnout Consideration", value: `${formatCurrency(earnoutAmount)}${project.earnoutTermMonths ? ` over ${project.earnoutTermMonths} months` : ""}` });
  if (workingCapitalTarget) termRows.push({ label: "Working Capital Target", value: formatCurrency(workingCapitalTarget) });
  if (project.escrowPercent) {
    const escrowPct = safeNumber(project.escrowPercent);
    const escrowAmount = purchasePrice * escrowPct;
    termRows.push({ label: "Escrow", value: `${(escrowPct * 100).toFixed(1)}% (${formatCurrency(escrowAmount)}) for ${project.escrowTermMonths ?? 12} months` });
  }
  if (project.outsideDate) termRows.push({ label: "Outside Date", value: formatDate(project.outsideDate) });
  if (project.nonCompeteYears) termRows.push({ label: "Non-Compete", value: `${project.nonCompeteYears} years${project.nonCompeteRadius ? `, ${project.nonCompeteRadius}` : ""}` });
  termRows.push({ label: "Governing Law", value: `State of ${governingLaw}` });
  if (project.rwiInsurance) termRows.push({ label: "R&W Insurance", value: `Yes${project.rwiPremiumPercent ? ` (premium: ${(safeNumber(project.rwiPremiumPercent) * 100).toFixed(1)}% of policy limit)` : ""}` });
  if (project.hsrRequired) termRows.push({ label: "HSR Filing", value: `Required${project.hsrFilingFee ? ` (fee: ${formatCurrency(safeNumber(project.hsrFilingFee))})` : ""}` });
  if (project.taxStructure && project.taxStructure !== "STANDARD") {
    const taxLabels: Record<string, string> = {
      SECTION_338H10: "Section 338(h)(10)",
      SECTION_338G: "Section 338(g)",
      SECTION_1031: "Section 1031",
      SECTION_368_A: "Section 368(a)(1)(A)",
      SECTION_368_B: "Section 368(a)(1)(B)",
      SECTION_368_C: "Section 368(a)(1)(C)",
      QSBS_1202: "Section 1202 QSBS",
    };
    termRows.push({ label: "Tax Structure", value: taxLabels[project.taxStructure] ?? project.taxStructure });
  }

  children.push(keyTermsTable(termRows));
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Recitals
  // ───────────────────────────────────────────────────
  children.push(articleHeading("I", "Recitals"));
  children.push(bodyText(prose.recitals));
  children.push(spacer(4));
  children.push(
    bodyText(
      `NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:`,
    ),
  );
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article II: Purchase and Sale
  // ───────────────────────────────────────────────────
  children.push(articleHeading("II", "Purchase and Sale"));

  children.push(sectionSubheading("2.1", "Purchase and Sale"));
  children.push(bodyText(prose.purchaseAndSale));
  children.push(spacer(4));

  children.push(sectionSubheading("2.2", "Consideration"));
  children.push(bodyText(prose.considerationProvisions));
  children.push(spacer(4));

  // Consideration breakdown table (deterministic)
  if (purchasePrice) {
    const considerationRows: string[][] = [];
    if (cashComponent) considerationRows.push(["Cash at Closing", formatCurrency(cashComponent)]);
    if (stockComponent) considerationRows.push(["Stock Consideration", formatCurrency(stockComponent)]);
    if (sellerNote) considerationRows.push(["Seller Note", formatCurrency(sellerNote)]);
    if (earnoutAmount) considerationRows.push(["Earnout (contingent)", formatCurrency(earnoutAmount)]);
    if (project.escrowPercent) {
      const escrowAmt = purchasePrice * safeNumber(project.escrowPercent);
      considerationRows.push(["Holdback to Escrow", `(${formatCurrency(escrowAmt)})`]);
    }
    considerationRows.push(["Total Purchase Price", formatCurrency(purchasePrice)]);

    if (considerationRows.length > 1) {
      children.push(spacer(4));
      children.push(
        createTable(["Component", "Amount"], considerationRows, {
          columnWidths: [60, 40],
          alternateRows: true,
        }),
      );
      children.push(spacer(4));
    }
  }

  children.push(sectionSubheading("2.3", "Working Capital Adjustment"));
  children.push(bodyText(prose.workingCapitalAdjustment));
  children.push(spacer(4));

  // Escrow provisions (deterministic — if applicable)
  if (project.escrowPercent) {
    const escrowPctBody = safeNumber(project.escrowPercent);
    const escrowAmt = purchasePrice * escrowPctBody;
    children.push(sectionSubheading("2.4", "Escrow"));
    children.push(
      bodyText(
        `At the Closing, ${(escrowPctBody * 100).toFixed(1)}% of the Purchase Price (${formatCurrency(escrowAmt)}) (the "Escrow Amount") shall be deposited with a mutually agreed escrow agent (the "Escrow Agent") pursuant to the terms of an escrow agreement to be entered into at Closing (the "Escrow Agreement"). The Escrow Amount shall be held for a period of ${project.escrowTermMonths ?? 12} months following the Closing Date (the "Escrow Period") to secure Seller's indemnification obligations under Article VII. Upon expiration of the Escrow Period, the Escrow Agent shall release any remaining funds to the Seller, less any amounts subject to pending claims.`,
      ),
    );
    children.push(spacer(4));
  }

  // Section 338 election (deterministic — if applicable)
  if (project.section338Election) {
    children.push(sectionSubheading(project.escrowPercent ? "2.5" : "2.4", "Section 338 Election"));
    children.push(
      bodyText(
        `The Parties shall jointly make an election under Section 338(h)(10) of the Internal Revenue Code of 1986, as amended (the "Code"), and any corresponding election under state or local tax law, with respect to the acquisition of the Target Company contemplated by this Agreement. Buyer and Seller shall cooperate in the timely filing of IRS Form 8023 and any comparable state or local tax forms. Such election shall be filed no later than the fifteenth (15th) day of the ninth (9th) month beginning after the month that includes the Closing Date. The Purchase Price and all other relevant items shall be allocated among the assets of the Target Company in accordance with Section 1060 of the Code and the Treasury Regulations promulgated thereunder, and the Parties shall file IRS Form 8594 (Asset Acquisition Statement) and all federal, state, and local tax returns consistent with such allocation.`,
      ),
    );
    children.push(spacer(4));
  }

  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article III: Representations and Warranties of Seller
  // ───────────────────────────────────────────────────
  children.push(articleHeading("III", `Representations and Warranties of ${isMerger ? "the Target Company" : "Seller"}`));
  children.push(
    bodyText(
      `${isMerger ? "The Target Company" : "Seller"} hereby represents and warrants to ${isMerger ? "Parent" : "Buyer"} that, except as set forth in the Disclosure Schedules attached hereto:`,
    ),
  );
  children.push(spacer(4));

  const sellerReps = ensureProseArray(prose.sellerRepresentations);
  sellerReps.forEach((rep, i) => {
    children.push(
      bodyTextRuns([
        { text: `Section 3.${i + 1}. `, bold: true },
        { text: rep },
      ]),
    );
    children.push(spacer(2));
  });
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article IV: Representations and Warranties of Buyer
  // ───────────────────────────────────────────────────
  children.push(articleHeading("IV", `Representations and Warranties of ${isMerger ? "Parent" : "Buyer"}`));
  children.push(
    bodyText(
      `${isMerger ? "Parent" : "Buyer"} hereby represents and warrants to ${isMerger ? "the Target Company" : "Seller"} that:`,
    ),
  );
  children.push(spacer(4));

  const buyerReps = ensureProseArray(prose.buyerRepresentations);
  buyerReps.forEach((rep, i) => {
    children.push(
      bodyTextRuns([
        { text: `Section 4.${i + 1}. `, bold: true },
        { text: rep },
      ]),
    );
    children.push(spacer(2));
  });
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article V: Covenants
  // ───────────────────────────────────────────────────
  children.push(articleHeading("V", "Covenants"));

  children.push(sectionSubheading("5.1", "Pre-Closing Covenants"));
  for (const covenant of ensureProseArray(prose.preClosingCovenants)) {
    children.push(bulletPoint(covenant));
  }
  children.push(spacer(4));

  // HSR Filing Covenant (deterministic — if applicable)
  if (project.hsrRequired) {
    children.push(sectionSubheading("5.2", "HSR Act Compliance"));
    children.push(
      bodyText(
        `(a) Each Party shall, as promptly as practicable and in any event within ten (10) Business Days following the Execution Date, file or cause to be filed with the Federal Trade Commission and the Antitrust Division of the United States Department of Justice all notifications and materials required to be filed pursuant to the Hart-Scott-Rodino Antitrust Improvements Act of 1976, as amended (15 U.S.C. Section 18a) (the "HSR Act"). Based on the 2026 HSR jurisdictional thresholds, this transaction requires premerger notification as the size-of-transaction exceeds $133.9 million.`,
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        `(b) Each Party shall (i) use its reasonable best efforts to cause the waiting period applicable to the transactions contemplated hereby under the HSR Act to terminate or expire as soon as practicable, (ii) promptly comply with any request for additional information or documentary material ("Second Request") issued by the FTC or DOJ, and (iii) not voluntarily extend the waiting period or enter into any agreement with a governmental authority to delay or not to consummate the transactions contemplated hereby without the prior written consent of the other Party.`,
      ),
    );
    children.push(spacer(2));
    children.push(
      bodyText(
        `(c) The filing fee required under the HSR Act shall be borne by the Buyer. Failure to file the required HSR notification subjects the parties to civil penalties of up to $51,744 per day (as adjusted for 2026).`,
      ),
    );
    children.push(spacer(4));
  }

  children.push(sectionSubheading(project.hsrRequired ? "5.3" : "5.2", "Post-Closing Covenants"));
  for (const covenant of ensureProseArray(prose.postClosingCovenants)) {
    children.push(bulletPoint(covenant));
  }
  children.push(spacer(4));

  // Non-Compete Covenant (AI prose + deterministic)
  if (project.nonCompeteYears) {
    const nonCompeteSection = project.hsrRequired ? "5.4" : "5.3";
    children.push(sectionSubheading(nonCompeteSection, "Non-Competition and Non-Solicitation"));
    children.push(bodyText(prose.nonCompeteProvision));
    children.push(spacer(2));
    children.push(
      bodyText(
        `The non-competition period shall be ${project.nonCompeteYears} year${project.nonCompeteYears > 1 ? "s" : ""} from the Closing Date${project.nonCompeteRadius ? `, and the geographic scope shall be limited to ${project.nonCompeteRadius}` : ""}. The Parties acknowledge that the duration and scope of this restriction are reasonable in light of the purchase price paid and the goodwill acquired.`,
      ),
    );
    children.push(spacer(4));
  }

  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article VI: Conditions to Closing
  // ───────────────────────────────────────────────────
  children.push(articleHeading("VI", "Conditions to Closing"));
  children.push(
    bodyText(
      "The obligations of the Parties to consummate the transactions contemplated by this Agreement are subject to the satisfaction (or waiver by the applicable Party) of the following conditions at or prior to the Closing:",
    ),
  );
  children.push(spacer(4));

  for (const condition of ensureProseArray(prose.closingConditions)) {
    children.push(bulletPoint(condition));
  }

  // DGCL-specific closing conditions (deterministic)
  if (isMerger) {
    children.push(spacer(4));
    children.push(
      bodyText(
        `Stockholder Approval. The holders of a majority of the outstanding shares of common stock of the Target Company entitled to vote thereon shall have duly adopted this Agreement at a meeting duly called and held in accordance with the Delaware General Corporation Law ("DGCL") Section 251 (or by written consent in accordance with DGCL Section 228). Dissenting stockholders shall be entitled to appraisal rights pursuant to DGCL Section 262, and the Target Company shall have complied with all notice requirements under such section.`,
        { bold: false },
      ),
    );
  }

  if (isAsset) {
    children.push(spacer(4));
    children.push(
      bodyText(
        `Stockholder Approval. If the sale of assets contemplated hereby constitutes a sale of "all or substantially all" of the Target Company's assets, the holders of a majority of the outstanding shares of the Target Company entitled to vote thereon shall have approved such sale in accordance with DGCL Section 271.`,
        { bold: false },
      ),
    );
  }

  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article VII: Indemnification
  // ───────────────────────────────────────────────────
  children.push(articleHeading("VII", "Indemnification"));
  children.push(bodyText(prose.indemnificationProvisions));
  children.push(spacer(4));

  // Indemnification cap/basket summary table (deterministic)
  if (purchasePrice) {
    const generalCap = purchasePrice * 0.15; // 15% typical midpoint
    const basket = purchasePrice * 0.01; // 1% typical midpoint
    children.push(
      createTable(
        ["Parameter", "Amount / Duration"],
        [
          ["General Rep Cap", `${formatCurrency(generalCap)} (15% of Purchase Price)`],
          ["Fundamental Rep Cap", "Uncapped (or 100% of Purchase Price)"],
          ["Basket / Deductible", `${formatCurrency(basket)} (1% of Purchase Price)`],
          ["General Rep Survival", "18 months"],
          ["Fundamental Rep Survival", "6 years"],
          ["Tax Rep Survival", "Through applicable statute of limitations"],
          ["Fraud", "Uncapped; no survival limitation"],
        ],
        { columnWidths: [40, 60], alternateRows: true },
      ),
    );
    children.push(spacer(4));
  }

  // R&W Insurance provisions (deterministic — if applicable)
  if (project.rwiInsurance) {
    children.push(sectionSubheading("7.2", "Representations and Warranties Insurance"));
    children.push(
      bodyText(
        `The Parties acknowledge that Buyer intends to obtain a buyer-side representations and warranties insurance policy (the "R&W Policy") with respect to the representations and warranties of ${isMerger ? "the Target Company" : "Seller"} set forth in Article III. ${project.rwiPremiumPercent ? `The premium for the R&W Policy shall be approximately ${(safeNumber(project.rwiPremiumPercent) * 100).toFixed(1)}% of the policy limit, which shall be borne by the Buyer.` : "The premium for the R&W Policy (typically 1.0-2.5% of the policy limit) shall be borne by the Buyer."} The R&W Policy shall not (a) limit the indemnification obligations of ${isMerger ? "the Target Company" : "Seller"} under this Article VII for fraud or willful breach, (b) provide recourse to ${isMerger ? "the Target Company" : "Seller"} except in cases of fraud or willful breach, or (c) limit ${isMerger ? "Parent's" : "Buyer's"} right to bring claims against ${isMerger ? "the Target Company" : "Seller"} for fraud or willful breach. The policy retention (deductible) shall be 0.5-1% of enterprise value, with step-down to 50% of the retention after 12 months.`,
      ),
    );
    children.push(spacer(4));
  }

  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article VIII: Material Adverse Change
  // ───────────────────────────────────────────────────
  children.push(articleHeading("VIII", "Material Adverse Change"));
  children.push(
    bodyText(
      `"Material Adverse Change" or "MAC" shall mean any event, occurrence, fact, condition, change, development, or effect that, individually or in the aggregate, has had or would reasonably be expected to have a material adverse effect on (a) the business, operations, financial condition, assets, liabilities, or results of operations of the Target Company, or (b) the ability of ${isMerger ? "the Target Company" : "Seller"} to consummate the transactions contemplated by this Agreement; provided, however, that none of the following shall be deemed to constitute, and none of the following shall be taken into account in determining whether there has been or will be, a Material Adverse Change:`,
    ),
  );
  children.push(spacer(4));
  for (const carveout of macCarveouts) {
    children.push(bulletPoint(carveout));
  }
  children.push(spacer(2));
  if (project.macDefinition) {
    children.push(
      bodyText(`Additional MAC Definition: ${project.macDefinition}`, { italic: true }),
    );
    children.push(spacer(4));
  }
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article IX: Termination
  // ───────────────────────────────────────────────────
  children.push(articleHeading("IX", "Termination"));
  children.push(bodyText(prose.terminationProvisions));
  children.push(spacer(4));

  // Outside date (deterministic)
  if (project.outsideDate) {
    children.push(
      bodyText(
        `The "Outside Date" for purposes of this Agreement shall be ${formatDate(project.outsideDate)}. If the Closing has not occurred on or before the Outside Date, either Party may terminate this Agreement by written notice to the other Party; provided, that neither Party may terminate if such Party's breach of this Agreement is the proximate cause of the failure of the Closing to occur.`,
      ),
    );
    children.push(spacer(4));
  }

  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Article X: Miscellaneous
  // ───────────────────────────────────────────────────
  children.push(articleHeading("X", "Miscellaneous"));
  children.push(bodyText(prose.miscellaneous));
  children.push(spacer(4));

  // Governing Law (AI prose)
  children.push(sectionSubheading("10.1", "Governing Law"));
  children.push(bodyText(prose.governingLaw));
  children.push(spacer(4));

  // Tax allocation (deterministic — for asset purchases)
  if (isAsset) {
    children.push(sectionSubheading("10.2", "Purchase Price Allocation"));
    children.push(
      bodyText(
        `The Purchase Price (and all other relevant items) shall be allocated among the acquired assets in accordance with the "residual method" prescribed by Section 1060 of the Code and the Treasury Regulations promulgated thereunder. Buyer shall prepare a proposed allocation schedule within ninety (90) days after the Closing Date. Seller shall have thirty (30) days to review and propose modifications. If the Parties cannot agree, the allocation shall be determined by an independent accounting firm mutually acceptable to the Parties. Each Party shall file IRS Form 8594 (Asset Acquisition Statement) and all federal, state, and local tax returns consistent with the agreed-upon allocation and shall not take any position inconsistent therewith.`,
      ),
    );
    children.push(spacer(4));
  }

  // Specific performance (deterministic)
  children.push(sectionSubheading(isAsset ? "10.3" : "10.2", "Specific Performance"));
  children.push(
    bodyText(
      `The Parties acknowledge and agree that irreparable damage would occur if any provision of this Agreement were not performed in accordance with the terms hereof, and that monetary damages, even if available, would not be an adequate remedy. Accordingly, each Party shall be entitled to an injunction or injunctions, specific performance, or other equitable relief to prevent breaches of this Agreement and to enforce specifically the terms and provisions hereof, in each case without proof of damages or the posting of any bond or other security, in addition to any other remedy to which such Party may be entitled at law or in equity.`,
    ),
  );
  children.push(spacer(8));

  // ───────────────────────────────────────────────────
  // Signature blocks
  // ───────────────────────────────────────────────────
  children.push(sectionHeading("Execution"));
  children.push(
    bodyText(
      `IN WITNESS WHEREOF, the Parties have executed this ${title} as of the date first written above.`,
    ),
  );
  children.push(spacer(4));

  children.push(bodyText(`${isMerger ? "PARENT:" : "BUYER:"}`, { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(project.buyerName, "Authorized Signatory"));
  children.push(spacer(16));

  children.push(bodyText(`${isMerger ? "TARGET COMPANY:" : "SELLER:"}`, { bold: true, color: COLORS.primary }));
  children.push(...signatureBlock(isMerger ? project.targetCompany : project.sellerName, "Authorized Signatory"));

  // For mergers, also add seller signature if different from target
  if (isMerger && project.sellerName !== project.targetCompany) {
    children.push(spacer(16));
    children.push(bodyText("STOCKHOLDER REPRESENTATIVE:", { bold: true, color: COLORS.primary }));
    children.push(...signatureBlock(project.sellerName, "Stockholder Representative"));
  }

  return buildLegalDocument({
    title,
    headerRight: `${title} — ${project.targetCompany}`,
    children,
  });
}
