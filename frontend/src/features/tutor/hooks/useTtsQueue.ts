import { useCallback, useRef } from "react"
import { fetchTts } from "@/features/tutor/api"
import { playAudioBlob } from "@/utils/audio"

export function useTtsQueue(onError: (message: string) => void) {
  const queueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const blobUrlMapRef = useRef(new Map<string, string>())

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

    let attempts = 0

    while (attempts < 3) {
      try {
        const audioBlob = await fetchTts(nextSentence)
        const audioUrl = URL.createObjectURL(audioBlob)
        blobUrlMapRef.current.set(nextSentence, audioUrl)
        await playAudioBlob(audioBlob)
        break
      } catch {
        attempts += 1

        if (attempts === 3) {
          onError("음성 재생에 실패했습니다.")
        }
      }
    }

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

  const getBlobUrl = useCallback((text: string) => {
    return blobUrlMapRef.current.get(text)
  }, [])

  return {
    enqueue,
    getBlobUrl
  }
}
