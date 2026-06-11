-- Custom auth — Phase 3: email verification.
-- Run AFTER custom-auth-phase2.sql.
--
-- Why: registration has no email confirmation, but account features merge
-- guest data by email (orders, messages, export). Without verification a
-- user could register with someone else's email and read that person's
-- guest order history. Email-matched merging is now gated on
-- users.email_verified_at (enforced in the API routes).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,   -- SHA-256; raw token only in the email link
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_verify_tokens_user ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verify_tokens_exp  ON public.email_verification_tokens(expires_at);
