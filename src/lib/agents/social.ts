import { factsForPrompt, resolveFacts } from "../facts";
import { askJson } from "../llm";
import type { FunnelPhase, FunnelStage, SocialResult } from "../types";
import { ideaContext, JSON_RULES, keywords } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Social Media Strategist agent of Foundry. Think like a senior strategist planning a launch, not a content intern.
Build a 3-phase funnel that moves strangers to customers:
1. AWARENESS: get discovered by the right people. Reach, hooks, problem-aware content.
2. ENGAGEMENT: turn viewers into followers who trust the brand. Conversations, community, proof, behind the scenes.
3. CONVERSION: turn trust into action with one clear call to action per phase. Offers, social proof, urgency, easy next step.

Rules:
- Pick platforms where THIS audience actually spends time, and justify each with the facts provided.
- Facts: you may ONLY use statistics from the VERIFIED FACTS list. Cite them by id in "factIds"/"keyFactIds". Never write any other statistic or percentage in your own text. (Targets/KPIs you set are fine.)
- Each phase: a concrete goal, what the customer is thinking (audienceMindset), tactics, content ideas, KPIs with realistic targets for a new brand, and ONE call to action.
- The 14-day calendar follows the funnel: days 1-5 awareness, 6-10 engagement, 11-14 conversion.
- Posts: 2 awareness, 2 engagement, 1 conversion. Hooks must stop the scroll in under 2 seconds.
${JSON_RULES}
Schema: {"positioning": string (one line: how the brand should show up on social), "audienceInsight": string (what this audience wants from social, 1-2 sentences), "platforms": [{"name": string, "why": string, "priority": "primary" | "secondary", "factIds": string[]}] (2-3), "funnel": [{"stage": "awareness" | "engagement" | "conversion", "goal": string, "timeframe": string, "audienceMindset": string, "tactics": string[] (3), "contentIdeas": [{"platform": string, "format": string, "idea": string}] (3), "kpis": [{"name": string, "target": string}] (2), "cta": string}] (exactly 3, in order), "pillars": [{"name": string, "description": string}] (4), "bios": [{"platform": string, "bio": string (under 150 chars)}], "posts": [{"stage": "awareness" | "engagement" | "conversion", "platform": string, "hook": string, "caption": string, "cta": string, "hashtags": string[] (5)}] (5), "calendar": [{"day": number, "stage": "awareness" | "engagement" | "conversion", "platform": string, "format": string, "idea": string}] (14), "viralIdeas": string[] (3), "keyFactIds": string[] (3-5 facts that best support this strategy)}`;

export const STAGES: FunnelStage[] = ["awareness", "engagement", "conversion"];

export function stageForDay(day: number): FunnelStage {
  return day <= 5 ? "awareness" : day <= 10 ? "engagement" : "conversion";
}

// Keeps the model's output in funnel order and attaches the verified facts it cited.
function finalise(result: Omit<SocialResult, "facts">): SocialResult {
  const funnel = STAGES.map((stage) => result.funnel?.find((p) => p.stage === stage)).filter((p): p is FunnelPhase => Boolean(p));
  const ids = [...(result.keyFactIds ?? []), ...(result.platforms ?? []).flatMap((p) => p.factIds ?? [])];
  return {
    ...result,
    funnel: funnel.length === 3 ? funnel : result.funnel,
    calendar: (result.calendar ?? []).map((c) => ({ ...c, stage: STAGES.includes(c.stage) ? c.stage : stageForDay(c.day) })),
    facts: resolveFacts(ids),
  };
}

export const socialAgent: Agent = {
  id: "social",
  name: "Social",
  role: "Awareness → engagement → conversion",
  output: "social",
  async run(ctx) {
    if (ctx.live) {
      ctx.log("Building an awareness → engagement → conversion funnel");
      const result = await askJson<Omit<SocialResult, "facts">>(
        ctx.ask,
        SYSTEM,
        `${ideaContext(ctx)}\n\nVERIFIED FACTS (cite by id only):\n${factsForPrompt(ctx.input.location)}`,
        "Social funnel strategy",
      );
      ctx.state.social = finalise(result);
      return;
    }

    const name = ctx.state.brand?.recommended ?? "Your brand";
    const tags = keywords(ctx.input.idea, 3).map((k) => `#${k}`);
    const india = /india/i.test(ctx.input.location ?? "");
    const ideas: Record<FunnelStage, string[]> = {
      awareness: ["The problem nobody talks about in our niche", "3 mistakes people make (and how to avoid them)", "Why we started — founder story", "Myth vs fact", "A day in the life behind the brand"],
      engagement: ["Behind the scenes: how it's made", "Poll: which one would you pick?", "Answering your questions live", "Customer story: before and after", "Meet the team"],
      conversion: ["Launch offer for our first 50 customers", "Real reviews from real customers", "Last chance: offer ends tonight", "How to order in 30 seconds"],
    };
    const formats: Record<FunnelStage, string[]> = {
      awareness: ["Reel", "Short video", "Carousel"],
      engagement: ["Story poll", "Live", "Carousel"],
      conversion: ["Reel", "Story with link", "Post"],
    };
    ctx.state.social = finalise({
      positioning: `${name} shows up as the friendly expert: useful first, sales second.`,
      audienceInsight: "Your audience scrolls for entertainment and useful tips. They follow brands that feel human and buy from brands they already trust.",
      platforms: [
        { name: "Instagram", why: "Best for visual storytelling and reaching younger adults with Reels.", priority: "primary", factIds: ["pew-instagram"] },
        { name: "YouTube", why: "The most widely used platform; great for Shorts and longer how-to videos that build trust.", priority: "primary", factIds: ["pew-youtube"] },
        { name: "Facebook", why: "Strong for reaching adults aged 30–49 and running local community groups.", priority: "secondary", factIds: ["pew-facebook"] },
      ],
      funnel: [
        {
          stage: "awareness",
          goal: "Get discovered by people who have the problem you solve",
          timeframe: "Weeks 1–2",
          audienceMindset: "\"I didn't know this existed.\" They're scrolling, not shopping.",
          tactics: ["Post short videos daily with a strong hook in the first 2 seconds", "Talk about the customer's problem, not your product", "Collaborate with 2–3 small creators in your niche"],
          contentIdeas: ideas.awareness.slice(0, 3).map((idea, i) => ({ platform: i % 2 ? "YouTube" : "Instagram", format: formats.awareness[i], idea })),
          kpis: [{ name: "Reach", target: "10,000 accounts in 2 weeks" }, { name: "New followers", target: "300" }],
          cta: "Follow for more tips like this",
        },
        {
          stage: "engagement",
          goal: "Turn viewers into followers who trust you",
          timeframe: "Weeks 2–3",
          audienceMindset: "\"These people get me — but can I trust them?\"",
          tactics: ["Reply to every comment and DM within an hour", "Run polls and Q&As to learn what they want", "Share behind-the-scenes and real customer stories"],
          contentIdeas: ideas.engagement.slice(0, 3).map((idea, i) => ({ platform: "Instagram", format: formats.engagement[i], idea })),
          kpis: [{ name: "Engagement rate", target: "4%+" }, { name: "Saves and shares", target: "100 per week" }],
          cta: "Comment or DM us your question",
        },
        {
          stage: "conversion",
          goal: "Turn trust into first sales",
          timeframe: "Week 4",
          audienceMindset: "\"I'm interested — is it worth it, and is it easy to buy?\"",
          tactics: ["Launch a limited offer for early followers", "Show reviews and results as proof", "Make buying one tap away with a link in bio and story links"],
          contentIdeas: ideas.conversion.slice(0, 3).map((idea, i) => ({ platform: "Instagram", format: formats.conversion[i], idea })),
          kpis: [{ name: "Link clicks", target: "500" }, { name: "First customers", target: "25" }],
          cta: "Tap the link in bio to claim the launch offer",
        },
      ],
      pillars: [
        { name: "Teach", description: "Quick tips that make your audience's life easier." },
        { name: "Behind the scenes", description: "Show the people and process behind the brand." },
        { name: "Proof", description: "Reviews, results and customer stories." },
        { name: "Offer", description: "Launches, limited drops and promotions." },
      ],
      bios: [
        { platform: "Instagram", bio: `${name} — ${ctx.state.brand?.tagline ?? ""} ✨ Tips daily · Launch offer 👇` },
        { platform: "YouTube", bio: `${name}: honest tips and behind the scenes as we build.` },
        { platform: "Facebook", bio: `Welcome to ${name}! Join our community for tips, offers and updates.` },
      ],
      posts: [
        { stage: "awareness", platform: "Instagram", hook: ideas.awareness[0], caption: `Most people don't realise this until it's too late. Here's what we learned building ${name}.`, cta: "Follow for part 2", hashtags: [...tags, "#smallbusiness", "#tips"].slice(0, 5) },
        { stage: "awareness", platform: "YouTube", hook: ideas.awareness[1], caption: "Avoid these and you're already ahead of most people.", cta: "Subscribe for weekly tips", hashtags: [...tags, "#shorts", "#howto"].slice(0, 5) },
        { stage: "engagement", platform: "Instagram", hook: ideas.engagement[1], caption: "We're deciding what to launch next — vote in our story!", cta: "Vote in our story", hashtags: [...tags, "#community", "#behindthescenes"].slice(0, 5) },
        { stage: "engagement", platform: "Instagram", hook: ideas.engagement[3], caption: "Real story from one of our first customers.", cta: "Comment your own story", hashtags: [...tags, "#customerlove", "#realresults"].slice(0, 5) },
        { stage: "conversion", platform: "Instagram", hook: ideas.conversion[0], caption: "Our launch offer is live for the first 50 customers. Thank you for being here from day one.", cta: "Tap the link in bio", hashtags: [...tags, "#launch", "#offer"].slice(0, 5) },
      ],
      calendar: Array.from({ length: 14 }, (_, i) => {
        const day = i + 1;
        const stage = stageForDay(day);
        const list = ideas[stage];
        return { day, stage, platform: day % 3 === 0 ? "YouTube" : "Instagram", format: formats[stage][i % 3], idea: list[i % list.length] };
      }),
      viralIdeas: ["Before/after transformation in 15 seconds", "A 30-day 'building my business' series", "Stitch a common complaint in your niche with your solution"],
      keyFactIds: [india ? "dr-india" : "dr-users", "dr-discovery", "sprout-respond", "sprout-original", "sprout-trends"],
    });
  },
};
