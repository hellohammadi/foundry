import type { AgentContext } from "./types";

const STOPWORDS = new Set(
  "a an the and or for of to in on with my our your i we want start business idea that this is be will who which from by at as it into selling sell make build create service services online company app platform subscription box shop store delivery people customers workers office local new best kids need needs".split(
    " ",
  ),
);

// Rough heuristic for demo mode: skip filler and adjective/verb-like words (-ed, -ing, -ly).
export function keywords(text: string, max = 4): string[] {
  const seen = new Set<string>();
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (word.length > 2 && !STOPWORDS.has(word) && !/(ed|ing|ly)$/.test(word)) seen.add(word);
    if (seen.size >= max) break;
  }
  return [...seen];
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Shared context block given to every agent's prompt.
export function ideaContext(ctx: AgentContext): string {
  const { input, state } = ctx;
  const lines = [
    `Business idea: ${input.idea}`,
    input.audience && `Target audience (from founder): ${input.audience}`,
    input.location && `Location: ${input.location}`,
    input.budget && `Starting budget: ${input.budget}`,
  ];
  if (state.brief) {
    lines.push(
      `Summary: ${state.brief.summary}`,
      `Category: ${state.brief.category}`,
      `Audience: ${state.brief.audience}`,
      `Problem solved: ${state.brief.problem}`,
      `Business model: ${state.brief.businessModel}`,
    );
  }
  if (state.brand) lines.push(`Chosen brand name: ${state.brand.recommended} — "${state.brand.tagline}"`);
  if (state.strategy) lines.push(`USP: ${state.strategy.usp}`, `Emotional core: ${state.strategy.emotionalCore}`);
  return lines.filter(Boolean).join("\n");
}

export const JSON_RULES =
  "Reply with a single JSON object that matches the schema exactly. Be specific to this business — no generic advice. Keep each string concise.";
