import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

/**
 * Local test runs all share one rate-limit identity: requests to localhost
 * have no x-forwarded-for, so every attempt is recorded under
 * sha256('unknown'). Repeated suite runs then trip the DB-backed limits
 * (orders 10/h, register 5/h, ...) and turn expected 400s into flaky 429s.
 *
 * This purges ONLY the 'unknown'-IP rows — production traffic always carries a
 * real IP via Netlify, so live rate-limit state is never touched.
 */
export async function resetLocalRateLimits(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return // not configured — guarded suites skip anyway

  const db = createClient(url, key)
  const unknownHash = createHash('sha256').update('unknown').digest('hex')
  await db.from('login_attempts').delete().eq('ip_hash', unknownHash)
}
