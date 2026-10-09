import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { listUsers, setUserRole } from "@/lib/publica.functions";
import { usePublica } from "@/lib/publica-store";

const ROLES = [
  ["officer", "Officer"],
  ["dept_admin", "Dept. admin"],
  ["oversight", "Oversight"],
  ["super_admin", "Super Admin"],
] as const;

export function UserRoles() {
  const { user } = usePublica();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const users = useQuery({ queryKey: ["admin-users", user?.id], queryFn: () => listUsers(), enabled: !!user });

  if (!user) return <p className="card-elevated p-6 text-sm text-muted-foreground">Sign in as a Super Admin to manage users.</p>;
  if (users.isLoading) return <p className="text-sm text-muted-foreground">Loading users…</p>;
  if (!users.data?.ok) return <p className="card-elevated p-6 text-sm text-muted-foreground">{users.data?.error ?? "Could not load users."}</p>;

  const list = users.data.users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  const toggle = async (userId: string, role: (typeof ROLES)[number][0], grant: boolean) => {
    setBusy(`${userId}:${role}`);
    const res = await setUserRole({ data: { userId, role, grant } });
    setBusy(null);
    if (!res.ok) {
      toast.error("Role not changed", { description: res.error ?? "" });
      return;
    }
    toast.success(grant ? "Role granted" : "Role removed", { description: "Recorded in the audit trail." });
    await qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="card-elevated p-6">
      <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-medium">User</th>
              {ROLES.map(([, label]) => (
                <th key={label} className="pb-2 text-center font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-medium">{u.name.slice(0, 1)}</span>
                    )}
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                {ROLES.map(([role, label]) => (
                  <td key={role} className="py-3 text-center">
                    <Checkbox
                      aria-label={`${label} for ${u.name}`}
                      checked={u.roles.includes(role)}
                      disabled={busy === `${u.id}:${role}`}
                      onCheckedChange={(v) => toggle(u.id, role, v === true)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Every account is a citizen. Changes take effect the next time that person opens Publica.</p>
    </div>
  );
}
