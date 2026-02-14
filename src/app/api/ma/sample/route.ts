import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkPaywall } from "@/lib/paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { SAMPLE_MA_DEALS } from "@/config/sample-deals/deals";
import { getMASourceDocs } from "@/config/sample-deals/source-docs/ma-source-docs";

// POST /api/ma/sample — Create a pre-populated sample M&A project
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

    const deal = SAMPLE_MA_DEALS.find((d) => d.id === dealId);
    if (!deal) {
      return NextResponse.json({ error: "Unknown sample deal" }, { status: 400 });
    }

    const sourceDocs = getMASourceDocs(dealId);
    if (!sourceDocs) {
      return NextResponse.json({ error: "No source docs for this deal" }, { status: 400 });
    }

    // Prevent duplicate
    const existing = await prisma.mAProject.findFirst({
      where: { orgId: org.id, targetCompany: deal.targetCompany },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Sample project already exists. Delete it first or choose a different sample." },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.mAProject.create({
      data: {
        name: deal.name,
        transactionType: deal.transactionType as any,
        buyerName: deal.buyerName,
        sellerName: deal.sellerName,
        targetCompany: deal.targetCompany,
        purchasePrice: deal.purchasePrice,
        cashComponent: deal.cashComponent,
        stockComponent: deal.stockComponent,
        earnoutAmount: deal.earnoutAmount,
        exclusivityDays: deal.exclusivityDays,
        dueDiligenceDays: deal.dueDiligenceDays,
        targetIndustry: deal.targetIndustry,
        governingLaw: deal.governingLaw,
        nonCompeteYears: deal.nonCompeteYears,
        escrowPercent: deal.escrowPercent / 100,
        hsrRequired: deal.purchasePrice >= 119500000,
        orgId: org.id,
        userId: user.id,
      },
    });

    // Create SourceDocument records
    for (const [docType, ocrText] of Object.entries(sourceDocs)) {
      await prisma.sourceDocument.create({
        data: {
          module: "ma",
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
    await prisma.mAProject.update({
      where: { id: project.id },
      data: { status: "GENERATING_DOCS" },
    });

    await inngest.send({
      name: "ma/project.generate",
      data: { projectId: project.id, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "ma",
      entityId: project.id,
      action: "ma.sample_created",
      metadata: { dealId, targetCompany: deal.targetCompany },
    });

    return NextResponse.json(
      { project, message: "Sample project created. Generating documents..." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/ma/sample error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
