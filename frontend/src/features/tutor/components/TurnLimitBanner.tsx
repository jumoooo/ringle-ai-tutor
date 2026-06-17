export default function TurnLimitBanner({
  onNew
}: {
  onNew: () => void
}) {
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
        backgroundColor: "var(--color-primary-light)",
        color: "var(--color-text-primary)"
      }}
    >
      <strong>최대 대화 횟수(20턴)에 도달했어요.</strong>
      <button
        type="button"
        onClick={onNew}
        style={{
          minHeight: "40px",
          padding: "0 var(--space-16)",
          border: "none",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary)",
          cursor: "pointer"
        }}
      >
        새 대화 시작
      </button>
    </section>
  )
}
