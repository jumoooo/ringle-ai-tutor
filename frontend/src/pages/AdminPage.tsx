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

  const { data: plans = [] } = usePlans()
  const { data: users = [], isError, isLoading: isAdminLoading, error } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
    retry: false
  })

  const grantMutation = useMutation({
    mutationFn: ({ userId, planId }: { userId: number; planId: number }) =>
      grantMembership(userId, planId, 30),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] })
      void queryClient.invalidateQueries({
        queryKey: ["membership", variables.userId]
      })
      showToast("멤버십을 부여했어요.", "success")
    },
    onError: () => {
      showToast("멤버십 부여에 실패했어요.", "error")
    }
  })

  const revokeMutation = useMutation({
    mutationFn: revokeMembership,
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] })
      void queryClient.invalidateQueries({ queryKey: ["membership", userId] })
      showToast("멤버십을 삭제했어요.", "success")
    },
    onError: () => {
      showToast("멤버십 삭제에 실패했어요.", "error")
    }
  })

  if (isAdminLoading) {
    return (
      <Layout
        title="멤버십 관리"
        description="유저별 멤버십 상태를 확인하는 중이에요."
      >
        <section>로딩 중...</section>
      </Layout>
    )
  }

  return (
    <Layout
      title="멤버십 관리"
      description="유저별 멤버십 상태를 확인하고 바로 부여하거나 삭제할 수 있어요."
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
      ) : isError ? (
        <section
          style={{
            padding: "var(--space-20)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-promo-red)"
          }}
        >
          관리자 권한을 확인할 수 없어요.
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
