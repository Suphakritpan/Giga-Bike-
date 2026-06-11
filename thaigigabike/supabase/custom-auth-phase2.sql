-- Custom auth — Phase 2: detach account tables from auth.users entirely.
-- Run in Supabase SQL Editor AFTER setup.sql and custom-auth.sql.
--
-- What this does:
--   1. Removes the auth.users signup trigger (Supabase Auth is gone).
--   2. Re-points every user FK from auth.users → public.users.
--      Orphan rows belonging to old Supabase-Auth users (who can no longer
--      log in) are deleted or detached, matching each FK's delete rule.
--   3. Drops all auth.uid() RLS policies — auth.uid() is always NULL now.
--      Account tables become service-role only; API routes filter by user_id.
--   4. Adds password_reset_tokens (custom password-reset flow).
--   5. Adds login_attempts.kind so registration can be rate-limited too.

-- ─── 1. Old signup trigger ────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- ─── 2. Re-point FKs to public.users ─────────────────────────────────────────

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

-- ─── 3. Drop auth.uid() policies (always NULL with custom auth) ──────────────
DROP POLICY IF EXISTS "Users read own profile"      ON profiles;
DROP POLICY IF EXISTS "Users update own profile"    ON profiles;
DROP POLICY IF EXISTS "Users manage own addresses"  ON addresses;
DROP POLICY IF EXISTS "Users manage own wishlist"   ON wishlists;
DROP POLICY IF EXISTS "Users read own tickets"      ON support_tickets;
DROP POLICY IF EXISTS "Users read own orders"       ON orders;
DROP POLICY IF EXISTS "Users read own reviews"      ON reviews;
DROP POLICY IF EXISTS "Users read own login events" ON login_events;
DROP POLICY IF EXISTS "Users read own tax requests" ON tax_invoice_requests;
-- Avatar uploads now go through /api/account/avatar (service role).
DROP POLICY IF EXISTS "Users upload own avatar"     ON storage.objects;

-- ─── 4. password_reset_tokens ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,   -- SHA-256 of random token; raw token only in email link
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_exp  ON public.password_reset_tokens(expires_at);

-- ─── 5. login_attempts.kind (login | register | reset) ──────────────────────
ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'login';
