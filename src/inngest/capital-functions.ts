// capital-functions.ts
// Inngest pipeline for Capital (Fund Formation / Private Placement) document generation.
// Triggered by "capital/project.generate" event from the API route.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateCapitalDoc } from "@/documents/capital/generate-doc";
import { CAPITAL_DOC_TYPES, CAPITAL_DOC_TYPE_LABELS } from "@/documents/capital/types";
import type { CapitalProjectFull } from "@/documents/capital/types";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const capitalGenerateDocs = inngest.createFunction(
  { id: "capital-generate-docs", retries: 1 },
  { event: "capital/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    // Step 1: Load project with all relations
    const project = await step.run("load-project", async () => {
      const p = await prisma.capitalProject.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          capitalDocuments: true,
          capitalInvestors: true,
        },
      });
      return p as unknown as CapitalProjectFull;
    });

    let lastStep = "load-project";

    try {
      // Step 2: Generate each document type in its own step for retry isolation
      for (const docType of CAPITAL_DOC_TYPES) {
        lastStep = `generate-${docType}`;
        const label = CAPITAL_DOC_TYPE_LABELS[docType] ?? docType;

        await step.run(`generate-${docType}`, async () => {
          console.log(`[Capital] Generating ${label} for project ${projectId}`);

          // Reload project fresh to get latest data (in case prior step updated something)
          const freshProject = await prisma.capitalProject.findUniqueOrThrow({
            where: { id: projectId },
            include: {
              capitalDocuments: true,
              capitalInvestors: true,
            },
          }) as unknown as CapitalProjectFull;

          // Generate the document
          const { buffer, complianceChecks } = await generateCapitalDoc(
            freshProject,
            docType,
          );

          // Determine version (increment if doc already exists)
          const existing = await prisma.capitalDocument.findFirst({
            where: { projectId, docType },
            orderBy: { version: "desc" },
          });
          const version = existing ? existing.version + 1 : 1;

          // Upload to S3
          const s3Key = `capital/${projectId}/${docType}-v${version}.docx`;
          await uploadToS3(s3Key, buffer, DOCX_CONTENT_TYPE);

          // Determine compliance status
          const allPassed = complianceChecks.every((c) => c.passed);
          const hasCriticalFailure = complianceChecks.some(
            (c) => !c.passed && (c.category === "securities" || c.category === "anti_fraud"),
          );

          // Save document record
          await prisma.capitalDocument.create({
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
            `[Capital] ${label} v${version} generated — ${complianceChecks.filter((c) => c.passed).length}/${complianceChecks.length} checks passed`,
          );
        });
      }

      // Step 3: Update project status to COMPLETE
      lastStep = "complete";
      await step.run("update-status-complete", async () => {
        // Check if any docs have compliance issues
        const docs = await prisma.capitalDocument.findMany({
          where: { projectId },
          orderBy: { version: "desc" },
        });

        const hasFlagged = docs.some((d) => d.complianceStatus === "FLAGGED");

        await prisma.capitalProject.update({
          where: { id: projectId },
          data: {
            status: hasFlagged ? "NEEDS_REVIEW" : "COMPLETE",
            errorMessage: null,
            errorStep: null,
          },
        });

        console.log(
          `[Capital] Project ${projectId} generation complete — status: ${hasFlagged ? "NEEDS_REVIEW" : "COMPLETE"}`,
        );
      });

      return { success: true, projectId };
    } catch (error) {
      // Final error handler: mark project as ERROR
      const message =
        error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.capitalProject.update({
        where: { id: projectId },
        data: {
          status: "ERROR",
          errorMessage: message.slice(0, 500),
          errorStep: lastStep,
        },
      });

      console.error(
        `[Capital] Pipeline failed at step "${lastStep}" for project ${projectId}:`,
        error,
      );

      throw error;
    }
  },
);

export const capitalFunctions = [capitalGenerateDocs];
