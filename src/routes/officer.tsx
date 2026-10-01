import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, FileSearch, Inbox, XCircle } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { DelayBadge, PageHeader, StatCard } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OFFICER_QUEUE, serviceByCode, type Application } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/officer")({
  head: () => ({
    meta: [
      { title: "Officer desk — Publica" },
      { name: "description", content: "Assigned applications, document verification, service deadlines and grievances for government officers." },
      { property: "og:title", content: "Officer desk — Publica" },
      { property: "og:description", content: "Work queue and decisions for assigned applications." },
    ],
  }),
  component: OfficerDesk,
});

function OfficerDesk() {
  const { applications, grievances, updateApplication, notify } = usePublica();
  const [decision, setDecision] = useState<{ app: Application; kind: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");

  const queue = applications.filter((a) => a.stage !== "Completed");
  const approaching = applications.filter((a) => a.delayFlag === "approaching_sla");
  const delayed = applications.filter((a) => a.delayFlag === "delayed" || a.delayFlag === "highly_delayed");
  const docReview = applications.filter((a) => a.documents.some((d) => d.status !== "verified"));

  const confirm = () => {
    if (!decision) return;
    const label = decision.kind === "approve" ? "Approved" : "Rejected";
    updateApplication(decision.app.reference, {
      humanDecision: `${label} by officer ${decision.app.officerCode}${reason ? ` — ${reason}` : ""}`,
      statusLabel: decision.kind === "approve" ? "Approved by officer" : "Rejected by officer",
    });
    notify(`Application ${label.toLowerCase()}`, `${decision.app.reference} — decision recorded in the audit trail.`);
    toast.success(`${label}: ${decision.app.reference}`, { description: "The decision is recorded against your officer ID." });
    setDecision(null);
    setReason("");
  };

  const Row = ({ a }: { a: Application }) => {
    const service = serviceByCode(a.serviceCode);
    return (
      <div className="card-elevated animate-rise p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/applications/$reference" params={{ reference: a.reference }} className="font-medium hover:text-accent">
              {service?.name}
            </Link>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {a.reference} · {a.applicant} · {a.district}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{a.stage}</Badge>
            <DelayBadge flag={a.delayFlag} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Service deadline</dt>
            <dd className="mt-0.5 font-medium">{a.slaDeadline}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Processing time</dt>
            <dd className="mt-0.5 font-medium">{a.processingDays} days</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Documents</dt>
            <dd className="mt-0.5 font-medium">
              {a.documents.filter((d) => d.status === "verified").length}/{a.documents.length} checked
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Officer</dt>
            <dd className="mt-0.5 font-medium">{a.officerCode}</dd>
          </div>
        </dl>

        {a.aiRecommendation && (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">AI recommendation:</span> {a.aiRecommendation} — decision
            support only, the final decision is yours.
          </p>
        )}

        {a.humanDecision && (
          <p className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 text-xs">
            <span className="font-medium">Human decision:</span> {a.humanDecision}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="gap-2" onClick={() => setDecision({ app: a, kind: "approve" })}>
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setDecision({ app: a, kind: "reject" })}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/applications/$reference" params={{ reference: a.reference }}>
              Open file
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <PageHeader title="Officer desk" subtitle="Your assigned work, ordered by published service deadlines." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active cases" value={OFFICER_QUEUE.activeCases} change={6} spark={[24, 26, 29, 30, 31, 32]} index={0} />
        <StatCard label="Approaching deadline" value={OFFICER_QUEUE.approachingSla} change={14} spark={[4, 5, 6, 7, 7, 8]} tone="warning" index={1} />
        <StatCard label="Delayed" value={OFFICER_QUEUE.delayed} change={-20} spark={[5, 5, 4, 4, 3, 3]} tone="warning" index={2} />
        <StatCard label="Documents checked today" value={OFFICER_QUEUE.verifiedToday} change={18} spark={[8, 9, 11, 12, 13, 14]} tone="success" index={3} />
      </div>

      <Tabs defaultValue="queue" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="queue" className="gap-2">
            <Inbox className="h-4 w-4" /> Assigned ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="approaching" className="gap-2">
            <Clock className="h-4 w-4" /> Approaching ({approaching.length})
          </TabsTrigger>
          <TabsTrigger value="delayed" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Delayed ({delayed.length})
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <FileSearch className="h-4 w-4" /> Documents ({docReview.length})
          </TabsTrigger>
          <TabsTrigger value="grievances">Grievances ({grievances.length})</TabsTrigger>
        </TabsList>

        {(
          [
            ["queue", queue],
            ["approaching", approaching],
            ["delayed", delayed],
            ["docs", docReview],
          ] as const
        ).map(([key, list]) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {list.length === 0 ? (
              <p className="card-elevated p-8 text-center text-sm text-muted-foreground">Nothing in this queue.</p>
            ) : (
              list.map((a) => <Row key={a.reference} a={a} />)
            )}
          </TabsContent>
        ))}

        <TabsContent value="grievances" className="mt-4 space-y-3">
          {grievances.map((g) => (
            <div key={g.reference} className="card-elevated animate-rise p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{g.subject}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {g.reference} · {g.category}
                  </p>
                </div>
                <Badge variant="outline">{g.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{g.description}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!decision} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.kind === "approve" ? "Approve application" : "Reject application"}
            </DialogTitle>
            <DialogDescription>
              {decision?.app.reference} — your decision and reason are written to the append-only audit record against
              your officer ID.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the decision (shown to the citizen)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button onClick={confirm}>Record decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
