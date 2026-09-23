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
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    }),
    [role, language, theme, citizenName, applications, grievances, reports, notifications, notify],
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
