import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Layout from "@/components/Layout"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn()
}))

vi.mock("@/features/membership/hooks/useMembership", () => ({
  useMembership: vi.fn()
}))

vi.mock("@/hooks/useCurrentUserProfile", () => ({
  useCurrentUserProfile: vi.fn()
}))

vi.mock("@/components/UserDropdown", () => ({
  default: () => <div>User Menu</div>
}))

import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useMembership } from "@/features/membership/hooks/useMembership"
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile"

function makeWrapper(initialEntries: string[] = ["/"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe("Layout", () => {
  beforeEach(() => {
    vi.mocked(useMembership).mockReturnValue({
      data: undefined,
      isLoading: false
    } as unknown as ReturnType<typeof useMembership>)
  })

  it("admin role이면 어드민 탭이 보여요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: {
        id: 1,
        name: "Alice Kim",
        email: "alice@example.com",
        role: "admin"
      }
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.getByRole("link", { name: "관리자" })).toBeInTheDocument()
  })

  it("role이 없으면 어드민 탭이 숨겨져요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 2
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: {
        id: 2,
        name: "Bob Lee",
        email: "bob@example.com",
        role: null
      }
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.queryByRole("link", { name: "관리자" })).not.toBeInTheDocument()
  })

  it("userId가 없으면 어드민 탭이 숨겨져요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.queryByRole("link", { name: "관리자" })).not.toBeInTheDocument()
  })

  it("구매 링크가 항상 보여요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.getByRole("link", { name: "구매" })).toBeInTheDocument()
  })

  it("inactive 링크에서 hover 시 backgroundColor가 --color-surface로 바뀐다", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)
    vi.mocked(useMembership).mockReturnValue({
      data: {
        id: 1,
        status: "active",
        expires_at: "2099-01-01T00:00:00+09:00",
        plan: { id: 1, name: "베이직", monthly_price: 9900, can_learn: true, can_talk: false, can_analyze: false, duration_days: 30 }
      },
      isLoading: false
    } as unknown as ReturnType<typeof useMembership>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper(["/chat"]) })

    const learnLink = screen.getByRole("link", { name: "학습" })
    expect(learnLink).not.toHaveStyle({
      backgroundColor: "var(--color-surface)"
    })

    fireEvent.mouseEnter(learnLink)

    expect(learnLink).toHaveStyle({
      backgroundColor: "var(--color-surface)"
    })
  })

  it("active 링크에서 hover 시 backgroundColor가 바뀌지 않는다", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)
    vi.mocked(useMembership).mockReturnValue({
      data: {
        id: 1,
        status: "active",
        expires_at: "2099-01-01T00:00:00+09:00",
        plan: { id: 1, name: "베이직", monthly_price: 9900, can_learn: true, can_talk: false, can_analyze: false, duration_days: 30 }
      },
      isLoading: false
    } as unknown as ReturnType<typeof useMembership>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper(["/learn"]) })

    const learnLink = screen.getByRole("link", { name: "학습" })
    expect(learnLink).toHaveStyle({
      backgroundColor: "var(--color-primary)"
    })

    fireEvent.mouseEnter(learnLink)

    expect(learnLink).toHaveStyle({
      backgroundColor: "var(--color-primary)"
    })
  })

  it("멤버십 없으면 학습 탭이 숨겨져요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)
    vi.mocked(useMembership).mockReturnValue({
      data: undefined,
      isLoading: false
    } as unknown as ReturnType<typeof useMembership>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.queryByRole("link", { name: "학습" })).not.toBeInTheDocument()
  })

  it("구매 링크가 항상 보여요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null
    } as unknown as ReturnType<typeof useCurrentUser>)
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(<Layout>content</Layout>, { wrapper: makeWrapper() })

    expect(screen.getByRole("link", { name: "구매" })).toBeInTheDocument()
  })
})
