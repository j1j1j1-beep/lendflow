// compliance-functions.ts
// Inngest pipeline for Compliance (LP Reporting / Fund Administration) document generation.
// Triggered by "compliance/project.generate" event from the API route.
// Unlike Capital which generates ALL doc types, Compliance generates ONLY the single
// document matching the project's reportType.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateComplianceDoc } from "@/documents/compliance/generate-doc";
import {
  REPORT_TYPE_TO_DOC_TYPE,
  COMPLIANCE_DOC_TYPE_LABELS,
} from "@/documents/compliance/types";
import type { ComplianceProjectFull } from "@/documents/compliance/types";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const complianceGenerateDocs = inngest.createFunction(
  { id: "compliance-generate-docs", retries: 1 },
  { event: "compliance/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    // Step 1: Load project with all relations
    const project = await step.run("load-project", async () => {
      const p = await prisma.complianceProject.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          complianceDocuments: true,
        },
      });
      return p as unknown as ComplianceProjectFull;
    });

    let lastStep = "load-project";

    try {
      // Step 2: Map reportType to the single docType to generate
      const docType = REPORT_TYPE_TO_DOC_TYPE[project.reportType];

      if (!docType) {
        await step.run("unsupported-report-type", async () => {
          await prisma.complianceProject.update({
            where: { id: projectId },
            data: {
              status: "ERROR",
              errorMessage: `Unsupported report type: ${project.reportType}`,
              errorStep: "load-project",
            },
          });
        });
        return { success: false, projectId, error: `Unsupported report type: ${project.reportType}` };
      }

      const label = COMPLIANCE_DOC_TYPE_LABELS[docType] ?? docType;

      // Step 3: Update status to GENERATING_DOCS
      await step.run("update-status-generating", async () => {
        await prisma.complianceProject.update({
          where: { id: projectId },
          data: { status: "GENERATING_DOCS", errorMessage: null, errorStep: null },
        });
      });

      // Step 4: Generate the single document
      lastStep = `generate-${docType}`;
      await step.run(`generate-${docType}`, async () => {
        console.log(`[Compliance] Generating ${label} for project ${projectId}`);

        // Reload project fresh to get latest data
        const freshProject = await prisma.complianceProject.findUniqueOrThrow({
          where: { id: projectId },
          include: {
            complianceDocuments: true,
          },
        }) as unknown as ComplianceProjectFull;

        // Generate the document
        const { buffer, complianceChecks } = await generateComplianceDoc(
          freshProject,
          docType,
        );

        // Determine version (increment if doc already exists)
        const existing = await prisma.complianceDocument.findFirst({
          where: { projectId, docType },
          orderBy: { version: "desc" },
        });
        const version = existing ? existing.version + 1 : 1;

        // Upload to S3
        const s3Key = `compliance/${projectId}/${docType}-v${version}.docx`;
        await uploadToS3(s3Key, buffer, DOCX_CONTENT_TYPE);

        // Determine compliance status
        const allPassed = complianceChecks.every((c) => c.passed);
        const hasCriticalFailure = complianceChecks.some(
          (c) => !c.passed && (c.category === "irs" || c.category === "sec" || c.category === "regulatory"),
        );

        // Save document record
        await prisma.complianceDocument.create({
          data: {
            projectId,
            docType,
            s3Key,
            version,
            status: "DRAFT",
            complianceStatus: hasCriticalFailure
              ? "FLAGGED"
              : allPassed
                ? "PASSED"
                : "PENDING",
            complianceIssues: complianceChecks.length > 0 ? complianceChecks as any : undefined,
          },
        });

        console.log(
          `[Compliance] ${label} v${version} generated — ${complianceChecks.filter((c) => c.passed).length}/${complianceChecks.length} checks passed`,
        );
      });

      // Step 5: Update project status to COMPLETE
      lastStep = "complete";
      await step.run("update-status-complete", async () => {
        // Check if the generated doc has compliance issues
        const docs = await prisma.complianceDocument.findMany({
          where: { projectId },
          orderBy: { version: "desc" },
        });

        const hasFlagged = docs.some((d) => d.complianceStatus === "FLAGGED");

        await prisma.complianceProject.update({
          where: { id: projectId },
          data: {
            status: hasFlagged ? "NEEDS_REVIEW" : "COMPLETE",
            errorMessage: null,
            errorStep: null,
          },
        });

        console.log(
          `[Compliance] Project ${projectId} generation complete — status: ${hasFlagged ? "NEEDS_REVIEW" : "COMPLETE"}`,
        );
      });

      return { success: true, projectId, docType };
    } catch (error) {
      // Final error handler: mark project as ERROR
      const message =
        error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.complianceProject.update({
        where: { id: projectId },
        data: {
          status: "ERROR",
          errorMessage: message.slice(0, 500),
          errorStep: lastStep,
        },
      });

      console.error(
        `[Compliance] Pipeline failed at step "${lastStep}" for project ${projectId}:`,
        error,
      );

      throw error;
    }
  },
);

export const complianceFunctions = [complianceGenerateDocs];
