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

// GET /api/contacts/lp-contacts/[id] — Get a single LP contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    const contact = await prisma.lPContact.findFirst({
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
    console.error("GET /api/contacts/lp-contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/contacts/lp-contacts/[id] — Update an LP contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    // Verify contact exists and belongs to this org
    const existing = await prisma.lPContact.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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

    // Validate investorType if provided
    if (body.investorType !== undefined && body.investorType !== null) {
      if (!VALID_INVESTOR_TYPES.has(body.investorType)) {
        return NextResponse.json(
          { error: `investorType must be one of: ${[...VALID_INVESTOR_TYPES].join(", ")}` },
          { status: 400 },
        );
      }
    }

    // Validate accreditationStatus if provided
    if (body.accreditationStatus !== undefined && body.accreditationStatus !== null) {
      if (!VALID_ACCREDITATION_STATUSES.has(body.accreditationStatus)) {
        return NextResponse.json(
          { error: `accreditationStatus must be one of: ${[...VALID_ACCREDITATION_STATUSES].join(", ")}` },
          { status: 400 },
        );
      }
    }

    // Validate email format if provided
    if (body.email !== undefined && body.email !== null && body.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    // Validate date fields
    for (const dateField of ["accreditationDate", "accreditationExpiry"] as const) {
      if (body[dateField] !== undefined && body[dateField] !== null) {
        const d = new Date(body[dateField]);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: `${dateField} must be a valid date` }, { status: 400 });
        }
      }
    }

    // Build update data — only include fields present in body
    const updateData: Record<string, unknown> = {};

    const stringFields = ["name", "email", "phone", "company", "address", "city", "state", "zip", "taxId", "notes"] as const;
    for (const field of stringFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] != null && typeof body[field] === "string" && body[field].trim() !== ""
          ? body[field].trim()
          : null;
      }
    }

    // name should never be null
    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.investorType !== undefined) {
      updateData.investorType = body.investorType || null;
    }

    if (body.accreditationStatus !== undefined) {
      updateData.accreditationStatus = body.accreditationStatus || "PENDING";
    }

    for (const dateField of ["accreditationDate", "accreditationExpiry"] as const) {
      if (body[dateField] !== undefined) {
        updateData[dateField] = body[dateField] ? new Date(body[dateField]) : null;
      }
    }

    const contact = await prisma.lPContact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/contacts/lp-contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/contacts/lp-contacts/[id] — Soft-delete an LP contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.lPContact.findFirst({
      where: { id, orgId: org.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.lPContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/contacts/lp-contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
