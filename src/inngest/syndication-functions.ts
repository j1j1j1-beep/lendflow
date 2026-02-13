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

/** Wrap a promise with a timeout. Throws a descriptive error on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout: ${label} exceeded ${ms / 1000}s limit`)),
      ms,
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

export const syndicationGenerateDocs = inngest.createFunction(
  {
    id: "syndication-generate-docs",
    retries: 1,
    idempotency: "event.data.projectId + '-' + event.data.triggeredAt",
  },
  { event: "syndication/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string; triggeredAt?: number };

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

    // Guard: check project exists and is in correct state
    const statusCheck = await step.run("check-status", async (): Promise<{ skip: boolean; error?: string }> => {
      const current = await prisma.syndicationProject.findUnique({ where: { id: projectId }, select: { status: true } });
      if (!current) return { skip: true, error: "Project not found" };
      if (current.status !== "CREATED" && current.status !== "GENERATING_DOCS") {
        return { skip: true, error: `Project in ${current.status} state` };
      }
      return { skip: false };
    });
    if (statusCheck.skip) {
      return { success: false, projectId, error: statusCheck.error };
    }

    let lastStep = "load-project";

    try {
      // Step 2: Update status to GENERATING_DOCS
      await step.run("update-status-generating", async () => {
        await prisma.syndicationProject.update({
          where: { id: projectId },
          data: { status: "GENERATING_DOCS" },
        });
      });

      // Step 3: Generate each document type in its own step for retry isolation
      for (const docType of [...SYNDICATION_DOC_TYPES]) {
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

          // Determine version (increment if doc already exists)
          const existing = await prisma.syndicationDocument.findFirst({
            where: { projectId, docType },
            orderBy: { version: "desc" },
          });
          const version = existing ? existing.version + 1 : 1;

          try {
            // Generate the document (30s for deterministic, 180s for AI)
            const isDeterministic = docType === "pro_forma";
            const { buffer, complianceChecks } = await withTimeout(
              generateSyndicationDoc(freshProject, docType),
              isDeterministic ? 30_000 : 180_000,
              `generate-${docType}`,
            );

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
          } catch (error) {
            console.error(`[Syndication] Failed to generate ${label}:`, error);

            // Create error placeholder so the pipeline continues
            const { Packer } = await import("docx");
            const { buildLegalDocument, documentTitle, bodyText } = await import("@/documents/doc-helpers");
            const errorDoc = buildLegalDocument({
              title: "Generation Error",
              children: [
                documentTitle("Document Generation Error"),
                bodyText(`The ${label} could not be generated.`),
                bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`),
                bodyText("Please retry generation or create this document manually."),
              ],
            });
            const errorBuffer = await Packer.toBuffer(errorDoc) as Buffer;
            const s3Key = `syndication/${projectId}/${docType}-v${version}.docx`;
            await uploadToS3(s3Key, errorBuffer, DOCX_CONTENT_TYPE);

            await prisma.syndicationDocument.create({
              data: {
                projectId,
                docType,
                s3Key,
                version,
                status: "DRAFT",
                complianceStatus: "FLAGGED",
                complianceIssues: [{
                  severity: "critical",
                  section: "generation",
                  description: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
                  recommendation: "Retry generation or create document manually",
                }] as any,
                verificationStatus: "FAILED",
              },
            });
          }
        });
      }

      // Step 4: Update status to COMPLIANCE_REVIEW before running checks
      lastStep = "compliance-review";
      await step.run("update-status-compliance-review", async () => {
        await prisma.syndicationProject.update({
          where: { id: projectId },
          data: { status: "COMPLIANCE_REVIEW" },
        });
      });

      // Step 5: Update project status to COMPLETE
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
