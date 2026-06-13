-- Bike-model / colour registry (Batch B)
-- Admin-managed additions on top of the built-in presets in src/data + the
-- ProductModal colour list. The app reads presets ∪ these rows, so the
-- storefront keeps working even if these tables are empty or absent.
-- Idempotent — safe to run more than once.

CREATE TABLE IF NOT EXISTS bike_models (
  id         TEXT        PRIMARY KEY,        -- slug, e.g. 'yamaha-xsr700'
  brand      TEXT        NOT NULL,
  model      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colors (
  id         TEXT        PRIMARY KEY,        -- slug, e.g. 'navy'
  label_th   TEXT        NOT NULL,
  hex        TEXT,                           -- dot colour (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bike_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors      ENABLE ROW LEVEL SECURITY;

-- Reference data — readable by anyone (storefront filters); writes go through
-- the admin API (service role).
DROP POLICY IF EXISTS "Anon reads bike_models" ON bike_models;
CREATE POLICY "Anon reads bike_models" ON bike_models FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon reads colors" ON colors;
CREATE POLICY "Anon reads colors" ON colors FOR SELECT TO anon USING (true);
