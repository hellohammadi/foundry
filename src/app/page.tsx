"use client";

import { AGENT_INFO, AgentProgress, type AgentStatus } from "@/components/AgentProgress";
import { ReportView } from "@/components/ReportView";
import type { AgentId, Report, StreamEvent } from "@/lib/types";
import { useRef, useState } from "react";

const EXAMPLES = [
  "A subscription box of home-brewed Indian chai blends for office workers",
  "Eco-friendly pet grooming van that visits customers at home",
  "An app that matches retired teachers with kids who need tutoring",
];

const initialStatuses = () =>
  Object.fromEntries(AGENT_INFO.map((a) => [a.id, { status: "waiting" }])) as Record<AgentId, AgentStatus>;

export default function Home() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handle(event: StreamEvent) {
    if (event.type === "agent") {
      setStatuses((s) => ({ ...s, [event.agent]: { ...s[event.agent], status: event.status } }));
    } else if (event.type === "log") {
      setStatuses((s) => ({ ...s, [event.agent]: { ...s[event.agent], log: event.message } }));
    } else if (event.type === "report") {
      setReport(event.report);
    } else if (event.type === "error") {
      setError(event.message);
    }
  }

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (idea.trim().length < 10) {
      setError("Describe your idea in at least 10 characters.");
      return;
    }
    setRunning(true);
    setError(null);
    setReport(null);
    setStatuses(initialStatuses());
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, audience, location, budget }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handle(JSON.parse(line));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <p className="mb-3 inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          Open source · Agents powered by DNotifier
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Discover your <span className="text-accent">business potential</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Share your idea. A team of AI agents names it, checks domains and handles, finds your unique edge, and plans
          your social media and automations.
        </p>
      </header>

      <form onSubmit={analyze} className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <label className="block">
          <span className="mb-2 block font-medium">What&apos;s your business idea?</span>
          <textarea
            value={idea}
            onChange={(e) => { setIdea(e.target.value); setError(null); }}
            rows={3}
            placeholder="e.g. A subscription box of home-brewed Indian chai blends for office workers"
            className={input}
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
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target customers (optional)" className={input} />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" className={input} />
          <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Starting budget (optional)" className={input} />
        </div>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <button
          type="submit"
          disabled={running}
          className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-black sm:w-auto"
        >
          {running ? "Agents at work…" : "Discover my potential"}
        </button>
      </form>

      <div ref={resultsRef} className="mt-8 scroll-mt-6 space-y-5">
        {(running || report) && <AgentProgress statuses={statuses} />}
        {report && <ReportView report={report} />}
      </div>

      <footer className="mt-16 text-center text-sm text-muted">
        <a href="https://github.com/hellohammadi/foundry" className="underline" target="_blank" rel="noreferrer">
          Foundry on GitHub
        </a>{" "}
        · MIT licensed · Built for Hacktoberfest
      </footer>
    </main>
  );
}
