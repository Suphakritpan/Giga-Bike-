import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { allProducts as STATIC_CATALOG } from '@/data/products'
import { sendOrderConfirmationEmail } from '@/lib/email'

// ── Canonical config — the server is the single source of truth for these. ──
// Never accept shipping fees, COD fees, prices, or totals from the client.

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
const ALLOWED_TYPES = Object.keys(MIME_EXT)
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

/** Server-canonical shipping fees (THB). Client value is ignored. */
const SHIPPING_FEES: Record<string, number> = {
  kerry:  60,
  flash:  80,
  pickup:  0,
}

/** Server-canonical COD surcharge (THB). Client value is ignored. */
const COD_FEES: Record<string, number> = {
  transfer: 0,
  cod:     50,
}

function generateOrderId(): string {
  const ts   = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `GGB-${ts}${rand}`
}

// Shape of each item the client is allowed to send.
// price, name, code, subtotal, shippingFee, total are intentionally absent —
// the server derives them from the database.
type RawItem = { productId: unknown; quantity: unknown; color: unknown }

export async function POST(request: NextRequest) {
  try {
    const fd = await request.formData()

    // ── 1. Parse basic fields ─────────────────────────────────────────────
    const name           = (fd.get('name')           as string | null)?.trim()
    const phone          = (fd.get('phone')          as string | null)?.trim()
    const email          = (fd.get('email')          as string | null)?.trim().toLowerCase()
    const address        = (fd.get('address')        as string | null)?.trim()
    const shippingMethod = (fd.get('shippingMethod') as string | null)?.trim()
    const paymentMethod  = (fd.get('paymentMethod')  as string | null)?.trim()
    const itemsRaw       = fd.get('items') as string | null
    const idempotencyKey = (fd.get('idempotencyKey') as string | null)?.trim() || null
    const slip           = fd.get('slip') as File | null

    if (!name || !phone || !email || !address || !shippingMethod || !paymentMethod || !itemsRaw) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email required for order tracking' },
        { status: 400 }
      )
    }

    // ── 2. Validate shipping method against server-canonical list ─────────
    const shippingFee = SHIPPING_FEES[shippingMethod]
    if (shippingFee === undefined) {
      return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 })
    }

    // ── 3. Validate payment method against server-canonical list ──────────
    const codFee = COD_FEES[paymentMethod]
    if (codFee === undefined) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // ── 4. Parse + validate items (client sends only productId/qty/color) ─
    let rawItems: RawItem[]
    try {
      rawItems = JSON.parse(itemsRaw)
      if (!Array.isArray(rawItems) || rawItems.length === 0) throw new Error()
    } catch {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    for (const item of rawItems) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Invalid item: missing productId' }, { status: 400 })
      }
      const qty = Number(item.quantity)
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 })
      }
    }

    // ── 5. Slip validation (server-side; repeats client-side check) ───────
    if (paymentMethod === 'transfer') {
      if (!slip || slip.size === 0) {
        return NextResponse.json({ error: 'Payment slip required' }, { status: 400 })
      }
      if (slip.size > MAX_SIZE) {
        return NextResponse.json({ error: 'Slip file must be under 5 MB' }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(slip.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Use JPG, PNG, WebP or PDF' },
          { status: 400 }
        )
      }
    }

    const supabase = createServiceClient()

    // ── 6. Idempotency: return existing order if this key was already used ─
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ orderId: (existing as { id: string }).id })
      }
    }

    // ── 7. Fetch product data + recompute prices entirely server-side ─────
    //
    // Lookup order of trust:
    //   1. Supabase products table (real-time price + stock)
    //   2. Static catalog (compiled into server bundle; trusted source; no live stock)
    //
    // The static catalog fallback lets the checkout work even if the Supabase
    // products table has not been seeded yet. However, stock validation is
    // only applied when the DB row is available — document the oversell risk below.
    const productIds = [...new Set(rawItems.map(i => i.productId as string))]

    const { data: dbRows, error: lookupErr } = await supabase
      .from('products')
      .select('id, code, name, name_th, price, in_stock, stock_count, published, images')
      .in('id', productIds)

    if (lookupErr) {
      console.error('Product lookup error')
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 })
    }

    type DbProduct = {
      id: string; code: string; name: string; name_th: string
      price: number; in_stock: boolean; stock_count: number
      published: boolean; images: string[]
    }
    const dbMap = new Map<string, DbProduct>(
      (dbRows ?? []).map((p) => [p.id as string, p as unknown as DbProduct])
    )

    // Build trusted order item snapshots.
    // dbItemsForRpc: DB-backed items only — these are locked + decremented atomically.
    // Static-catalog items are included in orderItems/subtotal but NOT in dbItemsForRpc.
    const orderItems:    object[] = []
    const dbItemsForRpc: { product_id: string; quantity: number }[] = []
    let subtotal = 0
    const notFound:  string[] = []
    const stockErrs: string[] = []

    for (const raw of rawItems) {
      const pid = raw.productId as string
      const qty = Number(raw.quantity)
      const db  = dbMap.get(pid)

      if (db) {
        // DB row found — use real-time data.
        if (!db.published) {
          return NextResponse.json(
            { error: 'A product in your cart is no longer available. Please refresh and try again.' },
            { status: 400 }
          )
        }
        // Early read-only stock check (fast feedback). Authoritative check is in the RPC.
        if (!db.in_stock || db.stock_count < qty) {
          stockErrs.push(db.code || pid)
          continue
        }
        orderItems.push({
          productId: pid,
          code:      db.code      ?? '',
          name:      db.name      ?? '',
          nameTh:    db.name_th   ?? '',
          price:     db.price,
          quantity:  qty,
          color:     String(raw.color ?? ''),
          image:     db.images?.[0] ?? '',
        })
        dbItemsForRpc.push({ product_id: pid, quantity: qty })
        subtotal += db.price * qty
      } else {
        // Fallback: static catalog — trusted (server-side) but no real-time stock.
        // Static catalog items are NOT decremented atomically (no DB row to lock).
        const s = STATIC_CATALOG.find((p) => p.id === pid)
        if (!s) { notFound.push(pid); continue }

        // Best-effort stock check from static catalog (not real-time — oversell possible).
        if (!s.inStock || s.stockCount < qty) {
          stockErrs.push(s.code || pid)
          continue
        }
        orderItems.push({
          productId: pid,
          code:      s.code,
          name:      s.name,
          nameTh:    s.nameTh,
          price:     s.price,
          quantity:  qty,
          color:     String(raw.color ?? ''),
          image:     s.images?.[0] ?? '',
        })
        subtotal += s.price * qty
      }
    }

    if (notFound.length > 0) {
      return NextResponse.json(
        { error: 'Some products could not be found. Please refresh your cart and try again.' },
        { status: 400 }
      )
    }
    if (stockErrs.length > 0) {
      return NextResponse.json(
        { error: `Insufficient stock for: ${stockErrs.join(', ')}` },
        { status: 400 }
      )
    }
    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'No valid items in order' }, { status: 400 })
    }

    // ── 8. Compute final total (100% server-side) ─────────────────────────
    const total = subtotal + shippingFee + codFee

    // ── 9. Generate order ID + upload slip to private bucket ──────────────
    const orderId  = generateOrderId()
    let slipPath: string | null = null

    if (paymentMethod === 'transfer' && slip) {
      const ext  = MIME_EXT[slip.type] ?? 'bin'
      const path = `${orderId}/${randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('order-slips')
        .upload(path, slip, { contentType: slip.type, upsert: false })
      if (uploadErr) {
        console.error('Slip upload failed')
        // Fail the order rather than silently create an unpaid-looking record.
        return NextResponse.json(
          { error: 'Slip upload failed. Please try again.' },
          { status: 500 }
        )
      }
      slipPath = path
    }

    // ── 10. Atomic: idempotency race-check + stock decrement + order insert ──
    // create_order_atomic RPC runs inside a single DB transaction:
    //   - Race-safe idempotency check (SELECT orders WHERE idempotency_key)
    //   - FOR UPDATE lock on each DB-backed product row
    //   - Stock decrement + in_stock flag update
    //   - stock_movements insert per item
    //   - orders INSERT
    // If any item has insufficient stock the whole transaction rolls back.
    const orderData = {
      recipient_name:    name,
      recipient_phone:   phone,
      recipient_address: address,
      shipping_method:   shippingMethod,
      shipping_fee:      shippingFee,
      payment_method:    paymentMethod,
      items:             orderItems,
      subtotal,
      cod_fee:           codFee,
      total,
      slip_path:         slipPath ?? '',
      contact_email:     email,
    }

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
      p_order_id:        orderId,
      p_db_items:        dbItemsForRpc,
      p_order_data:      orderData,
      p_idempotency_key: idempotencyKey ?? '',
    })

    if (rpcErr) {
      const msg = rpcErr.message ?? ''
      if (msg.includes('insufficient_stock')) {
        const code = msg.split('::')[1] ?? 'item'
        return NextResponse.json(
          { error: `Insufficient stock for: ${code}` },
          { status: 400 }
        )
      }
      if (msg.includes('product_not_found')) {
        return NextResponse.json(
          { error: 'A product in your cart is no longer available. Please refresh and try again.' },
          { status: 400 }
        )
      }
      console.error('create_order_atomic failed:', msg)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    const result = rpcResult as { order_id: string; idempotent: boolean } | null
    if (!result?.order_id) {
      console.error('create_order_atomic returned no order_id')
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    // ── Link order to logged-in customer (if any) — enables account order history.
    // Read from the session cookie; never trust a client-sent user_id.
    if (!result.idempotent) {
      try {
        const { data: { user } } = await createClient().auth.getUser()
        if (user) {
          await supabase.from('orders').update({ user_id: user.id }).eq('id', result.order_id)
        }
      } catch { /* guest checkout — no session */ }
    }

    // Send confirmation email only for newly created orders (not idempotent retries).
    if (!result.idempotent) {
      sendOrderConfirmationEmail(email!, {
        orderId: result.order_id,
        recipientName: name!,
        items: orderItems as Parameters<typeof sendOrderConfirmationEmail>[1]['items'],
        subtotal, shippingFee, codFee, total,
        shippingMethod: shippingMethod!,
        paymentMethod: paymentMethod!,
      }).catch(err => console.error('[orders] confirmation email error:', err))
    }

    return NextResponse.json({ orderId: result.order_id })
  } catch {
    console.error('Order creation failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/*
 * ── P1-C: Stock atomicity ─────────────────────────────────────────────────
 *
 * DB-backed items: stock decremented atomically inside create_order_atomic
 * (single Postgres transaction with FOR UPDATE row lock per product).
 * Race condition between concurrent checkouts is eliminated for these items.
 *
 * Static-catalog-only items (product exists in /data/products but not in the
 * Supabase products table): stock is validated read-only from the static
 * snapshot but NOT decremented atomically. Oversell remains possible for
 * these items. Mitigation: seed all products into the DB via build-catalog.mjs.
 */
