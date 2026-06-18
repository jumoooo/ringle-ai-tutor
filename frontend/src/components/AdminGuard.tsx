import type { PropsWithChildren } from "react"
import { Navigate } from "react-router-dom"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile"

export default function AdminGuard({ children }: PropsWithChildren) {
  const { userId } = useCurrentUser()
  const { data: profile, isLoading } = useCurrentUserProfile(userId)

  if (isLoading) {
    return null
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
