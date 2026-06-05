import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/orders/[orderId]
 *
 * This endpoint no longer returns order details publicly.
 * Public order tracking now requires Email OTP verification via:
 *   POST /api/order-lookup/request-otp
 *   POST /api/order-lookup/verify
 *
 * Returns 410 Gone so clients can detect the deprecation and update.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest, { params: _p }: { params: { orderId: string } }) {
  return NextResponse.json(
    {
      error: 'This endpoint has been deprecated. Use POST /api/order-lookup/verify instead.',
      docs:  '/order',
    },
    { status: 410 }
  )
}
