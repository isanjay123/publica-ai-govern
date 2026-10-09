import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Application,
  type Grievance,
  type IntegrityReport,
  type Role,
} from "@/lib/demo-data";
import { supabase } from "@/integrations/supabase/client";
import {
  getMe,
  listMyApplications,
  listMyGrievances,
  listMyNotifications,
  listStaffGrievances,
  listIntegrityReports,
  markNotificationsRead,
} from "@/lib/publica.functions";

export type Notification = {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

type Ctx = {
  role: Role;
  setRole: (r: Role) => void;
  language: string;
  setLanguage: (l: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  citizenName: string;
  setCitizenName: (n: string) => void;
  applications: Application[];
  addApplication: (app: Application) => void;
  updateApplication: (reference: string, patch: Partial<Application>) => void;
  grievances: Grievance[];
  addGrievance: (g: Grievance) => void;
  reports: IntegrityReport[];
  addReport: (r: IntegrityReport) => void;
  notifications: Notification[];
  notify: (title: string, body: string) => void;
  markAllRead: () => void;
  user: { id: string; email: string | null; avatarUrl: string | null } | null;
  realRoles: string[];
  authReady: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const PublicaContext = createContext<Ctx | null>(null);

export function PublicaProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("citizen");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [citizenName, setCitizenName] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [reports, setReports] = useState<IntegrityReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [user, setUser] = useState<{ id: string; email: string | null; avatarUrl: string | null } | null>(null);
  const [realRoles, setRealRoles] = useState<string[]>([]);
  const [authReady, setAuthReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [me, apps, griev, notes] = await Promise.all([
        getMe(),
        listMyApplications(),
        listMyGrievances(),
        listMyNotifications(),
      ]);
      if (me.fullName) setCitizenName(me.fullName);
      setUser((u) => (u ? { ...u, email: me.email || u.email, avatarUrl: me.avatarUrl || null } : u));
      if (me.preferredLanguage) setLanguage(me.preferredLanguage);
      setRealRoles(me.roles);
      setApplications(apps as Application[]);
      setNotifications(notes);
      const isStaff = me.roles.some((r) => r !== "citizen");
      const isOversight = me.roles.includes("oversight") || me.roles.includes("super_admin");
      const [staffGriev, reps] = await Promise.all([
        isStaff ? listStaffGrievances() : Promise.resolve([]),
        isOversight ? listIntegrityReports() : Promise.resolve([]),
      ]);
      setGrievances((isStaff ? staffGriev : griev) as Grievance[]);
      setReports(reps as unknown as IntegrityReport[]);
      const top = (["super_admin", "oversight", "dept_admin", "officer"] as const).find((r) => me.roles.includes(r));
      setRole((top ?? "citizen") as Role);
    } catch (e) {
      console.error("Could not load account data", e);
    }
  }, []);

  useEffect(() => {
    const apply = (u: { id: string; email?: string | null } | null) => {
      setUser(u ? { id: u.id, email: u.email ?? null, avatarUrl: null } : null);
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        apply(session?.user ?? null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) void refresh();
    else {
      setApplications([]);
      setGrievances([]);
      setReports([]);
      setNotifications([]);
      setRealRoles([]);
      setRole("citizen");
      setCitizenName("");
    }
  }, [user, refresh]);

  useEffect(() => {
    const stored = window.localStorage.getItem("publica-theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("publica-theme", theme);
  }, [theme]);

  const notify = useCallback((title: string, body: string) => {
    setNotifications((prev) => [
      { id: crypto.randomUUID(), title, body, at: "Just now", read: false },
      ...prev,
    ]);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      role,
      setRole,
      language,
      setLanguage,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      citizenName,
      setCitizenName,
      applications,
      addApplication: (app) => setApplications((prev) => [app, ...prev]),
      updateApplication: (reference, patch) =>
        setApplications((prev) => prev.map((a) => (a.reference === reference ? { ...a, ...patch } : a))),
      grievances,
      addGrievance: (g) => setGrievances((prev) => [g, ...prev]),
      reports,
      addReport: (r) => setReports((prev) => [r, ...prev]),
      notifications,
      notify,
      markAllRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        if (user) void markNotificationsRead();
      },
      user,
      realRoles,
      authReady,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [role, language, theme, citizenName, applications, grievances, reports, notifications, notify, user, realRoles, authReady, refresh],
  );

  return <PublicaContext.Provider value={value}>{children}</PublicaContext.Provider>;
}

export function usePublica() {
  const ctx = useContext(PublicaContext);
  if (!ctx) throw new Error("usePublica must be used inside PublicaProvider");
  return ctx;
}

export function nextReference(prefix: string) {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `${prefix}-2026-${String(n).slice(0, 6)}`;
}
