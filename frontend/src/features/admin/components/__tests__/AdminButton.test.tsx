import { fireEvent, render, screen } from "@testing-library/react"
import type { ButtonProps } from "@/components/ui/Button"
import AdminButton from "@/features/admin/components/AdminButton"
import UserMembershipTable from "@/features/admin/components/UserMembershipTable"
import type { AdminUser } from "@/features/admin/api"
import type { Plan } from "@/types/membership"

vi.mock("@/components/ui/Button", () => ({
  default: ({
    label,
    variant,
    onClick,
    disabled = false,
    disabledReason = null
  }: ButtonProps) => (
    <button
      type="button"
      data-testid={`mock-button-${label}`}
      data-variant={variant}
      data-disabled-reason={disabledReason ?? ""}
      disabled={disabled}
      onClick={onClick}
      style={{ cursor: disabledReason === "submitting" ? "progress" : disabled ? "not-allowed" : "pointer" }}
    >
      {label}
    </button>
  )
}))

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
  it("plan-inactive variant를 secondary Button으로 위임해요", () => {
    render(
      <AdminButton
        label="프리미엄 플러스"
        variant="plan-inactive"
        onClick={() => {}}
      />
    )

    expect(screen.getByTestId("mock-button-프리미엄 플러스")).toHaveAttribute(
      "data-variant",
      "secondary"
    )
  })

  it("disabledReason=\"submitting\"을 Button에 그대로 위임해요", () => {
    render(
      <AdminButton
        label="현재 플랜"
        variant="plan-active"
        onClick={() => {}}
        disabled
        disabledReason="submitting"
      />
    )

    expect(screen.getByTestId("mock-button-현재 플랜")).toHaveAttribute(
      "data-disabled-reason",
      "submitting"
    )
  })

  it("danger variant를 danger Button으로 위임해요", () => {
    render(
      <AdminButton
        label="삭제"
        variant="danger"
        onClick={() => {}}
      />
    )

    expect(screen.getByTestId("mock-button-삭제")).toHaveAttribute(
      "data-variant",
      "danger"
    )
  })

  it("onClick 동작은 그대로 유지해요", () => {
    const handleClick = vi.fn()
    render(
      <AdminButton
        label="구매"
        variant="plan-active"
        onClick={handleClick}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "구매" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
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
