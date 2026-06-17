import { fireEvent, render, screen } from "@testing-library/react"
import ChatBubble from "@/features/tutor/components/ChatBubble"

describe("ChatBubble", () => {
  it("assistant 메시지와 AI 라벨을 렌더링해요", () => {
    render(
      <ChatBubble
        role="assistant"
        content="Hello there"
        createdAt="2026-07-17T12:00:00+09:00"
      />
    )

    expect(screen.getByText("AI")).toBeInTheDocument()
    expect(screen.getByText("Hello there")).toBeInTheDocument()
  })

  it("user 메시지와 Me 라벨을 렌더링해요", () => {
    render(
      <ChatBubble
        role="user"
        content="Hi!"
        createdAt="2026-07-17T12:01:00+09:00"
      />
    )

    expect(screen.getByText("Me")).toBeInTheDocument()
    expect(screen.getByText("Hi!")).toBeInTheDocument()
  })

  it("assistant 재생 버튼 클릭 시 콜백을 호출해요", () => {
    const onReplay = vi.fn()

    render(
      <ChatBubble
        role="assistant"
        content="Replay me"
        createdAt="2026-07-17T12:02:00+09:00"
        onReplay={onReplay}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "재생" }))

    expect(onReplay).toHaveBeenCalledTimes(1)
  })
})
