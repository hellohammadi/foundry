import { askJson } from "../llm";
import type { PotentialResult } from "../types";
import { ideaContext, JSON_RULES } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Report agent of Foundry. You have read the work of the brand, strategy, social and tech agents.
Give an honest, encouraging verdict on this business's potential. Score 0-100 considering demand, differentiation, ease of starting, scalability and brand availability. Don't inflate scores.
${JSON_RULES}
Schema: {"score": number, "verdict": string (2 sentences), "strengths": string[] (3), "watchOuts": string[] (3), "nextSteps": string[] (3, things to do this week)}`;

export const reportAgent: Agent = {
  id: "report",
  name: "Report",
  role: "Scores your business potential",
  output: "potential",
  async run(ctx) {
    const best = ctx.state.brand?.names[0];
    if (ctx.live) {
      ctx.log("Scoring your business potential");
      const extra = [
        best && `Best name availability score: ${best.score}/100`,
        ctx.state.tech && `Planned automations: ${ctx.state.tech.automations.map((a) => a.name).join(", ")}`,
        ctx.state.social && `Primary platforms: ${ctx.state.social.platforms.map((p) => p.name).join(", ")}`,
      ];
      const potential = await askJson<PotentialResult>(ctx.ask, SYSTEM, [ideaContext(ctx), ...extra].filter(Boolean).join("\n"));
      potential.score = Math.max(0, Math.min(100, Math.round(Number(potential.score) || 0)));
      ctx.state.potential = potential;
      return;
    }
    const nameBonus = best ? Math.round(best.score / 10) : 0;
    ctx.state.potential = {
      score: 62 + nameBonus,
      verdict: `A promising idea with a clear audience. Its success will depend on standing out with a strong brand and reaching customers consistently.`,
      strengths: ["Clear customer need", "Can start small with low cost", "Strong potential for automation"],
      watchOuts: ["Competition from established players", "Needs consistent content to build awareness", "Validate pricing before scaling"],
      nextSteps: [
        best ? `Secure ${best.slug}.com and the matching handles today` : "Pick a name and secure the domain",
        "Talk to 10 potential customers this week",
        "Publish your first post introducing the brand",
      ],
    };
  },
};
