// All AI calls go through DNotifier (https://www.dnotifier.com). Agents receive an
// `AskFn` bound to the DNotifier workflow context, so every call is traced in the
// DNotifier workflow dashboard.

import { DNotifier } from "@dnotifier-realtime/dnotifier";

export const aiConfig = {
  appId: process.env.DNOTIFIER_APP_ID,
  secret: process.env.DNOTIFIER_SECRET,
  // Gemma 4: set DNOTIFIER_AI_PROVIDER=google_gemini (or ollama) once it is connected
  // in the DNotifier portal under AI Studio → Providers.
  provider: process.env.DNOTIFIER_AI_PROVIDER ?? "open_ai",
  model: process.env.DNOTIFIER_AI_MODEL ?? "gpt-4o-mini",
  userId: "foundry-server",
};

export type AskFn = (system: string, user: string, opts?: { temperature?: number; label?: string }) => Promise<string>;

export class LLMError extends Error {}

let client: Promise<DNotifier | null> | null = null;

// One shared, authenticated client per server instance. Resolves to null when
// credentials are missing or AI is not enabled, which switches Foundry to demo mode.
export function getNotifier(): Promise<DNotifier | null> {
  if (!aiConfig.appId || !aiConfig.secret) return Promise.resolve(null);
  client ??= (async () => {
    const notifier = new DNotifier({
      appId: aiConfig.appId,
      secret: aiConfig.secret,
      transport: "http",
      userId: aiConfig.userId,
      // Sends AI session and token usage to the DNotifier logs dashboard.
      logs: true,
      url: undefined,
      WebSocketImpl: undefined,
      onConnected: () => {},
      onMessage: () => {},
      onDisconnected: () => {},
    });
    try {
      await notifier.connect();
    } catch (err) {
      console.error("DNotifier connect failed:", (err as Error).message);
      client = null; // retry on the next request
      return null;
    }
    return notifier.aiEnabled ? notifier : null;
  })();
  return client;
}

// DNotifier replies with { data: { type, content } } or { data: { type: "error", message } }.
export function readContent(response: unknown): string {
  const data = (response as { data?: { type?: string; content?: unknown; message?: string } })?.data;
  if (data?.type === "error") throw new LLMError(data.message ?? "DNotifier AI error");
  if (typeof data?.content !== "string" || !data.content.trim()) throw new LLMError("DNotifier returned an empty reply");
  return data.content;
}

// Pulls the first JSON object out of a model reply (models often wrap it in prose or ```json fences).
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new LLMError("Model reply contained no JSON");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

// Asks for JSON and retries once with a stricter reminder if parsing fails.
export async function askJson<T>(ask: AskFn, system: string, user: string, label?: string): Promise<T> {
  const reply = await ask(system, user, { label });
  try {
    return parseJson<T>(reply);
  } catch {
    const retry = await ask(system + "\n\nIMPORTANT: Reply with ONE valid JSON object only. No prose, no markdown.", user, {
      temperature: 0.3,
      label: label && `${label} (retry)`,
    });
    return parseJson<T>(retry);
  }
}
