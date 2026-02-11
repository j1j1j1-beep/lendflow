import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadToS3 } from "@/lib/s3";

// GET /api/bio/programs/[programId]/documents — List documents
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const documents = await prisma.bioDocument.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
      include: {
        extractions: {
          select: { id: true, model: true, createdAt: true },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/bio/programs/[programId]/documents — Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/tiff",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Upload PDF, PNG, JPEG, TIFF, or DOCX" },
        { status: 400 },
      );
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 50MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `${org.id}/bio/${programId}/${Date.now()}-${file.name}`;

    await uploadToS3(s3Key, buffer, file.type);

    const document = await prisma.bioDocument.create({
      data: {
        programId,
        fileName: file.name,
        s3Key,
        fileSize: file.size,
        status: "PENDING",
      },
    });

    // Update program status if still in CREATED
    if (program.status === "CREATED") {
      await prisma.bioProgram.update({
        where: { id: programId },
        data: { status: "UPLOADING" },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bio/documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
