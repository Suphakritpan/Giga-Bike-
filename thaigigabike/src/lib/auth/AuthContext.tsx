'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { CustomUser } from '@/types/user'

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  locale: string
  notify_order: boolean
  notify_promo: boolean
  notify_reply: boolean
  created_at: string
}

type AuthContextType = {
  user: CustomUser | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<CustomUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/account/profile')
    if (res.ok) setProfile((await res.json()) as Profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user as CustomUser)
          loadProfile()
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
