-- ===================================================
-- GigaBike — Supabase Setup
-- Run this in the Supabase SQL Editor
-- ===================================================

-- Orders table
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

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read (order tracking by ID)
CREATE POLICY "Public can read orders" ON orders
  FOR SELECT USING (true);

-- Allow public insert (placing an order)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Only service role can update (admin status changes)
-- No UPDATE policy needed — use service role key from admin panel

-- ===================================================
-- Storage bucket for payment slips
-- Run in Supabase Dashboard → Storage → New Bucket
-- ===================================================
-- Bucket name : order-slips
-- Public      : true  (so slip URLs are accessible)
-- File size   : 5 MB limit

-- Storage policy (run via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-slips',
  'order-slips',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public upload slips" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-slips');

CREATE POLICY "Public read slips" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-slips');

-- ===================================================
-- Environment variables needed in Netlify / .env.local
-- ===================================================
-- NEXT_PUBLIC_SUPABASE_URL       = your project URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  = your anon key
-- SUPABASE_SERVICE_ROLE_KEY      = your service role key (server only, never expose to browser)
