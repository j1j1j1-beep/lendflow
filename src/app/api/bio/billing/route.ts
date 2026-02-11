import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/bio/billing — current bio subscription status for the authed org

export async function GET() {
  try {
    const { org } = await requireAuth();

    // Current month in "YYYY-MM" format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [subscription, usage, programCount] = await Promise.all([
      prisma.bioSubscription.findUnique({
        where: { orgId: org.id },
      }),
      prisma.bioUsageLog.findFirst({
        where: { orgId: org.id, month: currentMonth },
      }),
      prisma.bioProgram.count({
        where: { orgId: org.id },
      }),
    ]);

    // Calculate trial programs remaining (null if not on trial)
    let trialProgramsRemaining: number | null = null;
    if (!subscription || subscription.plan === "trial" || subscription.status === "trialing") {
      trialProgramsRemaining = Math.max(0, 1 - programCount);
    }

    return NextResponse.json({
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            licensePaid: subscription.licensePaid,
            maxSeats: subscription.maxSeats,
            currentSeats: subscription.currentSeats,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      usage: {
        programsProcessed: usage?.programsProcessed ?? 0,
        docsGenerated: usage?.docsGenerated ?? 0,
        pagesExtracted: usage?.pagesExtracted ?? 0,
        month: currentMonth,
      },
      programCount,
      trialProgramsRemaining,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/billing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
