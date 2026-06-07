'use client'
import { useEffect, useState, useCallback } from 'react'

const KEY_PRODUCTS = 'gigabike-recently-viewed'
const KEY_SEARCHES = 'gigabike-recent-searches'
const KEY_BIKES    = 'gigabike-recent-bikes'
const KEY_CATS     = 'gigabike-recent-cats'
const MAX = 12

function read(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function push(key: string, value: string, max = MAX) {
  try {
    const list = read(key).filter(v => v !== value)
    list.unshift(value)
    localStorage.setItem(key, JSON.stringify(list.slice(0, max)))
  } catch {}
}

// ── recorders (call from pages) ──
export const recordView   = (productId: string) => push(KEY_PRODUCTS, productId)
export const recordSearch = (term: string)      => { if (term.trim()) push(KEY_SEARCHES, term.trim(), 8) }
export const recordBike   = (bikeId: string)    => push(KEY_BIKES, bikeId, 8)
export const recordCat    = (catId: string)     => push(KEY_CATS, catId, 8)

export function clearAllHistory() {
  [KEY_PRODUCTS, KEY_SEARCHES, KEY_BIKES, KEY_CATS].forEach(k => { try { localStorage.removeItem(k) } catch {} })
}

export function useHistory() {
  const [data, setData] = useState<{ products: string[]; searches: string[]; bikes: string[]; cats: string[] }>({
    products: [], searches: [], bikes: [], cats: [],
  })
  const refresh = useCallback(() => {
    setData({ products: read(KEY_PRODUCTS), searches: read(KEY_SEARCHES), bikes: read(KEY_BIKES), cats: read(KEY_CATS) })
  }, [])
  useEffect(() => { refresh() }, [refresh])
  const clear = useCallback(() => { clearAllHistory(); refresh() }, [refresh])
  return { ...data, clear }
}

// Back-compat
export function useRecentlyViewed(): { ids: string[]; clear: () => void } {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => { setIds(read(KEY_PRODUCTS)) }, [])
  const clear = useCallback(() => { try { localStorage.removeItem(KEY_PRODUCTS) } catch {}; setIds([]) }, [])
  return { ids, clear }
}
