import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Building2, Lightbulb, Settings2, Users } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader, StatCard } from "@/components/publica/Bits";
import { NeuralGraph } from "@/components/publica/NeuralGraph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_INSIGHTS, DEPARTMENTS, SERVICES, STAGES, TRANSPARENCY } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Command center — Publica" },
      { name: "description", content: "Department performance, workload, service-level compliance and operational alerts for administrators." },
      { property: "og:title", content: "Command center — Publica" },
      { property: "og:description", content: "Administrative analytics and workflow configuration." },
    ],
  }),
  component: AdminPage,
});

const OFFICERS = [
  { code: "OFF-BLD-014", name: "Officer 014", department: "BLD", active: 32, closed: 218 },
  { code: "OFF-REV-007", name: "Officer 007", department: "REV", active: 41, closed: 402 },
  { code: "OFF-MUN-021", name: "Officer 021", department: "MUN", active: 27, closed: 154 },
  { code: "OFF-TRN-003", name: "Officer 003", department: "TRN", active: 35, closed: 311 },
];

function AdminPage() {
  const { applications, grievances } = usePublica();
  const backlog = applications.filter((a) => a.stage !== "Completed").length;

  return (
    <AppShell>
      <PageHeader
        title="Command center"
        subtitle="Department performance, workload and operational alerts."
        action={
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" /> Configure workflows
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications this month" value={TRANSPARENCY.monthly.at(-1)!.applications.toLocaleString()} change={7} spark={[82, 84, 90, 95, 101, 108]} index={0} />
        <StatCard label="Service-level compliance" value={`${TRANSPARENCY.kpis.slaCompliance}%`} change={2} spark={[88, 89, 90, 90, 91, 91]} tone="success" index={1} />
        <StatCard label="Open backlog" value={backlog} change={-4} spark={[9, 8, 8, 7, 7, backlog]} tone="warning" index={2} />
        <StatCard label="Open grievances" value={grievances.filter((g) => g.status !== "Resolved").length} change={-9} spark={[4, 4, 3, 3, 2, 2]} tone="accent" index={3} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card-elevated animate-rise p-6">
          <h2 className="text-base font-semibold">Volume and processing time</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TRANSPARENCY.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="applications" name="Received" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated animate-rise p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Lightbulb className="h-4 w-4 text-accent" /> AI insights
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Operational alerts based on configured service levels — not findings of wrongdoing.
          </p>
          <ul className="mt-4 space-y-2">
            {ADMIN_INSIGHTS.map((i) => (
              <li key={i} className="rounded-lg border p-3 text-sm text-muted-foreground">
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Tabs defaultValue="departments" className="mt-8">
        <TabsList>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="officers" className="gap-2">
            <Users className="h-4 w-4" /> Officers
          </TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <Activity className="h-4 w-4" /> Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <div className="card-elevated p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TRANSPARENCY.byDepartment} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis type="category" dataKey="department" tickLine={false} axisLine={false} width={120} className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="slaCompliance" name="Compliance %" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="officers" className="mt-4 grid gap-3 md:grid-cols-2">
          {OFFICERS.map((o) => (
            <div key={o.code} className="card-elevated animate-rise flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{o.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {o.code} · {DEPARTMENTS.find((d) => d.code === o.department)?.name}
                </p>
              </div>
              <div className="text-right text-xs">
                <p>
                  <span className="font-semibold">{o.active}</span> active
                </p>
                <p className="text-muted-foreground">{o.closed} completed</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="services" className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.code} className="card-elevated animate-rise p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">{s.name}</p>
                <Badge variant="outline">{s.slaDays}d</Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{s.code}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.documents.length} required documents</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Standard processing workflow</h3>
            <ol className="mt-4 flex flex-wrap gap-2">
              {STAGES.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-3 py-1">{s}</span>
                  {i < STAGES.length - 1 && <span aria-hidden>→</span>}
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <NeuralGraph height={220} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
