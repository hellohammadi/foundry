import { intakeQuestions } from "@/lib/agents/intake";
import { clean } from "@/lib/http";
import { isValidUserId } from "@/lib/inbox";

export const runtime = "nodejs";
export const maxDuration = 60;

// "Fix my business" mode, step 1: the Intake agent writes questions for this founder.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const problem = clean(body.problem, 1000);
  if (!problem || problem.length < 10) {
    return Response.json({ error: "Describe your problem in at least 10 characters." }, { status: 400 });
  }
  const userId = isValidUserId(body.userId) ? body.userId : "foundry-anonymous";
  return Response.json(await intakeQuestions(problem, userId));
}
