import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ติดตามออเดอร์',
  description: 'ติดตามสถานะคำสั่งซื้อและเลขพัสดุ',
  alternates: { canonical: '/order' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
