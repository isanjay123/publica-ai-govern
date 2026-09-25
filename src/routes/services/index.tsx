import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader, EmptyState } from "@/components/publica/Bits";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, SERVICES, departmentByCode } from "@/lib/demo-data";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Government services — Publica" },
      { name: "description", content: "Browse public services with published documents, fees and service deadlines." },
      { property: "og:title", content: "Government services — Publica" },
      { property: "og:description", content: "Every service with its documents, fee and service-level deadline." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string | null>(null);

  const results = SERVICES.filter(
    (s) =>
      (!dept || s.department === dept) &&
      (s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell>
      <PageHeader title="Government services" subtitle="Published requirements, fees and service deadlines for every service." />

      <div className="card-elevated animate-rise mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <Search className="ml-1 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services"
            className="border-0 shadow-none focus-visible:ring-0"
            aria-label="Search services"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={dept === null ? "default" : "outline"} onClick={() => setDept(null)}>
            All
          </Button>
          {DEPARTMENTS.map((d) => (
            <Button key={d.code} size="sm" variant={dept === d.code ? "default" : "outline"} onClick={() => setDept(d.code)}>
              {d.code}
            </Button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState title="No services match your search" body="Try a different term, or clear the department filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((s, i) => (
            <Link
              key={s.code}
              to="/services/$code"
              params={{ code: s.code }}
              className="card-elevated card-interactive animate-rise flex flex-col p-5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">{s.category}</Badge>
                <span className="text-xs text-muted-foreground">{departmentByCode(s.department)?.name}</span>
              </div>
              <h2 className="mt-3 text-base font-semibold">{s.name}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Service level</dt>
                  <dd className="mt-0.5 font-medium">{s.slaDays} days</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fee</dt>
                  <dd className="mt-0.5 font-medium">{s.fee === 0 ? "Free" : s.fee}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Documents</dt>
                  <dd className="mt-0.5 font-medium">{s.documents.length}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
