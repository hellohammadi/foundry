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

// A verified statistic from knowledge/facts — agents cite these by id and never invent numbers.
export type SocialFact = {
  id: string;
  fact: string;
  platforms: string[];
  region: string;
  source: string;
  url: string;
  year: number;
};

export type FunnelStage = "awareness" | "engagement" | "conversion";

export type FunnelPhase = {
  stage: FunnelStage;
  goal: string;
  timeframe: string;
  audienceMindset: string; // what the customer is thinking at this stage
  tactics: string[];
  contentIdeas: { platform: string; format: string; idea: string }[];
  kpis: { name: string; target: string }[];
  cta: string;
};

export type SocialResult = {
  positioning: string;
  audienceInsight: string;
  platforms: { name: string; why: string; priority: "primary" | "secondary"; factIds: string[] }[];
  funnel: FunnelPhase[];
  pillars: { name: string; description: string }[];
  bios: { platform: string; bio: string }[];
  posts: { stage: FunnelStage; platform: string; hook: string; caption: string; cta: string; hashtags: string[] }[];
  calendar: { day: number; stage: FunnelStage; platform: string; format: string; idea: string }[];
  viralIdeas: string[];
  // Resolved on the server from factIds, so every number shown comes from a cited source.
  facts: SocialFact[];
  keyFactIds: string[];
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

// ── "Fix my business" mode ─────────────────────────────────────────────

export type QA = { question: string; answer: string };

export type DiagnoseInput = {
  problem: string;
  answers: QA[];
};

export type PlaybookHit = { slug: string; title: string; topic: string; score?: number };

export type DiagnosisResult = {
  symptoms: string[];
  rootCause: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
  secondaryIssues: string[];
  evidence: { playbook: string; insight: string }[];
};

export type ActionPlan = {
  goal: string;
  quickWins: string[];
  weeks: { week: number; focus: string; tasks: { task: string; priority: "high" | "medium" | "low"; outcome: string }[] }[];
  metrics: { name: string; target: string }[];
};

export type DiagnosisReport = {
  input: DiagnoseInput;
  sources: PlaybookHit[];
  diagnosis: DiagnosisResult;
  plan: ActionPlan;
  meta: Report["meta"];
};

// Items stored for a user through DNotifier messaging (history + reminders).
export type InboxItem =
  | { kind: "report"; id: string; at: number; mode: "idea" | "diagnose"; title: string; summary: string }
  | { kind: "reminder"; id: string; at: number; due: string; title: string; tasks: string[] };

// An inbox item before DNotifier assigns its id and timestamp.
export type NewInboxItem = InboxItem extends infer T ? (T extends InboxItem ? Omit<T, "id" | "at"> : never) : never;

export type AgentId = "founder" | "brand" | "strategy" | "social" | "tech" | "report" | "diagnosis" | "solution";

// Events streamed from /api/analyze and /api/diagnose as newline-delimited JSON.
export type StreamEvent =
  | { type: "agent"; agent: AgentId; status: "running" | "done" | "error"; message?: string }
  | { type: "log"; agent: AgentId; message: string }
  | { type: "report"; report: Report }
  | { type: "diagnosis"; report: DiagnosisReport }
  | { type: "error"; message: string };
