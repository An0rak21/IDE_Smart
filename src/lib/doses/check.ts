import { parseAnswer } from "./format";
import { generateExercise } from "./generators";
import type { CheckResult, DoseType } from "./types";

/** Corrige une réponse en régénérant l'exercice à partir de son seed (côté serveur) */
export function checkAnswer(type: DoseType, seed: number, input: string): CheckResult {
  const exercise = generateExercise(type, seed);
  const given = parseAnswer(input);
  const { value, tolerance, unit } = exercise.answer;
  const correct = given !== null && Math.abs(given - value) <= tolerance + 1e-9;
  return { correct, given, expected: value, unit };
}
