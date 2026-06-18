import { act, fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import type { Membership, Plan } from "@/types/membership"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ userId: 1 })
}))

vi.mock("@/features/membership/hooks/useMembership", () => ({
  useMembership: vi.fn(),
  usePlans: vi.fn(),
  usePurchase: vi.fn()
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
  useMembership,
  usePlans,
  usePurchase
} from "@/features/membership/hooks/useMembership"

const plans: Plan[] = [
  {
    id: 4,
    name: "프리미엄 플러스",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 60
  }
]

const activeMembership: Membership = {
  id: 1,
  status: "active",
  expires_at: "2099-01-01T00:00:00+09:00",
  plan: plans[0]
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
  planList = plans,
  mutate = vi.fn(),
  refetch = vi.fn()
}: {
  membership?: Membership | null
  isLoading?: boolean
  planList?: Plan[]
  mutate?: ReturnType<typeof vi.fn>
  refetch?: ReturnType<typeof vi.fn>
} = {}) {
  vi.mocked(useMembership).mockReturnValue({
    data: membership ?? undefined,
    isLoading,
    refetch
  } as unknown as ReturnType<typeof useMembership>)

  vi.mocked(usePlans).mockReturnValue({
    data: planList,
    isLoading: false
  } as unknown as ReturnType<typeof usePlans>)

  vi.mocked(usePurchase).mockReturnValue({
    mutate,
    isPending: false
  } as unknown as ReturnType<typeof usePurchase>)
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

  it("UpgradePromptModal '닫기' 클릭 시 모달이 닫혀요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "대화 시작" }))
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))

    expect(screen.queryByText("멤버십이 필요해요")).not.toBeInTheDocument()
  })

  // ── 구매 플로우 ─────────────────────────────────────────
  it("플랜 '구매' 클릭 시 PaymentModal이 열려요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))

    expect(screen.getByText("결제 정보 입력")).toBeInTheDocument()
  })

  it("PaymentModal '취소' 클릭 시 모달이 닫혀요", () => {
    setupMocks({ membership: null })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "취소" }))

    expect(screen.queryByText("결제 정보 입력")).not.toBeInTheDocument()
  })

  it("결제 완료 클릭 시 mutate가 planId와 cardData를 받아요", () => {
    const mutate = vi.fn()
    setupMocks({ membership: null, mutate })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0]).toMatchObject({
      planId: 4,
      cardData: expect.objectContaining({ card_number: expect.any(String) })
    })
  })

  it("onSuccess 콜백 호출 시 PaymentModal이 닫혀요", () => {
    const mutate = vi.fn()
    setupMocks({ membership: null, mutate })
    render(<HomePage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    const onSuccess = mutate.mock.calls[0][1]?.onSuccess as () => void
    act(() => { onSuccess() })

    expect(screen.queryByText("결제 정보 입력")).not.toBeInTheDocument()
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
