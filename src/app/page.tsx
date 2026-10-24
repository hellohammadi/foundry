"use client";

import { DiagnoseMode } from "@/components/DiagnoseMode";
import { IdeaMode } from "@/components/IdeaMode";
import { Inbox } from "@/components/Inbox";
import { useUserId } from "@/lib/client";
import { useState } from "react";

type Mode = "idea" | "diagnose";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "idea", label: "Start a business", hint: "I have an idea" },
  { id: "diagnose", label: "Fix my business", hint: "I have a problem" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("idea");
  const [refreshKey, setRefreshKey] = useState(0);
  const userId = useUserId();
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <p className="mb-3 inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          Open source · Agents powered by DNotifier
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Discover your <span className="text-accent">business potential</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          {mode === "idea"
            ? "Share your idea. A team of AI agents names it, checks domains and handles, finds your unique edge, and plans your social media and automations."
            : "Tell us what's going wrong. Our agents ask the right questions, find the root cause using open startup playbooks, and give you a 30-day plan."}
        </p>
      </header>

      <div role="tablist" aria-label="Mode" className="mx-auto mb-6 grid max-w-md grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-xl px-3 py-2.5 text-center transition-colors ${mode === m.id ? "bg-accent text-white dark:text-black" : "text-muted hover:text-ink"}`}
          >
            <span className="block font-medium">{m.label}</span>
            <span className="block text-xs opacity-80">{m.hint}</span>
          </button>
        ))}
      </div>

      {/* Both modes stay mounted so switching tabs doesn't lose progress. */}
      <div hidden={mode !== "idea"}><IdeaMode userId={userId} onDone={refresh} /></div>
      <div hidden={mode !== "diagnose"}><DiagnoseMode userId={userId} onDone={refresh} /></div>

      <Inbox userId={userId} refreshKey={refreshKey} />

      <footer className="mt-16 text-center text-sm text-muted">
        <a href="https://github.com/hellohammadi/foundry" className="underline" target="_blank" rel="noreferrer">
          Foundry on GitHub
        </a>{" "}
        · MIT licensed · Built for Hacktoberfest
      </footer>
    </main>
  );
}
