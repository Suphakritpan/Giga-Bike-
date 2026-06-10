import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = process.env.CUSTOM_AUTH_SESSION_COOKIE || 'tgb_session'

export function middleware(request: NextRequest) {
  const path       = request.nextUrl.pathname
  const hasSession = request.cookies.has(SESSION_COOKIE)

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
  matcher: ['/admin/:path*', '/account/:path*', '/login', '/signup'],
}
