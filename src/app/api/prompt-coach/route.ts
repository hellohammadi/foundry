import { analyzeText, CoachError, rewriteText, type CoachMode } from "@/lib/agents/promptcoach";
import { clean } from "@/lib/http";
import { isValidUserId } from "@/lib/inbox";

export const runtime = "nodejs";
export const maxDuration = 120;

// Prompt Coach: { action: "analyze" | "rewrite", mode, text, answers?, gaps? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = clean(body.text, 1000);
  const mode: CoachMode = body.mode === "diagnose" ? "diagnose" : "idea";
  const userId = isValidUserId(body.userId) ? body.userId : "foundry-anonymous";
  if (!text || text.length < 5) {
    return Response.json({ error: "Write a few words first, then I can help improve them." }, { status: 400 });
  }

  try {
    if (body.action === "rewrite") {
      const answers = (Array.isArray(body.answers) ? body.answers : [])
        .slice(0, 6)
        .map((a: { question?: unknown; answer?: unknown }) => ({ question: clean(a?.question, 200) ?? "", answer: clean(a?.answer, 400) ?? "" }))
        .filter((a: { question: string }) => a.question);
      const gaps = (Array.isArray(body.gaps) ? body.gaps : []).map((g: unknown) => clean(g, 120)).filter(Boolean).slice(0, 5) as string[];
      return Response.json(await rewriteText(text, mode, answers, gaps, userId));
    }
    return Response.json(await analyzeText(text, mode, userId));
  } catch (err) {
    const known = err instanceof CoachError;
    if (!known) console.error("Prompt Coach failed:", (err as Error).message);
    return Response.json({ error: known ? err.message : "Prompt Coach had a problem. Try again." }, { status: 502 });
  }
}
