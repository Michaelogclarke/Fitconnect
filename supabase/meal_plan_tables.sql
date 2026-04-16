-- ─── Meal Plans ───────────────────────────────────────────────────────────────

-- Plan header (trainer-owned templates + assigned copies)
CREATE TABLE meal_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id),   -- creator (trainer)
  name         text NOT NULL,
  description  text,
  assigned_to  uuid REFERENCES auth.users(id),            -- client (null = template)
  assigned_by  uuid REFERENCES auth.users(id),            -- trainer who assigned
  is_template  boolean NOT NULL DEFAULT true,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
-- Trainers can manage their own plans; clients can read plans assigned to them
CREATE POLICY "Meal plan access" ON meal_plans
  FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = assigned_to
  );
CREATE INDEX ON meal_plans (user_id);
CREATE INDEX ON meal_plans (assigned_to);

-- Days within a plan (day_number 1 = Monday … 7 = Sunday)
CREATE TABLE meal_plan_days (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id   uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_number     int  NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  day_name       text NOT NULL
);
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meal plan days access" ON meal_plan_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      WHERE mp.id = meal_plan_id
        AND (auth.uid() = mp.user_id OR auth.uid() = mp.assigned_to)
    )
  );
CREATE INDEX ON meal_plan_days (meal_plan_id);

-- Individual meal entries within a day
CREATE TABLE meal_plan_meals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_day_id  uuid NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type         text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  name              text NOT NULL,
  calories          int  NOT NULL DEFAULT 0,
  protein_g         numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g           numeric(6,1) NOT NULL DEFAULT 0,
  fat_g             numeric(6,1) NOT NULL DEFAULT 0,
  notes             text,
  sort_order        int  NOT NULL DEFAULT 0
);
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meal plan meals access" ON meal_plan_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plan_days mpd
      JOIN meal_plans mp ON mp.id = mpd.meal_plan_id
      WHERE mpd.id = meal_plan_day_id
        AND (auth.uid() = mp.user_id OR auth.uid() = mp.assigned_to)
    )
  );
CREATE INDEX ON meal_plan_meals (meal_plan_day_id);

-- Track which trainer set this client's nutrition goals
ALTER TABLE nutrition_goals ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id);

-- ─── RPC: get_client_compliance ──────────────────────────────────────────────
-- Returns last p_days days of food log summaries for a client.
-- Caller must be an active trainer of that client.

CREATE OR REPLACE FUNCTION get_client_compliance(
  p_client_id uuid,
  p_days      int DEFAULT 7
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check int;
BEGIN
  SELECT COUNT(*) INTO v_check
  FROM trainer_clients
  WHERE trainer_id = auth.uid()
    AND client_id  = p_client_id
    AND status     = 'active';

  IF v_check = 0 THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'date',            d.dt::text,
        'day_number',      ((EXTRACT(DOW FROM d.dt)::int + 6) % 7) + 1,
        'logged_calories', COALESCE(s.total_cal, 0),
        'logged_protein',  COALESCE(s.total_prot, 0),
        'logged_carbs',    COALESCE(s.total_carbs, 0),
        'logged_fat',      COALESCE(s.total_fat, 0),
        'logged_items',    COALESCE(s.items, '[]'::json)
      )
      ORDER BY d.dt
    )
    FROM generate_series(
      current_date - (p_days - 1),
      current_date,
      '1 day'::interval
    ) AS d(dt)
    LEFT JOIN LATERAL (
      SELECT
        SUM(calories)::int       AS total_cal,
        SUM(protein_g)::numeric  AS total_prot,
        SUM(carbs_g)::numeric    AS total_carbs,
        SUM(fat_g)::numeric      AS total_fat,
        json_agg(
          json_build_object(
            'name',      name,
            'meal_type', meal_type,
            'calories',  calories,
            'protein_g', protein_g,
            'carbs_g',   carbs_g,
            'fat_g',     fat_g
          ) ORDER BY created_at
        ) AS items
      FROM food_logs
      WHERE user_id  = p_client_id
        AND logged_at = d.dt
    ) s ON true
  );
END;
$$;

-- ─── RPC: assign_meal_plan_to_client ──────────────────────────────────────────
-- Deep-copies a template to a client. Optionally pushes averaged daily macros
-- to the client's nutrition_goals.

CREATE OR REPLACE FUNCTION assign_meal_plan_to_client(
  p_plan_id     uuid,
  p_client_id   uuid,
  p_push_macros boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_plan_id uuid;
  v_new_day_id  uuid;
  v_day         record;
  v_meal        record;
  v_avg_cal     int;
  v_avg_prot    numeric;
  v_avg_carbs   numeric;
  v_avg_fat     numeric;
  v_day_count   int;
BEGIN
  -- Deactivate any existing active meal plan assigned by this trainer to this client
  UPDATE meal_plans
  SET is_active = false, updated_at = now()
  WHERE assigned_to = p_client_id
    AND assigned_by = auth.uid()
    AND is_template = false
    AND is_active   = true;

  -- Copy plan header
  INSERT INTO meal_plans (user_id, name, description, assigned_to, assigned_by, is_template, is_active)
  SELECT user_id, name, description, p_client_id, auth.uid(), false, true
  FROM   meal_plans
  WHERE  id = p_plan_id
  RETURNING id INTO v_new_plan_id;

  IF v_new_plan_id IS NULL THEN
    RETURN json_build_object('error', 'Plan not found');
  END IF;

  -- Copy days + meals
  FOR v_day IN
    SELECT * FROM meal_plan_days WHERE meal_plan_id = p_plan_id ORDER BY day_number
  LOOP
    INSERT INTO meal_plan_days (meal_plan_id, day_number, day_name)
    VALUES (v_new_plan_id, v_day.day_number, v_day.day_name)
    RETURNING id INTO v_new_day_id;

    FOR v_meal IN
      SELECT * FROM meal_plan_meals WHERE meal_plan_day_id = v_day.id ORDER BY sort_order
    LOOP
      INSERT INTO meal_plan_meals
        (meal_plan_day_id, meal_type, name, calories, protein_g, carbs_g, fat_g, notes, sort_order)
      VALUES
        (v_new_day_id, v_meal.meal_type, v_meal.name, v_meal.calories,
         v_meal.protein_g, v_meal.carbs_g, v_meal.fat_g, v_meal.notes, v_meal.sort_order);
    END LOOP;
  END LOOP;

  -- Optionally push averaged daily macros to the client's nutrition_goals
  IF p_push_macros THEN
    SELECT COUNT(DISTINCT mpd.id),
           ROUND(AVG(day_totals.cal))::int,
           ROUND(AVG(day_totals.prot), 0),
           ROUND(AVG(day_totals.carbs), 0),
           ROUND(AVG(day_totals.fat), 0)
    INTO   v_day_count, v_avg_cal, v_avg_prot, v_avg_carbs, v_avg_fat
    FROM   meal_plan_days mpd
    JOIN   LATERAL (
             SELECT SUM(calories) AS cal,
                    SUM(protein_g) AS prot,
                    SUM(carbs_g)   AS carbs,
                    SUM(fat_g)     AS fat
             FROM   meal_plan_meals
             WHERE  meal_plan_day_id = mpd.id
           ) day_totals ON true
    WHERE  mpd.meal_plan_id = p_plan_id;

    IF v_day_count > 0 THEN
      INSERT INTO nutrition_goals (user_id, calories, protein_g, carbs_g, fat_g, assigned_by, updated_at)
      VALUES (p_client_id, v_avg_cal, v_avg_prot::int, v_avg_carbs::int, v_avg_fat::int, auth.uid(), now())
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
