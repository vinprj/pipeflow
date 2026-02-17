import { useEffect } from 'react'
import type { Toast } from '../types'

interface Props {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  const colors = {
    success: 'border-green-500/50 bg-green-950/90',
    error: 'border-red-500/50 bg-red-950/90',
    warning: 'border-yellow-500/50 bg-yellow-950/90',
    info: 'border-blue-500/50 bg-blue-950/90'
  }

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }

  return (
    <div className={`toast-notification glass-card ${colors[toast.type]} border-l-4 p-4 flex items-start gap-3`}>
      <span className={`text-xl font-bold ${iconColors[toast.type]} font-mono`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-white font-mono">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export default ToastContainer
