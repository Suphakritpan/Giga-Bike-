import { test, expect } from '@playwright/test'

// Primary security assertion: admin endpoints must never return 2xx to unauthenticated callers.
// We accept 401 (correct) or 5xx (server-side misconfiguration/error) — neither leaks data.
// Tests run against the dev server configured in playwright.config.ts.

const notExposed = (status: number) => status < 200 || status >= 400

test.describe('Health check', () => {
  test('GET /api/health → 200 "ok"', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    expect(await res.text()).toBe('ok')
  })
})

test.describe('Admin API — unauthenticated access blocked', () => {
  test('GET /api/admin/products → no 2xx without session', async ({ request }) => {
    const res = await request.get('/api/admin/products')
    expect(notExposed(res.status())).toBeTruthy()
    // Body must not contain a products array
    const body = await res.json().catch(() => ({}))
    expect(body).not.toHaveProperty('products')
  })

  test('POST /api/admin/products → no 2xx without session', async ({ request }) => {
    const res = await request.post('/api/admin/products', {
      data: { code: 'TEST', name: 'Test Product' },
    })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('DELETE /api/admin/products/p123 → no 2xx without session', async ({ request }) => {
    const res = await request.delete('/api/admin/products/p123')
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('PATCH /api/admin/products/p123/stock → no 2xx without session', async ({ request }) => {
    const res = await request.patch('/api/admin/products/p123/stock', {
      data: { stock_count: 10, in_stock: true },
    })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('GET /api/admin/orders → no 2xx without session', async ({ request }) => {
    const res = await request.get('/api/admin/orders')
    expect(notExposed(res.status())).toBeTruthy()
    const body = await res.json().catch(() => ({}))
    expect(body).not.toHaveProperty('orders')
  })

  test('PATCH /api/admin/orders/GGB-TEST → no 2xx without session', async ({ request }) => {
    const res = await request.patch('/api/admin/orders/GGB-TEST', {
      data: { status: 'paid' },
    })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('POST /api/admin/product-images/upload → no 2xx without session', async ({ request }) => {
    const res = await request.post('/api/admin/product-images/upload', {
      multipart: {
        productId: 'test',
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake'),
        },
      },
    })
    expect(notExposed(res.status())).toBeTruthy()
    const body = await res.json().catch(() => ({}))
    // Must not expose a URL
    expect(body).not.toHaveProperty('url')
  })

  test('DELETE /api/admin/product-images/delete → no 2xx without session', async ({ request }) => {
    const res = await request.delete('/api/admin/product-images/delete', {
      data: { path: 'products/test/image.jpg' },
    })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('POST /api/admin/orders/GGB-TEST/slip-url → no 2xx without session', async ({ request }) => {
    const res = await request.post('/api/admin/orders/GGB-TEST/slip-url')
    expect(notExposed(res.status())).toBeTruthy()
    const body = await res.json().catch(() => ({}))
    // Must not expose a signed slip URL
    expect(body).not.toHaveProperty('signedUrl')
  })
})

test.describe('Admin login API — input validation', () => {
  test('POST /api/admin/auth/login — empty body → non-2xx', async ({ request }) => {
    const res = await request.post('/api/admin/auth/login', { data: {} })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('POST /api/admin/auth/login — wrong credentials → generic Thai message', async ({ request }) => {
    const res = await request.post('/api/admin/auth/login', {
      data: { email: 'fake@example.com', password: 'wrongpassword' },
    })
    // 401 correct, 429 rate-limited, 500 if Supabase unavailable — all non-2xx
    expect(notExposed(res.status())).toBeTruthy()

    const body = await res.json().catch(() => ({ error: '' }))
    // If Supabase responded, must show generic Thai error (no username enumeration)
    if (res.status() === 401 || res.status() === 429) {
      expect(body.error).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
    // Must never expose whether email exists or is allowlisted
    expect(JSON.stringify(body)).not.toMatch(/allowlist|ADMIN_EMAILS|allowlisted/)
  })

  test('POST /api/admin/auth/login — response must not contain tokens', async ({ request }) => {
    const res = await request.post('/api/admin/auth/login', {
      data: { email: 'fake@example.com', password: 'wrongpassword' },
    })
    const body = await res.json().catch(() => ({}))
    // Must never return auth tokens on failure
    expect(body).not.toHaveProperty('access_token')
    expect(body).not.toHaveProperty('refresh_token')
    expect(body).not.toHaveProperty('session')
  })
})

test.describe('Deprecated endpoint behaviour', () => {
  test('GET /api/orders/[id] → 4xx/5xx, no order data exposed', async ({ request }) => {
    const res = await request.get('/api/orders/GGB-ANYTHINGHERE')
    // Must not return 200 with order data
    const body = await res.json().catch(() => ({}))
    expect(body).not.toHaveProperty('items')
    expect(body).not.toHaveProperty('recipient_name')
    expect(body).not.toHaveProperty('contact_email')
    // Latest code returns 410; older server might return 404/500 — all acceptable
    expect([404, 410, 500]).toContain(res.status())
  })
})

test.describe('Order creation API — input validation', () => {
  test('POST /api/orders — missing required fields → non-2xx', async ({ request }) => {
    // Send multipart with only partial data (missing name, address, items etc.)
    const res = await request.post('/api/orders', {
      multipart: {
        // Missing: name, address, items, shippingMethod, paymentMethod, email
        phone: '0812345678',
      },
    })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('POST /api/orders — invalid shipping method → 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      multipart: {
        name: 'Test',
        phone: '0812345678',
        email: 'test@test.com',
        address: '123 Test St',
        shippingMethod: 'invalid_carrier',
        paymentMethod: 'cod',
        items: JSON.stringify([{ productId: 'cb1', quantity: 1, color: 'black' }]),
      },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Product image delete — path safety', () => {
  test('DELETE with path traversal attempt → no 2xx (auth blocks before validation)', async ({ request }) => {
    const res = await request.delete('/api/admin/product-images/delete', {
      data: { path: '../../etc/passwd' },
    })
    // Auth (401) fires before path validation — either is correct
    expect(notExposed(res.status())).toBeTruthy()
    const body = await res.json().catch(() => ({}))
    // Must not expose file system contents
    expect(body).not.toHaveProperty('content')
    expect(body).not.toHaveProperty('data')
  })
})
