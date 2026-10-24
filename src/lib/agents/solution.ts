import { askJson } from "../llm";
import type { ActionPlan, DiagnoseInput } from "../types";
import { founderStory, playbookBrief, topPlaybooks } from "./diagnosis";
import { JSON_RULES } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Solution agent of Foundry. Turn a diagnosis into a prioritised 30-day action plan a busy founder can actually follow.
- Fix the ROOT CAUSE first; quick wins second.
- Each week has a focus and 3 tasks. Tasks are concrete actions (verbs, numbers, owners where useful), not advice.
- Use the founder's real situation (revenue, team size, what they tried) and the playbook fixes provided.
- metrics: what to measure to know the plan is working, with realistic targets.
${JSON_RULES}
Schema: {"goal": string (one sentence), "quickWins": string[] (3, doable in 48 hours), "weeks": [{"week": number, "focus": string, "tasks": [{"task": string, "priority": "high" | "medium" | "low", "outcome": string}] (3)}] (4), "metrics": [{"name": string, "target": string}] (3)}`;

export const solutionAgent: Agent<DiagnoseInput> = {
  id: "solution",
  name: "Solution",
  role: "Builds your 30-day plan",
  output: "plan",
  async run(ctx) {
    const playbooks = topPlaybooks(ctx);
    const diagnosis = ctx.state.diagnosis;

    if (ctx.live && diagnosis) {
      ctx.log("Prioritising fixes into a 30-day plan");
      const knowledge = playbooks.map((p) => playbookBrief(p, ["Fixes", "30-day starter plan", "Metrics"])).join("\n\n");
      ctx.state.plan = await askJson<ActionPlan>(
        ctx.ask,
        SYSTEM,
        `${founderStory(ctx.input)}\n\nDiagnosis:\nRoot cause: ${diagnosis.rootCause}\n${diagnosis.explanation}\nSecondary issues: ${diagnosis.secondaryIssues.join("; ")}\n\nPlaybook fixes:\n${knowledge}`,
        "Build 30-day plan",
      );
      return;
    }

    const main = playbooks[0];
    const fixes = main.sections["Fixes"] ?? [];
    const weekly = main.sections["30-day starter plan"] ?? [];
    ctx.state.plan = {
      goal: `Fix the root cause: ${diagnosis?.rootCause ?? main.title}`,
      quickWins: fixes.slice(0, 3),
      weeks: [1, 2, 3, 4].map((week) => {
        const line = weekly.find((l) => l.startsWith(`Week ${week}`))?.replace(/^Week \d+:\s*/, "") ?? fixes[week - 1] ?? "Review progress";
        return {
          week,
          focus: line,
          tasks: [
            { task: line, priority: "high" as const, outcome: "Core fix in place" },
            { task: fixes[(week + 2) % Math.max(fixes.length, 1)] ?? "Measure results", priority: "medium" as const, outcome: "Supports the main fix" },
            { task: "Review your key metric and note what changed", priority: "low" as const, outcome: "Know if it is working" },
          ],
        };
      }),
      metrics: (main.sections["Metrics"] ?? []).map((name) => ({ name, target: "Improve week over week" })),
    };
  },
};
