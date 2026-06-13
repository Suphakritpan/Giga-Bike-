'use client'
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type ToastItemData = { id: number; message: string; type: ToastType }

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void } | null>(null)

/** Show a transient toast. Safe to call even outside the provider (no-op). */
export function useToast() {
  return useContext(ToastContext) ?? { toast: () => {} }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region" aria-live="polite" aria-label="การแจ้งเตือน"
        style={{ position: 'fixed', top: 70, right: 16, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', maxWidth: 'calc(100vw - 32px)' }}
      >
        {toasts.map(t => <Toast key={t.id} data={t} onClose={() => remove(t.id)} />)}
      </div>
    </ToastContext.Provider>
  )
}

const STYLES: Record<ToastType, { color: string; border: string; Icon: typeof CheckCircle }> = {
  success: { color: 'var(--green)', border: 'rgba(34,197,94,.45)', Icon: CheckCircle },
  error:   { color: 'var(--red)',   border: 'rgba(239,68,68,.45)', Icon: AlertCircle },
  info:    { color: 'var(--text2)', border: 'var(--border2)',       Icon: Info },
}

function Toast({ data, onClose }: { data: ToastItemData; onClose: () => void }) {
  const s = STYLES[data.type]
  return (
    <div role="alert" className="animate-fade-up"
      style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, minWidth: 240, maxWidth: 360, padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', border: `1px solid ${s.border}`, boxShadow: '0 6px 24px rgba(0,0,0,.25)', fontSize: 14, color: 'var(--text)' }}>
      <s.Icon size={16} color={s.color} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{data.message}</span>
      <button onClick={onClose} aria-label="ปิด" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 0, flexShrink: 0 }}><X size={14} /></button>
    </div>
  )
}
