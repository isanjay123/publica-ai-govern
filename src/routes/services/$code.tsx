import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, FileUp, ShieldAlert, Sparkles, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { EmptyState, PageHeader } from "@/components/publica/Bits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { STAGES, departmentByCode, serviceByCode, type Application } from "@/lib/demo-data";
import { nextReference, usePublica } from "@/lib/publica-store";
import { supabase } from "@/integrations/supabase/client";
import { createApplication, verifyDocument } from "@/lib/publica.functions";

type Verification = {
  detectedType: string;
  documentDetected: boolean;
  requiredInfoPresent: boolean;
  formatValid: boolean;
  needsReview: boolean;
  explanation: string;
  confidence: number;
  model: string;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/services/$code")({
  head: ({ params }) => {
    const service = serviceByCode(params.code);
    const title = service ? `${service.name} — Publica` : "Service — Publica";
    const description = service?.description ?? "Apply for a public service on Publica.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ServiceDetail,
});

type UploadedDoc = {
  name: string;
  type: string;
  status: "verified" | "flagged" | "pending";
  note?: string | undefined;
  mime?: string;
  size?: number;
  storagePath?: string;
  verification?: Verification | null;
};

const VERIFY_STEPS = [
  "Security validation",
  "Optical character recognition",
  "Document classification",
  "Information extraction",
  "Rule validation",
  "Eligibility validation",
];

function ServiceDetail() {
  const { code } = useParams({ from: "/services/$code" });
  const service = serviceByCode(code);
  const navigate = useNavigate();
  const { addApplication, notify, citizenName, user, refresh } = usePublica();
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [applicantName, setApplicantName] = useState(citizenName);
  const [district, setDistrict] = useState("Central");
  const [notes, setNotes] = useState("");

  if (!service) {
    return (
      <AppShell>
        <EmptyState
          title="Service not found"
          body="This service is not available. Browse the full catalogue instead."
          action={
            <Button asChild>
              <Link to="/services">All services</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const department = departmentByCode(service.department);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const allowed = /\.(pdf|jpe?g|png|docx)$/i;
    const accepted = Array.from(files).filter((f) => allowed.test(f.name));
    if (accepted.length < files.length) {
      toast.error("Some files were rejected", { description: "Only PDF, JPG, PNG and DOCX files are accepted." });
    }
    if (!accepted.length) return;
    const tooBig = accepted.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      toast.error("File too large", { description: `${tooBig.name} is over 10 MB.` });
      return;
    }

    if (user) {
      void verifyReal(accepted);
      return;
    }

    setVerifying(true);
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return p + 100 / VERIFY_STEPS.length;
      });
    }, 320);

    window.setTimeout(() => {
      window.clearInterval(timer);
      setProgress(100);
      setVerifying(false);
      setDocs((prev) => [
        ...prev,
        ...accepted.map((f, i) => ({
          name: f.name,
          type: service.documents[(prev.length + i) % service.documents.length] ?? "Supporting document",
          status: (i % 3 === 2 ? "flagged" : "verified") as UploadedDoc["status"],
          note:
            i % 3 === 2
              ? "Text in this scan is partly unreadable, so one required field could not be extracted. A clearer copy is needed."
              : undefined,
        })),
      ]);
      toast.success("Document check complete", { description: "AI findings are shown below for officer review." });
    }, 320 * VERIFY_STEPS.length + 200);
  };

  const verifyReal = async (files: File[]) => {
    setVerifying(true);
    setProgress(10);
    for (const [i, f] of files.entries()) {
      try {
        const mime = f.type || (f.name.toLowerCase().endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "");
        const path = `${user!.id}/${Date.now()}-${f.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("application-documents").upload(path, f, { contentType: mime });
        if (upErr) throw new Error(upErr.message);
        setProgress(20 + (i / files.length) * 40);
        const base64 = await fileToBase64(f);
        const res = await verifyDocument({ data: { fileName: f.name, mime, base64, serviceCode: service.code } });
        setProgress(60 + ((i + 1) / files.length) * 40);
        if (!res.ok) {
          toast.error("Document rejected", { description: res.error });
          continue;
        }
        const v = res.result;
        setDocs((prev) => [
          ...prev,
          {
            name: f.name,
            type: v.detectedType,
            status: v.needsReview ? "flagged" : "verified",
            note: v.explanation,
            mime,
            size: f.size,
            storagePath: path,
            verification: v,
          },
        ]);
      } catch (err) {
        toast.error("Upload failed", { description: err instanceof Error ? err.message : "Please try again." });
      }
    }
    setProgress(100);
    setVerifying(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setSubmitting(true);
      try {
        const { reference } = await createApplication({
          data: {
            serviceCode: service.code,
            applicantName,
            district,
            notes,
            documents: docs
              .filter((d) => d.storagePath)
              .map((d) => ({
                fileName: d.name,
                mime: d.mime ?? "",
                size: d.size ?? 0,
                storagePath: d.storagePath!,
                verification: d.verification ?? null,
              })),
          },
        });
        await refresh();
        toast.success(`Application ${reference} submitted`);
        navigate({ to: "/applications/$reference", params: { reference } });
      } catch (err) {
        toast.error("Could not submit", { description: err instanceof Error ? err.message : "Please try again." });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const reference = nextReference("PUB");
    const app: Application = {
      reference,
      serviceCode: service.code,
      applicant: applicantName,
      district,
      stage: STAGES[0],
      statusLabel: "Submitted",
      officerCode: "Awaiting assignment",
      submittedAt: new Date().toISOString().slice(0, 10),
      expectedAt: new Date(Date.now() + service.slaDays * 86400000).toISOString().slice(0, 10),
      slaDeadline: new Date(Date.now() + service.slaDays * 86400000).toISOString().slice(0, 10),
      processingDays: 0,
      delayFlag: "normal",
      timeline: [
        {
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          stage: "Application Submitted",
          action: "Application submitted",
          actor: "Citizen portal",
          department: service.department,
          ...(notes ? { comment: notes } : {}),
        },
      ],
      documents: docs.map((d) => ({ name: d.name, type: d.type, status: d.status })),
      demo: true,
    };
    toast.info("Saved in this session only", { description: "Sign in to submit a real application." });
    addApplication(app);
    notify("Application submitted", `${service.name} — ${reference} is now in the queue.`);
    toast.success(`Application ${reference} submitted`);
    navigate({ to: "/applications/$reference", params: { reference } });
  };

  return (
    <AppShell>
      <PageHeader
        title={service.name}
        subtitle={`${department?.name} · ${service.slaDays} day service level · Fee ${service.fee === 0 ? "free" : service.fee}`}
        action={<Badge variant="outline">{service.category}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">About this service</h2>
            <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
            <h3 className="mt-5 text-sm font-semibold">Eligibility</h3>
            <ul className="mt-2 space-y-1.5">
              {service.eligibility.map((e) => (
                <li key={e} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {e}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-semibold">Required documents</h3>
            <ul className="mt-2 space-y-1.5">
              {service.documents.map((d) => (
                <li key={d} className="flex gap-2 text-sm text-muted-foreground">
                  <FileUp className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Processing stages</h2>
            <ol className="mt-3 space-y-2">
              {STAGES.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Application form</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="applicant">Applicant name</Label>
                <Input id="applicant" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} required />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Additional information (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, JPG, PNG or DOCX, up to 10 MB. {user ? "Each file is stored securely and read by Publica AI." : "Sign in to have files read by Publica AI — without an account the check is simulated."}
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors hover:border-accent">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="mt-3 text-sm font-medium">Upload documents</span>
              <span className="mt-1 text-xs text-muted-foreground">Drag and drop, or select files</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {verifying && (
              <div className="animate-fade mt-4 rounded-lg border p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 animate-pulse-soft text-accent" /> Running document checks…
                </p>
                <Progress value={progress} className="mt-3" />
                <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  {VERIFY_STEPS.map((s, i) => (
                    <li key={s} className={progress > (i / VERIFY_STEPS.length) * 100 ? "text-foreground" : undefined}>
                      {progress > (i / VERIFY_STEPS.length) * 100 ? "✓" : "•"} {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {docs.length > 0 && (
              <ul className="mt-4 space-y-2">
                {docs.map((d, i) => (
                  <li key={`${d.name}-${i}`} className="animate-fade rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">Detected as: {d.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={d.status === "verified" ? "border-success/40 text-success" : "border-warning/50 text-warning"}
                        >
                          {d.status === "verified" ? "Checks passed" : "Additional verification required"}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${d.name}`}
                          onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {d.note && (
                      <p className="mt-2 flex gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-warning" /> {d.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Automated checks are decision support only. An authorised officer makes the final decision on this
              application.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={submitting || verifying}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
            <Button type="button" size="lg" variant="outline" asChild>
              <Link to="/services">Back to services</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
