import type React from "react"
import type { Plan } from "@/types/membership"
import type { AdminUser } from "@/features/admin/api"

interface UserMembershipTableProps {
  users: AdminUser[]
  plans: Plan[]
  isSubmitting: boolean
  onGrant: (userId: number, planId: number) => void
  onRevoke: (userId: number) => void
}

export default function UserMembershipTable({
  users,
  plans,
  isSubmitting,
  onGrant,
  onRevoke
}: UserMembershipTableProps) {
  const paidPlans = plans.filter((plan) => plan.monthly_price > 0)

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "760px"
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "var(--color-surface-subtle)" }}>
            {(["유저", "이메일", "현재 멤버십", "만료일", "부여", "삭제"] as const).map((heading) => (
              <th
                key={heading}
                scope="col"
                style={{
                  padding: "var(--space-16)",
                  textAlign: (["현재 멤버십", "만료일", "부여"].includes(heading) ? "center" : "left") as React.CSSProperties["textAlign"],
                  color: "var(--color-text-secondary)",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td
                style={{
                  padding: "var(--space-16)",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {user.name}
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  color: "var(--color-text-secondary)",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {user.email}
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {user.membership?.plan_name ?? "없음"}
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {user.membership
                  ? new Date(user.membership.expires_at).toLocaleDateString("ko-KR")
                  : "-"}
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                <div style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap", justifyContent: "center" }}>
                  {paidPlans.map((plan) => {
                    const isCurrentPlan = user.membership?.plan_name === plan.name
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onGrant(user.id, plan.id)}
                        style={{
                          minHeight: "36px",
                          padding: "0 var(--space-12)",
                          border: isCurrentPlan ? "none" : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-chip)",
                          backgroundColor: isCurrentPlan
                            ? "var(--color-primary)"
                            : "var(--color-surface-subtle)",
                          color: isCurrentPlan
                            ? "var(--color-text-on-primary)"
                            : "var(--color-text-primary)",
                          cursor: isSubmitting ? "progress" : "pointer",
                          fontWeight: isCurrentPlan ? 600 : 400
                        }}
                      >
                        {plan.name}
                      </button>
                    )
                  })}
                </div>
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                <button
                  type="button"
                  disabled={isSubmitting || user.membership === null}
                  onClick={() => onRevoke(user.id)}
                  style={{
                    minHeight: "36px",
                    padding: "0 var(--space-12)",
                    border: "1px solid var(--color-promo-red)",
                    borderRadius: "var(--radius-chip)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-promo-red)",
                    cursor:
                      isSubmitting || user.membership === null
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
