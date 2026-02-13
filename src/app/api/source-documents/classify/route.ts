import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { classifyAndExtractSourceDoc } from "@/lib/source-doc-classifier";
import {
  getSourceDocsForModule,
  type ModuleName,
  type SourceDocDef,
} from "@/lib/source-doc-types";

// POST /api/source-documents/classify
// Body: { module, projectId }
// Classifies all unclassified source docs for a project, returns missing doc info.

export async function POST(request: NextRequest) {
  try {
    const { org } = await requireAuth();
    const body = await request.json();
    const { module, projectId } = body as {
      module: string;
      projectId: string;
    };

    if (!module || !projectId) {
      return NextResponse.json(
        { error: "module and projectId are required" },
        { status: 400 },
      );
    }

    const defs = getSourceDocsForModule(module);

    // Fetch all non-deleted source docs for this project
    const allDocs = await prisma.sourceDocument.findMany({
      where: { module, projectId, orgId: org.id, deletedAt: null },
    });

    // Classify any unclassified docs (docType is null and no ocrText yet)
    const unclassified = allDocs.filter((d) => d.docType === null);
    const classified: Array<{
      id: string;
      docType: string | null;
      confidence: number;
      fileName: string;
    }> = [];

    for (const doc of unclassified) {
      try {
        const result = await classifyAndExtractSourceDoc(
          doc.s3Key,
          module as ModuleName,
        );

        // Update the source document record with classification + extraction
        await prisma.sourceDocument.update({
          where: { id: doc.id },
          data: {
            docType: result.docType,
            ocrText: result.ocrText,
            textractOutput: JSON.parse(JSON.stringify({
              rawText: result.textractOutput.rawText.slice(0, 100000), // cap stored text
              keyValuePairs: result.textractOutput.keyValuePairs,
              tables: result.textractOutput.tables,
              pageCount: result.textractOutput.pageCount,
            })),
            classifiedAt: new Date(),
            classificationConfidence: result.confidence,
          },
        });

        classified.push({
          id: doc.id,
          docType: result.docType,
          confidence: result.confidence,
          fileName: doc.fileName,
        });
      } catch (error) {
        console.error(
          `[Classify] Failed to classify ${doc.fileName} (${doc.id}):`,
          error,
        );
        classified.push({
          id: doc.id,
          docType: null,
          confidence: 0,
          fileName: doc.fileName,
        });
      }
    }

    // Re-fetch to get updated docTypes after classification
    const updatedDocs = await prisma.sourceDocument.findMany({
      where: { module, projectId, orgId: org.id, deletedAt: null },
    });

    // Compare classified docs against definitions
    const presentDocTypes = new Set(
      updatedDocs.filter((d) => d.docType !== null).map((d) => d.docType!),
    );

    const missingRequired: SourceDocDef[] = defs.filter(
      (d) => d.required && !presentDocTypes.has(d.key),
    );
    const missingOptional: SourceDocDef[] = defs.filter(
      (d) => !d.required && !presentDocTypes.has(d.key),
    );
    const allPresent = missingRequired.length === 0;

    return NextResponse.json({
      classified,
      missingRequired,
      missingOptional,
      allPresent,
      totalUploaded: updatedDocs.length,
      totalClassified: updatedDocs.filter((d) => d.docType !== null).length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/source-documents/classify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
