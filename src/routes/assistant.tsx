import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Languages, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { ChatPanel } from "@/components/publica/AiAssistant";
import { PageHeader } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { LANGUAGES } from "@/lib/demo-data";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Publica AI assistant" },
      {
        name: "description",
        content: "Ask Publica AI about services, eligibility, documents and application status, with answers grounded in published rules.",
      },
      { property: "og:title", content: "Publica AI assistant" },
      { property: "og:description", content: "Grounded answers about public services in eight languages." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <AppShell>
      <PageHeader title="Publica AI" subtitle="Guidance on services, documents and application status — grounded in published rules." />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card-elevated animate-rise overflow-hidden">
          <ChatPanel />
        </div>

        <div className="space-y-4">
          <div className="card-elevated animate-rise p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-4 w-4 text-accent" /> How answers are produced
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Your question is classified by intent",
                "Relevant published rules and guidance are retrieved",
                "A grounded answer is drafted from those sources",
                "The answer is checked and the sources are shown",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-accent" /> What Publica AI will not do
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>It never approves or rejects an application — officers decide.</li>
              <li>It never invents laws, fees, deadlines or eligibility rules.</li>
              <li>It says plainly when it cannot verify something.</li>
            </ul>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Languages className="h-4 w-4 text-accent" /> Languages
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => (
                <Badge key={l.code} variant="outline" className="font-normal">
                  {l.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
