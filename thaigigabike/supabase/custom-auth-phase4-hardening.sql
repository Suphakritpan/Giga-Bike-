-- Phase 4 — DB hardening (from Supabase security advisors, 2026-06-12)
-- Run in Supabase SQL Editor AFTER phase3.
--
-- Context: every write now goes through the Next.js API (service role,
-- rate-limited, validated). Direct PostgREST access with the anon key
-- must not be able to bypass that layer.

-- ─── 1. Anyone could INSERT into orders directly via PostgREST ──────────────
-- Legacy policy from the era when checkout inserted straight from the
-- browser. The API uses service role now — drop it.
DROP POLICY IF EXISTS "orders_write_public" ON public.orders;

-- ─── 2. create_order_atomic was callable by anon via /rest/v1/rpc ───────────
-- SECURITY DEFINER + anon EXECUTE = strangers could create orders and
-- consume stock while skipping the API's rate limit and validation.
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(text, jsonb, jsonb, text) FROM anon, authenticated;

-- Same for internal helpers — nothing client-side should call these.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM anon, authenticated;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ─── 3. Pin search_path on functions (advisor 0011) ─────────────────────────
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public;
ALTER FUNCTION public.create_order_atomic(text, jsonb, jsonb, text) SET search_path = public;

-- ─── 4. Stop public buckets from being LISTED (advisor 0025) ────────────────
-- Object URLs keep working on public buckets without a SELECT policy;
-- the policy only enabled listing every file in the bucket.
DROP POLICY IF EXISTS "Public read avatars"        ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read review images"  ON storage.objects;

-- ─── 5. Drop the orphan table from the old Supabase-Auth admin login ────────
DROP TABLE IF EXISTS public.admin_login_attempts;
