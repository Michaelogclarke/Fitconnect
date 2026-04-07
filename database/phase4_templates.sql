-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 4: Template Library
-- Run in the Supabase SQL Editor after phase3_communication.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Mark plans as reusable templates ──────────────────────────────────────
alter table public.workout_plans
  add column if not exists is_template boolean not null default false;

-- ── 2. Deploy a template to a client (deep copy) ─────────────────────────────
-- Creates a full copy of a template plan assigned to the target client.
-- The original template is untouched — each client gets their own editable copy.
create or replace function public.deploy_template_to_client(
  p_template_id uuid,
  p_client_id   uuid
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_new_plan_id uuid;
  v_day         record;
  v_new_day_id  uuid;
begin
  -- Verify calling user owns the template
  if not exists (
    select 1 from public.workout_plans
    where id = p_template_id
      and user_id = auth.uid()
      and is_template = true
  ) then
    return jsonb_build_object('error', 'Template not found or not yours.');
  end if;

  -- Verify client is linked to this trainer
  if not exists (
    select 1 from public.trainer_clients
    where trainer_id = auth.uid()
      and client_id  = p_client_id
      and status     = 'active'
  ) then
    return jsonb_build_object('error', 'Client is not linked to your account.');
  end if;

  -- Copy the plan row
  insert into public.workout_plans (user_id, name, description, days_per_week, is_active, assigned_to, assigned_by, is_template)
  select user_id, name, description, days_per_week, false, p_client_id, auth.uid(), false
  from public.workout_plans
  where id = p_template_id
  returning id into v_new_plan_id;

  -- Copy each day and its exercises
  for v_day in
    select * from public.workout_plan_days where plan_id = p_template_id
  loop
    insert into public.workout_plan_days (plan_id, day_number, name, focus)
    values (v_new_plan_id, v_day.day_number, v_day.name, v_day.focus)
    returning id into v_new_day_id;

    insert into public.workout_plan_exercises
      (plan_day_id, exercise_name, muscle_group, sets, reps, weight, sort_order)
    select v_new_day_id, exercise_name, muscle_group, sets, reps, weight, sort_order
    from public.workout_plan_exercises
    where plan_day_id = v_day.id;
  end loop;

  return jsonb_build_object('success', true, 'plan_id', v_new_plan_id);
end;
$$;
