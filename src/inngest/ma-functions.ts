// ma-functions.ts
// Inngest pipeline for M&A document generation.
// Event: "ma/project.generate"
// Generates: LOI, NDA, Purchase Agreement, Due Diligence Checklist,
//            Disclosure Schedules, Closing Checklist.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateMADoc, setMASourceDocContent } from "@/documents/deals/generate-doc";
import { MA_DOC_TYPES, MA_DOC_TYPE_LABELS } from "@/documents/deals/types";
import type { MAProjectFull } from "@/documents/deals/types";
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

export const maGenerateDocs = inngest.createFunction(
  {
    id: "ma-generate-docs",
    name: "M&A Document Generation Pipeline",
    retries: 1,
    idempotency: "event.data.projectId + '-' + event.data.triggeredAt",
  },
  { event: "ma/project.generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string; triggeredAt?: number };

    // Guard: check project exists and is in correct state
    const projectCheck = await step.run("check-project", async () => {
      const project = await prisma.mAProject.findUnique({
        where: { id: projectId },
        include: { maDocuments: true },
      });
      if (!project) return { skip: true, error: "Project not found" };

      // Only proceed if GENERATING_DOCS (set by the API route)
      if (project.status !== "GENERATING_DOCS") {
        return { skip: true, error: `Project in ${project.status} state, expected GENERATING_DOCS` };
      }

      return { skip: false, error: "" };
    });

    if (projectCheck.skip) {
      return { success: false, projectId, error: projectCheck.error };
    }

    let lastStep = "INIT";
    const generatedDocs: string[] = [];

    try {
      // Load full project data once
      const project = await step.run("load-project", async () => {
        const p = await prisma.mAProject.findUniqueOrThrow({
          where: { id: projectId },
          include: { maDocuments: true },
        });
        return p;
      });

      // Update status to GENERATING_DOCS (if not already set by API)
      await step.run("ensure-status-generating", async () => {
        const current = await prisma.mAProject.findUnique({
          where: { id: projectId },
          select: { status: true },
        });
        if (current?.status !== "GENERATING_DOCS") {
          await prisma.mAProject.update({
            where: { id: projectId },
            data: { status: "GENERATING_DOCS" },
          });
        }
      });

      // Fetch missing source docs (once, reused for all doc types)
      const missingDocs = await step.run("fetch-missing-source-docs", async () => {
        return getMissingSourceDocKeys("ma", projectId);
      });

      // Load extracted source doc content for injection into AI prompts
      const sourceDocContent = await step.run("load-source-doc-content", async () => {
        const docs = await prisma.sourceDocument.findMany({
          where: { module: "ma", projectId, deletedAt: null, docType: { not: null }, ocrText: { not: null } },
          select: { docType: true, ocrText: true },
        });
        const content: Record<string, string> = {};
        for (const doc of docs) {
          if (doc.docType && doc.ocrText) content[doc.docType] = doc.ocrText;
        }
        return content;
      });

      // Inject source doc content into the module-level var so buildMAContext picks it up
      setMASourceDocContent(sourceDocContent);

      // Generate each document type in its own step (with per-doc error handling)
      for (const docType of MA_DOC_TYPES) {
        lastStep = docType;
        const label = MA_DOC_TYPE_LABELS[docType] ?? docType;

        await step.run(`generate-${docType}`, async () => {
          // Reload project for each step to get latest data
          const currentProject = await prisma.mAProject.findUniqueOrThrow({
            where: { id: projectId },
            include: { maDocuments: true },
          }) as unknown as MAProjectFull;

          // Determine version (increment if doc already exists for this type)
          const existingDoc = await prisma.mADocument.findFirst({
            where: { projectId, docType },
            orderBy: { version: "desc" },
          });
          const version = existingDoc ? existingDoc.version + 1 : 1;

          try {
            // AI docs get a longer timeout; deterministic docs are fast
            const isAIDoc = !["due_diligence_checklist", "closing_checklist"].includes(docType);
            const timeoutMs = isAIDoc ? 180_000 : 30_000; // 3 min for AI, 30s for deterministic

            const { buffer, complianceChecks, resolvedDocType } = await withTimeout(
              generateMADoc(currentProject, docType, missingDocs),
              timeoutMs,
              `generate-${docType}`,
            );

            // Extract text before upload
            const extractedText = await extractTextFromBuffer(buffer);

            // Upload to S3
            const s3Key = `ma/${projectId}/${resolvedDocType}-v${version}.docx`;
            await uploadToS3(s3Key, buffer, DOCX_CONTENT_TYPE);

            // Determine compliance status
            const hasFailedChecks = complianceChecks.some((c) => !c.passed);
            const complianceStatus = complianceChecks.length === 0
              ? "PENDING"
              : hasFailedChecks
                ? "FLAGGED"
                : "PASSED";

            // Save document record
            await prisma.mADocument.create({
              data: {
                projectId,
                docType: resolvedDocType,
                s3Key,
                version,
                status: "DRAFT",
                complianceStatus,
                complianceIssues: complianceChecks.length > 0 ? JSON.parse(JSON.stringify(complianceChecks)) : undefined,
                verificationStatus: "PASSED",
                extractedText: extractedText || null,
              },
            });

            generatedDocs.push(resolvedDocType);
          } catch (error) {
            console.error(`[M&A] Failed to generate ${label}:`, error);

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
            const s3Key = `ma/${projectId}/${docType}-v${version}.docx`;
            await uploadToS3(s3Key, errorBuffer, DOCX_CONTENT_TYPE);

            await prisma.mADocument.create({
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

      // Update status to COMPLIANCE_REVIEW before running checks
      await step.run("update-status-compliance-review", async () => {
        await prisma.mAProject.update({
          where: { id: projectId },
          data: { status: "COMPLIANCE_REVIEW" },
        });
      });

      // All docs generated — update project status
      await step.run("finalize", async () => {
        // Check if any docs have compliance issues
        const allDocs = await prisma.mADocument.findMany({
          where: { projectId },
        });

        const hasFlagged = allDocs.some(
          (d) => d.complianceStatus === "FLAGGED",
        );

        await prisma.mAProject.update({
          where: { id: projectId },
          data: {
            status: hasFlagged ? "NEEDS_REVIEW" : "COMPLETE",
            errorMessage: null,
            errorStep: null,
          },
        });
      });

      return {
        success: true,
        projectId,
        generatedDocs,
        docCount: generatedDocs.length,
      };
    } catch (error) {
      // Mark project as errored
      const errorMsg = error instanceof Error ? error.message.slice(0, 500) : "Unknown error";

      await step.run("handle-error", async () => {
        await prisma.mAProject.update({
          where: { id: projectId },
          data: {
            status: "ERROR",
            errorMessage: errorMsg,
            errorStep: lastStep,
          },
        });
      });

      console.error(`[ma-generate-docs] Failed at step ${lastStep} for project ${projectId}:`, error);

      throw error;
    }
  },
);

export const maFunctions = [maGenerateDocs];
