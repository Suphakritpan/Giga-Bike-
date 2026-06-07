import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/auth/admin'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

export async function middleware(request: NextRequest) {
  // Skip auth when Supabase is not yet configured (local dev)
  if (!SUPABASE_CONFIGURED) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith('/admin')
  const isLoginPage = path === '/admin/login'

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
    if (!isAdminEmail(user.email)) {
      console.warn(`[admin] blocked non-allowlisted access (userId: ${user.id})`)
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.search = '?error=unauthorized'
      return NextResponse.redirect(loginUrl)
    }
  }

  // Only redirect away from login if user is a confirmed admin.
  // Non-admin authenticated users stay on the login page (no redirect loop).
  if (isLoginPage && user && isAdminEmail(user.email)) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = '/admin'
    return NextResponse.redirect(adminUrl)
  }

  // ── Customer account routes — require any authenticated user ──
  if (path.startsWith('/account')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = `?next=${encodeURIComponent(path)}`
      return NextResponse.redirect(loginUrl)
    }
  }

  // Logged-in user visiting /login or /signup → bounce to account
  if ((path === '/login' || path === '/signup') && user) {
    const acctUrl = request.nextUrl.clone()
    acctUrl.pathname = '/account'
    acctUrl.search = ''
    return NextResponse.redirect(acctUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login', '/signup'],
}
