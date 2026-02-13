import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { LOAN_PROGRAMS } from "@/config/loan-programs";
import { DOC_TYPE_LABELS } from "@/documents/types";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

// Valid DealStatus values for filtering
const VALID_STATUSES = new Set([
  "UPLOADED", "PROCESSING_OCR", "CLASSIFYING", "EXTRACTING",
  "VERIFYING", "RESOLVING", "ANALYZING", "STRUCTURING", "NEEDS_REVIEW",
  "NEEDS_TERM_REVIEW", "GENERATING_DOCS", "GENERATING_MEMO", "COMPLETE", "ERROR",
]);

// POST /api/deals - Create a new deal

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
    if (!body.borrowerName || typeof body.borrowerName !== "string" || body.borrowerName.trim() === "") {
      return NextResponse.json(
        { error: "borrowerName is required" },
        { status: 400 }
      );
    }

    // Validate loanProgramId against known programs
    if (body.loanProgramId && !LOAN_PROGRAMS[body.loanProgramId]) {
      return NextResponse.json(
        { error: "Invalid loan program" },
        { status: 400 }
      );
    }

    // Validate and coerce numeric fields
    const loanAmount = body.loanAmount != null ? Number(body.loanAmount) : null;
    const proposedRate = body.proposedRate != null ? Number(body.proposedRate) : null;
    const proposedTerm = body.proposedTerm != null ? Math.round(Number(body.proposedTerm)) : null;

    if (loanAmount !== null && (!Number.isFinite(loanAmount) || loanAmount <= 0)) {
      return NextResponse.json({ error: "loanAmount must be a positive number" }, { status: 400 });
    }
    if (loanAmount !== null && loanAmount > 1e15) {
      return NextResponse.json({ error: "loanAmount exceeds maximum allowed value" }, { status: 400 });
    }
    if (proposedRate !== null && (!Number.isFinite(proposedRate) || proposedRate < 0 || proposedRate > 100)) {
      return NextResponse.json({ error: "proposedRate must be between 0 and 100" }, { status: 400 });
    }
    // Convert percentage to decimal for storage
    const rateDecimal = proposedRate !== null ? proposedRate / 100 : null;
    if (proposedTerm !== null && (!Number.isFinite(proposedTerm) || proposedTerm <= 0)) {
      return NextResponse.json({ error: "proposedTerm must be a positive integer" }, { status: 400 });
    }

    // Validate selectedOutputDocs if provided
    const knownDocTypes = new Set(Object.keys(DOC_TYPE_LABELS));
    const validSelectedDocs = Array.isArray(body.selectedOutputDocs)
      ? body.selectedOutputDocs.filter((d: any) => typeof d === "string" && knownDocTypes.has(d))
      : [];

    if (Array.isArray(validSelectedDocs) && validSelectedDocs.length === 0 && body.selectedOutputDocs !== undefined) {
      return NextResponse.json({ error: "At least one output document must be selected" }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        borrowerName: body.borrowerName.trim(),
        loanAmount,
        loanPurpose: body.loanPurpose ?? null,
        loanType: body.loanType ?? null,
        loanProgramId: body.loanProgramId ?? null,
        proposedRate: rateDecimal,
        proposedTerm,
        propertyAddress: body.propertyAddress ?? null,
        selectedOutputDocs: validSelectedDocs,
        orgId: org.id,
        userId: user.id,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId: deal.id,
      action: "deal.created",
      metadata: { borrowerName: deal.borrowerName, loanProgramId: deal.loanProgramId },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/deals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/deals - List deals for the org

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const statusList = statusParam?.split(",").filter(s => VALID_STATUSES.has(s.trim())).map(s => s.trim()) ?? [];
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const searchQuery = searchParams.get("search");

    const where: Record<string, unknown> = { orgId: org.id };
    if (statusList.length === 1) {
      where.status = statusList[0];
    } else if (statusList.length > 1) {
      where.status = { in: statusList };
    }
    if (searchQuery && searchQuery.trim() && searchQuery.trim().length <= 200) {
      where.borrowerName = { contains: searchQuery.trim(), mode: "insensitive" };
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      deals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/deals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
