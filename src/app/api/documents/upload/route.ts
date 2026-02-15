import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkUploadAllowed } from "@/lib/paywall";
import { uploadToS3 } from "@/lib/s3";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// POST /api/documents/upload - Upload a PDF via FormData (server-side S3)

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org } = await requireAuth();

    const uploadCheck = await checkUploadAllowed(org.id);
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 402 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId") as string | null;

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json({ error: "dealId is required" }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Verify deal belongs to org
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Generate a unique S3 key
    const uniqueId = crypto.randomUUID();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `${org.id}/${dealId}/${uniqueId}-${sanitizedFileName}`;

    // Read file into buffer and upload to S3 server-side
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await uploadToS3(s3Key, buffer, "application/pdf");

    // Create Document record
    const document = await prisma.document.create({
      data: {
        dealId,
        fileName: sanitizedFileName,
        s3Key,
        fileSize: file.size,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { documentId: document.id, s3Key },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
