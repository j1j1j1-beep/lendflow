"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, Bot, Sparkles, Trash2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

type Module = "lending" | "capital" | "ma" | "syndication" | "compliance";

interface ChatPanelProps {
  module: Module;
  projectId: string;
  projectName: string;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MODULE_LABELS: Record<Module, string> = {
  lending: "lending",
  capital: "capital",
  ma: "M&A",
  syndication: "syndication",
  compliance: "compliance",
};

const MODULE_CHIPS: Record<Module, string[]> = {
  lending: [
    "What are the covenant requirements?",
    "Summarize the key terms",
    "Any compliance issues flagged?",
  ],
  capital: [
    "Explain the waterfall structure",
    "What's the preferred return?",
    "Any compliance issues flagged?",
  ],
  ma: [
    "Summarize the indemnification terms",
    "What are the closing conditions?",
    "Any compliance issues flagged?",
  ],
  syndication: [
    "What's the projected IRR?",
    "Explain the fee structure",
    "Any compliance issues flagged?",
  ],
  compliance: [
    "Are there regulatory filing deadlines?",
    "Summarize the key metrics",
    "Any compliance issues flagged?",
  ],
};

// Simple markdown-ish renderer: bold, headers, lists, code
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="font-semibold text-sm mt-3 mb-1">
          {processInline(line.slice(4))}
        </p>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="font-semibold text-sm mt-3 mb-1">
          {processInline(line.slice(3))}
        </p>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <p key={i} className="font-bold text-sm mt-3 mb-1">
          {processInline(line.slice(2))}
        </p>,
      );
    }
    // Bullet list
    else if (line.match(/^[\s]*[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground shrink-0 mt-px">-</span>
          <span>{processInline(line.replace(/^[\s]*[-*]\s/, ""))}</span>
        </div>,
      );
    }
    // Numbered list
    else if (line.match(/^[\s]*\d+\.\s/)) {
      const match = line.match(/^[\s]*(\d+)\.\s(.*)/)!;
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground shrink-0 mt-px tabular-nums">{match[1]}.</span>
          <span>{processInline(match[2])}</span>
        </div>,
      );
    }
    // Empty line
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    }
    // Normal text
    else {
      elements.push(
        <p key={i}>{processInline(line)}</p>,
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    const boldIdx = boldMatch?.index ?? Infinity;
    const codeIdx = codeMatch?.index ?? Infinity;

    if (boldIdx === Infinity && codeIdx === Infinity) {
      parts.push(remaining);
      break;
    }

    if (boldIdx <= codeIdx && boldMatch) {
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch) {
      if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx));
      parts.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// Message entrance animation variants
const EASE = [0.25, 0.4, 0.25, 1] as const;
const messageVariants = {
  user: {
    initial: { opacity: 0, x: 16, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { duration: 0.25, ease: EASE as unknown as [number, number, number, number] },
  },
  assistant: {
    initial: { opacity: 0, x: -12, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { duration: 0.3, ease: EASE as unknown as [number, number, number, number] },
  },
};

export function ChatPanel({ module, projectId, projectName }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load chat history when sheet opens
  useEffect(() => {
    if (!open || historyLoaded) return;

    fetch(`/api/projects/${projectId}/chat?module=${module}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          );
        }
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [open, projectId, module, historyLoaded]);

  // Auto-scroll — smooth
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  // Send message with streaming
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module,
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          );
          scrollToBottom();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorText = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || `Error: ${errorText}. Please try again.` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, projectId, module, scrollToBottom],
  );

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistoryLoaded(false);
  };

  const chips = MODULE_CHIPS[module];
  const hasMessages = messages.length > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 transition-all duration-200 hover:shadow-sm hover:-translate-y-px active:translate-y-0 group"
      >
        <Sparkles className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
        AI Assistant
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-[480px] w-full flex flex-col !p-0 !gap-0"
        >
          {/* Header */}
          <SheetHeader className="border-b px-5 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2.5 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                AI Assistant
              </SheetTitle>
              {hasMessages && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-7 px-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}
            </div>
            <SheetDescription className="truncate text-xs">
              {projectName}
            </SheetDescription>
          </SheetHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            <AnimatePresence mode="wait">
              {!hasMessages && !isStreaming ? (
                // Empty state
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex h-full flex-col items-center justify-center gap-5 p-6"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
                  >
                    <MessageSquare className="h-7 w-7 text-primary" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-center"
                  >
                    <p className="text-sm font-medium">
                      Ask about your {MODULE_LABELS[module]} documents
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground max-w-[280px]">
                      Get answers about terms, compliance flags, specific clauses, or anything in your generated documents.
                    </p>
                  </motion.div>
                  <div className="flex flex-col gap-2 w-full max-w-[320px]">
                    {chips.map((chip, i) => (
                      <motion.button
                        key={chip}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                        onClick={() => sendMessage(chip)}
                        className="group flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-left text-[13px] text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-sm hover:-translate-y-px active:translate-y-0"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors duration-200" />
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                // Messages
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 space-y-5"
                >
                  {messages.map((msg) => {
                    const v = messageVariants[msg.role];
                    return (
                      <motion.div
                        key={msg.id}
                        initial={v.initial}
                        animate={v.animate}
                        transition={v.transition}
                      >
                        {msg.role === "user" ? (
                          <div className="flex gap-3 justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-[13px] leading-relaxed text-primary-foreground shadow-sm">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1 text-[13px] leading-relaxed">
                              {msg.content ? (
                                <FormattedText text={msg.content} />
                              ) : (
                                <div className="flex items-center gap-1.5 py-2">
                                  <motion.span
                                    className="h-2 w-2 rounded-full bg-primary/40"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                                  />
                                  <motion.span
                                    className="h-2 w-2 rounded-full bg-primary/40"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                                  />
                                  <motion.span
                                    className="h-2 w-2 rounded-full bg-primary/40"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="border-t bg-background p-4 shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your documents..."
                disabled={isStreaming}
                rows={1}
                className="w-full resize-none rounded-xl border bg-muted/50 pl-4 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              />
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleStop}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <StopCircle className="h-4 w-4" />
                  <span className="sr-only">Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              )}
            </form>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
              AI responses may contain inaccuracies. Verify critical legal details.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
