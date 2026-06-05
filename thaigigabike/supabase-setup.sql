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
  slip_url          TEXT,            -- DEPRECATED: legacy public URL, no longer written
  slip_path         TEXT,            -- storage object path in the PRIVATE order-slips bucket
  tracking_no       TEXT,
  idempotency_key   TEXT,            -- client-generated UUID; prevents duplicate orders on retry
  contact_email     TEXT             -- required for OTP order-lookup; never exposed publicly
);

-- Safe to re-run on pre-existing tables missing newer columns.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS slip_path       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_email   TEXT;

-- ── OTP table for public order lookup ────────────────────────────
-- Only accessible via the service role (bypasses RLS).
-- Stores hashed 6-digit codes; never stores plaintext OTPs.
CREATE TABLE IF NOT EXISTS order_lookup_otps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    TEXT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  otp_hash    TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  attempts    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_lookup_otps ENABLE ROW LEVEL SECURITY;
-- No public policies — all access goes through the service role key (server-side only).

CREATE INDEX IF NOT EXISTS order_lookup_otps_order_id_idx
  ON order_lookup_otps (order_id);
CREATE INDEX IF NOT EXISTS order_lookup_otps_expires_at_idx
  ON order_lookup_otps (expires_at);

-- ── Admin login attempt log (rate limiting) ─────────────────────────────────
-- Written by POST /api/admin/auth/login (service role only).
-- Stores hashed IP — never raw IP or credentials.
-- After MAX_ATTEMPTS (5) failed attempts in 15 minutes from the same
-- email + IP hash, the login API returns a generic 429 error.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  ip_hash    TEXT        NOT NULL,
  success    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
-- No public policies — only service_role can access (bypasses RLS).

CREATE INDEX IF NOT EXISTS admin_login_attempts_lookup_idx
  ON admin_login_attempts (email, ip_hash, created_at);

-- Unique index so the DB enforces idempotency even under concurrent requests.
-- Partial (WHERE NOT NULL) so NULL rows are not constrained against each other.
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ── P0-B5: Drop ALL broad/legacy orders policies ─────────────────────────────
-- Previous policies used USING (true) without a role restriction, which allowed
-- any client with the anon key to SELECT/INSERT/UPDATE every order (OWASP A01).
DROP POLICY IF EXISTS "Public can read orders"             ON orders;
DROP POLICY IF EXISTS "Public can create orders"           ON orders;
DROP POLICY IF EXISTS "Service role update orders"         ON orders;
-- Defensive drops for any other variants that might have been created manually:
DROP POLICY IF EXISTS "orders_select_all"                  ON orders;
DROP POLICY IF EXISTS "orders_insert_all"                  ON orders;
DROP POLICY IF EXISTS "orders_update_all"                  ON orders;
DROP POLICY IF EXISTS "Allow public read orders"           ON orders;
DROP POLICY IF EXISTS "Allow public insert orders"         ON orders;
DROP POLICY IF EXISTS "Allow public update orders"         ON orders;
DROP POLICY IF EXISTS "Authenticated can read orders"      ON orders;
DROP POLICY IF EXISTS "Authenticated can update orders"    ON orders;

-- ── Orders access matrix after P0-B5 ────────────────────────────────────────
-- anon (browser, no session):
--   SELECT  — BLOCKED.  Order reading goes through /api/order-lookup/verify
--             (service role + Email OTP check). No direct table access.
--   INSERT  — BLOCKED.  Order creation goes through /api/orders (service role).
--   UPDATE  — BLOCKED.  No public updates.
--   DELETE  — BLOCKED.  No policy.
--
-- service_role (server API routes):
--   All operations — BYPASS RLS.  Used by /api/orders, OTP endpoints,
--   and the admin slip-url endpoint.
--
-- authenticated (admin dashboard, logged-in Supabase session):
--   SELECT  — ALLOWED (all rows).  Admin needs to see all orders.
--   UPDATE  — ALLOWED (all rows).  Admin updates status and tracking number.
--   INSERT  — BLOCKED.  Admin never inserts orders directly; that is the API's job.
--   DELETE  — BLOCKED.  Orders are never deleted in normal workflows.
--
-- ⚠ P0-B6 FOLLOW-UP: tighten "authenticated" to email-allowlisted admins only
--   using middleware enforcement + optional RLS check on auth.email().
-- ⚠ MITIGATION UNTIL B6: Disable public Supabase sign-ups in the Dashboard →
--   Authentication → Settings → "Disable sign-ups" so no unauthorized
--   Supabase accounts can be created and exploit the authenticated policies.

CREATE POLICY "Authenticated can read orders"
  ON orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ── Storage: order-slips (PRIVATE) ───────────────────
-- Slips contain bank/PII. The bucket is PRIVATE: slips are uploaded server-side
-- via the service role (POST /api/orders) and read by admins only through
-- short-lived signed URLs (POST /api/admin/orders/[id]/signed-slip-url).
-- The service role bypasses RLS, so NO anon storage policy is required.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-slips', 'order-slips', false, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove the old permissive policies that allowed anyone to upload/read slips.
DROP POLICY IF EXISTS "Public upload slips" ON storage.objects;
DROP POLICY IF EXISTS "Public read slips"   ON storage.objects;

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

-- ── P0-B5: Products table RLS ────────────────────────────────────────────────
-- The products table and its seed are managed by build-catalog.mjs.
-- The seed script creates the table and may contain an old broad policy.
-- This section overrides that with correct access controls and is safe to re-run.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop old broad policy generated by build-catalog.mjs (USING (true), no role limit)
DROP POLICY IF EXISTS "Public read products"                    ON products;
-- Defensive drops for any other variants:
DROP POLICY IF EXISTS "Public can read products"               ON products;
DROP POLICY IF EXISTS "Anon reads published products"          ON products;
DROP POLICY IF EXISTS "Authenticated reads all products"       ON products;
DROP POLICY IF EXISTS "Authenticated admin can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated admin can update products" ON products;
DROP POLICY IF EXISTS "Authenticated admin can delete products" ON products;

-- ── Products access matrix after P0-B5 ──────────────────────────────────────
-- anon (browser, no session):
--   SELECT  — ALLOWED for published = true rows only.
--             Unpublished drafts are invisible to the public storefront.
--   INSERT/UPDATE/DELETE — BLOCKED.
--
-- authenticated (admin dashboard):
--   SELECT  — ALLOWED (all rows, including unpublished drafts).
--   INSERT  — ALLOWED.  Admin creates products.
--   UPDATE  — ALLOWED.  Admin edits products and stock.
--   DELETE  — ALLOWED.  Admin removes products.
--
-- service_role (server API routes):
--   All operations — BYPASS RLS.
--
-- ⚠ P0-B6 FOLLOW-UP: route admin product writes through server APIs with
--   email-allowlist enforcement rather than relying on broad authenticated policies.

-- Anon: storefront reads only published products
CREATE POLICY "Anon reads published products"
  ON products FOR SELECT TO anon
  USING (published = true);

-- Authenticated: admin reads all products (including drafts)
CREATE POLICY "Authenticated reads all products"
  ON products FOR SELECT TO authenticated
  USING (true);

-- Authenticated: admin write operations
CREATE POLICY "Authenticated admin can insert products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated admin can update products"
  ON products FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated admin can delete products"
  ON products FOR DELETE TO authenticated
  USING (true);

-- ===================================================
-- Environment variables (.env.local / Netlify)
-- ===================================================
-- NEXT_PUBLIC_SUPABASE_URL       = your project URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  = your anon key
-- SUPABASE_SERVICE_ROLE_KEY      = your service role key (server only)
