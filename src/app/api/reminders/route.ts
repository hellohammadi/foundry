import { clean } from "@/lib/http";
import { isValidUserId, messagingEnabled, publish } from "@/lib/inbox";

export const runtime = "nodejs";
export const maxDuration = 30;

type Week = { week: number; focus: string; tasks: { task: string }[] };

// Publishes one follow-up reminder per week of the 30-day plan to the user's DNotifier channel.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isValidUserId(body.userId)) return Response.json({ error: "Invalid user" }, { status: 400 });
  if (!messagingEnabled()) return Response.json({ error: "Reminders need DNotifier credentials" }, { status: 503 });
  const weeks: Week[] = (Array.isArray(body.weeks) ? body.weeks : []).slice(0, 4);
  if (!weeks.length) return Response.json({ error: "No plan to remind about" }, { status: 400 });

  const start = Date.now();
  for (const w of weeks) {
    const due = new Date(start + (Number(w.week) - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
    await publish(body.userId, {
      kind: "reminder",
      due,
      title: `Week ${w.week}: ${clean(w.focus, 120) ?? "Follow up"}`,
      tasks: (w.tasks ?? []).slice(0, 3).map((t) => clean(t?.task, 200) ?? "").filter(Boolean),
    });
  }
  return Response.json({ ok: true, count: weeks.length });
}
