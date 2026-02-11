import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { checkBioPaywall } from "@/lib/bio-paywall";
import { inngest } from "@/inngest/client";
import { logAudit } from "@/lib/audit";
import { withRateLimit } from "@/lib/with-rate-limit";
import { writeLimit } from "@/lib/rate-limit";
import {
  SAMPLE_BIO_PROGRAM,
  SAMPLE_BIO_DOCUMENTS,
  SAMPLE_BIO_EXTRACTIONS,
} from "@/lib/bio-sample-data";
import { Prisma } from "@/generated/prisma/client";

// POST /api/bio/programs/sample — Create a pre-populated sample bio program
// Skips OCR/classification/extraction. Inserts pre-verified documents + extractions,
// then triggers the sample pipeline via Inngest (analyze + generate docs).

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, writeLimit);
  if (limited) return limited;

  try {
    const { user, org } = await requireAuth();

    // Paywall check
    const paywall = await checkBioPaywall(org.id);
    if (!paywall.allowed) {
      return NextResponse.json({ error: paywall.reason }, { status: 402 });
    }

    // Prevent duplicate sample programs
    const existingSample = await prisma.bioProgram.findFirst({
      where: {
        orgId: org.id,
        name: SAMPLE_BIO_PROGRAM.name,
      },
    });

    if (existingSample) {
      return NextResponse.json(
        {
          program: existingSample,
          message: "Sample program already exists.",
        },
        { status: 200 }
      );
    }

    // Create BioProgram
    const program = await prisma.bioProgram.create({
      data: {
        name: SAMPLE_BIO_PROGRAM.name,
        drugName: SAMPLE_BIO_PROGRAM.drugName,
        drugClass: SAMPLE_BIO_PROGRAM.drugClass,
        target: SAMPLE_BIO_PROGRAM.target,
        mechanism: SAMPLE_BIO_PROGRAM.mechanism,
        indication: SAMPLE_BIO_PROGRAM.indication,
        phase: SAMPLE_BIO_PROGRAM.phase,
        sponsorName: SAMPLE_BIO_PROGRAM.sponsorName,
        toolType: SAMPLE_BIO_PROGRAM.toolType,
        antibodyType: SAMPLE_BIO_PROGRAM.antibodyType,
        linkerType: SAMPLE_BIO_PROGRAM.linkerType,
        payloadType: SAMPLE_BIO_PROGRAM.payloadType,
        dar: SAMPLE_BIO_PROGRAM.dar,
        orgId: org.id,
        userId: user.id,
        status: "CREATED",
      },
    });

    // Create BioDocument + BioExtraction records
    for (const doc of SAMPLE_BIO_DOCUMENTS) {
      const s3Key = `${org.id}/bio/${program.id}/sample/${doc.fileName}`;

      const document = await prisma.bioDocument.create({
        data: {
          programId: program.id,
          fileName: doc.fileName,
          s3Key,
          fileSize: 0, // No actual file — placeholder
          docType: doc.docType,
          status: "EXTRACTED",
        },
      });

      // Find matching extraction data by docType
      const extraction = SAMPLE_BIO_EXTRACTIONS.find(
        (e) => e.docType === doc.docType
      );

      if (extraction) {
        await prisma.bioExtraction.create({
          data: {
            documentId: document.id,
            programId: program.id,
            model: "sample-data",
            promptVersion: "bio-sample-v1",
            structuredData: extraction.structuredData as Prisma.InputJsonValue,
            rawResponse: {} as Prisma.InputJsonValue,
            validationErrors: [] as Prisma.InputJsonValue,
            tokensUsed: 0,
            costUsd: 0,
          },
        });
      }
    }

    // Update program status to EXTRACTING (pipeline will advance it)
    await prisma.bioProgram.update({
      where: { id: program.id },
      data: { status: "EXTRACTING" },
    });

    // Fire Inngest event
    await inngest.send({
      name: "bio/sample-process",
      data: {
        programId: program.id,
        orgId: org.id,
        triggeredAt: Date.now(),
      },
    });

    // Audit log
    void logAudit({
      orgId: org.id,
      userId: user.id,
      userEmail: user.email,
      programId: program.id,
      action: "bio.sample_created",
      metadata: {
        programName: SAMPLE_BIO_PROGRAM.name,
        drugName: SAMPLE_BIO_PROGRAM.drugName,
        drugClass: SAMPLE_BIO_PROGRAM.drugClass,
      },
    });

    return NextResponse.json(
      {
        program,
        message: "Sample program created. Processing...",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bio/programs/sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
