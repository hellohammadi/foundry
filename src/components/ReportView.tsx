"use client";

import { ProLocked } from "@/components/Pro";
import { ContentPlan, SocialStrategy } from "@/components/SocialView";
import { Bullets, Panel, Stepper, type Step } from "@/components/Stepper";
import { download, toIcs, toMarkdown, toN8n } from "@/lib/exports";
import { IDEA_PRO } from "@/lib/pro";
import type { Availability, NameCandidate, Report } from "@/lib/types";
import { useState } from "react";

function Badge({ status, manual }: { status: Availability; manual?: boolean }) {
  if (manual) return <span className="rounded-md border border-line px-1.5 py-0.5 text-xs text-muted">check</span>;
  const styles = { available: "bg-ok-soft text-ok", taken: "bg-bad-soft text-bad", unknown: "border border-line text-muted" }[status];
  const label = { available: "free", taken: "taken", unknown: "?" }[status];
  return <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${styles}`}>{label}</span>;
}

function NameCard({ n, top }: { n: NameCandidate; top: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${top ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{n.name}</span>
          {top && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-ink">Top pick</span>}
        </div>
        <span className="text-sm text-muted">Availability {n.score}/100</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-ok" style={{ width: `${n.score}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{n.reason}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {n.domains.map((d) => (
          <span key={d.domain} className="flex items-center gap-1.5 font-mono text-xs">
            {d.domain} <Badge status={d.status} />
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {n.handles.map((h) => (
          <a key={h.platform} href={h.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs hover:underline">
            {h.platform} <Badge status={h.status} manual={h.method === "manual"} />
          </a>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0" role="img" aria-label={`Potential score ${score} out of 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--ink)" fontSize="26" fontWeight="600">{score}</text>
    </svg>
  );
}

const btn = "rounded-xl border border-line bg-surface px-3 py-2 text-sm transition-colors hover:border-accent";

export function ReportView({ report }: { report: Report }) {
  const { brief, brand, strategy, social, tech, potential, meta } = report;
  const [copied, setCopied] = useState<string | null>(null);
  const slug = brand.names[0]?.slug ?? "foundry";

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const steps: Step[] = [
    {
      title: "Overview",
      subtitle: "Your business potential at a glance",
      content: (
        <>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <ScoreRing score={potential.score} />
            <div>
              <p className="text-sm text-muted">Business potential score</p>
              <p className="mt-1 text-lg">{potential.verdict}</p>
            </div>
          </div>
          <Panel title="The brief">
            <p>{brief.summary}</p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Audience</dt><dd>{brief.audience}</dd></div>
              <div><dt className="text-muted">Problem</dt><dd>{brief.problem}</dd></div>
              <div><dt className="text-muted">Business model</dt><dd>{brief.businessModel}</dd></div>
            </dl>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Strengths"><Bullets items={potential.strengths} /></Panel>
            <Panel title="Watch out for"><Bullets items={potential.watchOuts} /></Panel>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => download(`${slug}-report.md`, toMarkdown(report), "text/markdown")} className={btn}>Download report (.md)</button>
            <button onClick={() => download(`${slug}-content-calendar.ics`, toIcs(report), "text/calendar")} className={btn}>Add calendar (.ics)</button>
            <button onClick={() => download(`${slug}-report.json`, JSON.stringify(report, null, 2), "application/json")} className={btn}>Raw data (.json)</button>
          </div>
        </>
      ),
    },
    {
      title: "Brand & names",
      subtitle: "Names checked live for domains and handles",
      content: (
        <>
          <p className="text-sm text-muted">
            Domains are checked with registry (RDAP) and DNS lookups. GitHub, YouTube and Bluesky handles are verified; Instagram,
            TikTok and X block automated checks, so tap “check” to look yourself.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {brand.names.map((n, i) => <NameCard key={n.slug} n={n} top={i === 0} />)}
          </div>
        </>
      ),
    },
    {
      title: "Your edge",
      subtitle: "Unique selling point and emotional hook",
      content: (
        <>
          <Panel tone="accent">
            <p className="text-sm text-muted">Unique selling point</p>
            <p className="mt-1 text-xl font-medium">{strategy.usp}</p>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Emotional core"><p>{strategy.emotionalCore}</p></Panel>
            <Panel title="Tone of voice">
              <div className="flex flex-wrap gap-2">
                {strategy.toneOfVoice.map((t) => <span key={t} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">{t}</span>)}
              </div>
            </Panel>
          </div>
          <Panel title="Brand story"><p className="leading-relaxed">{strategy.brandStory}</p></Panel>
          <Panel title="Competitors and the gap you fill">
            <div className="grid gap-3 md:grid-cols-3">
              {strategy.competitors.map((c) => (
                <div key={c.name} className="rounded-xl border border-line bg-surface p-3 text-sm">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted">{c.gap}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      ),
    },
    {
      title: "Roadmap",
      subtitle: "From zero to launch, then scale",
      content: (
        <>
          <ol className="relative space-y-4 border-l-2 border-line pl-6">
            {strategy.roadmap.map((p, i) => (
              <li key={p.phase} className="relative">
                <span className="absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">{i + 1}</span>
                <Panel>
                  <p className="text-xs text-muted">{p.timeframe}</p>
                  <p className="mb-2 font-semibold">{p.phase}</p>
                  <Bullets items={p.steps} />
                </Panel>
              </li>
            ))}
          </ol>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="How to scale"><Bullets items={strategy.scalePlan} /></Panel>
            <Panel title="Risks"><Bullets items={strategy.risks} /></Panel>
          </div>
        </>
      ),
    },
    {
      title: "Social strategy",
      subtitle: "Awareness → engagement → conversion",
      content: <SocialStrategy social={social} />,
    },
    {
      title: "Content plan",
      subtitle: "Posts and a 14-day calendar by funnel stage",
      content: (
        <ContentPlan
          social={social}
          copied={copied}
          copy={copy}
          calendarButton={
            <button onClick={() => download(`${slug}-content-calendar.ics`, toIcs(report), "text/calendar")} className={btn}>Add to my calendar (.ics)</button>
          }
        />
      ),
    },
    {
      title: "Tech & automation",
      subtitle: "MVP, tools and ready-made workflows",
      content: (
        <>
          <Panel tone="accent">
            <p className="text-sm text-muted">Minimum viable product</p>
            <p className="mt-1 text-lg">{tech.mvp}</p>
          </Panel>
          <div className="grid gap-2 sm:grid-cols-2">
            {tech.stack.map((s) => (
              <div key={s.layer} className="flex justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
                <span><span className="text-muted">{s.layer}:</span> {s.tool}</span>
                <span className="shrink-0 text-muted">{s.cost}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">
            Download any workflow and import it into <a className="underline" href="https://n8n.io" target="_blank" rel="noreferrer">n8n</a> (open source) as a starting skeleton.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {tech.automations.map((a) => (
              <Panel key={a.name}>
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-muted">When: {a.trigger}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{a.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                <p className="mt-2 text-xs text-muted">Tools: {a.tools.join(", ")}</p>
                <p className="mt-1 text-xs text-ok">{a.impact}</p>
                <button
                  onClick={() => download(`${slug}-${a.name.toLowerCase().replace(/\W+/g, "-")}.n8n.json`, JSON.stringify(toN8n(a), null, 2), "application/json")}
                  className={`${btn} mt-3 text-xs`}
                >
                  Download n8n workflow
                </button>
              </Panel>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Launch",
      subtitle: "Your checklist and this week's moves",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Launch checklist">
            <ul className="space-y-2">
              {tech.launchChecklist.map((item) => (
                <li key={item}><label className="flex gap-2.5"><input type="checkbox" className="mt-1 accent-[var(--accent)]" /> {item}</label></li>
              ))}
            </ul>
          </Panel>
          <Panel title="Do this week" tone="accent"><Bullets items={potential.nextSteps} /></Panel>
        </div>
      ),
    },
    {
      title: "Pro strategies 🔒",
      subtitle: "Market, money, competitors and more",
      content: <ProLocked features={IDEA_PRO} title="Go deeper on this idea" />,
    },
  ];

  return (
    <div className="space-y-4">
      {meta.mode === "demo" && (
        <p className="rounded-2xl border border-line bg-accent-soft p-3 text-sm">
          <strong>Demo mode:</strong> no model is connected, so the advice below comes from templates. The domain and handle checks are
          real. Add your DNotifier app credentials for advice tailored to your idea (see the README).
        </p>
      )}
      <Stepper
        steps={steps}
        heading={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ScoreRing score={potential.score} size={64} />
              <div>
                <p className="text-sm text-muted">Business potential report</p>
                <h2 className="text-2xl font-semibold tracking-tight">{brand.recommended}</h2>
                <p className="italic text-muted">“{brand.tagline}”</p>
              </div>
            </div>
            <p className="text-xs text-muted">
              {meta.mode === "live" ? meta.model : "Demo mode"}
              {meta.executionId && <><br />DNotifier trace <span className="font-mono">{meta.executionId}</span></>}
            </p>
          </div>
        }
      />
    </div>
  );
}
