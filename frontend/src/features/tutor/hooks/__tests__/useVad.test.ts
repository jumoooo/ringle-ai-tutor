import { act, renderHook, waitFor } from "@testing-library/react"
import { useVad } from "../useVad"

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  },
  writable: true
})

let capturedOnSpeechEnd:
  | ((audio: Float32Array) => void)
  | undefined
let capturedOnSpeechStart: (() => void) | undefined

vi.mock("@ricky0123/vad-web", () => ({
  MicVAD: {
    new: vi.fn(
      async (options: {
        onSpeechEnd: (audio: Float32Array) => void
        onSpeechStart: () => void
        [key: string]: unknown
      }) => {
        capturedOnSpeechEnd = options.onSpeechEnd
        capturedOnSpeechStart = options.onSpeechStart
        return {
          start: vi.fn(),
          pause: vi.fn(),
          destroy: vi.fn()
        }
      }
    )
  }
}))

describe("useVad — 발화 시간 제한", () => {
  beforeEach(() => {
    capturedOnSpeechEnd = undefined
    capturedOnSpeechStart = undefined
  })

  it("30초 이하 발화는 error가 없고 submit이 true를 반환해요", async () => {
    const onSpeechDetected = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useVad({ onSpeechDetected }))

    await waitFor(() => expect(capturedOnSpeechEnd).toBeDefined())

    const shortAudio = new Float32Array(15 * 16000)

    act(() => {
      capturedOnSpeechEnd!(shortAudio)
    })

    expect(result.current.error).toBeNull()

    const submitted = await act(async () => result.current.submit())
    expect(submitted).toBe(true)
    expect(onSpeechDetected).toHaveBeenCalledTimes(1)
  })

  it("30초 초과 발화는 error를 설정하고 submit이 false를 반환해요", async () => {
    const onSpeechDetected = vi.fn()
    const { result } = renderHook(() => useVad({ onSpeechDetected }))

    await waitFor(() => expect(capturedOnSpeechEnd).toBeDefined())

    const longAudio = new Float32Array(31 * 16000)

    act(() => {
      capturedOnSpeechEnd!(longAudio)
    })

    expect(result.current.error).toContain("30초")

    const submitted = await act(async () => result.current.submit())
    expect(submitted).toBe(false)
    expect(onSpeechDetected).not.toHaveBeenCalled()
  })

  it("새 발화 시작 시 이전 error가 초기화돼요", async () => {
    const onSpeechDetected = vi.fn()
    const { result } = renderHook(() => useVad({ onSpeechDetected }))

    await waitFor(() => expect(capturedOnSpeechEnd).toBeDefined())
    await waitFor(() => expect(capturedOnSpeechStart).toBeDefined())

    const longAudio = new Float32Array(31 * 16000)
    act(() => {
      capturedOnSpeechEnd!(longAudio)
    })
    expect(result.current.error).not.toBeNull()

    act(() => {
      capturedOnSpeechStart!()
    })
    expect(result.current.error).toBeNull()
  })
})
