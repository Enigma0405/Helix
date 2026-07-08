import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// Button Types
// ============================================================
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'ai'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

// ============================================================
// Variant styles
// ============================================================
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-helix ' +
    'hover:shadow-helix-lg hover:shadow-blue-500/20',
  secondary:
    'bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10 hover:border-white/20',
  ghost:
    'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent',
  danger:
    'bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50',
  success:
    'bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-500/50',
  ai:
    'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 ' +
    'text-white border border-violet-500/30 shadow-ai',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-md',
  sm: 'px-3 py-1.5 text-sm gap-2 rounded-md',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-lg',
}

// ============================================================
// Spinner (inline)
// ============================================================
function ButtonSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
// Button Component
// ============================================================
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        whileHover={{ scale: isDisabled ? 1 : 1.01 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading && <ButtonSpinner />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
