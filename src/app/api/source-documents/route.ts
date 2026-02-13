import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/source-documents?module=X&projectId=Y
// Returns all active (non-deleted) source documents for a project.

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const { searchParams } = request.nextUrl;
    const module = searchParams.get("module");
    const projectId = searchParams.get("projectId");

    if (!module || !projectId) {
      return NextResponse.json(
        { error: "module and projectId are required" },
        { status: 400 },
      );
    }

    const docs = await prisma.sourceDocument.findMany({
      where: {
        module,
        projectId,
        orgId: org.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ docs });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/source-documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
