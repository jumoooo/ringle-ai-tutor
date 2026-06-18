import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react"

type ToastTone = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
  exiting: boolean
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, React.CSSProperties> = {
  success: {
    borderColor: "var(--color-tag-green)",
    color: "var(--color-text-primary)"
  },
  error: {
    borderColor: "var(--color-promo-red)",
    color: "var(--color-text-primary)"
  },
  info: {
    borderColor: "var(--color-primary)",
    color: "var(--color-text-primary)"
  }
}

const ANIMATION_DURATION = 280

const toastKeyframes = `
@keyframes toast-slide-in {
  from { transform: translateX(calc(100% + 24px)); opacity: 0; }
  to   { transform: translateX(0);                 opacity: 1; }
}
@keyframes toast-slide-out {
  from { transform: translateX(0);                 opacity: 1; }
  to   { transform: translateX(calc(100% + 24px)); opacity: 0; }
}
`

function ToastRenderer({
  toasts,
  removeToast
}: {
  toasts: ToastItem[]
  removeToast: (id: number) => void
}) {
  return (
    <>
      <style>{toastKeyframes}</style>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          right: "var(--space-24)",
          bottom: "var(--space-24)",
          zIndex: 50,
          display: "grid",
          gap: "var(--space-12)",
          width: "min(360px, calc(100vw - var(--space-24) * 2))"
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              padding: "var(--space-16)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              animation: toast.exiting
                ? `toast-slide-out ${ANIMATION_DURATION}ms ease forwards`
                : `toast-slide-in ${ANIMATION_DURATION}ms ease`,
              ...toneStyles[toast.tone]
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-12)"
              }}
            >
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="알림 닫기"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, ANIMATION_DURATION)
  }, [])

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    idRef.current += 1
    const toastId = idRef.current

    setToasts((current) => [
      ...current,
      { id: toastId, message, tone, exiting: false }
    ])

    window.setTimeout(() => {
      removeToast(toastId)
    }, 3000)
  }, [removeToast])

  const value = useMemo(
    () => ({
      showToast
    }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function ToastViewport() {
  return null
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }

  return context
}
