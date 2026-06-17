import { z } from "zod"
import { apiClient } from "@/api/client"
import { API_ENDPOINTS } from "@/config/api"
import {
  ConversationCreateSchema,
  ConversationSchema
} from "@/types/message"

const SttResponseSchema = z.object({
  transcript: z.string(),
  duration_ms: z.number()
})

export async function uploadStt(audioBlob: Blob) {
  const formData = new FormData()
  formData.append("audio", audioBlob, "speech.wav")

  const response = await apiClient.post(API_ENDPOINTS.stt, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  return SttResponseSchema.parse(response.data.data)
}

export async function fetchTts(text: string, signal?: AbortSignal) {
  const response = await apiClient.post(
    API_ENDPOINTS.tts,
    { text },
    {
      responseType: "blob",
      signal
    }
  )

  return response.data as Blob
}

export async function createConversation() {
  const response = await apiClient.post(API_ENDPOINTS.conversations)
  return ConversationCreateSchema.parse(response.data.data)
}

export async function fetchConversation(conversationId: number) {
  const response = await apiClient.get(
    `${API_ENDPOINTS.conversations}/${conversationId}`
  )
  return ConversationSchema.parse(response.data.data)
}
