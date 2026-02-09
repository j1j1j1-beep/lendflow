import {
  TextractClient,
  AnalyzeDocumentCommand,
  StartLendingAnalysisCommand,
  GetLendingAnalysisCommand,
  GetLendingAnalysisSummaryCommand,
  type Block,
  type AnalyzeDocumentCommandOutput,
  type GetLendingAnalysisResponse,
} from "@aws-sdk/client-textract";
import { getS3Buffer } from "./s3";

const textract = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ---------------------------------------------------------------------------
// Existing types (unchanged — downstream verification code depends on these)
// ---------------------------------------------------------------------------

export interface TextractKeyValuePair {
  key: string;
  value: string;
  confidence: number;
  page: number;
}

export interface TextractTable {
  page: number;
  rows: string[][];
}

export interface TextractResult {
  rawText: string;
  keyValuePairs: TextractKeyValuePair[];
  tables: TextractTable[];
  blocks: Block[];
  pageCount: number;
}

// ---------------------------------------------------------------------------
// Lending API types
// ---------------------------------------------------------------------------

export interface LendingAnalysisResult {
  jobId: string;
  pageCount: number;
  pages: LendingPage[];
  warnings: Array<{ errorCode: string; pages: number[] }>;
  modelVersion: string;
}

export interface LendingPage {
  page: number;
  pageType: string; // "1040", "W-2", "BANK_STATEMENT", etc.
  pageTypeConfidence: number;
  lendingFields: LendingFieldResult[];
  rawText: string;
  keyValuePairs: TextractKeyValuePair[];
  tables: TextractTable[];
}

export interface LendingFieldResult {
  type: string; // standardized field name
  value: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Existing synchronous AnalyzeDocument functions (unchanged)
// ---------------------------------------------------------------------------

/**
 * Run Textract AnalyzeDocument on a PDF stored in S3.
 * Uses FORMS + TABLES feature types for maximum extraction.
 * For documents > 1 page, we process page by page since
 * synchronous AnalyzeDocument only handles single-page images.
 * For multi-page PDFs, we pass the raw bytes directly.
 */
export async function analyzeDocument(s3Key: string): Promise<TextractResult> {
  const pdfBuffer = await getS3Buffer(s3Key);

  const response: AnalyzeDocumentCommandOutput = await textract.send(
    new AnalyzeDocumentCommand({
      Document: {
        Bytes: pdfBuffer,
      },
      FeatureTypes: ["FORMS", "TABLES"],
    })
  );

  return parseTextractResponse(response);
}

/**
 * Analyze a document from a buffer directly (no S3 needed)
 */
export async function analyzeDocumentFromBuffer(
  buffer: Buffer
): Promise<TextractResult> {
  const response = await textract.send(
    new AnalyzeDocumentCommand({
      Document: { Bytes: buffer },
      FeatureTypes: ["FORMS", "TABLES"],
    })
  );

  return parseTextractResponse(response);
}

/**
 * Parse the raw Textract response into structured data
 */
function parseTextractResponse(
  response: AnalyzeDocumentCommandOutput
): TextractResult {
  const blocks = response.Blocks || [];

  // Build block lookup map
  const blockMap = new Map<string, Block>();
  for (const block of blocks) {
    if (block.Id) blockMap.set(block.Id, block);
  }

  // Extract raw text from LINE blocks
  const lines: string[] = [];
  let maxPage = 1;
  for (const block of blocks) {
    if (block.BlockType === "LINE" && block.Text) {
      lines.push(block.Text);
    }
    if (block.Page && block.Page > maxPage) {
      maxPage = block.Page;
    }
  }

  // Extract key-value pairs from FORMS
  const keyValuePairs = extractKeyValuePairs(blocks, blockMap);

  // Extract tables
  const tables = extractTables(blocks, blockMap);

  return {
    rawText: lines.join("\n"),
    keyValuePairs,
    tables,
    blocks,
    pageCount: maxPage,
  };
}

// ---------------------------------------------------------------------------
// Lending API functions
// ---------------------------------------------------------------------------

/**
 * Start a Textract Lending analysis job on a document in S3.
 * Documents MUST be in S3 for Lending API (no Bytes support).
 */
export async function startLendingAnalysis(s3Key: string): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET!;
  const response = await textract.send(
    new StartLendingAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucket,
          Name: s3Key,
        },
      },
    })
  );
  if (!response.JobId) throw new Error("StartLendingAnalysis returned no JobId");
  return response.JobId;
}

/**
 * Get lending analysis results, handling pagination.
 */
export async function getLendingResults(jobId: string): Promise<GetLendingAnalysisResponse> {
  const allResults: NonNullable<GetLendingAnalysisResponse["Results"]> = [];
  let nextToken: string | undefined;
  let lastResponse: GetLendingAnalysisResponse | undefined;

  let pageCount = 0;
  const maxPages = 200; // Safety limit to prevent infinite pagination

  do {
    const response = await textract.send(
      new GetLendingAnalysisCommand({
        JobId: jobId,
        ...(nextToken ? { NextToken: nextToken } : {}),
      })
    );
    lastResponse = response;
    if (response.Results) {
      allResults.push(...response.Results);
    }
    nextToken = response.NextToken;
    pageCount++;
    if (pageCount >= maxPages) {
      console.warn(`getLendingResults: hit pagination safety limit (${maxPages}) for job ${jobId}`);
      break;
    }
  } while (nextToken);

  return { ...lastResponse!, Results: allResults };
}

/**
 * Poll for lending analysis completion. Starts job then polls until done.
 * Uses exponential backoff: 2s -> 3s -> 5s -> 5s...
 */
export async function pollLendingAnalysis(
  s3Key: string,
  maxWaitMs: number = 120_000
): Promise<LendingAnalysisResult> {
  const jobId = await startLendingAnalysis(s3Key);

  const startTime = Date.now();
  let pollInterval = 2000; // start at 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    // Check status with minimal results
    const response = await textract.send(
      new GetLendingAnalysisCommand({ JobId: jobId, MaxResults: 1 })
    );

    if (response.JobStatus === "SUCCEEDED") {
      // Get all results
      const fullResponse = await getLendingResults(jobId);
      return parseLendingResponse(jobId, fullResponse);
    }

    if (response.JobStatus === "FAILED") {
      throw new Error(
        `Lending analysis failed: ${response.StatusMessage ?? "Unknown error"}`
      );
    }

    if (response.JobStatus === "PARTIAL_SUCCESS") {
      // Some pages succeeded, some failed — return what we have
      const fullResponse = await getLendingResults(jobId);
      return parseLendingResponse(jobId, fullResponse);
    }

    // Back off: 2s -> 3s -> 4.5s -> 5s (capped)
    pollInterval = Math.min(pollInterval * 1.5, 5000);
  }

  throw new Error(
    `Lending analysis timed out after ${maxWaitMs}ms for job ${jobId}`
  );
}

/**
 * Get a high-level summary of the lending analysis (document types, page counts).
 * Useful for quick classification without fetching full extraction results.
 */
export async function getLendingAnalysisSummary(jobId: string) {
  const response = await textract.send(
    new GetLendingAnalysisSummaryCommand({ JobId: jobId })
  );
  return response;
}

// ---------------------------------------------------------------------------
// Lending response parser
// ---------------------------------------------------------------------------

function parseLendingResponse(
  jobId: string,
  response: GetLendingAnalysisResponse
): LendingAnalysisResult {
  const pages: LendingPage[] = [];

  for (const result of response.Results ?? []) {
    const page = result.Page ?? 1;

    // Page classification
    const pageType =
      result.PageClassification?.PageType?.[0]?.Value ?? "UNKNOWN";
    const pageTypeConfidence =
      (result.PageClassification?.PageType?.[0]?.Confidence ?? 0) / 100;

    // Extract lending fields
    const lendingFields: LendingFieldResult[] = [];
    for (const extraction of result.Extractions ?? []) {
      if (extraction.LendingDocument?.LendingFields) {
        for (const field of extraction.LendingDocument.LendingFields) {
          const value = field.ValueDetections?.[0]?.Text ?? "";
          const confidence =
            (field.ValueDetections?.[0]?.Confidence ?? 0) / 100;
          if (field.Type && value) {
            lendingFields.push({
              type: field.Type,
              value,
              confidence,
            });
          }
        }
      }
    }

    // Collect all blocks from ExpenseDocument extractions
    // (bank statements may come through as ExpenseDocuments)
    const allBlocks: Block[] = [];
    for (const extraction of result.Extractions ?? []) {
      if (extraction.ExpenseDocument?.Blocks) {
        allBlocks.push(...(extraction.ExpenseDocument.Blocks as Block[]));
      }
    }

    // Build block lookup map for KV pair / table extraction
    const blockMap = new Map<string, Block>();
    for (const block of allBlocks) {
      if (block.Id) blockMap.set(block.Id, block);
    }

    const rawText = allBlocks
      .filter((b) => b.BlockType === "LINE" && b.Text)
      .map((b) => b.Text)
      .join("\n");

    const keyValuePairs =
      allBlocks.length > 0 ? extractKeyValuePairs(allBlocks, blockMap) : [];
    const tables =
      allBlocks.length > 0 ? extractTables(allBlocks, blockMap) : [];

    pages.push({
      page,
      pageType,
      pageTypeConfidence,
      lendingFields,
      rawText,
      keyValuePairs,
      tables,
    });
  }

  return {
    jobId,
    pageCount: response.DocumentMetadata?.Pages ?? pages.length,
    warnings: (response.Warnings ?? []).map((w) => ({
      errorCode: w.ErrorCode ?? "",
      pages: w.Pages ?? [],
    })),
    modelVersion: response.AnalyzeLendingModelVersion ?? "",
    pages,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers (used by both sync AnalyzeDocument and Lending parsers)
// ---------------------------------------------------------------------------

function extractKeyValuePairs(
  blocks: Block[],
  blockMap: Map<string, Block>
): TextractKeyValuePair[] {
  const pairs: TextractKeyValuePair[] = [];

  // Find all KEY_VALUE_SET blocks that are KEYs
  const keyBlocks = blocks.filter(
    (b) =>
      b.BlockType === "KEY_VALUE_SET" &&
      b.EntityTypes?.includes("KEY")
  );

  for (const keyBlock of keyBlocks) {
    // Get the key text
    const keyText = getTextFromChildren(keyBlock, blockMap);

    // Find the associated VALUE block
    const valueRelation = keyBlock.Relationships?.find(
      (r) => r.Type === "VALUE"
    );
    if (!valueRelation?.Ids?.length) continue;

    const valueBlock = blockMap.get(valueRelation.Ids[0]);
    if (!valueBlock) continue;

    const valueText = getTextFromChildren(valueBlock, blockMap);

    pairs.push({
      key: keyText.trim(),
      value: valueText.trim(),
      confidence: (keyBlock.Confidence || 0) / 100, // Normalize 0-100 → 0-1
      page: keyBlock.Page || 1,
    });
  }

  return pairs;
}

function extractTables(
  blocks: Block[],
  blockMap: Map<string, Block>
): TextractTable[] {
  const tables: TextractTable[] = [];

  const tableBlocks = blocks.filter((b) => b.BlockType === "TABLE");

  for (const table of tableBlocks) {
    const cells = table.Relationships?.find((r) => r.Type === "CHILD");
    if (!cells?.Ids) continue;

    const rowMap = new Map<number, Map<number, string>>();

    for (const cellId of cells.Ids) {
      const cell = blockMap.get(cellId);
      if (!cell || cell.BlockType !== "CELL") continue;

      const row = cell.RowIndex || 0;
      const col = cell.ColumnIndex || 0;
      const text = getTextFromChildren(cell, blockMap);

      if (!rowMap.has(row)) rowMap.set(row, new Map());
      rowMap.get(row)!.set(col, text.trim());
    }

    // Convert map to 2D array
    const rows: string[][] = [];
    const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);
    for (const rowIdx of sortedRows) {
      const colMap = rowMap.get(rowIdx)!;
      const sortedCols = [...colMap.keys()].sort((a, b) => a - b);
      rows.push(sortedCols.map((col) => colMap.get(col) || ""));
    }

    tables.push({ page: table.Page || 1, rows });
  }

  return tables;
}

function getTextFromChildren(
  block: Block,
  blockMap: Map<string, Block>
): string {
  const childRelation = block.Relationships?.find(
    (r) => r.Type === "CHILD"
  );
  if (!childRelation?.Ids) return "";

  const words: string[] = [];
  for (const childId of childRelation.Ids) {
    const child = blockMap.get(childId);
    if (child?.BlockType === "WORD" && child.Text) {
      words.push(child.Text);
    } else if (child?.BlockType === "SELECTION_ELEMENT") {
      words.push(child.SelectionStatus === "SELECTED" ? "[X]" : "[ ]");
    }
  }
  return words.join(" ");
}
