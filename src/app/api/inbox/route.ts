import { isValidUserId, messagingEnabled, readInbox } from "@/lib/inbox";

export const runtime = "nodejs";
export const maxDuration = 30;

// Past reports and reminders for this browser's user, read from DNotifier chat history.
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!isValidUserId(userId)) return Response.json({ error: "Invalid user" }, { status: 400 });
  if (!messagingEnabled()) return Response.json({ enabled: false, items: [] });
  try {
    return Response.json({ enabled: true, items: await readInbox(userId) });
  } catch (err) {
    return Response.json({ enabled: true, items: [], error: (err as Error).message }, { status: 502 });
  }
}
