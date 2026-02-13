// generate-doc.ts
// Syndication module: dispatches to individual template builders.
// Each template calls the AI for prose, then builds a DOCX document.
// All financial numbers come from project data — AI writes ONLY prose sections.
// Pro forma is 100% deterministic — no AI.

import { Packer } from "docx";
import type { SyndicationProjectFull, ComplianceCheck } from "./types";
import { SYNDICATION_DOC_TYPE_LABELS } from "./types";
import {
  buildLegalDocument,
  prependToDocument,
  pendingDocNotices,
  documentTitle,
  bodyText,
  formatCurrency,
} from "../doc-helpers";
import { SOURCE_DOCS } from "@/lib/source-doc-types";

// Map internal docType keys to output doc labels used in source doc definitions
const DOC_TYPE_TO_OUTPUT_LABEL: Record<string, string> = {
  ppm: "PPM",
  operating_agreement: "Operating Agreement",
  subscription_agreement: "Subscription Agreement",
  investor_questionnaire: "Investor Questionnaire",
  pro_forma: "Pro Forma",
};

// Template builders
import { buildPPM, runPPMComplianceChecks } from "./templates/ppm";
import { buildOperatingAgreement, runOperatingAgreementComplianceChecks } from "./templates/operating-agreement";
import { buildSubscriptionAgreement, runSubscriptionComplianceChecks } from "./templates/subscription-agreement";
import { buildInvestorQuestionnaire, runQuestionnaireComplianceChecks } from "./templates/investor-questionnaire";
import { buildProForma, runProFormaComplianceChecks } from "./templates/pro-forma";

// ─── Source Doc Content (module-level var) ───────────────────────────

let _sourceDocContent: Record<string, string> = {};

/** Set extracted source doc content before generation. Called by Inngest pipeline. */
export function setSyndicationSourceDocContent(content: Record<string, string>) {
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
  project: SyndicationProjectFull,
  sourceDocContent: Record<string, string> = _sourceDocContent,
): string {
  const purchasePrice = project.purchasePrice ? Number(project.purchasePrice) : 0;
  const renovationBudget = project.renovationBudget ? Number(project.renovationBudget) : 0;
  const closingCosts = project.closingCosts ? Number(project.closingCosts) : 0;
  const totalEquityRaise = project.totalEquityRaise ? Number(project.totalEquityRaise) : 0;
  const minInvestment = project.minInvestment ? Number(project.minInvestment) : 0;
  const loanAmount = project.loanAmount ? Number(project.loanAmount) : 0;
  const sponsorEquity = project.sponsorEquity ? Number(project.sponsorEquity) : 0;
  const currentNoi = project.currentNoi ? Number(project.currentNoi) : 0;
  const proFormaNoi = project.proFormaNoi ? Number(project.proFormaNoi) : 0;
  const totalCost = purchasePrice + renovationBudget + closingCosts;
  // NOTE: LTV is calculated against purchase price (standard for stabilized acquisitions).
  // For value-add deals, consider LTC (Loan-to-Cost) = loanAmount / totalCost as a complementary metric.
  const ltv = purchasePrice > 0 ? loanAmount / purchasePrice : 0;
  const capRate = purchasePrice > 0 ? currentNoi / purchasePrice : 0;
  const proFormaCapRate = purchasePrice > 0 ? proFormaNoi / purchasePrice : 0;

  // Waterfall tiers
  const waterfallBlock = project.waterfallTiers.length > 0
    ? project.waterfallTiers
        .sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0))
        .map((t) =>
          `  Tier ${t.tierOrder}: ${t.tierName ?? "Unnamed"} — Hurdle: ${t.hurdleRate != null ? (t.hurdleRate * 100).toFixed(1) + "%" : "N/A"}, LP: ${(t.lpSplit * 100).toFixed(0)}%, GP: ${(t.gpSplit * 100).toFixed(0)}%${t.description ? ` (${t.description})` : ""}`,
        )
        .join("\n")
    : "  No waterfall tiers defined";

  // Investor summary
  const investorSummary = project.syndicationInvestors.length > 0
    ? project.syndicationInvestors
        .map((inv) =>
          `  - ${inv.investorName} (${inv.investorType}): ${inv.commitmentAmount ? formatCurrency(Number(inv.commitmentAmount)) : "TBD"} — ${inv.accreditationStatus}`,
        )
        .join("\n")
    : "  No investors committed yet";

  // Track record
  const trackRecord = Array.isArray(project.sponsorTrackRecord) ? project.sponsorTrackRecord as Array<{ dealName: string; returns: string }> : null;
  const trackRecordBlock = trackRecord
    ? trackRecord.filter(Boolean).map((t) => `  - ${t.dealName ?? "Unknown"}: ${t.returns ?? "N/A"}`).join("\n")
    : "  Not provided";

  // Blue sky filings
  const blueSkyFilings = Array.isArray(project.blueSkyFilings) ? project.blueSkyFilings as string[] : null;

  const context = `SYNDICATION PROJECT DETAILS (source of truth — use these exact terms):
Project Name: ${project.name}
Entity Name: ${project.entityName}
Entity Type: ${project.entityType}
State of Formation: ${project.stateOfFormation ?? "Delaware"}
Exemption Type: ${project.exemptionType}
General Solicitation: ${project.exemptionType === "REG_D_506C" ? "PERMITTED (506(c))" : "NOT PERMITTED (506(b))"}

SPONSOR:
Sponsor Name: ${project.sponsorName}
Sponsor Entity: ${project.sponsorEntity ?? "Not specified"}
Sponsor Equity: ${formatCurrency(sponsorEquity)}

PROPERTY:
Property Name: ${project.propertyName ?? project.propertyAddress}
Property Address: ${project.propertyAddress}
Property Type: ${project.propertyType}
Units: ${project.units ?? "N/A"}
Square Feet: ${project.squareFeet ? project.squareFeet.toLocaleString() : "N/A"}
Year Built: ${project.yearBuilt ?? "N/A"}

ACQUISITION:
Purchase Price: ${formatCurrency(purchasePrice)}
Renovation Budget: ${formatCurrency(renovationBudget)}
Closing Costs: ${formatCurrency(closingCosts)}
Total Project Cost: ${formatCurrency(totalCost)}

CAPITAL STACK:
Total Equity Raise: ${formatCurrency(totalEquityRaise)}
Minimum Investment: ${formatCurrency(minInvestment)}
Loan Amount: ${formatCurrency(loanAmount)}
LTV: ${(ltv * 100).toFixed(1)}%

FINANCING:
Interest Rate: ${project.interestRate ? (project.interestRate * 100).toFixed(3) + "%" : "N/A"}
Loan Term: ${project.loanTermYears ?? "N/A"} years
Interest Only: ${project.interestOnly ? "Yes" : "No"}
IO Term: ${project.ioTermMonths ? project.ioTermMonths + " months" : "N/A"}

PROJECTED RETURNS:
Preferred Return: ${project.preferredReturn ? (project.preferredReturn * 100).toFixed(1) + "%" : "N/A"}
Projected Hold: ${project.projectedHoldYears ?? "N/A"} years
Projected IRR: ${project.projectedIrr ? (project.projectedIrr * 100).toFixed(1) + "%" : "N/A"}
Projected Equity Multiple: ${project.projectedEquityMultiple ? project.projectedEquityMultiple.toFixed(2) + "x" : "N/A"}

OPERATING METRICS:
Current NOI: ${formatCurrency(currentNoi)}
Pro Forma NOI: ${formatCurrency(proFormaNoi)}
Going-In Cap Rate: ${(capRate * 100).toFixed(2)}%
Pro Forma Cap Rate: ${(proFormaCapRate * 100).toFixed(2)}%
Vacancy Rate: ${project.vacancyRate ? (project.vacancyRate * 100).toFixed(1) + "%" : "N/A"}
Rent Growth Rate: ${project.rentGrowthRate ? (project.rentGrowthRate * 100).toFixed(1) + "%/yr" : "N/A"}
Expense Growth Rate: ${project.expenseGrowthRate ? (project.expenseGrowthRate * 100).toFixed(1) + "%/yr" : "N/A"}
Exit Cap Rate: ${project.exitCapRate ? (project.exitCapRate * 100).toFixed(2) + "%" : "N/A"}

FEES:
Acquisition Fee: ${project.acquisitionFee ? (project.acquisitionFee * 100).toFixed(1) + "%" : "N/A"}
Asset Management Fee: ${project.assetMgmtFee ? (project.assetMgmtFee * 100).toFixed(1) + "%" : "N/A"}
Property Management Fee: ${project.propertyMgmtFee ? (project.propertyMgmtFee * 100).toFixed(1) + "%" : "N/A"}
Construction Management Fee: ${project.constructionMgmtFee ? (project.constructionMgmtFee * 100).toFixed(1) + "%" : "N/A"}
Disposition Fee: ${project.dispositionFee ? (project.dispositionFee * 100).toFixed(1) + "%" : "N/A"}
Refinancing Fee: ${project.refinancingFee ? (project.refinancingFee * 100).toFixed(1) + "%" : "N/A"}
Guarantee Fee: ${project.guaranteeFee ? (project.guaranteeFee * 100).toFixed(1) + "%" : "N/A"}

WATERFALL TIERS:
${waterfallBlock}

TAX CONSIDERATIONS:
QOZ Investment: ${project.isQOZ ? "Yes" : "No"}
1031 Exchange: ${project.is1031Exchange ? "Yes" : "No"}
Bonus Depreciation: ${project.bonusDepreciationPct != null ? (project.bonusDepreciationPct * 100).toFixed(0) + "%" : "100% (2026 default — post-OBBBA July 2025, restored for property acquired after Jan 19, 2025)"}
UBTI Risk: ${project.ubtiRisk ? "Yes — leveraged real estate" : "Low"}
Passive Loss Eligible: ${project.passiveLossEligible ? "Yes" : "No"}
REPS Qualified: ${project.repsQualified ? "Yes" : "No"}

FORM D / COMPLIANCE:
Form D Filing Date: ${project.formDFilingDate ? project.formDFilingDate.toISOString().split("T")[0] : "Not yet filed"}
Blue Sky Filings: ${blueSkyFilings?.join(", ") ?? "None"}

SPONSOR TRACK RECORD:
${trackRecordBlock}

CURRENT INVESTORS:
${investorSummary}

Date: ${new Date().toISOString().split("T")[0]}`;

  return appendSourceDocContent(context, sourceDocContent);
}

// ─── Main Dispatcher ─────────────────────────────────────────────────

/**
 * Generate a single syndication document.
 * Returns the DOCX buffer and compliance check results.
 * If missingSourceDocs is provided, relevant [PENDING: X] notices are prepended.
 */
export async function generateSyndicationDoc(
  project: SyndicationProjectFull,
  docType: string,
  missingSourceDocs: string[] = [],
): Promise<{ buffer: Buffer; complianceChecks: ComplianceCheck[] }> {
  const label = SYNDICATION_DOC_TYPE_LABELS[docType] ?? docType;
  const outputLabel = DOC_TYPE_TO_OUTPUT_LABEL[docType] ?? label;
  const notices = pendingDocNotices(missingSourceDocs, outputLabel, SOURCE_DOCS.syndication);

  try {
    switch (docType) {
      case "ppm": {
        const doc = prependToDocument(await buildPPM(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runPPMComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "operating_agreement": {
        const doc = prependToDocument(await buildOperatingAgreement(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runOperatingAgreementComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "subscription_agreement": {
        const doc = prependToDocument(await buildSubscriptionAgreement(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runSubscriptionComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "investor_questionnaire": {
        const doc = prependToDocument(await buildInvestorQuestionnaire(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runQuestionnaireComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      case "pro_forma": {
        // Pro forma is 100% deterministic — no AI
        const doc = prependToDocument(buildProForma(project), notices);
        const buffer = await Packer.toBuffer(doc) as Buffer;
        const checks = runProFormaComplianceChecks(project);
        return { buffer, complianceChecks: checks };
      }
      default: {
        // Fallback placeholder
        const placeholder = buildLegalDocument({
          title: label,
          children: [
            documentTitle(label),
            bodyText(`This document template (${label}) is pending implementation.`),
            bodyText(`Project: ${project.name}`),
            bodyText(`Property: ${project.propertyAddress}`),
            bodyText(`Generated: ${new Date().toISOString()}`),
          ],
        });
        const buffer = await Packer.toBuffer(placeholder) as Buffer;
        return { buffer, complianceChecks: [] };
      }
    }
  } catch (error) {
    console.error(`[Syndication] Failed to generate ${docType}:`, error);
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
