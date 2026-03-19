import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  className,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-surface-container-lowest shadow-card',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
