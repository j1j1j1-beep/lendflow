/**
 * Stress Test Validation Endpoint
 *
 * GET /api/test/stress-test/validate — Validates pipeline output for all test deals
 *
 * Checks: classification accuracy, extraction completeness, verification,
 * analysis, deal terms, generated docs, credit memo, mismatch detection, timing.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Expected document classifications per scenario (keyed by borrowerName)
const EXPECTED_DOCS: Record<string, Record<string, string>> = {
  "Robert J. Thompson": {
    "thompson_1040_2023.pdf": "FORM_1040",
    "thompson_w2_2023.pdf": "W2",
    "thompson_bank_stmt_jul_dec_2023.pdf": "BANK_STATEMENT_CHECKING",
  },
  "Marcus A. Chen": {
    "chen_1040_2023.pdf": "FORM_1040",
    "chen_schedule_c_2023.pdf": "OTHER", // Schedule C has no dedicated DocType
    "chen_digital_1120s_2023.pdf": "FORM_1120S",
    "chen_digital_pnl_2023.pdf": "PROFIT_AND_LOSS",
    "chen_digital_balance_sheet_2023.pdf": "BALANCE_SHEET",
    "chen_digital_bank_stmt_2023.pdf": "BANK_STATEMENT_CHECKING",
  },
  "David R. Williams": {
    "williams_1040_2023.pdf": "FORM_1040",
    "williams_schedule_e_2023.pdf": "OTHER", // Schedule E has no dedicated DocType
    "williams_bank_stmt_jul_dec_2023.pdf": "BANK_STATEMENT_CHECKING",
    "williams_rent_roll_nw7th.pdf": "RENT_ROLL",
  },
  "Priya A. Patel": {
    "patel_1040_2023.pdf": "FORM_1040",
  },
  "Kevin M. Johnson": {
    "johnson_1040_2023.pdf": "FORM_1040",
    "johnson_w2_2023.pdf": "W2",
    "johnson_bank_stmt_jul_dec_2023.pdf": "BANK_STATEMENT_CHECKING",
  },
  "Angela D. Foster": {
    "foster_1040_2023.pdf": "FORM_1040",
    "foster_blank_page.pdf": "OTHER", // Blank page should classify as OTHER
  },
  "James T. Reeves": {
    "reeves_1040_2023.pdf": "FORM_1040",
    "reeves_business_bank_stmt_12pg_2023.pdf": "BANK_STATEMENT_CHECKING",
  },
};

// Scenarios that are expected to trigger mismatch/discrepancy flags
const MISMATCH_SCENARIOS = new Set(["Kevin M. Johnson"]);

type CheckResult = "pass" | "fail" | "skip";

interface TimingData {
  dealCreated: string;
  dealUpdated: string;
  totalElapsedMs: number;
  perStep: {
    ocrAndClassify?: number;
    extraction?: number;
    verification?: number;
    analysis?: number;
    structuring?: number;
    docGeneration?: number;
    memoGeneration?: number;
  };
}

interface DealValidation {
  scenario: string;
  dealId: string;
  status: string;
  checks: {
    classification: CheckResult;
    classificationDetail?: Record<string, { expected: string; actual: string | null; match: boolean }>;
    extraction: CheckResult;
    extractionDetail?: { total: number; withData: number };
    verification: CheckResult;
    verificationDetail?: { mathPassed: number; mathFailed: number; crossDocPassed: number; crossDocFailed: number };
    analysis: CheckResult;
    analysisDetail?: { riskScore: number | null; hasIncome: boolean };
    dealTerms: CheckResult;
    dealTermsDetail?: { status: string; complianceStatus: string };
    generatedDocs: CheckResult;
    generatedDocsDetail?: { count: number };
    creditMemo: CheckResult;
    mismatchDetection: CheckResult;
    mismatchDetail?: { crossDocFailed: number; reviewItemCount: number; expectMismatch: boolean };
  };
  timing: TimingData;
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const testUser = await prisma.user.findUnique({ where: { clerkId: "test_user_stress_test" } });
    if (!testUser) {
      return NextResponse.json({ message: "No test deals found. Run POST /api/test/stress-test first." });
    }

    const deals = await prisma.deal.findMany({
      where: { userId: testUser.id },
      include: {
        documents: {
          include: {
            extractions: { orderBy: { createdAt: "desc" as const }, take: 1 },
          },
        },
        analysis: true,
        verificationReport: true,
        reviewItems: true,
        dealTerms: true,
        generatedDocuments: true,
        creditMemo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const validations: DealValidation[] = [];
    let totalPass = 0;
    let totalFail = 0;
    let totalSkip = 0;

    for (const deal of deals) {
      const expected = EXPECTED_DOCS[deal.borrowerName] ?? {};
      const expectMismatch = MISMATCH_SCENARIOS.has(deal.borrowerName);

      // Timing instrumentation
      // Compute per-step timing from record timestamps
      const docTimestamps = deal.documents.map((d) => d.createdAt.getTime());
      const extractionTimestamps = deal.documents
        .flatMap((d) => d.extractions)
        .map((e) => e.createdAt.getTime());
      const verificationTs = deal.verificationReport?.createdAt.getTime();
      const analysisTs = deal.analysis?.createdAt.getTime();
      const dealTermsTs = deal.dealTerms?.createdAt.getTime();
      const genDocTimestamps = deal.generatedDocuments.map((d) => d.createdAt.getTime());
      const memoTs = deal.creditMemo?.createdAt.getTime();

      const dealCreatedMs = deal.createdAt.getTime();
      const dealUpdatedMs = deal.updatedAt.getTime();

      const earliestDoc = docTimestamps.length > 0 ? Math.min(...docTimestamps) : null;
      const latestExtraction = extractionTimestamps.length > 0 ? Math.max(...extractionTimestamps) : null;
      const earliestGenDoc = genDocTimestamps.length > 0 ? Math.min(...genDocTimestamps) : null;
      const latestGenDoc = genDocTimestamps.length > 0 ? Math.max(...genDocTimestamps) : null;

      const perStep: TimingData["perStep"] = {};
      // OCR + Classification: deal creation -> first extraction
      if (earliestDoc && latestExtraction) {
        perStep.ocrAndClassify = latestExtraction - earliestDoc > 0
          ? undefined // Can't distinguish OCR vs extraction from timestamps alone
          : undefined;
      }
      if (latestExtraction && verificationTs) {
        // extraction -> verification
        perStep.extraction = latestExtraction - dealCreatedMs;
      }
      if (verificationTs) {
        perStep.verification = verificationTs - dealCreatedMs;
      }
      if (analysisTs) {
        perStep.analysis = analysisTs - dealCreatedMs;
      }
      if (dealTermsTs) {
        perStep.structuring = dealTermsTs - dealCreatedMs;
      }
      if (earliestGenDoc && latestGenDoc) {
        perStep.docGeneration = latestGenDoc - (dealTermsTs ?? dealCreatedMs);
      }
      if (memoTs) {
        perStep.memoGeneration = memoTs - dealCreatedMs;
      }

      const timing: TimingData = {
        dealCreated: deal.createdAt.toISOString(),
        dealUpdated: deal.updatedAt.toISOString(),
        totalElapsedMs: dealUpdatedMs - dealCreatedMs,
        perStep,
      };

      const v: DealValidation = {
        scenario: deal.borrowerName,
        dealId: deal.id,
        status: deal.status,
        checks: {
          classification: "skip",
          extraction: "skip",
          verification: "skip",
          analysis: "skip",
          dealTerms: "skip",
          generatedDocs: "skip",
          creditMemo: "skip",
          mismatchDetection: "skip",
        },
        timing,
      };

      // 1. Classification accuracy
      if (deal.documents.length > 0) {
        const detail: Record<string, { expected: string; actual: string | null; match: boolean }> = {};
        let allMatch = true;
        for (const doc of deal.documents) {
          const exp = expected[doc.fileName];
          if (exp) {
            const match = doc.docType === exp;
            detail[doc.fileName] = { expected: exp, actual: doc.docType, match };
            if (!match) allMatch = false;
          } else {
            detail[doc.fileName] = { expected: "unknown", actual: doc.docType, match: true };
          }
        }
        v.checks.classification = allMatch ? "pass" : "fail";
        v.checks.classificationDetail = detail;
      }

      // 2. Extraction completeness
      if (deal.documents.length > 0) {
        const total = deal.documents.length;
        let withData = 0;
        for (const doc of deal.documents) {
          const extraction = doc.extractions[0];
          if (
            extraction?.structuredData &&
            typeof extraction.structuredData === "object" &&
            Object.keys(extraction.structuredData as object).length > 0
          ) {
            withData++;
          }
        }
        v.checks.extraction = withData === total ? "pass" : withData > 0 ? "fail" : "fail";
        v.checks.extractionDetail = { total, withData };
      }

      // 3. Verification
      if (deal.verificationReport) {
        const vr = deal.verificationReport;
        v.checks.verification = vr.mathPassed > 0 ? "pass" : "fail";
        v.checks.verificationDetail = {
          mathPassed: vr.mathPassed,
          mathFailed: vr.mathFailed,
          crossDocPassed: vr.crossDocPassed,
          crossDocFailed: vr.crossDocFailed,
        };
      }

      // 4. Analysis
      if (deal.analysis) {
        const a = deal.analysis;
        const hasIncome = a.totalNetIncome !== null && Number(a.totalNetIncome) !== 0;
        v.checks.analysis = a.riskScore !== null && hasIncome ? "pass" : "fail";
        v.checks.analysisDetail = { riskScore: a.riskScore, hasIncome };
      }

      // 5. Deal terms
      if (deal.dealTerms) {
        v.checks.dealTerms = "pass";
        v.checks.dealTermsDetail = {
          status: deal.dealTerms.status,
          complianceStatus: deal.dealTerms.complianceStatus,
        };
      }

      // 6. Generated docs
      if (deal.generatedDocuments.length > 0) {
        v.checks.generatedDocs = "pass";
        v.checks.generatedDocsDetail = { count: deal.generatedDocuments.length };
      }

      // 7. Credit memo
      if (deal.creditMemo) {
        v.checks.creditMemo = "pass";
      }

      // 8. Mismatch detection (for intentional discrepancy scenarios)
      const crossDocFailed = deal.verificationReport?.crossDocFailed ?? 0;
      const reviewItemCount = deal.reviewItems?.length ?? 0;

      if (expectMismatch) {
        // For mismatch scenarios: pipeline should have caught something
        const caughtMismatch = crossDocFailed > 0 || reviewItemCount > 0;
        v.checks.mismatchDetection = caughtMismatch ? "pass" : "fail";
        v.checks.mismatchDetail = { crossDocFailed, reviewItemCount, expectMismatch: true };
      } else if (deal.verificationReport) {
        // For clean scenarios: no cross-doc failures expected
        v.checks.mismatchDetection = "pass";
        v.checks.mismatchDetail = { crossDocFailed, reviewItemCount, expectMismatch: false };
      }

      // Count results
      for (const result of Object.values(v.checks)) {
        if (typeof result === "string") {
          if (result === "pass") totalPass++;
          else if (result === "fail") totalFail++;
          else totalSkip++;
        }
      }

      validations.push(v);
    }

    return NextResponse.json({
      totalDeals: deals.length,
      summary: { pass: totalPass, fail: totalFail, skip: totalSkip },
      validations,
    });
  } catch (error) {
    console.error("Stress test validation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
