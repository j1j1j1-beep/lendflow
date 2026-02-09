import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// ---------------------------------------------------------------------------
// GET /api/billing/members — list all members of the authed org
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { org } = await requireAuth();

    const members = await prisma.user.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "asc" },
    });

    const sub = await prisma.subscription.findUnique({
      where: { orgId: org.id },
      select: { maxSeats: true },
    });

    return NextResponse.json({
      members,
      maxSeats: sub?.maxSeats ?? 25,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/billing/members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/billing/members — invite/add a new member
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Check seat limit
    const sub = await prisma.subscription.findUnique({
      where: { orgId: org.id },
      select: { maxSeats: true },
    });

    const maxSeats = sub?.maxSeats ?? 25;
    const currentCount = await prisma.user.count({ where: { orgId: org.id } });

    if (currentCount >= maxSeats) {
      return NextResponse.json(
        { error: "Seat limit reached" },
        { status: 400 }
      );
    }

    // Check if email already exists in the org
    const existing = await prisma.user.findFirst({
      where: { orgId: org.id, email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A member with this email already exists" },
        { status: 400 }
      );
    }

    // Create user record with invited_ prefix
    // In a real system this would send a Clerk invitation
    const member = await prisma.user.create({
      data: {
        clerkId: `invited_${crypto.randomUUID()}`,
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        orgId: org.id,
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/billing/members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/billing/members — remove a member from the org
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const { user, org } = await requireAuth();

    const body = await request.json();
    const { userId } = body as { userId?: string };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Cannot remove yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    // Verify the user belongs to this org
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, orgId: org.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Member not found in your organization" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/billing/members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
