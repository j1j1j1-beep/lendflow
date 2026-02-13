// extract-text.ts
// Extract plain text from a DOCX buffer (ZIP archive containing word/document.xml).
// Uses only Node.js built-in modules — no external dependencies.
//
// DOCX format: ZIP archive where main content lives in word/document.xml.
// We locate that entry in the ZIP, inflate it, then strip XML tags to get text.

import { inflateRaw } from "node:zlib";

/**
 * Extract all text content from a DOCX buffer.
 *
 * Parses the ZIP structure to find word/document.xml, decompresses it,
 * then extracts text from the XML by stripping tags and normalizing whitespace.
 *
 * Returns empty string on any parse failure (non-throwing — never blocks the pipeline).
 */
export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    const xml = await extractDocumentXml(buffer);
    if (!xml) return "";
    return extractTextFromXml(xml);
  } catch {
    // Never block the generation pipeline on text extraction failure
    console.warn("[extract-text] Failed to extract text from DOCX buffer");
    return "";
  }
}

// ─── ZIP parsing ─────────────────────────────────────────────────────

/**
 * Find and decompress word/document.xml from a DOCX (ZIP) buffer.
 *
 * ZIP local file header format (per APPNOTE.TXT spec):
 *   Offset  Size  Field
 *   0       4     Local file header signature (0x04034b50)
 *   4       2     Version needed to extract
 *   6       2     General purpose bit flag
 *   8       2     Compression method (0=stored, 8=deflate)
 *   10      2     Last mod file time
 *   12      2     Last mod file date
 *   14      4     CRC-32
 *   18      4     Compressed size
 *   22      4     Uncompressed size
 *   26      2     File name length
 *   28      2     Extra field length
 *   30      n     File name
 *   30+n    m     Extra field
 *   30+n+m  ...   File data
 */
async function extractDocumentXml(zipBuffer: Buffer): Promise<string | null> {
  const LOCAL_FILE_HEADER_SIG = 0x04034b50;
  let offset = 0;

  while (offset + 30 <= zipBuffer.length) {
    const sig = zipBuffer.readUInt32LE(offset);
    if (sig !== LOCAL_FILE_HEADER_SIG) break;

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

    const fileNameStart = offset + 30;
    const fileName = zipBuffer.toString("utf8", fileNameStart, fileNameStart + fileNameLength);

    const dataStart = fileNameStart + fileNameLength + extraFieldLength;

    if (fileName === "word/document.xml") {
      const compressedData = zipBuffer.subarray(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return compressedData.toString("utf8");
      } else if (compressionMethod === 8) {
        // Deflate
        return await inflateRawAsync(compressedData);
      }
      // Unknown compression — give up
      return null;
    }

    // Advance to next local file header
    offset = dataStart + compressedSize;
  }

  return null;
}

function inflateRawAsync(data: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    inflateRaw(data, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString("utf8"));
    });
  });
}

// ─── XML text extraction ─────────────────────────────────────────────

/**
 * Extract readable text from OOXML document.xml content.
 *
 * Key OOXML elements:
 *   <w:t>text</w:t>           — text run
 *   <w:p>...</w:p>            — paragraph (newline after each)
 *   <w:tab/>                  — tab character
 *   <w:br/>                   — line break
 *   <w:tr>...</w:tr>          — table row (separate cells with " | ")
 *   <w:tc>...</w:tc>          — table cell
 */
function extractTextFromXml(xml: string): string {
  // Step 1: Normalize table rows — separate cells with " | "
  // Replace </w:tc><w:tc> boundaries with a pipe separator
  let processed = xml.replace(/<\/w:tc>\s*<w:tc[^>]*>/g, " | ");

  // Step 2: Replace paragraph endings with newlines
  processed = processed.replace(/<\/w:p>/g, "\n");

  // Step 3: Replace <w:tab/> with tab and <w:br/> with newline
  processed = processed.replace(/<w:tab\s*\/>/g, "\t");
  processed = processed.replace(/<w:br[^/]*\/>/g, "\n");

  // Step 4: Extract text from <w:t> elements (including <w:t xml:space="preserve">)
  // Replace everything that's NOT inside a <w:t> tag
  const textParts: string[] = [];
  const tagRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;

  // We need a different approach: first extract just the text content
  // Process the XML by replacing all tags except preserving our markers

  // Simpler approach: extract <w:t> content and paragraph boundaries
  let result = "";
  let lastIndex = 0;
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>|<\/w:p>|<w:tab\s*\/>|<w:br[^/]*\/>|<\/w:tc>\s*<w:tc[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    if (match[1] !== undefined) {
      // <w:t>text</w:t>
      result += match[1];
    } else if (match[0].includes("</w:p>")) {
      result += "\n";
    } else if (match[0].includes("w:tab")) {
      result += "\t";
    } else if (match[0].includes("w:br")) {
      result += "\n";
    } else if (match[0].includes("</w:tc>")) {
      result += " | ";
    }
  }

  // Step 5: Decode XML entities
  result = result
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Step 6: Normalize whitespace — collapse multiple blank lines, trim
  result = result
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}
