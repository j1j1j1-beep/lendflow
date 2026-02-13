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

// GET /api/contacts/investors/[id] - Get a single investor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    const investor = await prisma.investor.findFirst({
      where: {
        id,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    return NextResponse.json({
      investor: serializeInvestor(investor as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/investors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/investors/[id] - Update investor fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify investor exists and belongs to org
    const existing = await prisma.investor.findFirst({
      where: {
        id,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    // String fields
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
      }
      data.name = body.name.trim();
    }
    if (body.email !== undefined) {
      if (body.email && typeof body.email === "string" && body.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email.trim())) {
          return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        data.email = body.email.trim();
      } else {
        data.email = null;
      }
    }
    if (body.phone !== undefined) {
      data.phone = body.phone?.trim() || null;
    }
    if (body.company !== undefined) {
      data.company = body.company?.trim() || null;
    }
    if (body.accreditationMethod !== undefined) {
      data.accreditationMethod = body.accreditationMethod?.trim() || null;
    }
    if (body.address !== undefined) {
      data.address = body.address?.trim() || null;
    }
    if (body.city !== undefined) {
      data.city = body.city?.trim() || null;
    }
    if (body.state !== undefined) {
      data.state = body.state?.trim() || null;
    }
    if (body.zip !== undefined) {
      data.zip = body.zip?.trim() || null;
    }
    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() || null;
    }

    // Enum fields
    if (body.investorType !== undefined) {
      if (body.investorType !== null && !VALID_INVESTOR_TYPES.has(body.investorType)) {
        return NextResponse.json({ error: "Invalid investorType" }, { status: 400 });
      }
      data.investorType = body.investorType || null;
    }
    if (body.accreditationStatus !== undefined) {
      if (!VALID_ACCREDITATION_STATUSES.has(body.accreditationStatus)) {
        return NextResponse.json({ error: "Invalid accreditationStatus" }, { status: 400 });
      }
      data.accreditationStatus = body.accreditationStatus;
    }

    // Decimal fields
    if (body.preferredMinInvestment !== undefined) {
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
        data.preferredMinInvestment = val;
      } else {
        data.preferredMinInvestment = null;
      }
    }
    if (body.preferredMaxInvestment !== undefined) {
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
        data.preferredMaxInvestment = val;
      } else {
        data.preferredMaxInvestment = null;
      }
    }

    // Date fields
    if (body.accreditationDate !== undefined) {
      if (body.accreditationDate) {
        const d = new Date(body.accreditationDate);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "accreditationDate must be a valid date" }, { status: 400 });
        }
        data.accreditationDate = d;
      } else {
        data.accreditationDate = null;
      }
    }
    if (body.accreditationExpiry !== undefined) {
      if (body.accreditationExpiry) {
        const d = new Date(body.accreditationExpiry);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "accreditationExpiry must be a valid date" }, { status: 400 });
        }
        data.accreditationExpiry = d;
      } else {
        data.accreditationExpiry = null;
      }
    }

    // JSON fields
    if (body.preferredFundTypes !== undefined) {
      data.preferredFundTypes = body.preferredFundTypes;
    }

    const updated = await prisma.investor.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      investor: serializeInvestor(updated as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/contacts/investors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/investors/[id] - Soft-delete an investor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify investor exists and belongs to org
    const existing = await prisma.investor.findFirst({
      where: {
        id,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    await prisma.investor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/contacts/investors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
