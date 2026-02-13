// generate-doc.ts
// Capital module: dispatches to individual template builders.
// Each template calls the AI for prose, then builds a DOCX document.
// All financial numbers come from project data — AI writes ONLY prose sections.

import { Packer } from "docx";
import type { CapitalProjectFull, ComplianceCheck } from "./types";
import { CAPITAL_DOC_TYPE_LABELS } from "./types";
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
  ppm: "PPM",
  subscription_agreement: "Subscription Agreement",
  operating_agreement: "Operating Agreement",
  investor_questionnaire: "Investor Questionnaire",
  side_letter: "Side Letter",
  form_d_draft: "Form D Draft",
};

// Template builders
import { buildPPM, runPPMComplianceChecks } from "./templates/ppm";
import { buildSubscriptionAgreement, runSubscriptionComplianceChecks } from "./templates/subscription-agreement";
import { buildOperatingAgreement, runOperatingAgreementComplianceChecks } from "./templates/operating-agreement";
import { buildInvestorQuestionnaire, runQuestionnaireComplianceChecks } from "./templates/investor-questionnaire";
import { buildSideLetter, runSideLetterComplianceChecks } from "./templates/side-letter";
import { buildFormDDraft, runFormDComplianceChecks } from "./templates/form-d-draft";

// ─── Source Doc Content (module-level var) ───────────────────────────

let _sourceDocContent: Record<string, string> = {};

/** Set extracted source doc content before generation. Called by Inngest pipeline. */
export function setCapitalSourceDocContent(content: Record<string, string>) {
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
  project: CapitalProjectFull,
  sourceDocContent: Record<string, string> = _sourceDocContent,
): string {
  const targetRaise = project.targetRaise ? Number(project.targetRaise) : 0;
  const minInvestment = project.minInvestment ? Number(project.minInvestment) : 0;
  const gpCommitment = project.gpCommitment ? Number(project.gpCommitment) : 0;
  const managementFee = project.managementFee ?? 0;
  const carriedInterest = project.carriedInterest ?? 0;
  const preferredReturn = project.preferredReturn ?? 0;
  const hurdles = Array.isArray(project.hurdles) ? project.hurdles as Array<{ rate: number; split: string }> : null;
  const targetIndustries = Array.isArray(project.targetIndustries) ? project.targetIndustries as string[] : null;
  const keyPersonNames = Array.isArray(project.keyPersonNames) ? project.keyPersonNames as string[] : null;
  const stateFilings = Array.isArray(project.stateFilings) ? project.stateFilings as string[] : null;

  const hurdleBlock = hurdles
    ? hurdles.filter(Boolean).map((h, i) => `  Tier ${i + 1}: ${(safeNumber(h.rate) * 100).toFixed(1)}% — ${h.split ?? ""}`).join("\n")
    : "  None specified";

  const investorSummary = project.capitalInvestors.length > 0
    ? project.capitalInvestors
        .map((inv) => `  - ${inv.investorName} (${inv.investorType}): ${inv.commitmentAmount ? formatCurrency(Number(inv.commitmentAmount)) : "TBD"}`)
        .join("\n")
    : "  No investors committed yet";

  const context = `FUND DETAILS (source of truth — use these exact terms):
Fund Name: ${project.fundName}
Fund Type: ${project.fundType}
GP Entity: ${project.gpEntityName}
GP State of Formation: ${project.gpStateOfFormation ?? "Delaware"}
Entity Structure: ${project.fundType === "HEDGE_FUND" ? "LLC" : "Limited Partnership"}

SECURITIES EXEMPTION:
Exemption Type: ${project.exemptionType}
ICA Exemption: ${project.icaExemption}
General Solicitation: ${project.exemptionType === "REG_D_506C" ? "PERMITTED (506(c))" : "NOT PERMITTED (506(b))"}
Accredited Only: ${project.accreditedOnly ? "Yes" : "No"}${project.exemptionType === "REG_D_506C" && !project.accreditedOnly ? " [WARNING: For 506(c) offerings, ALL purchasers MUST be verified accredited investors per 17 CFR 230.506(c). accreditedOnly should be true.]" : ""}
Non-Accredited Limit: ${project.nonAccreditedLimit ?? 35}
Max Investors: ${project.maxInvestors ?? (project.icaExemption === "SECTION_3C1" ? 100 : "No statutory limit (all must be qualified purchasers per Section 2(a)(51) of Investment Company Act). Recommend operational maximum of 1,999 to avoid Exchange Act Section 12(g) registration.")}

FUND ECONOMICS:
Target Raise: ${formatCurrency(targetRaise)}
Minimum Investment: ${formatCurrency(minInvestment)}
Management Fee: ${(managementFee * 100).toFixed(2)}%
Carried Interest: ${(carriedInterest * 100).toFixed(1)}%
Preferred Return (Hurdle): ${(preferredReturn * 100).toFixed(1)}%
GP Commitment: ${formatCurrency(gpCommitment)} (${targetRaise > 0 ? ((gpCommitment / targetRaise) * 100).toFixed(1) : "0"}% of fund)

HURDLE TIERS:
${hurdleBlock}

FUND TERMS:
Fund Term: ${project.fundTermYears ?? 10} years
Investment Period: ${project.investmentPeriod ?? 5} years
Key Person Provision: ${project.keyPersonProvision ? "Yes" : "No"}
Key Persons: ${keyPersonNames?.join(", ") ?? "Not specified"}
Clawback Provision: ${project.clawbackProvision ? "Yes" : "No"}

STRATEGY:
Investment Strategy: ${project.investmentStrategy ?? "Not specified"}
Target Industries: ${targetIndustries?.join(", ") ?? "Not specified"}
Geographic Focus: ${project.geographicFocus ?? "Not specified"}

COMPLIANCE:
Risk Factors Included: ${project.riskFactorsIncluded ? "Yes" : "No"}
Use of Proceeds Disclosed: ${project.useOfProceedsDisclosed ? "Yes" : "No"}
Form D Filing Date: ${project.formDFilingDate ? project.formDFilingDate.toISOString().split("T")[0] : "Not yet filed"}
State Filings: ${stateFilings?.join(", ") ?? "None"}

CURRENT INVESTORS:
${investorSummary}

Date: ${new Date().toISOString().split("T")[0]}`;

  return appendSourceDocContent(context, sourceDocContent);
}

// ─── Main Dispatcher ─────────────────────────────────────────────────

/**
 * Generate a single capital document.
 * Returns the DOCX buffer and compliance check results.
 * If missingSourceDocs is provided, relevant [PENDING: X] notices are prepended.
 */
export async function generateCapitalDoc(
  project: CapitalProjectFull,
  docType: string,
  missingSourceDocs: string[] = [],
): Promise<{ buffer: Buffer; complianceChecks: ComplianceCheck[] }> {
  const label = CAPITAL_DOC_TYPE_LABELS[docType] ?? docType;
  const outputLabel = DOC_TYPE_TO_OUTPUT_LABEL[docType] ?? label;
  const notices = pendingDocNotices(missingSourceDocs, outputLabel, SOURCE_DOCS.capital);

  try {
    switch (docType) {
      case "ppm": {
        const doc = prependToDocument(await buildPPM(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runPPMComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "subscription_agreement": {
        const doc = prependToDocument(await buildSubscriptionAgreement(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runSubscriptionComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "operating_agreement": {
        const doc = prependToDocument(await buildOperatingAgreement(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runOperatingAgreementComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "investor_questionnaire": {
        const doc = prependToDocument(await buildInvestorQuestionnaire(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runQuestionnaireComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "side_letter": {
        const doc = prependToDocument(await buildSideLetter(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runSideLetterComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "form_d_draft": {
        const doc = prependToDocument(await buildFormDDraft(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runFormDComplianceChecks(project);
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
            bodyText(`Target Raise: ${formatCurrency(Number(project.targetRaise ?? 0))}`),
            bodyText(`Generated: ${new Date().toISOString()}`),
          ],
        });
        const buffer = await Packer.toBuffer(placeholder) as Buffer;
        return { buffer, complianceChecks: [] };
      }
    }
  } catch (error) {
    console.error(`[Capital] Failed to generate ${docType}:`, error);
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
        category: "securities",
        passed: false,
        note: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
      }],
    };
  }
}
