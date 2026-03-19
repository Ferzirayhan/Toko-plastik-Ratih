import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gradient text-on-primary shadow-float hover:brightness-105 active:scale-[0.99]',
  secondary:
    'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
  ghost:
    'bg-transparent text-primary hover:bg-primary/10',
  danger:
    'bg-error text-on-error shadow-sm hover:brightness-105 active:scale-[0.99]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[2.5rem] px-3.5 py-2 text-sm',
  md: 'min-h-[2.875rem] px-4 py-2.5 text-sm',
  lg: 'min-h-[3.25rem] px-5 py-3 text-base',
  xl: 'min-h-[3.75rem] px-6 py-4 text-base',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition duration-300 ease-standard disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}
