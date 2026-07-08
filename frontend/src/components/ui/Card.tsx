import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// Card Types
// ============================================================
interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  interactive?: boolean
  glowColor?: 'blue' | 'purple' | 'green' | 'none'
  animate?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const glowStyles = {
  blue: 'hover:shadow-helix hover:border-blue-500/20',
  purple: 'hover:shadow-ai hover:border-violet-500/20',
  green: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.1)] hover:border-emerald-500/20',
  none: '',
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

// ============================================================
// Card Component
// ============================================================
export function Card({
  children,
  className,
  elevated = false,
  interactive = false,
  glowColor = 'none',
  animate = true,
  padding = 'md',
  onClick,
}: CardProps) {
  const base = cn(
    'rounded-xl border transition-all duration-300',
    elevated
      ? 'bg-white/8 border-white/15 backdrop-blur-md shadow-glass'
      : 'bg-white/5 border-white/10 backdrop-blur-sm',
    interactive && 'cursor-pointer',
    glowColor !== 'none' && glowStyles[glowColor],
    paddingStyles[padding],
    className
  )

  if (animate) {
    return (
      <motion.div
        className={base}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={onClick}
        whileHover={interactive ? { y: -2 } : undefined}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  )
}

// ============================================================
// Card sub-components
// ============================================================
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      <div>{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
  subtitle?: string
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
  return (
    <div>
      <h3 className={cn('text-base font-semibold text-slate-100', className)}>{children}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-5 pt-4 border-t border-white/5 flex items-center gap-3', className)}>
      {children}
    </div>
  )
}

// ============================================================
// KPI Card — specific variant for dashboard metrics
// ============================================================
interface KpiCardProps {
  title: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  icon: React.ReactNode
  iconColor?: string
  loading?: boolean
}

export function KpiCard({
  title,
  value,
  delta,
  deltaPositive,
  icon,
  iconColor = 'text-blue-400',
  loading = false,
}: KpiCardProps) {
  return (
    <motion.div
      className="glass-card p-6 hover:bg-white/8 transition-all duration-300 cursor-default"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-white/5 rounded shimmer" />
          ) : (
            <p className="text-3xl font-bold text-slate-100">{value}</p>
          )}
          {delta && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                deltaPositive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {deltaPositive ? '↑' : '↓'} {delta}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl bg-white/5 border border-white/10',
            iconColor
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
