import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader, StatCard } from "@/components/publica/Bits";
import { Button } from "@/components/ui/button";
import { TRANSPARENCY, DEPARTMENTS } from "@/lib/demo-data";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Public transparency dashboard — Publica" },
      {
        name: "description",
        content: "Open, anonymised statistics on application volumes, processing times, service-level compliance and grievance resolution.",
      },
      { property: "og:title", content: "Public transparency dashboard — Publica" },
      { property: "og:description", content: "Anonymised performance statistics for every department." },
    ],
  }),
  component: TransparencyPage,
});

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function TransparencyPage() {
  const k = TRANSPARENCY.kpis;
  const [district, setDistrict] = useState("All");
  const [year] = useState(2026);

  return (
    <AppShell>
      <PageHeader
        title="Public transparency"
        subtitle={`Anonymised service delivery statistics, ${year}. No personal information is published.`}
      />

      <div className="card-elevated animate-rise mb-6 flex flex-wrap items-center gap-2 p-4">
        <span className="mr-2 text-sm text-muted-foreground">District</span>
        {["All", ...TRANSPARENCY.districts].map((d) => (
          <Button key={d} size="sm" variant={district === d ? "default" : "outline"} onClick={() => setDistrict(d)}>
            {d}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Applications processed" value={k.processed.toLocaleString()} change={9} spark={[7, 8, 9, 10, 10, 11]} index={0} />
        <StatCard label="Average processing time" value={`${k.avgProcessingDays} days`} change={-6} spark={[13, 12, 12, 11, 11, 11]} tone="success" index={1} />
        <StatCard label="Applications pending" value={k.pending.toLocaleString()} change={4} spark={[6, 6, 7, 7, 7, 7]} tone="warning" index={2} />
        <StatCard label="Service-level compliance" value={`${k.slaCompliance}%`} change={2} spark={[88, 89, 90, 90, 91, 91]} tone="success" index={3} />
        <StatCard label="Grievances resolved" value={k.grievancesResolved.toLocaleString()} change={12} spark={[3, 3, 4, 4, 5, 5]} tone="accent" index={4} />
        <StatCard label="Average resolution time" value={`${k.avgGrievanceDays} days`} change={-11} spark={[7, 7, 6, 6, 5, 5]} tone="success" index={5} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card-elevated animate-rise p-6">
          <h2 className="text-base font-semibold">Applications received and completed</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRANSPARENCY.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="applications" name="Received" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.18} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated animate-rise p-6">
          <h2 className="text-base font-semibold">Status mix</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={TRANSPARENCY.statusMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3}>
                  {TRANSPARENCY.statusMix.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-elevated animate-rise p-6">
          <h2 className="text-base font-semibold">Volume by department</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRANSPARENCY.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="department" tickLine={false} axisLine={false} className="text-xs" interval={0} angle={-12} textAnchor="end" height={54} />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="applications" name="Applications" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated animate-rise p-6">
          <h2 className="text-base font-semibold">Average processing time trend</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRANSPARENCY.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="avgDays" name="Average days" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="avgDays" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated animate-rise mt-6 overflow-x-auto p-6">
        <h2 className="text-base font-semibold">Department performance</h2>
        <table className="mt-4 w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-medium">Department</th>
              <th className="pb-2 font-medium">Applications</th>
              <th className="pb-2 font-medium">Avg days</th>
              <th className="pb-2 font-medium">Service-level compliance</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPARENCY.byDepartment.map((d) => (
              <tr key={d.department} className="border-b last:border-0">
                <td className="py-3 font-medium">{d.department}</td>
                <td className="py-3">{d.applications.toLocaleString()}</td>
                <td className="py-3">{d.avgDays}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full rounded-full bg-accent transition-all"
                        style={{ width: `${d.slaCompliance}%` }}
                      />
                    </span>
                    {d.slaCompliance}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted-foreground">
          Figures are demonstration data, aggregated across {DEPARTMENTS.length} departments. Individual citizens and
          officers are never identified here.
        </p>
      </div>
    </AppShell>
  );
}
