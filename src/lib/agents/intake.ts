// Intake agent: turns a founder's problem into 5-7 diagnostic questions.
// Runs as a saved DNotifier AI conversation for the user, so it appears in their history.
import { aiConfig, getNotifier, parseJson, readContent } from "../llm";

const SYSTEM = `You are the Intake agent of Foundry, helping an early-stage founder diagnose a business problem.
Ask the questions a sharp startup advisor would ask before giving advice. Always cover: industry and what they sell, business stage, monthly revenue, team size, and what they have already tried. Add 1-2 questions specific to their problem that would reveal the ROOT cause (for example margins, pricing, churn, cash timing, acquisition cost).
Each question must be short, friendly and answerable in one line.
Reply with a single JSON object: {"questions": string[] (5-7)}`;

export const CORE_QUESTIONS = [
  "What industry are you in, and what do you sell?",
  "What stage is the business at (idea, launched, growing, established)?",
  "Roughly how much revenue do you make per month?",
  "How many people are on the team, including you?",
  "What have you already tried to fix this?",
  "What does a typical order or customer bring in, and what does it cost you to deliver?",
];

export async function intakeQuestions(problem: string, userId: string): Promise<{ questions: string[]; live: boolean }> {
  const notifier = await getNotifier();
  if (!notifier) return { questions: CORE_QUESTIONS, live: false };
  try {
    const reply = await notifier.sendAI({
      senderId: userId,
      provider: aiConfig.provider,
      model: aiConfig.model,
      message: { useKnowledgeBase: false, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `My problem: ${problem}` }] },
      saveHistory: true,
    });
    const questions = parseJson<{ questions: unknown }>(readContent(reply)).questions;
    if (!Array.isArray(questions) || questions.length < 3) throw new Error("Too few questions");
    return { questions: questions.slice(0, 7).map(String), live: true };
  } catch (err) {
    console.error("Intake agent fell back to core questions:", (err as Error).message);
    return { questions: CORE_QUESTIONS, live: true };
  }
}
