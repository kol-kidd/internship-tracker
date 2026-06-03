-- Adds a curated appearance preference for each user profile.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'internpal';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('internpal', 'focus-dark', 'sage', 'rose', 'amber'));
