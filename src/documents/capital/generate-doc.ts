// generate-doc.ts
// Capital module: dispatches to individual template builders.
// Each template calls the AI for prose, then builds a DOCX document.
// All financial numbers come from project data — AI writes ONLY prose sections.

import { Packer } from "docx";
import type { CapitalProjectFull, ComplianceCheck } from "./types";
import { CAPITAL_DOC_TYPE_LABELS } from "./types";
import {
  buildLegalDocument,
  documentTitle,
  bodyText,
  formatCurrency,
} from "../doc-helpers";

// Template builders
import { buildPPM, runPPMComplianceChecks } from "./templates/ppm";
import { buildSubscriptionAgreement, runSubscriptionComplianceChecks } from "./templates/subscription-agreement";
import { buildOperatingAgreement, runOperatingAgreementComplianceChecks } from "./templates/operating-agreement";
import { buildInvestorQuestionnaire, runQuestionnaireComplianceChecks } from "./templates/investor-questionnaire";
import { buildSideLetter, runSideLetterComplianceChecks } from "./templates/side-letter";
import { buildFormDDraft, runFormDComplianceChecks } from "./templates/form-d-draft";

// ─── Project Context Builder ─────────────────────────────────────────

/** Builds a context string from project data for AI prompts. */
export function buildProjectContext(project: CapitalProjectFull): string {
  const targetRaise = project.targetRaise ? Number(project.targetRaise) : 0;
  const minInvestment = project.minInvestment ? Number(project.minInvestment) : 0;
  const gpCommitment = project.gpCommitment ? Number(project.gpCommitment) : 0;
  const managementFee = project.managementFee ?? 0;
  const carriedInterest = project.carriedInterest ?? 0;
  const preferredReturn = project.preferredReturn ?? 0;
  const hurdles = project.hurdles as Array<{ rate: number; split: string }> | null;
  const targetIndustries = project.targetIndustries as string[] | null;
  const keyPersonNames = project.keyPersonNames as string[] | null;
  const stateFilings = project.stateFilings as string[] | null;

  const hurdleBlock = hurdles
    ? hurdles.map((h, i) => `  Tier ${i + 1}: ${(h.rate * 100).toFixed(1)}% — ${h.split}`).join("\n")
    : "  None specified";

  const investorSummary = project.capitalInvestors.length > 0
    ? project.capitalInvestors
        .map((inv) => `  - ${inv.investorName} (${inv.investorType}): ${inv.commitmentAmount ? formatCurrency(Number(inv.commitmentAmount)) : "TBD"}`)
        .join("\n")
    : "  No investors committed yet";

  return `FUND DETAILS (source of truth — use these exact terms):
Fund Name: ${project.fundName}
Fund Type: ${project.fundType}
GP Entity: ${project.gpEntityName}
GP State of Formation: ${project.gpStateOfFormation ?? "Delaware"}
Entity Structure: ${project.fundType === "HEDGE_FUND" ? "LLC" : "Limited Partnership"}

SECURITIES EXEMPTION:
Exemption Type: ${project.exemptionType}
ICA Exemption: ${project.icaExemption}
General Solicitation: ${project.exemptionType === "REG_D_506C" ? "PERMITTED (506(c))" : "NOT PERMITTED (506(b))"}
Accredited Only: ${project.accreditedOnly ? "Yes" : "No"}
Non-Accredited Limit: ${project.nonAccreditedLimit ?? 35}
Max Investors: ${project.maxInvestors ?? (project.icaExemption === "SECTION_3C1" ? 100 : "Unlimited (qualified purchasers)")}

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
}

// ─── Main Dispatcher ─────────────────────────────────────────────────

/**
 * Generate a single capital document.
 * Returns the DOCX buffer and compliance check results.
 */
export async function generateCapitalDoc(
  project: CapitalProjectFull,
  docType: string,
): Promise<{ buffer: Buffer; complianceChecks: ComplianceCheck[] }> {
  const label = CAPITAL_DOC_TYPE_LABELS[docType] ?? docType;

  try {
    switch (docType) {
      case "ppm": {
        const doc = await buildPPM(project);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runPPMComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "subscription_agreement": {
        const doc = await buildSubscriptionAgreement(project);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runSubscriptionComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "operating_agreement": {
        const doc = await buildOperatingAgreement(project);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runOperatingAgreementComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "investor_questionnaire": {
        const doc = await buildInvestorQuestionnaire(project);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runQuestionnaireComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "side_letter": {
        const doc = await buildSideLetter(project);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runSideLetterComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "form_d_draft": {
        const doc = await buildFormDDraft(project);
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
