// Score = % de réponses justes sur le nombre total de questions de la tentative
// (question_count) : une question non répondue compte comme fausse, elle n'est jamais
// exclue du dénominateur.
export function computeScore(totalQuestions: number, correctCount: number): number {
  if (totalQuestions <= 0) return 0;
  const pct = (correctCount / totalQuestions) * 100;
  return Math.round(pct * 100) / 100;
}
