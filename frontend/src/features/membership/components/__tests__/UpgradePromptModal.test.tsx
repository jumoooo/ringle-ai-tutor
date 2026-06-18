import { fireEvent, render, screen } from "@testing-library/react"
import UpgradePromptModal from "@/features/membership/components/UpgradePromptModal"

describe("UpgradePromptModal", () => {
  it("open=false이면 렌더되지 않아요", () => {
    render(
      <UpgradePromptModal
        open={false}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )
    expect(screen.queryByText("멤버십이 필요해요")).not.toBeInTheDocument()
  })

  it("open=true이면 제목이 렌더돼요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )
    expect(screen.getByText("멤버십이 필요해요")).toBeInTheDocument()
  })

  it("requiredPlanName이 안내 텍스트에 포함돼요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )
    expect(screen.getByText(/프리미엄 플러스/)).toBeInTheDocument()
  })

  it("닫기 버튼 클릭 시 onClose가 호출돼요", () => {
    const onClose = vi.fn()
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("onGoPlans 없으면 플랜 구매하기 버튼이 없어요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )
    expect(screen.queryByRole("button", { name: "플랜 구매하기" })).not.toBeInTheDocument()
  })

  it("ESC 키 누르면 onClose가 호출돼요", () => {
    const onClose = vi.fn()
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={onClose}
      />
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("featureName이 학습이면 베이직 안내 문구가 보여요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="학습"
        requiredPlanName="베이직"
        onClose={() => {}}
      />
    )

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "학습 기능은 베이직 이상 멤버십이 필요해요."
      )
    ).toBeInTheDocument()
  })

  it("featureName이 대화이면 대화 안내 문구가 보여요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "대화 기능은 프리미엄 플러스 이상 멤버십이 필요해요."
      )
    ).toBeInTheDocument()
  })

  it("onGoPlans가 있으면 플랜 구매하기 버튼이 보여요", () => {
    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
        onGoPlans={() => {}}
      />
    )

    expect(
      screen.getByRole("button", { name: "플랜 구매하기" })
    ).toBeInTheDocument()
  })

  it("플랜 구매하기 클릭 시 onGoPlans와 onClose가 모두 호출돼요", () => {
    const onGoPlans = vi.fn()
    const onClose = vi.fn()

    render(
      <UpgradePromptModal
        open={true}
        featureName="대화"
        requiredPlanName="프리미엄 플러스"
        onClose={onClose}
        onGoPlans={onGoPlans}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "플랜 구매하기" }))

    expect(onGoPlans).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
