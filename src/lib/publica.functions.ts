import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const STAGE_BY_STATUS: Record<string, string> = {
  submitted: "Application Submitted",
  document_verification: "Document Verification",
  officer_review: "Officer Review",
  department_approval: "Department Approval",
  certificate_generation: "Certificate Generation",
  completed: "Completed",
  rejected: "Completed",
  additional_documents_required: "Document Verification",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  document_verification: "Documents under verification",
  officer_review: "Under officer review",
  department_approval: "Awaiting department approval",
  certificate_generation: "Certificate being generated",
  completed: "Completed",
  rejected: "Rejected",
  additional_documents_required: "Additional documents required",
};

const GRIEVANCE_LABEL: Record<string, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  under_review: "Under Review",
  response_prepared: "Response Prepared",
  resolved: "Resolved",
};

const REPORT_LABEL: Record<string, string> = {
  received: "Received",
  under_assessment: "Under assessment",
  investigating: "Investigating",
  action_taken: "Action taken",
  closed: "Closed",
};

function reference(prefix: string) {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return `${prefix}-2026-${String(n).padStart(6, "0")}`;
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function publicClient() {
  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    }),
  );
}

function daysBetween(a: string, b: Date) {
  return Math.max(0, Math.round((b.getTime() - new Date(a).getTime()) / 86400000));
}

function delayFlag(submittedAt: string, slaDeadline: string | null, done: boolean) {
  if (done || !slaDeadline) return "normal";
  const now = Date.now();
  const deadline = new Date(slaDeadline).getTime();
  const start = new Date(submittedAt).getTime();
  const span = Math.max(1, deadline - start);
  if (now > deadline + span * 0.5) return "highly_delayed";
  if (now > deadline) return "delayed";
  if ((now - start) / span > 0.8) return "approaching_sla";
  return "normal";
}

/* ------------------------------------------------------------------ */
/* Publica AI (grounded answers)                                       */
/* ------------------------------------------------------------------ */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  ml: "Malayalam",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
};

export const askPublica = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        question: z.string().trim().min(1).max(2000),
        language: z.string().max(8).default("en"),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
          .max(12)
          .default([]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { runModel, friendlyAiError } = await import("./ai.server");
    const sb = await publicClient();
    const [kb, rules, services] = await Promise.all([
      sb.from("knowledge_documents").select("title, source, content").limit(200),
      sb.from("government_rules").select("title, rule_text, citation, service_code").limit(200),
      sb.from("services").select("code, name, description, eligibility, required_documents, fee_amount, sla_days").limit(100),
    ]);

    type Doc = { title: string; source: string; text: string };
    const docs: Doc[] = [
      ...(kb.data ?? []).map((k) => ({ title: k.title, source: k.source, text: k.content })),
      ...(rules.data ?? []).map((r) => ({ title: r.title, source: r.citation ?? "Government rule", text: r.rule_text })),
      ...(services.data ?? []).map((s) => ({
        title: `${s.name} (service catalogue)`,
        source: `Service catalogue — ${s.code}`,
        text: `${s.description} Eligibility: ${s.eligibility}. Required documents: ${s.required_documents.join(", ")}. Fee: ${s.fee_amount}. Published service level: ${s.sla_days} days.`,
      })),
    ];

    const terms = data.question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2);
    const scored = docs
      .map((d) => {
        const hay = `${d.title} ${d.text}`.toLowerCase();
        return { d, score: terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0) };
      })
      .sort((a, b) => b.score - a.score);
    const retrieved = scored.filter((s) => s.score > 0).slice(0, 5).map((s) => s.d);

    const language = LANGUAGE_NAMES[data.language] ?? "English";
    const context = retrieved.length
      ? retrieved.map((d, i) => `[${i + 1}] ${d.title} — ${d.source}\n${d.text}`).join("\n\n")
      : "(no matching sources)";

    const system = `You are Publica AI, a government services assistant. Reply in ${language}.
Rules:
- Use ONLY the numbered sources below for facts about laws, policies, fees, deadlines, eligibility or documents. Never invent them.
- If the sources support the answer, begin with the ${language} equivalent of "Based on government policy:" and cite sources inline like [1].
- If the sources do not cover the question, begin with the ${language} equivalent of "I couldn't verify this information." and suggest contacting the department or filing a grievance.
- You provide guidance only. You never approve, reject or decide applications; authorised officers decide.
- Keep answers concise (under 180 words), plain language, short bullet points where helpful.

Sources:
${context}`;

    try {
      const answer = await runModel(system, [
        ...data.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: data.question },
      ]);
      const cited = retrieved.filter((_, i) => answer.includes(`[${i + 1}]`));
      return {
        ok: true as const,
        answer,
        sources: (cited.length ? cited : retrieved.slice(0, 2)).map((d) => d.source),
        grounded: retrieved.length > 0,
      };
    } catch (e) {
      console.error("askPublica failed", e);
      return { ok: false as const, error: friendlyAiError(e).message };
    }
  });

/* ------------------------------------------------------------------ */
/* Document verification (AI decision support)                        */
/* ------------------------------------------------------------------ */

export const verifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileName: z.string().max(255),
        mime: z.string().max(120),
        base64: z.string().max(14_000_000),
        serviceCode: z.string().max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { runModel, friendlyAiError, AI_MODEL } = await import("./ai.server");
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    const isDocx = /\.docx$/i.test(data.fileName);
    if (!allowed.includes(data.mime) && !isDocx) {
      return { ok: false as const, error: "Only PDF, JPG, PNG or DOCX files are accepted." };
    }

    const { data: service } = await context.supabase
      .from("services")
      .select("name, required_documents")
      .eq("code", data.serviceCode)
      .maybeSingle();
    const required = service?.required_documents ?? [];

    if (isDocx) {
      return {
        ok: true as const,
        result: {
          detectedType: "Word document",
          documentDetected: true,
          requiredInfoPresent: false,
          formatValid: true,
          needsReview: true,
          explanation: "Word files cannot be read automatically. An officer will review this document manually.",
          confidence: 0,
          model: "none",
        },
      };
    }

    const system = `You verify uploaded documents for a government service as DECISION SUPPORT only.
Service: ${service?.name ?? data.serviceCode}. Required documents: ${required.join(", ") || "unspecified"}.
Read the document (OCR it if it is an image) and reply with ONLY a JSON object, no prose:
{"detectedType": string (which required document this is, or "Unrecognised"),
 "documentDetected": boolean, "requiredInfoPresent": boolean, "formatValid": boolean,
 "needsReview": boolean, "explanation": string (one or two plain sentences, no personal data),
 "confidence": number between 0 and 1}
Never decide eligibility or approval. Do not repeat personal identifiers in the explanation.`;

    const part =
      data.mime === "application/pdf"
        ? { type: "file" as const, data: data.base64, mediaType: "application/pdf" }
        : { type: "image" as const, image: data.base64, mediaType: data.mime };

    try {
      const text = await runModel(system, [
        { role: "user", content: [{ type: "text", text: `File name: ${data.fileName}` }, part] },
      ]);
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json) as Record<string, unknown>;
      return {
        ok: true as const,
        result: {
          detectedType: String(parsed["detectedType"] ?? "Unrecognised"),
          documentDetected: Boolean(parsed["documentDetected"]),
          requiredInfoPresent: Boolean(parsed["requiredInfoPresent"]),
          formatValid: Boolean(parsed["formatValid"] ?? true),
          needsReview: Boolean(parsed["needsReview"] ?? true),
          explanation: String(parsed["explanation"] ?? ""),
          confidence: Math.min(1, Math.max(0, Number(parsed["confidence"] ?? 0))),
          model: AI_MODEL,
        },
      };
    } catch (e) {
      console.error("verifyDocument failed", e);
      return {
        ok: true as const,
        result: {
          detectedType: "Not checked",
          documentDetected: true,
          requiredInfoPresent: false,
          formatValid: true,
          needsReview: true,
          explanation: `${friendlyAiError(e).message} This document will be reviewed manually by an officer.`,
          confidence: 0,
          model: "unavailable",
        },
      };
    }
  });

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profileRow }, { data: roles }, { data: authData }] = await Promise.all([
      context.supabase.from("profiles").select("full_name, email, avatar_url, preferred_language").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.auth.getUser(),
    ]);
    const profile = profileRow as { full_name?: string; email?: string; avatar_url?: string; preferred_language?: string } | null;

    // Backfill profile from the identity provider (e.g. Google) when missing
    const meta = (authData.user?.user_metadata ?? {}) as Record<string, unknown>;
    const googleName = (meta["full_name"] ?? meta["name"]) as string | undefined;
    const googleAvatar = (meta["avatar_url"] ?? meta["picture"]) as string | undefined;
    const googleEmail = authData.user?.email ?? undefined;
    const patch: Record<string, string> = {};
    if ((!profile?.full_name || profile.full_name === "Citizen") && googleName) patch["full_name"] = googleName;
    if (!profile?.email && googleEmail) patch["email"] = googleEmail;
    if (!profile?.avatar_url && googleAvatar) patch["avatar_url"] = googleAvatar;
    if (Object.keys(patch).length) {
      await context.supabase.from("profiles").update(patch as never).eq("id", context.userId);
    }

    return {
      userId: context.userId,
      fullName: patch["full_name"] ?? profile?.full_name ?? "",
      email: patch["email"] ?? profile?.email ?? googleEmail ?? "",
      avatarUrl: patch["avatar_url"] ?? profile?.avatar_url ?? "",
      preferredLanguage: profile?.preferred_language ?? "en",
      roles: (roles ?? []).map((r) => r.role as string),
    };
  });

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select(
        "id, reference_id, status, applicant_name, district, officer_code, submitted_at, expected_completion_at, sla_deadline, completed_at, ai_recommendation, ai_confidence, human_decision, decision_reason, is_demo, citizen_id, services(code), departments(code), application_status_history(stage, action, actor_label, comment, created_at), application_documents(file_name, doc_type, document_verification_results(result))",
      )
      .eq("is_demo", false)
      .order("submitted_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const now = new Date();
    return (data ?? []).map((a) => {
      const dept = (a.departments as { code: string } | null)?.code ?? "";
      const done = a.status === "completed" || a.status === "rejected";
      const history = [...(a.application_status_history ?? [])].sort((x, y) => x.created_at.localeCompare(y.created_at));
      return {
        reference: a.reference_id,
        serviceCode: (a.services as { code: string } | null)?.code ?? "",
        applicant: a.applicant_name ?? "",
        district: a.district ?? "",
        stage: STAGE_BY_STATUS[a.status] ?? "Application Submitted",
        statusLabel: STATUS_LABEL[a.status] ?? a.status,
        officerCode: a.officer_code ?? "Awaiting assignment",
        submittedAt: a.submitted_at.slice(0, 10),
        expectedAt: (a.expected_completion_at ?? a.sla_deadline ?? a.submitted_at).slice(0, 10),
        slaDeadline: (a.sla_deadline ?? a.submitted_at).slice(0, 10),
        processingDays: daysBetween(a.submitted_at, a.completed_at ? new Date(a.completed_at) : now),
        delayFlag: delayFlag(a.submitted_at, a.sla_deadline, done),
        aiRecommendation: a.ai_recommendation ?? undefined,
        aiConfidence: a.ai_confidence ?? undefined,
        humanDecision: a.human_decision ? `${a.human_decision}${a.decision_reason ? ` — ${a.decision_reason}` : ""}` : undefined,
        timeline: history.map((h) => ({
          at: new Date(h.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
          stage: h.stage,
          action: h.action,
          actor: h.actor_label,
          department: dept,
          ...(h.comment ? { comment: h.comment } : {}),
        })),
        documents: (a.application_documents ?? []).map((d) => {
          const r = d.document_verification_results?.[0]?.result;
          return {
            name: d.file_name,
            type: d.doc_type ?? "Document",
            status: (r === "verified" ? "verified" : r === "flagged" ? "flagged" : "pending") as "verified" | "flagged" | "pending",
          };
        }),
        demo: false,
        mine: a.citizen_id === context.userId,
      };
    });
  });

const docInput = z.object({
  fileName: z.string().max(255),
  mime: z.string().max(120),
  size: z.number().int().nonnegative(),
  storagePath: z.string().max(500),
  verification: z
    .object({
      detectedType: z.string().max(200),
      requiredInfoPresent: z.boolean(),
      formatValid: z.boolean(),
      documentDetected: z.boolean(),
      needsReview: z.boolean(),
      explanation: z.string().max(2000),
      confidence: z.number().min(0).max(1),
      model: z.string().max(80),
    })
    .nullable(),
});

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        serviceCode: z.string().max(40),
        applicantName: z.string().trim().min(1).max(200),
        district: z.string().trim().min(1).max(100),
        notes: z.string().max(2000).default(""),
        documents: z.array(docInput).max(10).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: service, error: sErr } = await sb
      .from("services")
      .select("id, name, department_id, sla_days")
      .eq("code", data.serviceCode)
      .maybeSingle();
    if (sErr || !service) throw new Error("Service not found");

    const now = new Date();
    const deadline = new Date(now.getTime() + service.sla_days * 86400000).toISOString();
    const ref = reference("PUB");
    const flagged = data.documents.filter((d) => d.verification?.needsReview);

    const { data: app, error } = await sb
      .from("applications")
      .insert({
        reference_id: ref,
        citizen_id: context.userId,
        service_id: service.id,
        department_id: service.department_id,
        status: "document_verification",
        current_stage: "Document Verification",
        applicant_name: data.applicantName,
        district: data.district,
        form_data: { notes: data.notes } as never,
        expected_completion_at: deadline,
        sla_deadline: deadline,
        ai_recommendation: data.documents.length
          ? flagged.length
            ? `${flagged.length} of ${data.documents.length} documents need officer verification.`
            : "All uploaded documents passed automated checks. Officer review still required."
          : "No documents uploaded yet.",
      })
      .select("id")
      .single();
    if (error || !app) throw new Error(error?.message ?? "Could not create application");

    await sb.from("application_status_history").insert([
      { application_id: app.id, stage: "Application Submitted", action: "Application submitted", actor_label: "Citizen portal", department_id: service.department_id, comment: data.notes || null },
      { application_id: app.id, stage: "Document Verification", action: "Automated document checks completed", actor_label: "Publica document service", department_id: service.department_id },
    ]);

    for (const d of data.documents) {
      const { data: doc } = await sb
        .from("application_documents")
        .insert({
          application_id: app.id,
          uploaded_by: context.userId,
          file_name: d.fileName,
          storage_path: d.storagePath,
          mime_type: d.mime,
          size_bytes: d.size,
          doc_type: d.verification?.detectedType ?? null,
        })
        .select("id")
        .single();
      if (doc && d.verification) {
        await sb.from("document_verification_results").insert({
          document_id: doc.id,
          application_id: app.id,
          detected_type: d.verification.detectedType,
          checks: {
            documentDetected: d.verification.documentDetected,
            requiredInfoPresent: d.verification.requiredInfoPresent,
            formatValid: d.verification.formatValid,
          } as never,
          result: d.verification.needsReview ? "flagged" : "verified",
          explanation: d.verification.explanation,
          confidence: d.verification.confidence,
          model: d.verification.model,
          prompt_version: "doc-verify-v1",
          human_review_status: "pending",
        });
      }
    }

    await sb.from("notifications").insert({
      user_id: context.userId,
      title: "Application submitted",
      body: `${service.name} — ${ref} has moved to Document Verification.`,
      channel: "in_app",
      link: `/applications/${ref}`,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { appendAudit } = await import("./audit.server");
    await appendAudit(supabaseAdmin, {
      userId: context.userId,
      role: "citizen",
      action: "application.submitted",
      applicationId: app.id,
      departmentId: service.department_id,
      payload: { reference: ref, service: data.serviceCode, documents: data.documents.length },
    });

    return { reference: ref };
  });

export const officerDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        reference: z.string().max(40),
        decision: z.enum(["approve", "reject"]),
        reason: z.string().trim().min(3).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: isStaff } = await sb.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) return { ok: false as const, error: "Only authorised officers can record decisions." };

    const { data: app } = await sb
      .from("applications")
      .select("id, department_id, officer_code")
      .eq("reference_id", data.reference)
      .maybeSingle();
    if (!app) return { ok: false as const, error: "Application not found." };

    const approved = data.decision === "approve";
    const { error } = await sb
      .from("applications")
      .update({
        status: approved ? "certificate_generation" : "rejected",
        current_stage: approved ? "Certificate Generation" : "Completed",
        human_decision: approved ? "Approved" : "Rejected",
        decision_reason: data.reason,
        assigned_officer_id: context.userId,
        completed_at: approved ? null : new Date().toISOString(),
      })
      .eq("id", app.id);
    if (error) return { ok: false as const, error: error.message };

    await sb.from("application_status_history").insert({
      application_id: app.id,
      stage: approved ? "Certificate Generation" : "Completed",
      action: approved ? "Approved by authorised officer" : "Rejected by authorised officer",
      actor_label: app.officer_code ?? "Authorised officer",
      department_id: app.department_id,
      comment: data.reason,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { appendAudit } = await import("./audit.server");
    await appendAudit(supabaseAdmin, {
      userId: context.userId,
      role: "officer",
      action: approved ? "application.approved" : "application.rejected",
      applicationId: app.id,
      departmentId: app.department_id,
      reason: data.reason,
      payload: { reference: data.reference },
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Grievances                                                          */
/* ------------------------------------------------------------------ */

export const listMyGrievances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("grievances")
      .select("reference_id, category, subject, description, status, created_at, departments(code)")
      .eq("citizen_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map((g) => ({
      reference: g.reference_id,
      category: g.category,
      subject: g.subject,
      description: g.description,
      department: (g.departments as { code: string } | null)?.code ?? "",
      status: (GRIEVANCE_LABEL[g.status] ?? "Submitted") as
        | "Submitted"
        | "Acknowledged"
        | "Assigned"
        | "Under Review"
        | "Response Prepared"
        | "Resolved",
      createdAt: g.created_at.slice(0, 10),
    }));
  });

export const createGrievance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        category: z.string().max(60),
        departmentCode: z.string().max(10),
        subject: z.string().trim().min(3).max(200),
        description: z.string().trim().min(10).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: dept } = await context.supabase.from("departments").select("id").eq("code", data.departmentCode).maybeSingle();
    const ref = reference("GRV");
    const { data: row, error } = await context.supabase
      .from("grievances")
      .insert({
        reference_id: ref,
        citizen_id: context.userId,
        department_id: dept?.id ?? null,
        category: data.category,
        subject: data.subject,
        description: data.description,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not file grievance");
    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      title: "Grievance submitted",
      body: `${ref} has been received and will be acknowledged shortly.`,
      channel: "in_app",
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { appendAudit } = await import("./audit.server");
    await appendAudit(supabaseAdmin, {
      userId: context.userId,
      role: "citizen",
      action: "grievance.submitted",
      departmentId: dept?.id ?? null,
      payload: { reference: ref, category: data.category },
    });
    return { reference: ref };
  });

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("id, title, body, read, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      at: new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    }));
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("notifications").update({ read: true }).eq("user_id", context.userId).eq("read", false);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Integrity reports (anonymous)                                       */
/* ------------------------------------------------------------------ */

export const submitIntegrityReport = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        category: z.string().max(60),
        departmentCode: z.string().max(10),
        description: z.string().trim().min(10).max(5000),
        applicationReference: z.string().max(40).default(""),
        incidentAt: z.string().max(40).default(""),
        contact: z.string().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dept } = await supabaseAdmin.from("departments").select("id").eq("code", data.departmentCode).maybeSingle();
    const ref = reference("PRT");
    const accessCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32])
      .join("");
    const { error } = await supabaseAdmin.from("integrity_reports").insert({
      reference_id: ref,
      access_code_hash: await sha256Hex(`${ref}:${accessCode}`),
      category: data.category,
      description: data.description,
      department_id: dept?.id ?? null,
      application_reference: data.applicationReference || null,
      incident_at: data.incidentAt ? new Date(data.incidentAt).toISOString() : null,
      contact_info: data.contact || null,
    });
    if (error) throw new Error("Could not submit the report. Please try again.");
    const { appendAudit } = await import("./audit.server");
    await appendAudit(supabaseAdmin, {
      userId: null,
      role: "anonymous",
      action: "integrity_report.received",
      departmentId: dept?.id ?? null,
      payload: { reference: ref, category: data.category },
    });
    return { reference: ref, accessCode };
  });

export const checkIntegrityStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ reference: z.string().trim().max(40), accessCode: z.string().trim().max(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("integrity_reports")
      .select("status, updated_at, access_code_hash, is_demo")
      .eq("reference_id", data.reference.toUpperCase())
      .maybeSingle();
    const hash = await sha256Hex(`${data.reference.toUpperCase()}:${data.accessCode.toUpperCase()}`);
    if (!row || (!row.is_demo && row.access_code_hash !== hash)) {
      return { found: false as const };
    }
    return { found: true as const, status: REPORT_LABEL[row.status] ?? row.status, updatedAt: row.updated_at.slice(0, 10) };
  });

/* ------------------------------------------------------------------ */
/* Oversight                                                           */
/* ------------------------------------------------------------------ */

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, occurred_at, role, action, reason, previous_hash, current_hash, payload")
      .order("id", { ascending: false })
      .limit(50);
    if (error) return { ok: false as const, error: "You need an oversight or staff role to view the audit record." };
    return { ok: true as const, rows: data ?? [] };
  });

export const verifyAuditChain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("verify_audit_chain");
    if (error) return { ok: false as const, error: "You need an oversight or staff role to verify the chain." };
    const r = (data as { total: number; valid: boolean; first_broken_id: number | null }[])[0];
    return { ok: true as const, total: Number(r?.total ?? 0), valid: Boolean(r?.valid), firstBrokenId: r?.first_broken_id ?? null };
  });

/* ------------------------------------------------------------------ */
/* Public transparency (aggregates only)                               */
/* ------------------------------------------------------------------ */

export const getLiveStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [apps, griev] = await Promise.all([
    supabaseAdmin.from("applications").select("status, submitted_at, completed_at, sla_deadline").limit(5000),
    supabaseAdmin.from("grievances").select("status").limit(5000),
  ]);
  const rows = apps.data ?? [];
  const done = rows.filter((r) => r.status === "completed" || r.status === "rejected");
  const withinSla = done.filter((r) => r.completed_at && r.sla_deadline && r.completed_at <= r.sla_deadline);
  return {
    total: rows.length,
    completed: done.length,
    pending: rows.length - done.length,
    slaCompliance: done.length ? Math.round((withinSla.length / done.length) * 1000) / 10 : null,
    grievancesResolved: (griev.data ?? []).filter((g) => g.status === "resolved").length,
    grievancesOpen: (griev.data ?? []).filter((g) => g.status !== "resolved").length,
  };
});

/* ------------------------------------------------------------------ */
/* Staff work queues                                                   */
/* ------------------------------------------------------------------ */

export const listStaffGrievances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) return [];
    const { data } = await context.supabase
      .from("grievances")
      .select("reference_id, category, subject, description, status, created_at, departments(code)")
      .eq("is_demo", false)
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((g) => ({
      reference: g.reference_id,
      category: g.category,
      subject: g.subject,
      description: g.description,
      department: (g.departments as { code: string } | null)?.code ?? "",
      status: GRIEVANCE_LABEL[g.status] ?? "Submitted",
      createdAt: g.created_at.slice(0, 10),
    }));
  });

export const listIntegrityReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integrity_reports")
      .select("reference_id, category, description, status, created_at, departments(code)")
      .eq("is_demo", false)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return [];
    return (data ?? []).map((r) => ({
      reference: r.reference_id,
      category: r.category,
      description: r.description,
      department: (r.departments as { code: string } | null)?.code ?? "",
      status: REPORT_LABEL[r.status] ?? r.status,
      createdAt: r.created_at.slice(0, 10),
    }));
  });

/* ------------------------------------------------------------------ */
/* User & role management (super admin only)                           */
/* ------------------------------------------------------------------ */

const ROLE_VALUES = ["citizen", "officer", "dept_admin", "oversight", "super_admin"] as const;

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!ok) return { ok: false as const, error: "Only a Super Admin can manage users.", users: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email, avatar_url, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    return {
      ok: true as const,
      error: null,
      users: (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.email ?? "",
        avatarUrl: p.avatar_url ?? "",
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), role: z.enum(ROLE_VALUES), grant: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!ok) return { ok: false as const, error: "Only a Super Admin can change roles." };
    if (!data.grant && data.userId === context.userId && data.role === "super_admin")
      return { ok: false as const, error: "You can't remove your own Super Admin role." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = data.grant
      ? await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role", ignoreDuplicates: true })
      : await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (res.error) return { ok: false as const, error: res.error.message };
    const { appendAudit } = await import("./audit.server");
    await appendAudit(supabaseAdmin, {
      userId: context.userId,
      role: "super_admin",
      action: data.grant ? "role.granted" : "role.revoked",
      payload: { target: data.userId, role: data.role },
    });
    return { ok: true as const, error: null };
  });

/* ------------------------------------------------------------------ */
/* Detailed public aggregates                                          */
/* ------------------------------------------------------------------ */

export const getTransparencyData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: apps }, { data: depts }, { data: griev }] = await Promise.all([
    supabaseAdmin.from("applications").select("status, submitted_at, completed_at, sla_deadline, department_id").eq("is_demo", false).limit(10000),
    supabaseAdmin.from("departments").select("id, name"),
    supabaseAdmin.from("grievances").select("status").eq("is_demo", false).limit(10000),
  ]);
  const rows = apps ?? [];
  const isDone = (s: string) => s === "completed" || s === "rejected";
  const days = (r: { submitted_at: string; completed_at: string | null }) =>
    (new Date(r.completed_at ?? Date.now()).getTime() - new Date(r.submitted_at).getTime()) / 86400000;
  const done = rows.filter((r) => isDone(r.status));
  const inSla = (r: (typeof rows)[number]) => !!r.completed_at && !!r.sla_deadline && r.completed_at <= r.sla_deadline;
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const m = rows.filter((r) => r.submitted_at.startsWith(key));
    const c = m.filter((r) => isDone(r.status));
    return { month: d.toLocaleString("en", { month: "short" }), applications: m.length, completed: c.length, avgDays: avg(c.map(days)) };
  });
  const byDepartment = (depts ?? []).map((dep) => {
    const m = rows.filter((r) => r.department_id === dep.id);
    const c = m.filter((r) => isDone(r.status));
    return {
      department: dep.name.replace(/ Department$/, ""),
      applications: m.length,
      slaCompliance: c.length ? Math.round((c.filter(inSla).length / c.length) * 100) : 0,
      avgDays: avg(c.map(days)),
    };
  });
  const now = new Date().toISOString();
  const delayed = rows.filter((r) => !isDone(r.status) && r.sla_deadline && r.sla_deadline < now).length;
  const awaiting = rows.filter((r) => r.status === "additional_documents_required").length;
  return {
    kpis: {
      processed: done.length,
      avgProcessingDays: avg(done.map(days)),
      pending: rows.length - done.length,
      slaCompliance: done.length ? Math.round((done.filter(inSla).length / done.length) * 1000) / 10 : 0,
      grievancesResolved: (griev ?? []).filter((g) => g.status === "resolved").length,
      total: rows.length,
    },
    monthly,
    byDepartment,
    statusMix: [
      { name: "Completed", value: done.length },
      { name: "In progress", value: rows.length - done.length - awaiting - delayed },
      { name: "Awaiting citizen", value: awaiting },
      { name: "Delayed", value: delayed },
    ],
  };
});
