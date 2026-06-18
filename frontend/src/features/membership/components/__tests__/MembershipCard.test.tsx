import { render, screen } from "@testing-library/react"
import MembershipCard from "@/features/membership/components/MembershipCard"

const activeMembership = {
  id: 1,
  status: "active" as const,
  expires_at: "2026-07-17T12:00:00+09:00",
  plan: {
    id: 3,
    name: "프리미엄 플러스",
    monthly_price: 39900,
    can_learn: true,
    can_talk: true,
    can_analyze: true,
    duration_days: 60
  }
}

describe("MembershipCard", () => {
  it("활성 멤버십 정보를 렌더링해요", () => {
    render(<MembershipCard membership={activeMembership} isLoading={false} />)

    expect(screen.getByText("프리미엄 플러스")).toBeInTheDocument()
    expect(screen.getByText("활성")).toBeInTheDocument()
    expect(screen.getByText("학습")).toBeInTheDocument()
  })

  it("멤버십이 없으면 안내 문구를 보여줘요", () => {
    render(<MembershipCard membership={null} isLoading={false} />)

    expect(screen.getByText(/활성 멤버십이 없습니다/)).toBeInTheDocument()
  })

  it("로딩 상태를 표시해요", () => {
    render(<MembershipCard membership={undefined} isLoading />)

    expect(screen.getByText(/로딩 중/)).toBeInTheDocument()
  })
})
