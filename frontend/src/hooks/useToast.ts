import { useState, useCallback, useEffect, useRef } from 'react'

// ============================================================
// Toast Types
// ============================================================
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// ============================================================
// Global toast state (module-level singleton)
// ============================================================
type ToastListener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners: Set<ToastListener> = new Set()

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

function addToast(toast: Omit<Toast, 'id'>): string {
  const id = Math.random().toString(36).slice(2, 9)
  const t: Toast = { id, duration: 4000, ...toast }
  toasts = [...toasts, t]
  notify()
  if (t.duration && t.duration > 0) {
    setTimeout(() => removeToast(id), t.duration)
  }
  return id
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

// ============================================================
// toast() — imperative API (callable outside React)
// ============================================================
export const toast = {
  success: (title: string, message?: string) =>
    addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    addToast({ type: 'info', title, message }),
  dismiss: (id: string) => removeToast(id),
}

// ============================================================
// useToast hook — subscribe to toast state
// ============================================================
export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([...toasts])
  const ref = useRef(setCurrentToasts)
  ref.current = setCurrentToasts

  useEffect(() => {
    const listener: ToastListener = (updated) => ref.current(updated)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismiss = useCallback((id: string) => removeToast(id), [])

  return { toasts: currentToasts, dismiss }
}
