import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadToS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { user, org } = await requireAuth();
    const { docId } = await params;

    const body = await request.json().catch(() => ({}));
    const officerNotes = body.notes as string | undefined;

    // Get the existing generated document
    const doc = await prisma.generatedDocument.findFirst({
      where: { id: docId },
      include: { deal: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify org ownership
    if (doc.deal.orgId !== org.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Double-click protection: reject if already regenerating
    if (doc.status === "REGENERATING") {
      return NextResponse.json({ error: "Document is already being regenerated" }, { status: 409 });
    }

    // Mark as regenerating to prevent concurrent requests
    await prisma.generatedDocument.update({
      where: { id: docId },
      data: { status: "REGENERATING" },
    });

    // Build the feedback string from existing issues + officer notes
    const feedbackParts: string[] = [];

    // Add legal issues from previous pass
    const legalIssues = doc.legalIssues as any[] | null;
    if (legalIssues && legalIssues.length > 0) {
      feedbackParts.push("LEGAL REVIEW ISSUES FROM PREVIOUS VERSION:");
      for (const issue of legalIssues) {
        feedbackParts.push(`- [${issue.severity}] ${issue.section}: ${issue.description}${issue.recommendation ? ` (Fix: ${issue.recommendation})` : ""}`);
      }
    }

    // Add failed compliance checks from previous pass
    const complianceChecks = doc.complianceChecks as any[] | null;
    if (complianceChecks) {
      const failed = complianceChecks.filter((c: any) => !c.passed);
      if (failed.length > 0) {
        feedbackParts.push("\nFAILED COMPLIANCE CHECKS FROM PREVIOUS VERSION:");
        for (const check of failed) {
          feedbackParts.push(`- ${check.name}${check.regulation ? ` (${check.regulation})` : ""}${check.note ? `: ${check.note}` : ""}`);
        }
      }
    }

    // Add failed verification issues
    const verificationIssues = doc.verificationIssues as any[] | null;
    if (verificationIssues && verificationIssues.length > 0) {
      feedbackParts.push("\nVERIFICATION ISSUES FROM PREVIOUS VERSION:");
      for (const issue of verificationIssues) {
        feedbackParts.push(`- ${typeof issue === "string" ? issue : JSON.stringify(issue)}`);
      }
    }

    // Add officer notes
    if (officerNotes && officerNotes.trim()) {
      feedbackParts.push(`\nLOAN OFFICER INSTRUCTIONS:\n${officerNotes.trim()}`);
    }

    const feedback = feedbackParts.length > 0 ? feedbackParts.join("\n") : undefined;

    // Build the document input (same as pipeline does)
    const deal = await prisma.deal.findUniqueOrThrow({
      where: { id: doc.dealId },
      include: { dealTerms: true, org: true },
    });

    if (!deal.loanProgramId || !deal.dealTerms) {
      return NextResponse.json({ error: "Deal has no loan program or terms" }, { status: 400 });
    }

    const { getLoanProgram } = await import("@/config/loan-programs");
    const program = getLoanProgram(deal.loanProgramId);
    if (!program) {
      return NextResponse.json({ error: "Loan program not found" }, { status: 400 });
    }

    const { computeMaturityDate, computeFirstPaymentDate } = await import("@/documents/doc-helpers");

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

    // Regenerate with feedback context — full legal pipeline runs again
    const { generateSingleDocument } = await import("@/documents/generate-all");
    const result = await generateSingleDocument(doc.docType, docInput, feedback);

    // Upload new version to S3
    const newVersion = doc.version + 1;
    const s3Key = `${deal.orgId}/${deal.id}/loan-documents/${doc.docType}-v${newVersion}.docx`;
    await uploadToS3(
      s3Key,
      result.buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    // Update the document record
    await prisma.generatedDocument.update({
      where: { id: docId },
      data: {
        s3Key,
        version: newVersion,
        status: result.status,
        legalReviewStatus: result.legalReview.passed ? "APPROVED" : "FLAGGED",
        legalIssues: result.legalReview.issues as any,
        verificationStatus: result.verification.passed ? "PASSED" : "FAILED",
        verificationIssues: result.verification.issues as any,
        complianceChecks: result.complianceChecks as any,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId: deal.id,
      action: "doc.regenerated",
      target: doc.docType,
      metadata: {
        version: newVersion,
        hadFeedback: !!feedback,
        previousIssueCount: (legalIssues?.length ?? 0) + (complianceChecks?.filter((c: any) => !c.passed).length ?? 0),
        newStatus: result.status,
      },
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      status: result.status,
      legalReviewPassed: result.legalReview.passed,
      issueCount: result.legalReview.issues.length,
      complianceChecksPassed: result.complianceChecks.filter(c => c.passed).length,
      complianceChecksTotal: result.complianceChecks.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Reset status from REGENERATING back to previous state on failure
    const { docId: failedDocId } = await params;
    try {
      await prisma.generatedDocument.update({
        where: { id: failedDocId },
        data: { status: "FLAGGED" },
      });
    } catch { /* best-effort reset */ }
    console.error("POST /api/generated-documents/[docId]/regenerate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
