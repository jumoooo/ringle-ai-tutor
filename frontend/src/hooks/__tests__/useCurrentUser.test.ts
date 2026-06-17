import { act, renderHook } from "@testing-library/react"
import { useCurrentUser } from "@/hooks/useCurrentUser"

describe("useCurrentUser", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("selectUser가 localStorage와 상태를 함께 갱신해요", () => {
    const { result } = renderHook(() => useCurrentUser())

    act(() => {
      result.current.selectUser(7)
    })

    expect(result.current.userId).toBe(7)
    expect(window.localStorage.getItem("selectedUserId")).toBe("7")
  })

  it("clearUser가 선택된 사용자와 대화 id를 함께 지워요", () => {
    window.localStorage.setItem("selectedUserId", "8")
    window.localStorage.setItem("lastConversationId", "99")

    const { result } = renderHook(() => useCurrentUser())

    act(() => {
      result.current.clearUser()
    })

    expect(result.current.userId).toBeNull()
    expect(window.localStorage.getItem("selectedUserId")).toBeNull()
    expect(window.localStorage.getItem("lastConversationId")).toBeNull()
  })
})
