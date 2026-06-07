// Server-only. Import from API routes and Server Components.
// Returns the authenticated Supabase user, or a 401 NextResponse.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

type Ok = { user: User; error: null }
type Fail = { user: null; error: NextResponse }

export async function requireUser(): Promise<Ok | Fail> {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, error: null }
}
