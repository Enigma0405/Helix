import { cn, getScoreBarColor, getScoreColor, formatScore } from '@/lib/utils'

// ============================================================
// ProgressBar Component
// ============================================================
interface ProgressBarProps {
  value: number // 0–100
  className?: string
  barClassName?: string
  showLabel?: boolean
  label?: string
  size?: 'xs' | 'sm' | 'md'
  color?: 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'auto'
  animated?: boolean
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
}

const colorMap = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  auto: '',
}

export function ProgressBar({
  value,
  className,
  barClassName,
  showLabel = false,
  label,
  size = 'sm',
  color = 'blue',
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-slate-300">{pct}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-white/8 rounded-full overflow-hidden',
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            color === 'auto'
              ? getScoreBarColor(pct / 100)
              : colorMap[color],
            animated && 'transition-[width]',
            barClassName
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

// ============================================================
// ScoreBar — for hypothesis confidence/grounding scores
// ============================================================
interface ScoreBarProps {
  score: number | null | undefined
  label?: string
  size?: 'xs' | 'sm' | 'md'
  showValue?: boolean
  className?: string
}

export function ScoreBar({
  score,
  label,
  size = 'sm',
  showValue = true,
  className,
}: ScoreBarProps) {
  const pct = score != null ? Math.round(score * 100) : 0

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showValue && (
            <span className={cn('text-xs font-semibold tabular-nums', getScoreColor(score))}>
              {formatScore(score)}
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-white/8 rounded-full overflow-hidden', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', getScoreBarColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
