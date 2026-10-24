// "Start a business" mode: turns an idea into a launch-ready business potential report.
import type { IdeaInput, Report } from "../types";
import { brandAgent } from "./brand";
import { founderAgent } from "./founder";
import { reportAgent } from "./report";
import { socialAgent } from "./social";
import { strategyAgent } from "./strategy";
import { meta, runTeam, type Emit, type TeamSpec } from "./team";
import { techAgent } from "./tech";

// Brand + Strategy only need the brief; Social + Tech also use the chosen name and USP.
export const IDEA_TEAM: TeamSpec<IdeaInput> = {
  workflow: "foundry-business-potential",
  description: "Foundry idea mode: founder → brand + strategy → social + tech → report",
  stages: [[founderAgent], [brandAgent, strategyAgent], [socialAgent, techAgent], [reportAgent]],
};

export async function runFoundry(input: IdeaInput, emit: Emit): Promise<Report> {
  const result = await runTeam(IDEA_TEAM, input, emit);
  const { brief, brand, strategy, social, tech, potential } = result.state;
  if (!brief || !brand || !strategy || !social || !tech || !potential) {
    throw new Error("An agent did not finish its part of the report");
  }
  return { input, brief, brand, strategy, social, tech, potential, meta: meta(result) };
}
