import { act, fireEvent, render, screen } from "@testing-library/react"
import PaymentModal from "@/features/membership/components/PaymentModal"
import type { CardData } from "@/types/payment"

function renderModal(props: Partial<React.ComponentProps<typeof PaymentModal>> = {}) {
  const defaults = {
    open: true,
    planName: "프리미엄 플러스",
    onConfirm: (_cardData: CardData) => {},
    onClose: () => {},
    isPending: false,
  }
  return render(<PaymentModal {...defaults} {...props} />)
}

describe("PaymentModal", () => {
  // ── 기본 렌더 ──────────────────────────────────────────
  it("open=false이면 렌더되지 않아요", () => {
    renderModal({ open: false })
    expect(screen.queryByText("결제 정보 입력")).not.toBeInTheDocument()
  })

  it("open=true이면 제목이 렌더돼요", () => {
    renderModal()
    expect(screen.getByText("결제 정보 입력")).toBeInTheDocument()
  })

  it("planName이 모달 안에 표시돼요", () => {
    renderModal()
    expect(screen.getByText(/프리미엄 플러스/)).toBeInTheDocument()
  })

  // ── 카드번호 4-input ────────────────────────────────────
  it("카드번호 input이 4개 렌더돼요", () => {
    renderModal()
    expect(screen.getByLabelText("카드번호 1번째 4자리")).toBeInTheDocument()
    expect(screen.getByLabelText("카드번호 2번째 4자리")).toBeInTheDocument()
    expect(screen.getByLabelText("카드번호 3번째 4자리")).toBeInTheDocument()
    expect(screen.getByLabelText("카드번호 4번째 4자리")).toBeInTheDocument()
  })

  it("카드번호 1번째에 4자리 입력하면 2번째 input으로 포커스가 이동해요", () => {
    renderModal()
    const first = screen.getByLabelText("카드번호 1번째 4자리")
    const second = screen.getByLabelText("카드번호 2번째 4자리")
    fireEvent.change(first, { target: { value: "1234" } })
    expect(document.activeElement).toBe(second)
  })

  it("카드번호 4번째에 4자리 입력하면 유효기간 월 input으로 포커스가 이동해요", () => {
    renderModal()
    const fourth = screen.getByLabelText("카드번호 4번째 4자리")
    fireEvent.change(fourth, { target: { value: "5678" } })
    expect(document.activeElement).toBe(screen.getByLabelText("유효기간 월"))
  })

  it("카드번호 2번째 input이 비어있을 때 Backspace 누르면 1번째로 포커스가 이동해요", () => {
    renderModal()
    const second = screen.getByLabelText("카드번호 2번째 4자리")
    const first = screen.getByLabelText("카드번호 1번째 4자리")
    second.focus()
    fireEvent.keyDown(second, { key: "Backspace" })
    expect(document.activeElement).toBe(first)
  })

  // ── 유효기간 MM/YY ──────────────────────────────────────
  it("유효기간 월·연도 input과 / 구분자가 렌더돼요", () => {
    renderModal()
    expect(screen.getByLabelText("유효기간 월")).toBeInTheDocument()
    expect(screen.getByLabelText("유효기간 연도")).toBeInTheDocument()
    expect(screen.getByText("/")).toBeInTheDocument()
  })

  it("유효기간 월에 2자리 입력하면 연도 input으로 포커스가 이동해요", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText("유효기간 월"), { target: { value: "12" } })
    expect(document.activeElement).toBe(screen.getByLabelText("유효기간 연도"))
  })

  it("유효기간 연도에 2자리 입력하면 CVC input으로 포커스가 이동해요", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText("유효기간 연도"), { target: { value: "27" } })
    expect(document.activeElement).toBe(screen.getByLabelText("CVC"))
  })

  it("유효기간 연도가 비어있을 때 Backspace 누르면 월 input으로 포커스가 이동해요", () => {
    renderModal()
    const yy = screen.getByLabelText("유효기간 연도")
    yy.focus()
    fireEvent.keyDown(yy, { key: "Backspace" })
    expect(document.activeElement).toBe(screen.getByLabelText("유효기간 월"))
  })

  // ── CVC → 결제 완료 버튼 ────────────────────────────────
  it("CVC에 3자리 입력하면 결제 완료 버튼으로 포커스가 이동해요", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText("CVC"), { target: { value: "123" } })
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "결제 완료" }))
  })

  // ── 결제 완료 클릭 → CardData 전달 ──────────────────────
  it("결제 완료 버튼 클릭 시 onConfirm에 CardData가 전달돼요", () => {
    const onConfirm = vi.fn()
    renderModal({ onConfirm })

    fireEvent.change(screen.getByLabelText("카드번호 1번째 4자리"), { target: { value: "1234" } })
    fireEvent.change(screen.getByLabelText("카드번호 2번째 4자리"), { target: { value: "5678" } })
    fireEvent.change(screen.getByLabelText("카드번호 3번째 4자리"), { target: { value: "9012" } })
    fireEvent.change(screen.getByLabelText("카드번호 4번째 4자리"), { target: { value: "3456" } })
    fireEvent.change(screen.getByLabelText("유효기간 월"), { target: { value: "12" } })
    fireEvent.change(screen.getByLabelText("유효기간 연도"), { target: { value: "27" } })
    fireEvent.change(screen.getByLabelText("CVC"), { target: { value: "123" } })

    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith({
      card_number: "1234567890123456",
      expiry: "12/27",
      cvc: "123",
    } satisfies CardData)
  })

  // ── isPending 상태 — 결제중 애니메이션 ──────────────────
  it("isPending=true이면 '결제중.' 텍스트로 시작해요", () => {
    vi.useFakeTimers()
    renderModal({ isPending: true })
    expect(screen.getByRole("button", { name: "결제중." })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it("isPending=true 400ms 후 '결제중..' 으로 변해요", () => {
    vi.useFakeTimers()
    renderModal({ isPending: true })

    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole("button", { name: "결제중.." })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole("button", { name: "결제중..." })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole("button", { name: "결제중.." })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole("button", { name: "결제중." })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it("isPending=true이면 결제 완료 버튼이 disabled이에요", () => {
    renderModal({ isPending: true })
    expect(screen.getByRole("button", { name: /결제중/ })).toBeDisabled()
  })

  it("isPending=false가 되면 점 애니메이션이 리셋되고 '결제 완료' 텍스트로 돌아와요", () => {
    vi.useFakeTimers()
    const { rerender } = renderModal({ isPending: true })

    act(() => { vi.advanceTimersByTime(800) })
    expect(screen.getByRole("button", { name: "결제중..." })).toBeInTheDocument()

    rerender(
      <PaymentModal
        open={true}
        planName="프리미엄 플러스"
        onConfirm={() => {}}
        onClose={() => {}}
        isPending={false}
      />
    )
    expect(screen.getByRole("button", { name: "결제 완료" })).toBeInTheDocument()

    vi.useRealTimers()
  })

  // ── 버튼 동작 ───────────────────────────────────────────
  it("취소 버튼 클릭 시 onClose가 호출돼요", () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.click(screen.getByRole("button", { name: "취소" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("ESC 키 누르면 onClose가 호출돼요", () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── 입력값 초기화 ────────────────────────────────────────
  it("모달을 닫으면 입력값이 초기화돼요", () => {
    const { rerender } = renderModal({ open: true })

    fireEvent.change(screen.getByLabelText("카드번호 1번째 4자리"), {
      target: { value: "1234" }
    })
    expect(screen.getByLabelText("카드번호 1번째 4자리")).toHaveValue("1234")

    rerender(
      <PaymentModal
        open={false}
        planName="프리미엄 플러스"
        onConfirm={() => {}}
        onClose={() => {}}
        isPending={false}
      />
    )
    rerender(
      <PaymentModal
        open={true}
        planName="프리미엄 플러스"
        onConfirm={() => {}}
        onClose={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByLabelText("카드번호 1번째 4자리")).toHaveValue("")
  })
})
