-- ===================================================
-- GigaBike — Supabase Setup  (idempotent — safe to re-run)
-- Run this in the Supabase SQL Editor
-- ===================================================

-- ── Orders table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','shipping','delivered','cancelled')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  recipient_name    TEXT NOT NULL,
  recipient_phone   TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  shipping_method   TEXT NOT NULL,
  shipping_fee      INTEGER NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('transfer','cod')),
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          INTEGER NOT NULL DEFAULT 0,
  cod_fee           INTEGER NOT NULL DEFAULT 0,
  total             INTEGER NOT NULL DEFAULT 0,
  slip_url          TEXT,
  tracking_no       TEXT
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read orders"    ON orders;
DROP POLICY IF EXISTS "Public can create orders"  ON orders;
DROP POLICY IF EXISTS "Service role update orders" ON orders;

CREATE POLICY "Public can read orders"    ON orders FOR SELECT USING (true);
CREATE POLICY "Public can create orders"  ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);

-- ── Storage: order-slips ─────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-slips', 'order-slips', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public upload slips" ON storage.objects;
DROP POLICY IF EXISTS "Public read slips"   ON storage.objects;

CREATE POLICY "Public upload slips" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-slips');

CREATE POLICY "Public read slips" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-slips');

-- ── Storage: product-images ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Auth upload product images"  ON storage.objects;
DROP POLICY IF EXISTS "Public read product images"  ON storage.objects;
DROP POLICY IF EXISTS "Auth delete product images"  ON storage.objects;

CREATE POLICY "Auth upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Auth delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ===================================================
-- Environment variables (.env.local / Netlify)
-- ===================================================
-- NEXT_PUBLIC_SUPABASE_URL       = your project URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  = your anon key
-- SUPABASE_SERVICE_ROLE_KEY      = your service role key (server only)
