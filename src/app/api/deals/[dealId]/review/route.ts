import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { inngest } from "@/inngest/client";

// ---------------------------------------------------------------------------
// POST /api/deals/[dealId]/review - Resolve a review item
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { user, org } = await requireAuth();
    const { dealId } = await params;

    // Verify deal belongs to org
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const { reviewItemId, action, value, note } = body;

    if (!reviewItemId || typeof reviewItemId !== "string") {
      return NextResponse.json(
        { error: "reviewItemId is required" },
        { status: 400 }
      );
    }

    const validActions = ["confirm", "correct", "note"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: confirm, correct, note" },
        { status: 400 }
      );
    }

    if (action === "correct" && (value == null || value === "")) {
      return NextResponse.json(
        { error: "value is required when action is 'correct'" },
        { status: 400 }
      );
    }

    // Find the review item and verify it belongs to this deal
    const reviewItem = await prisma.reviewItem.findFirst({
      where: { id: reviewItemId, dealId },
    });

    if (!reviewItem) {
      return NextResponse.json(
        { error: "Review item not found" },
        { status: 404 }
      );
    }

    if (reviewItem.status !== "PENDING") {
      return NextResponse.json(
        { error: "Review item has already been resolved" },
        { status: 400 }
      );
    }

    // Map action to ReviewStatus
    const statusMap: Record<string, "CONFIRMED" | "CORRECTED" | "NOTED"> = {
      confirm: "CONFIRMED",
      correct: "CORRECTED",
      note: "NOTED",
    };

    const updatedItem = await prisma.reviewItem.update({
      where: { id: reviewItemId },
      data: {
        status: statusMap[action],
        resolvedValue: action === "correct" ? String(value) : note ?? null,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      },
    });

    // Check if all review items for this deal are resolved
    const pendingCount = await prisma.reviewItem.count({
      where: { dealId, status: "PENDING" },
    });

    const allResolved = pendingCount === 0;

    // If all resolved, send Inngest event to resume pipeline
    if (allResolved) {
      await inngest.send({
        name: "deal/review-complete",
        data: { dealId },
      });
    }

    return NextResponse.json({
      reviewItem: updatedItem,
      allResolved,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals/[dealId]/review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
