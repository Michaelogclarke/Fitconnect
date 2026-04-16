-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 1: Trainer Foundation
-- Run this in the Supabase SQL Editor after the base schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add role to profiles ───────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'client'
  check (role in ('client', 'trainer'));

-- Update trigger to capture role from sign-up metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

-- ── 2. Trainer–client relationship table ──────────────────────────────────────
create table if not exists public.trainer_clients (
  id           uuid        default gen_random_uuid() primary key,
  trainer_id   uuid        references auth.users on delete cascade not null,
  client_id    uuid        references auth.users on delete cascade not null,
  status       text        not null default 'pending'
               check (status in ('pending', 'active', 'removed')),
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (trainer_id, client_id)
);

-- ── 3. RLS for trainer_clients ────────────────────────────────────────────────
alter table public.trainer_clients enable row level security;

-- Trainers can invite clients (insert)
create policy "trainer_clients: trainer can insert" on public.trainer_clients
  for insert with check (trainer_id = auth.uid());

-- Both parties can see their own rows
create policy "trainer_clients: own rows" on public.trainer_clients
  for select using (trainer_id = auth.uid() or client_id = auth.uid());

-- Client accepts invite (update status); trainer can also update
create policy "trainer_clients: update" on public.trainer_clients
  for update using (trainer_id = auth.uid() or client_id = auth.uid());

-- Trainer can remove a client
create policy "trainer_clients: trainer can delete" on public.trainer_clients
  for delete using (trainer_id = auth.uid());

-- ── 4. Update profiles RLS so trainers can read their clients' profiles ────────
drop policy if exists "profiles: own rows" on public.profiles;

-- Own profile: full access
create policy "profiles: own rows" on public.profiles
  for all using (auth.uid() = id);

-- Trainer reads linked active clients' profiles
create policy "profiles: trainer reads client" on public.profiles
  for select using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = auth.uid()
        and tc.client_id = id
        and tc.status = 'active'
    )
  );

-- ── 5. Trainer reads client workout data ──────────────────────────────────────

-- workout_sessions
create policy "workout_sessions: trainer reads client" on public.workout_sessions
  for select using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = auth.uid()
        and tc.client_id = user_id
        and tc.status = 'active'
    )
  );

-- session_exercises (via session ownership)
create policy "session_exercises: trainer reads client" on public.session_exercises
  for select using (
    exists (
      select 1 from public.workout_sessions s
      join public.trainer_clients tc on tc.client_id = s.user_id
      where s.id = session_id
        and tc.trainer_id = auth.uid()
        and tc.status = 'active'
    )
  );

-- session_sets (via session ownership)
create policy "session_sets: trainer reads client" on public.session_sets
  for select using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      join public.trainer_clients tc on tc.client_id = s.user_id
      where se.id = session_exercise_id
        and tc.trainer_id = auth.uid()
        and tc.status = 'active'
    )
  );

-- body_weight_logs
create policy "body_weight_logs: trainer reads client" on public.body_weight_logs
  for select using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = auth.uid()
        and tc.client_id = user_id
        and tc.status = 'active'
    )
  );
