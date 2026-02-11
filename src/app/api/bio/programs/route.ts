import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";

// GET /api/bio/programs — List bio programs for org
export async function GET(request: NextRequest) {
  try {
    const { org } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const where: any = { orgId: org.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { drugName: { contains: search, mode: "insensitive" } },
        { target: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      if (status === "processing") {
        where.status = {
          in: [
            "EXTRACTING",
            "CLASSIFYING",
            "ANALYZING",
            "GENERATING_DOCS",
          ],
        };
      } else {
        where.status = status;
      }
    }

    const programs = await prisma.bioProgram.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bioDocuments: true, bioGeneratedDocuments: true } },
      },
    });

    return NextResponse.json(programs);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/programs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/bio/programs — Create new bio program
export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth();
    const body = await request.json();

    const {
      name,
      drugName,
      drugClass,
      target,
      mechanism,
      indication,
      phase,
      sponsorName,
      toolType,
      // ADC-specific
      antibodyType,
      linkerType,
      payloadType,
      dar,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Program name is required" },
        { status: 400 },
      );
    }

    if (!drugName || typeof drugName !== "string") {
      return NextResponse.json(
        { error: "Drug name is required" },
        { status: 400 },
      );
    }

    if (!sponsorName || typeof sponsorName !== "string") {
      return NextResponse.json(
        { error: "Sponsor name is required" },
        { status: 400 },
      );
    }

    const validToolTypes = ["DATA_ANALYSIS", "REGULATORY_DOCS", "COMPLIANCE_AUDIT"];
    const validPhases = ["PRECLINICAL", "IND_FILING", "PHASE_1", "PHASE_1B", "PHASE_2", "PHASE_2B", "PHASE_3", "NDA_BLA", "APPROVED", "POST_MARKET"];

    const program = await prisma.bioProgram.create({
      data: {
        name,
        drugName,
        drugClass: drugClass || null,
        target: target || null,
        mechanism: mechanism || null,
        indication: indication || null,
        phase: phase && validPhases.includes(phase) ? phase : null,
        sponsorName: sponsorName || null,
        toolType: validToolTypes.includes(toolType) ? toolType : "REGULATORY_DOCS",
        antibodyType: antibodyType || null,
        linkerType: linkerType || null,
        payloadType: payloadType || null,
        dar: dar ? (isNaN(parseFloat(dar)) ? null : parseFloat(dar)) : null,
        orgId: org.id,
        userId: user.id,
      },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      action: "bio.program_created",
      target: program.id,
      metadata: { programName: name, drugName, drugClass },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bio/programs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
