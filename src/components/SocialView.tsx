"use client";

import { Bullets, Panel } from "@/components/Stepper";
import type { FunnelStage, SocialFact, SocialResult } from "@/lib/types";
import { useState } from "react";

export const STAGE_META: Record<FunnelStage, { label: string; number: number; chip: string; bar: string; width: string }> = {
  awareness: { label: "Awareness", number: 1, chip: "bg-accent/10 text-accent border border-accent/30", bar: "bg-accent/25", width: "100%" },
  engagement: { label: "Engagement", number: 2, chip: "bg-accent/20 text-accent border border-accent/50", bar: "bg-accent/55", width: "82%" },
  conversion: { label: "Conversion", number: 3, chip: "bg-accent text-accent-ink border border-accent", bar: "bg-accent", width: "64%" },
};

export function StageChip({ stage }: { stage: FunnelStage }) {
  const meta = STAGE_META[stage] ?? STAGE_META.awareness;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}>{meta.label}</span>;
}

function FactCard({ fact }: { fact: SocialFact }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-3 text-sm">
      <p>{fact.fact}</p>
      <p className="mt-1.5 text-xs text-muted">
        <a href={fact.url} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-ink">{fact.source}</a>
        {" · "}{fact.region} · {fact.year}
      </p>
    </li>
  );
}

// Only facts about this platform go on its card; general facts are listed once below.
function platformFacts(platform: string, ids: string[], factsById: Map<string, SocialFact>): SocialFact[] {
  const name = platform.toLowerCase();
  return ids
    .map((id) => factsById.get(id))
    .filter((f): f is SocialFact => Boolean(f) && f!.platforms.some((p) => p.toLowerCase() === name));
}

// Step: the strategy — positioning, platforms backed by facts, and the 3-phase funnel.
export function SocialStrategy({ social }: { social: SocialResult }) {
  const [stage, setStage] = useState<FunnelStage>("awareness");
  const phase = social.funnel.find((p) => p.stage === stage) ?? social.funnel[0];
  const factsById = new Map(social.facts.map((f) => [f.id, f]));
  const keyFacts = social.keyFactIds.map((id) => factsById.get(id)).filter((f): f is SocialFact => Boolean(f));

  return (
    <>
      <Panel tone="accent">
        <p className="text-sm text-muted">Social positioning</p>
        <p className="mt-1 text-xl font-medium">{social.positioning}</p>
        <p className="mt-3 text-sm">{social.audienceInsight}</p>
      </Panel>

      <div>
        <h3 className="mb-1 font-semibold">Your social funnel</h3>
        <p className="mb-4 text-sm text-muted">Move strangers to customers in three phases. Select a phase to see the plan.</p>
        <div className="flex flex-col items-center gap-1.5" role="tablist" aria-label="Funnel phases">
          {social.funnel.map((p) => {
            const meta = STAGE_META[p.stage] ?? STAGE_META.awareness;
            const active = p.stage === stage;
            return (
              <button
                key={p.stage}
                role="tab"
                aria-selected={active}
                onClick={() => setStage(p.stage)}
                style={{ width: meta.width, clipPath: "polygon(0 0, 100% 0, 96% 100%, 4% 100%)" }}
                className={`flex items-center justify-between gap-3 px-[6%] py-3.5 text-left transition-all ${meta.bar} ${active ? "scale-[1.02] shadow-lg" : "opacity-55 hover:opacity-90"}`}
              >
                <span className={`flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold ${p.stage === "conversion" ? "text-accent-ink" : "text-ink"}`}>
                  {active && <span aria-hidden="true">▸</span>}
                  {meta.number}. {meta.label}
                </span>
                <span className={`hidden truncate text-sm sm:block ${p.stage === "conversion" ? "text-accent-ink" : "text-muted"}`}>{p.goal}</span>
              </button>
            );
          })}
        </div>
      </div>

      {phase && (
        <div key={phase.stage} className="step-in space-y-4">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StageChip stage={phase.stage} />
              <span className="text-xs text-muted">{phase.timeframe}</span>
            </div>
            <p className="mt-3 text-lg font-semibold">{phase.goal}</p>
            <p className="mt-2 text-sm italic text-muted">Customer mindset: {phase.audienceMindset}</p>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Tactics"><Bullets items={phase.tactics} /></Panel>
            <Panel title="Measure success">
              <ul className="space-y-2">
                {phase.kpis.map((k) => (
                  <li key={k.name} className="flex justify-between gap-3 text-sm">
                    <span>{k.name}</span>
                    <span className="font-medium text-accent">{k.target}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel title="Content ideas">
            <div className="grid gap-3 md:grid-cols-3">
              {phase.contentIdeas.map((c, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface p-3 text-sm">
                  <p className="text-xs text-muted">{c.platform} · {c.format}</p>
                  <p className="mt-1">{c.idea}</p>
                </div>
              ))}
            </div>
          </Panel>
          <div className="flex items-center gap-3 rounded-2xl bg-accent p-4 text-accent-ink">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Call to action</span>
            <span className="font-semibold">{phase.cta}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-semibold">Where to show up</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {social.platforms.map((p) => (
            <Panel key={p.name}>
              <p className="font-semibold">{p.name} <span className="text-xs font-normal text-muted">· {p.priority}</span></p>
              <p className="mt-1 text-sm text-muted">{p.why}</p>
              {platformFacts(p.name, p.factIds ?? [], factsById).map((f) => (
                <p key={f.id} className="mt-3 rounded-lg bg-accent-soft p-2 text-xs">
                  📊 {f.fact}{" "}
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-muted underline decoration-dotted">{f.source.split(",")[0]}</a>
                </p>
              ))}
            </Panel>
          ))}
        </div>
      </div>

      {keyFacts.length > 0 && (
        <Panel title="The facts behind this strategy">
          <p className="mb-3 text-xs text-muted">Every number comes from Foundry&apos;s verified facts list, with its source. The AI is not allowed to invent statistics.</p>
          <ul className="grid gap-2 md:grid-cols-2">{keyFacts.map((f) => <FactCard key={f.id} fact={f} />)}</ul>
        </Panel>
      )}
    </>
  );
}

// Step: the content — pillars, bios, funnel-tagged posts, calendar and viral ideas.
export function ContentPlan({ social, copied, copy, calendarButton }: {
  social: SocialResult;
  copied: string | null;
  copy: (key: string, text: string) => void;
  calendarButton: React.ReactNode;
}) {
  return (
    <>
      <Panel title="Content pillars">
        <div className="grid gap-3 sm:grid-cols-2">
          {social.pillars.map((p) => <p key={p.name} className="text-sm"><strong>{p.name}:</strong> <span className="text-muted">{p.description}</span></p>)}
        </div>
      </Panel>

      <div>
        <h3 className="mb-3 font-semibold">Ready-to-post content</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {social.posts.map((p, i) => (
            <Panel key={i}>
              <div className="flex items-center justify-between gap-2">
                <StageChip stage={p.stage} />
                <span className="text-xs text-muted">{p.platform}</span>
              </div>
              <p className="mt-2 font-medium">{p.hook}</p>
              <p className="mt-1 text-sm text-muted">{p.caption}</p>
              {p.cta && <p className="mt-2 text-sm font-medium">👉 {p.cta}</p>}
              <p className="mt-2 text-sm text-accent">{p.hashtags.join(" ")}</p>
              <button onClick={() => copy(`post-${i}`, `${p.hook}\n\n${p.caption}\n\n${p.cta ?? ""}\n\n${p.hashtags.join(" ")}`)} className="mt-2 text-xs text-accent">
                {copied === `post-${i}` ? "Copied" : "Copy post"}
              </button>
            </Panel>
          ))}
        </div>
      </div>

      <Panel title="14-day content calendar">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {(Object.keys(STAGE_META) as FunnelStage[]).map((s) => <StageChip key={s} stage={s} />)}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {social.calendar.map((c) => {
            const meta = STAGE_META[c.stage] ?? STAGE_META.awareness;
            return (
              <div key={c.day} className="overflow-hidden rounded-xl border border-line bg-surface text-xs">
                <div className={`h-1.5 ${meta.bar}`} aria-hidden="true" />
                <div className="p-2.5">
                  <p className="font-semibold text-accent">Day {c.day}</p>
                  <p className="text-muted">{c.platform} · {c.format}</p>
                  <p className="mt-1">{c.idea}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4">{calendarButton}</div>
      </Panel>

      <Panel title="Ready-to-use bios">
        <div className="space-y-2">
          {social.bios.map((b) => (
            <div key={b.platform} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
              <span><strong>{b.platform}:</strong> {b.bio}</span>
              <button onClick={() => copy(`bio-${b.platform}`, b.bio)} className="shrink-0 text-xs text-accent">{copied === `bio-${b.platform}` ? "Copied" : "Copy"}</button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Ideas with viral potential"><Bullets items={social.viralIdeas} /></Panel>
    </>
  );
}
