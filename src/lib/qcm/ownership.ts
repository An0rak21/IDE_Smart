// Vérifie qu'une tentative appartient bien à l'utilisateur qui tente d'y répondre ou de la
// terminer, isolée du reste des Server Actions pour rester testable sans Supabase.
export function ownsAttempt(row: { user_id: string } | null, userId: string): boolean {
  return row !== null && row.user_id === userId;
}
