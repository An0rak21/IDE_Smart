-- Import du contenu depuis le dépôt (dossier /content)
alter table public.modules add column if not exists description text;

alter table public.questions add column if not exists ref text;
alter table public.questions add column if not exists context text;
alter table public.questions add column if not exists content_hash text;
create unique index if not exists questions_ref_key on public.questions (ref);

-- Le contexte d'un cas clinique est lisible, comme l'énoncé
grant select (context) on public.questions to anon, authenticated;
