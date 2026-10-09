import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Bot, Building2, CalendarClock, ChevronDown, FileText, Timer, UserCheck } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { DelayBadge, EmptyState, PageHeader, StageTracker } from "@/components/publica/Bits";
import { NeuralGraph } from "@/components/publica/NeuralGraph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { departmentByCode, serviceByCode, DELAY_LABELS } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/applications/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Application ${params.reference} — Publica` },
      {
        name: "description",
        content: `Live tracking, action history and service deadline for application ${params.reference}.`,
      },
      { property: "og:title", content: `Application ${params.reference} — Publica` },
      { property: "og:description", content: "Live tracking and transparent action history for this application." },
    ],
  }),
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { reference } = useParams({ from: "/applications/$reference" });
  const { applications } = usePublica();
  const app = applications.find((a) => a.reference === reference);

  if (!app) {
    return (
      <AppShell requires={"signedIn"}>
        <EmptyState
          title="Application not found"
          body="We couldn't find that reference in your account."
          action={
            <Button asChild>
              <Link to="/applications">Back to my applications</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const service = serviceByCode(app.serviceCode);
  const department = departmentByCode(service?.department ?? "");
  const slaPercent = service ? Math.min(100, Math.round((app.processingDays / service.slaDays) * 100)) : 0;

  const facts = [
    { icon: Building2, label: "Responsible department", value: department?.name ?? "—" },
    { icon: UserCheck, label: "Assigned officer", value: app.officerCode },
    { icon: CalendarClock, label: "Submitted", value: app.submittedAt },
    { icon: CalendarClock, label: "Expected completion", value: app.expectedAt },
    { icon: Timer, label: "Service deadline", value: app.slaDeadline },
    { icon: Timer, label: "Current processing time", value: `${app.processingDays} days` },
  ];

  return (
    <AppShell requires={"signedIn"}>
      <PageHeader
        title={service?.name ?? "Application"}
        subtitle={`${app.reference} · ${app.statusLabel}`}
        action={<DelayBadge flag={app.delayFlag} />}
      />

      <div className="card-elevated animate-rise mb-6 p-6">
        <StageTracker stage={app.stage} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Application details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-3">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Service level used</span>
                <span className="font-medium">
                  {app.processingDays} of {service?.slaDays ?? "—"} days
                </span>
              </div>
              <Progress value={slaPercent} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">Status: {DELAY_LABELS[app.delayFlag]}</p>
            </div>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Action history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every recorded action, with the responsible department and officer identifier.
            </p>
            <ol className="mt-5 space-y-1">
              {app.timeline.map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative pl-7">
                  <span className="absolute left-0 top-3 grid h-3 w-3 place-items-center rounded-full bg-accent" />
                  {i < app.timeline.length - 1 && <span className="absolute left-[5px] top-6 h-full w-px bg-border" />}
                  <Collapsible>
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted">
                      <div>
                        <p className="text-sm font-medium">{e.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.at} · {e.stage}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="animate-fade px-2 pb-3">
                      <dl className="grid gap-2 rounded-lg bg-muted p-3 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Department</dt>
                          <dd className="mt-0.5 font-medium">{departmentByCode(e.department)?.name ?? e.department}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Recorded by</dt>
                          <dd className="mt-0.5 font-medium">{e.actor}</dd>
                        </div>
                        {e.comment && (
                          <div className="sm:col-span-2">
                            <dt className="text-muted-foreground">Note</dt>
                            <dd className="mt-0.5">{e.comment}</dd>
                          </div>
                        )}
                      </dl>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Documents</h2>
            <ul className="mt-4 space-y-2">
              {app.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      d.status === "verified"
                        ? "border-success/40 text-success"
                        : d.status === "flagged"
                          ? "border-warning/50 text-warning"
                          : undefined
                    }
                  >
                    {d.status === "verified" ? "Checks passed" : d.status === "flagged" ? "Needs review" : "Pending"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          {app.aiRecommendation && (
            <div className="card-elevated animate-rise p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bot className="h-4 w-4 text-accent" /> AI recommendation
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{app.aiRecommendation}</p>
              {app.aiConfidence !== undefined && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Confidence {Math.round(app.aiConfidence * 100)}%
                </p>
              )}
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium">Human decision</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {app.humanDecision ?? "Pending — an authorised officer makes the final decision."}
                </p>
              </div>
            </div>
          )}

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Where your file sits</h2>
            <NeuralGraph height={190} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
