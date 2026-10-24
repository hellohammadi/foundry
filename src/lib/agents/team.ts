// Runs a team of agents as one DNotifier workflow (or locally in demo mode).
import { DNotifier, type WorkflowContext } from "@dnotifier-realtime/dnotifier";
import { hitsFromSearch, localSearch } from "../knowledge";
import { aiConfig, getNotifier, readContent, type AskFn } from "../llm";
import type { StreamEvent } from "../types";
import type { Agent, AgentContext, AgentState, SearchFn } from "./types";

export type Emit = (e: StreamEvent) => void;

export type TeamSpec<I> = {
  workflow: string;
  description: string;
  // Stages run in order; agents inside a stage run in parallel (DNotifier runAgents).
  stages: Agent<I>[][];
};

export type TeamResult = { state: AgentState; live: boolean; executionId?: string };

const noAI: AskFn = async () => {
  throw new Error("AI is not configured");
};

const localSearchFn: SearchFn = async (query, limit) => localSearch(query, limit);

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

async function runAgent<I>(agent: Agent<I>, ctx: AgentContext<I>, emit: Emit) {
  emit({ type: "agent", agent: agent.id, status: "running" });
  const agentCtx: AgentContext<I> = { ...ctx, log: (message) => emit({ type: "log", agent: agent.id, message }) };
  try {
    await agent.run(agentCtx);
    if (ctx.live && agent.id !== "brand") {
      // Brand's output is built from real checks, so only model-written sections need patching.
      const scratch: AgentContext<I> = { ...ctx, state: { ...ctx.state }, live: false, search: localSearchFn, log: () => {} };
      await agent.run(scratch);
      const filled = fillGaps(ctx.state[agent.output] as Record<string, unknown>, scratch.state[agent.output] as Record<string, unknown>);
      Object.assign(ctx.state, { [agent.output]: filled });
    }
  } catch (err) {
    if (!ctx.live) throw err;
    // Keep the report complete even if the model returns something unusable for one agent.
    agentCtx.log(`AI error (${(err as Error).message.slice(0, 120)}), using a template instead`);
    await agent.run({ ...agentCtx, live: false, search: localSearchFn });
  }
  emit({ type: "agent", agent: agent.id, status: "done" });
}

// Wraps a Foundry agent as a DNotifier agent whose AI and search calls go through the workflow context.
function toDNotifierAgent<I>(agent: Agent<I>, base: AgentContext<I>, emit: Emit) {
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
      const search: SearchFn = async (query, limit = 5) =>
        hitsFromSearch(await dctx.search({ query, limit, label: `${agent.name}: knowledge search` }));
      await runAgent(agent, { ...base, ask, search }, emit);
      // Mirror this agent's output into DNotifier's workflow state for the trace dashboard.
      (dctx.state as Record<string, unknown>)[agent.output] = base.state[agent.output];
      return { done: agent.output };
    },
  });
}

export async function runTeam<I>(spec: TeamSpec<I>, input: I, emit: Emit, before?: (n: DNotifier) => Promise<void>): Promise<TeamResult> {
  const notifier = await getNotifier();
  const ctx: AgentContext<I> = { input, state: {}, live: notifier !== null, ask: noAI, search: localSearchFn, log: () => {} };

  if (!notifier) {
    for (const stage of spec.stages) await Promise.all(stage.map((agent) => runAgent(agent, ctx, emit)));
    return { state: ctx.state, live: false };
  }

  await before?.(notifier);
  const agents = Object.fromEntries(spec.stages.flat().map((a) => [a.id, toDNotifierAgent(a, ctx, emit)]));
  const workflow = new DNotifier.Workflow({
    name: spec.workflow,
    description: spec.description,
    observability: true,
    async entry(wctx: WorkflowContext) {
      for (const [i, stage] of spec.stages.entries()) {
        await wctx.runAgents(
          stage.map((a) => a.id),
          { label: `Stage ${i + 1}: ${stage.map((a) => a.name).join(" + ")}` },
        );
      }
      return { ok: true };
    },
  }).registerAgents(agents);

  const run = (await notifier.runWorkflow({ workflow, input, senderId: aiConfig.userId })) as { executionId?: string };
  return { state: ctx.state, live: true, executionId: run.executionId };
}

export function meta(result: TeamResult) {
  return {
    mode: result.live ? ("live" as const) : ("demo" as const),
    model: result.live ? `${aiConfig.provider}/${aiConfig.model} via DNotifier` : "templates",
    executionId: result.executionId,
    generatedAt: new Date().toISOString(),
  };
}
