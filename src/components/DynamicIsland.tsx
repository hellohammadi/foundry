"use client";

import { useEffect, useRef, useState } from "react";

// What each mode reports to the island so it can mirror the prompt and progress.
export type IslandData = {
  mode: "idea" | "diagnose";
  prompt: string;
  status: "idle" | "running" | "asking" | "done";
  progress?: { done: number; total: number };
  label?: string; // live log line, or the current intake question
  result?: string; // e.g. "ChaiFlair · 75/100"
  placeholder: string;
  submitLabel: string;
  // What the expanded island's input does: re-run the idea, answer the question, or start a diagnosis.
  onSubmit?: (text: string) => void;
  onSkip?: () => void;
  // Prefills the expanded input; empty for answers.
  draft: string;
};

function StatusDot({ status }: { status: IslandData["status"] }) {
  if (status === "done") return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ok text-[11px] font-bold text-island">✓</span>;
  if (status === "running") {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
    );
  }
  if (status === "asking") return <span className="h-2.5 w-2.5 rounded-full bg-accent-2" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-island-muted" />;
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(done / Math.max(total, 1)) * c} ${c}`} transform="rotate(-90 12 12)" className="transition-[stroke-dasharray] duration-500" />
    </svg>
  );
}

// A pill pinned under the navbar, like the iPhone Dynamic Island. Tap to expand.
export function DynamicIsland({ data, visible, onJump }: { data: IslandData | null; visible: boolean; onJump: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Collapse when it hides, when you click outside, or on Escape.
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    setText(data?.draft ?? "");
    setTimeout(() => inputRef.current?.focus(), 150);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // Reset the draft only when the island opens, not on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!data) return null;
  const show = visible;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !data?.onSubmit) return;
    data.onSubmit(value);
    setText("");
    if (data.status !== "asking") setOpen(false);
  }

  const summary = data.status === "done" && data.result ? data.result : data.prompt || data.placeholder;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-[72px] z-30 flex justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
        show ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div
        ref={rootRef}
        className={`pointer-events-auto overflow-hidden bg-island text-island-ink shadow-2xl ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
          open ? "w-[min(94vw,640px)] rounded-[28px]" : show ? "w-[min(94vw,480px)] rounded-full" : "w-40 rounded-full"
        }`}
      >
        {/* Collapsed pill (also the header when open) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          tabIndex={show ? 0 : -1}
          aria-expanded={open}
          aria-label={open ? "Collapse prompt" : "Expand prompt"}
          className="flex h-12 w-full items-center gap-3 px-4 text-left"
        >
          <StatusDot status={data.status} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{summary}</span>
            {data.status === "running" && data.label && !open && (
              <span className="block truncate text-[11px] text-island-muted">{data.label}</span>
            )}
          </span>
          {data.progress && (data.status === "running" || data.status === "asking") && (
            <span className="flex items-center gap-1.5 text-xs text-island-muted">
              <Ring done={data.progress.done} total={data.progress.total} />
              {data.progress.done}/{data.progress.total}
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`shrink-0 text-island-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Expanded panel */}
        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0">
            <div className="space-y-3 px-4 pb-4">
              <p className="text-xs uppercase tracking-wider text-island-muted">
                {data.mode === "idea" ? "Start a business" : "Fix my business"}
                {data.status === "running" && data.label ? ` · ${data.label}` : ""}
              </p>
              {data.status === "asking" && data.label && <p className="text-base font-medium">{data.label}</p>}
              {data.status === "done" && data.result && data.prompt && <p className="text-sm text-island-muted">“{data.prompt}”</p>}
              {data.onSubmit ? (
                <form onSubmit={submit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={data.placeholder}
                    tabIndex={open ? 0 : -1}
                    className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-island-ink outline-none placeholder:text-island-muted focus:bg-white/15"
                  />
                  {data.onSkip && (
                    <button type="button" onClick={data.onSkip} tabIndex={open ? 0 : -1} className="shrink-0 rounded-full px-3 text-sm text-island-muted hover:text-island-ink">
                      Skip
                    </button>
                  )}
                  <button type="submit" tabIndex={open ? 0 : -1} className="btn-primary shrink-0 rounded-full px-4 text-sm font-semibold">
                    {data.submitLabel}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-island-muted">Your agents are working. You can keep scrolling.</p>
              )}
              <button type="button" onClick={() => { setOpen(false); onJump(); }} tabIndex={open ? 0 : -1} className="text-xs text-island-muted underline-offset-2 hover:text-island-ink hover:underline">
                Back to the full form ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
