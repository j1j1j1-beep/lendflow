import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { analyzeDocument, pollLendingAnalysis } from "@/lib/textract";
import type { LendingPage } from "@/lib/textract";
import { getS3Buffer, uploadToS3 } from "@/lib/s3";
import { classifyDocument, extractDocument, validateExtraction } from "@/extraction/extract";
import { classifyByKeywords } from "@/extraction/keyword-classifier";
import { LENDING_SUPPORTED_TYPES } from "@/extraction/lending-field-map";
import { attemptBulkResolution } from "@/extraction/resolver";
import { runMathChecks } from "@/verification/math-checks";
import { runCrossDocChecks } from "@/verification/cross-document";
import { compareTextractVsStructured } from "@/verification/textract-vs-structured";
import { evaluateReviewGate } from "@/verification/review-gate";
import { runFullAnalysis } from "@/analysis/analyze";
import { generateCreditMemo } from "@/memo/generate";
import { sendAnalysisComplete, sendReviewNeeded } from "@/lib/resend";
import type { DocType } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Shared helper: step-level timeout
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared helper: build DocumentInput for loan document generation
// ---------------------------------------------------------------------------

/** Build the DocumentInput object for loan document generation. Shared across all pipeline paths. */
async function buildDocInput(dealId: string) {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { dealTerms: true },
  });

  if (!deal.loanProgramId || !deal.dealTerms) return null;

  const { getLoanProgram } = await import("@/config/loan-programs");
  const program = getLoanProgram(deal.loanProgramId);
  if (!program) return null;

  const { computeMaturityDate, computeFirstPaymentDate } = await import("@/documents/doc-helpers");

  const terms = deal.dealTerms;
  const stateMatch = deal.propertyAddress?.match(/,\s*([A-Z]{2})\s+\d{5}/);
  const stateAbbr = stateMatch ? stateMatch[1] : null;
  const generatedAt = new Date();

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: deal.orgId },
  });

  const docInput = {
    dealId,
    borrowerName: deal.borrowerName,
    lenderName: org.name,
    guarantorName: terms.personalGuaranty ? deal.borrowerName : null,
    loanAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
    loanPurpose: deal.loanPurpose,
    propertyAddress: deal.propertyAddress,
    stateAbbr,
    terms: {
      approvedAmount: Number(terms.approvedAmount),
      interestRate: terms.interestRate,
      termMonths: terms.termMonths,
      amortizationMonths: terms.amortizationMonths,
      ltv: terms.ltv,
      monthlyPayment: Number(terms.monthlyPayment),
      baseRateType: terms.baseRateType,
      baseRateValue: terms.baseRateValue,
      spread: terms.spread,
      interestOnly: terms.interestOnly,
      prepaymentPenalty: terms.prepaymentPenalty,
      personalGuaranty: terms.personalGuaranty,
      requiresAppraisal: terms.requiresAppraisal,
      covenants: terms.covenants as any[],
      conditions: terms.conditions as any[],
      specialTerms: terms.specialTerms as any[] | null,
      fees: terms.fees as any[],
      lateFeePercent: 0.05,
      lateFeeGraceDays: 15,
    },
    programName: program.name,
    programId: program.id,
    programCategory: program.category,
    collateralTypes: program.structuringRules.collateralTypes,
    subordinateCreditorName: null,
    secondLienLenderName: null,
    entityType: null,
    debtorAddress: deal.propertyAddress,
    debtorStateOfOrganization: stateAbbr,
    debtorOrganizationId: null,
    generatedAt,
    maturityDate: computeMaturityDate(generatedAt, terms.termMonths),
    firstPaymentDate: computeFirstPaymentDate(generatedAt),
  };

  const selectedDocs = deal.selectedOutputDocs;
  const docsToGenerate = Array.isArray(selectedDocs) && selectedDocs.length > 0
    ? selectedDocs
    : program.requiredOutputDocs;

  return { docInput, docsToGenerate, deal };
}

// ---------------------------------------------------------------------------
// Shared helper: generate a single doc, upload to S3, save record
// ---------------------------------------------------------------------------

/**
 * Generate one document, upload to S3, and save the GeneratedDocument record.
 * If generation fails, creates an error placeholder so the pipeline continues.
 * S3/DB errors propagate (Inngest will retry the step).
 */
async function generateAndSaveDocument(
  dealId: string,
  docType: string,
  orgId: string,
): Promise<void> {
  const built = await buildDocInput(dealId);
  if (!built) return;

  const { generateSingleDocument } = await import("@/documents/generate-all");

  let result: Awaited<ReturnType<typeof generateSingleDocument>>;
  try {
    result = await generateSingleDocument(docType, built.docInput);
  } catch (error) {
    console.error(`Failed to generate ${docType}:`, error);
    const { Packer } = await import("docx");
    const { buildLegalDocument, documentTitle, bodyText } = await import("@/documents/doc-helpers");
    const { DOC_TYPE_LABELS } = await import("@/documents/types");
    const errorDoc = buildLegalDocument({
      title: "Generation Error",
      children: [
        documentTitle("Document Generation Error"),
        bodyText(`The ${DOC_TYPE_LABELS[docType] ?? docType} could not be generated.`),
        bodyText(`Error: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`),
        bodyText("Please retry generation or create this document manually."),
      ],
    });
    const errorBuffer = await Packer.toBuffer(errorDoc) as Buffer;
    const s3Key = `${orgId}/${dealId}/loan-documents/${docType}-v1.docx`;
    await uploadToS3(s3Key, errorBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    await prisma.generatedDocument.create({
      data: {
        dealId,
        docType,
        s3Key,
        version: 1,
        status: "FLAGGED",
        legalReviewStatus: "FLAGGED",
        legalIssues: [{
          severity: "critical",
          section: "generation",
          description: `Document generation failed: ${error instanceof Error ? error.message.slice(0, 200) : "Unknown error"}`,
          recommendation: "Retry generation or create document manually",
        }] as any,
        verificationStatus: "FAILED",
        verificationIssues: [] as any,
      },
    });
    return;
  }

  const s3Key = `${orgId}/${dealId}/loan-documents/${result.docType}-v1.docx`;
  await uploadToS3(
    s3Key,
    result.buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  await prisma.generatedDocument.create({
    data: {
      dealId,
      docType: result.docType,
      s3Key,
      version: 1,
      status: result.status,
      legalReviewStatus: result.legalReview.passed ? "APPROVED" : "FLAGGED",
      legalIssues: result.legalReview.issues as any,
      verificationStatus: result.verification.passed ? "PASSED" : "FAILED",
      verificationIssues: result.verification.issues as any,
      complianceChecks: result.complianceChecks as any,
    },
  });
}

// ---------------------------------------------------------------------------
// Main analysis pipeline
// ---------------------------------------------------------------------------

export const analysisPipeline = inngest.createFunction(
  {
    id: "analysis-pipeline",
    name: "Document Analysis Pipeline",
    retries: 2,
    idempotency: "event.data.dealId",
  },
  { event: "deal/analyze" },
  async ({ event, step }) => {
    const { dealId } = event.data as { dealId: string };

    // Guard: skip if deal is already in a processing state
    const currentDeal = await step.run("check-idempotent", async () => {
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) return { skip: true };

      const processingStatuses = [
        "PROCESSING_OCR", "CLASSIFYING", "EXTRACTING", "VERIFYING",
        "RESOLVING", "ANALYZING", "GENERATING_MEMO", "STRUCTURING", "GENERATING_DOCS",
      ];

      if (processingStatuses.includes(deal.status)) {
        console.log(`[idempotency] Deal ${dealId} already in ${deal.status}, skipping duplicate`);
        return { skip: true };
      }

      return { skip: false };
    });

    if (currentDeal.skip) {
      return { success: false, dealId, error: "Deal already being processed" };
    }

    let lastStep = "INIT";

    try {
      // -----------------------------------------------------------------------
      // Step 1: OCR + Classification via Textract Lending
      // Textract Lending auto-classifies documents AND extracts standardized
      // fields in one pass. For unsupported types, we fall back to basic
      // Textract OCR + Claude classification.
      // -----------------------------------------------------------------------
      lastStep = "PROCESSING_OCR";
      const documents = await step.run("fetch-documents", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "PROCESSING_OCR", errorMessage: null, errorStep: null },
        });

        return prisma.document.findMany({
          where: { dealId, status: "PENDING" },
        });
      });

      // Map from docId -> LendingPage[] for Lending-supported types
      const lendingPagesByDoc = new Map<string, LendingPage[]>();

      const ocrResults: { docId: string; success: boolean }[] = [];

      for (const doc of documents) {
        const result = await step.run(`ocr-lending-${doc.id}`, async () => {
          try {
            await prisma.document.update({
              where: { id: doc.id },
              data: { status: "OCR_PROCESSING" },
            });

            // Try Textract Lending first — handles multi-page PDFs, auto-classifies
            const lendingResult = await withTimeout(
              pollLendingAnalysis(doc.s3Key),
              120_000,
              `OCR-lending-${doc.id}`,
            );

            // Store lending pages for extraction step
            const pages = lendingResult.pages;

            // Build a TextractResult-compatible object from lending output
            // so downstream verification (textract-vs-structured) still works
            const allKvPairs = pages.flatMap((p) => p.keyValuePairs);
            const allTables = pages.flatMap((p) => p.tables);
            let rawText = pages.map((p) => p.rawText).join("\n").trim();

            // Lending API often returns empty rawText (it focuses on structured fields).
            // Always also run basic AnalyzeDocument to get raw OCR text, KV pairs,
            // and tables that downstream extraction (Grok) needs.
            let basicResult: Awaited<ReturnType<typeof analyzeDocument>> | null = null;
            try {
              basicResult = await withTimeout(
                analyzeDocument(doc.s3Key),
                120_000,
                `OCR-basic-${doc.id}`,
              );
              if (!rawText && basicResult.rawText) rawText = basicResult.rawText;
            } catch {
              // Best-effort — lending data alone may suffice for IRS forms
            }

            // Merge: prefer basic AnalyzeDocument for text/KV/tables (more complete),
            // keep lending fields for IRS form extraction
            const textractResult = {
              rawText: rawText || basicResult?.rawText || "",
              pageCount: lendingResult.pageCount,
              keyValuePairs: basicResult?.keyValuePairs ?? allKvPairs,
              tables: basicResult?.tables ?? allTables,
            };

            await prisma.document.update({
              where: { id: doc.id },
              data: {
                status: "OCR_COMPLETE",
                textractOutput: textractResult as any,
                ocrText: rawText,
                pageCount: lendingResult.pageCount,
              },
            });

            return { docId: doc.id, success: true, lendingPages: pages };
          } catch (error) {
            // Lending API failed — fall back to basic AnalyzeDocument
            try {
              const textractResult = await withTimeout(
                analyzeDocument(doc.s3Key),
                120_000,
                `OCR-fallback-${doc.id}`,
              );
              await prisma.document.update({
                where: { id: doc.id },
                data: {
                  status: "OCR_COMPLETE",
                  textractOutput: textractResult as any,
                  ocrText: textractResult.rawText,
                  pageCount: textractResult.pageCount,
                },
              });
              return { docId: doc.id, success: true, lendingPages: null };
            } catch (fallbackError) {
              const message = fallbackError instanceof Error ? fallbackError.message : "OCR failed";
              await prisma.document.update({
                where: { id: doc.id },
                data: { status: "ERROR" },
              });
              console.error(`OCR failed for document ${doc.id}:`, message);
              return { docId: doc.id, success: false, lendingPages: null };
            }
          }
        });

        ocrResults.push({ docId: result.docId, success: result.success });
        if (result.lendingPages) {
          lendingPagesByDoc.set(result.docId, result.lendingPages);
        }
      }

      const ocrSuccessIds = ocrResults.filter((r) => r.success).map((r) => r.docId);
      if (ocrSuccessIds.length === 0) {
        await step.run("ocr-all-failed", async () => {
          await prisma.deal.update({
            where: { id: dealId },
            data: {
              status: "ERROR",
              errorMessage: "All documents failed OCR processing",
              errorStep: "PROCESSING_OCR",
            },
          });
        });
        return { success: false, dealId, error: "All documents failed OCR" };
      }

      // -----------------------------------------------------------------------
      // Step 2: Classify — Lending-supported types auto-classified by Textract,
      //         others fall back to Claude classification
      // -----------------------------------------------------------------------
      lastStep = "CLASSIFYING";
      await step.run("update-status-classifying", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "CLASSIFYING" },
        });
      });

      // Map Textract Lending pageType to our DocType enum
      const LENDING_PAGE_TYPE_MAP: Record<string, string> = {
        "1040": "FORM_1040",
        "1040_SCHEDULE_C": "FORM_1040", // Schedule C is part of 1040 filing
        "1040_SCHEDULE_E": "FORM_1040",
        "W-2": "W2",
        "W2": "W2",
        "1099": "OTHER",
        "1120": "FORM_1120",
        "1120S": "FORM_1120S",
        "1065": "FORM_1065",
        "BANK_STATEMENT": "BANK_STATEMENT_CHECKING",
      };

      const validDocTypes: string[] = [
        "FORM_1040", "FORM_1120", "FORM_1120S", "FORM_1065",
        "SCHEDULE_K1", "W2", "BANK_STATEMENT_CHECKING",
        "BANK_STATEMENT_SAVINGS", "PROFIT_AND_LOSS",
        "BALANCE_SHEET", "RENT_ROLL", "OTHER",
      ];

      for (const docId of ocrSuccessIds) {
        await step.run(`classify-${docId}`, async () => {
          try {
            const doc = await prisma.document.findUniqueOrThrow({
              where: { id: docId },
            });

            await prisma.document.update({
              where: { id: docId },
              data: { status: "CLASSIFYING" },
            });

            const lendingPages = lendingPagesByDoc.get(docId);
            let docType = "OTHER";
            let docYear: number | null = null;

            if (lendingPages && lendingPages.length > 0) {
              // Use Textract Lending classification (first page determines type)
              const primaryPage = lendingPages[0];
              const mappedType = LENDING_PAGE_TYPE_MAP[primaryPage.pageType];
              if (mappedType && validDocTypes.includes(mappedType)) {
                docType = mappedType;
              }
              // Try to extract year from lending fields
              const yearField = primaryPage.lendingFields.find(
                (f) => {
                  const normalized = f.type.toLowerCase().replace(/[\s_-]/g, "");
                  return normalized.includes("taxyear") || normalized.includes("year");
                }
              );
              if (yearField) {
                const parsed = parseInt(yearField.value, 10);
                if (parsed > 1900 && parsed < 2100) docYear = parsed;
              }
            }

            // If Lending didn't classify or returned OTHER, try keyword classifier first
            if (docType === "OTHER") {
              // Tier 2: Deterministic keyword + KV matching on OCR text
              const textractOutput = doc.textractOutput as any;
              const ocrText = doc.ocrText ?? textractOutput?.rawText ?? "";
              const kvPairs = textractOutput?.keyValuePairs ?? [];

              const keywordResult = classifyByKeywords(ocrText, kvPairs);

              if (keywordResult.docType && validDocTypes.includes(keywordResult.docType)) {
                docType = keywordResult.docType;
                console.log(`[classify] ${doc.id}: keyword classifier → ${docType} (${keywordResult.confidence}, ${keywordResult.method})`);

                // Try to extract year from OCR text
                if (!docYear && ocrText) {
                  const yearMatch = ocrText.match(/(?:tax\s*year|for\s*(?:the\s*)?year|period\s*ending)\s*(\d{4})/i);
                  if (yearMatch) {
                    const y = parseInt(yearMatch[1], 10);
                    if (y > 1900 && y < 2100) docYear = y;
                  }
                  // Fallback: look for standalone 4-digit years 2020-2029
                  if (!docYear) {
                    const recentYear = ocrText.match(/\b(202\d)\b/);
                    if (recentYear) docYear = parseInt(recentYear[1], 10);
                  }
                }
              } else {
                // Tier 3: Grok AI as last resort
                const pdfBuffer = await getS3Buffer(doc.s3Key);
                const classification = await withTimeout(
                  classifyDocument(pdfBuffer),
                  60_000,
                  `classify-AI-${docId}`,
                );
                docType = validDocTypes.includes(classification.docType)
                  ? classification.docType
                  : "OTHER";
                docYear = classification.year ?? null;
                console.log(`[classify] ${doc.id}: Grok AI → ${docType}`);
              }
            }

            await prisma.document.update({
              where: { id: docId },
              data: {
                status: "CLASSIFIED",
                docType: docType as DocType,
                docYear,
              },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Classification failed";
            await prisma.document.update({
              where: { id: docId },
              data: { status: "ERROR" },
            });
            console.error(`Classification failed for document ${docId}:`, message);
          }
        });
      }

      // -----------------------------------------------------------------------
      // Step 3: Extract — Lending-supported types use deterministic mapping,
      //         others use Claude extraction
      // -----------------------------------------------------------------------
      lastStep = "EXTRACTING";
      const classifiedDocs = await step.run("fetch-classified-docs", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "EXTRACTING" },
        });

        return prisma.document.findMany({
          where: { dealId, status: "CLASSIFIED" },
        });
      });

      if (classifiedDocs.length === 0) {
        await step.run("classify-all-failed", async () => {
          await prisma.deal.update({
            where: { id: dealId },
            data: {
              status: "ERROR",
              errorMessage: "No documents were successfully classified",
              errorStep: "CLASSIFYING",
            },
          });
        });
        return { success: false, dealId, error: "No documents classified" };
      }

      for (const doc of classifiedDocs) {
        await step.run(`extract-${doc.id}`, async () => {
          try {
            await prisma.document.update({
              where: { id: doc.id },
              data: { status: "EXTRACTING" },
            });

            const textractResult = doc.textractOutput as any;
            const pdfBuffer = await getS3Buffer(doc.s3Key);

            // Find the best lending page for this doc (if available)
            const lendingPages = lendingPagesByDoc.get(doc.id);
            let lendingPage: LendingPage | undefined;
            if (lendingPages && lendingPages.length > 0) {
              // Use the first page that matches a supported type
              lendingPage = lendingPages.find((p) =>
                LENDING_SUPPORTED_TYPES.has(p.pageType)
              );
            }

            if (!doc.docType) {
              console.error(`Document ${doc.id} has no docType after classification, skipping extraction`);
              await prisma.document.update({
                where: { id: doc.id },
                data: { status: "ERROR" },
              });
              return;
            }

            const extraction = await withTimeout(
              extractDocument(
                textractResult,
                doc.docType,
                pdfBuffer,
                lendingPage
              ),
              90_000,
              `extract-${doc.id}`,
            );

            // Sanity check: if extraction returned mostly empty data, flag it
            if (doc.docType !== "OTHER") {
              const data = extraction.structuredData;
              const topLevelKeys = Object.keys(data);
              const nonEmptyKeys = topLevelKeys.filter((k) => {
                const v = data[k];
                if (v === null || v === undefined) return false;
                if (typeof v === "number") return true; // Zero is valid for financial data
                if (typeof v === "string") return v.length > 0;
                if (typeof v === "object" && !Array.isArray(v)) {
                  return Object.values(v as Record<string, unknown>).some(
                    (sv) => sv !== null && sv !== undefined && (typeof sv === "number" || (typeof sv === "string" && sv.length > 0))
                  );
                }
                return true; // Arrays and other types count as non-empty
              });

              if (nonEmptyKeys.length === 0) {
                console.error(`Extraction sanity check failed for ${doc.id} (${doc.docType}): all fields empty`);
                await prisma.document.update({
                  where: { id: doc.id },
                  data: { status: "ERROR" },
                });
                return; // Skip this doc, don't save garbage extraction
              }
            }

            const validationErrors = validateExtraction(doc.docType, extraction.structuredData);

            // Delete existing extraction for this document (idempotency on retry)
            await prisma.extraction.deleteMany({ where: { documentId: doc.id, dealId } });

            await prisma.extraction.create({
              data: {
                documentId: doc.id,
                dealId,
                model: extraction.model,
                promptVersion: extraction.promptVersion,
                rawResponse: extraction.rawResponse as any,
                structuredData: extraction.structuredData as any,
                validationErrors: validationErrors as any,
                tokensUsed: extraction.tokensUsed ?? 0,
                costUsd: extraction.costUsd ?? 0,
              },
            });

            await prisma.document.update({
              where: { id: doc.id },
              data: { status: "EXTRACTED" },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Extraction failed";
            await prisma.document.update({
              where: { id: doc.id },
              data: { status: "ERROR" },
            });
            console.error(`Extraction failed for document ${doc.id}:`, message);
          }
        });
      }

      // Check at least one extraction succeeded
      const extractions = await step.run("fetch-extractions", async () => {
        return prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });
      });

      if (extractions.length === 0) {
        await step.run("extract-all-failed", async () => {
          await prisma.deal.update({
            where: { id: dealId },
            data: {
              status: "ERROR",
              errorMessage: "No documents were successfully extracted",
              errorStep: "EXTRACTING",
            },
          });
        });
        return { success: false, dealId, error: "No extractions succeeded" };
      }

      // -----------------------------------------------------------------------
      // Step 4: Verify - Run all verification checks
      // -----------------------------------------------------------------------
      lastStep = "VERIFYING";
      const verificationReport = await step.run("verify", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "VERIFYING" },
        });

        // Math checks on each extraction
        const allMathChecks: any[] = [];
        for (const ext of extractions) {
          const docType = ext.document.docType ?? "OTHER";
          const checks = runMathChecks(docType, ext.structuredData);
          allMathChecks.push(...checks.map((c) => ({ ...c, documentId: ext.documentId })));
        }

        const mathPassed = allMathChecks.filter((c) => c.passed).length;
        const mathFailed = allMathChecks.filter((c) => !c.passed).length;

        // Cross-document checks
        const crossDocResults = runCrossDocChecks(
          extractions.map((ext) => ({
            docType: ext.document.docType ?? "OTHER",
            data: ext.structuredData as Record<string, any>,
          }))
        );
        const crossDocPassed = crossDocResults.filter((c: any) => c.status === "pass").length;
        const crossDocFailed = crossDocResults.filter((c: any) => c.status === "fail").length;
        const crossDocWarnings = crossDocResults.filter((c: any) => c.status === "warning").length;

        // Textract vs structured comparison
        const allTextractChecks: any[] = [];
        for (const ext of extractions) {
          const textractResult = ext.document.textractOutput as any;
          if (textractResult) {
            const checks = compareTextractVsStructured(
              ext.document.docType ?? "OTHER",
              ext.structuredData as Record<string, any>,
              textractResult.keyValuePairs ?? textractResult
            );
            allTextractChecks.push(
              ...checks.map((c: any) => ({ ...c, documentId: ext.documentId }))
            );
          }
        }

        const textractAgreed = allTextractChecks.filter((c) => c.agreed).length;
        const textractDisagreed = allTextractChecks.filter((c) => !c.agreed).length;

        // Build field-level verification summary
        const fieldVerification = extractions.map((ext) => ({
          documentId: ext.documentId,
          docType: ext.document.docType,
          mathChecks: allMathChecks.filter((c) => c.documentId === ext.documentId),
          textractChecks: allTextractChecks.filter((c) => c.documentId === ext.documentId),
        }));

        // Determine overall status
        const TEXTRACT_DISAGREE_THRESHOLD = 2;
        let overallStatus = "PASS";
        if (mathFailed > 0 || crossDocFailed > 0 || textractDisagreed > TEXTRACT_DISAGREE_THRESHOLD) {
          overallStatus = "FAIL";
        } else if (crossDocWarnings > 0 || textractDisagreed > 0) {
          overallStatus = "WARNING";
        }

        // Create or update verification report
        const report = await prisma.verificationReport.upsert({
          where: { dealId },
          create: {
            dealId,
            mathChecks: allMathChecks as any,
            mathPassed,
            mathFailed,
            crossDocChecks: crossDocResults as any,
            crossDocPassed,
            crossDocFailed,
            crossDocWarnings,
            textractChecks: allTextractChecks as any,
            textractAgreed,
            textractDisagreed,
            fieldVerification: fieldVerification as any,
            overallStatus,
          },
          update: {
            mathChecks: allMathChecks as any,
            mathPassed,
            mathFailed,
            crossDocChecks: crossDocResults as any,
            crossDocPassed,
            crossDocFailed,
            crossDocWarnings,
            textractChecks: allTextractChecks as any,
            textractAgreed,
            textractDisagreed,
            fieldVerification: fieldVerification as any,
            overallStatus,
          },
        });

        // Update document statuses
        for (const ext of extractions) {
          await prisma.document.update({
            where: { id: ext.documentId },
            data: { status: "VERIFIED" },
          });
        }

        return report;
      });

      // -----------------------------------------------------------------------
      // Step 5: Self-resolve - Attempt to fix failures
      // -----------------------------------------------------------------------
      lastStep = "RESOLVING";
      await step.run("self-resolve", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "RESOLVING" },
        });

        const failedChecks = [
          ...(verificationReport.mathChecks as any[]).filter((c: any) => !c.passed),
          ...(verificationReport.crossDocChecks as any[]).filter(
            (c: any) => c.status === "fail"
          ),
          ...(verificationReport.textractChecks as any[]).filter(
            (c: any) => !c.agreed
          ),
        ];

        if (failedChecks.length === 0) {
          return extractions;
        }

        const currentExtractions = await prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });

        // Resolve discrepancies per-document (each needs its own context)
        for (const ext of currentExtractions) {
          const textractOutput = ext.document.textractOutput as any;
          if (!textractOutput) continue;

          const docChecks = failedChecks.filter(
            (c: any) => c.documentId === ext.documentId
          );
          if (docChecks.length === 0) continue;

          const docType = ext.document.docType ?? "OTHER";
          const formType = ["FORM_1040", "FORM_1120", "FORM_1120S", "FORM_1065"].includes(docType)
            ? docType as any
            : null;

          const resolutions = await attemptBulkResolution(
            docChecks,
            {
              textractResult: textractOutput,
              docType,
              formType,
              documentId: ext.documentId,
              dealId,
            }
          );

          // Apply resolved values back to extraction
          for (const item of resolutions.resolved) {
            const data = ext.structuredData as Record<string, any>;
            setNestedValue(data, item.discrepancy.fieldPath, item.result.resolvedValue);
            await prisma.extraction.update({
              where: { id: ext.id },
              data: { structuredData: data as any },
            });
          }
        }

        return prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });
      });

      // -----------------------------------------------------------------------
      // Step 5b: Re-verify after resolution — so review gate sees FIXED data
      // -----------------------------------------------------------------------
      await step.run("re-verify-after-resolve", async () => {
        const currentExtractions = await prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });

        // Re-run all verification checks on the resolved data
        const allMathChecks: any[] = [];
        for (const ext of currentExtractions) {
          const docType = ext.document.docType ?? "OTHER";
          const checks = runMathChecks(docType, ext.structuredData);
          allMathChecks.push(...checks.map((c) => ({ ...c, documentId: ext.documentId })));
        }

        const crossDocResults = runCrossDocChecks(
          currentExtractions.map((ext) => ({
            docType: ext.document.docType ?? "OTHER",
            data: ext.structuredData as Record<string, any>,
          }))
        );

        const allTextractChecks: any[] = [];
        for (const ext of currentExtractions) {
          const textractResult = ext.document.textractOutput as any;
          if (textractResult) {
            const checks = compareTextractVsStructured(
              ext.document.docType ?? "OTHER",
              ext.structuredData as Record<string, any>,
              textractResult.keyValuePairs ?? textractResult
            );
            allTextractChecks.push(
              ...checks.map((c: any) => ({ ...c, documentId: ext.documentId }))
            );
          }
        }

        const mathPassed = allMathChecks.filter((c) => c.passed).length;
        const mathFailed = allMathChecks.filter((c) => !c.passed).length;
        const crossDocPassed = crossDocResults.filter((c: any) => c.status === "pass").length;
        const crossDocFailed = crossDocResults.filter((c: any) => c.status === "fail").length;
        const crossDocWarnings = crossDocResults.filter((c: any) => c.status === "warning").length;
        const textractAgreed = allTextractChecks.filter((c) => c.agreed).length;
        const textractDisagreed = allTextractChecks.filter((c) => !c.agreed).length;

        const TEXTRACT_DISAGREE_THRESHOLD = 2;
        let overallStatus = "PASS";
        if (mathFailed > 0 || crossDocFailed > 0 || textractDisagreed > TEXTRACT_DISAGREE_THRESHOLD) {
          overallStatus = "FAIL";
        } else if (crossDocWarnings > 0 || textractDisagreed > 0) {
          overallStatus = "WARNING";
        }

        // Update the verification report with post-resolution results
        await prisma.verificationReport.upsert({
          where: { dealId },
          create: {
            dealId,
            mathChecks: allMathChecks as any,
            mathPassed,
            mathFailed,
            crossDocChecks: crossDocResults as any,
            crossDocPassed,
            crossDocFailed,
            crossDocWarnings,
            textractChecks: allTextractChecks as any,
            textractAgreed,
            textractDisagreed,
            fieldVerification: [] as any,
            overallStatus,
          },
          update: {
            mathChecks: allMathChecks as any,
            mathPassed,
            mathFailed,
            crossDocChecks: crossDocResults as any,
            crossDocPassed,
            crossDocFailed,
            crossDocWarnings,
            textractChecks: allTextractChecks as any,
            textractAgreed,
            textractDisagreed,
            overallStatus,
          },
        });
      });

      // -----------------------------------------------------------------------
      // Step 6: Review Gate - Check if human review needed
      // -----------------------------------------------------------------------
      lastStep = "REVIEW_GATE";
      const reviewGateResult = await step.run("review-gate", async () => {
        const latestReport = await prisma.verificationReport.findUnique({
          where: { dealId },
        });

        const reportData = latestReport as any;
        return evaluateReviewGate({
          mathChecks: (reportData?.mathChecks ?? []) as any[],
          crossDocChecks: (reportData?.crossDocChecks ?? []) as any[],
          textractComparisons: (reportData?.textractChecks ?? []) as any[],
        });
      });

      if (!reviewGateResult.canProceed) {
        await step.run("create-review-items", async () => {
          // Delete existing PENDING review items for idempotency on retry
          await prisma.reviewItem.deleteMany({
            where: { dealId, status: "PENDING" },
          });

          // Create review items for each flagged issue
          for (const item of reviewGateResult.reviewItems) {
            await prisma.reviewItem.create({
              data: {
                dealId,
                documentId: item.documentId ?? null,
                fieldPath: item.fieldPath,
                extractedValue: String(item.extractedValue),
                expectedValue: item.expectedValue ? String(item.expectedValue) : null,
                checkType: item.checkType,
                description: item.description,
                documentPage: item.documentPage ?? null,
                status: "PENDING",
              },
            });
          }

          await prisma.deal.update({
            where: { id: dealId },
            data: { status: "NEEDS_REVIEW" },
          });

          // Send review needed email
          const deal = await prisma.deal.findUniqueOrThrow({
            where: { id: dealId },
            include: { user: true },
          });

          await sendReviewNeeded({
            to: deal.user.email,
            borrowerName: deal.borrowerName,
            dealId,
            reviewCount: reviewGateResult.reviewItems.length,
          });
        });

        return {
          success: true,
          dealId,
          status: "NEEDS_REVIEW",
          reviewItemCount: reviewGateResult.reviewItems.length,
        };
      }

      // -----------------------------------------------------------------------
      // Step 7: Analyze - Run full analysis
      // -----------------------------------------------------------------------
      lastStep = "ANALYZING";
      const analysis = await step.run("analyze", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "ANALYZING" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
        });

        const latestExtractions = await prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });

        const analysisResult = runFullAnalysis({
          extractions: latestExtractions.map((ext) => ({
            docType: ext.document.docType ?? "OTHER",
            data: ext.structuredData as Record<string, any>,
          })),
          proposedLoanAmount: deal.loanAmount ? Number(deal.loanAmount) : undefined,
          proposedRate: deal.proposedRate ?? undefined,
          proposedTerm: deal.proposedTerm ?? undefined,
        });

        // Create or update analysis record
        const analysisData = {
          totalGrossIncome: analysisResult.income.totalGrossIncome,
          totalNetIncome: analysisResult.income.totalNetIncome,
          incomeSources: analysisResult.income.sources as any,
          incomeTrend: analysisResult.income.trend ?? null,
          globalDscr: analysisResult.dscr.globalDscr ?? null,
          propertyDscr: analysisResult.dscr.propertyDscr ?? null,
          frontEndDti: analysisResult.dti.frontEndDti ?? null,
          backEndDti: analysisResult.dti.backEndDti ?? null,
          ltv: null as number | null,
          currentRatio: analysisResult.liquidity.currentRatio ?? null,
          quickRatio: analysisResult.liquidity.quickRatio ?? null,
          debtToEquity: analysisResult.liquidity.debtToEquity ?? null,
          avgDailyBalance: analysisResult.liquidity.averageDailyBalance ?? null,
          minBalance: analysisResult.liquidity.minimumBalance ?? null,
          monthsOfReserves: analysisResult.liquidity.monthsOfReserves ?? null,
          largeDeposits: analysisResult.cashflow.largeDeposits as any ?? null,
          avgMonthlyDeposits: analysisResult.cashflow.averageMonthlyDeposits ?? null,
          depositVsIncome: analysisResult.cashflow.depositToIncomeRatio ?? null,
          nsfCount: analysisResult.cashflow.nsfCount ?? null,
          revenueByYear: analysisResult.business?.revenueByYear as any ?? null,
          expenseRatio: analysisResult.business?.expenseRatio ?? null,
          ownerComp: analysisResult.business?.ownerCompensation ?? null,
          addBacks: analysisResult.business?.addBacks as any ?? null,
          riskFlags: analysisResult.riskFlags as any,
          riskScore: analysisResult.riskScore,
          fullResults: analysisResult as any,
        };
        const analysisRecord = await prisma.analysis.upsert({
          where: { dealId },
          create: { dealId, ...analysisData },
          update: analysisData,
        });

        return analysisRecord;
      });

      // -----------------------------------------------------------------------
      // Step 8: Structure deal (Phase 11)
      // Runs the 4-layer structuring engine: rules → AI enhancement →
      // compliance review → final check. If the deal has a loan program,
      // structure it; otherwise skip to memo.
      // -----------------------------------------------------------------------
      lastStep = "STRUCTURING";
      const structuringResult = await step.run("structure-deal", async () => {
        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
        });

        // Only structure if a loan program is selected
        if (!deal.loanProgramId) {
          return { skipped: true, status: null };
        }

        const { getLoanProgram } = await import("@/config/loan-programs");
        const program = getLoanProgram(deal.loanProgramId);
        if (!program) {
          return { skipped: true, status: null };
        }

        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "STRUCTURING" },
        });

        const { structureDeal } = await import("@/structuring/structure-deal");
        const fullAnalysis = analysis.fullResults as any;

        // Extract state from property address if available
        const stateMatch = deal.propertyAddress?.match(/,\s*([A-Z]{2})\s+\d{5}/);
        const stateAbbr = stateMatch ? stateMatch[1] : null;

        const result = await withTimeout(
          structureDeal({
            analysis: fullAnalysis,
            program,
            borrowerName: deal.borrowerName,
            loanPurpose: deal.loanPurpose,
            propertyAddress: deal.propertyAddress,
            requestedAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
            requestedRate: deal.proposedRate ?? undefined,
            requestedTermMonths: deal.proposedTerm ?? undefined,
            stateAbbr,
          }),
          120_000,
          "structure-deal",
        );

        // Save DealTerms to database
        const allCovenants = [
          ...result.rulesEngine.covenants,
          ...result.aiEnhancement.customCovenants.map((c) => ({
            ...c,
            source: "ai_recommendation" as const,
          })),
        ];

        const allConditions = [
          ...result.rulesEngine.conditions,
          ...result.aiEnhancement.additionalConditions.map((c) => ({
            ...c,
            source: "ai_recommendation" as const,
          })),
        ];

        await prisma.dealTerms.upsert({
          where: { dealId },
          create: {
            dealId,
            loanProgramId: deal.loanProgramId,
            approvedAmount: result.rulesEngine.approvedAmount,
            interestRate: result.rulesEngine.rate.totalRate,
            termMonths: result.rulesEngine.termMonths,
            amortizationMonths: result.rulesEngine.amortizationMonths,
            ltv: result.rulesEngine.ltv,
            monthlyPayment: result.rulesEngine.monthlyPayment,
            baseRateType: result.rulesEngine.rate.baseRateType,
            baseRateValue: result.rulesEngine.rate.baseRateValue,
            spread: result.rulesEngine.rate.spread,
            interestOnly: result.rulesEngine.interestOnly,
            prepaymentPenalty: result.rulesEngine.prepaymentPenalty,
            personalGuaranty: result.rulesEngine.personalGuaranty,
            requiresAppraisal: result.rulesEngine.requiresAppraisal,
            covenants: allCovenants as any,
            conditions: allConditions as any,
            specialTerms: result.aiEnhancement.specialTerms as any,
            justification: result.aiEnhancement.justification,
            complianceStatus: result.compliance.compliant ? "COMPLIANT" : "ISSUES_FOUND",
            complianceIssues: result.compliance.issues as any,
            complianceReview: {
              deterministicChecks: result.compliance.deterministicChecks,
              aiReviewIssues: result.compliance.aiReviewIssues,
              reviewedAt: result.compliance.reviewedAt,
            } as any,
            fees: result.rulesEngine.fees as any,
            status: result.status === "approved" ? "READY" : "NEEDS_REVIEW",
          },
          update: {
            loanProgramId: deal.loanProgramId,
            approvedAmount: result.rulesEngine.approvedAmount,
            interestRate: result.rulesEngine.rate.totalRate,
            termMonths: result.rulesEngine.termMonths,
            amortizationMonths: result.rulesEngine.amortizationMonths,
            ltv: result.rulesEngine.ltv,
            monthlyPayment: result.rulesEngine.monthlyPayment,
            baseRateType: result.rulesEngine.rate.baseRateType,
            baseRateValue: result.rulesEngine.rate.baseRateValue,
            spread: result.rulesEngine.rate.spread,
            interestOnly: result.rulesEngine.interestOnly,
            prepaymentPenalty: result.rulesEngine.prepaymentPenalty,
            personalGuaranty: result.rulesEngine.personalGuaranty,
            requiresAppraisal: result.rulesEngine.requiresAppraisal,
            covenants: allCovenants as any,
            conditions: allConditions as any,
            specialTerms: result.aiEnhancement.specialTerms as any,
            justification: result.aiEnhancement.justification,
            complianceStatus: result.compliance.compliant ? "COMPLIANT" : "ISSUES_FOUND",
            complianceIssues: result.compliance.issues as any,
            complianceReview: {
              deterministicChecks: result.compliance.deterministicChecks,
              aiReviewIssues: result.compliance.aiReviewIssues,
              reviewedAt: result.compliance.reviewedAt,
            } as any,
            fees: result.rulesEngine.fees as any,
            status: result.status === "approved" ? "READY" : "NEEDS_REVIEW",
          },
        });

        // Create Condition records (delete existing first for idempotency on retry)
        await prisma.condition.deleteMany({ where: { dealId } });
        for (const condition of allConditions) {
          await prisma.condition.create({
            data: {
              dealId,
              category: condition.category,
              description: condition.description,
              source: condition.source,
              priority: condition.priority,
            },
          });
        }

        return { skipped: false, status: result.status };
      });

      // If structuring flagged for review, pause pipeline
      if (structuringResult && !structuringResult.skipped && structuringResult.status === "needs_review") {
        await step.run("flag-for-term-review", async () => {
          await prisma.deal.update({
            where: { id: dealId },
            data: { status: "NEEDS_TERM_REVIEW" },
          });
        });
        // Pipeline pauses here — user reviews terms and triggers continuation
        return { success: true, dealId, paused: "NEEDS_TERM_REVIEW" };
      }

      // -----------------------------------------------------------------------
      // Step 9: Generate loan documents (Phase 12)
      // Each doc is its own parallel step — stays within Inngest HTTP timeout.
      // -----------------------------------------------------------------------
      lastStep = "GENERATING_DOCS";
      const docGenSetup = await step.run("setup-doc-gen", async () => {
        const built = await buildDocInput(dealId);
        if (!built) return null;

        const { filterRequiredDocs } = await import("@/documents/generate-all");
        const filteredDocs = filterRequiredDocs(built.docInput, built.docsToGenerate);

        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_DOCS" },
        });
        await prisma.generatedDocument.deleteMany({ where: { dealId } });

        return { docsToGenerate: filteredDocs, orgId: built.deal.orgId };
      });

      if (docGenSetup) {
        await Promise.all(
          docGenSetup.docsToGenerate.map((docType) =>
            step.run(`gen-doc-${docType}`, async () => {
              await prisma.generatedDocument.deleteMany({ where: { dealId, docType } });
              await generateAndSaveDocument(dealId, docType, docGenSetup.orgId);
            })
          )
        );
      }

      // -----------------------------------------------------------------------
      // Step 10: Generate memo
      // -----------------------------------------------------------------------
      lastStep = "GENERATING_MEMO";
      await step.run("generate-memo", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_MEMO" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { org: true },
        });

        const fullAnalysis = await prisma.analysis.findUniqueOrThrow({
          where: { dealId },
        });

        const dealDocs = await prisma.document.findMany({ where: { dealId } });
        const verReport = await prisma.verificationReport.findUnique({ where: { dealId } });
        const vrData = verReport as any;
        const memoBuffer = await withTimeout(
          generateCreditMemo({
            borrowerName: deal.borrowerName,
            loanAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
            loanPurpose: deal.loanPurpose ?? "other",
            loanType: deal.loanType ?? undefined,
            proposedRate: deal.proposedRate ?? undefined,
            proposedTerm: deal.proposedTerm ?? undefined,
            propertyAddress: deal.propertyAddress ?? undefined,
            analysis: fullAnalysis.fullResults as any,
            documents: dealDocs.map((d) => ({
              fileName: d.fileName,
              docType: d.docType ?? "OTHER",
              year: d.docYear ?? undefined,
            })),
            verificationSummary: {
              mathChecksPassed: vrData?.mathPassed ?? 0,
              mathChecksFailed: vrData?.mathFailed ?? 0,
              crossDocPassed: vrData?.crossDocPassed ?? 0,
              crossDocFailed: vrData?.crossDocFailed ?? 0,
              textractAgreed: vrData?.textractAgreed ?? 0,
              textractDisagreed: vrData?.textractDisagreed ?? 0,
              reviewItemsResolved: 0,
            },
            generatedAt: new Date(),
          }),
          300_000,
          "generate-memo",
        );

        // Upload memo to S3 with proper versioning (no hardcoded v1 overwrite)
        const existingMemo = await prisma.creditMemo.findUnique({
          where: { dealId },
        });

        const version = existingMemo ? existingMemo.version + 1 : 1;
        const s3Key = `${deal.orgId}/${dealId}/credit-memo-v${version}.docx`;
        await uploadToS3(s3Key, memoBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await prisma.creditMemo.upsert({
          where: { dealId },
          create: {
            dealId,
            s3Key,
            version,
          },
          update: {
            s3Key,
            version,
          },
        });
      });

      // -----------------------------------------------------------------------
      // Step 11: Complete
      // -----------------------------------------------------------------------
      lastStep = "COMPLETING";
      await step.run("complete", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "COMPLETE" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { user: true },
        });

        // Track usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        const genDocs = await prisma.generatedDocument.count({ where: { dealId } });
        await prisma.usageLog.upsert({
          where: { orgId_month: { orgId: deal.orgId, month: currentMonth } },
          create: { orgId: deal.orgId, month: currentMonth, dealsProcessed: 1, docsGenerated: genDocs },
          update: { dealsProcessed: { increment: 1 }, docsGenerated: { increment: genDocs } },
        });

        await sendAnalysisComplete({
          to: deal.user.email,
          borrowerName: deal.borrowerName,
          dealId,
        });
      });

      return { success: true, dealId };
    } catch (error) {
      // Final error handler: mark deal as ERROR with last known pipeline stage
      const message = error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.deal.update({
        where: { id: dealId },
        data: {
          status: "ERROR",
          errorMessage: message,
          errorStep: lastStep,
        },
      });

      throw error;
    }
  }
);

// ---------------------------------------------------------------------------
// Resume after review gate
// ---------------------------------------------------------------------------

export const resumeAfterReview = inngest.createFunction(
  {
    id: "resume-after-review",
    name: "Resume Analysis After Review",
    retries: 2,
    idempotency: "event.data.dealId",
  },
  { event: "deal/review-complete" },
  async ({ event, step }) => {
    const { dealId } = event.data as { dealId: string };

    // Guard: only resume if deal is actually in review state
    const currentDeal = await step.run("check-resume-state", async () => {
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) return { skip: true };
      if (deal.status !== "NEEDS_REVIEW") {
        console.log(`[idempotency] Deal ${dealId} not in expected state (${deal.status}), skipping`);
        return { skip: true };
      }
      return { skip: false };
    });

    if (currentDeal.skip) {
      return { success: false, dealId, error: "Deal not in expected state for resume" };
    }

    try {
      // Get all extractions with resolved review items applied
      const extractions = await step.run("apply-review-resolutions", async () => {
        const reviewItems = await prisma.reviewItem.findMany({
          where: { dealId },
        });

        const currentExtractions = await prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });

        // Apply corrections from review items to extractions
        for (const item of reviewItems) {
          if (item.status === "CORRECTED" && item.resolvedValue) {
            // Find the extraction for this document
            const extraction = currentExtractions.find(
              (ext) => ext.documentId === item.documentId
            );
            if (extraction) {
              const data = extraction.structuredData as Record<string, any>;
              // Apply the corrected value at the field path
              setNestedValue(data, item.fieldPath, parseValue(item.resolvedValue));
              await prisma.extraction.update({
                where: { id: extraction.id },
                data: { structuredData: data as any },
              });
            }
          }
        }

        return prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });
      });

      // Re-run verification to confirm
      const reVerification = await step.run("re-verify", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "VERIFYING" },
        });

        const allMathChecks: any[] = [];
        for (const ext of extractions) {
          const docType = ext.document.docType ?? "OTHER";
          const checks = runMathChecks(docType, ext.structuredData);
          allMathChecks.push(...checks.map((c) => ({ ...c, documentId: ext.documentId })));
        }

        const crossDocResults = runCrossDocChecks(
          extractions.map((ext) => ({
            docType: ext.document.docType ?? "OTHER",
            data: ext.structuredData as Record<string, any>,
          }))
        );

        const allTextractChecks: any[] = [];
        for (const ext of extractions) {
          const textractResult = ext.document.textractOutput as any;
          if (textractResult) {
            const checks = compareTextractVsStructured(
              ext.document.docType ?? "OTHER",
              ext.structuredData as Record<string, any>,
              textractResult.keyValuePairs ?? textractResult
            );
            allTextractChecks.push(
              ...checks.map((c: any) => ({ ...c, documentId: ext.documentId }))
            );
          }
        }

        const mathFailed = allMathChecks.filter((c) => !c.passed).length;
        const crossDocFailed = crossDocResults.filter((c: any) => c.status === "fail").length;
        const textractDisagreed = allTextractChecks.filter((c) => !c.agreed).length;

        // Update verification report
        await prisma.verificationReport.update({
          where: { dealId },
          data: {
            mathChecks: allMathChecks as any,
            mathPassed: allMathChecks.filter((c) => c.passed).length,
            mathFailed,
            crossDocChecks: crossDocResults as any,
            crossDocPassed: crossDocResults.filter((c: any) => c.status === "pass").length,
            crossDocFailed,
            crossDocWarnings: crossDocResults.filter((c: any) => c.status === "warning").length,
            textractChecks: allTextractChecks as any,
            textractAgreed: allTextractChecks.filter((c) => c.agreed).length,
            textractDisagreed,
            overallStatus: mathFailed > 0 || crossDocFailed > 0 ? "FAIL" : "PASS",
          },
        });

        return {
          mathFailed,
          crossDocFailed,
          textractDisagreed,
        };
      });

      // Check if any items were CORRECTED (data changed → need re-gate)
      // If all items were only CONFIRMED (human accepted as-is), skip re-gate
      const hasCorrectedItems = await step.run("check-correction-type", async () => {
        const resolvedItems = await prisma.reviewItem.findMany({
          where: { dealId, status: "CORRECTED" },
        });
        return resolvedItems.length > 0;
      });

      if (hasCorrectedItems) {
        // Re-gate only when data was changed — verify the corrections are valid
        const resumeGateResult = await step.run("check-review-gate", async () => {
          const report = await prisma.verificationReport.findUnique({ where: { dealId } });
          return evaluateReviewGate({
            mathChecks: (report as any)?.mathChecks ?? [],
            crossDocChecks: (report as any)?.crossDocChecks ?? [],
            textractComparisons: (report as any)?.textractChecks ?? [],
          });
        });
        if (!resumeGateResult.canProceed) {
          await step.run("still-needs-review", async () => {
            // Create new review items for remaining issues
            for (const item of resumeGateResult.reviewItems) {
              await prisma.reviewItem.create({
                data: {
                  dealId,
                  documentId: item.documentId ?? null,
                  fieldPath: item.fieldPath,
                  extractedValue: String(item.extractedValue),
                  expectedValue: String(item.expectedValue),
                  checkType: item.checkType.toUpperCase() as any,
                  description: item.description,
                  status: "PENDING",
                },
              });
            }

            await prisma.deal.update({
              where: { id: dealId },
              data: { status: "NEEDS_REVIEW" },
            });

            const deal = await prisma.deal.findUniqueOrThrow({
              where: { id: dealId },
              include: { user: true },
            });

            await sendReviewNeeded({
              to: deal.user.email,
              borrowerName: deal.borrowerName,
              dealId,
              reviewCount: resumeGateResult.reviewItems.length,
            });
          });

          return { success: false, dealId, status: "NEEDS_REVIEW" };
        }
      }
      // If all CONFIRMED (no corrections), proceed — human accepted the data as-is

      // Run analysis
      const analysis = await step.run("analyze-after-review", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "ANALYZING" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
        });

        const latestExtractions = await prisma.extraction.findMany({
          where: { dealId },
          include: { document: true },
        });

        const analysisResult = runFullAnalysis({
          extractions: latestExtractions.map((ext) => ({
            docType: ext.document.docType ?? "OTHER",
            data: ext.structuredData as Record<string, any>,
          })),
          proposedLoanAmount: deal.loanAmount ? Number(deal.loanAmount) : undefined,
          proposedRate: deal.proposedRate ?? undefined,
          proposedTerm: deal.proposedTerm ?? undefined,
        });

        const analysisData = {
          totalGrossIncome: analysisResult.income.totalGrossIncome,
          totalNetIncome: analysisResult.income.totalNetIncome,
          incomeSources: analysisResult.income.sources as any,
          incomeTrend: analysisResult.income.trend ?? null,
          globalDscr: analysisResult.dscr.globalDscr ?? null,
          propertyDscr: analysisResult.dscr.propertyDscr ?? null,
          frontEndDti: analysisResult.dti.frontEndDti ?? null,
          backEndDti: analysisResult.dti.backEndDti ?? null,
          ltv: null as number | null,
          currentRatio: analysisResult.liquidity.currentRatio ?? null,
          quickRatio: analysisResult.liquidity.quickRatio ?? null,
          debtToEquity: analysisResult.liquidity.debtToEquity ?? null,
          avgDailyBalance: analysisResult.liquidity.averageDailyBalance ?? null,
          minBalance: analysisResult.liquidity.minimumBalance ?? null,
          monthsOfReserves: analysisResult.liquidity.monthsOfReserves ?? null,
          largeDeposits: analysisResult.cashflow.largeDeposits as any ?? null,
          avgMonthlyDeposits: analysisResult.cashflow.averageMonthlyDeposits ?? null,
          depositVsIncome: analysisResult.cashflow.depositToIncomeRatio ?? null,
          nsfCount: analysisResult.cashflow.nsfCount ?? null,
          revenueByYear: analysisResult.business?.revenueByYear as any ?? null,
          expenseRatio: analysisResult.business?.expenseRatio ?? null,
          ownerComp: analysisResult.business?.ownerCompensation ?? null,
          addBacks: analysisResult.business?.addBacks as any ?? null,
          riskFlags: analysisResult.riskFlags as any,
          riskScore: analysisResult.riskScore,
          fullResults: analysisResult as any,
        };
        return prisma.analysis.upsert({
          where: { dealId },
          create: { dealId, ...analysisData },
          update: analysisData,
        });
      });

      // Structure deal (mirrors main pipeline Step 8)
      const structuringResult = await step.run("structure-deal-after-review", async () => {
        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
        });

        // Only structure if a loan program is selected
        if (!deal.loanProgramId) {
          return { skipped: true, status: null };
        }

        const { getLoanProgram } = await import("@/config/loan-programs");
        const program = getLoanProgram(deal.loanProgramId);
        if (!program) {
          return { skipped: true, status: null };
        }

        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "STRUCTURING" },
        });

        const { structureDeal } = await import("@/structuring/structure-deal");
        const fullAnalysis = analysis.fullResults as any;

        // Extract state from property address if available
        const stateMatch = deal.propertyAddress?.match(/,\s*([A-Z]{2})\s+\d{5}/);
        const stateAbbr = stateMatch ? stateMatch[1] : null;

        const result = await withTimeout(
          structureDeal({
            analysis: fullAnalysis,
            program,
            borrowerName: deal.borrowerName,
            loanPurpose: deal.loanPurpose,
            propertyAddress: deal.propertyAddress,
            requestedAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
            requestedRate: deal.proposedRate ?? undefined,
            requestedTermMonths: deal.proposedTerm ?? undefined,
            stateAbbr,
          }),
          120_000,
          "structure-deal-after-review",
        );

        // Save DealTerms to database
        const allCovenants = [
          ...result.rulesEngine.covenants,
          ...result.aiEnhancement.customCovenants.map((c) => ({
            ...c,
            source: "ai_recommendation" as const,
          })),
        ];

        const allConditions = [
          ...result.rulesEngine.conditions,
          ...result.aiEnhancement.additionalConditions.map((c) => ({
            ...c,
            source: "ai_recommendation" as const,
          })),
        ];

        await prisma.dealTerms.upsert({
          where: { dealId },
          create: {
            dealId,
            loanProgramId: deal.loanProgramId,
            approvedAmount: result.rulesEngine.approvedAmount,
            interestRate: result.rulesEngine.rate.totalRate,
            termMonths: result.rulesEngine.termMonths,
            amortizationMonths: result.rulesEngine.amortizationMonths,
            ltv: result.rulesEngine.ltv,
            monthlyPayment: result.rulesEngine.monthlyPayment,
            baseRateType: result.rulesEngine.rate.baseRateType,
            baseRateValue: result.rulesEngine.rate.baseRateValue,
            spread: result.rulesEngine.rate.spread,
            interestOnly: result.rulesEngine.interestOnly,
            prepaymentPenalty: result.rulesEngine.prepaymentPenalty,
            personalGuaranty: result.rulesEngine.personalGuaranty,
            requiresAppraisal: result.rulesEngine.requiresAppraisal,
            covenants: allCovenants as any,
            conditions: allConditions as any,
            specialTerms: result.aiEnhancement.specialTerms as any,
            justification: result.aiEnhancement.justification,
            complianceStatus: result.compliance.compliant ? "COMPLIANT" : "ISSUES_FOUND",
            complianceIssues: result.compliance.issues as any,
            complianceReview: {
              deterministicChecks: result.compliance.deterministicChecks,
              aiReviewIssues: result.compliance.aiReviewIssues,
              reviewedAt: result.compliance.reviewedAt,
            } as any,
            fees: result.rulesEngine.fees as any,
            status: result.status === "approved" ? "READY" : "NEEDS_REVIEW",
          },
          update: {
            loanProgramId: deal.loanProgramId,
            approvedAmount: result.rulesEngine.approvedAmount,
            interestRate: result.rulesEngine.rate.totalRate,
            termMonths: result.rulesEngine.termMonths,
            amortizationMonths: result.rulesEngine.amortizationMonths,
            ltv: result.rulesEngine.ltv,
            monthlyPayment: result.rulesEngine.monthlyPayment,
            baseRateType: result.rulesEngine.rate.baseRateType,
            baseRateValue: result.rulesEngine.rate.baseRateValue,
            spread: result.rulesEngine.rate.spread,
            interestOnly: result.rulesEngine.interestOnly,
            prepaymentPenalty: result.rulesEngine.prepaymentPenalty,
            personalGuaranty: result.rulesEngine.personalGuaranty,
            requiresAppraisal: result.rulesEngine.requiresAppraisal,
            covenants: allCovenants as any,
            conditions: allConditions as any,
            specialTerms: result.aiEnhancement.specialTerms as any,
            justification: result.aiEnhancement.justification,
            complianceStatus: result.compliance.compliant ? "COMPLIANT" : "ISSUES_FOUND",
            complianceIssues: result.compliance.issues as any,
            complianceReview: {
              deterministicChecks: result.compliance.deterministicChecks,
              aiReviewIssues: result.compliance.aiReviewIssues,
              reviewedAt: result.compliance.reviewedAt,
            } as any,
            fees: result.rulesEngine.fees as any,
            status: result.status === "approved" ? "READY" : "NEEDS_REVIEW",
          },
        });

        // Create Condition records (delete existing first for idempotency on retry)
        await prisma.condition.deleteMany({ where: { dealId } });
        for (const condition of allConditions) {
          await prisma.condition.create({
            data: {
              dealId,
              category: condition.category,
              description: condition.description,
              source: condition.source,
              priority: condition.priority,
            },
          });
        }

        return { skipped: false, status: result.status };
      });

      // If structuring flagged for review, pause pipeline
      if (structuringResult && !structuringResult.skipped && structuringResult.status === "needs_review") {
        await step.run("flag-for-term-review-after-review", async () => {
          await prisma.deal.update({
            where: { id: dealId },
            data: { status: "NEEDS_TERM_REVIEW" },
          });
        });
        // Pipeline pauses here — user reviews terms and triggers continuation
        return { success: true, dealId, paused: "NEEDS_TERM_REVIEW" };
      }

      // Generate loan documents — parallel per-doc steps
      const docGenSetupReview = await step.run("setup-doc-gen-after-review", async () => {
        const built = await buildDocInput(dealId);
        if (!built) return null;

        const { filterRequiredDocs } = await import("@/documents/generate-all");
        const filteredDocs = filterRequiredDocs(built.docInput, built.docsToGenerate);

        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_DOCS" },
        });
        await prisma.generatedDocument.deleteMany({ where: { dealId } });

        return { docsToGenerate: filteredDocs, orgId: built.deal.orgId };
      });

      if (docGenSetupReview) {
        await Promise.all(
          docGenSetupReview.docsToGenerate.map((docType) =>
            step.run(`gen-doc-${docType}-after-review`, async () => {
              await prisma.generatedDocument.deleteMany({ where: { dealId, docType } });
              await generateAndSaveDocument(dealId, docType, docGenSetupReview.orgId);
            })
          )
        );
      }

      // Generate memo
      await step.run("generate-memo-after-review", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_MEMO" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { org: true },
        });

        const fullAnalysis = await prisma.analysis.findUniqueOrThrow({
          where: { dealId },
        });

        const dealDocs = await prisma.document.findMany({ where: { dealId } });
        const verReport = await prisma.verificationReport.findUnique({ where: { dealId } });
        const vrData = verReport as any;
        const memoBuffer = await withTimeout(
          generateCreditMemo({
            borrowerName: deal.borrowerName,
            loanAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
            loanPurpose: deal.loanPurpose ?? "other",
            loanType: deal.loanType ?? undefined,
            proposedRate: deal.proposedRate ?? undefined,
            proposedTerm: deal.proposedTerm ?? undefined,
            propertyAddress: deal.propertyAddress ?? undefined,
            analysis: fullAnalysis.fullResults as any,
            documents: dealDocs.map((d) => ({
              fileName: d.fileName,
              docType: d.docType ?? "OTHER",
              year: d.docYear ?? undefined,
            })),
            verificationSummary: {
              mathChecksPassed: vrData?.mathPassed ?? 0,
              mathChecksFailed: vrData?.mathFailed ?? 0,
              crossDocPassed: vrData?.crossDocPassed ?? 0,
              crossDocFailed: vrData?.crossDocFailed ?? 0,
              textractAgreed: vrData?.textractAgreed ?? 0,
              textractDisagreed: vrData?.textractDisagreed ?? 0,
              reviewItemsResolved: 0,
            },
            generatedAt: new Date(),
          }),
          300_000,
          "generate-memo-after-review",
        );

        const existingMemo = await prisma.creditMemo.findUnique({
          where: { dealId },
        });

        const version = existingMemo ? existingMemo.version + 1 : 1;
        const s3Key = `${deal.orgId}/${dealId}/credit-memo-v${version}.docx`;

        await uploadToS3(s3Key, memoBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await prisma.creditMemo.upsert({
          where: { dealId },
          create: { dealId, s3Key, version },
          update: { s3Key, version },
        });
      });

      // Complete
      await step.run("complete-after-review", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "COMPLETE" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { user: true },
        });

        // Track usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        const genDocs = await prisma.generatedDocument.count({ where: { dealId } });
        await prisma.usageLog.upsert({
          where: { orgId_month: { orgId: deal.orgId, month: currentMonth } },
          create: { orgId: deal.orgId, month: currentMonth, dealsProcessed: 1, docsGenerated: genDocs },
          update: { dealsProcessed: { increment: 1 }, docsGenerated: { increment: genDocs } },
        });

        await sendAnalysisComplete({
          to: deal.user.email,
          borrowerName: deal.borrowerName,
          dealId,
        });
      });

      return { success: true, dealId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.deal.update({
        where: { id: dealId },
        data: {
          status: "ERROR",
          errorMessage: message,
          errorStep: "RESUME_AFTER_REVIEW",
        },
      });

      throw error;
    }
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set a nested value on an object using a dot-delimited path. */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/** Parse a string value into a number if possible, otherwise return the string. */
function parseValue(value: string): string | number {
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") {
    return num;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Resume after term review
// ---------------------------------------------------------------------------

export const resumeAfterTermReview = inngest.createFunction(
  {
    id: "resume-after-term-review",
    name: "Resume Pipeline After Term Review",
    retries: 2,
    idempotency: "event.data.dealId",
  },
  { event: "deal/terms-approved" },
  async ({ event, step }) => {
    const { dealId } = event.data as { dealId: string };

    // Guard: only resume if deal is actually in term review state
    const currentDeal = await step.run("check-resume-state", async () => {
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) return { skip: true };
      if (deal.status !== "NEEDS_TERM_REVIEW") {
        console.log(`[idempotency] Deal ${dealId} not in expected state (${deal.status}), skipping`);
        return { skip: true };
      }
      return { skip: false };
    });

    if (currentDeal.skip) {
      return { success: false, dealId, error: "Deal not in expected state for resume" };
    }

    try {
      // Mark deal terms as approved
      await step.run("approve-terms", async () => {
        await prisma.dealTerms.update({
          where: { dealId },
          data: { status: "APPROVED" },
        });
      });

      // Generate loan documents — parallel per-doc steps
      const docGenSetupTerms = await step.run("setup-doc-gen-after-terms", async () => {
        const built = await buildDocInput(dealId);
        if (!built) return null;

        const { filterRequiredDocs } = await import("@/documents/generate-all");
        const filteredDocs = filterRequiredDocs(built.docInput, built.docsToGenerate);

        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_DOCS" },
        });
        await prisma.generatedDocument.deleteMany({ where: { dealId } });

        return { docsToGenerate: filteredDocs, orgId: built.deal.orgId };
      });

      if (docGenSetupTerms) {
        await Promise.all(
          docGenSetupTerms.docsToGenerate.map((docType) =>
            step.run(`gen-doc-${docType}-after-terms`, async () => {
              await prisma.generatedDocument.deleteMany({ where: { dealId, docType } });
              await generateAndSaveDocument(dealId, docType, docGenSetupTerms.orgId);
            })
          )
        );
      }

      // Generate memo
      await step.run("generate-memo-after-terms", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "GENERATING_MEMO" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { org: true },
        });

        const fullAnalysis = await prisma.analysis.findUniqueOrThrow({
          where: { dealId },
        });

        const dealDocs = await prisma.document.findMany({ where: { dealId } });
        const verReport = await prisma.verificationReport.findUnique({ where: { dealId } });
        const vrData = verReport as any;
        const memoBuffer = await withTimeout(
          generateCreditMemo({
            borrowerName: deal.borrowerName,
            loanAmount: deal.loanAmount ? Number(deal.loanAmount) : 0,
            loanPurpose: deal.loanPurpose ?? "other",
            loanType: deal.loanType ?? undefined,
            proposedRate: deal.proposedRate ?? undefined,
            proposedTerm: deal.proposedTerm ?? undefined,
            propertyAddress: deal.propertyAddress ?? undefined,
            analysis: fullAnalysis.fullResults as any,
            documents: dealDocs.map((d) => ({
              fileName: d.fileName,
              docType: d.docType ?? "OTHER",
              year: d.docYear ?? undefined,
            })),
            verificationSummary: {
              mathChecksPassed: vrData?.mathPassed ?? 0,
              mathChecksFailed: vrData?.mathFailed ?? 0,
              crossDocPassed: vrData?.crossDocPassed ?? 0,
              crossDocFailed: vrData?.crossDocFailed ?? 0,
              textractAgreed: vrData?.textractAgreed ?? 0,
              textractDisagreed: vrData?.textractDisagreed ?? 0,
              reviewItemsResolved: 0,
            },
            generatedAt: new Date(),
          }),
          300_000,
          "generate-memo-after-terms",
        );

        const existingMemo = await prisma.creditMemo.findUnique({
          where: { dealId },
        });

        const version = existingMemo ? existingMemo.version + 1 : 1;
        const s3Key = `${deal.orgId}/${dealId}/credit-memo-v${version}.docx`;

        await uploadToS3(s3Key, memoBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await prisma.creditMemo.upsert({
          where: { dealId },
          create: { dealId, s3Key, version },
          update: { s3Key, version },
        });
      });

      // Complete
      await step.run("complete-after-terms", async () => {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "COMPLETE" },
        });

        const deal = await prisma.deal.findUniqueOrThrow({
          where: { id: dealId },
          include: { user: true },
        });

        // Track usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        const genDocs = await prisma.generatedDocument.count({ where: { dealId } });
        await prisma.usageLog.upsert({
          where: { orgId_month: { orgId: deal.orgId, month: currentMonth } },
          create: { orgId: deal.orgId, month: currentMonth, dealsProcessed: 1, docsGenerated: genDocs },
          update: { dealsProcessed: { increment: 1 }, docsGenerated: { increment: genDocs } },
        });

        await sendAnalysisComplete({
          to: deal.user.email,
          borrowerName: deal.borrowerName,
          dealId,
        });
      });

      return { success: true, dealId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown pipeline error";

      await prisma.deal.update({
        where: { id: dealId },
        data: {
          status: "ERROR",
          errorMessage: message,
          errorStep: "RESUME_AFTER_TERM_REVIEW",
        },
      });

      throw error;
    }
  }
);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const functions = [analysisPipeline, resumeAfterReview, resumeAfterTermReview];
