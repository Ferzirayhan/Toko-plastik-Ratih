import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className, icon, type = 'text', id, ...props },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? (
        <span className="text-sm font-semibold text-on-surface">{label}</span>
      ) : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            'w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none transition duration-300 ease-standard placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10',
            icon && 'pl-12',
            error && 'border-error focus:border-error focus:ring-error/10',
            className,
          )}
          {...props}
        />
      </span>
      {error ? (
        <span className="text-sm font-medium text-error">{error}</span>
      ) : helperText ? (
        <span className="text-sm text-outline">{helperText}</span>
      ) : null}
    </label>
  )
})
