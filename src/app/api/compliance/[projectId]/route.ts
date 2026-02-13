import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  ReportType,
  FundType,
} from "@/generated/prisma/client";

const VALID_REPORT_TYPES = new Set(Object.values(ReportType));
const VALID_FUND_TYPES = new Set(Object.values(FundType));

// Statuses that allow editing
const EDITABLE_STATUSES = new Set(["CREATED", "NEEDS_REVIEW"]);

/** Convert Decimal fields on a project to plain numbers for JSON */
function serializeProject(project: Record<string, unknown>) {
  const decimalFields = [
    "fundSize", "nav", "totalContributions", "totalDistributions",
    "callAmount", "distributionAmount", "unfundedCommitments",
    "withholdingAmount",
    "k1OrdinaryIncome", "k1NetRentalIncome", "k1GuaranteedPayments",
    "k1InterestIncome", "k1DividendIncome", "k1ShortTermCapGain",
    "k1LongTermCapGain", "k1Section1231Gain", "k1Section179Deduction",
    "k1OtherDeductions", "k1SelfEmploymentIncome", "k1ForeignTaxPaid",
    "k1AMTItems", "k1TaxExemptIncome", "k1Distributions",
    "k1EndingCapitalAccount", "k1UnrecapturedSec1250", "k1QBIDeduction", "k1UBTI",
  ];
  const serialized = { ...project };
  for (const field of decimalFields) {
    if (serialized[field] != null) {
      serialized[field] = Number(serialized[field]);
    }
  }
  return serialized;
}

// GET /api/compliance/[projectId] - Get full compliance project with documents and presigned URLs

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.complianceProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
      include: {
        complianceDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Generate presigned download URLs for all documents
    const documentsWithUrls = await Promise.all(
      project.complianceDocuments.map(async (doc) => {
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
        complianceDocuments: documentsWithUrls,
      } as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/compliance/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/compliance/[projectId] - Update compliance project (only CREATED or NEEDS_REVIEW)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const { projectId } = await params;

    const existing = await prisma.complianceProject.findFirst({
      where: {
        id: projectId,
        orgId: org.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!EDITABLE_STATUSES.has(existing.status)) {
      return NextResponse.json(
        {
          error: `Cannot update project in ${existing.status} status. Only CREATED or NEEDS_REVIEW projects can be edited.`,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    // --- Required string fields (cannot be null/empty) ---
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

    // --- Enum: reportType ---
    if ("reportType" in body) {
      if (!VALID_REPORT_TYPES.has(body.reportType)) {
        return NextResponse.json(
          { error: `reportType must be one of: ${[...VALID_REPORT_TYPES].join(", ")}` },
          { status: 400 }
        );
      }
      data.reportType = body.reportType;
    }

    // --- Enum: fundType ---
    if ("fundType" in body) {
      if (body.fundType !== null && !VALID_FUND_TYPES.has(body.fundType)) {
        return NextResponse.json(
          { error: `fundType must be one of: ${[...VALID_FUND_TYPES].join(", ")}` },
          { status: 400 }
        );
      }
      data.fundType = body.fundType;
    }

    // --- Optional string fields ---
    const optionalStringFields = [
      "reportingQuarter", "callPurpose", "distributionType",
      "callDefaultRemedy", "withholdingType",
      "ilpaTemplate", "valuationMethodology", "valuationProvider",
      "auditorName", "auditOpinion", "sideLetterId",
    ] as const;

    for (const field of optionalStringFields) {
      if (field in body) {
        if (body[field] === null) {
          data[field] = null;
        } else if (typeof body[field] === "string") {
          data[field] = body[field].trim();
        }
      }
    }

    // --- Decimal fields ---
    const decimalFields = [
      "fundSize", "nav", "totalContributions", "totalDistributions",
      "callAmount", "distributionAmount", "unfundedCommitments", "withholdingAmount",
      "k1OrdinaryIncome", "k1NetRentalIncome", "k1GuaranteedPayments",
      "k1InterestIncome", "k1DividendIncome", "k1ShortTermCapGain",
      "k1LongTermCapGain", "k1Section1231Gain", "k1Section179Deduction",
      "k1OtherDeductions", "k1SelfEmploymentIncome", "k1ForeignTaxPaid",
      "k1AMTItems", "k1TaxExemptIncome", "k1Distributions",
      "k1EndingCapitalAccount", "k1UnrecapturedSec1250", "k1QBIDeduction", "k1UBTI",
    ] as const;

    for (const field of decimalFields) {
      if (field in body) {
        if (body[field] === null) {
          data[field] = null;
        } else {
          const n = Number(body[field]);
          if (!Number.isFinite(n)) {
            return NextResponse.json(
              { error: `${field} must be a valid number` },
              { status: 400 }
            );
          }
          data[field] = n;
        }
      }
    }

    // --- Float fields ---
    const floatFields = [
      "netIrr", "grossIrr", "moic", "dpi", "rvpi", "tvpi",
      "callDefaultPenalty", "withholdingRate",
    ] as const;

    for (const field of floatFields) {
      if (field in body) {
        if (body[field] === null) {
          data[field] = null;
        } else {
          const n = Number(body[field]);
          if (!Number.isFinite(n)) {
            return NextResponse.json(
              { error: `${field} must be a valid number` },
              { status: 400 }
            );
          }
          data[field] = n;
        }
      }
    }

    // --- Int fields ---
    const intFields = [
      "vintageYear", "taxYear", "callNoticeRequiredDays",
    ] as const;

    for (const field of intFields) {
      if (field in body) {
        if (body[field] === null) {
          data[field] = null;
        } else {
          const n = Math.round(Number(body[field]));
          if (!Number.isFinite(n) || n < 0) {
            return NextResponse.json(
              { error: `${field} must be a non-negative integer` },
              { status: 400 }
            );
          }
          data[field] = n;
        }
      }
    }

    // --- Boolean fields ---
    if ("ilpaCompliant" in body) {
      data.ilpaCompliant = body.ilpaCompliant === true;
    }

    // --- Date fields ---
    const dateFields = [
      "periodStart", "periodEnd", "callDueDate", "filingDeadline",
      "valuationDate", "auditDate",
    ] as const;

    for (const field of dateFields) {
      if (field in body) {
        if (body[field] === null) {
          data[field] = null;
        } else {
          const d = new Date(body[field]);
          if (isNaN(d.getTime())) {
            return NextResponse.json(
              { error: `${field} must be a valid date` },
              { status: 400 }
            );
          }
          data[field] = d;
        }
      }
    }

    // --- JSON fields ---
    if ("portfolioSummary" in body) {
      data.portfolioSummary = body.portfolioSummary;
    }
    if ("sideLetterTerms" in body) {
      data.sideLetterTerms = body.sideLetterTerms;
    }

    // Track who updated
    data.updatedBy = user.id;

    const updated = await prisma.complianceProject.update({
      where: { id: projectId },
      data,
      include: {
        complianceDocuments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "compliance",
      entityId: projectId,
      action: "compliance.project_updated",
      metadata: { updatedFields: Object.keys(data).filter((k) => k !== "updatedBy") },
    });

    return NextResponse.json({
      project: serializeProject(updated as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/compliance/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
