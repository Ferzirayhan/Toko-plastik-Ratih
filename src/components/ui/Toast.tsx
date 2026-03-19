import { cn } from '../../utils/cn'
import { useToastStore } from '../../stores/toastStore'

const variantStyles = {
  success: 'border-primary/20 bg-primary-fixed text-on-primary-fixed-variant',
  error: 'border-error/20 bg-error-container text-on-error-container',
  info: 'border-primary/15 bg-primary/10 text-primary',
  warning: 'border-secondary/20 bg-secondary-fixed text-on-secondary-fixed-variant',
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-3xl border px-5 py-4 shadow-card backdrop-blur',
            variantStyles[toast.variant],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-[0.12em]">
                {toast.title}
              </h4>
              {toast.description ? (
                <p className="mt-1 text-sm leading-6 opacity-90">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-full px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
