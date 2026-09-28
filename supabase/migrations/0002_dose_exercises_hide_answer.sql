-- La réponse attendue et les paramètres (dont le seed) d'un exercice de calcul
-- ne doivent pas être lisibles depuis le navigateur avant la correction.
revoke select on public.dose_exercises from anon, authenticated;
grant select (id, user_id, type, given, is_correct, created_at) on public.dose_exercises to authenticated;
