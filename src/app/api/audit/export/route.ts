import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/audit/export — Download audit logs as CSV

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();
    const { searchParams } = new URL(request.url);

    const dealId = searchParams.get("dealId");
    const format = searchParams.get("format") ?? "csv";

    const where: Record<string, unknown> = { orgId: org.id };
    if (dealId) where.dealId = dealId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Cap at 10k rows
    });

    if (format === "json") {
      const jsonStr = JSON.stringify(logs, null, 2);
      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="audit_log_${org.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    // Default: CSV
    const header = "Timestamp,User,Action,Target,Deal ID,Metadata";
    const rows = logs.map((log) => {
      const ts = new Date(log.createdAt).toISOString();
      const user = csvEscape(log.userEmail ?? "system");
      const action = csvEscape(log.action);
      const target = csvEscape(log.target ?? "");
      const deal = csvEscape(log.dealId ?? "");
      const meta = csvEscape(
        log.metadata ? JSON.stringify(log.metadata) : ""
      );
      return `${ts},${user},${action},${target},${deal},${meta}`;
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit_log_${org.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/audit/export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
