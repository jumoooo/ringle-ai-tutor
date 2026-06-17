import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { useToast } from "@/components/Toast"
import { useMembership } from "@/features/membership/hooks/useMembership"
import {
  createConversation,
  fetchConversation,
  uploadStt
} from "@/features/tutor/api"
import ChatBubble from "@/features/tutor/components/ChatBubble"
import TurnLimitBanner from "@/features/tutor/components/TurnLimitBanner"
import VoiceInput from "@/features/tutor/components/VoiceInput"
import Waveform from "@/features/tutor/components/Waveform"
import { useChatStream } from "@/features/tutor/hooks/useChatStream"
import { useTtsQueue } from "@/features/tutor/hooks/useTtsQueue"
import { useVad } from "@/features/tutor/hooks/useVad"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { Message } from "@/types/message"

type ChatState = "idle" | "recording" | "processing" | "streaming" | "speaking"
type ChatMessage = Message & {
  audioBlobUrl?: string
  sentences?: string[]
}

export default function ChatPage() {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const { userId } = useCurrentUser()
  const { data: membership } = useMembership(userId)
  const { stream: startChatStream } = useChatStream()
  const [chatState, setChatState] = useState<ChatState>("idle")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingContent, setStreamingContent] = useState("")
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [turnCount, setTurnCount] = useState(0)
  const [isInputDisabled, setIsInputDisabled] = useState(false)
  const isInitializingRef = useRef(false)

  const handleTtsError = useCallback(
    (message: string) => {
      setChatState("idle")
      showToast(message, "error")
    },
    [showToast]
  )

  const { enqueue: enqueueTts, flush: flushTts, replayAll } = useTtsQueue(handleTtsError)

  const initializeConversation = useCallback(async () => {
    if (isInitializingRef.current) return
    isInitializingRef.current = true

    try {
      const conversation = await createConversation()
      setConversationId(conversation.id)
      window.localStorage.setItem(
        "lastConversationId",
        String(conversation.id)
      )

      const firstContent = conversation.first_message.content
      const firstMessage: ChatMessage = {
        id: Date.now(),
        role: "assistant",
        content: firstContent,
        created_at: new Date().toISOString(),
        sentences: [firstContent]
      }

      setMessages([firstMessage])
      setTurnCount(0)
      setStreamingContent("")
      setIsInputDisabled(false)
      enqueueTts(firstContent)
    } catch {
      showToast("대화를 시작하지 못했어요.", "error")
    } finally {
      isInitializingRef.current = false
    }
  }, [enqueueTts, showToast])

  const handleSpeechDetected = useCallback(
    async (audioBlob: Blob) => {
      if (!conversationId || isInputDisabled) {
        return
      }

      flushTts()
      setChatState("processing")

      const audioBlobUrl = URL.createObjectURL(audioBlob)
      const sentencesBuffer: string[] = []

      try {
        const sttResult = await uploadStt(audioBlob)

        if (!sttResult.transcript.trim()) {
          showToast("음성이 인식되지 않았어요. 다시 말해주세요.", "info")
          setChatState("idle")
          return
        }

        const userMessage: ChatMessage = {
          id: Date.now(),
          role: "user",
          content: sttResult.transcript,
          created_at: new Date().toISOString(),
          audioBlobUrl
        }

        setMessages((currentMessages) => [...currentMessages, userMessage])
        setStreamingContent("")
        setChatState("streaming")

        let assistantContent = ""

        await startChatStream(conversationId, sttResult.transcript, {
          onDelta: (delta) => {
            assistantContent += delta
            setStreamingContent(assistantContent)
          },
          onSentence: (sentence) => {
            sentencesBuffer.push(sentence)
            setChatState("speaking")
            enqueueTts(sentence)
          },
          onDone: (_nextConversationId, nextTurnCount) => {
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: Date.now(),
                role: "assistant",
                content: assistantContent,
                created_at: new Date().toISOString(),
                sentences: [...sentencesBuffer]
              }
            ])
            setStreamingContent("")
            setTurnCount(nextTurnCount)
            setIsInputDisabled(nextTurnCount >= 20)
            setChatState("idle")
          },
          onError: (message) => {
            showToast(message, "error")
            setStreamingContent("")
            setChatState("idle")
          }
        })
      } catch {
        showToast("음성 처리 중 오류가 발생했어요.", "error")
        setChatState("idle")
      }
    },
    [
      conversationId,
      enqueueTts,
      flushTts,
      isInputDisabled,
      showToast,
      startChatStream
    ]
  )

  const vad = useVad({
    onSpeechDetected: handleSpeechDetected
  })

  useEffect(() => {
    if (vad.error) {
      showToast(vad.error, "error")
    }
  }, [showToast, vad.error])

  useEffect(() => {
    if (userId === null) {
      showToast("먼저 유저를 선택해주세요.", "info")
      void navigate("/")
    }
  }, [navigate, showToast, userId])

  useEffect(() => {
    if (!membership) {
      return
    }

    if (membership.status !== "active" || !membership.plan.can_talk) {
      showToast(
        "대화 기능을 이용하려면 Standard 이상 멤버십이 필요합니다.",
        "error"
      )
      void navigate("/")
    }
  }, [membership, navigate, showToast])

  useEffect(() => {
    if (!membership?.expires_at) {
      return
    }

    const remainingTime = new Date(membership.expires_at).getTime() - Date.now()

    if (remainingTime <= 0) {
      setIsInputDisabled(true)
      return
    }

    const timerId = window.setTimeout(() => {
      setIsInputDisabled(true)
      showToast("멤버십이 만료되었습니다. 홈에서 플랜을 구매하세요.", "info")
    }, remainingTime)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [membership?.expires_at, showToast])

  useEffect(() => {
    if (!userId || !membership?.plan.can_talk) {
      return
    }

    let cancelled = false

    const storedConversationId = window.localStorage.getItem("lastConversationId")

    if (!storedConversationId) {
      void initializeConversation()
      return () => {
        cancelled = true
      }
    }

    void fetchConversation(Number(storedConversationId))
      .then((conversation) => {
        if (cancelled) return
        setConversationId(conversation.id)
        const restoredMessages = conversation.messages ?? []
        setMessages(restoredMessages)
        setTurnCount(Math.floor(restoredMessages.length / 2))
      })
      .catch(() => {
        if (cancelled) return
        void initializeConversation()
      })

    return () => {
      cancelled = true
    }
  }, [initializeConversation, membership?.plan.can_talk, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }, [messages, streamingContent])

  const handleNewConversation = useCallback(() => {
    window.localStorage.removeItem("lastConversationId")
    setConversationId(null)
    setMessages([])
    setStreamingContent("")
    setTurnCount(0)
    setIsInputDisabled(false)
    void initializeConversation()
  }, [initializeConversation])

  return (
    <Layout
      title="AI 튜터 대화"
      description="말한 내용을 영어 대화로 이어받고, 문장 단위 음성 응답을 차례대로 재생해요."
      actions={
        <button
          type="button"
          onClick={handleNewConversation}
          style={{
            minHeight: "40px",
            padding: "0 var(--space-16)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)"
          }}
        >
          새 대화
        </button>
      }
    >
      <div style={{ display: "grid", gap: "var(--space-16)" }}>
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-12)",
            padding: "var(--space-16)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)"
          }}
        >
          <strong>턴: {turnCount}/20</strong>
          <span style={{ color: "var(--color-text-secondary)" }}>
            {vad.isReady ? "마이크 준비 완료" : "마이크 준비 중"}
          </span>
        </section>

        {turnCount >= 20 ? <TurnLimitBanner onNew={handleNewConversation} /> : null}

        <section
          style={{
            display: "grid",
            gap: "var(--space-16)",
            minHeight: "420px",
            maxHeight: "56vh",
            overflowY: "auto",
            padding: "var(--space-20)",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)"
          }}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              createdAt={message.created_at}
              audioBlobUrl={
                message.role === "user" ? message.audioBlobUrl : undefined
              }
              onReplay={
                message.role === "assistant"
                  ? () => {
                      replayAll(message.sentences ?? [message.content])
                    }
                  : undefined
              }
            />
          ))}

          {streamingContent ? (
            <ChatBubble
              role="assistant"
              content={streamingContent}
              createdAt={new Date().toISOString()}
            />
          ) : null}

          <div ref={bottomRef} />
        </section>

        <Waveform stream={vad.getStream()} isActive={vad.isActive} />

        <VoiceInput
          isActive={vad.isActive}
          isDisabled={isInputDisabled}
          chatState={chatState}
          onToggleMic={() => {
            if (vad.isActive) {
              void vad.stop()
              setChatState("idle")
              return
            }

            void vad.start()
            setChatState("recording")
          }}
          onSubmit={() => {
            void vad.submit().then((submitted) => {
              if (!submitted) {
                showToast("먼저 한 문장 이상 말해주세요.", "info")
                return
              }
              void vad.stop()
              setChatState("processing")
            })
          }}
        />
      </div>
    </Layout>
  )
}
