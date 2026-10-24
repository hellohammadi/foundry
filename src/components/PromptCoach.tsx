"use client";
// Prompt Coach panel: scores what the founder typed, asks 2-4 quick questions,
// and rewrites it so Foundry's agents get a clearer brief.
import type { CoachAnalysis, CoachMode, CoachRewrite } from "@/lib/agents/promptcoach";
import { useState } from "react";

type Phase = "idle" | "analyzing" | "questions" | "rewriting" | "result";

async function coach<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/prompt-coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 7 ? "bg-ok-soft text-ok" : score >= 4 ? "bg-accent-soft text-accent" : "bg-bad-soft text-bad";
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-sm font-semibold ${tone}`}>{score}/10</span>;
}

export function PromptCoach({ mode, text, userId, onUse, disabled }: {
  mode: CoachMode;
  text: string;
  userId: string | null;
  onUse: (improved: string) => void;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CoachRewrite | null>(null);
  const [edited, setEdited] = useState("");
  const [original, setOriginal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = phase === "analyzing" || phase === "rewriting";

  async function analyze() {
    const value = text.trim();
    if (value.length < 5) {
      setError(mode === "idea" ? "Type your idea first, then I can help improve it." : "Describe your problem first, then I can help improve it.");
      return;
    }
    setError(null);
    setOriginal(value);
    setAnswers({});
    setResult(null);
    setPhase("analyzing");
    try {
      const a = await coach<CoachAnalysis>({ action: "analyze", mode, text: value, userId });
      setAnalysis(a);
      if (a.questions.length) setPhase("questions");
      else await rewrite(a, {});
    } catch (err) {
      setError((err as Error).message);
      setPhase("idle");
    }
  }

  async function rewrite(a: CoachAnalysis, given: Record<string, string>) {
    setPhase("rewriting");
    setError(null);
    try {
      const r = await coach<CoachRewrite>({
        action: "rewrite",
        mode,
        text: original || text.trim(),
        answers: a.questions.map((q) => ({ question: q.question, answer: given[q.id] ?? "" })),
        gaps: a.topGaps,
        userId,
      });
      setResult(r);
      setEdited(r.rewritten);
      setPhase("result");
    } catch (err) {
      setError((err as Error).message);
      setPhase("questions");
    }
  }

  function close() {
    setPhase("idle");
    setAnalysis(null);
    setResult(null);
    setError(null);
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={analyze}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <span aria-hidden="true">✨</span> Improve with Prompt Coach
        </button>
        <span className="text-xs text-muted">Get a score, answer a few quick questions, and get a clearer version.</span>
        {error && <p role="alert" className="w-full text-sm text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <section aria-label="Prompt Coach" aria-live="polite" className="space-y-4 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">
          <span aria-hidden="true">✨</span> Prompt Coach
        </p>
        <button type="button" onClick={close} className="text-xs text-muted hover:text-ink">
          Close
        </button>
      </div>

      {phase === "analyzing" && <p className="pulse-dot text-sm text-muted">Checking what the agents will need… (about 10 seconds)</p>}

      {analysis && phase !== "analyzing" && (
        <div className="flex items-start gap-3">
          <ScoreBadge score={analysis.score} />
          <p className="text-sm">{analysis.verdict}</p>
        </div>
      )}

      {analysis && phase === "questions" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void rewrite(analysis, answers);
          }}
          className="space-y-4"
        >
          {analysis.questions.map((q) => (
            <fieldset key={q.id} className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{q.question}</legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const picked = answers[q.id] === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => setAnswers((s) => ({ ...s, [q.id]: picked ? "" : o }))}
                      className={`rounded-full border px-3 py-1 text-xs ${picked ? "border-accent bg-accent-soft text-ink" : "border-line text-muted hover:border-accent hover:text-ink"}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              <input
                value={q.options.includes(answers[q.id] ?? "") ? "" : (answers[q.id] ?? "")}
                onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                placeholder="Or type your own answer (optional)"
                aria-label={`Your own answer: ${q.question}`}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </fieldset>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-xl btn-primary px-4 py-2 text-sm font-medium hover:opacity-90">
              Write my improved version
            </button>
            <span className="self-center text-xs text-muted">Skip any question you like.</span>
          </div>
        </form>
      )}

      {phase === "rewriting" && <p className="pulse-dot text-sm text-muted">Writing your improved version…</p>}

      {result && phase === "result" && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">Improved version (you can edit it)</span>
            <textarea
              value={edited}
              onChange={(e) => setEdited(e.target.value.slice(0, 1000))}
              rows={5}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          {/\[[^\]]+\]/.test(edited) && (
            <p className="text-xs text-muted">Replace the [bracketed] parts with your real details for the best results.</p>
          )}
          {result.changes.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">What changed and why</p>
              <ul className="space-y-1 text-sm">
                {result.changes.map((c) => (
                  <li key={c.what}>
                    <span className="font-medium">{c.what}:</span> <span className="text-muted">{c.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onUse(edited.trim());
                close();
              }}
              className="rounded-xl btn-primary px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Use this version
            </button>
            <button type="button" onClick={close} className="rounded-xl border border-line px-4 py-2 text-sm hover:border-accent">
              Keep mine
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <p className="text-[11px] text-muted">
        Powered by <a href="https://github.com/hellohammadi/prompt-coach" target="_blank" rel="noreferrer" className="underline underline-offset-2">Prompt Coach</a>
        {result?.source === "dnotifier" || analysis?.source === "dnotifier" ? " · via DNotifier AI" : " · Gemma 4"}
      </p>
    </section>
  );
}
