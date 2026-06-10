import { redirect } from 'next/navigation'

// Admin login is handled by the unified /login page.
export default function AdminLoginPage() {
  redirect('/login?next=/admin')
}
