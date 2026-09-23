import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STAGES, type DelayFlag, DELAY_LABELS, type Stage } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  spark = [],
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string | number;
  change?: number;
  spark?: number[];
  tone?: "default" | "accent" | "warning" | "success";
  index?: number;
}) {
  const max = Math.max(...spark, 1);
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : "text-primary";
  return (
    <div
      className="card-elevated card-interactive animate-rise p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="font-display text-3xl font-semibold">{value}</span>
        {spark.length > 0 && (
          <svg viewBox="0 0 80 28" className={cn("h-8 w-20", toneClass)} aria-hidden>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              points={spark.map((v, i) => `${(i / (spark.length - 1)) * 78 + 1},${26 - (v / max) * 24}`).join(" ")}
            />
          </svg>
        )}
      </div>
      {change !== undefined && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            change >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {change >= 0 ? "+" : ""}
          {change}% vs last month
        </p>
      )}
    </div>
  );
}

export function StageTracker({ stage }: { stage: Stage }) {
  const current = STAGES.indexOf(stage);
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            className={cn(
              "animate-rise rounded-xl border p-3 transition-colors",
              active && "border-accent bg-accent-soft/40",
              done && "border-success/40",
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  done && "bg-success text-success-foreground",
                  active && "bg-accent text-accent-foreground animate-pulse-soft",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-xs font-medium", !done && !active && "text-muted-foreground")}>{s}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DelayBadge({ flag }: { flag: DelayFlag }) {
  const map: Record<DelayFlag, string> = {
    normal: "border-success/40 text-success",
    approaching_sla: "border-warning/50 text-warning",
    delayed: "border-destructive/40 text-destructive",
    highly_delayed: "border-destructive/60 text-destructive",
    anomalous: "border-accent/60 text-accent",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[flag])}>
      {DELAY_LABELS[flag]}
    </Badge>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card-elevated animate-fade grid place-items-center px-6 py-16 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
