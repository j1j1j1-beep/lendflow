// disclosure-schedules.ts
// Generates a DOCX Disclosure Schedules document for an M&A transaction.
// Organized by section number of the corresponding purchase agreement representation.
// Includes: general disclosure provision, templates for each schedule category.

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
  createTable,
  formatCurrency,
  formatDate,
  safeNumber,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, DisclosureSchedulesProse } from "../types";

export function buildDisclosureSchedules(
  project: MAProjectFull,
  prose: DisclosureSchedulesProse,
): Document {
  const dateFormatted = formatDate(new Date());
  const purchasePrice = safeNumber(project.purchasePrice);
  const isMerger = ["MERGER_FORWARD", "MERGER_REVERSE_TRIANGULAR", "MERGER_FORWARD_TRIANGULAR", "REVERSE_MERGER"].includes(project.transactionType);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Disclosure Schedules"));
  children.push(spacer(4));

  // Header
  children.push(
    bodyText(
      `These Disclosure Schedules (the "Schedules") are delivered by ${isMerger ? project.targetCompany : project.sellerName} ("Disclosing Party") to ${isMerger ? project.buyerName : project.buyerName} ("Recipient") in connection with the ${isMerger ? "Agreement and Plan of Merger" : "Purchase Agreement"} dated as of ${dateFormatted} (the "Agreement"), by and between ${project.buyerName} and ${isMerger ? project.targetCompany : project.sellerName}.`,
    ),
  );
  children.push(spacer(4));

  // Key Terms
  children.push(sectionHeading("Key Terms"));
  const termRows: Array<{ label: string; value: string }> = [
    { label: "Disclosing Party", value: isMerger ? project.targetCompany : project.sellerName },
    { label: "Recipient", value: project.buyerName },
    { label: "Target Company", value: project.targetCompany },
    { label: "Agreement Date", value: dateFormatted },
  ];
  if (purchasePrice) {
    termRows.push({ label: "Purchase Price", value: formatCurrency(purchasePrice) });
  }
  children.push(
    createTable(
      ["Term", "Value"],
      termRows.map((t) => [t.label, t.value]),
      { columnWidths: [40, 60], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // General Disclosure Provision
  children.push(sectionHeading("General Disclosure Provision"));
  children.push(bodyText(prose.generalDisclosureProvision));
  children.push(spacer(4));

  // Standard disclaimers (deterministic)
  children.push(
    bodyText(
      `Capitalized terms used but not defined herein shall have the meanings assigned to them in the Agreement. The section and subsection references in these Schedules correspond to the sections and subsections of the Agreement to which the disclosures relate. Nothing disclosed in these Schedules shall be deemed to constitute an admission by the Disclosing Party that any such disclosed item constitutes a material item, event, or condition, or that such item would result in a Material Adverse Change, or that such item is required to be disclosed under the Agreement.`,
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.1: Capitalization ──────────────────────
  children.push(sectionHeading("Schedule 3.1 — Capitalization"));
  children.push(bodyText(prose.capitalizationSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Class of Equity", "Authorized", "Issued & Outstanding", "Holder", "Percentage"],
      [
        ["[Class A Common Stock]", "[     ]", "[     ]", "[     ]", "[     ]%"],
        ["[Class B Common Stock]", "[     ]", "[     ]", "[     ]", "[     ]%"],
        ["[Preferred Stock]", "[     ]", "[     ]", "[     ]", "[     ]%"],
      ],
      { columnWidths: [25, 15, 20, 25, 15], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText("[Insert additional equity instruments: options, warrants, convertible notes, SAFEs, etc.]", { italic: true, color: COLORS.textGray }),
  );
  children.push(spacer(8));

  // ─── Schedule 3.2: Subsidiaries ────────────────────────
  children.push(sectionHeading("Schedule 3.2 — Subsidiaries"));
  children.push(bodyText(prose.subsidiariesSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Entity Name", "Jurisdiction", "Ownership %", "Type", "Status"],
      [
        ["[Subsidiary Name]", "[State/Country]", "[   ]%", "[LLC/Corp]", "[Active/Inactive]"],
      ],
      { columnWidths: [30, 20, 15, 15, 20], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.3: Material Contracts ──────────────────
  children.push(sectionHeading("Schedule 3.3 — Material Contracts"));
  children.push(bodyText(prose.materialContractsSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Contract", "Counterparty", "Date", "Term", "Value", "Change of Control?"],
      [
        ["[Description]", "[Party]", "[Date]", "[Term]", "[$Amount]", "[Yes/No]"],
      ],
      { columnWidths: [22, 18, 12, 12, 18, 18], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.4: Litigation ──────────────────────────
  children.push(sectionHeading("Schedule 3.4 — Litigation"));
  children.push(bodyText(prose.litigationSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Matter", "Parties", "Forum", "Date Filed", "Status", "Estimated Exposure"],
      [
        ["[Description]", "[Plaintiff v. Defendant]", "[Court/Tribunal]", "[Date]", "[Active/Resolved]", "[$Amount]"],
      ],
      { columnWidths: [22, 18, 15, 12, 15, 18], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.5: Intellectual Property ───────────────
  children.push(sectionHeading("Schedule 3.5 — Intellectual Property"));
  children.push(bodyText(prose.ipSchedule));
  children.push(spacer(4));
  children.push(bodyText("Registered Intellectual Property:", { bold: true }));
  children.push(
    createTable(
      ["Type", "Description / Title", "Registration No.", "Jurisdiction", "Status", "Expiration"],
      [
        ["[Patent/TM/Copyright]", "[Description]", "[Number]", "[Country]", "[Active/Pending]", "[Date]"],
      ],
      { columnWidths: [15, 25, 15, 15, 15, 15], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("IP Licenses:", { bold: true }));
  children.push(
    createTable(
      ["License", "Licensor/Licensee", "Type", "Term", "Royalty/Fee"],
      [
        ["[Description]", "[Party] (Inbound/Outbound)", "[Exclusive/Non-Exclusive]", "[Term]", "[$Amount]"],
      ],
      { columnWidths: [25, 25, 20, 15, 15], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.6: Real Property ───────────────────────
  children.push(sectionHeading("Schedule 3.6 — Real Property"));
  children.push(bodyText(prose.realPropertySchedule));
  children.push(spacer(4));
  children.push(bodyText("Owned Real Property:", { bold: true }));
  children.push(
    createTable(
      ["Address", "Legal Description", "Use", "Encumbrances", "Tax Assessment"],
      [
        ["[Address]", "[Legal Desc.]", "[Office/Warehouse/etc.]", "[Liens/Mortgages]", "[$Amount]"],
      ],
      { columnWidths: [25, 20, 15, 20, 20], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("Leased Real Property:", { bold: true }));
  children.push(
    createTable(
      ["Address", "Landlord", "Term", "Monthly Rent", "Expiration", "Renewal Options"],
      [
        ["[Address]", "[Landlord]", "[Term]", "[$Rent]", "[Date]", "[Options]"],
      ],
      { columnWidths: [20, 18, 12, 15, 15, 20], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.7: Environmental ───────────────────────
  children.push(sectionHeading("Schedule 3.7 — Environmental Matters"));
  children.push(bodyText(prose.environmentalSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Property", "Issue", "Status", "Remediation Required?", "Estimated Cost"],
      [
        ["[Address]", "[Description of condition]", "[Open/Resolved]", "[Yes/No]", "[$Amount]"],
      ],
      { columnWidths: [20, 30, 15, 18, 17], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.8: Tax ─────────────────────────────────
  children.push(sectionHeading("Schedule 3.8 — Tax Matters"));
  children.push(bodyText(prose.taxSchedule));
  children.push(spacer(4));
  children.push(bodyText("Open Tax Years:", { bold: true }));
  children.push(
    createTable(
      ["Jurisdiction", "Tax Type", "Open Years", "Audit Status", "Estimated Exposure"],
      [
        ["[Federal/State]", "[Income/Sales/Property]", "[Years]", "[None/In Progress]", "[$Amount]"],
      ],
      { columnWidths: [20, 20, 15, 25, 20], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.9: Insurance ───────────────────────────
  children.push(sectionHeading("Schedule 3.9 — Insurance"));
  children.push(bodyText(prose.insuranceSchedule));
  children.push(spacer(4));
  children.push(
    createTable(
      ["Policy Type", "Carrier", "Policy No.", "Limit", "Deductible", "Premium", "Expiration"],
      [
        ["[Type]", "[Carrier]", "[No.]", "[$Limit]", "[$Ded.]", "[$Premium]", "[Date]"],
      ],
      { columnWidths: [16, 14, 14, 14, 14, 14, 14], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // ─── Schedule 3.10: Employees and Benefits ─────────────
  children.push(sectionHeading("Schedule 3.10 — Employees and Benefits"));
  children.push(bodyText(prose.employeesSchedule));
  children.push(spacer(4));
  children.push(bodyText("Employee Benefit Plans:", { bold: true }));
  children.push(
    createTable(
      ["Plan Name", "Type", "Participants", "Employer Cost", "ERISA Covered?"],
      [
        ["[Plan Name]", "[Health/401k/Pension/etc.]", "[Count]", "[$Annual Cost]", "[Yes/No]"],
      ],
      { columnWidths: [25, 20, 15, 20, 20], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(bodyText("Employment Agreements:", { bold: true }));
  children.push(
    createTable(
      ["Employee", "Title", "Base Salary", "Bonus", "Non-Compete?", "Change of Control?"],
      [
        ["[Name]", "[Title]", "[$Salary]", "[$Bonus]", "[Yes/No]", "[Yes/No]"],
      ],
      { columnWidths: [20, 18, 15, 15, 16, 16], alternateRows: true },
    ),
  );
  children.push(spacer(8));

  // Final note
  children.push(sectionHeading("Certification"));
  children.push(
    bodyText(
      `The undersigned hereby certifies that, to the best of the undersigned's knowledge and belief, the foregoing Disclosure Schedules are true, correct, and complete in all material respects as of the date of the Agreement.`,
    ),
  );
  children.push(spacer(8));
  children.push(bodyText("DISCLOSING PARTY:", { bold: true, color: COLORS.primary }));
  children.push(spacer(4));
  children.push(bodyText("By: ________________________________________"));
  children.push(bodyText(`Name: ${isMerger ? project.targetCompany : project.sellerName}`));
  children.push(bodyText("Title: Authorized Signatory"));
  children.push(bodyText(`Date: ${dateFormatted}`));

  return buildLegalDocument({
    title: "Disclosure Schedules",
    headerRight: `Disclosure Schedules — ${project.targetCompany}`,
    children,
  });
}
