"use client";

import { useId, useRef, useState } from "react";

export type Step = {
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

// Results shown one numbered step at a time. Selecting a step reveals its panel with a short animation.
export function Stepper({ steps, heading }: { steps: Step[]; heading: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  function select(i: number, scroll = false) {
    setActive(i);
    setSeen((s) => new Set(s).add(i));
    if (scroll) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onKey(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + steps.length) % steps.length;
    select(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }

  const progress = ((active + 1) / steps.length) * 100;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line p-5 sm:p-6">{heading}</div>

      <div className="grid md:grid-cols-[260px_1fr]">
        {/* Step list: vertical on desktop, horizontal scroller on mobile */}
        <div
          role="tablist"
          aria-label="Report steps"
          aria-orientation="vertical"
          onKeyDown={onKey}
          className="flex gap-2 overflow-x-auto border-b border-line p-3 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:p-4"
        >
          {steps.map((step, i) => {
            const isActive = i === active;
            const done = seen.has(i) && !isActive;
            return (
              <button
                key={step.title}
                id={`${id}-tab-${i}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(i)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors md:w-full ${
                  isActive ? "bg-accent-soft" : "hover:bg-bg"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isActive ? "bg-accent text-accent-ink" : done ? "bg-ok-soft text-ok" : "border border-line text-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block whitespace-nowrap text-sm font-medium ${isActive ? "text-ink" : "text-muted"}`}>{step.title}</span>
                  <span className="hidden text-xs text-muted md:block">{step.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div ref={panelRef} className="min-w-0 scroll-mt-24 p-5 sm:p-7">
          <div className="mb-5 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            Step {active + 1} of {steps.length}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{steps[active].title}</h2>
          <p className="text-muted">{steps[active].subtitle}</p>

          {/* key forces a remount so the reveal animation replays on every step change */}
          <div key={active} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="step-in mt-6 space-y-5">
            {steps[active].content}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              onClick={() => select(active - 1, true)}
              disabled={active === 0}
              className="rounded-xl border border-line px-4 py-2 text-sm transition-colors hover:border-accent disabled:invisible"
            >
              ← {steps[active - 1]?.title ?? "Back"}
            </button>
            <button
              onClick={() => select(active + 1, true)}
              disabled={active === steps.length - 1}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:invisible"
            >
              {steps[active + 1]?.title ?? "Next"} →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Shared building blocks for step content.
export function Panel({ title, children, tone = "plain" }: { title?: string; children: React.ReactNode; tone?: "plain" | "accent" }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "accent" ? "border-accent bg-accent-soft" : "border-line bg-bg"}`}>
      {title && <h3 className="mb-3 font-semibold">{title}</h3>}
      {children}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
