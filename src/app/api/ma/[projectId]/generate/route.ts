import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { inngest } from "@/inngest/client";

// POST /api/ma/[projectId]/generate - Trigger M&A document generation pipeline

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, pipelineLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.mAProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Only allow generation from CREATED or NEEDS_REVIEW (re-generation) or ERROR (retry)
    if (
      project.status !== "CREATED" &&
      project.status !== "NEEDS_REVIEW" &&
      project.status !== "ERROR"
    ) {
      return NextResponse.json(
        {
          error: `Cannot generate documents for project in ${project.status} status. Must be CREATED, NEEDS_REVIEW, or ERROR.`,
        },
        { status: 409 }
      );
    }

    // Validate minimum required data for generation
    if (!project.buyerName || !project.sellerName || !project.targetCompany) {
      return NextResponse.json(
        {
          error:
            "Project is missing required data (buyerName, sellerName, targetCompany) for document generation.",
        },
        { status: 400 }
      );
    }

    // Update status to GENERATING_DOCS
    await prisma.mAProject.update({
      where: { id: projectId },
      data: {
        status: "GENERATING_DOCS",
        errorMessage: null,
        errorStep: null,
      },
    });

    // Send Inngest event to start the M&A pipeline
    await inngest.send({
      name: "ma/project.generate",
      data: { projectId, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "ma",
      entityId: project.id,
      action: "ma.pipeline_started",
      metadata: {
        transactionType: project.transactionType,
        targetCompany: project.targetCompany,
        previousStatus: project.status,
      },
    });

    return NextResponse.json({
      message: "M&A document generation started",
      projectId: project.id,
      status: "GENERATING_DOCS",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/ma/[projectId]/generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
