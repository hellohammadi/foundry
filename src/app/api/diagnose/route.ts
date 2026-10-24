import { runDiagnosis } from "@/lib/agents/diagnose";
import { clean, ndjson } from "@/lib/http";
import { isValidUserId, messagingEnabled, publish } from "@/lib/inbox";
import type { QA } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

// "Fix my business" mode, step 2: diagnosis + 30-day plan, streamed as agents work.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const problem = clean(body.problem, 1000);
  if (!problem || problem.length < 10) {
    return Response.json({ error: "Describe your problem in at least 10 characters." }, { status: 400 });
  }
  const answers: QA[] = (Array.isArray(body.answers) ? body.answers : [])
    .slice(0, 8)
    .map((a: { question?: unknown; answer?: unknown }) => ({ question: clean(a?.question, 300) ?? "", answer: clean(a?.answer, 500) ?? "" }))
    .filter((a: QA) => a.question);

  return ndjson(async (emit) => {
    const report = await runDiagnosis({ problem, answers }, emit);
    emit({ type: "diagnosis", report });
    if (isValidUserId(body.userId) && messagingEnabled()) {
      await publish(body.userId, {
        kind: "report",
        mode: "diagnose",
        title: `Diagnosis: ${problem.slice(0, 60)}`,
        summary: `Root cause: ${report.diagnosis.rootCause}`,
      }).catch((err) => console.error("History publish failed:", err.message));
    }
  });
}
