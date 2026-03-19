import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({
  label,
  error,
  helperText,
  options,
  className,
  placeholder,
  ...props
}: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? (
        <span className="text-sm font-semibold text-on-surface">{label}</span>
      ) : null}
      <select
        className={cn(
          'w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none transition duration-300 ease-standard focus:border-primary focus:ring-4 focus:ring-primary/10',
          error && 'border-error focus:border-error focus:ring-error/10',
          className,
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-sm font-medium text-error">{error}</span>
      ) : helperText ? (
        <span className="text-sm text-outline">{helperText}</span>
      ) : null}
    </label>
  )
}
