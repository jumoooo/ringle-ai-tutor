import { act, fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import PlansPage from "@/pages/PlansPage"
import type { Membership, Plan } from "@/types/membership"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn()
}))

vi.mock("@/features/membership/hooks/useMembership", () => ({
  useMembership: vi.fn(),
  usePlans: vi.fn(),
  usePurchase: vi.fn()
}))

vi.mock("@/hooks/useCurrentUserProfile", () => ({
  useCurrentUserProfile: () => ({
    data: { role: null },
    isLoading: false
  })
}))

vi.mock("@/components/UserDropdown", () => ({
  default: () => <div data-testid="user-dropdown" />
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

import { useCurrentUser } from "@/hooks/useCurrentUser"
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
  userId = 1,
  membership = null,
  planList = plans,
  mutate = vi.fn()
}: {
  userId?: number | null
  membership?: Membership | null
  planList?: Plan[]
  mutate?: ReturnType<typeof vi.fn>
} = {}) {
  vi.mocked(useCurrentUser).mockReturnValue({
    userId,
    selectUser: vi.fn(),
    clearUser: vi.fn()
  })

  vi.mocked(useMembership).mockReturnValue({
    data: membership ?? undefined,
    isLoading: false,
    refetch: vi.fn()
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

describe("PlansPage", () => {
  beforeEach(() => {
    navigate.mockReset()
    mockShowToast.mockReset()
  })

  it("플랜 로딩 중에 스켈레톤을 표시해요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1,
      selectUser: vi.fn(),
      clearUser: vi.fn()
    })
    vi.mocked(useMembership).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn()
    } as unknown as ReturnType<typeof useMembership>)
    vi.mocked(usePlans).mockReturnValue({
      data: undefined,
      isLoading: true
    } as unknown as ReturnType<typeof usePlans>)
    vi.mocked(usePurchase).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    } as unknown as ReturnType<typeof usePurchase>)

    render(<PlansPage />, { wrapper: makeWrapper() })

    expect(screen.getAllByTestId("skeleton-block").length).toBeGreaterThan(0)
  })

  it("userId가 null이면 plan-card가 렌더되지 않아요", () => {
    setupMocks({ userId: null, membership: null })
    render(<PlansPage />, { wrapper: makeWrapper() })

    expect(screen.queryByTestId("plan-card")).not.toBeInTheDocument()
  })

  it("userId가 null이면 유저 선택 안내가 보여요", () => {
    setupMocks({ userId: null, membership: null })
    render(<PlansPage />, { wrapper: makeWrapper() })

    expect(screen.getByText("유저를 선택해주세요.")).toBeInTheDocument()
  })

  it("userId가 있으면 PlanSelector가 렌더돼요", () => {
    setupMocks({ membership: activeMembership })
    render(<PlansPage />, { wrapper: makeWrapper() })

    expect(screen.getByTestId("plan-card")).toBeInTheDocument()
  })

  it("플랜 구매 클릭 시 PaymentModal이 열려요", () => {
    setupMocks()
    render(<PlansPage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))

    expect(screen.getByText("결제 정보 입력")).toBeInTheDocument()
  })

  it("PaymentModal 취소 클릭 시 모달이 닫혀요", () => {
    setupMocks()
    render(<PlansPage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "취소" }))

    expect(screen.queryByText("결제 정보 입력")).not.toBeInTheDocument()
  })

  it("결제 완료 클릭 시 mutate가 planId와 cardData를 받아요", () => {
    const mutate = vi.fn()
    setupMocks({ mutate })
    render(<PlansPage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0]).toMatchObject({
      planId: 4,
      cardData: expect.objectContaining({ card_number: expect.any(String) })
    })
  })

  it("구매 성공 시 navigate('/')가 호출돼요", () => {
    const mutate = vi.fn()
    setupMocks({ mutate })
    render(<PlansPage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    const onSuccess = mutate.mock.calls[0][1]?.onSuccess as () => void
    act(() => {
      onSuccess()
    })

    expect(navigate).toHaveBeenCalledWith("/")
  })

  it("구매 성공 시 성공 토스트가 표시돼요", () => {
    const mutate = vi.fn()
    setupMocks({ mutate })
    render(<PlansPage />, { wrapper: makeWrapper() })

    fireEvent.click(screen.getByRole("button", { name: "구매" }))
    fireEvent.click(screen.getByRole("button", { name: "결제 완료" }))

    const onSuccess = mutate.mock.calls[0][1]?.onSuccess as () => void
    act(() => {
      onSuccess()
    })

    expect(mockShowToast).toHaveBeenCalledWith(
      "멤버십이 활성화되었어요.",
      "success"
    )
  })
})
