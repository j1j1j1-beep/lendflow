import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkPaywall } from "@/lib/paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { SAMPLE_CAPITAL_DEALS } from "@/config/sample-deals/capital";
import { getCapitalSourceDocs } from "@/config/sample-deals/source-docs/capital-source-docs";

// POST /api/capital/sample — Create a pre-populated sample capital project
// Skips S3/Textract. Inserts classified SourceDocuments with ocrText, then
// triggers the generation pipeline via Inngest.

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, pipelineLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();

    const paywall = await checkPaywall(org.id);
    if (!paywall.allowed) {
      return NextResponse.json({ error: paywall.reason }, { status: 402 });
    }

    const body = await request.json().catch(() => null);
    const dealId = body?.dealId as string | undefined;
    if (!dealId) {
      return NextResponse.json({ error: "dealId is required" }, { status: 400 });
    }

    const deal = SAMPLE_CAPITAL_DEALS.find((d) => d.id === dealId);
    if (!deal) {
      return NextResponse.json({ error: "Unknown sample deal" }, { status: 400 });
    }

    const sourceDocs = getCapitalSourceDocs(dealId);
    if (!sourceDocs) {
      return NextResponse.json({ error: "No source docs for this deal" }, { status: 400 });
    }

    // Prevent duplicate
    const existing = await prisma.capitalProject.findFirst({
      where: { orgId: org.id, fundName: deal.fundName },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Sample project already exists. Delete it first or choose a different sample." },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.capitalProject.create({
      data: {
        name: deal.name,
        fundName: deal.fundName,
        fundType: deal.fundType as any,
        gpEntityName: deal.gpEntityName,
        exemptionType: deal.exemptionType as any,
        targetRaise: deal.targetRaise,
        minInvestment: deal.minInvestment,
        managementFee: deal.managementFee / 100,
        carriedInterest: deal.carriedInterest / 100,
        preferredReturn: deal.preferredReturn / 100,
        fundTermYears: deal.fundTermYears,
        investmentStrategy: deal.investmentStrategy,
        geographicFocus: deal.geographicFocus,
        orgId: org.id,
        userId: user.id,
      },
    });

    // Create SourceDocument records with pre-populated ocrText
    for (const [docType, ocrText] of Object.entries(sourceDocs)) {
      await prisma.sourceDocument.create({
        data: {
          module: "capital",
          projectId: project.id,
          docType,
          fileName: `sample_${docType}.pdf`,
          s3Key: `${org.id}/${project.id}/sample/${docType}.pdf`,
          ocrText,
          fileSize: 0,
          contentType: "application/pdf",
          orgId: org.id,
          userId: user.id,
          classifiedAt: new Date(),
          classificationConfidence: 1.0,
        },
      });
    }

    // Update status and trigger pipeline
    await prisma.capitalProject.update({
      where: { id: project.id },
      data: { status: "GENERATING_DOCS" },
    });

    await inngest.send({
      name: "capital/project.generate",
      data: { projectId: project.id, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "capital",
      entityId: project.id,
      action: "capital.sample_created",
      metadata: { dealId, fundName: deal.fundName },
    });

    return NextResponse.json(
      { project, message: "Sample project created. Generating documents..." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/capital/sample error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
