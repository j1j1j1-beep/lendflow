import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";

// POST /api/bio/programs/[programId]/analyze — Trigger bio analysis pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const limited = await withRateLimit(request, pipelineLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Check program has documents
    const documentCount = await prisma.bioDocument.count({
      where: { programId },
    });

    if (documentCount === 0) {
      return NextResponse.json(
        { error: "Program must have at least one document before analysis" },
        { status: 400 },
      );
    }

    // Check program status allows triggering
    const allowedStatuses = ["CREATED", "UPLOADING", "COMPLETE", "ERROR"];
    if (!allowedStatuses.includes(program.status)) {
      return NextResponse.json(
        {
          error: `Cannot start analysis when program status is ${program.status}. Allowed: ${allowedStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Reset errored documents
    if (program.status === "ERROR") {
      await prisma.bioDocument.updateMany({
        where: { programId, status: "ERROR" },
        data: { status: "PENDING" },
      });
    }

    // Update program status
    await prisma.bioProgram.update({
      where: { id: programId },
      data: {
        status: "EXTRACTING",
        errorMessage: null,
        errorStep: null,
      },
    });

    // Send Inngest event
    await inngest.send({
      name: "bio/analyze",
      data: {
        programId,
        orgId: org.id,
        triggeredAt: Date.now(),
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      programId,
      action: "bio.pipeline_started",
      target: programId,
    });

    return NextResponse.json({ success: true, programId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bio/analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
