import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  FileCheck2,
  Fingerprint,
  Languages,
  LineChart,
  Lock,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/publica/Logo";
import { NeuralGraph } from "@/components/publica/NeuralGraph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TRANSPARENCY, SERVICES } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Publica — Transparent Governance. Accountable Services." },
      {
        name: "description",
        content:
          "Access public services, track every step, and interact with government through one secure digital platform powered by Publica AI.",
      },
      { property: "og:title", content: "Publica — Transparent Governance. Accountable Services." },
      {
        property: "og:description",
        content: "One secure platform for public service delivery, live tracking, grievances and oversight.",
      },
    ],
  }),
  component: Landing,
});

const HOW_IT_WORKS = [
  { icon: Fingerprint, title: "Verify once", body: "Create a secure identity and reuse it across every department." },
  { icon: FileCheck2, title: "Apply in minutes", body: "Guided forms tell you exactly which documents are required." },
  { icon: Workflow, title: "Track every step", body: "See the stage, the responsible department and the service deadline." },
  { icon: ShieldCheck, title: "Hold services accountable", body: "File grievances or report integrity concerns confidentially." },
];

const PILLARS = [
  {
    icon: Bot,
    title: "AI-Powered Services",
    body: "Publica AI explains eligibility, required documents and application status, grounded in published government rules. It never invents policy.",
  },
  {
    icon: LineChart,
    title: "Transparent Processing",
    body: "Every application carries a published service level, a live processing clock and a visible action history.",
  },
  {
    icon: Lock,
    title: "Secure Audit Trail",
    body: "Each official action is written to an append-only record chained with cryptographic hashes, so tampering is detectable.",
  },
  {
    icon: LineChart,
    title: "Public Transparency",
    body: "Anonymised department performance is published openly — volumes, processing times and service-level compliance.",
  },
  {
    icon: Languages,
    title: "Multilingual Access",
    body: "Ask questions and receive guidance in eight Indian languages, with room for more.",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-loop",
    body: "AI recommends, authorised officers decide. Both are recorded separately in the audit trail.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b glass-panel">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/services" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Services
            </Link>
            <Link to="/transparency" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Transparency
            </Link>
            <Link to="/assistant" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Publica AI
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-surface relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
          <div className="animate-rise">
            <Badge variant="outline" className="border-white/25 bg-white/10 text-[11px] font-medium tracking-wide text-white">
              AI-Powered Digital Governance Platform
            </Badge>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              PUBLICA
            </h1>
            <p className="mt-4 text-xl font-medium text-white/90">Transparent Governance. Accountable Services.</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
              Access public services, track every step, and interact with government through one secure digital
              platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild className="gap-2">
                <Link to="/services">
                  Explore Services <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="gap-2 border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/assistant">
                  <Bot className="h-4 w-4" /> Talk to Publica AI
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["Applications processed", TRANSPARENCY.kpis.processed.toLocaleString()],
                ["Average processing", `${TRANSPARENCY.kpis.avgProcessingDays} days`],
                ["Service-level compliance", `${TRANSPARENCY.kpis.slaCompliance}%`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wide text-white/55">{label}</dt>
                  <dd className="mt-1 font-display text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
            <p className="px-2 pb-1 pt-1 text-xs uppercase tracking-[0.18em] text-white/60">
              Governance network
            </p>
            <div className="rounded-xl bg-background/95 p-2">
              <NeuralGraph height={260} />
            </div>
            <p className="px-2 pt-3 text-xs text-white/60">
              Citizen → Application → Department → Officer → Verification → Approval → Service
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-semibold">How Publica works</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One verified identity, one queue, one visible record of every action taken on your file.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.title} className="card-elevated card-interactive animate-rise p-6" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold">Built for trust</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="card-elevated card-interactive animate-rise p-6" style={{ animationDelay: `${i * 60}ms` }}>
                <p.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Popular services</h2>
            <p className="mt-2 text-sm text-muted-foreground">Published fees, documents and service deadlines.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services">All services</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.slice(0, 6).map((s, i) => (
            <Link
              key={s.code}
              to="/services/$code"
              params={{ code: s.code }}
              className="card-elevated card-interactive animate-rise block p-5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Badge variant="outline">{s.category}</Badge>
              <h3 className="mt-3 text-base font-semibold">{s.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {s.slaDays} day service level · Fee {s.fee === 0 ? "free" : s.fee}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-4 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to use Publica?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create an account, or explore the demonstration workspace with sample data.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">Explore demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logo size="sm" />
          <p>PUBLICA — Transparent Governance. Accountable Services. Demonstration data only.</p>
        </div>
      </footer>
    </div>
  );
}
