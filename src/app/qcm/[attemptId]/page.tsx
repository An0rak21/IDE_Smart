import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { toPublicQuestion } from "@/lib/qcm/public-question";
import { QcmClient } from "./qcm-client";

export const metadata: Metadata = { title: "QCM" };

type Props = { params: Promise<{ attemptId: string }> };

type AttemptRow = {
  id: string;
  user_id: string;
  mode: "training" | "exam";
  question_count: number;
  question_ids: string[];
  score: number | null;
  finished_at: string | null;
};

type QuestionRow = {
  id: string;
  ref: string | null;
  type: "single" | "multiple" | "true_false" | "case";
  prompt: string;
  context: string | null;
  level: number;
  is_free: boolean;
  lesson_slug: string | null;
  module_id: string | null;
};

export default async function QcmAttemptPage({ params }: Props) {
  const { attemptId } = await params;
  const account = await getAccount();
  if (!account) redirect(`/connexion?suite=/qcm/${attemptId}`);

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("quiz_attempts")
    .select("id, user_id, mode, question_count, question_ids, score, finished_at")
    .eq("id", attemptId)
    .maybeSingle<AttemptRow>();

  if (!attempt || attempt.user_id !== account.user.id) notFound();
  if (attempt.question_ids.length === 0) notFound();

  const { data: questions } = await admin
    .from("questions")
    .select("id, ref, type, prompt, context, level, is_free, lesson_slug, module_id")
    .in("id", attempt.question_ids)
    .returns<QuestionRow[]>();
  const { data: options } = await admin
    .from("question_options")
    .select("id, question_id, label, position")
    .in("question_id", attempt.question_ids);

  const moduleIds = [...new Set((questions ?? []).map((q) => q.module_id).filter((id): id is string => !!id))];
  const { data: modules } = moduleIds.length
    ? await admin.from("modules").select("id, slug").in("id", moduleIds)
    : { data: [] as { id: string; slug: string }[] };
  const slugByModule = new Map((modules ?? []).map((m) => [m.id, m.slug]));

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const publicQuestions = attempt.question_ids
    .map((id) => byId.get(id))
    .filter((q): q is QuestionRow => !!q)
    .map((q) => toPublicQuestion(q, options ?? []));

  const lessonHrefs: Record<string, string | null> = {};
  for (const q of questions ?? []) {
    const moduleSlug = q.module_id ? slugByModule.get(q.module_id) : null;
    lessonHrefs[q.id] = moduleSlug && q.lesson_slug ? `/modules/${moduleSlug}/${q.lesson_slug}` : null;
  }

  const { data: answers } = await admin.from("attempt_answers").select("question_id").eq("attempt_id", attemptId);
  const answeredQuestionIds = (answers ?? []).map((a) => a.question_id as string);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <AccountNav current="modules" isAdmin={isAdminEmail(account.user.email)} />
      <div className="mt-8">
      <QcmClient
        attemptId={attempt.id}
        mode={attempt.mode}
        questions={publicQuestions}
        answeredQuestionIds={answeredQuestionIds}
        finished={!!attempt.finished_at}
        finalScore={attempt.score}
        lessonHrefs={lessonHrefs}
      />
      </div>
    </div>
  );
}
