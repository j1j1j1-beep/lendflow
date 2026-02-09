import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedDownloadUrl, deleteFromS3 } from "@/lib/s3";

// ---------------------------------------------------------------------------
// GET /api/deals/[dealId] - Get full deal with all related data
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { dealId } = await params;

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        orgId: org.id, // Security: ensure deal belongs to user's org
      },
      include: {
        documents: {
          orderBy: { createdAt: "asc" },
        },
        extractions: {
          include: { document: true },
          orderBy: { createdAt: "desc" },
        },
        analysis: true,
        creditMemo: true,
        verificationReport: true,
        reviewItems: {
          orderBy: { createdAt: "asc" },
        },
        dealTerms: true,
        conditions: {
          orderBy: { createdAt: "asc" },
        },
        generatedDocuments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Generate fresh presigned download URLs for all documents
    const documentsWithUrls = await Promise.all(
      deal.documents.map(async (doc) => {
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

    // Generate presigned URL for credit memo if it exists
    let memoDownloadUrl: string | null = null;
    if (deal.creditMemo?.s3Key) {
      try {
        memoDownloadUrl = await getPresignedDownloadUrl(deal.creditMemo.s3Key);
      } catch {
        memoDownloadUrl = null;
      }
    }

    // Generate presigned URLs for generated loan documents
    const generatedDocsWithUrls = await Promise.all(
      deal.generatedDocuments.map(async (doc) => {
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
      deal: {
        ...deal,
        documents: documentsWithUrls,
        creditMemo: deal.creditMemo
          ? { ...deal.creditMemo, downloadUrl: memoDownloadUrl }
          : null,
        generatedDocuments: generatedDocsWithUrls,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/deals/[dealId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/deals/[dealId] - Permanently delete a deal and all related data
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { dealId } = await params;

    // Verify deal exists and belongs to this org
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
      include: {
        documents: { select: { s3Key: true } },
        creditMemo: { select: { s3Key: true } },
        generatedDocuments: { select: { s3Key: true } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Collect all S3 keys to delete
    const s3Keys: string[] = [];
    for (const doc of deal.documents) {
      if (doc.s3Key) s3Keys.push(doc.s3Key);
    }
    if (deal.creditMemo?.s3Key) s3Keys.push(deal.creditMemo.s3Key);
    for (const genDoc of deal.generatedDocuments) {
      if (genDoc.s3Key) s3Keys.push(genDoc.s3Key);
    }

    // Delete S3 files (best-effort — don't block DB delete on S3 failures)
    await Promise.allSettled(s3Keys.map((key) => deleteFromS3(key)));

    // Delete deal (cascades to all related records)
    await prisma.deal.delete({ where: { id: dealId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/deals/[dealId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
