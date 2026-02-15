import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { countAllProjects, TRIAL_PROJECT_LIMIT } from "@/lib/paywall";

// GET /api/billing — current subscription status for the authed org

export async function GET() {
  try {
    const { org } = await requireAuth();

    // Current month in "YYYY-MM" format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [subscription, usage, memberCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: { orgId: org.id },
      }),
      prisma.usageLog.findFirst({
        where: { orgId: org.id, month: currentMonth },
      }),
      prisma.user.count({
        where: { orgId: org.id },
      }),
    ]);

    // Calculate trial projects remaining (null if not on trial)
    let trialProjectsRemaining: number | null = null;
    if (!subscription || subscription.plan === "trial" || subscription.status === "trialing") {
      const totalProjects = await countAllProjects(org.id);
      trialProjectsRemaining = Math.max(0, TRIAL_PROJECT_LIMIT - totalProjects);
    }

    return NextResponse.json({
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            licensePaid: subscription.licensePaid,
            maxSeats: subscription.maxSeats,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      usage: {
        dealsProcessed: usage?.dealsProcessed ?? 0,
        docsGenerated: usage?.docsGenerated ?? 0,
        month: currentMonth,
      },
      members: {
        count: memberCount,
        max: subscription?.maxSeats ?? 10,
      },
      trialProjectsRemaining,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/billing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
