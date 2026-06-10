// Server-only. Delegates to the custom auth system.
import { NextResponse } from 'next/server'
import { requireAdmin as _requireAdmin } from '@/lib/auth'

export type AdminUser = { id: string; email: string }

type Ok = { user: AdminUser; error: null }
type Fail = { user: null; error: NextResponse }

export async function requireAdmin(): Promise<Ok | Fail> {
  const result = await _requireAdmin()
  if (result.error) return { user: null, error: result.error }
  return { user: { id: result.user.id, email: result.user.email }, error: null }
}
