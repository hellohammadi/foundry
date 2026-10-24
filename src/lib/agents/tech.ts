import { askJson } from "../llm";
import type { TechResult } from "../types";
import { ideaContext, JSON_RULES } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Tech & Automation agent of Foundry. You plan the simplest technology to launch and the automations that let the business run without the founder doing everything by hand.
- mvp: the smallest version that can take real money, in 1-2 sentences.
- stack: affordable, beginner-friendly tools (prefer free tiers and open source), with rough monthly cost.
- automations: the 5 highest-impact workflows for THIS business, each with a trigger and concrete steps that could be built in n8n, Zapier or Make.
${JSON_RULES}
Schema: {"mvp": string, "stack": [{"layer": string, "tool": string, "cost": string}] (5), "automations": [{"name": string, "trigger": string, "steps": string[] (3-4), "tools": string[], "impact": string}] (5), "launchChecklist": string[] (6)}`;

export const techAgent: Agent = {
  id: "tech",
  name: "Tech & Automation",
  role: "MVP, stack and automations",
  output: "tech",
  async run(ctx) {
    if (ctx.live) {
      ctx.log("Designing the MVP, stack and automations");
      ctx.state.tech = await askJson<TechResult>(ctx.ask, SYSTEM, ideaContext(ctx));
      return;
    }
    ctx.state.tech = {
      mvp: "A one-page website with a waitlist and payment link, plus manual fulfilment for the first customers.",
      stack: [
        { layer: "Website", tool: "Framer or Next.js on Vercel", cost: "Free" },
        { layer: "Payments", tool: "Stripe Payment Links", cost: "Per transaction" },
        { layer: "Email", tool: "Brevo", cost: "Free up to 300/day" },
        { layer: "Automation", tool: "n8n (self-hosted)", cost: "Free" },
        { layer: "Records", tool: "Google Sheets", cost: "Free" },
      ],
      automations: [
        { name: "Order confirmation", trigger: "New payment received", steps: ["Send confirmation email", "Add order to Google Sheet", "Notify founder on Telegram"], tools: ["Stripe", "Brevo", "Google Sheets", "Telegram"], impact: "Saves ~15 minutes per order" },
        { name: "DM auto-reply", trigger: "New Instagram DM", steps: ["Detect common questions", "Reply with price and link", "Flag anything else for the founder"], tools: ["Instagram", "n8n"], impact: "Answers customers 24/7" },
        { name: "Review requests", trigger: "3 days after delivery", steps: ["Send a thank-you email", "Ask for a review with a direct link", "Log the response"], tools: ["Brevo", "Google Sheets"], impact: "Builds social proof on autopilot" },
        { name: "Waitlist welcome", trigger: "New waitlist signup", steps: ["Send welcome email", "Wait 2 days, send founder story", "Wait 3 days, send launch offer"], tools: ["Brevo"], impact: "Turns signups into first buyers" },
        { name: "Weekly summary", trigger: "Every Monday 9am", steps: ["Collect sales from Sheet", "Count new followers and signups", "Email a one-page summary"], tools: ["Google Sheets", "Brevo"], impact: "Keeps you focused on numbers that matter" },
      ],
      launchChecklist: [
        "Register the business name",
        "Buy the .com domain",
        "Claim social handles on every platform",
        "Publish the landing page with waitlist",
        "Set up payments",
        "Turn on the first two automations",
      ],
    };
  },
};
