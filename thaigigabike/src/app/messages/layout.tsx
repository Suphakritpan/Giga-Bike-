import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ส่งข้อความถึงเรา',
  description: 'ส่งข้อความสอบถามสินค้าถึงทีมงาน ThaiGigaBike',
  alternates: { canonical: '/messages' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
