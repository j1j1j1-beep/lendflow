import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

// Valid enum values for validation
const VALID_FUND_TYPES = new Set([
  "PRIVATE_EQUITY", "VENTURE_CAPITAL", "REAL_ESTATE",
  "HEDGE_FUND", "CREDIT", "INFRASTRUCTURE",
]);

const VALID_EXEMPTION_TYPES = new Set([
  "REG_D_506B", "REG_D_506C", "REG_A_TIER1", "REG_A_TIER2", "REG_CF",
]);

const VALID_ICA_EXEMPTIONS = new Set(["SECTION_3C1", "SECTION_3C7"]);

const VALID_STATUSES = new Set([
  "CREATED", "GENERATING_DOCS", "COMPLIANCE_REVIEW",
  "NEEDS_REVIEW", "COMPLETE", "ERROR",
]);

// POST /api/capital - Create a new CapitalProject

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.fundName || typeof body.fundName !== "string" || body.fundName.trim() === "") {
      return NextResponse.json({ error: "fundName is required" }, { status: 400 });
    }
    if (!body.fundType || !VALID_FUND_TYPES.has(body.fundType)) {
      return NextResponse.json({ error: "fundType is required and must be a valid FundType" }, { status: 400 });
    }
    if (!body.gpEntityName || typeof body.gpEntityName !== "string" || body.gpEntityName.trim() === "") {
      return NextResponse.json({ error: "gpEntityName is required" }, { status: 400 });
    }

    // Validate optional enum fields
    if (body.exemptionType !== undefined && !VALID_EXEMPTION_TYPES.has(body.exemptionType)) {
      return NextResponse.json({ error: "Invalid exemptionType" }, { status: 400 });
    }
    if (body.icaExemption !== undefined && !VALID_ICA_EXEMPTIONS.has(body.icaExemption)) {
      return NextResponse.json({ error: "Invalid icaExemption" }, { status: 400 });
    }

    // Validate and coerce numeric fields
    const targetRaise = body.targetRaise != null ? Number(body.targetRaise) : null;
    const minInvestment = body.minInvestment != null ? Number(body.minInvestment) : null;
    const managementFee = body.managementFee != null ? Number(body.managementFee) : null;
    const carriedInterest = body.carriedInterest != null ? Number(body.carriedInterest) : null;
    const preferredReturn = body.preferredReturn != null ? Number(body.preferredReturn) : null;
    const fundTermYears = body.fundTermYears != null ? Math.round(Number(body.fundTermYears)) : null;
    const investmentPeriod = body.investmentPeriod != null ? Math.round(Number(body.investmentPeriod)) : null;
    const gpCommitment = body.gpCommitment != null ? Number(body.gpCommitment) : null;
    const maxInvestors = body.maxInvestors != null ? Math.round(Number(body.maxInvestors)) : null;
    const nonAccreditedLimit = body.nonAccreditedLimit != null ? Math.round(Number(body.nonAccreditedLimit)) : null;

    if (targetRaise !== null && (!Number.isFinite(targetRaise) || targetRaise <= 0)) {
      return NextResponse.json({ error: "targetRaise must be a positive number" }, { status: 400 });
    }
    if (minInvestment !== null && (!Number.isFinite(minInvestment) || minInvestment <= 0)) {
      return NextResponse.json({ error: "minInvestment must be a positive number" }, { status: 400 });
    }
    if (managementFee !== null && (!Number.isFinite(managementFee) || managementFee < 0 || managementFee > 1)) {
      return NextResponse.json({ error: "managementFee must be between 0 and 1" }, { status: 400 });
    }
    if (carriedInterest !== null && (!Number.isFinite(carriedInterest) || carriedInterest < 0 || carriedInterest > 1)) {
      return NextResponse.json({ error: "carriedInterest must be between 0 and 1" }, { status: 400 });
    }
    if (preferredReturn !== null && (!Number.isFinite(preferredReturn) || preferredReturn < 0 || preferredReturn > 1)) {
      return NextResponse.json({ error: "preferredReturn must be between 0 and 1" }, { status: 400 });
    }
    if (fundTermYears !== null && (!Number.isFinite(fundTermYears) || fundTermYears <= 0)) {
      return NextResponse.json({ error: "fundTermYears must be a positive integer" }, { status: 400 });
    }
    if (investmentPeriod !== null && (!Number.isFinite(investmentPeriod) || investmentPeriod <= 0)) {
      return NextResponse.json({ error: "investmentPeriod must be a positive integer" }, { status: 400 });
    }
    if (gpCommitment !== null && (!Number.isFinite(gpCommitment) || gpCommitment <= 0)) {
      return NextResponse.json({ error: "gpCommitment must be a positive number" }, { status: 400 });
    }
    if (maxInvestors !== null && (!Number.isFinite(maxInvestors) || maxInvestors <= 0)) {
      return NextResponse.json({ error: "maxInvestors must be a positive integer" }, { status: 400 });
    }
    if (nonAccreditedLimit !== null && (!Number.isFinite(nonAccreditedLimit) || nonAccreditedLimit < 0)) {
      return NextResponse.json({ error: "nonAccreditedLimit must be a non-negative integer" }, { status: 400 });
    }

    const project = await prisma.capitalProject.create({
      data: {
        name: body.name.trim(),
        fundName: body.fundName.trim(),
        fundType: body.fundType,
        gpEntityName: body.gpEntityName.trim(),
        gpStateOfFormation: body.gpStateOfFormation ?? null,
        exemptionType: body.exemptionType ?? undefined,
        icaExemption: body.icaExemption ?? undefined,
        targetRaise,
        minInvestment,
        managementFee,
        carriedInterest,
        preferredReturn,
        hurdles: body.hurdles ?? undefined,
        fundTermYears,
        investmentPeriod,
        gpCommitment,
        investmentStrategy: body.investmentStrategy ?? null,
        targetIndustries: body.targetIndustries ?? undefined,
        geographicFocus: body.geographicFocus ?? null,
        maxInvestors,
        accreditedOnly: body.accreditedOnly === true,
        nonAccreditedLimit,
        formDFilingDate: body.formDFilingDate ? new Date(body.formDFilingDate) : null,
        formDAmendmentDate: body.formDAmendmentDate ? new Date(body.formDAmendmentDate) : null,
        riskFactorsIncluded: body.riskFactorsIncluded === true,
        useOfProceedsDisclosed: body.useOfProceedsDisclosed === true,
        stateFilings: body.stateFilings ?? undefined,
        keyPersonProvision: body.keyPersonProvision === true,
        keyPersonNames: body.keyPersonNames ?? undefined,
        clawbackProvision: body.clawbackProvision === true,
        orgId: org.id,
        userId: user.id,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "capital",
      entityId: project.id,
      action: "capital.project_created",
      metadata: { name: project.name, fundType: project.fundType },
    });

    // Convert Decimal fields to numbers for JSON serialization
    const serialized = {
      ...project,
      targetRaise: project.targetRaise ? Number(project.targetRaise) : null,
      minInvestment: project.minInvestment ? Number(project.minInvestment) : null,
      gpCommitment: project.gpCommitment ? Number(project.gpCommitment) : null,
    };

    return NextResponse.json({ project: serialized }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/capital error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/capital - List CapitalProjects for the org

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const status = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : null;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const searchQuery = searchParams.get("search");

    const where: Record<string, unknown> = { orgId: org.id, deletedAt: null };
    if (status) {
      where.status = status;
    }
    if (searchQuery && searchQuery.trim()) {
      where.name = { contains: searchQuery.trim(), mode: "insensitive" };
    }

    const [projects, total] = await Promise.all([
      prisma.capitalProject.findMany({
        where,
        include: {
          _count: {
            select: { capitalDocuments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.capitalProject.count({ where }),
    ]);

    // Convert Decimal fields for JSON serialization
    const serialized = projects.map((p) => ({
      ...p,
      targetRaise: p.targetRaise ? Number(p.targetRaise) : null,
      minInvestment: p.minInvestment ? Number(p.minInvestment) : null,
      gpCommitment: p.gpCommitment ? Number(p.gpCommitment) : null,
    }));

    return NextResponse.json({
      projects: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/capital error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
