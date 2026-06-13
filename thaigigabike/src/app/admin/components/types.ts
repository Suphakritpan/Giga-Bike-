// Shared types + constants for the admin dashboard and its tab components.
// Extracted verbatim from admin/page.tsx (no value changes).

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
export type Tab = 'products' | 'orders' | 'stock' | 'messages' | 'tickets' | 'tax' | 'reviews'

export type AdminMessage = {
  id: string; sender_name: string; sender_email: string; sender_phone: string | null
  subject: string | null; body: string; product_code: string | null
  status: 'new' | 'replied' | 'closed'; created_at: string
}
export type AdminReview = {
  id: string; product_id: string | null; reviewer_name: string
  rating: number; comment: string | null; published: boolean; created_at: string
}
export type TicketStatus = 'open' | 'answered' | 'closed'
export type AdminTicket = {
  id: string; user_id: string | null; email: string; topic: string
  order_id: string | null; subject: string; body: string; images: string[]
  status: TicketStatus; rating: number | null; created_at: string
}
export type TaxRequest = {
  id: string; user_id: string | null; order_id: string; tax_id: string
  company: string; address: string; status: 'requested' | 'issued'; created_at: string
  order_total: number | null; order_email: string | null
}
export type ThreadReply = { id: string; author: 'customer' | 'shop'; body: string; images: string[]; created_at: string }

export type OrderItem = {
  productId: string; code: string; name: string; nameTh: string
  price: number; quantity: number; color: string
}
export type Order = {
  id: string; status: OrderStatus; created_at: string
  recipient_name: string; recipient_phone: string; recipient_address: string
  shipping_method: string; shipping_fee: number; payment_method: string
  items: OrderItem[]; subtotal: number; cod_fee: number; total: number
  slip_url: string | null; slip_path: string | null; tracking_no: string | null
}

export const TICKET_TOPIC_LABELS: Record<string, string> = {
  general: 'ทั่วไป', order: 'ออเดอร์', shipping: 'จัดส่ง', product: 'สินค้า',
  refund: 'คืนเงิน', claim: 'เคลม', payment: 'ชำระเงิน',
}

export const LOW_STOCK_THRESHOLD = 5
export const PAGE_SIZE = 50

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray', paid: 'badge-green', shipping: 'badge-orange',
  delivered: 'badge-green', cancelled: 'badge-red',
}
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง',
  delivered: 'สำเร็จ', cancelled: 'ยกเลิก',
}
