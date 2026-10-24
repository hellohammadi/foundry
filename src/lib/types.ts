// Shared types for Foundry's agents, API stream and UI.

export type IdeaInput = {
  idea: string;
  audience?: string;
  location?: string;
  budget?: string;
};

export type Brief = {
  summary: string;
  category: string;
  audience: string;
  problem: string;
  businessModel: string;
  keywords: string[];
};

export type Availability = "available" | "taken" | "unknown";

export type DomainCheck = { domain: string; status: Availability };

export type HandleCheck = {
  platform: string;
  handle: string;
  status: Availability;
  url: string;
  // "verified" = checked via a reliable public endpoint; "manual" = platform blocks lookups
  method: "verified" | "manual";
};

export type NameCandidate = {
  name: string;
  slug: string;
  reason: string;
  domains: DomainCheck[];
  handles: HandleCheck[];
  score: number; // availability score 0-100
};

export type BrandResult = {
  names: NameCandidate[];
  recommended: string;
  tagline: string;
};

export type StrategyResult = {
  usp: string;
  competitors: { name: string; gap: string }[];
  emotionalCore: string;
  brandStory: string;
  toneOfVoice: string[];
  roadmap: { phase: string; timeframe: string; steps: string[] }[];
  scalePlan: string[];
  risks: string[];
};

export type SocialResult = {
  platforms: { name: string; why: string; priority: "primary" | "secondary" }[];
  pillars: { name: string; description: string }[];
  bios: { platform: string; bio: string }[];
  posts: { platform: string; hook: string; caption: string; hashtags: string[] }[];
  calendar: { day: number; platform: string; format: string; idea: string }[];
  viralIdeas: string[];
};

export type Automation = {
  name: string;
  trigger: string;
  steps: string[];
  tools: string[];
  impact: string;
};

export type TechResult = {
  mvp: string;
  stack: { layer: string; tool: string; cost: string }[];
  automations: Automation[];
  launchChecklist: string[];
};

export type PotentialResult = {
  score: number;
  verdict: string;
  strengths: string[];
  watchOuts: string[];
  nextSteps: string[];
};

export type Report = {
  input: IdeaInput;
  brief: Brief;
  brand: BrandResult;
  strategy: StrategyResult;
  social: SocialResult;
  tech: TechResult;
  potential: PotentialResult;
  meta: {
    mode: "live" | "demo";
    model: string;
    // DNotifier workflow execution, viewable in the DNotifier dashboard.
    executionId?: string;
    generatedAt: string;
  };
};

export type AgentId = "founder" | "brand" | "strategy" | "social" | "tech" | "report";

// Events streamed from /api/analyze as newline-delimited JSON.
export type StreamEvent =
  | { type: "agent"; agent: AgentId; status: "running" | "done" | "error"; message?: string }
  | { type: "log"; agent: AgentId; message: string }
  | { type: "report"; report: Report }
  | { type: "error"; message: string };
