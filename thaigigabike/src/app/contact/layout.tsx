import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ติดต่อเรา',
  description: 'ติดต่อ ThaiGigaBike สอบถามสินค้าและบริการ',
  alternates: { canonical: '/contact' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
