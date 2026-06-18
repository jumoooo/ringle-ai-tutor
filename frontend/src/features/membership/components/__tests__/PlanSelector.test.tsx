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
        onSelectPlan={() => {}}
      />
    )
    expect(screen.getByText("현재 플랜")).toBeDisabled()
  })

  it("현재 플랜이 아닌 플랜은 구매 버튼으로 표시해요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={currentMembership}
        onSelectPlan={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: "구매" })).toBeInTheDocument()
  })

  it("구매 버튼 클릭 시 onSelectPlan이 해당 plan 객체와 함께 호출돼요", () => {
    const onSelectPlan = vi.fn()
    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onSelectPlan={onSelectPlan}
      />
    )

    const buttons = screen.getAllByRole("button", { name: "구매" })
    fireEvent.click(buttons[0])

    expect(onSelectPlan).toHaveBeenCalledTimes(1)
    expect(onSelectPlan).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(Number) }))
  })

  it("isPending=true이면 구매 버튼이 disabled돼요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onSelectPlan={() => {}}
        isPending={true}
      />
    )

    const buttons = screen.getAllByRole("button", { name: "구매" })
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it("구매 버튼은 공통 Button transition을 사용해요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onSelectPlan={() => {}}
      />
    )

    expect(screen.getAllByRole("button", { name: "구매" })[0]).toHaveStyle({
      transition:
        "background-color 150ms ease, color 150ms ease, transform 150ms ease"
    })
  })

  it("모든 플랜 액션 버튼이 동일한 data-testid를 가져요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={currentMembership}
        onSelectPlan={() => {}}
      />
    )

    const actionBtns = screen.getAllByTestId("plan-action-btn")
    expect(actionBtns.length).toBe(2)
    const heights = actionBtns.map((btn) => (btn as HTMLButtonElement).style.minHeight)
    expect(new Set(heights).size).toBe(1)
  })

  it("프리미엄 플러스가 베이직보다 먼저 렌더돼요", () => {
    render(
      <PlanSelector
        plans={plans}
        currentMembership={null}
        onSelectPlan={() => {}}
      />
    )

    const articles = screen.getAllByRole("article")
    expect(articles[0]).toHaveTextContent("프리미엄 플러스")
    expect(articles[1]).toHaveTextContent("베이직")
  })
})
