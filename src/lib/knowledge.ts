// The open playbook knowledge base: Markdown files in /knowledge, loaded into
// DNotifier's RAG store and searched semantically by the Diagnosis agent.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { DNotifier } from "@dnotifier-realtime/dnotifier";
import type { PlaybookHit } from "./types";

export type Playbook = {
  slug: string;
  title: string;
  topic: string;
  sections: Record<string, string[]>; // "Symptoms" → bullet points
  markdown: string;
};

const DIR = path.join(process.cwd(), "knowledge");
const DOC_TYPE = "playbook";

let cache: Playbook[] | null = null;

export function parsePlaybook(slug: string, markdown: string): Playbook {
  const title = markdown.match(/^# (.+)$/m)?.[1]?.trim() ?? slug;
  const topic = markdown.match(/^topic:\s*(.+)$/m)?.[1]?.trim() ?? "general";
  const sections: Record<string, string[]> = {};
  let current = "";
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
    } else if (current && line.startsWith("- ")) {
      sections[current].push(line.slice(2).trim());
    }
  }
  return { slug, title, topic, sections, markdown };
}

export function loadPlaybooks(): Playbook[] {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => parsePlaybook(f.replace(/\.md$/, ""), readFileSync(path.join(DIR, f), "utf8")));
  return cache;
}

export function getPlaybook(slug: string): Playbook | undefined {
  return loadPlaybooks().find((p) => p.slug === slug);
}

// Each document starts with a "Playbook: <slug>" line so search hits can be traced back to their file.
function documentText(p: Playbook): string {
  return `Playbook: ${p.slug}\n${p.markdown}`;
}

let seeded: Promise<void> | null = null;

// Adds any playbook missing from the DNotifier knowledge base. Runs once per server instance.
export function ensureKnowledgeBase(notifier: DNotifier, senderId: string): Promise<void> {
  seeded ??= (async () => {
    const res = await notifier.listDocuments({ senderId, limit: 200, type: DOC_TYPE });
    const existing = new Set<string>((res?.data?.rows ?? []).map((r: { record_id: string }) => r.record_id));
    for (const p of loadPlaybooks()) {
      if (existing.has(p.slug)) continue;
      await notifier.addDocument({ senderId, recordId: p.slug, content: documentText(p), type: DOC_TYPE, metadata: { title: p.title, topic: p.topic } });
    }
  })().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

// Converts DNotifier semantic search rows into playbook hits.
export function hitsFromSearch(response: unknown): PlaybookHit[] {
  const rows = (response as { data?: { rows?: { content?: string; similarity?: number; score?: number }[] } })?.data?.rows ?? [];
  const hits = new Map<string, PlaybookHit>();
  for (const row of rows) {
    const slug = row.content?.match(/Playbook: ([a-z0-9-]+)/)?.[1];
    const playbook = slug && getPlaybook(slug);
    if (!playbook || hits.has(playbook.slug)) continue;
    hits.set(playbook.slug, { slug: playbook.slug, title: playbook.title, topic: playbook.topic, score: row.similarity ?? row.score });
  }
  return [...hits.values()];
}

// Demo-mode fallback: simple keyword overlap instead of semantic search.
export function localSearch(query: string, limit = 3): PlaybookHit[] {
  const words = new Set(query.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  return loadPlaybooks()
    .map((p) => {
      const text = p.markdown.toLowerCase();
      let score = 0;
      for (const w of words) if (text.includes(w)) score += p.title.toLowerCase().includes(w) ? 3 : 1;
      return { slug: p.slug, title: p.title, topic: p.topic, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
