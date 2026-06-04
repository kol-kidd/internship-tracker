-- Richer application tracking and persistent accepted-internship checklists.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS application_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS deadline_date DATE,
  ADD COLUMN IF NOT EXISTS interview_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_email TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS checklist_seeded_at TIMESTAMPTZ;

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_priority_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_priority_check
  CHECK (priority IN ('low', 'normal', 'high'));

CREATE INDEX IF NOT EXISTS idx_applications_user_follow_up
  ON applications(user_id, follow_up_date)
  WHERE follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_user_deadline
  ON applications(user_id, deadline_date)
  WHERE deadline_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS application_checklist_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_checklist_items_app
  ON application_checklist_items(user_id, application_id, sort_order, id);

ALTER TABLE application_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own application checklist items"
  ON application_checklist_items;

CREATE POLICY "Users can manage own application checklist items"
  ON application_checklist_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
