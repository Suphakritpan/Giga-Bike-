import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/registry — public: admin-added bike models + colours (on top of the
// built-in presets). Returns empty arrays gracefully if the tables don't exist.
export async function GET() {
  const db = createClient()
  const [bm, cl] = await Promise.all([
    db.from('bike_models').select('id, brand, model').order('brand').order('model'),
    db.from('colors').select('id, label_th, hex').order('label_th'),
  ])
  return NextResponse.json(
    { bikeModels: bm.data ?? [], colors: cl.data ?? [] },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  )
}
