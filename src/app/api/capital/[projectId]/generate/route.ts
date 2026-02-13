import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { inngest } from "@/inngest/client";

// Statuses that allow triggering generation
const GENERATABLE_STATUSES = new Set(["CREATED", "NEEDS_REVIEW", "ERROR"]);

// POST /api/capital/[projectId]/generate - Trigger document generation

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, pipelineLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    // Verify project exists and belongs to org
    const project = await prisma.capitalProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!GENERATABLE_STATUSES.has(project.status)) {
      return NextResponse.json(
        { error: `Cannot generate documents when project is in ${project.status} status` },
        { status: 400 }
      );
    }

    // Update status to GENERATING_DOCS
    await prisma.capitalProject.update({
      where: { id: projectId },
      data: { status: "GENERATING_DOCS", errorMessage: null, errorStep: null },
    });

    // Trigger Inngest pipeline
    await inngest.send({
      name: "capital/project.generate",
      data: { projectId, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "capital",
      entityId: projectId,
      action: "capital.pipeline_started",
      metadata: { fundType: project.fundType, name: project.name },
    });

    return NextResponse.json({
      success: true,
      message: "Document generation started",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/capital/[projectId]/generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
