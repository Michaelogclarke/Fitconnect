-- ─── Meal Plans v2 (flat structure) ──────────────────────────────────────────
-- Drops the old day-based hierarchy and replaces with a flat meal list.

DROP TABLE IF EXISTS meal_plan_meals CASCADE;
DROP TABLE IF EXISTS meal_plan_days  CASCADE;
DROP TABLE IF EXISTS meal_plans      CASCADE;
DROP FUNCTION IF EXISTS assign_meal_plan_to_client CASCADE;
DROP FUNCTION IF EXISTS get_client_compliance      CASCADE;

CREATE TABLE meal_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id),   -- creator
  name        text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id),            -- client (null = template)
  assigned_by uuid REFERENCES auth.users(id),
  is_template boolean NOT NULL DEFAULT true,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meal plan access" ON meal_plans
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE INDEX ON meal_plans (user_id);
CREATE INDEX ON meal_plans (assigned_to);

-- Flat meal list — no days, just meal_type grouping
CREATE TABLE meal_plan_meals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type    text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  name         text NOT NULL,
  calories     int          NOT NULL DEFAULT 0,
  protein_g    numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g      numeric(6,1) NOT NULL DEFAULT 0,
  fat_g        numeric(6,1) NOT NULL DEFAULT 0,
  notes        text,
  sort_order   int          NOT NULL DEFAULT 0
);
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meal plan meals access" ON meal_plan_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      WHERE mp.id = meal_plan_id
        AND (auth.uid() = mp.user_id OR auth.uid() = mp.assigned_to)
    )
  );
CREATE INDEX ON meal_plan_meals (meal_plan_id);

-- Track which trainer set nutrition goals
ALTER TABLE nutrition_goals ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id);

-- ─── RPC: assign_meal_plan_to_client ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_meal_plan_to_client(
  p_plan_id     uuid,
  p_client_id   uuid,
  p_push_macros boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_plan_id uuid;
  v_total_cal   int;
  v_total_prot  numeric;
  v_total_carbs numeric;
  v_total_fat   numeric;
BEGIN
  -- Deactivate any existing active plan from this trainer for this client
  UPDATE meal_plans
  SET is_active = false, updated_at = now()
  WHERE assigned_to = p_client_id
    AND assigned_by = auth.uid()
    AND is_template = false
    AND is_active   = true;

  -- Copy plan header
  INSERT INTO meal_plans (user_id, name, description, assigned_to, assigned_by, is_template, is_active)
  SELECT user_id, name, description, p_client_id, auth.uid(), false, true
  FROM   meal_plans WHERE id = p_plan_id
  RETURNING id INTO v_new_plan_id;

  IF v_new_plan_id IS NULL THEN
    RETURN json_build_object('error', 'Plan not found');
  END IF;

  -- Copy meals directly (no days)
  INSERT INTO meal_plan_meals (meal_plan_id, meal_type, name, calories, protein_g, carbs_g, fat_g, notes, sort_order)
  SELECT v_new_plan_id, meal_type, name, calories, protein_g, carbs_g, fat_g, notes, sort_order
  FROM   meal_plan_meals
  WHERE  meal_plan_id = p_plan_id;

  -- Optionally push total plan macros to client's nutrition_goals
  IF p_push_macros THEN
    SELECT SUM(calories)::int,
           ROUND(SUM(protein_g), 0),
           ROUND(SUM(carbs_g), 0),
           ROUND(SUM(fat_g), 0)
    INTO   v_total_cal, v_total_prot, v_total_carbs, v_total_fat
    FROM   meal_plan_meals
    WHERE  meal_plan_id = p_plan_id;

    IF v_total_cal IS NOT NULL THEN
      INSERT INTO nutrition_goals (user_id, calories, protein_g, carbs_g, fat_g, assigned_by, updated_at)
      VALUES (p_client_id, v_total_cal, v_total_prot::int, v_total_carbs::int, v_total_fat::int, auth.uid(), now())
      ON CONFLICT (user_id) DO UPDATE SET
        calories    = EXCLUDED.calories,
        protein_g   = EXCLUDED.protein_g,
        carbs_g     = EXCLUDED.carbs_g,
        fat_g       = EXCLUDED.fat_g,
        assigned_by = EXCLUDED.assigned_by,
        updated_at  = EXCLUDED.updated_at;
    END IF;
  END IF;

  RETURN json_build_object('plan_id', v_new_plan_id);
END;
$$;

-- ─── RPC: get_client_compliance (unchanged) ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_client_compliance(
  p_client_id uuid,
  p_days      int DEFAULT 7
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_check int;
BEGIN
  SELECT COUNT(*) INTO v_check FROM trainer_clients
  WHERE trainer_id = auth.uid() AND client_id = p_client_id AND status = 'active';

  IF v_check = 0 THEN RETURN json_build_object('error', 'Not authorized'); END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'date',            d.dt::text,
        'logged_calories', COALESCE(s.total_cal, 0),
        'logged_protein',  COALESCE(s.total_prot, 0),
        'logged_carbs',    COALESCE(s.total_carbs, 0),
        'logged_fat',      COALESCE(s.total_fat, 0),
        'logged_items',    COALESCE(s.items, '[]'::json)
      ) ORDER BY d.dt
    )
    FROM generate_series(current_date - (p_days - 1), current_date, '1 day'::interval) AS d(dt)
    LEFT JOIN LATERAL (
      SELECT
        SUM(calories)::int      AS total_cal,
        SUM(protein_g)::numeric AS total_prot,
        SUM(carbs_g)::numeric   AS total_carbs,
        SUM(fat_g)::numeric     AS total_fat,
        json_agg(json_build_object(
          'name', name, 'meal_type', meal_type,
          'calories', calories, 'protein_g', protein_g,
          'carbs_g', carbs_g, 'fat_g', fat_g
        ) ORDER BY created_at) AS items
      FROM food_logs
      WHERE user_id = p_client_id AND logged_at = d.dt
    ) s ON true
  );
END;
$$;
