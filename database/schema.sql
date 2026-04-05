-- ─────────────────────────────────────────────────────────────────────────────
-- FitConnect Database Schema
-- Paste this entire file into the Supabase SQL Editor and run it.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Extends auth.users with app-specific data.
create table if not exists public.profiles (
  id            uuid        references auth.users on delete cascade primary key,
  full_name     text,
  username      text unique,
  weight_unit   text        not null default 'kg',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Exercises library ─────────────────────────────────────────────────────────
-- Global presets (user_id null) + user-created custom exercises.
create table if not exists public.exercises (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users on delete cascade,
  name           text        not null,
  muscle_group   text,
  equipment      text,
  is_custom      boolean     not null default false,
  created_at     timestamptz not null default now()
);

-- ── Workout plans (routines) ──────────────────────────────────────────────────
create table if not exists public.workout_plans (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users on delete cascade not null,
  name           text        not null,
  description    text,
  days_per_week  int,
  is_active      boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Days within a plan (e.g. "Push A", "Pull B")
create table if not exists public.workout_plan_days (
  id         uuid default gen_random_uuid() primary key,
  plan_id    uuid references public.workout_plans on delete cascade not null,
  day_number int  not null,
  name       text not null,
  focus      text
);

-- Exercises within a plan day (template sets/reps, not logged values)
create table if not exists public.workout_plan_exercises (
  id            uuid    default gen_random_uuid() primary key,
  plan_day_id   uuid    references public.workout_plan_days on delete cascade not null,
  exercise_name text    not null,
  muscle_group  text,
  sets          int     not null default 3,
  reps          text    not null default '10',
  weight        numeric,
  sort_order    int     not null default 0
);

-- ── Workout sessions (logs) ───────────────────────────────────────────────────
create table if not exists public.workout_sessions (
  id               uuid        default gen_random_uuid() primary key,
  user_id          uuid        references auth.users on delete cascade not null,
  plan_day_id      uuid        references public.workout_plan_days,
  name             text        not null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  duration_seconds int,
  notes            text
);

-- Exercises within a session
create table if not exists public.session_exercises (
  id            uuid default gen_random_uuid() primary key,
  session_id    uuid references public.workout_sessions on delete cascade not null,
  exercise_name text not null,
  muscle_group  text,
  sort_order    int  not null default 0
);

-- Individual sets logged in a session
create table if not exists public.session_sets (
  id                  uuid        default gen_random_uuid() primary key,
  session_exercise_id uuid        references public.session_exercises on delete cascade not null,
  set_number          int         not null,
  weight              numeric,
  reps                int,
  is_completed        boolean     not null default false,
  completed_at        timestamptz
);

-- ── Body weight log ───────────────────────────────────────────────────────────
create table if not exists public.body_weight_logs (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users on delete cascade not null,
  weight     numeric     not null,
  unit       text        not null default 'kg',
  logged_at  date        not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Users can only read/write their own rows.

alter table public.profiles            enable row level security;
alter table public.exercises           enable row level security;
alter table public.workout_plans       enable row level security;
alter table public.workout_plan_days   enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_sessions    enable row level security;
alter table public.session_exercises   enable row level security;
alter table public.session_sets        enable row level security;
alter table public.body_weight_logs    enable row level security;

-- profiles
create policy "profiles: own rows" on public.profiles
  for all using (auth.uid() = id);

-- exercises (own custom + global presets)
create policy "exercises: own or global" on public.exercises
  for select using (user_id = auth.uid() or user_id is null);
create policy "exercises: insert own" on public.exercises
  for insert with check (user_id = auth.uid());
create policy "exercises: update own" on public.exercises
  for update using (user_id = auth.uid());
create policy "exercises: delete own" on public.exercises
  for delete using (user_id = auth.uid());

-- workout_plans
create policy "workout_plans: own rows" on public.workout_plans
  for all using (user_id = auth.uid());

-- workout_plan_days (access via plan ownership)
create policy "workout_plan_days: own rows" on public.workout_plan_days
  for all using (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())
  );

-- workout_plan_exercises
create policy "workout_plan_exercises: own rows" on public.workout_plan_exercises
  for all using (
    exists (
      select 1 from public.workout_plan_days d
      join public.workout_plans p on p.id = d.plan_id
      where d.id = plan_day_id and p.user_id = auth.uid()
    )
  );

-- workout_sessions
create policy "workout_sessions: own rows" on public.workout_sessions
  for all using (user_id = auth.uid());

-- session_exercises
create policy "session_exercises: own rows" on public.session_exercises
  for all using (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- session_sets
create policy "session_sets: own rows" on public.session_sets
  for all using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.user_id = auth.uid()
    )
  );

-- body_weight_logs
create policy "body_weight_logs: own rows" on public.body_weight_logs
  for all using (user_id = auth.uid());
