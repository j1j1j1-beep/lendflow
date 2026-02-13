import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

// Valid SyndicationPropertyType values
const VALID_PROPERTY_TYPES = new Set([
  "MULTIFAMILY", "OFFICE", "RETAIL", "INDUSTRIAL", "MIXED_USE",
  "SELF_STORAGE", "MOBILE_HOME_PARK", "HOTEL", "NNN_RETAIL",
  "SENIOR_HOUSING", "STUDENT_HOUSING", "BUILD_TO_RENT",
]);

const VALID_ENTITY_TYPES = new Set(["LLC", "LP"]);

const VALID_EXEMPTION_TYPES = new Set([
  "REG_D_506B", "REG_D_506C", "REG_A_TIER1", "REG_A_TIER2", "REG_CF",
]);

// Float fields that must be in 0-1 range
const FEE_FIELDS = [
  "acquisitionFee", "assetMgmtFee", "dispositionFee",
  "constructionMgmtFee", "refinancingFee", "guaranteeFee", "propertyMgmtFee",
  "preferredReturn", "projectedIrr", "vacancyRate", "rentGrowthRate",
  "expenseGrowthRate", "exitCapRate", "interestRate",
  "projectedEquityMultiple", "bonusDepreciationPct",
] as const;

function validateFeeRange(name: string, value: unknown): string | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) {
    return `${name} must be a number between 0 and 1`;
  }
  return null;
}

// GET /api/syndication/[projectId] - Get full project with all related data

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.syndicationProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
      include: {
        syndicationDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
        waterfallTiers: {
          orderBy: { tierOrder: "asc" },
        },
        syndicationInvestors: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate presigned download URLs for all syndication documents
    const documentsWithUrls = await Promise.all(
      project.syndicationDocuments.map(async (doc) => {
        let downloadUrl: string | null = null;
        if (doc.s3Key) {
          try {
            downloadUrl = await getPresignedDownloadUrl(doc.s3Key);
          } catch {
            downloadUrl = null;
          }
        }
        return { ...doc, downloadUrl };
      })
    );

    return NextResponse.json({
      project: {
        ...project,
        syndicationDocuments: documentsWithUrls,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/syndication/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/syndication/[projectId] - Update project fields

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    // Verify project exists and belongs to this org
    const existing = await prisma.syndicationProject.findFirst({
      where: { id: projectId, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate propertyType if provided
    if (body.propertyType != null && !VALID_PROPERTY_TYPES.has(body.propertyType)) {
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

    // Validate fee fields
    for (const field of FEE_FIELDS) {
      if (body[field] != null) {
        const err = validateFeeRange(field, body[field]);
        if (err) {
          return NextResponse.json({ error: err }, { status: 400 });
        }
      }
    }

    // Build update data — only include fields present in body
    const updateData: Record<string, unknown> = {};

    // String fields
    const stringFields = [
      "name", "entityName", "sponsorName", "sponsorEntity",
      "propertyName", "propertyAddress", "stateOfFormation",
    ] as const;
    for (const field of stringFields) {
      if (body[field] !== undefined) {
        updateData[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
      }
    }

    // Enum fields
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.entityType !== undefined) updateData.entityType = body.entityType;
    if (body.exemptionType !== undefined) updateData.exemptionType = body.exemptionType;

    // Decimal fields
    const decimalFields = [
      "sponsorEquity", "purchasePrice", "renovationBudget", "closingCosts",
      "totalEquityRaise", "minInvestment", "loanAmount", "currentNoi", "proFormaNoi",
    ] as const;
    for (const field of decimalFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] != null ? Number(body[field]) : null;
      }
    }

    // Integer fields
    const intFields = ["units", "squareFeet", "yearBuilt", "loanTermYears", "projectedHoldYears", "ioTermMonths"] as const;
    for (const field of intFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] != null ? Math.round(Number(body[field])) : null;
      }
    }

    // Float/fee fields
    for (const field of FEE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] != null ? Number(body[field]) : null;
      }
    }

    // Boolean fields
    const boolFields = [
      "interestOnly", "isQOZ", "is1031Exchange",
      "ubtiRisk", "passiveLossEligible", "repsQualified",
    ] as const;
    for (const field of boolFields) {
      if (body[field] !== undefined) {
        updateData[field] = Boolean(body[field]);
      }
    }

    // JSON fields
    if (body.blueSkyFilings !== undefined) updateData.blueSkyFilings = body.blueSkyFilings;
    if (body.sponsorTrackRecord !== undefined) updateData.sponsorTrackRecord = body.sponsorTrackRecord;

    // DateTime
    if (body.formDFilingDate !== undefined) {
      updateData.formDFilingDate = body.formDFilingDate ? new Date(body.formDFilingDate) : null;
    }

    // Audit field
    updateData.updatedBy = user.id;

    // Handle waterfallTiers replacement if provided
    const replaceWaterfallTiers = Array.isArray(body.waterfallTiers);
    let validatedTiers: Array<{
      tierOrder: number;
      tierName?: string;
      hurdleRate?: number;
      lpSplit: number;
      gpSplit: number;
      description?: string;
    }> = [];

    if (replaceWaterfallTiers) {
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
        validatedTiers.push({
          tierOrder: tier.tierOrder,
          tierName: tier.tierName ?? undefined,
          hurdleRate: tier.hurdleRate != null ? Number(tier.hurdleRate) : undefined,
          lpSplit: tier.lpSplit,
          gpSplit: tier.gpSplit,
          description: tier.description ?? undefined,
        });
      }
    }

    // Use a transaction to update project + replace waterfall tiers atomically
    const project = await prisma.$transaction(async (tx) => {
      // Update the project
      const updated = await tx.syndicationProject.update({
        where: { id: projectId },
        data: updateData,
      });

      // Replace waterfall tiers if provided
      if (replaceWaterfallTiers) {
        await tx.waterfallTier.deleteMany({ where: { projectId } });
        if (validatedTiers.length > 0) {
          await tx.waterfallTier.createMany({
            data: validatedTiers.map((t) => ({
              projectId,
              tierOrder: t.tierOrder,
              tierName: t.tierName ?? null,
              hurdleRate: t.hurdleRate ?? null,
              lpSplit: t.lpSplit,
              gpSplit: t.gpSplit,
              description: t.description ?? null,
            })),
          });
        }
      }

      // Re-fetch with includes
      return tx.syndicationProject.findUnique({
        where: { id: projectId },
        include: {
          waterfallTiers: { orderBy: { tierOrder: "asc" } },
        },
      });
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "syndication",
      entityId: projectId,
      action: "syndication.project_updated",
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/syndication/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
