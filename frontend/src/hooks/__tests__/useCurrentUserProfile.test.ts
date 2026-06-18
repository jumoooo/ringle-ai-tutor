import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { fetchCurrentUserProfile } from "@/api/users"
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile"

vi.mock("@/api/users", () => ({
  fetchCurrentUserProfile: vi.fn()
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("useCurrentUserProfile", () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUserProfile).mockReset()
  })

  it("userId가 있으면 프로필을 조회해요", async () => {
    vi.mocked(fetchCurrentUserProfile).mockResolvedValue({
      id: 1,
      name: "Alice Kim",
      email: "alice@example.com",
      role: "admin"
    })

    const { result } = renderHook(() => useCurrentUserProfile(1), {
      wrapper: makeWrapper()
    })

    await waitFor(() => {
      expect(result.current.data?.role).toBe("admin")
    })

    expect(fetchCurrentUserProfile).toHaveBeenCalledTimes(1)
  })

  it("userId가 없으면 조회를 건너뛰어요", () => {
    const { result } = renderHook(() => useCurrentUserProfile(null), {
      wrapper: makeWrapper()
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchCurrentUserProfile).not.toHaveBeenCalled()
  })

  it("role이 null인 응답도 유지해요", async () => {
    vi.mocked(fetchCurrentUserProfile).mockResolvedValue({
      id: 2,
      name: "Bob Lee",
      email: "bob@example.com",
      role: null
    })

    const { result } = renderHook(() => useCurrentUserProfile(2), {
      wrapper: makeWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 2,
        name: "Bob Lee",
        email: "bob@example.com",
        role: null
      })
    })
  })
})
