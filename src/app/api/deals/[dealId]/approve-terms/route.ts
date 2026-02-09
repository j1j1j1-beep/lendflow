import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { inngest } from "@/inngest/client";

// ---------------------------------------------------------------------------
// POST /api/deals/[dealId]/approve-terms - Approve deal terms and resume pipeline
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { dealId } = await params;

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "NEEDS_TERM_REVIEW") {
      return NextResponse.json(
        { error: "Deal is not awaiting term review" },
        { status: 400 }
      );
    }

    // Send Inngest event to resume pipeline
    await inngest.send({
      name: "deal/terms-approved",
      data: { dealId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals/[dealId]/approve-terms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
