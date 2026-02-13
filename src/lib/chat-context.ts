// chat-context.ts
// Builds hermetically scoped context strings for the AI Document Assistant.
// Each module's context is isolated to the specific sub-type (loan program, fund type,
// transaction type, property type, report type). No cross-contamination of rules.

import { prisma } from "@/lib/db";
import { getLoanProgram, type LoanProgram } from "@/config/loan-programs";
import { buildProjectContext } from "@/documents/capital/generate-doc";
import { buildMAContext } from "@/documents/deals/generate-doc";
import { buildProjectContext as buildSyndicationContext } from "@/documents/syndication/generate-doc";
import { buildProjectContext as buildComplianceContext } from "@/documents/compliance/generate-doc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "[Amount TBD]";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Truncate text to a max character length with a marker. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "\n[... truncated]";
}

// ---------------------------------------------------------------------------
// Lending — build context from LoanProgram config (no existing builder)
// ---------------------------------------------------------------------------

interface LendingDeal {
  id: string;
  borrowerName: string;
  loanAmount: unknown; // Prisma Decimal
  loanProgramId: string | null;
  propertyAddress: string | null;
  status: string;
  generatedDocuments: Array<{
    docType: string;
    extractedText: string | null;
    complianceChecks: unknown;
  }>;
  propertyDetails: {
    address: string;
    city: string | null;
    state: string | null;
  } | null;
}

function buildLendingRulesContext(deal: LendingDeal, program: LoanProgram): string {
  const r = program.structuringRules;

  const lines: string[] = [
    `LOAN PROGRAM: ${program.name}`,
    `Category: ${program.category}`,
    `Description: ${program.description}`,
    "",
    "STRUCTURING RULES:",
    `Max LTV: ${pct(r.maxLtv)}`,
    `Min DSCR: ${r.minDscr}`,
    `Max DTI: ${pct(r.maxDti)}`,
    `Base Rate: ${r.baseRate}`,
    `Spread Range: ${pct(r.spreadRange[0])} - ${pct(r.spreadRange[1])}`,
    `Max Term: ${r.maxTerm} months`,
    `Max Amortization: ${r.maxAmortization} months`,
    `Max Loan Amount: ${r.maxLoanAmount ? formatCurrency(r.maxLoanAmount) : "No cap"}`,
    `Prepayment Penalty: ${r.prepaymentPenalty ? "Yes" : "No"}`,
    `Interest Only: ${r.interestOnly ? "Yes" : "No"}`,
    "",
    "APPLICABLE REGULATIONS:",
    ...program.applicableRegulations.map((reg) => `- ${reg}`),
    "",
    "STANDARD COVENANTS:",
    ...program.standardCovenants.map((cov) =>
      `- ${cov.name}: ${cov.description}${cov.threshold != null ? ` (threshold: ${cov.threshold}, frequency: ${cov.frequency})` : ` (frequency: ${cov.frequency})`}`,
    ),
    "",
    "STANDARD FEES:",
    ...program.standardFees.map((fee) =>
      `- ${fee.name}: ${fee.type === "percent" ? pct(fee.value) : formatCurrency(fee.value)} — ${fee.description}`,
    ),
    "",
    "DEAL DATA:",
    `Borrower: ${deal.borrowerName}`,
    `Loan Amount: ${deal.loanAmount != null ? formatCurrency(Number(deal.loanAmount)) : "Not specified"}`,
  ];

  if (deal.propertyDetails) {
    const pd = deal.propertyDetails;
    lines.push(`Property: ${pd.address}${pd.city ? `, ${pd.city}` : ""}${pd.state ? `, ${pd.state}` : ""}`);
  } else if (deal.propertyAddress) {
    lines.push(`Property: ${deal.propertyAddress}`);
  }

  lines.push(`Status: ${deal.status}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Compliance checks extractor
// ---------------------------------------------------------------------------

interface ComplianceCheckResult {
  name: string;
  passed: boolean;
  note?: string;
  regulation?: string;
}

function formatComplianceChecks(
  docs: Array<{ docType: string; complianceChecks: unknown }>,
): string {
  const entries: string[] = [];
  for (const doc of docs) {
    if (!doc.complianceChecks || !Array.isArray(doc.complianceChecks)) continue;
    const checks = doc.complianceChecks as ComplianceCheckResult[];
    for (const check of checks) {
      const status = check.passed ? "PASSED" : "FAILED";
      const reg = check.regulation ? ` [${check.regulation}]` : "";
      const note = check.note ? ` — ${check.note}` : "";
      entries.push(`- [${status}] ${check.name}${reg}${note} (doc: ${doc.docType})`);
    }
  }
  if (entries.length === 0) {
    return "No compliance check results available yet.";
  }
  return entries.join("\n");
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function buildChatContext(
  module: "lending" | "capital" | "ma" | "syndication" | "compliance",
  projectId: string,
): Promise<string> {
  // 1. Load source documents (shared across all modules)
  const sourceDocs = await prisma.sourceDocument.findMany({
    where: { module, projectId, deletedAt: null },
    select: { docType: true, ocrText: true, fileName: true },
  });

  // Route to module-specific builder
  switch (module) {
    case "lending":
      return buildLendingChatContext(projectId, sourceDocs);
    case "capital":
      return buildCapitalChatContext(projectId, sourceDocs);
    case "ma":
      return buildMAChatContext(projectId, sourceDocs);
    case "syndication":
      return buildSyndicationChatContext(projectId, sourceDocs);
    case "compliance":
      return buildComplianceChatContext(projectId, sourceDocs);
  }
}

// ---------------------------------------------------------------------------
// Source doc type
// ---------------------------------------------------------------------------

interface SourceDocRow {
  docType: string | null;
  ocrText: string | null;
  fileName: string;
}

// ---------------------------------------------------------------------------
// Lending
// ---------------------------------------------------------------------------

async function buildLendingChatContext(
  projectId: string,
  sourceDocs: SourceDocRow[],
): Promise<string> {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      generatedDocuments: true,
      propertyDetails: true,
    },
  });

  const program = deal.loanProgramId ? getLoanProgram(deal.loanProgramId) : undefined;
  const subTypeLabel = program?.name ?? deal.loanProgramId ?? "Unknown loan program";

  // Build rules section
  const rulesSection = program
    ? buildLendingRulesContext(deal as unknown as LendingDeal, program)
    : `LOAN PROGRAM: ${deal.loanProgramId ?? "Not set"}\nNo program-specific rules available.`;

  // Compliance checks from generated docs
  const complianceSection = formatComplianceChecks(
    deal.generatedDocuments.map((d) => ({
      docType: d.docType,
      complianceChecks: d.complianceChecks,
    })),
  );

  // Generated documents text
  const genDocsSection = buildGeneratedDocsSection(
    deal.generatedDocuments.map((d) => ({
      docType: d.docType,
      extractedText: d.extractedText,
    })),
  );

  // Source documents text
  const sourceDocsSection = buildSourceDocsSection(sourceDocs);

  return assembleContext("Lending", subTypeLabel, "loan programs", rulesSection, complianceSection, genDocsSection, sourceDocsSection);
}

// ---------------------------------------------------------------------------
// Capital
// ---------------------------------------------------------------------------

async function buildCapitalChatContext(
  projectId: string,
  sourceDocs: SourceDocRow[],
): Promise<string> {
  const project = await prisma.capitalProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { capitalDocuments: true, capitalInvestors: true },
  });

  const subTypeLabel = project.fundType ?? "Unknown fund type";
  const rulesSection = buildProjectContext(project);

  // Capital docs store compliance results in complianceIssues (Json?)
  const complianceSection = formatComplianceChecks(
    project.capitalDocuments.map((d) => ({
      docType: d.docType,
      complianceChecks: d.complianceIssues,
    })),
  );

  const genDocsSection = buildGeneratedDocsSection(
    project.capitalDocuments.map((d) => ({
      docType: d.docType,
      extractedText: d.extractedText,
    })),
  );

  const sourceDocsSection = buildSourceDocsSection(sourceDocs);

  return assembleContext("Capital", subTypeLabel, "fund types", rulesSection, complianceSection, genDocsSection, sourceDocsSection);
}

// ---------------------------------------------------------------------------
// Deals/MA
// ---------------------------------------------------------------------------

async function buildMAChatContext(
  projectId: string,
  sourceDocs: SourceDocRow[],
): Promise<string> {
  const project = await prisma.mAProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { maDocuments: true },
  });

  const transactionTypeLabels: Record<string, string> = {
    STOCK_PURCHASE: "Stock Purchase",
    ASSET_PURCHASE: "Asset Purchase",
    MERGER_FORWARD: "Forward Merger",
    MERGER_REVERSE_TRIANGULAR: "Reverse Triangular Merger",
    MERGER_FORWARD_TRIANGULAR: "Forward Triangular Merger",
    REVERSE_MERGER: "Reverse Merger",
    TENDER_OFFER: "Tender Offer",
    SECTION_363_SALE: "Section 363 Bankruptcy Sale",
  };
  const subTypeLabel = transactionTypeLabels[project.transactionType] ?? project.transactionType;
  const rulesSection = buildMAContext(project);

  // MA docs store compliance results in complianceIssues (Json?)
  const complianceSection = formatComplianceChecks(
    project.maDocuments.map((d) => ({
      docType: d.docType,
      complianceChecks: d.complianceIssues,
    })),
  );

  const genDocsSection = buildGeneratedDocsSection(
    project.maDocuments.map((d) => ({
      docType: d.docType,
      extractedText: d.extractedText,
    })),
  );

  const sourceDocsSection = buildSourceDocsSection(sourceDocs);

  return assembleContext("Deals/M&A", subTypeLabel, "transaction types", rulesSection, complianceSection, genDocsSection, sourceDocsSection);
}

// ---------------------------------------------------------------------------
// Syndication
// ---------------------------------------------------------------------------

async function buildSyndicationChatContext(
  projectId: string,
  sourceDocs: SourceDocRow[],
): Promise<string> {
  const project = await prisma.syndicationProject.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      syndicationDocuments: true,
      waterfallTiers: true,
      syndicationInvestors: true,
    },
  });

  const subTypeLabel = project.propertyType ?? "Unknown property type";
  const rulesSection = buildSyndicationContext(project);

  // Syndication docs store compliance results in complianceIssues (Json?)
  const complianceSection = formatComplianceChecks(
    project.syndicationDocuments.map((d) => ({
      docType: d.docType,
      complianceChecks: d.complianceIssues,
    })),
  );

  const genDocsSection = buildGeneratedDocsSection(
    project.syndicationDocuments.map((d) => ({
      docType: d.docType,
      extractedText: d.extractedText,
    })),
  );

  const sourceDocsSection = buildSourceDocsSection(sourceDocs);

  return assembleContext("Syndication", subTypeLabel, "property types", rulesSection, complianceSection, genDocsSection, sourceDocsSection);
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

async function buildComplianceChatContext(
  projectId: string,
  sourceDocs: SourceDocRow[],
): Promise<string> {
  const project = await prisma.complianceProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { complianceDocuments: true },
  });

  const subTypeLabel = project.reportType ?? "Unknown report type";
  const rulesSection = buildComplianceContext(project);

  // Compliance docs store compliance results in complianceIssues (Json?)
  const complianceSection = formatComplianceChecks(
    project.complianceDocuments.map((d) => ({
      docType: d.docType,
      complianceChecks: d.complianceIssues,
    })),
  );

  const genDocsSection = buildGeneratedDocsSection(
    project.complianceDocuments.map((d) => ({
      docType: d.docType,
      extractedText: d.extractedText,
    })),
  );

  const sourceDocsSection = buildSourceDocsSection(sourceDocs);

  return assembleContext("Compliance", subTypeLabel, "report types", rulesSection, complianceSection, genDocsSection, sourceDocsSection);
}

// ---------------------------------------------------------------------------
// Shared section builders
// ---------------------------------------------------------------------------

function buildGeneratedDocsSection(
  docs: Array<{ docType: string; extractedText: string | null }>,
): string {
  const withText = docs.filter((d) => d.extractedText);
  if (withText.length === 0) {
    if (docs.length > 0) {
      return "Documents have been generated but text is not yet available. The user may need to regenerate documents to enable full document chat.";
    }
    return "No generated documents yet.";
  }
  return withText
    .map((d) => `--- ${d.docType} ---\n${d.extractedText}`)
    .join("\n\n");
}

function buildSourceDocsSection(sourceDocs: SourceDocRow[]): string {
  const withText = sourceDocs.filter((d) => d.ocrText);
  if (withText.length === 0) {
    if (sourceDocs.length > 0) {
      return "Source documents have been uploaded but OCR text is not yet available.";
    }
    return "No source documents uploaded.";
  }
  return withText
    .map((d) => {
      const label = d.docType ?? d.fileName;
      return `--- ${label} ---\n${truncate(d.ocrText!, 12_000)}`;
    })
    .join("\n\n");
}

function assembleContext(
  moduleName: string,
  subTypeLabel: string,
  subTypeCategory: string,
  rulesSection: string,
  complianceSection: string,
  genDocsSection: string,
  sourceDocsSection: string,
): string {
  return `You are a legal document assistant for OpenShut, a PE/family office legal document automation platform.
You are assisting with a ${moduleName} project. This is a ${subTypeLabel} project.

IMPORTANT: Only answer based on the documents, rules, and project data provided below.
Do not reference rules for other ${subTypeCategory}. If asked about something outside this project's scope, say so clearly.
When citing specific numbers, clauses, or terms, reference the exact document and section.

=== PROJECT DATA & LEGAL RULES ===
${rulesSection}

=== COMPLIANCE CHECK RESULTS ===
${complianceSection}

=== GENERATED DOCUMENTS ===
${genDocsSection}

=== SOURCE DOCUMENTS (Uploaded) ===
${sourceDocsSection}`;
}
