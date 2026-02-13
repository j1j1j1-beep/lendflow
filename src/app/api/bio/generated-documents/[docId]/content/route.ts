import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer } from "@/lib/s3";

// GET /api/bio/generated-documents/[docId]/content — Stream DOCX from S3
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const { org } = await requireAuth();
    const { docId } = await params;

    const doc = await prisma.bioGeneratedDocument.findUnique({
      where: { id: docId },
      include: {
        program: { select: { orgId: true } },
      },
    });

    // #17: Null check for doc.program before accessing orgId
    if (!doc || !doc.program || doc.program.orgId !== org.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const buffer = await getS3Buffer(doc.s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${doc.docType}-v${doc.version}.docx"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/generated-documents/[id]/content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
