export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

export const API_ENDPOINTS = {
  health: `${BASE_URL}/api/v1/health`,
  users: `${BASE_URL}/api/v1/users`,
  usersMe: `${BASE_URL}/api/v1/users/me`,
  plans: `${BASE_URL}/api/v1/plans`,
  membershipCurrent: `${BASE_URL}/api/v1/memberships/current`,
  membershipPurchase: `${BASE_URL}/api/v1/memberships/purchase`,
  stt: `${BASE_URL}/api/v1/stt`,
  chat: `${BASE_URL}/api/v1/chat`,
  tts: `${BASE_URL}/api/v1/tts`,
  conversations: `${BASE_URL}/api/v1/conversations`,
  adminUsers: `${BASE_URL}/api/v1/admin/users`
} as const
