import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// ---------------------------------------------------------------------------
// GET /api/billing/usage — historical monthly usage for the authed org
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { org } = await requireAuth();

    const logs = await prisma.usageLog.findMany({
      where: { orgId: org.id },
      orderBy: { month: "desc" },
      take: 12, // Last 12 months
    });

    const months = logs.map((log) => ({
      month: log.month,
      deals: log.dealsProcessed,
      docs: log.docsGenerated,
    }));

    return NextResponse.json({ months });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/billing/usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
