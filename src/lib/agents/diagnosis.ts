import { getPlaybook, loadPlaybooks, type Playbook } from "../knowledge";
import { askJson } from "../llm";
import type { DiagnoseInput, DiagnosisResult } from "../types";
import { JSON_RULES } from "./shared";
import type { Agent, AgentContext } from "./types";

const SYSTEM = `You are the Diagnosis agent of Foundry. Like a good doctor, you separate SYMPTOMS (what the founder notices) from the ROOT CAUSE (why it is happening).
Use the founder's answers and the playbooks retrieved from Foundry's knowledge base. Be specific to their numbers and situation. If the evidence is thin, say so through the confidence level.
- symptoms: what the founder is experiencing, in plain words.
- rootCause: ONE sentence naming the underlying cause.
- explanation: 2-3 sentences connecting their answers to that root cause.
- evidence: which playbook supports the diagnosis and the insight it adds (use the playbook titles given).
${JSON_RULES}
Schema: {"symptoms": string[] (3), "rootCause": string, "explanation": string, "confidence": "high" | "medium" | "low", "secondaryIssues": string[] (2), "evidence": [{"playbook": string, "insight": string}] (1-3)}`;

export function founderStory(input: DiagnoseInput): string {
  const answers = input.answers.filter((a) => a.answer.trim()).map((a) => `Q: ${a.question}\nA: ${a.answer}`);
  return [`Founder's problem: ${input.problem}`, ...answers].join("\n\n");
}

export function playbookBrief(p: Playbook, sections: string[]): string {
  return [`### ${p.title}`, ...sections.flatMap((s) => (p.sections[s]?.length ? [`${s}:`, ...p.sections[s].map((l) => `- ${l}`)] : []))].join("\n");
}

export function topPlaybooks(ctx: AgentContext<DiagnoseInput>): Playbook[] {
  const found = (ctx.state.sources ?? []).map((s) => getPlaybook(s.slug)).filter((p): p is Playbook => Boolean(p));
  return found.length ? found : [loadPlaybooks()[0]];
}

export const diagnosisAgent: Agent<DiagnoseInput> = {
  id: "diagnosis",
  name: "Diagnosis",
  role: "Finds the root problem",
  output: "diagnosis",
  async run(ctx) {
    if (!ctx.state.sources) {
      ctx.log("Searching the playbook knowledge base");
      ctx.state.sources = (await ctx.search(founderStory(ctx.input), 6)).slice(0, 3);
      if (ctx.state.sources.length) ctx.log(`Matched: ${ctx.state.sources.map((s) => s.title).join(", ")}`);
    }
    const playbooks = topPlaybooks(ctx);

    if (ctx.live) {
      ctx.log("Separating symptoms from the root cause");
      const knowledge = playbooks.map((p) => playbookBrief(p, ["Symptoms", "Root causes", "How to confirm"])).join("\n\n");
      ctx.state.diagnosis = await askJson<DiagnosisResult>(
        ctx.ask,
        SYSTEM,
        `${founderStory(ctx.input)}\n\nRetrieved playbooks:\n${knowledge}`,
        "Diagnose root cause",
      );
      return;
    }

    const [main, ...others] = playbooks;
    ctx.state.diagnosis = {
      symptoms: (main.sections["Symptoms"] ?? []).slice(0, 3),
      rootCause: main.sections["Root causes"]?.[0] ?? main.title,
      explanation: `Your description matches the "${main.title}" pattern. Founders in this situation usually see the symptoms above, but the underlying driver is what needs fixing first.`,
      confidence: "medium",
      secondaryIssues: (main.sections["Root causes"] ?? []).slice(1, 3),
      evidence: [main, ...others].map((p) => ({ playbook: p.title, insight: p.sections["How to confirm"]?.[0] ?? "" })),
    };
  },
};
