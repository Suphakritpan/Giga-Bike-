import { createHash, randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendVerifyEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 h

/**
 * Issue a fresh email-verification token and send the link.
 * Best-effort: never throws (register/change-email must not fail because
 * the email provider is down or the phase3 migration is not applied yet).
 */
export async function issueVerificationEmail(userId: string, email: string): Promise<void> {
  try {
    const db = createServiceClient()
    await db.from('email_verification_tokens')
      .delete().eq('user_id', userId).is('used_at', null)

    const token = randomBytes(32).toString('hex')
    const { error } = await db.from('email_verification_tokens').insert({
      user_id:    userId,
      token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    })
    if (error) return // table missing (migration pending) — skip silently

    await sendVerifyEmail(email, `${SITE_URL}/api/auth/verify-email?token=${token}`)
  } catch { /* best-effort */ }
}
