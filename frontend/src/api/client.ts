import axios, { AxiosHeaders } from "axios"
import { BASE_URL } from "@/config/api"

export const apiClient = axios.create({
  baseURL: BASE_URL
})

apiClient.interceptors.request.use((config) => {
  const userId = window.localStorage.getItem("selectedUserId")

  if (userId) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set("X-User-Id", userId)
    config.headers = headers
  }

  return config
})
