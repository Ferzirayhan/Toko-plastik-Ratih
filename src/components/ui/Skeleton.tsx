import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container-high to-surface-container-low bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
