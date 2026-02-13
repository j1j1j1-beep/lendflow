import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { stripe, STRIPE_BIO_PRICES } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/bio/billing/checkout — create a Stripe checkout session for bio

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }
    const { type } = body as { type: "license" | "monthly" };

    if (type !== "license" && type !== "monthly") {
      return NextResponse.json(
        { error: 'Invalid type. Must be "license" or "monthly".' },
        { status: 400 }
      );
    }

    // Check if org already has a bio Stripe customer
    const existingSub = await prisma.bioSubscription.findUnique({
      where: { orgId: org.id },
    });

    let customerId = existingSub?.stripeCustomerId;

    // Create a new Stripe customer if none exists or if the stored ID is a fake trial placeholder
    if (!customerId || !customerId.startsWith("cus_")) {
      const customer = await stripe.customers.create({
        metadata: { orgId: org.id, vertical: "bio" },
      });
      customerId = customer.id;

      // Upsert the bio subscription record so we track the customer ID
      await prisma.bioSubscription.upsert({
        where: { orgId: org.id },
        create: {
          orgId: org.id,
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Validate that the required Stripe price ID is configured
    const priceId = type === "license" ? STRIPE_BIO_PRICES.license : STRIPE_BIO_PRICES.monthly;
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "Valid price ID is required. Check Stripe Bio environment configuration." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const common = {
      customer: customerId,
      success_url: `${appUrl}/dashboard/settings?tab=bio&billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?tab=bio&billing=canceled`,
      metadata: { orgId: org.id, type: `bio_${type}` },
    };

    const session = type === "license"
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: "payment" as const,
          line_items: [{ price: priceId, quantity: 1 }],
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: "subscription" as const,
          line_items: [{ price: priceId, quantity: 1 }],
          subscription_data: { metadata: { orgId: org.id, vertical: "bio" } },
        });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      action: "billing.checkout_started",
      target: `bio_${type}`,
      metadata: { sessionId: session.id, vertical: "bio" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bio/billing/checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
