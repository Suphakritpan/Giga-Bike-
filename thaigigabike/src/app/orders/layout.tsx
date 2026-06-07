import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ออเดอร์ของฉัน',
  description: 'ดูประวัติคำสั่งซื้อด้วยอีเมลและรหัสยืนยัน',
  alternates: { canonical: '/orders' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
