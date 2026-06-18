import { useQuery } from "@tanstack/react-query"
import { fetchCurrentUserProfile } from "@/api/users"

export function useCurrentUserProfile(userId: number | null) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: fetchCurrentUserProfile,
    enabled: userId !== null,
    staleTime: 5 * 60 * 1000
  })
}
