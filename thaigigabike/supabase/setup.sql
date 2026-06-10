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

-- ── Orders access matrix after P1-A ─────────────────────────────────────────
-- anon (browser, no session):
--   ALL  — BLOCKED.  No policies for anon role.
--
-- authenticated (any logged-in Supabase user):
--   ALL  — BLOCKED.  No policies for authenticated role.
--   Admin reads/writes go through /api/admin/* routes (service role +
--   ADMIN_EMAILS allowlist enforced server-side).
--
-- service_role (server API routes):
--   All operations — BYPASS RLS.  Used by /api/orders, OTP endpoints,
--   /api/admin/orders, and the admin slip-url endpoint.
--
-- No CREATE POLICY needed here — service role bypasses RLS by default.

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

-- P1-B: product-images storage policies ─────────────────────────────────────
-- Upload/delete go through /api/admin/product-images/* (service role +
-- ADMIN_EMAILS allowlist). No direct browser insert/delete allowed.
-- Public read is kept because product images are public storefront assets.
DROP POLICY IF EXISTS "Auth upload product images"  ON storage.objects;
DROP POLICY IF EXISTS "Auth delete product images"  ON storage.objects;
DROP POLICY IF EXISTS "Public read product images"  ON storage.objects;

CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

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

-- ── Products access matrix after P1-A ───────────────────────────────────────
-- anon (browser, no session):
--   SELECT  — ALLOWED for published = true rows only (storefront).
--   INSERT/UPDATE/DELETE — BLOCKED.
--
-- authenticated (any logged-in Supabase user):
--   ALL  — BLOCKED.  No policies for authenticated role.
--   Admin reads/writes go through /api/admin/products routes (service role +
--   ADMIN_EMAILS allowlist enforced server-side).
--
-- service_role (server API routes):
--   All operations — BYPASS RLS.
--   Used by /api/admin/products (list/upsert/delete/stock) and /api/orders.

-- Anon: storefront reads only published products
CREATE POLICY "Anon reads published products"
  ON products FOR SELECT TO anon
  USING (published = true);

-- ── P1-C: Stock movements log ────────────────────────────────────────────────
-- Written by create_order_atomic (checkout) and future admin stock adjustments.
-- RLS enabled, no public policies — service_role only.
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT        NOT NULL,
  order_id    TEXT,
  old_stock   INTEGER     NOT NULL,
  new_stock   INTEGER     NOT NULL,
  delta       INTEGER     NOT NULL,
  reason      TEXT        NOT NULL,
  actor_type  TEXT        NOT NULL DEFAULT 'system',
  actor_user_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
-- No public policies — service_role bypasses RLS.

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx
  ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_order_id_idx
  ON stock_movements (order_id)
  WHERE order_id IS NOT NULL;

-- ── P1-C: Atomic checkout RPC ────────────────────────────────────────────────
-- Single DB transaction: idempotency race-check → FOR UPDATE lock per item →
-- stock decrement → stock_movements insert → orders insert.
-- Called by POST /api/orders after slip upload.
-- p_db_items: only items that exist in the products table (DB-backed).
--             Static-catalog-only items are in p_order_data.items but not here.
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order_id       TEXT,
  p_db_items       JSONB,    -- [{product_id, quantity}]
  p_order_data     JSONB,    -- all order fields as serialised JSON
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item        JSONB;
  v_product_id  TEXT;
  v_quantity    INTEGER;
  v_old_stock   INTEGER;
  v_new_stock   INTEGER;
  v_existing_id TEXT;
BEGIN
  -- 1. Race-safe idempotency check (inside transaction).
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing_id
    FROM orders
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('order_id', v_existing_id, 'idempotent', true);
    END IF;
  END IF;

  -- 2. FOR each DB-backed item: lock row, validate stock, decrement, record movement.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_db_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_quantity   := (v_item->>'quantity')::INTEGER;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity::%', v_product_id;
    END IF;

    -- Row-level lock prevents concurrent checkout from reading stale stock.
    SELECT stock_count INTO v_old_stock
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found::%', v_product_id;
    END IF;

    IF v_old_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock::%', v_product_id;
    END IF;

    v_new_stock := v_old_stock - v_quantity;

    UPDATE products
    SET stock_count = v_new_stock,
        in_stock    = (v_new_stock > 0)
    WHERE id = v_product_id;

    INSERT INTO stock_movements
      (product_id, order_id, old_stock, new_stock, delta, reason, actor_type)
    VALUES
      (v_product_id, p_order_id, v_old_stock, v_new_stock, -v_quantity,
       'order_checkout', 'system');
  END LOOP;

  -- 3. Insert the order record.
  INSERT INTO orders (
    id, status,
    recipient_name, recipient_phone, recipient_address,
    shipping_method, shipping_fee, payment_method,
    items, subtotal, cod_fee, total,
    slip_path, idempotency_key, contact_email
  ) VALUES (
    p_order_id, 'pending',
    p_order_data->>'recipient_name',
    p_order_data->>'recipient_phone',
    p_order_data->>'recipient_address',
    p_order_data->>'shipping_method',
    (p_order_data->>'shipping_fee')::INTEGER,
    p_order_data->>'payment_method',
    p_order_data->'items',
    (p_order_data->>'subtotal')::INTEGER,
    (p_order_data->>'cod_fee')::INTEGER,
    (p_order_data->>'total')::INTEGER,
    NULLIF(p_order_data->>'slip_path', ''),
    NULLIF(p_idempotency_key, ''),
    p_order_data->>'contact_email'
  );

  RETURN jsonb_build_object('order_id', p_order_id, 'idempotent', false);
END;
$$;

-- ── P1-D: Admin audit log ────────────────────────────────────────────────────
-- Written server-side only by writeAuditLog() helper (service role).
-- RLS enabled, no public policies.
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_email   TEXT,
  action        TEXT        NOT NULL,
  entity_type   TEXT        NOT NULL,
  entity_id     TEXT,
  before_json   JSONB,
  after_json    JSONB,
  ip_hash       TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- No public policies — service_role only. Admin read via guarded API later.

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
  ON audit_logs (actor_email, created_at DESC);

-- ── Phase 2: Customer messages ───────────────────────────────────────────────
-- Submitted via POST /api/messages (public, no auth).
-- Admin reads via Supabase dashboard or future /api/admin/messages.
CREATE TABLE IF NOT EXISTS messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name  TEXT        NOT NULL,
  sender_email TEXT        NOT NULL,
  sender_phone TEXT,
  subject      TEXT,
  body         TEXT        NOT NULL,
  product_code TEXT,
  status       TEXT        NOT NULL DEFAULT 'new'
               CHECK (status IN ('new','replied','closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- service_role only — customers submit via /api/messages (service role write).

CREATE INDEX IF NOT EXISTS messages_status_idx ON messages (status, created_at DESC);

-- ── Phase 2: Product reviews ──────────────────────────────────────────────────
-- Submitted via POST /api/reviews (public, no auth).
-- published = false until admin approves in Supabase dashboard.
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    TEXT        REFERENCES products(id) ON DELETE CASCADE,
  order_id      TEXT,
  rating        INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  reviewer_name TEXT        NOT NULL,
  comment       TEXT,
  images        JSONB       NOT NULL DEFAULT '[]',
  helpful_count INTEGER     NOT NULL DEFAULT 0,
  published     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon reads published reviews" ON reviews;
CREATE POLICY "Anon reads published reviews"
  ON reviews FOR SELECT TO anon
  USING (published = true);

CREATE INDEX IF NOT EXISTS reviews_product_idx  ON reviews (product_id, published, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_published_idx ON reviews (published, created_at DESC);

-- ── Phase 2: Shop announcements ───────────────────────────────────────────────
-- Admin creates via Supabase dashboard.
-- Public reads published entries.
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th   TEXT        NOT NULL,
  title_en   TEXT,
  body_th    TEXT,
  body_en    TEXT,
  type       TEXT        NOT NULL DEFAULT 'info'
             CHECK (type IN ('info','promo','update','shipping')),
  published  BOOLEAN     NOT NULL DEFAULT true,
  pinned     BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon reads published announcements" ON announcements;
CREATE POLICY "Anon reads published announcements"
  ON announcements FOR SELECT TO anon
  USING (published = true);

CREATE INDEX IF NOT EXISTS announcements_idx ON announcements (published, pinned DESC, created_at DESC);

-- ── Phase 2: Review images storage ───────────────────────────────────────────
-- Public bucket — review photos are visible to all storefront visitors.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images', 'review-images', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read review images" ON storage.objects;
CREATE POLICY "Public read review images" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');

-- ===================================================
-- Phase 3: Customer Account System
-- ===================================================

-- ── profiles (1:1 with auth.users) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  avatar_url   TEXT,
  locale       TEXT        NOT NULL DEFAULT 'th',
  notify_order BOOLEAN     NOT NULL DEFAULT true,
  notify_promo BOOLEAN     NOT NULL DEFAULT true,
  notify_reply BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile"   ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile row when a new auth user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── addresses (address book) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label          TEXT        NOT NULL DEFAULT 'home'
                 CHECK (label IN ('home','work','shop','other')),
  recipient_name TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  address        TEXT        NOT NULL,
  is_default     BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own addresses" ON addresses;
CREATE POLICY "Users manage own addresses"
  ON addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses (user_id, is_default DESC, created_at DESC);

-- ── wishlists (saved products) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlists;
CREATE POLICY "Users manage own wishlist"
  ON wishlists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wishlists_user_idx ON wishlists (user_id, created_at DESC);

-- ── support_tickets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT        NOT NULL,
  topic       TEXT        NOT NULL DEFAULT 'general'
              CHECK (topic IN ('general','order','shipping','product','refund','claim','payment')),
  order_id    TEXT,
  subject     TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  images      JSONB       NOT NULL DEFAULT '[]',
  status      TEXT        NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','answered','closed')),
  rating      INTEGER     CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own tickets" ON support_tickets;
CREATE POLICY "Users read own tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status, created_at DESC);

-- ── Link orders to user account (guest orders keep user_id NULL) ─────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC) WHERE user_id IS NOT NULL;
DROP POLICY IF EXISTS "Users read own orders" ON orders;
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ── Link reviews to user account (for "my reviews") ──────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews (user_id, created_at DESC) WHERE user_id IS NOT NULL;
DROP POLICY IF EXISTS "Users read own reviews" ON reviews;
CREATE POLICY "Users read own reviews"
  ON reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ── Wishlist alert preferences (price-drop / restock) ────────────────────────
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS notify_price_drop BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS notify_restock    BOOLEAN NOT NULL DEFAULT false;

-- ── Message replies (customer ↔ shop thread) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS message_replies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID        NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  author      TEXT        NOT NULL CHECK (author IN ('customer','shop')),
  body        TEXT        NOT NULL,
  images      JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
-- service_role only — customer access via /api/account/messages routes (filtered by email).
CREATE INDEX IF NOT EXISTS message_replies_msg_idx ON message_replies (message_id, created_at);

-- ── Ticket replies (support thread) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_replies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author      TEXT        NOT NULL CHECK (author IN ('customer','shop')),
  body        TEXT        NOT NULL,
  images      JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ticket_replies_ticket_idx ON ticket_replies (ticket_id, created_at);

-- ── Login events (login history) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash     TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own login events" ON login_events;
CREATE POLICY "Users read own login events"
  ON login_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS login_events_user_idx ON login_events (user_id, created_at DESC);

-- ── Tax invoice requests (linked to order) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_invoice_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id    TEXT        NOT NULL,
  tax_id      TEXT        NOT NULL,
  company     TEXT        NOT NULL,
  address     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','issued')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tax_invoice_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own tax requests" ON tax_invoice_requests;
CREATE POLICY "Users read own tax requests"
  ON tax_invoice_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS tax_req_user_idx ON tax_invoice_requests (user_id, created_at DESC);

-- Allow customers to cancel their own pending/paid orders via API (service role enforces rule).

-- ── Avatar storage bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read avatars"     ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ===================================================
-- Environment variables (.env.local / Netlify)
-- ===================================================
-- NEXT_PUBLIC_SUPABASE_URL       = your project URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  = your anon key
-- SUPABASE_SERVICE_ROLE_KEY      = your service role key (server only)
--
-- Phase 3 (Customer Auth):
-- Enable Email + Google providers in Supabase Dashboard → Authentication → Providers
-- Set Redirect URLs incl. http://localhost:3000/auth/callback
