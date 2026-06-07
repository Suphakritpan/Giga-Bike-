import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'หมวดหมู่สินค้า',
  description: 'เลือกชมอะไหล่แต่งตามหมวดหมู่ เบรค เครื่องยนต์ โช๊ค ท่อ และอื่นๆ',
  alternates: { canonical: '/categories' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
