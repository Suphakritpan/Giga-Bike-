'use client'
import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

type Props = {
  open: boolean
  title: string
  /** Optional explanatory line under the title. */
  message?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Style the confirm button as destructive and focus the cancel button first. */
  danger?: boolean
  /** Disable both buttons and show a spinner on confirm while an async action runs. */
  loading?: boolean
}

/**
 * Modal confirmation for destructive actions — replaces native window.confirm()
 * so prompts are bilingual, on-brand, and accessible. Matches the app's other
 * modals (fixed backdrop + centered card) and adds Esc-to-cancel, backdrop
 * click, initial focus and focus restore.
 *
 *   <ConfirmDialog open={show} danger loading={busy}
 *     title="ยกเลิกออเดอร์นี้?" confirmLabel="ยกเลิกออเดอร์" cancelLabel="ไม่ใช่ตอนนี้"
 *     onConfirm={doCancel} onCancel={() => setShow(false)} />
 */
export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = false, loading = false,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descId = useId()

  // Keep latest handler/flag without re-running the focus effect every render.
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel
  const loadingRef = useRef(loading)
  loadingRef.current = loading

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    // Destructive dialogs focus the safe (cancel) action; others focus confirm.
    ;(danger ? cancelRef.current : confirmRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingRef.current) onCancelRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [open, danger])

  if (!open) return null

  return (
    <div
      // Close only when the backdrop itself is pressed (not on drag-release from inside).
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        className="animate-fade-up"
        style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,.3)' }}
      >
        <h2 id={titleId} style={{ fontSize: 18, fontWeight: 800, marginBottom: message ? 8 : 18 }}>{title}</h2>
        {message && <p id={descId} style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 20 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
