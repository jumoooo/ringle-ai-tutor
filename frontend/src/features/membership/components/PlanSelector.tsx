import Button from "@/components/ui/Button"
import type { Membership, Plan } from "@/types/membership"

interface PlanSelectorProps {
  plans: Plan[]
  currentMembership: Membership | null | undefined
  onSelectPlan: (plan: Plan) => void
  isPending?: boolean
}

export default function PlanSelector({
  plans,
  currentMembership,
  onSelectPlan,
  isPending = false
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
              gridTemplateRows: "auto auto 1fr auto",
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
                data-testid="plan-action-btn"
                style={{
                  minHeight: "44px",
                  boxSizing: "border-box",
                  border: "1px solid transparent",
                  borderRadius: "var(--radius-chip)",
                  backgroundColor: "var(--color-disabled)",
                  color: "var(--color-text-on-primary)",
                  alignSelf: "end"
                }}
              >
                현재 플랜
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  alignSelf: "end"
                }}
              >
                <Button
                  label="구매"
                  variant="primary"
                  onClick={() => onSelectPlan(plan)}
                  disabled={isPending}
                  disabledReason={isPending ? "submitting" : null}
                  minHeight="44px"
                  dataTestId="plan-action-btn"
                />
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}
