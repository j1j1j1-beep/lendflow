import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/cancel — cancel subscription at period end

export async function POST() {
  try {
    const { user, org } = await requireAuth();

    const sub = await prisma.subscription.findUnique({
      where: { orgId: org.id },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (!sub.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    if (sub.status === "canceled") {
      return NextResponse.json(
        { error: "Subscription is already canceled" },
        { status: 400 }
      );
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.subscription.update({
      where: { orgId: org.id },
      data: { cancelAtPeriodEnd: true },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      action: "billing.subscription_canceled",
      metadata: { stripeSubscriptionId: sub.stripeSubscriptionId },
    });

    return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/billing/cancel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
