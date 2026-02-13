import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

const VALID_ROLES = new Set(["buyer", "seller", "both"]);

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/contacts/buyer-sellers/[id] - Get single buyer-seller
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { org } = await requireAuth();
    const { id } = await params;

    const contact = await prisma.buyerSeller.findFirst({
      where: {
        id,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/buyer-sellers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/contacts/buyer-sellers/[id] - Update buyer-seller
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify contact exists and belongs to org
    const existing = await prisma.buyerSeller.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // If name is provided, validate it
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
    }

    // If role is provided, validate it
    if (body.role !== undefined && !VALID_ROLES.has(body.role)) {
      return NextResponse.json({ error: "role must be buyer, seller, or both" }, { status: 400 });
    }

    // Build update data from only the fields present in the body
    const allowedFields = [
      "name", "role", "email", "phone", "company", "entityName",
      "counsel", "industry", "stateOfIncorp", "address", "city",
      "state", "zip", "notes",
    ] as const;

    const data: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "name") {
          data[field] = (body[field] as string).trim();
        } else if (typeof body[field] === "string" && (body[field] as string).trim()) {
          data[field] = (body[field] as string).trim();
        } else {
          // Allow explicit null / empty string to clear a field
          data[field] = field === "role" ? body[field] : null;
        }
      }
    }

    const contact = await prisma.buyerSeller.update({
      where: { id },
      data,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/contacts/buyer-sellers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/contacts/buyer-sellers/[id] - Soft-delete buyer-seller
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify contact exists and belongs to org
    const existing = await prisma.buyerSeller.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.buyerSeller.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/contacts/buyer-sellers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
