import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

// Valid enum values for PATCH validation
const VALID_FUND_TYPES = new Set([
  "PRIVATE_EQUITY", "VENTURE_CAPITAL", "REAL_ESTATE",
  "HEDGE_FUND", "CREDIT", "INFRASTRUCTURE",
]);

const VALID_EXEMPTION_TYPES = new Set([
  "REG_D_506B", "REG_D_506C", "REG_A_TIER1", "REG_A_TIER2", "REG_CF",
]);

const VALID_ICA_EXEMPTIONS = new Set(["SECTION_3C1", "SECTION_3C7"]);

// Statuses that allow editing
const EDITABLE_STATUSES = new Set(["CREATED", "NEEDS_REVIEW"]);

/** Convert Decimal fields on a project to plain numbers for JSON */
function serializeProject(project: Record<string, unknown>) {
  return {
    ...project,
    targetRaise: project.targetRaise ? Number(project.targetRaise) : null,
    minInvestment: project.minInvestment ? Number(project.minInvestment) : null,
    gpCommitment: project.gpCommitment ? Number(project.gpCommitment) : null,
  };
}

// GET /api/capital/[projectId] - Get a single project with all relations

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.capitalProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
      include: {
        capitalDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
        capitalInvestors: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate presigned download URLs for all documents with an s3Key
    const documentsWithUrls = await Promise.all(
      project.capitalDocuments.map(async (doc) => {
        let downloadUrl: string | null = null;
        if (doc.s3Key) {
          try {
            downloadUrl = await getPresignedDownloadUrl(doc.s3Key);
          } catch {
            downloadUrl = null;
          }
        }
        return { ...doc, downloadUrl };
      })
    );

    return NextResponse.json({
      project: serializeProject({
        ...project,
        capitalDocuments: documentsWithUrls,
      } as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/capital/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/capital/[projectId] - Update project fields

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    // Verify project exists and belongs to org
    const existing = await prisma.capitalProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only allow edits when status is CREATED or NEEDS_REVIEW
    if (!EDITABLE_STATUSES.has(existing.status)) {
      return NextResponse.json(
        { error: `Cannot update project in ${existing.status} status` },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update data from allowed fields
    const data: Record<string, unknown> = {};

    // String fields
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
      }
      data.name = body.name.trim();
    }
    if (body.fundName !== undefined) {
      if (typeof body.fundName !== "string" || body.fundName.trim() === "") {
        return NextResponse.json({ error: "fundName must be a non-empty string" }, { status: 400 });
      }
      data.fundName = body.fundName.trim();
    }
    if (body.gpEntityName !== undefined) {
      if (typeof body.gpEntityName !== "string" || body.gpEntityName.trim() === "") {
        return NextResponse.json({ error: "gpEntityName must be a non-empty string" }, { status: 400 });
      }
      data.gpEntityName = body.gpEntityName.trim();
    }
    if (body.gpStateOfFormation !== undefined) {
      data.gpStateOfFormation = body.gpStateOfFormation;
    }
    if (body.investmentStrategy !== undefined) {
      data.investmentStrategy = body.investmentStrategy;
    }
    if (body.geographicFocus !== undefined) {
      data.geographicFocus = body.geographicFocus;
    }

    // Enum fields
    if (body.fundType !== undefined) {
      if (!VALID_FUND_TYPES.has(body.fundType)) {
        return NextResponse.json({ error: "Invalid fundType" }, { status: 400 });
      }
      data.fundType = body.fundType;
    }
    if (body.exemptionType !== undefined) {
      if (!VALID_EXEMPTION_TYPES.has(body.exemptionType)) {
        return NextResponse.json({ error: "Invalid exemptionType" }, { status: 400 });
      }
      data.exemptionType = body.exemptionType;
    }
    if (body.icaExemption !== undefined) {
      if (!VALID_ICA_EXEMPTIONS.has(body.icaExemption)) {
        return NextResponse.json({ error: "Invalid icaExemption" }, { status: 400 });
      }
      data.icaExemption = body.icaExemption;
    }

    // Decimal fields
    if (body.targetRaise !== undefined) {
      const val = body.targetRaise != null ? Number(body.targetRaise) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "targetRaise must be a positive number" }, { status: 400 });
      }
      data.targetRaise = val;
    }
    if (body.minInvestment !== undefined) {
      const val = body.minInvestment != null ? Number(body.minInvestment) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "minInvestment must be a positive number" }, { status: 400 });
      }
      data.minInvestment = val;
    }
    if (body.gpCommitment !== undefined) {
      const val = body.gpCommitment != null ? Number(body.gpCommitment) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "gpCommitment must be a positive number" }, { status: 400 });
      }
      data.gpCommitment = val;
    }

    // Float fields (0-1 range)
    if (body.managementFee !== undefined) {
      const val = body.managementFee != null ? Number(body.managementFee) : null;
      if (val !== null && (!Number.isFinite(val) || val < 0 || val > 1)) {
        return NextResponse.json({ error: "managementFee must be between 0 and 1" }, { status: 400 });
      }
      data.managementFee = val;
    }
    if (body.carriedInterest !== undefined) {
      const val = body.carriedInterest != null ? Number(body.carriedInterest) : null;
      if (val !== null && (!Number.isFinite(val) || val < 0 || val > 1)) {
        return NextResponse.json({ error: "carriedInterest must be between 0 and 1" }, { status: 400 });
      }
      data.carriedInterest = val;
    }
    if (body.preferredReturn !== undefined) {
      const val = body.preferredReturn != null ? Number(body.preferredReturn) : null;
      if (val !== null && (!Number.isFinite(val) || val < 0 || val > 1)) {
        return NextResponse.json({ error: "preferredReturn must be between 0 and 1" }, { status: 400 });
      }
      data.preferredReturn = val;
    }

    // Integer fields
    if (body.fundTermYears !== undefined) {
      const val = body.fundTermYears != null ? Math.round(Number(body.fundTermYears)) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "fundTermYears must be a positive integer" }, { status: 400 });
      }
      data.fundTermYears = val;
    }
    if (body.investmentPeriod !== undefined) {
      const val = body.investmentPeriod != null ? Math.round(Number(body.investmentPeriod)) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "investmentPeriod must be a positive integer" }, { status: 400 });
      }
      data.investmentPeriod = val;
    }
    if (body.maxInvestors !== undefined) {
      const val = body.maxInvestors != null ? Math.round(Number(body.maxInvestors)) : null;
      if (val !== null && (!Number.isFinite(val) || val <= 0)) {
        return NextResponse.json({ error: "maxInvestors must be a positive integer" }, { status: 400 });
      }
      data.maxInvestors = val;
    }
    if (body.nonAccreditedLimit !== undefined) {
      const val = body.nonAccreditedLimit != null ? Math.round(Number(body.nonAccreditedLimit)) : null;
      if (val !== null && (!Number.isFinite(val) || val < 0)) {
        return NextResponse.json({ error: "nonAccreditedLimit must be a non-negative integer" }, { status: 400 });
      }
      data.nonAccreditedLimit = val;
    }

    // Boolean fields
    if (body.accreditedOnly !== undefined) {
      data.accreditedOnly = body.accreditedOnly === true;
    }
    if (body.riskFactorsIncluded !== undefined) {
      data.riskFactorsIncluded = body.riskFactorsIncluded === true;
    }
    if (body.useOfProceedsDisclosed !== undefined) {
      data.useOfProceedsDisclosed = body.useOfProceedsDisclosed === true;
    }
    if (body.keyPersonProvision !== undefined) {
      data.keyPersonProvision = body.keyPersonProvision === true;
    }
    if (body.clawbackProvision !== undefined) {
      data.clawbackProvision = body.clawbackProvision === true;
    }

    // JSON fields
    if (body.hurdles !== undefined) {
      data.hurdles = body.hurdles;
    }
    if (body.targetIndustries !== undefined) {
      data.targetIndustries = body.targetIndustries;
    }
    if (body.stateFilings !== undefined) {
      data.stateFilings = body.stateFilings;
    }
    if (body.keyPersonNames !== undefined) {
      data.keyPersonNames = body.keyPersonNames;
    }

    // Date fields
    if (body.formDFilingDate !== undefined) {
      data.formDFilingDate = body.formDFilingDate ? new Date(body.formDFilingDate) : null;
    }
    if (body.formDAmendmentDate !== undefined) {
      data.formDAmendmentDate = body.formDAmendmentDate ? new Date(body.formDAmendmentDate) : null;
    }

    // Track who updated
    data.updatedBy = user.id;

    const updated = await prisma.capitalProject.update({
      where: { id: projectId },
      data,
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "capital",
      entityId: projectId,
      action: "capital.project_created",
      metadata: { updatedFields: Object.keys(data).filter((k) => k !== "updatedBy") },
    });

    return NextResponse.json({
      project: serializeProject(updated as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/capital/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
