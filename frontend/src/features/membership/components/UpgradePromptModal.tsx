import { useEffect } from "react"

interface UpgradePromptModalProps {
  open: boolean
  requiredPlanName: string
  onClose: () => void
}

export default function UpgradePromptModal({
  open,
  requiredPlanName,
  onClose
}: UpgradePromptModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="멤버십 업그레이드 안내"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-16)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          padding: "var(--space-24)",
          width: "100%",
          maxWidth: "360px",
          display: "grid",
          gap: "var(--space-20)"
        }}
      >
        <div style={{ display: "grid", gap: "var(--space-8)" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-4xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)"
            }}
          >
            멤버십이 필요해요
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "var(--font-size-base)",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--line-height-base)"
            }}
          >
            대화 기능은 <strong style={{ color: "var(--color-text-primary)" }}>{requiredPlanName}</strong> 멤버십이 필요해요.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)"
            }}
          >
            아래 플랜 구매 섹션에서 구매하실 수 있어요.
          </p>
        </div>

        <div style={{ display: "grid", gap: "var(--space-8)" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: "48px",
              border: "none",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: "pointer"
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
