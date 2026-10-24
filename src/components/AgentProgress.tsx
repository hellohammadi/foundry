"use client";

import type { AgentId } from "@/lib/types";

// Client-safe copy of the agent lineup (the agents themselves run on the server).
export const AGENT_INFO: { id: AgentId; name: string; role: string }[] = [
  { id: "founder", name: "Founder", role: "Turns your idea into a brief" },
  { id: "brand", name: "Brand", role: "Names, domains and handles" },
  { id: "strategy", name: "Strategy", role: "USP, story, roadmap and scale" },
  { id: "social", name: "Social", role: "Platforms, posts and calendar" },
  { id: "tech", name: "Tech & Automation", role: "MVP, stack and automations" },
  { id: "report", name: "Report", role: "Scores your business potential" },
];

export type AgentStatus = { status: "waiting" | "running" | "done" | "error"; log?: string };

export function AgentProgress({ statuses }: { statuses: Record<AgentId, AgentStatus> }) {
  return (
    <section aria-label="Agent progress" className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-sm font-medium text-muted">Your agent team is working</h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_INFO.map((agent) => {
          const s = statuses[agent.id];
          return (
            <li
              key={agent.id}
              className={`rounded-xl border p-3 transition-colors ${
                s.status === "running" ? "border-accent bg-accent-soft" : "border-line"
              }`}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={s.status} />
                <span className="font-medium">{agent.name}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{s.log ?? agent.role}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatusDot({ status }: { status: AgentStatus["status"] }) {
  if (status === "done") return <span aria-label="Done" className="text-ok">✓</span>;
  if (status === "error") return <span aria-label="Error" className="text-bad">✕</span>;
  return (
    <span
      aria-label={status === "running" ? "Working" : "Waiting"}
      className={`inline-block h-2.5 w-2.5 rounded-full ${status === "running" ? "pulse-dot bg-accent" : "bg-line"}`}
    />
  );
}
