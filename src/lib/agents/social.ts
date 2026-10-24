import { askJson } from "../llm";
import type { SocialResult } from "../types";
import { ideaContext, JSON_RULES, keywords } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Social Media agent of Foundry. You plan how a new business becomes known and loved on social media.
Pick the platforms where this audience actually spends time. Write hooks that stop the scroll. Content must match the brand's emotional core and tone.
- calendar: 14 days (day 1-14), mixing educational, behind-the-scenes, social proof and offer posts.
- viralIdeas: formats or challenges with real viral potential for this niche.
${JSON_RULES}
Schema: {"platforms": [{"name": string, "why": string, "priority": "primary" | "secondary"}] (3), "pillars": [{"name": string, "description": string}] (4), "bios": [{"platform": string, "bio": string (under 150 chars)}] (one per platform), "posts": [{"platform": string, "hook": string, "caption": string, "hashtags": string[] (5)}] (5), "calendar": [{"day": number, "platform": string, "format": string, "idea": string}] (14), "viralIdeas": string[] (4)}`;

export const socialAgent: Agent = {
  id: "social",
  name: "Social",
  role: "Platforms, posts and calendar",
  output: "social",
  async run(ctx) {
    if (ctx.live) {
      ctx.log("Planning platforms, posts and a 14-day calendar");
      ctx.state.social = await askJson<SocialResult>(ctx.ask, SYSTEM, ideaContext(ctx));
      return;
    }
    const name = ctx.state.brand?.recommended ?? "Your brand";
    const tags = keywords(ctx.input.idea, 3).map((k) => `#${k}`);
    const formats = ["Reel", "Carousel", "Story", "Reel", "Post", "Live", "Reel"];
    const ideas = [
      "Why we started — founder story",
      "3 mistakes people make (and how we fix them)",
      "Behind the scenes: how it's made",
      "Customer reaction / unboxing",
      "Myth vs fact in our niche",
      "Day in the life of the founder",
      "Launch offer for the first 50 followers",
    ];
    ctx.state.social = {
      platforms: [
        { name: "Instagram", why: "Visual storytelling and Reels reach new people fast.", priority: "primary" },
        { name: "TikTok", why: "Best organic reach for a brand-new account.", priority: "primary" },
        { name: "LinkedIn", why: "Founder story builds trust and partnerships.", priority: "secondary" },
      ],
      pillars: [
        { name: "Teach", description: "Quick tips that make your audience's life easier." },
        { name: "Behind the scenes", description: "Show the people and process behind the brand." },
        { name: "Proof", description: "Reviews, results and customer stories." },
        { name: "Offer", description: "Launches, limited drops and promotions." },
      ],
      bios: [
        { platform: "Instagram", bio: `${name} — ${ctx.state.brand?.tagline ?? ""} ✨ New drops weekly 👇` },
        { platform: "TikTok", bio: `Building ${name} in public. Follow the journey 🚀` },
        { platform: "LinkedIn", bio: `Founder of ${name}. Sharing what we learn building it.` },
      ],
      posts: ideas.slice(0, 5).map((idea, i) => ({
        platform: i % 2 ? "TikTok" : "Instagram",
        hook: idea,
        caption: `${idea}. Here's what we've learned building ${name} — save this for later!`,
        hashtags: [...tags, "#smallbusiness", "#startup"].slice(0, 5),
      })),
      calendar: Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        platform: i % 3 === 2 ? "TikTok" : "Instagram",
        format: formats[i % formats.length],
        idea: ideas[i % ideas.length],
      })),
      viralIdeas: [
        "Before/after transformation in 15 seconds",
        "Rate-my-setup style reactions from customers",
        "A 30-day 'building my business' series",
        "Duet or stitch a trending complaint in your niche with your solution",
      ],
    };
  },
};
