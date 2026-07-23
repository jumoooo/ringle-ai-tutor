import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"
import { DEMO_MODE, getDemoUserById, getSelectedDemoUserId } from "@/demo/store"

const UserProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().nullable()
})

export type UserProfile = z.infer<typeof UserProfileSchema>

export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  if (DEMO_MODE) {
    const userId = getSelectedDemoUserId()
    const user = userId !== null ? getDemoUserById(userId) : null

    if (!user) {
      throw new Error("No demo user selected")
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role }
  }

  const response = await apiClient.get(API_ENDPOINTS.usersMe)
  return UserProfileSchema.parse(response.data.data)
}
