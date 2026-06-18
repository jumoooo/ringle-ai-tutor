import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import type { Membership } from "@/types/membership"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    userId: 1,
    selectUser: vi.fn(),
    clearUser: vi.fn()
  })
}))

vi.mock("@/features/membership/hooks/useMembership", () => ({
  useMembership: vi.fn()
}))

const mockShowToast = vi.fn()
vi.mock("@/components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

const navigate = vi.fn()
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => navigate }
})

import {
  useMembership
} from "@/features/membership/hooks/useMembership"

const activeMembership: Membership = {
  id: 1,
  status: "active",
  expires_at: "2099-01-01T00:00:00+09:00",
  plan: {
    id: 4,
    name: "프리미엄 플러스",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 60
  }
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setupMocks({
  membership = null,
  isLoading = false,
  refetch = vi.fn()
}: {
  membership?: Membership | null
  isLoading?: boolean
  refetch?: ReturnType<typeof vi.fn>
} = {}) {
  vi.mocked(useMembership).mockReturnValue({
    data: membership ?? undefined,
    isLoading,
    refetch
  } as unknown as ReturnType<typeof useMembership>)
}

describe("HomePage", () => {
  beforeEach(() => {
    navigate.mockReset()
    mockShowToast.mockReset()
  })

  it("멤버십 없이 '대화 시작' 클릭 시 UpgradePromptModal이 열려요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "대화 시작" }))

    expect(screen.getByText("멤버십이 필요해요")).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("활성 can_talk 멤버십이 있으면 '대화 시작' 클릭 시 /chat으로 이동해요", () => {
    setupMocks({ membership: activeMembership })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "대화 시작" }))

    expect(navigate).toHaveBeenCalledWith("/chat")
  })

  it("\"학습 시작\" 버튼은 secondary Button 기준 배경을 사용해요", () => {
    setupMocks({ membership: activeMembership })
    render(<HomePage />, { wrapper: makeWrapper() })

    expect(screen.getByRole("button", { name: "학습 시작" })).toHaveStyle({
      backgroundColor: "var(--color-surface-subtle)",
      minHeight: "48px"
    })
  })

  it("로딩 중이면 대화 시작 버튼이 disabled돼요", () => {
    setupMocks({ membership: null, isLoading: true })
    render(<HomePage />, { wrapper: makeWrapper() })

    expect(screen.getByRole("button", { name: "대화 시작" })).toBeDisabled()
  })

  it("로딩 중이면 학습 시작 버튼이 disabled돼요", () => {
    setupMocks({ membership: null, isLoading: true })
    render(<HomePage />, { wrapper: makeWrapper() })

    expect(screen.getByRole("button", { name: "학습 시작" })).toBeDisabled()
  })

  it("UpgradePromptModal '닫기' 클릭 시 모달이 닫혀요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "대화 시작" }))
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))

    expect(screen.queryByText("멤버십이 필요해요")).not.toBeInTheDocument()
  })

  it("멤버십 없이 학습 시작 클릭 시 학습 업그레이드 모달이 열려요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "학습 시작" }))

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "학습 기능은 베이직 이상 멤버십이 필요해요."
      )
    ).toBeInTheDocument()
  })

  it("학습 업그레이드 모달에서 플랜 구매하기 클릭 시 /plans로 이동해요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "학습 시작" }))
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "플랜 구매하기" })
    )

    expect(navigate).toHaveBeenCalledWith("/plans")
  })

  it("만료까지 32비트 한계(24.8일)를 초과하면 만료 토스트를 표시하지 않아요", () => {
    vi.useFakeTimers()

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    setupMocks({
      membership: { ...activeMembership, expires_at: expiresAt }
    })
    render(<HomePage />, { wrapper: makeWrapper() })

    act(() => { vi.advanceTimersByTime(2_200_000_000) })

    expect(mockShowToast).not.toHaveBeenCalledWith(
      "멤버십이 만료되었습니다. 플랜을 구매하세요.",
      "info"
    )

    vi.useRealTimers()
  })

  it("만료까지 24.8일 미만이면 만료 시 토스트를 표시해요", () => {
    vi.useFakeTimers()

    const oneHourMs = 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + oneHourMs).toISOString()
    const refetch = vi.fn()
    setupMocks({
      membership: { ...activeMembership, expires_at: expiresAt },
      refetch
    })
    render(<HomePage />, { wrapper: makeWrapper() })

    act(() => { vi.advanceTimersByTime(oneHourMs + 100) })

    expect(mockShowToast).toHaveBeenCalledWith(
      "멤버십이 만료되었습니다. 플랜을 구매하세요.",
      "info"
    )
    expect(refetch).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("이미 만료된 멤버십은 타이머 없이 즉시 refetch해요", () => {
    const refetch = vi.fn()
    const expiresAt = new Date(Date.now() - 1000).toISOString()
    setupMocks({
      membership: { ...activeMembership, expires_at: expiresAt },
      refetch
    })
    render(<HomePage />, { wrapper: makeWrapper() })

    expect(refetch).toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalledWith(
      "멤버십이 만료되었습니다. 플랜을 구매하세요.",
      "info"
    )
  })
})
