import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"

const UserProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().nullable()
})

export type UserProfile = z.infer<typeof UserProfileSchema>

export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  const response = await apiClient.get(API_ENDPOINTS.usersMe)
  return UserProfileSchema.parse(response.data.data)
}
