import type { Exercise } from "./types";
import type { PublicExercise } from "@/lib/dose-exercise";

export { generateExercise } from "./generators";
export { checkAnswer } from "./check";
export { randomSeed } from "./rng";
export { parseAnswer, fr } from "./format";
export { DOSE_TYPES } from "./types";
export type { DoseType, Exercise, CheckResult } from "./types";
export type { PublicExercise } from "@/lib/dose-exercise";

/**
 * Vue « élève » d'un exercice : ni la réponse, ni la correction, ni le seed.
 * `id` est l'identifiant de la ligne dose_exercises, qui sert à corriger côté serveur.
 */
export function toPublicExercise(e: Exercise, id: string): PublicExercise {
  return {
    id,
    type: e.type,
    title: e.title,
    data: e.data,
    question: e.question,
    unit: e.answer.unit,
  };
}
