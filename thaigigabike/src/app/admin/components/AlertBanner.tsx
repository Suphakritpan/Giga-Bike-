import { XCircle, AlertTriangle } from 'lucide-react'

/** Inline dashboard alert (red error / orange warning). */
export function AlertBanner({ type, message }: { type: 'error' | 'warn'; message: string }) {
  const isErr = type === 'error'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 8, fontSize: 14,
      background: isErr ? 'rgba(239,68,68,.09)' : 'rgba(249,115,22,.09)',
      border: `0.5px solid ${isErr ? 'rgba(239,68,68,.3)' : 'rgba(249,115,22,.3)'}`,
      color: isErr ? '#ef4444' : '#f97316',
    }}>
      {isErr ? <XCircle size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  )
}
