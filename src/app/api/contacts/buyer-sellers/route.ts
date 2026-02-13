import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";
import { generalLimit, writeLimit } from "@/lib/rate-limit";

const VALID_ROLES = new Set(["buyer", "seller", "both"]);

// GET /api/contacts/buyer-sellers - List buyer-sellers for org
export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, generalLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));

    const where: Record<string, unknown> = {
      orgId: org.id,
      deletedAt: null,
    };

    if (role && VALID_ROLES.has(role)) {
      where.role = role;
    }

    if (search && search.trim() && search.trim().length <= 200) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { company: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { entityName: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const findArgs: Record<string, unknown> = {
      where,
      orderBy: { createdAt: "desc" as const },
      take: limit + 1, // fetch one extra to determine if there's a next page
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1; // skip the cursor item itself
    }

    const items = await prisma.buyerSeller.findMany(findArgs as Parameters<typeof prisma.buyerSeller.findMany>[0]);

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      contacts: items,
      nextCursor,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/buyer-sellers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/contacts/buyer-sellers - Create new buyer-seller
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

    // Validate role if provided
    const role = body.role ?? "buyer";
    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ error: "role must be buyer, seller, or both" }, { status: 400 });
    }

    // Sanitize optional string fields
    const optionalString = (val: unknown): string | null => {
      if (typeof val === "string" && val.trim()) return val.trim();
      return null;
    };

    const contact = await prisma.buyerSeller.create({
      data: {
        orgId: org.id,
        name: body.name.trim(),
        role,
        email: optionalString(body.email),
        phone: optionalString(body.phone),
        company: optionalString(body.company),
        entityName: optionalString(body.entityName),
        counsel: optionalString(body.counsel),
        industry: optionalString(body.industry),
        stateOfIncorp: optionalString(body.stateOfIncorp),
        address: optionalString(body.address),
        city: optionalString(body.city),
        state: optionalString(body.state),
        zip: optionalString(body.zip),
        notes: optionalString(body.notes),
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/contacts/buyer-sellers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
