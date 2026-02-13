import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { generalLimit } from "@/lib/rate-limit";

export async function GET() {
  const { org } = await requireAuth();
  const rl = generalLimit.check(org.id);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const orgId = org.id;

  // Query all 5 modules in parallel
  const [deals, capitalProjects, maProjects, syndicationProjects, complianceProjects] =
    await Promise.all([
      prisma.deal.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          borrowerName: true,
          loanAmount: true,
          loanType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { generatedDocuments: true } },
        },
      }),
      prisma.capitalProject.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          fundName: true,
          fundType: true,
          targetRaise: true,
          status: true,
          formDFilingDate: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { capitalDocuments: true } },
        },
      }),
      prisma.mAProject.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          transactionType: true,
          purchasePrice: true,
          targetCloseDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { maDocuments: true } },
        },
      }),
      prisma.syndicationProject.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          entityName: true,
          propertyType: true,
          propertyAddress: true,
          loanAmount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { syndicationDocuments: true } },
        },
      }),
      prisma.complianceProject.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          fundName: true,
          reportType: true,
          periodEnd: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { complianceDocuments: true } },
        },
      }),
    ]);

  // Serialize Decimal fields
  const serializeDeals = deals.map((d) => ({
    ...d,
    loanAmount: d.loanAmount ? Number(d.loanAmount) : null,
  }));
  const serializeCapital = capitalProjects.map((p) => ({
    ...p,
    targetRaise: p.targetRaise ? Number(p.targetRaise) : null,
  }));
  const serializeMA = maProjects.map((p) => ({
    ...p,
    purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
  }));
  const serializeSyndication = syndicationProjects.map((p) => ({
    ...p,
    loanAmount: p.loanAmount ? Number(p.loanAmount) : null,
  }));

  // Compute stats
  const ACTIVE_STATUSES = new Set([
    "UPLOADED", "PROCESSING_OCR", "CLASSIFYING", "EXTRACTING", "VERIFYING",
    "RESOLVING", "ANALYZING", "STRUCTURING", "GENERATING_DOCS", "GENERATING_MEMO",
    "COMPLIANCE_REVIEW", "CREATED",
  ]);
  const REVIEW_STATUSES = new Set(["NEEDS_REVIEW", "NEEDS_TERM_REVIEW"]);

  const allProjects = [
    ...serializeDeals.map((d) => ({ module: "lending" as const, id: d.id, name: d.borrowerName, status: d.status, updatedAt: d.updatedAt, createdAt: d.createdAt, docs: d._count.generatedDocuments })),
    ...serializeCapital.map((p) => ({ module: "capital" as const, id: p.id, name: p.fundName, status: p.status, updatedAt: p.updatedAt, createdAt: p.createdAt, docs: p._count.capitalDocuments })),
    ...serializeMA.map((p) => ({ module: "ma" as const, id: p.id, name: p.name, status: p.status, updatedAt: p.updatedAt, createdAt: p.createdAt, docs: p._count.maDocuments })),
    ...serializeSyndication.map((p) => ({ module: "syndication" as const, id: p.id, name: p.entityName || p.propertyAddress || "Syndication", status: p.status, updatedAt: p.updatedAt, createdAt: p.createdAt, docs: p._count.syndicationDocuments })),
    ...complianceProjects.map((p) => ({ module: "compliance" as const, id: p.id, name: p.fundName || p.reportType, status: p.status, updatedAt: p.updatedAt, createdAt: p.createdAt, docs: p._count.complianceDocuments })),
  ];

  const stats = {
    total: allProjects.length,
    active: allProjects.filter((p) => ACTIVE_STATUSES.has(p.status)).length,
    needsReview: allProjects.filter((p) => REVIEW_STATUSES.has(p.status)).length,
    complete: allProjects.filter((p) => p.status === "COMPLETE").length,
    error: allProjects.filter((p) => p.status === "ERROR").length,
    docsGenerated: allProjects.reduce((sum, p) => sum + p.docs, 0),
    byModule: {
      lending: serializeDeals.length,
      capital: serializeCapital.length,
      ma: serializeMA.length,
      syndication: serializeSyndication.length,
      compliance: complianceProjects.length,
    },
  };

  // Recent projects (most recently updated, max 10)
  const recent = allProjects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  // Deadlines from module-specific fields
  const deadlines: Array<{ module: string; projectId: string; projectName: string; label: string; date: string }> = [];

  for (const p of capitalProjects) {
    if (p.formDFilingDate) {
      deadlines.push({ module: "capital", projectId: p.id, projectName: p.fundName, label: "Form D Filing", date: new Date(p.formDFilingDate).toISOString() });
    }
  }
  for (const p of maProjects) {
    if (p.targetCloseDate) {
      deadlines.push({ module: "ma", projectId: p.id, projectName: p.name, label: "Closing Date", date: new Date(p.targetCloseDate).toISOString() });
    }
  }
  for (const p of complianceProjects) {
    if (p.periodEnd) {
      deadlines.push({ module: "compliance", projectId: p.id, projectName: p.fundName || p.reportType, label: "Reporting Period End", date: new Date(p.periodEnd).toISOString() });
    }
  }

  // Sort deadlines by date ascending
  deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Flagged projects (NEEDS_REVIEW or ERROR)
  const flagged = allProjects
    .filter((p) => REVIEW_STATUSES.has(p.status) || p.status === "ERROR")
    .slice(0, 5);

  return NextResponse.json({
    stats,
    recent,
    deadlines: deadlines.slice(0, 10),
    flagged,
  });
}
