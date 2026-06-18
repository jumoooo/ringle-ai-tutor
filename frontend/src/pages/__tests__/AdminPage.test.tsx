import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import AdminPage from "@/pages/AdminPage"
import type { AdminUser } from "@/features/admin/api"
import type { Plan } from "@/types/membership"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ userId: 1 })
}))

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast })
}))

vi.mock("@/features/membership/hooks/useMembership", () => ({
  usePlans: vi.fn()
}))

vi.mock("@/features/admin/api", () => ({
  fetchAdminUsers: vi.fn(),
  grantMembership: vi.fn(),
  revokeMembership: vi.fn()
}))

vi.mock("@/features/admin/components/UserMembershipTable", () => ({
  default: ({
    onGrant,
    onRevoke
  }: {
    onGrant: (userId: number, planId: number) => void
    onRevoke: (userId: number) => void
  }) => (
    <div>
      <button type="button" onClick={() => onGrant(7, 4)}>
        grant
      </button>
      <button type="button" onClick={() => onRevoke(7)}>
        revoke
      </button>
    </div>
  )
}))

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

const mockShowToast = vi.fn()

import { usePlans } from "@/features/membership/hooks/useMembership"
import {
  fetchAdminUsers,
  grantMembership,
  revokeMembership
} from "@/features/admin/api"

const adminUsers: AdminUser[] = [
  {
    id: 7,
    name: "Bob Lee",
    email: "bob@example.com",
    membership: null
  }
]

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

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  const invalidateQueriesSpy = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue()

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  )

  return { invalidateQueriesSpy }
}

describe("AdminPage", () => {
  beforeEach(() => {
    mockShowToast.mockReset()
    vi.mocked(fetchAdminUsers).mockResolvedValue(adminUsers)
    vi.mocked(grantMembership).mockResolvedValue({
      membership: {
        id: 10,
        status: "active",
        expires_at: "2099-01-01T00:00:00+09:00",
        plan: {
          id: 4,
          name: "프리미엄 플러스"
        }
      }
    })
    vi.mocked(revokeMembership).mockResolvedValue({ revoked: true })
    vi.mocked(usePlans).mockReturnValue({
      data: plans,
      isLoading: false
    } as unknown as ReturnType<typeof usePlans>)
  })

  it('grantMutation 성공 시 ["adminUsers"] 캐시를 무효화해요', async () => {
    const { invalidateQueriesSpy } = renderAdminPage()

    await screen.findByRole("button", { name: "grant" })
    fireEvent.click(screen.getByRole("button", { name: "grant" }))

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["adminUsers"]
      })
    })
  })

  it('grantMutation 성공 시 ["membership", targetUserId] 캐시를 무효화해요', async () => {
    const { invalidateQueriesSpy } = renderAdminPage()

    await screen.findByRole("button", { name: "grant" })
    fireEvent.click(screen.getByRole("button", { name: "grant" }))

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["membership", 7]
      })
    })
  })

  it('revokeMutation 성공 시 ["adminUsers"] 캐시를 무효화해요', async () => {
    const { invalidateQueriesSpy } = renderAdminPage()

    await screen.findByRole("button", { name: "revoke" })
    fireEvent.click(screen.getByRole("button", { name: "revoke" }))

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["adminUsers"]
      })
    })
  })

  it('revokeMutation 성공 시 ["membership", targetUserId] 캐시를 무효화해요', async () => {
    const { invalidateQueriesSpy } = renderAdminPage()

    await screen.findByRole("button", { name: "revoke" })
    fireEvent.click(screen.getByRole("button", { name: "revoke" }))

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["membership", 7]
      })
    })
  })
})
