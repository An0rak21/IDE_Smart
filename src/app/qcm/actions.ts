"use server";

import { getAccount } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { drawQuestionIds } from "@/lib/qcm/draw";
import { isFullyCorrect } from "@/lib/qcm/grading";
import { computeScore } from "@/lib/qcm/scoring";
import { ownsAttempt } from "@/lib/qcm/ownership";

type Mode = "training" | "exam";

type AttemptRow = {
  id: string;
  user_id: string;
  mode: Mode;
  question_count: number;
  question_ids: string[];
  finished_at: string | null;
};

// ---------------------------------------------------------------------------
// Démarrer une série
// ---------------------------------------------------------------------------

export type StartAttemptResult =
  | { status: "ok"; attemptId: string }
  | { status: "forbidden" }
  | { status: "empty" }
  | { status: "error"; message: string };

export async function startAttempt(moduleSlug: string, mode: Mode, count: 10 | 20): Promise<StartAttemptResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };
  if (mode === "exam" && !account.premium) return { status: "forbidden" };

  const admin = createAdminClient();
  const { data: moduleRow } = await admin
    .from("modules")
    .select("id")
    .eq("slug", moduleSlug)
    .eq("is_published", true)
    .maybeSingle();
  if (!moduleRow) return { status: "error", message: "Ce module est introuvable." };

  const { data: questions } = await admin
    .from("questions")
    .select("id, is_free")
    .eq("module_id", moduleRow.id)
    .eq("is_published", true);

  const pool = (questions ?? []).map((q) => ({ id: q.id as string, isFree: q.is_free as boolean }));
  const questionIds = drawQuestionIds(pool, count, account.premium);
  if (questionIds.length === 0) return { status: "empty" };

  const { data: attempt, error } = await admin
    .from("quiz_attempts")
    .insert({
      user_id: account.user.id,
      module_id: moduleRow.id,
      mode,
      question_count: questionIds.length,
      question_ids: questionIds,
    })
    .select("id")
    .single();
  if (error || !attempt) return { status: "error", message: "La série n'a pas pu être créée. Réessayez." };

  return { status: "ok", attemptId: attempt.id };
}

// Série « Mes erreurs » (premium) : questions dont la dernière réponse de l'utilisateur,
// tous modules confondus, est fausse.
export async function startErrorsReviewAttempt(): Promise<StartAttemptResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };
  if (!account.premium) return { status: "forbidden" };

  const admin = createAdminClient();
  const { data: userAttempts } = await admin.from("quiz_attempts").select("id").eq("user_id", account.user.id);
  const attemptIds = (userAttempts ?? []).map((a) => a.id as string);
  if (attemptIds.length === 0) return { status: "empty" };

  const { data: answers } = await admin
    .from("attempt_answers")
    .select("question_id, is_correct, created_at")
    .in("attempt_id", attemptIds)
    .order("created_at", { ascending: false });

  const lastByQuestion = new Map<string, boolean>();
  for (const a of answers ?? []) {
    if (!lastByQuestion.has(a.question_id)) lastByQuestion.set(a.question_id, a.is_correct);
  }
  const wrongIds = [...lastByQuestion.entries()].filter(([, ok]) => !ok).map(([id]) => id);
  if (wrongIds.length === 0) return { status: "empty" };

  const { data: attempt, error } = await admin
    .from("quiz_attempts")
    .insert({
      user_id: account.user.id,
      module_id: null,
      mode: "training",
      question_count: wrongIds.length,
      question_ids: wrongIds,
    })
    .select("id")
    .single();
  if (error || !attempt) return { status: "error", message: "La série n'a pas pu être créée. Réessayez." };

  return { status: "ok", attemptId: attempt.id };
}

// ---------------------------------------------------------------------------
// Répondre à une question
// ---------------------------------------------------------------------------

export type AnswerResult =
  | {
      status: "ok";
      training: { correct: boolean; correctOptionIds: string[]; explanation: string; lessonSlug: string | null } | null;
    }
  | { status: "error"; message: string };

export async function answerQuestion(attemptId: string, questionId: string, optionIds: string[]): Promise<AnswerResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("quiz_attempts")
    .select("id, user_id, mode, question_count, question_ids, finished_at")
    .eq("id", attemptId)
    .maybeSingle<AttemptRow>();

  if (!ownsAttempt(attempt, account.user.id)) return { status: "error", message: "Cette série est introuvable." };
  if (attempt!.finished_at) return { status: "error", message: "Cette série est déjà terminée." };
  if (!attempt!.question_ids.includes(questionId)) {
    return { status: "error", message: "Cette question ne fait pas partie de la série." };
  }

  const { data: existing } = await admin
    .from("attempt_answers")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (existing) return { status: "error", message: "Cette question a déjà une réponse enregistrée." };

  const { data: question } = await admin
    .from("questions")
    .select("version, lesson_slug, explanation")
    .eq("id", questionId)
    .single();
  const { data: options } = await admin.from("question_options").select("id, is_correct").eq("question_id", questionId);

  const correctOptionIds = (options ?? []).filter((o) => o.is_correct).map((o) => o.id as string);
  const correct = isFullyCorrect(optionIds, correctOptionIds);

  const { error } = await admin.from("attempt_answers").insert({
    attempt_id: attemptId,
    question_id: questionId,
    question_version: question?.version ?? 1,
    selected_option_ids: optionIds,
    is_correct: correct,
  });
  if (error) return { status: "error", message: "La réponse n'a pas pu être enregistrée. Réessayez." };

  if (attempt!.mode === "exam") return { status: "ok", training: null };

  return {
    status: "ok",
    training: {
      correct,
      correctOptionIds,
      explanation: question?.explanation ?? "",
      lessonSlug: question?.lesson_slug ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Terminer une série
// ---------------------------------------------------------------------------

export type QuestionCorrection = {
  questionId: string;
  prompt: string;
  correctOptionIds: string[];
  selectedOptionIds: string[];
  explanation: string;
  lessonSlug: string | null;
  correct: boolean;
};

export type FinishResult =
  | { status: "ok"; score: number; corrections: QuestionCorrection[] | null }
  | { status: "error"; message: string };

export async function finishAttempt(attemptId: string): Promise<FinishResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("quiz_attempts")
    .select("id, user_id, mode, question_count, question_ids, finished_at")
    .eq("id", attemptId)
    .maybeSingle<AttemptRow>();

  if (!ownsAttempt(attempt, account.user.id)) return { status: "error", message: "Cette série est introuvable." };

  const { data: answers } = await admin
    .from("attempt_answers")
    .select("question_id, is_correct, selected_option_ids")
    .eq("attempt_id", attemptId);

  const correctCount = (answers ?? []).filter((a) => a.is_correct).length;
  const score = computeScore(attempt!.question_count, correctCount);

  if (!attempt!.finished_at) {
    await admin.from("quiz_attempts").update({ score, finished_at: new Date().toISOString() }).eq("id", attemptId);
  }

  if (attempt!.mode === "training") return { status: "ok", score, corrections: null };

  // Examen : les corrections ne sont renvoyées qu'une fois la série terminée.
  const { data: questions } = await admin
    .from("questions")
    .select("id, prompt, explanation, lesson_slug")
    .in("id", attempt!.question_ids);
  const { data: options } = await admin
    .from("question_options")
    .select("id, question_id, is_correct")
    .in("question_id", attempt!.question_ids);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id as string, a]));
  const corrections: QuestionCorrection[] = (questions ?? []).map((q) => {
    const correctOptionIds = (options ?? [])
      .filter((o) => o.question_id === q.id && o.is_correct)
      .map((o) => o.id as string);
    const a = answerByQuestion.get(q.id);
    return {
      questionId: q.id,
      prompt: q.prompt,
      correctOptionIds,
      selectedOptionIds: (a?.selected_option_ids as string[] | undefined) ?? [],
      explanation: q.explanation ?? "",
      lessonSlug: q.lesson_slug,
      correct: a?.is_correct ?? false,
    };
  });

  return { status: "ok", score, corrections };
}

// ---------------------------------------------------------------------------
// Signaler une erreur sur une question
// ---------------------------------------------------------------------------

export type ReportResult = { status: "ok" } | { status: "error"; message: string };

export async function reportQuestion(questionId: string, message: string): Promise<ReportResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Connectez-vous pour signaler une erreur." };
  const trimmed = message.trim();
  if (trimmed.length < 5 || trimmed.length > 2000) {
    return { status: "error", message: "Le message doit faire entre 5 et 2000 caractères." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("question_reports")
    .insert({ question_id: questionId, user_id: account.user.id, message: trimmed });
  if (error) return { status: "error", message: "Le signalement n'a pas pu être enregistré. Réessayez." };
  return { status: "ok" };
}

// ---------------------------------------------------------------------------
// Vérification rapide en fin de leçon (composant <Verifier>)
// Ne crée pas de tentative : ce n'est pas une série suivie, juste une correction ponctuelle.
// ---------------------------------------------------------------------------

export type VerifierAnswerResult =
  | { status: "ok"; correct: boolean; correctOptionIds: string[]; explanation: string }
  | { status: "error"; message: string };

export async function checkVerifierAnswer(questionId: string, optionIds: string[]): Promise<VerifierAnswerResult> {
  const account = await getAccount();
  if (!account) return { status: "error", message: "Connectez-vous pour vérifier votre réponse." };

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select("id, is_free, is_published, explanation")
    .eq("id", questionId)
    .maybeSingle();
  if (!question || !question.is_published || (!question.is_free && !account.premium)) {
    return { status: "error", message: "Cette question est introuvable." };
  }

  const { data: options } = await admin.from("question_options").select("id, is_correct").eq("question_id", questionId);
  const correctOptionIds = (options ?? []).filter((o) => o.is_correct).map((o) => o.id as string);

  return {
    status: "ok",
    correct: isFullyCorrect(optionIds, correctOptionIds),
    correctOptionIds,
    explanation: question.explanation ?? "",
  };
}
