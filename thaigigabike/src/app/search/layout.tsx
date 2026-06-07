import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ค้นหาสินค้า',
  description: 'ค้นหาอะไหล่แต่ง CNC ตามรหัส ชื่อ หรือรุ่นรถ',
  alternates: { canonical: '/search' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
