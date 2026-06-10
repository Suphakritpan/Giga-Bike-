import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, cookieName } from '@/lib/session'

export async function POST() {
  const store = cookies()
  const name  = cookieName()
  const token = store.get(name)?.value

  if (token) {
    await deleteSession(token)
  }

  store.delete(name)
  return NextResponse.json({ ok: true })
}
