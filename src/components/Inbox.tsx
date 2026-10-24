"use client";

import type { InboxItem } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

// History and reminders, stored for this browser's user via DNotifier messaging.
export function Inbox({ userId, refreshKey }: { userId: string | null; refreshKey: number }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "disabled" | "error">("loading");

  const load = useCallback(async () => {
    if (!userId) return;
    setState("loading");
    try {
      const res = await fetch(`/api/inbox?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!data.enabled) return setState("disabled");
      setItems(data.items ?? []);
      setState(res.ok ? "ready" : "error");
    } catch {
      setState("error");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (state === "disabled") return null;

  const today = new Date().toISOString().slice(0, 10);
  const reminders = items.filter((i) => i.kind === "reminder").sort((a, b) => (a.kind === "reminder" && b.kind === "reminder" ? a.due.localeCompare(b.due) : 0));
  const reports = items.filter((i) => i.kind === "report");

  return (
    <section aria-label="History and reminders" className="mt-16 rounded-3xl border border-line bg-surface shadow-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your history &amp; reminders</h2>
        <button onClick={load} className="text-sm text-accent">Refresh</button>
      </div>
      {state === "loading" && <p className="pulse-dot text-sm text-muted">Loading from DNotifier…</p>}
      {state === "error" && <p className="text-sm text-bad">Couldn&apos;t load your history right now.</p>}
      {state === "ready" && items.length === 0 && (
        <p className="text-sm text-muted">Nothing yet. Your reports and plan reminders will appear here.</p>
      )}
      {state === "ready" && items.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Reminders</h3>
            {reminders.length === 0 && <p className="text-sm text-muted">No reminders yet.</p>}
            <ul className="space-y-2">
              {reminders.map((r) =>
                r.kind === "reminder" ? (
                  <li key={r.id} className={`rounded-lg border p-3 text-sm ${r.due <= today ? "border-accent bg-accent-soft" : "border-line"}`}>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{r.due <= today ? "Due now" : `Due ${r.due}`}</p>
                    <ul className="mt-1 list-disc pl-5 text-muted">{r.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Past reports</h3>
            {reports.length === 0 && <p className="text-sm text-muted">No reports yet.</p>}
            <ul className="space-y-2">
              {reports.map((r) =>
                r.kind === "report" ? (
                  <li key={r.id} className="rounded-lg border border-line p-3 text-sm">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-muted">{r.summary}</p>
                    <p className="text-xs text-muted">{r.mode === "idea" ? "Start a business" : "Fix my business"} · {new Date(r.at).toLocaleString()}</p>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
