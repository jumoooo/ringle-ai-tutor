import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "@/components/ui/Button"
import Layout from "@/components/Layout"
import { useToast } from "@/components/Toast"
import MembershipCard from "@/features/membership/components/MembershipCard"
import UpgradePromptModal from "@/features/membership/components/UpgradePromptModal"
import { useMembership } from "@/features/membership/hooks/useMembership"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function HomePage() {
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const {
    data: membership,
    isLoading,
    refetch: refetchMembership
  } = useMembership(userId)
  const { showToast } = useToast()
  const [blockedFeature, setBlockedFeature] = useState<"talk" | "learn" | null>(null)

  useEffect(() => {
    if (!membership?.expires_at) return

    const remainingTime = new Date(membership.expires_at).getTime() - Date.now()

    if (remainingTime <= 0) {
      void refetchMembership()
      return
    }

    // setTimeout은 32비트 정수 한계(~24.8일)를 초과하면 즉시 실행됨
    // 그 이상 남은 멤버십은 페이지 재방문 시 처리되므로 타이머 불필요
    const MAX_TIMEOUT_MS = 2_147_483_647
    if (remainingTime > MAX_TIMEOUT_MS) return

    const timerId = window.setTimeout(() => {
      void refetchMembership()
      showToast("멤버십이 만료되었습니다. 플랜을 구매하세요.", "info")
    }, remainingTime)

    return () => window.clearTimeout(timerId)
  }, [membership?.expires_at, refetchMembership, showToast])

  const canTalk = membership?.status === "active" && membership.plan.can_talk
  const canLearn =
    (membership?.status === "active" || membership?.status === "trial") &&
    membership.plan.can_learn
  const isButtonsLoading = isLoading && userId !== null

  return (
    <Layout
      title="멤버십 홈"
      description="유저를 선택하고 현재 멤버십 상태를 확인해요. 대화와 학습 기능으로 이동하거나 플랜 구매 페이지로 이동할 수 있어요."
    >
      <div style={{ display: "grid", gap: "var(--space-24)" }}>
        {!userId ? (
          <section
            style={{
              padding: "var(--space-16)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-text-primary)"
            }}
          >
            유저를 선택해주세요.
          </section>
        ) : null}

        <MembershipCard membership={membership} isLoading={isLoading && userId !== null} />

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-12)",
            alignItems: "stretch"
          }}
        >
          <Button
            label="대화 시작"
            variant="primary"
            disabled={isButtonsLoading}
            disabledReason={isButtonsLoading ? "unavailable" : null}
            onClick={() => {
              if (!canTalk) {
                setBlockedFeature("talk")
                return
              }
              void navigate("/chat")
            }}
            minHeight="48px"
          />

          <Button
            label="학습 시작"
            variant="secondary"
            disabled={isButtonsLoading}
            disabledReason={isButtonsLoading ? "unavailable" : null}
            onClick={() => {
              if (!canLearn) {
                setBlockedFeature("learn")
                return
              }
              void navigate("/learn")
            }}
            minHeight="48px"
          />

        </section>

        <UpgradePromptModal
          open={blockedFeature !== null}
          featureName={blockedFeature === "talk" ? "대화" : "학습"}
          requiredPlanName={blockedFeature === "talk" ? "프리미엄 플러스" : "베이직"}
          onClose={() => setBlockedFeature(null)}
          onGoPlans={() => {
            setBlockedFeature(null)
            void navigate("/plans")
          }}
        />
      </div>
    </Layout>
  )
}
