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

// GET /api/contacts/lp-contacts — List LP contacts for org
export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim();
    const cursor = searchParams.get("cursor");
    const take = Math.min(100, Math.max(1, Number(searchParams.get("take") || "50")));

    const where: Record<string, unknown> = {
      orgId: org.id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const contacts = await prisma.lPContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (contacts.length > take) {
      contacts.pop();
      nextCursor = contacts[contacts.length - 1].id;
    }

    return NextResponse.json({ contacts, nextCursor });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/lp-contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/contacts/lp-contacts — Create a new LP contact
export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // Validate required field
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Validate investorType if provided
    if (body.investorType != null && !VALID_INVESTOR_TYPES.has(body.investorType)) {
      return NextResponse.json(
        { error: `investorType must be one of: ${[...VALID_INVESTOR_TYPES].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate accreditationStatus if provided
    if (body.accreditationStatus != null && !VALID_ACCREDITATION_STATUSES.has(body.accreditationStatus)) {
      return NextResponse.json(
        { error: `accreditationStatus must be one of: ${[...VALID_ACCREDITATION_STATUSES].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate email format if provided
    if (body.email != null && typeof body.email === "string" && body.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    // Validate date fields if provided
    for (const dateField of ["accreditationDate", "accreditationExpiry"] as const) {
      if (body[dateField] != null) {
        const d = new Date(body[dateField]);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: `${dateField} must be a valid date` }, { status: 400 });
        }
      }
    }

    const contact = await prisma.lPContact.create({
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
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        zip: body.zip?.trim() || null,
        taxId: body.taxId?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/contacts/lp-contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
