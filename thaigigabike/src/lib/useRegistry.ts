'use client'
import { useEffect, useState } from 'react'

export type RegBike = { id: string; brand: string; model: string }
export type RegColor = { id: string; label_th: string; hex: string | null }

/**
 * Client hook: admin-added bike models + colours (the registry), to merge with
 * the built-in presets in storefront filters. Returns empty arrays on failure /
 * before the migration, so callers keep their static list working.
 */
export function useRegistry() {
  const [reg, setReg] = useState<{ bikeModels: RegBike[]; colors: RegColor[] }>({ bikeModels: [], colors: [] })
  useEffect(() => {
    let alive = true
    fetch('/api/registry')
      .then(r => r.json())
      .then((d: { bikeModels?: RegBike[]; colors?: RegColor[] }) => {
        if (alive) setReg({ bikeModels: d.bikeModels ?? [], colors: d.colors ?? [] })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  return reg
}
