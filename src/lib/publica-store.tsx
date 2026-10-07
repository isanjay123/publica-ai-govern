import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  APPLICATIONS,
  GRIEVANCES,
  INTEGRITY_REPORTS,
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
  user: { id: string; email: string | null } | null;
  realRoles: string[];
  authReady: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const PublicaContext = createContext<Ctx | null>(null);

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Application moved to Officer Review", body: "PUB-2026-000184 is now with the assigned officer.", at: "Today, 3:05 PM", read: false },
  { id: "n2", title: "Additional document required", body: "PUB-2026-000189 needs a clearer income declaration.", at: "Today, 11:20 AM", read: false },
  { id: "n3", title: "Grievance assigned", body: "GRV-2026-000033 has been assigned to a reviewing officer.", at: "Yesterday", read: true },
];

export function PublicaProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("citizen");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [citizenName, setCitizenName] = useState("Aarav Menon");
  const [applications, setApplications] = useState<Application[]>(APPLICATIONS);
  const [grievances, setGrievances] = useState<Grievance[]>(GRIEVANCES);
  const [reports, setReports] = useState<IntegrityReport[]>(INTEGRITY_REPORTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

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
      setApplications([...(apps as Application[]), ...APPLICATIONS]);
      setGrievances([...griev, ...GRIEVANCES]);
      if (notes.length) setNotifications(notes);
    } catch (e) {
      console.error("Could not load account data", e);
    }
  }, []);

  useEffect(() => {
    const apply = (u: { id: string; email?: string | null } | null) => {
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
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
      setApplications(APPLICATIONS);
      setGrievances(GRIEVANCES);
      setNotifications(INITIAL_NOTIFICATIONS);
      setRealRoles([]);
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
