-- =========================================================
-- Schéma initial : comptes, abonnements, contenus, progression
-- =========================================================

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  ifsi text,
  study_year text check (study_year in ('S1','S2','S3','S4','S5','S6')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'given_name', split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Abonnements (recopiés depuis Stripe par le webhook) ----------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('monthly','annual')),
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Vrai si l'utilisateur a un abonnement actif ou en essai
create or replace function public.is_premium(uid uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- ---------- Contenus ----------
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  semester text check (semester in ('S1','S3','S5','transversal')),
  position int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  type text not null check (type in ('single','multiple','true_false','short','case')),
  prompt text not null,
  explanation text,
  level smallint not null default 1 check (level between 1 and 3),
  is_free boolean not null default false,
  lesson_slug text,
  version int not null default 1,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position int not null default 0
);

-- ---------- Progression ----------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  mode text not null check (mode in ('training','exam')),
  score numeric(5,2),
  question_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  question_version int not null default 1,
  selected_option_ids uuid[] not null default '{}',
  answer_text text,
  is_correct boolean not null,
  time_spent_ms int,
  created_at timestamptz not null default now()
);

create table public.dose_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('perfusion','seringue','dilution','poids')),
  params jsonb not null,
  expected numeric not null,
  given numeric,
  is_correct boolean,
  created_at timestamptz not null default now()
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'open' check (status in ('open','fixed','rejected')),
  created_at timestamptz not null default now()
);

create index on public.questions (module_id);
create index on public.quiz_attempts (user_id, started_at desc);
create index on public.attempt_answers (attempt_id);
create index on public.dose_exercises (user_id, created_at desc);

-- =========================================================
-- Sécurité : Row Level Security
-- Les écritures de progression et la correction passent par le serveur
-- (clé service_role), jamais directement depuis le navigateur.
-- =========================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.modules enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.dose_exercises enable row level security;
alter table public.question_reports enable row level security;

create policy "profil : lecture du sien" on public.profiles
  for select using (auth.uid() = id);
create policy "profil : modification du sien" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "abonnement : lecture du sien" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "modules publiés : lecture publique" on public.modules
  for select using (is_published);

create policy "questions : gratuites ou abonné" on public.questions
  for select using (is_published and (is_free or public.is_premium(auth.uid())));

create policy "options : selon la question" on public.question_options
  for select using (
    exists (select 1 from public.questions q
            where q.id = question_id and q.is_published
              and (q.is_free or public.is_premium(auth.uid())))
  );

create policy "tentatives : lecture des siennes" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "réponses : lecture des siennes" on public.attempt_answers
  for select using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );

create policy "calculs : lecture des siens" on public.dose_exercises
  for select using (auth.uid() = user_id);

create policy "signalements : création" on public.question_reports
  for insert with check (auth.uid() = user_id);
create policy "signalements : lecture des siens" on public.question_reports
  for select using (auth.uid() = user_id);

-- Les bonnes réponses et les explications ne sont jamais lisibles côté navigateur :
-- seules ces colonnes sont exposées, la correction se fait côté serveur.
revoke select on public.question_options from anon, authenticated;
grant select (id, question_id, label, position) on public.question_options to anon, authenticated;

revoke select on public.questions from anon, authenticated;
grant select (id, module_id, type, prompt, level, is_free, lesson_slug, version, is_published)
  on public.questions to anon, authenticated;

-- Le profil ne peut modifier que ses champs éditables
revoke update on public.profiles from authenticated;
grant update (first_name, ifsi, study_year, updated_at) on public.profiles to authenticated;
