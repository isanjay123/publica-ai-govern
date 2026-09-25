import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/publica/Logo";
import { NeuralGraph } from "@/components/publica/NeuralGraph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Publica" },
      { name: "description", content: "Sign in or register for Publica to apply for and track public services." },
      { property: "og:title", content: "Sign in — Publica" },
      { property: "og:description", content: "Secure access to Publica digital government services." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { setCitizenName } = usePublica();
  const [name, setName] = useState("");

  const submit = (mode: "signin" | "register") => (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && name.trim()) setCitizenName(name.trim());
    toast.success(mode === "signin" ? "Signed in to the demo workspace" : "Demo account created", {
      description: "Accounts are not yet connected to the live system.",
    });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-surface hidden flex-col justify-between p-10 lg:flex">
        <Logo />
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            One secure identity for every public service.
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Publica keeps your documents, applications and decisions in one traceable record — and shows you exactly
            where your file stands.
          </p>
          <div className="mt-8 rounded-xl bg-background/95 p-3">
            <NeuralGraph height={200} interactive={false} />
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4" /> Encrypted in transit · Role-based access · Append-only audit trail
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold">Welcome to Publica</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Transparent Governance. Accountable Services.</p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form className="space-y-4" onSubmit={submit("signin")}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form className="space-y-4" onSubmit={submit("register")}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remail">Email</Label>
                  <Input id="remail" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpassword">Password</Label>
                  <Input id="rpassword" type="password" placeholder="At least 8 characters" required />
                </div>
                <Button type="submit" className="w-full">
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-xs text-muted-foreground">
            This is a demonstration sign-in. Real accounts, identity verification and secure sessions are connected in
            the next step.{" "}
            <Link to="/dashboard" className="font-medium text-foreground underline underline-offset-4">
              Skip to the dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
