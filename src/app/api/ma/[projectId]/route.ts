import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  TransactionType,
  HSRStatus,
  TaxStructure,
} from "@/generated/prisma/client";

// 2025 HSR size-of-transaction threshold (adjusted annually per 16 CFR 801.1(h))
const HSR_THRESHOLD = 119_500_000;

/**
 * Serialize Prisma Decimal fields to numbers for JSON response.
 * Prisma Decimal objects don't serialize cleanly via JSON.stringify;
 * this converts them to plain numbers for API consumers.
 */
function serializeDecimals<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_key, value) =>
    typeof value === "object" && value !== null && "toNumber" in value && typeof value.toNumber === "function"
      ? value.toNumber()
      : value
  )) as T;
}

const VALID_TRANSACTION_TYPES = new Set(Object.values(TransactionType));
const VALID_HSR_STATUSES = new Set(Object.values(HSRStatus));
const VALID_TAX_STRUCTURES = new Set(Object.values(TaxStructure));

// GET /api/ma/[projectId] - Get full M&A project with documents and presigned URLs

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.mAProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
      include: {
        maDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Generate presigned download URLs for all documents
    const documentsWithUrls = await Promise.all(
      project.maDocuments.map(async (doc) => {
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
      project: serializeDecimals({
        ...project,
        maDocuments: documentsWithUrls,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/ma/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/ma/[projectId] - Update M&A project (only CREATED or NEEDS_REVIEW)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.mAProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.status !== "CREATED" && project.status !== "NEEDS_REVIEW") {
      return NextResponse.json(
        {
          error: `Cannot update project in ${project.status} status. Only CREATED or NEEDS_REVIEW projects can be edited.`,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // --- String fields ---
    const stringFields = [
      "name",
      "buyerName",
      "buyerEntity",
      "buyerCounsel",
      "sellerName",
      "sellerEntity",
      "sellerCounsel",
      "targetCompany",
      "targetIndustry",
      "targetState",
      "governingLaw",
      "nonCompeteRadius",
      "macDefinition",
    ] as const;

    for (const field of stringFields) {
      if (field in body) {
        const val = body[field];
        if (val === null) {
          // name, buyerName, sellerName, targetCompany are required — don't allow null
          if (
            field === "name" ||
            field === "buyerName" ||
            field === "sellerName" ||
            field === "targetCompany"
          ) {
            return NextResponse.json(
              { error: `${field} cannot be null` },
              { status: 400 }
            );
          }
          updates[field] = null;
        } else if (typeof val === "string") {
          const trimmed = val.trim();
          if (
            (field === "name" ||
              field === "buyerName" ||
              field === "sellerName" ||
              field === "targetCompany") &&
            trimmed === ""
          ) {
            return NextResponse.json(
              { error: `${field} cannot be empty` },
              { status: 400 }
            );
          }
          updates[field] = trimmed;
        }
      }
    }

    // --- Enum: transactionType ---
    if ("transactionType" in body) {
      if (!VALID_TRANSACTION_TYPES.has(body.transactionType)) {
        return NextResponse.json(
          {
            error: `transactionType must be one of: ${[...VALID_TRANSACTION_TYPES].join(", ")}`,
          },
          { status: 400 }
        );
      }
      updates.transactionType = body.transactionType;
    }

    // --- Enum: hsrStatus ---
    if ("hsrStatus" in body) {
      if (body.hsrStatus !== null && !VALID_HSR_STATUSES.has(body.hsrStatus)) {
        return NextResponse.json(
          {
            error: `hsrStatus must be one of: ${[...VALID_HSR_STATUSES].join(", ")}`,
          },
          { status: 400 }
        );
      }
      updates.hsrStatus = body.hsrStatus;
    }

    // --- Enum: taxStructure ---
    if ("taxStructure" in body) {
      if (
        body.taxStructure !== null &&
        !VALID_TAX_STRUCTURES.has(body.taxStructure)
      ) {
        return NextResponse.json(
          {
            error: `taxStructure must be one of: ${[...VALID_TAX_STRUCTURES].join(", ")}`,
          },
          { status: 400 }
        );
      }
      updates.taxStructure = body.taxStructure;
    }

    // --- Decimal fields ---
    const decimalFields = [
      "purchasePrice",
      "cashComponent",
      "stockComponent",
      "sellerNote",
      "earnoutAmount",
      "targetRevenue",
      "targetEbitda",
      "workingCapitalTarget",
      "hsrFilingFee",
    ] as const;

    for (const field of decimalFields) {
      if (field in body) {
        if (body[field] === null) {
          updates[field] = null;
        } else {
          const n = Number(body[field]);
          if (!Number.isFinite(n) || n < 0) {
            return NextResponse.json(
              { error: `${field} must be a non-negative number` },
              { status: 400 }
            );
          }
          if (n > 1e15) {
            return NextResponse.json(
              { error: `${field} exceeds maximum allowed value` },
              { status: 400 }
            );
          }
          updates[field] = n;
        }
      }
    }

    // --- Int fields ---
    const intFields = [
      "earnoutTermMonths",
      "escrowTermMonths",
      "exclusivityDays",
      "dueDiligenceDays",
      "targetEmployees",
      "nonCompeteYears",
    ] as const;

    for (const field of intFields) {
      if (field in body) {
        if (body[field] === null) {
          updates[field] = null;
        } else {
          const n = Math.round(Number(body[field]));
          if (!Number.isFinite(n) || n < 0) {
            return NextResponse.json(
              { error: `${field} must be a non-negative integer` },
              { status: 400 }
            );
          }
          updates[field] = n;
        }
      }
    }

    // --- escrowPercent (0-1) --- normalize escrowPercentage → escrowPercent
    if ("escrowPercentage" in body && !("escrowPercent" in body)) {
      body.escrowPercent = body.escrowPercentage;
    }
    if ("escrowPercent" in body) {
      if (body.escrowPercent === null) {
        updates.escrowPercent = null;
      } else {
        const n = Number(body.escrowPercent);
        if (!Number.isFinite(n) || n < 0 || n > 1) {
          return NextResponse.json(
            { error: "escrowPercent must be between 0 and 1" },
            { status: 400 }
          );
        }
        updates.escrowPercent = n;
      }
    }

    // --- rwiPremiumPercent (0-100) ---
    if ("rwiPremiumPercent" in body) {
      if (body.rwiPremiumPercent === null) {
        updates.rwiPremiumPercent = null;
      } else {
        const n = Number(body.rwiPremiumPercent);
        if (!Number.isFinite(n) || n < 0 || n > 100) {
          return NextResponse.json(
            { error: "rwiPremiumPercent must be between 0 and 100" },
            { status: 400 }
          );
        }
        updates.rwiPremiumPercent = n;
      }
    }

    // --- Boolean fields ---
    const boolFields = [
      "hsrRequired",
      "section338Election",
      "rwiInsurance",
      "keyEmployeeRetention",
      "changeOfControlProvisions",
    ] as const;

    for (const field of boolFields) {
      if (field in body) {
        if (body[field] === null) {
          // hsrRequired allows null; the rest default to false
          updates[field] = field === "hsrRequired" ? null : false;
        } else {
          updates[field] = Boolean(body[field]);
        }
      }
    }

    // --- Date fields ---
    const dateFields = [
      "targetCloseDate",
      "outsideDate",
      "hsrFilingDate",
      "hsrClearanceDate",
    ] as const;

    for (const field of dateFields) {
      if (field in body) {
        if (body[field] === null) {
          updates[field] = null;
        } else {
          const d = new Date(body[field]);
          if (isNaN(d.getTime())) {
            return NextResponse.json(
              { error: `${field} must be a valid date` },
              { status: 400 }
            );
          }
          const year = d.getFullYear();
          if (year < 1970 || year > 2100) {
            return NextResponse.json(
              { error: `${field} year must be between 1970 and 2100` },
              { status: 400 }
            );
          }
          updates[field] = d;
        }
      }
    }

    // --- JSON fields ---
    if ("macCarveouts" in body) {
      updates.macCarveouts = body.macCarveouts;
    }
    if ("requiredApprovals" in body) {
      updates.requiredApprovals = body.requiredApprovals;
    }

    // --- HSR auto-detection on purchasePrice update ---
    // Explicit null checks: Number(null) returns 0 which would silently skip the threshold check
    const effectivePrice =
      updates.purchasePrice !== undefined
        ? (updates.purchasePrice as number | null)
        : (project.purchasePrice != null ? Number(project.purchasePrice) : null);

    if (effectivePrice != null && Number.isFinite(effectivePrice) && effectivePrice >= HSR_THRESHOLD) {
      // Only auto-set if not explicitly being set in this request
      if (!("hsrRequired" in body)) {
        updates.hsrRequired = true;
      }
    }

    // Track who updated
    updates.updatedBy = user.id;

    const updated = await prisma.mAProject.update({
      where: { id: projectId },
      data: updates,
      include: {
        maDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "ma",
      entityId: project.id,
      action: "ma.project_updated",
      metadata: { updatedFields: Object.keys(updates) },
    });

    return NextResponse.json({ project: serializeDecimals(updated) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/ma/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
