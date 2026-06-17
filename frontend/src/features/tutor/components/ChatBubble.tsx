interface ChatBubbleProps {
  role: "user" | "assistant"
  content: string
  createdAt: string
  audioBlobUrl?: string
  onReplay?: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
}

export default function ChatBubble({
  role,
  content,
  createdAt,
  audioBlobUrl,
  onReplay
}: ChatBubbleProps) {
  const isUser = role === "user"

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start"
      }}
    >
      <div
        style={{
          maxWidth: "min(78%, 720px)",
          display: "grid",
          gap: "var(--space-8)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: isUser ? "flex-end" : "flex-start",
            gap: "var(--space-8)"
          }}
        >
          {!isUser ? (
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)"
              }}
            >
              AI
            </span>
          ) : null}

          <div
            style={{
              padding: "var(--space-16)",
              borderRadius: "var(--radius-card)",
              backgroundColor: isUser
                ? "var(--color-user-bubble)"
                : "var(--color-ai-bubble)",
              color: isUser
                ? "var(--color-text-on-primary)"
                : "var(--color-text-primary)"
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{content}</p>
          </div>

          {isUser ? (
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)"
              }}
            >
              Me
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: isUser ? "flex-end" : "flex-start",
            alignItems: "center",
            gap: "var(--space-8)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-sm)"
          }}
        >
          <span>{formatTime(createdAt)}</span>
          {audioBlobUrl || onReplay ? (
            <button
              type="button"
              onClick={() => {
                if (audioBlobUrl) {
                  void new Audio(audioBlobUrl).play()
                  return
                }

                onReplay?.()
              }}
              aria-label="재생"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-chip)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                minHeight: "28px",
                minWidth: "44px"
              }}
            >
              ▶
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
