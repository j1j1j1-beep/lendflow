import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/checkout — create a Stripe checkout session

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth();

    const body = await request.json();
    const { type } = body as { type: "license" | "subscription" };

    if (type !== "license" && type !== "subscription") {
      return NextResponse.json(
        { error: 'Invalid type. Must be "license" or "subscription".' },
        { status: 400 }
      );
    }

    // Check if org already has a Stripe customer
    const existingSub = await prisma.subscription.findUnique({
      where: { orgId: org.id },
    });

    let customerId = existingSub?.stripeCustomerId;

    // Create a new Stripe customer if none exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId: org.id },
      });
      customerId = customer.id;

      // Upsert the subscription record so we track the customer ID
      await prisma.subscription.upsert({
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
    const priceId = type === "license" ? STRIPE_PRICES.license : STRIPE_PRICES.monthly;
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "Valid price ID is required. Check Stripe environment configuration." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const common = {
      customer: customerId,
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=canceled`,
      metadata: { orgId: org.id },
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
          subscription_data: { metadata: { orgId: org.id } },
        });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      action: "billing.checkout_started",
      target: type,
      metadata: { sessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
