import { prisma } from "./db";

const TRIAL_PROGRAM_LIMIT = 1;

export type BioPaywallResult =
  | { allowed: true; subscription: any }
  | { allowed: false; reason: string; subscription: any };

/**
 * Check if an org can create a new bio program.
 * Rules:
 * - No BioSubscription record -> auto-create trial, allow
 * - Trial plan -> allow up to TRIAL_PROGRAM_LIMIT programs
 * - Active subscription -> allow
 * - Canceled/past_due -> block
 */
export async function checkBioPaywall(orgId: string): Promise<BioPaywallResult> {
  let sub = await prisma.bioSubscription.findUnique({ where: { orgId } });

  // Auto-create trial subscription for new orgs
  if (!sub) {
    sub = await prisma.bioSubscription.create({
      data: {
        orgId,
        stripeCustomerId: `bio_trial_${orgId}`,
        plan: "trial",
        status: "trialing",
        maxSeats: 25,
        currentSeats: 1,
      },
    });
  }

  // Active subscription — always allowed
  if (sub.status === "active") {
    return { allowed: true, subscription: sub };
  }

  // Trial — check program count
  if (sub.plan === "trial" || sub.status === "trialing") {
    const programCount = await prisma.bioProgram.count({ where: { orgId } });
    if (programCount >= TRIAL_PROGRAM_LIMIT) {
      return {
        allowed: false,
        reason: `Trial limit reached (${TRIAL_PROGRAM_LIMIT} program). Please subscribe to continue.`,
        subscription: sub,
      };
    }
    return { allowed: true, subscription: sub };
  }

  // Canceled
  if (sub.status === "canceled" || sub.plan === "canceled") {
    return {
      allowed: false,
      reason: "Your Bio subscription has been canceled. Please resubscribe to create new programs.",
      subscription: sub,
    };
  }

  // Past due / unpaid
  if (sub.status === "past_due" || sub.status === "unpaid") {
    return {
      allowed: false,
      reason: "Your Bio subscription payment is past due. Please update your payment method.",
      subscription: sub,
    };
  }

  // Default: allow (for edge cases)
  return { allowed: true, subscription: sub };
}
