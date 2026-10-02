type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

/** Appends an event. The database trigger computes previous_hash/current_hash. */
export async function appendAudit(
  admin: Admin,
  e: {
    userId: string | null;
    role: string;
    action: string;
    applicationId?: string | null;
    departmentId?: string | null;
    reason?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("audit_logs").insert({
    user_id: e.userId,
    role: e.role,
    action: e.action,
    application_id: e.applicationId ?? null,
    department_id: e.departmentId ?? null,
    reason: e.reason ?? null,
    payload: (e.payload ?? {}) as never,
  });
  if (error) console.error("audit append failed", error);
}

