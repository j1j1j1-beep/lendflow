import { prisma } from "./db";

const TRIAL_PROJECT_LIMIT = 1;

export type PaywallResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Count total projects across all 5 modules for an org.
 */
async function countAllProjects(orgId: string): Promise<number> {
  const [deals, capital, ma, syndication, compliance] = await Promise.all([
    prisma.deal.count({ where: { orgId } }),
    prisma.capitalProject.count({ where: { orgId } }),
    prisma.mAProject.count({ where: { orgId } }),
    prisma.syndicationProject.count({ where: { orgId } }),
    prisma.complianceProject.count({ where: { orgId } }),
  ]);
  return deals + capital + ma + syndication + compliance;
}

/**
 * Check if an org can create a new project.
 * Rules:
 * - No subscription record -> auto-create trial, allow
 * - Trial plan -> allow up to TRIAL_PROJECT_LIMIT projects (across all modules)
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

  // Trial — check project count across all modules
  if (sub.plan === "trial" || sub.status === "trialing") {
    const totalProjects = await countAllProjects(orgId);
    if (totalProjects >= TRIAL_PROJECT_LIMIT) {
      return {
        allowed: false,
        reason: "Sample deal used. Subscribe to create projects with your own data.",
      };
    }
    return { allowed: true };
  }

  // Canceled or past_due
  if (sub.status === "canceled" || sub.plan === "canceled") {
    return {
      allowed: false,
      reason: "Your subscription has been canceled. Please resubscribe to create new projects.",
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

/**
 * Check if an org can upload their own documents (not sample data).
 * Only active paid subscriptions can upload.
 */
export async function checkUploadAllowed(orgId: string): Promise<PaywallResult> {
  const sub = await prisma.subscription.findUnique({ where: { orgId } });

  if (!sub || sub.plan === "trial" || sub.status === "trialing") {
    return {
      allowed: false,
      reason: "Subscribe to upload your own documents. Sample deals are available on the free tier.",
    };
  }

  if (sub.status === "active") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Active subscription required to upload documents.",
  };
}

export { countAllProjects, TRIAL_PROJECT_LIMIT };
