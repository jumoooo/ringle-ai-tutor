import { useCallback, useRef } from "react"
import { fetchTts } from "@/features/tutor/api"
import { playAudioBlob } from "@/utils/audio"

export function useTtsQueue(onError: (message: string) => void) {
  const queueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  // text → Blob 캐시: 이미 받아온 TTS blob을 보관해 재생 버튼 클릭 시 API 재호출 없이 즉시 재생
  const blobCacheRef = useRef(new Map<string, Blob>())
  const abortControllerRef = useRef<AbortController | null>(null)

  const flush = useCallback(() => {
    queueRef.current = []
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    isPlayingRef.current = false
  }, [])

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const nextSentence = queueRef.current.shift()

    if (!nextSentence) {
      isPlayingRef.current = false
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 캐시 hit: API 재호출 없이 저장된 Blob 직접 사용
      let audioBlob = blobCacheRef.current.get(nextSentence)

      if (!audioBlob) {
        audioBlob = await fetchTts(nextSentence, controller.signal)

        if (controller.signal.aborted) {
          isPlayingRef.current = false
          return
        }

        blobCacheRef.current.set(nextSentence, audioBlob)
      }

      await playAudioBlob(audioBlob, controller.signal)
    } catch {
      if (controller.signal.aborted) {
        isPlayingRef.current = false
        return
      }
      queueRef.current = []
      isPlayingRef.current = false
      onError("음성 재생에 실패했습니다.")
      return
    }

    if (controller.signal.aborted) {
      isPlayingRef.current = false
      return
    }

    abortControllerRef.current = null
    await playNext()
  }, [onError])

  const enqueue = useCallback(
    (text: string) => {
      queueRef.current.push(text)

      if (!isPlayingRef.current) {
        void playNext()
      }
    },
    [playNext]
  )

  // 재생 버튼용: 현재 재생을 중단하고 지정한 문장 목록을 처음부터 순차 재생.
  // 캐시에 있는 문장은 API 재호출 없이 즉시 재생.
  const replayAll = useCallback(
    (sentences: string[]) => {
      if (sentences.length === 0) return

      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      queueRef.current = [...sentences]
      isPlayingRef.current = false

      void playNext()
    },
    [playNext]
  )

  return {
    enqueue,
    flush,
    replayAll
  }
}
