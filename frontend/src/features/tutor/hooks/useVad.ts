import { useCallback, useEffect, useRef, useState } from "react"
import type { MicVAD as MicVadInstance } from "@ricky0123/vad-web"
import { float32ToWavBlob } from "@/utils/audio"

const SAMPLE_RATE_HZ = 16000
const MAX_SPEECH_DURATION_SEC = 30

interface UseVadOptions {
  onSpeechDetected: (audioBlob: Blob) => Promise<void>
}

export function useVad({ onSpeechDetected }: UseVadOptions) {
  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingAudioRef = useRef<Float32Array | null>(null)
  const vadRef = useRef<MicVadInstance | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const preparedStreamRef = useRef<MediaStream | null>(null)
  const inactivityTimerRef = useRef<number | null>(null)
  const initializingRef = useRef(false)
  const initializationPromiseRef = useRef<Promise<MicVadInstance> | null>(null)

  const requestMicrophoneStream = useCallback(async () => {
    if (preparedStreamRef.current) {
      return preparedStreamRef.current
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    preparedStreamRef.current = stream
    return stream
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = window.setTimeout(() => {
      void vadRef.current?.pause()
      setIsActive(false)
    }, 3 * 60 * 1000)
  }, [])

  useEffect(() => {
    let shouldSkipStateUpdate = false

    const initializeVad = () => {
      if (vadRef.current) {
        return Promise.resolve(vadRef.current)
      }

      if (initializationPromiseRef.current) {
        return initializationPromiseRef.current
      }

      if (initializingRef.current) {
        return Promise.reject(new Error("VAD is already initializing"))
      }

      initializingRef.current = true
      setError(null)

      const initializationPromise = (async () => {
        const { MicVAD } = await import("@ricky0123/vad-web")
        return MicVAD.new({
          startOnLoad: false,
          model: "legacy",
          baseAssetPath: "/",
          onnxWASMBasePath: "/",
          positiveSpeechThreshold: 0.3,
          negativeSpeechThreshold: 0.25,
          minSpeechMs: 400,
          redemptionMs: 1400,
          preSpeechPadMs: 800,
          submitUserSpeechOnPause: false,
          getStream: async () => {
            const stream =
              preparedStreamRef.current ?? (await requestMicrophoneStream())
            preparedStreamRef.current = null
            streamRef.current = stream
            return stream
          },
          resumeStream: async () => {
            const stream = await requestMicrophoneStream()
            preparedStreamRef.current = null
            streamRef.current = stream
            return stream
          },
          pauseStream: async (stream) => {
            stream.getTracks().forEach((track) => {
              track.stop()
            })
            preparedStreamRef.current = null
            streamRef.current = null
          },
          onSpeechStart: () => {
            setError(null)
            resetInactivityTimer()
          },
          onSpeechEnd: (audio) => {
            const durationSec = audio.length / SAMPLE_RATE_HZ
            if (durationSec > MAX_SPEECH_DURATION_SEC) {
              pendingAudioRef.current = null
              setError(
                `발화가 너무 길어요. ${MAX_SPEECH_DURATION_SEC}초 이내로 말씀해주세요.`
              )
              resetInactivityTimer()
              return
            }
            pendingAudioRef.current = audio
            resetInactivityTimer()
          },
          onVADMisfire: () => {
            pendingAudioRef.current = null
          }
        })
      })()

      initializationPromiseRef.current = initializationPromise

      return initializationPromise.finally(() => {
        initializingRef.current = false
      })
    }

    void initializeVad()
      .then((vad) => {
        vadRef.current = vad

        if (!shouldSkipStateUpdate) {
          setIsReady(true)
        }
      })
      .catch((setupError: unknown) => {
        if (shouldSkipStateUpdate) {
          return
        }

        setError(
          setupError instanceof Error
            ? setupError.message
            : "마이크 초기화에 실패했어요."
        )
      })

    return () => {
      shouldSkipStateUpdate = true

      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current)
      }

      const currentVad = vadRef.current
      vadRef.current = null
      preparedStreamRef.current?.getTracks().forEach((track) => {
        track.stop()
      })
      preparedStreamRef.current = null
      streamRef.current = null

      if (currentVad) {
        initializationPromiseRef.current = null
        void currentVad.destroy()
      }
    }
  }, [requestMicrophoneStream, resetInactivityTimer])

  const start = useCallback(async () => {
    if (!vadRef.current) {
      setError("마이크가 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.")
      return
    }

    setError(null)
    await requestMicrophoneStream()
    await vadRef.current.start()
    setIsActive(true)
    resetInactivityTimer()
  }, [requestMicrophoneStream, resetInactivityTimer])

  const stop = useCallback(async () => {
    if (!vadRef.current) {
      return
    }

    await vadRef.current.pause()
    setIsActive(false)
    preparedStreamRef.current = null

    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current)
    }
  }, [])

  const submit = useCallback(async () => {
    const pendingAudio = pendingAudioRef.current

    if (!pendingAudio) {
      return false
    }

    pendingAudioRef.current = null
    const audioBlob = float32ToWavBlob(pendingAudio)
    await onSpeechDetected(audioBlob)
    return true
  }, [onSpeechDetected])

  return {
    isActive,
    isReady,
    error,
    start,
    stop,
    submit,
    getStream: () => streamRef.current
  }
}
