-- ============================================================================
-- ThaiGigaBike — Custom Auth (consolidated, replaces Supabase Auth entirely)
-- ============================================================================
-- Run in Supabase SQL Editor AFTER setup.sql. Idempotent — safe to re-run.
--
-- Consolidates the former custom-auth.sql + phase2 + phase3 + phase4 files
-- (all four were applied to the production DB by 2026-06-12).
--
-- Phase 1: auth tables (users, sessions, attempts, audit)
-- Phase 2: detach account tables from auth.users → public.users
-- Phase 3: email verification
-- Phase 4: hardening from Supabase security advisors
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- Phase 1 — Auth tables
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT         NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  line_id       TEXT,
  role          TEXT         NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','owner')),
  admin_active  BOOLEAN      NOT NULL DEFAULT FALSE,
  status        TEXT         NOT NULL DEFAULT 'active'   CHECK (status IN ('active','banned','pending')),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token_hash TEXT        NOT NULL UNIQUE,  -- SHA-256 of random token; raw token never stored
  expires_at         TIMESTAMPTZ NOT NULL,
  ip_hash            TEXT,                         -- SHA-256 of IP (privacy-safe)
  user_agent         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp   ON public.user_sessions(expires_at);

-- Rate limiting for every abuse-prone endpoint.
-- kind: login | register | reset | verify | password | setup | order |
--       message | review | review_image (extend freely — plain TEXT)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id         BIGSERIAL    PRIMARY KEY,
  email      TEXT         NOT NULL,
  ip_hash    TEXT,
  success    BOOLEAN      NOT NULL DEFAULT FALSE,
  kind       TEXT         NOT NULL DEFAULT 'login',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_email ON public.login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_ip    ON public.login_attempts(ip_hash, created_at);
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'login';

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT         NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  before_data JSONB,
  after_data  JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_logs(action, created_at);

-- RLS on, no policies = service role only
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN DELETE FROM public.user_sessions WHERE expires_at < NOW(); END; $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Phase 2 — Detach account tables from auth.users (Supabase Auth removed)
-- ════════════════════════════════════════════════════════════════════════════

-- Old signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Re-point FKs → public.users. Orphans from old Supabase-Auth users (who
-- can no longer log in) are deleted/detached per each FK's delete rule.

-- profiles (CASCADE)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM public.users);
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- addresses (CASCADE)
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
DELETE FROM addresses WHERE user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE addresses
  ADD CONSTRAINT addresses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- wishlists (CASCADE)
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
DELETE FROM wishlists WHERE user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE wishlists
  ADD CONSTRAINT wishlists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- support_tickets (SET NULL — keep tickets for the shop)
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
UPDATE support_tickets SET user_id = NULL
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- orders.user_id (SET NULL — order history preserved for the shop)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
UPDATE orders SET user_id = NULL
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- reviews.user_id (SET NULL — reviews stay published)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
UPDATE reviews SET user_id = NULL
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- login_events (CASCADE)
ALTER TABLE login_events DROP CONSTRAINT IF EXISTS login_events_user_id_fkey;
DELETE FROM login_events WHERE user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE login_events
  ADD CONSTRAINT login_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- tax_invoice_requests (SET NULL)
ALTER TABLE tax_invoice_requests DROP CONSTRAINT IF EXISTS tax_invoice_requests_user_id_fkey;
UPDATE tax_invoice_requests SET user_id = NULL
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE tax_invoice_requests
  ADD CONSTRAINT tax_invoice_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Drop auth.uid() policies — auth.uid() is always NULL with custom auth.
-- Account tables become service-role only; API routes filter by user_id.
DROP POLICY IF EXISTS "Users read own profile"      ON profiles;
DROP POLICY IF EXISTS "Users update own profile"    ON profiles;
DROP POLICY IF EXISTS "Users manage own addresses"  ON addresses;
DROP POLICY IF EXISTS "Users manage own wishlist"   ON wishlists;
DROP POLICY IF EXISTS "Users read own tickets"      ON support_tickets;
DROP POLICY IF EXISTS "Users read own orders"       ON orders;
DROP POLICY IF EXISTS "Users read own reviews"      ON reviews;
DROP POLICY IF EXISTS "Users read own login events" ON login_events;
DROP POLICY IF EXISTS "Users read own tax requests" ON tax_invoice_requests;
-- Avatar uploads go through /api/account/avatar (service role)
DROP POLICY IF EXISTS "Users upload own avatar"     ON storage.objects;

-- password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,   -- SHA-256; raw token only in email link
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_exp  ON public.password_reset_tokens(expires_at);

-- ════════════════════════════════════════════════════════════════════════════
-- Phase 3 — Email verification
-- ════════════════════════════════════════════════════════════════════════════
-- Gates email-matched guest data (orders/messages/export): without this a
-- user could register with someone else's email and read their guest orders.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_verify_tokens_user ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verify_tokens_exp  ON public.email_verification_tokens(expires_at);

-- ════════════════════════════════════════════════════════════════════════════
-- Phase 4 — Hardening (Supabase security advisors, 2026-06-12)
-- ════════════════════════════════════════════════════════════════════════════
-- Every write goes through the Next.js API (service role, rate-limited,
-- validated). Direct PostgREST access with the anon key must not bypass it.

-- Anon could INSERT orders directly via PostgREST (legacy browser-checkout policy)
DROP POLICY IF EXISTS "orders_write_public" ON public.orders;

-- create_order_atomic was callable by anon via /rest/v1/rpc — strangers could
-- create orders / consume stock while skipping API rate limits and validation
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.create_order_atomic(text, jsonb, jsonb, text) FROM anon, authenticated;
  ALTER FUNCTION public.create_order_atomic(text, jsonb, jsonb, text) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM anon, authenticated;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- Stop public buckets from being LISTED (object URLs keep working)
DROP POLICY IF EXISTS "Public read avatars"        ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read review images"  ON storage.objects;

-- Orphan table from the old Supabase-Auth admin login
DROP TABLE IF EXISTS public.admin_login_attempts;
