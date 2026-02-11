import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer } from "@/lib/s3";
import { logAudit } from "@/lib/audit";
import JSZip from "jszip";
import { BIO_DOC_TYPE_LABELS } from "@/bio/generate-all";

// GET /api/bio/programs/[programId]/download-all — Zip all generated IND docs

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { user, org } = await requireAuth();
    const { programId } = await params;

    const program = await prisma.bioProgram.findFirst({
      where: { id: programId, orgId: org.id },
      include: {
        bioGeneratedDocuments: {
          where: { s3Key: { not: "" } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    if (program.bioGeneratedDocuments.length === 0) {
      return NextResponse.json(
        { error: "No documents to download" },
        { status: 404 },
      );
    }

    const zip = new JSZip();

    // Build ordered label map for filenames
    const docTypeOrder = Object.keys(BIO_DOC_TYPE_LABELS);

    const fetches = program.bioGeneratedDocuments.map(async (doc, _idx) => {
      try {
        const buffer = await getS3Buffer(doc.s3Key);
        const label = BIO_DOC_TYPE_LABELS[doc.docType] ?? doc.docType;
        // Prefix with zero-padded index based on canonical ordering
        const orderIndex = docTypeOrder.indexOf(doc.docType);
        const prefix = String(
          (orderIndex >= 0 ? orderIndex : _idx) + 1,
        ).padStart(2, "0");
        const fileName = `${prefix}_${label.replace(/[^a-zA-Z0-9() ]/g, "").replace(/\s+/g, "_")}.docx`;
        zip.file(fileName, buffer);
      } catch (err) {
        console.error(`Failed to fetch bio doc ${doc.id}:`, err);
      }
    });

    await Promise.all(fetches);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const drugName = (program.drugName ?? "Unknown")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");

    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      programId,
      action: "bio.doc.package_downloaded",
      metadata: {
        drugName: program.drugName,
        docCount: program.bioGeneratedDocuments.length,
      },
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${drugName}_IND_Package.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bio/programs/[programId]/download-all error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
