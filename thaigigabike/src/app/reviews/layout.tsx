import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'รีวิวจากลูกค้า',
  description: 'รีวิวและคะแนนจากลูกค้าจริงของ ThaiGigaBike',
  alternates: { canonical: '/reviews' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
