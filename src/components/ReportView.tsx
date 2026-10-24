"use client";

import { download, toIcs, toMarkdown, toN8n } from "@/lib/exports";
import type { Availability, NameCandidate, Report } from "@/lib/types";
import { useState } from "react";

function Card({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-accent">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Badge({ status, manual }: { status: Availability; manual?: boolean }) {
  if (manual) return <span className="rounded-md border border-line px-1.5 py-0.5 text-xs text-muted">check</span>;
  const styles = {
    available: "bg-ok-soft text-ok",
    taken: "bg-bad-soft text-bad",
    unknown: "border border-line text-muted",
  }[status];
  const label = { available: "free", taken: "taken", unknown: "?" }[status];
  return <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${styles}`}>{label}</span>;
}

function NameRow({ n, top }: { n: NameCandidate; top: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${top ? "border-accent" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{n.name}</span>
          {top && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white dark:text-black">Top pick</span>}
        </div>
        <span className="text-sm text-muted">Availability {n.score}/100</span>
      </div>
      <p className="mt-1 text-sm text-muted">{n.reason}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {n.domains.map((d) => (
          <span key={d.domain} className="flex items-center gap-1.5 font-mono text-xs">
            {d.domain} <Badge status={d.status} />
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {n.handles.map((h) => (
          <a key={h.platform} href={h.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs hover:underline">
            {h.platform} <Badge status={h.status} manual={h.method === "manual"} />
          </a>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label={`Potential score ${score} out of 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--ink)" fontSize="26" fontWeight="600">
        {score}
      </text>
    </svg>
  );
}

export function ReportView({ report }: { report: Report }) {
  const { brief, brand, strategy, social, tech, potential, meta } = report;
  const [copied, setCopied] = useState<string | null>(null);
  const slug = brand.names[0]?.slug ?? "foundry";

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-5">
      {meta.mode === "demo" && (
        <p className="rounded-xl border border-line bg-accent-soft p-3 text-sm">
          <strong>Demo mode:</strong> no model is connected, so the advice below comes from templates. The domain and
          handle checks are real. Add your DNotifier app credentials for advice tailored to your idea (see the README).
        </p>
      )}

      <section className="flex flex-col items-start gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <ScoreRing score={potential.score} />
        <div className="min-w-0">
          <p className="text-sm text-muted">Business potential</p>
          <h2 className="text-2xl font-semibold">{brand.recommended}</h2>
          <p className="italic text-muted">“{brand.tagline}”</p>
          <p className="mt-2">{potential.verdict}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => download(`${slug}-report.md`, toMarkdown(report), "text/markdown")} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
          Download report (.md)
        </button>
        <button onClick={() => download(`${slug}-content-calendar.ics`, toIcs(report), "text/calendar")} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
          Add calendar (.ics)
        </button>
        <button onClick={() => download(`${slug}-report.json`, JSON.stringify(report, null, 2), "application/json")} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
          Raw data (.json)
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Strengths"><List items={potential.strengths} /></Card>
        <Card title="Watch out for"><List items={potential.watchOuts} /></Card>
      </div>

      <Card title="Brief">
        <p>{brief.summary}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Audience</dt><dd>{brief.audience}</dd></div>
          <div><dt className="text-muted">Problem</dt><dd>{brief.problem}</dd></div>
          <div><dt className="text-muted">Business model</dt><dd>{brief.businessModel}</dd></div>
        </dl>
      </Card>

      <Card title="Names & availability" id="names">
        <p className="mb-3 text-sm text-muted">
          Domains are checked live with registry (RDAP) and DNS lookups. GitHub, YouTube and Bluesky handles are verified;
          Instagram, TikTok and X block automated checks, so tap “check” to look yourself.
        </p>
        <div className="space-y-3">
          {brand.names.map((n, i) => <NameRow key={n.slug} n={n} top={i === 0} />)}
        </div>
      </Card>

      <Card title="Your unique selling point">
        <p className="text-lg">{strategy.usp}</p>
        <h3 className="mt-5 font-medium">Emotional core</h3>
        <p className="text-muted">{strategy.emotionalCore}</p>
        <h3 className="mt-5 font-medium">Brand story</h3>
        <p>{strategy.brandStory}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {strategy.toneOfVoice.map((t) => <span key={t} className="rounded-full border border-line px-3 py-1 text-sm">{t}</span>)}
        </div>
        <h3 className="mt-5 font-medium">Competitors and the gap you fill</h3>
        <ul className="mt-2 space-y-2">
          {strategy.competitors.map((c) => <li key={c.name}><strong>{c.name}:</strong> <span className="text-muted">{c.gap}</span></li>)}
        </ul>
      </Card>

      <Card title="Roadmap: from zero to launch">
        <ol className="grid gap-4 md:grid-cols-2">
          {strategy.roadmap.map((p, i) => (
            <li key={p.phase} className="rounded-xl border border-line p-4">
              <p className="text-sm text-muted">{i + 1}. {p.timeframe}</p>
              <p className="mb-2 font-medium">{p.phase}</p>
              <List items={p.steps} />
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="How to scale"><List items={strategy.scalePlan} /></Card>
        <Card title="Risks"><List items={strategy.risks} /></Card>
      </div>

      <Card title="Social media strategy" id="social">
        <div className="grid gap-3 sm:grid-cols-3">
          {social.platforms.map((p) => (
            <div key={p.name} className="rounded-xl border border-line p-3">
              <p className="font-medium">{p.name} <span className="text-xs text-muted">· {p.priority}</span></p>
              <p className="text-sm text-muted">{p.why}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-5 font-medium">Content pillars</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {social.pillars.map((p) => <p key={p.name} className="text-sm"><strong>{p.name}:</strong> <span className="text-muted">{p.description}</span></p>)}
        </div>
        <h3 className="mt-5 font-medium">Ready-to-use bios</h3>
        <div className="mt-2 space-y-2">
          {social.bios.map((b) => (
            <div key={b.platform} className="flex items-start justify-between gap-3 rounded-lg border border-line p-3 text-sm">
              <span><strong>{b.platform}:</strong> {b.bio}</span>
              <button onClick={() => copy(`bio-${b.platform}`, b.bio)} className="shrink-0 text-xs text-accent">
                {copied === `bio-${b.platform}` ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
        <h3 className="mt-5 font-medium">First posts</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {social.posts.map((p, i) => (
            <div key={i} className="rounded-xl border border-line p-4 text-sm">
              <p className="text-xs text-muted">{p.platform}</p>
              <p className="font-medium">{p.hook}</p>
              <p className="mt-1 text-muted">{p.caption}</p>
              <p className="mt-2 text-accent">{p.hashtags.join(" ")}</p>
              <button onClick={() => copy(`post-${i}`, `${p.hook}\n\n${p.caption}\n\n${p.hashtags.join(" ")}`)} className="mt-2 text-xs text-accent">
                {copied === `post-${i}` ? "Copied" : "Copy post"}
              </button>
            </div>
          ))}
        </div>
        <h3 className="mt-5 font-medium">14-day content calendar</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr><th className="py-1 pr-3 font-normal">Day</th><th className="py-1 pr-3 font-normal">Platform</th><th className="py-1 pr-3 font-normal">Format</th><th className="py-1 font-normal">Idea</th></tr>
            </thead>
            <tbody>
              {social.calendar.map((c) => (
                <tr key={c.day} className="border-t border-line">
                  <td className="py-1.5 pr-3">{c.day}</td><td className="py-1.5 pr-3">{c.platform}</td><td className="py-1.5 pr-3">{c.format}</td><td className="py-1.5">{c.idea}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 font-medium">Viral ideas</h3>
        <div className="mt-2"><List items={social.viralIdeas} /></div>
      </Card>

      <Card title="Tech & MVP">
        <p>{tech.mvp}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {tech.stack.map((s) => (
            <div key={s.layer} className="flex justify-between gap-3 rounded-lg border border-line p-3 text-sm">
              <span><span className="text-muted">{s.layer}:</span> {s.tool}</span>
              <span className="shrink-0 text-muted">{s.cost}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Automation blueprint" id="automations">
        <p className="mb-4 text-sm text-muted">
          Download any workflow and import it into <a className="underline" href="https://n8n.io" target="_blank" rel="noreferrer">n8n</a> (open source) as a starting skeleton.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {tech.automations.map((a) => (
            <div key={a.name} className="flex flex-col rounded-xl border border-line p-4 text-sm">
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-muted">When: {a.trigger}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">{a.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              <p className="mt-2 text-xs text-muted">Tools: {a.tools.join(", ")}</p>
              <p className="mt-1 text-xs text-ok">{a.impact}</p>
              <button
                onClick={() => download(`${slug}-${a.name.toLowerCase().replace(/\W+/g, "-")}.n8n.json`, JSON.stringify(toN8n(a), null, 2), "application/json")}
                className="mt-3 self-start rounded-lg border border-line px-3 py-1.5 text-xs hover:border-accent"
              >
                Download n8n workflow
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Launch checklist">
          <ul className="space-y-1.5">
            {tech.launchChecklist.map((item) => (
              <li key={item}><label className="flex gap-2"><input type="checkbox" className="mt-1 accent-[var(--accent)]" /> {item}</label></li>
            ))}
          </ul>
        </Card>
        <Card title="Do this week"><List items={potential.nextSteps} /></Card>
      </div>

      <p className="text-center text-xs text-muted">
        Generated {meta.mode === "live" ? `by ${meta.model}` : "in demo mode"} · {new Date(meta.generatedAt).toLocaleString()}
        {meta.executionId && <> · DNotifier trace <span className="font-mono">{meta.executionId}</span></>}
      </p>
    </div>
  );
}
