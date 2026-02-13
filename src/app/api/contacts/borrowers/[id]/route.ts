import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";
import { generalLimit, writeLimit } from "@/lib/rate-limit";

// GET /api/contacts/borrowers/[id] - Get a single borrower
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    const borrower = await prisma.borrower.findFirst({
      where: {
        id,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    return NextResponse.json({ borrower });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/borrowers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/borrowers/[id] - Update borrower fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify borrower exists and belongs to this org
    const existing = await prisma.borrower.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
    }

    // Validate email format if provided
    if (body.email && typeof body.email === "string" && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    // Validate credit score if provided
    if (body.creditScore != null && body.creditScore !== "") {
      const score = Number(body.creditScore);
      if (!Number.isFinite(score) || score < 300 || score > 850) {
        return NextResponse.json(
          { error: "creditScore must be between 300 and 850" },
          { status: 400 }
        );
      }
    }

    // Build update data from allowed fields only
    const allowedFields = [
      "name", "email", "phone", "company", "address", "city",
      "state", "zip", "entityType", "einOrSsn", "creditScore", "notes",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "creditScore") {
          data[field] = body[field] != null && body[field] !== ""
            ? Math.round(Number(body[field]))
            : null;
        } else {
          data[field] = typeof body[field] === "string"
            ? body[field].trim() || null
            : body[field];
        }
      }
    }

    // Ensure name is never set to null
    if (data.name === null) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }

    const borrower = await prisma.borrower.update({
      where: { id },
      data,
    });

    return NextResponse.json({ borrower });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/contacts/borrowers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/borrowers/[id] - Soft-delete a borrower
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify borrower exists and belongs to this org
    const existing = await prisma.borrower.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    await prisma.borrower.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/contacts/borrowers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
