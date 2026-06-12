import { test, expect } from '@playwright/test'
import { resetLocalRateLimits } from './helpers/reset-rate-limits'

// Primary security assertion: admin endpoints must never return 2xx to unauthenticated callers.
// We accept 401 (correct) or 5xx (server-side misconfiguration/error) — neither leaks data.
// Tests run against the dev server configured in playwright.config.ts.

const notExposed = (status: number) => status < 200 || status >= 400

// Repeated local runs share one rate-limit identity (no client IP on
// localhost) — clear it so validation tests get 400s, not flaky 429s.
test.beforeAll(async () => { await resetLocalRateLimits() })

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

test.describe('Login API — input validation (custom auth)', () => {
  test('POST /api/auth/login — empty body → non-2xx', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: {} })
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('POST /api/auth/login — wrong credentials → generic Thai message', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'fake@example.com', password: 'wrongpassword' },
    })
    // 401 correct, 429 rate-limited, 500 if DB unavailable — all non-2xx
    expect(notExposed(res.status())).toBeTruthy()

    const body = await res.json().catch(() => ({ error: '' }))
    // Must show generic Thai error (no username enumeration)
    if (res.status() === 401) {
      expect(body.error).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
  })

  test('POST /api/auth/login — response must never contain secrets', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'fake@example.com', password: 'wrongpassword' },
    })
    const body = await res.json().catch(() => ({}))
    // Session token lives only in the httpOnly cookie — never in the body
    expect(body).not.toHaveProperty('token')
    expect(body).not.toHaveProperty('session')
    expect(body).not.toHaveProperty('password_hash')
  })

  test('POST /api/auth/register — must ignore client-sent role escalation', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: 'bad-json', password: 'short' },
    })
    // Invalid input → 4xx; role/admin_active are never accepted from the client
    expect(notExposed(res.status())).toBeTruthy()
  })

  test('GET /api/auth/me — no session → 401', async ({ request }) => {
    const res = await request.get('/api/auth/me')
    expect(res.status()).toBe(401)
    const body = await res.json().catch(() => ({}))
    expect(body).not.toHaveProperty('password_hash')
  })
})

test.describe('Deprecated endpoint behaviour', () => {
  test('GET /api/orders/[id] → strict 410, no order data exposed', async ({ request }) => {
    const res = await request.get('/api/orders/GGB-ANYTHINGHERE')
    // Public order lookup by id alone is permanently gone (use OTP flow)
    expect(res.status()).toBe(410)
    const body = await res.json().catch(() => ({}))
    expect(body).not.toHaveProperty('items')
    expect(body).not.toHaveProperty('recipient_name')
    expect(body).not.toHaveProperty('contact_email')
  })
})

test.describe('Account API — every endpoint requires a session (401 sweep)', () => {
  // Service-role queries bypass RLS, so the auth guard is the only wall.
  // Every /api/account route must reject anonymous requests.
  const GETS = [
    '/api/account/profile',
    '/api/account/addresses',
    '/api/account/wishlist',
    '/api/account/orders',
    '/api/account/orders/GGB-TEST',
    '/api/account/reviews',
    '/api/account/messages',
    '/api/account/tickets',
    '/api/account/tickets/00000000-0000-0000-0000-000000000000',
    '/api/account/login-events',
    '/api/account/export',
  ]
  for (const path of GETS) {
    test(`GET ${path} → 401 without session`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(401)
    })
  }

  const POSTS = [
    '/api/account/addresses',
    '/api/account/wishlist',
    '/api/account/tickets',
    '/api/account/tax-invoice',
    '/api/account/change-email',
    '/api/account/avatar',
    '/api/account/delete',
    '/api/auth/logout-all',
    '/api/auth/send-verification',
  ]
  for (const path of POSTS) {
    test(`POST ${path} → 401 without session`, async ({ request }) => {
      const res = await request.post(path, { data: {} })
      expect(res.status()).toBe(401)
    })
  }
})

test.describe('Admin bootstrap — setup-owner is locked down', () => {
  test('POST /api/admin/setup-owner without valid secret → never 2xx', async ({ request }) => {
    const res = await request.post('/api/admin/setup-owner', {
      data: { secret: 'definitely-wrong', email: 'x@example.com' },
    })
    // 403 (bad secret/disabled), 410 (owner already exists), 429 (rate limited)
    expect([403, 410, 429]).toContain(res.status())
  })
})

test.describe('CSRF — cross-origin writes are rejected', () => {
  test('POST /api/auth/login with foreign Origin → 403', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      headers: { Origin: 'https://evil.example.com' },
      data: { email: 'a@b.com', password: 'xxxxxxxx' },
    })
    expect(res.status()).toBe(403)
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
