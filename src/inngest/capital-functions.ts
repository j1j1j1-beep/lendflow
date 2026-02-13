// capital-functions.ts
// Inngest pipeline for Capital (Fund Formation / Private Placement) document generation.
// Triggered by "capital/project.generate" event from the API route.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateCapitalDoc, setCapitalSourceDocContent } from "@/documents/capital/generate-doc";
import { CAPITAL_DOC_TYPES, CAPITAL_DOC_TYPE_LABELS } from "@/documents/capital/types";
import type { CapitalProjectFull } from "@/documents/capital/types";
import { getMissingSourceDocKeys } from "@/lib/source-doc-check";
import { extractTextFromBuffer } from "@/documents/extract-text";

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

export const capitalGenerateDocs = inngest.createFunction(
  {
    id: "capital-generate-docs",
    retries: 1,
    idempotency: "event.data.projectId + '-' + event.data.triggeredAt",
  },
  { event: "capital/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string; triggeredAt?: number };

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

    // Guard: check project exists and is in correct state
    const statusCheck = await step.run("check-status", async (): Promise<{ skip: boolean; error?: string }> => {
      const current = await prisma.capitalProject.findUnique({ where: { id: projectId }, select: { status: true } });
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
        await prisma.capitalProject.update({
          where: { id: projectId },
          data: { status: "GENERATING_DOCS" },
        });
      });

      // Step 3: Fetch missing source docs (once, reused for all doc types)
      const missingDocs = await step.run("fetch-missing-source-docs", async () => {
        return getMissingSourceDocKeys("capital", projectId);
      });

      // Step 3b: Load extracted source doc content for injection into AI prompts
      const sourceDocContent = await step.run("load-source-doc-content", async () => {
        const docs = await prisma.sourceDocument.findMany({
          where: { module: "capital", projectId, deletedAt: null, docType: { not: null }, ocrText: { not: null } },
          select: { docType: true, ocrText: true },
        });
        const content: Record<string, string> = {};
        for (const doc of docs) {
          if (doc.docType && doc.ocrText) content[doc.docType] = doc.ocrText;
        }
        return content;
      });

      // Inject source doc content into the module-level var so buildProjectContext picks it up
      setCapitalSourceDocContent(sourceDocContent);

      // Step 4: Generate each document type in its own step for retry isolation
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

          // Determine version (increment if doc already exists)
          const existing = await prisma.capitalDocument.findFirst({
            where: { projectId, docType },
            orderBy: { version: "desc" },
          });
          const version = existing ? existing.version + 1 : 1;

          try {
            // Generate the document (30s for deterministic, 180s for AI)
            const isDeterministic = ["form_d_draft", "investor_questionnaire"].includes(docType);
            const { buffer, complianceChecks } = await withTimeout(
              generateCapitalDoc(freshProject, docType, missingDocs),
              isDeterministic ? 30_000 : 180_000,
              `generate-${docType}`,
            );

            // Extract text before upload
            const extractedText = await extractTextFromBuffer(buffer);

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
                extractedText: extractedText || null,
              },
            });

            console.log(
              `[Capital] ${label} v${version} generated — ${complianceChecks.filter((c) => c.passed).length}/${complianceChecks.length} checks passed`,
            );
          } catch (error) {
            console.error(`[Capital] Failed to generate ${label}:`, error);

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
            const errorExtractedText = await extractTextFromBuffer(errorBuffer);
            const s3Key = `capital/${projectId}/${docType}-v${version}.docx`;
            await uploadToS3(s3Key, errorBuffer, DOCX_CONTENT_TYPE);

            await prisma.capitalDocument.create({
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
                extractedText: errorExtractedText || null,
              },
            });
          }
        });
      }

      // Step 4: Update status to COMPLIANCE_REVIEW before running checks
      lastStep = "compliance-review";
      await step.run("update-status-compliance-review", async () => {
        await prisma.capitalProject.update({
          where: { id: projectId },
          data: { status: "COMPLIANCE_REVIEW" },
        });
      });

      // Step 5: Update project status to COMPLETE
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
