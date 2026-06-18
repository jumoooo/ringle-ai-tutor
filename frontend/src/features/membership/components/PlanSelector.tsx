import type { Membership, Plan } from "@/types/membership"

interface PlanSelectorProps {
  plans: Plan[]
  currentMembership: Membership | null | undefined
  onPurchase: (planId: number) => void
  isPending: boolean
}

export default function PlanSelector({
  plans,
  currentMembership,
  onPurchase,
  isPending
}: PlanSelectorProps) {
  const paidPlans = plans
    .filter((plan) => plan.monthly_price > 0)
    .sort((leftPlan, rightPlan) => rightPlan.monthly_price - leftPlan.monthly_price)

  return (
    <section
      style={{
        display: "grid",
        gap: "var(--space-16)",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
      }}
    >
      {paidPlans.map((plan) => {
        const isCurrentPlan = currentMembership?.plan.id === plan.id

        return (
          <article
            key={plan.id}
            data-testid="plan-card"
            style={{
              display: "grid",
              gap: "var(--space-12)",
              padding: "var(--space-20)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)"
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 var(--space-8)",
                  fontSize: "var(--font-size-3xl)",
                  color: "var(--color-text-primary)"
                }}
              >
                {plan.name}
              </h3>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                월 {plan.monthly_price.toLocaleString("ko-KR")}원
              </p>
              <p
                style={{
                  margin: "var(--space-4) 0 0",
                  color: "var(--color-text-secondary)",
                  fontSize: "var(--font-size-sm)"
                }}
              >
                {plan.duration_days}일 이용
              </p>
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: "var(--space-20)",
                color: "var(--color-text-secondary)"
              }}
            >
              {plan.can_learn ? <li>학습 가능</li> : null}
              {plan.can_talk ? <li>대화 가능</li> : null}
              {plan.can_analyze ? <li>분석 가능</li> : null}
            </ul>

            {isCurrentPlan ? (
              <button
                type="button"
                disabled
                style={{
                  minHeight: "44px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--color-disabled)",
                  color: "var(--color-text-on-primary)"
                }}
              >
                현재 플랜
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onPurchase(plan.id)}
                disabled={isPending}
                style={{
                  minHeight: "44px",
                  border: "none",
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary)",
                  cursor: isPending ? "progress" : "pointer"
                }}
              >
                구매
              </button>
            )}
          </article>
        )
      })}
    </section>
  )
}
