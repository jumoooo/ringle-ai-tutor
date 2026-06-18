import axios, { AxiosHeaders } from "axios"
import { BASE_URL } from "@/config/api"

export const apiClient = axios.create({
  baseURL: BASE_URL
})

// chat은 fetch 기반(useChatStream.ts)이므로 이 timeout 미적용
apiClient.defaults.timeout = 15_000

apiClient.interceptors.request.use((config) => {
  const userId = window.localStorage.getItem("selectedUserId")

  if (userId) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set("X-User-Id", userId)
    config.headers = headers
  }

  return config
})
