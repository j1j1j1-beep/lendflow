import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";

// IND document types to generate (same as bio-functions.ts)
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

/** Wrap a promise with a timeout. */
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

// Bio Sample Program Pipeline
// Skips OCR, classification, and extraction — data is pre-loaded from sample-data.
// Runs: Analyze (rules engine) -> Generate all 11 IND documents -> Complete.

export const bioSamplePipeline = inngest.createFunction(
  {
    id: "bio-sample-pipeline",
    name: "Bio Sample Program Pipeline",
    retries: 2,
  },
  { event: "bio/sample-process" },
  async ({ event, step }) => {
    const { programId, orgId } = event.data as {
      programId: string;
      orgId: string;
      triggeredAt?: number;
    };

    let lastStep = "INIT";

    try {
      void logAudit({ orgId, programId, action: "bio.sample_pipeline_started" });

      // Step 1: Mark as ANALYZING and run rules engine
      lastStep = "ANALYZING";
      const analysisResult = await step.run("analyze-bio-sample", async () => {
        await prisma.bioProgram.update({
          where: { id: programId },
          data: { status: "ANALYZING" },
        });

        const program = await prisma.bioProgram.findUniqueOrThrow({
          where: { id: programId },
        });

        // Fetch pre-loaded extractions
        const bioExtractions = await prisma.bioExtraction.findMany({
          where: { programId },
          include: { document: true },
        });

        // Build extracted data for rules engine (same logic as bio-functions.ts)
        const { runBioRulesCheck } = await import("@/bio/rules");
        const { buildExtractedBioData } = await import("@/bio/mapping");

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

        return {
          rulesResult,
          bioExtractions: bioExtractions.map((e) => ({
            id: e.id,
            docType: e.document.docType,
            structuredData: e.structuredData,
          })),
        };
      });

      void logAudit({
        orgId, programId, action: "bio.analysis_complete",
        metadata: {
          passed: analysisResult.rulesResult.summary.passed,
          failed: analysisResult.rulesResult.summary.failed,
          warnings: analysisResult.rulesResult.summary.warnings,
          source: "sample",
        },
      });

      // Step 2: Generate IND documents
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

      // Build BioDocumentInput (same structure as bio-functions.ts)
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
        batchData: analysisResult.bioExtractions
          .filter((e) => e.docType === "BATCH_RECORD")
          .map((e) => e.structuredData as Record<string, unknown>),
        stabilityData: analysisResult.bioExtractions.find(
          (e) => e.docType === "STABILITY_DATA",
        )?.structuredData as Record<string, unknown> | undefined,
        toxData: analysisResult.bioExtractions.find(
          (e) => e.docType === "TOXICOLOGY_REPORT",
        )?.structuredData as Record<string, unknown> | undefined,
        pkData: analysisResult.bioExtractions.find(
          (e) => e.docType === "PK_STUDY",
        )?.structuredData as Record<string, unknown> | undefined,
        clinicalData: analysisResult.bioExtractions.find(
          (e) => e.docType === "CLINICAL_PROTOCOL",
        )?.structuredData as Record<string, unknown> | undefined,
      };

      // Generate each IND document
      for (const docType of IND_DOC_TYPES) {
        await step.run(`generate-bio-sample-${docType}`, async () => {
          try {
            const { generateSingleBioDocument } = await import("@/bio/generate-all");
            const result = await withTimeout(
              generateSingleBioDocument(docType, bioDocInput),
              120_000,
              `generate-bio-sample-${docType}`,
            );

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
            console.error(`Bio sample doc generation failed for ${docType}:`, error);

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

      // Step 3: Mark complete
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
        metadata: { docCount: IND_DOC_TYPES.length, source: "sample" },
      });

      return {
        success: true,
        programId,
        docsGenerated: IND_DOC_TYPES.length,
        analysisStatus: analysisResult.rulesResult.summary.failed > 0 ? "FLAGGED" : "PASSED",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline failed";
      console.error(`Bio sample pipeline failed at ${lastStep}:`, message);

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
        metadata: { step: lastStep, error: message.slice(0, 200), source: "sample" },
      });

      throw error; // Let Inngest retry
    }
  },
);
