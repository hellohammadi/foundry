"use client";

import { comingSoon } from "@/components/Toast";
import { PLANS, PRO_PRICE, type ProFeature } from "@/lib/pro";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// Report step: Pro strategies shown as blurred, locked previews.
export function ProLocked({ features, title }: { features: ProFeature[]; title: string }) {
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-accent bg-accent-soft p-5">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><LockIcon /> Foundry Pro</p>
            <p className="mt-1 text-lg font-semibold">{title}</p>
            <p className="text-sm text-muted">{features.length} more strategies are ready for this report.</p>
          </div>
          <button onClick={() => comingSoon("Foundry Pro")} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Unlock all · {PRO_PRICE}/mo
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {features.map((f) => (
          <button
            key={f.title}
            onClick={() => comingSoon(f.title)}
            className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold"><span aria-hidden="true">{f.icon}</span> {f.title}</p>
                <p className="mt-1 text-sm text-muted">{f.description}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-1 text-xs font-medium text-accent ring-1 ring-line"><LockIcon /> Pro</span>
            </div>
            {/* Illustrative placeholder content, blurred until Pro launches */}
            <ul className="locked-preview mt-3 space-y-1 text-sm" aria-hidden="true">
              {f.preview.map((line) => <li key={line}>• {line}</li>)}
            </ul>
            <span className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="rounded-full bg-island px-3 py-1 text-xs font-medium text-island-ink">Unlock with Pro</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// Page section: plans. No payments yet, so every paid button says so.
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 pt-24">
      <div className="mb-10 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">Pricing</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Start free. Go deeper with Pro.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Foundry is open source and free to use. Pro adds deeper strategies for founders who want the full picture.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Payments coming soon · everything is free during Hacktoberfest
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-3xl border p-6 shadow-card ${plan.highlight ? "border-accent bg-surface ring-1 ring-accent" : "border-line bg-surface"}`}
          >
            {plan.highlight && (
              <span className="btn-primary absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold">Most popular</span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-sm text-muted">{plan.tagline}</p>
            <p className="mt-5">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className="ml-1 text-sm text-muted">{plan.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="mt-0.5 text-accent" aria-hidden="true">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => plan.price !== "₹0" && comingSoon(`The ${plan.name} plan`)}
              disabled={plan.price === "₹0"}
              className={`mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                plan.highlight ? "btn-primary" : plan.price === "₹0" ? "cursor-default border border-line text-muted" : "border border-line hover:border-accent"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
