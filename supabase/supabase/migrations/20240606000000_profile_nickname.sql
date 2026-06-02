-- Optional user nickname used as the app-facing identity label.
-- full_name remains available for certificates, email, and formal records.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT;
