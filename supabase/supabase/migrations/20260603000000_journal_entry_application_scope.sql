-- Link journal entries to accepted internship applications.
-- Existing entries remain unassigned until the user moves them.
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_application_date
  ON journal_entries(user_id, application_id, date DESC);
