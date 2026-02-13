import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

// Valid SyndicationPropertyType values
const VALID_PROPERTY_TYPES = new Set([
  "MULTIFAMILY", "OFFICE", "RETAIL", "INDUSTRIAL", "MIXED_USE",
  "SELF_STORAGE", "MOBILE_HOME_PARK", "HOTEL", "NNN_RETAIL",
  "SENIOR_HOUSING", "STUDENT_HOUSING", "BUILD_TO_RENT",
]);

// Valid SyndicationProjectStatus values for filtering
const VALID_STATUSES = new Set([
  "CREATED", "GENERATING_DOCS", "COMPLIANCE_REVIEW",
  "NEEDS_REVIEW", "COMPLETE", "ERROR",
]);

const VALID_ENTITY_TYPES = new Set(["LLC", "LP"]);

const VALID_EXEMPTION_TYPES = new Set([
  "REG_D_506B", "REG_D_506C", "REG_A_TIER1", "REG_A_TIER2", "REG_CF",
]);

// Float fields that must be in 0-1 range (percentages stored as decimals)
const FEE_FIELDS = [
  "acquisitionFee", "assetMgmtFee", "dispositionFee",
  "constructionMgmtFee", "refinancingFee", "guaranteeFee", "propertyMgmtFee",
  "preferredReturn", "projectedIrr", "vacancyRate", "rentGrowthRate",
  "expenseGrowthRate", "exitCapRate", "interestRate",
  "projectedEquityMultiple", "bonusDepreciationPct",
] as const;

/**
 * Validate that a value is a float in 0-1 range (or null/undefined).
 * Returns error message or null if valid.
 */
function validateFeeRange(name: string, value: unknown): string | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) {
    return `${name} must be a number between 0 and 1`;
  }
  return null;
}

// POST /api/syndication - Create a new SyndicationProject

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.entityName || typeof body.entityName !== "string" || body.entityName.trim() === "") {
      return NextResponse.json({ error: "entityName is required" }, { status: 400 });
    }
    if (!body.sponsorName || typeof body.sponsorName !== "string" || body.sponsorName.trim() === "") {
      return NextResponse.json({ error: "sponsorName is required" }, { status: 400 });
    }
    if (!body.propertyAddress || typeof body.propertyAddress !== "string" || body.propertyAddress.trim() === "") {
      return NextResponse.json({ error: "propertyAddress is required" }, { status: 400 });
    }
    if (!body.propertyType || !VALID_PROPERTY_TYPES.has(body.propertyType)) {
      return NextResponse.json(
        { error: `propertyType must be one of: ${[...VALID_PROPERTY_TYPES].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate entityType if provided
    if (body.entityType != null && !VALID_ENTITY_TYPES.has(body.entityType)) {
      return NextResponse.json(
        { error: `entityType must be one of: ${[...VALID_ENTITY_TYPES].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate exemptionType if provided
    if (body.exemptionType != null && !VALID_EXEMPTION_TYPES.has(body.exemptionType)) {
      return NextResponse.json(
        { error: `exemptionType must be one of: ${[...VALID_EXEMPTION_TYPES].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate all fee/percentage fields are 0-1 range
    for (const field of FEE_FIELDS) {
      if (body[field] != null) {
        const err = validateFeeRange(field, body[field]);
        if (err) {
          return NextResponse.json({ error: err }, { status: 400 });
        }
      }
    }

    // Validate waterfallTiers if provided
    const waterfallTiers: Array<{
      tierOrder: number;
      tierName?: string;
      hurdleRate?: number;
      lpSplit: number;
      gpSplit: number;
      description?: string;
    }> = [];

    if (Array.isArray(body.waterfallTiers)) {
      for (let i = 0; i < body.waterfallTiers.length; i++) {
        const tier = body.waterfallTiers[i];
        if (tier.tierOrder == null || typeof tier.tierOrder !== "number") {
          return NextResponse.json(
            { error: `waterfallTiers[${i}].tierOrder is required and must be a number` },
            { status: 400 },
          );
        }
        if (tier.lpSplit == null || typeof tier.lpSplit !== "number") {
          return NextResponse.json(
            { error: `waterfallTiers[${i}].lpSplit is required and must be a number` },
            { status: 400 },
          );
        }
        if (tier.gpSplit == null || typeof tier.gpSplit !== "number") {
          return NextResponse.json(
            { error: `waterfallTiers[${i}].gpSplit is required and must be a number` },
            { status: 400 },
          );
        }
        waterfallTiers.push({
          tierOrder: tier.tierOrder,
          tierName: tier.tierName ?? undefined,
          hurdleRate: tier.hurdleRate != null ? Number(tier.hurdleRate) : undefined,
          lpSplit: tier.lpSplit,
          gpSplit: tier.gpSplit,
          description: tier.description ?? undefined,
        });
      }
    }

    // Coerce numeric fields
    const decimalFields = [
      "sponsorEquity", "purchasePrice", "renovationBudget", "closingCosts",
      "totalEquityRaise", "minInvestment", "loanAmount", "currentNoi", "proFormaNoi",
    ] as const;

    const numericData: Record<string, number | null> = {};
    for (const field of decimalFields) {
      if (body[field] != null) {
        const n = Number(body[field]);
        if (!Number.isFinite(n)) {
          return NextResponse.json({ error: `${field} must be a valid number` }, { status: 400 });
        }
        numericData[field] = n;
      } else {
        numericData[field] = null;
      }
    }

    const intFields = ["units", "squareFeet", "yearBuilt", "loanTermYears", "projectedHoldYears", "ioTermMonths"] as const;
    const intData: Record<string, number | null> = {};
    for (const field of intFields) {
      if (body[field] != null) {
        const n = Math.round(Number(body[field]));
        if (!Number.isFinite(n)) {
          return NextResponse.json({ error: `${field} must be a valid integer` }, { status: 400 });
        }
        intData[field] = n;
      } else {
        intData[field] = null;
      }
    }

    const floatData: Record<string, number | null> = {};
    for (const field of FEE_FIELDS) {
      floatData[field] = body[field] != null ? Number(body[field]) : null;
    }

    const project = await prisma.syndicationProject.create({
      data: {
        name: body.name.trim(),
        entityName: body.entityName.trim(),
        entityType: body.entityType ?? "LLC",
        stateOfFormation: body.stateOfFormation ?? "Delaware",
        exemptionType: body.exemptionType ?? "REG_D_506B",
        sponsorName: body.sponsorName.trim(),
        sponsorEntity: body.sponsorEntity ?? null,
        sponsorEquity: numericData.sponsorEquity,
        propertyName: body.propertyName ?? null,
        propertyAddress: body.propertyAddress.trim(),
        propertyType: body.propertyType,
        units: intData.units,
        squareFeet: intData.squareFeet,
        yearBuilt: intData.yearBuilt,
        purchasePrice: numericData.purchasePrice,
        renovationBudget: numericData.renovationBudget,
        closingCosts: numericData.closingCosts,
        totalEquityRaise: numericData.totalEquityRaise,
        minInvestment: numericData.minInvestment,
        loanAmount: numericData.loanAmount,
        interestRate: floatData.interestRate,
        loanTermYears: intData.loanTermYears,
        interestOnly: body.interestOnly ?? false,
        ioTermMonths: intData.ioTermMonths,
        preferredReturn: floatData.preferredReturn,
        projectedHoldYears: intData.projectedHoldYears,
        projectedIrr: floatData.projectedIrr,
        projectedEquityMultiple: floatData.projectedEquityMultiple,
        acquisitionFee: floatData.acquisitionFee,
        assetMgmtFee: floatData.assetMgmtFee,
        dispositionFee: floatData.dispositionFee,
        constructionMgmtFee: floatData.constructionMgmtFee,
        refinancingFee: floatData.refinancingFee,
        guaranteeFee: floatData.guaranteeFee,
        propertyMgmtFee: floatData.propertyMgmtFee,
        isQOZ: body.isQOZ ?? false,
        is1031Exchange: body.is1031Exchange ?? false,
        bonusDepreciationPct: floatData.bonusDepreciationPct,
        ubtiRisk: body.ubtiRisk ?? false,
        passiveLossEligible: body.passiveLossEligible ?? true,
        repsQualified: body.repsQualified ?? false,
        formDFilingDate: body.formDFilingDate ? new Date(body.formDFilingDate) : null,
        blueSkyFilings: body.blueSkyFilings ?? null,
        sponsorTrackRecord: body.sponsorTrackRecord ?? null,
        currentNoi: numericData.currentNoi,
        proFormaNoi: numericData.proFormaNoi,
        vacancyRate: floatData.vacancyRate,
        rentGrowthRate: floatData.rentGrowthRate,
        expenseGrowthRate: floatData.expenseGrowthRate,
        exitCapRate: floatData.exitCapRate,
        orgId: org.id,
        userId: user.id,
        ...(waterfallTiers.length > 0
          ? {
              waterfallTiers: {
                create: waterfallTiers.map((t) => ({
                  tierOrder: t.tierOrder,
                  tierName: t.tierName ?? null,
                  hurdleRate: t.hurdleRate ?? null,
                  lpSplit: t.lpSplit,
                  gpSplit: t.gpSplit,
                  description: t.description ?? null,
                })),
              },
            }
          : {}),
      },
      include: {
        waterfallTiers: { orderBy: { tierOrder: "asc" } },
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "syndication",
      entityId: project.id,
      action: "syndication.project_created",
      metadata: { name: project.name, propertyType: project.propertyType },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/syndication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/syndication - List syndication projects for the org

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    let statusFilter: string | string[] | null = null;
    if (statusParam) {
      const statuses = statusParam.split(",").filter(s => VALID_STATUSES.has(s.trim()));
      if (statuses.length === 1) statusFilter = statuses[0];
      else if (statuses.length > 1) statusFilter = statuses;
    }
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const searchQuery = searchParams.get("search");

    const where: Record<string, unknown> = { orgId: org.id, deletedAt: null };
    if (statusFilter) {
      where.status = Array.isArray(statusFilter) ? { in: statusFilter } : statusFilter;
    }
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: "insensitive" } },
        { propertyAddress: { contains: searchQuery.trim(), mode: "insensitive" } },
        { sponsorName: { contains: searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.syndicationProject.findMany({
        where,
        include: {
          _count: {
            select: { syndicationDocuments: true, syndicationInvestors: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.syndicationProject.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/syndication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
