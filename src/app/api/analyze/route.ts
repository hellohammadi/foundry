import { runFoundry } from "@/lib/agents/pipeline";
import type { IdeaInput, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function clean(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

// Streams agent progress as newline-delimited JSON, ending with the full report.
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const report = await runFoundry(input, emit);
        emit({ type: "report", report });
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
