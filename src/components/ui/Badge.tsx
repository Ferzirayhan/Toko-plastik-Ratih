import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps extends PropsWithChildren<HTMLAttributes<HTMLSpanElement>> {
  variant?: BadgeVariant
}

const badgeClasses: Record<BadgeVariant, string> = {
  success: 'bg-primary-fixed text-on-primary-fixed-variant',
  warning: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  danger: 'bg-error-container text-on-error-container',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-container-high text-on-surface-variant',
}

export function Badge({
  children,
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em]',
        badgeClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
