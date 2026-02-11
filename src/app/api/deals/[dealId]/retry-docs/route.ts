import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadToS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";

// POST /api/deals/[dealId]/retry-docs — Retry all FAILED / FLAGGED documents

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { user, org } = await requireAuth();
    const { dealId } = await params;

    // Verify deal belongs to user's org
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
      include: { dealTerms: true, org: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (!deal.loanProgramId || !deal.dealTerms) {
      return NextResponse.json(
        { error: "Deal has no loan program or terms" },
        { status: 400 }
      );
    }

    // Find all failed/flagged generated documents for this deal
    const failedDocs = await prisma.generatedDocument.findMany({
      where: {
        dealId,
        status: { in: ["FAILED", "FLAGGED"] },
      },
    });

    if (failedDocs.length === 0) {
      return NextResponse.json(
        { retried: 0, succeeded: 0, failed: 0, results: [] },
        { status: 200 }
      );
    }

    // Build the DocumentInput (same pattern as inngest/functions.ts buildDocInput)
    const { getLoanProgram } = await import("@/config/loan-programs");
    const program = getLoanProgram(deal.loanProgramId);
    if (!program) {
      return NextResponse.json(
        { error: "Loan program not found" },
        { status: 400 }
      );
    }

    const { computeMaturityDate, computeFirstPaymentDate } = await import(
      "@/documents/doc-helpers"
    );

    const terms = deal.dealTerms;
    const stateMatch = deal.propertyAddress?.match(/,\s*([A-Z]{2})\s+\d{5}/);
    const stateAbbr = stateMatch ? stateMatch[1] : null;
    const generatedAt = new Date();

    const docInput = {
      dealId: deal.id,
      borrowerName: deal.borrowerName,
      lenderName: deal.org.name,
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
        lateFeePercent: program.lateFeePercent,
        lateFeeGraceDays: program.lateFeeGraceDays,
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

    // Mark all as REGENERATING to prevent concurrent retries
    await prisma.generatedDocument.updateMany({
      where: {
        id: { in: failedDocs.map((d) => d.id) },
        status: { in: ["FAILED", "FLAGGED"] },
      },
      data: { status: "REGENERATING" },
    });

    const { generateSingleDocument } = await import(
      "@/documents/generate-all"
    );

    // Process each failed document
    const results: Array<{
      docType: string;
      success: boolean;
      version?: number;
      status?: string;
      error?: string;
    }> = [];
    let succeeded = 0;
    let errored = 0;

    for (const doc of failedDocs) {
      try {
        // Build feedback string from existing issues (same as regenerate route)
        const feedbackParts: string[] = [];

        const legalIssues = doc.legalIssues as any[] | null;
        if (legalIssues && legalIssues.length > 0) {
          feedbackParts.push("LEGAL REVIEW ISSUES FROM PREVIOUS VERSION:");
          for (const issue of legalIssues) {
            feedbackParts.push(
              `- [${issue.severity}] ${issue.section}: ${issue.description}${issue.recommendation ? ` (Fix: ${issue.recommendation})` : ""}`
            );
          }
        }

        const complianceChecks = doc.complianceChecks as any[] | null;
        if (complianceChecks) {
          const failed = complianceChecks.filter((c: any) => !c.passed);
          if (failed.length > 0) {
            feedbackParts.push(
              "\nFAILED COMPLIANCE CHECKS FROM PREVIOUS VERSION:"
            );
            for (const check of failed) {
              feedbackParts.push(
                `- ${check.name}${check.regulation ? ` (${check.regulation})` : ""}${check.note ? `: ${check.note}` : ""}`
              );
            }
          }
        }

        const verificationIssues = doc.verificationIssues as any[] | null;
        if (verificationIssues && verificationIssues.length > 0) {
          feedbackParts.push("\nVERIFICATION ISSUES FROM PREVIOUS VERSION:");
          for (const issue of verificationIssues) {
            feedbackParts.push(
              `- ${typeof issue === "string" ? issue : JSON.stringify(issue)}`
            );
          }
        }

        const feedback =
          feedbackParts.length > 0 ? feedbackParts.join("\n") : undefined;

        // Generate the document
        const result = await generateSingleDocument(
          doc.docType,
          docInput,
          feedback
        );

        // Upload new version to S3
        const newVersion = doc.version + 1;
        const s3Key = `${deal.orgId}/${deal.id}/loan-documents/${doc.docType}-v${newVersion}.docx`;
        await uploadToS3(
          s3Key,
          result.buffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        // Update the document record
        await prisma.generatedDocument.update({
          where: { id: doc.id },
          data: {
            s3Key,
            version: newVersion,
            status: result.status,
            legalReviewStatus: result.legalReview.passed
              ? "APPROVED"
              : "FLAGGED",
            legalIssues: result.legalReview.issues as any,
            verificationStatus: result.verification.passed
              ? "PASSED"
              : "FAILED",
            verificationIssues: result.verification.issues as any,
            complianceChecks: result.complianceChecks as any,
          },
        });

        results.push({
          docType: doc.docType,
          success: true,
          version: newVersion,
          status: result.status,
        });
        succeeded++;
      } catch (err) {
        // Reset this doc back to FLAGGED on failure
        try {
          await prisma.generatedDocument.update({
            where: { id: doc.id },
            data: { status: "FLAGGED" },
          });
        } catch {
          /* best-effort reset */
        }

        results.push({
          docType: doc.docType,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        errored++;
      }
    }

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId: deal.id,
      action: "doc.batch_retry",
      metadata: {
        totalRetried: failedDocs.length,
        succeeded,
        failed: errored,
        docTypes: failedDocs.map((d) => d.docType),
      },
    });

    return NextResponse.json({
      retried: failedDocs.length,
      succeeded,
      failed: errored,
      results,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "UNAUTHORIZED")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals/[dealId]/retry-docs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
