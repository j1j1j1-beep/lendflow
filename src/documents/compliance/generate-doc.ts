// generate-doc.ts
// Compliance module: dispatches to individual template builders.
// Each template calls the AI for prose (where needed), then builds a DOCX document.
// All financial numbers come from project data — AI writes ONLY prose sections.
// Unlike other modules, Compliance generates ONLY the single document matching the reportType.

import { Packer } from "docx";
import type { ComplianceProjectFull, ComplianceCheck } from "./types";
import { COMPLIANCE_DOC_TYPE_LABELS } from "./types";
import {
  buildLegalDocument,
  prependToDocument,
  pendingDocNotices,
  documentTitle,
  bodyText,
  formatCurrency,
  safeNumber,
} from "../doc-helpers";
import { SOURCE_DOCS } from "@/lib/source-doc-types";

// Map internal docType keys to output doc labels used in source doc definitions
const DOC_TYPE_TO_OUTPUT_LABEL: Record<string, string> = {
  lp_quarterly_report: "LP Quarterly Report",
  capital_call_notice: "Capital Call Notice",
  distribution_notice: "Distribution Notice",
  k1_summary: "K-1 Summary",
  annual_report: "Annual Report",
  form_adv_summary: "Form ADV Summary",
};

// Template builders
import { buildLPQuarterlyReport, runLPReportComplianceChecks } from "./templates/lp-quarterly-report";
import { buildCapitalCallNotice, runCapitalCallComplianceChecks } from "./templates/capital-call-notice";
import { buildDistributionNotice, runDistributionComplianceChecks } from "./templates/distribution-notice";
import { buildK1Summary, runK1ComplianceChecks } from "./templates/k1-summary";
import { buildAnnualReport, runAnnualReportComplianceChecks } from "./templates/annual-report";
import { buildFormADVSummary, runFormADVComplianceChecks } from "./templates/form-adv-summary";

// ─── Source Doc Content (module-level var) ───────────────────────────

let _sourceDocContent: Record<string, string> = {};

/** Set extracted source doc content before generation. Called by Inngest pipeline. */
export function setComplianceSourceDocContent(content: Record<string, string>) {
  _sourceDocContent = content;
}

// ─── Source Doc Content Helper ────────────────────────────────────────

/** Append extracted source doc content to a context string for AI prompts. */
function appendSourceDocContent(
  context: string,
  sourceDocContent: Record<string, string>,
): string {
  const entries = Object.entries(sourceDocContent);
  if (entries.length === 0) return context;

  const sourceBlock = entries
    .map(([docType, text]) => {
      const truncated = text.length > 8000 ? text.slice(0, 8000) + "\n[... truncated]" : text;
      return `\nSOURCE DOCUMENT — ${docType}:\n${truncated}`;
    })
    .join("\n");
  return context + "\n\n" + sourceBlock;
}

// ─── Project Context Builder ─────────────────────────────────────────

/** Builds a context string from project data for AI prompts.
 *  If sourceDocContent is provided, extracted OCR text from uploaded source docs
 *  is appended so the AI can reference real data in its prose. */
export function buildProjectContext(
  project: ComplianceProjectFull,
  sourceDocContent: Record<string, string> = _sourceDocContent,
): string {
  const nav = project.nav ? Number(project.nav) : 0;
  const totalContributions = project.totalContributions ? Number(project.totalContributions) : 0;
  const totalDistributions = project.totalDistributions ? Number(project.totalDistributions) : 0;
  const fundSize = project.fundSize ? Number(project.fundSize) : 0;
  const callAmount = project.callAmount ? Number(project.callAmount) : 0;
  const distributionAmount = project.distributionAmount ? Number(project.distributionAmount) : 0;
  const unfundedCommitments = project.unfundedCommitments ? Number(project.unfundedCommitments) : 0;

  // Compute performance metrics deterministically
  const tvpi = totalContributions > 0 ? (totalDistributions + nav) / totalContributions : 0;
  const dpi = totalContributions > 0 ? totalDistributions / totalContributions : 0;
  const rvpi = totalContributions > 0 ? nav / totalContributions : 0;

  const portfolioSummary = Array.isArray(project.portfolioSummary) ? project.portfolioSummary as Array<Record<string, unknown>> : null;
  const portfolioBlock = portfolioSummary
    ? portfolioSummary.map((p) =>
        `  - ${p.company}: Cost ${formatCurrency(Number(p.cost ?? 0))}, FV ${formatCurrency(Number(p.fairValue ?? 0))}, Status: ${p.status ?? "unrealized"}`
      ).join("\n")
    : "  No portfolio data provided";

  const context = `FUND DETAILS (source of truth — use these exact terms):
Fund Name: ${project.fundName}
Fund Type: ${project.fundType ?? "Not specified"}
Vintage Year: ${project.vintageYear ?? "Not specified"}
Fund Size: ${formatCurrency(fundSize)}

REPORTING PERIOD:
Period Start: ${project.periodStart ? project.periodStart.toISOString().split("T")[0] : "Not specified"}
Period End: ${project.periodEnd ? project.periodEnd.toISOString().split("T")[0] : "Not specified"}
Reporting Quarter: ${project.reportingQuarter ?? "Not specified"}

FUND METRICS:
NAV: ${formatCurrency(nav)}
Total Contributions: ${formatCurrency(totalContributions)}
Total Distributions: ${formatCurrency(totalDistributions)}
Net IRR: ${project.netIrr !== null ? (safeNumber(project.netIrr) * 100).toFixed(2) + "%" : "Not calculated"}
Gross IRR: ${project.grossIrr !== null ? (safeNumber(project.grossIrr) * 100).toFixed(2) + "%" : "Not calculated"}
TVPI (computed): ${tvpi.toFixed(3)}x
DPI (computed): ${dpi.toFixed(3)}x
RVPI (computed): ${rvpi.toFixed(3)}x
MOIC: ${project.moic !== null ? safeNumber(project.moic).toFixed(3) + "x" : "N/A"}

CAPITAL CALL DATA:
Call Amount: ${formatCurrency(callAmount)}
Call Due Date: ${project.callDueDate ? project.callDueDate.toISOString().split("T")[0] : "Not specified"}
Call Purpose: ${project.callPurpose ?? "Not specified"}
Unfunded Commitments: ${formatCurrency(unfundedCommitments)}
Notice Required Days: ${project.callNoticeRequiredDays ?? "10"}
Default Penalty: ${project.callDefaultPenalty !== null ? (safeNumber(project.callDefaultPenalty) * 100).toFixed(1) + "%" : "Not specified"}
Default Remedy: ${project.callDefaultRemedy ?? "Per LPA terms"}

DISTRIBUTION DATA:
Distribution Amount: ${formatCurrency(distributionAmount)}
Distribution Type: ${project.distributionType ?? "Not specified"}
Withholding Rate: ${project.withholdingRate !== null ? (safeNumber(project.withholdingRate) * 100).toFixed(1) + "%" : "N/A"}
Withholding Amount: ${project.withholdingAmount ? formatCurrency(Number(project.withholdingAmount)) : "N/A"}
Withholding Type: ${project.withholdingType ?? "N/A"}

TAX YEAR: ${project.taxYear ?? "Not specified"}
FILING DEADLINE: ${project.filingDeadline ? project.filingDeadline.toISOString().split("T")[0] : "March 15"}

ILPA COMPLIANCE:
ILPA Compliant: ${project.ilpaCompliant ? "Yes" : "No"}
ILPA Template: ${project.ilpaTemplate ?? "Not specified"}

VALUATION:
Methodology: ${project.valuationMethodology ?? "Not specified"}
Valuation Date: ${project.valuationDate ? project.valuationDate.toISOString().split("T")[0] : "Not specified"}
Provider: ${project.valuationProvider ?? "Not specified"}

AUDIT:
Auditor: ${project.auditorName ?? "Not specified"}
Audit Date: ${project.auditDate ? project.auditDate.toISOString().split("T")[0] : "Not specified"}
Opinion: ${project.auditOpinion ?? "Not specified"}

PORTFOLIO COMPANIES:
${portfolioBlock}

Date: ${new Date().toISOString().split("T")[0]}`;

  return appendSourceDocContent(context, sourceDocContent);
}

// ─── Main Dispatcher ─────────────────────────────────────────────────

/**
 * Generate a single compliance document.
 * Returns the DOCX buffer and compliance check results.
 * If missingSourceDocs is provided, relevant [PENDING: X] notices are prepended.
 */
export async function generateComplianceDoc(
  project: ComplianceProjectFull,
  docType: string,
  missingSourceDocs: string[] = [],
): Promise<{ buffer: Buffer; complianceChecks: ComplianceCheck[] }> {
  const label = COMPLIANCE_DOC_TYPE_LABELS[docType] ?? docType;
  const outputLabel = DOC_TYPE_TO_OUTPUT_LABEL[docType] ?? label;
  const notices = pendingDocNotices(missingSourceDocs, outputLabel, SOURCE_DOCS.compliance);

  try {
    switch (docType) {
      case "lp_quarterly_report": {
        const doc = prependToDocument(await buildLPQuarterlyReport(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runLPReportComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "capital_call_notice": {
        const doc = prependToDocument(await buildCapitalCallNotice(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runCapitalCallComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "distribution_notice": {
        const doc = prependToDocument(await buildDistributionNotice(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runDistributionComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "k1_summary": {
        const doc = prependToDocument(await buildK1Summary(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runK1ComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "annual_report": {
        const doc = prependToDocument(await buildAnnualReport(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runAnnualReportComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "form_adv_summary": {
        const doc = prependToDocument(await buildFormADVSummary(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runFormADVComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      default: {
        // Fallback placeholder
        const placeholder = buildLegalDocument({
          title: label,
          children: [
            documentTitle(label),
            bodyText(`This document template (${label}) is pending implementation.`),
            bodyText(`Fund: ${project.fundName}`),
            bodyText(`Report Type: ${project.reportType}`),
            bodyText(`Generated: ${new Date().toISOString()}`),
          ],
        });
        const buffer = await Packer.toBuffer(placeholder) as Buffer;
        return { buffer, complianceChecks: [] };
      }
    }
  } catch (error) {
    console.error(`[Compliance] Failed to generate ${docType}:`, error);
    // Return error placeholder
    const errorDoc = buildLegalDocument({
      title: "Generation Error",
      children: [
        documentTitle("Document Generation Error"),
        bodyText(`The ${label} could not be generated.`),
        bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 300) : "Unknown error"}`),
        bodyText("Please retry generation or create this document manually."),
      ],
    });
    const buffer = await Packer.toBuffer(errorDoc) as Buffer;
    return {
      buffer,
      complianceChecks: [{
        name: "Generation Error",
        regulation: "N/A",
        category: "standard",
        passed: false,
        note: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
      }],
    };
  }
}
