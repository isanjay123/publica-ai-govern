import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

export const AI_MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class AiGatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has("X-Lovable-AIG-Run-ID")) headers.set("X-Lovable-AIG-Run-ID", runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
    if (!res.ok) {
      const body = await res.clone().text().catch(() => "");
      let msg = body;
      try {
        msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? body;
      } catch {
        /* keep text */
      }
      throw new AiGatewayError(res.status, msg || `AI request failed (${res.status})`);
    }
    return res;
  };
}

/** Streams the gateway call server-side and returns the final text. */
export async function runModel(system: string, messages: ModelMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGatewayError(401, "AI is not configured.");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let streamError: unknown;
  const result = streamText({
    model: provider.responses(AI_MODEL),
    system,
    messages,
    maxRetries: 0,
    onError: ({ error }) => {
      streamError = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (streamError) throw streamError;
  return text;
}

export function friendlyAiError(e: unknown): { status: number; message: string } {
  const err = e as { status?: number; statusCode?: number; message?: string; cause?: { status?: number } };
  const status = err?.status ?? err?.statusCode ?? err?.cause?.status ?? 500;
  if (status === 402) return { status, message: "Publica AI has used its available credits. Standard services keep working." };
  if (status === 429) return { status, message: "Publica AI is busy right now. Please try again in a moment." };
  return {
    status,
    message: "Publica AI is temporarily unavailable. You can continue using all standard government services.",
  };
}
