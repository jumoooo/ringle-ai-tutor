import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import UserDropdown from "@/components/UserDropdown"

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn()
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>()
  return {
    ...actual,
    useQuery: vi.fn()
  }
})

import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useQuery } from "@tanstack/react-query"

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("UserDropdown", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false
    } as unknown as ReturnType<typeof useQuery>)
  })

  it("userId가 null이면 초기화 버튼이 disabled다", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null,
      selectUser: vi.fn(),
      clearUser: vi.fn()
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(<UserDropdown />, { wrapper: makeWrapper() })

    const resetButton = screen.getByRole("button", { name: "초기화" }) as HTMLButtonElement

    expect(resetButton).toBeDisabled()
    expect(resetButton.style.backgroundColor).toBe("transparent")
  })

  it("userId가 있으면 초기화 버튼이 활성화된다", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: 1,
      selectUser: vi.fn(),
      clearUser: vi.fn()
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(<UserDropdown />, { wrapper: makeWrapper() })

    expect(screen.getByRole("button", { name: "초기화" })).toBeEnabled()
  })

  it("select의 minHeight이 40px예요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null,
      selectUser: vi.fn(),
      clearUser: vi.fn()
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(<UserDropdown />, { wrapper: makeWrapper() })

    const select = screen.getByRole("combobox")
    expect(select).toHaveStyle({ minHeight: "40px" })
  })

  it("초기화 버튼의 minHeight이 40px예요", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      userId: null,
      selectUser: vi.fn(),
      clearUser: vi.fn()
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(<UserDropdown />, { wrapper: makeWrapper() })

    const button = screen.getByRole("button", { name: "초기화" })
    expect(button).toHaveStyle({ minHeight: "40px" })
  })
})
