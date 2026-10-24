"use client";

import { AgentProgress, applyAgentEvent, IDEA_AGENTS, initialStatuses } from "@/components/AgentProgress";
import { CaseBar, useCases } from "@/components/Cases";
import type { IslandData } from "@/components/DynamicIsland";
import { IdeaCompare, type IdeaCase } from "@/components/IdeaCompare";
import { ReportView } from "@/components/ReportView";
import { postStream } from "@/lib/client";
import type { IdeaInput } from "@/lib/types";
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
  anchorRef: React.RefObject<HTMLFormElement | null>;
}) {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState(() => initialStatuses(IDEA_AGENTS));
  const [error, setError] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<string | undefined>();
  // Each run becomes a new case; earlier cases are kept for comparison.
  const { cases, add, remove } = useCases<IdeaCase>("foundry-idea-cases");
  const [selected, setSelected] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const current = cases.find((c) => c.id === selected) ?? (selected === "compare" ? null : cases.at(-1));
  const comparing = selected === "compare" && cases.length >= 2;

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    await run(idea);
  }

  async function run(text: string) {
    if (text.trim().length < 10) {
      setError("Describe your idea in at least 10 characters.");
      return;
    }
    const input: IdeaInput = { idea: text.trim(), audience, location, budget };
    setIdea(text);
    setLastLog(undefined);
    setRunning(true);
    setError(null);
    setStatuses(initialStatuses(IDEA_AGENTS));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      await postStream("/api/analyze", { ...input, userId }, (event) => {
        if (event.type === "report") setSelected(add({ input, report: event.report }).id);
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

  // Loads a case's inputs back into the form so the founder can tweak and re-run.
  function editCase(input: IdeaInput) {
    setIdea(input.idea);
    setAudience(input.audience ?? "");
    setLocation(input.location ?? "");
    setBudget(input.budget ?? "");
    const form = anchorRef.current;
    if (form) window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }

  // Mirror the prompt and progress in the dynamic island.
  const done = Object.values(statuses).filter((st) => st?.status === "done").length;
  const shown = current?.data.report;
  useEffect(() => {
    onIsland({
      mode: "idea",
      prompt: idea.trim(),
      status: running ? "running" : shown || comparing ? "done" : "idle",
      progress: { done, total: IDEA_AGENTS.length },
      label: lastLog,
      result: shown ? `Case ${current?.n} · ${shown.brand.recommended} · ${shown.potential.score}/100` : comparing ? `Comparing ${cases.length} cases` : undefined,
      placeholder: "Describe your business idea…",
      submitLabel: cases.length ? "Run as new case" : "Discover",
      onSubmit: running ? undefined : (text) => void run(text),
      draft: idea,
    });
    // run() only changes when inputs change, which are already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea, running, shown, done, lastLog, audience, location, budget, userId, cases.length, comparing]);

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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={running}
            className="w-full rounded-xl btn-primary px-5 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {running ? "Agents at work…" : cases.length ? `Evaluate as Case ${(cases.at(-1)?.n ?? 0) + 1}` : "Discover my potential"}
          </button>
          {cases.length > 0 && !running && (
            <span className="text-sm text-muted">Change any field and evaluate again. Your earlier cases are kept for comparison.</span>
          )}
        </div>
      </form>

      <div ref={resultsRef} className="mt-8 scroll-mt-24 space-y-5">
        <CaseBar
          tabs={cases.map((c) => ({ id: c.id, n: c.n, title: c.data.report.brand.recommended, score: c.data.report.potential.score }))}
          selected={comparing ? "compare" : current?.id ?? null}
          onSelect={setSelected}
          onRemove={(id) => { remove(id); if (selected === id) setSelected(null); }}
          running={running}
        />
        {running && <AgentProgress agents={IDEA_AGENTS} statuses={statuses} />}
        {!running && comparing && <IdeaCompare cases={cases} />}
        {!running && !comparing && current && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-muted">
                <span className="font-medium text-ink">Case {current.n}</span> · “{current.data.input.idea}”
                {current.data.input.location ? ` · ${current.data.input.location}` : ""}
              </p>
              <button onClick={() => editCase(current.data.input)} className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
                ✎ Edit inputs &amp; re-run
              </button>
            </div>
            <ReportView key={current.id} report={current.data.report} />
          </>
        )}
      </div>
    </>
  );
}
