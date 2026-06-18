import { fireEvent, render, screen } from "@testing-library/react"
import PlanSelector from "@/features/membership/components/PlanSelector"
import type { Membership, Plan } from "@/types/membership"

const plans: Plan[] = [
  {
    id: 2,
    name: "베이직",
    monthly_price: 9900,
    can_learn: true,
    can_talk: false,
    can_analyze: false,
    duration_days: 30
  },
  {
    id: 4,
    name: "프리미엄 플러스",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 60
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
        isPending={false}
      />
    )

    expect(screen.getByText("현재 플랜")).toBeDisabled()
  })

  it("현재 플랜이 아닌 플랜은 구매 버튼으로 표시해요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={currentMembership}
        onPurchase={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByRole("button", { name: "구매" })).toBeInTheDocument()
  })

  it("멤버십이 없으면 모든 플랜에 구매 버튼이 표시돼요", () => {
    const onPurchase = vi.fn()

    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onPurchase={onPurchase}
        isPending={false}
      />
    )

    const buttons = screen.getAllByRole("button", { name: "구매" })
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])
    expect(onPurchase).toHaveBeenCalledWith(4)
  })

  it("프리미엄 플러스가 베이직보다 먼저 렌더돼요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onPurchase={() => {}}
        isPending={false}
      />
    )

    const articles = screen.getAllByRole("article")
    expect(articles[0]).toHaveTextContent("프리미엄 플러스")
    expect(articles[1]).toHaveTextContent("베이직")
  })
})
