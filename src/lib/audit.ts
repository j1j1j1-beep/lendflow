import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

export type AuditAction =
  | "deal.created"
  | "deal.analyzed"
  | "deal.review_submitted"
  | "deal.terms_approved"
  | "deal.retried"
  | "deal.completed"
  | "deal.pipeline_started"
  | "deal.ocr_complete"
  | "deal.verification_complete"
  | "deal.docs_generated"
  | "deal.pipeline_error"
  | "deal.sample_created"
  | "deal.sample_pipeline_started"
  | "doc.edited"
  | "doc.saved"
  | "doc.regenerated"
  | "doc.batch_retry"
  | "doc.downloaded"
  | "doc.package_downloaded"
  | "member.invited"
  | "member.removed"
  | "billing.checkout_started"
  | "billing.subscription_created"
  | "billing.subscription_canceled"
  | "billing.payment_failed"
  | "settings.updated"
  | "bio.program_created"
  | "bio.pipeline_started"
  | "bio.ocr_complete"
  | "bio.classification_complete"
  | "bio.extraction_complete"
  | "bio.verification_complete"
  | "bio.analysis_complete"
  | "bio.review_complete"
  | "bio.docs_generated"
  | "bio.pipeline_complete"
  | "bio.pipeline_error"
  | "bio.doc.edited"
  | "bio.doc.saved"
  | "bio.doc.regenerated"
  | "bio.doc.downloaded"
  | "bio.doc.package_downloaded"
  | "bio.sample_created"
  | "bio.sample_pipeline_started"
  // Capital (Fund Formation)
  | "capital.project_created"
  | "capital.project_updated"
  | "capital.pipeline_started"
  | "capital.docs_generated"
  | "capital.compliance_review"
  | "capital.pipeline_complete"
  | "capital.pipeline_error"
  | "capital.doc.edited"
  | "capital.doc.saved"
  | "capital.doc.regenerated"
  | "capital.doc.downloaded"
  | "capital.doc.package_downloaded"
  | "capital.sample_created"
  // M&A Deals
  | "ma.project_created"
  | "ma.project_updated"
  | "ma.pipeline_started"
  | "ma.docs_generated"
  | "ma.compliance_review"
  | "ma.pipeline_complete"
  | "ma.pipeline_error"
  | "ma.doc.edited"
  | "ma.doc.saved"
  | "ma.doc.regenerated"
  | "ma.doc.downloaded"
  | "ma.doc.package_downloaded"
  | "ma.sample_created"
  // Syndication
  | "syndication.project_created"
  | "syndication.project_updated"
  | "syndication.pipeline_started"
  | "syndication.docs_generated"
  | "syndication.compliance_review"
  | "syndication.pipeline_complete"
  | "syndication.pipeline_error"
  | "syndication.doc.edited"
  | "syndication.doc.saved"
  | "syndication.doc.regenerated"
  | "syndication.doc.downloaded"
  | "syndication.doc.package_downloaded"
  | "syndication.sample_created"
  // Compliance (LP Reporting)
  | "compliance.project_created"
  | "compliance.project_updated"
  | "compliance.pipeline_started"
  | "compliance.docs_generated"
  | "compliance.compliance_review"
  | "compliance.pipeline_complete"
  | "compliance.pipeline_error"
  | "compliance.doc.edited"
  | "compliance.doc.saved"
  | "compliance.doc.regenerated"
  | "compliance.doc.downloaded"
  | "compliance.doc.package_downloaded"
  | "compliance.sample_created";

/**
 * Extract client IP address from request headers.
 * Checks x-forwarded-for (set by load balancers/proxies) first,
 * then x-real-ip, falling back to 'unknown'.
 */
export function extractIpAddress(request?: Request | null): string {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function logAudit(params: {
  orgId: string;
  userId?: string;
  userEmail?: string;
  dealId?: string;
  programId?: string; // Bio program ID
  entityType?: string; // "capital", "ma", "syndication", "compliance"
  entityId?: string; // The project ID
  action: AuditAction;
  target?: string;
  metadata?: Record<string, unknown>;
  request?: Request | null; // Optional request for IP extraction
}) {
  try {
    // Map programId to entityType/entityId for bio module audit logs
    const entityType = params.entityType ?? (params.programId ? "bio" : null);
    const entityId = params.entityId ?? params.programId ?? null;
    const ipAddress = extractIpAddress(params.request);

    // Merge IP into metadata
    const metadataWithIp: Record<string, unknown> = {
      ...(params.metadata ?? {}),
      ipAddress,
    };

    await prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        dealId: params.dealId ?? null,
        entityType,
        entityId,
        action: params.action,
        target: params.target ?? null,
        metadata: metadataWithIp as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("Audit log failed:", error);
  }
}
