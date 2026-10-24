import { DNotifier, type WorkflowContext } from "@dnotifier-realtime/dnotifier";
import { aiConfig, getNotifier, readContent, type AskFn } from "../llm";
import type { IdeaInput, Report, StreamEvent } from "../types";
import { brandAgent } from "./brand";
import { founderAgent } from "./founder";
import { reportAgent } from "./report";
import { socialAgent } from "./social";
import { strategyAgent } from "./strategy";
import { techAgent } from "./tech";
import type { Agent, AgentContext } from "./types";

// Stages run in order; agents inside a stage run in parallel (DNotifier runAgents).
// Brand + Strategy only need the brief; Social + Tech also use the chosen name and USP.
export const STAGES: Agent[][] = [[founderAgent], [brandAgent, strategyAgent], [socialAgent, techAgent], [reportAgent]];

export const AGENTS: Agent[] = STAGES.flat();

type Emit = (e: StreamEvent) => void;

const noAI: AskFn = async () => {
  throw new Error("AI is not configured");
};

// Small models sometimes skip or mistype fields. Any top-level field whose type
// doesn't match the template is replaced with the template's value.
function fillGaps(live: Record<string, unknown>, template: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...live };
  for (const [key, fallback] of Object.entries(template)) {
    const value = live?.[key];
    const ok = Array.isArray(fallback) ? Array.isArray(value) && value.length > 0 : typeof value === typeof fallback && value !== "";
    if (!ok) out[key] = fallback;
  }
  return out;
}

async function runAgent(agent: Agent, ctx: AgentContext, emit: Emit) {
  emit({ type: "agent", agent: agent.id, status: "running" });
  const agentCtx: AgentContext = { ...ctx, log: (message) => emit({ type: "log", agent: agent.id, message }) };
  try {
    await agent.run(agentCtx);
    if (ctx.live && agent.id !== "brand") {
      // Brand's output is built from real checks, so only model-written sections need patching.
      const scratch: AgentContext = { ...ctx, state: { ...ctx.state }, live: false, log: () => {} };
      await agent.run(scratch);
      const filled = fillGaps(ctx.state[agent.output] as Record<string, unknown>, scratch.state[agent.output] as Record<string, unknown>);
      Object.assign(ctx.state, { [agent.output]: filled });
    }
  } catch (err) {
    if (!ctx.live) throw err;
    // Keep the report complete even if the model returns something unusable for one agent.
    agentCtx.log(`AI error (${(err as Error).message.slice(0, 120)}), using a template instead`);
    await agent.run({ ...agentCtx, live: false });
  }
  emit({ type: "agent", agent: agent.id, status: "done" });
}

// Wraps a Foundry agent as a DNotifier agent whose AI calls go through ctx.sendAI.
function toDNotifierAgent(agent: Agent, base: AgentContext, emit: Emit) {
  return DNotifier.defineAgent({
    name: agent.id,
    description: agent.role,
    provider: aiConfig.provider,
    model: aiConfig.model,
    async run(dctx: WorkflowContext) {
      const ask: AskFn = async (system, user, opts) =>
        readContent(
          await dctx.sendAI({
            provider: aiConfig.provider,
            model: aiConfig.model,
            message: { useKnowledgeBase: false, messages: [{ role: "system", content: system }, { role: "user", content: user }] },
            saveHistory: false,
            label: opts?.label ?? `${agent.name} agent`,
          }),
        );
      await runAgent(agent, { ...base, ask }, emit);
      // Mirror this agent's output into DNotifier's workflow state for the trace dashboard.
      (dctx.state as Record<string, unknown>)[agent.output] = base.state[agent.output];
      return { done: agent.output };
    },
  });
}

async function runWithDNotifier(notifier: DNotifier, ctx: AgentContext, emit: Emit): Promise<string | undefined> {
  const agents = Object.fromEntries(AGENTS.map((a) => [a.id, toDNotifierAgent(a, ctx, emit)]));
  const workflow = new DNotifier.Workflow({
    name: "foundry-business-potential",
    description: "Foundry agent team: founder → brand + strategy → social + tech → report",
    observability: true,
    async entry(wctx: WorkflowContext) {
      for (const [i, stage] of STAGES.entries()) {
        await wctx.runAgents(
          stage.map((a) => a.id),
          { label: `Stage ${i + 1}: ${stage.map((a) => a.name).join(" + ")}` },
        );
      }
      return { ok: true };
    },
  }).registerAgents(agents);

  const run = (await notifier.runWorkflow({ workflow, input: ctx.input, senderId: aiConfig.userId })) as { executionId?: string };
  return run.executionId;
}

export async function runFoundry(input: IdeaInput, emit: Emit): Promise<Report> {
  const notifier = await getNotifier();
  const live = notifier !== null;
  const ctx: AgentContext = { input, state: {}, live, ask: noAI, log: () => {} };

  let executionId: string | undefined;
  if (notifier) {
    executionId = await runWithDNotifier(notifier, ctx, emit);
  } else {
    for (const stage of STAGES) await Promise.all(stage.map((agent) => runAgent(agent, ctx, emit)));
  }

  const { brief, brand, strategy, social, tech, potential } = ctx.state;
  if (!brief || !brand || !strategy || !social || !tech || !potential) {
    throw new Error("An agent did not finish its part of the report");
  }
  return {
    input,
    brief,
    brand,
    strategy,
    social,
    tech,
    potential,
    meta: {
      mode: live ? "live" : "demo",
      model: live ? `${aiConfig.provider}/${aiConfig.model} via DNotifier` : "templates",
      executionId,
      generatedAt: new Date().toISOString(),
    },
  };
}
