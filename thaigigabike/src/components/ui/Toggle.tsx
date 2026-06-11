'use client'

type Props = {
  on: boolean
  onClick: () => void
  /** Accessible name — required because the switch itself has no text. */
  label: string
  disabled?: boolean
}

/** Accessible on/off switch (aria-pressed + keyboard focus ring). */
export function Toggle({ on, onClick, label, disabled }: Props) {
  return (
    <button
      type="button"
      className="toggle"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    />
  )
}
