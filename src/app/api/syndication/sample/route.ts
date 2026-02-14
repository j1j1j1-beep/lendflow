import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkPaywall } from "@/lib/paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { SAMPLE_SYNDICATION_DEALS } from "@/config/sample-deals/syndication";
import { getSyndicationSourceDocs } from "@/config/sample-deals/source-docs/syndication-source-docs";

// POST /api/syndication/sample — Create a pre-populated sample syndication project
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

    const deal = SAMPLE_SYNDICATION_DEALS.find((d) => d.id === dealId);
    if (!deal) {
      return NextResponse.json({ error: "Unknown sample deal" }, { status: 400 });
    }

    const sourceDocs = getSyndicationSourceDocs(dealId);
    if (!sourceDocs) {
      return NextResponse.json({ error: "No source docs for this deal" }, { status: 400 });
    }

    // Prevent duplicate
    const existing = await prisma.syndicationProject.findFirst({
      where: { orgId: org.id, entityName: deal.entityName },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Sample project already exists. Delete it first or choose a different sample." },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.syndicationProject.create({
      data: {
        name: deal.name,
        entityName: deal.entityName,
        sponsorName: deal.sponsorName,
        propertyAddress: deal.propertyAddress,
        propertyType: deal.propertyType as any,
        purchasePrice: deal.purchasePrice,
        totalEquityRaise: deal.totalEquityRaise,
        minInvestment: deal.minInvestment,
        loanAmount: deal.loanAmount,
        interestRate: deal.interestRate / 100,
        preferredReturn: deal.preferredReturn / 100,
        projectedIrr: deal.projectedIrr / 100,
        acquisitionFee: deal.acquisitionFee / 100,
        assetMgmtFee: deal.assetMgmtFee / 100,
        projectedHoldYears: deal.projectedHoldYears,
        units: deal.units,
        yearBuilt: deal.yearBuilt,
        orgId: org.id,
        userId: user.id,
      },
    });

    // Create SourceDocument records
    for (const [docType, ocrText] of Object.entries(sourceDocs)) {
      await prisma.sourceDocument.create({
        data: {
          module: "syndication",
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
    await prisma.syndicationProject.update({
      where: { id: project.id },
      data: { status: "GENERATING_DOCS" },
    });

    await inngest.send({
      name: "syndication/project.generate",
      data: { projectId: project.id, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "syndication",
      entityId: project.id,
      action: "syndication.sample_created",
      metadata: { dealId, entityName: deal.entityName },
    });

    return NextResponse.json(
      { project, message: "Sample project created. Generating documents..." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/syndication/sample error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
