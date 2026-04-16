-- ─── Saved Meal Combos ────────────────────────────────────────────────────────
-- Users save multi-item meal combos (e.g. "Turkey bagel breakfast") so they
-- can log them all at once in future.

CREATE TABLE saved_meals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved meals" ON saved_meals
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON saved_meals (user_id);

CREATE TABLE saved_meal_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id uuid NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  name          text NOT NULL,
  calories      int           NOT NULL DEFAULT 0,
  protein_g     numeric(6,1)  NOT NULL DEFAULT 0,
  carbs_g       numeric(6,1)  NOT NULL DEFAULT 0,
  fat_g         numeric(6,1)  NOT NULL DEFAULT 0,
  sort_order    int           NOT NULL DEFAULT 0
);
ALTER TABLE saved_meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved meal items" ON saved_meal_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saved_meals sm
      WHERE sm.id = saved_meal_id AND sm.user_id = auth.uid()
    )
  );
CREATE INDEX ON saved_meal_items (saved_meal_id);
