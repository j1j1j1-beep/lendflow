import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl } from "@/lib/s3";

// ---------------------------------------------------------------------------
// GET /api/documents/[docId] - Get document status and info
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { docId } = await params;

    // Find document and verify it belongs to user's org through deal.orgId
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        deal: {
          orgId: org.id, // Security: org isolation via deal relationship
        },
      },
      include: {
        deal: {
          select: { id: true, borrowerName: true, status: true },
        },
      },
    });

    // Returns 404 for both "not found" and "wrong org" — intentional to prevent enumeration
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Generate fresh presigned download URL if document has an s3Key
    let downloadUrl: string | null = null;
    if (document.s3Key) {
      try {
        downloadUrl = await getPresignedDownloadUrl(document.s3Key);
      } catch (err) {
        console.error("S3 presign error for document", docId, err);
        downloadUrl = null;
      }
    }

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        docType: document.docType,
        docYear: document.docYear,
        status: document.status,
        fileSize: document.fileSize,
      },
      downloadUrl,
      viewUrl: downloadUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/documents/[docId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
