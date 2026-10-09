import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Check, Globe, Menu, Moon, Sun, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { FloatingAssistant } from "./AiAssistant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LANGUAGES, ROLE_LABELS, type Role } from "@/lib/demo-data";
import { usePublica } from "@/lib/publica-store";
import { cn } from "@/lib/utils";

const CITIZEN_NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/services", label: "Services" },
  { to: "/applications", label: "My Applications" },
  { to: "/grievances", label: "Grievances" },
  { to: "/integrity", label: "Integrity Reports" },
  { to: "/transparency", label: "Public Transparency" },
  { to: "/assistant", label: "AI Assistant" },
] as const;

const STAFF_NAV: Record<Exclude<Role, "citizen">, { to: string; label: string }[]> = {
  officer: [
    { to: "/officer", label: "Officer Desk" },
    { to: "/applications", label: "Applications" },
    { to: "/grievances", label: "Grievances" },
    { to: "/transparency", label: "Transparency" },
  ],
  dept_admin: [
    { to: "/admin", label: "Command Center" },
    { to: "/officer", label: "Officer Desk" },
    { to: "/transparency", label: "Transparency" },
  ],
  oversight: [
    { to: "/oversight", label: "Oversight Console" },
    { to: "/integrity", label: "Integrity Reports" },
    { to: "/transparency", label: "Transparency" },
  ],
  super_admin: [
    { to: "/admin", label: "Command Center" },
    { to: "/oversight", label: "Oversight Console" },
    { to: "/officer", label: "Officer Desk" },
    { to: "/transparency", label: "Transparency" },
  ],
};

export function AppShell({ children, requires }: { children: ReactNode; requires?: "signedIn" | Role[] }) {
  const { realRoles, authReady, role, setRole, language, setLanguage, theme, toggleTheme, notifications, markAllRead, citizenName, user, signOut } =
    usePublica();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const nav = role === "citizen" ? [...CITIZEN_NAV] : STAFF_NAV[role];

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {nav.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "relative whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px hidden h-0.5 rounded-full bg-accent xl:block" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b glass-panel">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo className="mb-6" />
              <nav className="flex flex-col gap-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>

          <Logo />

          <nav className="ml-4 hidden items-center gap-0.5 xl:flex">
            <NavLinks />
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  <button onClick={markAllRead} className="text-xs font-normal text-muted-foreground hover:text-foreground">
                    Mark all read
                  </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="px-2 py-2">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.at}</p>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Language">
                  <Globe className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">
                    {LANGUAGES.find((l) => l.code === language)?.label}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)} className="gap-2">
                    {language === l.code ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-xs font-semibold">{citizenName}</span>
                    <span className="block text-[10px] text-muted-foreground">{user?.email ?? ROLE_LABELS[role]}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {user && (
                  <>
                    <DropdownMenuLabel className="leading-tight">
                      <span className="block text-sm font-semibold">{citizenName}</span>
                      {user.email && <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                {realRoles.length > 1 && <DropdownMenuLabel>Workspace</DropdownMenuLabel>}
                {realRoles.length > 1 && (Object.keys(ROLE_LABELS) as Role[]).filter((r) => realRoles.includes(r)).map((r) => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)} className="gap-2">
                    {role === r ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                    {ROLE_LABELS[r]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile &amp; settings</Link>
                </DropdownMenuItem>
                {user ? (
                  <DropdownMenuItem onClick={() => void signOut()}>Sign out</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth">Sign in</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <AccessGate requires={requires} authReady={authReady} signedIn={!!user} roles={realRoles}>
          {children}
        </AccessGate>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>PUBLICA — Transparent Governance. Accountable Services.</span>
          <span className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {user ? "Signed in" : "Sign in to apply and track your work"}
            </Badge>
            Privacy by design · Append-only audit trail
          </span>
        </div>
      </footer>

      <FloatingAssistant />
    </div>
  );
}

function AccessGate({
  requires,
  authReady,
  signedIn,
  roles,
  children,
}: {
  requires?: "signedIn" | Role[] | undefined;
  authReady: boolean;
  signedIn: boolean;
  roles: string[];
  children: ReactNode;
}) {
  if (!requires) return <>{children}</>;
  if (!authReady) return <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!signedIn)
    return (
      <div className="card-elevated mx-auto mt-12 max-w-md p-8 text-center animate-rise">
        <h1 className="text-lg font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page shows your own records, so you need to be signed in.</p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in or create an account</Link>
        </Button>
      </div>
    );
  if (requires !== "signedIn" && roles.length > 0 && !requires.some((r) => roles.includes(r)))
    return (
      <div className="card-elevated mx-auto mt-12 max-w-md p-8 text-center animate-rise">
        <h1 className="text-lg font-semibold">Staff access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have the role needed for this page. A Super Admin can grant it.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard">Go to my dashboard</Link>
        </Button>
      </div>
    );
  if (requires !== "signedIn" && roles.length === 0) return <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>;
  return <>{children}</>;
}
