-- Announcements: scheduling + image + CTA (Batch 4)
-- All columns are nullable, so existing rows are unaffected and the app
-- treats missing values as "no schedule / no image / no link".
-- Idempotent — safe to run more than once.

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS starts_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS link_url   TEXT,
  ADD COLUMN IF NOT EXISTS link_label TEXT;
