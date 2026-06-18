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

  it("audioBlobUrl이 있으면 재생 버튼 hover 시 brightness(0.9)와 primary 텍스트를 적용해요", () => {
    const playMock = vi.fn()
    const audioConstructor = vi.fn(() => ({ play: playMock }))
    vi.stubGlobal("Audio", audioConstructor)

    render(
      <ChatBubble
        role="assistant"
        content="Audio reply"
        createdAt="2026-07-17T12:03:00+09:00"
        audioBlobUrl="blob:audio-reply"
      />
    )

    const replayButton = screen.getByRole("button", { name: "재생" })
    fireEvent.mouseEnter(replayButton)

    expect(replayButton).toHaveStyle({
      filter: "brightness(0.9)",
      color: "var(--color-text-primary)"
    })

    fireEvent.click(replayButton)

    expect(audioConstructor).toHaveBeenCalledWith("blob:audio-reply")
    expect(playMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it("audioBlobUrl이 없고 onReplay가 없으면 재생 버튼을 렌더링하지 않아요", () => {
    render(
      <ChatBubble
        role="assistant"
        content="No replay"
        createdAt="2026-07-17T12:04:00+09:00"
      />
    )

    expect(screen.queryByRole("button", { name: "재생" })).not.toBeInTheDocument()
  })
})
