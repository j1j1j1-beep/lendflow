import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";
import { generalLimit, writeLimit } from "@/lib/rate-limit";

const VALID_INVESTOR_TYPES = new Set([
  "ACCREDITED_INDIVIDUAL",
  "ACCREDITED_ENTITY",
  "QUALIFIED_PURCHASER",
  "INSTITUTIONAL",
  "NON_ACCREDITED",
]);

const VALID_ACCREDITATION_STATUSES = new Set([
  "PENDING",
  "VERIFIED",
  "EXPIRED",
  "FAILED",
]);

/** Convert Decimal fields to strings for safe JSON serialization */
function serializeInvestor(investor: Record<string, unknown>) {
  return {
    ...investor,
    preferredMinInvestment: investor.preferredMinInvestment
      ? String(investor.preferredMinInvestment)
      : null,
    preferredMaxInvestment: investor.preferredMaxInvestment
      ? String(investor.preferredMaxInvestment)
      : null,
  };
}

// GET /api/contacts/investors - List investors for the org
export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const take = Math.min(50, Math.max(1, Number(searchParams.get("take") || "25")));

    const where: Record<string, unknown> = {
      orgId: org.id,
      deletedAt: null,
    };

    if (search && search.trim() && search.trim().length <= 200) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { company: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const investors = await prisma.investor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = investors.length > take;
    const items = hasMore ? investors.slice(0, take) : investors;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      investors: items.map((inv) =>
        serializeInvestor(inv as unknown as Record<string, unknown>)
      ),
      nextCursor,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/investors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/investors - Create a new investor
export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Validate email format if provided
    if (body.email && typeof body.email === "string" && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    // Validate enum fields
    if (body.investorType !== undefined && body.investorType !== null) {
      if (!VALID_INVESTOR_TYPES.has(body.investorType)) {
        return NextResponse.json({ error: "Invalid investorType" }, { status: 400 });
      }
    }
    if (body.accreditationStatus !== undefined) {
      if (!VALID_ACCREDITATION_STATUSES.has(body.accreditationStatus)) {
        return NextResponse.json({ error: "Invalid accreditationStatus" }, { status: 400 });
      }
    }

    // Validate Decimal fields
    if (body.preferredMinInvestment != null) {
      const val = Number(body.preferredMinInvestment);
      if (!Number.isFinite(val) || val < 0) {
        return NextResponse.json(
          { error: "preferredMinInvestment must be a non-negative number" },
          { status: 400 }
        );
      }
      if (val > 1e15) {
        return NextResponse.json(
          { error: "preferredMinInvestment exceeds maximum allowed value" },
          { status: 400 }
        );
      }
    }
    if (body.preferredMaxInvestment != null) {
      const val = Number(body.preferredMaxInvestment);
      if (!Number.isFinite(val) || val < 0) {
        return NextResponse.json(
          { error: "preferredMaxInvestment must be a non-negative number" },
          { status: 400 }
        );
      }
      if (val > 1e15) {
        return NextResponse.json(
          { error: "preferredMaxInvestment exceeds maximum allowed value" },
          { status: 400 }
        );
      }
    }

    // Validate date fields
    if (body.accreditationDate) {
      const d = new Date(body.accreditationDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "accreditationDate must be a valid date" }, { status: 400 });
      }
    }
    if (body.accreditationExpiry) {
      const d = new Date(body.accreditationExpiry);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "accreditationExpiry must be a valid date" }, { status: 400 });
      }
    }

    const investor = await prisma.investor.create({
      data: {
        orgId: org.id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        investorType: body.investorType || null,
        accreditationStatus: body.accreditationStatus || "PENDING",
        accreditationDate: body.accreditationDate ? new Date(body.accreditationDate) : null,
        accreditationExpiry: body.accreditationExpiry ? new Date(body.accreditationExpiry) : null,
        accreditationMethod: body.accreditationMethod?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        zip: body.zip?.trim() || null,
        preferredMinInvestment: body.preferredMinInvestment != null
          ? Number(body.preferredMinInvestment)
          : null,
        preferredMaxInvestment: body.preferredMaxInvestment != null
          ? Number(body.preferredMaxInvestment)
          : null,
        preferredFundTypes: body.preferredFundTypes ?? null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(
      { investor: serializeInvestor(investor as unknown as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/contacts/investors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
