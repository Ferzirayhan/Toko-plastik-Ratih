import { useEffect } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface ModalProps extends PropsWithChildren {
  open: boolean
  onClose: () => void
  title?: string
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#06231f]/28 px-4 py-8">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[101] w-full rounded-[2rem] bg-surface-container-lowest shadow-panel',
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-6 py-5">
          <div className="min-w-0 flex-1 pr-2">
            {title ? (
              <h2 className="text-xl font-bold text-on-surface">{title}</h2>
            ) : null}
            {description ? (
              <div className="mt-1 text-sm text-outline">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-outline transition hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6 custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
