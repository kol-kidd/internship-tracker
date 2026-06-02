-- Schools lookup table: canonical school names with aliases for fuzzy matching.
-- Users pick a school; the app stores both the display name (free text) and
-- the resolved school_id so leaderboards group correctly regardless of spelling.

CREATE TABLE IF NOT EXISTS schools (
  id        BIGSERIAL PRIMARY KEY,
  name      TEXT NOT NULL,              -- canonical display name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_aliases (
  id        BIGSERIAL PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  alias     TEXT NOT NULL,              -- lowercase, trimmed alternate name
  UNIQUE (alias)
);

CREATE INDEX IF NOT EXISTS idx_school_aliases_alias ON school_aliases(alias);

-- RLS: anyone authenticated can read (for search/autocomplete)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools are publicly readable"
  ON schools FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "School aliases are publicly readable"
  ON school_aliases FOR SELECT USING (auth.role() = 'authenticated');

-- Add school_id FK to profiles (nullable — existing users don't have one yet)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_id BIGINT REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Drop old school-text leaderboard RLS policy if it exists, add school_id-aware one
DROP POLICY IF EXISTS "Profiles are readable for leaderboards" ON profiles;

CREATE POLICY "Profiles are readable for leaderboards"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
