import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadToS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { heavyLimit } from "@/lib/rate-limit";

// POST /api/bio/generated-documents/[docId]/regenerate

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const limited = await withRateLimit(request, heavyLimit);
  if (limited) return limited;

  let originalStatus: string | undefined;
  let resolvedDocId: string | undefined;
  try {
    const { user, org } = await requireAuth();
    const { docId } = await params;
    resolvedDocId = docId;

    const body = await request.json().catch(() => ({}));
    const officerNotes = body.notes as string | undefined;
    // #12: Optimistic concurrency — caller passes expected version
    const expectedVersion = typeof body.version === "number" ? body.version : undefined;

    // Get the existing bio generated document with program + analysis
    const doc = await prisma.bioGeneratedDocument.findFirst({
      where: { id: docId },
      include: {
        program: {
          include: { bioAnalysis: true },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Verify org ownership
    if (doc.program.orgId !== org.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // #12: Optimistic concurrency — reject if version doesn't match
    if (expectedVersion !== undefined && doc.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: `Version conflict: expected v${expectedVersion} but document is at v${doc.version}. Please refresh and try again.`,
        },
        { status: 409 },
      );
    }

    // Save original status to restore on failure
    originalStatus = doc.status;

    // #11 + #12: Atomic check-and-update using version + status filter to prevent race conditions
    const updateResult = await prisma.bioGeneratedDocument.updateMany({
      where: { id: docId, version: doc.version, status: { not: "REGENERATING" } },
      data: { status: "REGENERATING" },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: "Document is already being regenerated or was modified concurrently. Please refresh and try again." },
        { status: 409 },
      );
    }

    // Build the feedback string from existing issues + officer notes
    const feedbackParts: string[] = [];

    // Add compliance issues from previous pass
    const complianceIssues = doc.complianceIssues as any[] | null;
    if (complianceIssues && complianceIssues.length > 0) {
      feedbackParts.push("COMPLIANCE ISSUES FROM PREVIOUS VERSION:");
      for (const issue of complianceIssues) {
        feedbackParts.push(
          `- [${issue.severity}] ${issue.section}: ${issue.description}${issue.recommendation ? ` (Fix: ${issue.recommendation})` : ""}`,
        );
      }
    }

    // Add failed regulatory checks from previous pass
    const regulatoryChecks = doc.regulatoryChecks as any[] | null;
    if (regulatoryChecks) {
      const failed = regulatoryChecks.filter((c: any) => !c.passed);
      if (failed.length > 0) {
        feedbackParts.push("\nFAILED REGULATORY CHECKS FROM PREVIOUS VERSION:");
        for (const check of failed) {
          feedbackParts.push(
            `- ${check.name}${check.regulation ? ` (${check.regulation})` : ""}${check.note ? `: ${check.note}` : ""}`,
          );
        }
      }
    }

    // Add verification issues from previous pass
    const verificationIssues = doc.verificationIssues as any[] | null;
    if (verificationIssues && verificationIssues.length > 0) {
      feedbackParts.push("\nVERIFICATION ISSUES FROM PREVIOUS VERSION:");
      for (const issue of verificationIssues) {
        feedbackParts.push(
          `- ${typeof issue === "string" ? issue : JSON.stringify(issue)}`,
        );
      }
    }

    // Add officer notes
    if (officerNotes && officerNotes.trim()) {
      feedbackParts.push(
        `\nREGULATORY OFFICER INSTRUCTIONS:\n${officerNotes.trim()}`,
      );
    }

    const feedback =
      feedbackParts.length > 0 ? feedbackParts.join("\n") : undefined;

    const program = doc.program;
    const analysis = program.bioAnalysis;

    // Reconstruct BioDocumentInput from program data
    // Mirrors the pattern in bio-functions.ts lines 448-480
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
      generatedAt: new Date(),
      // Include analysis data if available
      toxData: analysis?.toxSummary as Record<string, unknown> | undefined,
      pkData: analysis?.pkSummary as Record<string, unknown> | undefined,
      clinicalData: analysis?.clinicalData as
        | Record<string, unknown>
        | undefined,
      batchData: analysis?.cmcData
        ? Array.isArray(analysis.cmcData)
          ? (analysis.cmcData as Record<string, unknown>[])
          : [analysis.cmcData as Record<string, unknown>]
        : undefined,
      stabilityData: analysis?.stabilityProfile as
        | Record<string, unknown>
        | undefined,
    };

    // Regenerate with feedback context — full compliance pipeline runs again
    const { generateSingleBioDocument } = await import("@/bio/generate-all");
    const result = await generateSingleBioDocument(
      doc.docType,
      bioDocInput,
      feedback,
    );

    // Upload new version to S3
    const newVersion = doc.version + 1;
    const s3Key = `${org.id}/bio/${program.id}/ind-documents/${doc.docType}-v${newVersion}.docx`;
    await uploadToS3(
      s3Key,
      result.buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    // Update the document record
    await prisma.bioGeneratedDocument.update({
      where: { id: docId },
      data: {
        s3Key,
        version: newVersion,
        status: result.status,
        complianceStatus: result.complianceReview.passed ? "PASSED" : "FLAGGED",
        complianceIssues: result.complianceReview.issues as any,
        verificationStatus: result.verification.passed ? "PASSED" : "FAILED",
        verificationIssues: result.verification.issues as any,
        regulatoryChecks: result.regulatoryChecks as any,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      programId: program.id,
      action: "bio.doc.regenerated",
      target: doc.docType,
      metadata: {
        version: newVersion,
        hadFeedback: !!feedback,
        previousIssueCount:
          (complianceIssues?.length ?? 0) +
          (regulatoryChecks?.filter((c: any) => !c.passed)?.length ?? 0),
        newStatus: result.status,
      },
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      status: result.status,
      complianceReviewPassed: result.complianceReview.passed,
      issueCount: result.complianceReview.issues.length,
      regulatoryChecksPassed: result.regulatoryChecks.filter(
        (c) => c.passed,
      ).length,
      regulatoryChecksTotal: result.regulatoryChecks.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Reset status from REGENERATING back to previous state on failure
    if (resolvedDocId) {
      try {
        await prisma.bioGeneratedDocument.update({
          where: { id: resolvedDocId },
          data: { status: originalStatus ?? "ERROR" },
        });
      } catch {
        /* best-effort reset */
      }
    }
    console.error(
      "POST /api/bio/generated-documents/[docId]/regenerate error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
