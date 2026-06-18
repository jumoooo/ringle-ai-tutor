import { render, screen } from "@testing-library/react"
import AdminGuard from "@/components/AdminGuard"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn()
}))

vi.mock("@/hooks/useCurrentUserProfile", () => ({
  useCurrentUserProfile: vi.fn()
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div>
  }
})

import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile"

describe("AdminGuard", () => {
  beforeEach(() => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1
    } as unknown as ReturnType<typeof useCurrentUser>)
  })

  it("admin role이면 children을 렌더해요", () => {
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: { role: "admin" },
      isLoading: false
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(
      <AdminGuard>
        <div>admin page</div>
      </AdminGuard>
    )

    expect(screen.getByText("admin page")).toBeInTheDocument()
  })

  it("non-admin이면 홈으로 리다이렉트해요", () => {
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: { role: null },
      isLoading: false
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    render(
      <AdminGuard>
        <div>admin page</div>
      </AdminGuard>
    )

    expect(screen.getByText("redirect:/")).toBeInTheDocument()
  })

  it("로딩 중이면 아무것도 렌더하지 않아요", () => {
    vi.mocked(useCurrentUserProfile).mockReturnValue({
      data: undefined,
      isLoading: true
    } as unknown as ReturnType<typeof useCurrentUserProfile>)

    const { container } = render(
      <AdminGuard>
        <div>admin page</div>
      </AdminGuard>
    )

    expect(container).toBeEmptyDOMElement()
  })
})
