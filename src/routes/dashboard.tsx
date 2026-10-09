import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { NeuralGraph } from "@/components/publica/NeuralGraph";
import { DelayBadge, StatCard } from "@/components/publica/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AI_SUGGESTIONS, matchService, serviceByCode, SERVICES } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Citizen dashboard — Publica" },
      { name: "description", content: "Your public services, simplified and transparent: applications, documents and grievances at a glance." },
      { property: "og:title", content: "Citizen dashboard — Publica" },
      { property: "og:description", content: "Track applications, documents and grievances in one place." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { citizenName, applications, grievances } = usePublica();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const suggestion = query.length > 3 ? matchService(query) : undefined;

  const active = applications.filter((a) => a.stage !== "Completed");
  const pendingDocs = applications.filter((a) => a.documents.some((d) => d.status !== "verified"));
  const completed = applications.filter((a) => a.stage === "Completed");
  const openGrievances = grievances.filter((g) => g.status !== "Resolved");

  return (
    <AppShell requires={"signedIn"}>
      <section className="animate-rise mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting()}, {citizenName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Your public services, simplified and transparent.</p>

        <div className="card-elevated mt-6 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (suggestion) navigate({ to: "/services/$code", params: { code: suggestion.code } });
              else navigate({ to: "/assistant" });
            }}
          >
            <div className="flex items-center gap-2">
              <Search className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What government service do you need?"
                className="border-0 shadow-none focus-visible:ring-0"
                aria-label="Search government services"
              />
              <Button type="submit" className="shrink-0 gap-2">
                <Sparkles className="h-4 w-4" /> Ask Publica AI
              </Button>
            </div>
          </form>

          {suggestion ? (
            <Link
              to="/services/$code"
              params={{ code: suggestion.code }}
              className="animate-fade mt-3 flex items-center justify-between rounded-lg border border-accent/40 bg-accent-soft/40 px-4 py-3"
            >
              <span className="text-sm">
                <span className="font-medium">Recommended service:</span> {suggestion.name} ·{" "}
                {suggestion.slaDays} day service level
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active applications" value={active.length} change={12} spark={[3, 4, 3, 5, 6, active.length]} index={0} />
        <StatCard label="Pending documents" value={pendingDocs.length} change={-8} spark={[4, 3, 3, 2, 2, pendingDocs.length]} tone="warning" index={1} />
        <StatCard label="Completed applications" value={completed.length} change={22} spark={[1, 1, 2, 2, 3, completed.length]} tone="success" index={2} />
        <StatCard label="Open grievances" value={openGrievances.length} change={-5} spark={[3, 3, 2, 2, 2, openGrievances.length]} tone="accent" index={3} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-elevated animate-rise p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent applications</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/applications">View all</Link>
            </Button>
          </div>
          <ul className="mt-4 divide-y">
            {applications.slice(0, 5).map((a) => {
              const service = serviceByCode(a.serviceCode);
              return (
                <li key={a.reference}>
                  <Link
                    to="/applications/$reference"
                    params={{ reference: a.reference }}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{service?.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{a.reference}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-muted-foreground sm:inline">{a.stage}</span>
                      <DelayBadge flag={a.delayFlag} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-lg font-semibold">Your service network</h2>
            <p className="mt-1 text-sm text-muted-foreground">How your file moves between departments.</p>
            <NeuralGraph height={200} />
          </div>
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-lg font-semibold">Quick apply</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES.slice(0, 4).map((s) => (
                <Link key={s.code} to="/services/$code" params={{ code: s.code }}>
                  <Badge variant="outline" className="cursor-pointer px-3 py-1.5 font-normal hover:border-accent">
                    {s.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
