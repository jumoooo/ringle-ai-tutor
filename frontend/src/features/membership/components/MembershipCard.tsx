import type { Membership } from "@/types/membership"

interface MembershipCardProps {
  membership: Membership | null | undefined
  isLoading: boolean
}

function getStatusLabel(status: Membership["status"]) {
  if (status === "active") {
    return "활성"
  }

  if (status === "trial") {
    return "체험"
  }

  return "만료"
}

export default function MembershipCard({
  membership,
  isLoading
}: MembershipCardProps) {
  if (isLoading) {
    return (
      <section
        style={{
          padding: "var(--space-24)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        로딩 중...
      </section>
    )
  }

  if (!membership) {
    return (
      <section
        style={{
          padding: "var(--space-24)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        <p
          style={{
            margin: "0 0 var(--space-8)",
            color: "var(--color-text-secondary)"
          }}
        >
          현재 활성 멤버십이 없습니다.
        </p>
        <strong style={{ color: "var(--color-text-primary)" }}>
          플랜을 구매하면 학습과 대화 기능을 열 수 있어요.
        </strong>
      </section>
    )
  }

  const enabledFeatures = [
    membership.plan.can_learn ? "학습" : null,
    membership.plan.can_talk ? "대화" : null,
    membership.plan.can_analyze ? "분석" : null
  ].filter((feature): feature is string => feature !== null)

  return (
    <section
      style={{
        display: "grid",
        gap: "var(--space-12)",
        padding: "var(--space-24)",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <div
        style={{
          display: "inline-flex",
          width: "fit-content",
          padding: "var(--space-4) var(--space-8)",
          borderRadius: "var(--radius-chip)",
          backgroundColor: "var(--color-primary-light)",
          color: "var(--color-primary)",
          fontSize: "var(--font-size-sm)",
          fontWeight: "var(--font-weight-semibold)"
        }}
      >
        {getStatusLabel(membership.status)}
      </div>

      <div>
        <h2
          style={{
            margin: "0 0 var(--space-8)",
            fontSize: "var(--font-size-4xl)",
            color: "var(--color-text-primary)"
          }}
        >
          {membership.plan.name}
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          만료일: {new Date(membership.expires_at).toLocaleDateString("ko-KR")}
        </p>
      </div>

      <div>
        <div
          style={{
            marginBottom: "var(--space-8)",
            color: "var(--color-text-secondary)"
          }}
        >
          사용 가능한 기능
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)" }}>
          {enabledFeatures.length > 0 ? (
            enabledFeatures.map((feature) => (
              <span
                key={feature}
                style={{
                  padding: "var(--space-4) var(--space-8)",
                  borderRadius: "var(--radius-chip)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-subtle)"
                }}
              >
                {feature}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--color-text-secondary)" }}>
              아직 열려 있는 기능이 없어요.
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
