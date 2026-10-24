"use client";

import { AgentProgress, applyAgentEvent, IDEA_AGENTS, initialStatuses } from "@/components/AgentProgress";
import type { IslandData } from "@/components/DynamicIsland";
import { ReportView } from "@/components/ReportView";
import { postStream } from "@/lib/client";
import type { Report } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "A subscription box of home-brewed Indian chai blends for office workers",
  "Eco-friendly pet grooming van that visits customers at home",
  "An app that matches retired teachers with kids who need tutoring",
];

export const inputClass = "w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent";

export function IdeaMode({ userId, onDone, onIsland, anchorRef }: {
  userId: string | null;
  onDone: () => void;
  onIsland: (data: IslandData) => void;
  anchorRef: React.Ref<HTMLFormElement>;
}) {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState(() => initialStatuses(IDEA_AGENTS));
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<string | undefined>();
  const resultsRef = useRef<HTMLDivElement>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    await run(idea);
  }

  async function run(text: string) {
    if (text.trim().length < 10) {
      setError("Describe your idea in at least 10 characters.");
      return;
    }
    setIdea(text);
    setLastLog(undefined);
    setRunning(true);
    setError(null);
    setReport(null);
    setStatuses(initialStatuses(IDEA_AGENTS));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      await postStream("/api/analyze", { idea: text, audience, location, budget, userId }, (event) => {
        if (event.type === "report") setReport(event.report);
        else if (event.type === "error") setError(event.message);
        else {
          if (event.type === "log") setLastLog(event.message);
          setStatuses((s) => applyAgentEvent(s, event));
        }
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  // Mirror the prompt and progress in the dynamic island.
  const done = Object.values(statuses).filter((st) => st?.status === "done").length;
  useEffect(() => {
    onIsland({
      mode: "idea",
      prompt: idea.trim(),
      status: running ? "running" : report ? "done" : "idle",
      progress: { done, total: IDEA_AGENTS.length },
      label: lastLog,
      result: report ? `${report.brand.recommended} · ${report.potential.score}/100 potential` : undefined,
      placeholder: "Describe your business idea…",
      submitLabel: report ? "Run again" : "Discover",
      onSubmit: running ? undefined : (text) => void run(text),
      draft: idea,
    });
    // run() only changes when inputs change, which are already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea, running, report, done, lastLog, audience, location, budget, userId]);

  return (
    <>
      <form ref={anchorRef} onSubmit={analyze} className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <label className="block">
          <span className="mb-2 block font-medium">What&apos;s your business idea?</span>
          <textarea
            value={idea}
            onChange={(e) => { setIdea(e.target.value); setError(null); }}
            rows={3}
            placeholder="e.g. A subscription box of home-brewed Indian chai blends for office workers"
            className={inputClass}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setIdea(ex)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-ink">
              {ex}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target customers (optional)" className={inputClass} />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" className={inputClass} />
          <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Starting budget (optional)" className={inputClass} />
        </div>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <button
          type="submit"
          disabled={running}
          className="w-full rounded-xl btn-primary px-5 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {running ? "Agents at work…" : "Discover my potential"}
        </button>
      </form>

      <div ref={resultsRef} className="mt-8 scroll-mt-6 space-y-5">
        {(running || report) && <AgentProgress agents={IDEA_AGENTS} statuses={statuses} finished={!running && Boolean(report)} />}
        {report && <ReportView report={report} />}
      </div>
    </>
  );
}
