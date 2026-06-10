-- Custom authentication tables — run in Supabase SQL Editor AFTER setup.sql
-- Replaces Supabase Auth (auth.users). No auth.users dependency.

-- ─── users ───────────────────────────────────────────────────────────────────
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

-- ─── user_sessions ───────────────────────────────────────────────────────────
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

-- ─── login_attempts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id         BIGSERIAL    PRIMARY KEY,
  email      TEXT         NOT NULL,
  ip_hash    TEXT,
  success    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_email ON public.login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_ip    ON public.login_attempts(ip_hash, created_at);

-- ─── admin_audit_logs ────────────────────────────────────────────────────────
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

-- ─── RLS — all access via service role only ──────────────────────────────────
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── cleanup helper (call via pg_cron or on login) ───────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN DELETE FROM public.user_sessions WHERE expires_at < NOW(); END; $$;
