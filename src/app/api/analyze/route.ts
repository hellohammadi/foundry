import { runFoundry } from "@/lib/agents/pipeline";
import { clean, ndjson } from "@/lib/http";
import { isValidUserId, messagingEnabled, publish } from "@/lib/inbox";
import type { IdeaInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

// "Start a business" mode: streams agent progress, ending with the full report.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idea = clean(body.idea, 1000);
  if (!idea || idea.length < 10) {
    return Response.json({ error: "Describe your idea in at least 10 characters." }, { status: 400 });
  }
  const input: IdeaInput = {
    idea,
    audience: clean(body.audience, 200),
    location: clean(body.location, 100),
    budget: clean(body.budget, 100),
  };

  return ndjson(async (emit) => {
    const report = await runFoundry(input, emit);
    emit({ type: "report", report });
    if (isValidUserId(body.userId) && messagingEnabled()) {
      await publish(body.userId, {
        kind: "report",
        mode: "idea",
        title: `${report.brand.recommended}: ${report.potential.score}/100 potential`,
        summary: report.brief.summary,
      }).catch((err) => console.error("History publish failed:", err.message));
    }
  });
}
