import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `GGB-${ts}${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const fd = await request.formData()

    const name    = (fd.get('name')    as string | null)?.trim()
    const phone   = (fd.get('phone')   as string | null)?.trim()
    const address = (fd.get('address') as string | null)?.trim()
    const shippingMethod = fd.get('shippingMethod') as string | null
    const shippingFee    = Number(fd.get('shippingFee') ?? 0)
    const paymentMethod  = fd.get('paymentMethod') as string | null
    const itemsRaw       = fd.get('items') as string | null
    const subtotal       = Number(fd.get('subtotal') ?? 0)
    const codFee         = Number(fd.get('codFee')   ?? 0)
    const total          = Number(fd.get('total')    ?? 0)
    const slip           = fd.get('slip') as File | null

    if (!name || !phone || !address || !shippingMethod || !paymentMethod || !itemsRaw) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let items: unknown[]
    try {
      items = JSON.parse(itemsRaw)
      if (!Array.isArray(items) || items.length === 0) throw new Error()
    } catch {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Slip validation (server-side)
    if (paymentMethod === 'transfer') {
      if (!slip || slip.size === 0) {
        return NextResponse.json({ error: 'Payment slip required' }, { status: 400 })
      }
      if (slip.size > MAX_SIZE) {
        return NextResponse.json({ error: 'Slip file must be under 5 MB' }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(slip.type)) {
        return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP or PDF' }, { status: 400 })
      }
    }

    const orderId = generateOrderId()
    const supabase = createServiceClient()

    // Upload slip to Supabase Storage
    let slipUrl: string | null = null
    if (paymentMethod === 'transfer' && slip) {
      const ext = slip.name.split('.').pop() ?? 'jpg'
      const path = `${orderId}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('order-slips')
        .upload(path, slip, { contentType: slip.type, upsert: false })
      if (uploadErr) {
        console.error('Slip upload:', uploadErr.message)
      } else {
        const { data } = supabase.storage.from('order-slips').getPublicUrl(path)
        slipUrl = data.publicUrl
      }
    }

    // Insert order
    const { error: insertErr } = await supabase.from('orders').insert({
      id: orderId,
      status: 'pending',
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      shipping_method: shippingMethod,
      shipping_fee: shippingFee,
      payment_method: paymentMethod,
      items,
      subtotal,
      cod_fee: codFee,
      total,
      slip_url: slipUrl,
    })

    if (insertErr) {
      console.error('Order insert:', insertErr.message)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    return NextResponse.json({ orderId })
  } catch (err) {
    console.error('Order creation failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
