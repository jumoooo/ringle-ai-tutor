import { fireEvent, render, screen } from "@testing-library/react"
import VoiceInput from "@/features/tutor/components/VoiceInput"

describe("VoiceInput", () => {
  it("마이크 켜기 버튼 hover 시 primary-dark 배경과 scale(1.05)를 적용해요", () => {
    render(
      <VoiceInput
        isActive={false}
        isDisabled={false}
        chatState="idle"
        onToggleMic={() => {}}
        onSubmit={() => {}}
      />
    )

    const micButton = screen.getByRole("button", { name: "마이크 켜기" })
    fireEvent.mouseEnter(micButton)

    expect(micButton).toHaveStyle({
      backgroundColor: "var(--color-primary-dark)",
      transform: "scale(1.05)"
    })
  })

  it("마이크 끄기 버튼 hover 시 brightness(0.85)를 적용해요", () => {
    render(
      <VoiceInput
        isActive={true}
        isDisabled={false}
        chatState="recording"
        onToggleMic={() => {}}
        onSubmit={() => {}}
      />
    )

    const micButton = screen.getByRole("button", { name: "마이크 끄기" })
    fireEvent.mouseEnter(micButton)

    expect(micButton).toHaveStyle({
      filter: "brightness(0.85)",
      transform: "scale(1.05)"
    })
  })

  it("답변 완료 버튼 hover 시 primary-light 배경과 primary 텍스트를 적용해요", () => {
    render(
      <VoiceInput
        isActive={true}
        isDisabled={false}
        chatState="recording"
        onToggleMic={() => {}}
        onSubmit={() => {}}
      />
    )

    const completeButton = screen.getByRole("button", { name: "답변 완료" })
    fireEvent.mouseEnter(completeButton)

    expect(completeButton).toHaveStyle({
      backgroundColor: "var(--color-primary-light)",
      color: "var(--color-primary)"
    })
  })

  it("disabled 상태에서는 hover 진입해도 스타일이 바뀌지 않아요", () => {
    render(
      <VoiceInput
        isActive={false}
        isDisabled={true}
        chatState="idle"
        onToggleMic={() => {}}
        onSubmit={() => {}}
      />
    )

    const micButton = screen.getByRole("button", { name: "마이크 켜기" })
    fireEvent.mouseEnter(micButton)

    expect(micButton).toHaveStyle({
      backgroundColor: "var(--color-primary)",
      transform: "scale(1)",
      filter: "none",
      opacity: "0.6"
    })
  })
})
