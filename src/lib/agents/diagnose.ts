// "Fix my business" mode: diagnoses a founder's problem using the playbook knowledge base.
import { ensureKnowledgeBase } from "../knowledge";
import { aiConfig } from "../llm";
import type { DiagnoseInput, DiagnosisReport } from "../types";
import { diagnosisAgent } from "./diagnosis";
import { solutionAgent } from "./solution";
import { meta, runTeam, type Emit, type TeamSpec } from "./team";

export const DIAGNOSE_TEAM: TeamSpec<DiagnoseInput> = {
  workflow: "foundry-diagnosis",
  description: "Foundry diagnose mode: diagnosis (RAG over playbooks) → 30-day solution plan",
  stages: [[diagnosisAgent], [solutionAgent]],
};

export async function runDiagnosis(input: DiagnoseInput, emit: Emit): Promise<DiagnosisReport> {
  const result = await runTeam(DIAGNOSE_TEAM, input, emit, (notifier) => ensureKnowledgeBase(notifier, aiConfig.userId));
  const { sources, diagnosis, plan } = result.state;
  if (!diagnosis || !plan) throw new Error("An agent did not finish its part of the diagnosis");
  return { input, sources: sources ?? [], diagnosis, plan, meta: meta(result) };
}
