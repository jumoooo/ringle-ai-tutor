import { fireEvent, render, screen } from "@testing-library/react"
import AdminButton from "@/features/admin/components/AdminButton"
import UserMembershipTable from "@/features/admin/components/UserMembershipTable"
import type { AdminUser } from "@/features/admin/api"
import type { Plan } from "@/types/membership"

const adminUsers: AdminUser[] = [
  {
    id: 1,
    name: "Alice Kim",
    email: "alice@example.com",
    membership: {
      status: "active",
      plan_name: "프리미엄 플러스",
      expires_at: "2099-01-01T00:00:00+09:00"
    }
  },
  {
    id: 2,
    name: "Bob Lee",
    email: "bob@example.com",
    membership: null
  }
]

const plans: Plan[] = [
  {
    id: 1,
    name: "프리미엄 플러스",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 60
  }
]

describe("AdminButton", () => {
  it("hover 시 plan-inactive variant 색상과 scale이 바뀌어요", () => {
    render(
      <AdminButton
        label="프리미엄 플러스"
        variant="plan-inactive"
        onClick={() => {}}
      />
    )

    const button = screen.getByRole("button", { name: "프리미엄 플러스" })
    expect(button).toHaveStyle({
      backgroundColor: "var(--color-surface-subtle)",
      color: "var(--color-text-primary)",
      transform: "scale(1)"
    })

    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle({
      backgroundColor: "var(--color-primary-light)",
      color: "var(--color-primary)",
      transform: "scale(1.05)"
    })
  })

  it("disabled submitting이면 hover 없이 progress cursor를 유지해요", () => {
    render(
      <AdminButton
        label="현재 플랜"
        variant="plan-active"
        onClick={() => {}}
        disabled
        disabledReason="submitting"
      />
    )

    const button = screen.getByRole("button", { name: "현재 플랜" })
    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle({
      backgroundColor: "var(--color-primary)",
      color: "var(--color-text-on-primary)",
      cursor: "progress",
      opacity: "0.6",
      transform: "scale(1)"
    })
  })

  it("focus 시 primary outline을 표시해요", () => {
    render(
      <AdminButton
        label="삭제"
        variant="danger"
        onClick={() => {}}
      />
    )

    const button = screen.getByRole("button", { name: "삭제" })
    fireEvent.focus(button)

    expect(button).toHaveStyle({
      outline: "2px solid var(--color-primary)",
      outlineOffset: "2px"
    })
  })

  it("transition은 background-color, color, transform만 사용해요", () => {
    render(
      <AdminButton
        label="삭제"
        variant="danger"
        onClick={() => {}}
      />
    )

    expect(screen.getByRole("button", { name: "삭제" })).toHaveStyle({
      transition:
        "background-color 150ms ease, color 150ms ease, transform 150ms ease"
    })
  })
})

describe("UserMembershipTable", () => {
  it("유저와 이메일 셀이 가운데 정렬돼요", () => {
    render(
      <UserMembershipTable
        users={adminUsers}
        plans={plans}
        isSubmitting={false}
        onGrant={() => {}}
        onRevoke={() => {}}
      />
    )

    expect(screen.getByText("Alice Kim").closest("td")).toHaveStyle({
      textAlign: "center"
    })
    expect(screen.getByText("alice@example.com").closest("td")).toHaveStyle({
      textAlign: "center"
    })
  })

  it("멤버십이 없으면 삭제 버튼이 unavailable cursor를 써요", () => {
    render(
      <UserMembershipTable
        users={adminUsers}
        plans={plans}
        isSubmitting={false}
        onGrant={() => {}}
        onRevoke={() => {}}
      />
    )

    const deleteButtons = screen.getAllByRole("button", { name: "삭제" })
    expect(deleteButtons[1]).toHaveStyle({ cursor: "not-allowed" })
  })
})
