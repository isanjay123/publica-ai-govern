import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { BellRing, Moon, ShieldCheck, Sun } from "lucide-react";
import { AppShell } from "@/components/publica/AppShell";
import { PageHeader } from "@/components/publica/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, ROLE_LABELS, type Role } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile and settings — Publica" },
      { name: "description", content: "Manage your Publica profile, language, notification channels and appearance." },
      { property: "og:title", content: "Profile and settings — Publica" },
      { property: "og:description", content: "Your Publica account preferences in one place." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { citizenName, setCitizenName, language, setLanguage, theme, toggleTheme, role, setRole, user } = usePublica();

  return (
    <AppShell>
      <PageHeader title="Profile and settings" subtitle="Your details, language and notification preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="card-elevated animate-rise p-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile saved");
          }}
        >
          <h2 className="text-base font-semibold">Personal details</h2>
          <div className="mt-4 space-y-4">
            {user && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {citizenName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{citizenName}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={citizenName} onChange={(e) => setCitizenName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? "demo.citizen@example.gov"} readOnly={!!user} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+91 90000 00000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dist">District</Label>
              <Input id="dist" defaultValue="Central" />
            </div>
            <Button type="submit">Save changes</Button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" /> Identity verified (demonstration)
          </p>
        </form>

        <div className="space-y-6">
          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Language</h2>
            <p className="mt-1 text-sm text-muted-foreground">Publica AI replies in your chosen language.</p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BellRing className="h-4 w-4 text-accent" /> Notifications
            </h2>
            <div className="mt-4 space-y-3">
              {[
                ["In-app notifications", true],
                ["Email updates", true],
                ["SMS updates", false],
              ].map(([label, on]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{label as string}</span>
                  <Switch defaultChecked={on as boolean} aria-label={label as string} />
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Appearance</h2>
            <Button variant="outline" className="mt-3 gap-2" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </Button>
          </div>

          <div className="card-elevated animate-rise p-6">
            <h2 className="text-base font-semibold">Demonstration role</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Switch roles to preview the officer, administrator and oversight workspaces.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <Badge
                  key={r}
                  onClick={() => setRole(r)}
                  variant={role === r ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 font-normal"
                >
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
