"use client";

import { CompareTable, type Case } from "@/components/Cases";
import type { IdeaInput, Report } from "@/lib/types";

export type IdeaCase = { input: IdeaInput; report: Report };

function Score({ value }: { value: number }) {
  return (
    <div>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-muted">/100</span>
      <div className="mt-1.5 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const list = (items: string[]) => (
  <ul className="space-y-1">
    {items.map((x, i) => <li key={i}>• {x}</li>)}
  </ul>
);

// Side-by-side view of every case, highlighting inputs that changed from Case 1.
export function IdeaCompare({ cases }: { cases: Case<IdeaCase>[] }) {
  const scores = cases.map((c) => c.data.report.potential.score);
  const best = Math.max(...scores);
  // Only crown a winner when the scores actually differ.
  const hasWinner = scores.some((s) => s !== best);
  const r = cases.map((c) => c.data.report);
  const i = cases.map((c) => c.data.input);
  const dash = (v?: string) => v?.trim() || "—";

  return (
    <CompareTable
      columns={cases.map((c) => ({ id: c.id, n: c.n, best: hasWinner && c.data.report.potential.score === best }))}
      rows={[
        { label: "Idea", values: i.map((x) => x.idea), compare: i.map((x) => x.idea) },
        { label: "Audience", values: i.map((x) => dash(x.audience)), compare: i.map((x) => dash(x.audience)) },
        { label: "Location", values: i.map((x) => dash(x.location)), compare: i.map((x) => dash(x.location)) },
        { label: "Budget", values: i.map((x) => dash(x.budget)), compare: i.map((x) => dash(x.budget)) },
        { label: "Potential", values: r.map((x) => <Score key="s" value={x.potential.score} />) },
        { label: "Verdict", values: r.map((x) => x.potential.verdict) },
        {
          label: "Top name",
          values: r.map((x) => {
            const top = x.brand.names[0];
            const com = top?.domains.find((d) => d.domain.endsWith(".com"));
            return (
              <span key="n">
                <span className="font-semibold">{x.brand.recommended}</span>
                {com && <span className={`ml-2 text-xs ${com.status === "available" ? "text-ok" : "text-bad"}`}>{com.domain} {com.status === "available" ? "free" : "taken"}</span>}
                <span className="mt-1 block italic text-muted">“{x.brand.tagline}”</span>
              </span>
            );
          }),
        },
        { label: "USP", values: r.map((x) => x.strategy.usp) },
        { label: "Emotional core", values: r.map((x) => x.strategy.emotionalCore) },
        { label: "Platforms", values: r.map((x) => x.social.platforms.map((p) => p.name).join(", ")) },
        { label: "Conversion CTA", values: r.map((x) => x.social.funnel.find((f) => f.stage === "conversion")?.cta ?? "—") },
        { label: "MVP", values: r.map((x) => x.tech.mvp) },
        { label: "Strengths", values: r.map((x) => list(x.potential.strengths)) },
        { label: "Watch out for", values: r.map((x) => list(x.potential.watchOuts)) },
      ]}
    />
  );
}
