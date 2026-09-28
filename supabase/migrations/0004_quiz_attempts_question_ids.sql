-- Le tirage des questions d'une tentative est figé à sa création, pour que la correction
-- et le score portent toujours sur le même jeu, même si le contenu évolue ensuite.
alter table public.quiz_attempts add column if not exists question_ids uuid[] not null default '{}';
