import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkPaywall } from "@/lib/paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { pipelineLimit } from "@/lib/rate-limit";
import { SAMPLE_COMPLIANCE_DEALS } from "@/config/sample-deals/compliance";
import { getComplianceSourceDocs } from "@/config/sample-deals/source-docs/compliance-source-docs";

// POST /api/compliance/sample — Create a pre-populated sample compliance project
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

    const deal = SAMPLE_COMPLIANCE_DEALS.find((d) => d.id === dealId);
    if (!deal) {
      return NextResponse.json({ error: "Unknown sample deal" }, { status: 400 });
    }

    const sourceDocs = getComplianceSourceDocs(dealId);
    if (!sourceDocs) {
      return NextResponse.json({ error: "No source docs for this deal" }, { status: 400 });
    }

    // Prevent duplicate
    const existing = await prisma.complianceProject.findFirst({
      where: { orgId: org.id, name: deal.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Sample project already exists. Delete it first or choose a different sample." },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.complianceProject.create({
      data: {
        name: deal.name,
        reportType: deal.reportType as any,
        fundName: deal.fundName,
        fundType: (deal.fundType as any) ?? null,
        reportingQuarter: deal.reportingQuarter ?? null,
        periodStart: deal.periodStart ? new Date(deal.periodStart) : null,
        periodEnd: deal.periodEnd ? new Date(deal.periodEnd) : null,
        nav: deal.nav ?? null,
        totalContributions: deal.totalContributions ?? null,
        totalDistributions: deal.totalDistributions ?? null,
        netIrr: deal.netIrr != null ? deal.netIrr / 100 : null,
        moic: deal.moic ?? null,
        callAmount: deal.callAmount ?? null,
        callDueDate: deal.callDueDate ? new Date(deal.callDueDate) : null,
        callPurpose: deal.callPurpose ?? null,
        distributionAmount: deal.distributionAmount ?? null,
        distributionType: deal.distributionType ?? null,
        taxYear: deal.taxYear ?? null,
        filingDeadline: deal.filingDeadline ? new Date(deal.filingDeadline) : null,
        orgId: org.id,
        userId: user.id,
      },
    });

    // Create SourceDocument records
    for (const [docType, ocrText] of Object.entries(sourceDocs)) {
      await prisma.sourceDocument.create({
        data: {
          module: "compliance",
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
    await prisma.complianceProject.update({
      where: { id: project.id },
      data: { status: "GENERATING_DOCS" },
    });

    await inngest.send({
      name: "compliance/project.generate",
      data: { projectId: project.id, triggeredAt: Date.now() },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "compliance",
      entityId: project.id,
      action: "compliance.sample_created",
      metadata: { dealId, reportType: deal.reportType },
    });

    return NextResponse.json(
      { project, message: "Sample project created. Generating documents..." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/compliance/sample error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
