// Server-only. Import from API routes and Server Components — NOT middleware.
// For middleware, use isAdminEmail directly from @/lib/auth/admin.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'

export type AdminUser = { id: string; email: string }

type Ok = { user: AdminUser; error: null }
type Fail = { user: null; error: NextResponse }

export async function requireAdmin(): Promise<Ok | Fail> {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!user.email || !isAdminEmail(user.email)) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user: { id: user.id, email: user.email }, error: null }
}
