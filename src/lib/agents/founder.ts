import { askJson } from "../llm";
import type { Brief } from "../types";
import { capitalize, ideaContext, JSON_RULES, keywords } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Founder agent of Foundry, a team of AI agents that helps people discover their business potential.
Turn a raw business idea into a clear brief that the other agents (brand, strategy, social, tech) will build on.
${JSON_RULES}
Schema: {"summary": string (one sentence), "category": string, "audience": string, "problem": string, "businessModel": string, "keywords": string[] (3-5)}`;

export const founderAgent: Agent = {
  id: "founder",
  name: "Founder",
  role: "Turns your idea into a brief",
  output: "brief",
  async run(ctx) {
    if (!ctx.live) {
      const words = keywords(ctx.input.idea);
      ctx.state.brief = {
        summary: capitalize(ctx.input.idea.trim().replace(/\.$/, "")) + ".",
        category: words[0] ? `${capitalize(words[0])} business` : "Small business",
        audience: ctx.input.audience || "People who need this in their daily lives",
        problem: `Customers struggle to find a trusted, convenient ${words.slice(0, 2).join(" ") || "option"}.`,
        businessModel: "Direct-to-customer sales, growing into repeat purchases or subscriptions",
        keywords: words,
      };
      return;
    }
    ctx.log("Reading your idea and writing the brief");
    ctx.state.brief = await askJson<Brief>(ctx.ask, SYSTEM, ideaContext(ctx));
  },
};
