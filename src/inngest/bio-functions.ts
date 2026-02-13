import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { analyzeDocument } from "@/lib/textract";
import { getS3Buffer, uploadToS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";

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

// IND document types to generate for regulatory docs programs
const IND_DOC_TYPES = [
  "ind_module_1",
  "ind_module_2",
  "ind_module_3",
  "ind_module_4",
  "ind_module_5",
  "investigator_brochure",
  "clinical_protocol",
  "pre_ind_briefing",
  "informed_consent",
  "diversity_action_plan",
  "fda_form_1571",
];

// Main bio analysis pipeline
export const bioPipeline = inngest.createFunction(
  {
    id: "bio-pipeline",
    name: "Bio Analysis Pipeline",
    retries: 2,
    idempotency: "event.data.programId + '-' + event.data.triggeredAt",
  },
  { event: "bio/analyze" },
  async ({ event, step }) => {
    const { programId, orgId } = event.data as {
      programId: string;
      orgId: string;
      triggeredAt?: number;
    };

    // Guard: skip if already processing
    const currentProgram = await step.run("check-idempotent", async () => {
      const program = await prisma.bioProgram.findUnique({ where: { id: programId } });
      if (!program) return { skip: true };

      const processingStatuses = [
        "EXTRACTING", "CLASSIFYING", "VERIFYING", "ANALYZING", "GENERATING_DOCS", "COMPLIANCE_REVIEW",
      ];

      if (processingStatuses.includes(program.status)) {
        console.log(`[bio-idempotency] Program ${programId} already in ${program.status}, skipping`);
        return { skip: true };
      }
      return { skip: false, drugClass: program.drugClass, drugName: program.drugName };
    });

    if (currentProgram.skip) {
      return { success: false, programId, error: "Program already being processed" };
    }

    let lastStep = "INIT";

    try {
      void logAudit({ orgId, programId, action: "bio.pipeline_started" });

      // Step 1: OCR — Run Textract on all bio documents
      // Bio docs are lab reports/PDFs — use basic AnalyzeDocument, not Lending API
      lastStep = "EXTRACTING";
      const documents = await step.run("fetch-documents", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "EXTRACTING", errorMessage: null, errorStep: null },
        });
        return prisma.bioDocument.findMany({
          where: { programId, status: "PENDING" },
        });
      });

      if (documents.length === 0) {
        await step.run("no-documents-error", async () => {
          await prisma.bioProgram.update({
            where: { id: programId },
            data: {
              status: "ERROR",
              errorMessage: "No documents uploaded for this program",
              errorStep: "EXTRACTING",
            },
          });
        });
        return { success: false, programId, error: "No documents to process" };
      }

      const ocrSuccessIds: string[] = [];

      for (const doc of documents) {
        const result = await step.run(`ocr-bio-${doc.id}`, async () => {
          try {
            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: { status: "OCR_PROCESSING" },
            });

            const textractResult = await withTimeout(
              analyzeDocument(doc.s3Key),
              120_000,
              `OCR-bio-${doc.id}`,
            );

            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: {
                status: "OCR_COMPLETE",
                textractOutput: textractResult as any,
                ocrText: textractResult.rawText,
                pageCount: textractResult.pageCount,
              },
            });

            return { docId: doc.id, success: true };
          } catch (error) {
            const message = error instanceof Error ? error.message : "OCR failed";
            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: { status: "ERROR" },
            });
            console.error(`Bio OCR failed for ${doc.id}:`, message);
            return { docId: doc.id, success: false };
          }
        });

        if (result.success) ocrSuccessIds.push(result.docId);
      }

      if (ocrSuccessIds.length === 0) {
        await step.run("ocr-all-failed", async () => {
          await prisma.bioProgram.update({
            where: { id: programId },
            data: {
              status: "ERROR",
              errorMessage: "All documents failed OCR processing",
              errorStep: "EXTRACTING",
            },
          });
        });
        return { success: false, programId, error: "All documents failed OCR" };
      }

      void logAudit({
        orgId, programId, action: "bio.ocr_complete",
        metadata: { successCount: ocrSuccessIds.length, totalCount: documents.length },
      });

      // Step 2: Classify bio documents
      lastStep = "CLASSIFYING";
      await step.run("update-status-classifying", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "CLASSIFYING" },
        });
      });

      for (const docId of ocrSuccessIds) {
        await step.run(`classify-bio-${docId}`, async () => {
          try {
            const doc = await prisma.bioDocument.findUniqueOrThrow({
              where: { id: docId },
            });

            await prisma.bioDocument.update({
              where: { id: docId },
              data: { status: "CLASSIFYING" },
            });

            const ocrText = doc.ocrText ?? "";

            // Dynamic import to avoid circular dependencies
            const { classifyBioDocument } = await import("@/bio/extraction/classify");
            const classification = await withTimeout(
              classifyBioDocument(ocrText),
              60_000,
              `classify-bio-${docId}`,
            );

            await prisma.bioDocument.update({
              where: { id: docId },
              data: {
                status: "CLASSIFIED",
                docType: classification.docType as any,
              },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Classification failed";
            await prisma.bioDocument.update({
              where: { id: docId },
              data: { status: "ERROR" },
            });
            console.error(`Bio classification failed for ${docId}:`, message);
          }
        });
      }

      // Step 3: Extract structured data from classified documents
      lastStep = "DATA_EXTRACTION";
      const classifiedDocs = await step.run("fetch-classified-bio-docs", async () => {
        return prisma.bioDocument.findMany({
          where: { programId, status: "CLASSIFIED" },
        });
      });

      if (classifiedDocs.length === 0) {
        await step.run("classify-bio-all-failed", async () => {
          await prisma.bioProgram.update({
            where: { id: programId },
            data: {
              status: "ERROR",
              errorMessage: "No documents were successfully classified",
              errorStep: "CLASSIFYING",
            },
          });
        });
        return { success: false, programId, error: "No documents classified" };
      }

      for (const doc of classifiedDocs) {
        await step.run(`extract-bio-${doc.id}`, async () => {
          try {
            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: { status: "EXTRACTING" },
            });

            if (!doc.docType) {
              await prisma.bioDocument.update({
                where: { id: doc.id },
                data: { status: "ERROR" },
              });
              return;
            }

            const ocrText = doc.ocrText ?? "";

            const { extractBioDocument } = await import("@/bio/extraction/extract");
            const extraction = await withTimeout(
              extractBioDocument(ocrText, doc.docType),
              90_000,
              `extract-bio-${doc.id}`,
            );

            // Delete existing extraction for idempotency
            await prisma.bioExtraction.deleteMany({
              where: { documentId: doc.id, programId },
            });

            await prisma.bioExtraction.create({
              data: {
                documentId: doc.id,
                programId,
                model: extraction.model ?? "grok-4-1-fast-reasoning",
                promptVersion: "bio-v1",
                rawResponse: extraction.data as any,
                structuredData: extraction.data as any,
                validationErrors: extraction.validationErrors as any,
                tokensUsed: extraction.tokensUsed ?? 0,
                costUsd: extraction.costUsd ?? 0,
              },
            });

            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: { status: "EXTRACTED" },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Extraction failed";
            await prisma.bioDocument.update({
              where: { id: doc.id },
              data: { status: "ERROR" },
            });
            console.error(`Bio extraction failed for ${doc.id}:`, message);
          }
        });
      }

      // Check extractions
      const bioExtractions = await step.run("fetch-bio-extractions", async () => {
        return prisma.bioExtraction.findMany({
          where: { programId },
          include: { document: true },
        });
      });

      if (bioExtractions.length === 0) {
        await step.run("extract-bio-all-failed", async () => {
          await prisma.bioProgram.update({
            where: { id: programId },
            data: {
              status: "ERROR",
              errorMessage: "No documents were successfully extracted",
              errorStep: "EXTRACTING",
            },
          });
        });
        return { success: false, programId, error: "No extractions succeeded" };
      }

      void logAudit({
        orgId, programId, action: "bio.extraction_complete",
        metadata: { extractionCount: bioExtractions.length },
      });

      // Step 4: Analyze — Run rules engine against extracted data
      lastStep = "ANALYZING";
      const analysisResult = await step.run("analyze-bio", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "ANALYZING" },
        });

        const program = await prisma.bioProgram.findUniqueOrThrow({
          where: { id: programId },
        });

        // Build program and extracted data for rules engine
        const { runBioRulesCheck } = await import("@/bio/rules");
        const { buildExtractedBioData } = await import("@/bio/mapping");

        // Gather extracted data by type
        const batchExtractions = bioExtractions
          .filter((e) => e.document.docType === "BATCH_RECORD")
          .map((e) => e.structuredData as any);
        const stabilityExtraction = bioExtractions.find(
          (e) => e.document.docType === "STABILITY_DATA",
        );
        const toxExtraction = bioExtractions.find(
          (e) => e.document.docType === "TOXICOLOGY_REPORT",
        );
        const pkExtraction = bioExtractions.find(
          (e) => e.document.docType === "PK_STUDY",
        );
        const protocolExtraction = bioExtractions.find(
          (e) => e.document.docType === "CLINICAL_PROTOCOL",
        );
        const coaExtraction = bioExtractions.find(
          (e) => e.document.docType === "CERTIFICATE_OF_ANALYSIS",
        );

        const extractedBioData = buildExtractedBioData({
          batches: batchExtractions.length > 0 ? batchExtractions : undefined,
          coa: coaExtraction ? (coaExtraction.structuredData as any) : undefined,
          stability: stabilityExtraction
            ? (stabilityExtraction.structuredData as any)
            : undefined,
          toxicology: toxExtraction
            ? (toxExtraction.structuredData as any)
            : undefined,
          pkStudy: pkExtraction ? (pkExtraction.structuredData as any) : undefined,
          protocol: protocolExtraction
            ? (protocolExtraction.structuredData as any)
            : undefined,
          isAfucosylated: program.drugClass?.toLowerCase().includes("afucosylated") ?? false,
        });

        const rulesResult = runBioRulesCheck(
          {
            drugClass: program.drugClass ?? "unknown",
            target: program.target ?? "unknown",
            mechanism: program.mechanism ?? "unknown",
            isAfucosylated: program.drugClass?.toLowerCase().includes("afucosylated"),
            isBifunctional: program.mechanism?.toLowerCase().includes("bifunctional"),
            payloadClass: program.payloadType ?? undefined,
          },
          extractedBioData,
        );

        // Upsert BioAnalysis record
        await prisma.bioAnalysis.upsert({
          where: { programId },
          create: {
            programId,
            cmcData: batchExtractions.length > 0 ? batchExtractions as any : null,
            stabilityProfile: stabilityExtraction?.structuredData as any ?? null,
            toxSummary: toxExtraction?.structuredData as any ?? null,
            pkSummary: pkExtraction?.structuredData as any ?? null,
            clinicalData: protocolExtraction?.structuredData as any ?? null,
            riskFlags: rulesResult.results.filter((r) => r.status === "fail") as any,
            riskScore: rulesResult.summary.failed > 0
              ? rulesResult.summary.failed / rulesResult.summary.total
              : 0,
            regulatoryFlags: rulesResult.results.filter(
              (r) => r.status === "fail" || r.status === "warning",
            ) as any,
          },
          update: {
            cmcData: batchExtractions.length > 0 ? batchExtractions as any : null,
            stabilityProfile: stabilityExtraction?.structuredData as any ?? null,
            toxSummary: toxExtraction?.structuredData as any ?? null,
            pkSummary: pkExtraction?.structuredData as any ?? null,
            clinicalData: protocolExtraction?.structuredData as any ?? null,
            riskFlags: rulesResult.results.filter((r) => r.status === "fail") as any,
            riskScore: rulesResult.summary.failed > 0
              ? rulesResult.summary.failed / rulesResult.summary.total
              : 0,
            regulatoryFlags: rulesResult.results.filter(
              (r) => r.status === "fail" || r.status === "warning",
            ) as any,
          },
        });

        return rulesResult;
      });

      void logAudit({
        orgId, programId, action: "bio.analysis_complete",
        metadata: {
          passed: analysisResult.summary.passed,
          failed: analysisResult.summary.failed,
          warnings: analysisResult.summary.warnings,
        },
      });

      // Step 5: Generate IND documents
      lastStep = "GENERATING_DOCS";
      await step.run("update-status-generating", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "GENERATING_DOCS" },
        });
      });

      const program = await step.run("fetch-program-for-docs", async () => {
        return prisma.bioProgram.findUniqueOrThrow({
          where: { id: programId },
          include: { bioAnalysis: true },
        });
      });

      // Build BioDocumentInput
      const bioDocInput = {
        programName: program.name,
        drugName: program.drugName ?? "Unknown",
        drugClass: program.drugClass ?? "unknown",
        target: program.target ?? undefined,
        mechanism: program.mechanism ?? undefined,
        indication: program.indication ?? undefined,
        phase: program.phase ?? undefined,
        sponsorName: program.sponsorName ?? "Sponsor",
        indNumber: program.indNumber ?? undefined,
        nctNumber: program.nctNumber ?? undefined,
        antibodyType: program.antibodyType ?? undefined,
        linkerType: program.linkerType ?? undefined,
        payloadType: program.payloadType ?? undefined,
        dar: program.dar ?? undefined,
        generatedAt: new Date(event.data.triggeredAt ?? Date.now()),
        // Extracted data for context
        batchData: bioExtractions
          .filter((e) => e.document.docType === "BATCH_RECORD")
          .map((e) => e.structuredData as Record<string, unknown>),
        stabilityData: bioExtractions.find(
          (e) => e.document.docType === "STABILITY_DATA",
        )?.structuredData as Record<string, unknown> | undefined,
        toxData: bioExtractions.find(
          (e) => e.document.docType === "TOXICOLOGY_REPORT",
        )?.structuredData as Record<string, unknown> | undefined,
        pkData: bioExtractions.find(
          (e) => e.document.docType === "PK_STUDY",
        )?.structuredData as Record<string, unknown> | undefined,
        clinicalData: bioExtractions.find(
          (e) => e.document.docType === "CLINICAL_PROTOCOL",
        )?.structuredData as Record<string, unknown> | undefined,
      };

      for (const docType of IND_DOC_TYPES) {
        await step.run(`generate-bio-${docType}`, async () => {
          try {
            const { generateSingleBioDocument } = await import("@/bio/generate-all");
            const result = await generateSingleBioDocument(docType, bioDocInput);

            const s3Key = `${orgId}/bio/${programId}/ind-documents/${docType}-v1.docx`;
            await uploadToS3(
              s3Key,
              result.buffer,
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            );

            // Delete existing for idempotency
            await prisma.bioGeneratedDocument.deleteMany({
              where: { programId, docType },
            });

            await prisma.bioGeneratedDocument.create({
              data: {
                programId,
                docType,
                s3Key,
                version: 1,
                status: result.status,
                complianceStatus: result.complianceReview.passed ? "PASSED" : "FLAGGED",
                complianceIssues: result.complianceReview.issues as any,
                verificationStatus: result.verification.passed ? "PASSED" : "FAILED",
                verificationIssues: result.verification.issues as any,
                regulatoryChecks: result.regulatoryChecks as any,
              },
            });
          } catch (error) {
            console.error(`Bio doc generation failed for ${docType}:`, error);

            // Create error placeholder
            const { Packer } = await import("docx");
            const { buildLegalDocument, documentTitle, bodyText } = await import(
              "@/documents/doc-helpers"
            );
            const errorDoc = buildLegalDocument({
              title: "Generation Error",
              children: [
                documentTitle("Document Generation Error"),
                bodyText(
                  `The ${docType} document could not be generated.`,
                ),
                bodyText(
                  `Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
                ),
                bodyText(
                  "Please retry generation or contact support.",
                ),
              ],
            });
            const errorBuffer = (await Packer.toBuffer(errorDoc)) as Buffer;
            const s3Key = `${orgId}/bio/${programId}/ind-documents/${docType}-v1.docx`;
            await uploadToS3(
              s3Key,
              errorBuffer,
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            );

            await prisma.bioGeneratedDocument.deleteMany({
              where: { programId, docType },
            });

            await prisma.bioGeneratedDocument.create({
              data: {
                programId,
                docType,
                s3Key,
                version: 1,
                status: "FLAGGED",
                complianceStatus: "FLAGGED",
                complianceIssues: [
                  {
                    severity: "critical",
                    section: "generation",
                    description: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
                    recommendation: "Retry generation",
                  },
                ] as any,
                verificationStatus: "FAILED",
                verificationIssues: [] as any,
              },
            });
          }
        });
      }

      // Step 6: Mark complete
      await step.run("mark-complete", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "COMPLETE" },
        });
      });

      void logAudit({
        orgId,
        programId,
        action: "bio.docs_generated",
        metadata: { docCount: IND_DOC_TYPES.length },
      });

      return {
        success: true,
        programId,
        documentsProcessed: bioExtractions.length,
        docsGenerated: IND_DOC_TYPES.length,
        analysisStatus: analysisResult.summary.failed > 0 ? "FLAGGED" : "PASSED",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline failed";
      console.error(`Bio pipeline failed at ${lastStep}:`, message);

      await prisma.bioProgram.update({
        where: { id: programId },
        data: {
          status: "ERROR",
          errorMessage: message.slice(0, 500),
          errorStep: lastStep,
        },
      }).catch(() => {});

      void logAudit({
        orgId,
        programId,
        action: "bio.pipeline_error",
        metadata: { step: lastStep, error: message.slice(0, 200) },
      });

      throw error; // Let Inngest retry
    }
  },
);

import { bioSamplePipeline } from "./bio-sample-pipeline";

export const bioFunctions = [bioPipeline, bioSamplePipeline];
