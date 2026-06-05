import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/auth/admin'

const SIGNED_URL_TTL_SECONDS = 600 // 10 minutes

/**
 * POST /api/admin/orders/[orderId]/slip-url
 *
 * Returns a short-lived signed URL for the order's payment slip
 * (stored in the PRIVATE order-slips bucket). Callers must hold
 * a valid Supabase session.
 *
 * Auth (P0-B6): requires valid session + allowlisted admin email.
 * The page that calls this is also behind the /admin middleware guard.
 *
 * Security:
 *  - No client-supplied storage path is accepted; the path comes
 *    exclusively from the database row.
 *  - Signed URL expires in 10 minutes.
 *  - Never returns a permanent public URL.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // Require an active session from an allowlisted admin email.
  const serverClient = createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdminEmail(user.email)) {
    console.warn(`[admin/slip-url] non-allowlisted access attempt (userId: ${user.id})`)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use the service client so RLS does not block the lookup.
  const supabase = createServiceClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('slip_path, slip_url')
    .eq('id', params.orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Resolve the private storage object path:
  //   - New orders  → slip_path is set directly.
  //   - Legacy orders → derive from the old public slip_url so admins
  //     can still view slips uploaded before this migration.
  let storagePath: string | null = (order.slip_path as string | null) ?? null

  if (!storagePath && order.slip_url) {
    // Public URL pattern: .../storage/v1/object/public/order-slips/<path>
    const match = (order.slip_url as string).match(
      /\/storage\/v1\/object\/public\/order-slips\/(.+)$/
    )
    if (match) storagePath = decodeURIComponent(match[1])
  }

  if (!storagePath) {
    return NextResponse.json(
      { error: 'No slip found for this order' },
      { status: 404 }
    )
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('order-slips')
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: 'Failed to generate slip URL' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  })
}
