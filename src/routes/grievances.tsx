import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, GRIEVANCE_FLOW, departmentByCode } from "@/lib/demo-data";
import { nextReference, usePublica } from "@/lib/publica-store";
import { createGrievance } from "@/lib/publica.functions";

export const Route = createFileRoute("/grievances")({
  head: () => ({
    meta: [
      { title: "Grievances — Publica" },
      { name: "description", content: "File a grievance about a public service and follow it through to resolution." },
      { property: "og:title", content: "Grievances — Publica" },
      { property: "og:description", content: "Raise and track grievances about public service delivery." },
    ],
  }),
  component: GrievancesPage,
});

const CATEGORIES = [
  "Complaint",
  "Service delay",
  "Technical issue",
  "Officer conduct",
  "Incorrect rejection",
  "Other",
];

function GrievancesPage() {
  const { grievances, addGrievance, notify, user, refresh } = usePublica();
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[1]!);
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]!.code);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setBusy(true);
      try {
        const { reference } = await createGrievance({ data: { category, departmentCode: department, subject, description } });
        await refresh();
        toast.success(`Grievance ${reference} submitted`, { description: "You will be notified at every stage." });
        setSubject("");
        setDescription("");
      } catch (err) {
        toast.error("Could not submit", { description: err instanceof Error ? err.message : "Please check the details and try again." });
      } finally {
        setBusy(false);
      }
      return;
    }
    const reference = nextReference("GRV");
    addGrievance({
      reference,
      category,
      subject,
      description,
      department,
      status: "Submitted",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    notify("Grievance submitted", `${reference} has been received and will be acknowledged shortly.`);
    toast.success(`Grievance ${reference} submitted`, { description: "You will be notified at every stage." });
    setSubject("");
    setDescription("");
  };

  return (
    <AppShell requires={"signedIn"}>
      <PageHeader title="Grievances" subtitle="Raise an issue about a service and follow it through to resolution." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="card-elevated animate-rise h-fit p-6">
          <h2 className="text-base font-semibold">File a grievance</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">What happened?</Label>
              <Textarea id="desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : user ? "Submit grievance" : "Submit (sample — sign in to save)"}
            </Button>
            <p className="text-xs text-muted-foreground">
              You will receive a notification when your grievance is acknowledged, assigned, reviewed and resolved.
            </p>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">How a grievance progresses</h2>
            <ol className="mt-4 flex flex-wrap gap-2">
              {GRIEVANCE_FLOW.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-3 py-1">{s}</span>
                  {i < GRIEVANCE_FLOW.length - 1 && <span aria-hidden>→</span>}
                </li>
              ))}
            </ol>
          </div>

          {grievances.map((g, i) => {
            const step = GRIEVANCE_FLOW.indexOf(g.status as (typeof GRIEVANCE_FLOW)[number]);
            return (
              <div key={g.reference} className="card-elevated animate-rise p-5" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.subject}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {g.reference} · {departmentByCode(g.department)?.name ?? g.department} · {g.createdAt}
                    </p>
                  </div>
                  <Badge variant={g.status === "Resolved" ? "default" : "outline"}>{g.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{g.description}</p>
                <div className="mt-4 flex gap-1">
                  {GRIEVANCE_FLOW.map((s, idx) => (
                    <span
                      key={s}
                      title={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= step ? "bg-accent" : "bg-border"}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
