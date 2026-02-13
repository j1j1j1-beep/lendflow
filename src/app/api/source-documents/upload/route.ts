import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadToS3 } from "@/lib/s3";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import { getSourceDocsForModule } from "@/lib/source-doc-types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/tiff",
]);

// POST /api/source-documents/upload
// Accepts FormData: file, module, projectId, docType

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { org, user } = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const module = formData.get("module") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const docType = formData.get("docType") as string | null; // optional — classified later by Textract

    if (!module || !projectId) {
      return NextResponse.json(
        { error: "module and projectId are required" },
        { status: 400 },
      );
    }

    // Validate docType if provided
    if (docType) {
      const moduleDocs = getSourceDocsForModule(module);
      if (!moduleDocs.find((d) => d.key === docType)) {
        return NextResponse.json(
          { error: `Invalid docType "${docType}" for module "${module}"` },
          { status: 400 },
        );
      }
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Accepted file types: PDF, DOCX, XLSX, PNG, JPEG, WEBP, TIFF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Soft-delete any existing doc for this slot (replace behavior) — only when docType provided
    if (docType) {
      await prisma.sourceDocument.updateMany({
        where: {
          module,
          projectId,
          docType,
          orgId: org.id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    }

    // Upload to S3
    const ext = file.name.split(".").pop() ?? "pdf";
    const uniqueId = crypto.randomUUID();
    const s3Key = `source/${module}/${projectId}/${docType ?? "unclassified"}/${uniqueId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await uploadToS3(s3Key, buffer, file.type);

    // Create record
    const doc = await prisma.sourceDocument.create({
      data: {
        module,
        projectId,
        docType: docType ?? null,
        fileName: file.name,
        s3Key,
        contentType: file.type,
        fileSize: file.size,
        orgId: org.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/source-documents/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
