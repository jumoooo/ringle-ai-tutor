export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

export const API_ENDPOINTS = {
  health: `${BASE_URL}/api/v1/health`
} as const
