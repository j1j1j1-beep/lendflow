import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/bio/programs/[programId] — Get single program with all related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
      include: {
        bioDocuments: {
          orderBy: { createdAt: "desc" },
          include: {
            extractions: {
              select: { id: true, model: true, createdAt: true },
            },
          },
        },
        bioAnalysis: true,
        bioParameters: true,
        bioGeneratedDocuments: {
          orderBy: { createdAt: "desc" },
        },
        bioConditions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/programs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/bio/programs/[programId] — Delete program (cascades)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Cascade delete handled by Prisma onDelete: Cascade
    await prisma.bioProgram.delete({
      where: { id: programId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/bio/programs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
