'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

const LS_KEY = 'gigabike-wishlist'

type WishlistContextType = {
  ids: Set<string>
  isSaved: (productId: string) => boolean
  toggle: (productId: string) => void
  count: number
}

const WishlistContext = createContext<WishlistContextType | null>(null)

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function writeLocal(ids: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)) } catch {}
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())

  // Load wishlist: from DB when logged in, else localStorage.
  // On login, merge any guest localStorage items into the account.
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (user) {
        const local = readLocal()
        // push guest items to server
        for (const pid of local) {
          await fetch('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: pid }) }).catch(() => {})
        }
        if (local.length) writeLocal([])
        const d = await fetch('/api/account/wishlist').then(r => r.json()).catch(() => ({ items: [] }))
        if (!cancelled) setIds(new Set((d.items ?? []).map((i: { product_id: string }) => i.product_id)))
      } else {
        setIds(new Set(readLocal()))
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const toggle = useCallback((productId: string) => {
    setIds(prev => {
      const next = new Set(prev)
      const adding = !next.has(productId)
      if (adding) next.add(productId); else next.delete(productId)

      if (user) {
        if (adding) {
          fetch('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) }).catch(() => {})
        } else {
          fetch(`/api/account/wishlist?product_id=${encodeURIComponent(productId)}`, { method: 'DELETE' }).catch(() => {})
        }
      } else {
        writeLocal([...next])
      }
      return next
    })
  }, [user])

  const isSaved = useCallback((pid: string) => ids.has(pid), [ids])

  return (
    <WishlistContext.Provider value={{ ids, isSaved, toggle, count: ids.size }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
