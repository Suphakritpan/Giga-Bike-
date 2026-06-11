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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<CustomUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/account/profile')
    if (res.ok) {
      const data = await res.json()
      setProfile((data.profile ?? null) as Profile | null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = res.ok ? await res.json() : null
      if (data?.user) {
        setUser(data.user as CustomUser)
        await loadProfile()
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch { /* network error — keep current state */ }
    setLoading(false)
  }, [loadProfile])

  useEffect(() => { refreshUser() }, [refreshUser])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
