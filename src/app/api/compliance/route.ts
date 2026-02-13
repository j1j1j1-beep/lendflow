import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  ReportType,
  FundType,
} from "@/generated/prisma/client";

const VALID_REPORT_TYPES = new Set(Object.values(ReportType));
const VALID_FUND_TYPES = new Set(Object.values(FundType));

const VALID_STATUSES = new Set([
  "CREATED",
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
  "NEEDS_REVIEW",
  "COMPLETE",
  "ERROR",
]);

/**
 * Validate and coerce a value to a non-negative number, or return null.
 */
function parseDecimal(
  raw: unknown,
  fieldName: string
): { value: number | null; error?: string } {
  if (raw == null || raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return { value: null, error: `${fieldName} must be a valid number` };
  }
  return { value: n };
}

function parsePositiveInt(
  raw: unknown,
  fieldName: string
): { value: number | null; error?: string } {
  if (raw == null || raw === "") return { value: null };
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 0) {
    return {
      value: null,
      error: `${fieldName} must be a non-negative integer`,
    };
  }
  return { value: n };
}

// POST /api/compliance - Create a new ComplianceProject

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // --- Required field validation ---
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.reportType || !VALID_REPORT_TYPES.has(body.reportType)) {
      return NextResponse.json(
        { error: `reportType must be one of: ${[...VALID_REPORT_TYPES].join(", ")}` },
        { status: 400 }
      );
    }
    if (!body.fundName || typeof body.fundName !== "string" || body.fundName.trim() === "") {
      return NextResponse.json({ error: "fundName is required" }, { status: 400 });
    }

    // --- Optional enum validation ---
    if (body.fundType && !VALID_FUND_TYPES.has(body.fundType)) {
      return NextResponse.json(
        { error: `fundType must be one of: ${[...VALID_FUND_TYPES].join(", ")}` },
        { status: 400 }
      );
    }

    // --- Report-type-specific soft warnings (fields that should be provided) ---
    // These are not hard errors, but the data is expected for these report types
    if (body.reportType === "CAPITAL_CALL_NOTICE") {
      if (body.callAmount == null) {
        // Allow creation but callAmount is strongly recommended
      }
      if (body.callDueDate == null) {
        // Allow creation but callDueDate is strongly recommended
      }
    }
    if (body.reportType === "DISTRIBUTION_NOTICE") {
      if (body.distributionAmount == null) {
        // Allow creation but distributionAmount is strongly recommended
      }
    }
    if (body.reportType === "K1_SUMMARY") {
      if (body.taxYear == null) {
        // Allow creation but taxYear is strongly recommended
      }
    }

    // --- Numeric field validation ---
    const fundSize = parseDecimal(body.fundSize, "fundSize");
    if (fundSize.error) return NextResponse.json({ error: fundSize.error }, { status: 400 });

    const nav = parseDecimal(body.nav, "nav");
    if (nav.error) return NextResponse.json({ error: nav.error }, { status: 400 });

    const totalContributions = parseDecimal(body.totalContributions, "totalContributions");
    if (totalContributions.error) return NextResponse.json({ error: totalContributions.error }, { status: 400 });

    const totalDistributions = parseDecimal(body.totalDistributions, "totalDistributions");
    if (totalDistributions.error) return NextResponse.json({ error: totalDistributions.error }, { status: 400 });

    const callAmount = parseDecimal(body.callAmount, "callAmount");
    if (callAmount.error) return NextResponse.json({ error: callAmount.error }, { status: 400 });

    const distributionAmount = parseDecimal(body.distributionAmount, "distributionAmount");
    if (distributionAmount.error) return NextResponse.json({ error: distributionAmount.error }, { status: 400 });

    const unfundedCommitments = parseDecimal(body.unfundedCommitments, "unfundedCommitments");
    if (unfundedCommitments.error) return NextResponse.json({ error: unfundedCommitments.error }, { status: 400 });

    const withholdingAmount = parseDecimal(body.withholdingAmount, "withholdingAmount");
    if (withholdingAmount.error) return NextResponse.json({ error: withholdingAmount.error }, { status: 400 });

    // K-1 Decimal fields
    const k1Fields = [
      "k1OrdinaryIncome", "k1NetRentalIncome", "k1GuaranteedPayments",
      "k1InterestIncome", "k1DividendIncome", "k1ShortTermCapGain",
      "k1LongTermCapGain", "k1Section1231Gain", "k1Section179Deduction",
      "k1OtherDeductions", "k1SelfEmploymentIncome", "k1ForeignTaxPaid",
      "k1AMTItems", "k1TaxExemptIncome", "k1Distributions",
      "k1EndingCapitalAccount", "k1UnrecapturedSec1250", "k1QBIDeduction", "k1UBTI",
    ] as const;

    const k1Values: Record<string, number | null> = {};
    for (const field of k1Fields) {
      const parsed = parseDecimal(body[field], field);
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
      k1Values[field] = parsed.value;
    }

    // Float fields
    const netIrr = parseDecimal(body.netIrr, "netIrr");
    if (netIrr.error) return NextResponse.json({ error: netIrr.error }, { status: 400 });

    const grossIrr = parseDecimal(body.grossIrr, "grossIrr");
    if (grossIrr.error) return NextResponse.json({ error: grossIrr.error }, { status: 400 });

    const moic = parseDecimal(body.moic, "moic");
    if (moic.error) return NextResponse.json({ error: moic.error }, { status: 400 });

    const dpi = parseDecimal(body.dpi, "dpi");
    if (dpi.error) return NextResponse.json({ error: dpi.error }, { status: 400 });

    const rvpi = parseDecimal(body.rvpi, "rvpi");
    if (rvpi.error) return NextResponse.json({ error: rvpi.error }, { status: 400 });

    const tvpi = parseDecimal(body.tvpi, "tvpi");
    if (tvpi.error) return NextResponse.json({ error: tvpi.error }, { status: 400 });

    const callDefaultPenalty = parseDecimal(body.callDefaultPenalty, "callDefaultPenalty");
    if (callDefaultPenalty.error) return NextResponse.json({ error: callDefaultPenalty.error }, { status: 400 });

    const withholdingRate = parseDecimal(body.withholdingRate, "withholdingRate");
    if (withholdingRate.error) return NextResponse.json({ error: withholdingRate.error }, { status: 400 });

    // Int fields
    const vintageYear = parsePositiveInt(body.vintageYear, "vintageYear");
    if (vintageYear.error) return NextResponse.json({ error: vintageYear.error }, { status: 400 });

    const taxYear = parsePositiveInt(body.taxYear, "taxYear");
    if (taxYear.error) return NextResponse.json({ error: taxYear.error }, { status: 400 });

    const callNoticeRequiredDays = parsePositiveInt(body.callNoticeRequiredDays, "callNoticeRequiredDays");
    if (callNoticeRequiredDays.error) return NextResponse.json({ error: callNoticeRequiredDays.error }, { status: 400 });

    // --- Date field parsing ---
    const periodStart = body.periodStart ? new Date(body.periodStart) : null;
    if (periodStart && isNaN(periodStart.getTime())) {
      return NextResponse.json({ error: "periodStart must be a valid date" }, { status: 400 });
    }
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null;
    if (periodEnd && isNaN(periodEnd.getTime())) {
      return NextResponse.json({ error: "periodEnd must be a valid date" }, { status: 400 });
    }
    const callDueDate = body.callDueDate ? new Date(body.callDueDate) : null;
    if (callDueDate && isNaN(callDueDate.getTime())) {
      return NextResponse.json({ error: "callDueDate must be a valid date" }, { status: 400 });
    }
    const filingDeadline = body.filingDeadline ? new Date(body.filingDeadline) : null;
    if (filingDeadline && isNaN(filingDeadline.getTime())) {
      return NextResponse.json({ error: "filingDeadline must be a valid date" }, { status: 400 });
    }
    const valuationDate = body.valuationDate ? new Date(body.valuationDate) : null;
    if (valuationDate && isNaN(valuationDate.getTime())) {
      return NextResponse.json({ error: "valuationDate must be a valid date" }, { status: 400 });
    }
    const auditDate = body.auditDate ? new Date(body.auditDate) : null;
    if (auditDate && isNaN(auditDate.getTime())) {
      return NextResponse.json({ error: "auditDate must be a valid date" }, { status: 400 });
    }

    const project = await prisma.complianceProject.create({
      data: {
        name: body.name.trim(),
        reportType: body.reportType,
        fundName: body.fundName.trim(),
        fundType: body.fundType ?? null,
        vintageYear: vintageYear.value,
        fundSize: fundSize.value,
        periodStart,
        periodEnd,
        reportingQuarter: body.reportingQuarter?.trim() ?? null,
        nav: nav.value,
        totalContributions: totalContributions.value,
        totalDistributions: totalDistributions.value,
        netIrr: netIrr.value,
        grossIrr: grossIrr.value,
        moic: moic.value,
        dpi: dpi.value,
        rvpi: rvpi.value,
        tvpi: tvpi.value,
        callAmount: callAmount.value,
        callDueDate,
        callPurpose: body.callPurpose?.trim() ?? null,
        distributionAmount: distributionAmount.value,
        distributionType: body.distributionType?.trim() ?? null,
        taxYear: taxYear.value,
        filingDeadline,
        portfolioSummary: body.portfolioSummary ?? null,
        // K-1 fields
        ...k1Values,
        // Capital Call Extended
        callDefaultPenalty: callDefaultPenalty.value,
        callDefaultRemedy: body.callDefaultRemedy?.trim() ?? null,
        callNoticeRequiredDays: callNoticeRequiredDays.value,
        unfundedCommitments: unfundedCommitments.value,
        // Distribution Extended
        withholdingRate: withholdingRate.value,
        withholdingAmount: withholdingAmount.value,
        withholdingType: body.withholdingType?.trim() ?? null,
        // ILPA
        ilpaCompliant: body.ilpaCompliant === true,
        ilpaTemplate: body.ilpaTemplate?.trim() ?? null,
        // Valuation
        valuationMethodology: body.valuationMethodology?.trim() ?? null,
        valuationDate,
        valuationProvider: body.valuationProvider?.trim() ?? null,
        auditorName: body.auditorName?.trim() ?? null,
        auditDate,
        auditOpinion: body.auditOpinion?.trim() ?? null,
        // Side letter
        sideLetterId: body.sideLetterId?.trim() ?? null,
        sideLetterTerms: body.sideLetterTerms ?? null,
        // Organization
        orgId: org.id,
        userId: user.id,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      entityType: "compliance",
      entityId: project.id,
      action: "compliance.project_created",
      metadata: {
        name: project.name,
        reportType: project.reportType,
        fundName: project.fundName,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/compliance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/compliance - List compliance projects for the org

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    let statusFilter: string | string[] | null = null;
    if (statusParam) {
      const statuses = statusParam.split(",").filter(s => VALID_STATUSES.has(s.trim()));
      if (statuses.length === 1) statusFilter = statuses[0];
      else if (statuses.length > 1) statusFilter = statuses;
    }
    const reportTypeParam = searchParams.get("reportType");
    const reportType =
      reportTypeParam && VALID_REPORT_TYPES.has(reportTypeParam as ReportType)
        ? reportTypeParam
        : null;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || "20"))
    );
    const skip = (page - 1) * limit;
    const searchQuery = searchParams.get("search");

    const where: Record<string, unknown> = {
      orgId: org.id,
      deletedAt: null,
    };
    if (statusFilter) {
      where.status = Array.isArray(statusFilter) ? { in: statusFilter } : statusFilter;
    }
    if (reportType) {
      where.reportType = reportType;
    }
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: "insensitive" } },
        { fundName: { contains: searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.complianceProject.findMany({
        where,
        include: {
          _count: {
            select: { complianceDocuments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.complianceProject.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/compliance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
