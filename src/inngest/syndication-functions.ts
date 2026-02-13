// syndication-functions.ts
// Inngest pipeline for Syndication (Real Estate Syndication) document generation.
// Triggered by "syndication/project.generate" event from the API route.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateSyndicationDoc } from "@/documents/syndication/generate-doc";
import { SYNDICATION_DOC_TYPES, SYNDICATION_DOC_TYPE_LABELS } from "@/documents/syndication/types";
import type { SyndicationProjectFull } from "@/documents/syndication/types";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SYNDICATION_DOC_TYPES_LIST: string[] = [
  "ppm",
  "operating_agreement",
  "subscription_agreement",
  "investor_questionnaire",
  "pro_forma",
];

export const syndicationGenerateDocs = inngest.createFunction(
  { id: "syndication-generate-docs", retries: 1 },
  { event: "syndication/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    // Step 1: Load project with all relations
    const project = await step.run("load-project", async () => {
      const p = await prisma.syndicationProject.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          syndicationDocuments: true,
          waterfallTiers: true,
          syndicationInvestors: true,
        },
      });
      return p as unknown as SyndicationProjectFull;
    });

    let lastStep = "load-project";

    try {
      // Step 2: Generate each document type in its own step for retry isolation
      for (const docType of SYNDICATION_DOC_TYPES_LIST) {
        lastStep = `generate-${docType}`;
        const label = SYNDICATION_DOC_TYPE_LABELS[docType] ?? docType;

        await step.run(`generate-${docType}`, async () => {
          console.log(`[Syndication] Generating ${label} for project ${projectId}`);

          // Reload project fresh to get latest data
          const freshProject = await prisma.syndicationProject.findUniqueOrThrow({
            where: { id: projectId },
            include: {
              syndicationDocuments: true,
              waterfallTiers: true,
              syndicationInvestors: true,
            },
          }) as unknown as SyndicationProjectFull;

          // Generate the document
          const { buffer, complianceChecks } = await generateSyndicationDoc(
            freshProject,
            docType,
          );

          // Determine version (increment if doc already exists)
          const existing = await prisma.syndicationDocument.findFirst({
            where: { projectId, docType },
            orderBy: { version: "desc" },
          });
          const version = existing ? existing.version + 1 : 1;

          // Upload to S3
          const s3Key = `syndication/${projectId}/${docType}-v${version}.docx`;
          await uploadToS3(s3Key, buffer, DOCX_CONTENT_TYPE);

          // Determine compliance status
          const allPassed = complianceChecks.every((c) => c.passed);
          const hasCriticalFailure = complianceChecks.some(
            (c) => !c.passed && (c.category === "securities" || c.category === "anti_fraud"),
          );

          // Save document record
          await prisma.syndicationDocument.create({
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
            `[Syndication] ${label} v${version} generated — ${complianceChecks.filter((c) => c.passed).length}/${complianceChecks.length} checks passed`,
          );
        });
      }

      // Step 3: Update project status to COMPLETE
      lastStep = "complete";
      await step.run("update-status-complete", async () => {
        // Check if any docs have compliance issues
        const docs = await prisma.syndicationDocument.findMany({
          where: { projectId },
          orderBy: { version: "desc" },
        });

        const hasFlagged = docs.some((d) => d.complianceStatus === "FLAGGED");

        await prisma.syndicationProject.update({
          where: { id: projectId },
          data: {
            status: hasFlagged ? "NEEDS_REVIEW" : "COMPLETE",
            errorMessage: null,
            errorStep: null,
          },
        });

        console.log(
          `[Syndication] Project ${projectId} generation complete — status: ${hasFlagged ? "NEEDS_REVIEW" : "COMPLETE"}`,
        );
      });

      return { success: true, projectId };
    } catch (error) {
      // Final error handler: mark project as ERROR
      const message =
        error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.syndicationProject.update({
        where: { id: projectId },
        data: {
          status: "ERROR",
          errorMessage: message.slice(0, 500),
          errorStep: lastStep,
        },
      });

      console.error(
        `[Syndication] Pipeline failed at step "${lastStep}" for project ${projectId}:`,
        error,
      );

      throw error;
    }
  },
);

export const syndicationFunctions = [syndicationGenerateDocs];
