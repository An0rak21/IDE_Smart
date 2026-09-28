// Vérifie qu'une ligne dose_exercises appartient bien à l'utilisateur qui tente
// de la corriger, isolée du reste de submitAnswer pour rester testable sans Supabase.
export function ownsExercise(row: { user_id: string } | null, userId: string): boolean {
  return row !== null && row.user_id === userId;
}
