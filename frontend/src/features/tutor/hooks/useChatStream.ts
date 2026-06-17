import { useCallback } from "react"
import { API_ENDPOINTS } from "@/config/api"

interface ChatStreamCallbacks {
  onDelta: (delta: string) => void
  onSentence: (sentence: string) => void
  onDone: (conversationId: number, turnCount: number) => void
  onError: (message: string) => void
}

interface StreamEventPayload {
  type: "delta" | "sentence" | "done" | "error"
  content?: string
  conversation_id?: number
  turn_count?: number
  message?: string
}

async function streamRequest(
  conversationId: number,
  message: string,
  callbacks: ChatStreamCallbacks
) {
  const userId = window.localStorage.getItem("selectedUserId")

  const response = await fetch(API_ENDPOINTS.chat, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {})
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message
    })
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    callbacks.onError(
      typeof payload.error === "string" ? payload.error : "Chat failed"
    )
    return
  }

  if (!response.body) {
    callbacks.onError("스트리밍 응답을 읽을 수 없어요.")
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue
      }

      const eventPayload = JSON.parse(line.slice(6)) as StreamEventPayload

      if (eventPayload.type === "delta" && eventPayload.content) {
        callbacks.onDelta(eventPayload.content)
      }

      if (eventPayload.type === "sentence" && eventPayload.content) {
        callbacks.onSentence(eventPayload.content)
      }

      if (
        eventPayload.type === "done" &&
        typeof eventPayload.conversation_id === "number" &&
        typeof eventPayload.turn_count === "number"
      ) {
        callbacks.onDone(
          eventPayload.conversation_id,
          eventPayload.turn_count
        )
      }

      if (eventPayload.type === "error") {
        callbacks.onError(eventPayload.message ?? "스트리밍 중 오류가 발생했어요.")
      }
    }
  }
}

export function useChatStream() {
  const stream = useCallback(
    async (
      conversationId: number,
      message: string,
      callbacks: ChatStreamCallbacks
    ) => {
      let lastError: unknown = null

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await streamRequest(conversationId, message, callbacks)
          return
        } catch (error) {
          lastError = error

          if (attempt === 2) {
            break
          }

          await new Promise((resolve) => {
            window.setTimeout(resolve, 1000)
          })
        }
      }

      callbacks.onError(
        lastError instanceof Error
          ? lastError.message
          : "스트리밍 연결을 복구하지 못했어요."
      )
    },
    []
  )

  return { stream }
}
