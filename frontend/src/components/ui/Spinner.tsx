import { cn } from '@/lib/utils'

// ============================================================
// Spinner
// ============================================================
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'violet' | 'white' | 'green'
  className?: string
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const colorMap = {
  blue: 'text-blue-500',
  violet: 'text-violet-500',
  white: 'text-white',
  green: 'text-emerald-500',
}

export function Spinner({ size = 'md', color = 'blue', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizeMap[size], colorMap[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ============================================================
// Full-page loading screen
// ============================================================
interface FullPageSpinnerProps {
  message?: string
}

export function FullPageSpinner({ message = 'Loading...' }: FullPageSpinnerProps) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600
                        flex items-center justify-center shadow-helix-lg mb-2">
          <span className="text-2xl font-black text-white">H</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500
                        flex items-center justify-center">
          <Spinner size="xs" color="white" />
        </div>
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}

// ============================================================
// Skeleton Loading Block
// ============================================================
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={cn('h-4 rounded shimmer bg-white/5', className)} />
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded shimmer bg-white/5',
            i === lines - 1 && 'w-3/4',
            className
          )}
        />
      ))}
    </div>
  )
}

// ============================================================
// AI Thinking Animation
// ============================================================
export function AIThinkingIndicator({ message = 'Generating hypotheses...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                    bg-gradient-to-r from-blue-500/10 to-violet-500/10
                    border border-violet-500/20">
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600
                        flex items-center justify-center">
          <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-violet-300 font-medium">{message}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
