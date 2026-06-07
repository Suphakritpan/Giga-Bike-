import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNextPath } from '@/lib/safe-next'

// OAuth + email-confirmation callback. Exchanges the code for a session,
// then redirects to ?next (default /account).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  // Validated to an internal path — never trust ?next= for redirects (open-redirect guard).
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Record login event (best-effort)
      if (data.user) {
        const { createServiceClient } = await import('@/lib/supabase/service')
        const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip')
        const { createHash } = await import('node:crypto')
        await createServiceClient().from('login_events').insert({
          user_id: data.user.id,
          ip_hash: ipRaw ? createHash('sha256').update(ipRaw).digest('hex').slice(0, 16) : null,
          user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
        }).then(() => {}, () => {})
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  // Failure → back to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
