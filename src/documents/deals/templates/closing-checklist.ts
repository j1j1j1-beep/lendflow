// closing-checklist.ts
// Generates a DOCX Closing Checklist for an M&A transaction.
// Entirely deterministic — no AI needed.
// Includes: officer certificates, good standing, legal opinions,
// board/stockholder approvals (DGCL), third-party consents, regulatory approvals,
// HSR clearance, escrow, closing funds flow, FIRPTA certificate.

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  spacer,
  createTable,
  formatCurrency,
  formatDate,
  safeNumber,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, ClosingChecklistItem } from "../types";

/**
 * Build the complete closing checklist based on transaction type and deal parameters.
 */
function buildChecklist(project: MAProjectFull): ClosingChecklistItem[] {
  const items: ClosingChecklistItem[] = [];
  const isMerger = ["MERGER_FORWARD", "MERGER_REVERSE_TRIANGULAR", "MERGER_FORWARD_TRIANGULAR", "REVERSE_MERGER"].includes(project.transactionType);
  const isAsset = ["ASSET_PURCHASE", "SECTION_363_SALE"].includes(project.transactionType);
  const isStock = project.transactionType === "STOCK_PURCHASE" || project.transactionType === "TENDER_OFFER";
  const governingLaw = project.governingLaw ?? "Delaware";
  const purchasePrice = safeNumber(project.purchasePrice);

  // ─── Transaction Documents ─────────────────────────────
  items.push({
    category: "Transaction Documents",
    item: `Executed ${isMerger ? "Agreement and Plan of Merger" : isAsset ? "Asset Purchase Agreement" : "Stock Purchase Agreement"} (fully executed original)`,
    responsible: "both",
    status: "open",
    notes: "Requires signatures from all parties",
  });

  if (project.escrowPercent) {
    items.push({
      category: "Transaction Documents",
      item: "Escrow Agreement (fully executed by all parties and escrow agent)",
      responsible: "both",
      status: "open",
      notes: `Escrow: ${(safeNumber(project.escrowPercent) * 100).toFixed(1)}% of Purchase Price for ${project.escrowTermMonths ?? 12} months`,
    });
  }

  if (isStock) {
    items.push({
      category: "Transaction Documents",
      item: "Stock Transfer Powers / Assignment of Membership Interests (endorsed in blank)",
      responsible: "seller",
      status: "open",
      notes: "Must be duly executed by all selling stockholders/members",
    });
  }

  if (isAsset) {
    items.push({
      category: "Transaction Documents",
      item: "Bill of Sale (for transfer of personal property)",
      responsible: "seller",
      status: "open",
      notes: "",
    });
    items.push({
      category: "Transaction Documents",
      item: "Assignment and Assumption Agreement (for assigned contracts and assumed liabilities)",
      responsible: "both",
      status: "open",
      notes: "",
    });
    items.push({
      category: "Transaction Documents",
      item: "Intellectual Property Assignment Agreement",
      responsible: "seller",
      status: "open",
      notes: "Separate assignment for each registered IP asset",
    });
  }

  if (isMerger) {
    items.push({
      category: "Transaction Documents",
      item: `Certificate of Merger (for filing with ${governingLaw} Secretary of State per DGCL Section 251(c))`,
      responsible: "both",
      status: "open",
      notes: "Must be filed on closing date; merger effective upon filing or at specified effective time",
    });
  }

  // ─── Corporate Approvals ───────────────────────────────
  if (isMerger) {
    items.push({
      category: "Corporate Approvals",
      item: "Certified copy of resolutions of the Board of Directors of Target Company approving the Merger (DGCL Section 251(b))",
      responsible: "seller",
      status: "open",
      notes: "Board must approve agreement of merger per DGCL Section 251(b)",
    });
    items.push({
      category: "Corporate Approvals",
      item: "Certified copy of stockholder approval of Target Company (DGCL Section 251(c)) — majority of outstanding shares entitled to vote, or written consent in lieu of meeting per DGCL Section 228",
      responsible: "seller",
      status: "open",
      notes: "Requires majority vote of outstanding stock unless charter requires supermajority. Written consent per DGCL § 228 may be used if permitted by certificate of incorporation.",
    });
    items.push({
      category: "Corporate Approvals",
      item: "Evidence of compliance with DGCL Section 262 appraisal rights notice requirements",
      responsible: "seller",
      status: "open",
      notes: "20-day notice to stockholders before meeting; notice of appraisal rights",
    });
  }

  if (isAsset) {
    items.push({
      category: "Corporate Approvals",
      item: "Certified copy of resolutions of the Board of Directors of Seller approving the asset sale",
      responsible: "seller",
      status: "open",
      notes: "",
    });
    items.push({
      category: "Corporate Approvals",
      item: "Certified copy of stockholder approval of Seller (DGCL Section 271) — if sale of substantially all assets",
      responsible: "seller",
      status: "open",
      notes: "Required if sale constitutes substantially all of Seller's assets per DGCL Section 271",
    });
  }

  if (isStock) {
    items.push({
      category: "Corporate Approvals",
      item: "Certified copy of resolutions of the Board of Directors of Target Company (if board approval required)",
      responsible: "seller",
      status: "open",
      notes: "",
    });
  }

  items.push({
    category: "Corporate Approvals",
    item: "Certified copy of resolutions of the Board of Directors of Buyer approving the transaction",
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  // ─── Officer Certificates ──────────────────────────────
  items.push({
    category: "Officer Certificates",
    item: "Officer's Certificate of Seller/Target — certifying accuracy of representations and compliance with covenants",
    responsible: "seller",
    status: "open",
    notes: "Bring-down certificate confirming reps are true as of Closing Date",
  });

  items.push({
    category: "Officer Certificates",
    item: "Secretary's Certificate of Seller/Target — certifying incumbency, organizational documents, and resolutions",
    responsible: "seller",
    status: "open",
    notes: "Attach copies of charter, bylaws, and board resolutions",
  });

  items.push({
    category: "Officer Certificates",
    item: "Officer's Certificate of Buyer — certifying accuracy of representations and compliance with covenants",
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Officer Certificates",
    item: "Secretary's Certificate of Buyer — certifying incumbency, organizational documents, and resolutions",
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  // ─── Good Standing Certificates ────────────────────────
  items.push({
    category: "Good Standing Certificates",
    item: `Good Standing Certificate of ${project.targetCompany} from ${project.targetState ?? governingLaw} Secretary of State (dated within 10 days of Closing)`,
    responsible: "seller",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Good Standing Certificates",
    item: "Good Standing Certificates of Target Company from each state where qualified to do business",
    responsible: "seller",
    status: "open",
    notes: "Dated within 10 days of Closing",
  });

  items.push({
    category: "Good Standing Certificates",
    item: `Good Standing Certificate of ${project.buyerName} from its state of organization`,
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  // ─── Legal Opinions ────────────────────────────────────
  items.push({
    category: "Legal Opinions",
    item: `Legal opinion of ${project.sellerCounsel ?? "Seller's counsel"} regarding Seller/Target authority, enforceability, non-violation, and corporate matters`,
    responsible: "seller",
    status: "open",
    notes: "Per ABA Legal Opinion Accord standards",
  });

  items.push({
    category: "Legal Opinions",
    item: `Legal opinion of ${project.buyerCounsel ?? "Buyer's counsel"} regarding Buyer authority, enforceability, and non-violation`,
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  // ─── Regulatory Approvals ──────────────────────────────
  if (project.hsrRequired) {
    items.push({
      category: "Regulatory Approvals",
      item: "HSR Act early termination letter or expiration of waiting period (30 days from filing; 15 days for cash tender offers)",
      responsible: "both",
      status: "open",
      notes: `HSR filing required under 15 U.S.C. Section 18a. 2026 size-of-transaction threshold: $119.5 million. Filing fee: ${project.hsrFilingFee ? formatCurrency(safeNumber(project.hsrFilingFee)) : "Per 2026 fee schedule"}.`,
    });

    items.push({
      category: "Regulatory Approvals",
      item: "Confirmation that no Second Request has been issued (or compliance with Second Request if issued)",
      responsible: "both",
      status: "open",
      notes: "Second Request extends waiting period — 30 days after substantial compliance with the Second Request (10 days for cash tender offers per 16 CFR 803.10(b)). Substantial compliance required; 30-day waiting period restarts upon certification of compliance.",
    });
  }

  const requiredApprovals = (Array.isArray(project.requiredApprovals) ? project.requiredApprovals : []) as string[];
  if (requiredApprovals.length > 0) {
    for (const approval of requiredApprovals) {
      items.push({
        category: "Regulatory Approvals",
        item: approval,
        responsible: "both",
        status: "open",
        notes: "",
      });
    }
  }

  items.push({
    category: "Regulatory Approvals",
    item: "Confirmation that no injunction, order, or legal proceeding prohibits the Closing",
    responsible: "both",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Regulatory Approvals",
    item: "CFIUS clearance (if applicable for foreign buyer) — 31 CFR Part 800; 31 CFR Part 802",
    responsible: "buyer",
    status: "open",
    notes: "Mandatory declaration required for covered transactions involving TID (critical technology, critical infrastructure, sensitive personal data) U.S. businesses per FIRRMA (31 CFR Part 802, effective Feb 13, 2020). Voluntary notice available for non-TID transactions. Penalties for failure to file mandatory declarations.",
  });

  items.push({
    category: "Regulatory Approvals",
    item: "Industry-specific regulatory approvals (if applicable)",
    responsible: "both",
    status: "open",
    notes: "Banking: OCC/FDIC/state approval. Healthcare: HIPAA review, state licenses. Telecom: FCC transfer approval. Defense: CFIUS + DCSA clearances. Verify requirements based on target's industry.",
  });

  // ─── Third-Party Consents ──────────────────────────────
  items.push({
    category: "Third-Party Consents",
    item: "List of all required third-party consents with status tracker",
    responsible: "seller",
    status: "open",
    notes: "Including landlord consents, customer/supplier consents, lender consents",
  });

  items.push({
    category: "Third-Party Consents",
    item: "Landlord consents for assignment of key leases",
    responsible: "seller",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Third-Party Consents",
    item: "Lender consents / payoff letters for existing indebtedness",
    responsible: "seller",
    status: "open",
    notes: "Including UCC termination statements",
  });

  items.push({
    category: "Third-Party Consents",
    item: "Consents for assignment of material contracts with change-of-control provisions",
    responsible: "seller",
    status: "open",
    notes: "",
  });

  // ─── Tax Deliverables ──────────────────────────────────
  if (isStock) {
    items.push({
      category: "Tax Deliverables",
      item: "FIRPTA Certificate (Section 1445 of the Internal Revenue Code) — certification that Seller is not a foreign person",
      responsible: "seller",
      status: "open",
      notes: "Distinguish: (1) Section 1445 withholding (15% of amount realized for direct USRPI dispositions), (2) Section 1446(f) withholding (10% for partnership interest transfers). Note USRPHC exemption path requires certification under Treas. Reg. 1.1445-2(b). If Seller cannot provide certificate, Buyer must withhold applicable percentage.",
    });
  }

  if (project.section338Election) {
    items.push({
      category: "Tax Deliverables",
      item: "Executed IRS Form 8023 (Elections Under Section 338 for Corporations Making Qualified Stock Purchases)",
      responsible: "both",
      status: "open",
      notes: "Must be filed by the 15th day of the 9th month following the month of acquisition (IRC Section 338(g)(2))",
    });
  }

  if (isAsset) {
    items.push({
      category: "Tax Deliverables",
      item: "Purchase Price Allocation Schedule per Section 1060 of the Code",
      responsible: "both",
      status: "open",
      notes: "Must be agreed within 90 days of Closing; IRS Form 8594 to be filed with tax returns",
    });

    items.push({
      category: "Tax Deliverables",
      item: "Bulk sales law compliance (if applicable in the Seller's jurisdiction)",
      responsible: "seller",
      status: "open",
      notes: "Check applicability under state law; some states have repealed bulk sales laws",
    });
  }

  items.push({
    category: "Tax Deliverables",
    item: "IRS Form W-9 from Seller (Taxpayer Identification Number)",
    responsible: "seller",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Tax Deliverables",
    item: "Pre-closing tax returns — confirmation that all required tax returns have been filed",
    responsible: "seller",
    status: "open",
    notes: "",
  });

  // ─── Funds Flow ────────────────────────────────────────
  items.push({
    category: "Closing Funds Flow",
    item: "Closing Funds Flow Memorandum (showing all payments, amounts, and wire instructions)",
    responsible: "both",
    status: "open",
    notes: purchasePrice ? `Total Purchase Price: ${formatCurrency(purchasePrice)}` : "",
  });

  items.push({
    category: "Closing Funds Flow",
    item: "Wire transfer instructions for all payees (Seller, escrow agent, advisors, payoff creditors)",
    responsible: "both",
    status: "open",
    notes: "",
  });

  if (project.escrowPercent) {
    const escrowPctCl = safeNumber(project.escrowPercent);
    const escrowAmt = purchasePrice * escrowPctCl;
    items.push({
      category: "Closing Funds Flow",
      item: `Escrow deposit funding — ${formatCurrency(escrowAmt)} (${(escrowPctCl * 100).toFixed(1)}% of Purchase Price)`,
      responsible: "buyer",
      status: "open",
      notes: `Held for ${project.escrowTermMonths ?? 12} months`,
    });
  }

  items.push({
    category: "Closing Funds Flow",
    item: "Confirmation of receipt of all funds by escrow agent and payees",
    responsible: "both",
    status: "open",
    notes: "",
  });

  // ─── Employee Matters ──────────────────────────────────
  if (project.keyEmployeeRetention) {
    items.push({
      category: "Employee Matters",
      item: "Executed key employee retention agreements",
      responsible: "seller",
      status: "open",
      notes: "As required by the Agreement",
    });
  }

  items.push({
    category: "Employee Matters",
    item: "Non-compete / non-solicitation agreements from key Seller principals",
    responsible: "seller",
    status: "open",
    notes: project.nonCompeteYears ? `${project.nonCompeteYears}-year non-compete` : "",
  });

  items.push({
    category: "Employee Matters",
    item: "WARN Act compliance analysis — 60-day notice for plant closings or mass layoffs (29 U.S.C. § 2101)",
    responsible: "both",
    status: "open",
    notes: "Required if 100+ employees and closing/layoff affects 50+ workers. Penalties: back pay up to 60 days + $500/day civil penalty. State mini-WARN acts may apply at lower thresholds: CA (75 employees, Cal. Lab. Code Section 1400), NY (50 employees, 90-day notice, NY Labor Law Art. 25-A), NJ (100 employees, 90-day notice, NJ WARN Act P.L. 2007, c.212), IL (75 employees, 60-day notice, IL WARN Act 820 ILCS 65).",
  });

  if (project.changeOfControlProvisions) {
    items.push({
      category: "Employee Matters",
      item: "Analysis of change-of-control provisions in employment agreements and benefit plans",
      responsible: "both",
      status: "open",
      notes: "Determine any golden parachute or acceleration payments triggered by transaction",
    });
  }

  // ─── Insurance ─────────────────────────────────────────
  if (project.rwiInsurance) {
    items.push({
      category: "Insurance",
      item: `Representations and Warranties Insurance Policy — bound and in effect as of Closing`,
      responsible: "buyer",
      status: "open",
      notes: `Premium: ${project.rwiPremiumPercent ? (safeNumber(project.rwiPremiumPercent) * 100).toFixed(1) + "% of policy limit" : "Per quote"}`,
    });
  }

  items.push({
    category: "Insurance",
    item: "Tail / run-off D&O insurance policy for pre-Closing acts of directors and officers",
    responsible: "seller",
    status: "open",
    notes: "Typically 6-year tail coverage. Align D&O tail period with applicable statute of limitations (Delaware: 3 years for fiduciary duty claims under 10 Del. C. Section 8106; fraud: 6 years).",
  });

  // ─── Post-Closing Deliverables ─────────────────────────
  items.push({
    category: "Post-Closing Deliverables",
    item: "Working capital true-up calculation (due within 60-90 days post-Closing)",
    responsible: "buyer",
    status: "open",
    notes: project.workingCapitalTarget ? `Target: ${formatCurrency(safeNumber(project.workingCapitalTarget))}` : "",
  });

  items.push({
    category: "Post-Closing Deliverables",
    item: "Update of company records and filings to reflect new ownership",
    responsible: "buyer",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Post-Closing Deliverables",
    item: "Employee communications and transition announcements",
    responsible: "both",
    status: "open",
    notes: "",
  });

  items.push({
    category: "Post-Closing Deliverables",
    item: "Customer and supplier notification letters",
    responsible: "both",
    status: "open",
    notes: "",
  });

  return items;
}

export function buildClosingChecklist(project: MAProjectFull): Document {
  const dateFormatted = formatDate(new Date());
  const checklist = buildChecklist(project);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Closing Checklist"));
  children.push(spacer(4));

  // Header info
  children.push(bodyText(`Transaction: ${project.name}`, { bold: true, color: COLORS.primary }));
  children.push(bodyText(`Target Company: ${project.targetCompany}`));
  children.push(bodyText(`Buyer: ${project.buyerName}`));
  children.push(bodyText(`Seller: ${project.sellerName}`));
  children.push(bodyText(`Date Prepared: ${dateFormatted}`));
  if (project.targetCloseDate) {
    children.push(bodyText(`Target Closing Date: ${formatDate(project.targetCloseDate)}`));
  }
  children.push(spacer(8));

  // Instructions
  children.push(sectionHeading("Instructions"));
  children.push(
    bodyText(
      "This Closing Checklist identifies all deliverables required for the closing of the transaction. Each item should be tracked as follows: (1) Responsible Party — Buyer, Seller, or Both; (2) Status — open, in progress, or complete; (3) Notes — any special instructions or deadlines.",
    ),
  );
  children.push(spacer(8));

  // Group by category and render tables
  const categories = [...new Set(checklist.map((c) => c.category))];

  for (const category of categories) {
    const categoryItems = checklist.filter((c) => c.category === category);

    children.push(sectionHeading(category));

    children.push(
      createTable(
        ["#", "Deliverable", "Responsible", "Status", "Notes"],
        categoryItems.map((item, i) => [
          String(i + 1),
          item.item,
          item.responsible === "both" ? "Both" : item.responsible.charAt(0).toUpperCase() + item.responsible.slice(1),
          "Open",
          item.notes,
        ]),
        { columnWidths: [5, 40, 12, 10, 33], alternateRows: true },
      ),
    );

    children.push(spacer(8));
  }

  // Summary
  children.push(sectionHeading("Summary"));
  children.push(
    createTable(
      ["Category", "Total Items", "Buyer", "Seller", "Both / Third Party"],
      categories.map((cat) => {
        const catItems = checklist.filter((c) => c.category === cat);
        return [
          cat,
          String(catItems.length),
          String(catItems.filter((i) => i.responsible === "buyer").length),
          String(catItems.filter((i) => i.responsible === "seller").length),
          String(catItems.filter((i) => i.responsible === "both" || i.responsible === "third_party").length),
        ];
      }),
      { columnWidths: [35, 15, 15, 15, 20], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      `Total Deliverables: ${checklist.length} | Buyer: ${checklist.filter((c) => c.responsible === "buyer").length} | Seller: ${checklist.filter((c) => c.responsible === "seller").length} | Both: ${checklist.filter((c) => c.responsible === "both").length}`,
      { bold: true },
    ),
  );

  return buildLegalDocument({
    title: "Closing Checklist",
    headerRight: `Closing Checklist — ${project.targetCompany}`,
    children,
  });
}
