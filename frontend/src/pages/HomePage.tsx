import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { useToast } from "@/components/Toast"
import MembershipCard from "@/features/membership/components/MembershipCard"
import PaymentModal from "@/features/membership/components/PaymentModal"
import PlanSelector from "@/features/membership/components/PlanSelector"
import UpgradePromptModal from "@/features/membership/components/UpgradePromptModal"
import {
  useMembership,
  usePlans,
  usePurchase
} from "@/features/membership/hooks/useMembership"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { Plan } from "@/types/membership"

function ActionButton({
  label,
  disabled,
  onClick,
  tone
}: {
  label: string
  disabled: boolean
  onClick: () => void
  tone: "primary" | "secondary"
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: "48px",
        padding: "0 var(--space-16)",
        borderRadius: "var(--radius-card)",
        border:
          tone === "primary"
            ? "none"
            : "1px solid var(--color-border)",
        backgroundColor:
          tone === "primary"
            ? "var(--color-primary)"
            : "var(--color-surface)",
        color:
          tone === "primary"
            ? "var(--color-text-on-primary)"
            : "var(--color-text-primary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1
      }}
    >
      {label}
    </button>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userId } = useCurrentUser()
  const {
    data: membership,
    isLoading,
    refetch: refetchMembership
  } = useMembership(userId)
  const { data: plans = [], isLoading: isPlansLoading } = usePlans()
  const purchase = usePurchase(userId)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  useEffect(() => {
    if (!membership?.expires_at) {
      return
    }

    const remainingTime = new Date(membership.expires_at).getTime() - Date.now()

    if (remainingTime <= 0) {
      void refetchMembership()
      return
    }

    const timerId = window.setTimeout(() => {
      void refetchMembership()
      showToast("멤버십이 만료되었습니다. 플랜을 구매하세요.", "info")
    }, remainingTime)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [membership?.expires_at, refetchMembership, showToast])

  const canTalk = membership?.status === "active" && membership.plan.can_talk
  const canLearn =
    (membership?.status === "active" || membership?.status === "trial") &&
    membership.plan.can_learn

  return (
    <Layout
      title="멤버십 홈"
      description="유저를 선택하고 현재 멤버십 상태를 확인해요. 필요한 플랜을 구매하면 바로 대화와 학습 기능을 열 수 있어요."
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
            gap: "var(--space-12)"
          }}
        >
          <ActionButton
            label="대화 시작"
            disabled={false}
            onClick={() => {
              if (!canTalk) {
                setShowUpgradeModal(true)
                return
              }
              void navigate("/chat")
            }}
            tone="primary"
          />

          <ActionButton
            label="학습 시작"
            disabled={!canLearn}
            onClick={() => {
              if (!canLearn) {
                showToast("학습 기능은 베이직 이상 멤버십이 필요해요.", "info")
                return
              }
              void navigate("/learn")
            }}
            tone="secondary"
          />
        </section>

        <UpgradePromptModal
          open={showUpgradeModal}
          requiredPlanName="프리미엄 플러스"
          onClose={() => setShowUpgradeModal(false)}
        />

        <section style={{ display: "grid", gap: "var(--space-16)" }}>
          <div>
            <h2
              style={{
                margin: "0 0 var(--space-8)",
                fontSize: "var(--font-size-4xl)"
              }}
            >
              플랜 구매
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              원하는 플랜을 선택하고 구매하세요.
            </p>
          </div>

          {isPlansLoading ? (
            <section
              style={{
                padding: "var(--space-20)",
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)"
              }}
            >
              플랜 목록을 불러오는 중이에요.
            </section>
          ) : (
            <PlanSelector
              plans={plans}
              currentMembership={membership}
              onSelectPlan={(plan) => setSelectedPlan(plan)}
              isPending={purchase.isPending}
            />
          )}
        </section>
      </div>

      <PaymentModal
        open={selectedPlan !== null}
        planName={selectedPlan?.name ?? ""}
        onConfirm={(cardData) => {
          if (selectedPlan === null) return
          purchase.mutate(
            { planId: selectedPlan.id, cardData },
            {
              onSuccess: () => {
                setSelectedPlan(null)
                showToast("멤버십이 활성화되었어요.", "success")
              },
              onError: () => {
                showToast("구매에 실패했어요. 다시 시도해주세요.", "error")
              }
            }
          )
        }}
        onClose={() => setSelectedPlan(null)}
        isPending={purchase.isPending}
      />
    </Layout>
  )
}
