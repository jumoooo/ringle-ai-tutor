import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"

const AdminMembershipSchema = z.object({
  status: z.string(),
  plan_name: z.string(),
  expires_at: z.string()
})

const AdminUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  membership: AdminMembershipSchema.nullable()
})

const AdminUserArraySchema = z.array(AdminUserSchema)

const AdminGrantResponseSchema = z.object({
  membership: z.object({
    id: z.number(),
    status: z.string(),
    expires_at: z.string(),
    plan: z.object({
      id: z.number(),
      name: z.string()
    })
  })
})

export type AdminUser = z.infer<typeof AdminUserSchema>

export async function fetchAdminUsers() {
  const response = await apiClient.get(API_ENDPOINTS.adminUsers)
  return AdminUserArraySchema.parse(response.data.data)
}

export async function grantMembership(
  userId: number,
  planId: number,
  durationDays: number
) {
  const response = await apiClient.post(
    `${API_ENDPOINTS.adminUsers}/${userId}/memberships`,
    {
      plan_id: planId,
      duration_days: durationDays
    }
  )

  return AdminGrantResponseSchema.parse(response.data.data)
}

export async function revokeMembership(userId: number) {
  const response = await apiClient.delete(
    `${API_ENDPOINTS.adminUsers}/${userId}/memberships/current`
  )

  return z.object({ revoked: z.boolean() }).parse(response.data.data)
}
