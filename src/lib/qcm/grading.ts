// Correction tout ou rien : l'ensemble choisi doit être exactement l'ensemble des bonnes options.
export function isFullyCorrect(selectedOptionIds: string[], correctOptionIds: string[]): boolean {
  if (selectedOptionIds.length !== correctOptionIds.length) return false;
  const correct = new Set(correctOptionIds);
  return selectedOptionIds.every((id) => correct.has(id));
}
