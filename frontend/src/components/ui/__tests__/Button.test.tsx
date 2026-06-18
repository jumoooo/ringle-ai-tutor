import { fireEvent, render, screen } from "@testing-library/react"
import Button from "@/components/ui/Button"

describe("Button", () => {
  it("variant=\"primary\" 렌더링 시 label이 표시된다", () => {
    render(<Button label="대화 시작" variant="primary" onClick={() => {}} />)

    expect(screen.getByRole("button", { name: "대화 시작" })).toBeInTheDocument()
  })

  it("variant=\"secondary\" 렌더링 시 label이 표시된다", () => {
    render(<Button label="학습 시작" variant="secondary" onClick={() => {}} />)

    expect(screen.getByRole("button", { name: "학습 시작" })).toBeInTheDocument()
  })

  it("variant=\"ghost\" 렌더링 시 label이 표시된다", () => {
    render(<Button label="초기화" variant="ghost" onClick={() => {}} />)

    expect(screen.getByRole("button", { name: "초기화" })).toBeInTheDocument()
  })

  it("onClick이 호출된다", () => {
    const handleClick = vi.fn()
    render(<Button label="구매" variant="primary" onClick={handleClick} />)

    fireEvent.click(screen.getByRole("button", { name: "구매" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("disabled 시 onClick이 호출되지 않는다", () => {
    const handleClick = vi.fn()
    render(
      <Button
        label="현재 플랜"
        variant="primary"
        onClick={handleClick}
        disabled
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "현재 플랜" }))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it("disabledReason=\"submitting\" 시 cursor가 progress다", () => {
    render(
      <Button
        label="구매"
        variant="primary"
        onClick={() => {}}
        disabled
        disabledReason="submitting"
      />
    )

    expect(screen.getByRole("button", { name: "구매" })).toHaveStyle({
      cursor: "progress"
    })
  })

  it("disabledReason=\"unavailable\" 시 cursor가 not-allowed다", () => {
    render(
      <Button
        label="학습 시작"
        variant="secondary"
        onClick={() => {}}
        disabled
        disabledReason="unavailable"
      />
    )

    expect(screen.getByRole("button", { name: "학습 시작" })).toHaveStyle({
      cursor: "not-allowed"
    })
  })

  it("hover 시 primary variant에서 backgroundColor가 --color-primary-dark로 바뀐다", () => {
    render(<Button label="대화 시작" variant="primary" onClick={() => {}} />)

    const button = screen.getByRole("button", { name: "대화 시작" })
    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle({
      backgroundColor: "var(--color-primary-dark)"
    })
  })

  it("mouseLeave 시 backgroundColor가 --color-primary로 돌아온다", () => {
    render(<Button label="대화 시작" variant="primary" onClick={() => {}} />)

    const button = screen.getByRole("button", { name: "대화 시작" })
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)

    expect(button).toHaveStyle({
      backgroundColor: "var(--color-primary)"
    })
  })

  it("focus 시 outline이 primary 색으로 표시된다", () => {
    render(<Button label="대화 시작" variant="primary" onClick={() => {}} />)

    const button = screen.getByRole("button", { name: "대화 시작" })
    fireEvent.focus(button)

    expect(button).toHaveStyle({
      outline: "2px solid var(--color-primary)",
      outlineOffset: "2px"
    })
  })

  it("transition은 background-color, color, transform만 사용한다", () => {
    render(<Button label="대화 시작" variant="primary" onClick={() => {}} />)

    expect(screen.getByRole("button", { name: "대화 시작" })).toHaveStyle({
      transition:
        "background-color 150ms ease, color 150ms ease, transform 150ms ease"
    })
  })

  it("minHeight prop이 적용된다 (기본 \"36px\", override 시 해당 값 반영)", () => {
    const { rerender } = render(
      <Button label="기본 높이" variant="secondary" onClick={() => {}} />
    )

    expect(screen.getByRole("button", { name: "기본 높이" })).toHaveStyle({
      minHeight: "36px"
    })

    rerender(
      <Button
        label="기본 높이"
        variant="secondary"
        onClick={() => {}}
        minHeight="48px"
      />
    )

    expect(screen.getByRole("button", { name: "기본 높이" })).toHaveStyle({
      minHeight: "48px"
    })
  })
})
