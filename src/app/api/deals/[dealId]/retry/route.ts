import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { inngest } from "@/inngest/client";
import { deleteFromS3 } from "@/lib/s3";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/deals/[dealId]/retry - Retry a failed deal pipeline
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { user, org } = await requireAuth();
    const { dealId } = await params;

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        orgId: org.id,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "ERROR") {
      return NextResponse.json(
        { error: "Only deals in ERROR status can be retried" },
        { status: 400 }
      );
    }

    // Atomic status guard — prevents race condition from double-clicks
    const updated = await prisma.deal.updateMany({
      where: { id: dealId, orgId: org.id, status: "ERROR" },
      data: {
        status: "PROCESSING_OCR",
        errorMessage: null,
        errorStep: null,
      },
    });
    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Deal is no longer in ERROR status" },
        { status: 409 }
      );
    }

    // Collect S3 keys from generated docs and memos before deleting DB records
    const [genDocs, memos] = await Promise.all([
      prisma.generatedDocument.findMany({ where: { dealId }, select: { s3Key: true } }),
      prisma.creditMemo.findMany({ where: { dealId }, select: { s3Key: true } }),
    ]);

    // Clean up ALL previous pipeline artifacts for a fresh retry
    await Promise.all([
      prisma.extraction.deleteMany({ where: { dealId } }),
      prisma.verificationReport.deleteMany({ where: { dealId } }),
      prisma.analysis.deleteMany({ where: { dealId } }),
      prisma.reviewItem.deleteMany({ where: { dealId } }),
      prisma.dealTerms.deleteMany({ where: { dealId } }),
      prisma.condition.deleteMany({ where: { dealId } }),
      prisma.generatedDocument.deleteMany({ where: { dealId } }),
      prisma.creditMemo.deleteMany({ where: { dealId } }),
    ]);

    // Clean up orphaned S3 objects (best-effort — don't fail the retry on S3 errors)
    const s3Keys = [...genDocs.map((d) => d.s3Key), ...memos.map((m) => m.s3Key)].filter(Boolean);
    if (s3Keys.length > 0) {
      await Promise.allSettled(s3Keys.map((key) => deleteFromS3(key)));
    }

    // Reset all document statuses and classification metadata back to initial state
    await prisma.document.updateMany({
      where: { dealId },
      data: {
        status: "PENDING",
        docType: null,
        docYear: null,
        pageCount: null,
      },
    });

    // Re-trigger the pipeline
    await inngest.send({ name: "deal/analyze", data: { dealId } });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId,
      action: "deal.retried",
      metadata: { previousError: deal.errorMessage, previousErrorStep: deal.errorStep },
    });

    return NextResponse.json({ success: true, dealId });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "UNAUTHORIZED")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals/[dealId]/retry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
