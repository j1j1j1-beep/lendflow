import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "customer.subscription.created": {
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "invoice.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// checkout.session.completed — license payment completed

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;
  if (!orgId) {
    console.error("checkout.session.completed: missing orgId in metadata");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!customerId) {
    console.error("checkout.session.completed: missing customer ID");
    return;
  }

  // Only handle license (one-time) payments here
  if (session.mode === "payment") {
    await prisma.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        stripeCustomerId: customerId,
        licensePaid: true,
        licensePaymentId: session.payment_intent as string | null,
        plan: "trial",
        status: "trialing",
      },
      update: {
        stripeCustomerId: customerId,
        licensePaid: true,
        licensePaymentId: session.payment_intent as string | null,
      },
    });
  }

  // For subscription mode, the customer.subscription.created event handles it
}

// customer.subscription.created — monthly subscription started

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.orgId;
  if (!orgId) {
    console.error(
      "customer.subscription.created: missing orgId in metadata"
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: "active",
      status: "active",
      currentPeriodStart: new Date(
        (subscription as unknown as { current_period_start: number }).current_period_start * 1000
      ),
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    },
    update: {
      stripeSubscriptionId: subscription.id,
      plan: "active",
      status: "active",
      currentPeriodStart: new Date(
        (subscription as unknown as { current_period_start: number }).current_period_start * 1000
      ),
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    },
  });

  void logAudit({
    orgId,
    action: "billing.subscription_created",
    metadata: { stripeSubscriptionId: subscription.id, stripeCustomerId: customerId },
  });
}

// customer.subscription.updated — status changes (past_due, etc.)

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!sub) {
    console.error(
      `customer.subscription.updated: no local subscription found for ${subscription.id}`
    );
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(
        (subscription as unknown as { current_period_start: number }).current_period_start * 1000
      ),
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    },
  });
}

// customer.subscription.deleted — canceled

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!sub) {
    console.error(
      `customer.subscription.deleted: no local subscription found for ${subscription.id}`
    );
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      plan: "canceled",
    },
  });
}

// invoice.payment_failed — set status to past_due

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceSub = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  const subscriptionId =
    typeof invoiceSub === "string" ? invoiceSub : invoiceSub?.id;

  if (!subscriptionId) {
    // One-time invoice failure, not subscription-related
    return;
  }

  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!sub) {
    console.error(
      `invoice.payment_failed: no local subscription found for ${subscriptionId}`
    );
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: "past_due",
    },
  });

  void logAudit({
    orgId: sub.orgId,
    action: "billing.payment_failed",
    metadata: { stripeSubscriptionId: subscriptionId, invoiceId: invoice.id },
  });
}
