interface VoiceInputProps {
  isActive: boolean
  isDisabled: boolean
  chatState: "idle" | "recording" | "processing" | "streaming" | "speaking"
  onToggleMic: () => void
  onSubmit: () => void
}

function getStateLabel(chatState: VoiceInputProps["chatState"]) {
  if (chatState === "recording") {
    return "말하는 중"
  }

  if (chatState === "processing") {
    return "음성을 분석하는 중"
  }

  if (chatState === "streaming") {
    return "AI가 답변하는 중"
  }

  if (chatState === "speaking") {
    return "음성 재생 중"
  }

  return "대기 중"
}

export default function VoiceInput({
  isActive,
  isDisabled,
  chatState,
  onToggleMic,
  onSubmit
}: VoiceInputProps) {
  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-12)",
        padding: "var(--space-16)",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "var(--space-4)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-sm)"
          }}
        >
          입력 상태
        </div>
        <strong>{getStateLabel(chatState)}</strong>
      </div>

      <div style={{ display: "flex", gap: "var(--space-12)", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={isDisabled}
          onClick={onToggleMic}
          style={{
            minHeight: "48px",
            minWidth: "120px",
            border: "none",
            borderRadius: "var(--radius-card)",
            backgroundColor: isActive
              ? "var(--color-promo-red)"
              : "var(--color-primary)",
            color: "var(--color-text-on-primary)",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.6 : 1
          }}
        >
          {isActive ? "마이크 끄기" : "마이크 켜기"}
        </button>

        <button
          type="button"
          disabled={isDisabled || !isActive}
          onClick={onSubmit}
          style={{
            minHeight: "48px",
            minWidth: "120px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface-subtle)",
            color: "var(--color-text-primary)",
            cursor: isDisabled || !isActive ? "not-allowed" : "pointer",
            opacity: isDisabled || !isActive ? 0.6 : 1
          }}
        >
          답변 완료
        </button>
      </div>
    </section>
  )
}
