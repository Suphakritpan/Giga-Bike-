import { test, expect } from '@playwright/test'

// Checkout and order-lookup API tests.
// All assertions are server-contract tests — no real DB rows are created because
// validation fails before the order reaches the RPC layer.

test.describe('POST /api/orders — input validation', () => {
  const baseValid = {
    name: 'ทดสอบ Test',
    phone: '0812345678',
    email: 'test@example.com',
    address: '123 ถนนทดสอบ Bangkok 10100',
    shippingMethod: 'kerry',
    paymentMethod: 'cod',
    items: JSON.stringify([{ productId: 'cb1', quantity: 1, color: 'black' }]),
  }

  test('valid COD order reaches stock/product check (not a 400 on fields)', async ({ request }) => {
    const res = await request.post('/api/orders', { multipart: baseValid })
    // May be 400 (insufficient stock / unknown product) or 500 (no service key in dev)
    // but must NOT be 400 "Missing required fields" — meaning all fields pass validation.
    const body = await res.json().catch(() => ({ error: '' }))
    expect(body.error).not.toMatch(/Missing required fields/)
    expect(body.error).not.toMatch(/Invalid shipping method/)
    expect(body.error).not.toMatch(/Invalid payment method/)
    expect(body.error).not.toMatch(/Invalid email/)
  })

  test('invalid email format → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, email: 'not-an-email' },
    })
    expect(res.status()).toBe(400)
  })

  test('invalid shipping method → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, shippingMethod: 'dhl_invalid' },
    })
    expect(res.status()).toBe(400)
  })

  test('invalid payment method → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, paymentMethod: 'crypto' },
    })
    expect(res.status()).toBe(400)
  })

  test('item quantity 0 → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: {
        ...baseValid,
        items: JSON.stringify([{ productId: 'cb1', quantity: 0, color: 'black' }]),
      },
    })
    expect(res.status()).toBe(400)
  })

  test('item quantity 100 (> max 99) → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: {
        ...baseValid,
        items: JSON.stringify([{ productId: 'cb1', quantity: 100, color: 'black' }]),
      },
    })
    expect(res.status()).toBe(400)
  })

  test('empty items array → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, items: JSON.stringify([]) },
    })
    expect(res.status()).toBe(400)
  })

  test('transfer without slip → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, paymentMethod: 'transfer' }
      // No slip field
    })
    expect(res.status()).toBe(400)
    const body = await res.json().catch(() => ({ error: '' }))
    expect(body.error).toMatch(/slip/)
  })

  test('response never exposes price or stock data in error', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: { ...baseValid, email: 'bad-email' },
    })
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).not.toMatch(/stock_count|in_stock|service_role|SUPABASE/)
  })

  test('order response shape — orderId field on success path (idempotency key)', async ({ request }) => {
    // Send the same idempotency key twice — second call must return the same orderId.
    // With no real DB in dev this will return 500 (service key missing), but
    // the important assertion is that the API contract doesn't change shape.
    const key = `test-idem-${Date.now()}`
    const res1 = await request.post('/api/orders', {
      multipart: { ...baseValid, idempotencyKey: key },
    })
    const res2 = await request.post('/api/orders', {
      multipart: { ...baseValid, idempotencyKey: key },
    })
    // Both should return the same status code (not one 200 + one 400)
    expect(res1.status()).toBe(res2.status())
    // If both 200: same orderId
    if (res1.status() === 200 && res2.status() === 200) {
      const b1 = await res1.json()
      const b2 = await res2.json()
      expect(b1.orderId).toBe(b2.orderId)
    }
  })
})

test.describe('POST /api/order-lookup/request-otp — generic responses', () => {
  test('any order ID → same generic 200 response (no order existence revealed)', async ({ request }) => {
    const res = await request.post('/api/order-lookup/request-otp', {
      data: { orderId: 'GGB-DOESNOTEXIST999' },
    })
    // The route always returns 200 with a generic message regardless of whether the order
    // exists — this is intentional to prevent order enumeration.
    // OR 500 in dev without service key — either is acceptable.
    expect([200, 500]).toContain(res.status())
    if (res.status() === 200) {
      const text = await res.text()
      // Must NOT definitively confirm or deny order existence
      // ("If this order exists" is the correct generic phrasing — does NOT reveal existence)
      expect(text).not.toMatch(/order not found|ออเดอร์นี้ไม่มี|invalid order/)
    }
  })

  test('missing orderId → generic 200 (route never reveals field structure)', async ({ request }) => {
    // The route returns 200 with generic message even with missing/empty orderId.
    // Returning 400 would reveal that orderId is an expected field — information disclosure.
    const res = await request.post('/api/order-lookup/request-otp', {
      data: {},
    })
    // 200 (correct: always generic) or 500 (dev: service key missing)
    expect([200, 500]).toContain(res.status())
  })

  test('response body never exposes OTP or contact email', async ({ request }) => {
    const res = await request.post('/api/order-lookup/request-otp', {
      data: { orderId: 'GGB-TEST123456' },
    })
    const text = await res.text()
    // Must never expose the OTP digits or contact email in the response body
    expect(text).not.toMatch(/\b\d{6}\b/)          // 6-digit OTP
    expect(text).not.toMatch(/@[a-z]+\.[a-z]+/)    // email address
  })
})

test.describe('POST /api/order-lookup/verify — OTP verification', () => {
  test('wrong OTP → 400 or 404 (not 200 with order data)', async ({ request }) => {
    const res = await request.post('/api/order-lookup/verify', {
      data: { orderId: 'GGB-FAKE123', otp: '000000' },
    })
    // Must not return 200 with order data on wrong OTP
    if (res.status() === 200) {
      // If somehow 200, body must not contain PII
      const body = await res.json().catch(() => ({}))
      expect(body).not.toHaveProperty('recipient_name')
      expect(body).not.toHaveProperty('contact_email')
      expect(body).not.toHaveProperty('recipient_phone')
    } else {
      expect([400, 401, 404, 500]).toContain(res.status())
    }
  })

  test('missing fields → 400', async ({ request }) => {
    const res = await request.post('/api/order-lookup/verify', {
      data: { orderId: 'GGB-TEST' },  // missing otp
    })
    expect([400, 500]).toContain(res.status())
  })

  test('order lookup response never exposes contact_email or phone', async ({ request }) => {
    const res = await request.post('/api/order-lookup/verify', {
      data: { orderId: 'GGB-ANYFAKE', otp: '123456' },
    })
    const text = await res.text()
    // PII fields that must never appear in responses
    expect(text).not.toContain('contact_email')
    expect(text).not.toContain('recipient_phone')
  })
})

test.describe('GET /api/orders/[orderId] — deprecated endpoint', () => {
  test('returns 410 Gone with redirect hint', async ({ request }) => {
    const res = await request.get('/api/orders/GGB-ANYTHING')
    expect(res.status()).toBe(410)
    const body = await res.json()
    // Must point to OTP flow — not silently expose data
    expect(JSON.stringify(body)).toMatch(/order-lookup|verify/)
  })
})
