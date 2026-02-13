import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import type { User, Organization } from "@/generated/prisma/client";

/**
 * Get authenticated user info from Clerk. Throws 401 if not authenticated.
 */
export async function requireAuth(): Promise<{
  clerkUserId: string;
  user: User;
  org: Organization;
}> {
  const { userId, orgId: activeOrgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  // Get or create the organization
  // For users without an active Clerk org, we use their Clerk user ID prefixed
  // with "user_" as a stable personal workspace identifier. Note: Clerk org IDs
  // start with "org_", so we use "user_" to distinguish personal workspaces.
  // This is stored in our own DB only -- not passed back to Clerk as an org ID.
  const clerkOrgId = activeOrgId || `user_${userId}`;
  const orgName =
    clerkUser.firstName
      ? `${clerkUser.firstName}'s Workspace`
      : "Personal Workspace";

  const org = await getOrCreateOrg(clerkOrgId, orgName);
  const user = await getOrCreateUser(userId, clerkUser, org.id);

  return { clerkUserId: userId, user, org };
}

/**
 * Get or create a Prisma User record from a Clerk user ID
 */
async function getOrCreateUser(
  clerkId: string,
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
  orgId: string
): Promise<User> {
  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email:
          clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
        name: [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ") || "User",
        orgId,
      },
    });
  }

  return user;
}

/**
 * Get or create a Prisma Organization record
 */
async function getOrCreateOrg(
  clerkOrgId: string,
  name: string
): Promise<Organization> {
  let org = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId, name },
    });
  }

  return org;
}
