-- Nutrition goals (one row per user)
CREATE TABLE nutrition_goals (
  user_id   uuid PRIMARY KEY REFERENCES auth.users(id),
  calories  int NOT NULL DEFAULT 2000,
  protein_g int NOT NULL DEFAULT 150,
  carbs_g   int NOT NULL DEFAULT 200,
  fat_g     int NOT NULL DEFAULT 65,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON nutrition_goals
  FOR ALL USING (auth.uid() = user_id);

-- Daily food logs
CREATE TABLE food_logs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id),
  name      text NOT NULL,
  calories  int NOT NULL,
  protein_g numeric(6,1) DEFAULT 0,
  carbs_g   numeric(6,1) DEFAULT 0,
  fat_g     numeric(6,1) DEFAULT 0,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  logged_at date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own logs" ON food_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON food_logs (user_id, logged_at);
