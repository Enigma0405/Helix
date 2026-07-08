import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast, type Toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

// ============================================================
// Icon + color config per toast type
// ============================================================
const toastConfig = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-400',
    barClass: 'bg-emerald-500',
    bg: 'bg-[#1E293B] border-emerald-500/30',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-400',
    barClass: 'bg-red-500',
    bg: 'bg-[#1E293B] border-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    barClass: 'bg-amber-500',
    bg: 'bg-[#1E293B] border-amber-500/30',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-400',
    barClass: 'bg-blue-500',
    bg: 'bg-[#1E293B] border-blue-500/30',
  },
}

// ============================================================
// Individual Toast
// ============================================================
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden min-w-[300px] max-w-sm',
        'rounded-xl border shadow-glass backdrop-blur-md',
        'flex items-start gap-3 p-4',
        config.bg
      )}
      role="alert"
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', config.barClass)} />

      {/* Icon */}
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded-md text-slate-500 hover:text-slate-300
                   hover:bg-white/8 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ============================================================
// Toast Container (place in App root)
// ============================================================
export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
