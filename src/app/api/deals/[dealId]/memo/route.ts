import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer } from "@/lib/s3";

// GET /api/deals/[dealId]/memo - Download the credit memo DOCX

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { dealId } = await params;

    // Verify deal belongs to this org and has a credit memo
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
      include: { creditMemo: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (!deal.creditMemo?.s3Key) {
      return NextResponse.json(
        { error: "No credit memo available for this deal" },
        { status: 404 }
      );
    }

    // Stream the DOCX from S3
    const buffer = await getS3Buffer(deal.creditMemo.s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="credit-memo-${dealId}.docx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/deals/[dealId]/memo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
