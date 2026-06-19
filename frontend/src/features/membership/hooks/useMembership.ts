import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import {
  fetchCurrentMembership,
  fetchPlans,
  purchasePlan
} from "@/features/membership/api"

export function useMembership(userId: number | null) {
  return useQuery({
    queryKey: ["membership", userId],
    queryFn: fetchCurrentMembership,
    enabled: userId !== null
  })
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans
  })
}

export function usePurchase(userId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: purchasePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["membership", userId] })
      void queryClient.invalidateQueries({ queryKey: ["plans"] })
    }
  })
}
