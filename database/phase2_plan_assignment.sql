-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2: Plan Assignment & Client Management
-- Run in the Supabase SQL Editor after phase1_trainer_foundation.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Store email on profiles (needed for trainer invite lookup) ─────────────
alter table public.profiles
  add column if not exists email text;

-- Update trigger to also capture email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.email
  );
  return new;
end;
$$;

-- ── 2. Plan assignment columns on workout_plans ───────────────────────────────
alter table public.workout_plans
  add column if not exists assigned_to uuid references auth.users on delete set null,
  add column if not exists assigned_by uuid references auth.users on delete set null;

-- ── 3. Update workout_plans RLS to allow clients to read assigned plans ────────
drop policy if exists "workout_plans: own rows" on public.workout_plans;

-- Creator has full access
create policy "workout_plans: owner full access" on public.workout_plans
  for all using (user_id = auth.uid());

-- Assigned client can read (not write)
create policy "workout_plans: assigned client reads" on public.workout_plans
  for select using (assigned_to = auth.uid());

-- ── 4. Allow assigned clients to read plan days and exercises ─────────────────
drop policy if exists "workout_plan_days: own rows" on public.workout_plan_days;

create policy "workout_plan_days: owner or assigned" on public.workout_plan_days
  for all using (
    exists (
      select 1 from public.workout_plans p
      where p.id = plan_id
        and (p.user_id = auth.uid() or p.assigned_to = auth.uid())
    )
  );

drop policy if exists "workout_plan_exercises: own rows" on public.workout_plan_exercises;

create policy "workout_plan_exercises: owner or assigned" on public.workout_plan_exercises
  for all using (
    exists (
      select 1 from public.workout_plan_days d
      join public.workout_plans p on p.id = d.plan_id
      where d.id = plan_day_id
        and (p.user_id = auth.uid() or p.assigned_to = auth.uid())
    )
  );

-- ── 5. RPC: trainer invites a client by email ─────────────────────────────────
-- Runs as security definer so it can look up auth.users by email.
create or replace function public.invite_client_by_email(client_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_client_id  uuid;
  v_full_name  text;
  v_role       text;
begin
  -- Resolve email → user id
  select id into v_client_id
  from auth.users
  where lower(email) = lower(client_email);

  if v_client_id is null then
    return jsonb_build_object('error', 'No account found with that email.');
  end if;

  -- Make sure the target is actually a client, not another trainer
  select role, full_name into v_role, v_full_name
  from public.profiles
  where id = v_client_id;

  if v_role = 'trainer' then
    return jsonb_build_object('error', 'That account is registered as a trainer.');
  end if;

  -- Can't invite yourself
  if v_client_id = auth.uid() then
    return jsonb_build_object('error', 'You cannot invite yourself.');
  end if;

  -- Create invite (ignore if duplicate)
  insert into public.trainer_clients (trainer_id, client_id)
  values (auth.uid(), v_client_id)
  on conflict (trainer_id, client_id) do nothing;

  return jsonb_build_object('success', true, 'client_id', v_client_id, 'full_name', v_full_name);
end;
$$;

-- ── 6. RPC: trainer assigns a plan to a client ────────────────────────────────
create or replace function public.assign_plan_to_client(p_plan_id uuid, p_client_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_linked boolean;
begin
  -- Verify this trainer owns the plan
  if not exists (
    select 1 from public.workout_plans
    where id = p_plan_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('error', 'Plan not found or not yours.');
  end if;

  -- Verify the client is linked to this trainer
  select exists (
    select 1 from public.trainer_clients
    where trainer_id = auth.uid()
      and client_id = p_client_id
      and status = 'active'
  ) into v_linked;

  if not v_linked then
    return jsonb_build_object('error', 'Client is not linked to your account.');
  end if;

  -- Assign (unassign any previous plan from this trainer to this client first)
  update public.workout_plans
  set assigned_to = null, assigned_by = null
  where assigned_to = p_client_id and user_id = auth.uid();

  update public.workout_plans
  set assigned_to = p_client_id, assigned_by = auth.uid()
  where id = p_plan_id;

  return jsonb_build_object('success', true);
end;
$$;
