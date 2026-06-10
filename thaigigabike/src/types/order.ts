export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

export type OrderItem = {
  productId: string
  code: string
  name: string
  price: number
  qty: number
  color?: string
}

export type Order = {
  id: string
  status: OrderStatus
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  shipping_method: string
  shipping_fee: number
  cod_fee: number
  subtotal: number
  total: number
  payment_method: string
  items: OrderItem[]
  slip_path?: string
  tracking_no?: string
  contact_email?: string
  user_id?: string
  idempotency_key?: string
  created_at: string
}
