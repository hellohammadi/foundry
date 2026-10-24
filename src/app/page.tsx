"use client";

import { DiagnoseMode } from "@/components/DiagnoseMode";
import { DynamicIsland, type IslandData } from "@/components/DynamicIsland";
import { Footer } from "@/components/Footer";
import { IdeaMode } from "@/components/IdeaMode";
import { Inbox } from "@/components/Inbox";
import { FoundryMark, PoweredByDNotifier } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { useUserId } from "@/lib/client";
import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "idea" | "diagnose";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "idea", label: "Start a business", hint: "I have an idea" },
  { id: "diagnose", label: "Fix my business", hint: "I have a problem" },
];

const FLOWS: { mode: Mode; title: string; steps: { name: string; text: string }[] }[] = [
  {
    mode: "idea",
    title: "Start a business",
    steps: [
      { name: "Founder agent", text: "Turns your idea into a clear brief" },
      { name: "Brand + Strategy", text: "Names with live domain checks, your USP and emotional hook" },
      { name: "Social + Tech", text: "A social funnel backed by real facts, plus stack and n8n automations" },
      { name: "Report agent", text: "An honest potential score and next steps" },
    ],
  },
  {
    mode: "diagnose",
    title: "Fix my business",
    steps: [
      { name: "Intake agent", text: "Asks the questions a good advisor would ask" },
      { name: "Diagnosis agent", text: "Searches open playbooks to find the root cause" },
      { name: "Solution agent", text: "Builds a prioritised 30-day plan" },
      { name: "Reminders", text: "Weekly follow-ups delivered via DNotifier" },
    ],
  },
];

const DNOTIFIER_FEATURES = [
  { name: "Agent workflows", text: "Every agent team runs as a DNotifier workflow" },
  { name: "AI pipeline", text: "All AI calls go through DNotifier" },
  { name: "Knowledge base", text: "Semantic search over open playbooks" },
  { name: "Messaging", text: "Reminders and history via pub/sub" },
  { name: "Observability", text: "Every run traced in the dashboard" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("idea");
  const [refreshKey, setRefreshKey] = useState(0);
  const userId = useUserId();
  const refresh = () => setRefreshKey((k) => k + 1);

  // Dynamic island: each mode reports its prompt/progress; the island shows once
  // the active mode's prompt card has scrolled up behind the navbar.
  const [islands, setIslands] = useState<Partial<Record<Mode, IslandData>>>({});
  const [pastPrompt, setPastPrompt] = useState(false);
  const ideaAnchor = useRef<HTMLFormElement>(null);
  const diagnoseAnchor = useRef<HTMLElement>(null);
  const onIdeaIsland = useCallback((d: IslandData) => setIslands((s) => ({ ...s, idea: d })), []);
  const onDiagnoseIsland = useCallback((d: IslandData) => setIslands((s) => ({ ...s, diagnose: d })), []);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const anchor = mode === "idea" ? ideaAnchor.current : diagnoseAnchor.current;
      setPastPrompt(anchor ? anchor.getBoundingClientRect().bottom < 88 : false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  const jumpToPrompt = () => {
    const anchor = mode === "idea" ? ideaAnchor.current : diagnoseAnchor.current;
    if (!anchor) return;
    window.scrollTo({ top: anchor.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
    setTimeout(() => anchor.querySelector<HTMLElement>("textarea, input")?.focus({ preventScroll: true }), 500);
  };

  const choose = (m: Mode) => {
    setMode(m);
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div id="top" className="overflow-x-clip">
      <Navbar onMode={setMode} />
      <DynamicIsland data={islands[mode] ?? null} visible={pastPrompt} onJump={jumpToPrompt} />

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="relative py-14 text-center sm:py-20">
          <div className="hero-glow pointer-events-none absolute inset-x-[-50vw] -top-16 bottom-0 -z-10" aria-hidden="true" />
          <div className="mb-6 flex items-center justify-center gap-3">
            <FoundryMark size={56} />
            <span className="text-2xl text-muted" aria-hidden="true">×</span>
            <PoweredByDNotifier />
          </div>
          <p className="mb-4 inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            Open source · Hacktoberfest 2026 · MIT licensed
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Discover your <span className="text-gradient">business potential</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            A team of AI agents that helps founders at both ends of the journey: turning an idea into a launch plan, or finding the
            root cause of what&apos;s holding a business back.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => choose("idea")} className="rounded-xl btn-primary px-6 py-3 font-medium transition-opacity hover:opacity-90">
              Start a business
            </button>
            <button onClick={() => choose("diagnose")} className="rounded-xl border border-line bg-surface px-6 py-3 font-medium transition-colors hover:border-accent">
              Fix my business
            </button>
          </div>
        </section>

        {/* App */}
        <section id="app" className="scroll-mt-20">
          <div role="tablist" aria-label="Mode" className="mx-auto mb-6 grid max-w-md grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-xl px-3 py-2.5 text-center transition-colors ${mode === m.id ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
              >
                <span className="block font-medium">{m.label}</span>
                <span className="block text-xs opacity-80">{m.hint}</span>
              </button>
            ))}
          </div>

          {/* Both modes stay mounted so switching tabs doesn't lose progress. */}
          <div hidden={mode !== "idea"}><IdeaMode userId={userId} onDone={refresh} onIsland={onIdeaIsland} anchorRef={ideaAnchor} /></div>
          <div hidden={mode !== "diagnose"}><DiagnoseMode userId={userId} onDone={refresh} onIsland={onDiagnoseIsland} anchorRef={diagnoseAnchor} /></div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 pt-24">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-accent">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">A team of agents, one step at a time</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {FLOWS.map((flow) => (
              <div key={flow.mode} className="rounded-3xl border border-line bg-surface shadow-card p-6">
                <h3 className="mb-5 text-lg font-semibold">{flow.title}</h3>
                <ol className="space-y-4">
                  {flow.steps.map((s, i) => (
                    <li key={s.name} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
                      <span>
                        <span className="block font-medium">{s.name}</span>
                        <span className="text-sm text-muted">{s.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <button onClick={() => choose(flow.mode)} className="mt-6 text-sm font-medium text-accent">Try it →</button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-line bg-surface shadow-card p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Built end to end on DNotifier</h3>
              <PoweredByDNotifier />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {DNOTIFIER_FEATURES.map((f) => (
                <div key={f.name} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <p className="font-medium">{f.name}</p>
                  <p className="mt-1 text-sm text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div id="history" className="scroll-mt-20">
          <Inbox userId={userId} refreshKey={refreshKey} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
