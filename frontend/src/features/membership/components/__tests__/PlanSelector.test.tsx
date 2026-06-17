import { fireEvent, render, screen } from "@testing-library/react"
import PlanSelector from "@/features/membership/components/PlanSelector"
import type { Membership, Plan } from "@/types/membership"

const plans: Plan[] = [
  {
    id: 2,
    name: "basic",
    monthly_price: 9900,
    can_learn: true,
    can_talk: false,
    can_analyze: false,
    duration_days: 30
  },
  {
    id: 3,
    name: "standard",
    monthly_price: 19900,
    can_learn: true,
    can_talk: true,
    can_analyze: false,
    duration_days: 30
  },
  {
    id: 4,
    name: "premium",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 30
  }
]

const currentMembership: Membership = {
  id: 1,
  status: "active",
  expires_at: "2026-07-17T12:00:00+09:00",
  plan: plans[1]
}

describe("PlanSelector", () => {
  it("현재 플랜은 비활성 버튼으로 표시해요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={currentMembership}
        onPurchase={() => {}}
        onUpgrade={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByText("현재 플랜")).toBeDisabled()
  })

  it("상위 플랜은 업그레이드로 호출해요", () => {
    const onUpgrade = vi.fn()

    render(
      <PlanSelector
        plans={plans}
        currentMembership={currentMembership}
        onPurchase={() => {}}
        onUpgrade={onUpgrade}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "업그레이드" }))

    expect(onUpgrade).toHaveBeenCalledWith(4)
  })

  it("멤버십이 없으면 구매로 호출해요", () => {
    const onPurchase = vi.fn()

    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onPurchase={onPurchase}
        onUpgrade={() => {}}
        isPending={false}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "구매" })[0])

    expect(onPurchase).toHaveBeenCalledWith(2)
  })
})
