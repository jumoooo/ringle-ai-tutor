import type React from "react"
import AdminButton from "@/features/admin/components/AdminButton"
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
            {(["유저", "이메일", "현재 멤버십", "만료일", "부여", "멤버십 삭제"] as const).map((heading) => (
              <th
                key={heading}
                scope="col"
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center" as React.CSSProperties["textAlign"],
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
                  textAlign: "center",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                {user.name}
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center",
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
                {user.membership?.plan_name ?? "무료"}
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
                      <AdminButton
                        key={plan.id}
                        label={plan.name}
                        variant={isCurrentPlan ? "plan-active" : "plan-inactive"}
                        disabled={isSubmitting}
                        disabledReason={isSubmitting ? "submitting" : null}
                        onClick={() => onGrant(user.id, plan.id)}
                      />
                    )
                  })}
                </div>
              </td>
              <td
                style={{
                  padding: "var(--space-16)",
                  textAlign: "center",
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                <AdminButton
                  label="삭제"
                  variant="danger"
                  disabled={isSubmitting || user.membership === null}
                  disabledReason={
                    user.membership === null
                      ? "unavailable"
                      : isSubmitting
                        ? "submitting"
                        : null
                  }
                  onClick={() => onRevoke(user.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
