import { useEffect, useRef } from "react"

interface WaveformProps {
  stream: MediaStream | null
  isActive: boolean
}

export default function Waveform({ stream, isActive }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (!stream || !isActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = "var(--color-border)"
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
      return
    }

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    const waveformData = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      animationFrameRef.current = window.requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(waveformData)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = "var(--color-primary)"

      const sliceWidth = canvas.width / waveformData.length
      let currentX = 0

      for (let index = 0; index < waveformData.length; index += 1) {
        const sample = waveformData[index] / 128
        const currentY = (sample * canvas.height) / 2

        if (index === 0) {
          ctx.moveTo(currentX, currentY)
        } else {
          ctx.lineTo(currentX, currentY)
        }

        currentX += sliceWidth
      }

      ctx.stroke()
    }

    draw()

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }

      source.disconnect()
      void audioContext.close()
    }
  }, [isActive, stream])

  return (
    <section
      style={{
        padding: "var(--space-16)",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={120}
        style={{
          width: "100%",
          height: "120px",
          display: "block"
        }}
      />
    </section>
  )
}
