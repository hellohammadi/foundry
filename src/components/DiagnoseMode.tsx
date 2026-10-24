"use client";

import { AgentProgress, applyAgentEvent, DIAGNOSE_AGENTS, initialStatuses } from "@/components/AgentProgress";
import { DiagnosisView } from "@/components/DiagnosisView";
import type { IslandData } from "@/components/DynamicIsland";
import { inputClass } from "@/components/IdeaMode";
import { postStream } from "@/lib/client";
import type { DiagnosisReport, QA } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "We have lots of sales but no profit",
  "Customers buy once and never come back",
  "We're always short of cash even though we're growing",
];

type Message = { from: "agent" | "you"; text: string };
type Phase = "problem" | "loading" | "asking" | "running" | "done";

const GREETING = "Hi! I'm Foundry's Intake agent. What's the biggest problem in your business right now?";

export function DiagnoseMode({ userId, onDone, onIsland, anchorRef }: {
  userId: string | null;
  onDone: () => void;
  onIsland: (data: IslandData) => void;
  anchorRef: React.Ref<HTMLElement>;
}) {
  const [messages, setMessages] = useState<Message[]>([{ from: "agent", text: GREETING }]);
  const [phase, setPhase] = useState<Phase>("problem");
  const [problem, setProblem] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState(() => initialStatuses(DIAGNOSE_AGENTS));
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [lastLog, setLastLog] = useState<string | undefined>();
  const chatBox = useRef<HTMLDivElement>(null);

  // Keep the newest message in view inside the chat box only (never scroll the page,
  // so answering from the dynamic island doesn't jump you back up).
  useEffect(() => {
    const box = chatBox.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const say = (from: Message["from"], text: string) => setMessages((m) => [...m, { from, text }]);

  async function startIntake(text: string) {
    setProblem(text);
    say("you", text);
    setPhase("loading");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: text, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Intake failed");
      setQuestions(data.questions);
      say("agent", `Got it. I have ${data.questions.length} quick questions so we can find the real cause, not just the symptom.`);
      say("agent", data.questions[0]);
      setPhase("asking");
    } catch (err) {
      setError((err as Error).message);
      setPhase("problem");
    }
  }

  async function diagnose(allAnswers: QA[]) {
    say("agent", "Thanks! Handing over to the Diagnosis and Solution agents…");
    setPhase("running");
    setStatuses(initialStatuses(DIAGNOSE_AGENTS));
    try {
      await postStream("/api/diagnose", { problem, answers: allAnswers, userId }, (event) => {
        if (event.type === "diagnosis") setReport(event.report);
        else if (event.type === "error") setError(event.message);
        else {
          if (event.type === "log") setLastLog(event.message);
          setStatuses((s) => applyAgentEvent(s, event));
        }
      });
      setPhase("done");
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setPhase("asking");
    }
  }

  function answer(text: string) {
    const question = questions[answers.length];
    const next = [...answers, { question, answer: text }];
    setAnswers(next);
    say("you", text || "(skipped)");
    if (next.length < questions.length) say("agent", questions[next.length]);
    else void diagnose(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (phase === "problem") {
      if (text.length < 10) {
        setError("Describe your problem in at least 10 characters.");
        return;
      }
      void startIntake(text);
    } else if (phase === "asking") {
      if (!text) {
        setError("Type an answer, or press Skip.");
        return;
      }
      answer(text);
    }
    setDraft("");
    setError(null);
  }

  function restart() {
    setMessages([{ from: "agent", text: GREETING }]);
    setPhase("problem");
    setProblem("");
    setQuestions([]);
    setAnswers([]);
    setReport(null);
    setError(null);
  }

  const canType = phase === "problem" || phase === "asking";

  // Mirror the conversation in the dynamic island, and let it answer questions too.
  const agentsDone = Object.values(statuses).filter((st) => st?.status === "done").length;
  useEffect(() => {
    const base = { mode: "diagnose" as const, prompt: problem, draft: "" };
    if (phase === "problem") {
      onIsland({ ...base, status: "idle", placeholder: "Describe your business problem…", submitLabel: "Start", draft: problem, onSubmit: (t) => t.length >= 10 && void startIntake(t) });
    } else if (phase === "asking") {
      onIsland({
        ...base,
        status: "asking",
        label: questions[answers.length],
        progress: { done: answers.length, total: questions.length },
        placeholder: "Your answer…",
        submitLabel: "Send",
        onSubmit: (t) => answer(t),
        onSkip: () => answer(""),
      });
    } else if (phase === "done") {
      onIsland({ ...base, status: "done", result: report ? `Root cause: ${report.diagnosis.rootCause}` : undefined, placeholder: "Describe another problem…", submitLabel: "Diagnose", onSubmit: (t) => { restart(); if (t.length >= 10) void startIntake(t); } });
    } else {
      onIsland({ ...base, status: "running", label: phase === "loading" ? "Intake agent is writing questions…" : lastLog, progress: phase === "running" ? { done: agentsDone, total: DIAGNOSE_AGENTS.length } : undefined, placeholder: "", submitLabel: "" });
    }
    // The handlers only depend on the state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, problem, questions, answers, report, lastLog, agentsDone, userId]);

  return (
    <>
      <section ref={anchorRef} aria-label="Intake chat" className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <div ref={chatBox} className="max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  m.from === "you" ? "rounded-br-sm bg-accent text-accent-ink" : "rounded-bl-sm border border-line bg-surface-2"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {phase === "loading" && <p className="pulse-dot text-sm text-muted">Intake agent is thinking…</p>}
          {phase === "asking" && (
            <p className="text-xs text-muted">Question {answers.length + 1} of {questions.length}</p>
          )}
        </div>

        {phase === "problem" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setDraft(ex)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-ink">
                {ex}
              </button>
            ))}
          </div>
        )}

        {canType && (
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(null); }}
              placeholder={phase === "problem" ? "Describe your problem…" : "Your answer…"}
              className={inputClass}
              aria-label={phase === "problem" ? "Your problem" : "Your answer"}
            />
            {phase === "asking" && (
              <button type="button" onClick={() => answer("")} className="shrink-0 rounded-xl border border-line px-4 text-sm text-muted hover:border-accent">
                Skip
              </button>
            )}
            <button type="submit" className="shrink-0 rounded-xl btn-primary px-5 font-medium hover:opacity-90">
              Send
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
        {phase === "done" && (
          <button onClick={restart} className="mt-4 rounded-lg border border-line px-3 py-2 text-sm hover:border-accent">
            Diagnose another problem
          </button>
        )}
      </section>

      <div className="mt-8 space-y-5">
        {(phase === "running" || report) && <AgentProgress agents={DIAGNOSE_AGENTS} statuses={statuses} finished={phase === "done"} />}
        {report && <DiagnosisView report={report} userId={userId} onReminders={onDone} />}
      </div>
    </>
  );
}
