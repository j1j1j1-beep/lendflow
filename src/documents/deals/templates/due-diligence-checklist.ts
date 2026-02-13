// due-diligence-checklist.ts
// Generates a DOCX Due Diligence Checklist for an M&A transaction.
// Entirely deterministic — no AI needed.
// Categories: corporate organization, capitalization, financial statements,
// material contracts, litigation, IP, real property, environmental,
// employees/benefits, tax, insurance, regulatory, customers/suppliers, IT systems.

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
  formatDate,
  COLORS,
} from "@/documents/doc-helpers";

import type { MAProjectFull, DueDiligenceChecklistItem } from "../types";

/**
 * Build the complete due diligence checklist organized by category.
 */
function buildChecklist(project: MAProjectFull): DueDiligenceChecklistItem[] {
  const items: DueDiligenceChecklistItem[] = [];

  // ─── Corporate Organization ────────────────────────────
  const corporateItems = [
    "Certificate of incorporation / articles of organization and all amendments",
    "Bylaws / operating agreement and all amendments",
    "Good standing certificates from state of incorporation and all foreign jurisdictions",
    "Minutes of board of directors / managers meetings (last 3 years)",
    "Minutes of stockholder / member meetings (last 3 years)",
    "Written consents of board and stockholders (last 3 years)",
    "Organizational chart showing all subsidiaries and affiliates",
    "List of jurisdictions where company is qualified to do business",
    "List of all directors, officers, and managers (current and former within 3 years)",
    "List of all registered agents",
    "Fictitious name / DBA filings",
    "Joint venture, partnership, or strategic alliance agreements",
  ];
  for (const item of corporateItems) {
    items.push({ category: "Corporate Organization", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Capitalization ────────────────────────────────────
  const capItems = [
    "Cap table / equity ownership schedule showing all classes of equity",
    "Stock certificates / unit certificates (or book-entry records)",
    "Stock transfer ledger / member register",
    "Stock option plans, restricted stock plans, and other equity incentive plans",
    "Outstanding options, warrants, convertible notes, SAFEs, or other equity-linked instruments",
    "Stockholder agreements, voting agreements, or voting trusts",
    "Right of first refusal, co-sale, or preemptive rights agreements",
    "Registration rights agreements",
    "Anti-dilution protection agreements",
    "All securities issuance documents (subscription agreements, purchase agreements)",
    "Blue sky filings and SEC filings (Form D, etc.)",
    "Section 83(b) election filings for restricted stock grants",
  ];
  for (const item of capItems) {
    items.push({ category: "Capitalization", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Financial Statements ──────────────────────────────
  const financialItems = [
    "Audited financial statements (last 3 fiscal years)",
    "Unaudited interim financial statements (current year-to-date, monthly)",
    "Management letters from auditors (last 3 years)",
    "Annual budgets and financial projections (last 3 years and forward projections)",
    "Accounts receivable aging schedule (current)",
    "Accounts payable aging schedule (current)",
    "Schedule of all indebtedness (including intercompany loans)",
    "Breakdown of revenue by product/service line, geography, and customer",
    "EBITDA reconciliation and adjustments schedule",
    "Working capital calculation methodology and historical analysis",
    "Capital expenditure schedule (last 3 years and budgeted)",
    "Schedule of off-balance sheet liabilities and commitments",
    "Inventory valuation methodology and reserves",
    "Deferred revenue schedule",
    "Schedule of all bank accounts and authorized signatories",
  ];
  for (const item of financialItems) {
    items.push({ category: "Financial Statements", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Material Contracts ────────────────────────────────
  const contractItems = [
    "List of all material contracts (revenue >$100K or strategic significance)",
    "Customer contracts (top 20 by revenue)",
    "Supplier / vendor contracts (top 20 by spend)",
    "Distribution, licensing, and channel partner agreements",
    "Government contracts and subcontracts",
    "Contracts with related parties or affiliates",
    "Contracts containing change-of-control provisions",
    "Contracts containing non-compete, exclusivity, or most-favored-nation provisions",
    "Contracts with minimum purchase or volume commitments",
    "Contracts requiring consent for assignment",
    "Guarantees, indemnities, and suretyship agreements",
    "Powers of attorney",
    "Letters of intent or pending contract negotiations",
  ];
  for (const item of contractItems) {
    items.push({ category: "Material Contracts", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Litigation ────────────────────────────────────────
  const litigationItems = [
    "Schedule of all pending or threatened litigation, arbitration, or mediation",
    "Schedule of all settled or resolved disputes (last 5 years)",
    "Copies of all outstanding judgments, decrees, or orders",
    "Consent decrees or settlement agreements with continuing obligations",
    "Government investigations or inquiries (pending or concluded within 5 years)",
    "Product liability claims or recalls",
    "Correspondence with regulators regarding investigations or enforcement",
    "Schedule of all threatened or asserted claims not yet in litigation",
    "Legal expense analysis (last 3 years by matter)",
    "Insurance coverage opinions for pending matters",
  ];
  for (const item of litigationItems) {
    items.push({ category: "Litigation", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Intellectual Property ─────────────────────────────
  const ipItems = [
    "Schedule of all patents (issued and pending applications)",
    "Schedule of all trademarks (registered and common law)",
    "Schedule of all copyrights (registered)",
    "Schedule of all domain names",
    "Trade secret protection program documentation",
    "IP assignment agreements from founders, employees, and contractors",
    "IP licenses granted to third parties (outbound)",
    "IP licenses received from third parties (inbound)",
    "Open source software inventory and license compliance analysis",
    "Freedom-to-operate opinions or clearance searches",
    "IP infringement claims (received or threatened) or assertions against third parties",
    "Prior art search results for key patents",
    "Schedule of all software (proprietary and third-party)",
  ];
  for (const item of ipItems) {
    items.push({ category: "Intellectual Property", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Real Property ─────────────────────────────────────
  const realPropertyItems = [
    "Schedule of all owned real property (with legal descriptions)",
    "Deeds, title policies, and surveys for owned property",
    "Schedule of all leased property (with key terms)",
    "Copies of all lease agreements and amendments",
    "Lease termination or renewal notices",
    "Tenant improvement agreements",
    "Subleases and assignments",
    "Zoning and land use permits and compliance certificates",
    "Property tax assessments and payment history",
    "Maintenance and capital improvement records",
    "Appraisals (last 3 years)",
  ];
  for (const item of realPropertyItems) {
    items.push({ category: "Real Property", item, status: "open", priority: "medium", assignedTo: "" });
  }

  // ─── Environmental ─────────────────────────────────────
  const envItems = [
    "Phase I Environmental Site Assessments (all properties)",
    "Phase II Environmental Site Assessments (if conducted)",
    "Environmental permits and compliance records",
    "Hazardous materials inventory and handling procedures",
    "Underground storage tank registrations and inspection reports",
    "Notices of violation or enforcement actions from environmental agencies",
    "Environmental remediation reports and ongoing monitoring data",
    "Environmental insurance policies",
    "Asbestos, lead paint, or mold inspection reports",
    "CERCLA / Superfund correspondence",
  ];
  for (const item of envItems) {
    items.push({ category: "Environmental", item, status: "open", priority: "medium", assignedTo: "" });
  }

  // ─── Employees and Benefits ────────────────────────────
  const employeeItems = [
    "Employee census (names, titles, hire dates, compensation, benefits, work location)",
    "Employment agreements (executives, key employees)",
    "Independent contractor / consultant agreements",
    "Employee handbook / policies manual",
    "Non-compete, non-solicitation, and confidentiality agreements",
    "Change-of-control / severance agreements and plans",
    "Bonus, incentive, and commission plans",
    "Schedule of all employee benefit plans (health, dental, vision, life, disability, 401(k))",
    "ERISA compliance documentation and filings (Form 5500)",
    "Pension plan actuarial reports and funding status",
    "Workers' compensation claims history (last 5 years)",
    "OSHA citations and safety records",
    "Union / collective bargaining agreements",
    "Pending or threatened labor disputes, grievances, or unfair labor practice charges",
    "I-9 compliance and immigration records",
    "Organizational chart with reporting structure",
    "Key employee retention plan / agreements",
  ];
  for (const item of employeeItems) {
    items.push({ category: "Employees and Benefits", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Tax ───────────────────────────────────────────────
  const taxItems = [
    "Federal income tax returns (last 3 years, including all schedules)",
    "State and local income / franchise tax returns (last 3 years)",
    "Sales and use tax returns (last 3 years)",
    "Payroll tax returns (last 3 years)",
    "Property tax returns and assessments",
    "Schedule of all open tax years and statute of limitations status",
    "IRS audit reports and correspondence (last 5 years)",
    "State tax audit reports and correspondence (last 5 years)",
    "Tax sharing or tax allocation agreements",
    "Schedule of net operating losses and other tax attributes",
    "Transfer pricing documentation (if applicable)",
    "Tax opinions or ruling requests",
    "Section 382 / ownership change analysis (if applicable)",
    "QSBS qualification analysis (Section 1202, if applicable)",
    "Sales tax nexus analysis",
    "1099 / W-2 compliance",
  ];
  for (const item of taxItems) {
    items.push({ category: "Tax", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── Insurance ─────────────────────────────────────────
  const insuranceItems = [
    "Schedule of all insurance policies (types, carriers, limits, deductibles, premiums)",
    "General liability insurance",
    "Directors and officers (D&O) insurance",
    "Employment practices liability insurance (EPLI)",
    "Cyber / data breach insurance",
    "Property insurance",
    "Product liability insurance",
    "Professional liability / errors and omissions insurance",
    "Workers' compensation insurance",
    "Key man / key person insurance",
    "Claims history (last 5 years) for all policies",
    "Notice of any pending or denied claims",
    "Tail coverage requirements analysis",
  ];
  for (const item of insuranceItems) {
    items.push({ category: "Insurance", item, status: "open", priority: "medium", assignedTo: "" });
  }

  // ─── Regulatory Compliance ─────────────────────────────
  const regulatoryItems = [
    "Licenses, permits, and governmental authorizations",
    "Regulatory correspondence and filings (last 3 years)",
    "Regulatory examination reports and findings",
    "Data privacy and security program documentation (GDPR, CCPA, HIPAA if applicable)",
    "Anti-corruption / FCPA compliance program",
    "Export control and sanctions compliance (OFAC, EAR, ITAR)",
    "Antitrust / competition law compliance",
    "Industry-specific regulatory compliance documentation",
    "AML / KYC program documentation (if applicable)",
    "Consumer protection compliance",
    "Accessibility compliance (ADA, WCAG)",
  ];
  for (const item of regulatoryItems) {
    items.push({ category: "Regulatory Compliance", item, status: "open", priority: "medium", assignedTo: "" });
  }

  // ─── Customers and Suppliers ───────────────────────────
  const customerItems = [
    "Top 20 customers by revenue (with revenue breakdown, contract terms, tenure)",
    "Customer concentration analysis (any customer >10% of revenue)",
    "Customer churn / retention analysis (last 3 years)",
    "Top 20 suppliers / vendors by spend",
    "Supplier concentration analysis (any supplier >10% of COGS)",
    "Sole-source supplier dependencies",
    "Customer or supplier disputes (current or last 3 years)",
    "Warranty claims and product return rates",
    "Backlog and pipeline analysis",
    "Pricing agreements with volume discounts or rebates",
  ];
  for (const item of customerItems) {
    items.push({ category: "Customers and Suppliers", item, status: "open", priority: "high", assignedTo: "" });
  }

  // ─── IT Systems ────────────────────────────────────────
  const itItems = [
    "IT infrastructure overview (servers, cloud, network architecture)",
    "Software systems inventory (ERP, CRM, accounting, HR, etc.)",
    "Cybersecurity assessment / penetration test results (most recent)",
    "Data backup and disaster recovery plans",
    "Service level agreements (SLAs) for critical systems",
    "IT vendor contracts and licensing agreements",
    "Data processing agreements and privacy impact assessments",
    "Incident response plan and breach history",
    "SOC 2 / ISO 27001 audit reports (if applicable)",
    "Technology roadmap and planned capital expenditures",
    "Website and mobile app terms of service and privacy policy",
  ];
  for (const item of itItems) {
    items.push({ category: "IT Systems", item, status: "open", priority: "medium", assignedTo: "" });
  }

  return items;
}

export function buildDueDiligenceChecklist(project: MAProjectFull): Document {
  const dateFormatted = formatDate(new Date());
  const checklist = buildChecklist(project);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(documentTitle("Due Diligence Checklist"));
  children.push(spacer(4));

  // Header info
  children.push(bodyText(`Transaction: ${project.name}`, { bold: true, color: COLORS.primary }));
  children.push(bodyText(`Target Company: ${project.targetCompany}`));
  children.push(bodyText(`Buyer: ${project.buyerName}`));
  children.push(bodyText(`Seller: ${project.sellerName}`));
  children.push(bodyText(`Date Prepared: ${dateFormatted}`));
  if (project.dueDiligenceDays) {
    children.push(bodyText(`Due Diligence Period: ${project.dueDiligenceDays} days`));
  }
  children.push(spacer(8));

  // Instructions
  children.push(sectionHeading("Instructions"));
  children.push(
    bodyText(
      "This Due Diligence Checklist identifies the categories and specific items of information to be reviewed in connection with the proposed acquisition. Each item should be tracked as follows: (1) Assigned To — the individual responsible for obtaining or reviewing the item; (2) Status — open, in progress, received, reviewed, or N/A; (3) Priority — high, medium, or low. Items marked as high priority should be addressed first.",
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
        ["#", "Item", "Priority", "Status", "Assigned To"],
        categoryItems.map((item, i) => [
          String(i + 1),
          item.item,
          item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
          "Open",
          "",
        ]),
        { columnWidths: [6, 52, 12, 12, 18], alternateRows: true },
      ),
    );

    children.push(spacer(8));
  }

  // Summary
  children.push(sectionHeading("Summary"));
  children.push(
    createTable(
      ["Category", "Total Items", "High Priority"],
      categories.map((cat) => {
        const items = checklist.filter((c) => c.category === cat);
        const highPriority = items.filter((i) => i.priority === "high").length;
        return [cat, String(items.length), String(highPriority)];
      }),
      { columnWidths: [50, 25, 25], alternateRows: true },
    ),
  );
  children.push(spacer(4));
  children.push(
    bodyText(
      `Total Items: ${checklist.length} | High Priority: ${checklist.filter((c) => c.priority === "high").length} | Medium Priority: ${checklist.filter((c) => c.priority === "medium").length} | Low Priority: ${checklist.filter((c) => c.priority === "low").length}`,
      { bold: true },
    ),
  );

  return buildLegalDocument({
    title: "Due Diligence Checklist",
    headerRight: `DD Checklist — ${project.targetCompany}`,
    children,
  });
}
