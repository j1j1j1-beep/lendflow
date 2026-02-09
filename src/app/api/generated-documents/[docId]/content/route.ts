import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer } from "@/lib/s3";

// ---------------------------------------------------------------------------
// GET /api/generated-documents/[docId]/content — Proxy DOCX from S3
// Avoids CORS issues when rendering DOCX in-browser with docx-preview.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { docId } = await params;

    const doc = await prisma.generatedDocument.findFirst({
      where: { id: docId, deal: { orgId: org.id } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const buffer = await getS3Buffer(doc.s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/generated-documents/[docId]/content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
