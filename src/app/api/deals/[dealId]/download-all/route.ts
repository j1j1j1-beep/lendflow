import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getS3Buffer } from "@/lib/s3";
import JSZip from "jszip";

const DOC_TYPE_LABELS: Record<string, string> = {
  promissory_note: "Promissory Note",
  loan_agreement: "Loan Agreement",
  security_agreement: "Security Agreement",
  guaranty: "Guaranty Agreement",
  commitment_letter: "Commitment Letter",
  environmental_indemnity: "Environmental Indemnity",
  assignment_of_leases: "Assignment of Leases",
  subordination_agreement: "Subordination Agreement",
  intercreditor_agreement: "Intercreditor Agreement",
  corporate_resolution: "Corporate Resolution",
  ucc_financing_statement: "UCC Financing Statement",
  deed_of_trust: "Deed of Trust",
  closing_disclosure: "Closing Disclosure",
  loan_estimate: "Loan Estimate",
  sba_authorization: "SBA Authorization",
  cdc_debenture: "CDC Debenture",
  borrowing_base_agreement: "Borrowing Base Agreement",
  digital_asset_pledge: "Digital Asset Pledge",
  custody_agreement: "Custody Agreement",
  snda: "SNDA Agreement",
  estoppel_certificate: "Estoppel Certificate",
  settlement_statement: "Settlement Statement",
  borrowers_certificate: "Borrowers Certificate",
  compliance_certificate: "Compliance Certificate",
  amortization_schedule: "Amortization Schedule",
  opinion_letter: "Legal Opinion Letter",
};

// ---------------------------------------------------------------------------
// GET /api/deals/[dealId]/download-all — Zip all generated docs into one file
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { org } = await requireAuth();
    const { dealId } = await params;

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: org.id },
      include: {
        generatedDocuments: { orderBy: { createdAt: "asc" } },
        creditMemo: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.generatedDocuments.length === 0) {
      return NextResponse.json({ error: "No documents to download" }, { status: 404 });
    }

    const zip = new JSZip();
    const borrower = deal.borrowerName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

    // Add all generated documents
    const fetches = deal.generatedDocuments.map(async (doc) => {
      try {
        const buffer = await getS3Buffer(doc.s3Key);
        const label = DOC_TYPE_LABELS[doc.docType] ?? doc.docType;
        const fileName = `${label.replace(/\s+/g, "_")}.docx`;
        zip.file(fileName, buffer);
      } catch (err) {
        console.error(`Failed to fetch doc ${doc.id}:`, err);
      }
    });

    // Add credit memo if exists
    if (deal.creditMemo?.s3Key) {
      fetches.push(
        getS3Buffer(deal.creditMemo.s3Key)
          .then((buffer) => { zip.file("Credit_Memo.docx", buffer); })
          .catch((err) => { console.error("Failed to fetch credit memo:", err); })
      );
    }

    await Promise.all(fetches);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${borrower}_Loan_Package.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/deals/[dealId]/download-all error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
