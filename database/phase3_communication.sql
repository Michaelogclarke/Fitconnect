-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3: Communication — Messages, Check-ins, Session Notes
-- Run in the Supabase SQL Editor after phase2_plan_assignment.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Messages ───────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id                uuid        default gen_random_uuid() primary key,
  trainer_client_id uuid        references public.trainer_clients on delete cascade not null,
  sender_id         uuid        references auth.users on delete cascade not null,
  content           text        not null,
  created_at        timestamptz not null default now(),
  read_at           timestamptz
);

alter table public.messages enable row level security;

-- Both trainer and client in the thread can read/write
create policy "messages: participant access" on public.messages
  for all using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.id = trainer_client_id
        and (tc.trainer_id = auth.uid() or tc.client_id = auth.uid())
        and tc.status = 'active'
    )
  );

-- Enable Realtime on messages
-- (Also go to Supabase Dashboard → Database → Replication and add 'messages' to supabase_realtime publication)
alter publication supabase_realtime add table public.messages;

-- ── 2. Weekly check-ins (submitted by client, read by trainer) ────────────────
create table if not exists public.check_ins (
  id                uuid        default gen_random_uuid() primary key,
  trainer_client_id uuid        references public.trainer_clients on delete cascade not null,
  client_id         uuid        references auth.users on delete cascade not null,
  week_start        date        not null default date_trunc('week', current_date)::date,
  sleep_rating      int         check (sleep_rating between 1 and 5),
  energy_rating     int         check (energy_rating between 1 and 5),
  adherence_rating  int         check (adherence_rating between 1 and 5),
  notes             text,
  created_at        timestamptz not null default now(),
  unique (trainer_client_id, week_start)
);

alter table public.check_ins enable row level security;

-- Both trainer and client can read check-ins for their link
create policy "check_ins: participant read" on public.check_ins
  for select using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.id = trainer_client_id
        and (tc.trainer_id = auth.uid() or tc.client_id = auth.uid())
    )
  );

-- Only the client can insert/update their own check-ins
create policy "check_ins: client write" on public.check_ins
  for insert with check (client_id = auth.uid());

create policy "check_ins: client update" on public.check_ins
  for update using (client_id = auth.uid());

-- ── 3. Session notes (written by trainer, readable by client) ─────────────────
create table if not exists public.session_notes (
  id         uuid        default gen_random_uuid() primary key,
  session_id uuid        references public.workout_sessions on delete cascade not null,
  trainer_id uuid        references auth.users on delete cascade not null,
  content    text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, trainer_id)
);

alter table public.session_notes enable row level security;

-- Trainer reads/writes their own notes; client reads notes on their sessions
create policy "session_notes: trainer full access" on public.session_notes
  for all using (trainer_id = auth.uid());

create policy "session_notes: client reads own" on public.session_notes
  for select using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ── 4. RPC: get thread summaries (last message + unread count) ─────────────────
create or replace function public.get_thread_summaries()
returns table (
  trainer_client_id uuid,
  other_user_id     uuid,
  other_name        text,
  last_message      text,
  last_message_at   timestamptz,
  unread_count      bigint
) language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    tc.id                                        as trainer_client_id,
    case when tc.trainer_id = auth.uid()
         then tc.client_id
         else tc.trainer_id end                  as other_user_id,
    p.full_name                                  as other_name,
    (select m.content from public.messages m
     where m.trainer_client_id = tc.id
     order by m.created_at desc limit 1)         as last_message,
    (select m.created_at from public.messages m
     where m.trainer_client_id = tc.id
     order by m.created_at desc limit 1)         as last_message_at,
    (select count(*) from public.messages m
     where m.trainer_client_id = tc.id
       and m.sender_id != auth.uid()
       and m.read_at is null)                    as unread_count
  from public.trainer_clients tc
  join public.profiles p
    on p.id = case when tc.trainer_id = auth.uid()
                   then tc.client_id
                   else tc.trainer_id end
  where (tc.trainer_id = auth.uid() or tc.client_id = auth.uid())
    and tc.status = 'active'
  order by last_message_at desc nulls last;
end;
$$;
