import axios, { AxiosHeaders } from "axios"
import { z } from "zod"
import { BASE_URL, API_ENDPOINTS } from "@/config/api"

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

export const adminClient = axios.create({
  baseURL: BASE_URL
})

adminClient.interceptors.request.use((config) => {
  const adminKey = window.sessionStorage.getItem("adminKey")

  if (adminKey) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set("X-Admin-Key", adminKey)
    config.headers = headers
  }

  return config
})

export async function fetchAdminUsers() {
  const response = await adminClient.get(API_ENDPOINTS.adminUsers)
  return AdminUserArraySchema.parse(response.data.data)
}

export async function grantMembership(
  userId: number,
  planId: number,
  durationDays: number
) {
  const response = await adminClient.post(
    `${API_ENDPOINTS.adminUsers}/${userId}/memberships`,
    {
      plan_id: planId,
      duration_days: durationDays
    }
  )

  return AdminGrantResponseSchema.parse(response.data.data)
}

export async function revokeMembership(userId: number) {
  const response = await adminClient.delete(
    `${API_ENDPOINTS.adminUsers}/${userId}/memberships/current`
  )

  return z.object({ revoked: z.boolean() }).parse(response.data.data)
}
