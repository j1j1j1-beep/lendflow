import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkPaywall } from "@/lib/paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  SAMPLE_BORROWER,
  SAMPLE_DOCUMENTS,
  SAMPLE_EXTRACTIONS,
} from "@/lib/sample-data";
import { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// POST /api/deals/sample — Create a pre-populated sample deal
// Skips OCR/extraction. Inserts verified documents + extractions, then
// triggers the analysis pipeline via Inngest.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();

    // ── Paywall check ──────────────────────────────────────────────────────
    const paywall = await checkPaywall(org.id);
    if (!paywall.allowed) {
      return NextResponse.json({ error: paywall.reason }, { status: 403 });
    }

    // ── Prevent duplicate sample deals ─────────────────────────────────────
    const existingSample = await prisma.deal.findFirst({
      where: {
        orgId: org.id,
        borrowerName: SAMPLE_BORROWER.borrowerName,
      },
    });

    if (existingSample) {
      return NextResponse.json(
        {
          error:
            "Sample deal already exists. Delete it first or create a regular deal.",
        },
        { status: 400 }
      );
    }

    // ── Create Deal ────────────────────────────────────────────────────────
    // Convert percentage rate to decimal for storage (7.25 -> 0.0725),
    // matching the pattern in POST /api/deals.
    const rateDecimal = SAMPLE_BORROWER.proposedRate / 100;

    const deal = await prisma.deal.create({
      data: {
        borrowerName: SAMPLE_BORROWER.borrowerName,
        loanAmount: SAMPLE_BORROWER.loanAmount,
        loanPurpose: SAMPLE_BORROWER.loanPurpose,
        loanType: SAMPLE_BORROWER.loanType,
        loanProgramId: SAMPLE_BORROWER.loanProgramId,
        proposedRate: rateDecimal,
        proposedTerm: SAMPLE_BORROWER.proposedTerm,
        propertyAddress: SAMPLE_BORROWER.propertyAddress,
        orgId: org.id,
        userId: user.id,
      },
    });

    // ── Create Document + Extraction records ───────────────────────────────
    for (const doc of SAMPLE_DOCUMENTS) {
      const s3Key = `${org.id}/${deal.id}/sample/${doc.fileName}`;

      const document = await prisma.document.create({
        data: {
          dealId: deal.id,
          fileName: doc.fileName,
          s3Key,
          fileSize: 0, // No actual file — placeholder
          docType: doc.docType,
          docYear: doc.year ?? null,
          status: "VERIFIED",
        },
      });

      // Find the matching extraction data by docType.
      // Map Document DocType enum values to extraction docType strings:
      //   FORM_1040 -> "FORM_1040" (first match for 1040, second for Schedule E)
      //   BANK_STATEMENT_CHECKING -> "BANK_STATEMENT"
      //   PROFIT_AND_LOSS -> "PROFIT_AND_LOSS"
      let extractionDocType: string;
      if (doc.docType === "FORM_1040" && doc.fileName.includes("Schedule_E")) {
        extractionDocType = "SCHEDULE_E";
      } else if (doc.docType === "BANK_STATEMENT_CHECKING") {
        extractionDocType = "BANK_STATEMENT";
      } else {
        extractionDocType = doc.docType;
      }

      const extraction = SAMPLE_EXTRACTIONS.find(
        (e) => e.docType === extractionDocType
      );

      if (extraction) {
        await prisma.extraction.create({
          data: {
            documentId: document.id,
            dealId: deal.id,
            model: "sample-data",
            promptVersion: "sample-v1",
            structuredData: extraction.data as Prisma.InputJsonValue,
            rawResponse: {} as Prisma.InputJsonValue,
            validationErrors: [] as Prisma.InputJsonValue,
            tokensUsed: 0,
            costUsd: 0,
          },
        });
      }
    }

    // ── Create Verification Report (all checks passed) ─────────────────────
    await prisma.verificationReport.create({
      data: {
        dealId: deal.id,
        mathChecks: [
          { fieldPath: "income.totalIncome_line9", description: "1040 total income = sum of income lines", expected: 248500, actual: 248500, difference: 0, passed: true },
          { fieldPath: "income.taxableIncome_line15", description: "Taxable income = AGI - deductions", expected: 218500, actual: 218500, difference: 0, passed: true },
          { fieldPath: "scheduleC[0].netProfit_line31", description: "Schedule C net profit = gross income - expenses", expected: 78000, actual: 78000, difference: 0, passed: true },
          { fieldPath: "scheduleE.properties[0].netRentalIncome", description: "Property A net = rents - expenses", expected: 42000, actual: 42000, difference: 0, passed: true },
          { fieldPath: "scheduleE.properties[1].netRentalIncome", description: "Property B net = rents - expenses", expected: 28000, actual: 28000, difference: 0, passed: true },
          { fieldPath: "scheduleE.totalRentalIncome_line26", description: "Total rental income = sum of property nets", expected: 70000, actual: 70000, difference: 0, passed: true },
          { fieldPath: "pnl.grossProfit", description: "P&L gross profit = revenue - COGS", expected: 320000, actual: 320000, difference: 0, passed: true },
          { fieldPath: "pnl.netIncome", description: "P&L net income = gross profit - operating expenses", expected: 72000, actual: 72000, difference: 0, passed: true },
        ] as Prisma.InputJsonValue,
        mathPassed: 8,
        mathFailed: 0,
        crossDocChecks: [
          { description: "1040 wages vs bank payroll deposits", doc1Type: "FORM_1040", doc1Field: "income.wages_line1", doc1Value: 142000, doc2Type: "BANK_STATEMENT", doc2Field: "annualizedPayroll", doc2Value: 142000, difference: 0, percentDiff: 0, status: "pass" },
          { description: "Schedule E gross rents vs bank rental deposits", doc1Type: "SCHEDULE_E", doc1Field: "totalRentsReceived", doc1Value: 150000, doc2Type: "BANK_STATEMENT", doc2Field: "annualizedRentalDeposits", doc2Value: 150000, difference: 0, percentDiff: 0, status: "pass" },
          { description: "1040 Schedule E rental income vs standalone Schedule E", doc1Type: "FORM_1040", doc1Field: "scheduleE.totalRentalIncome_line26", doc1Value: 70000, doc2Type: "SCHEDULE_E", doc2Field: "netRentalIncome", doc2Value: 70000, difference: 0, percentDiff: 0, status: "pass" },
          { description: "P&L revenue includes rental matching Schedule E gross", doc1Type: "PROFIT_AND_LOSS", doc1Field: "revenue.rentalIncome", doc1Value: 150000, doc2Type: "SCHEDULE_E", doc2Field: "totalRentsReceived", doc2Value: 150000, difference: 0, percentDiff: 0, status: "pass" },
        ] as Prisma.InputJsonValue,
        crossDocPassed: 4,
        crossDocFailed: 0,
        crossDocWarnings: 0,
        textractChecks: [] as Prisma.InputJsonValue,
        textractAgreed: 0,
        textractDisagreed: 0,
        fieldVerification: {
          totalFields: 42,
          verifiedFields: 42,
          unverifiedFields: 0,
          confidence: 1.0,
        } as Prisma.InputJsonValue,
        overallStatus: "PASS",
      },
    });

    // ── Update deal status to ANALYZING ────────────────────────────────────
    await prisma.deal.update({
      where: { id: deal.id },
      data: { status: "ANALYZING" },
    });

    // ── Trigger Inngest pipeline ───────────────────────────────────────────
    await inngest.send({
      name: "deal/sample-process",
      data: {
        dealId: deal.id,
        triggeredAt: Date.now(),
      },
    });

    // ── Audit log ──────────────────────────────────────────────────────────
    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId: deal.id,
      action: "deal.sample_created",
      metadata: {
        borrowerName: SAMPLE_BORROWER.borrowerName,
        loanAmount: SAMPLE_BORROWER.loanAmount,
        loanProgramId: SAMPLE_BORROWER.loanProgramId,
      },
    });

    return NextResponse.json(
      {
        deal,
        message: "Sample deal created. Processing...",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals/sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
