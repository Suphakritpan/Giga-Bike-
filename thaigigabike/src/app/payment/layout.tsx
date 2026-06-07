import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'วิธีการชำระเงิน',
  description: 'ช่องทางชำระเงิน โอนเงิน PromptPay และเก็บเงินปลายทาง COD',
  alternates: { canonical: '/payment' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
