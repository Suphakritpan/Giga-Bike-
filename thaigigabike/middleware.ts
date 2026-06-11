import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = process.env.CUSTOM_AUTH_SESSION_COOKIE || 'tgb_session'

// Hosts allowed to send state-changing /api requests (CSRF guard).
function allowedOrigin(origin: string, requestHost: string): boolean {
  try {
    const host = new URL(origin).host
    if (host === requestHost) return true
    const site = process.env.NEXT_PUBLIC_SITE_URL
    if (site && host === new URL(site).host) return true
    return false
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const path       = request.nextUrl.pathname
  const hasSession = request.cookies.has(SESSION_COOKIE)

  // ── CSRF guard: cross-origin writes to /api/* are rejected. Cookies are
  // sameSite=lax already; this adds Origin enforcement as a second layer.
  // Same-origin requests always pass (browsers send a matching Origin on
  // cross-site fetches; requests without an Origin header are non-browser
  // clients like curl, which carry no ambient cookies to abuse).
  if (path.startsWith('/api/')) {
    const method = request.method.toUpperCase()
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const origin = request.headers.get('origin')
      if (origin && !allowedOrigin(origin, request.nextUrl.host)) {
        return NextResponse.json(
          { error: 'Cross-origin request blocked', code: 'FORBIDDEN' },
          { status: 403 },
        )
      }
    }
    return NextResponse.next()
  }

  // /admin/* — cookie presence check; server layout does the real DB check
  if (path.startsWith('/admin')) {
    if (!hasSession) {
      const url      = request.nextUrl.clone()
      url.pathname   = '/login'
      url.search     = `?next=${encodeURIComponent(path)}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // /account/* — require session
  if (path.startsWith('/account')) {
    if (!hasSession) {
      const url      = request.nextUrl.clone()
      url.pathname   = '/login'
      url.search     = `?next=${encodeURIComponent(path)}`
      return NextResponse.redirect(url)
    }
  }

  // /login or /signup — redirect to /account if already logged in
  if ((path === '/login' || path === '/signup') && hasSession) {
    const url    = request.nextUrl.clone()
    url.pathname = '/account'
    url.search   = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login', '/signup', '/api/:path*'],
}
