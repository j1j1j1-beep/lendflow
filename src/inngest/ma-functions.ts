// ma-functions.ts
// Inngest pipeline for M&A document generation.
// Event: "ma/project.generate"
// Generates: LOI, NDA, Purchase Agreement, Due Diligence Checklist,
//            Disclosure Schedules, Closing Checklist.

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateMADoc } from "@/documents/deals/generate-doc";
import { MA_DOC_TYPE_LABELS } from "@/documents/deals/types";
import type { MAProjectFull } from "@/documents/deals/types";

const MA_DOC_TYPES = [
  "loi",
  "nda",
  "purchase_agreement",
  "due_diligence_checklist",
  "disclosure_schedules",
  "closing_checklist",
];

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

      // Generate each document type in its own step
      for (const docType of MA_DOC_TYPES) {
        lastStep = docType;

        await step.run(`generate-${docType}`, async () => {
          // Reload project for each step to get latest data
          const currentProject = await prisma.mAProject.findUniqueOrThrow({
            where: { id: projectId },
            include: { maDocuments: true },
          }) as MAProjectFull;

          // AI docs get a longer timeout; deterministic docs are fast
          const isAIDoc = !["due_diligence_checklist", "closing_checklist"].includes(docType);
          const timeoutMs = isAIDoc ? 180_000 : 30_000; // 3 min for AI, 30s for deterministic

          const { buffer, complianceChecks, resolvedDocType } = await withTimeout(
            generateMADoc(currentProject, docType),
            timeoutMs,
            `generate-${docType}`,
          );

          // Determine version (increment if doc already exists)
          const existing = currentProject.maDocuments.filter(
            (d) => d.docType === resolvedDocType,
          );
          const version = existing.length > 0
            ? Math.max(...existing.map((d) => d.version)) + 1
            : 1;

          // Upload to S3
          const s3Key = `ma/${projectId}/${resolvedDocType}-v${version}.docx`;
          await uploadToS3(s3Key, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

          // Determine compliance status
          const hasFailedChecks = complianceChecks.some((c) => !c.passed);
          const complianceStatus = complianceChecks.length === 0
            ? "PENDING"
            : hasFailedChecks
              ? "FLAGGED"
              : "PASSED";

          // Upsert document record
          const existingDoc = existing.find((d) => d.version === version);
          if (existingDoc) {
            await prisma.mADocument.update({
              where: { id: existingDoc.id },
              data: {
                s3Key,
                status: isAIDoc ? "REVIEWED" : "REVIEWED",
                complianceStatus,
                complianceIssues: complianceChecks.length > 0 ? JSON.parse(JSON.stringify(complianceChecks)) : undefined,
                verificationStatus: "PASSED",
              },
            });
          } else {
            await prisma.mADocument.create({
              data: {
                projectId,
                docType: resolvedDocType,
                s3Key,
                version,
                status: "REVIEWED",
                complianceStatus,
                complianceIssues: complianceChecks.length > 0 ? JSON.parse(JSON.stringify(complianceChecks)) : undefined,
                verificationStatus: "PASSED",
              },
            });
          }

          generatedDocs.push(resolvedDocType);
        });
      }

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

      return {
        success: false,
        projectId,
        error: errorMsg,
        failedStep: lastStep,
        generatedDocs,
      };
    }
  },
);

export const maFunctions = [maGenerateDocs];
