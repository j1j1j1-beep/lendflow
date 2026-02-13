import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";
import { generalLimit, writeLimit } from "@/lib/rate-limit";

// GET /api/contacts/borrowers - List borrowers for the org
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

    const borrowers = await prisma.borrower.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1, // Fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = borrowers.length > take;
    const items = hasMore ? borrowers.slice(0, take) : borrowers;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      borrowers: items,
      nextCursor,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/contacts/borrowers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/borrowers - Create a new borrower
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

    // Validate credit score if provided
    if (body.creditScore != null) {
      const score = Number(body.creditScore);
      if (!Number.isFinite(score) || score < 300 || score > 850) {
        return NextResponse.json(
          { error: "creditScore must be between 300 and 850" },
          { status: 400 }
        );
      }
    }

    const borrower = await prisma.borrower.create({
      data: {
        orgId: org.id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        zip: body.zip?.trim() || null,
        entityType: body.entityType || null,
        einOrSsn: body.einOrSsn?.trim() || null,
        creditScore: body.creditScore != null ? Math.round(Number(body.creditScore)) : null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({ borrower }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/contacts/borrowers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
