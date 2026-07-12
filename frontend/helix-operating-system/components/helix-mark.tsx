import { cn } from '@/lib/utils'

/**
 * Minimal geometric Helix brand mark — two intertwined evidence strands
 * resolving into aligned nodes. Uses currentColor so it inherits text color.
 */
export function HelixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-6 w-6', className)}
    >
      <path
        d="M6 3c0 4.5 12 4.5 12 9s-12 4.5-12 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M18 3c0 4.5-12 4.5-12 9s12 4.5 12 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.5" r="1.35" fill="currentColor" />
      <circle cx="12" cy="16.5" r="1.35" fill="currentColor" />
    </svg>
  )
}
