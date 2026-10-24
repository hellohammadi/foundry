"use client";

import { CompareTable, type Case } from "@/components/Cases";
import type { DiagnosisReport } from "@/lib/types";

export type DiagnoseCase = { report: DiagnosisReport };

const list = (items: string[]) => (
  <ul className="space-y-1">
    {items.map((x, i) => <li key={i}>• {x}</li>)}
  </ul>
);

// Side-by-side view of diagnoses, e.g. the same problem answered differently, or two problems.
export function DiagnoseCompare({ cases }: { cases: Case<DiagnoseCase>[] }) {
  const r = cases.map((c) => c.data.report);
  const answers = (x: DiagnosisReport) => x.input.answers.filter((a) => a.answer.trim());
  return (
    <CompareTable
      columns={cases.map((c) => ({ id: c.id, n: c.n }))}
      rows={[
        { label: "Problem", values: r.map((x) => x.input.problem), compare: r.map((x) => x.input.problem) },
        {
          label: "Your answers",
          values: r.map((x) => (answers(x).length ? list(answers(x).map((a) => a.answer)) : <span key="none" className="text-muted">Skipped</span>)),
          compare: r.map((x) => answers(x).map((a) => a.answer).join("|")),
        },
        { label: "Root cause", values: r.map((x) => <span key="rc" className="font-semibold">{x.diagnosis.rootCause}</span>) },
        { label: "Confidence", values: r.map((x) => <span key="c" className="capitalize">{x.diagnosis.confidence}</span>) },
        { label: "Matched playbooks", values: r.map((x) => x.sources.map((s) => s.title).join(", ") || "—") },
        { label: "Goal", values: r.map((x) => x.plan.goal) },
        { label: "Quick wins", values: r.map((x) => list(x.plan.quickWins)) },
        { label: "Week 1 focus", values: r.map((x) => x.plan.weeks[0]?.focus ?? "—") },
        { label: "Track", values: r.map((x) => list(x.plan.metrics.map((m) => `${m.name}: ${m.target}`))) },
      ]}
    />
  );
}
