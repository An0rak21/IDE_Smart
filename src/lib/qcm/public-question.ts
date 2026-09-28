// Forme d'une question envoyée au navigateur avant correction : jamais `is_correct`
// ni `explanation`. Utilisé par le composant <Verifier> et par la page /qcm/[attemptId].
export type QuestionType = "single" | "multiple" | "true_false" | "case";

export type PublicOption = { id: string; label: string; position: number };

export type PublicQuestion = {
  id: string;
  ref: string | null;
  type: QuestionType;
  level: number;
  isFree: boolean;
  lessonSlug: string | null;
  context: string | null;
  prompt: string;
  options: PublicOption[];
};

type QuestionRow = {
  id: string;
  ref: string | null;
  type: QuestionType;
  level: number;
  is_free: boolean;
  lesson_slug: string | null;
  context: string | null;
  prompt: string;
};

type OptionRow = { id: string; question_id: string; label: string; position: number };

export function toPublicQuestion(question: QuestionRow, options: OptionRow[]): PublicQuestion {
  return {
    id: question.id,
    ref: question.ref,
    type: question.type,
    level: question.level,
    isFree: question.is_free,
    lessonSlug: question.lesson_slug,
    context: question.context,
    prompt: question.prompt,
    options: options
      .filter((o) => o.question_id === question.id)
      .sort((a, b) => a.position - b.position)
      .map((o) => ({ id: o.id, label: o.label, position: o.position })),
  };
}
