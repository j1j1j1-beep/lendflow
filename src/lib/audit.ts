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
  | "bio.sample_pipeline_started";

export async function logAudit(params: {
  orgId: string;
  userId?: string;
  userEmail?: string;
  dealId?: string;
  programId?: string; // Bio program ID
  action: AuditAction;
  target?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        dealId: params.dealId ?? null,
        action: params.action,
        target: params.target ?? null,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("Audit log failed:", error);
  }
}
