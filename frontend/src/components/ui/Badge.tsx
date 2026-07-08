import React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// Badge Types
// ============================================================
type BadgeVariant =
  | 'default'
  | 'blue'
  | 'violet'
  | 'green'
  | 'amber'
  | 'red'
  | 'orange'
  | 'slate'
  | 'ai'

type BadgeSize = 'xs' | 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulseDot?: boolean
  className?: string
  icon?: React.ReactNode
}

// ============================================================
// Variant Styles
// ============================================================
const badgeVariants: Record<BadgeVariant, string> = {
  default:
    'bg-white/10 border-white/20 text-slate-300',
  blue:
    'bg-blue-500/15 border-blue-500/30 text-blue-400',
  violet:
    'bg-violet-500/15 border-violet-500/30 text-violet-400',
  green:
    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  amber:
    'bg-amber-500/15 border-amber-500/30 text-amber-400',
  red:
    'bg-red-500/15 border-red-500/30 text-red-400',
  orange:
    'bg-orange-500/15 border-orange-500/30 text-orange-400',
  slate:
    'bg-slate-500/15 border-slate-500/30 text-slate-400',
  ai:
    'bg-gradient-to-r from-blue-500/15 to-violet-500/15 border-violet-500/30 text-violet-300',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  blue: 'bg-blue-400',
  violet: 'bg-violet-400',
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  slate: 'bg-slate-400',
  ai: 'bg-violet-400',
}

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
}

// ============================================================
// Badge Component
// ============================================================
export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulseDot = false,
  className,
  icon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        badgeVariants[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'status-dot',
            dotColors[variant],
            pulseDot && 'animate-pulse'
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// ============================================================
// Specialized badges (convenience wrappers)
// ============================================================
interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'pending_review' | 'closed'
  size?: BadgeSize
}

const statusBadgeMap: Record<string, { variant: BadgeVariant; label: string }> = {
  open: { variant: 'blue', label: 'Open' },
  in_progress: { variant: 'violet', label: 'In Progress' },
  pending_review: { variant: 'amber', label: 'Pending Review' },
  closed: { variant: 'slate', label: 'Closed' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusBadgeMap[status] ?? { variant: 'default' as BadgeVariant, label: status }
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  )
}

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low'
  size?: BadgeSize
}

const severityBadgeMap: Record<string, { variant: BadgeVariant; label: string }> = {
  critical: { variant: 'red', label: 'Critical' },
  high: { variant: 'orange', label: 'High' },
  medium: { variant: 'amber', label: 'Medium' },
  low: { variant: 'green', label: 'Low' },
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const config = severityBadgeMap[severity] ?? { variant: 'default' as BadgeVariant, label: severity }
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  )
}
