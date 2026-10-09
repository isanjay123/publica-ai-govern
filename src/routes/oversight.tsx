import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Fingerprint, Link2, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader, StatCard } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { departmentByCode } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";
import { listAuditLog, verifyAuditChain } from "@/lib/publica.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/oversight")({
  head: () => ({
    meta: [
      { title: "Oversight console — Publica" },
      { name: "description", content: "Integrity reports, investigations, anomaly monitoring and the append-only audit record." },
      { property: "og:title", content: "Oversight console — Publica" },
      { property: "og:description", content: "Independent oversight of public service delivery." },
    ],
  }),
  component: OversightPage,
});

const AUDIT = [
  { id: 4821, at: "2026-09-21 15:05", role: "officer", action: "Application assigned for review", app: "PUB-2026-000184", prev: "9f2c…41ab", hash: "3b7d…c0e1" },
  { id: 4822, at: "2026-09-21 15:22", role: "system", action: "Document verification completed", app: "PUB-2026-000184", prev: "3b7d…c0e1", hash: "a10f…77d2" },
  { id: 4823, at: "2026-09-21 16:40", role: "officer", action: "Recommended for departmental approval", app: "PUB-2026-000186", prev: "a10f…77d2", hash: "cc48…19b6" },
  { id: 4824, at: "2026-09-22 09:12", role: "dept_admin", action: "Service level configuration updated", app: "—", prev: "cc48…19b6", hash: "6e21…b8f4" },
];

const ANOMALIES = [
  { signal: "Repeated reassignment", detail: "Three building permit files reassigned more than twice this month.", severity: "Review" },
  { signal: "Processing time outlier", detail: "One municipal file is 2.4x the department baseline.", severity: "Review" },
  { signal: "Volume spike", detail: "Business licence submissions rose 22% week on week.", severity: "Monitor" },
];

function OversightPage() {
  const { reports, user } = usePublica();
  const [verified, setVerified] = useState<null | boolean>(null);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [liveRows, setLiveRows] = useState<typeof AUDIT | null>(null);
  const [liveNote, setLiveNote] = useState("");

  useEffect(() => {
    if (!user) return;
    listAuditLog().then((res) => {
      if (!res.ok) {
        setLiveNote(res.error);
        return;
      }
      setLiveRows(
        res.rows.map((r) => ({
          id: r.id,
          at: new Date(r.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
          role: r.role ?? "—",
          action: r.action,
          app: String((r.payload as Record<string, unknown> | null)?.["reference"] ?? "—"),
          prev: r.previous_hash ? `${r.previous_hash.slice(0, 4)}…${r.previous_hash.slice(-4)}` : "GENESIS",
          hash: r.current_hash ? `${r.current_hash.slice(0, 4)}…${r.current_hash.slice(-4)}` : "—",
        })),
      );
    });
  }, [user]);

  const runVerify = async () => {
    if (!user) {
      setVerified(true);
      setVerifyMsg("Sample chain verified. Sign in with an oversight role to verify the live record.");
      return;
    }
    const res = await verifyAuditChain();
    if (!res.ok) {
      setVerified(false);
      setVerifyMsg(res.error);
      return;
    }
    setVerified(res.valid);
    setVerifyMsg(
      res.valid
        ? `Chain verified: all ${res.total} entries recompute and link correctly.`
        : `Chain broken at entry ${res.firstBrokenId}. This record may have been altered and needs investigation.`,
    );
    toast[res.valid ? "success" : "error"](res.valid ? "Hash chain verified" : "Hash chain mismatch");
  };
  const rows = liveRows ?? AUDIT;

  return (
    <AppShell requires={["oversight", "super_admin"]}>
      <PageHeader title="Oversight console" subtitle="Integrity reports, anomaly signals and the append-only audit record." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open integrity reports" value={reports.filter((r) => r.status !== "Closed").length} change={3} spark={[1, 1, 2, 2, 2, 2]} tone="warning" index={0} />
        <StatCard label="Active investigations" value={1} change={0} spark={[1, 1, 1, 1, 1, 1]} index={1} />
        <StatCard label="Anomaly signals" value={ANOMALIES.length} change={-12} spark={[5, 5, 4, 4, 3, 3]} tone="accent" index={2} />
        <StatCard label="Audit events recorded" value="4,824" change={8} spark={[41, 43, 45, 46, 47, 48]} tone="success" index={3} />
      </div>

      <Tabs defaultValue="reports" className="mt-8">
        <TabsList>
          <TabsTrigger value="reports">Integrity reports</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly monitoring</TabsTrigger>
          <TabsTrigger value="audit">Audit record</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {reports.map((r) => (
            <div key={r.reference} className="card-elevated animate-rise p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.category}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {r.reference} · {departmentByCode(r.department)?.name ?? r.department} · {r.createdAt}
                  </p>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.success("Marked for assessment")}>
                  Assess
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Investigation opened")}>
                  Open investigation
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast.success("Investigation report drafted")}>
                  Draft report
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Reporter identity is not stored unless contact details were voluntarily provided.
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="anomalies" className="mt-4 space-y-3">
          {ANOMALIES.map((a) => (
            <div key={a.signal} className="card-elevated animate-rise flex items-start gap-3 p-5">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{a.signal}</p>
                  <Badge variant="outline">{a.severity}</Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{a.detail}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Signals flag cases for human review. They are not findings against any officer or department.
          </p>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="card-elevated p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Fingerprint className="h-4 w-4 text-accent" /> Append-only audit record
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each entry stores the hash of the previous entry, so any alteration breaks the chain and is
                  detectable.
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => void runVerify()}
              >
                <ShieldCheck className="h-4 w-4" /> Verify chain
              </Button>
            </div>

            {verified !== null && (
              <p
                className={`animate-fade mt-4 rounded-lg border p-3 text-sm ${verified ? "border-success/40 bg-success/10" : "border-warning/50 bg-warning/10"}`}
              >
                {verifyMsg}
              </p>
            )}
            {liveNote && <p className="mt-3 text-xs text-muted-foreground">{liveNote} Showing sample entries.</p>}

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Action</th>
                    <th className="pb-2 font-medium">Application</th>
                    <th className="pb-2 font-medium">Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">{e.id}</td>
                      <td className="py-3 text-xs">{e.at}</td>
                      <td className="py-3 text-xs">{e.role}</td>
                      <td className="py-3">{e.action}</td>
                      <td className="py-3 font-mono text-xs">{e.app}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          {e.prev} <Link2 className="h-3 w-3" /> {e.hash}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
