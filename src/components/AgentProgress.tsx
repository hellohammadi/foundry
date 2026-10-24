"use client";

import type { AgentId } from "@/lib/types";

type AgentInfo = { id: AgentId; name: string; role: string };

// Client-safe copies of each team's lineup (the agents themselves run on the server).
export const IDEA_AGENTS: AgentInfo[] = [
  { id: "founder", name: "Founder", role: "Turns your idea into a brief" },
  { id: "brand", name: "Brand", role: "Names, domains and handles" },
  { id: "strategy", name: "Strategy", role: "USP, story, roadmap and scale" },
  { id: "social", name: "Social", role: "Platforms, posts and calendar" },
  { id: "tech", name: "Tech & Automation", role: "MVP, stack and automations" },
  { id: "report", name: "Report", role: "Scores your business potential" },
];

export const DIAGNOSE_AGENTS: AgentInfo[] = [
  { id: "diagnosis", name: "Diagnosis", role: "Searches playbooks, finds the root problem" },
  { id: "solution", name: "Solution", role: "Builds your 30-day plan" },
];

export type AgentStatus = { status: "waiting" | "running" | "done" | "error"; log?: string };
export type Statuses = Partial<Record<AgentId, AgentStatus>>;

export function initialStatuses(agents: AgentInfo[]): Statuses {
  return Object.fromEntries(agents.map((a) => [a.id, { status: "waiting" }]));
}

export function AgentProgress({ agents, statuses, finished = false }: { agents: AgentInfo[]; statuses: Statuses; finished?: boolean }) {
  if (finished) {
    // Once the report is ready, shrink the team to a single summary line.
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="text-ok">✓</span>
        <span className="font-medium">{agents.length} agents finished</span>
        {agents.map((a) => (
          <span key={a.id} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{a.name}</span>
        ))}
      </div>
    );
  }
  return (
    <section aria-label="Agent progress" className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-sm font-medium text-muted">Your agent team is working</h2>
      <ol className={`grid gap-3 sm:grid-cols-2 ${agents.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {agents.map((agent) => {
          const s = statuses[agent.id] ?? { status: "waiting" };
          return (
            <li
              key={agent.id}
              className={`rounded-xl border p-3 transition-colors ${s.status === "running" ? "border-accent bg-accent-soft" : "border-line"}`}
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

// Applies a stream event to the status map.
export function applyAgentEvent(s: Statuses, e: { type: string; agent?: AgentId; status?: AgentStatus["status"]; message?: string }): Statuses {
  if (!e.agent) return s;
  if (e.type === "agent" && e.status) return { ...s, [e.agent]: { ...s[e.agent], status: e.status } };
  if (e.type === "log") return { ...s, [e.agent]: { status: s[e.agent]?.status ?? "running", log: e.message } };
  return s;
}
