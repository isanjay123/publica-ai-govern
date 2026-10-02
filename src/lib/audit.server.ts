import { createHash } from "crypto";

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

/** Recomputes a row hash exactly as the database trigger does. */
export function recomputeHash(row: {
  previous_hash: string | null;
  audit_id: string;
  occurred_at_text: string;
  user_id: string | null;
  role: string | null;
  application_id: string | null;
  action: string;
  reason: string | null;
  payload_text: string;
}) {
  const input = [
    row.previous_hash ?? "GENESIS",
    row.audit_id,
    row.occurred_at_text,
    row.user_id ?? "",
    row.role ?? "",
    row.application_id ?? "",
    row.action,
    row.reason ?? "",
    row.payload_text,
  ].join("|");
  return createHash("sha256").update(input, "utf8").digest("hex");
}
