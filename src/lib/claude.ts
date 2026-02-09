import OpenAI from "openai";

const globalForGrok = globalThis as unknown as {
  grok: OpenAI | undefined;
};

const MODEL = "grok-4-1-fast-reasoning";

export const grok =
  globalForGrok.grok ||
  new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
    timeout: 360000,
  });

if (process.env.NODE_ENV !== "production") globalForGrok.grok = grok;

/**
 * Retry wrapper with exponential backoff and jitter.
 * - Attempt 1: immediate
 * - Attempt 2: 2-4s delay (with jitter)
 * - Attempt 3: 6-10s delay (with jitter)
 * Skips non-retryable status codes (400, 401, 403, 404, 413, 422).
 */
const MAX_RETRIES = 2;
const NON_RETRYABLE = [400, 401, 403, 404, 413, 422];

function backoffDelay(attempt: number): number {
  // attempt 1 → base 2s, jitter 0-2s → 2-4s
  // attempt 2 → base 6s, jitter 0-4s → 6-10s
  const baseMs = attempt === 1 ? 2000 : 6000;
  const jitterMs = attempt === 1 ? 2000 : 4000;
  return baseMs + Math.random() * jitterMs;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = (error as any)?.status ?? (error as any)?.response?.status;
      if (NON_RETRYABLE.includes(status)) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const delayMs = backoffDelay(attempt + 1);
      console.warn(
        `[Grok] ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${message}. Retrying in ${Math.round(delayMs / 1000)}s...`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error(`[Grok] ${label} failed after ${MAX_RETRIES + 1} attempts`);
}

/**
 * Send text to Grok and get a structured JSON response.
 * Used for non-standard document structuring (bank statements, P&Ls, etc.)
 */
export async function claudeStructure(params: {
  systemPrompt: string;
  textContent: string;
  maxTokens?: number;
}): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await withRetry(
    () => grok.chat.completions.create({
      model: MODEL,
      max_tokens: params.maxTokens || 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.textContent },
      ],
    }),
    "claudeStructure"
  );

  const text = response.choices[0]?.message?.content ?? "";

  return {
    text,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}

/**
 * Send a PDF to Grok for classification or fallback extraction.
 * Uses the xAI Files API to upload then reference in chat.
 */
export async function claudeWithPdf(params: {
  pdfBuffer: Buffer;
  prompt: string;
  maxTokens?: number;
}): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
}> {
  // Upload the PDF via the Files API (with retry for transient failures)
  const blob = new Blob([new Uint8Array(params.pdfBuffer)], {
    type: "application/pdf",
  });
  const file = await withRetry(
    () => grok.files.create({
      file: new File([blob], "document.pdf", { type: "application/pdf" }),
      purpose: "assistants",
    }),
    "claudeWithPdf:upload"
  );

  const response = await withRetry(
    () => grok.chat.completions.create({
      model: MODEL,
      max_tokens: params.maxTokens || 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: { file_id: file.id },
            } as any,
            { type: "text", text: params.prompt },
          ],
        },
      ],
    }),
    "claudeWithPdf"
  );

  // Clean up uploaded file
  try {
    await grok.files.delete(file.id);
  } catch (cleanupErr) {
    console.warn(`[Grok] Failed to cleanup uploaded file ${file.id}:`, cleanupErr);
  }

  const text = response.choices[0]?.message?.content ?? "";

  return {
    text,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}

/**
 * Send text to Grok and get a parsed JSON response.
 * Used for AI structuring, compliance review, and document generation.
 * Extracts JSON from the response text (handles markdown code fences).
 */
export async function claudeJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<T> {
  const response = await withRetry(
    () => grok.chat.completions.create({
      model: MODEL,
      max_tokens: params.maxTokens || 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
    }),
    "claudeJson"
  );

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[Grok] claudeJson: Failed to parse JSON response: ${text.slice(0, 200)}`);
    // Return empty object — callers should handle missing keys gracefully
    return {} as T;
  }
}

/**
 * Calculate approximate cost based on Grok 4.1 Fast pricing
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number
): number {
  // Grok 4.1 Fast pricing: $0.20/M input, $0.50/M output
  return (inputTokens * 0.2 + outputTokens * 0.5) / 1_000_000;
}
