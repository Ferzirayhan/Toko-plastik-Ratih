import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

interface SearchBarProps {
  value?: string
  placeholder?: string
  onSearch: (value: string) => void
  className?: string
}

export function SearchBar({
  value = '',
  placeholder = 'Cari...',
  onSearch,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(internalValue)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [internalValue, onSearch])

  return (
    <div className={cn('relative', className)}>
      <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
        search
      </span>
      <input
        type="search"
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 pl-12 pr-4 text-sm text-on-surface outline-none transition duration-300 ease-standard placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  )
}
