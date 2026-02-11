import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer, uploadToS3 } from "@/lib/s3";
import HTMLtoDOCX from "html-to-docx";
import { logAudit } from "@/lib/audit";

// GET /api/generated-documents/[docId]/content — Proxy DOCX from S3
// Avoids CORS issues when rendering DOCX in-browser with docx-preview.

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

// POST /api/generated-documents/[docId]/content — Save edited HTML as DOCX
// Converts HTML from the document viewer's contentEditable back to DOCX,
// uploads to S3, and increments the document version.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { user, org } = await requireAuth();
    const { docId } = await params;

    const body = await request.json();
    const { html } = body;

    if (!html || typeof html !== "string" || html.trim().length === 0) {
      return NextResponse.json(
        { error: "html is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const doc = await prisma.generatedDocument.findFirst({
      where: { id: docId, deal: { orgId: org.id } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Convert HTML to DOCX buffer
    const docxBuffer = (await HTMLtoDOCX(html)) as Buffer;

    // Upload to S3 using the same key
    await uploadToS3(
      doc.s3Key,
      docxBuffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // Increment version
    await prisma.generatedDocument.update({
      where: { id: docId },
      data: { version: { increment: 1 } },
    });

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      dealId: doc.dealId,
      action: "doc.saved",
      target: doc.docType,
      metadata: { docId, version: doc.version + 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/generated-documents/[docId]/content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
