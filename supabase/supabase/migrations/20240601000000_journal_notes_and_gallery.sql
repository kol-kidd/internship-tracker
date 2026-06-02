-- Run this in Supabase Dashboard > SQL Editor.
-- Requires: journal_entries table and auth.users (default Supabase setup).
-- Journal notes: quick notes that can be merged into a full journal entry
CREATE TABLE IF NOT EXISTS journal_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If table already exists without time column, add it:
ALTER TABLE journal_notes ADD COLUMN IF NOT EXISTS time TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_notes_user_id ON journal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_notes_date ON journal_notes(date DESC);

ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON journal_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Journal gallery: images (proof of work) linked optionally to a journal entry
CREATE TABLE IF NOT EXISTS journal_gallery (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_gallery_user_id ON journal_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_gallery_entry_id ON journal_gallery(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_gallery_created_at ON journal_gallery(created_at DESC);

ALTER TABLE journal_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gallery"
  ON journal_gallery FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for journal gallery images (run in Supabase Dashboard SQL or via API)
-- Bucket name: journal-gallery
-- Path: {user_id}/{filename}
-- RLS: authenticated users can read/write their own folder (auth.uid()::text = (storage.foldername(name))[1])

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-gallery',
  'journal-gallery',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own folder"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'journal-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read for journal-gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-gallery');
