import { grok } from "@/lib/claude";
import { buildChatContext } from "@/lib/chat-context";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { writeLimit, generalLimit } from "@/lib/rate-limit";

const VALID_MODULES = ["lending", "capital", "ma", "syndication", "compliance"];
const MODEL = "grok-4-1-fast-reasoning";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { org } = await requireAuth();
  const rl = writeLimit.check(org.id);
  if (!rl.success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { projectId } = await params;
  const body = await req.json();
  const { module, messages } = body as {
    module: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!VALID_MODULES.includes(module)) {
    return Response.json({ error: "Invalid module" }, { status: 400 });
  }

  // Upsert chat thread
  const thread = await prisma.chatThread.upsert({
    where: { module_projectId: { module, projectId } },
    create: { orgId: org.id, module, projectId },
    update: {},
  });

  // Save the latest user message
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg?.role === "user") {
    await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "user",
        content: lastUserMsg.content,
      },
    });
  }

  // Build hermetically scoped context
  const systemPrompt = await buildChatContext(module as any, projectId);

  // Stream response using OpenAI SDK directly
  const stream = await grok.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  // Create a ReadableStream that forwards SSE chunks as plain text
  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            fullText += content;
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();

        // Save the complete assistant response to DB
        if (fullText) {
          await prisma.chatMessage.create({
            data: {
              threadId: thread.id,
              role: "assistant",
              content: fullText,
              metadata: { model: MODEL },
            },
          });
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { org } = await requireAuth();
  const rl = generalLimit.check(org.id);
  if (!rl.success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { projectId } = await params;
  const url = new URL(req.url);
  const module = url.searchParams.get("module");

  if (!module || !VALID_MODULES.includes(module)) {
    return Response.json({ error: "module query param required" }, { status: 400 });
  }

  const thread = await prisma.chatThread.findUnique({
    where: { module_projectId: { module, projectId } },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  // Verify org ownership
  if (thread && thread.orgId !== org.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    messages: thread?.messages ?? [],
  });
}
