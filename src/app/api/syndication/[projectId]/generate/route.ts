import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { heavyLimit } from "@/lib/rate-limit";

// POST /api/syndication/[projectId]/generate - Trigger document generation

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, heavyLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    // Verify project exists and belongs to this org
    const project = await prisma.syndicationProject.findFirst({
      where: { id: projectId, orgId: org.id, deletedAt: null },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only allow generation from CREATED or ERROR status (retry)
    if (project.status !== "CREATED" && project.status !== "ERROR") {
      return NextResponse.json(
        { error: `Cannot generate documents for project in ${project.status} status` },
        { status: 409 },
      );
    }

    // Update status to GENERATING_DOCS
    await prisma.syndicationProject.update({
      where: { id: projectId },
      data: {
        status: "GENERATING_DOCS",
        errorMessage: null,
        errorStep: null,
        updatedBy: user.id,
      },
    });

    // Send Inngest event to start the pipeline
    await inngest.send({
      name: "syndication/project.generate",
      data: { projectId },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "syndication",
      entityId: projectId,
      action: "syndication.pipeline_started",
      metadata: { name: project.name, propertyType: project.propertyType },
    });

    return NextResponse.json({
      success: true,
      message: "Document generation started",
      projectId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/syndication/[projectId]/generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
