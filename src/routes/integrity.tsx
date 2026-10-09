import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, Search, ShieldCheck, Upload } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, INTEGRITY_CATEGORIES, departmentByCode } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";
import { checkIntegrityStatus, submitIntegrityReport } from "@/lib/publica.functions";

export const Route = createFileRoute("/integrity")({
  head: () => ({
    meta: [
      { title: "Report an integrity concern — Publica" },
      {
        name: "description",
        content: "Report an integrity concern confidentially. Reports are encrypted and routed only to authorised oversight personnel.",
      },
      { property: "og:title", content: "Report an integrity concern — Publica" },
      { property: "og:description", content: "Confidential integrity reporting with a secure report ID and status tracking." },
    ],
  }),
  component: IntegrityPage,
});

function IntegrityPage() {
  const { reports, addReport } = usePublica();
  const [busy, setBusy] = useState(false);
  const [incidentAt, setIncidentAt] = useState("");
  const [appRef, setAppRef] = useState("");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [category, setCategory] = useState<string>(INTEGRITY_CATEGORIES[0]!);
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]!.code);
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [contact, setContact] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [issued, setIssued] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submitIntegrityReport({
        data: {
          category,
          departmentCode: department,
          description,
          applicationReference: appRef,
          incidentAt,
          contact: anonymous ? "" : contact,
        },
      });
      addReport({
        reference: res.reference,
        category,
        department,
        status: "Received",
        createdAt: new Date().toISOString().slice(0, 10),
        description,
      });
      setIssued(res.reference);
      setAccessCode(res.accessCode);
      setDescription("");
      setEvidence([]);
      toast.success("Report received securely");
    } catch (err) {
      toast.error("Could not submit", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await checkIntegrityStatus({ data: { reference: lookup, accessCode: lookupCode } });
    setLookupResult(res.found ? `${res.status} · last updated ${res.updatedAt}` : "No report matches that ID and access code.");
  };

  return (
    <AppShell>
      <PageHeader
        title="Report an integrity concern"
        subtitle="Your report will be encrypted and routed only to authorised oversight personnel."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={submit} className="card-elevated animate-rise p-6">
          <p className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Reports can be filed anonymously. Publica does not attach your identity unless you choose to provide
            contact details.
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEGRITY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="when">Date and time of the incident</Label>
                <Input id="when" type="datetime-local" value={incidentAt} onChange={(e) => setIncidentAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref">Service or application reference (optional)</Label>
              <Input id="ref" placeholder="PUB-2026-000184" value={appRef} onChange={(e) => setAppRef(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what">Description</Label>
              <Textarea
                id="what"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, without including more personal information than necessary."
                required
              />
            </div>

            <div>
              <Label>Evidence (optional)</Label>
              <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-accent">
                <Upload className="h-4 w-4" />
                Attach files
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => setEvidence(Array.from(e.target.files ?? []).map((f) => f.name))}
                />
              </label>
              {evidence.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {evidence.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Submit anonymously</p>
                <p className="text-xs text-muted-foreground">No identifying details are stored with the report.</p>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} aria-label="Submit anonymously" />
            </div>

            {!anonymous && (
              <div className="animate-fade space-y-2">
                <Label htmlFor="contact">Contact detail (optional)</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or phone, used only by oversight staff"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Submit report securely"}
            </Button>
          </div>

          {issued && (
            <div className="animate-fade mt-5 rounded-lg border border-success/40 bg-success/10 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-success" /> Report received
              </p>
              <p className="mt-1.5 text-sm">
                Report ID <span className="font-mono font-semibold">{issued}</span>
                {accessCode && (
                  <>
                    {" "}· access code <span className="font-mono font-semibold">{accessCode}</span>
                  </>
                )}
                . Save both — they are the only way to check the status without revealing your identity. The access
                code is not stored in readable form and cannot be recovered.
              </p>
            </div>
          )}
        </form>

        <div className="space-y-6">
          <form onSubmit={checkStatus} className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Check a report status</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your report ID and access code. No identity is required.</p>
            <div className="mt-4 flex gap-2">
              <Input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="PRT-2026-008421" aria-label="Report ID" />
              <Input value={lookupCode} onChange={(e) => setLookupCode(e.target.value)} placeholder="Access code" aria-label="Access code" className="max-w-[9rem]" />
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" /> Check
              </Button>
            </div>
            {lookupResult && <p className="animate-fade mt-3 rounded-lg bg-muted p-3 text-sm">{lookupResult}</p>}
          </form>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Recently filed reports</h2>
            <p className="mt-1 text-xs text-muted-foreground">Demonstration records — no identifying details shown.</p>
            <ul className="mt-4 space-y-3">
              {reports.map((r) => (
                <li key={r.reference} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs">{r.reference}</span>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{r.category}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {departmentByCode(r.department)?.name ?? r.department} · {r.createdAt}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
