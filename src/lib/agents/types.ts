import type { AskFn } from "../llm";
import type { AgentId, IdeaInput, Report } from "../types";

// Everything agents produce lands in shared state, so later agents can build on earlier ones.
export type AgentState = Partial<Omit<Report, "input" | "meta">>;

export type AgentContext = {
  input: IdeaInput;
  state: AgentState;
  // false = demo mode (DNotifier not configured); agents fall back to templates.
  live: boolean;
  // Sends a prompt through DNotifier AI (bound to the running workflow so it is traced).
  ask: AskFn;
  log: (message: string) => void;
};

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  // The part of shared state this agent fills in.
  output: keyof AgentState;
  run: (ctx: AgentContext) => Promise<void>;
};
