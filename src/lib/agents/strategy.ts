import { askJson } from "../llm";
import type { StrategyResult } from "../types";
import { ideaContext, JSON_RULES } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Strategy agent of Foundry. You find what makes a business special and plan how it grows.
- usp: one sharp sentence on why customers pick this over alternatives.
- competitors: realistic types of existing alternatives and the gap each leaves open.
- emotionalCore: the feeling customers really buy (people buy feelings, not products).
- brandStory: 3-4 sentences a founder could put on their About page.
- roadmap: 4 phases from validation to first customers to growth, with concrete steps.
- scalePlan: how this grows beyond the founder (automation, channels, hiring, partnerships).
${JSON_RULES}
Schema: {"usp": string, "competitors": [{"name": string, "gap": string}] (3), "emotionalCore": string, "brandStory": string, "toneOfVoice": string[] (3 adjectives), "roadmap": [{"phase": string, "timeframe": string, "steps": string[] (3)}] (4), "scalePlan": string[] (5), "risks": string[] (3)}`;

export const strategyAgent: Agent = {
  id: "strategy",
  name: "Strategy",
  role: "USP, story, roadmap and scale",
  output: "strategy",
  async run(ctx) {
    if (ctx.live) {
      ctx.log("Mapping competitors and finding your unique edge");
      ctx.state.strategy = await askJson<StrategyResult>(ctx.ask, SYSTEM, ideaContext(ctx));
      return;
    }
    const audience = ctx.state.brief?.audience ?? "your customers";
    ctx.state.strategy = {
      usp: `The most personal, trustworthy option for ${audience.toLowerCase()}, delivered with care big players can't match.`,
      competitors: [
        { name: "Large marketplaces", gap: "Cheap but impersonal; no story or community." },
        { name: "Local independents", gap: "Personal but hard to discover and rarely online." },
        { name: "DIY alternatives", gap: "Takes time and know-how most people don't have." },
      ],
      emotionalCore: "Feeling understood and looked after.",
      brandStory:
        "It started with a simple frustration: what we wanted didn't exist in a way that felt right. So we built it ourselves, with care in every detail. Today we share it with people who value quality and a human touch.",
      toneOfVoice: ["Warm", "Confident", "Down-to-earth"],
      roadmap: [
        { phase: "Validate", timeframe: "Weeks 1-2", steps: ["Talk to 20 potential customers", "Pre-sell to 5 people", "Check 3 competitors' reviews for complaints"] },
        { phase: "Launch MVP", timeframe: "Weeks 3-6", steps: ["Register the business and domain", "Launch a simple landing page", "Deliver to the first 10 customers by hand"] },
        { phase: "First traction", timeframe: "Months 2-3", steps: ["Post content daily on one platform", "Collect testimonials", "Introduce a referral reward"] },
        { phase: "Grow", timeframe: "Months 4-12", steps: ["Automate orders and support", "Add a second channel", "Hire your first helper"] },
      ],
      scalePlan: [
        "Automate repetitive work before hiring",
        "Turn one-off buyers into repeat or subscription customers",
        "Partner with complementary brands for cross-promotion",
        "Document every process so others can run it",
        "Expand to a new audience or region once unit economics work",
      ],
      risks: ["Customer acquisition costs rising", "Easy for competitors to copy", "Founder burnout from doing everything"],
    };
  },
};
