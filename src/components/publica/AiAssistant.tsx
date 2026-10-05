import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AI_SUGGESTIONS, LANGUAGES } from "@/lib/demo-data";
import { askPublica } from "@/lib/publica.functions";
import { usePublica } from "@/lib/publica-store";
import { cn } from "@/lib/utils";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; sources: string[] };

export function useAiChat() {
  const { language } = usePublica();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm Publica AI. I can explain services, eligibility and required documents, help you track an application, or guide you through a grievance. I answer only from verified government sources.",
      sources: [],
    },
  ]);
  const [pending, setPending] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || pending) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, sources: [] };
    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, userMsg]);
    setPending(true);
    try {
      const res = await askPublica({ data: { question: text, language, history } });
      setMessages((m) => [
        ...m,
        res.ok
          ? { id: crypto.randomUUID(), role: "assistant", content: res.answer, sources: res.sources }
          : { id: crypto.randomUUID(), role: "assistant", content: res.error, sources: [] },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Publica AI is temporarily unavailable. You can continue using all standard government services.",
          sources: [],
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return { messages, send, pending };
}

export function ChatPanel({ compact = false }: { compact?: boolean }) {
  const { messages, send, pending } = useAiChat();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex-1 space-y-4 overflow-y-auto px-4 py-4", compact ? "max-h-[22rem]" : "")}>
        {messages.map((m) => (
          <div key={m.id} className={cn("animate-fade flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <Badge key={s} variant="outline" className="text-[11px] font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse-soft" /> Publica AI is retrieving government sources…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {AI_SUGGESTIONS.slice(0, compact ? 2 : 4).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
            setDraft("");
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Publica AI about any government service…"
            aria-label="Message Publica AI"
          />
          <Button type="submit" size="icon" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Publica AI provides decision support. Officers retain final authority on all decisions.
        </p>
      </div>
    </div>
  );
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="animate-rise fixed bottom-24 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-float)] sm:right-6">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">Publica AI</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Grounded in government sources</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatPanel compact />
        </div>
      )}
      <Button
        onClick={() => setOpen((o) => !o)}
        size="lg"
        className="fixed bottom-6 right-4 z-50 h-14 gap-2 rounded-full px-5 shadow-[var(--shadow-float)] sm:right-6"
      >
        <Bot className="h-5 w-5" />
        <span className="hidden sm:inline">Publica AI</span>
      </Button>
    </>
  );
}
