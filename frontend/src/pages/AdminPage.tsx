import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Layout from "@/components/Layout"
import { useToast } from "@/components/Toast"
import {
  fetchAdminUsers,
  grantMembership,
  revokeMembership
} from "@/features/admin/api"
import UserMembershipTable from "@/features/admin/components/UserMembershipTable"
import { usePlans } from "@/features/membership/hooks/useMembership"

export default function AdminPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [adminKeyInput, setAdminKeyInput] = useState("")
  const [adminKey, setAdminKey] = useState(
    () => window.sessionStorage.getItem("adminKey") ?? ""
  )

  const { data: plans = [] } = usePlans()
  const { data: users = [], isError, error } = useQuery({
    queryKey: ["adminUsers", adminKey],
    queryFn: fetchAdminUsers,
    enabled: adminKey.length > 0,
    retry: false
  })

  useEffect(() => {
    if (!isError) {
      return
    }

    window.sessionStorage.removeItem("adminKey")
    setAdminKey("")
    showToast("Admin Key가 올바르지 않거나 만료되었어요.", "error")
  }, [isError, showToast])

  const grantMutation = useMutation({
    mutationFn: ({ userId, planId }: { userId: number; planId: number }) =>
      grantMembership(userId, planId, 30),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers", adminKey] })
      showToast("멤버십을 부여했어요.", "success")
    },
    onError: () => {
      showToast("멤버십 부여에 실패했어요.", "error")
    }
  })

  const revokeMutation = useMutation({
    mutationFn: revokeMembership,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers", adminKey] })
      showToast("멤버십을 삭제했어요.", "success")
    },
    onError: () => {
      showToast("멤버십 삭제에 실패했어요.", "error")
    }
  })

  if (!adminKey) {
    return (
      <Layout
        title="멤버십 관리"
        description="어드민 키는 이 탭의 sessionStorage에만 보관돼요."
      >
        <section
          style={{
            maxWidth: "420px",
            margin: "0 auto",
            display: "grid",
            gap: "var(--space-16)",
            padding: "var(--space-24)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)"
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 var(--space-8)",
                fontSize: "var(--font-size-4xl)"
              }}
            >
              Admin Key 입력
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              유저별 멤버십 부여와 삭제는 관리 키가 있어야 진행할 수 있어요.
            </p>
          </div>

          <input
            type="password"
            value={adminKeyInput}
            onChange={(event) => setAdminKeyInput(event.target.value)}
            placeholder="Admin Key"
            style={{
              minHeight: "48px",
              padding: "0 var(--space-12)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--color-border)"
            }}
          />

          <button
            type="button"
            onClick={() => {
              if (!adminKeyInput.trim()) {
                showToast("Admin Key를 입력해주세요.", "info")
                return
              }

              window.sessionStorage.setItem("adminKey", adminKeyInput.trim())
              setAdminKey(adminKeyInput.trim())
            }}
            style={{
              minHeight: "48px",
              border: "none",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              cursor: "pointer"
            }}
          >
            관리 화면 열기
          </button>
        </section>
      </Layout>
    )
  }

  return (
    <Layout
      title="멤버십 관리"
      description="유저별 멤버십 상태를 확인하고 바로 부여하거나 삭제할 수 있어요."
      actions={
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem("adminKey")
            setAdminKey("")
            showToast("Admin Key를 이 탭에서 제거했어요.", "info")
          }}
          style={{
            minHeight: "40px",
            padding: "0 var(--space-16)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)"
          }}
        >
          키 초기화
        </button>
      }
    >
      {error ? (
        <section
          style={{
            padding: "var(--space-20)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-promo-red)"
          }}
        >
          어드민 데이터를 불러오지 못했어요.
        </section>
      ) : (
        <UserMembershipTable
          users={users}
          plans={plans}
          isSubmitting={grantMutation.isPending || revokeMutation.isPending}
          onGrant={(userId, planId) => {
            grantMutation.mutate({ userId, planId })
          }}
          onRevoke={(userId) => {
            revokeMutation.mutate(userId)
          }}
        />
      )}
    </Layout>
  )
}
