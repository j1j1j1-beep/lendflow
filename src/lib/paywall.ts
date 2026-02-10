import { prisma } from "./db";

const TRIAL_DEAL_LIMIT = 3;

export type PaywallResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Check if an org can create a new deal.
 * Rules:
 * - No subscription record -> auto-create trial, allow
 * - Trial plan -> allow up to TRIAL_DEAL_LIMIT deals
 * - Active subscription -> allow
 * - Canceled/past_due -> block
 */
export async function checkPaywall(orgId: string): Promise<PaywallResult> {
  let sub = await prisma.subscription.findUnique({ where: { orgId } });

  // Auto-create trial subscription for new orgs
  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        orgId,
        stripeCustomerId: `trial_${orgId}`,
        plan: "trial",
        status: "trialing",
      },
    });
  }

  // Active subscription — always allowed
  if (sub.status === "active") {
    return { allowed: true };
  }

  // Trial — check deal count
  if (sub.plan === "trial" || sub.status === "trialing") {
    const dealCount = await prisma.deal.count({ where: { orgId } });
    if (dealCount >= TRIAL_DEAL_LIMIT) {
      return {
        allowed: false,
        reason: `Trial limit reached (${TRIAL_DEAL_LIMIT} deals). Please subscribe to continue.`,
      };
    }
    return { allowed: true };
  }

  // Canceled or past_due
  if (sub.status === "canceled" || sub.plan === "canceled") {
    return {
      allowed: false,
      reason: "Your subscription has been canceled. Please resubscribe to create new deals.",
    };
  }

  if (sub.status === "past_due" || sub.status === "unpaid") {
    return {
      allowed: false,
      reason: "Your subscription payment is past due. Please update your payment method.",
    };
  }

  // Default: allow (for edge cases)
  return { allowed: true };
}
