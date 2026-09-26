import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/publica/AppShell";
import { DelayBadge, EmptyState, PageHeader } from "@/components/publica/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAGES, serviceByCode, departmentByCode } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/applications/")({
  head: () => ({
    meta: [
      { title: "My applications — Publica" },
      { name: "description", content: "Track every application you have filed, its stage, officer and service deadline." },
      { property: "og:title", content: "My applications — Publica" },
      { property: "og:description", content: "Live status for every application you have filed." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { applications } = usePublica();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  const rows = applications.filter((a) => {
    const service = serviceByCode(a.serviceCode);
    const hay = `${a.reference} ${service?.name ?? ""} ${a.stage}`.toLowerCase();
    return (!stage || a.stage === stage) && hay.includes(query.toLowerCase());
  });

  return (
    <AppShell>
      <PageHeader
        title="My applications"
        subtitle="Every application, its current stage and the published service deadline."
        action={
          <Button asChild>
            <Link to="/services">New application</Link>
          </Button>
        }
      />

      <div className="card-elevated animate-rise mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by reference or service"
          className="sm:max-w-xs"
          aria-label="Search applications"
        />
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={stage === null ? "default" : "outline"} onClick={() => setStage(null)}>
            All stages
          </Button>
          {STAGES.map((s) => (
            <Button key={s} size="sm" variant={stage === s ? "default" : "outline"} onClick={() => setStage(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="When you apply for a service it appears here with live tracking."
          action={
            <Button asChild>
              <Link to="/services">Browse services</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((a, i) => {
            const service = serviceByCode(a.serviceCode);
            return (
              <Link
                key={a.reference}
                to="/applications/$reference"
                params={{ reference: a.reference }}
                className="card-elevated card-interactive animate-rise grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div>
                  <p className="font-medium">{service?.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{a.reference}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Stage</p>
                  <p className="mt-0.5 font-medium">{a.stage}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Service deadline</p>
                  <p className="mt-0.5 font-medium">{a.slaDeadline}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="hidden text-xs text-muted-foreground lg:inline">
                    {departmentByCode(service?.department ?? "")?.name}
                  </span>
                  <DelayBadge flag={a.delayFlag} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
