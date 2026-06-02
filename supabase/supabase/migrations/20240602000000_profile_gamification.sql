-- Run this in Supabase Dashboard > SQL Editor.
-- Adds profile academic/hours fields and gamification (groups) tables.
-- Requires: profiles table, journal_entries table, auth.users (default Supabase setup).

-- ---------------------------------------------------------------------------
-- 1. Extend profiles with academic info + hours tracking
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS course TEXT,
  ADD COLUMN IF NOT EXISTS program TEXT,
  ADD COLUMN IF NOT EXISTS required_hours INTEGER NOT NULL DEFAULT 702,
  ADD COLUMN IF NOT EXISTS total_hours NUMERIC NOT NULL DEFAULT 0,        -- synced from journal_entries
  ADD COLUMN IF NOT EXISTS hours_completed_at TIMESTAMPTZ,                -- set when total >= required
  ADD COLUMN IF NOT EXISTS completion_emailed_at TIMESTAMPTZ;            -- guards against duplicate emails

-- Leaderboards need to read a limited set of columns across ALL profiles.
-- (Postgres RLS is row-level, not column-level; the frontend selects only the
--  safe columns. Owner-only write policy is assumed to already exist.)
DROP POLICY IF EXISTS "Profiles are readable for leaderboards" ON profiles;
CREATE POLICY "Profiles are readable for leaderboards"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 2. Groups (custom invite-code groups for gamification)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id  UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Members can read groups they belong to. Create/join/leaderboard mutations go
-- through the Express backend using the service-role key (bypasses RLS), so
-- these read policies only need to cover direct frontend reads.
DROP POLICY IF EXISTS "Members can read their groups" ON groups;
CREATE POLICY "Members can read their groups"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can read group membership" ON group_members;
CREATE POLICY "Members can read group membership"
  ON group_members FOR SELECT
  USING (auth.role() = 'authenticated');
