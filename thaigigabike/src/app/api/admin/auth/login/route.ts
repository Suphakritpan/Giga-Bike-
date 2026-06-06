import { createServerClient } from '@supabase/ssr'
import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/auth/admin'
import { writeAuditLog } from '@/lib/audit'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000  // 15 minutes

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* invalid JSON */ }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 400 })
  }

  const rawIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const ipHash = hashIp(rawIp)
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  // ── Rate limit (Supabase table; skipped in dev if service key not set) ──────
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null

  if (svc) {
    const { count } = await svc
      .from('admin_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('ip_hash', ipHash)
      .eq('success', false)
      .gte('created_at', windowStart)

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      await svc.from('admin_login_attempts').insert({ email, ip_hash: ipHash, success: false })
      console.warn(`[admin/login] rate-limited login attempt for ip_hash=${ipHash}`)
      // Generic error: do not reveal the account is blocked
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 429 })
    }
  }

  // ── SSR auth client: sets session cookies on success ─────────────────────────
  const cookiesToSet: Parameters<NextResponse['cookies']['set']>[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(list) {
          list.forEach(c => cookiesToSet.push([c.name, c.value, c.options]))
        },
      },
    }
  )

  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    if (svc) await svc.from('admin_login_attempts').insert({ email, ip_hash: ipHash, success: false })
    await writeAuditLog({ actor_email: email, action: 'admin.login.failure', entity_type: 'admin_session', ip_hash: ipHash, user_agent: userAgent })
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  // ── Allowlist check ───────────────────────────────────────────────────────────
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut()
    if (svc) await svc.from('admin_login_attempts').insert({ email, ip_hash: ipHash, success: false })
    console.warn(`[admin/login] non-allowlisted login attempt (userId: ${data.user.id})`)
    await writeAuditLog({ actor_email: email, actor_user_id: data.user.id || null, action: 'admin.login.non_allowlisted', entity_type: 'admin_session', ip_hash: ipHash, user_agent: userAgent })
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (svc) await svc.from('admin_login_attempts').insert({ email, ip_hash: ipHash, success: true })
  await writeAuditLog({ actor_email: email, actor_user_id: data.user.id || null, action: 'admin.login.success', entity_type: 'admin_session', ip_hash: ipHash, user_agent: userAgent })

  const response = NextResponse.json({ ok: true })
  cookiesToSet.forEach(args => response.cookies.set(...args))
  return response
}
