export type UserRole = 'customer' | 'admin' | 'owner'
export type UserStatus = 'active' | 'banned' | 'pending'

export type CustomUser = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  line_id: string | null
  role: UserRole
  admin_active: boolean
  status: UserStatus
  /** Set when the user clicked the verification link — null = unverified.
   *  Email-matched guest data (orders/messages/export) is hidden until verified. */
  email_verified_at: string | null
}
