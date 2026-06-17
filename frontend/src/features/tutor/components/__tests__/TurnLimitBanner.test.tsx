import { fireEvent, render, screen } from "@testing-library/react"
import TurnLimitBanner from "@/features/tutor/components/TurnLimitBanner"

describe("TurnLimitBanner", () => {
  it("최대 턴 안내 문구를 렌더링해요", () => {
    render(<TurnLimitBanner onNew={() => {}} />)

    expect(screen.getByText(/20턴/)).toBeInTheDocument()
  })

  it("새 대화 버튼 클릭 시 콜백을 호출해요", () => {
    const onNew = vi.fn()

    render(<TurnLimitBanner onNew={onNew} />)

    fireEvent.click(screen.getByRole("button", { name: "새 대화 시작" }))

    expect(onNew).toHaveBeenCalledTimes(1)
  })
})
