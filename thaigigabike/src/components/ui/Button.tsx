'use client'
import { forwardRef } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  /** Shows a small spinner and disables the button. */
  loading?: boolean
  /** Compact paddings/font for dense areas (tables, cards). */
  small?: boolean
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost:   'btn-ghost',
  danger:  'btn-danger',
}

/**
 * Standard button — wraps the global .btn-* classes so every page gets the
 * same hover/focus/disabled behaviour. Prefer this over raw <button> with
 * inline styles.
 *
 *   <Button onClick={save} loading={saving}>บันทึก</Button>
 *   <Button variant="danger" small>ลบ</Button>
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading = false, small = false, disabled, children, style, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={VARIANT_CLASS[variant]}
      disabled={disabled || loading}
      style={{
        justifyContent: 'center',
        ...(small ? { fontSize: 14, padding: '7px 14px' } : { fontSize: 15 }),
        ...style,
      }}
      {...rest}
    >
      {loading && <span className="spinner spinner-sm" aria-hidden="true" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />}
      {children}
    </button>
  )
})
