// Verified social media statistics (knowledge/facts/social-media.json). Agents reference
// them by id; Foundry resolves the ids so every number shown links to its source.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SocialFact } from "./types";

let cache: SocialFact[] | null = null;

export function loadSocialFacts(): SocialFact[] {
  cache ??= JSON.parse(readFileSync(path.join(process.cwd(), "knowledge", "facts", "social-media.json"), "utf8")) as SocialFact[];
  return cache;
}

// Facts list for prompts, with regional facts first when the founder's location matches.
export function factsForPrompt(location?: string): string {
  const facts = [...loadSocialFacts()];
  if (location && /india/i.test(location)) facts.sort((a, b) => Number(b.region === "India") - Number(a.region === "India"));
  return facts.map((f) => `[${f.id}] ${f.fact} (${f.region}, ${f.source})`).join("\n");
}

// Keeps only ids that exist, so a model can't cite a fact we don't have.
export function resolveFacts(ids: string[]): SocialFact[] {
  const byId = new Map(loadSocialFacts().map((f) => [f.id, f]));
  return [...new Set(ids)].map((id) => byId.get(id)).filter((f): f is SocialFact => Boolean(f));
}
