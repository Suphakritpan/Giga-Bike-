import { NextResponse } from 'next/server'
import { getSessionUser, getTokenFromCookie } from '@/lib/session'
import type { CustomUser } from '@/types/user'

export type { CustomUser }

type Ok<T> = { user: T; error: null }
type Fail  = { user: null; error: NextResponse }

export async function getCurrentUser(): Promise<CustomUser | null> {
  const token = getTokenFromCookie()
  if (!token) return null
  const user = await getSessionUser(token)
  if (!user || user.status !== 'active') return null
  return user
}

export async function requireUser(): Promise<Ok<CustomUser> | Fail> {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, error: null }
}

export async function requireAdmin(): Promise<Ok<CustomUser> | Fail> {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if ((user.role !== 'admin' && user.role !== 'owner') || !user.admin_active) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function requireOwner(): Promise<Ok<CustomUser> | Fail> {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (user.role !== 'owner' || !user.admin_active) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}
