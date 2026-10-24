import type { AskFn } from "../llm";
import type { ActionPlan, AgentId, DiagnosisResult, IdeaInput, PlaybookHit, Report } from "../types";

// Everything agents produce lands in shared state, so later agents can build on earlier ones.
export type AgentState = Partial<Omit<Report, "input" | "meta">> & {
  sources?: PlaybookHit[];
  diagnosis?: DiagnosisResult;
  plan?: ActionPlan;
};

// Semantic search over the playbook knowledge base (DNotifier RAG, or keywords in demo mode).
export type SearchFn = (query: string, limit?: number) => Promise<PlaybookHit[]>;

export type AgentContext<I = IdeaInput> = {
  input: I;
  state: AgentState;
  // false = demo mode (DNotifier not configured); agents fall back to templates.
  live: boolean;
  // Sends a prompt through DNotifier AI (bound to the running workflow so it is traced).
  ask: AskFn;
  search: SearchFn;
  log: (message: string) => void;
};

export type Agent<I = IdeaInput> = {
  id: AgentId;
  name: string;
  role: string;
  // The part of shared state this agent fills in.
  output: keyof AgentState;
  run: (ctx: AgentContext<I>) => Promise<void>;
};
