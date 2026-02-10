import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
// import { checkPaywall } from "@/lib/paywall"; // TODO: Enable after launch
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/analyze - Trigger analysis pipeline for a deal
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth();

    // TODO: Enable paywall after launch
    // const paywall = await checkPaywall(org.id);
    // if (!paywall.allowed) {
    //   return NextResponse.json({ error: paywall.reason }, { status: 402 });
    // }

    const body = await request.json();
    const { dealId } = body;

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 }
      );
    }

    // Verify deal belongs to org
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify deal has at least 1 document
    const documentCount = await prisma.document.count({
      where: { dealId },
    });

    if (documentCount === 0) {
      return NextResponse.json(
        { error: "Deal must have at least one document before analysis" },
        { status: 400 }
      );
    }

    // Verify deal status allows triggering analysis
    const allowedStatuses = ["UPLOADED", "NEEDS_REVIEW", "ERROR"];
    if (!allowedStatuses.includes(deal.status)) {
      return NextResponse.json(
        {
          error: `Cannot start analysis when deal status is ${deal.status}. Allowed statuses: ${allowedStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // For re-trigger: reset document statuses to PENDING so they get reprocessed
    if (deal.status === "ERROR") {
      await prisma.document.updateMany({
        where: { dealId, status: "ERROR" },
        data: { status: "PENDING" },
      });
    }

    // Update deal status
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: "PROCESSING_OCR",
        errorMessage: null,
        errorStep: null,
      },
    });

    // Send Inngest event to start the pipeline
    await inngest.send({
      name: "deal/analyze",
      data: { dealId, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId,
      action: "deal.analyzed",
      metadata: { borrowerName: deal.borrowerName, previousStatus: deal.status },
    });

    return NextResponse.json({ success: true, dealId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
