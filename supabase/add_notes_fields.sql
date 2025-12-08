-- Add notes/comments fields to tracking tables
-- This allows users to add comments explaining changes or context

-- Add notes to sleep_logs (in addition to existing disturbances field)
ALTER TABLE sleep_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN sleep_logs.notes IS 'User notes/comments about sleep, e.g., why sleep quality changed, medication effects, etc.';

-- Add notes to food_logs (per meal)
ALTER TABLE food_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN food_logs.notes IS 'User notes/comments about the meal, e.g., why food choices changed, reactions, etc.';

-- Add notes to symptoms
ALTER TABLE symptoms 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN symptoms.notes IS 'User notes/comments about symptoms, e.g., triggers, context, changes, etc.';

-- Add notes to mood_logs
ALTER TABLE mood_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN mood_logs.notes IS 'User notes/comments about mood and wellness, e.g., why energy changed, what helped, etc.';

-- Note: exercises table already has notes field
-- Note: medications table is a master list, not per-day tracking
-- Note: medication_logs could have notes but typically just tracks taken/not taken

