import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/password'
import { createSession, cookieName } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email    = (body.email    || '').trim().toLowerCase()
  const password = (body.password || '')
  const fullName = (body.full_name || body.fullName || '').trim() || null

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const password_hash = await hashPassword(password)

  const { data: newUser, error: insertError } = await db
    .from('users')
    .insert({ email, password_hash, full_name: fullName, role: 'customer', status: 'active', admin_active: false })
    .select('id, email, full_name')
    .single()

  if (insertError || !newUser) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }

  const { token, expiresAt } = await createSession(newUser.id as string)

  cookies().set(cookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    expires:  expiresAt,
  })

  return NextResponse.json(
    { user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name } },
    { status: 201 }
  )
}
