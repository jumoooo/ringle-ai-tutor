import { fireEvent, render, screen } from "@testing-library/react"
import UpgradePromptModal from "@/features/membership/components/UpgradePromptModal"

describe("UpgradePromptModal", () => {
  it("open=false이면 렌더되지 않아요", () => {
    render(
      <UpgradePromptModal
        open={false}
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
        requiredPlanName="프리미엄 플러스"
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("플랜 보기 버튼은 표시되지 않아요", () => {
    render(
      <UpgradePromptModal
        open={true}
        requiredPlanName="프리미엄 플러스"
        onClose={() => {}}
      />
    )
    expect(screen.queryByRole("button", { name: "플랜 보기" })).not.toBeInTheDocument()
  })

  it("ESC 키 누르면 onClose가 호출돼요", () => {
    const onClose = vi.fn()
    render(
      <UpgradePromptModal
        open={true}
        requiredPlanName="프리미엄 플러스"
        onClose={onClose}
      />
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
