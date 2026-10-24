import { checkDomains } from "../checks/domains";
import { checkHandles } from "../checks/handles";
import { askJson } from "../llm";
import type { DomainCheck, HandleCheck, NameCandidate } from "../types";
import { capitalize, ideaContext, JSON_RULES, keywords } from "./shared";
import type { Agent } from "./types";

const SYSTEM = `You are the Brand agent of Foundry. Invent brandable business names.
Good names are short (ideally under 12 letters), easy to spell and say, memorable, and hint at the feeling of the brand.
Mix styles: invented words, compound words, metaphors, and real words with a twist. Avoid famous existing brands.
${JSON_RULES}
Schema: {"names": [{"name": string, "reason": string (one short sentence)}] (exactly 8), "tagline": string (under 8 words, for the strongest name)}`;

const SUFFIXES = ["ly", "hub", "nest", "co", "lab", "craft", "folk", "loop"];
const PREFIXES = ["get", "the", "hey", "my"];

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// .com is worth the most; each other domain and each verified handle adds to the score.
export function availabilityScore(domains: DomainCheck[], handles: HandleCheck[]): number {
  let score = 0;
  for (const d of domains) {
    if (d.status === "available") score += d.domain.endsWith(".com") ? 40 : 10;
  }
  const verified = handles.filter((h) => h.method === "verified");
  for (const h of verified) {
    if (h.status === "available") score += 30 / Math.max(verified.length, 1);
  }
  return Math.round(score);
}

function demoNames(idea: string): { name: string; reason: string }[] {
  const words = keywords(idea, 3);
  const base = words.length ? words : ["venture"];
  const names: { name: string; reason: string }[] = [];
  for (const [i, suffix] of SUFFIXES.entries()) {
    const word = base[i % base.length];
    names.push({ name: capitalize(word) + suffix, reason: `Built from "${word}" so customers instantly get what you do.` });
  }
  names[6] = { name: capitalize(PREFIXES[0]) + capitalize(base[0]), reason: "An action-style name that works well as a handle." };
  names[7] = { name: capitalize(PREFIXES[2]) + capitalize(base[0]), reason: "Friendly and conversational, great for social media." };
  return names;
}

export const brandAgent: Agent = {
  id: "brand",
  name: "Brand",
  role: "Names, domains and handles",
  output: "brand",
  async run(ctx) {
    let ideas: { name: string; reason: string }[];
    let tagline: string;
    if (ctx.live) {
      ctx.log("Brainstorming brand names");
      const res = await askJson<{ names: { name: string; reason: string }[]; tagline: string }>(ctx.ask, SYSTEM, ideaContext(ctx));
      ideas = res.names.slice(0, 8);
      tagline = res.tagline;
    } else {
      ideas = demoNames(ctx.input.idea);
      tagline = `${capitalize(keywords(ctx.input.idea, 1)[0] ?? "Ideas")}, made simple.`;
    }

    ctx.log(`Checking domains and handles for ${ideas.length} names`);
    const names: NameCandidate[] = await Promise.all(
      ideas
        .filter((n) => slugify(n.name).length >= 2)
        .map(async (n) => {
          const slug = slugify(n.name);
          const [domains, handles] = await Promise.all([checkDomains(slug), checkHandles(slug)]);
          return { name: n.name, slug, reason: n.reason, domains, handles, score: availabilityScore(domains, handles) };
        }),
    );
    names.sort((a, b) => b.score - a.score);
    const best = names[0];
    if (best) {
      const com = best.domains.find((d) => d.domain.endsWith(".com"));
      ctx.log(`Top pick: ${best.name} (${com?.domain} ${com?.status === "available" ? "is free" : "is taken"})`);
    }
    ctx.state.brand = { names, recommended: best?.name ?? ideas[0]?.name ?? "", tagline };
  },
};
