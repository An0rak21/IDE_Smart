"use server";

import { getAccount } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkAnswer,
  generateExercise,
  randomSeed,
  toPublicExercise,
  type DoseType,
  type PublicExercise,
} from "@/lib/doses";
import { ownsExercise } from "@/lib/doses/ownership";
import { parisMidnightUTC } from "@/lib/doses/paris-midnight";

const FREE_DAILY_LIMIT = 5;

type DoseExerciseRow = { id: string; user_id: string; type: DoseType; params: { seed: number }; given: number | null; is_correct: boolean | null };

export type NewExerciseResult =
  | { status: "ok"; exercise: PublicExercise; remaining: number | null }
  | { status: "limit" }
  | { status: "error"; message: string };

export async function newExercise(type: DoseType): Promise<NewExerciseResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };
  const { user, premium } = account;
  const admin = createAdminClient();

  let remaining: number | null = null;
  if (!premium) {
    const { count, error: countError } = await admin
      .from("dose_exercises")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", parisMidnightUTC().toISOString());
    if (countError) return { status: "error", message: "L'exercice n'a pas pu être créé. Réessayez." };
    if ((count ?? 0) >= FREE_DAILY_LIMIT) return { status: "limit" };
    remaining = FREE_DAILY_LIMIT - (count ?? 0) - 1;
  }

  const seed = randomSeed();
  const exercise = generateExercise(type, seed);
  const { data: row, error } = await admin
    .from("dose_exercises")
    .insert({ user_id: user.id, type, params: { seed }, expected: exercise.answer.value })
    .select("id")
    .single();
  if (error || !row) return { status: "error", message: "L'exercice n'a pas pu être créé. Réessayez." };

  return { status: "ok", exercise: toPublicExercise(exercise, row.id), remaining };
}

export type SubmitAnswerResult =
  | { status: "ok"; correct: boolean; expected: number; unit: string; steps: string[]; tip?: string }
  | { status: "invalid" }
  | { status: "error"; message: string };

export async function submitAnswer(id: string, input: string): Promise<SubmitAnswerResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("dose_exercises")
    .select("id, user_id, type, params, given, is_correct")
    .eq("id", id)
    .maybeSingle<DoseExerciseRow>();

  if (!ownsExercise(row, account.user.id)) {
    return { status: "error", message: "Cet exercice est introuvable." };
  }

  const exercise = generateExercise(row!.type, row!.params.seed);

  if (row!.given !== null) {
    return {
      status: "ok",
      correct: !!row!.is_correct,
      expected: exercise.answer.value,
      unit: exercise.answer.unit,
      steps: exercise.steps,
      tip: exercise.tip,
    };
  }

  const result = checkAnswer(row!.type, row!.params.seed, input);
  if (result.given === null) return { status: "invalid" };

  const { error } = await admin
    .from("dose_exercises")
    .update({ given: result.given, is_correct: result.correct })
    .eq("id", id);
  if (error) return { status: "error", message: "La correction n'a pas pu être enregistrée. Réessayez." };

  return {
    status: "ok",
    correct: result.correct,
    expected: exercise.answer.value,
    unit: exercise.answer.unit,
    steps: exercise.steps,
    tip: exercise.tip,
  };
}
