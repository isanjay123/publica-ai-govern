import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type GraphNode = { id: string; label: string; x: number; y: number };

const DEFAULT_NODES: GraphNode[] = [
  { id: "citizen", label: "Citizen", x: 60, y: 130 },
  { id: "application", label: "Application", x: 190, y: 60 },
  { id: "department", label: "Department", x: 330, y: 140 },
  { id: "officer", label: "Officer", x: 470, y: 62 },
  { id: "verification", label: "Verification", x: 470, y: 205 },
  { id: "approval", label: "Approval", x: 610, y: 130 },
  { id: "service", label: "Service", x: 740, y: 130 },
];

const EDGES: [string, string][] = [
  ["citizen", "application"],
  ["application", "department"],
  ["department", "officer"],
  ["department", "verification"],
  ["officer", "approval"],
  ["verification", "approval"],
  ["approval", "service"],
];

export function NeuralGraph({
  nodes = DEFAULT_NODES,
  activeId,
  className,
  height = 280,
  interactive = true,
}: {
  nodes?: GraphNode[];
  activeId?: string;
  className?: string;
  height?: number;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % nodes.length), 1600);
    return () => clearInterval(t);
  }, [nodes.length]);

  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const focus = hovered ?? activeId ?? nodes[pulse]?.id;

  return (
    <div className={cn("w-full overflow-hidden", className)} style={{ height }}>
      <svg viewBox="0 0 800 270" className="h-full w-full" role="img" aria-label="Publica governance network">
        <defs>
          <linearGradient id="pub-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {EDGES.filter(([a, b]) => nodes.some((n) => n.id === a) && nodes.some((n) => n.id === b)).map(([a, b]) => {
          const from = byId(a);
          const to = byId(b);
          const active = focus === a || focus === b;
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--color-border)"
                strokeWidth={active ? 2 : 1.2}
              />
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="url(#pub-edge)"
                strokeWidth={active ? 2.4 : 1.4}
                className="flow-dash"
                opacity={active ? 0.95 : 0.4}
              />
            </g>
          );
        })}

        {nodes.map((n) => {
          const active = focus === n.id;
          return (
            <g
              key={n.id}
              onMouseEnter={() => interactive && setHovered(n.id)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={interactive ? "cursor-pointer" : undefined}
            >
              {active && (
                <circle cx={n.x} cy={n.y} r={22} fill="var(--color-accent)" opacity={0.14} className="animate-pulse-soft" />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={active ? 12 : 9}
                fill={active ? "var(--color-accent)" : "var(--color-primary)"}
                stroke="var(--color-background)"
                strokeWidth={3}
                style={{ transition: "all 220ms cubic-bezier(0.22,1,0.36,1)" }}
              />
              <text
                x={n.x}
                y={n.y + 32}
                textAnchor="middle"
                fontSize="12"
                fontWeight={active ? 600 : 500}
                fill={active ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
