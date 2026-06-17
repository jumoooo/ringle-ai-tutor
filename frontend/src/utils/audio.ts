function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

export function float32ToWavBlob(
  samples: Float32Array,
  sampleRate = 16_000
) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, samples.length * 2, true)

  let offset = 44

  for (let index = 0; index < samples.length; index += 1) {
    const normalizedValue = Math.max(-1, Math.min(1, samples[index]))
    const pcmValue =
      normalizedValue < 0
        ? normalizedValue * 0x8000
        : normalizedValue * 0x7fff

    view.setInt16(offset, pcmValue, true)
    offset += 2
  }

  return new Blob([buffer], { type: "audio/wav" })
}

// Singleton AudioContext — 한 번 resume되면 gesture 만료 없이 계속 재생 가능.
// new Audio().play()는 COOP/COEP 환경에서 gesture activation 만료 시 NotAllowedError를 throw함.
let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContext()
  }
  return sharedAudioContext
}

export async function playAudioBlob(
  blob: Blob,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) return

  const ctx = getAudioContext()

  if (ctx.state === "suspended") {
    await ctx.resume()
  }

  const arrayBuffer = await blob.arrayBuffer()

  if (signal?.aborted) return

  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

  if (signal?.aborted) return

  await new Promise<void>((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => resolve()

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          try {
            source.stop()
          } catch {
            // 이미 중단된 경우 무시
          }
          resolve()
        },
        { once: true }
      )
    }

    source.start()
  })
}
