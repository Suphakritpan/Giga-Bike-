// Server-only. Delegates to the custom auth system.
import type { NextResponse } from 'next/server'
import { requireUser as _requireUser } from '@/lib/auth'
import type { CustomUser } from '@/lib/auth'

type Ok = { user: CustomUser; error: null }
type Fail = { user: null; error: NextResponse }

export async function requireUser(): Promise<Ok | Fail> {
  return _requireUser()
}
