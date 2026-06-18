import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { useToast } from "@/components/Toast"
import PaymentModal from "@/features/membership/components/PaymentModal"
import PlanSelector from "@/features/membership/components/PlanSelector"
import {
  useMembership,
  usePlans,
  usePurchase
} from "@/features/membership/hooks/useMembership"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { Plan } from "@/types/membership"

export default function PlansPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userId } = useCurrentUser()
  const { data: membership } = useMembership(userId)
  const { data: plans = [], isLoading: isPlansLoading } = usePlans()
  const purchase = usePurchase(userId)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  return (
    <Layout
      title="플랜 구매"
      description="원하는 플랜을 선택하고 구매하세요."
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
        ) : isPlansLoading ? (
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
            onSelectPlan={setSelectedPlan}
            isPending={purchase.isPending}
          />
        )}
      </div>

      <PaymentModal
        open={selectedPlan !== null && userId !== null}
        planName={selectedPlan?.name ?? ""}
        onConfirm={(cardData) => {
          if (selectedPlan === null) return

          purchase.mutate(
            { planId: selectedPlan.id, cardData },
            {
              onSuccess: () => {
                setSelectedPlan(null)
                showToast("멤버십이 활성화되었어요.", "success")
                void navigate("/")
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
