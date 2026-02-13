import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  TransactionType,
  HSRStatus,
  TaxStructure,
} from "@/generated/prisma/client";

// 2026 HSR size-of-transaction threshold
const HSR_THRESHOLD = 133_900_000;

const VALID_TRANSACTION_TYPES = new Set(Object.values(TransactionType));
const VALID_HSR_STATUSES = new Set(Object.values(HSRStatus));
const VALID_TAX_STRUCTURES = new Set(Object.values(TaxStructure));

const VALID_STATUSES = new Set([
  "CREATED",
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
  "NEEDS_REVIEW",
  "COMPLETE",
  "ERROR",
]);

/**
 * Validate and coerce a value to a positive number, or return null.
 * Returns { value, error } where error is a string if invalid.
 */
function parsePositiveDecimal(
  raw: unknown,
  fieldName: string
): { value: number | null; error?: string } {
  if (raw == null || raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { value: null, error: `${fieldName} must be a non-negative number` };
  }
  return { value: n };
}

function parsePositiveInt(
  raw: unknown,
  fieldName: string
): { value: number | null; error?: string } {
  if (raw == null || raw === "") return { value: null };
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 0) {
    return {
      value: null,
      error: `${fieldName} must be a non-negative integer`,
    };
  }
  return { value: n };
}

// POST /api/ma - Create a new M&A project

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // --- Required field validation ---
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.transactionType || !VALID_TRANSACTION_TYPES.has(body.transactionType)) {
      return NextResponse.json(
        { error: `transactionType must be one of: ${[...VALID_TRANSACTION_TYPES].join(", ")}` },
        { status: 400 }
      );
    }
    if (!body.buyerName || typeof body.buyerName !== "string" || body.buyerName.trim() === "") {
      return NextResponse.json({ error: "buyerName is required" }, { status: 400 });
    }
    if (!body.sellerName || typeof body.sellerName !== "string" || body.sellerName.trim() === "") {
      return NextResponse.json({ error: "sellerName is required" }, { status: 400 });
    }
    if (!body.targetCompany || typeof body.targetCompany !== "string" || body.targetCompany.trim() === "") {
      return NextResponse.json({ error: "targetCompany is required" }, { status: 400 });
    }

    // --- Numeric field validation ---
    const purchasePrice = parsePositiveDecimal(body.purchasePrice, "purchasePrice");
    if (purchasePrice.error) return NextResponse.json({ error: purchasePrice.error }, { status: 400 });

    const cashComponent = parsePositiveDecimal(body.cashComponent, "cashComponent");
    if (cashComponent.error) return NextResponse.json({ error: cashComponent.error }, { status: 400 });

    const stockComponent = parsePositiveDecimal(body.stockComponent, "stockComponent");
    if (stockComponent.error) return NextResponse.json({ error: stockComponent.error }, { status: 400 });

    const sellerNote = parsePositiveDecimal(body.sellerNote, "sellerNote");
    if (sellerNote.error) return NextResponse.json({ error: sellerNote.error }, { status: 400 });

    const earnoutAmount = parsePositiveDecimal(body.earnoutAmount, "earnoutAmount");
    if (earnoutAmount.error) return NextResponse.json({ error: earnoutAmount.error }, { status: 400 });

    const targetRevenue = parsePositiveDecimal(body.targetRevenue, "targetRevenue");
    if (targetRevenue.error) return NextResponse.json({ error: targetRevenue.error }, { status: 400 });

    const targetEbitda = parsePositiveDecimal(body.targetEbitda, "targetEbitda");
    if (targetEbitda.error) return NextResponse.json({ error: targetEbitda.error }, { status: 400 });

    const workingCapitalTarget = parsePositiveDecimal(body.workingCapitalTarget, "workingCapitalTarget");
    if (workingCapitalTarget.error) return NextResponse.json({ error: workingCapitalTarget.error }, { status: 400 });

    const hsrFilingFee = parsePositiveDecimal(body.hsrFilingFee, "hsrFilingFee");
    if (hsrFilingFee.error) return NextResponse.json({ error: hsrFilingFee.error }, { status: 400 });

    // escrowPercent must be 0-1
    let escrowPercent: number | null = null;
    if (body.escrowPercent != null && body.escrowPercent !== "") {
      escrowPercent = Number(body.escrowPercent);
      if (!Number.isFinite(escrowPercent) || escrowPercent < 0 || escrowPercent > 1) {
        return NextResponse.json({ error: "escrowPercent must be between 0 and 1" }, { status: 400 });
      }
    }

    // rwiPremiumPercent (0-100)
    let rwiPremiumPercent: number | null = null;
    if (body.rwiPremiumPercent != null && body.rwiPremiumPercent !== "") {
      rwiPremiumPercent = Number(body.rwiPremiumPercent);
      if (!Number.isFinite(rwiPremiumPercent) || rwiPremiumPercent < 0 || rwiPremiumPercent > 100) {
        return NextResponse.json({ error: "rwiPremiumPercent must be between 0 and 100" }, { status: 400 });
      }
    }

    const earnoutTermMonths = parsePositiveInt(body.earnoutTermMonths, "earnoutTermMonths");
    if (earnoutTermMonths.error) return NextResponse.json({ error: earnoutTermMonths.error }, { status: 400 });

    const escrowTermMonths = parsePositiveInt(body.escrowTermMonths, "escrowTermMonths");
    if (escrowTermMonths.error) return NextResponse.json({ error: escrowTermMonths.error }, { status: 400 });

    const exclusivityDays = parsePositiveInt(body.exclusivityDays, "exclusivityDays");
    if (exclusivityDays.error) return NextResponse.json({ error: exclusivityDays.error }, { status: 400 });

    const dueDiligenceDays = parsePositiveInt(body.dueDiligenceDays, "dueDiligenceDays");
    if (dueDiligenceDays.error) return NextResponse.json({ error: dueDiligenceDays.error }, { status: 400 });

    const targetEmployees = parsePositiveInt(body.targetEmployees, "targetEmployees");
    if (targetEmployees.error) return NextResponse.json({ error: targetEmployees.error }, { status: 400 });

    const nonCompeteYears = parsePositiveInt(body.nonCompeteYears, "nonCompeteYears");
    if (nonCompeteYears.error) return NextResponse.json({ error: nonCompeteYears.error }, { status: 400 });

    // --- Enum field validation ---
    if (body.hsrStatus && !VALID_HSR_STATUSES.has(body.hsrStatus)) {
      return NextResponse.json(
        { error: `hsrStatus must be one of: ${[...VALID_HSR_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }
    if (body.taxStructure && !VALID_TAX_STRUCTURES.has(body.taxStructure)) {
      return NextResponse.json(
        { error: `taxStructure must be one of: ${[...VALID_TAX_STRUCTURES].join(", ")}` },
        { status: 400 }
      );
    }

    // --- Date field parsing ---
    const targetCloseDate = body.targetCloseDate ? new Date(body.targetCloseDate) : null;
    if (targetCloseDate && isNaN(targetCloseDate.getTime())) {
      return NextResponse.json({ error: "targetCloseDate must be a valid date" }, { status: 400 });
    }
    const outsideDate = body.outsideDate ? new Date(body.outsideDate) : null;
    if (outsideDate && isNaN(outsideDate.getTime())) {
      return NextResponse.json({ error: "outsideDate must be a valid date" }, { status: 400 });
    }
    const hsrFilingDate = body.hsrFilingDate ? new Date(body.hsrFilingDate) : null;
    if (hsrFilingDate && isNaN(hsrFilingDate.getTime())) {
      return NextResponse.json({ error: "hsrFilingDate must be a valid date" }, { status: 400 });
    }
    const hsrClearanceDate = body.hsrClearanceDate ? new Date(body.hsrClearanceDate) : null;
    if (hsrClearanceDate && isNaN(hsrClearanceDate.getTime())) {
      return NextResponse.json({ error: "hsrClearanceDate must be a valid date" }, { status: 400 });
    }

    // --- HSR auto-detection ---
    let hsrRequired = body.hsrRequired ?? null;
    if (purchasePrice.value != null && purchasePrice.value >= HSR_THRESHOLD) {
      hsrRequired = true;
    }

    const project = await prisma.mAProject.create({
      data: {
        name: body.name.trim(),
        transactionType: body.transactionType,
        buyerName: body.buyerName.trim(),
        buyerEntity: body.buyerEntity?.trim() ?? null,
        buyerCounsel: body.buyerCounsel?.trim() ?? null,
        sellerName: body.sellerName.trim(),
        sellerEntity: body.sellerEntity?.trim() ?? null,
        sellerCounsel: body.sellerCounsel?.trim() ?? null,
        targetCompany: body.targetCompany.trim(),
        targetIndustry: body.targetIndustry?.trim() ?? null,
        targetRevenue: targetRevenue.value,
        targetEbitda: targetEbitda.value,
        targetEmployees: targetEmployees.value,
        targetState: body.targetState?.trim() ?? null,
        purchasePrice: purchasePrice.value,
        cashComponent: cashComponent.value,
        stockComponent: stockComponent.value,
        sellerNote: sellerNote.value,
        earnoutAmount: earnoutAmount.value,
        earnoutTermMonths: earnoutTermMonths.value,
        workingCapitalTarget: workingCapitalTarget.value,
        escrowPercent,
        escrowTermMonths: escrowTermMonths.value,
        exclusivityDays: exclusivityDays.value,
        dueDiligenceDays: dueDiligenceDays.value,
        targetCloseDate,
        outsideDate,
        governingLaw: body.governingLaw?.trim() ?? "Delaware",
        nonCompeteYears: nonCompeteYears.value,
        nonCompeteRadius: body.nonCompeteRadius?.trim() ?? null,
        hsrRequired,
        hsrFilingDate,
        hsrFilingFee: hsrFilingFee.value,
        hsrClearanceDate,
        hsrStatus: body.hsrStatus ?? null,
        taxStructure: body.taxStructure ?? null,
        section338Election: body.section338Election ?? false,
        rwiInsurance: body.rwiInsurance ?? false,
        rwiPremiumPercent,
        macDefinition: body.macDefinition?.trim() ?? null,
        macCarveouts: body.macCarveouts ?? null,
        requiredApprovals: body.requiredApprovals ?? null,
        keyEmployeeRetention: body.keyEmployeeRetention ?? false,
        changeOfControlProvisions: body.changeOfControlProvisions ?? false,
        orgId: org.id,
        userId: user.id,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "ma",
      entityId: project.id,
      action: "ma.project_created",
      metadata: {
        name: project.name,
        transactionType: project.transactionType,
        targetCompany: project.targetCompany,
        purchasePrice: purchasePrice.value,
        hsrRequired,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/ma error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/ma - List M&A projects for the org

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
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || "20"))
    );
    const skip = (page - 1) * limit;
    const searchQuery = searchParams.get("search");

    const where: Record<string, unknown> = {
      orgId: org.id,
      deletedAt: null,
    };
    if (statusFilter) {
      where.status = Array.isArray(statusFilter) ? { in: statusFilter } : statusFilter;
    }
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: "insensitive" } },
        {
          targetCompany: {
            contains: searchQuery.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.mAProject.findMany({
        where,
        include: {
          _count: {
            select: { maDocuments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.mAProject.count({ where }),
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
    console.error("GET /api/ma error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
