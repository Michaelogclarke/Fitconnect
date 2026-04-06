-- ─────────────────────────────────────────────────────────────────────────────
-- FitConnect — Common Exercise Library Seed
-- Run this in the Supabase SQL Editor (bypasses RLS so user_id can be NULL).
-- These are global presets visible to all users.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.exercises (name, muscle_group, equipment, is_custom)
values
  -- ── Chest ──────────────────────────────────────────────────────────────────
  ('Bench Press',              'Chest',     'Barbell',    false),
  ('Incline Bench Press',      'Chest',     'Barbell',    false),
  ('Decline Bench Press',      'Chest',     'Barbell',    false),
  ('Dumbbell Press',           'Chest',     'Dumbbell',   false),
  ('Incline Dumbbell Press',   'Chest',     'Dumbbell',   false),
  ('Dumbbell Fly',             'Chest',     'Dumbbell',   false),
  ('Cable Fly',                'Chest',     'Cable',      false),
  ('Chest Press Machine',      'Chest',     'Machine',    false),
  ('Pec Deck',                 'Chest',     'Machine',    false),
  ('Push-Up',                  'Chest',     'Bodyweight', false),
  ('Wide Push-Up',             'Chest',     'Bodyweight', false),
  ('Dips',                     'Chest',     'Bodyweight', false),

  -- ── Back ───────────────────────────────────────────────────────────────────
  ('Pull-Up',                  'Back',      'Bodyweight', false),
  ('Chin-Up',                  'Back',      'Bodyweight', false),
  ('Barbell Row',              'Back',      'Barbell',    false),
  ('Dumbbell Row',             'Back',      'Dumbbell',   false),
  ('Seated Cable Row',         'Back',      'Cable',      false),
  ('Lat Pulldown',             'Back',      'Cable',      false),
  ('T-Bar Row',                'Back',      'Barbell',    false),
  ('Face Pull',                'Back',      'Cable',      false),
  ('Straight-Arm Pulldown',    'Back',      'Cable',      false),
  ('Deadlift',                 'Back',      'Barbell',    false),
  ('Romanian Deadlift',        'Back',      'Barbell',    false),
  ('Good Morning',             'Back',      'Barbell',    false),
  ('Hyperextension',           'Back',      'Machine',    false),
  ('Rack Pull',                'Back',      'Barbell',    false),

  -- ── Shoulders ──────────────────────────────────────────────────────────────
  ('Overhead Press',           'Shoulders', 'Barbell',    false),
  ('Seated Dumbbell Press',    'Shoulders', 'Dumbbell',   false),
  ('Arnold Press',             'Shoulders', 'Dumbbell',   false),
  ('Lateral Raise',            'Shoulders', 'Dumbbell',   false),
  ('Cable Lateral Raise',      'Shoulders', 'Cable',      false),
  ('Front Raise',              'Shoulders', 'Dumbbell',   false),
  ('Rear Delt Fly',            'Shoulders', 'Dumbbell',   false),
  ('Machine Shoulder Press',   'Shoulders', 'Machine',    false),
  ('Barbell Shrug',            'Shoulders', 'Barbell',    false),
  ('Dumbbell Shrug',           'Shoulders', 'Dumbbell',   false),

  -- ── Biceps ─────────────────────────────────────────────────────────────────
  ('Barbell Curl',             'Biceps',    'Barbell',    false),
  ('Dumbbell Curl',            'Biceps',    'Dumbbell',   false),
  ('Hammer Curl',              'Biceps',    'Dumbbell',   false),
  ('Preacher Curl',            'Biceps',    'Barbell',    false),
  ('Cable Curl',               'Biceps',    'Cable',      false),
  ('Concentration Curl',       'Biceps',    'Dumbbell',   false),
  ('Incline Dumbbell Curl',    'Biceps',    'Dumbbell',   false),
  ('Spider Curl',              'Biceps',    'Dumbbell',   false),

  -- ── Triceps ────────────────────────────────────────────────────────────────
  ('Tricep Pushdown',          'Triceps',   'Cable',      false),
  ('Rope Pushdown',            'Triceps',   'Cable',      false),
  ('Skull Crusher',            'Triceps',   'Barbell',    false),
  ('Overhead Tricep Extension','Triceps',   'Dumbbell',   false),
  ('Close-Grip Bench Press',   'Triceps',   'Barbell',    false),
  ('Tricep Dips',              'Triceps',   'Bodyweight', false),
  ('Diamond Push-Up',          'Triceps',   'Bodyweight', false),
  ('Kickback',                 'Triceps',   'Dumbbell',   false),

  -- ── Legs ───────────────────────────────────────────────────────────────────
  ('Back Squat',               'Legs',      'Barbell',    false),
  ('Front Squat',              'Legs',      'Barbell',    false),
  ('Goblet Squat',             'Legs',      'Dumbbell',   false),
  ('Leg Press',                'Legs',      'Machine',    false),
  ('Hack Squat',               'Legs',      'Machine',    false),
  ('Leg Extension',            'Legs',      'Machine',    false),
  ('Leg Curl',                 'Legs',      'Machine',    false),
  ('Romanian Deadlift',        'Legs',      'Barbell',    false),
  ('Sumo Deadlift',            'Legs',      'Barbell',    false),
  ('Bulgarian Split Squat',    'Legs',      'Dumbbell',   false),
  ('Lunges',                   'Legs',      'Dumbbell',   false),
  ('Walking Lunges',           'Legs',      'Dumbbell',   false),
  ('Step-Up',                  'Legs',      'Dumbbell',   false),
  ('Hip Thrust',               'Legs',      'Barbell',    false),
  ('Glute Bridge',             'Legs',      'Bodyweight', false),
  ('Calf Raise',               'Legs',      'Machine',    false),
  ('Seated Calf Raise',        'Legs',      'Machine',    false),

  -- ── Core ───────────────────────────────────────────────────────────────────
  ('Plank',                    'Core',      'Bodyweight', false),
  ('Side Plank',               'Core',      'Bodyweight', false),
  ('Crunch',                   'Core',      'Bodyweight', false),
  ('Sit-Up',                   'Core',      'Bodyweight', false),
  ('Leg Raise',                'Core',      'Bodyweight', false),
  ('Hanging Leg Raise',        'Core',      'Bodyweight', false),
  ('Russian Twist',            'Core',      'Bodyweight', false),
  ('Ab Wheel',                 'Core',      'Other',      false),
  ('Cable Crunch',             'Core',      'Cable',      false),
  ('Bicycle Crunch',           'Core',      'Bodyweight', false),
  ('Mountain Climber',         'Core',      'Bodyweight', false),
  ('Hollow Hold',              'Core',      'Bodyweight', false),

  -- ── Cardio ─────────────────────────────────────────────────────────────────
  ('Treadmill Run',            'Cardio',    'Machine',    false),
  ('Cycling',                  'Cardio',    'Machine',    false),
  ('Rowing Machine',           'Cardio',    'Machine',    false),
  ('Jump Rope',                'Cardio',    'Other',      false),
  ('Stair Climber',            'Cardio',    'Machine',    false),
  ('Assault Bike',             'Cardio',    'Machine',    false)

on conflict do nothing;
